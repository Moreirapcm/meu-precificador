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
    $('btnOciosos').onclick = function () { self.proximoOcioso(); };
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
    this.atualizarVivos();
    this.atualizarOciosos();
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
  /* CASAS FIXAS.
     No StarCraft a grade de comandos é 3x3 e a casa de cada comando NÃO muda:
     Mover é sempre a primeira, Parar a segunda, Atacar a terceira. Comando que
     não se aplica deixa a casa VAZIA — nunca empurra o vizinho para o lado.

     Era a nossa maior distância dos clássicos, e não se via olhando uma tela
     só: "Recuar" era o 3.o botão num soldado, o 4.o num grupo com operário e o
     2.o num operário sozinho. O dedo nunca decorava lugar nenhum, e num jogo de
     celular decorar o lugar é a única forma de agir rápido.

     A casa é do COMANDO, não da unidade: por isso as três tabelas abaixo. */
  var CASAS_TROPA = {
    mover: 0, parar: 1, atacar: 2,
    patrulhar: 3, recuar: 4, base: 5,
    minerar: 6, reparar: 7, construir: 8
  };
  /* Prédio PRONTO. O prédio em obra não entra nesta tabela: ele é outro
     estado, com outra carta curta, como no StarCraft — construção em
     andamento mostra um botão só. Fosse pela mesma tabela, todo prédio pronto
     começaria com duas casas vazias na frente, e num celular isso é espaço
     roubado sem ensinar nada. */
  var CASAS_ESTRUTURA = {
    produzir: 0, encontro: 1, reparar: 2,
    portao: 3, energia: 4, vender: 5
  };
  var CASAS_GLOBAL = {
    operario: 0, distribuir: 1, recolher: 2,
    linha: 3, bombardeio: 4, construir: 5
  };

  /* Um símbolo por estrutura. Não é enfeite: no painel a figura é o que o olho
     acha primeiro, e o nome só confirma. Sem ícone a página de construção vira
     uma lista de palavras do mesmo tamanho, que é o pior caso para achar
     depressa. */
  var ICONE_ESTRUTURA = {
    alojamento: '⌂', gerador: '☀', eolica: '✾', nuclear: '☢', fusao: '✦',
    deposito: '▣', quartel: '⚔', oficina: '⚙', pesquisa: '⚗', extrator: '⬢',
    radar: '◉', muro: '▬', portao: '◫', torreMuralha: '⊓', bastiao: '⛨',
    sentinela: '↑', gelo: '❄', artilharia: '◎', plasma: 'ϟ'
  };

  var ICONE_GRUPO = { base: '⌂', defesa: '⛨', producao: '⚔', tecnologia: '⚗' };
  var ICONE_UNIDADE = {
    operario: '👷', fuzileiro: '🔫', lanceiro: '➹', incendiario: '🔥',
    medico: '✚', tanque: '⛟', drone: '✈'
  };

  function botao(rotulo, icone, sub, aoClicar, opcoes) {
    opcoes = opcoes || {};
    var b = doc.createElement('button');
    b.className = 'acao' + (opcoes.ligado ? ' ligado' : '') + (opcoes.perigo ? ' perigo' : '');
    /* A letra de atalho vai DENTRO do botão, como nos dois clássicos — no
       StarCraft ela aparece em amarelo no meio do próprio rótulo. Os atalhos
       já existiam em `ui.js` e não apareciam em lugar nenhum da tela: quem não
       leu o manual nunca soube que existiam. */
    b.innerHTML = '<i>' + icone + '</i><b>' + rotulo + '</b>' +
      (sub ? '<small>' + sub + '</small>' : '') +
      (opcoes.tecla ? '<u>' + opcoes.tecla.toUpperCase() + '</u>' : '');
    if (opcoes.motivo) b.title = opcoes.motivo;
    b.disabled = !!opcoes.desativado;
    b.onclick = aoClicar;
    return b;
  }

  /* Põe cada botão na sua casa e preenche os buracos. As casas vazias DEPOIS
     do último botão são cortadas: a barra rola de lado, e caixa vazia no fim
     só rouba espaço sem ensinar nada — o que precisa de lugar fixo é o que vem
     antes do último comando, não o vazio do fim. */
  function montarCasas(cx, casas) {
    var ultima = -1, i;
    for (i = 0; i < casas.length; i++) if (casas[i]) ultima = i;
    for (i = 0; i <= ultima; i++) {
      if (casas[i]) { cx.appendChild(casas[i]); continue; }
      var vazia = doc.createElement('span');
      vazia.className = 'acao vazia';
      cx.appendChild(vazia);
    }
  }

  /* O contador. Só aparece quando há alguém: botão que vive na tela mostrando
     zero vira parte do cenário e para de ser visto. Acima de três o anel pulsa
     — três operários sem trabalho já é uma jazida inteira sem ninguém. */
  UI.atualizarOciosos = function () {
    var b = $('btnOciosos');
    if (!b) return;
    var n = this.ociosos().length;
    /* Escreve ANTES de esconder. Saindo cedo quando n é zero, o botão guardava
       o número velho e reaparecia por uma fração de segundo com ele — número
       errado na tela é pior que botão nenhum. */
    $('ociososN').textContent = n;
    b.classList.toggle('pulsa', n >= 3);
    b.hidden = !n;
  };

  /* O que MUDA sozinho, atualizado sem refazer a barra.
     `atualizarAcoes` remonta o HTML inteiro e só roda a cada 0,9 s; vida caindo
     e barra de produção subindo precisam de passo mais curto que isso, e
     remontar o DOM a cada 0,2 s ainda perderia o dedo apoiado no botão. Aqui
     só os números vivos são reescritos, nos elementos que já existem. */
  UI.atualizarVivos = function () {
    var sim = this.sim;
    var barra = $('selVida');
    if (barra && !barra.hidden) {
      var alvo = this.selecionado ? sim.alvoPorId(this.selecionado) : null;
      if (alvo && alvo.hpMax) {
        var frac = Math.max(0, Math.min(1, alvo.hp / alvo.hpMax));
        $('selVidaBarra').style.width = (frac * 100).toFixed(1) + '%';
        $('selVidaBarra').className = frac > 0.6 ? 'cheia' : frac > 0.3 ? 'media' : 'baixa';
        $('selVidaNum').textContent = Math.ceil(alvo.hp) + '/' + alvo.hpMax;
      }
    }
    var faixa = $('filaBarra');
    if (faixa && !faixa.hidden && faixa.firstChild) {
      var b = this.selecionado ? sim.estruturas[this.selecionado] : null;
      var item = b && b.fila && b.fila[0];
      var traco = faixa.firstChild.querySelector('i');
      /* Quantidade de itens mudou (nasceu um, cancelaram outro): aí sim remonta,
         porque o que mudou foi a lista e não o número dentro dela. */
      if (!item || !b.fila || b.fila.length !== faixa.children.length) this.filaNaBarra(b);
      else if (traco) traco.style.width = Math.round((item.progresso || 0) * 100) + '%';
    }
  };

  /* Campos de POSIÇÃO FIXA no lugar de uma linha de texto corrida.
     Antes saía "38/40 · minerando · carga 8 · SEM ROTA" — a mesma informação,
     mas o olho tinha de LER para achar cada pedaço. Nos dois clássicos vida,
     nome e estado têm cada um o seu lugar, e lugar fixo o olho acha sem ler. */
  UI.mostrarSelecao = function (nome, hp, hpMax, estado) {
    $('selNome').textContent = nome;
    var barra = $('selVida');
    if (hpMax) {
      var frac = Math.max(0, Math.min(1, hp / hpMax));
      barra.hidden = false;
      $('selVidaBarra').style.width = (frac * 100).toFixed(1) + '%';
      $('selVidaBarra').className = frac > 0.6 ? 'cheia' : frac > 0.3 ? 'media' : 'baixa';
      $('selVidaNum').textContent = Math.ceil(hp) + '/' + hpMax;
    } else {
      barra.hidden = true;
    }
    $('selDetalhe').textContent = estado;
  };

  UI.atualizarAcoes = function () {
    var self = this, sim = this.sim, cx = $('acoesContexto');
    cx.innerHTML = '';
    if (this.paginaAcoes && this.paginaAcoes.indexOf('produzir:') === 0) {
      var idProd = +this.paginaAcoes.split(':')[1];
      var prod = sim.estruturas[idProd];
      if (prod && !prod.morta) {
        this.mostrarSelecao(prod.def.nome, prod.hp, prod.hpMax, 'Escolha o que treinar.');
        this.paginaProduzir(cx, idProd);
        this.filaNaBarra(prod);
        return;
      }
      this.paginaAcoes = null;
    }
    if (this.paginaAcoes && this.paginaAcoes.indexOf('construir') === 0) {
      var grupo = this.paginaAcoes.split(':')[1] || null;
      $('selVida').hidden = true;
      this.filaNaBarra(null);
      if (!grupo) {
        $('selNome').textContent = 'Construir';
        $('selDetalhe').textContent = 'Escolha o grupo. O número diz quanto já dá.';
        this.paginaConstruir(cx);
      } else {
        var nomeGrupo = '';
        for (var g = 0; g < CATEGORIAS.length; g++) if (CATEGORIAS[g].id === grupo) nomeGrupo = CATEGORIAS[g].nome;
        $('selNome').textContent = nomeGrupo.charAt(0) + nomeGrupo.slice(1).toLowerCase();
        $('selDetalhe').textContent = 'Apagada é o que ainda não dá.';
        this.paginaGrupo(cx, grupo);
      }
      return;
    }
    var sel = this.selecionado ? sim.alvoPorId(this.selecionado) : null;
    var tropas = this.unidadesSelecionadas();

    if (this.jazidaSelecionada) {
      var jz = this.jazidaSelecionada;
      $('selNome').textContent = jz.tipo === 'petroleo' ? 'Afloramento de petróleo' : 'Depósito de minério';
      $('selDetalhe').textContent = U.num(jz.estoque) + ' restantes · ' + jz.ocupadas + '/' + jz.vagas + ' operários';
      cx.appendChild(botao('Minerar aqui', '⛏', 'operário livre', function () {
        var op = sim.operarioLivreMaisProximo(jz.x, jz.y);
        if (!op) { self.mostrarAviso('Nenhum operário livre.', 'atencao'); return; }
        sim.darTarefa(op, { tipo: 'minerar', jazida: jz.id }, true);
        self.mostrarAviso('Operário enviado à jazida.', 'info');
      }));
      if (jz.tipo === 'petroleo') {
        cx.appendChild(botao('Bomba', '⬢', this.precoTexto(sim.custoDe(ESTR.extrator)), function () { self.iniciarConstrucao('extrator'); },
          { desativado: !!sim.requisitoFaltante(ESTR.extrator), motivo: sim.requisitoFaltante(ESTR.extrator) }));
      }
      return;
    }

    if (tropas.length > 1 || this.grupoSelecionado) {
      var nomes = { soldados: 'Soldados', operarios: 'Operários', aereos: 'Aéreos', feridos: 'Feridos' };
      $('selNome').textContent = (this.rotuloSelecao || nomes[this.grupoSelecionado] || 'Grupo') +
        ' · ' + tropas.length;
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
    var self = this, sim = this.sim, casas = [];
    casas[CASAS_GLOBAL.operario] = botao('Operário', '👷', this.precoTexto(sim.custoDe(UNID.operario)), function () {
      var r = sim.produzirOperario();
      if (!r.ok) { self.mostrarAviso(r.motivo, 'atencao'); UF.audio.evento('negado'); }
      else self.mostrarAviso('Operário na fila da Central.', 'info');
      self.atualizarTudo();
    });
    casas[CASAS_GLOBAL.distribuir] = botao('Distribuir', '⛏', 'todos à mineração',
      function () { sim.distribuirMineracao(); self.atualizarTudo(); });
    casas[CASAS_GLOBAL.recolher] = botao('Recolher', '🏠', 'operários à Central',
      function () { sim.recolherTodos(); self.atualizarTudo(); });
    casas[CASAS_GLOBAL.linha] = botao('Reparar linha', '✚', 'reserva ' + sim.reparoAuto.reserva + ' ◆',
      function () { self.acaoRepararLinha(); }, { ligado: sim.reparoAuto.ativo, tecla: 'l' });
    casas[CASAS_GLOBAL.bombardeio] = botao('Bombardear', '◎', D.REGRAS.custoBombardeio + ' ◉',
      function () { self.iniciarHabilidade('bombardeio'); },
      { desativado: sim.jogador.energia < D.REGRAS.custoBombardeio, tecla: 'q' });
    casas[CASAS_GLOBAL.construir] = this.botaoConstruir();
    montarCasas(cx, casas);
  };

  /* Devolve as casas da tropa em vez de despejar botões: quem chama decide se
     acrescenta comando próprio antes de montar a grade. */
  UI.casasDeTropa = function (tropas) {
    var self = this, casas = [];
    var temOperario = tropas.some(function (u) { return u.operario; });
    casas[CASAS_TROPA.mover] = botao('Mover', '→', 'sem perseguir',
      function () { self.iniciarOrdem('mover'); }, { tecla: 'm' });
    /* PARAR estava só no teclado. É um dos três comandos que toda unidade tem
       no StarCraft, e num jogo de toque sem teclado ele simplesmente não
       existia — a tropa mandada para o lugar errado não tinha como ser detida. */
    casas[CASAS_TROPA.parar] = botao('Parar', '■', 'cancela a ordem',
      function () { self.pararSelecionados(); }, { tecla: 's' });
    if (!temOperario) {
      casas[CASAS_TROPA.atacar] = botao('Atacar', '⚔', 'avança atacando',
        function () { self.iniciarOrdem('moverAtacando'); }, { tecla: 'a' });
      casas[CASAS_TROPA.patrulhar] = botao('Patrulhar', '↔', 'entre dois pontos',
        function () { self.iniciarOrdem('patrulhar'); }, { tecla: 'p' });
    }
    casas[CASAS_TROPA.recuar] = botao('Recuar', '⇤', 'preserva tropas',
      function () { self.iniciarOrdem('recuar'); }, { tecla: 'c' });
    /* Centra a câmera na Central — é o "home" do Age of Empires, não uma ordem
       de recuo. O rótulo diz isso: mandar a tropa para casa é "Recuar". */
    casas[CASAS_TROPA.base] = botao('Central', '🏠', 'centra a câmera',
      function () { self.voltarParaBase(); }, { tecla: 'h' });
    if (temOperario) {
      casas[CASAS_TROPA.minerar] = botao('Minerar', '⛏', 'jazida mais próxima', function () {
        tropas.forEach(function (u) {
          if (!u.operario) return;
          var j = self.sim.jazidaLivreMaisProxima(u.x, u.y);
          if (j) self.sim.darTarefa(u, { tipo: 'minerar', jazida: j.id }, false);
        });
        self.mostrarAviso('Operários voltaram à mineração.', 'info');
      }, { tecla: 'g' });
      casas[CASAS_TROPA.construir] = this.botaoConstruir();
    }
    return casas;
  };

  UI.acoesDeTropa = function (cx, tropas) {
    montarCasas(cx, this.casasDeTropa(tropas));
  };

  /* SEGUNDA PÁGINA DO PAINEL — a "Build" do StarCraft.
     Lá o operário tem "Build" na grade, e tocar troca a grade inteira pela
     lista de construções, com Cancelar no canto. É o desenho certo para um
     painel pequeno: em vez de espremer vinte comandos, troca-se a página.

     O que o Pedro pediu — "mostrar as construções que ele já pode fazer" —
     resolve-se mostrando TODAS, sempre na mesma ordem, e apagando as que ainda
     não dá: some a cor, fica o motivo. Estrutura que aparece e some conforme o
     minério sobe e desce faz a mesma coisa que a casa que anda — tira do
     jogador a chance de decorar onde as coisas estão. */
  UI.botaoConstruir = function () {
    var self = this;
    return botao('Construir', '⚒', 'estruturas', function () {
      self.paginaAcoes = 'construir';
      self.atualizarAcoes();
    }, { tecla: 'b' });
  };

  /* Estruturas de um grupo, sem a Central (que não se constrói). */
  function tiposDoGrupo(id) {
    return Object.keys(ESTR).filter(function (t) {
      return ESTR[t].cat === id && t !== 'central';
    });
  }

  /* PÁGINA DE GRUPOS.
     Nem o StarCraft nem o Age of Empires rolavam a barra de lado: onde não
     cabia, PAGINAVAM. O StarCraft parte em básica e avançada, oito estruturas
     por página mais o Cancelar; o Age parte em prédio econômico e prédio
     militar. Aqui a partição já existia em `data.js` desde sempre, no campo
     `cat`, e cabe no mesmo teto: base 6, defesa 8, produção 2, tecnologia 3.

     A conta de cada grupo diz o que dá AGORA — "5 de 8" — que é a pergunta
     que o jogador faz antes de abrir. */
  UI.paginaConstruir = function (cx) {
    var self = this, sim = this.sim;
    cx.appendChild(botao('Voltar', '↩', 'fecha a lista', function () {
      self.paginaAcoes = null;
      self.atualizarAcoes();
    }, { tecla: 'esc' }));

    CATEGORIAS.forEach(function (cat) {
      var tipos = tiposDoGrupo(cat.id);
      if (!tipos.length) return;
      var livres = 0;
      tipos.forEach(function (t) { if (!sim.requisitoFaltante(ESTR[t])) livres++; });
      var b = botao(cat.nome.charAt(0) + cat.nome.slice(1).toLowerCase(),
        ICONE_GRUPO[cat.id] || '▪', livres + ' de ' + tipos.length, function () {
          self.paginaAcoes = 'construir:' + cat.id;
          self.atualizarAcoes();
        }, { desativado: !livres, motivo: livres ? null : 'Nada liberado neste grupo ainda.' });
      if (!livres) b.classList.add('sem-recurso');
      cx.appendChild(b);
    });
  };

  /* PÁGINA DE UM GRUPO. Volta para os grupos, não para os comandos — é um
     nível de cada vez, como o Esc do StarCraft. */
  UI.paginaGrupo = function (cx, id) {
    var self = this, sim = this.sim;
    cx.appendChild(botao('Voltar', '↩', 'outros grupos', function () {
      self.paginaAcoes = 'construir';
      self.atualizarAcoes();
    }, { tecla: 'esc' }));

    tiposDoGrupo(id).forEach(function (tipo) {
      var def = ESTR[tipo];
      var falta = sim.requisitoFaltante(def);
      /* Recurso que falta NÃO desabilita: o preço já está escrito no botão e
         daqui a dez segundos ele dá. Requisito de tecnologia, sim — esse não
         muda sozinho, e o jogador precisa saber o que destrava. Os dois
         clássicos fazem exatamente essa distinção, cada um do seu jeito. */
      var b = botao(def.nome, ICONE_ESTRUTURA[tipo] || '▪', self.precoDe(def), function () {
        var impede = sim.requisitoFaltante(def);
        if (impede) { self.mostrarAviso(impede, 'atencao'); UF.audio.evento('negado'); return; }
        self.paginaAcoes = null;
        self.iniciarConstrucao(tipo);
      }, { desativado: !!falta, motivo: falta || def.desc });
      if (!falta && !sim.temRecurso(sim.custoDe(def))) b.classList.add('sem-recurso');
      cx.appendChild(b);
    });
  };

  /* O QUE DÁ PARA FAZER AQUI DENTRO.
     Tocar num prédio já mostrava os comandos dele, mas a lista do que ele
     PRODUZ morava na gaveta, atrás de uma aba — o jogador tocava no Quartel e
     não via soldado nenhum. Agora é a mesma segunda página da construção, com
     as mesmas regras, porque é a mesma pergunta: o que dá para fazer agora.

     A diferença em relação à construção é o motivo de estar apagado. Ali só
     tecnologia trava; aqui trava também POPULAÇÃO, que é limite do jogador e
     não da tecnologia — por isso ela apaga o botão e diz o porquê, em vez de
     deixar clicar e recusar depois. */
  UI.paginaProduzir = function (cx, id) {
    var self = this, sim = this.sim;
    var b = sim.estruturas[id];
    if (!b || b.morta) { this.paginaAcoes = null; this.atualizarAcoes(); return; }

    cx.appendChild(botao('Voltar', '↩', 'comandos do prédio', function () {
      self.paginaAcoes = null;
      self.atualizarAcoes();
    }, { tecla: 'esc' }));

    b.def.produz.forEach(function (tipo) {
      var def = UNID[tipo];
      var falta = sim.requisitoFaltante(def);
      if (!falta && sim.popLivre() < (def.pop || 0)) falta = 'Sem capacidade de população';
      var bt = botao(def.nome, ICONE_UNIDADE[tipo] || '•', self.precoDe(def), function () {
        var r = sim.encomendar(b.id, tipo);
        if (!r.ok) { self.mostrarAviso(r.motivo, 'atencao'); UF.audio.evento('negado'); }
        else { UF.audio.evento('clique'); self.mostrarAviso(def.nome + ' na fila.', 'info'); }
        self.atualizarTudo();
      }, { desativado: !!falta, motivo: falta || (def.desc + ' · ' + (def.pop || 0) + ' pop · ' + def.tempo + 's') });
      if (!falta && !sim.temRecurso(sim.custoDe(def))) bt.classList.add('sem-recurso');
      cx.appendChild(bt);
    });
  };

  UI.acoesDeUnidade = function (cx, u) {
    var self = this, sim = this.sim;
    var tarefa = u.tarefa ? u.tarefa.tipo : '—';
    var rotuloTarefa = {
      ocioso: 'sem tarefa', minerar: 'minerando', construir: 'construindo', reparar: 'reparando',
      mover: 'a caminho', fugindo: 'fugindo do combate', defender: 'defendendo a área',
      moverAtacando: 'avançando', patrulhar: 'patrulhando', recuar: 'recuando',
      focar: 'fogo concentrado', voltandoAoPosto: 'voltando ao posto'
    }[tarefa] || tarefa;
    this.mostrarSelecao(u.def.nome, u.hp, u.hpMax, rotuloTarefa +
      (u.carga ? ' · carga ' + u.carga : '') + (u.bloqueado ? ' · SEM ROTA' : ''));
    var casas = this.casasDeTropa([u]);
    if (u.operario) {
      casas[CASAS_TROPA.reparar] = botao('Reparar', '✚', 'estrutura ferida', function () {
        var alvo = sim.estruturaMaisFeridaProxima(u.x, u.y);
        if (!alvo) { self.mostrarAviso('Nada danificado por perto.', 'atencao'); return; }
        sim.darTarefa(u, { tipo: 'reparar', alvo: alvo.id }, true);
        self.mostrarAviso('Reparando ' + alvo.def.nome + '.', 'info');
      }, { tecla: 'r' });
    }
    montarCasas(cx, casas);
  };

  UI.acoesDeEstrutura = function (cx, b) {
    var self = this, sim = this.sim;
    var estado = !b.construida ? (b.abandonado ? 'posto abandonado' : 'em obra ' + Math.round(b.obra * 100) + '%')
      : b.semEnergia ? 'sem energia' : 'operando';
    this.mostrarSelecao(b.def.nome + (b.abandonado && !b.construida ? ' (abandonado)' : ''),
      b.hp, b.hpMax, estado + (b.construtores ? ' · ' + b.construtores + ' operário(s)' : ''));

    if (!b.construida) {
      cx.appendChild(botao(b.abandonado ? 'Reativar' : 'Acelerar obra', '🔧', 'enviar operário', function () {
        var op = sim.operarioLivreMaisProximo(b.x, b.y);
        if (!op) { self.mostrarAviso('Nenhum operário livre.', 'atencao'); return; }
        sim.darTarefa(op, { tipo: 'construir', alvo: b.id }, true);
        self.mostrarAviso('Operário a caminho da obra.', 'info');
      }));
      this.filaNaBarra(null);
      return;
    }

    var casas = [];
    if (b.hp < b.hpMax) {
      casas[CASAS_ESTRUTURA.reparar] = botao('Reparar', '✚', 'operário mais próximo', function () {
        var op = sim.operarioLivreMaisProximo(b.x, b.y);
        if (!op) { self.mostrarAviso('Nenhum operário livre.', 'atencao'); return; }
        sim.darTarefa(op, { tipo: 'reparar', alvo: b.id }, true);
      }, { tecla: 'r' });
    }
    if (b.def.produz) {
      casas[CASAS_ESTRUTURA.produzir] = botao('Produzir', '▲', b.def.produz.length + (b.def.produz.length === 1 ? ' unidade' : ' unidades'), function () {
        self.paginaAcoes = 'produzir:' + b.id;
        self.atualizarAcoes();
      }, { tecla: 't' });
      casas[CASAS_ESTRUTURA.encontro] = botao('Encontro', '⚑', 'ponto de reunião', function () {
        self.modo = { tipo: 'rally', estrutura: b.id };
        self.mostrarModo('Toque onde as novas unidades devem se reunir');
      });
    }
    if (b.portao) {
      var proximos = { auto: 'aberto', aberto: 'fechado', fechado: 'auto' };
      var rot = { auto: 'Automático', aberto: 'Sempre aberto', fechado: 'Sempre fechado' };
      casas[CASAS_ESTRUTURA.portao] = botao(rot[b.portaoModo], b.portaoAberto ? '◻' : '◼', 'tocar para trocar', function () {
        b.portaoModo = proximos[b.portaoModo];
        self.atualizarAcoes();
      }, { ligado: b.portaoModo !== 'fechado' });
    }
    if (b.torre) {
      casas[CASAS_ESTRUTURA.energia] = botao(b.desligada ? 'Ligar' : 'Desligar', 'ϟ', 'poupa energia', function () {
        b.desligada = !b.desligada; self.atualizarAcoes();
      }, { ligado: !b.desligada });
    }
    if (b !== sim.central) {
      var volta = Math.round((b.custo.m || 0) * D.REGRAS.reembolso);
      casas[CASAS_ESTRUTURA.vender] = botao('Vender', '↩', '+' + volta + ' ◆', function () {
        sim.devolver(b.custo, D.REGRAS.reembolso);
        sim.matar(b, { silencioso: true });
        self.selecionar(null);
        self.mostrarAviso('Estrutura vendida por ' + volta + ' minerais.', 'info');
      }, { perigo: true });
    }
    montarCasas(cx, casas);
    this.filaNaBarra(b);
  };

  /* A FILA DE PRODUÇÃO na faixa de baixo, não escondida na gaveta.
     A nossa gaveta já desenhava a fila com cancelamento por item — que é
     exatamente o desenho do Age of Empires II, onde o item da fila É o botão de
     cancelar. Só que ela aparecia depois de tocar em "Produzir" e abrir a
     gaveta, ou seja: o jogador não via o que estava sendo produzido enquanto
     jogava. No AoE II a fila mora na barra, visível o tempo todo em que o
     prédio está selecionado. */
  UI.filaNaBarra = function (b) {
    var faixa = $('filaBarra');
    if (!faixa) return;
    var fila = b && b.fila && b.fila.length ? b.fila : null;
    faixa.hidden = !fila;
    faixa.innerHTML = '';
    if (!fila) return;
    var self = this, sim = this.sim;
    for (var i = 0; i < fila.length; i++) {
      (function (indice, item) {
        var def = UNID[item.tipo] || {};
        var el = doc.createElement('button');
        el.className = 'fila-item' + (indice === 0 ? ' fazendo' : '');
        el.title = (def.nome || item.tipo) + ' — tocar para cancelar';
        el.innerHTML = '<b>' + (def.nome || item.tipo).slice(0, 3).toUpperCase() + '</b>' +
          (indice === 0 ? '<i style="width:' + Math.round((item.progresso || 0) * 100) + '%"></i>' : '');
        el.onclick = function () { sim.cancelarEncomenda(b.id, indice); self.atualizarAcoes(); };
        faixa.appendChild(el);
      }(i, fila[i]));
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
    if (c.c) partes.push('<em>' + c.c + ' ⬢</em>');
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
