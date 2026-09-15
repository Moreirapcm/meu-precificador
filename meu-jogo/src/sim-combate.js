/* Última Fronteira — combate, invasores, ondas, habilidades e ciclo principal. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var ESTR = D.ESTRUTURAS, INV = D.INVASORES, R = D.REGRAS;
  var S = UF.Sim.prototype;

  /* -------------------------------------------------------------- começar */
  S.iniciar = function (x, y) {
    var ver = this.podeColocarSemExploracao('central', x, y);
    if (!ver.ok) return ver;
    var b = this.criarEstrutura('central', x, y, true);
    this.world.revelar(x + 2, y + 2, 13);
    var quantos = this.setor.operarios || R.operarios;
    /* Os operários iniciais nascem na FRENTE da Central. A varredura começava
       em dy = -1, que na projeção isométrica é o fundo: os quatro apareciam
       atrás do prédio, escondidos por ele. Ordenar por (dx + dy) decrescente
       põe primeiro quem está mais à frente na tela. */
    var quantos2 = quantos, candidatas = [];
    for (var r = 1; r < 9 && candidatas.length < quantos2 * 3; r++) {
      for (var dy = -r; dy <= b.h + r; dy++) {
        for (var dx = -r; dx <= b.w + r; dx++) {
          var borda = dx < 0 || dy < 0 || dx >= b.w || dy >= b.h;
          if (!borda) continue;
          var cx = x + dx, cy = y + dy;
          if (this.world.livre(cx, cy)) candidatas.push({ x: cx, y: cy, frente: dx + dy });
        }
      }
    }
    candidatas.sort(function (m, n) { return n.frente - m.frente; });
    var postos = candidatas.slice(0, quantos);
    for (var i = 0; i < postos.length; i++) {
      var u = this.criarUnidade('operario', postos[i].x + 0.5, postos[i].y + 0.5, 'aliado');
      var jaz = this.jazidaLivreMaisProxima(u.x, u.y);
      if (jaz) this.darTarefa(u, { tipo: 'minerar', jazida: jaz.id });
    }
    this.fase = 'jogando';
    this.atualizarVisao();
    this.aviso('Central instalada. Primeiro ataque em ' + Math.round(this.onda.tempo) + ' segundos.', 'info');
    return { ok: true };
  };

  /* Antes de instalar a Central nada está explorado: a checagem de névoa não vale. */
  S.podeColocarSemExploracao = function (tipo, x, y) {
    var w = this.world, salvo = w.explorado;
    w.explorado = { };
    var proxy = new Proxy({}, { get: function () { return 1; } });
    w.explorado = proxy;
    var ver = this.podeColocar(tipo, x, y);
    w.explorado = salvo;
    return ver;
  };

  /* --------------------------------------------------------------- visão */
  S.atualizarVisao = function () {
    var w = this.world, i;
    w.limparVisao();
    for (i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (b.morta) continue;
      w.revelar(b.x + b.w / 2, b.y + b.h / 2, (b.def.visao || 5) * (b.construida ? 1 : 0.6));
    }
    for (i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (u.lado !== 'aliado' || u.morta) continue;
      w.revelar(u.x, u.y, u.def.visao || 6);
    }
  };

  /* -------------------------------------------------------------- combate */
  S.podeAtingir = function (arma, alvo) {
    if (!arma) return false;
    var voa = alvo.voa || (alvo.def && alvo.def.voa);
    return voa ? !!arma.ar : arma.solo !== false;
  };

  S.centroDe = function (e) {
    if (e.w) return { x: e.x + e.w / 2, y: e.y + e.h / 2 };
    return { x: e.x, y: e.y };
  };

  S.distanciaEntre = function (a, b) {
    if (b.w) return U.distToRect(a.x, a.y, b.x, b.y, b.w, b.h);
    if (a.w) return U.distToRect(b.x, b.y, a.x, a.y, a.w, a.h);
    return U.dist(a.x, a.y, b.x, b.y);
  };

  /* Melhor alvo ao alcance. Estruturas só entram se 'incluirEstruturas'. */
  S.procurarAlvo = function (atirador, arma, alcance, ladoAlvo, incluirEstruturas, preferido) {
    var melhor = null, melhorD = Infinity, i;
    if (preferido) {
      var p = this.alvoPorId(preferido);
      if (p && !p.morta && this.podeAtingir(arma, p) && this.distanciaEntre(atirador, p) <= alcance) return p;
    }
    for (i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (u.morta || u.lado !== ladoAlvo) continue;
      if (!this.podeAtingir(arma, u)) continue;
      var d = this.distanciaEntre(atirador, u);
      if (d > alcance || d < (arma.alcMin || 0)) continue;
      if (d < melhorD) { melhorD = d; melhor = u; }
    }
    if (incluirEstruturas && arma.solo !== false) {
      for (i = 0; i < this.listaEstruturas.length; i++) {
        var b = this.listaEstruturas[i];
        if (b.morta || ladoAlvo !== 'aliado') continue;
        var db = this.distanciaEntre(atirador, b);
        if (db > alcance || db < (arma.alcMin || 0)) continue;
        /* Prefere unidades: só ataca estrutura se nada vivo estiver mais perto. */
        if (db + 1.5 < melhorD) { melhorD = db + 1.5; melhor = b; }
      }
    }
    return melhor;
  };


  /* ============================== GUARNIÇÃO =============================
     Item 8 do capítulo 11. Dois clássicos, duas metades: o Age of Empires II
     põe até 5 numa torre e deixa a guarnição atirar junto (5 flechas vazia,
     21 cheia); o StarCraft põe 4 no Bunker, que sozinho não atira nada e dá
     +1 de alcance a quem está dentro. Ficamos com a torre atirando por conta
     própria E a guarnição atirando junto com a arma que trouxe.

     Quem entra SAI de `sim.unidades`. Foi a decisão que barateou tudo: há 48
     laços de unidade espalhados pela simulação, e marcar uma bandeira exigiria
     lembrar dela em todos — a que fosse esquecida faria o invasor atirar em
     alguém que está dentro da torre. Fora da lista, nenhum laço a vê. Em troca,
     `recalcularPop` e o salvamento precisam olhar `sim.guarnecidas`, que são
     dois lugares e estão escritos.

     A posição da unidade vira o centro da estrutura no momento em que ela
     entra. Não é enfeite: é o que faz `atirar` funcionar sem nenhuma mudança —
     o tiro sai da torre, com a arma, a cadência e o lado de quem está dentro. */
  S.capacidadeGuarnicao = function (b) {
    return (b && b.construida && !b.morta && b.def.guarnicao) || 0;
  };

  S.vagasNaGuarnicao = function (b) {
    return this.capacidadeGuarnicao(b) - ((b && b.dentro) ? b.dentro.length : 0);
  };

  S.podeGuarnecer = function (u, b) {
    if (!u || u.morta || u.lado !== 'aliado' || u.voa) return false;
    return this.vagasNaGuarnicao(b) > 0;
  };

  S.guarnecer = function (u, b) {
    if (!this.podeGuarnecer(u, b)) return false;
    var i = this.unidades.indexOf(u);
    if (i < 0) return false;
    this.unidades.splice(i, 1);
    this.guarnecidas[u.id] = u;
    u.dentro = b.id;
    u.rota = null;
    u.alvo = 0;
    u.bloqueado = false;
    u.tarefa = { tipo: 'guarnecido' };
    u.x = b.x + b.w / 2;
    u.y = b.y + b.h / 2;
    if (!b.dentro) b.dentro = [];
    b.dentro.push(u.id);
    this.emitir('guarneceu', { id: b.id, x: u.x, y: u.y, tipo: u.tipo });
    return true;
  };

  /* Célula de saída, em anéis a partir da borda do prédio. `usadas` impede que
     a segunda unidade a sair caia exatamente em cima da primeira: a grade não
     marca unidade, então `livre()` diz que sim para todas elas e as quatro
     saíam empilhadas no mesmo ponto. A separação empurraria depois, mas o que
     o jogador vê no instante do desembarque é um só boneco. */
  S.saidaDaGuarnicao = function (b, usadas) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    for (var r = 1; r <= 8; r++) {
      var melhor = null, melhorD = Infinity;
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          var x = Math.floor(cx) + dx, y = Math.floor(cy) + dy;
          if (!this.world.livre(x, y)) continue;
          if (usadas && usadas[x + ',' + y]) continue;
          var d = U.dist(x + 0.5, y + 0.5, cx, cy);
          if (d < melhorD) { melhorD = d; melhor = { x: x, y: y }; }
        }
      }
      if (melhor) {
        if (usadas) usadas[melhor.x + ',' + melhor.y] = 1;
        return melhor;
      }
    }
    return null;
  };

  /* Tira UMA unidade e a devolve ao mundo na célula livre mais próxima. */
  S.liberarDaGuarnicao = function (b, id, usadas) {
    var u = this.guarnecidas[id];
    if (!u) return null;
    delete this.guarnecidas[id];
    var k = b.dentro ? b.dentro.indexOf(id) : -1;
    if (k >= 0) b.dentro.splice(k, 1);
    u.dentro = 0;
    var cel = this.saidaDaGuarnicao(b, usadas);
    /* Sem célula livre em oito de raio — prédio no meio de um cerco fechado —
       a unidade sai em cima do próprio prédio: preso é melhor que sumido, e a
       separação de unidades empurra assim que abrir. */
    u.x = cel ? cel.x + 0.5 : b.x + b.w / 2;
    u.y = cel ? cel.y + 0.5 : b.y + b.h / 2;
    u.rota = null;
    u.tarefa = u.operario ? { tipo: 'ocioso' }
      : { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 7 };
    this.unidades.push(u);
    this.emitir('desocupou', { id: b.id, x: u.x, y: u.y, tipo: u.tipo });
    return u;
  };

  S.desocupar = function (b) {
    if (!b || !b.dentro || !b.dentro.length) return 0;
    var n = b.dentro.length, usadas = {};
    /* De trás para frente: `liberarDaGuarnicao` mexe na mesma lista. */
    for (var i = b.dentro.length - 1; i >= 0; i--) this.liberarDaGuarnicao(b, b.dentro[i], usadas);
    this.recalcularPop();
    return n;
  };

  /* Uma vez por quadro, por estrutura ocupada. Cura lenta sempre; tiro só de
     torre ligada e com alvo — a Central abriga, não atira. */
  S.atualizarGuarnicao = function (b, dt) {
    if (!b.dentro || !b.dentro.length) return;
    var alvo = null;
    if (b.torre && !b.semEnergia && !b.desligada && b.alvo) {
      alvo = this.alvoPorId(b.alvo);
      if (alvo && alvo.morta) alvo = null;
    }
    for (var i = 0; i < b.dentro.length; i++) {
      var u = this.guarnecidas[b.dentro[i]];
      if (!u || u.morta) continue;
      /* O ferido se recupera dentro do prédio, como no Age of Empires. É a
         metade do item que o Pedro pediu: lugar seguro para o ferido. */
      if (u.hp < u.hpMax) u.hp = Math.min(u.hpMax, u.hp + u.hpMax * 0.025 * dt);
      var arma = u.def.arma;
      if (!alvo || !arma) continue;
      if (!this.podeAtingir(arma, alvo)) continue;
      /* +1 de alcance pela altura, que é o bônus do Bunker do StarCraft. */
      var d = this.distanciaEntre(u, alvo);
      if (d > arma.alc + 1 || d < (arma.alcMin || 0)) continue;
      this.atirar(u, alvo, arma, dt);
    }
  };

  /* Andar até a estrutura e entrar. Vale para operário e para soldado, e por
     isso mora aqui e não num dos dois laços: devolve verdadeiro quando consumiu
     o quadro. */
  S.tentarGuarnecer = function (u, dt) {
    var tarefa = u.tarefa;
    if (!tarefa || tarefa.tipo !== 'guarnecer') return false;
    var b = this.estruturas[tarefa.alvo];
    if (!b || b.morta || !b.construida) { u.tarefa = { tipo: 'ocioso' }; return true; }
    if (this.vagasNaGuarnicao(b) <= 0) {
      this.aviso(b.def.nome + ' está lotado.', 'atencao');
      u.tarefa = { tipo: 'ocioso' };
      return true;
    }
    /* Encostar no PRÉDIO, não numa célula: a estrutura ocupa a grade e o
       destino tem de ser a borda dela. `distToRect` é a mesma medida que o
       reparo e a construção usam. */
    if (U.distToRect(u.x, u.y, b.x, b.y, b.w, b.h) <= 1.2) {
      this.guarnecer(u, b);
      this.recalcularPop();
      return true;
    }
    var cel = this.nav.celulaLivreProxima(b.x + b.w / 2, b.y + b.h / 2, 8);
    if (!cel) { u.tarefa = { tipo: 'ocioso' }; return true; }
    if ((!u.rota || !u.rota.length) && !this.pedirRota(u, cel, { raioChegada: 0 })) {
      if (u.bloqueado) u.tarefa = { tipo: 'ocioso' };
      return true;
    }
    this.andar(u, dt);
    return true;
  };

  S.atirar = function (origem, alvo, arma, dt) {
    origem.recarga -= dt;
    if (origem.recarga > 0) return;
    origem.recarga = arma.cad;
    var centroO = this.centroDe(origem), centroA = this.centroDe(alvo);
    var dano = arma.dano;
    if (origem.lado !== 'inimigo' && this.jogador.pesquisas.precisao) dano *= 1.18;
    var area = arma.area || 0;
    if (area && origem.lado !== 'inimigo' && this.jogador.pesquisas.artilhariaAv) area *= 1.35;

    /* CORPO A CORPO não tem projétil. O Corredor morde, e mordida não é uma
       bolinha que atravessa uma célula de distância — mas era exatamente isso
       que aparecia na tela, porque todo ataque do jogo passava por aqui e este
       trecho sempre criou projétil. A garra do bicho virava um ponto voador.
       Abaixo de 1,6 célula o dano é aplicado na hora e o que sai é um evento de
       GOLPE, que o desenho traduz em arco de garra. A diferença de regra é o
       tempo de voo que deixa de existir: um décimo de segundo numa cadência de
       seis décimos. Medido com `equilibrio.cjs` antes e depois. */
    if ((arma.alc || 0) <= 1.6 && !area) {
      this.aplicarDano(alvo, dano, {
        perfura: !!arma.perfura,
        metadeBlindagem: origem.lado !== 'inimigo' && !!this.jogador.pesquisas.penetracao,
        lentidao: arma.lentidao || 0,
        acido: !!(origem.def && origem.def.acido),
        origemId: origem.id, lado: origem.lado
      });
      this.emitir('golpe', {
        x: centroO.x, y: centroO.y, alvoX: centroA.x, alvoY: centroA.y,
        cor: (origem.def && origem.def.cor) || arma.cor, id: origem.id,
        /* de que LADO é quem apanhou: o respingo tem a cor do sangue de quem
           levou o golpe, não a da garra de quem bateu */
        ladoAlvo: alvo.lado
      });
      if (origem.def && origem.def.suicida) this.aplicarDano(origem, origem.hp + 1, { silencioso: true });
      return;
    }

    this.projeteis.push({
      x: centroO.x, y: centroO.y - 0.35,
      /* de onde o tiro VEIO, e onde ele estava no quadro anterior. A primeira
         serve ao clarão da boca do cano; a segunda ao traçante, que é um
         segmento entre as duas posições. Sem guardar isso, o desenho só tem um
         ponto solto e o tiro não tem direção nem velocidade aparente. */
      saiuX: centroO.x, saiuY: centroO.y - 0.35,
      antX: centroO.x, antY: centroO.y - 0.35,
      alvoId: alvo.id, lado: origem.lado,
      ultimoX: centroA.x, ultimoY: centroA.y,
      dano: dano, vel: arma.vel || 14, area: area,
      /* `perfura` é propriedade da ARMA (o Lanceiro atravessa blindagem por
         desenho), e `metadeBlindagem` é o efeito da pesquisa. Marcar os dois
         juntos anulava a pesquisa e a tornava melhor do que ela promete: em
         `aplicarDano`, `perfura` pula a subtração INTEIRA, então o `blind *= 0.5`
         logo acima nunca chegava a valer. A Munição perfurante ignorava a
         blindagem toda — 8 no Titã, 10 na Matriarca — enquanto a descrição diz
         metade. O `Math.random() < 1` que estava na linha era resto de uma
         chance que nunca chegou a existir: sempre verdadeiro. */
      perfura: !!arma.perfura,
      metadeBlindagem: origem.lado !== 'inimigo' && !!this.jogador.pesquisas.penetracao,
      lentidao: arma.lentidao || 0, acido: !!(origem.def && origem.def.acido),
      cor: arma.cor || '#ffd7a0', origemId: origem.id
    });
    this.emitir('tiro', { x: centroO.x, y: centroO.y, alvo: alvo.id, cor: arma.cor });
    if (origem.def && origem.def.suicida) this.aplicarDano(origem, origem.hp + 1, { silencioso: true });
  };

  S.atualizarProjeteis = function (dt) {
    for (var i = this.projeteis.length - 1; i >= 0; i--) {
      var p = this.projeteis[i];
      var alvo = this.alvoPorId(p.alvoId);
      var ax, ay;
      if (alvo && !alvo.morta) {
        var c = this.centroDe(alvo);
        ax = c.x; ay = c.y;
        p.ultimoX = ax; p.ultimoY = ay;
      } else {
        ax = p.ultimoX; ay = p.ultimoY;
      }
      var dx = ax - p.x, dy = ay - p.y, d = Math.hypot(dx, dy);
      var passo = p.vel * dt;
      p.antX = p.x; p.antY = p.y;
      if (d > passo) {
        p.x += dx / d * passo; p.y += dy / d * passo;
        continue;
      }
      p.x = ax; p.y = ay;
      this.projeteis.splice(i, 1);
      if (p.area) {
        this.danoEmArea(ax, ay, p.area, p.dano, p.lado, p);
        this.emitir('explosao', { x: ax, y: ay, raio: p.area });
      } else if (alvo && !alvo.morta) {
        this.aplicarDano(alvo, p.dano, p);
        this.emitir('impacto', { x: ax, y: ay, cor: p.cor });
      } else {
        /* o alvo morreu no caminho: o tiro ainda assim bate no chão. Sem isto
           o projétil sumia no ar, sem faísca, e parecia um bug de desenho. */
        this.emitir('impacto', { x: ax, y: ay, cor: p.cor, vazio: true });
      }
    }
  };

  S.danoEmArea = function (x, y, raio, dano, ladoOrigem, opts) {
    var alvoLado = ladoOrigem === 'inimigo' ? 'aliado' : 'inimigo', i;
    /* O LADO tem de viajar junto: sem ele a explosão do Detonador dana a base e
       o alerta não dispara, porque `aplicarDano` não saberia que veio do
       inimigo. Era o caso mais barulhento do jogo passando calado. */
    opts = opts || {};
    if (opts.lado === undefined) opts.lado = ladoOrigem;
    for (i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (u.morta || u.lado !== alvoLado) continue;
      var d = U.dist(u.x, u.y, x, y);
      if (d > raio) continue;
      this.aplicarDano(u, dano * (1 - 0.45 * (d / raio)), opts);
    }
    if (alvoLado === 'aliado') {
      for (i = 0; i < this.listaEstruturas.length; i++) {
        var b = this.listaEstruturas[i];
        if (b.morta) continue;
        var db = U.distToRect(x, y, b.x, b.y, b.w, b.h);
        if (db > raio) continue;
        this.aplicarDano(b, dano * (1 - 0.45 * (db / raio)), opts);
      }
    }
  };

  /* ALERTA DE ATAQUE.
     O buraco mais barato que a pesquisa do capítulo 12 encontrou: o jogo não
     tinha NENHUM aviso de que algo seu está sendo mordido agora. Havia aviso de
     onda — o que vem —, nunca do que está acontecendo. E o Corredor existe
     exatamente para isso: `mira: 'economia'`, ele vai atrás do operário do
     outro lado do setor, e o jogador que está olhando a fila de produção não
     fica sabendo.

     Dois timbres, como no Age of Empires II: TROMPA quando é tropa, SINO
     quando é operário ou estrutura. Não é enfeite — o timbre diz o que fazer
     sem obrigar a olhar, e são reações diferentes: tropa apanhando pede
     reforço, operário apanhando pede fuga.

     Agrupado por ÁREA e com descanso por tempo, também como lá: um combate de
     dez segundos na muralha não pode virar dez avisos. Doze segundos por
     timbre, e dentro de seis células conta como o mesmo lugar. */
  var DESCANSO_ALERTA = 12;
  var MESMO_LUGAR = 6;

  S.alertarAtaque = function (alvo) {
    var civil = !!alvo.w || !!alvo.operario;
    var canal = civil ? 'civil' : 'tropa';
    if (!this.ultimoAlerta) this.ultimoAlerta = {};
    var ant = this.ultimoAlerta[canal];
    var c = this.centroDe(alvo);
    if (ant && this.t - ant.t < DESCANSO_ALERTA &&
        U.dist(ant.x, ant.y, c.x, c.y) < MESMO_LUGAR) return;
    if (ant && this.t - ant.t < 3) return;      /* nem dois lugares ao mesmo tempo */
    this.ultimoAlerta[canal] = { t: this.t, x: c.x, y: c.y };
    this.emitir(civil ? 'sobAtaqueCivil' : 'sobAtaque', {
      x: c.x, y: c.y, civil: civil,
      alvoNome: (alvo.def && alvo.def.nome) || 'unidade'
    });
  };

  S.aplicarDano = function (alvo, dano, opts) {
    if (!alvo || alvo.morta) return 0;
    opts = opts || {};
    var blind = (alvo.def && alvo.def.blind) || 0;
    /* Duas linhas separadas, como no Age of Empires: armadura de infantaria e
       Masonry são pesquisas diferentes e nunca se somam. Tropa nossa lê as
       placas; prédio nosso lê a alvenaria. `alvo.w` é o que distingue os dois
       — só estrutura tem largura. */
    if (alvo.lado !== 'inimigo') {
      if (alvo.w) {
        if (this.jogador.pesquisas.alvenaria) blind += 1;
      } else {
        if (this.jogador.pesquisas.blindagem1) blind += 1;
        if (this.jogador.pesquisas.blindagem2) blind += 1;
      }
    }
    if (opts.metadeBlindagem) blind *= 0.5;
    if (!opts.perfura) dano = Math.max(dano * 0.12, dano - blind);
    if (opts.acido && this.jogador.pesquisas.antiacido) dano *= 0.5;
    var ehAliado = alvo.lado !== 'inimigo';
    if (ehAliado && this.escudo && this.t < this.escudo.ate) {
      var c = this.centroDe(alvo);
      if (U.dist(c.x, c.y, this.escudo.x, this.escudo.y) <= this.escudo.raio) dano *= 0.3;
    }
    alvo.hp -= dano;
    alvo.ultimoDano = this.t;
    if (ehAliado && opts.lado === 'inimigo') this.alertarAtaque(alvo);
    if (alvo.hp > 0) return dano;
    this.matar(alvo, opts);
    return dano;
  };

  S.matar = function (alvo, opts) {
    if (alvo.morta) return;
    alvo.morta = true;
    alvo.hp = 0;
    if (alvo.w) {
      this.ocupar(alvo, 0);                      /* a brecha fica transitável na hora */
      /* Quem estava dentro SAI, ferido mas vivo — é o Bunker do StarCraft, e
         não a torre do Age, onde a guarnição morre junto. Num jogo de defesa
         em que a torre cai toda hora, matar a guarnição junto transformaria
         guarnecer numa armadilha e ninguém usaria o comando duas vezes. */
      this.desocupar(alvo);
      if (alvo.jazida) {
        var jaz = this.world.jazidaPorId(alvo.jazida);
        if (jaz) jaz.extrator = 0;
      }
      for (var i = 0; i < this.unidades.length; i++) {
        var u = this.unidades[i];
        if (u.tarefa && (u.tarefa.alvo === alvo.id)) this.liberarObra(u);
        if (u.rota) u.rota = null;
      }
      this.estatisticas.perdas++;
      this.emitir('estruturaDestruida', { id: alvo.id, tipo: alvo.tipo, x: alvo.x, y: alvo.y, w: alvo.w, h: alvo.h });
      if (alvo === this.central) { this.central = null; this.terminar(false, 'A Central de Comando foi destruída.'); }
      this.recalcularPop();
    } else {
      if (alvo.lado === 'inimigo') {
        this.estatisticas.abates++;
        this.jogador.m += Math.max(1, Math.round((alvo.def.valor || 4) * 0.35));
      } else {
        if (alvo.operario) {
          this.estatisticas.operariosPerdidos++;
          alvo.carga = 0;                        /* a carga perdida não entra no estoque */
        }
        this.liberarObra(alvo);
        this.recalcularPop();
      }
      if (alvo.def && alvo.def.suicida && !opts.silencioso) {
        this.danoEmArea(alvo.x, alvo.y, alvo.def.arma.area, alvo.def.arma.dano, alvo.lado, { perfura: false });
        this.emitir('explosao', { x: alvo.x, y: alvo.y, raio: alvo.def.arma.area });
      }
      /* `angulo` vai junto porque o cadáver fica deitado para o lado em que a
         unidade estava virada, e depois de removida da lista não há mais como
         saber. */
      /* `unidade`, e não `tipo`: `emitir()` grava o NOME DO EVENTO em `dados.tipo`,
         então qualquer campo chamado assim é sobrescrito na saída. Foi o mesmo
         defeito que fazia o "+8" da entrega nunca aparecer âmbar, e aqui ele
         deitava um cadáver do tipo "unidadeMorta" — que não tem sprite nenhum,
         e por isso o corpo caído nunca aparecia. */
      this.emitir('unidadeMorta', {
        id: alvo.id, x: alvo.x, y: alvo.y, lado: alvo.lado,
        unidade: alvo.tipo, angulo: alvo.angulo
      });
    }
  };

  /* ------------------------------------------------------------- estruturas */
  S.atualizarEstrutura = function (b, dt, deficit) {
    if (b.morta) return;
    if (b.portao) this.atualizarPortao(b, dt);
    if (!b.construida) return;
    this.atualizarProducao(b, dt, b.semEnergia);

    if (b.tipo === 'extrator' && b.jazida) {
      var jaz = this.world.jazidaPorId(b.jazida);
      if (jaz && jaz.estoque > 0) {
        if (b.semEnergia) return;
      var taxa = 1.1 * dt * (this.jogador.pesquisas.logistica ? 1.4 : 1);
        var qtd = Math.min(taxa, jaz.estoque);
        jaz.estoque -= qtd;
        b.acumulado += qtd;
        if (b.acumulado >= 1) {
          var inteiro = Math.floor(b.acumulado);
          b.acumulado -= inteiro;
          this.jogador.c += inteiro;
        }
      }
    }

    if (b.dentro && b.dentro.length) this.atualizarGuarnicao(b, dt);

    if (b.torre) {
      if (b.semEnergia) return;
      var arma = b.def.arma;
      var alvo = (b.alvo && this.alvoPorId(b.alvo)) || null;
      if (alvo && (alvo.morta || this.distanciaEntre(b, alvo) > arma.alc || !this.podeAtingir(arma, alvo))) alvo = null;
      if (!alvo) {
        alvo = this.procurarAlvo(b, arma, arma.alc, 'inimigo', false, this.alvoPrioritario);
        b.alvo = alvo ? alvo.id : 0;
      }
      if (alvo) {
        this.atirar(b, alvo, arma, dt);
        if (arma.lentidao) alvo.lentoAte = this.t + 1.4;
      } else {
        b.recarga = Math.max(0, b.recarga - dt);
      }
    }
  };

  S.atualizarPortao = function (b, dt) {
    if (b.portaoModo === 'aberto') { b.portaoAberto = true; return; }
    if (b.portaoModo === 'fechado') { b.portaoAberto = false; return; }
    var perigo = false;
    for (var i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (u.lado !== 'inimigo' || u.morta || u.voa) continue;
      if (U.distToRect(u.x, u.y, b.x, b.y, b.w, b.h) < 3.6) { perigo = true; break; }
    }
    var pedido = b.pedidoPassagem && (this.t - b.pedidoPassagem) < 1.5;
    b.portaoAberto = !perigo || pedido;
  };

  /* PEDIDO DE APOIO PELO RÁDIO.
     Chama a reserva: as tropas que estão em `defender` e ao alcance do chamado
     largam o posto e vão para o ponto do contato. Quem tem ordem MANUAL —
     outra patrulha, um avanço, um recuo, fogo concentrado — não é arrastado:
     ordem do jogador vale mais que chamado automático, senão um bicho isolado
     desmonta a defesa inteira.

     A espera de oito segundos por unidade existe para o rádio não virar
     chiado contínuo numa onda, onde há contato novo a cada instante. */
  var ESPERA_APOIO = 8;
  var ALCANCE_APOIO = 16;

  S.pedirApoio = function (u, alvo) {
    if (!u || !alvo || alvo.morta) return;
    if (u.proximoApoio && this.t < u.proximoApoio) return;
    /* Trava GLOBAL além da de cada unidade: numa onda dez soldados avistam o
       mesmo bando no mesmo segundo, e dez chiados juntos não são aviso, são
       ruído. Um chamado por vez, e o resto da onda se resolve no tiro. */
    if (this.proximoApoioGeral && this.t < this.proximoApoioGeral) return;
    this.proximoApoioGeral = this.t + 6;
    u.proximoApoio = this.t + ESPERA_APOIO;

    var c = this.centroDe(alvo), vieram = 0;
    for (var i = 0; i < this.unidades.length; i++) {
      var o = this.unidades[i];
      if (o === u || o.lado !== 'aliado' || o.morta || o.operario) continue;
      if (!o.def.arma || o.def.cura) continue;
      var t = o.tarefa ? o.tarefa.tipo : null;
      if (t !== 'defender' && t !== 'voltandoAoPosto' && t !== null) continue;   /* só a reserva */
      if (U.dist(o.x, o.y, c.x, c.y) > ALCANCE_APOIO) continue;
      /* Guarda o POSTO. Quem atende o chamado tem de voltar para onde estava —
         senão o primeiro bicho isolado esvazia a linha de defesa de vez, e a
         onda de verdade chega numa base sem ninguém. */
      var posto = (o.tarefa && o.tarefa.centro) || { x: o.x, y: o.y };
      this.darTarefa(o, { tipo: 'moverAtacando', destino: { x: Math.floor(c.x), y: Math.floor(c.y) },
        apoio: true, posto: { x: posto.x, y: posto.y }, prazo: this.t + 25 }, false);
      vieram++;
    }
    this.emitir('apoio', {
      x: u.x, y: u.y, alvoX: c.x, alvoY: c.y,
      nome: u.def.nome, vieram: vieram, inimigo: alvo.def ? alvo.def.nome : 'inimigo'
    });
  };

  /* ---------------------------------------------------------- tropas aliadas */
  S.atualizarSoldado = function (u, dt) {
    var tarefa = u.tarefa || (u.tarefa = { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 7 });
    var arma = u.def.arma;

    if (this.tentarGuarnecer(u, dt)) return;
    if (u.def.cura) { this.atualizarMedico(u, dt); return; }

    var alvo = (u.alvo && this.alvoPorId(u.alvo)) || null;
    if (alvo && (alvo.morta || this.distanciaEntre(u, alvo) > arma.alc * 1.25)) alvo = null;
    if (!alvo && arma && u.postura !== 'semAtaque') {
      var alcanceBusca = tarefa.tipo === 'mover' ? arma.alc : Math.max(arma.alc, u.def.visao * 0.8);
      alvo = this.procurarAlvo(u, arma, alcanceBusca, 'inimigo', false, this.alvoPrioritario);
    }

    if (tarefa.tipo === 'focar') {
      var marcado = this.alvoPorId(tarefa.alvo);
      if (marcado && !marcado.morta && this.podeAtingir(arma, marcado)) alvo = marcado;
      else u.tarefa = { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 7 };
    }

    if (tarefa.tipo === 'recuar' || tarefa.tipo === 'mover') {
      this.irAte(u, tarefa.destino, dt);
      if (this.encostouEm(u, tarefa.destino, 0.9)) u.tarefa = { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 7 };
      if (tarefa.tipo === 'recuar') return;                 /* recuo não para para atirar */
      if (alvo && arma && this.distanciaEntre(u, alvo) <= arma.alc) { u.alvo = alvo.id; this.atirar(u, alvo, arma, dt); }
      return;
    }

    if (tarefa.tipo === 'patrulhar') {
      /* PATRULHA ENGAJA. Antes ela só atirava se o inimigo por acaso entrasse no
         alcance enquanto a tropa passava: dois tiros de passagem e o soldado
         seguia marchando, deixando o bicho vivo às costas. Medido — o Corredor
         levava 24 de dano e ficava com 71 de vida enquanto o fuzileiro se
         afastava para 11 células e nunca mais voltava.

         Nos dois clássicos patrulhar é ordem de COMBATE: a tropa interrompe a
         ronda para brigar e volta à linha quando acaba. A coleira é a própria
         linha da patrulha — meio do trajeto como centro, metade do trajeto mais
         cinco células como raio — para a ronda não virar perseguição pelo mapa.

         Quando há alvo dentro da vigia, cai no ramo comum lá embaixo, que já
         sabe aproximar, respeitar alcance mínimo e voltar para o centro. */
      var vigia = arma ? Math.max(arma.alc, u.def.visao * 0.8) : 0;
      if (!alvo || !arma || this.distanciaEntre(u, alvo) > vigia) {
        /* SAINDO DO COMBATE: joga fora a rota da briga.
           Sem isto a ronda não voltava. `irAte` segue a rota que já existe, e
           a que existia era a do caminho ATÉ O INIMIGO — morto o bicho, o
           soldado continuava andando para onde ele estava, e só depois de
           gastar a rota inteira é que lembrava da patrulha. Na tela isso é
           exatamente "matou e não voltou". */
        if (tarefa.emCombate) { tarefa.emCombate = false; u.rota = null; }
        var destino = tarefa.indo ? tarefa.b : tarefa.a;
        this.irAte(u, destino, dt);
        if (this.encostouEm(u, destino, 1.2)) { tarefa.indo = !tarefa.indo; u.rota = null; }
        return;
      }
      tarefa.emCombate = true;
      if (!tarefa.centro) {
        tarefa.centro = { x: (tarefa.a.x + tarefa.b.x) / 2, y: (tarefa.a.y + tarefa.b.y) / 2 };
        tarefa.raio = U.dist(tarefa.a.x, tarefa.a.y, tarefa.b.x, tarefa.b.y) / 2 + 5;
      }
    }

    /* CHAMA APOIO. Qualquer soldado que AVISTA uma ameaça chama — não só o que
       está em ronda. Era só a patrulha e o Pedro, jogando, não ouvia o rádio
       nunca: a tropa parada na base é `defender`, não `patrulhar`, e é ela que
       encontra a onda primeiro. "Quando ele identificar uma ameaça" vale para
       todo mundo que identifica.

       Só no momento em que o alvo APARECE, e só se ele for novo — enquanto a
       briga continua, o rádio fica quieto. */
    if (alvo && arma && u.alvo !== alvo.id &&
        (tarefa.tipo === 'patrulhar' || tarefa.tipo === 'defender')) {
      this.pedirApoio(u, alvo);
    }

    if (alvo) {
      u.alvo = alvo.id;
      var d = this.distanciaEntre(u, alvo);
      if (d > arma.alc * 0.92) {
        /* A patrulha tem coleira como a defesa: sem ela, um inimigo que foge
           levava a ronda inteira atrás dele e a linha ficava aberta.

           O TAMANHO da coleira agora é do JOGADOR, não nosso. Era fixo em 7, e
           7 é uma escolha de desenho que não tinha por que ser nossa: quem
           defende muro quer 3, quem caça operário invasor quer 14. É a postura
           do Age of Empires II, e num jogo de defesa de base o padrão certo é
           a defensiva. */
        var comColeira = tarefa.tipo === 'defender' || tarefa.tipo === 'patrulhar' ||
          tarefa.tipo === 'voltandoAoPosto';
        var limite = comColeira ? (tarefa.raio || this.coleiraDe(u)) : 99;
        var longe = tarefa.centro ? U.dist(u.x, u.y, tarefa.centro.x, tarefa.centro.y) : 0;
        if (longe < limite) this.irAte(u, alvo, dt, 1);
        else { u.rota = null; this.irAte(u, tarefa.centro, dt); }
      } else if (d < (arma.alcMin || 0)) {
        u.rota = null;                                        /* alcance mínimo: recua um passo */
        var c = this.centroDe(alvo);
        var fx = u.x - c.x, fy = u.y - c.y, fd = Math.hypot(fx, fy) || 1;
        u.x += fx / fd * u.vel * dt; u.y += fy / fd * u.vel * dt;
      } else {
        u.rota = null;
        this.atirar(u, alvo, arma, dt);
      }
      return;
    }

    u.alvo = 0;
    if (tarefa.tipo === 'moverAtacando') {
      this.irAte(u, tarefa.destino, dt);
      /* Quem foi atender o chamado volta ao POSTO ao terminar; quem foi por
         ordem do jogador fica onde chegou, que é o que a ordem pediu.

         Voltar assim que some o alvo, como tentei primeiro, não funciona: no
         quadro seguinte ao chamado o apoio ainda está na base, longe demais
         para ver o inimigo, e dava meia-volta sem sair do lugar. Tem de CHEGAR.

         O prazo existe para o apoio não marchar para sempre atrás de um ponto
         que ficou inalcançável — brecha fechada, muro erguido no caminho. */
      var acabou = this.encostouEm(u, tarefa.destino, 0.9) ||
        (tarefa.apoio && tarefa.prazo && this.t > tarefa.prazo);
      if (acabou) {
        if (tarefa.apoio && tarefa.posto) {
          u.tarefa = { tipo: 'voltandoAoPosto', destino: tarefa.posto,
            centro: tarefa.posto, raio: 9, prazo: this.t + 30 };
          u.rota = null;
        } else {
          u.tarefa = { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 7 };
        }
      }
      return;
    }
    /* A volta é uma tarefa própria e não um `mover`: assim ela continua
       reagindo a inimigo no caminho — é o mesmo ramo de cima que trata isso —
       e termina virando `defender` no posto certo, não onde parou. */
    if (tarefa.tipo === 'voltandoAoPosto') {
      this.irAte(u, tarefa.destino, dt);
      /* Chegou, ou o posto sumiu. A segunda parte não é zelo: o posto pode ter
         virado obra, muro ou ficado do outro lado de uma brecha que fechou, e
         medindo numa partida de verdade foi o que aconteceu — três soldados
         ficaram "voltando ao posto" para sempre, andando em círculo a cinco
         células de um ponto inalcançável. Passado o prazo, o soldado cava onde
         está: é o que um soldado de verdade faz. */
      var chegou = this.encostouEm(u, tarefa.destino, 1.2);
      var desistiu = tarefa.prazo && this.t > tarefa.prazo;
      if (chegou || desistiu) {
        var onde = chegou ? tarefa.destino : { x: u.x, y: u.y };
        u.tarefa = { tipo: 'defender', centro: { x: onde.x, y: onde.y }, raio: 7 };
        u.rota = null;
      }
      return;
    }
    if (tarefa.tipo === 'defender' && tarefa.centro) {
      if (U.dist(u.x, u.y, tarefa.centro.x, tarefa.centro.y) > 1.6) this.irAte(u, tarefa.centro, dt);
      else u.rota = null;
    }
  };

  S.atualizarMedico = function (u, dt) {
    var tarefa = u.tarefa;
    if (tarefa.tipo === 'mover' || tarefa.tipo === 'recuar' || tarefa.tipo === 'moverAtacando') {
      this.irAte(u, tarefa.destino, dt);
      if (this.encostouEm(u, tarefa.destino, 0.9)) u.tarefa = { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 6 };
    }
    if (u.reservaCura <= 0) return;
    var melhor = null, pior = 1;
    for (var i = 0; i < this.unidades.length; i++) {
      var a = this.unidades[i];
      if (a.lado !== 'aliado' || a.morta || a === u || a.operario) continue;
      if (a.hp >= a.hpMax) continue;
      if (U.dist(u.x, u.y, a.x, a.y) > u.def.cura.alc) continue;
      var frac = a.hp / a.hpMax;
      if (frac < pior) { pior = frac; melhor = a; }
    }
    if (!melhor) return;
    var cura = Math.min(u.def.cura.taxa * dt, u.reservaCura, melhor.hpMax - melhor.hp);
    melhor.hp += cura; u.reservaCura -= cura;
    if (Math.random() < dt * 3) this.emitir('cura', { x: melhor.x, y: melhor.y });
  };

  /* POSTURA DE COMBATE, como no Age of Empires II.
       agressiva  — persegue longe, 16 células
       defensiva  — persegue pouco e volta, 7 (o padrão, e é jogo de defesa)
       parado     — atira de onde está, não dá um passo
       semAtaque  — não escolhe alvo nenhum; serve para atravessar o mapa
     Guardada na UNIDADE e não na tarefa: ela sobrevive à ordem, que é o que
     "persistente" quer dizer. */
  var COLEIRA = { agressiva: 16, defensiva: 7, parado: 0, semAtaque: 0 };

  S.coleiraDe = function (u) {
    var v = COLEIRA[u.postura || 'defensiva'];
    return v === undefined ? 7 : v;
  };

  S.definirPostura = function (u, postura) {
    if (COLEIRA[postura] === undefined) return;
    u.postura = postura;
    if (postura === 'semAtaque') u.alvo = 0;
  };

  S.irAte = function (u, destino, dt, folga) {
    if (u.voa) { this.voar(u, destino, dt); return; }
    if (this.encostouEm(u, destino, folga == null ? 0.6 : folga)) { u.rota = null; return; }
    if (!u.rota || !u.rota.length) {
      /* DESTINO EM CÉLULA INTEIRA quando não é retângulo. `path.js` testa a
         chegada como |x − (px+0,5)| ≤ raio: com destino fracionário e raio 0
         isso é impossível para coordenada inteira, e o A* varre o mapa para
         devolver nada — a unidade fica parada, `bloqueado`, gastando uma busca
         de mapa inteiro a cada 1,6 s.

         Media: um fuzileiro voltando ao posto ficou 20 segundos imóvel no mesmo
         pixel, com 34 buscas desperdiçadas. O mesmo defeito do trator, e este
         conserto aqui pega de uma vez os três que passam centro fracionário:
         a volta ao posto do apoio, a coleira da patrulha e o centro do
         `defender`. Estrutura tem `w`/`h` e continua indo como está — para ela
         o buscador usa o retângulo. */
      var alvoRota = destino;
      if (!destino.w) alvoRota = { x: Math.floor(destino.x), y: Math.floor(destino.y) };
      if (!this.pedirRota(u, alvoRota, { raioChegada: folga ? 1 : 0 })) return;
    }
    var bloqueio = this.andar(u, dt);
    if (bloqueio) u.rota = null;
  };

  /* ------------------------------------------------------------- invasores */
  S.escolherAlvoInimigo = function (u) {
    var mira = u.def.mira, i, melhor = null, melhorD = Infinity;
    if (mira === 'economia') {
      for (i = 0; i < this.unidades.length; i++) {
        var a = this.unidades[i];
        if (a.lado !== 'aliado' || a.morta || !a.operario) continue;
        var d = U.dist(u.x, u.y, a.x, a.y);
        if (d < melhorD && d < 26) { melhorD = d; melhor = a; }
      }
      if (melhor) return melhor;
      for (i = 0; i < this.listaEstruturas.length; i++) {
        var b = this.listaEstruturas[i];
        if (b.morta || !(b.deposito || b.tipo === 'extrator')) continue;
        var db = U.distToRect(u.x, u.y, b.x, b.y, b.w, b.h);
        if (db < melhorD) { melhorD = db; melhor = b; }
      }
      if (melhor) return melhor;
    }
    if (mira === 'tropa') {
      for (i = 0; i < this.unidades.length; i++) {
        var s = this.unidades[i];
        if (s.lado !== 'aliado' || s.morta) continue;
        if (s.voa && !u.def.arma.ar) continue;
        var ds = U.dist(u.x, u.y, s.x, s.y);
        if (ds < melhorD && ds < u.def.visao * 2.2) { melhorD = ds; melhor = s; }
      }
      if (melhor) return melhor;
    }
    if (this.central && !this.central.morta) return this.central;
    for (i = 0; i < this.listaEstruturas.length; i++) {
      var e = this.listaEstruturas[i];
      if (e.morta) continue;
      var de = U.distToRect(u.x, u.y, e.x, e.y, e.w, e.h);
      if (de < melhorD) { melhorD = de; melhor = e; }
    }
    return melhor;
  };

  S.atualizarInvasor = function (u, dt) {
    var arma = u.def.arma;
    /* Oportunidade: o que estiver ao alcance agora é atacado, seja qual for o destino. */
    var perto = this.procurarAlvo(u, arma, arma.alc, 'aliado', true, 0);
    if (perto) { u.alvo = perto.id; this.atirar(u, perto, arma, dt); u.rota = null; return; }

    if (!u.alvoDestino || (this.t - (u.escolhidoEm || 0)) > 2.5) {
      var novo = this.escolherAlvoInimigo(u);
      if (novo && (!u.alvoDestino || novo.id !== u.alvoDestino)) { u.rota = null; }
      u.alvoDestino = novo ? novo.id : 0;
      u.escolhidoEm = this.t;
    }
    var destino = this.alvoPorId(u.alvoDestino);
    if (!destino || destino.morta) { u.alvoDestino = 0; return; }

    if (u.voa) { this.voar(u, destino, dt); return; }

    if (!u.rota) {
      if (!this.pedirRota(u, destino, { raioChegada: 1 })) {
        /* Sem qualquer rota: derruba o obstáculo alcançável mais próximo. */
        var obst = this.obstaculoMaisProximo(u);
        if (obst) { u.alvo = obst.id; this.atirar(u, obst, arma, dt); }
        return;
      }
    }
    var bloqueio = this.andar(u, dt);
    if (bloqueio) {
      u.alvo = bloqueio.id;
      this.atirar(u, bloqueio, arma, dt);
    }
  };

  S.obstaculoMaisProximo = function (u) {
    var melhor = null, melhorD = Infinity;
    for (var i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (b.morta) continue;
      var d = U.distToRect(u.x, u.y, b.x, b.y, b.w, b.h);
      if (d < melhorD) { melhorD = d; melhor = b; }
    }
    return melhorD < 40 ? melhor : null;
  };

  /* ------------------------------------------------------------ ondas */
  S.orcamentoDaOnda = function (num) {
    var base = 22 + 14 * (num - 1) + 1.6 * Math.pow(num - 1, 2);
    return base * this.dif.orcamento * (this.setor.pressao || 1);
  };

  S.tiposDisponiveis = function (num) {
    var lista = ['predador', 'corredor'];
    if (num >= 3) lista.push('cuspidor');
    if (num >= 4) lista.push('detonador');
    if (num >= 4) lista.push('asa');
    if (num >= 6) lista.push('couracado');
    if (num >= 7) lista.push('tita');
    return lista;
  };

  S.montarOnda = function (num) {
    var rand = U.rng(this.setor.semente * 31 + num * 977);
    var orc = this.orcamentoDaOnda(num);
    var tipos = this.tiposDisponiveis(num);
    var lista = [];
    var chefeAgora = this.setor.chefe && num >= this.onda.total;
    if (chefeAgora) { lista.push('matriarca'); orc *= 0.65; }
    var guarda = 0;
    while (orc > 4 && guarda++ < 400) {
      var t = tipos[Math.floor(rand() * tipos.length)];
      if (t === 'asa' && this.setor.aereo && rand() < 0.45) lista.push('asa');
      var custo = INV[t].valor;
      if (custo > orc) { tipos = tipos.filter(function (x) { return INV[x].valor <= orc; }); if (!tipos.length) break; continue; }
      lista.push(t); orc -= custo;
    }
    return lista;
  };

  S.dispararOnda = function () {
    var num = this.onda.num + 1;
    this.onda.num = num;
    this.onda.estado = 'ataque';
    this.onda.anunciada = false;
    var lista = this.montarOnda(num);
    var entradas = this.world.entradas;
    var rand = U.rng(this.setor.semente + num * 131);
    var quantasFrentes = Math.min(entradas.length, num >= 5 ? 2 : 1);
    var frentes = [];
    for (var f = 0; f < quantasFrentes; f++) {
      frentes.push(entradas[Math.floor(rand() * entradas.length)]);
    }
    this.filaSpawn = [];
    for (var i = 0; i < lista.length; i++) {
      var e = frentes[i % frentes.length];
      this.filaSpawn.push({ tipo: lista[i], entrada: e, em: i * 0.45 });
    }
    this.onda.direcoes = frentes.map(function (f) { return f.nome; });
    this.aviso('Onda ' + num + ': ataque vindo de ' + this.onda.direcoes.join(' e ') + '.', 'perigo');
    this.emitir('ondaComecou', { num: num, direcoes: this.onda.direcoes, quantidade: lista.length });
  };

  S.atualizarOnda = function (dt) {
    if (this.modo === 'livre') return;
    var o = this.onda;
    if (o.estado === 'preparo') {
      o.tempo -= dt;
      var janela = R.avisoAtaque * this.dif.aviso;
      if (!o.anunciada && o.tempo <= janela) {
        o.anunciada = true;
        var previsao = this.temEstrutura('radar')
          ? 'Radar: ' + this.montarOnda(o.num + 1).length + ' invasores se aproximando.'
          : 'Movimento detectado. Construa um Radar para detalhes.';
        this.aviso('Ataque em ' + Math.round(o.tempo) + 's. ' + previsao, 'atencao');
        this.emitir('avisoOnda', { num: o.num + 1, segundos: o.tempo });
      }
      if (o.tempo <= 0) this.dispararOnda();
      return;
    }
    /* Fase de ataque: solta os invasores da fila e espera limpar o setor. */
    if (this.filaSpawn && this.filaSpawn.length) {
      for (var i = this.filaSpawn.length - 1; i >= 0; i--) {
        this.filaSpawn[i].em -= dt;
        if (this.filaSpawn[i].em > 0) continue;
        var s = this.filaSpawn[i];
        var cel = this.nav.celulaLivreProxima(s.entrada.x, s.entrada.y, 6) || s.entrada;
        var u = this.criarUnidade(s.tipo, cel.x + 0.5, cel.y + 0.5, 'inimigo');
        if (INV[s.tipo].chefe) this.emitir('chefeEntrou', { id: u.id });
        this.filaSpawn.splice(i, 1);
      }
    }
    var vivos = 0;
    for (var k = 0; k < this.unidades.length; k++) if (this.unidades[k].lado === 'inimigo' && !this.unidades[k].morta) vivos++;
    o.vivos = vivos;
    if (vivos === 0 && (!this.filaSpawn || !this.filaSpawn.length)) {
      this.emitir('ondaVencida', { num: o.num });
      if (o.num >= o.total) { this.verificarVitoria(true); return; }
      o.estado = 'preparo';
      o.tempo = R.intervaloOnda;
      this.jogador.m += 40 + o.num * 12;
      this.aviso('Setor limpo. Próximo ataque em ' + R.intervaloOnda + 's. (+' + (40 + o.num * 12) + ' minerais)', 'bom');
    }
  };

  /* ---------------------------------------------------------- habilidades */
  S.bombardear = function (x, y) {
    if (this.jogador.energia < R.custoBombardeio) return { ok: false, motivo: 'Energia tática insuficiente' };
    this.jogador.energia -= R.custoBombardeio;
    this.bombardeios.push({ x: x, y: y, em: 1.8, raio: 3.2, dano: 165 });
    this.emitir('bombardeioMarcado', { x: x, y: y, raio: 3.2 });
    return { ok: true };
  };

  S.ativarEscudo = function (x, y) {
    if (this.jogador.energia < R.custoEscudo) return { ok: false, motivo: 'Energia tática insuficiente' };
    this.jogador.energia -= R.custoEscudo;
    this.escudo = { x: x, y: y, raio: 7, ate: this.t + 8 };
    this.emitir('escudoAtivado', { x: x, y: y, raio: 7 });
    return { ok: true };
  };

  S.atualizarHabilidades = function (dt) {
    this.jogador.energia = Math.min(R.energiaMax, this.jogador.energia + R.energiaRegen * dt);
    for (var i = this.bombardeios.length - 1; i >= 0; i--) {
      var b = this.bombardeios[i];
      b.em -= dt;
      if (b.em > 0) continue;
      this.danoEmArea(b.x, b.y, b.raio, b.dano, 'aliado', { perfura: true });
      this.emitir('explosao', { x: b.x, y: b.y, raio: b.raio, grande: true });
      this.bombardeios.splice(i, 1);
    }
    if (this.escudo && this.t > this.escudo.ate) this.escudo = null;
  };

  /* ------------------------------------------------------- fim de partida */
  /* CORPO ENTRE UNIDADES.
     Até aqui `andar` só consultava `world.occ`, que guarda ESTRUTURA: vinte
     fuzileiros ficavam nas mesmas coordenadas, um sprite só com dezenove
     cópias por baixo, e o jogador não via frente, flanco nem retaguarda.

     Separação MACIA, não colisão dura. Colisão dura obriga a refazer rota a
     cada esbarrão e é de onde vem o Dragoon emperrado do Brood War, que a
     própria Blizzard admitiu nunca ter tido tempo de consertar.

     A PRIMEIRA TENTATIVA FOI REVERTIDA e o que ela ensinou está aqui dentro.
     Ela empurrava sem mexer na rota: a unidade saía do caminho, o guarda de
     `world.livre` recusava o passo, e ela encunhava contra a estrutura. Invasor
     encunhado nunca chega, então a onda nunca acaba — `equilibrio.cjs` mostrou
     QUATRO dos seis setores deixando de terminar, e Marginal Tietê parada na
     onda 1 de 11 depois de 45 minutos.

     Três regras consertam isso:

       1. QUEM É EMPURRADO REFAZ A ROTA. Sem isso ele continua seguindo um
          caminho que já não parte de onde ele está. Com descanso de meio
          segundo por unidade, senão um aperto vira tempestade de A*.
       2. SE O EMPURRÃO BATE EM PAREDE, DESLIZA. Tenta o movimento cheio;
          barrado, tenta só em x, depois só em y. É isso que impede o encunhe:
          a unidade escorrega ao longo do muro em vez de travar contra ele.
       3. SÓ SEPARA SOBREPOSIÇÃO QUE IMPORTA. Abaixo de um vigésimo de célula
          não vale mexer — é ruído que gera trabalho e não muda nada na tela.

     SÓ O NOSSO LADO TEM CORPO, e isso foi medido, não escolhido por gosto. Com
     os dois lados separando, `equilibrio.cjs` ainda perdia um setor: Marginal
     Tietê ficava com UM Corredor vivo andando sem nunca chegar, e a onda não
     fechava. Um invasor sozinho não é empurrado por ninguém — o que mudou foi o
     jogo inteiro por tabela, e caçar isso custaria mais do que vale. O que o
     jogador vê e comanda é o exército dele; é ali que a forma importa, e é ali
     que ela entra agora. A colmeia continua se atravessando, e o combate
     continua acontecendo em vez de virar empurra-empurra.

     E o que se mantém da primeira: grade por célula em vez de todos contra
     todos; voador fora; teto por quadro; e quem está parado cede menos que quem
     anda, que é o que forma a linha. */
  var EMPURRAO = 3.2;              /* células por segundo, no máximo */
  var SOBRA_MINIMA = 0.05;         /* abaixo disto não vale mexer */
  var DESCANSO_ROTA = 0.5;         /* segundos entre refazer rota por empurrão */

  S.empurrar = function (u, nx, ny) {
    var w = this.world;
    var cx = u.x | 0, cy = u.y | 0;
    /* Dentro da mesma célula é sempre permitido: não há o que bloquear. */
    if (((nx | 0) === cx && (ny | 0) === cy) || w.livre(nx | 0, ny | 0)) {
      u.x = nx; u.y = ny; return true;
    }
    if (w.livre(nx | 0, cy)) { u.x = nx; return true; }          /* desliza em x */
    if (w.livre(cx, ny | 0)) { u.y = ny; return true; }          /* desliza em y */
    return false;
  };

  S.separarUnidades = function (dt) {
    var grade = {}, i, u, ch;
    for (i = 0; i < this.unidades.length; i++) {
      u = this.unidades[i];
      if (u.morta || u.voa || u.lado === 'inimigo') continue;
      ch = (u.x | 0) + ',' + (u.y | 0);
      if (!grade[ch]) grade[ch] = [];
      grade[ch].push(u);
    }
    for (i = 0; i < this.unidades.length; i++) {
      u = this.unidades[i];
      if (u.morta || u.voa || u.lado === 'inimigo') continue;
      var cx = u.x | 0, cy = u.y | 0, mexeu = 0;
      for (var dx = -1; dx <= 1; dx++) {
        for (var dy = -1; dy <= 1; dy++) {
          var lista = grade[(cx + dx) + ',' + (cy + dy)];
          if (!lista) continue;
          for (var k = 0; k < lista.length; k++) {
            var o = lista[k];
            if (o === u || o.morta || o.voa || o.lado === 'inimigo') continue;
            var vx = u.x - o.x, vy = u.y - o.y;
            var d2 = vx * vx + vy * vy;
            var min = (u.raio || 0.3) + (o.raio || 0.3);
            if (d2 >= min * min) continue;
            var d = Math.sqrt(d2);
            if (min - d < SOBRA_MINIMA) continue;
            if (d < 0.0001) {
              /* Exatamente no mesmo ponto: sem direção para empurrar. O
                 desempate vem do id, não de sorteio, para a simulação
                 continuar determinística. */
              vx = ((u.id % 7) - 3) * 0.01 + 0.005;
              vy = ((u.id % 5) - 2) * 0.01 + 0.005;
              d = Math.hypot(vx, vy) || 1;
            }
            var peso = u.rota ? 1 : 0.45;
            var passo = Math.min((min - d) * 0.5, EMPURRAO * dt) * peso;
            if (this.empurrar(u, u.x + (vx / d) * passo, u.y + (vy / d) * passo)) mexeu += passo;
          }
        }
      }
      /* Andou de lado o bastante para o caminho antigo não valer mais. */
      if (mexeu > 0.12 && u.rota && this.t > (u.refezRotaEm || 0)) {
        u.rota = null;
        u.tentarRotaEm = 0;
        u.refezRotaEm = this.t + DESCANSO_ROTA;
      }
    }
  };

  S.verificarVitoria = function (ondasCompletas) {
    if (this.fase !== 'jogando') return;
    if (this.modo !== 'campanha') {
      if (ondasCompletas) this.terminar(true, 'Setor mantido.');
      return;
    }
    if (this.setor.entregaAlvo && this.estatisticas.entregue < this.setor.entregaAlvo) {
      this.onda.total += 1;
      this.onda.estado = 'preparo';
      this.onda.tempo = R.intervaloOnda;
      this.aviso('Objetivo de extração ainda não cumprido: faltam ' +
        U.num(this.setor.entregaAlvo - this.estatisticas.entregue) + ' minerais.', 'atencao');
      return;
    }
    this.terminar(true, this.setor.objetivo);
  };

  S.terminar = function (venceu, motivo) {
    if (this.fase === 'vitoria' || this.fase === 'derrota') return;
    this.fase = venceu ? 'vitoria' : 'derrota';
    this.motivoFim = motivo;
    this.emitir('fimDePartida', { venceu: venceu, motivo: motivo });
  };

  /* ----------------------------------------------------- ciclo principal */
  S.atualizar = function (dtReal) {
    if (this.pausado || this.fase === 'colocacao' || this.fase === 'vitoria' || this.fase === 'derrota') return;
    var dt = dtReal;
    this.t += dt;
    var energia = this.energiaEstrutural();
    var deficit = energia.deficit > 0;
    this.deficitEnergia = energia;

    var i, u;
    for (i = 0; i < this.listaEstruturas.length; i++) this.atualizarEstrutura(this.listaEstruturas[i], dt, deficit);

    for (i = 0; i < this.unidades.length; i++) {
      u = this.unidades[i];
      if (u.morta) continue;
      if (u.lado === 'inimigo') this.atualizarInvasor(u, dt);
      /* O trator não é operário — não minera, não conta como mão de obra — mas
         é máquina de OBRA e não de guerra: o laço dele é o dos trabalhos, onde
         mora a limpeza de terreno. Sem esta linha ele caía no laço do soldado,
         que exige arma e não sabe o que é limpar. */
      else if (u.operario || u.def.limpeza) this.atualizarOperario(u, dt);
      else this.atualizarSoldado(u, dt);
    }

    this.separarUnidades(dt);
    this.atenderObrasPendentes();
    this.atualizarProjeteis(dt);
    this.atualizarHabilidades(dt);
    this.atualizarPesquisa(dt);
    this.atualizarOnda(dt);

    /* Limpeza: mortos saem das listas depois que a apresentação já os viu. */
    for (i = this.unidades.length - 1; i >= 0; i--) {
      u = this.unidades[i];
      if (u.morta && this.t - (u.ultimoDano || 0) > 1.2) this.unidades.splice(i, 1);
    }
    for (i = this.listaEstruturas.length - 1; i >= 0; i--) {
      var b = this.listaEstruturas[i];
      if (b.morta && this.t - (b.ultimoDano || 0) > 1.6) {
        this.listaEstruturas.splice(i, 1);
        delete this.estruturas[b.id];
      }
    }

    this.relogioVisao = (this.relogioVisao || 0) + dt;
    if (this.relogioVisao > 0.25) { this.relogioVisao = 0; this.atualizarVisao(); }

    if (this.modo === 'campanha' && this.setor.entregaAlvo && !this.avisouEntrega &&
        this.estatisticas.entregue >= this.setor.entregaAlvo) {
      this.avisouEntrega = true;
      this.aviso('Meta de extração cumprida: ' + U.num(this.estatisticas.entregue) + ' minerais entregues.', 'bom');
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
