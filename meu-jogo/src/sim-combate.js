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
    var postos = [];
    for (var r = 1; postos.length < quantos && r < 9; r++) {
      for (var dy = -r; dy <= b.h + r && postos.length < quantos; dy++) {
        for (var dx = -r; dx <= b.w + r && postos.length < quantos; dx++) {
          var borda = dx < 0 || dy < 0 || dx >= b.w || dy >= b.h;
          if (!borda) continue;
          var cx = x + dx, cy = y + dy;
          if (this.world.livre(cx, cy)) postos.push({ x: cx, y: cy });
        }
      }
    }
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

  S.atirar = function (origem, alvo, arma, dt) {
    origem.recarga -= dt;
    if (origem.recarga > 0) return;
    origem.recarga = arma.cad;
    var centroO = this.centroDe(origem), centroA = this.centroDe(alvo);
    var dano = arma.dano;
    if (origem.lado !== 'inimigo' && this.jogador.pesquisas.precisao) dano *= 1.18;
    var area = arma.area || 0;
    if (area && origem.lado !== 'inimigo' && this.jogador.pesquisas.artilhariaAv) area *= 1.35;
    this.projeteis.push({
      x: centroO.x, y: centroO.y - 0.35,
      alvoId: alvo.id, lado: origem.lado,
      ultimoX: centroA.x, ultimoY: centroA.y,
      dano: dano, vel: arma.vel || 14, area: area,
      perfura: !!arma.perfura || (origem.lado !== 'inimigo' && !!this.jogador.pesquisas.penetracao && Math.random() < 1),
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
      }
    }
  };

  S.danoEmArea = function (x, y, raio, dano, ladoOrigem, opts) {
    var alvoLado = ladoOrigem === 'inimigo' ? 'aliado' : 'inimigo', i;
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

  S.aplicarDano = function (alvo, dano, opts) {
    if (!alvo || alvo.morta) return 0;
    opts = opts || {};
    var blind = (alvo.def && alvo.def.blind) || 0;
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
      this.emitir('unidadeMorta', { id: alvo.id, x: alvo.x, y: alvo.y, lado: alvo.lado, tipo: alvo.tipo });
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

  /* ---------------------------------------------------------- tropas aliadas */
  S.atualizarSoldado = function (u, dt) {
    var tarefa = u.tarefa || (u.tarefa = { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 7 });
    var arma = u.def.arma;

    if (u.def.cura) { this.atualizarMedico(u, dt); return; }

    var alvo = (u.alvo && this.alvoPorId(u.alvo)) || null;
    if (alvo && (alvo.morta || this.distanciaEntre(u, alvo) > arma.alc * 1.25)) alvo = null;
    if (!alvo && arma) {
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
      var destino = tarefa.indo ? tarefa.b : tarefa.a;
      this.irAte(u, destino, dt);
      if (this.encostouEm(u, destino, 1.2)) { tarefa.indo = !tarefa.indo; u.rota = null; }
      if (alvo && arma && this.distanciaEntre(u, alvo) <= arma.alc) { u.alvo = alvo.id; this.atirar(u, alvo, arma, dt); }
      return;
    }

    if (alvo) {
      u.alvo = alvo.id;
      var d = this.distanciaEntre(u, alvo);
      if (d > arma.alc * 0.92) {
        var limite = tarefa.tipo === 'defender' ? (tarefa.raio || 7) : 99;
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
      if (this.encostouEm(u, tarefa.destino, 0.9)) u.tarefa = { tipo: 'defender', centro: { x: u.x, y: u.y }, raio: 7 };
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

  S.irAte = function (u, destino, dt, folga) {
    if (u.voa) { this.voar(u, destino, dt); return; }
    if (this.encostouEm(u, destino, folga == null ? 0.6 : folga)) { u.rota = null; return; }
    if (!u.rota) { if (!this.pedirRota(u, destino, { raioChegada: folga ? 1 : 0 })) return; }
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
      else if (u.operario) this.atualizarOperario(u, dt);
      else this.atualizarSoldado(u, dt);
    }

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
