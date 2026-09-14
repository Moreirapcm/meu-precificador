/* Última Fronteira — vida das unidades sem desenhar um quadro sequer.
 *
 * Animação de sprite tradicional (andar, atacar, morrer × 8 direções) custa mais
 * de duzentas imagens por unidade, e gerá-las por IA não funciona: cada imagem
 * sai um pouco diferente da anterior e a sequência vira um boneco tremendo.
 * O que dá para fazer é deformar a MESMA imagem em tempo real — virar, inclinar,
 * pisar, recuar no tiro, tombar na morte. É o que este arquivo calcula.
 *
 * Tudo aqui LÊ o estado e devolve números. Nada escreve na simulação: a memória
 * que a animação precisa (onde a unidade estava no quadro passado, quanto de
 * vida tinha, quando morreu) mora aqui dentro, indexada por id, e é da
 * apresentação.
 */
(function (UF) {
  'use strict';

  var U = UF.util;
  var LARG = 64, ALT = 32;          /* o mesmo losango de render.js */

  function Anima() {
    this.onde = {};        /* id -> posição no quadro anterior, para achar o passo */
    this.hpVisto = {};     /* id -> hp no quadro anterior, para achar o dano */
    this.tremor = {};      /* id -> segundos restantes de tremida */
    this.morte = {};       /* id -> segundos desde que tombou */
    this.passo = {};       /* id -> fase da passada, em radianos */
  }

  /* Altura de cada corpo na tela, em células. Mora aqui, e não no render, porque
     é dela que sai o comprimento da perna — e é o comprimento da perna que
     decide o tamanho do passo. Desenho e animação leem a mesma fonte. */
  Anima.ALTURA = {
    operario: 2.2, fuzileiro: 2.2, incendiario: 2.2, medico: 2.15,
    lanceiro: 2.4, tanque: 1.7, drone: 1.5,
    /* O cão é baixo e o trator é largo e baixo: nenhum dos dois tem altura de
       gente, e desenhá-los com 2,2 faria um cachorro do tamanho de um soldado. */
    cao: 1.15, trator: 1.6,
    /* Nos invasores a altura acompanha o `raio` de data.js, que é a escala que a
       simulação já usa: o Titã e a Matriarca precisam ocupar a tela como ocupam
       o campo, senão o chefe chega e não assusta ninguém. */
    predador: 1.6, corredor: 1.4, cuspidor: 1.6, detonador: 1.7,
    couracado: 1.7, asa: 1.8, tita: 2.9, matriarca: 4
  };

  /* Fração da altura ocupada pelas pernas, do pé até o quadril. Só bípede: o
     Predador anda em quatro patas e cortá-lo na cintura não quer dizer nada.
     Quem não está aqui é desenhado inteiro, sem corte. */
  Anima.PERNAS = {
    operario: 0.47, fuzileiro: 0.47, incendiario: 0.47,
    medico: 0.47, lanceiro: 0.46, tita: 0.44
  };

  /* GALOPE DOS QUADRÚPEDES.
     Cortar um bicho de quatro patas na cintura e girar as metades não quer
     dizer nada — a perna dianteira e a traseira fazem coisas diferentes, e o
     resultado é o bicho se partindo ao meio. Sem isso, eles simplesmente
     DESLIZAVAM pelo chão, que é o defeito mais visível que sobrou no jogo.

     O que resolve com uma imagem só é o que a animação limitada sempre fez:
     o corpo inteiro SOBE E DESCE e o eixo dele BALANÇA, no ritmo da passada.
     Um quadrúpede em galope tem DOIS impulsos por ciclo — daí o seno em
     dobro no salto — e joga o peso para a frente e para trás, que é a
     inclinação. O squash no aterrissar é o que dá o peso.

     `salto` em pixels, `balanco` em radianos, `peso` é o squash. Bicho pesado
     salta pouco e afunda muito; bicho leve salta alto e quase não afunda. */
  /* Quem é MÁQUINA. Serve para a morte: veículo não tomba de lado como gente.
     Fica aqui junto das outras tabelas de corpo porque é a mesma pergunta —
     que tipo de coisa é esta unidade — respondida para um fim diferente. */
  Anima.VEICULO = { tanque: true, drone: true, trator: true };

  Anima.GALOPE = {
    corredor:  { salto: 3.4, balanco: 0.07, peso: 0.05 },
    predador:  { salto: 2.2, balanco: 0.05, peso: 0.06 },
    cuspidor:  { salto: 1.3, balanco: 0.03, peso: 0.07 },
    couracado: { salto: 1.1, balanco: 0.025, peso: 0.08 },
    detonador: { salto: 2.6, balanco: 0.06, peso: 0.05 },
    matriarca: { salto: 1.4, balanco: 0.03, peso: 0.07 },
    /* O cão é o mais leve de todos: salta alto e quase não afunda. */
    cao:       { salto: 3.8, balanco: 0.08, peso: 0.04 }
  };

  /* BRAÇO SOLTO: tentado e descartado, e fica registrado para ninguém tentar de
     novo do mesmo jeito. Recortar uma janela retangular sobre a lateral do corpo
     e girá-la no ombro funciona com a perna, mas não com o braço: a perna está
     na borda de baixo da figura, onde só há perna; o braço está NO MEIO do
     tronco, e o retângulo leva junto um naco do peito e da mochila. Girado, esse
     naco aparece deslocado como um borrão no ombro — fica pior do que sem
     animação nenhuma.
     Para o braço se mover de verdade seria preciso a arte com o braço em camada
     separada, gerada por cima de um corpo sem braço. É trabalho de arte, não de
     código. Até lá, quem carrega o movimento é o giro do tronco. */

  /* Abertura máxima da perna. 0,58 rad ≈ 33°: o quadril humano faz ~30° numa
     caminhada, e personagem de jogo exagera um pouco porque aparece pequeno na
     tela. Abrir mais aqui NÃO traz o deslizamento de volta — só faz o passo ser
     mais largo e, por consequência, mais espaçado. Quem casa uma coisa com a
     outra é a distância percorrida, logo abaixo. */
  var ABERTURA = 0.58;
  var SENO_ABERTURA = Math.sin(ABERTURA);

  function pernaEm(tipo, z) {        /* comprimento quadril→pé, em pixels de tela */
    return (Anima.ALTURA[tipo] || 1.3) * ALT * (Anima.PERNAS[tipo] || 0.45) * (z || 1);
  }

  /* O ângulo de `u.angulo` é do MUNDO; a tela é isométrica. Um passo de mundo
     (dx, dy) anda (dx - dy) na horizontal da tela. É esse sinal que diz se a
     figura está indo para a direita ou para a esquerda de quem olha. */
  function paraDireitaNaTela(angulo) {
    return Math.cos(angulo) - Math.sin(angulo) >= 0;
  }

  Anima.prototype.esquecer = function (id) {
    delete this.onde[id]; delete this.hpVisto[id];
    delete this.tremor[id]; delete this.morte[id]; delete this.passo[id];
  };

  /* Chamado uma vez por quadro, antes de desenhar. */
  Anima.prototype.avancar = function (sim, dt) {
    var vivos = {};
    for (var i = 0; i < sim.unidades.length; i++) {
      var u = sim.unidades[i];
      vivos[u.id] = true;

      if (u.morta) {
        this.morte[u.id] = (this.morte[u.id] || 0) + dt;
        continue;
      }

      /* Dano: sem evento próprio na simulação, a queda de vida entre dois
         quadros é o sinal. Um quarto de segundo de tremida por golpe. */
      var antes = this.hpVisto[u.id];
      if (antes !== undefined && u.hp < antes) this.tremor[u.id] = 0.28;
      this.hpVisto[u.id] = u.hp;

      if (this.tremor[u.id] > 0) {
        this.tremor[u.id] -= dt;
        if (this.tremor[u.id] <= 0) delete this.tremor[u.id];
      }

      /* A PASSADA ANDA POR DISTÂNCIA PERCORRIDA, NÃO PELO RELÓGIO.
         É o que impede o pé de patinar. A perna, girando de +A a −A, leva o pé
         para trás 2·L·sen(A) em relação ao corpo. Se o corpo avança exatamente
         isso no mesmo meio-ciclo, o pé fica parado no chão e o personagem anda.
         Amarrado ao tempo, corpo e pé correm a velocidades diferentes e o boneco
         desliza — era esse o defeito.
         Em isométrico quem entra na conta é o deslocamento HORIZONTAL em tela:
         unidade andando "para dentro" do mapa quase não anda de lado, e a perna
         quase não deve abrir. Sai de graça ao medir o passo em pixels. */
      var ant = this.onde[u.id];
      if (u.rota && ant) {
        var dxTela = ((u.x - ant.x) - (u.y - ant.y)) * (LARG / 2);
        var meioPasso = 2 * pernaEm(u.tipo, 1) * SENO_ABERTURA;
        if (meioPasso > 0) {
          this.passo[u.id] =
            ((this.passo[u.id] || 0) + Math.PI * Math.abs(dxTela) / meioPasso) % 6.283;
        }
      } else if (this.passo[u.id]) {
        /* parou: volta ao repouso em vez de congelar no meio do passo */
        var p = this.passo[u.id];
        var alvo = p < 3.1416 ? 0 : 6.283;
        this.passo[u.id] = U.lerp(p, alvo, Math.min(1, dt * 9));
        if (Math.abs(this.passo[u.id] - alvo) < 0.05) delete this.passo[u.id];
      }

      if (ant) { ant.x = u.x; ant.y = u.y; }
      else this.onde[u.id] = { x: u.x, y: u.y };
    }
    for (var id in this.onde) if (!vivos[id]) this.esquecer(id);
    for (id in this.morte) if (!vivos[id]) this.esquecer(id);
  };

  /* Ângulo da perna da frente agora, em radianos. Zero parado.
     A curva NÃO é um seno. Com θ = A·sen(fase), o pé só fica parado num
     instante — no meio do apoio ele ainda escorrega metade da velocidade do
     corpo, e nenhuma escolha de A conserta isso. O que precisa ser reto na fase
     é sen(θ), porque é sen(θ) que vira posição horizontal do pé. Daí o `asin`:
     durante o apoio o pé anda para trás em linha reta e a velocidade constante,
     que é exatamente o que um pé plantado faz enquanto o corpo passa por cima.
     No balanço, com o pé no ar, a curva volta a ser suave. */
  Anima.prototype.passada = function (u) {
    var fase = this.passo[u.id];
    if (fase === undefined || u.voa || this.morte[u.id] !== undefined) return 0;
    var s;
    if (fase < Math.PI) s = 1 - 2 * (fase / Math.PI);          /* apoio: reto */
    else s = -Math.cos(Math.PI * ((fase - Math.PI) / Math.PI)); /* balanço: suave */
    return Math.asin(SENO_ABERTURA * s);
  };

  /* A perna do ar é a OPOSTA da plantada — daí o sinal trocado. E ela abre mais:
     o quadril humano leva a coxa a ~30° para a frente e só ~10° para trás, o
     passo é assimétrico. Quem não pode ser tocado é a perna de apoio: é ela que
     segura o pé no chão, e qualquer viés ali traz o deslizamento de volta. A
     assimetria fica toda aqui, na perna que não encosta em nada. */
  Anima.prototype.passadaAr = function (u) {
    var a = -this.passada(u);
    return a > 0 ? a * 1.45 : a * 0.75;
  };

  /* Devolve como desenhar o sprite desta unidade agora.
     { espelhar, giro, subir, desviaX, desviaY, escalaY, alfa } */
  Anima.prototype.postura = function (u, z, sim) {
    var r = { espelhar: false, giro: 0, subir: 0, desviaX: 0, desviaY: 0, escalaY: 1, alfa: 1 };

    /* Voador não tem pé no chão: não pisa, não tomba, não abaixa. */
    var noChao = !u.voa;

    /* `u.angulo` só muda quando a unidade ANDA. Parada e atirando, ela ficaria
       virada para onde caminhou por último — de costas para quem está matando.
       Quem manda na direção é o alvo; o rumo do passo só vale sem alvo. */
    var olhar = u.angulo;
    if (u.alvo && sim) {
      var a = sim.alvoPorId(u.alvo);
      if (a && !a.morta) {
        var c = a.w ? sim.centroDe(a) : a;
        olhar = Math.atan2(c.y - u.y, c.x - u.x);
      }
    }
    if (olhar !== undefined) r.espelhar = !paraDireitaNaTela(olhar);

    var morto = this.morte[u.id];
    if (morto !== undefined && Anima.VEICULO[u.tipo]) {
      /* VEÍCULO NÃO TOMBA. Máquina destruída não cai de lado como gente: ela
         para onde estava e queima. Girar um tanque 83 graus deixava a esteira
         para cima, e o que devia ser uma carcaça fumegante virava um brinquedo
         chutado.
         O que a máquina faz é AFUNDAR um pouco — as suspensões cedem — e
         escurecer. O drone é a exceção que confirma: ele estava no ar, e o que
         ele faz é DESPENCAR, girando enquanto cai. */
      var tv = Math.min(1, morto / 0.6);
      if (u.voa) {
        r.giro = (r.espelhar ? -1 : 1) * 0.9 * tv * tv;
        r.desviaY = 26 * z * tv * tv;          /* a altura do voo, indo a zero */
      } else {
        r.desviaY = 2.5 * z * tv;
        r.escalaY = 1 - 0.06 * tv;
      }
      r.alfa = Math.max(0, 1 - Math.max(0, morto - 0.9) / 0.25);
      return r;
    }
    if (morto !== undefined) {
      /* A MORTE EM TRÊS TEMPOS, e cada um resolve uma coisa:

         1. IMPACTO (até 0,12 s): a figura é jogada para trás e encolhe um
            pouco. Sem isso a unidade começa a tombar como quem se deita, e o
            tiro que a matou não aparece em lugar nenhum.
         2. QUEDA (até 0,55 s): tomba de lado e afunda. A curva é acelerada —
            `t²` — porque corpo que cai ganha velocidade; linear parece que
            alguém está deitando o boneco com a mão.
         3. ENTREGA (a partir de 0,9 s): some devagar enquanto o corpo caído
            desenhado entra no lugar. É a costura entre a queda calculada e o
            cadáver com arte própria. */
      var imp = Math.max(0, 1 - morto / 0.12);
      var t = Math.min(1, Math.max(0, morto - 0.06) / 0.49);
      var queda = t * t;
      r.giro = (r.espelhar ? -1 : 1) * 1.45 * queda;
      r.escalaY = 1 - 0.25 * queda - imp * 0.1;
      r.desviaY = 5 * z * queda;
      r.desviaX = (r.espelhar ? 1 : -1) * imp * 4.5 * z;
      r.alfa = Math.max(0, 1 - Math.max(0, morto - 0.9) / 0.25);
      return r;
    }

    /* O corpo DESCE quando as pernas abrem, e não sobe.
       A perna é o raio: com o pé no chão e o quadril girando sobre ele, o
       quadril fica a L·cos(θ) do chão — mais baixo quanto mais aberta a perna.
       Eu tinha feito o contrário, subindo o corpo na abertura, e era metade da
       sensação de flutuar: o pé de apoio saía do chão e nunca mais encostava.
       São duas descidas por passada, uma por perna, que é o balanço certo. */
    /* Só para quem tem perna recortada: a conta abaixo é do quadril de um
       BÍPEDE girando sobre o pé de apoio. Aplicada a um quadrúpede, ela afunda
       o bicho quase seis pixels por passada, porque o modelo não é o dele. */
    var ang = Anima.PERNAS[u.tipo] ? this.passada(u) : 0;
    if (ang && noChao) {
      var L = pernaEm(u.tipo, z);
      r.subir = -L * (1 - Math.cos(ang));
      r.escalaY = 1 - Math.abs(ang) * 0.03;
    }

    /* RESPIRAÇÃO DA UNIDADE PARADA.
       Unidade que não se mexe não parece calma: parece congelada, e um mapa
       com trinta estátuas parece um jogo travado. O ganho é enorme para o
       custo, que é um seno.

       Três cuidados que fazem a diferença entre respirar e pulsar:
       - a FASE vem do id da unidade. Sem isso o pelotão inteiro inflaria e
         esvaziaria junto, como um coração só — que é pior que estátua;
       - o ritmo é o de um corpo em repouso — dezessete ciclos por minuto, que é
         o meio da faixa de quinze a vinte que a referência de animação dá para
         alguém relaxado — e não o da animação de andar;
       - o corpo ESTICA para cima e encolhe de volta; ele não sobe. Subir e
         descer é pulo, e a unidade parada não pula.
       Vale só para quem está mesmo parado: andando, atacando ou morrendo há
       movimento demais para caber mais um. */
    if (noChao && !u.rota && !u.morta && !u.alvo) {
      var respira = Math.sin((sim ? sim.t : 0) * 1.78 + (u.id % 17) * 0.41);
      r.escalaY *= 1 + respira * 0.012;
      /* o ombro sobe um triz junto com o peito, senão a figura parece esticar
         a partir do chão em vez de inflar */
      r.subir += respira * 0.35 * z;
    }

    /* Galope: vale para quem NÃO tem pernas recortadas. Quem tem já anda pela
       perna; somar o salto por cima faria o bípede quicar. */
    var gal = Anima.GALOPE[u.tipo];
    if (gal && !Anima.PERNAS[u.tipo] && u.rota && noChao) {
      var fase = this.passo[u.id] || 0;
      var dobro = Math.sin(fase * 2);              /* dois impulsos por ciclo */
      var alto = Math.max(0, dobro);               /* só sobe; não afunda no chão */
      r.subir += alto * gal.salto * z;
      r.giro += Math.sin(fase) * gal.balanco * (r.espelhar ? -1 : 1);
      /* achata ao tocar o chão e estica no ar — squash and stretch */
      r.escalaY *= 1 + (alto - 0.5) * gal.peso;
    }

    /* Inclinação para a frente enquanto corre: quanto mais rápida, mais deitada. */
    if (u.rota && noChao) {
      r.giro += (r.espelhar ? 0.09 : -0.09) * Math.min(1.6, (u.def.vel || 2.5) / 2.8);
    }

    /* Coice do tiro: `recarga` volta ao valor cheio no instante do disparo e
       desce até zero. O recuo é o começo dessa descida. */
    var arma = u.def.arma;
    if (arma && u.recarga > 0) {
      var desde = 1 - (u.recarga / arma.cad);        /* 0 = acabou de atirar */
      if (desde < 0.22) {
        var forca = (1 - desde / 0.22);
        r.desviaX += (r.espelhar ? 1 : -1) * forca * 3.4 * z;
        r.giro += (r.espelhar ? -1 : 1) * forca * 0.07;
      }
    }

    /* Picareta: o tronco levanta devagar e desce rápido, como quem toma impulso
       e bate. Não é um seno — seno sobe e desce no mesmo ritmo, e o golpe perde
       a pancada. As PERNAS ficam plantadas; quem gira é só a metade de cima,
       e é isso que faz ler como ferramenta batendo e não como corpo cambaleando.
       Só vale quando a unidade está de fato trabalhando: o operário andando até
       a jazida não bate picareta nenhuma. */
    var tarefa = u.tarefa;
    var trabalhando = !u.rota && tarefa && (
      (tarefa.tipo === 'minerar' && tarefa.estado === 'coletando') ||
      tarefa.tipo === 'construir' || tarefa.tipo === 'reparar');
    if (trabalhando) {
      var ciclo = (((sim ? sim.t : 0) * 1.7 + (u.animacao || 0)) % 1);
      var g = ciclo < 0.68
        ? -(ciclo / 0.68)                       /* levanta a ferramenta */
        : ((ciclo - 0.68) / 0.32) * 2 - 1;      /* desaba em cima da pedra */
      r.golpe = (r.espelhar ? -1 : 1) * (0.1 + g * 0.42);
      r.subir += Math.min(0, -g) * 1.2 * z;     /* agacha um pouco na batida */
    }


    var trem = this.tremor[u.id];
    if (trem > 0) {
      var f = trem / 0.28;
      r.desviaX += (Math.random() - 0.5) * 5 * z * f;
      r.desviaY += (Math.random() - 0.5) * 3 * z * f;
    }

    return r;
  };

  /* Qual das oito direções a unidade está olhando, e se o desenho precisa ser
     espelhado. Só CINCO são desenhadas — leste, nordeste, norte, sudeste, sul —
     e as outras três saem espelhando as diagonais e o leste. É exatamente o que
     o Age of Empires fazia (5 desenhadas, 3 espelhadas) e o StarCraft (17 de 32):
     nem eles desenhavam tudo, porque metade do círculo é o espelho da outra.
     O ângulo aqui é o da TELA, não o do mundo: em isométrico um passo de mundo
     (dx,dy) anda (dx−dy) na horizontal e (dx+dy)/2 na vertical. */
  Anima.prototype.direcao = function (u, sim) {
    var olhar = u.angulo;
    if (u.alvo && sim) {
      var a = sim.alvoPorId(u.alvo);
      if (a && !a.morta) {
        var c = a.w ? sim.centroDe(a) : a;
        olhar = Math.atan2(c.y - u.y, c.x - u.x);
      }
    }
    if (olhar === undefined) return { nome: 'sul', espelhar: false };

    var cx = Math.cos(olhar), cy = Math.sin(olhar);
    var tx = cx - cy;                 /* horizontal na tela */
    var ty = (cx + cy) / 2;           /* vertical na tela: positivo desce */
    var esp = tx < 0;                 /* indo para a esquerda: espelha */
    var ax = Math.abs(tx), ay = Math.abs(ty);

    var nome;
    if (ay > ax * 1.6) nome = ty > 0 ? 'sul' : 'norte';       /* quase vertical */
    else if (ax > ay * 2.2) nome = 'leste';                    /* quase horizontal */
    else nome = ty > 0 ? 'sudeste' : 'nordeste';               /* diagonal */
    /* sul e norte são de frente e de costas: espelhá-los não muda quase nada e
       evita que a mochila salte de lado quando a unidade cruza o eixo. */
    if (nome === 'sul' || nome === 'norte') esp = false;
    return { nome: nome, espelhar: esp };
  };

  UF.Anima = Anima;
}(window.UF = window.UF || {}));
