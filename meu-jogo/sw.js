/* Última Fronteira — service worker.
 *
 * Existe para o jogo INSTALAR no celular e abrir sem internet. O jogo já não
 * depende de rede para jogar; o que faltava era o navegador guardar os
 * arquivos. Aqui eles são baixados uma vez e servidos do cache depois.
 *
 * Estratégia DIVIDIDA, e a divisão foi aprendida doendo:
 *
 *  - CÓDIGO (html, js, css, json): REDE PRIMEIRO, cache como reserva. A
 *    primeira versão deste arquivo usava cache primeiro para tudo, e o
 *    navegador passou a servir o jogo de ontem: publiquei correção, recarreguei
 *    com força, e continuava vindo a versão velha. Um service worker que
 *    guarda o código é um jogo que nunca mais é atualizado.
 *  - ARTE (webp, png): CACHE PRIMEIRO. Imagem não muda sem mudar de nome, é o
 *    grosso do peso, e é o que faz valer a pena jogar sem internet.
 *
 * Sem rede, os dois caem no cache — que é o ponto de instalar no celular.
 */
/* Subir esta versão APAGA o cache anterior no próximo carregamento. Suba
   sempre que uma correção precisar chegar a quem já tem o jogo instalado — foi
   o que faltou quando o trator saiu corrigido e o navegador continuou servindo
   o trator quebrado. */
var VERSAO = 'uf-v3';

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

function guardar(req, resp) {
  if (resp && resp.status === 200 && resp.type === 'basic') {
    var copia = resp.clone();
    caches.open(VERSAO).then(function (c) { c.put(req, copia); });
  }
  return resp;
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  var arte = /\.(webp|png|jpg|jpeg|gif|svg|woff2?|mp3|ogg)(\?|$)/i.test(url);

  if (arte) {
    e.respondWith(caches.match(e.request).then(function (achou) {
      return achou || fetch(e.request).then(function (r) { return guardar(e.request, r); });
    }));
    return;
  }
  /* código: rede primeiro */
  e.respondWith(
    fetch(e.request).then(function (r) { return guardar(e.request, r); })
      .catch(function () { return caches.match(e.request); })
  );
});
