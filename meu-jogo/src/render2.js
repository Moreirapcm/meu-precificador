/* Última Fronteira — apresentação: estruturas, unidades, efeitos, névoa e minimapa. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var T = D.TERRENO;
  var LARG = UF.RENDER_LARG, ALT = UF.RENDER_ALT;
  var Render = UF.Render, R = Render.prototype;
  var sombrear = R.sombrear;

  /* Cor e altura de cada tipo de estrutura. */
  var VISUAL = {
    central:    { cor: '#4f7fb5', alt: 46, teto: '#7fb6e8' },
    alojamento: { cor: '#55707f', alt: 24, teto: '#7fa3b5' },
    gerador:    { cor: '#6a5f86', alt: 26, teto: '#a68fd8' },
    eolica:     { cor: '#8a8f96', alt: 52, teto: '#e8eef4' },
    nuclear:    { cor: '#6e7266', alt: 34, teto: '#cfe0c8' },
    fusao:      { cor: '#5a6272', alt: 38, teto: '#bfe8ff' },
    deposito:   { cor: '#6b6a4f', alt: 22, teto: '#a9a578' },
    quartel:    { cor: '#5c6b4c', alt: 30, teto: '#8fa878' },
    oficina:    { cor: '#6b5b45', alt: 32, teto: '#a88f6b' },
    pesquisa:   { cor: '#4c6472', alt: 30, teto: '#84b8cc' },
    extrator:   { cor: '#46505c', alt: 24, teto: '#e8a33d' },
    radar:      { cor: '#4a5a6b', alt: 22, teto: '#8fb0cc' },
    muro:       { cor: '#6e6a60', alt: 20, teto: '#8c877a' },
    portao:     { cor: '#7a6a4a', alt: 20, teto: '#b39a62' },
    torreMuralha: { cor: '#6a6f78', alt: 34, teto: '#7fd7ff' },
    bastiao:    { cor: '#6a6f78', alt: 42, teto: '#7fd7ff' },
    sentinela:  { cor: '#4a6a78', alt: 26, teto: '#7fd7ff' },
    gelo:       { cor: '#4a6c76', alt: 26, teto: '#9ff0ff' },
    artilharia: { cor: '#6b5a42', alt: 24, teto: '#ffb457' },
    plasma:     { cor: '#5a4a70', alt: 28, teto: '#d79bff' }
  };

  /* Encaixa o sprite no losango da fundação: mesma largura que a base ocupa em
     tela, apoiado no canto sul. As artes são cortadas rentes (`-trim`), então a
     borda inferior da imagem É a frente da base — alinhar por ela põe o prédio
     de pé no lugar certo sem tabela de deslocamento peça a peça. */
  R.spriteNaFundacao = function (ctx, img, x, y, w, h) {
    var leste = this.paraTela(x + w, y);
    var oeste = this.paraTela(x, y + h);
    var sul = this.paraTela(x + w, y + h);
    var larg = leste.x - oeste.x;
    var alt = img.height * (larg / img.width);
    /* CONTORNO E SOMBRA, os mesmos da unidade. Medido nas 110 peças: a
       estrutura tem contraste de 1,30:1 contra o chão, com 18 das 21 abaixo de
       1,5:1, num piso verificável de 3:1 — o prédio se dissolve no terreno. O
       contorno `#0c0f14` sozinho dá 4,24:1, e é o passo que o Age of Empires II
       nunca dispensou: os dois remasters recusaram mexer na silhueta.

       Aqui o prédio é grande demais para o contorno de oito lados ficar bonito
       acima de certo tamanho — `imagemComSilhueta` já decide isso sozinha e cai
       no desenho cru quando a figura passa de 150 px. */
    var px = (leste.x + oeste.x) / 2 - larg / 2, py = sul.y - alt;
    ctx.save();
    ctx.translate(px + larg / 2, sul.y);
    this.sombraDeSprite(ctx, img, larg, alt, 0);
    ctx.restore();
    this.imagemComSilhueta(ctx, img, px, py, larg, alt);
    /* Altura do corpo acima do centro da célula, para os avisos flutuantes
       ficarem sobre o prédio e não dentro dele. Desconta a metade sul do
       losango, que é chão, não construção. */
    return { h: Math.max(0, alt - (sul.y - this.paraTela(x + w / 2, y + h / 2).y)) };
  };

  R.desenharEstrutura = function (ctx, item) {
    var b = item.dado, z = this.cam.zoom, v = VISUAL[b.tipo] || VISUAL.muro;
    var vivo = b.hp / b.hpMax;
    var emObra = !b.construida;

    /* Obra, ruína e posto abandonado continuam procedurais: a altura que sobe
       durante a construção e o escurecimento são informação de jogo, e o sprite
       é uma imagem só, sem esses estados. */
    var img = (!emObra && !b.morta && !b.abandonado && UF.sprites)
      ? UF.sprites.estrutura(b.tipo) : null;
    var g;
    if (img) {
      g = this.spriteNaFundacao(ctx, img, b.x, b.y, b.w, b.h);
      this.avisosEstrutura(ctx, b, g);
      if (b.fila && b.fila.length) {
        var cf2 = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
        this.icone(ctx, cf2.x, cf2.y - g.h - 20 * z, '#9fe0ff', '▲');
      }
      this.desgasteEstrutura(ctx, b, g, vivo);
      return;
    }

    var tom = emObra ? 0.55 : (b.abandonado ? 0.5 : 1);
    var cor = b.morta ? '#3a3630' : v.cor;

    var altura = v.alt * (emObra ? 0.25 + 0.75 * b.obra : 1);
    if (b.portao) altura = b.portaoAberto ? 7 : v.alt;

    var cores = {
      topo: sombrear(cor, 1.18 * tom),
      esq: sombrear(cor, 0.6 * tom),
      dir: sombrear(cor, 0.86 * tom),
      contorno: b.morta ? null : 'rgba(0,0,0,0.28)'
    };
    g = this.caixa(ctx, b.x + 0.06, b.y + 0.06, b.w - 0.12, b.h - 0.12, altura, cores);

    /* Telhado colorido identifica a função à distância. */
    if (!emObra && !b.portao && !b.muro) {
      ctx.globalAlpha = b.abandonado ? 0.25 : 0.55;
      ctx.fillStyle = v.teto;
      ctx.beginPath();
      var enc = 0.3;
      var n = this.paraTela(b.x + b.w * enc, b.y + b.h * enc);
      var l = this.paraTela(b.x + b.w * (1 - enc), b.y + b.h * enc);
      var s = this.paraTela(b.x + b.w * (1 - enc), b.y + b.h * (1 - enc));
      var o = this.paraTela(b.x + b.w * enc, b.y + b.h * (1 - enc));
      ctx.moveTo(n.x, n.y - g.h); ctx.lineTo(l.x, l.y - g.h);
      ctx.lineTo(s.x, s.y - g.h); ctx.lineTo(o.x, o.y - g.h);
      ctx.closePath(); ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (!emObra) this.detalharEstrutura(ctx, b, g, v);

    /* Torres ganham um canhão que aponta para o alvo. */
    if (b.torre && !emObra) {
      var centro = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      var topoY = centro.y - g.h - 4 * z;
      var alvo = b.alvo && this.sim.alvoPorId(b.alvo);
      var ang = -0.6;
      if (alvo && !alvo.morta) {
        var c = this.sim.centroDe(alvo);
        var pa = this.paraTela(c.x, c.y);
        ang = Math.atan2(pa.y - topoY, pa.x - centro.x);
      }
      ctx.save();
      ctx.translate(centro.x, topoY);
      ctx.rotate(ang);
      ctx.fillStyle = b.semEnergia ? '#5a5a5a' : v.teto;
      ctx.fillRect(0, -2.2 * z, 15 * z, 4.4 * z);
      ctx.restore();
      ctx.fillStyle = b.semEnergia ? '#4a4a4a' : sombrear(v.teto, 0.8);
      ctx.beginPath(); ctx.arc(centro.x, topoY, 5 * z, 0, 6.283); ctx.fill();
      if (b.semEnergia) this.icone(ctx, centro.x, topoY - 16 * z, '#ffcf5a', 'ϟ');
    }

    if (b.tipo === 'radar' && !emObra) {
      var cr = this.paraTela(b.x + 1, b.y + 1);
      ctx.save();
      ctx.strokeStyle = 'rgba(150,200,255,0.5)';
      ctx.lineWidth = 1.6 * z;
      ctx.beginPath();
      ctx.arc(cr.x, cr.y - g.h - 6 * z, 9 * z, this.quadro / 14, this.quadro / 14 + 1.4);
      ctx.stroke();
      ctx.restore();
    }

    if (emObra) {
      this.barra(ctx, b, b.obra, '#ffd479', b.abandonado ? 'REATIVAR' : null);
    } else if (vivo < 0.999) {
      this.barra(ctx, b, vivo, vivo > 0.5 ? '#8ce07f' : vivo > 0.25 ? '#ffd479' : '#ff7a6b');
    }

    if (!emObra && vivo < 0.55 && this.quadro % 3 === 0) {
      var cf = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      this.efeitos.push({ tipo: 'fumaca', x: cf.x + (Math.random() - 0.5) * 16 * z, y: cf.y - g.h, vida: 1.4, max: 1.4 });
    }
    if (b.fila && b.fila.length && !emObra) {
      var cp = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      this.icone(ctx, cp.x, cp.y - g.h - 20 * z, '#9fe0ff', '▲');
    }
    /* O caminho procedural não passa por `avisosEstrutura` — o prédio sem
       sprite precisa do mesmo contador, senão a guarnição some justamente no
       muro e na torre de muralha, que são os que ainda não têm arte. */
    if (b.dentro && b.dentro.length && !emObra) {
      var cg = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      this.icone(ctx, cg.x, cg.y - g.h - 5 * z, '#9fe0ff',
        '⛨' + b.dentro.length + '/' + b.def.guarnicao);
    }
  };

  /* O que o sprite NÃO sabe mostrar, porque muda durante a partida.
     O canhão apontado para o alvo fica de fora de propósito: a arte já traz uma
     torreta desenhada, e um segundo cano por cima dela sai torto. Volta quando a
     torreta for sprite próprio, em 8 direções — até lá o rastro do projétil é
     quem diz para onde a torre está atirando. */
  R.avisosEstrutura = function (ctx, b, g) {
    var z = this.cam.zoom;
    var c = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
    if (b.semEnergia) this.icone(ctx, c.x, c.y - g.h - 16 * z, '#ffcf5a', 'ϟ');
    /* "3/5" sobre o prédio guarnecido. Sem isto a tropa que entrou some sem
       deixar rastro — e sumir é exatamente o que o jogador teme ao guarnecer.
       O número é o que o Age of Empires põe na torre ocupada. */
    if (b.dentro && b.dentro.length) {
      this.icone(ctx, c.x, c.y - g.h - 5 * z, '#9fe0ff',
        '⛨' + b.dentro.length + '/' + b.def.guarnicao);
    }
    if (b.portao) {
      ctx.fillStyle = b.portaoAberto ? 'rgba(140,224,127,0.9)' : 'rgba(255,180,90,0.9)';
      ctx.fillRect(c.x - 8 * z, c.y - g.h - 5 * z, 16 * z, 2.6 * z);
    }
  };

  /* Dano sobre o sprite: a barra e a fumaça, que o procedural também faz. */
  R.desgasteEstrutura = function (ctx, b, g, vivo) {
    var z = this.cam.zoom;
    if (vivo < 0.999) {
      this.barra(ctx, b, vivo, vivo > 0.5 ? '#8ce07f' : vivo > 0.25 ? '#ffd479' : '#ff7a6b');
    }
    if (vivo < 0.55 && this.quadro % 3 === 0) {
      var c = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
      this.efeitos.push({
        tipo: 'fumaca', x: c.x + (Math.random() - 0.5) * 16 * z,
        y: c.y - g.h, vida: 1.4, max: 1.4
      });
    }
  };

  /* Detalhes que dão função visível a cada prédio (página 20 do documento). */
  R.detalharEstrutura = function (ctx, b, g, v) {
    var z = this.cam.zoom;
    if (z < 0.5) return;
    var c = this.paraTela(b.x + b.w / 2, b.y + b.h / 2);
    var topoY = c.y - g.h;

    if (b.tipo === 'central') {
      /* mastro com luz de sinalização e plataforma */
      ctx.strokeStyle = '#9fc8ea'; ctx.lineWidth = 2 * z;
      ctx.beginPath(); ctx.moveTo(c.x, topoY); ctx.lineTo(c.x, topoY - 26 * z); ctx.stroke();
      ctx.fillStyle = 'rgba(255,110,120,' + (0.45 + 0.45 * Math.sin(this.quadro / 16)) + ')';
      ctx.beginPath(); ctx.arc(c.x, topoY - 28 * z, 3.4 * z, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.4 * z;
      ctx.beginPath();
      ctx.moveTo(c.x - 22 * z, topoY); ctx.lineTo(c.x, topoY - 11 * z);
      ctx.lineTo(c.x + 22 * z, topoY); ctx.lineTo(c.x, topoY + 11 * z);
      ctx.closePath(); ctx.stroke();
    } else if (b.tipo === 'gerador') {
      ctx.fillStyle = b.semEnergia ? '#55506a' : 'rgba(190,150,255,' + (0.5 + 0.4 * Math.sin(this.quadro / 9)) + ')';
      ctx.beginPath(); ctx.arc(c.x, topoY - 3 * z, 6 * z, 0, 6.283); ctx.fill();
    } else if (b.tipo === 'deposito' || b.tipo === 'alojamento') {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(c.x - 11 * z, topoY - 2 * z, 22 * z, 3 * z);
    } else if (b.tipo === 'quartel' || b.tipo === 'oficina') {
      ctx.fillStyle = v.teto;
      ctx.fillRect(c.x - 12 * z, topoY - 4 * z, 24 * z, 2.4 * z);
      ctx.fillRect(c.x - 2 * z, topoY - 12 * z, 4 * z, 9 * z);
    } else if (b.tipo === 'pesquisa') {
      ctx.strokeStyle = 'rgba(160,220,255,0.65)'; ctx.lineWidth = 1.6 * z;
      ctx.beginPath(); ctx.arc(c.x, topoY - 6 * z, 8 * z, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(160,220,255,0.8)';
      ctx.beginPath(); ctx.arc(c.x + Math.cos(this.quadro / 12) * 8 * z, topoY - 6 * z + Math.sin(this.quadro / 12) * 4 * z, 2 * z, 0, 6.283); ctx.fill();
    } else if (b.tipo === 'extrator') {
      /* era o cristal ciano brotando; virou o visor âmbar do tanque de óleo */
      ctx.fillStyle = 'rgba(232,163,61,' + (0.45 + 0.35 * Math.sin(this.quadro / 7)) + ')';
      ctx.fillRect(c.x - 6 * z, topoY - 4 * z, 12 * z, 3 * z);
    } else if (b.portao) {
      ctx.fillStyle = b.portaoAberto ? 'rgba(140,224,127,0.8)' : 'rgba(255,180,90,0.85)';
      ctx.fillRect(c.x - 8 * z, topoY - 3 * z, 16 * z, 2.6 * z);
    } else if (b.muro) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(c.x - 9 * z, topoY - 1 * z, 18 * z, 2 * z);
    }
  };

  /* Barra de vida/obra flutuando sobre a estrutura. */
  R.barra = function (ctx, ent, frac, cor, rotulo) {
    var z = this.cam.zoom;
    var meio = ent.w ? this.paraTela(ent.x + ent.w / 2, ent.y + ent.h / 2) : this.paraTela(ent.x, ent.y);
    var larg = (ent.w ? 30 + ent.w * 6 : 22) * z;
    var y = meio.y - (ent.w ? (32 + ent.w * 7) : 26) * z;
    ctx.fillStyle = 'rgba(6,10,16,0.72)';
    ctx.fillRect(meio.x - larg / 2, y, larg, 4.4 * z);
    ctx.fillStyle = cor;
    ctx.fillRect(meio.x - larg / 2, y, larg * U.clamp(frac, 0, 1), 4.4 * z);
    if (rotulo && z > 0.6) {
      ctx.fillStyle = '#ffd479';
      ctx.font = (7 * z).toFixed(1) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(rotulo, meio.x, y - 3 * z);
      ctx.textAlign = 'left';
    }
  };

  R.icone = function (ctx, x, y, cor, texto) {
    var z = this.cam.zoom;
    if (z < 0.5) return;
    ctx.fillStyle = cor;
    ctx.font = 'bold ' + (11 * z).toFixed(1) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(texto, x, y);
    ctx.textAlign = 'left';
  };

  /* ------------------------------------------------------------ unidades */
  var CORES_UNIDADE = {
    operario: '#ffd479', fuzileiro: '#cfe6ff', incendiario: '#ff9a5c',
    medico: '#9fffd0', lanceiro: '#b8f0d0', drone: '#8fd9ff', tanque: '#ffd27f'
  };

  /* Altura do sprite na tela, em células (uma célula = ALT px de fundo). É
     separado do `raio` de propósito: raio é colisão, e tanque e soldado têm o
     mesmo raio sem ter nada parecido de altura. Quem não está aqui usa 1.3. */
  /* A altura de cada corpo mora em anima.js, porque a animação precisa dela
     tanto quanto o desenho: é dela que sai o comprimento da perna, e é o
     comprimento da perna que decide o tamanho do passo. */
  var ALTURA_SPRITE = UF.Anima.ALTURA;

  /* Desenha o sprite da unidade com a postura que `anima` calculou e devolve o
     topo em tela, para os avisos flutuarem no lugar certo.
     A altura vem de ALTURA_SPRITE, em células, e não do `raio`: raio é medida de
     colisão, e um tanque e um soldado com o mesmo raio não têm de forma alguma a
     mesma altura na tela. O giro acontece em torno do PÉ, não do centro — girar
     pelo meio faria a figura afundar no chão e depois flutuar. */
  /* Contorno de silhueta, no tamanho em que a figura APARECE.
     É o passo que o Age of Empires II tinha e nós não: depois de renderizar o
     3D, um especialista 2D abria quadro a quadro no Photoshop e "afiava o
     detalhe e suavizava a borda das formas irregulares", porque o sprite tem
     algumas dezenas de pixels na tela e, reduzido cru, se dissolve no chão.

     Fazer isso no ARQUIVO não resolve: o contorno seria reduzido junto e
     sumiria. Tem de ser na medida da tela — e como o jogo tem zoom, a medida
     muda. Daí o cache por (imagem, altura arredondada): o contorno é desenhado
     uma vez por tamanho e depois só copiado, do mesmo jeito que os prédios.

     O desenho é o clássico: a figura em preto deslocada para os oito lados,
     com a figura de verdade por cima. */
  R.spriteContornado = function (img, largPx, altPx) {
    if (!this.cacheContorno) { this.cacheContorno = {}; this.cacheContornoN = 0; }
    var a = Math.max(8, Math.round(altPx / 3) * 3);      /* degraus de 3 px */
    var l = Math.max(4, Math.round(largPx * a / altPx));
    if (!img.uf_id) { img.uf_id = ++this.cacheContornoN; }
    var chave = img.uf_id + ':' + a;
    var pronto = this.cacheContorno[chave];
    if (pronto) return pronto;

    var m = 2;                                           /* margem do contorno */
    var cv = global.document.createElement('canvas');
    cv.width = l + m * 2; cv.height = a + m * 2;
    var c = cv.getContext('2d');
    var lados = [[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
    for (var i = 0; i < lados.length; i++) {
      c.drawImage(img, m + lados[i][0], m + lados[i][1], l, a);
    }
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#0c0f14';
    c.fillRect(0, 0, cv.width, cv.height);
    c.globalCompositeOperation = 'source-over';
    c.drawImage(img, m, m, l, a);

    pronto = { cv: cv, m: m, l: l, a: a };
    /* teto: cada zoom novo cria um tamanho novo, e sem limite isso cresce sem
       parar durante uma partida com muito zoom */
    var chaves = Object.keys(this.cacheContorno);
    if (chaves.length > 260) delete this.cacheContorno[chaves[0]];
    this.cacheContorno[chave] = pronto;
    return pronto;
  };

  /* SOMBRA.
     É a peça que o Age of Empires II e o StarCraft nunca dispensaram, e que nós
     não tínhamos: sem ela a figura fica de adesivo colado no chão, e o olho
     perde a que está no ar — o drone voando parecia andar.

     Os clássicos DESENHAVAM a sombra como quadro separado, um por pose. Nós
     temos 136 peças e nenhuma sombra desenhada; fazer 136 seria semanas de
     geração. Aqui a sombra sai da própria figura: a silhueta dela, achatada
     contra o chão e inclinada para o lado oposto à luz, que no nosso desenho
     vem de cima e da esquerda.

     Vale a pena porque é automática — unidade nova ganha sombra sem arte nova —
     e porque o que o jogador lê é a MANCHA no chão, não o recorte dela. O preço
     é a sombra ser a figura de pé deitada, e não a projeção verdadeira de um
     corpo tridimensional; no tamanho em que aparece, não se distingue.

     Guardada por (imagem, altura) como o contorno, e pelo mesmo motivo: o zoom
     muda o tamanho e refazer a cada quadro custaria caro. */
  R.silhuetaChapada = function (img, largPx, altPx) {
    if (!this.cacheSombra) { this.cacheSombra = {}; this.cacheSombraN = 0; }
    var a = Math.max(6, Math.round(altPx));
    var l = Math.max(4, Math.round(largPx * a / altPx));
    if (!img.uf_id) { img.uf_id = ++this.cacheContornoN; }
    var chave = img.uf_id + ':' + a;
    var pronto = this.cacheSombra[chave];
    if (pronto) return pronto;

    var cv = global.document.createElement('canvas');
    cv.width = l; cv.height = a;
    var c = cv.getContext('2d');
    c.drawImage(img, 0, 0, l, a);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#000';
    c.fillRect(0, 0, l, a);

    pronto = { cv: cv, l: l, a: a };
    var chaves = Object.keys(this.cacheSombra);
    if (chaves.length > 260) delete this.cacheSombra[chaves[0]];
    this.cacheSombra[chave] = pronto;
    return pronto;
  };

  /* `pe` é o chão; `voo` é o quanto a unidade está acima dele. A sombra fica
     SEMPRE no chão: é ela que diz que o drone está voando, e a distância entre
     a figura e a mancha é a altura. */
  R.sombraDeSprite = function (ctx, img, larg, alt, voo) {
    if (!img || alt < 6) return;
    var s = this.silhuetaChapada(img, larg, alt);
    ctx.save();
    /* Mais alto, mais espalhada e mais fraca — como sombra de verdade. */
    var altura = Math.max(0, voo || 0);
    var espalha = 1 + Math.min(0.6, altura / 60);
    ctx.globalAlpha = 0.46 / espalha;
    ctx.translate(0, altura);
    /* A mancha DEITA no chão, para a frente e para a ESQUERDA.
       Eu tinha escrito "para a direita, porque a luz vem da esquerda" — e a
       premissa estava errada. Medido nas 110 peças: 45 dos 56 prompts pedem luz
       de cima e da esquerda, mas 69 das peças têm o brilho à DIREITA, e o
       código de iluminação do terreno e das estruturas também trabalha pela
       direita. Com a luz à direita, a sombra cai à esquerda. Era a única peça
       do desenho discordando de todas as outras.

       "Para baixo na tela" é para a frente, na direção de quem olha, e é ali
       que a sombra tem de ficar para ser vista — isso continua valendo. O `y`
       começa em zero e cresce, então a figura é deitada a partir do PÉ. */
    /* Inclinação CURTA. Com 0,62 a mancha virava um rastro comprido atravessando
       duas células — lia-se como borrão, não como sombra. O que os clássicos
       põem no chão é compacto: a figura deitada até pouco mais da metade,
       encostada no pé. */
    ctx.transform(1, 0, -0.34, 0.26, 0, 0);
    ctx.drawImage(s.cv, -larg / 2 * espalha, 0, larg * espalha, alt * espalha);
    ctx.restore();
  };

  /* Desenha com contorno quando a figura está pequena o bastante para precisar
     dele. Grande, o contorno vira uma borda grossa e feia. */
  R.imagemComSilhueta = function (ctx, img, x, y, larg, alt) {
    if (alt > 150 || alt < 8) { ctx.drawImage(img, x, y, larg, alt); return; }
    var s = this.spriteContornado(img, larg, alt);
    var esc = alt / s.a;
    ctx.drawImage(s.cv, x - s.m * esc, y - s.m * esc,
      s.cv.width * esc, s.cv.height * esc);
  };

  /* O CAMPO DE BATALHA GUARDA OS MORTOS.
     A unidade morta é removida da simulação 1,2 s depois do último dano, e com
     ela sumia qualquer vestígio da luta: o chão voltava a ficar limpo como se
     nada tivesse acontecido. No Age of Empires II o cadáver ficava cerca de
     trinta segundos — é isso que faz uma investida parecer que custou caro.

     O cadáver vive SÓ NO DESENHO. A simulação não precisa saber dele: não
     bloqueia, não é alvo, não entra em rota. Mantê-lo fora dela é o que permite
     guardá-lo por meio minuto sem custo de regra nenhum, e sem mexer em
     nenhuma invariante que os testes protegem. */
  var TEMPO_CADAVER = 26;
  var ATRASO_CADAVER = 1.1;      /* o tanto que o tombo leva na simulação */

  R.deitarCadaver = function (e) {
    if (!this.cadaveres) this.cadaveres = [];
    this.cadaveres.push({
      x: e.x, y: e.y, tipo: e.unidade, lado: e.lado,
      angulo: e.angulo === undefined ? 0 : e.angulo,
      /* O corpo tomba primeiro. A unidade morta continua na simulação por 1,2 s
         fazendo o tombo, e o cadáver só entra quando ela sai — senão os dois
         aparecem juntos no mesmo lugar, e havia MESMO dois corpos sobrepostos
         durante mais de um segundo. O atraso é o que costura as duas metades da
         morte: a queda, que é calculada, e o corpo no chão, que é desenhado. */
      atraso: ATRASO_CADAVER,
      vida: TEMPO_CADAVER, max: TEMPO_CADAVER
    });
    /* teto: uma partida longa, com muitas ondas, não pode acumular sem fim */
    if (this.cadaveres.length > 160) this.cadaveres.splice(0, this.cadaveres.length - 160);
  };

  /* Sangue. A cor separa os dois lados sem precisar de legenda: verde-ácido
     para a colmeia, vermelho escuro para gente. É o mesmo truque de sempre —
     quem olha o campo de batalha de cima sabe de quem foi a perda pela cor da
     mancha, sem ter de identificar o corpo. */
  var SANGUE = { inimigo: 'rgba(126,186,46,', aliado: 'rgba(122,26,24,' };

  R.desenharCadaver = function (ctx, item) {
    var c = item.dado, z = this.cam.zoom;
    if (c.atraso > 0) return;              /* ainda tombando: quem desenha é a unidade */
    var p = this.paraTela(c.x, c.y);
    var pasta = c.lado === 'inimigo' ? 'inimigos/' : 'unidades/';
    var t = UF.sprites.tira(pasta + c.tipo + '-morto');
    /* últimos três segundos: some devagar, para o sumiço não ser um piscar */
    var alfa = c.vida > 3 ? 1 : Math.max(0, c.vida / 3);
    var idade = 1 - c.vida / c.max;

    /* A POÇA cresce nos primeiros segundos e depois fica. Ela vem ANTES do
       corpo, porque escorre por baixo dele, e some mais devagar do que ele: o
       corpo o jogo recolhe, a mancha no chão fica. */
    var base = SANGUE[c.lado === 'inimigo' ? 'inimigo' : 'aliado'];
    var cresce = Math.min(1, idade * 9);
    var rx = (9 + 7 * cresce) * z, ry = rx * 0.45;
    ctx.save();
    ctx.globalAlpha = Math.min(0.5, alfa * 0.5) * cresce;
    ctx.fillStyle = base + '1)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 1 * z, rx, ry, 0, 0, 6.283);
    ctx.fill();
    /* dois respingos fora da poça, para a mancha não ser um oval perfeito */
    var h1 = (c.x * 37 + c.y * 91) % 100 / 100, h2 = (c.x * 13 + c.y * 57) % 100 / 100;
    ctx.beginPath();
    ctx.ellipse(p.x + (h1 - 0.5) * rx * 2.4, p.y + (h2 - 0.5) * ry * 2.2,
      rx * 0.3, ry * 0.32, 0, 0, 6.283);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = alfa * 0.92;
    if (t) {
      /* Corpo deitado escala pela LARGURA, não pela altura. A altura de sprite
         é feita para a figura EM PÉ; usada num corpo deitado — que é largo e
         baixo — ela estica a largura e o bicho morto sai maior que o vivo.
         O que se mede num cadáver é o quanto ele ocupa do chão. */
      var larg = (ALTURA_SPRITE[c.tipo] || 1.3) * ALT * z * 1.15;
      var alt = t.alt * (larg / t.larg);
      /* deitado aponta para onde a unidade estava virada; espelha para a
         esquerda como todo o resto do jogo */
      var paraDireita = Math.cos(c.angulo) - Math.sin(c.angulo) >= 0;
      ctx.translate(p.x, p.y);
      if (!paraDireita) ctx.scale(-1, 1);
      this.imagemComSilhueta(ctx, t.img, -larg / 2, -alt * 0.62, larg, alt);
    } else {
      /* sem arte de corpo caído: uma mancha escura, que já é melhor que nada */
      ctx.fillStyle = c.lado === 'inimigo' ? 'rgba(60,28,24,0.5)' : 'rgba(28,32,40,0.5)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 11 * z, 5.5 * z, 0, 0, 6.283);
      ctx.fill();
    }
    ctx.restore();
  };

  /* Vizinha mais próxima quando a direção exata não foi desenhada.
     Nem toda unidade vai ter as cinco. O gerador de imagem faz a folha de cinco
     poses para humanoide, mas para CRIATURA ele muda a postura do bicho em vez
     de girar a câmera: pedindo "de costas", o quadrúpede veio em pé, bípede.
     Três tentativas, três bichos errados — então o Corredor tem leste, nordeste
     e sudeste, e as duas que faltam caem na vizinha.
     Vinte e dois graus de erro num bicho que se mexe é invisível; um sprite
     faltando não é. Foi assim que os jogos com pouco quadro sempre fizeram. */
  var VIZINHAS = {
    leste: ['leste', 'nordeste', 'sudeste'],
    nordeste: ['nordeste', 'leste', 'norte'],
    norte: ['norte', 'nordeste', 'leste'],
    sudeste: ['sudeste', 'leste', 'sul'],
    sul: ['sul', 'sudeste', 'leste']
  };

  R.tiraDaDirecao = function (prefixo, nome) {
    var ordem = VIZINHAS[nome] || [nome];
    for (var i = 0; i < ordem.length; i++) {
      var t = UF.sprites.tira(prefixo + ordem[i]);
      if (t) return t;
    }
    return null;
  };

  R.spriteUnidade = function (ctx, u, img, p, raio, voo, z, sim) {
    var pose = this.anima ? this.anima.postura(u, z, this.sim)
      : { espelhar: false, giro: 0, subir: 0, desviaX: 0, desviaY: 0, escalaY: 1, alfa: 1 };
    var alt = (ALTURA_SPRITE[u.tipo] || 1.3) * ALT * z * pose.escalaY;
    var larg = img.width * ((ALTURA_SPRITE[u.tipo] || 1.3) * ALT * z / img.height);
    var pe = p.y - voo + raio * 0.2 - pose.subir + pose.desviaY;

    ctx.save();
    if (pose.alfa < 1) ctx.globalAlpha = pose.alfa;
    /* Clarão de dano: a unidade pisca branca no instante em que é atingida.
       `ultimoDano` já era anotado pela simulação e só servia para decidir a
       hora de remover o corpo. Sem esse piscar, levar tiro e não levar tiro
       têm exatamente a mesma aparência, e o combate fica mudo. */
    if (sim && u.ultimoDano !== undefined && sim.t - u.ultimoDano < 0.11 && !u.morta) {
      ctx.filter = 'brightness(2.6) saturate(0.5)';
    }
    ctx.translate(p.x + pose.desviaX, pe);
    /* A SOMBRA vai ANTES do giro e do espelho, e de propósito: ela é do chão,
       não do corpo. Girar a sombra junto faria a mancha tombar com a figura,
       que é o que sombra nenhuma faz. */
    this.sombraDeSprite(ctx, img, larg, alt, voo);
    if (pose.giro) ctx.rotate(pose.giro);
    if (pose.espelhar) ctx.scale(-1, 1);

    /* Trabalhando, o operário troca de QUADRO em vez de ser deformado: aqui
       existem quatro poses desenhadas do golpe, e desenho de verdade ganha de
       qualquer giro que eu calcule. O ritmo vem do relógio da tarefa, então a
       picareta bate no compasso em que ele de fato extrai. */
    /* Quadros desenhados, quando existem para o que a unidade está fazendo.
       Andando, QUEM ESCOLHE O QUADRO é a fase da passada — a mesma que anda por
       distância percorrida, não por relógio. Assim o quadro de pé-no-chão cai
       quando o pé está de fato no chão, e a unidade não patina. Trocar quadro
       por tempo traria o deslizamento de volta pela porta dos fundos. */
    /* A pasta muda para invasor. A chave era montada sempre como
       'unidades/<tipo>-...', então uma tira colocada em assets/inimigos/ nunca
       seria encontrada — nenhum bicho poderia ser animado. */
    var pasta = u.lado === 'inimigo' ? 'inimigos/' : 'unidades/';
    var t = null, q = 0;

    /* MORRENDO: os quadros da queda, quando existem. O tombo calculado continua
       valendo por baixo — ele dá o giro e o afundamento —, mas trocar a POSE no
       meio do caminho é o que separa "boneco girando" de "gente caindo". São
       dois quadros, e não dez: o que o olho pega numa queda de meio segundo é o
       instante do impacto e o do meio do caminho. O resto é embalo. */
    if (u.morta && this.anima) {
      var tm = this.anima.morte[u.id] || 0;
      var caindo = tm < 0.2 ? UF.sprites.tira(pasta + u.tipo + '-caindo1')
        : tm < 0.5 ? UF.sprites.tira(pasta + u.tipo + '-caindo2') : null;
      if (caindo) {
        var altC = (ALTURA_SPRITE[u.tipo] || 1.3) * ALT * z;
        var largC = caindo.larg * (altC / caindo.alt);
        this.imagemComSilhueta(ctx, caindo.img, -largC / 2, -altC, largC, altC);
        ctx.restore();
        return pe - altC;
      }
    }

    if (pose.golpe) {
      t = UF.sprites.tira(pasta + u.tipo + '-minerar');
      if (t) q = Math.floor(((sim ? sim.t : 0) * 6 + (u.animacao || 0)) % t.n);
    } else if (this.anima) {
      /* ATACANDO ganha precedência sobre andar: quem está trocando tiro está
         parado de frente para o alvo, e era exatamente isso que faltava — a
         direção era calculada e jogada fora porque só o ramo do movimento a
         consultava. Unidade parada atirando tem `u.rota` nulo e caía na imagem
         única, sempre na mesma pose, "atirando de lado". */
      var atacando = u.alvo && u.recarga > 0 && !u.operario;
      /* O DETONADOR morre no mesmo quadro em que ataca — `suicida` aplica o
         dano e logo em seguida mata o próprio bicho. A pose de ataque dele
         nunca chegaria a aparecer: o quadro seguinte já é o da morte. Então
         para o suicida a pose vale na APROXIMAÇÃO, quando ele já escolheu o
         alvo e está a menos de três células. Não é licença poética — é o mesmo
         aviso que o StarCraft dá antes do baneling estourar, e o jogador
         precisa dele para ter tempo de reagir. */
      if (!atacando && u.alvo && u.def && u.def.suicida && sim) {
        var vitima = sim.alvoPorId(u.alvo);
        if (vitima && sim.distanciaEntre(u, vitima) < 3) atacando = true;
      }
      var d = this.anima.direcao(u, sim);
      /* `-atirar-` para quem dispara, `-atacar-` para quem morde. São nomes
         diferentes porque descrevem coisas diferentes, e o mesmo bicho pode um
         dia ter as duas: o Cuspidor cospe de longe e dá patada de perto. */
      if (atacando) {
        t = this.tiraDaDirecao(pasta + u.tipo + '-atirar-', d.nome) ||
          this.tiraDaDirecao(pasta + u.tipo + '-atacar-', d.nome);
      }
      if (!t && u.rota) t = this.tiraDaDirecao(pasta + u.tipo + '-andar-', d.nome);
      if (t) {
        if (t.n > 1) {
          var fase = this.anima.passo[u.id];
          if (atacando) q = Math.floor(((sim ? sim.t : 0) * 10) % t.n);
          else if (fase !== undefined) q = Math.floor(fase / 6.283 * t.n) % t.n;
          else t = null;
        }
        /* o espelho já veio de `pose.espelhar`; aqui só corrige quando a
           direção escolhida discorda dele (frente e costas não espelham) */
        if (t && d.espelhar !== pose.espelhar) ctx.scale(-1, 1);
      }
    }
    if (t) {
      var altT = (ALTURA_SPRITE[u.tipo] || 1.3) * ALT * z;
      var largT = t.larg * (altT / t.alt);
      /* O sobe-e-desce do corpo JÁ ESTÁ no desenho: o quadro de pernas abertas
         é mais curto que o de perna esticada, e recortados rente os dois se
         apoiam no mesmo pé. Somar aqui o bob calculado aplicaria o movimento
         duas vezes — e o boneco passa a pular em vez de andar. */
      ctx.translate(0, -pose.subir);
      /* quadro de tira: recorta primeiro, contorna depois — o contorno tem de
         ser da POSE, não da folha inteira */
      if (t.n === 1) {
        this.imagemComSilhueta(ctx, t.img, -largT / 2, -altT, largT, altT);
      } else {
        ctx.drawImage(t.img, q * t.larg, 0, t.larg, t.alt,
          -largT / 2, -altT, largT, altT);
      }
      ctx.restore();
      return pe - altT;
    }

    var frac = UF.Anima && UF.Anima.PERNAS[u.tipo];
    var chao = this.anima ? this.anima.passada(u) : 0;
    if (frac && chao) this.caminhada(ctx, img, larg, alt, frac, chao, this.anima.passadaAr(u));
    else if (frac && pose.golpe) this.caminhada(ctx, img, larg, alt, frac, 0, 0, pose.golpe);
    else this.imagemComSilhueta(ctx, img, -larg / 2, -alt, larg, alt);

    ctx.restore();
    return pe - alt;
  };

  /* Caminhada de gente com UMA imagem só: a metade de baixo é desenhada duas
     vezes, girando no quadril para lados opostos — uma perna vai enquanto a
     outra volta. A de trás sai escurecida, senão as duas se confundem num
     borrão. O torso contra-balança de leve, que é o que o corpo faz de verdade.
     É animação recortada, a mesma ideia de boneco de papel articulado. */
  R.caminhada = function (ctx, img, larg, alt, frac, angChao, angAr, golpe) {
    var quadril = -alt * frac;          /* origem: o pé está em 0 */
    var alturaPerna = alt * frac;
    /* A faixa da perna sobe um pouco ACIMA do quadril e o tronco desce um pouco
       ABAIXO: as duas metades dividem essa faixa. Cortadas na mesma linha exata,
       a rotação abre uma fenda bem no meio da cintura. */
    var costura = alt * 0.05;

    /* O contorno entra AQUI dentro, e não por fora: a figura é desenhada em
       metades recortadas, e contornar por fora daria uma linha escura na
       cintura. Desenhada aqui, a parte do contorno que cairia na linha de corte
       é comida pelo `clip` — sobra só a silhueta externa, que é o que importa. */
    var self = this;
    function perna(a, escurecer) {
      ctx.save();
      ctx.translate(0, quadril);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.rect(-larg / 2, -costura, larg, alturaPerna + costura + 1);
      ctx.clip();
      self.imagemComSilhueta(ctx, img, -larg / 2, -alt * (1 - frac), larg, alt);
      if (escurecer) {
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(0,0,0,0.38)';
        ctx.fillRect(-larg / 2, -costura, larg, alturaPerna + costura + 1);
      }
      ctx.restore();
    }

    /* O SINAL importa e não se confere no olho: com a perna plantada invertida,
       o pé anda para a frente junto com o corpo em vez de ficar cravado — medi e
       ele andava o DOBRO da velocidade do corpo, o que é pior do que não animar.
       A plantada é a que vai de +A a −A: é assim que sen(θ) decresce na mesma
       taxa em que o corpo avança, e o pé fica parado. */
    perna(angAr, true);                 /* a do ar, desenhada atrás e escurecida */
    perna(angChao, false);              /* a plantada, por cima */

    ctx.save();                         /* tronco, cabeça e braços, por cima */
    ctx.translate(0, quadril);
    ctx.rotate(golpe || -angChao * 0.18);
    ctx.beginPath();
    ctx.rect(-larg / 2, -alt * (1 - frac), larg, alt * (1 - frac) + costura);
    ctx.clip();
    this.imagemComSilhueta(ctx, img, -larg / 2, -alt * (1 - frac), larg, alt);
    ctx.restore();

  };

  /* Canhão giratório para VEÍCULO. Gerar cinco poses de tanque por IA foi
     tentado e não deu: o modelo devolve um tanque só, por mais explícito que
     seja o pedido — ele entende "cinco poses" para gente e ignora para máquina.
     E não precisa: num tanque quem gira é a TORRE, e torre é um cilindro. O
     mesmo desenho que as torres de defesa usam (um retângulo girado em torno de
     um pivô) resolve, custa zero de arte e aponta com precisão de grau, coisa
     que cinco desenhos nunca dariam.
     Vale só para quem tem `torreta` em ALTURA_SPRITE-style: hoje o tanque. */
  var TORRETA = {
    tanque: { pivo: 0.56, comp: 13, grossura: 3.0, cor: '#5d6650', cano: '#454d3a' },
    /* O drone é pequeno e voa: desenhar cinco poses dele seria caro para o que
       se enxerga. Dois canos curtos girando embaixo do corpo dizem a mesma
       coisa e custam nada. */
    drone: { pivo: 0.34, comp: 7, grossura: 1.8, cor: '#41586b', cano: '#2e3f4e', duplo: 2.6 }
  };

  R.canhaoDeVeiculo = function (ctx, u, p, z, alturaTela) {
    var t = TORRETA[u.tipo];
    if (!t || u.morta) return;
    var alvo = u.alvo && this.sim.alvoPorId(u.alvo);
    /* sem alvo o cano fica no rumo da marcha, e não travado num ângulo fixo:
       tanque parado com o canhão torto parece quebrado */
    var ang = u.angulo === undefined ? -0.6 : u.angulo;
    if (alvo && !alvo.morta) {
      var c = this.sim.centroDe(alvo);
      var pa = this.paraTela(c.x, c.y);
      ang = Math.atan2((pa.y - (p.y - alturaTela * t.pivo)) * 1, pa.x - p.x);
    } else {
      /* o ângulo de mundo vira ângulo de tela na projeção 2:1 */
      var dx = Math.cos(ang), dy = Math.sin(ang);
      ang = Math.atan2((dx + dy) * 0.5, dx - dy);
    }
    var cx = p.x, cy = p.y - alturaTela * t.pivo;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = t.cano;
    if (t.duplo) {
      ctx.fillRect(0, (-t.duplo - t.grossura / 2) * z, t.comp * z, t.grossura * z);
      ctx.fillRect(0, (t.duplo - t.grossura / 2) * z, t.comp * z, t.grossura * z);
    } else {
      ctx.fillRect(0, -t.grossura / 2 * z, t.comp * z, t.grossura * z);
    }
    ctx.restore();
    /* a base do cano é pequena: ela existe para o cano não parecer colado no
       nada, não para virar um disco em cima do tanque */
    ctx.fillStyle = t.cor;
    ctx.beginPath(); ctx.arc(cx, cy, 3.2 * z, 0, 6.283); ctx.fill();
    /* clarão no instante do disparo: a recarga acabou de ser reiniciada */
    var arma = u.def && u.def.arma;
    if (arma && u.recarga > arma.cad - 0.1 && alvo) {
      var bx = cx + Math.cos(ang) * t.comp * z, by = cy + Math.sin(ang) * t.comp * z;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#fff0c4';
      ctx.beginPath(); ctx.arc(bx, by, 5 * z, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  R.desenharUnidade = function (ctx, item) {
    var u = item.dado, z = this.cam.zoom;
    var p = this.paraTela(u.x, u.y);
    var inimigo = u.lado === 'inimigo';
    var cor = inimigo ? u.def.cor : (CORES_UNIDADE[u.tipo] || '#dfe6ee');
    var raio = (u.def.raio || 0.3) * LARG * 0.5 * z;
    var voo = u.voa ? 26 * z : 0;

    var img = UF.sprites && (inimigo ? UF.sprites.inimigo(u.tipo) : UF.sprites.unidade(u.tipo));

    if (u.morta) {
      /* Com sprite o corpo TOMBA e afunda; sem ele, continua a mancha de antes. */
      if (img && this.anima) { this.spriteUnidade(ctx, u, img, p, raio, voo, z, this.sim); return; }
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = inimigo ? '#5a2a2a' : '#40464e';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, raio * 1.2, raio * 0.6, 0, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }

    /* sombra no chão */
    ctx.fillStyle = 'rgba(0,0,0,0.34)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 2 * z, raio * (u.voa ? 0.7 : 0.95), raio * (u.voa ? 0.34 : 0.46), 0, 0, 6.283);
    ctx.fill();

    var balanco = u.rota ? Math.sin(this.quadro / 4 + u.animacao) * 1.4 * z : 0;
    var topo = p.y - voo - raio * 1.5 - balanco;

    if (img) {
      topo = this.spriteUnidade(ctx, u, img, p, raio, voo, z, this.sim);
      /* o cano vai POR CIMA do casco: é peça de máquina, não de terreno */
      this.canhaoDeVeiculo(ctx, u, p, z, p.y - topo);
      this.avisosUnidade(ctx, u, p, topo, raio, voo, inimigo, z);
      return;
    }

    if (u.voa) {                                     /* asas */
      ctx.strokeStyle = sombrear(cor, 0.8);
      ctx.lineWidth = 2 * z;
      var abre = Math.sin(this.quadro / 2.2 + u.animacao) * raio * 0.7;
      ctx.beginPath();
      ctx.moveTo(p.x - raio * 1.8, p.y - voo - abre);
      ctx.lineTo(p.x, p.y - voo - raio * 0.5);
      ctx.lineTo(p.x + raio * 1.8, p.y - voo - abre);
      ctx.stroke();
    }

    /* corpo */
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(p.x, topo);
    ctx.lineTo(p.x + raio, p.y - voo - raio * 0.35);
    ctx.lineTo(p.x, p.y - voo + raio * 0.3);
    ctx.lineTo(p.x - raio, p.y - voo - raio * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = sombrear(cor, 0.62);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - voo + raio * 0.3);
    ctx.lineTo(p.x + raio, p.y - voo - raio * 0.35);
    ctx.lineTo(p.x + raio * 0.5, p.y - voo + raio * 0.1);
    ctx.closePath();
    ctx.fill();

    this.avisosUnidade(ctx, u, p, topo, raio, voo, inimigo, z);
  };

  /* Tudo que flutua sobre a unidade e não faz parte do corpo dela: o que ela
     carrega, o que ela não está conseguindo fazer, quanto de vida sobrou. Vale
     igual para o corpo procedural e para o sprite. */
  R.avisosUnidade = function (ctx, u, p, topo, raio, voo, inimigo, z) {
    if (u.def.chefe) {
      ctx.strokeStyle = 'rgba(255,80,150,' + (0.4 + 0.3 * Math.sin(this.quadro / 9)) + ')';
      ctx.lineWidth = 2.4 * z;
      ctx.beginPath(); ctx.arc(p.x, p.y - voo, raio * 2.1, 0, 6.283); ctx.stroke();
    }

    if (u.carga > 0) this.icone(ctx, p.x, topo - 5 * z, u.cargaTipo === 'petroleo' ? '#e8a33d' : '#ffd479', '◆');
    if (u.tarefa && u.tarefa.tipo === 'fugindo') this.icone(ctx, p.x, topo - 5 * z, '#ff9a6b', '!');
    else if (u.bloqueado) this.icone(ctx, p.x, topo - 5 * z, '#ff7a6b', '⊘');
    else if (u.operario && u.tarefa && u.tarefa.tipo === 'ocioso') this.icone(ctx, p.x, topo - 5 * z, '#9aa6b5', 'z');

    if (u.hp < u.hpMax) {
      var frac = u.hp / u.hpMax, larg = raio * 2.4;
      ctx.fillStyle = 'rgba(6,10,16,0.72)';
      ctx.fillRect(p.x - larg / 2, topo - 12 * z, larg, 3.2 * z);
      ctx.fillStyle = inimigo ? '#ff6b6b' : (frac > 0.5 ? '#8ce07f' : '#ffd479');
      ctx.fillRect(p.x - larg / 2, topo - 12 * z, larg * frac, 3.2 * z);
    }
    if (this.sim.alvoPrioritario === u.id) {
      ctx.strokeStyle = '#ff5d7a'; ctx.lineWidth = 2 * z;
      ctx.beginPath(); ctx.arc(p.x, p.y - voo, raio * 1.9, 0, 6.283); ctx.stroke();
    }
  };

  /* ---------------------------------------------------------- projéteis */
  /* Um ponto parado não parece um tiro. O que dá velocidade ao projétil é o
     TRAÇANTE: o segmento entre onde ele estava no quadro anterior e onde está
     agora, esticado um pouco para trás. Em cima dele vai o núcleo claro, que é
     o que o olho segue.
     O obus (`area`) ganha um risco de fumaça em vez de traçante — arma pesada
     lê diferente de bala, e hoje as seis famílias de arma usavam o mesmo
     círculo. */
  R.desenharProjeteis = function (ctx) {
    var z = this.cam.zoom;
    for (var i = 0; i < this.sim.projeteis.length; i++) {
      var p = this.sim.projeteis[i];
      var t = this.paraTela(p.x, p.y);
      var a = this.paraTela(p.antX === undefined ? p.x : p.antX,
        p.antY === undefined ? p.y : p.antY);
      var ax = t.x + (a.x - t.x) * 3.2, ay = t.y + (a.y - t.y) * 3.2;
      var alto = 12 * z;

      ctx.lineCap = 'round';
      if (p.area) {
        ctx.strokeStyle = 'rgba(190,185,175,0.32)';
        ctx.lineWidth = 3.4 * z;
        ctx.beginPath();
        ctx.moveTo(ax, ay - alto); ctx.lineTo(t.x, t.y - alto); ctx.stroke();
      } else {
        ctx.strokeStyle = p.cor || '#ffd7a0';
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = 2.6 * z;
        ctx.beginPath();
        ctx.moveTo(ax, ay - alto); ctx.lineTo(t.x, t.y - alto); ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = p.cor || '#ffd7a0';
      ctx.beginPath();
      ctx.arc(t.x, t.y - alto, (p.area ? 3.4 : 2.0) * z, 0, 6.283);
      ctx.fill();
      ctx.globalAlpha = 0.3;
      ctx.beginPath(); ctx.arc(t.x, t.y - alto, (p.area ? 6 : 4) * z, 0, 6.283); ctx.fill();
      ctx.globalAlpha = 1;
    }
  };

  /* ------------------------------------------------------------ efeitos */
  /* Os efeitos guardam coordenada de MUNDO, não de tela.
     Antes a conversão era feita no instante em que o evento chegava, e o efeito
     ficava colado na tela: arrastar o mapa levava a explosão junto. Com poucos
     efeitos ninguém via; com estilhaço e fumaça de verdade, salta.

     `caco` é a primeira partícula do jogo que se MOVE sozinha — tem velocidade
     e gravidade. É o que separa "um círculo que apaga" de "alguma coisa
     explodiu ali". */
  R.efeitoMundo = function (tipo, x, y, extra) {
    var e = extra || {};
    e.tipo = tipo; e.x = x; e.y = y;
    if (e.vida === undefined) e.vida = 0.4;
    e.max = e.vida;
    this.efeitos.push(e);
    return e;
  };

  /* MARCA DE CONTATO. O rádio diz que houve contato; isto diz ONDE. Três
     segundos é o tempo de o jogador tirar os olhos do que estava fazendo e
     achar o ponto — meio segundo, que é a duração dos outros efeitos, não dá. */
  R.marcarContato = function (x, y) {
    this.efeitoMundo('contato', x, y, { vida: 3 });
  };

  /* Estilhaços saindo de um ponto. `forca` é o quanto eles voam. */
  R.lancarCacos = function (x, y, quantos, forca, cor) {
    for (var i = 0; i < quantos; i++) {
      var a = Math.random() * 6.283, v = forca * (0.4 + Math.random() * 0.6);
      this.efeitoMundo('caco', x, y, {
        vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6,
        sobe: 26 + Math.random() * 40, cor: cor,
        vida: 0.4 + Math.random() * 0.45
      });
    }
  };

  R.consumirEventos = function () {
    var ev = this.sim.eventos;
    for (var i = 0; i < ev.length; i++) {
      var e = ev[i];
      if (e.tipo === 'explosao') {
        this.efeitoMundo('explosao', e.x, e.y,
          { raio: e.raio * LARG * 0.5, vida: 0.55, grande: e.grande });
        this.lancarCacos(e.x, e.y, 7, 3.2, '#c9a878');
        this.efeitoMundo('fumaca', e.x, e.y, { vida: 1.2, tam: 10 });
        this.sacudir(Math.min(9, 3 + (e.raio || 1) * 2));
      } else if (e.tipo === 'impacto') {
        this.efeitoMundo('faisca', e.x, e.y, { cor: e.cor, vida: 0.22, alto: 10 });
        if (!e.vazio) this.lancarCacos(e.x, e.y, 3, 1.6, e.cor || '#ffe7b0');
      } else if (e.tipo === 'tiro') {
        /* O clarão da boca do cano estava emitido pela simulação desde sempre e
           era jogado fora pelo desenho. É o efeito mais barato do jogo e o que
           mais diz "este aqui atirou". */
        this.efeitoMundo('clarao', e.x, e.y, { cor: e.cor, vida: 0.09, alto: 12 });
      } else if (e.tipo === 'unidadeMorta') {
        this.efeitoMundo('fumaca', e.x, e.y, { vida: 0.9, tam: 6 });
        /* o jorro da morte: mais e mais forte que o respingo de um tiro */
        this.lancarCacos(e.x, e.y, 9, 2.4,
          e.lado === 'inimigo' ? '#7eba2e' : '#7a1a18');
        this.deitarCadaver(e);
      } else if (e.tipo === 'estruturaDestruida') {
        var cx = e.x + e.w / 2, cy = e.y + e.h / 2;
        this.efeitoMundo('explosao', cx, cy, { raio: 26 * (e.w || 1), vida: 0.7, grande: true });
        this.lancarCacos(cx, cy, 14, 4.2, '#9a9186');
        this.efeitoMundo('fumaca', cx, cy, { vida: 1.8, tam: 16 });
        this.sacudir(11);
      } else if (e.tipo === 'golpe') {
        /* o arco nasce do agressor e aponta para o alvo; a simulação manda os
           dois pontos porque só ela sabe quem bateu em quem */
        this.efeitoMundo('garra', (e.x + e.alvoX) / 2, (e.y + e.alvoY) / 2, {
          ang: Math.atan2((e.alvoX - e.x) + (e.alvoY - e.y),
            (e.alvoX - e.x) - (e.alvoY - e.y)),
          cor: e.cor, vida: 0.18
        });
        /* o respingo sai do ALVO e tem a cor do sangue de quem apanhou, não a
           da garra de quem bateu */
        this.lancarCacos(e.alvoX, e.alvoY, 3, 1.3,
          e.ladoAlvo === 'inimigo' ? '#7eba2e' : '#7a1a18');
      } else if (e.tipo === 'cura') {
        this.efeitoMundo('cura', e.x, e.y, { vida: 0.5 });
      } else if (e.tipo === 'escavando') {
        /* Pó subindo e um caco saltando: diz "está trabalhando AQUI" sem
           precisar de barra de progresso em cima do chão. */
        this.efeitoMundo('fumaca', e.x + 0.5, e.y + 0.5, { vida: 0.55, raio: 0.5 });
        this.lancarCacos(e.x + 0.5, e.y + 0.5, 2, 1.4, '#b9ab93');
      } else if (e.tipo === 'terrenoLimpo') {
        this.terrenoSujo = true;
        /* O minimapa é desenhado uma vez e guardado. O trator é a primeira
           coisa do jogo que muda o terreno, então até agora ninguém precisava
           invalidá-lo — e a ruína limpa continuava lá a partida inteira. */
        this.cvMini = null;
        /* Poeira no lugar: sem ela a célula simplesmente TROCA DE COR de um
           quadro para o outro, e troca de cor sem causa não se lê como
           trabalho feito. */
        this.efeitoMundo('fumaca', e.x + 0.5, e.y + 0.5, { vida: 0.9, raio: 0.9 });
        this.lancarCacos(e.x + 0.5, e.y + 0.5, e.era === 'ruina' ? 10 : 5, 2.2, '#b9ab93');
      } else if (e.tipo === 'entrega') {
        /* O "+8" da carga entregue ia para um array `marcadores` que ninguém
           desenhava e ninguém esvaziava: o número nunca aparecia na tela e a
           lista crescia a partida inteira. Agora sobe no lugar da entrega. */
        var un = this.sim.unidadePorId ? this.sim.unidadePorId(e.id) : null;
        var ex = un ? un.x : (e.x || 0), ey = un ? un.y : (e.y || 0);
        this.efeitoMundo('texto', ex, ey, {
          texto: '+' + e.qtd, vida: 0.9,
          cor: e.recurso === 'petroleo' ? '#e8a33d' : '#ffd479'
        });
      }
    }
    ev.length = 0;
  };

  /* Tremor de câmera. Guarda só a força; quem aplica é `desenhar`, deslocando o
     quadro inteiro. Some sozinho. */
  R.sacudir = function (forca) {
    this.tremorTela = Math.max(this.tremorTela || 0, forca);
  };

  R.desenharEfeitos = function (ctx, dt) {
    var z = this.cam.zoom;
    for (var i = this.efeitos.length - 1; i >= 0; i--) {
      var e = this.efeitos[i];
      e.vida -= dt;
      if (e.vida <= 0) { this.efeitos.splice(i, 1); continue; }
      var t = e.vida / e.max;         /* 1 = acabou de nascer, 0 = sumindo */
      var idade = 1 - t;
      if (e.vx) { e.x += e.vx * dt; e.y += e.vy * dt; }
      var p = this.paraTela(e.x, e.y);

      if (e.tipo === 'explosao') {
        ctx.globalAlpha = t * 0.85;
        var raio = e.raio * z * (1.6 - t);
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, raio);
        grad.addColorStop(0, e.grande ? '#fff6d0' : '#ffd08a');
        grad.addColorStop(0.5, '#ff8a3c');
        grad.addColorStop(1, 'rgba(255,90,40,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, raio, 0, 6.283); ctx.fill();
      } else if (e.tipo === 'faisca') {
        ctx.globalAlpha = t;
        ctx.fillStyle = e.cor || '#ffe7b0';
        ctx.beginPath();
        ctx.arc(p.x, p.y - (e.alto || 10) * z, 4 * z * t + 1, 0, 6.283); ctx.fill();
      } else if (e.tipo === 'clarao') {
        /* estrela curta: um círculo claro e dois riscos cruzados */
        ctx.globalAlpha = t;
        var r = 6.5 * z * t;
        ctx.fillStyle = '#fff4cf';
        ctx.beginPath(); ctx.arc(p.x, p.y - (e.alto || 12) * z, r, 0, 6.283); ctx.fill();
        ctx.strokeStyle = e.cor || '#ffe07a';
        ctx.lineWidth = 1.6 * z;
        ctx.beginPath();
        ctx.moveTo(p.x - r * 2.2, p.y - (e.alto || 12) * z);
        ctx.lineTo(p.x + r * 2.2, p.y - (e.alto || 12) * z);
        ctx.moveTo(p.x, p.y - (e.alto || 12) * z - r * 1.6);
        ctx.lineTo(p.x, p.y - (e.alto || 12) * z + r * 1.6);
        ctx.stroke();
      } else if (e.tipo === 'caco') {
        /* sobe e cai: a altura é uma parábola em cima da posição de mundo */
        var h = (e.sobe * (idade * 2 - idade * idade * 2.6)) * z;
        ctx.globalAlpha = Math.min(1, t * 1.6);
        ctx.fillStyle = e.cor || '#c9a878';
        ctx.fillRect(p.x - 1.4 * z, p.y - 10 * z - h, 2.8 * z, 2.8 * z);
      } else if (e.tipo === 'fumaca') {
        ctx.globalAlpha = t * 0.34;
        ctx.fillStyle = '#9aa2ad';
        ctx.beginPath();
        ctx.arc(p.x, p.y - 10 * z - idade * 26 * z,
          ((e.tam || 5) + idade * 12) * z, 0, 6.283);
        ctx.fill();
      } else if (e.tipo === 'cura') {
        ctx.globalAlpha = t;
        ctx.fillStyle = '#9fffd0';
        ctx.font = (12 * z).toFixed(0) + 'px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('✚', p.x, p.y - 14 * z - idade * 16 * z);
        ctx.textAlign = 'left';
      } else if (e.tipo === 'garra') {
        /* três riscos curvos abrindo: o gesto de garra que todo RTS usa para
           dizer "bateu aqui" sem precisar de quadro desenhado */
        ctx.save();
        ctx.translate(p.x, p.y - 14 * z);
        ctx.rotate(e.ang);
        ctx.globalAlpha = t;
        ctx.strokeStyle = e.cor || '#ffd7a0';
        ctx.lineWidth = 2.4 * z;
        ctx.lineCap = 'round';
        var raio = (7 + 9 * idade) * z;
        for (var k = -1; k <= 1; k++) {
          ctx.beginPath();
          ctx.arc(0, k * 3.4 * z, raio, -0.55, 0.55);
          ctx.stroke();
        }
        ctx.restore();
      } else if (e.tipo === 'contato') {
        /* Dois anéis que abrem e fecham, em vermelho de alarme. Pisca em vez
           de só apagar: coisa que pisca o olho acha na periferia da tela. */
        var pulso = (e.vida * 2) % 1;
        ctx.globalAlpha = t * (0.35 + 0.45 * Math.abs(Math.sin(e.vida * 7)));
        ctx.strokeStyle = '#ff5d46';
        ctx.lineWidth = 2;
        for (var an = 0; an < 2; an++) {
          var rr = (0.35 + pulso * 0.75 + an * 0.3) * LARG * z * 0.5;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, rr, rr * 0.5, 0, 0, 6.283);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (e.tipo === 'texto') {
        ctx.globalAlpha = Math.min(1, t * 1.8);
        ctx.fillStyle = e.cor || '#ffd479';
        ctx.font = '600 ' + (12 * z).toFixed(0) + 'px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(e.texto, p.x, p.y - 16 * z - idade * 20 * z);
        ctx.textAlign = 'left';
      }
      ctx.globalAlpha = 1;
    }
    if (this.efeitos.length > 420) this.efeitos.splice(0, this.efeitos.length - 420);
  };

  /* A caixa de seleção, desenhada por último para ficar por cima de tudo.
     Preenchimento fraco e borda nítida: o preenchimento diz a área, a borda diz
     onde ela termina — só borda some sobre terreno claro, só preenchimento vira
     mancha. */
  R.desenharCaixaSelecao = function (ctx) {
    var c = this.caixaSelecao;
    if (!c || !c.ativa) return;
    var x = Math.min(c.x0, c.x1), y = Math.min(c.y0, c.y1);
    var l = Math.abs(c.x1 - c.x0), a = Math.abs(c.y1 - c.y0);
    ctx.save();
    ctx.fillStyle = 'rgba(140,224,127,0.14)';
    ctx.fillRect(x, y, l, a);
    ctx.strokeStyle = '#8ce07f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 0.5, y + 0.5, l, a);
    ctx.restore();
  };

  /* ÁREA DE LIMPEZA, desenhada em coordenada de MUNDO: a caixa de seleção é
     um retângulo de tela porque seleciona pelo que está na tela; esta marca
     cobre CÉLULAS, então tem de ser losango sobre losango, senão ela mente
     sobre o que vai ser limpo. */
  R.desenharAreaLimpeza = function (ctx) {
    var a = this.areaLimpeza;
    if (!a) return;
    var w = this.sim.world, z = this.cam.zoom;
    ctx.save();
    for (var x = a.x0; x <= a.x1; x++) {
      for (var y = a.y0; y <= a.y1; y++) {
        if (!w.dentro(x, y)) continue;
        var p = this.paraTela(x + 0.5, y + 0.5);
        var pode = w.limpavel(x, y);
        ctx.globalAlpha = pode ? 0.34 : 0.1;
        ctx.fillStyle = pode ? '#d8a13a' : '#7a8090';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - ALT * z / 2);
        ctx.lineTo(p.x + LARG * z / 2, p.y);
        ctx.lineTo(p.x, p.y + ALT * z / 2);
        ctx.lineTo(p.x - LARG * z / 2, p.y);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  };

  /* -------------------------------------------------------------- névoa */
  R.desenharNevoa = function (ctx) {
    var w = this.sim.world, z = this.cam.zoom;
    var cantoA = this.paraMundo(-LARG, -ALT * 4);
    var cantoB = this.paraMundo(this.cv.clientWidth + LARG, this.cv.clientHeight + ALT * 4);
    var cantoC = this.paraMundo(this.cv.clientWidth + LARG, -ALT * 4);
    var cantoD = this.paraMundo(-LARG, this.cv.clientHeight + ALT * 4);
    var x0 = Math.max(0, Math.floor(Math.min(cantoA.x, cantoB.x, cantoC.x, cantoD.x)) - 1);
    var x1 = Math.min(w.w - 1, Math.ceil(Math.max(cantoA.x, cantoB.x, cantoC.x, cantoD.x)) + 1);
    var y0 = Math.max(0, Math.floor(Math.min(cantoA.y, cantoB.y, cantoC.y, cantoD.y)) - 1);
    var y1 = Math.min(w.h - 1, Math.ceil(Math.max(cantoA.y, cantoB.y, cantoC.y, cantoD.y)) + 1);

    var desconhecido = new Path2D(), sombra = new Path2D();
    var achouDesc = false, achouSom = false;
    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) {
        var i = w.idx(x, y);
        if (w.visivel[i]) continue;
        var p = this.paraTela(x, y);
        var caminho = w.explorado[i] ? sombra : desconhecido;
        if (w.explorado[i]) achouSom = true; else achouDesc = true;
        caminho.moveTo(p.x, p.y);
        caminho.lineTo(p.x + LARG / 2 * z, p.y + ALT / 2 * z);
        caminho.lineTo(p.x, p.y + ALT * z);
        caminho.lineTo(p.x - LARG / 2 * z, p.y + ALT / 2 * z);
        caminho.closePath();
      }
    }
    if (achouSom) { ctx.fillStyle = 'rgba(4,7,12,0.46)'; ctx.fill(sombra); }
    if (achouDesc) { ctx.fillStyle = 'rgba(4,6,10,0.97)'; ctx.fill(desconhecido); }
  };

  /* Áreas marcadas: bombardeio a caminho, escudo e zonas de invasão. */
  R.desenharAreasDePerigo = function (ctx) {
    var z = this.cam.zoom, i;
    for (i = 0; i < this.sim.bombardeios.length; i++) {
      var b = this.sim.bombardeios[i];
      var p = this.paraTela(b.x, b.y);
      var t = U.clamp(1 - b.em / 1.8, 0, 1);
      ctx.save();
      ctx.translate(p.x, p.y); ctx.scale(1, ALT / LARG);
      ctx.strokeStyle = 'rgba(255,120,60,0.9)'; ctx.lineWidth = 2.4 * z;
      ctx.beginPath(); ctx.arc(0, 0, b.raio * LARG * 0.5 * z, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(255,120,60,' + (0.1 + 0.18 * t) + ')';
      ctx.beginPath(); ctx.arc(0, 0, b.raio * LARG * 0.5 * z * t, 0, 6.283); ctx.fill();
      ctx.restore();
    }
    if (this.sim.escudo) {
      var e = this.sim.escudo, pe = this.paraTela(e.x, e.y);
      ctx.save();
      ctx.translate(pe.x, pe.y); ctx.scale(1, ALT / LARG);
      ctx.strokeStyle = 'rgba(130,200,255,0.75)'; ctx.lineWidth = 2.6 * z;
      ctx.beginPath(); ctx.arc(0, 0, e.raio * LARG * 0.5 * z, 0, 6.283); ctx.stroke();
      ctx.fillStyle = 'rgba(130,200,255,0.1)'; ctx.fill();
      ctx.restore();
    }
    if (this.sim.onda.estado === 'preparo' || this.sim.fase === 'colocacao') {
      for (i = 0; i < this.sim.world.entradas.length; i++) {
        var en = this.sim.world.entradas[i];
        var pi = this.paraTela(en.x, en.y);
        ctx.save();
        ctx.globalAlpha = 0.35 + 0.2 * Math.sin(this.quadro / 20 + i);
        ctx.strokeStyle = '#ff5d7a'; ctx.lineWidth = 2 * z;
        ctx.beginPath();
        ctx.moveTo(pi.x, pi.y); ctx.lineTo(pi.x + LARG / 2 * z, pi.y + ALT / 2 * z);
        ctx.lineTo(pi.x, pi.y + ALT * z); ctx.lineTo(pi.x - LARG / 2 * z, pi.y + ALT / 2 * z);
        ctx.closePath(); ctx.stroke();
        ctx.restore();
        this.icone(ctx, pi.x, pi.y - 6 * z, '#ff8fa3', '▼');
      }
    }
  };

  /* A planta agendada tem de ficar VISÍVEL enquanto espera o trator. Sem ela na
     tela, o jogador manda a obra, vê a ruína continuar de pé e conclui que o
     comando não pegou — e encomenda de novo, que no nosso caso CANCELA. O
     contorno âmbar tracejado é a promessa escrita no chão. */
  R.desenharObrasAgendadas = function (ctx) {
    var lista = this.sim.obrasPendentes;
    if (!lista || !lista.length) return;
    var z = this.cam.zoom;
    for (var i = 0; i < lista.length; i++) {
      var o = lista[i], def = D.ESTRUTURAS[o.tipo];
      if (!def) continue;
      for (var dy = 0; dy < def.h; dy++) {
        for (var dx = 0; dx < def.w; dx++) {
          this.marcarCelula(ctx, o.x + dx, o.y + dy, 'rgba(216,161,58,0.22)');
        }
      }
      var p0 = this.paraTela(o.x, o.y);
      var pD = this.paraTela(o.x + def.w, o.y);
      var pB = this.paraTela(o.x + def.w, o.y + def.h);
      var pE = this.paraTela(o.x, o.y + def.h);
      ctx.save();
      ctx.strokeStyle = 'rgba(232,180,80,0.9)';
      ctx.lineWidth = 1.6 * z;
      ctx.setLineDash([7 * z, 5 * z]);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y); ctx.lineTo(pD.x, pD.y);
      ctx.lineTo(pB.x, pB.y); ctx.lineTo(pE.x, pE.y);
      ctx.closePath(); ctx.stroke();
      ctx.restore();
      var centro = this.paraTela(o.x + def.w / 2, o.y + def.h / 2);
      this.icone(ctx, centro.x, centro.y, '#e8b450', '⌛');
    }
  };

  /* ------------------------------------------------- prévia de construção */
  R.desenharPrevia = function (ctx) {
    var z = this.cam.zoom, i;
    if (this.tracado) {
      for (i = 0; i < this.tracado.plano.celulas.length; i++) {
        var c = this.tracado.plano.celulas[i];
        this.marcarCelula(ctx, c.x, c.y, c.ok ? 'rgba(120,230,140,0.45)' : 'rgba(255,90,90,0.4)');
      }
      return;
    }
    if (!this.previa) return;
    var pv = this.previa, def = D.ESTRUTURAS[pv.tipo];
    var ok = pv.valido;
    /* Três estados, não dois: vai (verde), não vai (vermelho) e VAI DEPOIS
       (âmbar) — a planta sobre ruína, que o trator abre antes da obra. Pintar
       a espera de vermelho dizia ao jogador que ali não dá, que é o contrário
       do que acontece. */
    var espera = !ok && pv.aguarda;
    var marca = ok ? 'rgba(120,230,140,0.4)' : (espera ? 'rgba(216,161,58,0.42)' : 'rgba(255,90,90,0.38)');
    for (var dy = 0; dy < def.h; dy++) {
      for (var dx = 0; dx < def.w; dx++) {
        this.marcarCelula(ctx, pv.x + dx, pv.y + dy, marca);
      }
    }
    var v = VISUAL[pv.tipo] || VISUAL.muro;
    ctx.globalAlpha = 0.5;
    var faces = ok
      ? { topo: sombrear(v.cor, 1.2), esq: sombrear(v.cor, 0.6), dir: sombrear(v.cor, 0.85) }
      : (espera
        ? { topo: '#d8a13a', esq: '#7a5a1e', dir: '#a3782b' }
        : { topo: '#a64c4c', esq: '#6e3030', dir: '#8a3c3c' });
    this.caixa(ctx, pv.x + 0.06, pv.y + 0.06, def.w - 0.12, def.h - 0.12, v.alt, faces);
    ctx.globalAlpha = 1;
    /* alcance da torre em prévia */
    if (def.arma) {
      var centro = this.paraTela(pv.x + def.w / 2, pv.y + def.h / 2);
      ctx.save();
      ctx.translate(centro.x, centro.y); ctx.scale(1, ALT / LARG);
      ctx.strokeStyle = 'rgba(160,220,255,0.55)'; ctx.lineWidth = 1.6 * z;
      ctx.setLineDash([6 * z, 5 * z]);
      ctx.beginPath(); ctx.arc(0, 0, def.arma.alc * LARG * 0.5 * z, 0, 6.283); ctx.stroke();
      ctx.restore();
    }
  };

  R.marcarCelula = function (ctx, x, y, cor) {
    var z = this.cam.zoom, p = this.paraTela(x, y);
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + LARG / 2 * z, p.y + ALT / 2 * z);
    ctx.lineTo(p.x, p.y + ALT * z);
    ctx.lineTo(p.x - LARG / 2 * z, p.y + ALT / 2 * z);
    ctx.closePath(); ctx.fill();
  };

  R.desenharSelecao = function (ctx) {
    var z = this.cam.zoom;
    for (var i = 0; i < this.selecao.length; i++) {
      var e = this.sim.alvoPorId(this.selecao[i]);
      if (!e || e.morta) continue;
      ctx.strokeStyle = '#8ce07f'; ctx.lineWidth = 2 * z;
      if (e.w) {
        var n = this.paraTela(e.x, e.y), l = this.paraTela(e.x + e.w, e.y);
        var s = this.paraTela(e.x + e.w, e.y + e.h), o = this.paraTela(e.x, e.y + e.h);
        ctx.beginPath();
        ctx.moveTo(n.x, n.y); ctx.lineTo(l.x, l.y); ctx.lineTo(s.x, s.y); ctx.lineTo(o.x, o.y);
        ctx.closePath(); ctx.stroke();
        if (e.rally) {
          var pr = this.paraTela(e.rally.x + 0.5, e.rally.y + 0.5);
          ctx.setLineDash([5 * z, 4 * z]);
          ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(pr.x, pr.y); ctx.stroke();
          ctx.setLineDash([]);
          this.icone(ctx, pr.x, pr.y, '#8ce07f', '⚑');
        }
      } else {
        var p = this.paraTela(e.x, e.y);
        ctx.save();
        ctx.translate(p.x, p.y); ctx.scale(1, ALT / LARG);
        ctx.beginPath(); ctx.arc(0, 0, 15 * z, 0, 6.283); ctx.stroke();
        ctx.restore();
      }
    }
  };

  /* ------------------------------------------------------------ minimapa */
  R.desenharMinimapa = function (mini) {
    var w = this.sim.world, ctx = mini.getContext('2d');
    var lado = mini.width;
    var esc = lado / Math.max(w.w, w.h);
    if (!this.cvMini) {
      var off = global.document.createElement('canvas');
      off.width = w.w; off.height = w.h;
      var c = off.getContext('2d');
      var img = c.createImageData(w.w, w.h);
      var pal = this.pal;
      function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
      var cores = { 0: rgb(pal.chao), 1: rgb(pal.rocha), 2: rgb(pal.agua), 3: rgb(pal.entulho), 4: rgb(pal.ruina) };
      for (var i = 0; i < w.n; i++) {
        var cor = cores[w.terreno[i]] || cores[0];
        img.data[i * 4] = cor[0]; img.data[i * 4 + 1] = cor[1]; img.data[i * 4 + 2] = cor[2]; img.data[i * 4 + 3] = 255;
      }
      c.putImageData(img, 0, 0);
      this.cvMini = off;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, lado, lado);
    ctx.drawImage(this.cvMini, 0, 0, lado, lado);

    /* névoa */
    ctx.fillStyle = 'rgba(3,5,9,0.86)';
    for (var y = 0; y < w.h; y++) {
      for (var x = 0; x < w.w; x++) {
        if (!w.explorado[w.idx(x, y)]) ctx.fillRect(x * esc, y * esc, esc + 0.6, esc + 0.6);
      }
    }
    var i2;
    for (i2 = 0; i2 < w.jazidas.length; i2++) {
      var j = w.jazidas[i2];
      if (!w.explorado[w.idx(j.x, j.y)] || j.estoque <= 0) continue;
      ctx.fillStyle = j.tipo === 'petroleo' ? '#e8a33d' : '#d8b26a';
      ctx.fillRect(j.x * esc, j.y * esc, esc * 2, esc * 2);
    }
    for (i2 = 0; i2 < this.sim.listaEstruturas.length; i2++) {
      var b = this.sim.listaEstruturas[i2];
      if (b.morta) continue;
      ctx.fillStyle = b === this.sim.central ? '#7fb6e8' : (b.torre ? '#8ce07f' : '#c8d2de');
      ctx.fillRect(b.x * esc, b.y * esc, Math.max(2, b.w * esc), Math.max(2, b.h * esc));
    }
    for (i2 = 0; i2 < this.sim.unidades.length; i2++) {
      var u = this.sim.unidades[i2];
      if (u.morta) continue;
      if (u.lado === 'inimigo' && !w.veCelula(Math.floor(u.x), Math.floor(u.y))) continue;
      ctx.fillStyle = u.lado === 'inimigo' ? '#ff5d5d' : (u.operario ? '#ffd479' : '#9fe0ff');
      ctx.fillRect(u.x * esc - 1, u.y * esc - 1, 2.6, 2.6);
    }
    /* PING DO ALERTA: anel piscando onde alguma coisa nossa está apanhando.
       O minimapa já desenha o inimigo em vermelho, mas um ponto a mais entre
       trinta não chama ninguém — o que chama é piscar. */
    var ping = this.pingMini;
    if (ping && this.sim.t < ping.ate) {
      var pulso = (ping.ate - this.sim.t) % 1;
      ctx.strokeStyle = '#ff5d46';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(this.sim.t * 7));
      ctx.beginPath();
      ctx.arc(ping.x * esc, ping.y * esc, (2 + pulso * 7) * (lado / 150), 0, 6.283);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (ping) { this.pingMini = null; }

    /* retângulo da câmera */
    var a = this.paraMundo(0, 0), bb = this.paraMundo(this.cv.clientWidth, this.cv.clientHeight);
    var cc = this.paraMundo(this.cv.clientWidth, 0), dd = this.paraMundo(0, this.cv.clientHeight);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(a.x * esc, a.y * esc); ctx.lineTo(cc.x * esc, cc.y * esc);
    ctx.lineTo(bb.x * esc, bb.y * esc); ctx.lineTo(dd.x * esc, dd.y * esc);
    ctx.closePath(); ctx.stroke();
  };

  UF.VISUAL_ESTRUTURA = VISUAL;
})(typeof window !== 'undefined' ? window : globalThis);
