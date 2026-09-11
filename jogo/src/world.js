/* Última Fronteira — mundo: terreno, grade de ocupação, jazidas e visibilidade. */
(function (global) {
  'use strict';
  var UF = global.UF || (global.UF = {});
  var T = UF.DATA.TERRENO;
  var rng = UF.util.rng;

  function World(cfg) {
    this.cfg = cfg;
    this.w = cfg.tam;
    this.h = cfg.tam;
    this.n = this.w * this.h;
    this.terreno = new Uint8Array(this.n);
    this.occ = new Int32Array(this.n);        /* id da estrutura que ocupa a célula */
    this.recurso = new Int32Array(this.n);    /* id da jazida que ocupa a célula */
    this.explorado = new Uint8Array(this.n);
    this.visivel = new Uint8Array(this.n);
    this.jazidas = [];
    this.entradas = [];
    this.versaoRota = 1;                      /* muda quando o terreno navegável muda */
    this.gerar(cfg.semente);
  }

  World.prototype.idx = function (x, y) { return y * this.w + x; };
  World.prototype.dentro = function (x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; };

  /* Terreno que nenhuma unidade terrestre atravessa e onde nada se constrói. */
  World.prototype.solido = function (x, y) {
    if (!this.dentro(x, y)) return true;
    var t = this.terreno[this.idx(x, y)];
    return t === T.ROCHA || t === T.AGUA || t === T.RUINA;
  };

  World.prototype.construivel = function (x, y) {
    if (!this.dentro(x, y)) return false;
    var i = this.idx(x, y);
    var t = this.terreno[i];
    return (t === T.ASFALTO) && this.occ[i] === 0 && this.recurso[i] === 0;
  };

  /* Célula livre para caminhar: terreno passável e sem estrutura nem jazida. */
  World.prototype.livre = function (x, y) {
    if (!this.dentro(x, y)) return false;
    var i = this.idx(x, y);
    return !this.solido(x, y) && this.occ[i] === 0 && this.recurso[i] === 0;
  };

  /* ------------------------------------------------------------- geração */
  World.prototype.gerar = function (semente) {
    var rand = rng(semente);
    var w = this.w, h = this.h, n = this.n;
    var campo = new Float32Array(n), i, x, y;
    for (i = 0; i < n; i++) campo[i] = rand();

    /* Ruído suavizado em duas escalas: manchas grandes de rocha com bordas irregulares. */
    campo = suavizar(campo, w, h, 2, 2);
    var fino = new Float32Array(n);
    for (i = 0; i < n; i++) fino[i] = rand();
    fino = suavizar(fino, w, h, 1, 1);
    for (i = 0; i < n; i++) campo[i] = campo[i] * 0.72 + fino[i] * 0.28;

    /* Limiares por percentil: a fração de rocha e água não depende da semente. */
    var fracRocha = Math.min(0.34, 0.11 * this.cfg.rochas);
    var fracCratera = 0.07;
    var fracAgua = Math.min(0.14, 0.05 * this.cfg.agua);
    var ordenado = Float32Array.from(campo).sort();
    var limiteRocha = ordenado[Math.floor((1 - fracRocha) * (n - 1))];
    var limiteCratera = ordenado[Math.floor((1 - fracRocha - fracCratera) * (n - 1))];
    var limiteAgua = ordenado[Math.floor(fracAgua * (n - 1))];

    for (i = 0; i < n; i++) {
      var v = campo[i];
      this.terreno[i] = v > limiteRocha ? T.ROCHA
        : v > limiteCratera ? T.CRATERA
          : v < limiteAgua ? T.AGUA : T.PLANICIE;
    }

    /* O centro do mapa fica limpo: é onde a Central costuma nascer. */
    var cx = w / 2, cy = h / 2, raioLimpo = w * 0.13;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < raioLimpo) this.terreno[y * w + x] = T.PLANICIE;
      }
    }

    if (this.cfg.ilha) this.recortarIlha(rand);
    if (this.cfg.cratera) this.esculpirCratera(rand);
    if (this.cfg.rios) this.correrRios(rand, this.cfg.rios);

    if (this.cfg.urbano) this.erguerCidade(rand);

    /* Depois dos rios e da cratera, o miolo do mapa volta a ser terra firme:
       é onde a Central pode nascer em qualquer setor. */
    var raioPouso = w * 0.075;
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < raioPouso) this.terreno[y * w + x] = T.PLANICIE;
      }
    }

    /* Via perimetral: garante rota de contorno e local de entrada dos invasores.
       Em setores insulares não existe: a água chega até a borda do mapa. */
    if (!this.cfg.ilha) {
      for (x = 0; x < w; x++) { this.terreno[this.idx(x, 0)] = T.ASFALTO; this.terreno[this.idx(x, h - 1)] = T.ASFALTO; }
      for (y = 0; y < h; y++) { this.terreno[this.idx(0, y)] = T.ASFALTO; this.terreno[this.idx(w - 1, y)] = T.ASFALTO; }
    } else {
      for (x = 0; x < w; x++) {
        if (this.terreno[this.idx(x, 1)] !== T.AGUA) this.terreno[this.idx(x, 0)] = T.ASFALTO;
        if (this.terreno[this.idx(x, h - 2)] !== T.AGUA) this.terreno[this.idx(x, h - 1)] = T.ASFALTO;
      }
    }

    this.removerIlhas();
    this.plantarJazidas(rand);
    this.definirEntradas(rand);
  };

  /* Média em janela quadrada, repetida algumas vezes. */
  function suavizar(campo, w, h, raio, passos) {
    var n = w * h, saida = new Float32Array(n), entrada = Float32Array.from(campo);
    for (var p = 0; p < passos; p++) {
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var soma = 0, cont = 0;
          for (var dy = -raio; dy <= raio; dy++) {
            var ny = y + dy; if (ny < 0 || ny >= h) continue;
            for (var dx = -raio; dx <= raio; dx++) {
              var nx = x + dx; if (nx < 0 || nx >= w) continue;
              soma += entrada[ny * w + nx]; cont++;
            }
          }
          saida[y * w + x] = soma / cont;
        }
      }
      entrada.set(saida);
    }
    return entrada;
  }

  /* Rios de verdade: uma faixa sinuosa de água atravessando o setor, com vaus
     para que o mapa continue conectado a pé. */
  World.prototype.correrRios = function (rand, quantos) {
    var w = this.w, h = this.h;
    for (var n = 0; n < quantos; n++) {
      var horizontal = rand() < 0.5;
      var largura = 2 + Math.floor(rand() * 2.4);
      var pos = (horizontal ? h : w) * (0.22 + rand() * 0.56);
      var fase = rand() * Math.PI * 2;
      var amplitude = (horizontal ? h : w) * (0.06 + rand() * 0.09);
      var passoOnda = 0.12 + rand() * 0.1;
      var vaus = [Math.floor((horizontal ? w : h) * (0.2 + rand() * 0.22)),
        Math.floor((horizontal ? w : h) * (0.6 + rand() * 0.24))];
      var comprimento = horizontal ? w : h;
      for (var t = 0; t < comprimento; t++) {
        var ehVau = false;
        for (var v = 0; v < vaus.length; v++) if (Math.abs(t - vaus[v]) <= 2) ehVau = true;
        if (ehVau) continue;
        var centro = pos + Math.sin(fase + t * passoOnda) * amplitude;
        for (var d = -largura; d <= largura; d++) {
          var x = horizontal ? t : Math.round(centro + d);
          var y = horizontal ? Math.round(centro + d) : t;
          if (!this.dentro(x, y)) continue;
          var i = this.idx(x, y);
          this.terreno[i] = Math.abs(d) >= largura ? T.CRATERA : T.AGUA;
        }
      }
    }
  };

  /* Cratera de impacto: anel externo de rocha com brechas e um pico central,
     no formato da estrutura real de Chicxulub. */
  World.prototype.esculpirCratera = function (rand) {
    var w = this.w, h = this.h, cx = w / 2, cy = h / 2;
    var rExterno = w * 0.40, rInterno = w * 0.13;
    var brechas = [];
    for (var b = 0; b < 4; b++) brechas.push(rand() * Math.PI * 2);
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        var d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
        var ondulacao = Math.sin(ang * 5 + rand() * 0.01) * w * 0.012;
        var noAnel = Math.abs(d - (rExterno + ondulacao)) < w * 0.022;
        var noPico = Math.abs(d - rInterno) < w * 0.018;
        var aberto = false;
        for (var k = 0; k < brechas.length; k++) {
          var dif = Math.abs(((ang - brechas[k] + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
          if (dif > Math.PI - 0.26) aberto = true;
        }
        if (noAnel && !aberto) this.terreno[this.idx(x, y)] = T.ROCHA;
        else if (noPico && !aberto) this.terreno[this.idx(x, y)] = T.CRATERA;
      }
    }
  };

  /* Malha urbana arruinada: avenidas e ruas em grade, quarteirões com prédios
     de pé (bloqueiam), prédios desabados (entulho) e quadras abertas por bombardeio. */
  World.prototype.erguerCidade = function (rand) {
    var w = this.w, h = this.h;
    var quadra = this.cfg.quadra || 7;
    var densidade = this.cfg.urbano;         /* 0..1 — quanto da quadra continua de pé */
    var girado = rand() < 0.5;               /* algumas cidades têm a grade inclinada */
    var avenidaX = 3 + Math.floor(rand() * quadra);
    var avenidaY = 3 + Math.floor(rand() * quadra);

    /* Quadras vazias: crateras de bombardeio e praças que sobraram. */
    var limpas = {};
    var quantasLimpas = Math.floor((w / quadra) * (h / quadra) * 0.22);
    for (var q = 0; q < quantasLimpas; q++) {
      limpas[Math.floor(rand() * (w / quadra)) + ':' + Math.floor(rand() * (h / quadra))] = 1;
    }

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var i = this.idx(x, y);
        if (this.terreno[i] === T.AGUA || this.terreno[i] === T.ROCHA) continue;

        var ux = x, uy = y;
        if (girado) { ux = x + ((y % (quadra * 2) < quadra) ? 0 : Math.floor(quadra / 2)); }

        var larguraRua = this.cfg.rua || 1;
        var dentroRuaX = ((ux + avenidaX) % quadra) < larguraRua;
        var dentroRuaY = ((uy + avenidaY) % quadra) < larguraRua;
        /* Avenidas largas de tempos em tempos: rotas principais e campo de tiro. */
        var avenida = ((ux + avenidaX) % (quadra * 3)) < larguraRua + 2 ||
          ((uy + avenidaY) % (quadra * 3)) < larguraRua + 2;
        if (dentroRuaX || dentroRuaY || avenida) { this.terreno[i] = T.ASFALTO; continue; }

        var chave = Math.floor(x / quadra) + ':' + Math.floor(y / quadra);
        if (limpas[chave]) { this.terreno[i] = rand() < 0.35 ? T.ESCOMBRO : T.ASFALTO; continue; }

        var r = rand();
        this.terreno[i] = r < densidade * 0.78 ? T.RUINA
          : r < densidade * 0.78 + 0.16 ? T.ESCOMBRO : T.ASFALTO;
      }
    }
  };

  /* Ilha cercada por água nos dois lados, como Manhattan entre o Hudson e o East River. */
  World.prototype.recortarIlha = function (rand) {
    var w = this.w, h = this.h;
    var meio = w / 2, largura = w * (0.48 + rand() * 0.06);
    var fase = rand() * 6.28;
    for (var y = 0; y < h; y++) {
      var desvio = Math.sin(fase + y * 0.09) * w * 0.05;
      var esq = meio + desvio - largura / 2, dir = meio + desvio + largura / 2;
      for (var x = 0; x < w; x++) {
        var i = this.idx(x, y);
        if (x < esq || x > dir) this.terreno[i] = T.AGUA;
        else if (x < esq + 1.4 || x > dir - 1.4) this.terreno[i] = T.ESCOMBRO;
      }
    }
  };

  /* Conectividade: componentes grandes separados por rios ganham um vau escavado;
     bolsões pequenos demais viram rocha. Nenhum setor fica com jazida sem rota. */
  World.prototype.removerIlhas = function () {
    var w = this.w, h = this.h, n = this.n;
    var comp = new Int32Array(n).fill(-1);
    var componentes = [], i, x, y;

    for (i = 0; i < n; i++) {
      if (comp[i] !== -1 || this.solido(i % w, (i / w) | 0)) continue;
      var id = componentes.length, celulas = [], fila = [i];
      comp[i] = id;
      while (fila.length) {
        var c = fila.pop(); celulas.push(c);
        var cx = c % w, cy = (c / w) | 0;
        for (var k = 0; k < 4; k++) {
          var nx = cx + [1, -1, 0, 0][k], ny = cy + [0, 0, 1, -1][k];
          if (!this.dentro(nx, ny)) continue;
          var j = ny * w + nx;
          if (comp[j] !== -1 || this.solido(nx, ny)) continue;
          comp[j] = id; fila.push(j);
        }
      }
      componentes.push(celulas);
    }
    if (!componentes.length) return;

    componentes.sort(function (a, b) { return b.length - a.length; });
    /* recalcula os índices depois da ordenação */
    comp.fill(-1);
    for (i = 0; i < componentes.length; i++) {
      for (var p = 0; p < componentes[i].length; p++) comp[componentes[i][p]] = i;
    }

    var principal = componentes[0];
    var minimo = Math.max(30, Math.floor(n * 0.02));
    for (i = 1; i < componentes.length; i++) {
      var grupo = componentes[i];
      if (grupo.length < minimo) {
        for (var q = 0; q < grupo.length; q++) this.terreno[grupo[q]] = T.ROCHA;
        continue;
      }
      this.escavarVau(grupo, comp, i);
    }
    this.recalcularAlcance();
  };

  /* Abre uma passagem de duas células entre um componente isolado e o principal. */
  World.prototype.escavarVau = function (grupo, comp, idGrupo) {
    var w = this.w, melhorA = -1, melhorB = -1, melhorD = Infinity;
    var amostra = Math.max(1, Math.floor(grupo.length / 240));
    for (var g = 0; g < grupo.length; g += amostra) {
      var a = grupo[g], ax = a % w, ay = (a / w) | 0;
      for (var raio = 2; raio <= 14; raio++) {
        var achou = false;
        for (var dy = -raio; dy <= raio; dy++) {
          for (var dx = -raio; dx <= raio; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== raio) continue;
            var bx = ax + dx, by = ay + dy;
            if (!this.dentro(bx, by)) continue;
            var b = by * w + bx;
            if (comp[b] === -1 || comp[b] === idGrupo) continue;
            var d = Math.hypot(dx, dy);
            if (d < melhorD) { melhorD = d; melhorA = a; melhorB = b; }
            achou = true;
          }
        }
        if (achou) break;
      }
    }
    if (melhorA < 0 || melhorB < 0) return;
    var x0 = melhorA % w, y0 = (melhorA / w) | 0;
    var x1 = melhorB % w, y1 = (melhorB / w) | 0;
    var passos = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (var t = 0; t <= passos; t++) {
      var px = Math.round(x0 + (x1 - x0) * t / passos);
      var py = Math.round(y0 + (y1 - y0) * t / passos);
      for (var oy = 0; oy <= 1; oy++) {
        for (var ox = 0; ox <= 1; ox++) {
          if (this.dentro(px + ox, py + oy)) this.terreno[this.idx(px + ox, py + oy)] = T.PLANICIE;
        }
      }
    }
  };

  World.prototype.recalcularAlcance = function () {
    var w = this.w, alc = new Uint8Array(this.n);
    var cx = Math.floor(w / 2), cy = Math.floor(this.h / 2), inicio = -1;
    for (var r = 0; r < w && inicio < 0; r++) {
      for (var dy = -r; dy <= r && inicio < 0; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          var x = cx + dx, y = cy + dy;
          if (this.dentro(x, y) && !this.solido(x, y)) { inicio = this.idx(x, y); break; }
        }
      }
    }
    if (inicio < 0) { this.alcancavel = alc; return; }
    var fila = [inicio]; alc[inicio] = 1;
    while (fila.length) {
      var i = fila.pop(), ix = i % w, iy = (i / w) | 0;
      for (var k = 0; k < 4; k++) {
        var nx = ix + [1, -1, 0, 0][k], ny = iy + [0, 0, 1, -1][k];
        if (!this.dentro(nx, ny)) continue;
        var j = ny * w + nx;
        if (alc[j] || this.solido(nx, ny)) continue;
        alc[j] = 1; fila.push(j);
      }
    }
    this.alcancavel = alc;
  };

  World.prototype.areaLivre = function (x, y, w, h) {
    for (var dy = 0; dy < h; dy++) {
      for (var dx = 0; dx < w; dx++) if (!this.construivel(x + dx, y + dy)) return false;
    }
    return true;
  };

  World.prototype.plantarJazidas = function (rand) {
    var alvo = this.cfg.jazidas, cristais = this.cfg.cristais;
    var cx = this.w / 2, cy = this.h / 2;
    var postos = [];
    var tentativas = 0;
    /* Uma jazida inicial garantida perto do centro, para a economia não travar. */
    while (postos.length < alvo + cristais && tentativas++ < 6000) {
      var primeira = postos.length === 0;
      var raio = primeira ? 6 + rand() * 4 : 6 + rand() * (this.w * 0.46);
      var ang = rand() * Math.PI * 2;
      var x = Math.round(cx + Math.cos(ang) * raio), y = Math.round(cy + Math.sin(ang) * raio);
      if (x < 2 || y < 2 || x > this.w - 4 || y > this.h - 4) continue;
      if (!this.areaLivre(x, y, 2, 2)) continue;
      if (!this.temAcessoPorRua(x, y, 2, 2)) continue;
      var perto = false;
      for (var p = 0; p < postos.length; p++) {
        if (Math.hypot(postos[p].x - x, postos[p].y - y) < 7) { perto = true; break; }
      }
      if (perto) continue;
      var ehCristal = !primeira && postos.length >= alvo;
      postos.push({ x: x, y: y, cristal: ehCristal });
    }

    for (var k = 0; k < postos.length; k++) {
      var pos = postos[k];
      var jaz = {
        id: k + 1, x: pos.x, y: pos.y, w: 2, h: 2,
        tipo: pos.cristal ? 'cristal' : 'mineral',
        estoque: pos.cristal ? 900 + Math.floor(rand() * 300) : 1400 + Math.floor(rand() * 900),
        vagas: 4, ocupadas: 0, extrator: 0
      };
      jaz.estoqueMax = jaz.estoque;
      this.jazidas.push(jaz);
      for (var dy = 0; dy < 2; dy++) for (var dx = 0; dx < 2; dx++) this.recurso[this.idx(pos.x + dx, pos.y + dy)] = jaz.id;
    }
  };

  /* Uma jazida sem célula livre ao redor nunca receberia um operário. */
  World.prototype.temAcessoPorRua = function (x, y, largura, altura) {
    for (var dy = -1; dy <= altura; dy++) {
      for (var dx = -1; dx <= largura; dx++) {
        var borda = dx < 0 || dy < 0 || dx >= largura || dy >= altura;
        if (!borda) continue;
        if (this.dentro(x + dx, y + dy) && !this.solido(x + dx, y + dy)) return true;
      }
    }
    return false;
  };

  World.prototype.jazidaPorId = function (id) {
    for (var i = 0; i < this.jazidas.length; i++) if (this.jazidas[i].id === id) return this.jazidas[i];
    return null;
  };

  /* Zonas de invasão: células de borda que pertencem à área principal do mapa,
     escolhidas o mais afastadas possível entre si. */
  World.prototype.definirEntradas = function (rand) {
    var w = this.w, h = this.h, candidatas = [], x, y;
    function nomeDe(x, y, w, h) {
      var ns = y < h * 0.33 ? 'n' : (y > h * 0.67 ? 's' : '');
      var lo = x < w * 0.33 ? 'o' : (x > w * 0.67 ? 'l' : '');
      return { n: 'norte', s: 'sul', o: 'oeste', l: 'leste', no: 'noroeste', nl: 'nordeste',
        so: 'sudoeste', sl: 'sudeste' }[ns + lo] || 'centro';
    }
    for (x = 0; x < w; x++) {
      for (var k = 0; k < 2; k++) {
        y = k ? h - 2 : 1;
        if (this.alcancavel && this.alcancavel[this.idx(x, y)]) candidatas.push({ x: x, y: y, nome: nomeDe(x, y, w, h) });
      }
    }
    for (y = 0; y < h; y++) {
      for (var j = 0; j < 2; j++) {
        x = j ? w - 2 : 1;
        if (this.alcancavel && this.alcancavel[this.idx(x, y)]) candidatas.push({ x: x, y: y, nome: nomeDe(x, y, w, h) });
      }
    }
    if (!candidatas.length) { this.entradas = [{ x: 1, y: 1, nome: 'noroeste' }]; return; }

    var escolhidas = [candidatas[Math.floor(rand() * candidatas.length)]];
    while (escolhidas.length < this.cfg.entradas) {
      var melhor = null, melhorD = -1;
      for (var c = 0; c < candidatas.length; c++) {
        var perto = Infinity;
        for (var e = 0; e < escolhidas.length; e++) {
          var d = Math.hypot(candidatas[c].x - escolhidas[e].x, candidatas[c].y - escolhidas[e].y);
          if (d < perto) perto = d;
        }
        if (perto > melhorD) { melhorD = perto; melhor = candidatas[c]; }
      }
      if (!melhor || melhorD < 6) break;
      escolhidas.push(melhor);
    }
    this.entradas = escolhidas;
  };

  /* ------------------------------------------------------- visibilidade */
  World.prototype.limparVisao = function () { this.visivel.fill(0); };

  World.prototype.revelar = function (cx, cy, raio) {
    var r = Math.ceil(raio), r2 = raio * raio;
    var x0 = Math.max(0, Math.floor(cx) - r), x1 = Math.min(this.w - 1, Math.floor(cx) + r);
    var y0 = Math.max(0, Math.floor(cy) - r), y1 = Math.min(this.h - 1, Math.floor(cy) + r);
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy > r2) continue;
        var i = y * this.w + x;
        this.visivel[i] = 1; this.explorado[i] = 1;
      }
    }
  };

  World.prototype.veCelula = function (x, y) {
    return this.dentro(x, y) && this.visivel[this.idx(x, y)] === 1;
  };

  UF.World = World;
})(typeof window !== 'undefined' ? window : globalThis);
