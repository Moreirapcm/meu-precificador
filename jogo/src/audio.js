/* Última Fronteira — som sintetizado com WebAudio. Sem arquivos externos. */
(function (global) {
  'use strict';
  var UF = global.UF;

  function Audio() {
    this.ligado = true;
    this.ctx = null;
    this.ultimo = {};
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
    } catch (e) { this.ctx = null; }
  };

  /* Limita repetição: muitos tiros no mesmo quadro viram um som só. */
  Audio.prototype.pode = function (nome, intervalo) {
    var agora = (global.performance && performance.now ? performance.now() : Date.now());
    if (this.ultimo[nome] && agora - this.ultimo[nome] < intervalo) return false;
    this.ultimo[nome] = agora;
    return true;
  };

  Audio.prototype.tom = function (freq, dur, tipo, volume, deslize) {
    if (!this.ligado || !this.ctx) return;
    var t = this.ctx.currentTime;
    var osc = this.ctx.createOscillator();
    var g = this.ctx.createGain();
    osc.type = tipo || 'square';
    osc.frequency.setValueAtTime(freq, t);
    if (deslize) osc.frequency.exponentialRampToValueAtTime(Math.max(40, deslize), t + dur);
    g.gain.setValueAtTime(volume == null ? 0.3 : volume, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(this.mestre);
    osc.start(t); osc.stop(t + dur + 0.02);
  };

  Audio.prototype.ruido = function (dur, volume, corte) {
    if (!this.ligado || !this.ctx) return;
    var t = this.ctx.currentTime;
    var n = Math.floor(this.ctx.sampleRate * dur);
    var buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    var dados = buf.getChannelData(0);
    for (var i = 0; i < n; i++) dados[i] = (Math.random() * 2 - 1) * (1 - i / n);
    var src = this.ctx.createBufferSource();
    src.buffer = buf;
    var filtro = this.ctx.createBiquadFilter();
    filtro.type = 'lowpass'; filtro.frequency.value = corte || 900;
    var g = this.ctx.createGain(); g.gain.value = volume == null ? 0.3 : volume;
    src.connect(filtro); filtro.connect(g); g.connect(this.mestre);
    src.start(t);
  };

  Audio.prototype.evento = function (tipo) {
    if (!this.ligado || !this.ctx) return;
    switch (tipo) {
      case 'tiro': if (this.pode('tiro', 55)) this.tom(720, 0.05, 'square', 0.12, 420); break;
      case 'explosao': if (this.pode('explosao', 70)) this.ruido(0.35, 0.34, 520); break;
      case 'impacto': if (this.pode('impacto', 70)) this.ruido(0.08, 0.12, 1800); break;
      case 'obraConcluida': this.tom(520, 0.09, 'triangle', 0.2); setTimeout(this.tom.bind(this, 780, 0.12, 'triangle', 0.18), 90); break;
      case 'unidadePronta': this.tom(440, 0.07, 'triangle', 0.15); break;
      case 'entrega': if (this.pode('entrega', 260)) this.tom(880, 0.05, 'sine', 0.1); break;
      case 'pesquisaConcluida': [523, 659, 784].forEach(function (f, i) { setTimeout(this.tom.bind(this, f, 0.14, 'triangle', 0.18), i * 110); }, this); break;
      case 'ondaComecou': this.tom(180, 0.5, 'sawtooth', 0.2, 110); break;
      case 'avisoOnda': this.tom(330, 0.16, 'square', 0.16); setTimeout(this.tom.bind(this, 262, 0.22, 'square', 0.16), 180); break;
      case 'estruturaDestruida': this.ruido(0.6, 0.4, 340); break;
      case 'vitoria': [523, 659, 784, 1047].forEach(function (f, i) { setTimeout(this.tom.bind(this, f, 0.2, 'triangle', 0.2), i * 140); }, this); break;
      case 'derrota': [392, 330, 262, 196].forEach(function (f, i) { setTimeout(this.tom.bind(this, f, 0.3, 'sawtooth', 0.18), i * 190); }, this); break;
      case 'clique': this.tom(600, 0.03, 'square', 0.07); break;
      case 'negado': this.tom(160, 0.14, 'square', 0.14); break;
    }
  };

  UF.audio = new Audio();
})(typeof window !== 'undefined' ? window : globalThis);
