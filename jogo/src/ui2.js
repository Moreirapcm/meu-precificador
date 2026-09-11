/* Última Fronteira — painéis: barra superior, ações contextuais, gaveta e modais. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var ESTR = D.ESTRUTURAS, UNID = D.UNIDADES;
  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };
  var UI = UF.UI.prototype;

  UI.ligarBotoes = function () {
    var self = this;
    $('btnPausa').onclick = function () { self.jogo.alternarPausa(); };
    $('btnVel').onclick = function () { self.jogo.alternarVelocidade(); };
    $('btnMenu').onclick = function () { self.abrirMenuPartida(); };
    $('btnCancelarModo').onclick = function () { self.cancelarModo(); };
    $('btnSugerir').onclick = function () { self.sugerirLocalCentral(); };
    $('puxadorGaveta').onclick = function () { self.gavetaAberta ? self.fecharGaveta() : self.abrirGaveta(self.gavetaAtual, true); };
    var abas = doc.querySelectorAll('#abas button');
    for (var i = 0; i < abas.length; i++) {
      (function (b) {
        b.onclick = function () {
          if (self.gavetaAberta && self.gavetaAtual === b.dataset.gaveta) { self.fecharGaveta(); return; }
          self.abrirGaveta(b.dataset.gaveta, true);
        };
      })(abas[i]);
    }
  };

  UI.abrirGaveta = function (qual, abrir) {
    this.gavetaAtual = qual;
    var abas = doc.querySelectorAll('#abas button');
    for (var i = 0; i < abas.length; i++) abas[i].classList.toggle('ativo', abas[i].dataset.gaveta === qual);
    if (abrir !== false) { this.gavetaAberta = true; $('gaveta').classList.add('aberta'); }
    this.desenharGaveta();
  };

  UI.fecharGaveta = function () {
    /* No computador a gaveta é um painel fixo: não fecha. */
    if (global.matchMedia && global.matchMedia('(min-width: 1000px)').matches) return;
    this.gavetaAberta = false;
    $('gaveta').classList.remove('aberta');
  };

  UI.mostrarAviso = function (texto, nivel) {
    var el = $('avisoHud');
    el.textContent = texto;
    el.className = 'ver ' + (nivel || 'info');
    clearTimeout(this._avisoTimer);
    this._avisoTimer = setTimeout(function () { el.className = ''; }, 4200);
  };

  /* ================================================= barra superior ====== */
  UI.atualizarHud = function () {
    var sim = this.sim, j = sim.jogador;
    $('hudM').textContent = U.num(j.m);
    $('hudC').textContent = U.num(j.c);
    var pop = j.popUsada + j.popReservada;
    $('hudPop').textContent = pop + '/' + j.popCap;
    $('hudPop').parentNode.classList.toggle('critico', pop >= j.popCap);
    var e = sim.deficitEnergia || sim.energiaEstrutural();
    $('hudE').textContent = Math.max(0, e.livre != null ? e.livre : 0) + '/' + e.fornece;
    $('hudE').parentNode.classList.toggle('critico', e.deficit > 0);
    $('hudT').textContent = Math.round(j.energia);

    var o = sim.onda;
    var caixa = doc.querySelector('.onda');
    caixa.classList.toggle('ataque', o.estado === 'ataque');
    $('hudFaseOnda').textContent = sim.modo === 'livre' ? 'CONSTRUÇÃO LIVRE'
      : o.estado === 'preparo' ? 'PREPARAÇÃO' : 'ATAQUE · ' + (o.direcoes.join(' / ').toUpperCase());
    $('hudOnda').textContent = 'ONDA ' + o.num + (isFinite(o.total) ? '/' + o.total : '');
    $('hudRelogio').textContent = sim.modo === 'livre' ? '—'
      : o.estado === 'preparo' ? U.tempo(o.tempo) : (o.vivos + ' vivos');

    $('btnVel').textContent = sim.velocidade + '×';
    $('btnPausa').textContent = sim.pausado ? '▶' : '⏸';

    var alvoTexto = '';
    if (sim.modo === 'campanha' && sim.setor.entregaAlvo) {
      alvoTexto = U.num(Math.min(sim.estatisticas.entregue, sim.setor.entregaAlvo)) + ' / ' + U.num(sim.setor.entregaAlvo) + ' minerais entregues';
    } else if (isFinite(o.total)) {
      alvoTexto = 'Ondas resistidas: ' + Math.max(0, o.num - (o.estado === 'ataque' ? 1 : 0)) + ' de ' + o.total;
    }
    $('objetivoTexto').textContent = sim.setor.objetivo;
    $('objetivoProgresso').textContent = alvoTexto;

    var chefe = null;
    for (var i = 0; i < sim.unidades.length; i++) if (sim.unidades[i].def.chefe && !sim.unidades[i].morta) chefe = sim.unidades[i];
    $('chefeHud').hidden = !chefe;
    if (chefe) {
      $('chefeNome').textContent = chefe.def.nome.toUpperCase();
      $('chefeVida').style.width = (100 * chefe.hp / chefe.hpMax).toFixed(1) + '%';
    }
  };

  /* ============================================ ações contextuais ======= */
  function botao(rotulo, icone, sub, aoClicar, opcoes) {
    opcoes = opcoes || {};
    var b = doc.createElement('button');
    b.className = 'acao' + (opcoes.ligado ? ' ligado' : '') + (opcoes.perigo ? ' perigo' : '');
    b.innerHTML = '<i>' + icone + '</i><b>' + rotulo + '</b>' + (sub ? '<small>' + sub + '</small>' : '');
    if (opcoes.motivo) b.title = opcoes.motivo;
    b.disabled = !!opcoes.desativado;
    b.onclick = aoClicar;
    return b;
  }

  UI.atualizarAcoes = function () {
    var self = this, sim = this.sim, cx = $('acoesContexto');
    cx.innerHTML = '';
    var sel = this.selecionado ? sim.alvoPorId(this.selecionado) : null;
    var tropas = this.unidadesSelecionadas();

    if (this.jazidaSelecionada) {
      var jz = this.jazidaSelecionada;
      $('selNome').textContent = jz.tipo === 'cristal' ? 'Jazida de cristais' : 'Depósito de minério';
      $('selDetalhe').textContent = U.num(jz.estoque) + ' restantes · ' + jz.ocupadas + '/' + jz.vagas + ' operários';
      cx.appendChild(botao('Minerar aqui', '⛏', 'operário livre', function () {
        var op = sim.operarioLivreMaisProximo(jz.x, jz.y);
        if (!op) { self.mostrarAviso('Nenhum operário livre.', 'atencao'); return; }
        sim.darTarefa(op, { tipo: 'minerar', jazida: jz.id }, true);
        self.mostrarAviso('Operário enviado à jazida.', 'info');
      }));
      if (jz.tipo === 'cristal') {
        cx.appendChild(botao('Extrator', '⬡', this.precoTexto(sim.custoDe(ESTR.extrator)), function () { self.iniciarConstrucao('extrator'); },
          { desativado: !!sim.requisitoFaltante(ESTR.extrator), motivo: sim.requisitoFaltante(ESTR.extrator) }));
      }
      return;
    }

    if (tropas.length > 1 || this.grupoSelecionado) {
      var nomes = { soldados: 'Soldados', operarios: 'Operários', aereos: 'Aéreos', feridos: 'Feridos' };
      $('selNome').textContent = (nomes[this.grupoSelecionado] || 'Grupo') + ' · ' + tropas.length;
      $('selDetalhe').textContent = 'Toque no terreno para dar a ordem.';
      this.acoesDeTropa(cx, tropas);
      return;
    }

    if (!sel) {
      $('selNome').textContent = 'Nada selecionado';
      $('selDetalhe').textContent = 'Toque em uma estrutura, unidade, jazida ou no terreno.';
      this.acoesGlobais(cx);
      return;
    }

    if (sel.w) this.acoesDeEstrutura(cx, sel);
    else if (sel.lado === 'inimigo') {
      $('selNome').textContent = sel.def.nome;
      $('selDetalhe').textContent = Math.ceil(sel.hp) + '/' + sel.hpMax + ' · blindagem ' + (sel.def.blind || 0) + ' · ' + sel.def.desc;
      cx.appendChild(botao(sim.alvoPrioritario === sel.id ? 'Fogo marcado' : 'Concentrar fogo', '⌖', 'torres e tropas',
        function () { sim.alvoPrioritario = sim.alvoPrioritario === sel.id ? 0 : sel.id; self.atualizarAcoes(); },
        { ligado: sim.alvoPrioritario === sel.id }));
      cx.appendChild(botao('Bombardear', '◎', D.REGRAS.custoBombardeio + ' ◉', function () { self.iniciarHabilidade('bombardeio'); }));
    } else {
      this.acoesDeUnidade(cx, sel);
    }
  };

  UI.acoesGlobais = function (cx) {
    var self = this, sim = this.sim;
    cx.appendChild(botao('Operário', '👷', this.precoTexto(sim.custoDe(UNID.operario)), function () {
      var r = sim.produzirOperario();
      if (!r.ok) { self.mostrarAviso(r.motivo, 'atencao'); UF.audio.evento('negado'); }
      else self.mostrarAviso('Operário na fila da Central.', 'info');
      self.atualizarTudo();
    }));
    cx.appendChild(botao('Distribuir', '⛏', 'todos à mineração', function () { sim.distribuirMineracao(); self.atualizarTudo(); }));
    cx.appendChild(botao('Recolher', '🏠', 'operários à Central', function () { sim.recolherTodos(); self.atualizarTudo(); }));
    cx.appendChild(botao('Reparar linha', '✚', 'reserva ' + sim.reparoAuto.reserva + ' ◆',
      function () { self.acaoRepararLinha(); }, { ligado: sim.reparoAuto.ativo }));
    cx.appendChild(botao('Bombardear', '◎', D.REGRAS.custoBombardeio + ' ◉', function () { self.iniciarHabilidade('bombardeio'); },
      { desativado: sim.jogador.energia < D.REGRAS.custoBombardeio }));
  };

  UI.acoesDeTropa = function (cx, tropas) {
    var self = this;
    var temOperario = tropas.some(function (u) { return u.operario; });
    cx.appendChild(botao('Mover', '→', 'sem perseguir', function () { self.iniciarOrdem('mover'); }));
    if (!temOperario) {
      cx.appendChild(botao('Atacar', '⚔', 'avança atacando', function () { self.iniciarOrdem('moverAtacando'); }));
      cx.appendChild(botao('Patrulhar', '↔', 'entre dois pontos', function () { self.iniciarOrdem('patrulhar'); }));
    }
    cx.appendChild(botao('Recuar', '⇤', 'preserva tropas', function () { self.iniciarOrdem('recuar'); }));
    if (temOperario) {
      cx.appendChild(botao('Minerar', '⛏', 'jazida mais próxima', function () {
        tropas.forEach(function (u) {
          if (!u.operario) return;
          var j = self.sim.jazidaLivreMaisProxima(u.x, u.y);
          if (j) self.sim.darTarefa(u, { tipo: 'minerar', jazida: j.id }, false);
        });
        self.mostrarAviso('Operários voltaram à mineração.', 'info');
      }));
    }
  };

  UI.acoesDeUnidade = function (cx, u) {
    var self = this, sim = this.sim;
    var tarefa = u.tarefa ? u.tarefa.tipo : '—';
    var rotuloTarefa = {
      ocioso: 'sem tarefa', minerar: 'minerando', construir: 'construindo', reparar: 'reparando',
      mover: 'a caminho', fugindo: 'fugindo do combate', defender: 'defendendo a área',
      moverAtacando: 'avançando', patrulhar: 'patrulhando', recuar: 'recuando', focar: 'fogo concentrado'
    }[tarefa] || tarefa;
    $('selNome').textContent = u.def.nome;
    $('selDetalhe').textContent = Math.ceil(u.hp) + '/' + u.hpMax + ' · ' + rotuloTarefa +
      (u.carga ? ' · carga ' + u.carga : '') + (u.bloqueado ? ' · SEM ROTA' : '');
    this.acoesDeTropa(cx, [u]);
    if (u.operario) {
      cx.appendChild(botao('Reparar', '✚', 'estrutura ferida', function () {
        var alvo = sim.estruturaMaisFeridaProxima(u.x, u.y);
        if (!alvo) { self.mostrarAviso('Nada danificado por perto.', 'atencao'); return; }
        sim.darTarefa(u, { tipo: 'reparar', alvo: alvo.id }, true);
        self.mostrarAviso('Reparando ' + alvo.def.nome + '.', 'info');
      }));
    }
  };

  UI.acoesDeEstrutura = function (cx, b) {
    var self = this, sim = this.sim;
    var estado = !b.construida ? (b.abandonado ? 'posto abandonado' : 'em obra ' + Math.round(b.obra * 100) + '%')
      : b.semEnergia ? 'sem energia' : 'operando';
    $('selNome').textContent = b.def.nome + (b.abandonado && !b.construida ? ' (abandonado)' : '');
    $('selDetalhe').textContent = Math.ceil(b.hp) + '/' + b.hpMax + ' · ' + estado +
      (b.construtores ? ' · ' + b.construtores + ' operário(s)' : '');

    if (!b.construida) {
      cx.appendChild(botao(b.abandonado ? 'Reativar' : 'Acelerar obra', '🔧', 'enviar operário', function () {
        var op = sim.operarioLivreMaisProximo(b.x, b.y);
        if (!op) { self.mostrarAviso('Nenhum operário livre.', 'atencao'); return; }
        sim.darTarefa(op, { tipo: 'construir', alvo: b.id }, true);
        self.mostrarAviso('Operário a caminho da obra.', 'info');
      }));
    }
    if (b.hp < b.hpMax) {
      cx.appendChild(botao('Reparar', '✚', 'operário mais próximo', function () {
        var op = sim.operarioLivreMaisProximo(b.x, b.y);
        if (!op) { self.mostrarAviso('Nenhum operário livre.', 'atencao'); return; }
        sim.darTarefa(op, { tipo: 'reparar', alvo: b.id }, true);
      }));
    }
    if (b.def.produz && b.construida) {
      cx.appendChild(botao('Produzir', '▲', 'abrir fila', function () { self.abrirGaveta('tropas', true); self.estruturaProducao = b.id; self.desenharGaveta(); }));
      cx.appendChild(botao('Encontro', '⚑', 'ponto de reunião', function () {
        self.modo = { tipo: 'rally', estrutura: b.id };
        self.mostrarModo('Toque onde as novas unidades devem se reunir');
      }));
    }
    if (b.portao) {
      var proximos = { auto: 'aberto', aberto: 'fechado', fechado: 'auto' };
      var rot = { auto: 'Automático', aberto: 'Sempre aberto', fechado: 'Sempre fechado' };
      cx.appendChild(botao(rot[b.portaoModo], b.portaoAberto ? '◻' : '◼', 'tocar para trocar', function () {
        b.portaoModo = proximos[b.portaoModo];
        self.atualizarAcoes();
      }, { ligado: b.portaoModo !== 'fechado' }));
    }
    if (b.torre && b.construida) {
      cx.appendChild(botao(b.desligada ? 'Ligar' : 'Desligar', 'ϟ', 'poupa energia', function () {
        b.desligada = !b.desligada; self.atualizarAcoes();
      }, { ligado: !b.desligada }));
    }
    if (b !== sim.central && b.construida) {
      var volta = Math.round((b.custo.m || 0) * D.REGRAS.reembolso);
      cx.appendChild(botao('Vender', '↩', '+' + volta + ' ◆', function () {
        sim.devolver(b.custo, D.REGRAS.reembolso);
        sim.matar(b, { silencioso: true });
        self.selecionar(null);
        self.mostrarAviso('Estrutura vendida por ' + volta + ' minerais.', 'info');
      }, { perigo: true }));
    }
  };

  UI.acaoRepararLinha = function () {
    this.sim.repararLinha();
    this.atualizarAcoes();
  };

  /* ==================================================== gaveta =========== */
  var CATEGORIAS = [
    { id: 'base', nome: 'BASE' },
    { id: 'defesa', nome: 'DEFESA' },
    { id: 'producao', nome: 'PRODUÇÃO' },
    { id: 'tecnologia', nome: 'TECNOLOGIA' }
  ];

  UI.desenharGaveta = function () {
    if (!this.sim) return;
    var alvo = $('gavetaConteudo');
    alvo.innerHTML = '';
    var metodo = {
      construir: this.gavetaConstruir, tropas: this.gavetaTropas,
      evolucao: this.gavetaEvolucao, comando: this.gavetaComando, tatica: this.gavetaTatica
    }[this.gavetaAtual];
    if (metodo) metodo.call(this, alvo);
  };

  function carta(titulo, preco, descricao, faltando, aoClicar, selecionada) {
    var b = doc.createElement('button');
    b.className = 'carta' + (faltando ? ' silhueta' : '') + (selecionada ? ' selecionada' : '');
    b.innerHTML = '<span class="linha"><b>' + titulo + '</b><span class="preco">' + preco + '</span></span>' +
      '<small>' + descricao + '</small>' +
      (faltando ? '<span class="falta">' + faltando + '</span>' : '');
    b.onclick = aoClicar;
    return b;
  }

  UI.precoDe = function (def) {
    var c = this.sim.custoDe(def);
    var partes = [];
    if (c.m) partes.push(c.m + ' ◆');
    if (c.c) partes.push('<em>' + c.c + ' ⬡</em>');
    return partes.join(' ') || 'grátis';
  };

  UI.gavetaConstruir = function (alvo) {
    var self = this, sim = this.sim;
    CATEGORIAS.forEach(function (cat) {
      var tipos = Object.keys(ESTR).filter(function (t) { return ESTR[t].cat === cat.id && t !== 'central'; });
      if (!tipos.length) return;
      var titulo = doc.createElement('div');
      titulo.className = 'grupo-titulo';
      titulo.textContent = cat.nome;
      alvo.appendChild(titulo);
      var grade = doc.createElement('div');
      grade.className = 'cartas';
      tipos.forEach(function (tipo) {
        var def = ESTR[tipo];
        var falta = sim.requisitoFaltante(def);
        if (!falta && !sim.temRecurso(sim.custoDe(def))) falta = 'Recursos insuficientes';
        var descricao = def.desc + ' · ' + def.w + '×' + def.h +
          (def.energia ? ' · ' + def.energia + ' ϟ' : '') + (def.fornece ? ' · +' + def.fornece + ' ϟ' : '');
        grade.appendChild(carta(def.nome, self.precoDe(def), descricao, falta, function () {
          if (sim.requisitoFaltante(def)) { self.mostrarAviso(sim.requisitoFaltante(def), 'atencao'); UF.audio.evento('negado'); return; }
          self.iniciarConstrucao(tipo);
        }, self.modo && self.modo.estrutura === tipo));
      });
      alvo.appendChild(grade);
    });
  };

  UI.gavetaTropas = function (alvo) {
    var self = this, sim = this.sim;
    var produtores = sim.listaEstruturas.filter(function (b) { return b.def.produz && b.construida && !b.morta; });
    if (!produtores.length) {
      alvo.innerHTML = '<p class="aviso-linha">Nenhuma estrutura de produção pronta. Construa um Quartel para treinar soldados.</p>';
      return;
    }
    produtores.forEach(function (b) {
      var titulo = doc.createElement('div');
      titulo.className = 'grupo-titulo';
      titulo.textContent = b.def.nome.toUpperCase() + (b.semEnergia ? ' · SEM ENERGIA' : '') + (b.semSaida ? ' · SEM SAÍDA' : '');
      alvo.appendChild(titulo);

      if (b.fila.length) {
        var fila = doc.createElement('div');
        fila.className = 'fila';
        b.fila.forEach(function (item, i) {
          var bt = doc.createElement('button');
          bt.textContent = (UNID[item.tipo] ? UNID[item.tipo].nome : item.tipo) +
            (i === 0 ? ' · ' + Math.round(item.progresso * 100) + '%' : '') + ' ✕';
          bt.onclick = function () {
            var r = sim.cancelarEncomenda(b.id, i);
            if (r.ok) self.mostrarAviso('Cancelado. Devolvido ' + Math.round(r.reembolso * 100) + '% do custo.', 'info');
            self.atualizarTudo();
          };
          fila.appendChild(bt);
        });
        alvo.appendChild(fila);
        var p = doc.createElement('div');
        p.className = 'progresso';
        p.innerHTML = '<i style="width:' + Math.round(U.clamp(b.fila[0].progresso, 0, 1) * 100) + '%"></i>';
        alvo.appendChild(p);
      }

      var grade = doc.createElement('div');
      grade.className = 'cartas';
      b.def.produz.forEach(function (tipo) {
        var def = UNID[tipo];
        var falta = sim.requisitoFaltante(def);
        if (!falta && !sim.temRecurso(sim.custoDe(def))) falta = 'Recursos insuficientes';
        if (!falta && sim.popLivre() < (def.pop || 0)) falta = 'Sem capacidade de população';
        grade.appendChild(carta(def.nome, self.precoDe(def),
          def.desc + ' · ' + (def.pop || 0) + ' pop · ' + def.tempo + 's', falta, function () {
            var r = sim.encomendar(b.id, tipo);
            if (!r.ok) { self.mostrarAviso(r.motivo, 'atencao'); UF.audio.evento('negado'); }
            else UF.audio.evento('clique');
            self.atualizarTudo();
          }));
      });
      alvo.appendChild(grade);
    });
  };

  var RAMOS = [
    { id: 'economia', nome: 'ECONOMIA' }, { id: 'fortificacao', nome: 'FORTIFICAÇÃO' },
    { id: 'armamento', nome: 'ARMAMENTO' }, { id: 'comando', nome: 'COMANDO' }
  ];

  UI.gavetaEvolucao = function (alvo) {
    var self = this, sim = this.sim, j = sim.jogador;
    var cab = doc.createElement('div');
    cab.className = 'grupo-titulo';
    cab.textContent = 'TECNOLOGIA ' + ['', 'I', 'II', 'III'][j.tech] + ' · ' +
      Object.keys(j.pesquisas).length + ' pesquisa(s) concluída(s)';
    alvo.appendChild(cab);

    if (j.pesquisaAtual) {
      var pa = j.pesquisaAtual;
      var box = doc.createElement('div');
      box.innerHTML = '<div class="aviso-linha">' + (pa.pausada ? 'PAUSADA (laboratório perdido): ' : 'Pesquisando: ') +
        pa.def.nome + ' · ' + Math.round(pa.progresso * 100) + '%</div>' +
        '<div class="progresso"><i style="width:' + Math.round(pa.progresso * 100) + '%"></i></div>';
      var bt = doc.createElement('button');
      bt.className = 'carta';
      bt.innerHTML = '<span class="linha"><b>Cancelar pesquisa</b><span class="preco">devolve ' + Math.round(D.REGRAS.reembolso * 100) + '%</span></span><small>Pausar não é cancelar: cancelar perde parte do investimento.</small>';
      bt.onclick = function () { sim.cancelarPesquisa(); self.atualizarTudo(); };
      box.appendChild(bt);
      alvo.appendChild(box);
    }

    RAMOS.forEach(function (ramo) {
      var lista = D.PESQUISAS.filter(function (p) { return p.ramo === ramo.id; });
      if (!lista.length) return;
      var t = doc.createElement('div');
      t.className = 'grupo-titulo';
      t.textContent = ramo.nome;
      alvo.appendChild(t);
      var grade = doc.createElement('div');
      grade.className = 'cartas';
      lista.forEach(function (p) {
        var pronto = !!j.pesquisas[p.id];
        var ver = sim.pesquisaDisponivel(p);
        grade.appendChild(carta(p.nome, pronto ? '✓ concluída' : self.precoDe(p),
          p.efeito + (p.tempo ? ' · ' + p.tempo + 's' : ''), pronto ? null : (ver.ok ? null : ver.motivo),
          function () {
            if (pronto) return;
            var r = sim.pesquisar(p.id);
            if (!r.ok) { self.mostrarAviso(r.motivo, 'atencao'); UF.audio.evento('negado'); }
            else self.mostrarAviso('Pesquisa iniciada: ' + p.nome, 'info');
            self.atualizarTudo();
          }));
      });
      alvo.appendChild(grade);
    });
  };

  UI.gavetaComando = function (alvo) {
    var self = this, sim = this.sim;
    var grade = doc.createElement('div');
    grade.className = 'cartas';
    grade.appendChild(carta('Produzir operário', self.precoDe(UNID.operario),
      'Mais renda no futuro, menos defesa agora.', null, function () {
        var r = sim.produzirOperario();
        if (!r.ok) self.mostrarAviso(r.motivo, 'atencao');
        self.atualizarTudo();
      }));
    grade.appendChild(carta('Distribuir na mineração', 'ordem global',
      'Manda todos os operários livres para a jazida mais próxima.', null, function () { sim.distribuirMineracao(); self.atualizarTudo(); }));
    grade.appendChild(carta('Recolher todos', 'ordem global',
      'Traz os operários para junto da Central.', null, function () { sim.recolherTodos(); self.atualizarTudo(); }));
    grade.appendChild(carta(sim.reparoAuto.ativo ? 'Reparo automático: LIGADO' : 'Reparo automático: desligado',
      'reserva ' + sim.reparoAuto.reserva + ' ◆',
      'Até ' + sim.reparoAuto.max + ' operários mantêm a linha. Pausa ao atingir a reserva.', null,
      function () { sim.repararLinha(); self.atualizarTudo(); }));
    alvo.appendChild(grade);

    var t = doc.createElement('div');
    t.className = 'grupo-titulo';
    t.textContent = 'GRUPOS RÁPIDOS';
    alvo.appendChild(t);
    var g2 = doc.createElement('div');
    g2.className = 'cartas';
    [['soldados', 'Soldados', '1'], ['operarios', 'Operários', '2'], ['aereos', 'Aéreos', '3'], ['feridos', 'Feridos', '4']].forEach(function (par) {
      var n = sim.unidades.filter(function (u) {
        if (u.lado !== 'aliado' || u.morta) return false;
        if (par[0] === 'soldados') return !u.operario && !u.voa;
        if (par[0] === 'operarios') return u.operario;
        if (par[0] === 'aereos') return u.voa;
        return u.hp < u.hpMax * 0.55;
      }).length;
      g2.appendChild(carta(par[1], n + ' unidade(s)', 'Tecla ' + par[2], null, function () { self.selecionarGrupo(par[0]); self.fecharGaveta(); }));
    });
    alvo.appendChild(g2);
  };

  UI.gavetaTatica = function (alvo) {
    var self = this, sim = this.sim;
    var grade = doc.createElement('div');
    grade.className = 'cartas';
    grade.appendChild(carta('Bombardeio de precisão', D.REGRAS.custoBombardeio + ' ◉',
      'Escolha uma área. O impacto demora 1,8 s e é anunciado no terreno.',
      sim.jogador.energia < D.REGRAS.custoBombardeio ? 'Energia tática insuficiente' : null,
      function () { self.iniciarHabilidade('bombardeio'); self.fecharGaveta(); }));
    grade.appendChild(carta('Escudo de setor', D.REGRAS.custoEscudo + ' ◉',
      'Reduz 70% do dano dentro de um raio de 7 células por 8 segundos.',
      sim.jogador.energia < D.REGRAS.custoEscudo ? 'Energia tática insuficiente' : null,
      function () { self.iniciarHabilidade('escudo'); self.fecharGaveta(); }));
    grade.appendChild(carta(sim.alvoPrioritario ? 'Remover alvo marcado' : 'Fogo concentrado',
      'toque no inimigo', 'Torres e soldados priorizam o alvo marcado quando conseguem atingi-lo.', null,
      function () { sim.alvoPrioritario = 0; self.atualizarTudo(); }));
    alvo.appendChild(grade);

    var t = doc.createElement('div');
    t.className = 'grupo-titulo';
    t.textContent = 'SITUAÇÃO DO SETOR';
    alvo.appendChild(t);
    var e = sim.deficitEnergia || sim.energiaEstrutural();
    var estoque = sim.world.jazidas.reduce(function (a, j) { return a + (j.tipo === 'mineral' ? j.estoque : 0); }, 0);
    var painel = doc.createElement('div');
    painel.className = 'placar';
    painel.innerHTML =
      '<div><b>' + sim.estatisticas.abates + '</b><span>INVASORES ABATIDOS</span></div>' +
      '<div><b>' + sim.estatisticas.perdas + '</b><span>ESTRUTURAS PERDIDAS</span></div>' +
      '<div><b>' + U.num(sim.estatisticas.entregue) + '</b><span>MINERAIS ENTREGUES</span></div>' +
      '<div><b>' + U.num(estoque) + '</b><span>MINÉRIO NO SETOR</span></div>' +
      '<div><b>' + e.fornece + '/' + e.consome + '</b><span>ENERGIA FORNECIDA/USADA</span></div>' +
      '<div><b>' + U.num(Math.round(sim.estatisticas.gastoReparo)) + '</b><span>GASTO EM REPAROS</span></div>';
    alvo.appendChild(painel);
  };

  /* ===================================================== modais ========== */
  UI.abrirModal = function (olho, titulo, corpoHtml, acoes) {
    $('modalOlho').textContent = olho;
    $('modalTitulo').textContent = titulo;
    $('modalCorpo').innerHTML = corpoHtml;
    var cx = $('modalAcoes');
    cx.innerHTML = '';
    (acoes || []).forEach(function (a) {
      var b = doc.createElement('button');
      b.textContent = a.rotulo;
      if (a.principal) b.className = 'principal';
      b.onclick = a.aoClicar;
      cx.appendChild(b);
    });
    $('modal').hidden = false;
  };

  UI.fecharModal = function () { $('modal').hidden = true; };

  UI.abrirMenuPartida = function () {
    var self = this, sim = this.sim;
    var estavaPausado = sim.pausado;
    sim.pausado = true;
    this.abrirModal('COMANDO', 'Partida pausada',
      '<p>' + sim.setor.nome + ' · ' + sim.setor.regiao + '</p>' +
      '<p style="color:#8b9ab0">' + sim.setor.objetivo + '</p>', [
      { rotulo: 'Continuar', principal: true, aoClicar: function () { sim.pausado = estavaPausado; self.fecharModal(); } },
      { rotulo: 'Salvar agora', aoClicar: function () {
        var ok = UF.Salvar.gravar(sim);
        self.mostrarAviso(ok ? 'Partida salva neste aparelho.' : 'Não foi possível gravar (armazenamento bloqueado).', ok ? 'bom' : 'perigo');
      } },
      { rotulo: 'Exportar progresso', aoClicar: function () { self.jogo.exportar(); } },
      { rotulo: 'Como se joga', aoClicar: function () { self.jogo.mostrarAjuda(); } },
      { rotulo: 'Sair para o mapa', aoClicar: function () {
        UF.Salvar.gravar(sim);
        self.fecharModal();
        self.jogo.voltarAoMapa();
      } }
    ]);
  };

  UI.atualizarTudo = function () {
    if (!this.sim) return;
    this.atualizarHud();
    this.atualizarAcoes();
    this.desenharGaveta();
  };
})(typeof window !== 'undefined' ? window : globalThis);
