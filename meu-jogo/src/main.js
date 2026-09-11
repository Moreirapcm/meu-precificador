/* Última Fronteira — montagem e laço principal.
   Simulação em passo fixo; desenho a cada quadro disponível. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };
  var PASSO = 1 / 30;                 /* 30 atualizações lógicas por segundo */

  function Jogo() {
    this.sim = null;
    this.render = null;
    this.ui = new UF.UI(this);
    this.mapa = new UF.MapaMundo(this);
    this.setorEscolhido = D.SETORES[0];
    this.acumulado = 0;
    this.ultimoQuadro = 0;
    this.relogioSalvar = 0;
    this.tela = 'inicio';
    this.ligarMenu();
    this.mapa.redimensionar();
    this.mapa.selecionar(this.setorEscolhido);
    this.laco();
  }

  Jogo.prototype.ligarMenu = function () {
    var self = this;
    $('btnJogar').onclick = function () { self.comecar(self.setorEscolhido); };
    $('btnComoJogar').onclick = function () { self.mostrarAjuda(); };
    $('btnColar').onclick = function () { self.importar(); };
    $('btnContinuar').onclick = function () { self.continuar(); };
    var salvo = UF.Salvar.ler();
    if (salvo && salvo.fase === 'jogando') {
      var setor = D.SETORES.filter(function (s) { return s.id === salvo.setor; })[0];
      var b = $('btnContinuar');
      b.hidden = false;
      b.textContent = 'Continuar: ' + (setor ? setor.nome : salvo.setor) + ' · onda ' + salvo.onda.num;
    }
    global.addEventListener('resize', function () { if (self.render) self.render.redimensionar(); });
    global.addEventListener('beforeunload', function () { if (self.sim && self.sim.fase === 'jogando') UF.Salvar.gravar(self.sim); });
    doc.addEventListener('visibilitychange', function () {
      if (doc.hidden && self.sim && self.sim.fase === 'jogando') UF.Salvar.gravar(self.sim);
    });
    $('modal').addEventListener('click', function (e) { if (e.target === $('modal')) self.ui.fecharModal(); });
  };

  /* ------------------------------------------------------- telas */
  Jogo.prototype.trocarTela = function (qual) {
    this.tela = qual;
    $('telaInicio').classList.toggle('ativa', qual === 'inicio');
    $('telaJogo').classList.toggle('ativa', qual === 'jogo');
    if (qual === 'inicio') { this.mapa.redimensionar(); this.mapa.preencherFicha(this.setorEscolhido); }
  };

  Jogo.prototype.comecar = function (setor) {
    if (!UF.Salvar.liberado(setor)) { this.ui.mostrarAviso('Setor bloqueado. Conclua o anterior.', 'atencao'); return; }
    var sim = new UF.Sim({
      setor: setor,
      dificuldade: $('selDificuldade').value,
      modo: $('selModo').value
    });
    this.montar(sim, true);
  };

  Jogo.prototype.continuar = function () {
    var dados = UF.Salvar.ler();
    if (!dados) return;
    var sim = UF.Salvar.restaurar(dados);
    if (!sim) { this.ui.mostrarAviso('Salvamento de uma versão antiga: não foi possível carregar.', 'perigo'); return; }
    this.setorEscolhido = sim.setor;
    this.montar(sim, false);
  };

  Jogo.prototype.montar = function (sim, nova) {
    this.sim = sim;
    this.trocarTela('jogo');
    this.render = new UF.Render($('jogo'), sim);
    this.render.redimensionar();
    this.ui.iniciarPartida(sim, this.render);
    UF.audio.acordar();

    if (sim.fase === 'colocacao') {
      /* Antes de instalar a Central o setor é mostrado por inteiro, sem névoa
         total: o jogador compara terrenos antes de decidir (página 6). */
      for (var i = 0; i < sim.world.n; i++) sim.world.explorado[i] = 1;
      sim.world.visivel.fill(1);
      $('colocacaoHud').hidden = false;
      $('colocacaoMotivo').className = '';
      $('colocacaoMotivo').textContent = 'Área plana e livre de 4 × 4, com rota até uma jazida e longe das zonas de invasão (marcadas em vermelho).';
      this.render.cam.zoom = 0.72;
      this.render.centralizarNoMapa();
      this.ui.sugerirLocalCentral();
    } else {
      $('colocacaoHud').hidden = true;
      if (sim.central) this.render.centralizarEm(sim.central.x + 2, sim.central.y + 2);
    }
    if (nova) UF.Salvar.apagar();
  };

  Jogo.prototype.aoInstalarCentral = function () {
    /* A névoa volta: só fica visível o que os operários enxergam. */
    var sim = this.sim;
    sim.world.explorado.fill(0);
    sim.world.revelar(sim.central.x + 2, sim.central.y + 2, 13);
    sim.atualizarVisao();
    this.ui.mostrarAviso('Central instalada. Distribua os operários e prepare a defesa.', 'bom');
  };

  Jogo.prototype.voltarAoMapa = function () {
    this.sim = null;
    this.render = null;
    this.trocarTela('inicio');
    var salvo = UF.Salvar.ler();
    $('btnContinuar').hidden = !(salvo && salvo.fase === 'jogando');
  };

  /* ------------------------------------------------------ controles */
  Jogo.prototype.alternarPausa = function () {
    if (!this.sim) return;
    this.sim.pausado = !this.sim.pausado;
    this.ui.atualizarHud();
    this.ui.mostrarAviso(this.sim.pausado ? 'Pausado.' : 'Retomando.', 'info');
  };

  Jogo.prototype.alternarVelocidade = function () {
    if (!this.sim) return;
    var ordem = [1, 2, 3];
    this.sim.velocidade = ordem[(ordem.indexOf(this.sim.velocidade) + 1) % ordem.length];
    this.ui.atualizarHud();
  };

  /* Levar o progresso para outro aparelho.
     Copiar e colar funciona em todo lugar — inclusive dentro de visualizadores
     que não deixam a página baixar arquivos. */
  Jogo.prototype.exportar = function () {
    var self = this;
    var texto = UF.Salvar.exportar(this.sim);
    this.ui.abrirModal('PROGRESSO', 'Levar para outro aparelho',
      '<p>Copie o texto abaixo e cole no outro aparelho pela opção <b>Colar progresso</b>. ' +
      'Ele guarda a partida atual e os setores já concluídos.</p>' +
      '<textarea id="caixaProgresso" readonly style="width:100%;height:130px;font:11px/1.4 ui-monospace,monospace;' +
      'background:#0a1018;color:#c3cddc;border:1px solid #22304a;border-radius:8px;padding:8px"></textarea>' +
      '<p id="avisoCopia" style="min-height:18px"></p>', [
      { rotulo: 'Copiar', principal: true, aoClicar: function () {
        var area = doc.getElementById('caixaProgresso');
        area.select(); area.setSelectionRange(0, area.value.length);
        var pronto = function (ok) {
          doc.getElementById('avisoCopia').textContent = ok
            ? 'Copiado. Cole no outro aparelho.'
            : 'Não consegui copiar sozinho — selecione o texto e copie na mão.';
        };
        if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(area.value).then(function () { pronto(true); }, function () { pronto(false); });
        } else {
          var ok = false;
          try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
          pronto(ok);
        }
      } },
      { rotulo: 'Colar progresso', aoClicar: function () { self.importar(); } },
      { rotulo: 'Fechar', aoClicar: function () { self.ui.fecharModal(); } }
    ]);
    /* O valor entra depois de montar, para não passar pelo HTML. */
    var area = doc.getElementById('caixaProgresso');
    if (area) area.value = texto;
  };

  Jogo.prototype.importar = function () {
    var self = this;
    this.ui.abrirModal('PROGRESSO', 'Colar progresso',
      '<p>Cole aqui o texto copiado do outro aparelho.</p>' +
      '<textarea id="caixaColar" style="width:100%;height:130px;font:11px/1.4 ui-monospace,monospace;' +
      'background:#0a1018;color:#c3cddc;border:1px solid #22304a;border-radius:8px;padding:8px"></textarea>' +
      '<p id="avisoColar" style="min-height:18px"></p>', [
      { rotulo: 'Restaurar', principal: true, aoClicar: function () {
        var texto = (doc.getElementById('caixaColar') || {}).value || '';
        try {
          UF.Salvar.importar(texto);
          doc.getElementById('avisoColar').textContent = 'Progresso restaurado. Voltando ao mapa...';
          setTimeout(function () { self.ui.fecharModal(); self.voltarAoMapa(); }, 900);
        } catch (e) {
          doc.getElementById('avisoColar').textContent = 'Não consegui ler esse texto: ' + e.message;
        }
      } },
      { rotulo: 'Cancelar', aoClicar: function () { self.ui.fecharModal(); } }
    ]);
  };

  Jogo.prototype.mostrarAjuda = function () {
    var self = this;
    this.ui.abrirModal('MANUAL DE CAMPO', 'Como se joga', [
      '<p><b>Objetivo.</b> Manter a Central de Comando viva e cumprir a missão do setor.</p>',
      '<ul>',
      '<li><b>Instale a Central</b> em uma área plana de 4×4 com rota até uma jazida.</li>',
      '<li><b>Operários</b> mineram, constroem, reparam e exploram. O minério só entra no estoque quando a carga chega a um depósito.</li>',
      '<li><b>Construa</b> pela aba Construir: escolha, posicione a prévia (verde = válido) e confirme. Muro usa arraste.</li>',
      '<li><b>Energia elétrica</b> vem da Central e dos Geradores. Em falta, as torres têm prioridade e a produção pausa.</li>',
      '<li><b>Quartel</b> treina soldados; a Oficina, unidades pesadas. Defina o ponto de encontro.</li>',
      '<li><b>Pesquisa</b> vale para tudo que já existe e para o que vier depois.</li>',
      '<li><b>Portões</b> abrem para os seus e fecham quando o inimigo chega.</li>',
      '<li><b>Muro destruído</b> vira brecha na hora: os invasores recalculam a rota.</li>',
      '</ul>',
      '<p><b>Toque:</b> tocar seleciona; tocar no terreno com tropas selecionadas dá a ordem; arrastar move a câmera; pinça aproxima.</p>',
      '<p><b>Teclado:</b> espaço pausa · B construir · M mover · A atacar em movimento · R reparar linha · Q bombardeio · W escudo · E velocidade · Esc cancela · 1-4 grupos.</p>'
    ].join(''), [{ rotulo: 'Entendi', principal: true, aoClicar: function () { self.ui.fecharModal(); } }]);
  };

  Jogo.prototype.fimDePartida = function (venceu, motivo) {
    var self = this, sim = this.sim;
    UF.audio.evento(venceu ? 'vitoria' : 'derrota');
    var resumo = {
      onda: sim.onda.num, abates: sim.estatisticas.abates, perdas: sim.estatisticas.perdas,
      entregue: Math.round(sim.estatisticas.entregue), tempo: Math.round(sim.t)
    };
    if (venceu && sim.modo === 'campanha') UF.Salvar.concluir(sim.setor.id, resumo);
    UF.Salvar.apagar();

    var proximo = D.SETORES.filter(function (s) { return s.ordem === sim.setor.ordem + 1; })[0];
    var acoes = [];
    if (venceu && proximo && UF.Salvar.liberado(proximo)) {
      acoes.push({ rotulo: 'Próximo: ' + proximo.nome, principal: true, aoClicar: function () {
        self.ui.fecharModal(); self.setorEscolhido = proximo; self.comecar(proximo);
      } });
    }
    acoes.push({ rotulo: 'Tentar de novo', principal: !venceu, aoClicar: function () {
      self.ui.fecharModal(); self.comecar(sim.setor);
    } });
    acoes.push({ rotulo: 'Mapa do mundo', aoClicar: function () { self.ui.fecharModal(); self.voltarAoMapa(); } });

    this.ui.abrirModal(venceu ? 'SETOR MANTIDO' : 'LINHA ROMPIDA',
      venceu ? sim.setor.nome + ' resistiu.' : 'A defesa de ' + sim.setor.nome + ' caiu.',
      '<p>' + motivo + '</p><div class="placar">' +
      '<div><b>' + resumo.onda + '</b><span>ONDAS ENFRENTADAS</span></div>' +
      '<div><b>' + resumo.abates + '</b><span>INVASORES ABATIDOS</span></div>' +
      '<div><b>' + resumo.perdas + '</b><span>ESTRUTURAS PERDIDAS</span></div>' +
      '<div><b>' + U.num(resumo.entregue) + '</b><span>MINERAIS ENTREGUES</span></div>' +
      '<div><b>' + U.tempo(resumo.tempo) + '</b><span>DURAÇÃO</span></div>' +
      '<div><b>' + sim.estatisticas.operariosPerdidos + '</b><span>OPERÁRIOS PERDIDOS</span></div>' +
      '</div>', acoes);
  };

  /* --------------------------------------------------------- laço */
  Jogo.prototype.laco = function () {
    var self = this;
    function quadro(agora) {
      global.requestAnimationFrame(quadro);
      var dtReal = Math.min(0.25, (agora - self.ultimoQuadro) / 1000 || 0);
      self.ultimoQuadro = agora;

      if (self.tela === 'inicio') { self.mapa.desenhar(); return; }
      if (!self.sim || !self.render) return;

      var sim = self.sim;
      if (sim.fase === 'jogando' && !sim.pausado) {
        self.acumulado += dtReal * sim.velocidade;
        var voltas = 0;
        while (self.acumulado >= PASSO && voltas++ < 12) {
          sim.atualizar(PASSO);
          self.acumulado -= PASSO;
        }
      } else {
        self.acumulado = 0;
      }

      /* eventos: som, partículas e avisos */
      for (var i = 0; i < sim.eventos.length; i++) {
        var e = sim.eventos[i];
        UF.audio.evento(e.tipo);
        if (e.tipo === 'aviso') self.ui.mostrarAviso(e.texto, e.nivel);
        if (e.tipo === 'fimDePartida') { self.fimDePartida(e.venceu, e.motivo); }
      }
      self.render.consumirEventos();

      if (sim.fase === 'colocacao') self.ui.previaColocacaoCentral({
        x: self.render.cv.clientWidth / 2, y: self.render.cv.clientHeight / 2
      });

      self.render.desenhar(dtReal);
      self.render.desenharMinimapa($('minimapa'));

      self.relogioHud = (self.relogioHud || 0) + dtReal;
      if (self.relogioHud > 0.2) { self.relogioHud = 0; self.ui.atualizarHud(); }
      self.relogioPaineis = (self.relogioPaineis || 0) + dtReal;
      if (self.relogioPaineis > 0.9) { self.relogioPaineis = 0; self.ui.atualizarAcoes(); self.ui.desenharGaveta(); }

      /* autosave a cada 30 segundos de jogo */
      if (sim.fase === 'jogando') {
        self.relogioSalvar += dtReal;
        if (self.relogioSalvar > 30) { self.relogioSalvar = 0; UF.Salvar.gravar(sim); }
      }
    }
    global.requestAnimationFrame(quadro);
  };

  doc.addEventListener('DOMContentLoaded', function () { global.jogo = new Jogo(); });
  if (doc.readyState !== 'loading') { if (!global.jogo) global.jogo = new Jogo(); }
})(typeof window !== 'undefined' ? window : globalThis);
