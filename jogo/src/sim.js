/* Última Fronteira — simulação.
   Não desenha nada e não lê a interface: recebe comandos, valida, altera o estado
   e publica eventos. A apresentação só lê. (Documento de projeto, página 21.) */
(function (global) {
  'use strict';
  var UF = global.UF || (global.UF = {});
  var D = UF.DATA, U = UF.util;
  var ESTR = D.ESTRUTURAS, UNID = D.UNIDADES, INV = D.INVASORES, R = D.REGRAS;

  function Sim(cfg) {
    this.cfg = cfg;
    this.setor = cfg.setor;
    this.dif = D.DIFICULDADES[cfg.dificuldade || 'comandante'];
    this.modo = cfg.modo || 'campanha';
    this.world = new UF.World(this.setor);
    this.nav = new UF.Navegador(this.world);
    this.t = 0;
    this.proximoId = 1;
    this.estruturas = {};
    this.listaEstruturas = [];
    this.unidades = [];
    this.projeteis = [];
    this.eventos = [];
    this.fase = 'colocacao';          /* colocacao -> jogando -> vitoria | derrota */
    this.pausado = false;
    this.velocidade = 1;
    this.central = null;
    this.alvoPrioritario = 0;
    this.escudo = null;
    this.bombardeios = [];
    this.avisos = [];
    this.estatisticas = { abates: 0, perdas: 0, entregue: 0, gastoReparo: 0, operariosPerdidos: 0 };
    this.reparoAuto = { ativo: false, reserva: R.reservaReparo, max: 2 };

    this.jogador = {
      m: this.setor.minerais != null ? this.setor.minerais : R.minerais,
      c: 0,
      energia: 60,
      popCap: R.popInicial,
      popUsada: 0,
      popReservada: 0,
      tech: 1,
      pesquisas: {},
      pesquisaAtual: null
    };

    this.onda = {
      num: 0,
      total: this.modo === 'sobrevivencia' ? Infinity : this.setor.ondas,
      estado: 'preparo',
      tempo: R.primeiroAtaque,
      direcoes: [],
      vivos: 0,
      anunciada: false
    };
    if (this.modo === 'livre') this.onda.tempo = Infinity;
    this.ctxAliado = { estruturas: this.estruturas, aliado: true };
    this.ctxInimigo = { estruturas: this.estruturas, aliado: false, custoMuro: 42 };
    if (this.setor.ruinas) this.plantarPostosAbandonados();
  }

  /* Postos de resistência que caíram antes de você chegar. Ficam pelo mapa como
     obras paradas: um operário reativa cada um sem custo de minerais, só de tempo. */
  Sim.prototype.plantarPostosAbandonados = function () {
    var rand = U.rng(this.setor.semente * 7717 + 13);
    var catalogo = ['sentinela', 'deposito', 'gerador', 'alojamento', 'sentinela'];
    var w = this.world, cx = w.w / 2, cy = w.h / 2;
    var colocados = 0, tentativas = 0;
    while (colocados < this.setor.ruinas && tentativas++ < 4000) {
      var tipo = catalogo[Math.floor(rand() * catalogo.length)];
      var def = ESTR[tipo];
      var ang = rand() * Math.PI * 2, raio = 11 + rand() * (w.w * 0.33);
      var x = Math.round(cx + Math.cos(ang) * raio), y = Math.round(cy + Math.sin(ang) * raio);
      if (x < 2 || y < 2 || x + def.w > w.w - 2 || y + def.h > w.h - 2) continue;
      if (!w.areaLivre(x, y, def.w, def.h)) continue;
      if (!w.temAcessoPorRua(x, y, def.w, def.h)) continue;
      var muitoPerto = false;
      for (var i = 0; i < this.listaEstruturas.length; i++) {
        var b = this.listaEstruturas[i];
        if (U.dist(b.x, b.y, x, y) < 9) { muitoPerto = true; break; }
      }
      if (muitoPerto) continue;
      var posto = this.criarEstrutura(tipo, x, y, false);
      posto.abandonado = true;
      posto.custo = { m: 0, c: 0 };        /* reativar não custa minerais, só trabalho */
      posto.obra = 0.18;
      posto.hp = Math.max(1, posto.hpMax * 0.2);
      colocados++;
    }
  };

  Sim.prototype.emitir = function (tipo, dados) {
    dados = dados || {}; dados.tipo = tipo; dados.t = this.t;
    this.eventos.push(dados);
    if (this.eventos.length > 200) this.eventos.splice(0, this.eventos.length - 200);
  };

  Sim.prototype.aviso = function (texto, nivel) {
    this.avisos.push({ texto: texto, nivel: nivel || 'info', t: this.t });
    this.emitir('aviso', { texto: texto, nivel: nivel || 'info' });
  };

  /* ------------------------------------------------------------- consultas */
  Sim.prototype.custoDe = function (def) {
    return { m: (def.custo && def.custo.m) || 0, c: (def.custo && def.custo.c) || 0 };
  };

  Sim.prototype.temRecurso = function (custo) {
    return this.jogador.m >= (custo.m || 0) && this.jogador.c >= (custo.c || 0);
  };

  Sim.prototype.cobrar = function (custo) {
    this.jogador.m = Math.max(0, this.jogador.m - (custo.m || 0));
    this.jogador.c = Math.max(0, this.jogador.c - (custo.c || 0));
  };

  Sim.prototype.devolver = function (custo, fator) {
    fator = fator == null ? 1 : fator;
    this.jogador.m += Math.round((custo.m || 0) * fator);
    this.jogador.c += Math.round((custo.c || 0) * fator);
  };

  /* Capacidade elétrica não é moeda acumulável: é distribuída a cada quadro.
     Em déficit, as torres têm prioridade e a produção avançada pausa primeiro
     (documento de projeto, página 11). Cada estrutura recebe 'semEnergia'. */
  Sim.prototype.energiaEstrutural = function () {
    var fornece = 0, consome = 0, torres = [], producao = [], i, b;
    for (i = 0; i < this.listaEstruturas.length; i++) {
      b = this.listaEstruturas[i];
      if (!b.construida || b.morta) { if (b) b.semEnergia = false; continue; }
      fornece += b.def.fornece || 0;
      if (!b.def.energia) { b.semEnergia = false; continue; }
      consome += b.def.energia;
      (b.torre ? torres : producao).push(b);
    }
    var restante = fornece;
    /* Torre desligada pelo jogador não consome e não entra na conta. */
    for (i = 0; i < torres.length; i++) {
      b = torres[i];
      if (b.desligada) { b.semEnergia = true; continue; }
      if (restante >= b.def.energia) { restante -= b.def.energia; b.semEnergia = false; }
      else b.semEnergia = true;
    }
    for (i = 0; i < producao.length; i++) {
      b = producao[i];
      if (restante >= b.def.energia) { restante -= b.def.energia; b.semEnergia = false; }
      else b.semEnergia = true;
    }
    return {
      fornece: fornece, consome: consome, livre: restante,
      deficit: Math.max(0, consome - fornece)
    };
  };

  Sim.prototype.popLivre = function () {
    return this.jogador.popCap - this.jogador.popUsada - this.jogador.popReservada;
  };

  Sim.prototype.recalcularPop = function () {
    var cap = R.popInicial, usada = 0, i;
    for (i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (b.construida && !b.morta && b.def.pop) cap += b.def.pop;
    }
    for (i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (u.lado === 'aliado' && !u.morta) usada += u.def.pop || 0;
    }
    this.jogador.popCap = cap;
    this.jogador.popUsada = usada;
  };

  Sim.prototype.temEstrutura = function (tipo) {
    for (var i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (b.tipo === tipo && b.construida && !b.morta) return b;
    }
    return null;
  };

  /* Motivo textual quando um item ainda não pode ser usado. */
  Sim.prototype.requisitoFaltante = function (def) {
    if (!def.req) return null;
    if (def.req.tech && this.jogador.tech < def.req.tech) {
      return 'Exige tecnologia ' + ['', 'I', 'II', 'III'][def.req.tech];
    }
    if (def.req.ed && !this.temEstrutura(def.req.ed)) {
      return 'Exige ' + ESTR[def.req.ed].nome;
    }
    return null;
  };

  /* -------------------------------------------------------- posicionamento */
  Sim.prototype.podeColocar = function (tipo, x, y) {
    var def = ESTR[tipo];
    if (!def) return { ok: false, motivo: 'Estrutura desconhecida' };
    var falta = this.requisitoFaltante(def);
    if (falta) return { ok: false, motivo: falta };
    var w = this.world;
    for (var dy = 0; dy < def.h; dy++) {
      for (var dx = 0; dx < def.w; dx++) {
        var cx = x + dx, cy = y + dy;
        if (!w.dentro(cx, cy)) return { ok: false, motivo: 'Fora do setor' };
        var i = w.idx(cx, cy);
        if (w.solido(cx, cy)) return { ok: false, motivo: 'Terreno intransponível' };
        if (w.terreno[i] === D.TERRENO.CRATERA) return { ok: false, motivo: 'Cratera: terreno irregular' };
        if (w.occ[i] !== 0) return { ok: false, motivo: 'Já existe uma estrutura aqui' };
        if (def.sobre) {
          var jaz = w.jazidaPorId(w.recurso[i]);
          if (!jaz || jaz.tipo !== def.sobre) return { ok: false, motivo: 'Precisa ficar sobre uma jazida de cristais' };
        } else if (w.recurso[i] !== 0) {
          return { ok: false, motivo: 'Sobre uma jazida' };
        }
        if (!w.explorado[i]) return { ok: false, motivo: 'Terreno ainda não explorado' };
      }
    }
    if (def.sobre) {
      var j0 = w.jazidaPorId(w.recurso[w.idx(x, y)]);
      if (!j0 || j0.x !== x || j0.y !== y) return { ok: false, motivo: 'Alinhe o extrator com a jazida' };
      if (j0.extrator) return { ok: false, motivo: 'Esta jazida já tem extrator' };
    }
    if (tipo !== 'central' && !this.central) return { ok: false, motivo: 'Instale a Central de Comando primeiro' };
    if (tipo === 'central' && this.central) return { ok: false, motivo: 'A Central já foi instalada' };
    /* A Central precisa de rota até alguma jazida de minerais (página 6). */
    if (tipo === 'central') {
      if (!this.existeRotaParaJazida(x, y, def)) return { ok: false, motivo: 'Sem rota até uma jazida de minerais' };
      for (var e = 0; e < w.entradas.length; e++) {
        if (U.dist(w.entradas[e].x, w.entradas[e].y, x, y) < 9) return { ok: false, motivo: 'Perto demais de uma zona de invasão' };
      }
    }
    var custo = this.custoDe(def);
    if (tipo !== 'central' && !this.temRecurso(custo)) {
      return { ok: false, motivo: 'Recursos insuficientes', custo: custo };
    }
    return { ok: true, custo: custo };
  };

  Sim.prototype.existeRotaParaJazida = function (x, y, def) {
    var w = this.world;
    var partida = this.nav.celulaLivreProxima(x - 1, y - 1, 6) || this.nav.celulaLivreProxima(x + def.w, y + def.h, 6);
    if (!partida) return false;
    var alc = this.nav.alcancaveis(partida.x, partida.y, this.ctxAliado);
    for (var k = 0; k < w.jazidas.length; k++) {
      var j = w.jazidas[k];
      if (j.tipo !== 'mineral') continue;
      for (var dy = -1; dy <= j.h; dy++) {
        for (var dx = -1; dx <= j.w; dx++) {
          var cx = j.x + dx, cy = j.y + dy;
          if (w.dentro(cx, cy) && alc[w.idx(cx, cy)]) return true;
        }
      }
    }
    return false;
  };

  Sim.prototype.ocupar = function (b, valor) {
    var w = this.world;
    for (var dy = 0; dy < b.h; dy++) {
      for (var dx = 0; dx < b.w; dx++) {
        if (w.dentro(b.x + dx, b.y + dy)) w.occ[w.idx(b.x + dx, b.y + dy)] = valor;
      }
    }
    w.versaoRota++;
  };

  /* Cria a estrutura. instantanea = true só na instalação da Central. */
  Sim.prototype.criarEstrutura = function (tipo, x, y, instantanea) {
    var def = ESTR[tipo];
    var b = {
      id: this.proximoId++, tipo: tipo, def: def, x: x, y: y, w: def.w, h: def.h,
      hp: 0, hpMax: this.hpMaximo(def, tipo), obra: instantanea ? 1 : 0,
      construida: !!instantanea, morta: false,
      fila: [], progresso: 0, rally: null, recarga: 0, alvo: 0,
      portao: !!def.portao, portaoModo: 'auto', portaoAberto: true,
      muro: !!def.muro, torre: def.papel === 'torre', deposito: def.papel === 'deposito',
      construtores: 0, jazida: 0, acumulado: 0, custo: this.custoDe(def)
    };
    b.hp = instantanea ? b.hpMax : Math.max(1, b.hpMax * 0.08);
    this.estruturas[b.id] = b;
    this.listaEstruturas.push(b);
    this.ocupar(b, b.id);
    if (def.sobre) {
      var jaz = this.world.jazidaPorId(this.world.recurso[this.world.idx(x, y)]);
      if (jaz) { jaz.extrator = b.id; b.jazida = jaz.id; }
    }
    if (tipo === 'central') this.central = b;
    this.recalcularPop();
    this.emitir('estruturaCriada', { id: b.id, tipo: tipo, x: x, y: y });
    return b;
  };

  Sim.prototype.hpMaximo = function (def, tipo) {
    var hp = def.hp;
    if (def.muro && this.jogador.pesquisas.muroReforcado) hp *= 1.6;
    return Math.round(hp);
  };

  /* Comando do jogador: encomenda a construção e designa um operário. */
  Sim.prototype.construir = function (tipo, x, y) {
    var ver = this.podeColocar(tipo, x, y);
    if (!ver.ok) return ver;
    this.cobrar(ver.custo);
    var b = this.criarEstrutura(tipo, x, y, false);
    var op = this.operarioLivreMaisProximo(x, y);
    if (op) this.darTarefa(op, { tipo: 'construir', alvo: b.id });
    else this.aviso(def_nome(tipo) + ': obra aguardando um operário livre.', 'atencao');
    return { ok: true, id: b.id };
  };

  function def_nome(tipo) { return ESTR[tipo].nome; }

  /* Traçado de muro por arraste: devolve as células válidas e o custo total. */
  Sim.prototype.planejarMuro = function (x0, y0, x1, y1, tipo) {
    tipo = tipo || 'muro';
    var def = ESTR[tipo];
    var celulas = [], vistas = {};
    var dx = x1 - x0, dy = y1 - y0;
    var passos = Math.max(Math.abs(dx), Math.abs(dy));
    /* Linha em L: primeiro o eixo mais longo, depois o outro. Fácil de prever. */
    var pontos = [];
    if (Math.abs(dx) >= Math.abs(dy)) {
      for (var i = 0; i <= Math.abs(dx); i++) pontos.push({ x: x0 + Math.sign(dx) * i, y: y0 });
      for (var j = 1; j <= Math.abs(dy); j++) pontos.push({ x: x1, y: y0 + Math.sign(dy) * j });
    } else {
      for (var k = 0; k <= Math.abs(dy); k++) pontos.push({ x: x0, y: y0 + Math.sign(dy) * k });
      for (var l = 1; l <= Math.abs(dx); l++) pontos.push({ x: x0 + Math.sign(dx) * l, y: y1 });
    }
    var validas = 0, invalidas = 0;
    for (var p = 0; p < pontos.length; p++) {
      var c = pontos[p], chave = c.x + ',' + c.y;
      if (vistas[chave]) continue;
      vistas[chave] = 1;
      var ver = this.podeColocarIgnorandoCusto(tipo, c.x, c.y);
      celulas.push({ x: c.x, y: c.y, ok: ver.ok, motivo: ver.motivo });
      if (ver.ok) validas++; else invalidas++;
    }
    var custoUnit = this.custoDe(def);
    return {
      celulas: celulas, validas: validas, invalidas: invalidas,
      custo: { m: custoUnit.m * validas, c: custoUnit.c * validas },
      passos: passos
    };
  };

  Sim.prototype.podeColocarIgnorandoCusto = function (tipo, x, y) {
    var mGuardado = this.jogador.m, cGuardado = this.jogador.c;
    this.jogador.m = Infinity; this.jogador.c = Infinity;
    var ver = this.podeColocar(tipo, x, y);
    this.jogador.m = mGuardado; this.jogador.c = cGuardado;
    return ver;
  };

  /* Confirma o traçado. Operação atômica: nada é cobrado se o perímetro prender alguém. */
  Sim.prototype.confirmarMuro = function (plano, tipo) {
    tipo = tipo || 'muro';
    var custoUnit = this.custoDe(ESTR[tipo]);
    var validas = plano.celulas.filter(function (c) { return c.ok; });
    if (!validas.length) return { ok: false, motivo: 'Nenhum trecho válido no traçado' };
    var total = { m: custoUnit.m * validas.length, c: custoUnit.c * validas.length };
    if (!this.temRecurso(total)) return { ok: false, motivo: 'Recursos insuficientes para o traçado' };
    var aprisiona = this.aprisionaria(validas);
    if (aprisiona) return { ok: false, motivo: aprisiona };
    this.cobrar(total);
    var criadas = [];
    for (var i = 0; i < validas.length; i++) {
      var b = this.criarEstrutura(tipo, validas[i].x, validas[i].y, false);
      criadas.push(b.id);
    }
    this.distribuirObras();
    return { ok: true, ids: criadas, custo: total };
  };

  /* Simula a ocupação e verifica se o traçado prenderia alguém.
     Recusa dois casos: uma unidade que ficaria sem nenhuma célula livre ao redor,
     e um perímetro que deixaria a base sem acesso a qualquer jazida de minerais. */
  Sim.prototype.aprisionaria = function (celulas) {
    var w = this.world, i;
    var marcadas = [];
    for (i = 0; i < celulas.length; i++) {
      var idx = w.idx(celulas[i].x, celulas[i].y);
      if (w.occ[idx] === 0) { w.occ[idx] = -1; marcadas.push(idx); }
    }

    function desfazer() { for (var k = 0; k < marcadas.length; k++) w.occ[marcadas[k]] = 0; }

    /* 1. Unidade completamente cercada: nenhuma célula livre vizinha. */
    for (i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (u.lado !== 'aliado' || u.morta || u.voa) continue;
      var ux = Math.floor(u.x), uy = Math.floor(u.y);
      var saida = false;
      for (var dy = -1; dy <= 1 && !saida; dy++) {
        for (var dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          if (w.livre(ux + dx, uy + dy)) { saida = true; break; }
        }
      }
      if (!saida) { desfazer(); return 'O traçado prenderia ' + u.def.nome.toLowerCase() + ' sem saída nenhuma.'; }
    }

    /* 2. Base sem rota para nenhuma jazida de minerais. */
    var temJazida = false;
    for (var k = 0; k < w.jazidas.length; k++) {
      if (w.jazidas[k].tipo === 'mineral' && w.jazidas[k].estoque > 0) { temJazida = true; break; }
    }
    if (temJazida) {
      var base = this.central || null;
      var partida = base
        ? this.nav.celulaLivreProxima(base.x + base.w / 2, base.y - 1, 6)
        : null;
      if (!partida) {
        for (i = 0; i < this.unidades.length && !partida; i++) {
          var op = this.unidades[i];
          if (op.lado === 'aliado' && !op.morta && !op.voa) partida = this.nav.celulaLivreProxima(op.x, op.y, 4);
        }
      }
      if (partida) {
        var alc = this.nav.alcancaveis(partida.x, partida.y, { estruturas: this.estruturas, aliado: true });
        var achou = false;
        for (var j = 0; j < w.jazidas.length && !achou; j++) {
          var jz = w.jazidas[j];
          if (jz.tipo !== 'mineral' || jz.estoque <= 0) continue;
          for (var ay = -1; ay <= jz.h && !achou; ay++) {
            for (var ax = -1; ax <= jz.w; ax++) {
              var cx = jz.x + ax, cy = jz.y + ay;
              if (w.dentro(cx, cy) && alc[w.idx(cx, cy)]) { achou = true; break; }
            }
          }
        }
        if (!achou) { desfazer(); return 'O traçado deixaria a base sem acesso a nenhuma jazida. Use um portão.'; }
      }
    }

    desfazer();
    return null;
  };

  UF.Sim = Sim;
  UF._simDefNome = def_nome;
})(typeof window !== 'undefined' ? window : globalThis);
