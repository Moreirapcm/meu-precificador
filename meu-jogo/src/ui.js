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
    /* A caixa de seleção é a ausência número um em relação a StarCraft e Age of
       Empires: sem ela só dá para pegar UMA unidade por vez, ou o mapa inteiro
       por categoria. Mas ela disputa o gesto com o arrasto da câmera, e a saída
       é diferente em cada aparelho:
         - mouse, botão esquerdo  -> caixa de seleção
         - mouse, botão do meio   -> arrasta a câmera
         - dedo, um toque         -> arrasta a câmera (é o gesto que o celular
                                     espera; sem ele não há como andar no mapa)
         - dedo, toque LONGO      -> caixa de seleção
       No celular o toque longo é o que substitui o botão direito que não existe. */
    var caixa = null;            /* {x0,y0,x1,y1} em pixels de tela */
    var relogioLongo = 0;
    var ultimoToque = null;      /* {x,y,t} do toque anterior, para o duplo */

    function pos(e) {
      var r = cv.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    cv.addEventListener('pointerdown', function (e) {
      cv.setPointerCapture(e.pointerId);
      toques.set(e.pointerId, pos(e));
      UF.audio.acordar();
      if (toques.size === 1) {
        arrastando = true; moveu = 0; ultimo = pos(e);
        var comMouse = e.pointerType === 'mouse';
        var podeCaixa = !self.modo && self.sim && self.sim.fase !== 'colocacao';
        if (comMouse && e.button === 0 && podeCaixa) {
          caixa = { x0: ultimo.x, y0: ultimo.y, x1: ultimo.x, y1: ultimo.y, ativa: false };
        } else if (!comMouse && podeCaixa) {
          /* dedo: só vira caixa se ficar parado meio segundo antes de arrastar */
          var partida = ultimo;
          relogioLongo = setTimeout(function () {
            if (moveu <= LIMIAR) {
              caixa = { x0: partida.x, y0: partida.y, x1: partida.x, y1: partida.y, ativa: true };
              self.render.caixaSelecao = caixa;
              UF.audio.evento('clique');
            }
          }, 500);
        }
      }
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
      if (caixa && (caixa.ativa || moveu > LIMIAR)) {
        caixa.ativa = true;
        caixa.x1 = p.x; caixa.y1 = p.y;
        self.render.caixaSelecao = caixa;
        return;
      }
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
      clearTimeout(relogioLongo);
      if (caixa && caixa.ativa) {
        self.selecionarNaCaixa(caixa);
        caixa = null; self.render.caixaSelecao = null; moveu = 0;
        return;
      }
      caixa = null; self.render.caixaSelecao = null;
      if (self.modo && self.modo.tipo === 'muro' && self.modo.inicio) { self.concluirTracado(); return; }
      if (moveu <= LIMIAR) {
        /* DUPLO TOQUE: seleciona todas as unidades do mesmo tipo que estão na
           TELA. É o gesto mais antigo e mais usado do gênero, e faltava.
           A janela é de 340 ms e 24 px — larga o bastante para o dedo, que
           nunca cai duas vezes no mesmo pixel, e curta o bastante para não
           confundir dois toques separados em unidades diferentes.
           Ctrl+clique faz o mesmo, que é o atalho do StarCraft para quem está
           no teclado e não quer arriscar o tempo do duplo clique. */
        var agora = Date.now();
        var perto = ultimoToque &&
          Math.abs(p.x - ultimoToque.x) < 24 && Math.abs(p.y - ultimoToque.y) < 24;
        var duplo = perto && (agora - ultimoToque.t) < 340;
        if (duplo || e.ctrlKey || e.metaKey) { ultimoToque = null; self.selecionarTodosDoTipo(p); }
        else { ultimoToque = { x: p.x, y: p.y, t: agora }; self.tocar(p); }
      }
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
      /* `b` abre a lista de construções NO PAINEL, que é onde o StarCraft a
         põe. A gaveta continua existindo pela aba, com a descrição inteira de
         cada estrutura — o painel é para quem já sabe o que quer. */
      if (k === 'b') { self.paginaAcoes = 'construir'; self.atualizarAcoes(); return; }
      if (k === 'm') { self.iniciarOrdem('mover'); return; }
      if (k === 'a') { self.iniciarOrdem('moverAtacando'); return; }
      /* `r` é REPARAR, como nos dois clássicos, e passa a agir sobre a
         seleção; o reparo automático da linha, que é ajuste estratégico e não
         comando de unidade, mudou para `l`. Trocar foi mais honesto que
         inventar uma letra ruim para o comando que todo jogador de RTS já
         procura em `r`. */
      if (k === 'r') { self.repararComSelecionado(); return; }
      if (k === 'l') { self.acaoRepararLinha(); return; }
      if (k === 'p') { self.iniciarOrdem('patrulhar'); return; }
      if (k === 'c') { self.iniciarOrdem('recuar'); return; }
      if (k === 'g') { self.minerarComSelecionados(); return; }
      if (k === 'e') { self.jogo.alternarVelocidade(); return; }
      if (k === 'q') { self.iniciarHabilidade('bombardeio'); return; }
      if (k === 'w') { self.iniciarHabilidade('escudo'); return; }
      if (k === 's') { self.pararSelecionados(); return; }
      if (k === 'h') { self.voltarParaBase(); return; }
      if (k === '.' || k === ',') { self.selecionarOciosos(); return; }

      /* Número: grupo de controle, como em StarCraft. Com Ctrl grava, sozinho
         chama. Antes Ctrl+1 caía direto em "selecionar todos os soldados" —
         quem tem o reflexo de StarCraft destruía a própria seleção ao tentar
         gravá-la. Se o grupo não existe, o número cai no atalho de categoria,
         que é o que já havia. */
      if (k >= '1' && k <= '9') {
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); self.gravarGrupo(k); return; }
        if (self.chamarGrupo(k)) return;
        var categoria = { '1': 'soldados', '2': 'operarios', '3': 'aereos', '4': 'feridos' }[k];
        if (categoria) self.selecionarGrupo(categoria);
        return;
      }
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
    this.rotuloSelecao = null;
    /* Trocar de seleção fecha a segunda página: a lista de construções era do
       operário que estava selecionado, não da torre em que se acabou de tocar. */
    this.paginaAcoes = null;
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

  /* O que a caixa pega: só unidade SUA e viva. Prédio não entra — em RTS
     nenhum jogador espera arrastar por cima da base e sair com dez torres
     selecionadas. Se a caixa não pegar ninguém, ela LIMPA a seleção, que é o
     jeito de desmarcar tudo sem precisar de tecla. */
  UI.prototype.selecionarNaCaixa = function (c) {
    var sim = this.sim, ids = [];
    var x0 = Math.min(c.x0, c.x1), x1 = Math.max(c.x0, c.x1);
    var y0 = Math.min(c.y0, c.y1), y1 = Math.max(c.y0, c.y1);
    for (var i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      if (u.lado !== 'aliado' || u.morta) continue;
      var p = this.render.paraTela(u.x, u.y);
      if (p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1) ids.push(u.id);
    }
    /* Soldado tem precedência sobre operário: arrastar por cima da base com
       tropa parada ali dentro é para pegar a TROPA, não interromper a obra. */
    var soldados = [];
    for (var k = 0; k < ids.length; k++) {
      var un = sim.unidadePorId(ids[k]);
      if (un && !un.operario) soldados.push(ids[k]);
    }
    if (soldados.length) ids = soldados;

    this.grupoSelecionado = null;
    this.rotuloSelecao = null;
    this.selecionado = ids.length === 1 ? ids[0] : 0;
    this.jazidaSelecionada = null;
    this.render.selecao = ids;
    if (ids.length) UF.audio.evento('clique');
    this.atualizarTudo();
  };

  /* TODAS DO MESMO TIPO QUE ESTÃO NA TELA.
     O escopo é a tela, não o mapa — é assim nos dois clássicos, e a razão é de
     jogo, não de implementação: seleção que alcança o outro lado do mapa tira
     do jogador o controle de quem ele está mandando. Quem quer o mapa inteiro
     usa as categorias (1 a 4) ou um grupo gravado.

     Só vale para unidade ALIADA. Dois toques num invasor continuam marcando
     prioridade de fogo, e em estrutura não faz sentido nenhum. */
  UI.prototype.selecionarTodosDoTipo = function (p) {
    var sim = this.sim, m = this.render.paraMundo(p.x, p.y);
    var base = this.entidadeEm(m);
    if (!base || base.w || base.lado !== 'aliado') { this.tocar(p); return; }

    var cv = $('jogo'), larg = cv.clientWidth, alt = cv.clientHeight;
    var margem = 40;                 /* quem está meio para fora ainda conta */
    var ids = [];
    for (var i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      if (u.lado !== 'aliado' || u.morta || u.tipo !== base.tipo) continue;
      var t = this.render.paraTela(u.x, u.y);
      if (t.x < -margem || t.x > larg + margem) continue;
      if (t.y < -margem || t.y > alt + margem) continue;
      ids.push(u.id);
    }
    if (!ids.length) ids = [base.id];

    this.grupoSelecionado = null;
    this.paginaAcoes = null;
    this.jazidaSelecionada = null;
    this.selecionado = ids.length === 1 ? ids[0] : 0;
    this.render.selecao = ids;
    /* Guarda o nome para a barra dizer "Operário · 7" em vez de "Grupo · 7":
       o jogador precisa ver que pegou UM tipo, e qual. */
    this.rotuloSelecao = ids.length > 1 ? base.def.nome : null;
    UF.audio.evento('clique');
    if (ids.length > 1) this.mostrarAviso(ids.length + ' × ' + base.def.nome + ' na tela.', 'info');
    this.atualizarTudo();
  };

  /* Grupos de controle, como em StarCraft: Ctrl+número grava a seleção, número
     sozinho a chama de volta. Guardado por ID, e as unidades mortas são
     filtradas na hora de chamar — um grupo não pode ressuscitar ninguém. */
  UI.prototype.gravarGrupo = function (n) {
    if (!this.grupos) this.grupos = {};
    var ids = (this.render.selecao || []).slice();
    if (!ids.length) { this.mostrarAviso('Nada selecionado para gravar no grupo ' + n + '.', 'atencao'); return; }
    this.grupos[n] = ids;
    this.mostrarAviso('Grupo ' + n + ': ' + ids.length + ' unidade(s).', 'info');
  };

  UI.prototype.chamarGrupo = function (n) {
    var g = this.grupos && this.grupos[n];
    if (!g || !g.length) return false;
    var sim = this.sim, vivos = [];
    for (var i = 0; i < g.length; i++) {
      var u = sim.unidadePorId(g[i]);
      if (u && !u.morta) vivos.push(u.id);
    }
    this.grupos[n] = vivos;
    if (!vivos.length) { this.mostrarAviso('O grupo ' + n + ' não tem mais ninguém.', 'atencao'); return true; }
    this.grupoSelecionado = null;
    this.selecionado = vivos.length === 1 ? vivos[0] : 0;
    this.jazidaSelecionada = null;
    this.render.selecao = vivos;
    UF.audio.evento('clique');
    this.atualizarTudo();
    return true;
  };

  /* Tropa ociosa: o dado já existia na simulação e nunca virava seleção. É a
     forma mais barata de recuperar controle num mapa grande. */
  UI.prototype.selecionarOciosos = function () {
    var sim = this.sim, ids = [];
    for (var i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      if (u.lado !== 'aliado' || u.morta) continue;
      var parado = !u.tarefa || u.tarefa.tipo === 'ocioso';
      if (parado && !u.alvo) ids.push(u.id);
    }
    if (!ids.length) { this.mostrarAviso('Ninguém parado.', 'info'); return; }
    this.grupoSelecionado = null;
    this.selecionado = ids.length === 1 ? ids[0] : 0;
    this.jazidaSelecionada = null;
    this.render.selecao = ids;
    this.render.centralizarEm(sim.unidadePorId(ids[0]).x, sim.unidadePorId(ids[0]).y);
    this.atualizarTudo();
  };

  UI.prototype.pararSelecionados = function () {
    var us = this.unidadesSelecionadas();
    if (!us.length) return;
    for (var i = 0; i < us.length; i++) {
      this.sim.darTarefa(us[i], { tipo: 'ocioso' }, true);
      us[i].rota = null;
    }
    this.mostrarAviso(us.length + ' unidade(s) pararam.', 'info');
    this.atualizarTudo();
  };

  /* Os dois comandos que só existiam como botão e agora têm tecla. Ficam aqui,
     junto de `pararSelecionados`, porque agem sobre a SELEÇÃO — e é por isso
     que a mesma letra serve com o dedo e com o teclado. */
  UI.prototype.repararComSelecionado = function () {
    var us = this.unidadesSelecionadas().filter(function (u) { return u.operario; });
    if (!us.length) { this.mostrarAviso('Selecione um operário para reparar.', 'atencao'); return; }
    var sim = this.sim, achou = 0;
    for (var i = 0; i < us.length; i++) {
      var alvo = sim.estruturaMaisFeridaProxima(us[i].x, us[i].y);
      if (!alvo) continue;
      sim.darTarefa(us[i], { tipo: 'reparar', alvo: alvo.id }, true);
      achou++;
    }
    this.mostrarAviso(achou ? achou + ' operário(s) reparando.' : 'Nada danificado por perto.', achou ? 'info' : 'atencao');
    this.atualizarTudo();
  };

  UI.prototype.minerarComSelecionados = function () {
    var us = this.unidadesSelecionadas().filter(function (u) { return u.operario; });
    if (!us.length) { this.mostrarAviso('Selecione um operário para minerar.', 'atencao'); return; }
    var sim = this.sim;
    for (var i = 0; i < us.length; i++) {
      var j = sim.jazidaLivreMaisProxima(us[i].x, us[i].y);
      if (j) sim.darTarefa(us[i], { tipo: 'minerar', jazida: j.id }, false);
    }
    this.mostrarAviso('Operários voltaram à mineração.', 'info');
    this.atualizarTudo();
  };

  UI.prototype.voltarParaBase = function () {
    var c = this.sim.central;
    if (!c) return;
    this.render.centralizarEm(c.x + c.w / 2, c.y + c.h / 2);
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
    if (custo.c) partes.push(custo.c + ' ⬢');
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
    this.paginaAcoes = null;
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
    /* A prévia É o cubo translúcido do local escolhido. Sem apagá-la aqui, ela
       fica desenhada por cima da Central pelo resto da partida. */
    this.render.previa = null;
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
