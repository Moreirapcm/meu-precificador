/* Simulação sem interface: uma estratégia simples joga sozinha e mede o resultado.

   PADRÃO DE REFERÊNCIA (15/09/2026), depois de o medidor passar a enxergar a
   árvore de pesquisa: 2 vitórias e 10 derrotas, nenhum jogo em "jogando".
   Manaus vence nas duas estratégias — é o setor de entrada, e vencer lá com
   torre é aceitável. O Rio só vence com a linha completa. E em nenhum setor a
   estratégia "só torres" chega mais longe que a linha completa, que é a
   invariante do projeto: empilhar torre não sustenta a campanha.

   Ao mexer aqui, lembre que este arquivo não é teste: é INSTRUMENTO. Já esteve
   cego três vezes — não construía o Centro de Pesquisa, não comprava a
   tecnologia II, não tinha barril nenhum — e cada vez aprovou ou reprovou uma
   mudança pelo motivo errado. */
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

/* A FILA DE PESQUISA do jogador simulado. Toda melhoria nova precisa entrar
   aqui: o que o simulado não compra, a medição não enxerga — foi o que
   aconteceu com a linha de blindagem de tropa na primeira rodada.

   `tech2` vem PRIMEIRO, e é o que destrava o resto: sem ela não há médico, nem
   bomba de petróleo, nem artilharia, nem bastião, nem blindagem composta. Com
   ela em terceiro lugar o simulado comprava as baratas primeiro, o saldo nunca
   encostava nos 250 e ele terminava as doze partidas em tecnologia 1 — que é
   metade do jogo por medir. */
var ORDEM_PESQUISA = ['tech2', 'precisao', 'blindagem1', 'carga', 'muroReforcado',
  'pontaria', 'alvenaria', 'formacao', 'penetracao', 'tiroRasante', 'blindagem2',
  'coleta', 'tech3', 'reparoEficiente'];

/* A PRÓXIMA pesquisa da fila que dá para comprar — a mesma para reservar e
   para comprar, e é aí que está o conserto.

   Antes a compra era "a primeira da lista que couber no bolso", e isso anulava
   a reserva: o saldo era guardado para uma de 220, mas assim que passava de
   140 ele comprava outra mais barata lá de baixo e recomeçava do zero. Medido,
   `pontaria` (220) nunca era comprada em doze partidas, mesmo com a reserva
   guardando por ela. Compra ESTRITA na ordem da fila: ou é a próxima, ou é
   nenhuma, e a reserva junta o dinheiro sem ninguém furar a fila. */
function proximaPesquisa(s) {
  for (var i = 0; i < ORDEM_PESQUISA.length; i++) {
    var id = ORDEM_PESQUISA[i];
    if (s.jogador.pesquisas[id]) continue;
    var def = null, lista = UF.DATA.PESQUISAS;
    for (var j = 0; j < lista.length; j++) if (lista[j].id === id) def = lista[j];
    if (!def) continue;
    /* requisito não cumprido: não adianta guardar para o que não se pode
       comprar ainda — a fila anda para a próxima. */
    /* BARRIL QUE NÃO SE TEM não se guarda: a fila anda, e quando o petróleo
       chegar ela volta a ser a primeira. */
    if ((def.custo.c || 0) > s.jogador.c) continue;
    /* Quem decide se está liberada é o JOGO, não uma cópia da regra aqui.
       A cópia já errou uma vez: ela lia `tech: 2` da própria `tech2` como
       requisito, e como o jogador está em tecnologia 1 a fila pulava justamente
       a pesquisa que dá a tecnologia 2 — as doze partidas terminavam em
       tecnologia 1 de novo. `pesquisaDisponivel` tem a exceção certa, e usá-la
       é a única forma de o simulador não divergir da regra que ele mede. */
    var ver = s.pesquisaDisponivel(def);
    if (ver.ok || ver.motivo === 'Recursos insuficientes') return def;
    continue;
  }
  return null;
}

/* Quanto guardar para a próxima pesquisa da fila. Zero enquanto não houver
   laboratório ou enquanto já houver uma em curso. */
function reservaDePesquisa(s, lab) {
  if (!lab || s.jogador.pesquisaAtual) return 0;
  var def = proximaPesquisa(s);
  return def ? (def.custo.m || 0) : 0;
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

  /* RESERVA DE PESQUISA. Sem ela o simulado gastava tudo assim que cruzava o
     limiar de torre ou de tropa, o saldo nunca subia de 150, e a árvore inteira
     acima disso — blindagem 170, tecnologia II 250, alvenaria 200 — ficava
     fora de alcance PARA SEMPRE. Medido: nas doze partidas ele concluía só
     `carga`, `precisao` e `muroReforcado`, e nunca passava de tecnologia 1.
     Uma medição que não enxerga a pesquisa não mede pesquisa nenhuma.

     A reserva é o preço da PRÓXIMA da fila, guardado antes de qualquer gasto
     discricionário. Não trava: a renda continua entrando, e o que ele deixa de
     construir é o excedente, não o essencial. */
  /* Sem laboratório a reserva era ZERO, e aí o laboratório nunca saía: o saldo
     era consumido por torre e tropa antes de chegar aos 180 dele. Ciclo
     fechado — sem lab não há reserva, sem reserva não há lab. Medido no Rio:
     `pesq 0` e `tech 1` do primeiro ao último segundo, nas nove ondas.
     Enquanto não existe, o que se guarda é o preço DELE. */
  var custoLab = UF.DATA.ESTRUTURAS.pesquisa.custo.m;
  /* ...mas SÓ COM A DEFESA DA ONDA JÁ DE PÉ. Guardando sempre, o simulado da
     linha completa chegava às ondas com 1 a 5 torres contra as 10 a 12 do "só
     torres", e terminava PIOR que ele — o que inverte o diagnóstico do projeto
     e não é modelo de jogador nenhum. Ninguém deixa de erguer torre para juntar
     uma pesquisa; pesquisa-se com o que sobra depois da linha montada.
     Duas medições erradas antes desta: reservar desde a onda 1 estrangulava a
     defesa inicial, e reservar a partir de quatro torres estrangulava o resto. */
  var torresDesejadas = Math.min(12, 3 + onda * 1.5);
  var defesaEmDia = nTorres >= torresDesejadas;
  var reserva = !defesaEmDia ? 0 : (lab ? reservaDePesquisa(s, lab) : custoLab);
  var mLivre = m - reserva;

  if (onda >= 1 && !s.perimetroFeito && m > 260) { erguerPerimetro(s, 7); return; }

  /* BOMBA DE PETRÓLEO, e ela vem ANTES das torres. Sem ela o simulado nunca
     tinha um barril, e barril é requisito de metade das coisas caras — médico,
     blindagem composta, tiro rasante, artilharia avançada, reator, tecnologia
     III. Media-se um jogador que só podia comprar metade da árvore.

     Embaixo da roda de torres ela nunca disparava: medido, ZERO tentativas em
     10.591 quadros com tecnologia 2 disponível. A torre leva tudo o que passa
     de 140 a cada chamada, então o saldo nunca encostava nos 200 exigidos.
     É uma construção só por partida e é infraestrutura: vem primeiro. */
  if (s.jogador.tech >= 2 && !s.temEstrutura('extrator') && mLivre > 160 && emObra < 3) {
    var jazP = s.world.jazidas.filter(function (j) {
      return j.tipo === 'petroleo' && !j.extrator && j.estoque > 0;
    });
    for (var ip = 0; ip < jazP.length; ip++) {
      /* revela para poder construir: o jogador de verdade explora, e o
         simulado não tem laço de exploração nenhum */
      s.world.revelar(jazP[ip].x + 1, jazP[ip].y + 1, 3);
      if (s.construir('extrator', jazP[ip].x, jazP[ip].y).ok) return;
    }
  }

  /* Defesa mínima antes de cada onda: uma torre a mais por onda, até oito. */
  if (nTorres < torresDesejadas && emObra < 3 && mLivre > 140) {
    /* O BASTIÃO entrou na roda porque ele é o único prédio com aura, e o que o
       simulador nunca constrói o simulador nunca mede. */
    var modelo = s.jogador.tech >= 3 && nTorres % 4 === 3 ? 'plasma'
      : s.jogador.tech >= 2 && nTorres % 3 === 2 ? 'artilharia'
      : s.jogador.tech >= 2 && nTorres % 5 === 4 ? 'bastiao' : 'sentinela';
    if (construirPerto(s, modelo, 5, 11)) return;
  }

  if (s.deficitEnergia && s.deficitEnergia.livre < 4 && emObra < 2 && m > 130) { construirPerto(s, 'gerador', 3, 9); return; }
  if (nOper < 8 && mLivre > 90) { s.produzirOperario(); return; }
  if (!quartel && m > 220 && onda >= 1) { construirPerto(s, 'quartel', 4, 9); return; }
  /* O CENTRO DE PESQUISA subiu de prioridade, e não é ajuste de gosto: com ele
     lá embaixo, exigindo 320 de minério DEPOIS de torre, operário, alojamento e
     tropa, o simulado nunca chegava a 320 sobrando — e por isso nunca construía
     o laboratório, nunca pesquisava NADA e nunca passava de tecnologia 1.
     Medido: `pesquisas: (vazio)`, `max tech 1`, nas doze partidas.
     Toda medição de pesquisa feita com este arquivo era cega, inclusive a da
     linha de blindagem e a da alvenaria. */
  if (!lab && m >= custoLab && onda >= 1) { construirPerto(s, 'pesquisa', 4, 9); return; }
  if (popLivre < 4 && mLivre > 150) { construirPerto(s, 'alojamento', 3, 8); return; }
  if (quartel && nSold < 4 + onda * 2 && mLivre > 140) {
    if (!quartel.rally && s.central) quartel.rally = { x: s.central.x + s.central.w + 2, y: s.central.y + 2 };
    /* O médico custa 15 barris. Pedir sem ter barril não era só "não sai
       médico": `encomendar` falhava e o `return` vinha do mesmo jeito, então o
       simulado ficava preso nesta linha, tentando e falhando a cada quadro,
       sem construir, sem pesquisar e sem reparar — enquanto `nSold % 4` não
       mudasse, e ele só mudaria se saísse tropa. Toda medição com tropa e
       tech 2 carregava esse travamento. */
    var querMedico = s.jogador.tech >= 2 && nSold % 4 === 3 && s.jogador.c >= 15;
    s.encomendar(quartel.id, querMedico ? 'medico' : 'fuzileiro');
    return;
  }
  if (lab && !s.jogador.pesquisaAtual) {
    /* A ordem inclui a linha de BLINDAGEM logo depois de `precisao`: sem ela na
       lista, o simulador nunca compra a pesquisa nova e a medição de
       equilíbrio não enxerga a mudança — foi o que aconteceu na primeira
       rodada, que deu diferença zero em doze partidas. */
    /* `alvenaria` entra logo depois de `muroReforcado`, que é o requisito dela:
       sem estar na lista, o simulador nunca compra a pesquisa nova e a medição
       de equilíbrio dá diferença zero — foi o que aconteceu com a linha de
       blindagem de tropa na primeira rodada. */
    var alvo = proximaPesquisa(s);
    if (alvo && s.pesquisar(alvo.id).ok) return;
  }
  if (!s.reparoAuto.ativo && s.listaEstruturas.some(function (b) { return !b.morta && b.hp < b.hpMax * 0.75; })) { s.repararLinha(); return; }
  if (nOper < 12 && mLivre > 400) { s.produzirOperario(); return; }
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
