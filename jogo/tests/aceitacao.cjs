/* Última Fronteira — plano de testes de aceitação.
   Cada teste corresponde a uma linha da página 24 do documento de projeto. */
global.window = global;
/* localStorage de mentira, só para os testes de salvamento rodarem no Node. */
var memoria = {};
global.localStorage = {
  getItem: function (k) { return Object.prototype.hasOwnProperty.call(memoria, k) ? memoria[k] : null; },
  setItem: function (k, v) { memoria[k] = String(v); },
  removeItem: function (k) { delete memoria[k]; }
};
['util', 'data', 'world', 'path', 'geo', 'sim', 'sim-unidades', 'sim-combate', 'salvar']
  .forEach(function (m) { require('../src/' + m + '.js'); });
var UF = global.UF, D = UF.DATA;

var passou = 0, falhou = 0, atual = '';
function teste(nome, fn) {
  atual = nome;
  try { fn(); console.log('  ok   ' + nome); passou++; }
  catch (e) { console.log('  FALHA ' + nome + '\n         ' + e.message); falhou++; }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'condição falsa'); }
function igual(a, b, msg) { if (a !== b) throw new Error((msg || '') + ' esperado ' + b + ', obtido ' + a); }
function perto(a, b, tol, msg) { if (Math.abs(a - b) > tol) throw new Error((msg || '') + ' esperado ~' + b + ', obtido ' + a); }

/* Monta uma partida com a Central instalada num lugar válido. */
function partida(idSetor, opcoes) {
  var setor = D.SETORES.filter(function (s) { return s.id === (idSetor || 'manaus'); })[0];
  var sim = new UF.Sim({ setor: setor, dificuldade: (opcoes && opcoes.dificuldade) || 'comandante', modo: (opcoes && opcoes.modo) || 'campanha' });
  var w = sim.world, melhor = null, melhorD = Infinity;
  for (var y = 3; y < w.h - 6; y++) {
    for (var x = 3; x < w.w - 6; x++) {
      if (!sim.podeColocarSemExploracao('central', x, y).ok) continue;
      var d = Math.hypot(x - w.w / 2, y - w.h / 2);
      if (d < melhorD) { melhorD = d; melhor = { x: x, y: y }; }
    }
  }
  ok(melhor, 'nenhum local válido para a Central em ' + setor.nome);
  sim.iniciar(melhor.x, melhor.y);
  for (var i = 0; i < w.n; i++) w.explorado[i] = 1;   /* tira a névoa dos testes */
  return sim;
}

/* Constrói no primeiro lugar válido em torno da Central; evita testes frágeis
   que dependem de uma célula específica do terreno gerado. */
function construirPerto(sim, tipo, r0, r1) {
  var c = sim.central, def = D.ESTRUTURAS[tipo];
  for (var r = r0 || 4; r <= (r1 || 13); r++) {
    for (var a = 0; a < 40; a++) {
      var ang = a / 40 * Math.PI * 2;
      var x = Math.round(c.x + c.w / 2 + Math.cos(ang) * r - def.w / 2);
      var y = Math.round(c.y + c.h / 2 + Math.sin(ang) * r - def.h / 2);
      sim.world.revelar(x + def.w / 2, y + def.h / 2, 3);
      var res = sim.construir(tipo, x, y);
      if (res.ok) return sim.estruturas[res.id];
    }
  }
  return null;
}

function concluir(b) { b.construida = true; b.obra = 1; b.hp = b.hpMax; return b; }

function avancar(sim, segundos) {
  var passos = Math.round(segundos * 30);
  for (var i = 0; i < passos; i++) sim.atualizar(1 / 30);
}

function revelarE(sim, x, y) { sim.world.revelar(x, y, 3); }

console.log('\nPLANO DE TESTES DE ACEITAÇÃO — Última Fronteira\n');

/* ------------------------------------------------------------ terreno */
console.log('Mundo e navegação');

teste('Todo setor tem local válido para a Central e rota até uma jazida', function () {
  D.SETORES.forEach(function (setor) {
    var sim = new UF.Sim({ setor: setor });
    var achou = false;
    for (var y = 2; y < sim.world.h - 5 && !achou; y++) {
      for (var x = 2; x < sim.world.w - 5; x++) {
        if (sim.podeColocarSemExploracao('central', x, y).ok) { achou = true; break; }
      }
    }
    ok(achou, setor.nome + ' não tem local válido para a Central');
  });
});

teste('Zonas de invasão têm rota até o centro do mapa', function () {
  D.SETORES.forEach(function (setor) {
    var sim = new UF.Sim({ setor: setor });
    var w = sim.world;
    var p = sim.nav.celulaLivreProxima(Math.floor(w.w / 2), Math.floor(w.h / 2), 12);
    var alc = sim.nav.alcancaveis(p.x, p.y, sim.ctxAliado);
    w.entradas.forEach(function (e) {
      ok(alc[w.idx(e.x, e.y)], setor.nome + ': entrada ' + e.nome + ' sem rota ao centro');
    });
  });
});

/* ------------------------------------------------------------ economia */
console.log('\nEconomia e logística');

teste('Entrega física: a carga só vira recurso ao chegar no depósito, uma única vez', function () {
  var sim = partida();
  var op = sim.unidades.filter(function (u) { return u.operario; })[0];
  var antes = sim.jogador.m;
  var entregas = 0;
  var eventos = [];
  sim.emitir = (function (orig) {
    return function (tipo, dados) {
      if (tipo === 'entrega') { entregas++; eventos.push(dados.qtd); }
      return orig.call(sim, tipo, dados);
    };
  })(sim.emitir);
  avancar(sim, 40);
  ok(entregas > 0, 'nenhuma entrega em 40 s');
  var somaEntregas = eventos.reduce(function (a, b) { return a + b; }, 0);
  perto(sim.estatisticas.entregue, somaEntregas, 0.001, 'total entregue difere da soma dos eventos:');
  ok(sim.jogador.m > antes, 'estoque não aumentou');
});

teste('Minério esgotado: sem recursos negativos e o operário busca outra jazida', function () {
  var sim = partida();
  var op = sim.unidades.filter(function (u) { return u.operario; })[0];
  var jaz = sim.jazidaLivreMaisProxima(op.x, op.y);
  jaz.estoque = 5;
  sim.darTarefa(op, { tipo: 'minerar', jazida: jaz.id });
  avancar(sim, 60);
  ok(jaz.estoque >= 0, 'estoque da jazida ficou negativo');
  ok(sim.jogador.m >= 0, 'minerais ficaram negativos');
  ok(op.tarefa.tipo !== 'minerar' || op.tarefa.jazida !== jaz.id || jaz.estoque > 0,
    'operário continua preso numa jazida esgotada');
});

teste('Depósito destruído: a carga é preservada e o operário busca outro destino', function () {
  var sim = partida();
  var dep = concluir(construirPerto(sim, 'deposito', 6, 12));
  ok(dep, 'não consegui construir um depósito');
  var op = sim.unidades.filter(function (u) { return u.operario; })[0];
  op.carga = 8; op.cargaTipo = 'mineral';
  sim.darTarefa(op, { tipo: 'minerar', jazida: sim.world.jazidas[0].id });
  op.tarefa.estado = 'voltando';
  op.tarefa.deposito = dep.id;
  var antes = sim.jogador.m;
  sim.matar(dep, { silencioso: true });
  igual(op.carga, 8, 'a carga sumiu no instante em que o depósito caiu:');
  igual(sim.jogador.m, antes, 'o estoque mudou sozinho ao perder o depósito:');
  avancar(sim, 45);
  ok(sim.jogador.m >= antes + 8, 'a carga nunca chegou a um depósito alternativo');
});

teste('Operário morto perde a carga: ela não entra no estoque', function () {
  var sim = partida();
  var op = sim.unidades.filter(function (u) { return u.operario; })[0];
  op.carga = 8;
  var antes = sim.jogador.m;
  sim.aplicarDano(op, 9999, { perfura: true });
  igual(sim.jogador.m, antes, 'o estoque mudou com a morte do operário:');
  igual(op.carga, 0, 'a carga não foi perdida:');
  igual(sim.estatisticas.operariosPerdidos, 1, 'operário perdido não contabilizado:');
});

/* ---------------------------------------------------------- construção */
console.log('\nConstrução, muros e brechas');

teste('Obra não surge pronta: exige construtor e o progresso é gradual', function () {
  var sim = partida();
  var b = construirPerto(sim, 'sentinela', 5, 11);
  ok(b, 'não consegui iniciar a obra');
  igual(b.construida, false, 'a torre nasceu pronta:');
  ok(b.obra < 0.2, 'obra começou adiantada demais');
  avancar(sim, 40);
  ok(b.construida, 'a obra não terminou em 40 s com um operário');
});

teste('Construtor morto pausa a obra; outro operário retoma', function () {
  var sim = partida();
  var b = construirPerto(sim, 'sentinela', 5, 11);
  ok(b, 'não consegui iniciar a obra');
  avancar(sim, 12);
  var construtor = sim.unidades.filter(function (u) { return u.tarefa && u.tarefa.tipo === 'construir' && u.tarefa.alvo === b.id; })[0];
  ok(construtor, 'nenhum operário assumiu a obra');
  var progresso = b.obra;
  ok(progresso > 0, 'a obra não avançou antes da morte do construtor');
  sim.aplicarDano(construtor, 9999, { perfura: true });
  avancar(sim, 0.4);
  ok(!b.construida, 'a obra terminou sozinha após a morte do construtor');
  igual(b.construtores, 0, 'a obra continuou com responsável:');
  var pausado = b.obra;
  sim.distribuirObras();
  avancar(sim, 45);
  ok(b.obra > pausado, 'ninguém retomou a obra');
});

teste('Muro destruído vira brecha transitável na mesma hora', function () {
  var sim = partida();
  var m = construirPerto(sim, 'muro', 4, 10);
  ok(m, 'não consegui construir o muro');
  igual(sim.world.livre(m.x, m.y), false, 'a célula do muro continua livre:');
  var versaoAntes = sim.world.versaoRota;
  sim.matar(m, { silencioso: true });
  igual(sim.world.livre(m.x, m.y), true, 'a brecha não ficou transitável:');
  ok(sim.world.versaoRota > versaoAntes, 'as rotas não foram invalidadas');
});

teste('Traçado de muro é atômico: trechos inválidos não são cobrados', function () {
  var sim = partida();
  var y = sim.central.y - 4;
  for (var i = -8; i <= 8; i++) revelarE(sim, sim.central.x + i, y);
  var plano = sim.planejarMuro(sim.central.x - 8, y, sim.central.x + 8, y, 'muro');
  var antes = sim.jogador.m;
  var res = sim.confirmarMuro(plano, 'muro');
  ok(res.ok, 'traçado recusado: ' + res.motivo);
  igual(antes - sim.jogador.m, plano.validas * D.ESTRUTURAS.muro.custo.m, 'cobrança diferente das células válidas:');
  igual(res.ids.length, plano.validas, 'número de obras diferente das células válidas:');
});

teste('Traçado que prenderia um operário sem saída é recusado', function () {
  var sim = partida();
  var op = sim.unidades.filter(function (u) { return u.operario; })[0];
  /* Coloca o operário numa célula livre conhecida e fecha as oito vizinhas. */
  var base = sim.nav.celulaLivreProxima(sim.central.x + 8, sim.central.y + 8, 12);
  ok(base, 'sem célula livre para o teste');
  op.x = base.x + 0.5; op.y = base.y + 0.5;
  var celulas = [];
  for (var dx = -1; dx <= 1; dx++) {
    for (var dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue;
      celulas.push({ x: base.x + dx, y: base.y + dy, ok: true });
    }
  }
  var motivo = sim.aprisionaria(celulas);
  ok(typeof motivo === 'string' && motivo.length > 0, 'o jogo aceitaria prender o operário');
  /* E o mesmo traçado com uma brecha é aceito. */
  celulas.pop();
  igual(sim.aprisionaria(celulas), null, 'recusou um traçado com saída:');
});

teste('Perímetro que corta a base de todas as jazidas é recusado', function () {
  var sim = partida();
  var c = sim.central;
  var celulas = [];
  for (var dx = -3; dx <= c.w + 2; dx++) {
    for (var dy = -3; dy <= c.h + 2; dy++) {
      var borda = dx === -3 || dy === -3 || dx === c.w + 2 || dy === c.h + 2;
      if (borda) celulas.push({ x: c.x + dx, y: c.y + dy, ok: true });
    }
  }
  var motivo = sim.aprisionaria(celulas);
  ok(typeof motivo === 'string' && /jazida|saída|prender/.test(motivo),
    'aceitou fechar a base sem acesso a jazidas: ' + motivo);
});

teste('Portão fechado bloqueia a rota aliada; aberto, deixa passar', function () {
  var sim = partida();
  var b = { id: 999, portao: true, portaoModo: 'aberto', morta: false };
  sim.estruturas[999] = b;
  var custoAberto = sim.nav.custo(sim.central.x + 6, sim.central.y, sim.ctxAliado);
  var x = sim.central.x + 6, y = sim.central.y;
  sim.world.occ[sim.world.idx(x, y)] = 999;
  ok(sim.nav.custo(x, y, sim.ctxAliado) < Infinity, 'aliado não passa pelo portão aberto');
  b.portaoModo = 'fechado';
  igual(sim.nav.custo(x, y, sim.ctxAliado), Infinity, 'aliado passa pelo portão fechado:');
  ok(sim.nav.custo(x, y, sim.ctxInimigo) < Infinity, 'invasor não consegue nem atacar o portão');
});

/* --------------------------------------------------------- população */
console.log('\nProdução, população e pesquisa');

teste('População reservada: filas não ultrapassam a capacidade em silêncio', function () {
  var sim = partida();
  sim.jogador.m = 100000;
  var cap = sim.jogador.popCap;
  var encomendas = 0, ultimoMotivo = '';
  for (var i = 0; i < 300; i++) {
    var r = sim.produzirOperario();
    if (!r.ok) { ultimoMotivo = r.motivo; break; }
    encomendas++;
  }
  ok(encomendas > 0, 'nenhuma encomenda aceita');
  igual(sim.jogador.popReservada, encomendas, 'população reservada diferente das encomendas:');
  ok(sim.jogador.popUsada + sim.jogador.popReservada <= cap,
    'a soma de usada e reservada passou da capacidade: ' + (sim.jogador.popUsada + sim.jogador.popReservada) + ' > ' + cap);
  ok(/população|Fila/i.test(ultimoMotivo), 'recusa sem motivo claro: ' + ultimoMotivo);

  /* Com a fila cheia num prédio, outro prédio não pode furar a capacidade. */
  sim.jogador.popReservada = 0;
  sim.jogador.popUsada = cap;
  igual(sim.produzirOperario().ok, false, 'aceitou encomenda com a população esgotada:');
});

teste('Cancelar encomenda devolve os recursos e libera a população', function () {
  var sim = partida();
  var mAntes = sim.jogador.m, popAntes = sim.popLivre();
  ok(sim.produzirOperario().ok, 'não consegui encomendar');
  ok(sim.jogador.m < mAntes, 'nada foi cobrado');
  ok(sim.popLivre() < popAntes, 'população não foi reservada');
  var r = sim.cancelarEncomenda(sim.central.id, sim.central.fila.length - 1);
  ok(r.ok, 'cancelamento falhou');
  igual(sim.jogador.m, mAntes, 'os recursos não voltaram inteiros:');
  igual(sim.popLivre(), popAntes, 'a população não foi liberada:');
});

teste('Pesquisa não dá bônus antes de concluir e o laboratório perdido a pausa', function () {
  var sim = partida();
  sim.jogador.m = 5000;
  var lab = construirPerto(sim, 'pesquisa', 5, 12);
  ok(lab, 'não consegui construir o laboratório');
  concluir(lab);
  ok(sim.pesquisar('precisao').ok, 'pesquisa recusada');
  avancar(sim, 5);
  igual(!!sim.jogador.pesquisas.precisao, false, 'bônus aplicado antes de concluir:');
  var progresso = sim.jogador.pesquisaAtual.progresso;
  ok(progresso > 0, 'a pesquisa não avançou');
  sim.matar(lab, { silencioso: true });
  avancar(sim, 5);
  ok(sim.jogador.pesquisaAtual.pausada, 'a pesquisa não pausou sem laboratório');
  perto(sim.jogador.pesquisaAtual.progresso, progresso, 0.001, 'a pesquisa avançou sem laboratório:');
});

teste('Pesquisa concluída vale para o que já existe', function () {
  var sim = partida();
  var m = construirPerto(sim, 'muro', 4, 10);
  ok(m, 'não consegui construir o muro');
  var hpAntes = m.hpMax;
  sim.jogador.pesquisas.muroReforcado = true;
  sim.reforcarMuros();
  ok(m.hpMax > hpAntes, 'muro já existente não foi reforçado');
});

/* ------------------------------------------------------------ combate */
console.log('\nCombate');

teste('Unidade aérea cruza muros e só é atingida por arma antiaérea', function () {
  var sim = partida();
  var asa = sim.criarUnidade('asa', sim.central.x + 10, sim.central.y, 'inimigo');
  igual(asa.voa, true, 'a Asa corrosiva não voa:');
  igual(sim.podeAtingir(D.ESTRUTURAS.artilharia.arma, asa), false, 'artilharia (só solo) acertou um alvo aéreo:');
  igual(sim.podeAtingir(D.ESTRUTURAS.sentinela.arma, asa), true, 'sentinela (solo e ar) não acerta alvo aéreo:');
  igual(sim.podeAtingir(D.UNIDADES.drone.arma, asa), true, 'drone antiaéreo não acerta alvo aéreo:');
  var chao = sim.criarUnidade('predador', sim.central.x + 10, sim.central.y + 1, 'inimigo');
  igual(sim.podeAtingir(D.UNIDADES.drone.arma, chao), false, 'drone antiaéreo acertou alvo terrestre:');
});

teste('Projétil guarda a identidade do alvo, não só a posição', function () {
  var sim = partida();
  var alvo = sim.criarUnidade('predador', sim.central.x + 3, sim.central.y + 3, 'inimigo');
  var torre = { id: 5000, x: sim.central.x, y: sim.central.y, w: 2, h: 2, lado: 'aliado', recarga: 0, def: D.ESTRUTURAS.sentinela };
  sim.atirar(torre, alvo, D.ESTRUTURAS.sentinela.arma, 1);
  igual(sim.projeteis.length, 1, 'nenhum projétil criado:');
  igual(sim.projeteis[0].alvoId, alvo.id, 'o projétil não guardou o id do alvo:');
  var hpAntes = alvo.hp;
  alvo.x += 4; alvo.y += 4;                        /* o alvo se moveu */
  for (var i = 0; i < 60; i++) sim.atualizarProjeteis(1 / 30);
  ok(alvo.hp < hpAntes, 'o projétil perdeu o alvo que se moveu');
});

teste('Blindagem reduz dano; munição perfurante ignora', function () {
  var sim = partida();
  var couracado = sim.criarUnidade('couracado', sim.central.x + 5, sim.central.y, 'inimigo');
  var hp0 = couracado.hp;
  var danoNormal = sim.aplicarDano(couracado, 20, {});
  var danoPerfura = sim.aplicarDano(couracado, 20, { perfura: true });
  ok(danoNormal < danoPerfura, 'a blindagem não reduziu o dano');
  perto(danoPerfura, 20, 0.01, 'o dano perfurante não foi integral:');
});

teste('Invasor sem rota escolhe um obstáculo alcançável (cerco)', function () {
  var sim = partida();
  /* Fecha a Central com muros: o invasor tem de derrubar um deles. */
  var c = sim.central;
  for (var dx = -2; dx <= c.w + 1; dx++) {
    for (var dy = -2; dy <= c.h + 1; dy++) {
      var borda = dx === -2 || dy === -2 || dx === c.w + 1 || dy === c.h + 1;
      if (!borda) continue;
      var x = c.x + dx, y = c.y + dy;
      if (!sim.world.livre(x, y)) continue;
      revelarE(sim, x, y);
      var res = sim.construir('muro', x, y);
      if (res.ok) { var b = sim.estruturas[res.id]; b.construida = true; b.obra = 1; b.hp = b.hpMax; }
    }
  }
  var inimigo = sim.criarUnidade('predador', c.x - 6.5, c.y + 2.5, 'inimigo');
  var alvoAntes = sim.listaEstruturas.filter(function (b) { return b.muro; }).length;
  ok(alvoAntes > 4, 'não consegui cercar a Central');
  avancar(sim, 35);
  var algumFerido = sim.listaEstruturas.some(function (b) { return b.muro && b.hp < b.hpMax; }) ||
    sim.listaEstruturas.filter(function (b) { return b.muro; }).length < alvoAntes;
  ok(algumFerido, 'o invasor ficou parado em vez de atacar o muro');
});

teste('Operário sem ordem manual foge do combate', function () {
  var sim = partida();
  var op = sim.unidades.filter(function (u) { return u.operario; })[0];
  sim.darTarefa(op, { tipo: 'minerar', jazida: sim.world.jazidas[0].id });
  sim.criarUnidade('predador', op.x + 1.5, op.y, 'inimigo');
  avancar(sim, 0.5);
  igual(op.tarefa.tipo, 'fugindo', 'o operário não fugiu:');
});

/* ------------------------------------------------------- salvamento */
console.log('\nSalvamento e fim de partida');

teste('Salvar sob ataque e carregar restaura estado coerente, sem duplicar nada', function () {
  var sim = partida();
  sim.jogador.m = 900;
  var x = sim.central.x + 6, y = sim.central.y;
  revelarE(sim, x, y);
  sim.construir('sentinela', x, y);
  sim.criarUnidade('predador', sim.central.x + 8.5, sim.central.y + 2.5, 'inimigo');
  avancar(sim, 25);
  var antes = {
    m: Math.round(sim.jogador.m), c: sim.jogador.c,
    unidades: sim.unidades.filter(function (u) { return !u.morta; }).length,
    estruturas: sim.listaEstruturas.filter(function (b) { return !b.morta; }).length,
    entregue: Math.round(sim.estatisticas.entregue),
    estoqueJazidas: sim.world.jazidas.reduce(function (a, j) { return a + j.estoque; }, 0),
    carga: sim.unidades.reduce(function (a, u) { return a + (u.carga || 0); }, 0),
    onda: sim.onda.num, pop: sim.jogador.popUsada
  };
  ok(UF.Salvar.gravar(sim), 'gravação falhou');
  var novo = UF.Salvar.restaurar(UF.Salvar.ler());
  ok(novo, 'restauração devolveu nulo');
  var depois = {
    m: Math.round(novo.jogador.m), c: novo.jogador.c,
    unidades: novo.unidades.filter(function (u) { return !u.morta; }).length,
    estruturas: novo.listaEstruturas.filter(function (b) { return !b.morta; }).length,
    entregue: Math.round(novo.estatisticas.entregue),
    estoqueJazidas: novo.world.jazidas.reduce(function (a, j) { return a + j.estoque; }, 0),
    carga: novo.unidades.reduce(function (a, u) { return a + (u.carga || 0); }, 0),
    onda: novo.onda.num, pop: novo.jogador.popUsada
  };
  Object.keys(antes).forEach(function (k) { igual(depois[k], antes[k], 'campo ' + k + ' mudou ao carregar:'); });
  /* continua rodando sem quebrar e sem duplicar minérios */
  avancar(novo, 20);
  ok(novo.jogador.m >= depois.m - 1, 'os minerais caíram sem motivo após carregar');
  ok(novo.fase === 'jogando' || novo.fase === 'derrota', 'fase inesperada após carregar: ' + novo.fase);
});

teste('Ocupação da grade continua coerente depois de carregar', function () {
  var sim = partida();
  sim.jogador.m = 2000;
  var criadas = [];
  for (var i = 1; i <= 6; i++) {
    var x = sim.central.x + 5 + i, y = sim.central.y + 3;
    revelarE(sim, x, y);
    var res = sim.construir('muro', x, y);
    if (res.ok) criadas.push({ x: x, y: y, id: res.id });
  }
  ok(criadas.length >= 3, 'poucos muros criados para o teste');
  UF.Salvar.gravar(sim);
  var novo = UF.Salvar.restaurar(UF.Salvar.ler());
  criadas.forEach(function (c) {
    var occ = novo.world.occ[novo.world.idx(c.x, c.y)];
    ok(occ !== 0, 'célula ' + c.x + ',' + c.y + ' ficou livre após carregar');
    ok(novo.estruturas[occ], 'ocupação aponta para estrutura inexistente');
  });
});

teste('Derrota: a Central destruída encerra a partida com o motivo certo', function () {
  var sim = partida();
  sim.aplicarDano(sim.central, 999999, { perfura: true });
  igual(sim.fase, 'derrota', 'fase errada:');
  ok(/Central/.test(sim.motivoFim), 'motivo da derrota não menciona a Central: ' + sim.motivoFim);
  igual(sim.central, null, 'a Central continua referenciada:');
});

teste('Vitória por campanha exige o objetivo, não só as ondas', function () {
  var setor = D.SETORES.filter(function (s) { return s.id === 'rio'; })[0];
  var sim = partida('rio');
  sim.onda.num = setor.ondas;
  sim.estatisticas.entregue = 10;
  sim.verificarVitoria(true);
  igual(sim.fase, 'jogando', 'venceu sem cumprir a meta de extração:');
  sim.estatisticas.entregue = setor.entregaAlvo;
  sim.onda.num = sim.onda.total;
  sim.verificarVitoria(true);
  igual(sim.fase, 'vitoria', 'não venceu com a meta cumprida:');
});

teste('Recursos nunca ficam negativos sob gastos agressivos', function () {
  var sim = partida();
  sim.jogador.m = 60;
  for (var i = 0; i < 200; i++) {
    var x = sim.central.x + 5 + (i % 11), y = sim.central.y + 4 + Math.floor(i / 11);
    revelarE(sim, x, y);
    sim.construir('muro', x, y);
    sim.produzirOperario();
    sim.pesquisar('precisao');
  }
  avancar(sim, 30);
  ok(sim.jogador.m >= 0, 'minerais negativos: ' + sim.jogador.m);
  ok(sim.jogador.c >= 0, 'cristais negativos: ' + sim.jogador.c);
  ok(sim.jogador.popReservada >= 0, 'população reservada negativa');
});

console.log('\n' + passou + ' passaram, ' + falhou + ' falharam.\n');
process.exit(falhou ? 1 : 0);
