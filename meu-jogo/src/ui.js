/* Última Fronteira — interface da partida: entrada por toque e teclado,
   barra de ações contextual, gaveta de construção e painéis.
   A interface só pede; quem decide é a simulação. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var ESTR = D.ESTRUTURAS, UNID = D.UNIDADES;
  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };

  function UI(jogo) {
    this.jogo = jogo;
    this.sim = null;
    this.render = null;
    this.modo = null;              /* null | {tipo:'construir'|'muro'|'ordem'|'bombardeio'|'escudo'|'rally'} */
    this.gavetaAtual = 'construir';
    this.gavetaAberta = false;
    this.selecionado = 0;
    this.grupoSelecionado = null;  /* 'soldados' | 'operarios' | 'aereos' */
    this.ultimoAviso = 0;
    this.ligarControles();
    this.ligarBotoes();
  }

  UI.prototype.iniciarPartida = function (sim, render) {
    this.sim = sim;
    this.render = render;
    this.modo = null;
    this.selecionado = 0;
    this.grupoSelecionado = null;
    this.abrirGaveta('construir', false);
    this.atualizarTudo();
  };

  /* ==================================================== entrada ========== */
  UI.prototype.ligarControles = function () {
    var self = this, cv = $('jogo');
    var toques = new Map();
    var arrastando = false, moveu = 0, ultimo = null, pinca = null;
    var LIMIAR = 8;

    function pos(e) {
      var r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    cv.addEventListener('pointerdown', function (e) {
      cv.setPointerCapture(e.pointerId);
      toques.set(e.pointerId, pos(e));
      UF.audio.acordar();
      if (toques.size === 1) { arrastando = true; moveu = 0; ultimo = pos(e); }
      if (toques.size === 2) {
        var v = Array.from(toques.values());
        pinca = { d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y), zoom: self.render.cam.zoom };
      }
      /* Traçado de muro começa no primeiro toque e termina ao soltar. */
      if (self.modo && self.modo.tipo === 'muro' && toques.size === 1) {
        var m = self.render.paraMundo(ultimo.x, ultimo.y);
        self.modo.inicio = { x: Math.floor(m.x), y: Math.floor(m.y) };
      }
    });

    cv.addEventListener('pointermove', function (e) {
      if (!toques.has(e.pointerId)) {
        if (self.modo && self.modo.tipo === 'construir') self.moverPrevia(pos(e));
        return;
      }
      var p = pos(e);
      toques.set(e.pointerId, p);

      if (toques.size >= 2 && pinca) {
        var v = Array.from(toques.values());
        var d = Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y);
        var meio = { x: (v[0].x + v[1].x) / 2, y: (v[0].y + v[1].y) / 2 };
        self.aplicarZoom(pinca.zoom * (d / pinca.d), meio);
        moveu = 999;
        return;
      }
      var dx = p.x - ultimo.x, dy = p.y - ultimo.y;
      moveu += Math.abs(dx) + Math.abs(dy);
      ultimo = p;

      if (self.modo && self.modo.tipo === 'muro' && self.modo.inicio) {
        self.atualizarTracado(p);
        return;
      }
      if (self.modo && self.modo.tipo === 'construir') { self.moverPrevia(p); return; }
      if (arrastando && moveu > LIMIAR) {
        /* Arrastar em espaço vazio move a câmera; nunca envia tropas. */
        self.render.cam.x += dx;
        self.render.cam.y += dy;
      }
    });

    function soltar(e) {
      if (!toques.has(e.pointerId)) return;
      var p = toques.get(e.pointerId);
      toques.delete(e.pointerId);
      if (toques.size < 2) pinca = null;
      if (toques.size > 0) return;
      arrastando = false;
      if (self.modo && self.modo.tipo === 'muro' && self.modo.inicio) { self.concluirTracado(); return; }
      if (moveu <= LIMIAR) self.tocar(p);
      moveu = 0;
    }
    cv.addEventListener('pointerup', soltar);
    cv.addEventListener('pointercancel', soltar);

    cv.addEventListener('wheel', function (e) {
      e.preventDefault();
      var r = cv.getBoundingClientRect();
      self.aplicarZoom(self.render.cam.zoom * (e.deltaY > 0 ? 0.9 : 1.1),
        { x: e.clientX - r.left, y: e.clientY - r.top });
    }, { passive: false });

    cv.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      if (self.modo) { self.cancelarModo(); return; }
      var r = cv.getBoundingClientRect();
      self.ordemNoTerreno({ x: e.clientX - r.left, y: e.clientY - r.top }, true);
    });

    /* minimapa: toque leva a câmera ao ponto */
    var mini = $('minimapa');
    function irPeloMini(e) {
      var r = mini.getBoundingClientRect();
      var w = self.sim.world;
      var x = (e.clientX - r.left) / r.width * w.w;
      var y = (e.clientY - r.top) / r.height * w.h;
      self.render.centralizarEm(x, y);
    }
    mini.addEventListener('pointerdown', function (e) { e.stopPropagation(); irPeloMini(e); });
    mini.addEventListener('pointermove', function (e) { if (e.buttons) irPeloMini(e); });

    /* teclado */
    doc.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
      if (!self.sim) return;
      var k = e.key.toLowerCase();
      if (k === ' ') { e.preventDefault(); self.jogo.alternarPausa(); return; }
      if (k === 'escape') { self.cancelarModo(); return; }
      if (k === 'b') { self.abrirGaveta('construir', true); return; }
      if (k === 'm') { self.iniciarOrdem('mover'); return; }
      if (k === 'a') { self.iniciarOrdem('moverAtacando'); return; }
      if (k === 'r') { self.acaoRepararLinha(); return; }
      if (k === 'e') { self.jogo.alternarVelocidade(); return; }
      if (k === 'q') { self.iniciarHabilidade('bombardeio'); return; }
      if (k === 'w') { self.iniciarHabilidade('escudo'); return; }
      if (k === '1') { self.selecionarGrupo('soldados'); return; }
      if (k === '2') { self.selecionarGrupo('operarios'); return; }
      if (k === '3') { self.selecionarGrupo('aereos'); return; }
      if (k === '4') { self.selecionarGrupo('feridos'); return; }
      var mapaCam = { arrowleft: [1, 0], arrowright: [-1, 0], arrowup: [0, 1], arrowdown: [0, -1] };
      if (mapaCam[k]) { self.render.cam.x += mapaCam[k][0] * 60; self.render.cam.y += mapaCam[k][1] * 60; }
    });
  };

  UI.prototype.aplicarZoom = function (novo, ancora) {
    var r = this.render;
    novo = U.clamp(novo, 0.42, 2.1);
    var antes = r.paraMundo(ancora.x, ancora.y);
    r.cam.zoom = novo;
    var depois = r.paraTela(antes.x, antes.y);
    r.cam.x += ancora.x - depois.x;
    r.cam.y += ancora.y - depois.y;
  };

  /* ============================================== toque no campo ========= */
  UI.prototype.tocar = function (p) {
    var sim = this.sim, m = this.render.paraMundo(p.x, p.y);
    var cx = Math.floor(m.x), cy = Math.floor(m.y);

    if (sim.fase === 'colocacao') { this.tentarInstalarCentral(cx, cy); return; }

    if (this.modo) {
      var t = this.modo.tipo;
      if (t === 'construir') { this.confirmarConstrucao(cx, cy); return; }
      if (t === 'bombardeio') { this.confirmarHabilidade('bombardeio', m); return; }
      if (t === 'escudo') { this.confirmarHabilidade('escudo', m); return; }
      if (t === 'rally') { this.confirmarRally(cx, cy); return; }
      if (t === 'ordem') { this.ordemNoTerreno(p); return; }
    }

    var alvo = this.entidadeEm(m);
    if (alvo) { this.selecionar(alvo); return; }
    /* Terreno vazio com tropas selecionadas: ordem simples de deslocamento. */
    if (this.temTropasSelecionadas()) { this.ordemNoTerreno(p); return; }
    this.selecionar(null);
  };

  UI.prototype.entidadeEm = function (m) {
    var sim = this.sim, melhor = null, melhorD = 1.1;
    for (var i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      if (u.morta) continue;
      if (u.lado === 'inimigo' && !sim.world.veCelula(Math.floor(u.x), Math.floor(u.y))) continue;
      var d = U.dist(u.x, u.y, m.x, m.y);
      if (d < melhorD) { melhorD = d; melhor = u; }
    }
    if (melhor) return melhor;
    var cx = Math.floor(m.x), cy = Math.floor(m.y);
    if (!sim.world.dentro(cx, cy)) return null;
    var id = sim.world.occ[sim.world.idx(cx, cy)];
    if (id && sim.estruturas[id] && !sim.estruturas[id].morta) return sim.estruturas[id];
    var jid = sim.world.recurso[sim.world.idx(cx, cy)];
    if (jid) { var j = sim.world.jazidaPorId(jid); if (j) { j.ehJazida = true; return j; } }
    return null;
  };

  UI.prototype.selecionar = function (ent) {
    this.grupoSelecionado = null;
    if (!ent) { this.selecionado = 0; this.render.selecao = []; this.atualizarTudo(); return; }
    if (ent.ehJazida) { this.selecionado = 0; this.render.selecao = []; this.jazidaSelecionada = ent; }
    else { this.jazidaSelecionada = null; this.selecionado = ent.id; this.render.selecao = [ent.id]; }
    /* Tocar num inimigo marca prioridade de fogo. */
    if (ent.lado === 'inimigo') {
      this.sim.alvoPrioritario = this.sim.alvoPrioritario === ent.id ? 0 : ent.id;
      this.mostrarAviso(this.sim.alvoPrioritario ? 'Fogo concentrado em ' + ent.def.nome + '.' : 'Prioridade de alvo removida.', 'info');
    }
    UF.audio.evento('clique');
    this.atualizarTudo();
  };

  UI.prototype.selecionarGrupo = function (nome) {
    var sim = this.sim, ids = [];
    for (var i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      if (u.lado !== 'aliado' || u.morta) continue;
      if (nome === 'soldados' && !u.operario && !u.voa) ids.push(u.id);
      else if (nome === 'operarios' && u.operario) ids.push(u.id);
      else if (nome === 'aereos' && u.voa) ids.push(u.id);
      else if (nome === 'feridos' && u.hp < u.hpMax * 0.55) ids.push(u.id);
    }
    this.grupoSelecionado = ids.length ? nome : null;
    this.selecionado = 0;
    this.jazidaSelecionada = null;
    this.render.selecao = ids;
    if (!ids.length) this.mostrarAviso('Nenhuma unidade nesse grupo.', 'atencao');
    this.atualizarTudo();
  };

  UI.prototype.unidadesSelecionadas = function () {
    var sim = this.sim, saida = [];
    for (var i = 0; i < this.render.selecao.length; i++) {
      var e = sim.unidadePorId(this.render.selecao[i]);
      if (e && !e.morta && e.lado === 'aliado') saida.push(e);
    }
    return saida;
  };

  UI.prototype.temTropasSelecionadas = function () {
    return this.unidadesSelecionadas().length > 0;
  };

  /* =============================================== ordens =============== */
  UI.prototype.iniciarOrdem = function (tipo) {
    if (!this.temTropasSelecionadas()) { this.mostrarAviso('Selecione tropas ou operários primeiro.', 'atencao'); return; }
    var rotulos = { mover: 'Toque no destino', moverAtacando: 'Toque no destino (ataca no caminho)', recuar: 'Toque no ponto seguro', patrulhar: 'Toque no outro extremo da patrulha' };
    this.modo = { tipo: 'ordem', ordem: tipo };
    this.mostrarModo(rotulos[tipo] || 'Toque no destino');
  };

  UI.prototype.ordemNoTerreno = function (p, automatico) {
    var sim = this.sim, m = this.render.paraMundo(p.x, p.y);
    var unidades = this.unidadesSelecionadas();
    if (!unidades.length) { this.cancelarModo(); return; }
    var cel = sim.nav.celulaLivreProxima(m.x, m.y, 8);
    if (!cel) { this.mostrarAviso('Não há célula acessível nesse ponto.', 'atencao'); return; }
    var ordem = (this.modo && this.modo.ordem) || null;

    for (var i = 0; i < unidades.length; i++) {
      var u = unidades[i];
      var destino = { x: cel.x + (i % 3) - 1, y: cel.y + Math.floor(i / 3) % 3 - 1 };
      if (!sim.world.livre(destino.x, destino.y)) destino = cel;
      if (u.operario) {
        /* Operário: tocar numa jazida vira ordem de minerar; no resto, deslocar. */
        var jid = sim.world.recurso[sim.world.idx(cel.x, cel.y)];
        var estrutura = sim.estruturas[sim.world.occ[sim.world.idx(Math.floor(m.x), Math.floor(m.y))]];
        if (jid) sim.darTarefa(u, { tipo: 'minerar', jazida: jid }, true);
        else if (estrutura && !estrutura.construida) sim.darTarefa(u, { tipo: 'construir', alvo: estrutura.id }, true);
        else if (estrutura && estrutura.hp < estrutura.hpMax) sim.darTarefa(u, { tipo: 'reparar', alvo: estrutura.id }, true);
        else sim.darTarefa(u, { tipo: 'mover', destino: destino }, true);
      } else {
        var tipoOrdem = ordem || 'moverAtacando';   /* comando simples: avança atacando */
        if (tipoOrdem === 'patrulhar') sim.darTarefa(u, { tipo: 'patrulhar', a: { x: Math.floor(u.x), y: Math.floor(u.y) }, b: destino, indo: true }, true);
        else if (tipoOrdem === 'recuar') sim.darTarefa(u, { tipo: 'recuar', destino: destino }, true);
        else sim.darTarefa(u, { tipo: tipoOrdem, destino: destino }, true);
      }
    }
    this.render.efeitos.push(this.marcaDeOrdem(cel, ordem === 'recuar' ? '#ffd479' : '#8ce07f'));
    UF.audio.evento('clique');
    this.cancelarModo();
  };

  UI.prototype.marcaDeOrdem = function (cel, cor) {
    var p = this.render.paraTela(cel.x + 0.5, cel.y + 0.5);
    return { tipo: 'faisca', x: p.x, y: p.y, cor: cor, vida: 0.55, max: 0.55 };
  };

  /* =========================================== construção =============== */
  UI.prototype.iniciarConstrucao = function (tipo) {
    var def = ESTR[tipo];
    if (def.arrasto) { this.modo = { tipo: 'muro', estrutura: tipo }; this.mostrarModo('Arraste para traçar o muro'); }
    else { this.modo = { tipo: 'construir', estrutura: tipo }; this.mostrarModo('Toque para posicionar: ' + def.nome); }
    this.fecharGaveta();
    /* Coloca a prévia no centro da tela para começar. */
    this.moverPrevia({ x: $('jogo').clientWidth / 2, y: $('jogo').clientHeight / 2 });
    this.atualizarTudo();
  };

  UI.prototype.moverPrevia = function (p) {
    if (!this.modo || this.modo.tipo !== 'construir') return;
    var def = ESTR[this.modo.estrutura];
    var m = this.render.paraMundo(p.x, p.y);
    var x = Math.floor(m.x - (def.w - 1) / 2), y = Math.floor(m.y - (def.h - 1) / 2);
    var ver = this.sim.podeColocar(this.modo.estrutura, x, y);
    this.render.previa = { tipo: this.modo.estrutura, x: x, y: y, valido: ver.ok };
    this.mostrarModo(ver.ok
      ? def.nome + ' · ' + this.precoTexto(this.sim.custoDe(def))
      : ver.motivo);
  };

  UI.prototype.confirmarConstrucao = function () {
    var pv = this.render.previa;
    if (!pv) return;
    var res = this.sim.construir(pv.tipo, pv.x, pv.y);
    if (!res.ok) { this.mostrarAviso(res.motivo, 'atencao'); UF.audio.evento('negado'); return; }
    UF.audio.evento('clique');
    var def = ESTR[pv.tipo];
    /* Estruturas pequenas continuam no modo para colocar várias seguidas. */
    if (def.w <= 2 && def.h <= 2) this.moverPrevia({ x: $('jogo').clientWidth / 2, y: $('jogo').clientHeight / 2 });
    else this.cancelarModo();
    this.atualizarTudo();
  };

  UI.prototype.atualizarTracado = function (p) {
    var m = this.render.paraMundo(p.x, p.y);
    var ini = this.modo.inicio;
    var plano = this.sim.planejarMuro(ini.x, ini.y, Math.floor(m.x), Math.floor(m.y), this.modo.estrutura);
    this.render.tracado = { x0: ini.x, y0: ini.y, plano: plano };
    this.mostrarModo(plano.validas + ' trecho(s) · ' + this.precoTexto(plano.custo) +
      (plano.invalidas ? ' · ' + plano.invalidas + ' inválido(s)' : ''));
  };

  UI.prototype.concluirTracado = function () {
    var t = this.render.tracado;
    this.modo.inicio = null;
    this.render.tracado = null;
    if (!t) return;
    var res = this.sim.confirmarMuro(t.plano, this.modo.estrutura);
    if (!res.ok) { this.mostrarAviso(res.motivo, 'atencao'); UF.audio.evento('negado'); return; }
    UF.audio.evento('clique');
    this.mostrarAviso(res.ids.length + ' trecho(s) em obra. ' + this.precoTexto(res.custo) + ' pagos.', 'info');
    this.atualizarTudo();
  };

  UI.prototype.precoTexto = function (custo) {
    var partes = [];
    if (custo.m) partes.push(custo.m + ' ◆');
    if (custo.c) partes.push(custo.c + ' ⬡');
    return partes.join(' + ') || 'grátis';
  };

  /* ========================================== habilidades =============== */
  UI.prototype.iniciarHabilidade = function (qual) {
    var custo = qual === 'bombardeio' ? D.REGRAS.custoBombardeio : D.REGRAS.custoEscudo;
    if (this.sim.jogador.energia < custo) { this.mostrarAviso('Energia tática insuficiente (' + custo + ' necessários).', 'atencao'); UF.audio.evento('negado'); return; }
    this.modo = { tipo: qual };
    this.mostrarModo(qual === 'bombardeio' ? 'Toque na área do bombardeio' : 'Toque no centro do escudo');
  };

  UI.prototype.confirmarHabilidade = function (qual, m) {
    var res = qual === 'bombardeio' ? this.sim.bombardear(m.x, m.y) : this.sim.ativarEscudo(m.x, m.y);
    if (!res.ok) { this.mostrarAviso(res.motivo, 'atencao'); UF.audio.evento('negado'); }
    else UF.audio.evento('clique');
    this.cancelarModo();
  };

  UI.prototype.confirmarRally = function (cx, cy) {
    var b = this.sim.estruturas[this.modo.estrutura];
    if (b) { b.rally = { x: cx, y: cy }; this.mostrarAviso('Ponto de encontro definido.', 'info'); }
    this.cancelarModo();
  };

  UI.prototype.mostrarModo = function (texto) {
    $('modoTexto').textContent = texto;
    $('modoHud').hidden = false;
  };

  UI.prototype.cancelarModo = function () {
    this.modo = null;
    this.render.previa = null;
    this.render.tracado = null;
    $('modoHud').hidden = true;
    this.atualizarTudo();
  };

  /* ====================================== instalação da Central ========= */
  UI.prototype.tentarInstalarCentral = function (cx, cy) {
    var x = cx - 1, y = cy - 1;
    var ver = this.sim.podeColocarSemExploracao('central', x, y);
    if (!ver.ok) {
      $('colocacaoMotivo').textContent = ver.motivo;
      $('colocacaoMotivo').className = 'erro';
      UF.audio.evento('negado');
      return;
    }
    this.sim.iniciar(x, y);
    $('colocacaoHud').hidden = true;
    this.render.centralizarEm(x + 2, y + 2);
    UF.audio.evento('obraConcluida');
    this.jogo.aoInstalarCentral();
    this.atualizarTudo();
  };

  UI.prototype.previaColocacaoCentral = function (p) {
    if (!this.sim || this.sim.fase !== 'colocacao') return;
    var m = this.render.paraMundo(p.x, p.y);
    var x = Math.floor(m.x) - 1, y = Math.floor(m.y) - 1;
    var ver = this.sim.podeColocarSemExploracao('central', x, y);
    this.render.previa = { tipo: 'central', x: x, y: y, valido: ver.ok };
  };

  UI.prototype.sugerirLocalCentral = function () {
    var sim = this.sim, w = sim.world;
    var melhor = null, melhorNota = -Infinity;
    var cx = w.w / 2, cy = w.h / 2;
    for (var y = 2; y < w.h - 5; y += 1) {
      for (var x = 2; x < w.w - 5; x += 1) {
        if (!sim.podeColocarSemExploracao('central', x, y).ok) continue;
        var nota = 0;
        /* perto de jazidas, longe das entradas, com espaço livre em volta */
        var perto = Infinity;
        for (var k = 0; k < w.jazidas.length; k++) {
          var j = w.jazidas[k];
          if (j.tipo !== 'mineral') continue;
          var d = U.dist(j.x, j.y, x, y);
          if (d < perto) perto = d;
        }
        nota -= perto * 2.2;
        var menorEntrada = Infinity;
        for (var e = 0; e < w.entradas.length; e++) {
          var de = U.dist(w.entradas[e].x, w.entradas[e].y, x, y);
          if (de < menorEntrada) menorEntrada = de;
        }
        nota += Math.min(menorEntrada, 26) * 1.4;
        var livres = 0;
        for (var dy = -4; dy <= 7; dy++) for (var dx = -4; dx <= 7; dx++) if (w.construivel(x + dx, y + dy)) livres++;
        nota += livres * 0.9;
        nota -= U.dist(x, y, cx, cy) * 0.3;
        if (nota > melhorNota) { melhorNota = nota; melhor = { x: x, y: y }; }
      }
    }
    if (!melhor) return;
    this.render.centralizarEm(melhor.x + 2, melhor.y + 2);
    this.render.previa = { tipo: 'central', x: melhor.x, y: melhor.y, valido: true };
    this.localSugerido = melhor;
    $('colocacaoMotivo').className = '';
    $('colocacaoMotivo').textContent = 'Local sugerido: perto de jazidas, longe das zonas de invasão e com espaço para crescer. Toque nele para confirmar.';
  };

  UF.UI = UI;
})(typeof window !== 'undefined' ? window : globalThis);
