/* Última Fronteira — mapa estratégico: a Terra de verdade.
   Contorno dos continentes em projeção equiretangular, com os setores
   marcados nas coordenadas reais de cada cidade. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };

  function MapaMundo(jogo) {
    this.jogo = jogo;
    this.cv = $('mapaMundo');
    this.ctx = this.cv.getContext('2d');
    this.selecionado = D.SETORES[0];
    this.hover = null;
    this.quadro = 0;
    this.ligar();
  }

  MapaMundo.prototype.ligar = function () {
    var self = this;
    function localDoEvento(e) {
      var r = self.cv.getBoundingClientRect();
      return { x: (e.clientX - r.left), y: (e.clientY - r.top) };
    }
    this.cv.addEventListener('pointermove', function (e) {
      var p = localDoEvento(e);
      self.hover = self.setorEm(p);
      self.cv.style.cursor = self.hover ? 'pointer' : 'default';
    });
    this.cv.addEventListener('pointerdown', function (e) {
      var p = localDoEvento(e);
      var s = self.setorEm(p);
      if (s) { self.selecionar(s); UF.audio.acordar(); UF.audio.evento('clique'); }
    });
    global.addEventListener('resize', function () { self.redimensionar(); });
  };

  MapaMundo.prototype.redimensionar = function () {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(this.cv.clientWidth * dpr);
    this.cv.height = Math.round(this.cv.clientHeight * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.calcularEnquadramento();
  };

  /* Enquadra o mundo inteiro mantendo a proporção 2:1 da projeção. */
  MapaMundo.prototype.calcularEnquadramento = function () {
    var larg = this.cv.clientWidth, alt = this.cv.clientHeight;
    var escala = Math.min(larg / 360, alt / 180) * 0.94;
    this.esc = escala;
    this.deslX = (larg - 360 * escala) / 2;
    this.deslY = (alt - 180 * escala) / 2;
  };

  MapaMundo.prototype.pontoDe = function (lat, lon) {
    return { x: this.deslX + (lon + 180) * this.esc, y: this.deslY + (90 - lat) * this.esc };
  };

  MapaMundo.prototype.setorEm = function (p) {
    for (var i = 0; i < D.SETORES.length; i++) {
      var s = D.SETORES[i], q = this.pontoDe(s.lat, s.lon);
      if (U.dist(p.x, p.y, q.x, q.y) < 16) return s;
    }
    return null;
  };

  MapaMundo.prototype.selecionar = function (setor) {
    this.selecionado = setor;
    this.jogo.setorEscolhido = setor;
    this.preencherFicha(setor);
  };

  MapaMundo.prototype.preencherFicha = function (s) {
    var liberado = UF.Salvar.liberado(s);
    var progresso = UF.Salvar.progresso();
    $('setorNome').textContent = s.nome;
    $('setorRegiao').textContent = s.regiao;
    $('setorCoord').textContent = UF.geo.coordenada(s.lat, s.lon) + ' · setor ' + String(s.ordem).padStart(2, '0') + ' · ' + s.dificuldade;
    $('setorObjetivo').textContent = s.objetivo;
    $('setorResumo').textContent = s.resumo;
    $('setorRisco').textContent = s.risco;
    $('setorFato').textContent = s.fato;
    var rec = progresso.recordes[s.id];
    $('setorNumeros').innerHTML =
      '<div><b>' + s.ondas + '</b><span>ATAQUES</span></div>' +
      '<div><b>' + s.jazidas + '</b><span>JAZIDAS</span></div>' +
      '<div><b>' + s.entradas + '</b><span>FRENTES</span></div>' +
      (rec ? '<div style="grid-column:1/-1"><b>' + (progresso.concluidos[s.id] ? 'Concluído' : 'Onda ' + rec.onda) +
        '</b><span>MELHOR RESULTADO</span></div>' : '');
    var btn = $('btnJogar');
    btn.disabled = !liberado;
    btn.textContent = liberado ? 'ASSUMIR O COMANDO' : 'BLOQUEADO — CONCLUA O SETOR ANTERIOR';
    if (liberado) btn.innerHTML = 'ASSUMIR O COMANDO <span>↗</span>';
  };

  MapaMundo.prototype.desenhar = function () {
    var ctx = this.ctx, larg = this.cv.clientWidth, alt = this.cv.clientHeight;
    if (!this.esc) this.calcularEnquadramento();
    this.quadro++;
    ctx.clearRect(0, 0, larg, alt);

    /* oceano */
    ctx.fillStyle = '#0a1826';
    ctx.fillRect(this.deslX, this.deslY, 360 * this.esc, 180 * this.esc);

    /* meridianos e paralelos */
    ctx.strokeStyle = 'rgba(90,140,190,0.12)';
    ctx.lineWidth = 1;
    for (var lon = -180; lon <= 180; lon += 30) {
      var a = this.pontoDe(90, lon), b = this.pontoDe(-90, lon);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    for (var lat = -60; lat <= 60; lat += 30) {
      var c = this.pontoDe(lat, -180), d = this.pontoDe(lat, 180);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    /* Equador destacado */
    var e1 = this.pontoDe(0, -180), e2 = this.pontoDe(0, 180);
    ctx.strokeStyle = 'rgba(120,190,240,0.22)';
    ctx.beginPath(); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.stroke();

    /* continentes */
    var aneis = UF.geo.continentes();
    var terra = new Path2D();
    for (var i = 0; i < aneis.length; i++) {
      var anel = aneis[i];
      for (var k = 0; k < anel.length; k++) {
        var p = this.pontoDe(anel[k][1], anel[k][0]);
        if (k === 0) terra.moveTo(p.x, p.y); else terra.lineTo(p.x, p.y);
      }
      terra.closePath();
    }
    ctx.fillStyle = '#1d2b3a';
    ctx.fill(terra);
    ctx.strokeStyle = 'rgba(140,200,240,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke(terra);

    /* setores */
    var progresso = UF.Salvar.progresso();
    var rotulosUsados = [];
    for (var s = 0; s < D.SETORES.length; s++) {
      var setor = D.SETORES[s];
      var q = this.pontoDe(setor.lat, setor.lon);
      var liberado = UF.Salvar.liberado(setor);
      var concluido = !!progresso.concluidos[setor.id];
      var cor = concluido ? '#8ce07f' : liberado ? '#7fd7ff' : '#51607a';
      var ativo = setor === this.selecionado;

      if (liberado && !concluido) {
        var pulso = 8 + 5 * Math.abs(Math.sin(this.quadro / 34 + s));
        ctx.strokeStyle = 'rgba(127,215,255,0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(q.x, q.y, pulso, 0, 6.283); ctx.stroke();
      }
      ctx.fillStyle = cor;
      ctx.beginPath(); ctx.arc(q.x, q.y, ativo ? 6.5 : 4.5, 0, 6.283); ctx.fill();
      if (ativo) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, 6.283); ctx.stroke();
      }
      if (ativo || this.hover === setor || larg > 620) {
        ctx.fillStyle = ativo ? '#ffffff' : 'rgba(220,232,246,0.72)';
        ctx.font = (ativo ? 'bold ' : '') + '11px system-ui, sans-serif';
        var rotulo = String(setor.ordem) + '. ' + setor.nome;
        var w = ctx.measureText(rotulo).width;
        var dx = q.x + w + 16 > larg ? -w - 12 : 10;
        /* Empurra o rótulo para baixo se outro já ocupa a linha. */
        var ry = q.y + 4, tentativas = 0;
        while (tentativas++ < 6 && rotulosUsados.some(function (u) {
          return Math.abs(u.y - ry) < 13 && Math.abs(u.x - (q.x + dx)) < Math.max(u.w, w);
        })) ry += 14;
        rotulosUsados.push({ x: q.x + dx, y: ry, w: w });
        if (ry !== q.y + 4) {
          ctx.strokeStyle = 'rgba(160,200,235,0.35)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(q.x + (dx > 0 ? 5 : -5), q.y); ctx.lineTo(q.x + dx + (dx > 0 ? -3 : w + 3), ry - 4); ctx.stroke();
        }
        ctx.fillText(rotulo, q.x + dx, ry);
      }
    }
  };

  UF.MapaMundo = MapaMundo;
})(typeof window !== 'undefined' ? window : globalThis);
