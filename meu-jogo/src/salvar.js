/* Última Fronteira — salvamento local.
   O terreno não é gravado: ele é reconstruído a partir da semente do setor.
   Só o que a partida mudou precisa ir para o disco. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA;
  var ESQUEMA = 3;
  var CHAVE_PARTIDA = 'uf.partida';
  var CHAVE_PROGRESSO = 'uf.progresso';

  function seguro(fn, padrao) {
    try { return fn(); } catch (e) { return padrao; }
  }

  /* Vetor de bits para a névoa: 3.600 células viram ~600 caracteres. */
  function empacotar(bytes) {
    var s = '', b = 0, n = 0;
    for (var i = 0; i < bytes.length; i++) {
      b = (b << 1) | (bytes[i] ? 1 : 0); n++;
      if (n === 6) { s += String.fromCharCode(48 + b); b = 0; n = 0; }
    }
    if (n) { b <<= (6 - n); s += String.fromCharCode(48 + b); }
    return s;
  }

  function desempacotar(s, destino) {
    var k = 0;
    for (var i = 0; i < s.length; i++) {
      var b = s.charCodeAt(i) - 48;
      for (var j = 5; j >= 0 && k < destino.length; j--) destino[k++] = (b >> j) & 1;
    }
    return destino;
  }

  function limparEntidade(e) {
    var copia = {};
    for (var k in e) {
      if (k === 'def' || k === 'rota') continue;
      var v = e[k];
      if (typeof v === 'function') continue;
      if (k === 'tarefa' && v) { copia.tarefa = JSON.parse(JSON.stringify(v)); continue; }
      copia[k] = v;
    }
    return copia;
  }

  var Salvar = {
    disponivel: function () {
      return seguro(function () {
        global.localStorage.setItem('uf.teste', '1');
        global.localStorage.removeItem('uf.teste');
        return true;
      }, false);
    },

    serializar: function (sim) {
      return {
        esquema: ESQUEMA,
        quando: Date.now(),
        setor: sim.setor.id,
        dificuldade: sim.cfg.dificuldade || 'comandante',
        modo: sim.modo,
        t: sim.t,
        fase: sim.fase,
        proximoId: sim.proximoId,
        jogador: JSON.parse(JSON.stringify(sim.jogador)),
        estatisticas: JSON.parse(JSON.stringify(sim.estatisticas)),
        onda: JSON.parse(JSON.stringify(sim.onda)),
        filaSpawn: (sim.filaSpawn || []).map(function (s) {
          return { tipo: s.tipo, em: s.em, entrada: { x: s.entrada.x, y: s.entrada.y, nome: s.entrada.nome } };
        }),
        reparoAuto: JSON.parse(JSON.stringify(sim.reparoAuto)),
        alvoPrioritario: sim.alvoPrioritario,
        escudo: sim.escudo ? JSON.parse(JSON.stringify(sim.escudo)) : null,
        bombardeios: JSON.parse(JSON.stringify(sim.bombardeios)),
        centralId: sim.central ? sim.central.id : 0,
        estruturas: sim.listaEstruturas.map(limparEntidade),
        unidades: sim.unidades.map(limparEntidade),
        projeteis: JSON.parse(JSON.stringify(sim.projeteis)),
        jazidas: sim.world.jazidas.map(function (j) {
          return { id: j.id, estoque: j.estoque, ocupadas: 0, extrator: j.extrator };
        }),
        explorado: empacotar(sim.world.explorado),
        avisouEntrega: !!sim.avisouEntrega
      };
    },

    restaurar: function (dados) {
      if (!dados || dados.esquema !== ESQUEMA) return null;
      var setor = D.SETORES.filter(function (s) { return s.id === dados.setor; })[0];
      if (!setor) return null;
      var sim = new UF.Sim({ setor: setor, dificuldade: dados.dificuldade, modo: dados.modo });

      /* Um Sim novo já planta os postos abandonados: o save é a verdade, limpa tudo. */
      for (var k = 0; k < sim.listaEstruturas.length; k++) sim.ocupar(sim.listaEstruturas[k], 0);
      sim.listaEstruturas.length = 0;
      sim.estruturas = {};
      sim.ctxAliado.estruturas = sim.estruturas;
      sim.ctxInimigo.estruturas = sim.estruturas;

      sim.t = dados.t;
      sim.fase = dados.fase;
      sim.proximoId = dados.proximoId;
      sim.jogador = dados.jogador;
      sim.estatisticas = dados.estatisticas;
      sim.onda = dados.onda;
      sim.reparoAuto = dados.reparoAuto;
      sim.alvoPrioritario = dados.alvoPrioritario || 0;
      sim.escudo = dados.escudo;
      sim.bombardeios = dados.bombardeios || [];
      sim.avisouEntrega = dados.avisouEntrega;
      sim.filaSpawn = (dados.filaSpawn || []).map(function (s) {
        return { tipo: s.tipo, em: s.em, entrada: s.entrada };
      });

      dados.jazidas.forEach(function (j) {
        var jaz = sim.world.jazidaPorId(j.id);
        if (jaz) { jaz.estoque = j.estoque; jaz.ocupadas = 0; jaz.extrator = j.extrator; }
      });
      desempacotar(dados.explorado, sim.world.explorado);

      dados.estruturas.forEach(function (e) {
        var b = e;
        b.def = D.ESTRUTURAS[e.tipo];
        sim.estruturas[b.id] = b;
        sim.listaEstruturas.push(b);
        if (!b.morta) sim.ocupar(b, b.id);
        if (b.id === dados.centralId) sim.central = b;
      });
      dados.unidades.forEach(function (e) {
        var u = e;
        u.def = u.lado === 'inimigo' ? D.INVASORES[u.tipo] : D.UNIDADES[u.tipo];
        u.rota = null;
        sim.unidades.push(u);
      });
      sim.projeteis = dados.projeteis || [];
      sim.recalcularPop();
      sim.atualizarVisao();
      return sim;
    },

    gravar: function (sim) {
      return seguro(function () {
        global.localStorage.setItem(CHAVE_PARTIDA, JSON.stringify(Salvar.serializar(sim)));
        return true;
      }, false);
    },

    ler: function () {
      return seguro(function () {
        var bruto = global.localStorage.getItem(CHAVE_PARTIDA);
        return bruto ? JSON.parse(bruto) : null;
      }, null);
    },

    apagar: function () { seguro(function () { global.localStorage.removeItem(CHAVE_PARTIDA); }); },

    /* Progresso entre setores: o que já foi concluído e o recorde de cada um. */
    progresso: function () {
      return seguro(function () {
        var bruto = global.localStorage.getItem(CHAVE_PROGRESSO);
        var p = bruto ? JSON.parse(bruto) : null;
        if (!p || !p.concluidos) p = { concluidos: {}, recordes: {} };
        return p;
      }, { concluidos: {}, recordes: {} });
    },

    gravarProgresso: function (p) {
      seguro(function () { global.localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(p)); });
    },

    concluir: function (setorId, resumo) {
      var p = Salvar.progresso();
      p.concluidos[setorId] = true;
      var atual = p.recordes[setorId];
      if (!atual || resumo.onda > atual.onda) p.recordes[setorId] = resumo;
      Salvar.gravarProgresso(p);
      return p;
    },

    liberado: function (setor) {
      if (setor.ordem === 1) return true;
      var p = Salvar.progresso();
      var anterior = D.SETORES.filter(function (s) { return s.ordem === setor.ordem - 1; })[0];
      return !anterior || !!p.concluidos[anterior.id];
    },

    /* Exportar / importar: leva a partida de um aparelho para outro. */
    exportar: function (sim) {
      return JSON.stringify({ jogo: 'ultima-fronteira', partida: Salvar.serializar(sim), progresso: Salvar.progresso() });
    },

    importar: function (texto) {
      var d = JSON.parse(texto);
      if (!d || d.jogo !== 'ultima-fronteira') throw new Error('Arquivo não é de Última Fronteira.');
      if (d.progresso) Salvar.gravarProgresso(d.progresso);
      if (d.partida) seguro(function () { global.localStorage.setItem(CHAVE_PARTIDA, JSON.stringify(d.partida)); });
      return d;
    }
  };

  UF.Salvar = Salvar;
})(typeof window !== 'undefined' ? window : globalThis);
