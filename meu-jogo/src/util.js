/* Última Fronteira — utilidades compartilhadas.
   Carregado como script clássico para que o jogo funcione também via file://. */
(function (global) {
  'use strict';
  var UF = global.UF || (global.UF = {});

  /* Gerador pseudoaleatório com semente: partidas iguais podem ser reproduzidas. */
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () {
      s += 0x6D2B79F5;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
  function dist2(ax, ay, bx, by) { var dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; }

  /* Distância entre um ponto e o retângulo ocupado por uma estrutura. */
  function distToRect(px, py, rx, ry, rw, rh) {
    var cx = clamp(px, rx, rx + rw), cy = clamp(py, ry, ry + rh);
    return Math.hypot(px - cx, py - cy);
  }

  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length) % arr.length]; }

  /* Formata segundos como m:ss para os cronômetros da interface. */
  function tempo(s) {
    s = Math.max(0, Math.round(s));
    var m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  }

  function num(v) { return Math.round(v).toLocaleString('pt-BR'); }

  UF.util = {
    rng: rng, clamp: clamp, lerp: lerp, dist: dist, dist2: dist2,
    distToRect: distToRect, pick: pick, tempo: tempo, num: num
  };
})(typeof window !== 'undefined' ? window : globalThis);
