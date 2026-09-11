/* Última Fronteira — apresentação: estruturas, unidades, efeitos, névoa e minimapa. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var T = D.TERRENO;
  var LARG = UF.RENDER_LARG, ALT = UF.RENDER_ALT;
  var Render = UF.Render, R = Render.prototype;
  var sombrear = R.sombrear;

  /* Cor e altura de cada tipo de estrutura. */
  var VISUAL = {
    central:    { cor: '#4f7fb5', alt: 46, teto: '#7fb6e8' },
    alojamento: { cor: '#55707f', alt: 24, teto: '#7fa3b5' },
    gerador:    { cor: '#6a5f86', alt: 26, teto: '#a68fd8' },
    deposito:   { cor: '#6b6a4f', alt: 22, teto: '#a9a578' },
    quartel:    { cor: '#5c6b4c', alt: 30, teto: '#8fa878' },
    oficina:    { cor: '#6b5b45', alt: 32, teto: '#a88f6b' },
    pesquisa:   { cor: '#4c6472', alt: 30, teto: '#84b8cc' },
    extrator:   { cor: '#3f6a72', alt: 24, teto: '#6fd4dd' },
    radar:      { cor: '#4a5a6b', alt: 22, teto: '#8fb0cc' },
    muro:       { cor: '#6e6a60', alt: 20, teto: '#8c877a' },
    portao:     { cor: '#7a6a4a', alt: 20, teto: '#b39a62' },
    sentinela:  { cor: '#4a6a78', alt: 26, teto: '#7fd7ff' },
    gelo:       { cor: '#4a6c76', alt: 26, teto: '#9ff0ff' },
    artilharia: { cor: '#6b5a42', alt: 24, teto: '#ffb457' },
    plasma:     { cor: '#5a4a70', alt: 28, teto: '#d79bff' }
  };

  R.desenharEstrutura = function (ctx, item) {
    var b = item.dado, z = this.cam.zoom, v = VISUAL[b.tipo] || VISUAL.muro;
    var vivo = b.hp / b.hpMax;
    var emObra = !b.construida;
    var tom = emObra ? 0.55 : (b.abandonado ? 0.5 : 1);
    var cor = b.morta ? '#3a3630' : v.cor;

    var altura = v.alt * (emObra ? 0.25 + 0.75 * b.obra : 1);
    if (b.portao) altura = b.portaoAberto ? 7 : v.alt;

    var cores = {
      topo: sombrear(cor, 1.18 * tom),
      esq: sombrear(cor, 0.6 * tom),
      dir: sombrear(cor, 0.86 * tom),
      contorno: b.morta ? null : 'rgba(0,0,0,0.28)'
    };
    var g = this.caixa(ctx, b.x + 0.06, b.y + 0.06, b.w - 0.12, b.h - 0.12, altura, cores);

    /* Telhado colorido identifica a função à distância. */
    if (!emObra && !b.portao && !b.muro) {
      ctx.globalAlpha = b.abandonado ? 0.25 : 0.55;
      ctx.fillStyle = v.teto;
      ctx.beginPath();
      var enc = 0.3;
      var n = this.paraTela(b.x + b.w * enc, b.y + b.h * enc);
      var l = this.paraTela(b.x + b.w * (1 - enc), b.y + b.h * enc);
      var s = this.paraTela(b.x + b.w * (1 - enc), b.y + b.h * (1 - enc));
      var o = this.paraTela(b.x + b.w * enc, b.y + b.h * (1 - enc));
      ctx.moveTo(n.x, n.y - g.h); ctx.lineTo(l.x, l.y - g.h);
      ctx.lineTo(s.x, s.y - g.h); ctx.lineTo(o.x, o.y - g.h);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (!emObra) this.detalharEstrutura(ctx, b, g, v);

    /* Torres ganham um canhão que aponta para o alvo. */
    if (b.torre && !emObra) {
      var centro = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      var topoY = centro.y - g.h - 4 * z;
      var alvo = b.alvo && this.sim.alvoPorId(b.alvo);
      var ang = -0.6;
      if (alvo && !alvo.morta) {
        var c = this.sim.centroDe(alvo);
        var pa = this.paraTela(c.x, c.y);
        ang = Math.atan2(pa.y - topoY, pa.x - centro.x);
      }
      ctx.save();
      ctx.translate(centro.x, topoY);
      ctx.rotate(ang);
      ctx.fillStyle = b.semEnergia ? '#5a5a5a' : v.teto;
      ctx.fillRect(0, -2.2 * z, 15 * z, 4.4 * z);
      ctx.restore();
      ctx.fillStyle = b.semEnergia ? '#4a4a4a' : sombrear(v.teto, 0.8);
      ctx.beginPath(); ctx.arc(centro.x, topoY, 5 * z, 0, 6.283); ctx.fill();
      if (b.semEnergia) this.icone(ctx, centro.x, topoY - 16 * z, '#ffcf5a', 'ϟ');
    }

    if (b.tipo === 'radar' && !emObra) {
      var cr = this.paraTela(b.x + 1, b.y + 1);
      ctx.save();
      ctx.strokeStyle = 'rgba(150,200,255,0.5)';
      ctx.lineWidth = 1.6 * z;
      ctx.beginPath();
      ctx.arc(cr.x, cr.y - g.h - 6 * z, 9 * z, this.quadro / 14, this.quadro / 14 + 1.4);
      ctx.stroke();
      ctx.restore();
    }

    if (emObra) {
      this.barra(ctx, b, b.obra, '#ffd479', b.abandonado ? 'REATIVAR' : null);
    } else if (vivo < 0.999) {
      this.barra(ctx, b, vivo, vivo > 0.5 ? '#8ce07f' : vivo > 0.25 ? '#ffd479' : '#ff7a6b');
    }

    if (!emObra && vivo < 0.55 && this.quadro % 3 === 0) {
      var cf = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      this.efeitos.push({ tipo: 'fumaca', x: cf.x + (Math.random() - 0.5) * 16 * z, y: cf.y - g.h, vida: 1.4, max: 1.4 });
    }
    if (b.fila && b.fila.length && !emObra) {
      var cp = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      this.icone(ctx, cp.x, cp.y - g.h - 20 * z, '#9fe0ff', '▲');
    }
  };

  /* Detalhes que dão função visível a cada prédio (página 20 do documento). */
  R.detalharEstrutura = function (ctx, b, g, v) {
    var z = this.cam.zoom;
    if (z < 0.5) return;
    var c = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
    var topoY = c.y - g.h;

    if (b.tipo === 'central') {
      /* mastro com luz de sinalização e plataforma */
      ctx.strokeStyle = '#9fc8ea'; ctx.lineWidth = 2 * z;
      ctx.beginPath(); ctx.moveTo(c.x, topoY); ctx.lineTo(c.x, topoY - 26 * z); ctx.stroke();
      ctx.fillStyle = 'rgba(255,110,120,' + (0.45 + 0.45 * Math.sin(this.quadro / 16)) + ')';
      ctx.beginPath(); ctx.arc(c.x, topoY - 28 * z, 3.4 * z, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.4 * z;
      ctx.beginPath();
      ctx.moveTo(c.x - 22 * z, topoY); ctx.lineTo(c.x, topoY - 11 * z);
      ctx.lineTo(c.x + 22 * z, topoY); ctx.lineTo(c.x, topoY + 11 * z);
      ctx.closePath(); ctx.stroke();
    } else if (b.tipo === 'gerador') {
      ctx.fillStyle = b.semEnergia ? '#55506a' : 'rgba(190,150,255,' + (0.5 + 0.4 * Math.sin(this.quadro / 9)) + ')';
      ctx.beginPath(); ctx.arc(c.x, topoY - 3 * z, 6 * z, 0, 6.283); ctx.fill();
    } else if (b.tipo === 'deposito' || b.tipo === 'alojamento') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(c.x - 11 * z, topoY - 2 * z, 22 * z, 3 * z);
    } else if (b.tipo === 'quartel' || b.tipo === 'oficina') {
      ctx.fillStyle = v.teto;
      ctx.fillRect(c.x - 12 * z, topoY - 4 * z, 24 * z, 2.4 * z);
      ctx.fillRect(c.x - 2 * z, topoY - 12 * z, 4 * z, 9 * z);
    } else if (b.tipo === 'pesquisa') {
      ctx.strokeStyle = 'rgba(160,220,255,0.65)'; ctx.lineWidth = 1.6 * z;
      ctx.beginPath(); ctx.arc(c.x, topoY - 6 * z, 8 * z, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(160,220,255,0.8)';
      ctx.beginPath(); ctx.arc(c.x + Math.cos(this.quadro / 12) * 8 * z, topoY - 6 * z + Math.sin(this.quadro / 12) * 4 * z, 2 * z, 0, 6.283); ctx.fill();
    } else if (b.tipo === 'extrator') {
      ctx.fillStyle = 'rgba(120,230,240,' + (0.4 + 0.4 * Math.sin(this.quadro / 7)) + ')';
      ctx.beginPath();
      ctx.moveTo(c.x, topoY - 16 * z); ctx.lineTo(c.x + 5 * z, topoY - 2 * z);
      ctx.lineTo(c.x - 5 * z, topoY - 2 * z); ctx.closePath(); ctx.fill();
    } else if (b.portao) {
      ctx.fillStyle = b.portaoAberto ? 'rgba(140,224,127,0.8)' : 'rgba(255,180,90,0.85)';
      ctx.fillRect(c.x - 8 * z, topoY - 3 * z, 16 * z, 2.6 * z);
    } else if (b.muro) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(c.x - 9 * z, topoY - 1 * z, 18 * z, 2 * z);
    }
  };

  /* Barra de vida/obra flutuando sobre a estrutura. */
  R.barra = function (ctx, ent, frac, cor, rotulo) {
    var z = this.cam.zoom;
    var meio = ent.w ? this.paraTela(ent.x + ent.w / 2, ent.y + ent.h / 2) : this.paraTela(ent.x, ent.y);
    var larg = (ent.w ? 30 + ent.w * 6 : 22) * z;
    var y = meio.y - (ent.w ? (32 + ent.w * 7) : 26) * z;
    ctx.fillStyle = 'rgba(6,10,16,0.72)';
    ctx.fillRect(meio.x - larg / 2, y, larg, 4.4 * z);
    ctx.fillStyle = cor;
    ctx.fillRect(meio.x - larg / 2, y, larg * U.clamp(frac, 0, 1), 4.4 * z);
    if (rotulo && z > 0.6) {
      ctx.fillStyle = '#ffd479';
      ctx.font = (7 * z).toFixed(1) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rotulo, meio.x, y - 3 * z);
      ctx.textAlign = 'left';
    }
  };

  R.icone = function (ctx, x, y, cor, texto) {
    var z = this.cam.zoom;
    if (z < 0.5) return;
    ctx.fillStyle = cor;
    ctx.font = 'bold ' + (11 * z).toFixed(1) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(texto, x, y);
    ctx.textAlign = 'left';
  };

  /* ------------------------------------------------------------ unidades */
  var CORES_UNIDADE = {
    operario: '#ffd479', fuzileiro: '#cfe6ff', incendiario: '#ff9a5c',
    medico: '#9fffd0', lanceiro: '#b8f0d0', drone: '#8fd9ff', tanque: '#ffd27f'
  };

  R.desenharUnidade = function (ctx, item) {
    var u = item.dado, z = this.cam.zoom;
    var p = this.paraTela(u.x, u.y);
    var inimigo = u.lado === 'inimigo';
    var cor = inimigo ? u.def.cor : (CORES_UNIDADE[u.tipo] || '#dfe6ee');
    var raio = (u.def.raio || 0.3) * LARG * 0.5 * z;
    var voo = u.voa ? 26 * z : 0;

    if (u.morta) {
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = inimigo ? '#5a2a2a' : '#40464e';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, raio * 1.2, raio * 0.6, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    /* sombra no chão */
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2 * z, raio * (u.voa ? 0.7 : 0.95), raio * (u.voa ? 0.34 : 0.46), 0, 0, 6.283);
    ctx.fill();

    var balanco = u.rota ? Math.sin(this.quadro / 4 + u.animacao) * 1.4 * z : 0;
    var topo = p.y - voo - raio * 1.5 - balanco;

    if (u.voa) {                                     /* asas */
      ctx.strokeStyle = sombrear(cor, 0.8);
      ctx.lineWidth = 2 * z;
      var abre = Math.sin(this.quadro / 2.2 + u.animacao) * raio * 0.7;
      ctx.beginPath();
      ctx.moveTo(p.x - raio * 1.8, p.y - voo - abre);
      ctx.lineTo(p.x, p.y - voo - raio * 0.5);
      ctx.lineTo(p.x + raio * 1.8, p.y - voo - abre);
      ctx.stroke();
    }

    /* corpo */
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(p.x, topo);
    ctx.lineTo(p.x + raio, p.y - voo - raio * 0.35);
    ctx.lineTo(p.x, p.y - voo + raio * 0.3);
    ctx.lineTo(p.x - raio, p.y - voo - raio * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sombrear(cor, 0.62);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - voo + raio * 0.3);
    ctx.lineTo(p.x + raio, p.y - voo - raio * 0.35);
    ctx.lineTo(p.x + raio * 0.5, p.y - voo + raio * 0.1);
    ctx.closePath();
    ctx.fill();

    if (u.def.chefe) {
      ctx.strokeStyle = 'rgba(255,80,150,' + (0.4 + 0.3 * Math.sin(this.quadro / 9)) + ')';
      ctx.lineWidth = 2.4 * z;
      ctx.beginPath(); ctx.arc(p.x, p.y - voo, raio * 2.1, 0, 6.283); ctx.stroke();
    }

    if (u.carga > 0) this.icone(ctx, p.x, topo - 5 * z, u.cargaTipo === 'cristal' ? '#7ee0ff' : '#ffd479', '◆');
    if (u.tarefa && u.tarefa.tipo === 'fugindo') this.icone(ctx, p.x, topo - 5 * z, '#ff9a6b', '!');
    else if (u.bloqueado) this.icone(ctx, p.x, topo - 5 * z, '#ff7a6b', '⊘');
    else if (u.operario && u.tarefa && u.tarefa.tipo === 'ocioso') this.icone(ctx, p.x, topo - 5 * z, '#9aa6b5', 'z');

    if (u.hp < u.hpMax) {
      var frac = u.hp / u.hpMax, larg = raio * 2.4;
      ctx.fillStyle = 'rgba(6,10,16,0.72)';
      ctx.fillRect(p.x - larg / 2, topo - 12 * z, larg, 3.2 * z);
      ctx.fillStyle = inimigo ? '#ff6b6b' : (frac > 0.5 ? '#8ce07f' : '#ffd479');
      ctx.fillRect(p.x - larg / 2, topo - 12 * z, larg * frac, 3.2 * z);
    }
    if (this.sim.alvoPrioritario === u.id) {
      ctx.strokeStyle = '#ff5d7a'; ctx.lineWidth = 2 * z;
      ctx.beginPath(); ctx.arc(p.x, p.y - voo, raio * 1.9, 0, 6.283); ctx.stroke();
    }
  };

  /* ---------------------------------------------------------- projéteis */
  R.desenharProjeteis = function (ctx) {
    var z = this.cam.zoom;
    for (var i = 0; i < this.sim.projeteis.length; i++) {
      var p = this.sim.projeteis[i];
      var t = this.paraTela(p.x, p.y);
      ctx.fillStyle = p.cor || '#ffd7a0';
      ctx.beginPath();
      ctx.arc(t.x, t.y - 12 * z, (p.area ? 3.4 : 2.2) * z, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.beginPath(); ctx.arc(t.x, t.y - 12 * z, (p.area ? 6 : 4) * z, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  /* ------------------------------------------------------------ efeitos */
  R.consumirEventos = function () {
    var ev = this.sim.eventos;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.tipo === 'explosao') {
        var p = this.paraTela(e.x, e.y);
        this.efeitos.push({ tipo: 'explosao', x: p.x, y: p.y, raio: e.raio * LARG * 0.5, vida: 0.55, max: 0.55, grande: e.grande });
      } else if (e.tipo === 'impacto') {
        var q = this.paraTela(e.x, e.y);
        this.efeitos.push({ tipo: 'faisca', x: q.x, y: q.y - 10, cor: e.cor, vida: 0.25, max: 0.25 });
      } else if (e.tipo === 'entrega') {
        this.marcadores.push({ texto: '+' + e.qtd, cor: e.tipo === 'cristal' ? '#7ee0ff' : '#ffd479', vida: 1 });
      } else if (e.tipo === 'estruturaDestruida') {
        var r = this.paraTela(e.x + e.w / 2, e.y + e.h / 2);
        this.efeitos.push({ tipo: 'explosao', x: r.x, y: r.y, raio: 26 * (e.w || 1), vida: 0.7, max: 0.7 });
      } else if (e.tipo === 'cura') {
        var c = this.paraTela(e.x, e.y);
        this.efeitos.push({ tipo: 'cura', x: c.x, y: c.y - 14, vida: 0.5, max: 0.5 });
      }
    }
    ev.length = 0;
  };

  R.desenharEfeitos = function (ctx, dt) {
    var z = this.cam.zoom;
    for (var i = this.efeitos.length - 1; i >= 0; i--) {
      var e = this.efeitos[i];
      e.vida -= dt;
      if (e.vida <= 0) { this.efeitos.splice(i, 1); continue; }
      var t = e.vida / e.max;
      if (e.tipo === 'explosao') {
        ctx.globalAlpha = t * 0.85;
        var grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.raio * z * (1.6 - t));
        grad.addColorStop(0, e.grande ? '#fff6d0' : '#ffd08a');
        grad.addColorStop(0.5, '#ff8a3c');
        grad.addColorStop(1, 'rgba(255,90,40,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.raio * z * (1.6 - t), 0, 6.283); ctx.fill();
      } else if (e.tipo === 'faisca') {
        ctx.globalAlpha = t;
        ctx.fillStyle = e.cor || '#ffe7b0';
        ctx.beginPath(); ctx.arc(e.x, e.y, 4 * z * t + 1, 0, 6.283); ctx.fill();
      } else if (e.tipo === 'fumaca') {
        ctx.globalAlpha = t * 0.32;
        ctx.fillStyle = '#9aa2ad';
        ctx.beginPath(); ctx.arc(e.x, e.y - (1 - t) * 22 * z, (5 + (1 - t) * 9) * z, 0, 6.283); ctx.fill();
      } else if (e.tipo === 'cura') {
        ctx.globalAlpha = t;
        ctx.fillStyle = '#9fffd0';
        ctx.font = (12 * z).toFixed(0) + 'px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('✚', e.x, e.y - (1 - t) * 16 * z);
        ctx.textAlign = 'left';
      }
      ctx.globalAlpha = 1;
    }
    if (this.efeitos.length > 220) this.efeitos.splice(0, this.efeitos.length - 220);
  };

  /* -------------------------------------------------------------- névoa */
  R.desenharNevoa = function (ctx) {
    var w = this.sim.world, z = this.cam.zoom;
    var cantoA = this.paraMundo(-LARG, -ALT * 4);
    var cantoB = this.paraMundo(this.cv.clientWidth + LARG, this.cv.clientHeight + ALT * 4);
    var cantoC = this.paraMundo(this.cv.clientWidth + LARG, -ALT * 4);
    var cantoD = this.paraMundo(-LARG, this.cv.clientHeight + ALT * 4);
    var x0 = Math.max(0, Math.floor(Math.min(cantoA.x, cantoB.x, cantoC.x, cantoD.x)) - 1);
    var x1 = Math.min(w.w - 1, Math.ceil(Math.max(cantoA.x, cantoB.x, cantoC.x, cantoD.x)) + 1);
    var y0 = Math.max(0, Math.floor(Math.min(cantoA.y, cantoB.y, cantoC.y, cantoD.y)) - 1);
    var y1 = Math.min(w.h - 1, Math.ceil(Math.max(cantoA.y, cantoB.y, cantoC.y, cantoD.y)) + 1);

    var desconhecido = new Path2D(), sombra = new Path2D();
    var achouDesc = false, achouSom = false;
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var i = w.idx(x, y);
        if (w.visivel[i]) continue;
        var p = this.paraTela(x, y);
        var caminho = w.explorado[i] ? sombra : desconhecido;
        if (w.explorado[i]) achouSom = true; else achouDesc = true;
        caminho.moveTo(p.x, p.y);
        caminho.lineTo(p.x + LARG / 2 * z, p.y + ALT / 2 * z);
        caminho.lineTo(p.x, p.y + ALT * z);
        caminho.lineTo(p.x - LARG / 2 * z, p.y + ALT / 2 * z);
        caminho.closePath();
      }
    }
    if (achouSom) { ctx.fillStyle = 'rgba(4,7,12,0.46)'; ctx.fill(sombra); }
    if (achouDesc) { ctx.fillStyle = 'rgba(4,6,10,0.97)'; ctx.fill(desconhecido); }
  };

  /* Áreas marcadas: bombardeio a caminho, escudo e zonas de invasão. */
  R.desenharAreasDePerigo = function (ctx) {
    var z = this.cam.zoom, i;
    for (i = 0; i < this.sim.bombardeios.length; i++) {
      var b = this.sim.bombardeios[i];
      var p = this.paraTela(b.x, b.y);
      var t = U.clamp(1 - b.em / 1.8, 0, 1);
      ctx.save();
      ctx.translate(p.x, p.y); ctx.scale(1, ALT / LARG);
      ctx.strokeStyle = 'rgba(255,120,60,0.9)'; ctx.lineWidth = 2.4 * z;
      ctx.beginPath(); ctx.arc(0, 0, b.raio * LARG * 0.5 * z, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,60,' + (0.1 + 0.18 * t) + ')';
      ctx.beginPath(); ctx.arc(0, 0, b.raio * LARG * 0.5 * z * t, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    if (this.sim.escudo) {
      var e = this.sim.escudo, pe = this.paraTela(e.x, e.y);
      ctx.save();
      ctx.translate(pe.x, pe.y); ctx.scale(1, ALT / LARG);
      ctx.strokeStyle = 'rgba(130,200,255,0.75)'; ctx.lineWidth = 2.6 * z;
      ctx.beginPath(); ctx.arc(0, 0, e.raio * LARG * 0.5 * z, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(130,200,255,0.1)'; ctx.fill();
      ctx.restore();
    }
    if (this.sim.onda.estado === 'preparo' || this.sim.fase === 'colocacao') {
      for (i = 0; i < this.sim.world.entradas.length; i++) {
        var en = this.sim.world.entradas[i];
        var pi = this.paraTela(en.x, en.y);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.2 * Math.sin(this.quadro / 20 + i);
        ctx.strokeStyle = '#ff5d7a'; ctx.lineWidth = 2 * z;
        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y); ctx.lineTo(pi.x + LARG / 2 * z, pi.y + ALT / 2 * z);
        ctx.lineTo(pi.x, pi.y + ALT * z); ctx.lineTo(pi.x - LARG / 2 * z, pi.y + ALT / 2 * z);
        ctx.closePath(); ctx.stroke();
        ctx.restore();
        this.icone(ctx, pi.x, pi.y - 6 * z, '#ff8fa3', '▼');
      }
    }
  };

  /* ------------------------------------------------- prévia de construção */
  R.desenharPrevia = function (ctx) {
    var z = this.cam.zoom, i;
    if (this.tracado) {
      for (i = 0; i < this.tracado.plano.celulas.length; i++) {
        var c = this.tracado.plano.celulas[i];
        this.marcarCelula(ctx, c.x, c.y, c.ok ? 'rgba(120,230,140,0.45)' : 'rgba(255,90,90,0.4)');
      }
      return;
    }
    if (!this.previa) return;
    var pv = this.previa, def = D.ESTRUTURAS[pv.tipo];
    var ok = pv.valido;
    for (var dy = 0; dy < def.h; dy++) {
      for (var dx = 0; dx < def.w; dx++) {
        this.marcarCelula(ctx, pv.x + dx, pv.y + dy, ok ? 'rgba(120,230,140,0.4)' : 'rgba(255,90,90,0.38)');
      }
    }
    var v = VISUAL[pv.tipo] || VISUAL.muro;
    ctx.globalAlpha = 0.5;
    this.caixa(ctx, pv.x + 0.06, pv.y + 0.06, def.w - 0.12, def.h - 0.12, v.alt,
      { topo: ok ? sombrear(v.cor, 1.2) : '#a64c4c', esq: ok ? sombrear(v.cor, 0.6) : '#6e3030', dir: ok ? sombrear(v.cor, 0.85) : '#8a3c3c' });
    ctx.globalAlpha = 1;
    /* alcance da torre em prévia */
    if (def.arma) {
      var centro = this.paraTela(pv.x + def.w / 2, pv.y + def.h / 2);
      ctx.save();
      ctx.translate(centro.x, centro.y); ctx.scale(1, ALT / LARG);
      ctx.strokeStyle = 'rgba(160,220,255,0.55)'; ctx.lineWidth = 1.6 * z;
      ctx.setLineDash([6 * z, 5 * z]);
      ctx.beginPath(); ctx.arc(0, 0, def.arma.alc * LARG * 0.5 * z, 0, 6.283); ctx.stroke();
      ctx.restore();
    }
  };

  R.marcarCelula = function (ctx, x, y, cor) {
    var z = this.cam.zoom, p = this.paraTela(x, y);
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + LARG / 2 * z, p.y + ALT / 2 * z);
    ctx.lineTo(p.x, p.y + ALT * z);
    ctx.lineTo(p.x - LARG / 2 * z, p.y + ALT / 2 * z);
    ctx.closePath(); ctx.fill();
  };

  R.desenharSelecao = function (ctx) {
    var z = this.cam.zoom;
    for (var i = 0; i < this.selecao.length; i++) {
      var e = this.sim.alvoPorId(this.selecao[i]);
      if (!e || e.morta) continue;
      ctx.strokeStyle = '#8ce07f'; ctx.lineWidth = 2 * z;
      if (e.w) {
        var n = this.paraTela(e.x, e.y), l = this.paraTela(e.x + e.w, e.y);
        var s = this.paraTela(e.x + e.w, e.y + e.h), o = this.paraTela(e.x, e.y + e.h);
        ctx.beginPath();
        ctx.moveTo(n.x, n.y); ctx.lineTo(l.x, l.y); ctx.lineTo(s.x, s.y); ctx.lineTo(o.x, o.y);
        ctx.closePath(); ctx.stroke();
        if (e.rally) {
          var pr = this.paraTela(e.rally.x + 0.5, e.rally.y + 0.5);
          ctx.setLineDash([5 * z, 4 * z]);
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(pr.x, pr.y); ctx.stroke();
          ctx.setLineDash([]);
          this.icone(ctx, pr.x, pr.y, '#8ce07f', '⚑');
        }
      } else {
        var p = this.paraTela(e.x, e.y);
        ctx.save();
        ctx.translate(p.x, p.y); ctx.scale(1, ALT / LARG);
        ctx.beginPath(); ctx.arc(0, 0, 15 * z, 0, 6.283); ctx.stroke();
        ctx.restore();
      }
    }
  };

  /* ------------------------------------------------------------ minimapa */
  R.desenharMinimapa = function (mini) {
    var w = this.sim.world, ctx = mini.getContext('2d');
    var lado = mini.width;
    var esc = lado / Math.max(w.w, w.h);
    if (!this.cvMini) {
      var off = global.document.createElement('canvas');
      off.width = w.w; off.height = w.h;
      var c = off.getContext('2d');
      var img = c.createImageData(w.w, w.h);
      var pal = this.pal;
      function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
      var cores = { 0: rgb(pal.chao), 1: rgb(pal.rocha), 2: rgb(pal.agua), 3: rgb(pal.entulho), 4: rgb(pal.ruina) };
      for (var i = 0; i < w.n; i++) {
        var cor = cores[w.terreno[i]] || cores[0];
        img.data[i * 4] = cor[0]; img.data[i * 4 + 1] = cor[1]; img.data[i * 4 + 2] = cor[2]; img.data[i * 4 + 3] = 255;
      }
      c.putImageData(img, 0, 0);
      this.cvMini = off;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, lado, lado);
    ctx.drawImage(this.cvMini, 0, 0, lado, lado);

    /* névoa */
    ctx.fillStyle = 'rgba(3,5,9,0.86)';
    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        if (!w.explorado[w.idx(x, y)]) ctx.fillRect(x * esc, y * esc, esc + 0.6, esc + 0.6);
      }
    }
    var i2;
    for (i2 = 0; i2 < w.jazidas.length; i2++) {
      var j = w.jazidas[i2];
      if (!w.explorado[w.idx(j.x, j.y)] || j.estoque <= 0) continue;
      ctx.fillStyle = j.tipo === 'cristal' ? '#7ee0ff' : '#d8b26a';
      ctx.fillRect(j.x * esc, j.y * esc, esc * 2, esc * 2);
    }
    for (i2 = 0; i2 < this.sim.listaEstruturas.length; i2++) {
      var b = this.sim.listaEstruturas[i2];
      if (b.morta) continue;
      ctx.fillStyle = b === this.sim.central ? '#7fb6e8' : (b.torre ? '#8ce07f' : '#c8d2de');
      ctx.fillRect(b.x * esc, b.y * esc, Math.max(2, b.w * esc), Math.max(2, b.h * esc));
    }
    for (i2 = 0; i2 < this.sim.unidades.length; i2++) {
      var u = this.sim.unidades[i2];
      if (u.morta) continue;
      if (u.lado === 'inimigo' && !w.veCelula(Math.floor(u.x), Math.floor(u.y))) continue;
      ctx.fillStyle = u.lado === 'inimigo' ? '#ff5d5d' : (u.operario ? '#ffd479' : '#9fe0ff');
      ctx.fillRect(u.x * esc - 1, u.y * esc - 1, 2.6, 2.6);
    }
    /* retângulo da câmera */
    var a = this.paraMundo(0, 0), bb = this.paraMundo(this.cv.clientWidth, this.cv.clientHeight);
    var cc = this.paraMundo(this.cv.clientWidth, 0), dd = this.paraMundo(0, this.cv.clientHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x * esc, a.y * esc); ctx.lineTo(cc.x * esc, cc.y * esc);
    ctx.lineTo(bb.x * esc, bb.y * esc); ctx.lineTo(dd.x * esc, dd.y * esc);
    ctx.closePath(); ctx.stroke();
  };

  UF.VISUAL_ESTRUTURA = VISUAL;
})(typeof window !== 'undefined' ? window : globalThis);
