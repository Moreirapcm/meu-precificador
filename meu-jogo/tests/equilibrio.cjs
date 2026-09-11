/* Simulação sem interface: uma estratégia simples joga sozinha e mede o resultado. */
global.window = global;
['util', 'data', 'world', 'path', 'geo', 'sim', 'sim-unidades', 'sim-combate']
  .forEach(function (m) { require('../src/' + m + '.js'); });
var UF = global.UF;

function localCentral(s) {
  var w = s.world, melhor = null, melhorD = Infinity;
  var cx = w.w / 2, cy = w.h / 2;
  for (var y = 3; y < w.h - 6; y++) {
    for (var x = 3; x < w.w - 6; x++) {
      if (!s.podeColocarSemExploracao('central', x, y).ok) continue;
      var d = Math.hypot(x - cx, y - cy);
      if (d < melhorD) { melhorD = d; melhor = { x: x, y: y }; }
    }
  }
  return melhor;
}

/* Tenta construir 'tipo' perto da Central, no primeiro lugar válido. */
function construirPerto(s, tipo, raioMin, raioMax) {
  var c = s.central; if (!c) return null;
  var def = UF.DATA.ESTRUTURAS[tipo];
  for (var r = raioMin; r <= raioMax; r++) {
    for (var a = 0; a < 28; a++) {
      var ang = a / 28 * Math.PI * 2;
      var x = Math.round(c.x + c.w / 2 + Math.cos(ang) * r - def.w / 2);
      var y = Math.round(c.y + c.h / 2 + Math.sin(ang) * r - def.h / 2);
      s.world.revelar(x + def.w / 2, y + def.h / 2, 3);
      var res = s.construir(tipo, x, y);
      if (res.ok) return res;
    }
  }
  return null;
}

function jogar(setor, estrategia, dificuldade) {
  var s = new UF.Sim({ setor: setor, dificuldade: dificuldade || 'comandante' });
  var pos = localCentral(s);
  if (!pos) return { erro: 'sem local para a Central' };
  s.iniciar(pos.x, pos.y);
  var dt = 1 / 20, passo = 0, limite = 20 * 60 * 45;
  var proximaAcao = 0;
  while (s.fase === 'jogando' && passo++ < limite) {
    s.atualizar(dt);
    if (s.t >= proximaAcao) { proximaAcao = s.t + 3; estrategia(s); }
  }
  return {
    fase: s.fase, t: Math.round(s.t), onda: s.onda.num,
    abates: s.estatisticas.abates, perdas: s.estatisticas.perdas,
    entregue: Math.round(s.estatisticas.entregue),
    minerais: Math.round(s.jogador.m),
    operarios: s.unidades.filter(function (u) { return u.operario && !u.morta; }).length,
    soldados: s.unidades.filter(function (u) { return u.lado === 'aliado' && !u.operario && !u.morta; }).length,
    torres: s.listaEstruturas.filter(function (b) { return b.torre && !b.morta && b.construida; }).length,
    motivo: s.motivoFim
  };
}

/* Estratégia A: só torres, sem economia extra — deve falhar cedo. */
function soTorres(s) {
  if (s.jogador.m > 120) construirPerto(s, 'sentinela', 5, 11);
}

/* Perímetro em caixa ao redor da Central, com um portão em cada lado. */
function erguerPerimetro(s, raio) {
  var c = s.central; if (!c || s.perimetroFeito) return;
  s.perimetroFeito = true;
  var cx = Math.round(c.x + c.w / 2), cy = Math.round(c.y + c.h / 2);
  var x0 = cx - raio, x1 = cx + raio, y0 = cy - raio, y1 = cy + raio;
  for (var i = -raio; i <= raio; i++) {
    s.world.revelar(cx + i, y0, 2); s.world.revelar(cx + i, y1, 2);
    s.world.revelar(x0, cy + i, 2); s.world.revelar(x1, cy + i, 2);
  }
  var lados = [[x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0]];
  for (var l = 0; l < lados.length; l++) {
    var p = s.planejarMuro(lados[l][0], lados[l][1], lados[l][2], lados[l][3], 'muro');
    /* deixa duas células livres no meio de cada lado para o portão */
    var meio = Math.floor(p.celulas.length / 2);
    p.celulas[meio].ok = false;
    if (p.celulas[meio + 1]) p.celulas[meio + 1].ok = false;
    s.confirmarMuro(p, 'muro');
    var g = p.celulas[meio];
    if (g) { s.world.revelar(g.x, g.y, 2); s.construir('portao', g.x, g.y); }
  }
}

/* Estratégia B: economia, torres, tropas, pesquisa e reparo — a "linha completa". */
function completa(s) {
  var m = s.jogador.m;
  var onda = s.onda.num;
  var nOper = s.unidades.filter(function (u) { return u.operario && !u.morta; }).length;
  var nTorres = s.listaEstruturas.filter(function (b) { return b.torre && !b.morta && !b.abandonado; }).length;
  var emObra = s.listaEstruturas.filter(function (b) { return !b.construida && !b.morta && !b.abandonado; }).length;
  var nSold = s.unidades.filter(function (u) { return u.lado === 'aliado' && !u.operario && !u.morta; }).length;
  var quartel = s.temEstrutura('quartel');
  var lab = s.temEstrutura('pesquisa');
  var popLivre = s.popLivre();

  if (onda >= 1 && !s.perimetroFeito && m > 260) { erguerPerimetro(s, 7); return; }

  /* Defesa mínima antes de cada onda: uma torre a mais por onda, até oito. */
  var torresDesejadas = Math.min(12, 3 + onda * 1.5);
  if (nTorres < torresDesejadas && emObra < 3 && m > 140) {
    var modelo = s.jogador.tech >= 3 && nTorres % 4 === 3 ? 'plasma'
      : s.jogador.tech >= 2 && nTorres % 3 === 2 ? 'artilharia' : 'sentinela';
    if (construirPerto(s, modelo, 5, 11)) return;
  }
  if (s.deficitEnergia && s.deficitEnergia.livre < 4 && emObra < 2 && m > 130) { construirPerto(s, 'gerador', 3, 9); return; }
  if (nOper < 8 && m > 90) { s.produzirOperario(); return; }
  if (!quartel && m > 220 && onda >= 1) { construirPerto(s, 'quartel', 4, 9); return; }
  if (popLivre < 4 && m > 150) { construirPerto(s, 'alojamento', 3, 8); return; }
  if (quartel && nSold < 4 + onda * 2 && m > 140) {
    if (!quartel.rally && s.central) quartel.rally = { x: s.central.x + s.central.w + 2, y: s.central.y + 2 };
    s.encomendar(quartel.id, s.jogador.tech >= 2 && nSold % 4 === 3 ? 'medico' : 'fuzileiro');
    return;
  }
  if (!lab && m > 320) { construirPerto(s, 'pesquisa', 4, 9); return; }
  if (lab && !s.jogador.pesquisaAtual) {
    var ordem = ['precisao', 'tech2', 'carga', 'muroReforcado', 'formacao', 'penetracao', 'coleta', 'tech3', 'reparoEficiente'];
    for (var i = 0; i < ordem.length; i++) if (s.pesquisar(ordem[i]).ok) return;
  }
  if (!s.reparoAuto.ativo && s.listaEstruturas.some(function (b) { return !b.morta && b.hp < b.hpMax * 0.75; })) { s.repararLinha(); return; }
  if (nOper < 12 && m > 400) { s.produzirOperario(); return; }
}

var estrategias = { 'só torres': soTorres, 'linha completa': completa };
var falhas = 0;
UF.DATA.SETORES.forEach(function (setor) {
  Object.keys(estrategias).forEach(function (nome) {
    var r = jogar(setor, estrategias[nome]);
    console.log(
      setor.nome.slice(0, 20).padEnd(21) + '| ' + nome.padEnd(15) +
      '| ' + String(r.fase).padEnd(8) + ' onda ' + String(r.onda).padStart(2) + '/' + setor.ondas +
      ' | ' + Math.floor(r.t / 60) + 'm' + String(r.t % 60).padStart(2, '0') +
      ' | abates ' + String(r.abates).padStart(3) +
      ' perdas ' + String(r.perdas).padStart(2) +
      ' | op ' + String(r.operarios).padStart(2) + ' sold ' + String(r.soldados).padStart(2) +
      ' torres ' + String(r.torres).padStart(2) +
      ' | entregue ' + String(r.entregue).padStart(5));
    if (r.erro) falhas++;
  });
});
process.exit(falhas ? 1 : 0);
