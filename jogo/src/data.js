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
  var ESTRUTURAS = {
    central: {
      nome: 'Central de Comando', cat: 'base', w: 4, h: 4, hp: 3200, tempo: 0,
      custo: { m: 0 }, papel: 'deposito', produz: ['operario'], visao: 11, fornece: 8,
      desc: 'Produz operários, recebe minério e concentra as ordens globais. Fornece 8 de energia. Perdê-la encerra a partida.'
    },
    alojamento: {
      nome: 'Alojamento', cat: 'base', w: 2, h: 2, hp: 620, tempo: 10,
      custo: { m: 100 }, pop: 10, visao: 6, req: { ed: 'central' },
      desc: 'Aumenta a capacidade de população em 10.'
    },
    gerador: {
      nome: 'Gerador', cat: 'base', w: 2, h: 2, hp: 520, tempo: 10,
      custo: { m: 100 }, fornece: 12, visao: 6, req: { ed: 'central' },
      desc: 'Fornece 12 de capacidade elétrica. Em déficit, a produção avançada pausa.'
    },
    deposito: {
      nome: 'Depósito avançado', cat: 'base', w: 2, h: 2, hp: 700, tempo: 12,
      custo: { m: 120 }, papel: 'deposito', visao: 7, req: { ed: 'central' },
      desc: 'Recebe carga mineral. Encurta o trajeto de jazidas distantes.'
    },
    quartel: {
      nome: 'Quartel', cat: 'producao', w: 3, h: 3, hp: 950, tempo: 16,
      custo: { m: 150 }, energia: 4, visao: 7, req: { ed: 'central' },
      produz: ['fuzileiro', 'incendiario', 'medico'],
      desc: 'Produz fuzileiros e tropas de apoio. Define ponto de encontro.'
    },
    oficina: {
      nome: 'Oficina', cat: 'producao', w: 3, h: 3, hp: 1150, tempo: 22,
      custo: { m: 220 }, energia: 6, visao: 7, req: { ed: 'quartel', tech: 2 },
      produz: ['lanceiro', 'drone', 'tanque'],
      desc: 'Produz unidades pesadas. Exige Quartel e tecnologia II.'
    },
    pesquisa: {
      nome: 'Centro de Pesquisa', cat: 'tecnologia', w: 3, h: 3, hp: 860, tempo: 18,
      custo: { m: 180 }, energia: 5, visao: 7, req: { ed: 'central' },
      desc: 'Executa uma pesquisa por vez. Destruí-lo pausa a pesquisa em curso.'
    },
    extrator: {
      nome: 'Extrator de cristais', cat: 'tecnologia', w: 2, h: 2, hp: 640, tempo: 14,
      custo: { m: 150 }, energia: 3, visao: 5, sobre: 'cristal', req: { tech: 2 },
      desc: 'Instalado sobre uma jazida de cristais. Extrai sozinho, sem operário.'
    },
    radar: {
      nome: 'Radar', cat: 'tecnologia', w: 2, h: 2, hp: 540, tempo: 14,
      custo: { m: 140 }, energia: 3, visao: 17, req: { ed: 'pesquisa' },
      desc: 'Amplia a visão e antecipa a direção e a força do próximo ataque.'
    },
    muro: {
      nome: 'Muro', cat: 'defesa', w: 1, h: 1, hp: 560, tempo: 2.5,
      custo: { m: 12 }, arrasto: true, muro: true, visao: 3,
      desc: 'Bloqueia tropas terrestres. Não impede voo nem fogo indireto.'
    },
    portao: {
      nome: 'Portão', cat: 'defesa', w: 2, h: 1, hp: 660, tempo: 5,
      custo: { m: 40 }, portao: true, muro: true, visao: 4,
      desc: 'Abre para aliados e fecha quando um inimigo se aproxima.'
    },
    sentinela: {
      nome: 'Sentinela', cat: 'defesa', w: 2, h: 2, hp: 560, tempo: 8,
      custo: { m: 80 }, energia: 2, papel: 'torre', visao: 9,
      arma: { dano: 14, cad: 0.55, alc: 7.5, ar: true, solo: true, vel: 17, cor: '#7fd7ff' },
      desc: 'Tiro rápido contra solo e ar. Boa cobertura geral, dano baixo por tiro.'
    },
    gelo: {
      nome: 'Torre de Gelo', cat: 'defesa', w: 2, h: 2, hp: 520, tempo: 9,
      custo: { m: 110 }, energia: 2, papel: 'torre', visao: 8, req: { tech: 2 },
      arma: { dano: 7, cad: 0.8, alc: 6.5, ar: false, solo: true, vel: 13, lentidao: 0.45, cor: '#9ff0ff' },
      desc: 'Desacelera alvos terrestres em 45%. Segura a pressão sobre os muros.'
    },
    artilharia: {
      nome: 'Artilharia', cat: 'defesa', w: 2, h: 2, hp: 620, tempo: 12,
      custo: { m: 145 }, energia: 3, papel: 'torre', visao: 10, req: { tech: 2 },
      arma: { dano: 51, cad: 2.1, alc: 10, alcMin: 2.2, ar: false, solo: true, vel: 9, area: 1.7, cor: '#ffb457' },
      desc: 'Dano em área contra solo. Alcance mínimo: fica exposta de perto.'
    },
    plasma: {
      nome: 'Torre de Plasma', cat: 'defesa', w: 2, h: 2, hp: 680, tempo: 14,
      custo: { m: 190, c: 40 }, energia: 4, papel: 'torre', visao: 9, req: { tech: 3 },
      arma: { dano: 43, cad: 1.15, alc: 8.5, ar: true, solo: true, vel: 20, perfura: true, cor: '#d79bff' },
      desc: 'Ignora blindagem e atinge solo e ar. Exige tecnologia III e cristais.'
    }
  };

  /* ------------------------------------------------------------- unidades */
  var UNIDADES = {
    operario: {
      nome: 'Operário', custo: { m: 50 }, pop: 1, tempo: 12, hp: 90, vel: 2.5, visao: 6,
      carga: 8, coleta: 4, obra: 1, construtor: true,
      arma: { dano: 5, cad: 1.2, alc: 1.1, solo: true, ar: false, vel: 12 },
      desc: 'Minera, constrói, repara e explora. Frágil: morre com a carga que levava.'
    },
    fuzileiro: {
      nome: 'Fuzileiro', custo: { m: 60 }, pop: 1, tempo: 11, hp: 130, vel: 2.7, visao: 8, blind: 0,
      arma: { dano: 12, cad: 0.7, alc: 5.5, solo: true, ar: true, vel: 18, cor: '#ffe9a8' },
      desc: 'Tiro rápido contra solo e ar. Frágil quando cercado.'
    },
    incendiario: {
      nome: 'Incendiário', custo: { m: 90 }, pop: 2, tempo: 15, hp: 200, vel: 2.4, visao: 7, blind: 1,
      arma: { dano: 20, cad: 1.1, alc: 2.6, solo: true, ar: false, vel: 14, area: 1.5, cor: '#ff8a4c' },
      desc: 'Dano em cone curto contra enxames no solo.'
    },
    medico: {
      nome: 'Médico de campo', custo: { m: 90, c: 15 }, pop: 1, tempo: 14, hp: 120, vel: 2.8, visao: 7,
      cura: { taxa: 14, alc: 4, reserva: 320 }, req: { tech: 2 },
      desc: 'Recupera soldados próximos com reserva limitada. Precisa de proteção.'
    },
    lanceiro: {
      nome: 'Lanceiro pesado', custo: { m: 120, c: 20 }, pop: 2, tempo: 18, hp: 230, vel: 2.2, visao: 8, blind: 2,
      arma: { dano: 46, cad: 1.5, alc: 5.2, solo: true, ar: true, vel: 16, perfura: true, cor: '#b8f0d0' },
      desc: 'Eficiente contra blindagem. Rende pouco contra muitos alvos leves.'
    },
    drone: {
      nome: 'Drone antiaéreo', custo: { m: 140, c: 30 }, pop: 2, tempo: 16, hp: 160, vel: 3.6, visao: 9, voa: true,
      arma: { dano: 26, cad: 0.85, alc: 6.2, solo: false, ar: true, vel: 22, cor: '#8fd9ff' },
      desc: 'Interceta voadores. Não consegue atacar alvos terrestres.'
    },
    tanque: {
      nome: 'Tanque de cerco', custo: { m: 200, c: 50 }, pop: 3, tempo: 24, hp: 380, vel: 1.6, visao: 10, blind: 3,
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
      arma: { dano: 10, cad: 0.8, alc: 1.2, solo: true, ar: false, vel: 12 },
      cor: '#f06a6a', raio: 0.32,
      desc: 'Pressiona muros e soldados próximos; entra assim que surge uma brecha.'
    },
    corredor: {
      nome: 'Corredor', hp: 95, vel: 4.1, blind: 0, valor: 5, mira: 'economia', visao: 9,
      arma: { dano: 7, cad: 0.6, alc: 1.1, solo: true, ar: false, vel: 12 },
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
      arma: { dano: 14, cad: 0.9, alc: 2.2, solo: true, ar: false, vel: 14 },
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

  /* -------------------------------------------------------------- pesquisa */
  var PESQUISAS = [
    { id: 'tech2', ramo: 'comando', nome: 'Tecnologia II — Fortificação', custo: { m: 250 }, tempo: 40, tech: 2,
      efeito: 'Libera Artilharia, Gelo, Oficina, extrator de cristais e tropas especializadas.' },
    { id: 'tech3', ramo: 'comando', nome: 'Tecnologia III — Reconquista', custo: { m: 400, c: 100 }, tempo: 60, tech: 3, req: ['tech2'],
      efeito: 'Libera Plasma, sensores avançados e as tecnologias finais.' },

    { id: 'carga', ramo: 'economia', nome: 'Carga reforçada', custo: { m: 120 }, tempo: 28,
      efeito: 'Operários transportam 12 minerais por viagem em vez de 8.' },
    { id: 'coleta', ramo: 'economia', nome: 'Ferramenta de corte', custo: { m: 160 }, tempo: 32, req: ['carga'],
      efeito: 'Coleta 30% mais rápida em todas as jazidas.' },
    { id: 'logistica', ramo: 'economia', nome: 'Logística de setor', custo: { m: 220, c: 20 }, tempo: 40, req: ['coleta'], tech: 2,
      efeito: 'Operários andam 20% mais rápido e o extrator rende 40% a mais.' },

    { id: 'muroReforcado', ramo: 'fortificacao', nome: 'Muro reforçado', custo: { m: 150 }, tempo: 30,
      efeito: 'Muros e portões ganham 60% de integridade.' },
    { id: 'reparoEficiente', ramo: 'fortificacao', nome: 'Reparo eficiente', custo: { m: 180 }, tempo: 32, req: ['muroReforcado'],
      efeito: 'Reparos custam 40% menos e são 50% mais rápidos.' },
    { id: 'antiacido', ramo: 'fortificacao', nome: 'Resistência a ácido', custo: { m: 260, c: 40 }, tempo: 45, req: ['reparoEficiente'], tech: 3,
      efeito: 'Reduz pela metade o dano de Cuspidores e Asas corrosivas.' },

    { id: 'precisao', ramo: 'armamento', nome: 'Precisão de tiro', custo: { m: 140 }, tempo: 28,
      efeito: '+18% de dano para torres e soldados.' },
    { id: 'penetracao', ramo: 'armamento', nome: 'Munição perfurante', custo: { m: 210 }, tempo: 35, req: ['precisao'], tech: 2,
      efeito: 'Ignora metade da blindagem inimiga.' },
    { id: 'artilhariaAv', ramo: 'armamento', nome: 'Artilharia avançada', custo: { m: 280, c: 50 }, tempo: 42, req: ['penetracao'], tech: 3,
      efeito: '+35% de raio de explosão e +15% de alcance nas armas de área.' },

    { id: 'formacao', ramo: 'comando', nome: 'Treinamento de formação', custo: { m: 160 }, tempo: 30,
      efeito: 'Soldados ganham 20% de integridade.' },
    { id: 'autonomia', ramo: 'comando', nome: 'Autonomia de reparo', custo: { m: 200 }, tempo: 34, req: ['formacao'], tech: 2,
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
      bioma: 'porto', tam: 52, rochas: 0.35, agua: 0.4, rios: 1, urbano: 0.72, quadra: 8,
      jazidas: 7, cristais: 1, entradas: 2, ruinas: 2,
      objetivo: 'Estabelecer posição: sobreviver a 6 ataques com a Central de pé.',
      ondas: 6, chefe: false, minerais: 400, operarios: 4,
      resumo: 'O Rio Negro corta o setor e separa as frentes. Galpões do porto viraram depósitos de sucata.',
      risco: 'Longe da margem o traçado é aberto: o perímetro precisa ser construído.',
      fato: 'O porto flutuante de Manaus sobe e desce até 14 metros entre a cheia e a seca do rio.'
    },
    {
      pressao: 0.95, id: 'rio', nome: 'Zona Portuária do Rio', regiao: 'Rio de Janeiro · Brasil',
      lat: -22.897, lon: -43.181, semente: 4411, dificuldade: 'Economia', ordem: 2,
      bioma: 'costa', tam: 58, rochas: 1.5, agua: 0.85, urbano: 0.8, quadra: 7,
      jazidas: 11, cristais: 3, entradas: 3, ruinas: 3, entregaAlvo: 2600,
      objetivo: 'Proteger a extração: entregar 2.600 minerais e resistir a 9 ataques.',
      ondas: 9, chefe: false, minerais: 400, operarios: 4,
      resumo: 'Baía de um lado, maciços de granito do outro. Armazéns arrasados rendem muito material.',
      risco: 'A melhor sucata fica longe do comando e os Corredores caçam operários na rota.',
      fato: 'A cidade cresceu espremida entre o mar e os morros de granito da Serra da Carioca.'
    },
    {
      pressao: 1.0, id: 'sp', nome: 'Marginal Tietê', regiao: 'São Paulo · Brasil',
      lat: -23.517, lon: -46.634, semente: 9034, dificuldade: 'Cerco', ordem: 3,
      bioma: 'metropole', tam: 56, rochas: 0.5, agua: 0.5, rios: 1, urbano: 0.94, quadra: 6,
      jazidas: 9, cristais: 3, entradas: 2, ruinas: 4,
      objetivo: 'Segurar o corredor: resistir a 11 ataques, incluindo Titãs.',
      ondas: 11, chefe: false, minerais: 450, operarios: 4,
      resumo: 'Quarteirões colados e viadutos caídos. A própria cidade é o labirinto: poucos muros fecham muita coisa.',
      risco: 'Quase não há área plana livre. Cada quadra limpa é disputada, e os Titãs abrem as suas.',
      fato: 'O Tietê foi retificado nos anos 1940; o canal e as marginais desenham o eixo da metrópole.'
    },
    {
      pressao: 1.0, id: 'cairo', nome: 'Cairo · Margem do Nilo', regiao: 'Cairo · Egito',
      lat: 30.044, lon: 31.236, semente: 5528, dificuldade: 'Defesa aérea', ordem: 4,
      bioma: 'deserto', tam: 58, rochas: 0.6, agua: 0.5, rios: 1, urbano: 0.7, quadra: 9,
      jazidas: 9, cristais: 2, entradas: 4, ruinas: 3, aereo: 1.8,
      objetivo: 'Defender o céu: manter as instalações por 10 ataques com incursões aéreas pesadas.',
      ondas: 10, chefe: false, minerais: 450, operarios: 4,
      resumo: 'O Nilo de um lado, o deserto do outro, e a cidade baixa no meio. Quatro direções de ataque.',
      risco: 'Terreno raso demais para se esconder: sem antiaéreo, as Asas passam por cima do perímetro.',
      fato: 'É a maior área urbana da África e da região árabe, com mais de 20 milhões de habitantes.'
    },
    {
      pressao: 1.05, id: 'manhattan', nome: 'Ilha de Manhattan', regiao: 'Nova York · Estados Unidos',
      lat: 40.758, lon: -73.985, semente: 7120, dificuldade: 'Cerco urbano', ordem: 5,
      bioma: 'ilha', tam: 54, rochas: 0.8, agua: 1.5, ilha: true, urbano: 1, quadra: 5,
      jazidas: 8, cristais: 3, entradas: 2, ruinas: 4,
      objetivo: 'Reconquistar o distrito: resistir a 12 ataques na ilha cercada.',
      ondas: 12, chefe: false, minerais: 500, operarios: 4,
      resumo: 'Ilha estreita entre dois rios, grade de ruas perfeita e arranha-céus caídos fechando avenidas.',
      risco: 'Sem espaço para recuar: a água protege os flancos, mas o que entra fica dentro.',
      fato: 'A grade das ruas vem do Commissioners\' Plan de 1811: 12 avenidas e 155 ruas numeradas.'
    },
    {
      pressao: 1.1, id: 'merida', nome: 'Mérida · Cratera de Chicxulub', regiao: 'Yucatán · México',
      lat: 20.97, lon: -89.62, semente: 7781, dificuldade: 'Final', ordem: 6,
      bioma: 'cratera', tam: 60, rochas: 1.1, agua: 0.45, cratera: true, urbano: 0.62, quadra: 8,
      jazidas: 10, cristais: 5, entradas: 4, ruinas: 4,
      objetivo: 'Última fronteira: derrotar a Matriarca mantendo o comando.',
      ondas: 13, chefe: true, minerais: 550, operarios: 5,
      resumo: 'A cidade colonial está sobre a borda do impacto de 66 milhões de anos. A colmeia se instalou no anel central.',
      risco: 'Quatro direções, cristais em abundância e a Matriarca na onda final, com reforços e bombardeio.',
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
    reembolso: 0.6,
    reservaReparo: 120
  };

  var DIFICULDADES = {
    recruta: { nome: 'Recruta', orcamento: 0.7, aviso: 1.4, desc: 'Mais avisos e menos pressão.' },
    comandante: { nome: 'Comandante', orcamento: 1, aviso: 1, desc: 'Equilíbrio de referência.' },
    veterano: { nome: 'Veterano', orcamento: 1.35, aviso: 0.75, desc: 'Ataques maiores e mais coordenados.' }
  };

  UF.DATA = {
    TERRENO: TERRENO, ESTRUTURAS: ESTRUTURAS, UNIDADES: UNIDADES, INVASORES: INVASORES,
    PESQUISAS: PESQUISAS, SETORES: SETORES, REGRAS: REGRAS, DIFICULDADES: DIFICULDADES
  };
})(typeof window !== 'undefined' ? window : globalThis);
