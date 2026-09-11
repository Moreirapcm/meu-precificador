/* Última Fronteira — apresentação isométrica em Canvas 2D.
   Só lê o estado da simulação. Nunca altera regras. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var T = D.TERRENO, ESTR = D.ESTRUTURAS;

  var LARG = 64, ALT = 32;          /* losango base de uma célula, em zoom 1 */

  /* Paleta por cidade: cada setor tem a cor do seu chão, da sua água e das ruínas. */
  var PALETAS = {
    porto:     { chao: '#414a41', chao2: '#4a534a', rua: '#555e55', agua: '#1c2a2b', aguaBrilho: '#2f4746', entulho: '#5b5a4c', ruina: '#736c58', ruinaTopo: '#877e68', rocha: '#4a4a42', ceu: '#0d1410' },
    costa:     { chao: '#464a50', chao2: '#4f545a', rua: '#585d63', agua: '#12303c', aguaBrilho: '#1d4c5c', entulho: '#5b5750', ruina: '#78716a', ruinaTopo: '#8a8279', rocha: '#3f4247', ceu: '#0a1016' },
    metropole: { chao: '#42454a', chao2: '#4a4d52', rua: '#54585e', agua: '#2b2a20', aguaBrilho: '#3e3b2b', entulho: '#57555a', ruina: '#6e6e74', ruinaTopo: '#808088', rocha: '#3c3e42', ceu: '#0b0d12' },
    deserto:   { chao: '#6b5c42', chao2: '#75654a', rua: '#7d6e53', agua: '#15384a', aguaBrilho: '#215a72', entulho: '#7a6a4f', ruina: '#8d7c5e', ruinaTopo: '#a08d6c', rocha: '#5d5340', ceu: '#161009' },
    ilha:      { chao: '#3f4348', chao2: '#474b51', rua: '#51565c', agua: '#0f2636', aguaBrilho: '#1a4059', entulho: '#53565b', ruina: '#697077', ruinaTopo: '#7b838a', rocha: '#383c41', ceu: '#080c12' },
    cratera:   { chao: '#5d5a4c', chao2: '#666254', rua: '#6f6b5c', agua: '#175a5c', aguaBrilho: '#22807f', entulho: '#6b6555', ruina: '#847c67', ruinaTopo: '#978e77', rocha: '#4f4b3e', ceu: '#100f0a' }
  };

  function Render(canvas, sim) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.sim = sim;
    this.pal = PALETAS[sim.setor.bioma] || PALETAS.metropole;
    this.cam = { x: 0, y: 0, zoom: 1 };
    this.efeitos = [];
    this.marcadores = [];
    this.previa = null;              /* prévia de construção */
    this.tracado = null;             /* prévia de muro por arraste */
    this.selecao = [];
    this.hover = null;
    this.quadro = 0;
    this.escalaDPR = 1;
    this.prepararRuinas();
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

    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        var t = w.terreno[w.idx(x, y)];
        if (t === T.RUINA) t = T.ESCOMBRO;      /* a base do prédio é entulho */
        var cor;
        if (t === T.AGUA) cor = pal.agua;
        else if (t === T.ESCOMBRO) cor = pal.entulho;
        else if (t === T.ROCHA) cor = pal.rocha;
        else cor = ((x + y) % 2) ? pal.chao : pal.chao2;
        var px = (x - y) * (LARG / 2) + dx, py = (x + y) * (ALT / 2) + dy;
        this.losango(c, px, py, cor);
        if (t === T.AGUA && rand() < 0.16) this.losango(c, px, py, pal.aguaBrilho, 0.5);
        if (t === T.ASFALTO && rand() < 0.05) this.losango(c, px, py, pal.rua, 0.5);
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
    this.cvTerreno = off;
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
        alt: rocha ? 9 + rand() * 14
          : arrasado ? 10 + rand() * 16
            : 26 + porte * 62 + rand() * 26,
        tom: 0.78 + rand() * 0.34,
        janelas: !rocha && !arrasado
      });
    }

    this.ruinas = [];
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
    var larg = this.cv.clientWidth, alt = this.cv.clientHeight;
    ctx.fillStyle = this.pal.ceu;
    ctx.fillRect(0, 0, larg, alt);

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

    this.desenharProjeteis(ctx);
    this.desenharEfeitos(ctx, dt);
    this.desenharNevoa(ctx);
    this.desenharAreasDePerigo(ctx);
    this.desenharPrevia(ctx);
    this.desenharSelecao(ctx);
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
      lista.push({ z: r.x + r.y, dado: r, desenhar: this.desenharRuina });
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

  Render.prototype.desenharRuina = function (ctx, item) {
    var r = item.dado, pal = this.pal;
    var base = r.rocha ? pal.rocha : pal.ruina;
    var topo = r.rocha ? pal.rocha : pal.ruinaTopo;
    var cores = {
      topo: sombrear(topo, r.tom),
      esq: sombrear(base, r.tom * 0.52),
      dir: sombrear(base, r.tom * 0.78),
      contorno: 'rgba(0,0,0,0.3)'
    };
    var alt = r.alt;
    var g = this.caixa(ctx, r.x, r.y, 1, 1, alt, cores);
    if (r.janelas && this.cam.zoom > 0.55) {
      var z = this.cam.zoom;
      var linhas = Math.max(1, Math.floor(alt / 12));
      for (var i = 0; i < linhas; i++) {
        var yy = g.s.y - g.h + 6 * z + i * 12 * z;
        if (yy > g.s.y - 4 * z) break;
        /* Uma janela em cada dez ainda tem luz: a cidade não morreu inteira. */
        var acesa = ((r.x * 31 + r.y * 17 + i * 7) % 11) === 0;
        ctx.fillStyle = acesa ? 'rgba(255,208,130,0.5)' : 'rgba(14,18,24,0.6)';
        ctx.fillRect(g.o.x + 5 * z, yy, (g.s.x - g.o.x) - 10 * z, 3.4 * z);
        ctx.fillStyle = acesa ? 'rgba(255,208,130,0.34)' : 'rgba(14,18,24,0.45)';
        ctx.fillRect(g.s.x + 5 * z, yy + 3.4 * z, (g.l.x - g.s.x) - 10 * z, 3.4 * z);
      }
    }
  };

  Render.prototype.desenharJazida = function (ctx, item) {
    var j = item.dado, z = this.cam.zoom;
    var vazia = j.estoque <= 0;
    var frac = j.estoqueMax ? j.estoque / j.estoqueMax : 0;
    var cor = j.tipo === 'cristal' ? '#7ee0ff' : '#d8b26a';
    if (vazia) cor = '#6a675e';
    var cores = { topo: sombrear(cor, 1), esq: sombrear(cor, 0.55), dir: sombrear(cor, 0.76) };
    var altura = 6 + 16 * (vazia ? 0.25 : 0.4 + frac * 0.6);
    this.caixa(ctx, j.x + 0.12, j.y + 0.12, 1.76, 1.76, altura, cores);
    if (j.tipo === 'cristal' && !vazia) {
      var p = this.paraTela(j.x + 1, j.y + 1);
      ctx.save();
      ctx.globalAlpha = 0.5 + 0.25 * Math.sin(this.quadro / 18);
      ctx.fillStyle = '#9df0ff';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - (altura + 16) * z);
      ctx.lineTo(p.x + 7 * z, p.y - (altura + 2) * z);
      ctx.lineTo(p.x, p.y - altura * z + 6 * z);
      ctx.lineTo(p.x - 7 * z, p.y - (altura + 2) * z);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  };

  UF.Render = Render;
  UF.RENDER_LARG = LARG;
  UF.RENDER_ALT = ALT;
  UF.PALETAS = PALETAS;
})(typeof window !== 'undefined' ? window : globalThis);
