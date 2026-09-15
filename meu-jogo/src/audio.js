/* Última Fronteira — som sintetizado com WebAudio. Sem arquivos externos.
 *
 * POR QUE SINTETIZADO, e não gravado: o jogo inteiro cabe num arquivo só, que
 * abre por `file://` com dois cliques. Uma trilha de dois minutos em MP3 pesa
 * mais do que TODA a arte do jogo junta — dobraria o download para acrescentar
 * um loop que o jogador ouve dez vezes por partida. Tudo aqui é gerado na hora,
 * em algumas centenas de linhas, e não pesa um byte.
 *
 * O que existe:
 *   - um MIXER de três barramentos (música, efeitos, interface), para a música
 *     poder abaixar sem levar o tiro junto;
 *   - EFEITOS com corpo: tiro é estalo mais ruído filtrado, não um bipe; a
 *     explosão tem sopro grave e um filtro que fecha, que é o que faz o ouvido
 *     ler "distância";
 *   - RÁDIO no lugar de voz. Gravar "sim, senhor" exigiria arquivo; dois bipes
 *     curtos com um chiado no fim dizem a mesma coisa — é a confirmação de
 *     rádio que todo jogo militar usa, e o ouvido reconhece na hora;
 *   - uma TRILHA que toca sozinha e reage: fica mais densa quando a onda vem,
 *     e volta a respirar quando passa.
 */
(function (global) {
  'use strict';
  var UF = global.UF;

  /* Escala menor natural em Lá — a escolha não é decorativa: sem a terça maior
     nenhuma sequência soa alegre por acidente, e o pad pode tocar notas ao
     acaso a noite inteira sem nunca desafinar com o clima do jogo. */
  var ESCALA = [55, 62, 65.4, 73.4, 82.4, 87.3, 98];      /* Lá menor, graves */

  function Audio() {
    this.ligado = true;
    this.ctx = null;
    this.ultimo = {};
    this.trilha = { tocando: false, tensao: 0, alvoTensao: 0 };
  }

  Audio.prototype.acordar = function () {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.mestre = this.ctx.createGain();
      this.mestre.gain.value = 0.22;
      this.mestre.connect(this.ctx.destination);

      /* Três barramentos. A música precisa poder abaixar sozinha quando a
         batalha esquenta, sem levar o tiro junto — com um ganho só isso é
         impossível, e foi por isso que os barramentos vieram antes da trilha. */
      this.busMusica = this.ctx.createGain();
      this.busMusica.gain.value = 0.55;
      this.busMusica.connect(this.mestre);

      this.busEfeito = this.ctx.createGain();
      this.busEfeito.gain.value = 1;
      this.busEfeito.connect(this.mestre);

      this.busUI = this.ctx.createGain();
      this.busUI.gain.value = 0.8;
      this.busUI.connect(this.mestre);

      /* Uma reverberação curta, gerada: dá tamanho ao campo de batalha. Sem
         ela todo som acontece colado no ouvido, e o mapa parece uma caixa. */
      this.eco = this.ctx.createConvolver();
      this.eco.buffer = this.impulso(1.6, 2.6);
      this.ecoGanho = this.ctx.createGain();
      this.ecoGanho.gain.value = 0.18;
      this.eco.connect(this.ecoGanho);
      this.ecoGanho.connect(this.mestre);
      this.busEfeito.connect(this.eco);
    } catch (e) { this.ctx = null; }
  };

  /* Resposta impulsiva de um espaço aberto: ruído que decai. É a forma mais
     barata de ter reverberação sem carregar um arquivo de sala gravada. */
  Audio.prototype.impulso = function (dur, decaimento) {
    var n = Math.floor(this.ctx.sampleRate * dur);
    var buf = this.ctx.createBuffer(2, n, this.ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < n; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decaimento);
      }
    }
    return buf;
  };

  /* Limita repetição: muitos tiros no mesmo quadro viram um som só. */
  Audio.prototype.pode = function (nome, intervalo) {
    var agora = (global.performance && performance.now ? performance.now() : Date.now());
    if (this.ultimo[nome] && agora - this.ultimo[nome] < intervalo) return false;
    this.ultimo[nome] = agora;
    return true;
  };

  Audio.prototype.destino = function (bus) {
    return bus === 'musica' ? this.busMusica : bus === 'ui' ? this.busUI : this.busEfeito;
  };

  Audio.prototype.tom = function (freq, dur, tipo, volume, deslize, bus, atraso) {
    if (!this.ligado || !this.ctx) return;
    var t = this.ctx.currentTime + (atraso || 0);
    var osc = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    osc.type = tipo || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (deslize) osc.frequency.exponentialRampToValueAtTime(Math.max(40, deslize), t + dur);
    /* ataque de 5 ms em vez de começar no volume cheio: corte seco estala no
       alto-falante, e o estalo é o que faz som sintetizado soar barato */
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume == null ? 0.3 : volume, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(this.destino(bus));
    osc.start(t); osc.stop(t + dur + 0.02);
  };

  /* Ruído com filtro que se MOVE. Um filtro parado dá sempre a mesma textura;
     fechando ao longo do som, o ouvido lê "a coisa está se afastando" — é o que
     diferencia uma explosão de um chiado. */
  Audio.prototype.ruido = function (dur, volume, corteIni, corteFim, q, bus) {
    if (!this.ligado || !this.ctx) return;
    var t = this.ctx.currentTime;
    var n = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    var dados = buf.getChannelData(0);
    for (var i = 0; i < n; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.Q.value = q || 1;
    filtro.frequency.setValueAtTime(corteIni || 900, t);
    if (corteFim) filtro.frequency.exponentialRampToValueAtTime(Math.max(60, corteFim), t + dur);
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(volume == null ? 0.3 : volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filtro); filtro.connect(g); g.connect(this.destino(bus));
    src.start(t);
  };

  /* ------------------------------------------------------------- rádio */
  /* A confirmação de ordem. Não é voz — é o bipe de rádio que vem ANTES e
     DEPOIS da voz, e que o ouvido já associa a "comando recebido". Duas notas
     curtas subindo e um chiado curto no fim, como um transmissor abrindo e
     fechando. */
  Audio.prototype.radio = function (subindo) {
    if (!this.ligado || !this.ctx) return;
    var a = subindo ? 1180 : 980, b = subindo ? 1560 : 760;
    this.tom(a, 0.035, 'square', 0.05, 0, 'ui');
    this.tom(b, 0.045, 'square', 0.045, 0, 'ui', 0.05);
    this.ruido(0.05, 0.02, 2600, 1200, 1, 'ui');
  };

  /* ------------------------------------------------------------ trilha */
  /* Toca sozinha, em compassos, e reage ao estado da partida. Não é uma música
     escrita: é um pad de duas vozes sorteando notas da escala menor, com um
     pulso grave que só aparece quando a tensão sobe. O ouvido aceita isso como
     trilha ambiente e nunca reconhece um loop, porque loop não há. */
  Audio.prototype.iniciarTrilha = function () {
    if (!this.ctx || this.trilha.tocando) return;
    this.trilha.tocando = true;
    var self = this;
    var compasso = 0;

    function passo() {
      if (!self.trilha.tocando || !self.ctx) return;
      /* a tensão persegue o alvo devagar: mudança brusca de trilha assusta
         mais que a onda de invasores */
      var t = self.trilha;
      t.tensao += (t.alvoTensao - t.tensao) * 0.12;

      if (self.ligado) {
        var raiz = ESCALA[compasso % 3 === 0 ? 0 : (compasso % 7)];
        /* pad: duas vozes longas, a segunda uma quinta acima */
        self.tom(raiz, 3.4, 'sine', 0.05 + t.tensao * 0.02, 0, 'musica');
        self.tom(raiz * 1.5, 3.4, 'triangle', 0.025 + t.tensao * 0.015, 0, 'musica');
        /* uma nota solta por cima, de vez em quando: é o que impede o pad de
           virar zumbido */
        if (compasso % 2 === 1) {
          var nota = ESCALA[Math.floor(Math.random() * ESCALA.length)] * 4;
          self.tom(nota, 0.9, 'sine', 0.02 + t.tensao * 0.01, 0, 'musica', 0.4);
        }
        /* pulso de guerra: só existe com tensão, e é ele que avisa o corpo do
           jogador antes de a onda aparecer na tela */
        if (t.tensao > 0.25) {
          for (var b = 0; b < 4; b++) {
            self.tom(41, 0.16, 'sine', 0.03 * t.tensao, 28, 'musica', b * 0.85);
          }
        }
      }
      compasso++;
      self.trilha.timer = setTimeout(passo, 3400);
    }
    passo();
  };

  Audio.prototype.pararTrilha = function () {
    this.trilha.tocando = false;
    if (this.trilha.timer) clearTimeout(this.trilha.timer);
  };

  /* Chamado pela apresentação a cada quadro: 0 é paz, 1 é onda em cima. */
  Audio.prototype.definirTensao = function (v) {
    this.trilha.alvoTensao = Math.max(0, Math.min(1, v));
  };

  /* ------------------------------------------------------------ eventos */
  Audio.prototype.evento = function (tipo) {
    if (!this.ligado || !this.ctx) return;
    switch (tipo) {
      /* TIRO: estalo curto de alta frequência mais um corpo de ruído que cai.
         O bipe de antes não tinha o estalo, e sem estalo nenhum tiro soa como
         tiro — soa como videogame de 1980. */
      /* TRÊS CAMADAS, e não duas: o estalo agudo diz "agora", o corpo médio é o
         que se reconhece como arma de fogo, e o pancada grave é o que dá peso.
         O tiro de antes era só estalo fino — na tela parecia pipoca, e o Pedro
         disse na cara: "o canhão atira bala, tem que ter fogo e barulho". */
      case 'tiro':
        if (this.pode('tiro', 40)) {
          this.ruido(0.03, 0.16, 6500, 1800, 1.2);
          this.ruido(0.11, 0.2, 1900, 320, 1.6);
          this.tom(160, 0.09, 'square', 0.1, 55);
          this.tom(62, 0.12, 'sine', 0.13, 26);
        }
        break;
      case 'golpe':
        if (this.pode('golpe', 60)) {
          this.ruido(0.07, 0.12, 1400, 260, 2);
          this.tom(150, 0.08, 'triangle', 0.06, 70);
        }
        break;
      /* EXPLOSÃO: três camadas. O estalo diz "aconteceu agora", o corpo diz
         "foi grande", e o sopro grave é o que se sente no peito. */
      case 'explosao':
        if (this.pode('explosao', 60)) {
          this.ruido(0.04, 0.3, 6000, 2000, 1);
          this.ruido(0.55, 0.32, 900, 90, 1.2);
          this.tom(70, 0.4, 'sine', 0.22, 32);
        }
        break;
      case 'estruturaDestruida':
        this.ruido(0.06, 0.34, 6000, 2400, 1);
        this.ruido(1.1, 0.38, 700, 60, 1.4);
        this.tom(54, 0.7, 'sine', 0.26, 26);
        break;
      case 'impacto':
        if (this.pode('impacto', 55)) this.ruido(0.06, 0.1, 2600, 900, 1.6);
        break;
      case 'unidadeMorta':
        if (this.pode('morte', 120)) {
          this.ruido(0.3, 0.12, 1100, 160, 1.2);
          this.tom(190, 0.22, 'sawtooth', 0.05, 70);
        }
        break;

      case 'obraConcluida':
        this.radio(true);
        this.tom(523, 0.1, 'triangle', 0.14, 0, 'ui', 0.1);
        this.tom(784, 0.14, 'triangle', 0.12, 0, 'ui', 0.19);
        break;
      case 'unidadePronta': this.radio(true); break;
      /* DOIS TIMBRES, como o Age of Empires II: trompa quando é tropa
         apanhando, sino quando é operário ou prédio. O timbre diz o que fazer
         sem obrigar a olhar. */
      case 'sobAtaque':
        this.tom(196, 0.5, 'sawtooth', 0.1, 0, 'ui');
        this.tom(294, 0.55, 'sawtooth', 0.08, 0, 'ui', 0.14);
        break;
      case 'sobAtaqueCivil':
        this.tom(1046, 0.5, 'sine', 0.1, 0, 'ui');
        this.tom(1568, 0.6, 'sine', 0.07, 0, 'ui', 0.02);
        this.tom(1046, 0.5, 'sine', 0.08, 0, 'ui', 0.34);
        break;
      /* Pá raspando entulho: ruído grave e curto, com teto baixo. */
      case 'escavando':
        if (this.pode('escavando', 380)) this.ruido(0.18, 0.09, 420, 140, 1.1);
        break;
      /* PEDIDO DE APOIO: chiado de rádio DESCENDO — o de subir é boa notícia,
         e este não é — seguido de dois toques curtos de alarme. */
      case 'apoio':
        this.radio(false);
        this.tom(740, 0.09, 'square', 0.07, 0, 'ui', 0.06);
        this.tom(740, 0.09, 'square', 0.07, 0, 'ui', 0.2);
        break;
      case 'entrega':
        if (this.pode('entrega', 220)) this.tom(880, 0.05, 'sine', 0.07, 0, 'ui');
        break;
      case 'pesquisaConcluida':
        this.radio(true);
        [523, 659, 784].forEach(function (f, i) {
          this.tom(f, 0.16, 'triangle', 0.13, 0, 'ui', 0.12 + i * 0.12);
        }, this);
        break;

      /* ONDA: a trilha sobe ANTES do primeiro inimigo aparecer. É o aviso que
         o corpo entende sem ler o painel. */
      case 'avisoOnda':
        this.definirTensao(0.55);
        this.tom(330, 0.18, 'square', 0.1, 0, 'ui');
        this.tom(262, 0.26, 'square', 0.1, 0, 'ui', 0.2);
        break;
      case 'ondaComecou':
        this.definirTensao(1);
        this.ruido(0.9, 0.16, 500, 80, 1);
        this.tom(90, 0.9, 'sawtooth', 0.14, 48);
        break;
      case 'ondaVencida':
        this.definirTensao(0.12);
        this.radio(true);
        [392, 523, 659].forEach(function (f, i) {
          this.tom(f, 0.22, 'triangle', 0.12, 0, 'ui', i * 0.14);
        }, this);
        break;
      case 'chefeEntrou':
        this.definirTensao(1);
        this.tom(46, 1.4, 'sawtooth', 0.2, 30);
        this.ruido(1.2, 0.2, 420, 70, 1.4);
        break;

      case 'vitoria':
        this.pararTrilha();
        [523, 659, 784, 1047].forEach(function (f, i) {
          this.tom(f, 0.24, 'triangle', 0.16, 0, 'ui', i * 0.15);
        }, this);
        break;
      case 'derrota':
        this.pararTrilha();
        [392, 330, 262, 196].forEach(function (f, i) {
          this.tom(f, 0.34, 'sawtooth', 0.14, 0, 'ui', i * 0.2);
        }, this);
        break;
      case 'clique': this.tom(620, 0.025, 'square', 0.05, 0, 'ui'); break;
      case 'negado': this.tom(150, 0.16, 'square', 0.1, 110, 'ui'); break;
    }
  };

  UF.audio = new Audio();
})(typeof window !== 'undefined' ? window : globalThis);
