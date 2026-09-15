/* Última Fronteira — catálogo de regras.
   Todos os números aqui são as propostas de protótipo do documento de projeto
   (páginas 10 a 14). Ficam reunidos em um só lugar para facilitar o equilíbrio. */
(function (global) {
  'use strict';
  var UF = global.UF || (global.UF = {});

  /* ---------------------------------------------------------------- terreno */
  var TERRENO = {
    ASFALTO: 0,   /* rua, praça, terreno aberto — constrói e anda */
    ROCHA: 1,     /* maciço, rocha exposta — bloqueia */
    AGUA: 2,      /* rio, baía, mar — bloqueia por terra */
    ESCOMBRO: 3,  /* entulho — anda, mas não constrói */
    RUINA: 4      /* prédio arruinado de pé — bloqueia */
  };
  TERRENO.PLANICIE = TERRENO.ASFALTO;
  TERRENO.CRATERA = TERRENO.ESCOMBRO;

  /* ------------------------------------------------------------- estruturas */
  /* papel 'deposito' recebe carga de minério; 'torre' atira sozinha.
     energia > 0 consome capacidade elétrica; fornece > 0 gera capacidade. */
  /* GUARNIÇÃO. `guarnicao` é quantos cabem dentro. O Age of Empires II põe até
     5 numa torre e a torre vazia atira 5 flechas contra 21 guarnecida; o
     StarCraft põe 4 no Bunker, que sozinho não atira nada. Ficamos no meio: a
     torre atira por conta própria E quem está dentro atira junto, com a arma
     que trouxe — por isso um Lanceiro dentro de uma torre de solo passa a
     cobrir o ar, que é decisão de quem guarnece e não número nosso.

     A Central leva 10 e NÃO atira: ali a guarnição é abrigo, que é o uso que
     importa — esconder operário do ataque e dar lugar seguro ao ferido.

     BLINDAGEM DE ESTRUTURA. Nenhum prédio tinha `blind`: torre, muro e Central
     absorviam dano cheio enquanto a tropa já subtraía desde sempre. O Age of
     Empires II nunca fez assim — lá a Watch Tower NASCE com 1/7 de armadura, e
     Masonry/Architecture melhoram isso em todo prédio.

     Os números são baixos de propósito. `aplicarDano` subtrai com piso de 12%,
     e na faixa baixa isso é violento: contra o tiro de 7 do Corredor, cada
     ponto vale 14% do dano. Muro e Central levam 2 porque é o que eles existem
     para fazer — absorver; a torre leva 1 porque o diagnóstico do projeto é que
     empilhar torre NÃO pode sustentar a campanha, e armadura de torre é
     exatamente a alavanca que sustentaria. Medido com `equilibrio.cjs`. */
  var ESTRUTURAS = {
    central: {
      nome: 'Central de Comando', cat: 'base', w: 4, h: 4, hp: 3200, blind: 2, guarnicao: 10, tempo: 0,
      custo: { m: 0 }, papel: 'deposito', produz: ['operario', 'trator'], visao: 11, fornece: 8,
      desc: 'Produz operários, recebe minério e concentra as ordens globais. Fornece 8 de energia. Perdê-la encerra a partida.'
    },
    alojamento: {
      nome: 'Alojamento', cat: 'base', w: 2, h: 2, hp: 620, blind: 1, tempo: 10,
      custo: { m: 100 }, pop: 10, visao: 6, req: { ed: 'central' },
      desc: 'Aumenta a capacidade de população em 10.'
    },
    /* Quatro formas de gerar energia, cada uma com um defeito próprio — é o que
       transforma "aperte o botão do gerador" em decisão. A chave `gerador`
       continua a mesma de propósito: ela é a base do equilíbrio já medido, e
       trocá-la invalidaria as partidas salvas. Só o nome e a arte mudaram. */
    gerador: {
      nome: 'Usina solar', cat: 'base', w: 2, h: 2, hp: 520, blind: 1, tempo: 10,
      custo: { m: 100 }, fornece: 12, visao: 6, req: { ed: 'central' },
      desc: 'Barata e resistente. Fornece 12 de energia e ocupa pouco. Em déficit, a produção avançada pausa.'
    },
    eolica: {
      nome: 'Usina eólica', cat: 'base', w: 2, h: 2, hp: 300, blind: 1, tempo: 13,
      custo: { m: 150 }, fornece: 21, visao: 8, req: { ed: 'central' },
      desc: 'Quase o dobro de energia da solar no mesmo espaço. Torre alta e frágil: cai fácil sob fogo.'
    },
    nuclear: {
      nome: 'Usina nuclear', cat: 'base', w: 3, h: 3, hp: 900, blind: 1, tempo: 26,
      custo: { m: 300 }, fornece: 55, visao: 7, req: { tech: 2 },
      desc: 'Resolve a energia da base inteira sozinha. Cara, lenta de erguer e grande demais para esconder.'
    },
    fusao: {
      nome: 'Reator de fusão', cat: 'base', w: 3, h: 3, hp: 1150, blind: 1, tempo: 34,
      custo: { m: 480, c: 90 }, fornece: 95, visao: 8, req: { tech: 3 },
      desc: 'Mais energia que todas as outras juntas. Exige tecnologia III e barris de petróleo.'
    },
    deposito: {
      nome: 'Depósito avançado', cat: 'base', w: 2, h: 2, hp: 700, blind: 1, tempo: 12,
      custo: { m: 120 }, papel: 'deposito', visao: 7, req: { ed: 'central' },
      desc: 'Recebe carga mineral. Encurta o trajeto de jazidas distantes.'
    },
    quartel: {
      nome: 'Quartel', cat: 'producao', w: 3, h: 3, hp: 950, blind: 1, tempo: 16,
      custo: { m: 150 }, energia: 4, visao: 7, req: { ed: 'central' },
      produz: ['fuzileiro', 'cao', 'incendiario', 'medico'],
      desc: 'Produz fuzileiros e tropas de apoio. Define ponto de encontro.'
    },
    oficina: {
      nome: 'Oficina', cat: 'producao', w: 3, h: 3, hp: 1150, blind: 1, tempo: 22,
      custo: { m: 220 }, energia: 6, visao: 7, req: { ed: 'quartel', tech: 2 },
      produz: ['lanceiro', 'drone', 'tanque'],
      desc: 'Produz unidades pesadas. Exige Quartel e tecnologia II.'
    },
    pesquisa: {
      nome: 'Centro de Pesquisa', cat: 'tecnologia', w: 3, h: 3, hp: 860, blind: 1, tempo: 18,
      custo: { m: 180 }, energia: 5, visao: 7, req: { ed: 'central' },
      desc: 'Executa uma pesquisa por vez. Destruí-lo pausa a pesquisa em curso.'
    },
    extrator: {
      nome: 'Bomba de petróleo', cat: 'tecnologia', w: 2, h: 2, hp: 640, blind: 1, tempo: 14,
      custo: { m: 150 }, energia: 3, visao: 5, sobre: 'petroleo', req: { tech: 2 },
      desc: 'Instalada sobre um afloramento de petróleo. Bombeia sozinha, sem operário.'
    },
    radar: {
      nome: 'Radar', cat: 'tecnologia', w: 2, h: 2, hp: 540, blind: 1, tempo: 14,
      custo: { m: 140 }, energia: 3, visao: 17, req: { ed: 'pesquisa' },
      desc: 'Amplia a visão e antecipa a direção e a força do próximo ataque.'
    },
    muro: {
      nome: 'Muro', cat: 'defesa', w: 1, h: 1, hp: 560, blind: 2, tempo: 2.5,
      custo: { m: 12 }, arrasto: true, muro: true, visao: 3,
      desc: 'Bloqueia tropas terrestres. Não impede voo nem fogo indireto.'
    },
    portao: {
      nome: 'Portão', cat: 'defesa', w: 2, h: 1, hp: 660, blind: 2, tempo: 5,
      custo: { m: 40 }, portao: true, muro: true, visao: 4,
      desc: 'Abre para aliados e fecha quando um inimigo se aproxima.'
    },
    /* Torre de muralha e bastião são muro E torre ao mesmo tempo: ocupam a linha
       da muralha, bloqueiam como muro (e ganham o bônus de muroReforcado) e
       atiram como torre. Não têm `arrasto`: planta-se uma de cada vez, como no
       Age of Empires — arrastar uma fila delas sairia mais barato que a
       Sentinela por célula coberta e mataria as outras torres. */
    torreMuralha: {
      nome: 'Torre de muralha', cat: 'defesa', w: 1, h: 1, hp: 620, blind: 1, guarnicao: 2, tempo: 6,
      custo: { m: 45 }, energia: 1, muro: true, papel: 'torre', visao: 7,
      arma: { dano: 9, cad: 0.7, alc: 6, ar: true, solo: true, vel: 17, cor: '#7fd7ff' },
      desc: 'Encaixa na muralha e atira. Alcance curto: vale pela linha, não sozinha.'
    },
    bastiao: {
      nome: 'Bastião', cat: 'defesa', w: 2, h: 2, hp: 980, blind: 1, guarnicao: 5, tempo: 13,
      custo: { m: 130 }, energia: 3, muro: true, papel: 'torre', visao: 9, req: { tech: 2 },
      arma: { dano: 21, cad: 0.8, alc: 8, ar: true, solo: true, vel: 17, cor: '#7fd7ff' },
      /* A mesma aura, fixa no terreno: é o que dá ao Bastião um papel que a
         Sentinela não tem além de atirar mais forte — ele é o ponto da linha
         onde vale a pena a tropa ficar. */
      aura: { blind: 1, raio: 5.5, nome: 'Cobertura do bastião' },
      desc: 'Ponto forte da muralha: a parede encaixa pelos quatro lados e dá +1 de blindagem à tropa em volta. Caro por célula.'
    },
    sentinela: {
      nome: 'Sentinela', cat: 'defesa', w: 2, h: 2, hp: 560, blind: 1, guarnicao: 4, tempo: 8,
      custo: { m: 80 }, energia: 2, papel: 'torre', visao: 9,
      arma: { dano: 14, cad: 0.55, alc: 7.5, ar: true, solo: true, vel: 17, cor: '#7fd7ff' },
      desc: 'Tiro rápido contra solo e ar. Boa cobertura geral, dano baixo por tiro.'
    },
    gelo: {
      nome: 'Torre de Gelo', cat: 'defesa', w: 2, h: 2, hp: 520, blind: 1, guarnicao: 4, tempo: 9,
      custo: { m: 110 }, energia: 2, papel: 'torre', visao: 8, req: { tech: 2 },
      arma: { dano: 7, cad: 0.8, alc: 6.5, ar: false, solo: true, vel: 13, lentidao: 0.45, cor: '#9ff0ff' },
      desc: 'Desacelera alvos terrestres em 45%. Segura a pressão sobre os muros.'
    },
    artilharia: {
      nome: 'Artilharia', cat: 'defesa', w: 2, h: 2, hp: 620, blind: 1, guarnicao: 4, tempo: 12,
      custo: { m: 145 }, energia: 3, papel: 'torre', visao: 10, req: { tech: 2 },
      arma: { dano: 51, cad: 2.1, alc: 10, alcMin: 2.2, ar: false, solo: true, vel: 9, area: 1.7, cor: '#ffb457' },
      desc: 'Dano em área contra solo. Alcance mínimo: fica exposta de perto.'
    },
    plasma: {
      nome: 'Torre de Plasma', cat: 'defesa', w: 2, h: 2, hp: 680, blind: 1, guarnicao: 4, tempo: 14,
      custo: { m: 190, c: 40 }, energia: 4, papel: 'torre', visao: 9, req: { tech: 3 },
      arma: { dano: 43, cad: 1.15, alc: 8.5, ar: true, solo: true, vel: 20, perfura: true, cor: '#d79bff' },
      desc: 'Ignora blindagem e atinge solo e ar. Exige tecnologia III e barris de petróleo.'
    }
  };

  /* ------------------------------------------------------------- unidades */
  var UNIDADES = {
    operario: {
      nome: 'Operário', raio: 0.26, custo: { m: 50 }, pop: 1, tempo: 12, hp: 90, vel: 2.5, visao: 6,
      carga: 8, coleta: 4, obra: 1, construtor: true,
      arma: { dano: 5, cad: 1.2, alc: 1.1, solo: true, ar: false, vel: 12 },
      desc: 'Minera, constrói, repara e explora. Frágil: morre com a carga que levava.'
    },
    fuzileiro: {
      nome: 'Fuzileiro', raio: 0.27, custo: { m: 60 }, pop: 1, tempo: 11, hp: 130, vel: 2.7, visao: 8, blind: 0,
      arma: { dano: 24, cad: 1.4, alc: 5.5, solo: true, ar: true, vel: 18, cor: '#ffe9a8' },
      desc: 'Tiro rápido contra solo e ar. Frágil quando cercado.'
    },
    /* TRATOR DE LIMPEZA. A cidade arruinada é o mapa inteiro, e até agora ela
       era só obstáculo: ruína bloqueia, entulho não deixa construir. O trator
       transforma terreno em espaço — derruba a ruína (vira entulho, e abre
       caminho onde não havia) e limpa o entulho (vira chão aberto, e aí dá
       para construir).

       É a única unidade do jogo que MUDA O MAPA, e por isso é lenta, cara para
       o que faz e não atira. `limpeza` são os segundos por célula. Sai da
       Central porque é máquina de obra, não de guerra, e porque assim o
       jogador tem a escolha da primeira hora: mais um operário ou o trator que
       abre a quadra ao lado. */
    trator: {
      nome: 'Trator de limpeza', raio: 0.44, custo: { m: 110 }, pop: 2, tempo: 14, hp: 260, vel: 1.9,
      visao: 6, blind: 2, operario: false, limpeza: 4.5,
      desc: 'Derruba ruína e limpa entulho: abre caminho e libera terreno para construir.'
    },
    /* CÃO DE GUERRA. O papel que faltava na nossa lista: a unidade rápida e
       barata que chega ANTES. Todo mundo que já tínhamos é lento — o mais
       veloz em terra era o Fuzileiro, com 2,7 — e por isso ninguém conseguia
       alcançar o Corredor (4,1), que é justamente quem vai atrás dos
       operários. O cão corre 4,6 e resolve essa conta.

       Paga por isso sendo de vidro: 80 de vida, nenhuma blindagem e mordida de
       perto. Morre em um golpe de área, e é assim que não vira a resposta para
       tudo — contra o Incendiário ou o Cuspidor, mandar cães é jogá-los fora.
       Enxerga 10, mais que qualquer um: o cão também é o batedor.

       Alcance 1,2 é corpo a corpo de verdade: abaixo de 1,6 o dano é aplicado
       na hora e o desenho mostra arco de garra, sem projétil nenhum. */
    cao: {
      nome: 'Cão de guerra', raio: 0.24, custo: { m: 55 }, pop: 1, tempo: 8, hp: 80, vel: 4.6, visao: 10, blind: 0,
      arma: { dano: 26, cad: 0.87, alc: 1.2, solo: true, ar: false, vel: 12 },
      desc: 'Rápido e barato. Alcança quem foge e enxerga longe; morre fácil em área.'
    },
    incendiario: {
      nome: 'Incendiário', raio: 0.3, custo: { m: 90 }, pop: 2, tempo: 15, hp: 200, vel: 2.4, visao: 7, blind: 1,
      arma: { dano: 34, cad: 1.87, alc: 2.6, solo: true, ar: false, vel: 14, area: 1.5, cor: '#ff8a4c' },
      desc: 'Dano em cone curto contra enxames no solo.'
    },
    medico: {
      nome: 'Médico de campo', raio: 0.26, custo: { m: 90, c: 15 }, pop: 1, tempo: 14, hp: 120, vel: 2.8, visao: 7,
      cura: { taxa: 14, alc: 4, reserva: 320 }, req: { tech: 2 },
      /* AURA. Warcraft III: a Devotion Aura dá armadura num raio fixo, é
         passiva, não tem botão e auras iguais NÃO somam. O que ela compra é
         posicionamento — a tropa espalhada perde o bônus e a tropa junta
         ganha, sem nenhum clique no meio.

         Mora no Médico porque ele já é a âncora natural da formação: quem
         fica perto dele se cura, e agora também apanha menos. Concentrar as
         duas coisas na mesma unidade é o que transforma "levar médico" em
         "manter a bola junto do médico", que é a decisão. */
      aura: { blind: 1, raio: 4.5, nome: 'Cobertura médica' },
      desc: 'Recupera soldados próximos com reserva limitada e dá +1 de blindagem a quem fica perto. Precisa de proteção.'
    },
    lanceiro: {
      nome: 'Lanceiro pesado', raio: 0.32, custo: { m: 120, c: 20 }, pop: 2, tempo: 18, hp: 230, vel: 2.2, visao: 8, blind: 2,
      arma: { dano: 46, cad: 1.5, alc: 5.2, solo: true, ar: true, vel: 16, perfura: true, cor: '#b8f0d0' },
      desc: 'Eficiente contra blindagem. Rende pouco contra muitos alvos leves.'
    },
    drone: {
      nome: 'Drone antiaéreo', raio: 0.3, custo: { m: 140, c: 30 }, pop: 2, tempo: 16, hp: 160, vel: 3.6, visao: 9, voa: true,
      arma: { dano: 45, cad: 1.47, alc: 6.2, solo: false, ar: true, vel: 22, cor: '#8fd9ff' },
      desc: 'Interceta voadores. Não consegue atacar alvos terrestres.'
    },
    tanque: {
      nome: 'Tanque de cerco', raio: 0.42, custo: { m: 200, c: 50 }, pop: 3, tempo: 24, hp: 380, vel: 1.6, visao: 10, blind: 3,
      arma: { dano: 72, cad: 2.6, alc: 9.5, alcMin: 2, solo: true, ar: false, vel: 10, area: 2, cor: '#ffd27f' },
      desc: 'Alcance e área. Lento, sem ataque aéreo e vulnerável de perto.'
    }
  };

  /* ------------------------------------------------------------- invasores */
  /* alvo: 'estrutura' vai ao comando; 'economia' caça operários e depósitos;
     'tropa' encosta no que estiver mais perto. */
  var INVASORES = {
    predador: {
      nome: 'Predador', hp: 150, vel: 2.6, blind: 1, valor: 6, mira: 'tropa', visao: 7,
      arma: { dano: 20, cad: 1.6, alc: 1.2, solo: true, ar: false, vel: 12 },
      cor: '#f06a6a', raio: 0.32,
      desc: 'Pressiona muros e soldados próximos; entra assim que surge uma brecha.'
    },
    corredor: {
      nome: 'Corredor', hp: 95, vel: 4.1, blind: 0, valor: 5, mira: 'economia', visao: 9,
      arma: { dano: 14, cad: 1.2, alc: 1.1, solo: true, ar: false, vel: 12 },
      cor: '#ffa14a', raio: 0.28,
      desc: 'Busca aberturas e rotas econômicas desprotegidas.'
    },
    cuspidor: {
      nome: 'Cuspidor', hp: 130, vel: 2.1, blind: 0, valor: 8, mira: 'estrutura', visao: 9, acido: true,
      arma: { dano: 18, cad: 1.6, alc: 5.4, solo: true, ar: false, vel: 11, cor: '#b6ff6a' },
      cor: '#9bd94a', raio: 0.33,
      desc: 'Ataca de longe. Exige resposta com alcance ou tropas móveis.'
    },
    detonador: {
      nome: 'Detonador', hp: 175, vel: 2.9, blind: 0, valor: 9, mira: 'estrutura', visao: 8, suicida: true,
      arma: { dano: 108, cad: 3, alc: 1.2, solo: true, ar: false, vel: 12, area: 2.2 },
      cor: '#ff7fd0', raio: 0.34,
      desc: 'Explode sobre grupos de estruturas e segmentos de muro.'
    },
    couracado: {
      nome: 'Couraçado', hp: 520, vel: 1.7, blind: 6, valor: 16, mira: 'estrutura', visao: 7,
      arma: { dano: 26, cad: 1.5, alc: 1.4, solo: true, ar: false, vel: 12 },
      cor: '#8e9bb5', raio: 0.42,
      desc: 'Absorve tiros na frente e protege as unidades de apoio.'
    },
    asa: {
      nome: 'Asa corrosiva', hp: 165, vel: 3.4, blind: 1, valor: 12, mira: 'economia', visao: 9, voa: true, acido: true,
      arma: { dano: 24, cad: 1.54, alc: 2.2, solo: true, ar: false, vel: 14 },
      cor: '#c58cff', raio: 0.3,
      desc: 'Cruza o perímetro e pressiona operários ou estruturas relevantes.'
    },
    tita: {
      nome: 'Titã', hp: 1150, vel: 1.4, blind: 8, valor: 34, mira: 'estrutura', visao: 8, cerco: true,
      arma: { dano: 78, cad: 2.2, alc: 2.4, solo: true, ar: false, vel: 10, area: 1.6 },
      cor: '#ff5d46', raio: 0.55,
      desc: 'Abre brechas e ameaça os núcleos defensivos.'
    },
    matriarca: {
      nome: 'Matriarca', hp: 5200, vel: 1.5, blind: 10, valor: 120, mira: 'estrutura', visao: 12, chefe: true, cerco: true,
      arma: { dano: 106, cad: 2, alc: 3, solo: true, ar: false, vel: 10, area: 2.4 },
      cor: '#ff3f8f', raio: 0.8,
      desc: 'Combina reforços, fúria e bombardeios anunciados.'
    }
  };

  /* ONDE CADA PESQUISA MORA.
     O campo `casa` diz em que estrutura a melhoria aparece para ser feita, e é
     o modelo do Age of Empires: a ferraria faz arma e armadura, o mosteiro faz
     as do monge. Dá segundo emprego a prédio que só tinha um, e faz o jogador
     escolher o que construir pensando no que quer pesquisar.

     O Centro de Pesquisa continua sendo PRÉ-REQUISITO de todas — é ele que tem
     o laboratório — e guarda para si o ramo de Comando, que é o dos degraus de
     tecnologia. As outras três moram onde fazem sentido: economia na Central,
     fortificação na Torre de muralha, armamento no Quartel.

     Os três anfitriões foram escolhidos entre os que NÃO exigem tecnologia
     nenhuma (Central 0, Torre de muralha 45 minerais, Quartel 150): nenhuma
     pesquisa pode ficar inalcançável por morar em prédio que ela mesma
     destrava. */
  /* CORPO DAS NOSSAS UNIDADES. Os invasores já tinham `raio` — usado para o
     desenho e para a distância de combate — e as nossas não: caíam no padrão
     0,3 e, pior, não empurravam ninguém. Vinte fuzileiros ficavam exatamente
     nas mesmas coordenadas, um sprite só com dezenove cópias por baixo.
     Os números seguem a escala do Brood War, onde o Zergling ocupa meio
     ladrilho e o Dragoon um inteiro: cão 0,24, fuzileiro 0,27, tanque 0,42. */

  /* -------------------------------------------------------------- pesquisa */
  var PESQUISAS = [
    { id: 'tech2', ramo: 'comando', casa: 'pesquisa', nome: 'Tecnologia II — Fortificação', custo: { m: 250 }, tempo: 40, tech: 2,
      efeito: 'Libera Artilharia, Gelo, Oficina, bomba de petróleo e tropas especializadas.' },
    { id: 'tech3', ramo: 'comando', casa: 'pesquisa', nome: 'Tecnologia III — Reconquista', custo: { m: 400, c: 100 }, tempo: 60, tech: 3, req: ['tech2'],
      efeito: 'Libera Plasma, sensores avançados e as tecnologias finais.' },

    { id: 'carga', ramo: 'economia', casa: 'central', nome: 'Carga reforçada', custo: { m: 120 }, tempo: 28,
      efeito: 'Operários transportam 12 minerais por viagem em vez de 8.' },
    { id: 'coleta', ramo: 'economia', casa: 'central', nome: 'Ferramenta de corte', custo: { m: 160 }, tempo: 32, req: ['carga'],
      efeito: 'Coleta 30% mais rápida em todas as jazidas.' },
    { id: 'logistica', ramo: 'economia', casa: 'central', nome: 'Logística de setor', custo: { m: 220, c: 20 }, tempo: 40, req: ['coleta'], tech: 2,
      efeito: 'Operários andam 20% mais rápido e o extrator rende 40% a mais.' },

    { id: 'muroReforcado', ramo: 'fortificacao', casa: 'torreMuralha', nome: 'Muro reforçado', custo: { m: 150 }, tempo: 30,
      efeito: 'Muros e portões ganham 60% de integridade.' },
    { id: 'reparoEficiente', ramo: 'fortificacao', casa: 'torreMuralha', nome: 'Reparo eficiente', custo: { m: 180 }, tempo: 32, req: ['muroReforcado'],
      efeito: 'Reparos custam 40% menos e são 50% mais rápidos.' },
    /* BLINDAGEM DE TROPA, em dois degraus. É a metade que faltava do nosso
       próprio sistema de dano: os invasores têm `blind` de 0 a 10 — 6 no
       Couraçado, 8 no Titã, 10 na Matriarca — e as nossas tropas tinham 0 a 3
       FIXO, sem nenhuma pesquisa que mexesse nisso. O jogador tinha duas
       alavancas ofensivas e nenhuma defensiva.

       DOIS degraus de +1, e não três, porque a subtração com piso de 12% é
       violenta na faixa baixa: contra o tiro de 7 do Corredor, +2 de blindagem
       já corta o dano quase pela metade. Medido com `equilibrio.cjs` antes e
       depois.

       Moram no QUARTEL, com a arma, que é o que o Age of Empires faz: a
       ferraria cuida das duas linhas. O ramo continua sendo fortificação
       porque é disso que se trata — no manual do Age a ferraria também é
       econômica, e o ramo nunca foi o mesmo que o prédio. */
    { id: 'blindagem1', ramo: 'fortificacao', casa: 'quartel', nome: 'Placas de combate', custo: { m: 170 }, tempo: 30,
      efeito: '+1 de blindagem em toda tropa. Vale mais contra tiro fraco e repetido.' },
    { id: 'blindagem2', ramo: 'fortificacao', casa: 'quartel', nome: 'Placas compostas', custo: { m: 260, c: 40 }, tempo: 40, req: ['blindagem1'], tech: 2,
      efeito: '+1 de blindagem em toda tropa, somando 2 com o degrau anterior.' },

    /* ALVENARIA é o Masonry do Age of Empires: melhora TODO prédio de uma vez,
       inclusive os já construídos, e por isso salva o investimento em vez de
       obrigar a demolir e refazer. Um degrau só, não três: a subtração com
       piso de 12% já é forte, e mais que isso viraria a alavanca que faz
       empilhar torre sustentar a campanha — que é justamente o que o
       diagnóstico do projeto diz que não pode acontecer.
       Mora na Torre de muralha, com o muro reforçado e o reparo: é a linha de
       fortificação inteira num lugar só. */
    { id: 'alvenaria', ramo: 'fortificacao', casa: 'torreMuralha', nome: 'Alvenaria reforçada', custo: { m: 200 }, tempo: 34, req: ['muroReforcado'],
      efeito: '+1 de blindagem e +10% de integridade em TODA estrutura, inclusive as já construídas.' },

    /* TIRO RASANTE é o Murder Holes do Age of Empires II: 200 de comida e 100
       de PEDRA para tirar o alcance mínimo de torres e castelos. Lá o preço em
       pedra é o freio — pedra é o recurso escasso e é o mesmo que paga a
       muralha. Aqui o barril de petróleo faz esse papel.

       O problema que ela resolve é concreto e irritante: a Artilharia tem
       `alcMin` 2,2 e o Tanque 2, então os dois emudecem quando o Predador
       encosta — e o Predador é justamente quem encosta. A torre fica olhando
       o bicho comer a muralha a um metro dela. */
    { id: 'tiroRasante', ramo: 'fortificacao', casa: 'torreMuralha', nome: 'Tiro rasante', custo: { m: 180, c: 40 }, tempo: 34, req: ['muroReforcado'], tech: 2,
      efeito: 'Acaba com o alcance mínimo: Artilharia e Tanque passam a atirar em quem encosta.' },

    { id: 'antiacido', ramo: 'fortificacao', casa: 'torreMuralha', nome: 'Resistência a ácido', custo: { m: 260, c: 40 }, tempo: 45, req: ['reparoEficiente'], tech: 3,
      efeito: 'Reduz pela metade o dano de Cuspidores e Asas corrosivas.' },

    /* PRECISÃO era UMA pesquisa para torre e tropa ao mesmo tempo, e isso não
       é como os clássicos fazem. O Age of Empires II podia melhorar a torre
       junto com o arqueiro porque cobrava PEDRA por ela — recurso separado, e
       o freio estava no preço. O StarCraft simplesmente não melhora defesa
       estática. Nós tínhamos o pior dos dois: um botão só, pago com o minério
       de tudo, que tornava empilhar torre ainda mais atraente.

       Agora são duas compras. A da tropa continua sendo `precisao` e custa o
       mesmo; a da torre é `pontaria` e custa BEM mais caro, em minério.

       A primeira versão cobrava barril, que seria a pedra do Age no nosso
       vocabulário. Medido, não funcionou: o petróleo aparece tarde e em poucas
       partidas, então a torre ficava 18% mais fraca PARA SEMPRE e o
       `equilibrio.cjs` perdeu a vitória do Rio. Isso não é freio, é remoção —
       um preço que não se pode pagar não cria decisão nenhuma. O capítulo 06
       §9.4 já dizia a parte difícil: sem recurso separado, o freio tem de ser
       o preço, e é isso que 220 de minério faz. */
    { id: 'precisao', ramo: 'armamento', casa: 'quartel', nome: 'Precisão de tiro', custo: { m: 140 }, tempo: 28,
      efeito: '+18% de dano para soldados e tropa. Não vale para torres.' },
    { id: 'pontaria', ramo: 'armamento', casa: 'torreMuralha', nome: 'Pontaria automatizada', custo: { m: 220 }, tempo: 30,
      efeito: '+18% de dano para todas as torres. Cara de propósito: defesa estática tem preço próprio.' },
    { id: 'penetracao', ramo: 'armamento', casa: 'quartel', nome: 'Munição perfurante', custo: { m: 210 }, tempo: 35, req: ['precisao'], tech: 2,
      efeito: 'Ignora metade da blindagem inimiga.' },
    { id: 'artilhariaAv', ramo: 'armamento', casa: 'quartel', nome: 'Artilharia avançada', custo: { m: 280, c: 50 }, tempo: 42, req: ['penetracao'], tech: 3,
      efeito: '+35% de raio de explosão e +15% de alcance nas armas de área.' },

    { id: 'formacao', ramo: 'comando', casa: 'pesquisa', nome: 'Treinamento de formação', custo: { m: 160 }, tempo: 30,
      efeito: 'Soldados ganham 20% de integridade.' },
    { id: 'autonomia', ramo: 'comando', casa: 'pesquisa', nome: 'Autonomia de reparo', custo: { m: 200 }, tempo: 34, req: ['formacao'], tech: 2,
      efeito: 'Operários ociosos reparam a linha automaticamente dentro da reserva definida.' }
  ];

  /* --------------------------------------------------------------- setores */
  /* Cidades reais da Terra, semidestruídas pela invasão. Coordenadas verdadeiras.
     A geografia de cada lugar molda o mapa: rios, baías, morros e a malha de ruas.
     'ruinas' = postos de resistência abandonados que um operário pode reativar. */
  var SETORES = [
    {
      pressao: 0.85, id: 'manaus', nome: 'Porto de Manaus', regiao: 'Manaus · Amazonas · Brasil',
      lat: -3.13, lon: -60.02, semente: 1207, dificuldade: 'Introdução', ordem: 1,
      bioma: 'porto', tam: 70, rochas: 0.35, agua: 0.4, rios: 1, urbano: 0.72, quadra: 8,
      jazidas: 11, pocos: 2, entradas: 2, ruinas: 2,
      objetivo: 'Estabelecer posição: sobreviver a 6 ataques com a Central de pé.',
      ondas: 6, chefe: false, minerais: 400, operarios: 4,
      resumo: 'O Rio Negro corta o setor e separa as frentes. Galpões do porto viraram depósitos de sucata.',
      risco: 'Longe da margem o traçado é aberto: o perímetro precisa ser construído.',
      fato: 'O porto flutuante de Manaus sobe e desce até 14 metros entre a cheia e a seca do rio.'
    },
    {
      pressao: 0.95, id: 'rio', nome: 'Zona Portuária do Rio', regiao: 'Rio de Janeiro · Brasil',
      lat: -22.897, lon: -43.181, semente: 4411, dificuldade: 'Economia', ordem: 2,
      bioma: 'costa', tam: 78, rochas: 1.5, agua: 0.85, urbano: 0.8, quadra: 7,
      jazidas: 17, pocos: 5, entradas: 3, ruinas: 3, entregaAlvo: 2600,
      objetivo: 'Proteger a extração: entregar 2.600 minerais e resistir a 9 ataques.',
      ondas: 9, chefe: false, minerais: 400, operarios: 4,
      resumo: 'Baía de um lado, maciços de granito do outro. Armazéns arrasados rendem muito material.',
      risco: 'A melhor sucata fica longe do comando e os Corredores caçam operários na rota.',
      fato: 'A cidade cresceu espremida entre o mar e os morros de granito da Serra da Carioca.'
    },
    {
      pressao: 1.0, id: 'sp', nome: 'Marginal Tietê', regiao: 'São Paulo · Brasil',
      lat: -23.517, lon: -46.634, semente: 9034, dificuldade: 'Cerco', ordem: 3,
      bioma: 'metropole', tam: 76, rochas: 0.5, agua: 0.5, rios: 1, urbano: 0.94, quadra: 6,
      jazidas: 14, pocos: 5, entradas: 2, ruinas: 4,
      objetivo: 'Segurar o corredor: resistir a 11 ataques, incluindo Titãs.',
      ondas: 11, chefe: false, minerais: 450, operarios: 4,
      resumo: 'Quarteirões colados e viadutos caídos. A própria cidade é o labirinto: poucos muros fecham muita coisa.',
      risco: 'Quase não há área plana livre. Cada quadra limpa é disputada, e os Titãs abrem as suas.',
      fato: 'O Tietê foi retificado nos anos 1940; o canal e as marginais desenham o eixo da metrópole.'
    },
    {
      pressao: 1.0, id: 'cairo', nome: 'Cairo · Margem do Nilo', regiao: 'Cairo · Egito',
      lat: 30.044, lon: 31.236, semente: 5528, dificuldade: 'Defesa aérea', ordem: 4,
      bioma: 'deserto', tam: 78, rochas: 0.6, agua: 0.5, rios: 1, urbano: 0.7, quadra: 9,
      jazidas: 14, pocos: 3, entradas: 4, ruinas: 3, aereo: 1.8,
      objetivo: 'Defender o céu: manter as instalações por 10 ataques com incursões aéreas pesadas.',
      ondas: 10, chefe: false, minerais: 450, operarios: 4,
      resumo: 'O Nilo de um lado, o deserto do outro, e a cidade baixa no meio. Quatro direções de ataque.',
      risco: 'Terreno raso demais para se esconder: sem antiaéreo, as Asas passam por cima do perímetro.',
      fato: 'É a maior área urbana da África e da região árabe, com mais de 20 milhões de habitantes.'
    },
    {
      pressao: 1.05, id: 'manhattan', nome: 'Ilha de Manhattan', regiao: 'Nova York · Estados Unidos',
      lat: 40.758, lon: -73.985, semente: 7120, dificuldade: 'Cerco urbano', ordem: 5,
      bioma: 'ilha', tam: 72, rochas: 0.8, agua: 1.5, ilha: true, urbano: 1, quadra: 5,
      jazidas: 12, pocos: 5, entradas: 2, ruinas: 4,
      objetivo: 'Reconquistar o distrito: resistir a 12 ataques na ilha cercada.',
      ondas: 12, chefe: false, minerais: 500, operarios: 4,
      resumo: 'Ilha estreita entre dois rios, grade de ruas perfeita e arranha-céus caídos fechando avenidas.',
      risco: 'Sem espaço para recuar: a água protege os flancos, mas o que entra fica dentro.',
      fato: 'A grade das ruas vem do Commissioners\' Plan de 1811: 12 avenidas e 155 ruas numeradas.'
    },
    {
      pressao: 1.1, id: 'merida', nome: 'Mérida · Cratera de Chicxulub', regiao: 'Yucatán · México',
      lat: 20.97, lon: -89.62, semente: 7781, dificuldade: 'Final', ordem: 6,
      bioma: 'cratera', tam: 80, rochas: 1.1, agua: 0.45, cratera: true, urbano: 0.62, quadra: 8,
      jazidas: 15, pocos: 8, entradas: 4, ruinas: 4,
      objetivo: 'Última fronteira: derrotar a Matriarca mantendo o comando.',
      ondas: 13, chefe: true, minerais: 550, operarios: 5,
      resumo: 'A cidade colonial está sobre a borda do impacto de 66 milhões de anos. A colmeia se instalou no anel central.',
      risco: 'Quatro direções, petróleo em abundância e a Matriarca na onda final, com reforços e bombardeio.',
      fato: 'A cratera tem cerca de 180 km e sua borda aparece na superfície como um anel de cenotes ao redor de Mérida.'
    }
  ];

  /* ------------------------------------------------- economia e ritmo base */
  var REGRAS = {
    minerais: 400,
    operarios: 4,
    popInicial: 12,
    cargaBase: 8,
    coletaBase: 4,
    primeiroAtaque: 90,
    avisoAtaque: 20,
    intervaloOnda: 62,
    energiaMax: 100,
    energiaRegen: 2.4,
    custoBombardeio: 50,
    custoEscudo: 35,
    /* VARREDURA. O Scanner Sweep do StarCraft custa 50 de energia e revela
       20×20 por 15 segundos. As duas metades dele já existiam soltas aqui —
       o Radar, que é a visão fixa, e a energia tática, que paga bombardeio e
       escudo — e faltava a peça que vê ONDE se quer, na hora em que se quer.
       Mais barata que o bombardeio de propósito: olhar tem de custar menos que
       bater, senão ninguém olha. */
    custoVarredura: 30,
    varreduraRaio: 9,
    varreduraDuracao: 14,
    reembolso: 0.6,
    reservaReparo: 120,
    postoDano: 0.08,        /* +8% de dano por posto */
    postoCadencia: 0.08,    /* -8% no tempo de recarga por posto */
    postoCura: 0.015        /* fração da vida por segundo, a partir do posto 2 */
  };

  /* VETERANIA. C&C Generals: Veteran, Elite e Heroic, com mais cadência e mais
     dano a cada posto e auto-cura nos dois últimos. O que ela resolve é o
     problema que o Rob Pardo nomeou — a *fodder unit*, a tropa que só serve
     para ser gasta: com posto, preservar o soldado passa a valer alguma coisa,
     e recuar deixa de ser desperdício.

     A experiência é o `valor` do que se abate, que já existe para o reembolso:
     Corredor 5, Titã 34, Matriarca 120. Um Fuzileiro vira Veterano com três
     Corredores e Heroico com vinte — uma campanha inteira, não uma onda.

     Os ganhos são MENORES que os do C&C (lá é +20% de cadência por posto, que
     no terceiro seria dois e meio tiros pelo preço de um). A nossa tropa vive
     muitas ondas seguidas, e o mesmo número que é justo num jogo onde a
     unidade morre rápido vira desequilíbrio aqui.

     8% por posto é NÚMERO MEDIDO, e a história dele vale ficar registrada.
     Na primeira medição 8% virou a vitória do Rio em derrota e o número baixou
     para 5%. Depois descobriu-se que o `equilibrio.cjs` estava cego — o
     jogador simulado nunca construía Centro de Pesquisa e terminava as doze
     partidas em tecnologia 1. Com o medidor consertado, 8% passa no portão
     (3 vitórias, 9 derrotas, mesmas ondas) e ainda melhora o Rio: 18m31 contra
     19m35, 32 perdas contra 35. A rejeição tinha sido do instrumento, não do
     número. */
  var POSTOS = [
    { nome: '', xp: 0 },
    { nome: 'Veterano', xp: 15 },
    { nome: 'Elite', xp: 45 },
    { nome: 'Heroico', xp: 100 }
  ];

  var DIFICULDADES = {
    recruta: { nome: 'Recruta', orcamento: 0.7, aviso: 1.4, desc: 'Mais avisos e menos pressão.' },
    comandante: { nome: 'Comandante', orcamento: 1, aviso: 1, desc: 'Equilíbrio de referência.' },
    veterano: { nome: 'Veterano', orcamento: 1.35, aviso: 0.75, desc: 'Ataques maiores e mais coordenados.' }
  };

  UF.DATA = {
    TERRENO: TERRENO, ESTRUTURAS: ESTRUTURAS, UNIDADES: UNIDADES, INVASORES: INVASORES,
    PESQUISAS: PESQUISAS, SETORES: SETORES, REGRAS: REGRAS, DIFICULDADES: DIFICULDADES,
    POSTOS: POSTOS
  };
})(typeof window !== 'undefined' ? window : globalThis);
