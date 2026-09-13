/* Última Fronteira — service worker.
 *
 * Existe para o jogo INSTALAR no celular e abrir sem internet. O jogo já não
 * depende de rede para jogar; o que faltava era o navegador guardar os
 * arquivos. Aqui eles são baixados uma vez e servidos do cache depois.
 *
 * Estratégia: cache primeiro, rede como reserva. É o certo para um jogo —
 * nada aqui muda sozinho, e esperar a rede a cada partida só adia o começo.
 * Quando sai versão nova, o VERSAO muda, o cache velho é apagado inteiro e os
 * arquivos voltam a ser buscados. Sem isso, uma correção publicada nunca
 * chegaria a quem já instalou.
 */
var VERSAO = 'uf-v1';

/* A lista é gerada à mão de propósito: o jogo não tem etapa de build que possa
   montá-la, e um `import` a mais sem entrada aqui só apareceria como tela preta
   no avião. Mantenha em ordem com as tags <script> do index.html. */
var ARQUIVOS = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './icones/icone-192.png',
  './icones/icone-512.png',
  './src/util.js', './src/data.js', './src/geo.js', './src/mapas.js',
  './src/world.js', './src/path.js', './src/sim.js', './src/sim-unidades.js',
  './src/sim-combate.js', './src/salvar.js', './src/sprites.js',
  './src/anima.js', './src/render.js', './src/render2.js', './src/audio.js',
  './src/ui.js', './src/ui2.js', './src/mundo-ui.js', './src/main.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) {
    /* addAll falha inteiro se UM arquivo falhar; aqui cada um é tentado sozinho
       para uma imagem ausente não impedir o jogo de ficar disponível offline. */
    return Promise.all(ARQUIVOS.map(function (u) {
      return c.add(u).catch(function () {});
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (nomes) {
    return Promise.all(nomes.map(function (n) {
      return n === VERSAO ? null : caches.delete(n);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function (achou) {
      if (achou) return achou;
      return fetch(e.request).then(function (resp) {
        /* guarda o que veio da rede — as imagens de arte entram por aqui, sem
           precisar estar na lista acima */
        if (resp && resp.status === 200 && resp.type === 'basic') {
          var copia = resp.clone();
          caches.open(VERSAO).then(function (c) { c.put(e.request, copia); });
        }
        return resp;
      }).catch(function () { return achou; });
    })
  );
});
