/* Última Fronteira — carregador de sprites.
 *
 * A apresentação usa desenho procedural como base e troca por imagem quando ela
 * já chegou. Isso não é meio-caminho: é o que mantém a promessa do projeto de o
 * jogo abrir por `file://` com dois cliques. Imagem carrega de forma assíncrona;
 * se a partida travasse esperando, o jogo deixaria de começar na hora.
 *
 * A imagem também pode simplesmente não vir — arquivo faltando numa cópia
 * incompleta, ou o navegador sem WebP. Nesses casos `pronto()` devolve falso
 * para sempre e o jogo continua desenhando do jeito antigo, sem erro na tela.
 *
 * `build.cjs` substitui BASE por data URIs no arquivo único offline; por isso
 * o caminho passa por `fonte()` em vez de ser concatenado solto no meio do código.
 */
(function (UF) {
  'use strict';

  /* Preenchido pelo build com { 'estruturas/central': 'data:image/webp;base64,…' }.
     Vazio aqui: em desenvolvimento as imagens vêm da pasta assets/. */
  var EMBUTIDO = {};

  var cache = {};   /* chave -> { img, ok } */

  function fonte(chave) {
    return EMBUTIDO[chave] || ('assets/' + chave + '.webp');
  }

  /* Devolve a imagem pronta para desenhar, ou null enquanto não estiver.
     Dispara o carregamento na primeira chamada e nunca tenta de novo depois de
     falhar — uma tentativa por chave, para não virar laço de requisições. */
  function imagem(chave) {
    var e = cache[chave];
    if (e) return e.ok ? e.img : null;
    var img = new Image();
    e = cache[chave] = { img: img, ok: false };
    img.onload = function () { e.ok = true; };
    img.onerror = function () { e.ok = false; e.img = null; };
    img.src = fonte(chave);
    return null;
  }

  function estrutura(tipo) { return imagem('estruturas/' + tipo); }
  function unidade(tipo) { return imagem('unidades/' + tipo); }
  function inimigo(tipo) { return imagem('inimigos/' + tipo); }
  function cenario(nome) { return imagem('cenario/' + nome); }

  /* O terreno é pintado uma vez só, num canvas guardado. Se as texturas ainda
     não tinham chegado nessa hora, o mapa fica sem elas para sempre — daí a
     pergunta, que a apresentação usa para repintar quando todas chegarem. */
  function chaoPronto() {
    var nomes = ['chao-pavimento', 'chao-entulho', 'chao-agua'];
    for (var i = 0; i < nomes.length; i++) if (!cenario(nomes[i])) return false;
    return true;
  }

  UF.sprites = {
    imagem: imagem,
    estrutura: estrutura,
    unidade: unidade,
    inimigo: inimigo,
    cenario: cenario,
    chaoPronto: chaoPronto,
    /* Usado pelo build para injetar os data URIs. Não chamar em tempo de jogo. */
    _embutir: function (mapa) { EMBUTIDO = mapa; }
  };
}(window.UF = window.UF || {}));
