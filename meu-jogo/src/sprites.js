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

  /* Uma TIRA de quadros: várias poses do mesmo boneco numa imagem só, lado a
     lado. Foi o único jeito que deu certo de gerar quadros por IA — pedidos um
     a um, cada boneco sai um pouco diferente do anterior e a sequência pisca;
     pedidos de uma vez, na mesma imagem, o modelo mantém a figura.
     `quadros` diz em quantas partes iguais a largura se divide. */
  var TIRAS = {
    'unidades/operario-minerar': 4,
    'unidades/operario-andar-leste': 4,
    'unidades/operario-andar-norte': 4,
    'unidades/operario-andar-sul': 4,
    'unidades/operario-andar-sudeste': 4,
    'unidades/operario-andar-nordeste': 4,
    /* Pose de tiro: UM quadro por direção, não quatro. O que o jogador precisa
       ler num soldado parado é PARA ONDE ele está atirando — a pose em si não
       muda. O movimento do disparo quem faz é o coice (anima.js) e o clarão da
       boca do cano, que já são calculados. */
    'unidades/fuzileiro-atirar-leste': 1,
    'unidades/fuzileiro-atirar-nordeste': 1,
    'unidades/fuzileiro-atirar-norte': 1,
    'unidades/fuzileiro-atirar-sudeste': 1,
    'unidades/fuzileiro-atirar-sul': 1,
    'unidades/lanceiro-atirar-leste': 1,
    'unidades/lanceiro-atirar-nordeste': 1,
    'unidades/lanceiro-atirar-norte': 1,
    'unidades/lanceiro-atirar-sudeste': 1,
    'unidades/lanceiro-atirar-sul': 1,
    'unidades/incendiario-atirar-leste': 1,
    'unidades/incendiario-atirar-nordeste': 1,
    'unidades/incendiario-atirar-norte': 1,
    'unidades/incendiario-atirar-sudeste': 1,
    'unidades/incendiario-atirar-sul': 1,
    /* O Corredor tem TRÊS direções, não cinco: o gerador não vira a câmera em
       volta de bicho quadrúpede, muda a postura dele. As que faltam caem na
       vizinha, em `R.tiraDaDirecao`. */
    'inimigos/corredor-atacar-leste': 1,
    'inimigos/corredor-atacar-nordeste': 1,
    'inimigos/corredor-atacar-sudeste': 1,
    'inimigos/predador-atacar-leste': 1,
    'inimigos/predador-atacar-nordeste': 1,
    'inimigos/predador-atacar-sudeste': 1,
    'inimigos/cuspidor-atacar-leste': 1,
    'inimigos/cuspidor-atacar-nordeste': 1,
    'inimigos/cuspidor-atacar-sudeste': 1,
    /* corpo caído: uma imagem só, sem direção. Um corpo deitado lê igual de
       qualquer ângulo — o que muda é para que lado ele está virado, e isso o
       desenho resolve espelhando. */
    'inimigos/corredor-morto': 1,
    'inimigos/predador-morto': 1,
    'inimigos/cuspidor-morto': 1,
    'unidades/fuzileiro-morto': 1,
    'unidades/lanceiro-morto': 1,
    'unidades/incendiario-morto': 1
  };

  /* Só tenta carregar o que ESTÁ registrado. Perguntar por uma tira que não
     existe — e o desenho pergunta por várias a cada unidade, uma por direção —
     disparava um pedido ao servidor para cada chave inventada, e o console
     enchia de 404 que não eram erro nenhum. */
  function tira(chave) {
    if (!TIRAS[chave]) return null;
    var img = imagem(chave);
    if (!img) return null;
    var n = TIRAS[chave];
    return { img: img, n: n, larg: img.width / n, alt: img.height };
  }

  function estrutura(tipo) { return imagem('estruturas/' + tipo); }
  function unidade(tipo) { return imagem('unidades/' + tipo); }
  function inimigo(tipo) { return imagem('inimigos/' + tipo); }
  function cenario(nome) { return imagem('cenario/' + nome); }

  /* O terreno é pintado uma vez só, num canvas guardado. Se as texturas ainda
     não tinham chegado nessa hora, o mapa fica sem elas para sempre — daí a
     pergunta, que a apresentação usa para repintar quando todas chegarem. */
  function chaoPronto() {
    var nomes = ['chao-pavimento', 'chao-entulho', 'chao-agua', 'asfalto'];
    for (var i = 0; i < nomes.length; i++) if (!cenario(nomes[i])) return false;
    return true;
  }

  UF.sprites = {
    imagem: imagem,
    estrutura: estrutura,
    tira: tira,
    unidade: unidade,
    inimigo: inimigo,
    cenario: cenario,
    chaoPronto: chaoPronto,
    /* Usado pelo build para injetar os data URIs. Não chamar em tempo de jogo. */
    _embutir: function (mapa) { EMBUTIDO = mapa; }
  };
}(window.UF = window.UF || {}));
