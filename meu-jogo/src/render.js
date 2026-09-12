/* Última Fronteira — apresentação isométrica em Canvas 2D.
   Só lê o estado da simulação. Nunca altera regras. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var T = D.TERRENO, ESTR = D.ESTRUTURAS;

  var LARG = 64, ALT = 32;          /* losango base de uma célula, em zoom 1 */

  /* Paleta por cidade: cada setor tem a cor do seu chão, da sua água e das ruínas. */
  /* O que BLOQUEIA é escuro; onde se ANDA é claro. A primeira versão fazia o
     contrário — ruína bege clara sobre chão verde escuro — e o olho ia direto
     para o obstáculo, não para o espaço jogável. Num mapa com quase seiscentas
     células de ruína, isso vira um tapete de blocos claros onde não se enxerga
     rua nenhuma. Aqui a ruína e a rocha viram silhueta escura, o chão sobe de
     tom e a rua é a coisa mais clara da tela: a leitura fica "massa escura =
     não passa, claro = passa". */
  var PALETAS = {
    porto:     { chao: '#5c655a', chao2: '#656e62', rua: '#7b8377', agua: '#16262b', aguaBrilho: '#294a48', entulho: '#4e5346', ruina: '#2f3429', ruinaTopo: '#394030', rocha: '#272a23', grama: '#556149', terra: '#6b6348', ceu: '#0d1410' },
    costa:     { chao: '#585e66', chao2: '#616771', rua: '#767d87', agua: '#123040', aguaBrilho: '#1d4c5c', entulho: '#4a4d53', ruina: '#2c3036', ruinaTopo: '#353a41', rocha: '#24282d', grama: '#525c4a', terra: '#6d6650', ceu: '#0a1016' },
    metropole: { chao: '#575a60', chao2: '#60636a', rua: '#767a82', entulho: '#4a4d52', agua: '#262518', aguaBrilho: '#3a3726', ruina: '#2b2d32', ruinaTopo: '#34363c', rocha: '#232529', grama: '#535b48', terra: '#67624f', ceu: '#0b0d12' },
    deserto:   { chao: '#8a7757', chao2: '#948160', rua: '#a89372', agua: '#15384a', aguaBrilho: '#215a72', entulho: '#6b5d45', ruina: '#453a29', ruinaTopo: '#51452e', rocha: '#3a3222', grama: '#7d7551', terra: '#9b8757', ceu: '#161009' },
    ilha:      { chao: '#545c60', chao2: '#5d656a', rua: '#727b80', agua: '#0f2636', aguaBrilho: '#1a4059', entulho: '#474d51', ruina: '#292f33', ruinaTopo: '#32383d', rocha: '#21262a', grama: '#4f5a49', terra: '#68634f', ceu: '#080c12' },
    cratera:   { chao: '#6e6a58', chao2: '#777360', rua: '#8b8670', agua: '#175a5c', aguaBrilho: '#22807f', entulho: '#5b5747', ruina: '#393528', ruinaTopo: '#433e2f', rocha: '#2f2c22', grama: '#666a4d', terra: '#7b7154', ceu: '#100f0a' }
  };

  function Render(canvas, sim) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.sim = sim;
    this.pal = PALETAS[sim.setor.bioma] || PALETAS.metropole;
    this.cam = { x: 0, y: 0, zoom: 1 };
    this.efeitos = [];
    this.marcadores = [];
    this.anima = UF.Anima ? new UF.Anima() : null;
    this.previa = null;              /* prévia de construção */
    this.tracado = null;             /* prévia de muro por arraste */
    this.selecao = [];
    this.hover = null;
    this.quadro = 0;
    this.escalaDPR = 1;
    this.prepararRuinas();
    this.prepararDestrocos();
    this.prepararTerreno();
    /* No celular a câmera começa mais afastada para caber a base inteira. */
    var menor = Math.min(canvas.clientWidth || 800, canvas.clientHeight || 600);
    this.cam.zoom = U.clamp(menor / 760, 0.6, 1.05);
    this.centralizarNoMapa();
  }

  /* ------------------------------------------------------- projeção */
  Render.prototype.paraTela = function (wx, wy) {
    var z = this.cam.zoom;
    return {
      x: (wx - wy) * (LARG / 2) * z + this.cam.x,
      y: (wx + wy) * (ALT / 2) * z + this.cam.y
    };
  };

  Render.prototype.paraMundo = function (sx, sy) {
    var z = this.cam.zoom;
    var a = (sx - this.cam.x) / ((LARG / 2) * z);
    var b = (sy - this.cam.y) / ((ALT / 2) * z);
    return { x: (a + b) / 2, y: (b - a) / 2 };
  };

  Render.prototype.centralizarEm = function (wx, wy) {
    var z = this.cam.zoom;
    this.cam.x = this.cv.clientWidth / 2 - (wx - wy) * (LARG / 2) * z;
    this.cam.y = this.cv.clientHeight / 2 - (wx + wy) * (ALT / 2) * z;
  };

  Render.prototype.centralizarNoMapa = function () {
    this.centralizarEm(this.sim.world.w / 2, this.sim.world.h / 2);
  };

  Render.prototype.redimensionar = function () {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.escalaDPR = dpr;
    this.cv.width = Math.round(this.cv.clientWidth * dpr);
    this.cv.height = Math.round(this.cv.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  /* Sucata espalhada: carro queimado, ônibus parado, viaduto partido, monte de
     entulho. É o que tira a cara de tabuleiro — sem nada solto sobre ele, o
     chão é uma malha de losangos iguais e a cidade não parece ter sido vivida.

     Onde cada coisa cai não é decoração cega: o entulho e o prédio caído vão
     para o ESCOMBRO, que é justamente o terreno onde não se constrói, e assim
     a arte passa a EXPLICAR a regra em vez de brigar com ela. Os veículos vão
     para a rua, poucos, porque rua entupida de carro esconde o corredor que a
     rua existe para mostrar.

     O sorteio é um hash da célula: a mesma partida devolve sempre a mesma
     sucata nos mesmos lugares, e nada pisca ao repintar. */
  var DESTROCOS_ENTULHO = [
    { nome: 'destroco-entulho', cel: 1.5 },
    { nome: 'destroco-predio-caido', cel: 2.0 },
    { nome: 'destroco-poste', cel: 1.7 },
    { nome: 'destroco-passarela', cel: 2.1 },
    { nome: 'destroco-pilar', cel: 1.3 },
    { nome: 'destroco-viaduto', cel: 2.2 }
  ];
  /* Vegetação. A cidade é tropical e está abandonada há décadas: o mato é
     personagem, não enfeite. Vai no chão livre FORA da via — mato no meio da
     rua esconderia o corredor. */
  var VERDE = [
    { nome: 'manaus-mangueira', cel: 2.2 },
    { nome: 'manaus-palmeira', cel: 1.4 },
    { nome: 'manaus-mangueira', cel: 1.8 }
  ];
  var DESTROCOS_RUA = [
    { nome: 'destroco-carro', cel: 1.1 },
    { nome: 'destroco-van', cel: 1.25 },
    { nome: 'destroco-viatura', cel: 1.25 },
    { nome: 'destroco-onibus', cel: 2.1 },
    { nome: 'destroco-caminhao', cel: 1.8 },
    { nome: 'destroco-tanque', cel: 2.1 }
  ];

  /* Um marco reconhecível por setor. Mapa gerado por regra é sempre igual a si
     mesmo: sem nada que o jogador reconheça, Manaus e São Paulo são a mesma
     grade com outro tom de cinza. O Teatro Amazonas em ruínas resolve isso com
     uma peça só — e ele nasce EM CIMA de um quarteirão de ruína, que já
     bloqueia passagem, para a arte não prometer um caminho que a regra nega.
     As ruínas cobertas param de ser desenhadas: o teatro é o prédio ali. */
  var MARCOS = { porto: { nome: 'manaus-teatro', cel: 5 } };

  Render.prototype.plantarMarco = function (w) {
    var def = MARCOS[this.sim.setor.bioma];
    if (!def) return;
    var lado = Math.ceil(def.cel), cx = w.w / 2, cy = w.h / 2;
    var melhor = null, melhorD = Infinity;
    for (var y = 2; y < w.h - lado - 2; y++) {
      for (var x = 2; x < w.w - lado - 2; x++) {
        var cheio = true;
        for (var dy = 0; dy < lado && cheio; dy++) {
          for (var dx = 0; dx < lado; dx++) {
            if (w.terreno[w.idx(x + dx, y + dy)] !== T.RUINA) { cheio = false; break; }
          }
        }
        if (!cheio) continue;
        var d = Math.hypot(x - cx, y - cy);
        if (d < melhorD) { melhorD = d; melhor = { x: x, y: y }; }
      }
    }
    if (!melhor) return;
    for (var ay = 0; ay < lado; ay++) {
      for (var ax = 0; ax < lado; ax++) {
        this.cobertas[(melhor.x + ax) + ',' + (melhor.y + ay)] = 1;
      }
    }
    this.destrocos.push({ x: melhor.x, y: melhor.y, nome: def.nome, cel: def.cel });
  };

  Render.prototype.prepararDestrocos = function () {
    var w = this.sim.world, sem = this.sim.setor.semente;
    function h(x, y, sal) {
      var n = Math.sin(x * 127.1 + y * 311.7 + sal * 74.7 + sem * 0.113) * 43758.5453;
      return n - Math.floor(n);
    }
    this.destrocos = [];
    this.cobertas = {};
    this.plantarMarco(w);
    for (var y = 1; y < w.h - 2; y++) {
      for (var x = 1; x < w.w - 2; x++) {
        var i = w.idx(x, y), t = w.terreno[i];
        var lista = null, chance = 0;
        if (t === T.ESCOMBRO) { lista = DESTROCOS_ENTULHO; chance = 0.055; }
        else if (t === T.ASFALTO && w.rua && w.rua[i]) { lista = DESTROCOS_RUA; chance = 0.022; }
        else if (t === T.ASFALTO) { lista = VERDE; chance = 0.05; }
        if (!lista || h(x, y, 3) > chance) continue;
        /* Nada de duas peças encostadas: uma em cima da outra vira mancha. */
        var perto = false;
        for (var k = this.destrocos.length - 1; k >= 0 && !perto; k--) {
          var d = this.destrocos[k];
          if (Math.abs(d.x - x) < 5 && Math.abs(d.y - y) < 5) perto = true;
        }
        if (perto) continue;
        var e = lista[Math.floor(h(x, y, 5) * lista.length) % lista.length];
        this.destrocos.push({ x: x, y: y, nome: e.nome, cel: e.cel });
      }
    }
  };

  /* -------------------------------------------- terreno pré-desenhado */
  /* O chão não muda durante a partida: é desenhado uma vez em um canvas
     próprio e só reaproveitado a cada quadro. */
  Render.prototype.prepararTerreno = function () {
    var w = this.sim.world, pal = this.pal;
    var larg = (w.w + w.h) * (LARG / 2) + LARG;
    var alt = (w.w + w.h) * (ALT / 2) + ALT * 4;
    var off = global.document.createElement('canvas');
    off.width = Math.ceil(larg); off.height = Math.ceil(alt);
    var c = off.getContext('2d');
    this.deslocamentoTerreno = { x: w.h * (LARG / 2), y: ALT };
    var dx = this.deslocamentoTerreno.x, dy = this.deslocamentoTerreno.y;
    var rand = U.rng(this.sim.setor.semente * 3 + 7);
    /* Ruído por célula, estável: a mesma célula devolve sempre o mesmo valor,
       então o chão não cintila quando o mapa é repintado. */
    var sem = this.sim.setor.semente;
    function ruido(x, y) {
      var n = Math.sin(x * 127.1 + y * 311.7 + sem * 0.37) * 43758.5453;
      return n - Math.floor(n);
    }

    /* A cidade É uma grade de ruas e quarteirões — a simulação sabe disso ao
       erguê-la, mas o desenho pintava rua e terreno solto da mesma cor e a
       malha sumia. Sem ver a rua, o jogador não vê por onde o inimigo vem nem
       onde cabe a base: o mapa vira um campo de blocos sem direção.
       Aqui a rua é reconhecida pelo que ela é — corredor longo de chão livre —
       e ganha o tom mais claro da paleta. Cinco células é o menor corredor que
       ainda lê como via; abaixo disso é vão entre escombros. */
    var ehRua = new Uint8Array(w.n);
    /* 1 = corre no eixo X, 2 = no eixo Y, 3 = cruzamento. A pintura da rua
       precisa saber a direção: faixa central atravessada é o que denuncia
       desenho feito no olho. */
    var eixoRua = new Uint8Array(w.n);

    /* Largura da faixa livre em cada eixo, célula a célula. É o que separa RUA
       de PRAÇA: um corredor de cinco células de comprimento também descreve o
       meio de um descampado, e pintar faixa de trânsito no meio de um terreno
       baldio é o tipo de detalhe que faz o mapa parecer errado sem que se saiba
       dizer por quê. Rua é o que é COMPRIDO num eixo e ESTREITO no outro. */
    var largX = new Uint8Array(w.n), largY = new Uint8Array(w.n);
    var eixo, a, b, ini, corrida;
    for (eixo = 0; eixo < 2; eixo++) {
      var fora = eixo ? w.w : w.h, dentro = eixo ? w.h : w.w;
      var alvo = eixo ? largY : largX;
      for (a = 0; a < fora; a++) {
        ini = -1;
        for (b = 0; b <= dentro; b++) {
          var livre = b < dentro &&
            w.terreno[eixo ? w.idx(a, b) : w.idx(b, a)] === T.ASFALTO;
          if (livre) { if (ini < 0) ini = b; continue; }
          if (ini >= 0) {
            var comp = Math.min(255, b - ini);
            for (corrida = ini; corrida < b; corrida++) {
              alvo[eixo ? w.idx(a, corrida) : w.idx(corrida, a)] = comp;
            }
          }
          ini = -1;
        }
      }
    }
    var ESTREITO = 4, COMPRIDO = 5;
    for (var iu = 0; iu < w.n; iu++) {
      if (w.terreno[iu] !== T.ASFALTO) continue;
      if (largX[iu] >= COMPRIDO && largY[iu] <= ESTREITO) eixoRua[iu] |= 1;
      if (largY[iu] >= COMPRIDO && largX[iu] <= ESTREITO) eixoRua[iu] |= 2;
      /* cruzamento: comprido nos dois, mas não largo nos dois */
      if (largX[iu] >= COMPRIDO && largY[iu] >= COMPRIDO &&
        Math.min(largX[iu], largY[iu]) <= ESTREITO + 2) eixoRua[iu] = 3;
      if (eixoRua[iu]) ehRua[iu] = 1;
    }
    this.ehRua = ehRua;
    this.eixoRua = eixoRua;

    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        var t = w.terreno[w.idx(x, y)];
        if (t === T.RUINA) t = T.ESCOMBRO;      /* a base do prédio é entulho */
        var cor;
        if (t === T.AGUA) cor = pal.agua;
        else if (t === T.ESCOMBRO) cor = pal.entulho;
        else if (t === T.ROCHA) cor = pal.rocha;
        else if (ehRua[w.idx(x, y)]) cor = sombrear(pal.rua, ruido(x, y) < 0.5 ? 1 : 0.96);
        /* Fora da via, o chão não é asfalto uniforme: é a cidade sendo comida
           de volta pelo mato. Manchas grandes de vegetação e de terra batida,
           sorteadas por uma escala baixa de ruído para virarem áreas e não
           chuvisco — um pixel verde solto no meio do cinza só suja. O verde
           também é o que dá cor ao mapa: cinza sobre cinza cansa a vista e não
           ajuda a se orientar.
           Era `(x+y)%2` — um xadrez, o padrão mais fácil de o olho pegar. */
        else {
          var manchaV = ruido(Math.floor(x / 4) * 4 + 11, Math.floor(y / 4) * 4 + 7);
          var manchaT = ruido(Math.floor(x / 5) * 5 + 31, Math.floor(y / 5) * 5 + 19);
          var fino = ruido(x, y);
          if (manchaV > 0.7) cor = sombrear(pal.grama, 0.86 + fino * 0.3);
          else if (manchaT > 0.72) cor = sombrear(pal.terra, 0.9 + fino * 0.22);
          else cor = fino < 0.5 ? pal.chao : pal.chao2;
        }
        var px = (x - y) * (LARG / 2) + dx, py = (x + y) * (ALT / 2) + dy;
        this.losango(c, px, py, cor);
        if (t === T.AGUA && rand() < 0.16) this.losango(c, px, py, pal.aguaBrilho, 0.5);
      }
    }
    /* Faixas de rua: linhas claras no meio das vias longas. */
    c.globalAlpha = 0.16; c.fillStyle = '#e8e2cf';
    for (y = 1; y < w.h - 1; y++) {
      for (x = 1; x < w.w - 1; x++) {
        if (w.terreno[w.idx(x, y)] !== T.ASFALTO) continue;
        var corredorH = w.terreno[w.idx(x - 1, y)] === T.ASFALTO && w.terreno[w.idx(x + 1, y)] === T.ASFALTO;
        var corredorV = w.terreno[w.idx(x, y - 1)] === T.ASFALTO && w.terreno[w.idx(x, y + 1)] === T.ASFALTO;
        if (!(corredorH ^ corredorV) || (x + y) % 3) continue;
        var p = { x: (x - y) * (LARG / 2) + dx, y: (x + y) * (ALT / 2) + dy };
        c.beginPath(); c.arc(p.x, p.y + ALT / 2, 2.2, 0, 6.283); c.fill();
      }
    }
    c.globalAlpha = 1;
    this.suavizarBordas(c, w, dx, dy, pal);
    this.texturarTerreno(c, w, dx, dy, ehRua);
    this.pintarRuas(c, w, dx, dy, ehRua, eixoRua);
    this.escurecerJuntoAosPredios(c, w, dx, dy);
    this.cvTerreno = off;
    this.terrenoSemTextura = !(UF.sprites && UF.sprites.chaoPronto());
  };

  /* Oclusão: o chão encosta no pé do prédio sem nenhuma transição, e a cidade
     inteira fica parecendo blocos apoiados em cima de um papel. Escurecer as
     células livres que fazem fronteira com ruína ou rocha custa um laço e dá o
     que a sombra projetada daria — o volume assenta no chão e as massas se
     separam umas das outras. Quanto mais lados bloqueados, mais fundo o poço.
     Vai no canvas do terreno, desenhado uma vez só: não custa nada por quadro. */
  /* Pintura de rua: faixa central tracejada no meio da via, faixa de pedestre
     nos cruzamentos e meio-fio claro onde a rua encosta no quarteirão.

     Isto não é enfeite. A rua já estava mais clara que o resto, mas "mais
     clara" o olho lê como mancha; o que faz um traçado virar RUA é a pintura
     em cima dele. Com a faixa, dá para ver de onde o inimigo vem e por onde a
     tropa passa sem contar célula por célula.

     O tracejado segue o EIXO da via (guardado em eixoRua), porque faixa
     atravessada denuncia na hora que o desenho foi feito no olho. */
  Render.prototype.pintarRuas = function (c, w, dx, dy, ehRua, eixoRua) {
    var meiaL = LARG / 2, meiaA = ALT / 2;
    c.save();
    c.lineCap = 'round';
    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        var i = w.idx(x, y);
        if (!ehRua[i]) continue;
        var cx = (x - y) * meiaL + dx, cy = (x + y) * meiaA + dy + meiaA;
        var eixos = eixoRua[i];
        var cruz = eixos === 3;

        /* meio-fio: lado que encosta em quarteirão ganha uma borda clara */
        c.strokeStyle = 'rgba(226,222,208,0.3)';
        c.lineWidth = 2;
        var lados = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (var k = 0; k < 4; k++) {
          var nx = x + lados[k][0], ny = y + lados[k][1];
          if (!w.dentro(nx, ny)) continue;
          if (ehRua[w.idx(nx, ny)]) continue;
          var tv = w.terreno[w.idx(nx, ny)];
          if (tv === T.AGUA) continue;
          /* a aresta compartilhada com o vizinho, em coordenadas de tela */
          var ex = lados[k][0] * meiaL - lados[k][1] * meiaL;
          var ey = lados[k][0] * meiaA + lados[k][1] * meiaA;
          c.beginPath();
          c.moveTo(cx + ex / 2 - ey / 2 * 0, cy + ey / 2);
          c.lineTo(cx + ex, cy + ey);
          c.stroke();
        }

        if (cruz) {
          /* faixa de pedestre: barras curtas atravessando o cruzamento */
          c.strokeStyle = 'rgba(236,232,216,0.34)';
          c.lineWidth = 2.4;
          for (var f = -1; f <= 1; f++) {
            c.beginPath();
            c.moveTo(cx - meiaL * 0.55 + f * 8, cy - meiaA * 0.55 + f * 4);
            c.lineTo(cx + meiaL * 0.05 + f * 8, cy + meiaA * 0.35 + f * 4);
            c.stroke();
          }
          continue;
        }
        /* faixa central tracejada, só em uma célula sim outra não */
        if ((x + y) % 2) continue;
        c.strokeStyle = 'rgba(236,228,196,0.42)';
        c.lineWidth = 2.2;
        c.beginPath();
        if (eixos & 1) {           /* corre no eixo X: +x na tela é (+L/2, +A/2) */
          c.moveTo(cx - meiaL * 0.42, cy - meiaA * 0.42);
          c.lineTo(cx + meiaL * 0.42, cy + meiaA * 0.42);
        } else {                   /* eixo Y: +y na tela é (-L/2, +A/2) */
          c.moveTo(cx + meiaL * 0.42, cy - meiaA * 0.42);
          c.lineTo(cx - meiaL * 0.42, cy + meiaA * 0.42);
        }
        c.stroke();
      }
    }
    c.restore();
  };

  Render.prototype.escurecerJuntoAosPredios = function (c, w, dx, dy) {
    var lados = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    c.save();
    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        var t = w.terreno[w.idx(x, y)];
        if (t === T.RUINA || t === T.ROCHA || t === T.AGUA) continue;
        var perto = 0;
        for (var k = 0; k < 4; k++) {
          var nx = x + lados[k][0], ny = y + lados[k][1];
          if (!w.dentro(nx, ny)) continue;
          var tv = w.terreno[w.idx(nx, ny)];
          if (tv === T.RUINA || tv === T.ROCHA) perto++;
        }
        if (!perto) continue;
        var px = (x - y) * (LARG / 2) + dx, py = (x + y) * (ALT / 2) + dy;
        c.globalAlpha = 0.1 + perto * 0.075;
        this.losango(c, px, py, '#05080c');
      }
    }
    c.restore();
  };

  /* Onde dois terrenos se encostam, o corte é um losango duro e o olho lê a
     grade na hora. O Age of Empires resolve isso sem desenhar borda nenhuma:
     pinta o terreno vizinho por cima, através de uma máscara, e deixa a
     fronteira irregular. Aqui a máscara é um gradiente na direção do vizinho —
     o vizinho "vaza" para dentro da célula e some no meio dela.
     Quem pinta por cima de quem sai da PRIORIDADE: rocha cobre entulho, que
     cobre chão, que cobre água. Sem isso as duas células se pintariam
     mutuamente e a borda ficaria suja. */
  var PRIORIDADE = {};
  PRIORIDADE[0] = 20;    /* asfalto/planície */
  PRIORIDADE[3] = 40;    /* escombro */
  PRIORIDADE[1] = 60;    /* rocha */
  PRIORIDADE[2] = 10;    /* água: sempre por baixo */

  Render.prototype.suavizarBordas = function (c, w, dx, dy, pal) {
    var corDe = {};
    corDe[2] = pal.agua; corDe[3] = pal.entulho;
    corDe[1] = pal.rocha; corDe[0] = pal.chao;
    var lados = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        var t = w.terreno[w.idx(x, y)];
        if (t === T.RUINA) t = T.ESCOMBRO;
        var px = (x - y) * (LARG / 2) + dx, py = (x + y) * (ALT / 2) + dy;

        for (var k = 0; k < lados.length; k++) {
          var nx = x + lados[k][0], ny = y + lados[k][1];
          if (nx < 0 || ny < 0 || nx >= w.w || ny >= w.h) continue;
          var tv = w.terreno[w.idx(nx, ny)];
          if (tv === T.RUINA) tv = T.ESCOMBRO;
          if (tv === t || (PRIORIDADE[tv] || 0) <= (PRIORIDADE[t] || 0)) continue;

          /* o gradiente nasce no canto do vizinho e morre no centro da célula */
          var vx = (nx - ny) * (LARG / 2) + dx, vy = (nx + ny) * (ALT / 2) + dy;
          var g = c.createLinearGradient(
            (px + vx) / 2, (py + vy) / 2 + ALT / 2, px, py + ALT / 2);
          g.addColorStop(0, corDe[tv] || pal.chao);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          c.save();
          c.globalAlpha = 0.85;
          this.losango(c, px, py, g);
          c.restore();
        }
      }
    }
  };

  /* Textura por cima da cor chapada, em 'overlay': a cor do setor continua sendo
     quem manda (é ela que separa deserto de cratera de porto), e a imagem entra
     só como granulação e detalhe. Tingir por multiplicação escureceria tudo.
     Uma passada por tipo de terreno — recorta todos os losângos daquele tipo de
     uma vez e preenche com o padrão — em vez de uma por célula, que em mapa de
     4 mil células custaria caro sem melhorar nada. */
  Render.prototype.texturarTerreno = function (c, w, dx, dy, ehRua) {
    if (!UF.sprites || !UF.sprites.chaoPronto()) return;
    var grupos = [
      { nome: 'asfalto', aceita: function (t, i) { return t === T.ASFALTO && ehRua[i]; }, alfa: 0.62 },
      { nome: 'chao-pavimento', aceita: function (t, i) { return t === T.ASFALTO && !ehRua[i]; }, alfa: 0.34 },
      { nome: 'chao-entulho', aceita: function (t) { return t === T.ESCOMBRO || t === T.ROCHA || t === T.RUINA; }, alfa: 0.55 },
      { nome: 'chao-agua', aceita: function (t) { return t === T.AGUA; }, alfa: 0.45 }
    ];
    for (var g = 0; g < grupos.length; g++) {
      var img = UF.sprites.cenario(grupos[g].nome);
      var padrao = c.createPattern(img, 'repeat');
      if (!padrao) continue;
      /* A textura é esticada para cobrir ~10 células em vez de 4. É o truque que
         o Age of Empires usa: uma folha grande de terreno em vez de um azulejo
         por célula. No tamanho natural a mesma mancha reaparece a cada quatro
         losangos e o olho pega o padrão; esticada, a repetição cai fora do
         campo de visão. Custa zero — é a mesma imagem, desenhada maior. */
      if (padrao.setTransform) {
        var k = (10 * LARG) / img.width;
        padrao.setTransform({ a: k, b: 0, c: 0, d: k, e: 0, f: 0 });
      }
      c.save();
      c.beginPath();
      var achou = false;
      for (var y = 0; y < w.h; y++) {
        for (var x = 0; x < w.w; x++) {
          if (!grupos[g].aceita(w.terreno[w.idx(x, y)], w.idx(x, y))) continue;
          var px = (x - y) * (LARG / 2) + dx, py = (x + y) * (ALT / 2) + dy;
          c.moveTo(px, py);
          c.lineTo(px + LARG / 2, py + ALT / 2);
          c.lineTo(px, py + ALT);
          c.lineTo(px - LARG / 2, py + ALT / 2);
          c.closePath();
          achou = true;
        }
      }
      if (achou) {
        c.clip();
        c.globalCompositeOperation = 'overlay';
        c.globalAlpha = grupos[g].alfa;
        c.fillStyle = padrao;
        c.fillRect(0, 0, c.canvas.width, c.canvas.height);
      }
      c.restore();
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  };

  Render.prototype.losango = function (c, px, py, cor, alfa) {
    c.globalAlpha = alfa == null ? 1 : alfa;
    c.fillStyle = cor;
    c.beginPath();
    c.moveTo(px, py);
    c.lineTo(px + LARG / 2, py + ALT / 2);
    c.lineTo(px, py + ALT);
    c.lineTo(px - LARG / 2, py + ALT / 2);
    c.closePath();
    c.fill();
    c.globalAlpha = 1;
  };

  /* Células de ruína vizinhas formam um mesmo prédio: mesma altura e mesmo tom.
     Sem isso a cidade vira um amontoado de caixas soltas. */
  Render.prototype.prepararRuinas = function () {
    var w = this.sim.world, rand = U.rng(this.sim.setor.semente * 97 + 5);
    var grupo = new Int32Array(w.n).fill(-1);
    var predios = [];
    var T4 = [1, -1, 0, 0], T5 = [0, 0, 1, -1];

    for (var i = 0; i < w.n; i++) {
      var t = w.terreno[i];
      if ((t !== T.RUINA && t !== T.ROCHA) || grupo[i] !== -1) continue;
      var id = predios.length, celulas = [], fila = [i];
      grupo[i] = id;
      while (fila.length) {
        var c = fila.pop(); celulas.push(c);
        var cx = c % w.w, cy = (c / w.w) | 0;
        for (var k = 0; k < 4; k++) {
          var nx = cx + T4[k], ny = cy + T5[k];
          if (!w.dentro(nx, ny)) continue;
          var j = ny * w.w + nx;
          if (grupo[j] !== -1 || w.terreno[j] !== t) continue;
          grupo[j] = id; fila.push(j);
        }
      }
      var rocha = t === T.ROCHA;
      /* Quanto maior a base, mais alto o prédio — como numa cidade de verdade. */
      var porte = Math.min(1, celulas.length / 7);
      var arrasado = !rocha && rand() < 0.34;          /* prédio que veio abaixo */
      predios.push({
        celulas: celulas, rocha: rocha, arrasado: arrasado,
        /* A amplitude é grande de propósito. Com o intervalo antigo quase todo
           prédio caía entre 45 e 70 e a cidade virava um tapete de cubos da
           mesma altura — nada de silhueta, nada para se orientar. Agora o
           quarteirão grande sobe de verdade e o pequeno fica rente ao chão. */
        alt: rocha ? 8 + rand() * 12
          : arrasado ? 8 + rand() * 12
            : 18 + porte * 108 + rand() * 22,
        tom: 0.78 + rand() * 0.34,
        janelas: !rocha && !arrasado
      });
    }

    this.ruinas = [];
    /* altura por célula: o vulto precisa saber, para cada célula à frente da
       unidade, se o prédio dali é alto o bastante para escondê-la. Varrer a
       lista inteira de ruínas por unidade e por célula seria centenas de
       milhares de comparações por quadro. */
    this.alturaRuina = new Float32Array(w.n);
    for (var p = 0; p < predios.length; p++) {
      var pr = predios[p];
      for (var q = 0; q < pr.celulas.length; q++) {
        var idx = pr.celulas[q];
        var x = idx % w.w, y = (idx / w.w) | 0;
        /* O topo do prédio quebra um pouco nas bordas do quarteirão. */
        var borda = 0;
        for (var d = 0; d < 4; d++) {
          var bx = x + T4[d], by = y + T5[d];
          if (!w.dentro(bx, by) || grupo[w.idx(bx, by)] !== p) borda++;
        }
        var quebra = pr.arrasado ? 0.5 + rand() * 0.6
          : borda >= 2 ? 0.5 + rand() * 0.34
            : (borda === 1 ? 0.78 + rand() * 0.22 : 0.94 + rand() * 0.12);
        this.alturaRuina[w.idx(x, y)] = pr.alt * quebra;
        this.ruinas.push({
          x: x, y: y, rocha: pr.rocha,
          alt: pr.alt * quebra,
          tom: pr.tom * (0.94 + ((x * 7 + y * 13) % 5) * 0.03),
          janelas: pr.janelas, arrasado: pr.arrasado
        });
      }
    }
  };

  /* ------------------------------------------------------ quadro */
  Render.prototype.desenhar = function (dt) {
    var ctx = this.ctx, sim = this.sim;
    this.quadro++;
    if (this.anima) this.anima.avancar(sim, dt);
    var larg = this.cv.clientWidth, alt = this.cv.clientHeight;
    ctx.fillStyle = this.pal.ceu;
    ctx.fillRect(0, 0, larg, alt);

    /* As texturas chegam depois do primeiro quadro; quando chegam, repinta o
       chão uma vez. Sem isso a partida inteira ficaria com a cor chapada. */
    if (this.terrenoSemTextura && UF.sprites && UF.sprites.chaoPronto()) {
      this.prepararTerreno();
    }

    /* Chão: só o pedaço que aparece na tela é copiado, não o mapa inteiro. */
    var z = this.cam.zoom, d = this.deslocamentoTerreno, ct = this.cvTerreno;
    var sx0 = U.clamp((0 - this.cam.x) / z + d.x, 0, ct.width);
    var sx1 = U.clamp((larg - this.cam.x) / z + d.x, 0, ct.width);
    var sy0 = U.clamp((0 - this.cam.y) / z + d.y, 0, ct.height);
    var sy1 = U.clamp((alt - this.cam.y) / z + d.y, 0, ct.height);
    if (sx1 > sx0 && sy1 > sy0) {
      ctx.imageSmoothingEnabled = z < 1;
      ctx.drawImage(ct, sx0, sy0, sx1 - sx0, sy1 - sy0,
        (sx0 - d.x) * z + this.cam.x, (sy0 - d.y) * z + this.cam.y,
        (sx1 - sx0) * z, (sy1 - sy0) * z);
    }

    this.desenharGrade();

    var lista = this.montarListaDesenho();
    lista.sort(function (a, b) { return a.z - b.z; });
    for (var i = 0; i < lista.length; i++) lista[i].desenhar.call(this, ctx, lista[i]);

    this.desenharVultos(ctx);
    this.desenharProjeteis(ctx);
    this.desenharEfeitos(ctx, dt);
    this.desenharNevoa(ctx);
    this.desenharAreasDePerigo(ctx);
    this.desenharPrevia(ctx);
    this.desenharSelecao(ctx);
  };

  /* Vulto: o contorno da unidade aparecendo ATRAVÉS do prédio que a esconde.
     Em isométrico, quem está atrás de um prédio alto some — e some de verdade,
     não dá para clicar nem para saber que está lá. Todo RTS isométrico resolve
     assim, desenhando a silhueta por cima no fim do quadro. Só para as
     unidades do jogador: o inimigo escondido atrás de um prédio está escondido
     de propósito, faz parte do jogo. */
  Render.prototype.desenharVultos = function (ctx) {
    var sim = this.sim, w = sim.world, z = this.cam.zoom;
    for (var i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      if (u.lado !== 'aliado' || u.morta || u.voa) continue;
      if (!this.naTela(u.x, u.y)) continue;
      var ux = Math.floor(u.x), uy = Math.floor(u.y);
      /* o que cobre é o que está à FRENTE na diagonal da tela */
      var tapado = false;
      for (var d = 1; d <= 3 && !tapado; d++) {
        for (var k = 0; k <= d && !tapado; k++) {
          var cx = ux + k, cy = uy + (d - k);
          if (!w.dentro(cx, cy)) continue;
          var t = w.terreno[w.idx(cx, cy)];
          if (t !== T.RUINA && t !== T.ROCHA) continue;
          /* só conta se o prédio for alto o bastante para alcançar a unidade */
          if (this.alturaRuina[w.idx(cx, cy)] > d * ALT * 0.9) tapado = true;
        }
      }
      if (!tapado) continue;
      var p = this.paraTela(u.x, u.y);
      var h = 16 * z;
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#8ce07f';
      ctx.lineWidth = 1.6;
      ctx.fillStyle = 'rgba(20,30,22,0.55)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - h * 0.55, 4.4 * z, h * 0.55, 0, 0, 6.283);
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y - h * 1.25, 3 * z, 0, 6.283);
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  };

  /* Linhas de célula só perto do cursor/prévia: orienta sem poluir. */
  Render.prototype.desenharGrade = function () {
    if (!this.previa && !this.tracado) return;
    var ctx = this.ctx, w = this.sim.world;
    var foco = this.previa || { x: this.tracado.x0, y: this.tracado.y0 };
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.09)';
    ctx.lineWidth = 1;
    for (var dy = -7; dy <= 7; dy++) {
      for (var dx = -7; dx <= 7; dx++) {
        var x = Math.floor(foco.x) + dx, y = Math.floor(foco.y) + dy;
        if (!w.dentro(x, y)) continue;
        var p = this.paraTela(x, y);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + LARG / 2 * this.cam.zoom, p.y + ALT / 2 * this.cam.zoom);
        ctx.lineTo(p.x, p.y + ALT * this.cam.zoom);
        ctx.lineTo(p.x - LARG / 2 * this.cam.zoom, p.y + ALT / 2 * this.cam.zoom);
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  Render.prototype.naTela = function (wx, wy, margem) {
    var p = this.paraTela(wx, wy);
    margem = margem || 140;
    return p.x > -margem && p.x < this.cv.clientWidth + margem &&
      p.y > -margem * 1.6 && p.y < this.cv.clientHeight + margem;
  };

  Render.prototype.montarListaDesenho = function () {
    var sim = this.sim, lista = [], i;
    for (i = 0; i < this.ruinas.length; i++) {
      var r = this.ruinas[i];
      if (!this.naTela(r.x, r.y)) continue;
      if (!sim.world.explorado[sim.world.idx(r.x, r.y)]) continue;
      if (this.cobertas && this.cobertas[r.x + ',' + r.y]) continue;
      lista.push({ z: r.x + r.y, dado: r, desenhar: this.desenharRuina });
    }
    for (i = 0; this.destrocos && i < this.destrocos.length; i++) {
      var dz = this.destrocos[i];
      if (!this.naTela(dz.x, dz.y)) continue;
      if (!sim.world.explorado[sim.world.idx(dz.x, dz.y)]) continue;
      /* Construiu em cima? A sucata sai de cena: o prédio do jogador é o que
         importa ali, e um ônibus atravessando a parede só confunde. */
      if (sim.world.occ[sim.world.idx(dz.x, dz.y)] !== 0) continue;
      lista.push({ z: dz.x + dz.y + 0.3, dado: dz, desenhar: this.desenharDestroco });
    }
    for (i = 0; i < sim.world.jazidas.length; i++) {
      var j = sim.world.jazidas[i];
      if (!this.naTela(j.x, j.y)) continue;
      if (!sim.world.explorado[sim.world.idx(j.x, j.y)]) continue;
      lista.push({ z: j.x + j.y + 0.4, dado: j, desenhar: this.desenharJazida });
    }
    for (i = 0; i < sim.listaEstruturas.length; i++) {
      var b = sim.listaEstruturas[i];
      if (!this.naTela(b.x, b.y)) continue;
      if (!sim.world.explorado[sim.world.idx(b.x, b.y)]) continue;
      lista.push({ z: b.x + b.y + (b.w + b.h) / 2 - 0.5, dado: b, desenhar: this.desenharEstrutura });
    }
    for (i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      if (!this.naTela(u.x, u.y)) continue;
      /* Inimigo fora da visão some; o terreno já explorado continua visível. */
      if (u.lado === 'inimigo' && !sim.world.veCelula(Math.floor(u.x), Math.floor(u.y))) continue;
      lista.push({ z: u.x + u.y + (u.voa ? 0.6 : 0.2), dado: u, desenhar: this.desenharUnidade });
    }
    return lista;
  };

  /* --------------------------------------------------- blocos e caixas */
  Render.prototype.caixa = function (ctx, wx, wy, larguraCel, alturaCel, altura, cores) {
    var z = this.cam.zoom;
    var base = this.paraTela(wx, wy);
    var meiaL = LARG / 2 * z, meiaA = ALT / 2 * z;
    var h = altura * z;
    var oL = larguraCel, oA = alturaCel;
    /* cantos do retângulo ocupado, em coordenadas de tela */
    var n = this.paraTela(wx, wy);                       /* topo (norte) */
    var l = this.paraTela(wx + oL, wy);                  /* leste */
    var s = this.paraTela(wx + oL, wy + oA);             /* baixo (sul) */
    var o = this.paraTela(wx, wy + oA);                  /* oeste */

    ctx.beginPath();                                     /* face esquerda */
    ctx.moveTo(o.x, o.y); ctx.lineTo(s.x, s.y);
    ctx.lineTo(s.x, s.y - h); ctx.lineTo(o.x, o.y - h);
    ctx.closePath(); ctx.fillStyle = cores.esq; ctx.fill();

    ctx.beginPath();                                     /* face direita */
    ctx.moveTo(s.x, s.y); ctx.lineTo(l.x, l.y);
    ctx.lineTo(l.x, l.y - h); ctx.lineTo(s.x, s.y - h);
    ctx.closePath(); ctx.fillStyle = cores.dir; ctx.fill();

    ctx.beginPath();                                     /* topo */
    ctx.moveTo(n.x, n.y - h); ctx.lineTo(l.x, l.y - h);
    ctx.lineTo(s.x, s.y - h); ctx.lineTo(o.x, o.y - h);
    ctx.closePath(); ctx.fillStyle = cores.topo; ctx.fill();
    if (cores.contorno) { ctx.strokeStyle = cores.contorno; ctx.lineWidth = 1; ctx.stroke(); }
    return { n: n, l: l, s: s, o: o, h: h, meiaL: meiaL, meiaA: meiaA };
  };

  function sombrear(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    var b = Math.min(255, Math.round((n & 255) * f));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  Render.prototype.sombrear = sombrear;

  /* Pinta uma face do bloco com uma textura, encaixando a imagem no
     paralelogramo em vez de no retângulo. `drawImage` só sabe desenhar reto;
     a face isométrica é torta. A saída é mapear o quadrado unitário da textura
     nos dois vetores da face — o da largura e o da altura — com `transform`,
     e recortar antes para nada vazar para o vizinho.
     `repeticoes` existe porque esticar uma fachada de oito andares num prédio
     de trinta deixaria janelas do tamanho de portas: a textura se repete a
     cada tanto de altura, e o prédio alto ganha mais fileiras, não janelas
     maiores. */
  Render.prototype.faceTexturada = function (ctx, img, p0, vx, vy, hx, hy, repeticoes) {
    /* Sem `clip()` de propósito: o quadrado unitário da textura cai EXATAMENTE
       sobre o paralelogramo da face, então não há o que recortar — e recortar
       custava mais do que todo o resto do quadro junto (82 ms contra 13 ms). */
    ctx.save();
    ctx.transform(vx, vy, hx, hy, p0.x, p0.y);
    var n = Math.max(1, Math.round(repeticoes || 1));
    for (var i = 0; i < n; i++) ctx.drawImage(img, 0, i / n, 1, 1 / n + 0.002);
    ctx.restore();
  };

  /* Um prédio texturado é caro: são três faces, cada uma com um `transform` e
     uma ou mais cópias da imagem. Com setecentas ruínas na tela isso levou o
     quadro de 13 ms para 82 ms — o jogo ia a doze quadros por segundo.
     A saída é a de sempre em jogo isométrico: o prédio não muda nunca, então
     ele é desenhado UMA vez num canvas próprio e depois só copiado. A chave é
     a altura arredondada em degraus de quatro pixels e um de três níveis de
     tom; prédios diferentes que caem no mesmo degrau compartilham o mesmo
     desenho, e ninguém percebe. */
  Render.prototype.predioPronto = function (alt, tom, rocha) {
    if (!this.cachePredio) this.cachePredio = {};
    var passo = Math.max(1, Math.round(alt / 4));
    var nivel = Math.min(2, Math.max(0, Math.round((tom - 0.78) * 3)));
    var chave = passo + ':' + nivel + ':' + (rocha ? 'r' : 'p');
    var pronto = this.cachePredio[chave];
    if (pronto) return pronto;

    var h = passo * 4, pal = this.pal;
    var tomUsado = 0.82 + nivel * 0.17;
    var margem = 2;
    var cv = global.document.createElement('canvas');
    cv.width = LARG + margem * 2;
    cv.height = Math.ceil(h + ALT + margem * 2);
    var c = cv.getContext('2d');
    var base = rocha ? pal.rocha : pal.ruina;
    var topoCor = rocha ? pal.rocha : pal.ruinaTopo;
    /* cantos do losango da base, em coordenadas do canvas */
    var bx = margem, by = margem + h;
    var n = { x: bx + LARG / 2, y: by }, l = { x: bx + LARG, y: by + ALT / 2 };
    var sul = { x: bx + LARG / 2, y: by + ALT }, o = { x: bx, y: by + ALT / 2 };

    function face(p1, p2, cor) {
      c.beginPath();
      c.moveTo(p1.x, p1.y); c.lineTo(p2.x, p2.y);
      c.lineTo(p2.x, p2.y - h); c.lineTo(p1.x, p1.y - h);
      c.closePath(); c.fillStyle = cor; c.fill();
    }
    face(o, sul, sombrear(base, tomUsado * 0.52));
    face(sul, l, sombrear(base, tomUsado * 0.78));
    c.beginPath();
    c.moveTo(n.x, n.y - h); c.lineTo(l.x, l.y - h);
    c.lineTo(sul.x, sul.y - h); c.lineTo(o.x, o.y - h);
    c.closePath(); c.fillStyle = sombrear(topoCor, tomUsado); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 1; c.stroke();

    if (!rocha && UF.sprites) {
      var fach = UF.sprites.cenario('fachada');
      var lajeImg = UF.sprites.cenario('laje');
      var reps = Math.max(1, h / 46);
      if (fach) {
        c.globalAlpha = 0.82;
        this.faceTexturada(c, fach, { x: o.x, y: o.y - h }, sul.x - o.x, sul.y - o.y, 0, h, reps);
        c.globalAlpha = 0.6;
        this.faceTexturada(c, fach, { x: sul.x, y: sul.y - h }, l.x - sul.x, l.y - sul.y, 0, h, reps);
      }
      if (lajeImg) {
        c.globalAlpha = 0.8;
        this.faceTexturada(c, lajeImg, { x: n.x, y: n.y - h },
          l.x - n.x, l.y - n.y, o.x - n.x, o.y - n.y, 1);
      }
      c.globalAlpha = 1;
    }
    pronto = { cv: cv, h: h, margem: margem, temTextura: !rocha && !!(UF.sprites && UF.sprites.cenario('fachada')) };
    this.cachePredio[chave] = pronto;
    return pronto;
  };

  Render.prototype.desenharRuina = function (ctx, item) {
    var r = item.dado, pal = this.pal, z = this.cam.zoom;

    /* Enquanto a textura não chegou, o cache guardaria prédios sem ela para
       sempre. Por isso a lembrança é jogada fora na primeira vez em que a
       imagem aparece — uma vez só, não a cada quadro. */
    var temFachada = !!(UF.sprites && UF.sprites.cenario('fachada'));
    if (temFachada && !this.fachadaChegou) { this.cachePredio = {}; this.fachadaChegou = true; }

    var pronto = this.predioPronto(r.alt, r.tom, r.rocha);
    var base = this.paraTela(r.x, r.y);
    var larg = (LARG + pronto.margem * 2) * z;
    var altPx = pronto.cv.height * z;
    /* o canto oeste do losango da base cai no ponto (x, y) da célula */
    ctx.drawImage(pronto.cv,
      base.x - pronto.margem * z,
      base.y - (pronto.h + pronto.margem) * z,
      larg, altPx);

    if (r.janelas && pronto.temTextura === false && r.alt > 46 && z > 0.55) {
      /* Sem textura (imagem ausente), as fileiras de janela desenhadas à mão
         continuam sendo o que dá escala ao prédio. */
      var g = { s: this.paraTela(r.x + 1, r.y + 1), o: this.paraTela(r.x, r.y + 1),
        l: this.paraTela(r.x + 1, r.y), h: r.alt * z };
      var linhas = Math.max(1, Math.floor(r.alt / 12));
      for (var i = 0; i < linhas; i++) {
        var yy = g.s.y - g.h + 6 * z + i * 12 * z;
        if (yy > g.s.y - 4 * z) break;
        var acesa = ((r.x * 31 + r.y * 17 + i * 7) % 11) === 0;
        ctx.fillStyle = acesa ? 'rgba(255,208,130,0.42)' : 'rgba(10,13,18,0.38)';
        ctx.fillRect(g.o.x + 5 * z, yy, (g.s.x - g.o.x) - 10 * z, 3.4 * z);
      }
    }
  };

  Render.prototype.desenharDestroco = function (ctx, item) {
    var d = item.dado;
    var img = UF.sprites && UF.sprites.cenario(d.nome);
    if (!img) return;
    /* Apoiado no canto SUL da célula, como as estruturas: a borda de baixo da
       arte é a frente da peça, e é ela que tem de encostar no chão. */
    var leste = this.paraTela(d.x + d.cel, d.y);
    var oeste = this.paraTela(d.x, d.y + d.cel);
    var sul = this.paraTela(d.x + d.cel, d.y + d.cel);
    var larg = leste.x - oeste.x;
    var alt = img.height * (larg / img.width);
    ctx.drawImage(img, (leste.x + oeste.x) / 2 - larg / 2, sul.y - alt, larg, alt);
  };

  Render.prototype.desenharJazida = function (ctx, item) {
    var j = item.dado, z = this.cam.zoom;
    var vazia = j.estoque <= 0;
    var frac = j.estoqueMax ? j.estoque / j.estoqueMax : 0;

    /* Com sprite, a jazida MINGUA conforme é extraída. Não é enfeite: é a mesma
       informação que a caixa procedural dava pela altura, e é por ela que o
       jogador escolhe para onde mandar o próximo operário sem clicar em nada.
       Esgotada, sobra um toco cinzento — a rocha continua lá, o minério não. */
    var img = UF.sprites && UF.sprites.cenario(
      j.tipo === 'petroleo' ? 'jazida-petroleo' : 'jazida-mineral');
    if (img) {
      var cheia = 0.55 + 0.45 * (vazia ? 0 : 0.35 + frac * 0.65);
      var leste = this.paraTela(j.x + 2, j.y);
      var oeste = this.paraTela(j.x, j.y + 2);
      var sul = this.paraTela(j.x + 2, j.y + 2);
      var larg = (leste.x - oeste.x) * cheia;
      var alt = img.height * (larg / img.width);
      ctx.save();
      if (vazia) ctx.globalAlpha = 0.55;
      ctx.drawImage(img, (leste.x + oeste.x) / 2 - larg / 2, sul.y - alt, larg, alt);
      ctx.restore();
      return;
    }

    var cor = j.tipo === 'petroleo' ? '#2a2622' : '#d8b26a';
    if (vazia) cor = '#6a675e';
    var cores = { topo: sombrear(cor, 1), esq: sombrear(cor, 0.55), dir: sombrear(cor, 0.76) };
    var altura = 6 + 16 * (vazia ? 0.25 : 0.4 + frac * 0.6);
    this.caixa(ctx, j.x + 0.12, j.y + 0.12, 1.76, 1.76, altura, cores);
    /* Espelho de óleo pulsando no topo. Era um espinho de cristal apontando para
       cima; petróleo não cresce em ponta — aflora e reflete. O âmbar é o que
       identifica a jazida de longe, do mesmo jeito que o dourado identifica a
       de minério: a poça preta sozinha some no chão escuro. */
    if (j.tipo === 'petroleo' && !vazia) {
      var p = this.paraTela(j.x + 1, j.y + 1);
      ctx.save();
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(this.quadro / 18);
      ctx.fillStyle = '#e8a33d';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y - altura * z, 13 * z, 6.5 * z, 0, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ffd98a';
      ctx.beginPath();
      ctx.ellipse(p.x - 4 * z, p.y - (altura + 1) * z, 4 * z, 2 * z, 0, 0, 6.283);
      ctx.fill();
      ctx.restore();
    }
  };

  UF.Render = Render;
  UF.RENDER_LARG = LARG;
  UF.RENDER_ALT = ALT;
  UF.PALETAS = PALETAS;
})(typeof window !== 'undefined' ? window : globalThis);
