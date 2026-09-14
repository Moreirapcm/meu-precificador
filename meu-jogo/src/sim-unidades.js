/* Última Fronteira — operários, tropas, produção e pesquisa.
   Estende UF.Sim. */
(function (global) {
  'use strict';
  var UF = global.UF, D = UF.DATA, U = UF.util;
  var ESTR = D.ESTRUTURAS, UNID = D.UNIDADES, R = D.REGRAS;
  var S = UF.Sim.prototype;

  /* ---------------------------------------------------------- criar unidade */
  S.criarUnidade = function (tipo, x, y, lado) {
    var def = (lado === 'inimigo' ? D.INVASORES[tipo] : UNID[tipo]);
    var u = {
      id: this.proximoId++, tipo: tipo, def: def, lado: lado || 'aliado',
      x: x, y: y, hp: this.hpUnidade(def, lado), hpMax: this.hpUnidade(def, lado),
      vel: def.vel, velMod: 1, lentoAte: 0,
      rota: null, passo: 0, destino: null, tarefa: null,
      alvo: 0, recarga: 0, carga: 0, cargaTipo: 'mineral',
      voa: !!def.voa, raio: def.raio || 0.3, morta: false,
      operario: tipo === 'operario', grupo: null, bloqueado: false,
      reservaCura: def.cura ? def.cura.reserva : 0,
      versaoRota: 0, tentarRotaEm: 0, ordemManual: false, angulo: 0, animacao: Math.random() * 6
    };
    if (u.operario) u.tarefa = { tipo: 'ocioso' };
    this.unidades.push(u);
    if (u.lado === 'aliado') this.recalcularPop();
    this.emitir('unidadeCriada', { id: u.id, tipo: tipo, lado: u.lado });
    return u;
  };

  S.hpUnidade = function (def, lado) {
    var hp = def.hp;
    if (lado !== 'inimigo' && def.pop && this.jogador.pesquisas.formacao) hp *= 1.2;
    return Math.round(hp);
  };

  S.unidadePorId = function (id) {
    for (var i = 0; i < this.unidades.length; i++) if (this.unidades[i].id === id) return this.unidades[i];
    return null;
  };

  S.alvoPorId = function (id) {
    return this.estruturas[id] || this.unidadePorId(id) || null;
  };

  /* --------------------------------------------------------------- tarefas */
  S.darTarefa = function (u, tarefa, manual) {
    if (!u || u.morta) return;
    u.tarefa = tarefa;
    u.rota = null; u.passo = 0; u.bloqueado = false;
    u.tentarRotaEm = 0;
    u.ordemManual = !!manual;
    if (tarefa.tipo === 'minerar') { tarefa.estado = u.carga > 0 ? 'voltando' : 'indo'; tarefa.relogio = 0; }
    if (tarefa.tipo === 'construir') {
      var b = this.estruturas[tarefa.alvo];
      if (b) b.construtores++;
    }
  };

  S.operarioLivreMaisProximo = function (x, y) {
    var melhor = null, melhorD = Infinity;
    for (var i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (!u.operario || u.morta) continue;
      var t = u.tarefa && u.tarefa.tipo;
      var prioridade = t === 'ocioso' ? 0 : (t === 'minerar' ? 1 : 3);
      if (prioridade >= 3) continue;
      var d = U.dist(u.x, u.y, x, y) + prioridade * 8;
      if (d < melhorD) { melhorD = d; melhor = u; }
    }
    return melhor;
  };

  /* Obras sem responsável recebem o operário livre mais próximo. */
  S.distribuirObras = function () {
    for (var i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (b.construida || b.morta || b.construtores > 0 || b.abandonado) continue;
      var op = this.operarioLivreMaisProximo(b.x, b.y);
      if (!op) break;
      this.darTarefa(op, { tipo: 'construir', alvo: b.id });
    }
  };

  S.jazidaLivreMaisProxima = function (x, y, tipo) {
    var w = this.world, melhor = null, melhorD = Infinity;
    for (var i = 0; i < w.jazidas.length; i++) {
      var j = w.jazidas[i];
      if (j.estoque <= 0) continue;
      if (j.tipo !== (tipo || 'mineral')) continue;
      if (j.extrator) continue;
      if (j.ocupadas >= j.vagas) continue;
      var d = U.distToRect(x, y, j.x, j.y, j.w, j.h);
      if (d < melhorD) { melhorD = d; melhor = j; }
    }
    return melhor;
  };

  S.depositoMaisProximo = function (x, y) {
    var melhor = null, melhorD = Infinity;
    for (var i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (!b.deposito || !b.construida || b.morta) continue;
      var d = U.distToRect(x, y, b.x, b.y, b.w, b.h);
      if (d < melhorD) { melhorD = d; melhor = b; }
    }
    return melhor;
  };

  /* ------------------------------------------------------------ movimento */
  S.encostouEm = function (u, ret, folga) {
    var d = U.distToRect(u.x, u.y, ret.x, ret.y, ret.w || 1, ret.h || 1);
    return d <= (folga == null ? 0.95 : folga);
  };

  S.pedirRota = function (u, destino, ctxExtra) {
    if (this.t < u.tentarRotaEm) return false;
    var ctx = u.lado === 'inimigo' ? this.ctxInimigo : this.ctxAliado;
    if (ctxExtra) {
      ctx = { estruturas: this.estruturas, aliado: ctx.aliado, custoMuro: ctx.custoMuro };
      for (var k in ctxExtra) ctx[k] = ctxExtra[k];
    }
    var rota = this.nav.buscar(u.x, u.y, destino, ctx);
    u.versaoRota = this.world.versaoRota;
    if (!rota) {
      u.bloqueado = true;
      u.tentarRotaEm = this.t + 1.6;
      return false;
    }
    u.bloqueado = false;
    u.rota = rota; u.passo = 0;
    return true;
  };

  /* Anda pela rota. Devolve 'bloqueio' com a estrutura a derrubar, se houver. */
  S.andar = function (u, dt) {
    if (u.voa) return null;
    /* Rota vazia é a armadilha desta casa: `[]` é VERDADEIRO, então quem testa
       `if (!u.rota)` para pedir rota nova nunca mais pede, e a unidade fica
       parada para sempre achando que tem caminho. Zerar aqui fecha o buraco
       para todo chamador, não só para o trator que o descobriu. */
    if (u.rota && !u.rota.length) u.rota = null;
    if (!u.rota || u.passo >= u.rota.length) return null;
    if (u.versaoRota !== this.world.versaoRota) {
      /* O terreno mudou: revalida só o trecho à frente. */
      var restante = u.rota.slice(u.passo, u.passo + 6);
      for (var r = 0; r < restante.length; r++) {
        var cc = restante[r], ii = this.world.idx(cc.x, cc.y);
        var ocup = this.world.occ[ii];
        if (ocup !== 0 && u.lado !== 'inimigo') {
          var bb = this.estruturas[ocup];
          if (!bb || !bb.portao) { u.rota = null; return null; }
        }
      }
      u.versaoRota = this.world.versaoRota;
    }
    var destino = u.rota[u.passo];
    var cx = destino.x + 0.5, cy = destino.y + 0.5;
    var idx = this.world.idx(destino.x, destino.y);
    var ocupante = this.world.occ[idx];
    if (ocupante !== 0) {
      var b = this.estruturas[ocupante];
      if (b && !b.morta) {
        if (u.lado === 'inimigo') return b;                 /* cerco: derrubar o obstáculo */
        if (b.portao) { b.pedidoPassagem = this.t; if (!b.portaoAberto) return null; }
        else { u.rota = null; return null; }
      }
    }
    var dx = cx - u.x, dy = cy - u.y;
    var d = Math.hypot(dx, dy);
    var vel = u.vel * u.velMod * (this.t < u.lentoAte ? 0.55 : 1);
    if (u.operario && this.jogador.pesquisas.logistica) vel *= 1.2;
    var passo = vel * dt;
    if (d <= passo) {
      u.x = cx; u.y = cy; u.passo++;
      if (u.passo >= u.rota.length) u.rota = null;
    } else {
      u.x += dx / d * passo; u.y += dy / d * passo;
      u.angulo = Math.atan2(dy, dx);
    }
    return null;
  };

  S.voar = function (u, alvo, dt) {
    var ax = alvo.x + ((alvo.w || 1) - 1) / 2 + (alvo.w ? 0.5 : 0);
    var ay = alvo.y + ((alvo.h || 1) - 1) / 2 + (alvo.h ? 0.5 : 0);
    var dx = ax - u.x, dy = ay - u.y, d = Math.hypot(dx, dy);
    if (d < 0.05) return;
    var passo = u.vel * u.velMod * dt;
    u.x += dx / d * Math.min(passo, d);
    u.y += dy / d * Math.min(passo, d);
    u.angulo = Math.atan2(dy, dx);
  };

  /* -------------------------------------------------------- ciclo operário */
  S.atualizarOperario = function (u, dt) {
    var tarefa = u.tarefa || (u.tarefa = { tipo: 'ocioso' });
    var w = this.world;

    /* "Evita combate quando possível": sem ordem manual, o operário larga a
       tarefa e corre para o depósito mais próximo enquanto houver inimigo perto. */
    if (!u.ordemManual) {
      var ameaca = this.inimigoProximo(u, 4.5);
      if (tarefa.tipo === 'fugindo') {
        var aindaPerto = this.inimigoProximo(u, 8);
        if (!aindaPerto && this.t > tarefa.ate) {
          u.tarefa = tarefa.anterior && tarefa.anterior.tipo !== 'fugindo' ? tarefa.anterior : { tipo: 'ocioso' };
          u.rota = null;
          return;
        }
        var abrigo = tarefa.destino;
        if (abrigo) {
          if (!u.rota && !this.encostouEm(u, abrigo, 1.1)) this.pedirRota(u, abrigo, { raioChegada: 1 });
          this.andar(u, dt);
        }
        return;
      }
      if (ameaca && tarefa.tipo !== 'fugindo') {
        var refugio = this.depositoMaisProximo(u.x, u.y);
        if (refugio) {
          if (tarefa.tipo === 'construir') this.liberarObra(u);
          if (tarefa.tipo === 'minerar' && tarefa.contabilizada) {
            var jz = w.jazidaPorId(tarefa.jazida);
            if (jz) jz.ocupadas = Math.max(0, jz.ocupadas - 1);
            tarefa.contabilizada = false;
          }
          u.tarefa = { tipo: 'fugindo', destino: refugio, anterior: tarefa, ate: this.t + 2.5 };
          u.rota = null;
          this.emitir('operarioFugindo', { id: u.id });
          return;
        }
      }
    }

    if (tarefa.tipo === 'ocioso') {
      /* O trator não se auto-emprega: não minera nem repara. Parado, ele fica
         parado até receber ordem de limpeza — mandar um trator para a jazida
         seria gastar duzentos e dez minerais de máquina fazendo o trabalho de
         um operário de cinquenta. */
      if (!u.operario) return;
      if (this.reparoAuto.ativo && this.jogador.pesquisas.autonomia) {
        var alvoReparo = this.estruturaMaisFeridaProxima(u.x, u.y);
        if (alvoReparo && this.jogador.m > this.reparoAuto.reserva) {
          this.darTarefa(u, { tipo: 'reparar', alvo: alvoReparo.id, automatico: true });
          return;
        }
      }
      var jaz = this.jazidaLivreMaisProxima(u.x, u.y);
      if (jaz && this.depositoMaisProximo(u.x, u.y)) this.darTarefa(u, { tipo: 'minerar', jazida: jaz.id });
      return;
    }

    if (tarefa.tipo === 'mover' || tarefa.tipo === 'explorar') {
      var destino = tarefa.destino;
      if (!u.rota && !this.encostouEm(u, destino, 0.6)) {
        if (!this.pedirRota(u, destino)) return;
      }
      this.andar(u, dt);
      if (this.encostouEm(u, destino, 0.8) || (!u.rota && u.passo === 0 && !u.bloqueado)) {
        u.tarefa = { tipo: 'ocioso' };
      }
      return;
    }

    if (tarefa.tipo === 'construir') {
      var b = this.estruturas[tarefa.alvo];
      if (!b || b.morta || b.construida) { this.liberarObra(u); return; }
      if (!this.encostouEm(u, b, 1.05)) {
        if (!u.rota && !this.pedirRota(u, b, { raioChegada: 1 })) return;
        var bloqueio = this.andar(u, dt);
        if (bloqueio) { u.rota = null; }
        return;
      }
      u.rota = null;
      var taxa = dt / Math.max(0.5, b.def.tempo);
      b.obra = Math.min(1, b.obra + taxa);
      b.hp = Math.max(b.hp, b.hpMax * (0.08 + 0.92 * b.obra));
      if (b.obra >= 1) {
        b.construida = true; b.hp = b.hpMax;
        this.recalcularPop();
        this.emitir('obraConcluida', { id: b.id, tipo: b.tipo });
        this.liberarObra(u);
        this.distribuirObras();
      }
      return;
    }

    /* LIMPEZA DE TERRENO. O trator vai até a célula, trabalha um tempo fixo e
       sobe um degrau: ruína vira entulho, entulho vira chão aberto. Terminada
       uma célula, ele procura a próxima limpável dentro do raio da ordem —
       assim uma ordem só limpa uma área, e não um quadradinho.

       O trabalho é por TEMPO e não por dano, porque não há nada com vida do
       outro lado: o que muda é o terreno. E o tempo é longo de propósito — o
       trator abre espaço de construção e caminho novo, que são as duas coisas
       mais fortes que uma unidade pode dar de graça. */
    if (tarefa.tipo === 'limpar') {
      this.revalidarDesistencias(tarefa);
      var al = tarefa.alvo;
      if (al && !this.encostavel(al.x, al.y)) al = tarefa.alvo = null;
      if (!al || !w.limpavel(al.x, al.y)) {
        /* A próxima célula é procurada em volta do TRATOR, não do ponto que o
           jogador tocou. Foi assim que ele se comportou no teste e é assim que
           deve ser: terminada uma quadra, ele segue para o entulho ao lado em
           vez de parar e esperar ordem nova. Limpeza é serviço contínuo, e
           obrigar um toque a cada seis células seria imposto de dedo.
           Quem quiser o trator em outro lugar manda Mover, que troca a tarefa. */
        /* Com ÁREA, a varredura centra no retângulo, não no trator: a ordem é
           "trabalhe ali", e a máquina pode estar do outro lado do mapa. Com o
           centro na unidade, uma área a cinquenta células virava "nada ao
           alcance" e a ordem não fazia nada. Sem área, o centro é ele mesmo, e
           aí sim é serviço contínuo ao redor. */
        var a = tarefa.area;
        var centroBusca = a
          ? { x: (a.x0 + a.x1) / 2, y: (a.y0 + a.y1) / 2 }
          : u;
        var alcance = a
          ? Math.max(a.x1 - a.x0, a.y1 - a.y0) + 2
          : (tarefa.raio || 10);
        var prox = this.celulaLimpavelProxima(centroBusca, alcance, tarefa.desistidas, a);
        if (!prox) {
          /* Acabou o que dá para alcançar daqui. PARA e AVISA.
             A primeira versão limpava a lista de desistências e tentava tudo de
             novo — e como a célula continuava inalcançável, o trator ficava
             parado escolhendo a mesma para sempre, que na tela é exatamente
             "não limpa nada". Se o jogador quiser o resto do quarteirão, move a
             máquina para o outro lado: é decisão dele, não adivinhação nossa. */
          u.tarefa = { tipo: 'ocioso' };
          u.bloqueado = false;
          this.aviso('Trator sem mais entulho ao alcance. Leve-o para outro ponto.', 'atencao');
          return;
        }
        tarefa.alvo = prox;
        tarefa.progresso = 0;
        tarefa.posto = null;
        u.rota = null;
        return;
      }
      /* TRABALHA DO POSTO, e o posto é um VIZINHO ORTOGONAL da célula.
         Ruína é célula sólida: não dá para entrar nela, então a máquina encosta
         ao lado e trabalha dali.

         A pergunta é "ESTOU NO POSTO?", e não "estou perto do alvo". A primeira
         versão perguntava a distância até o ALVO — menos de 1,9 célula — e isso
         abria uma FAIXA MORTA que travava tudo: `pedirRota` com raio de chegada
         1 devolve rota VAZIA quando a unidade já está a uma célula do destino,
         `andar` não tem por onde andar, e `u.rota` fica sendo um vetor vazio,
         que é verdadeiro — ninguém pede rota de novo. Com o trator a uma célula
         do posto e a duas do alvo, ele ficava parado achando que tinha chegado
         e longe demais para trabalhar. Medido: parado em 8,5/1,5 por 79
         segundos, tarefa `limpar`, progresso zero.

         Com a pergunta certa, a faixa morta não existe: ou ele está no posto e
         trabalha, ou não está e anda até lá, com raio de chegada ZERO. */
      var alvoPosto = tarefa.posto;
      var postoValido = alvoPosto && w.livre(alvoPosto.x, alvoPosto.y) &&
        Math.abs(alvoPosto.x - al.x) + Math.abs(alvoPosto.y - al.y) === 1;
      if (!postoValido) {
        var vizinhos = [{ x: al.x - 1, y: al.y }, { x: al.x + 1, y: al.y },
                        { x: al.x, y: al.y - 1 }, { x: al.x, y: al.y + 1 }];
        var lado = null, melhor = Infinity;
        for (var vi = 0; vi < vizinhos.length; vi++) {
          var v = vizinhos[vi];
          if (!w.livre(v.x, v.y)) continue;
          var d = U.dist(u.x, u.y, v.x + 0.5, v.y + 0.5);
          if (d < melhor) { melhor = d; lado = v; }
        }
        if (!lado) { this.desistirDaCelula(tarefa, al); u.bloqueado = true; return; }
        tarefa.posto = alvoPosto = lado;
        u.rota = null;
      }
      /* "Estou no posto?" se responde pela CÉLULA, não por distância a um ponto.
         Distância cria faixa morta dos dois lados: com 1,9 o trator travava
         achando que já tinha chegado; com 0,55 ele desistia da célula por estar
         dentro do posto mas fora do centro. Célula não tem meio-termo — ou o
         piso das coordenadas bate, ou não bate — e é exatamente o que o
         buscador de rota entrega. */
      var centroPosto = { x: alvoPosto.x + 0.5, y: alvoPosto.y + 0.5 };
      if (Math.floor(u.x) !== alvoPosto.x || Math.floor(u.y) !== alvoPosto.y) {
        /* DESTINO INTEIRO, e os dois têm de andar juntos com o raio zero.
           `path.js` testa a chegada como |x − (px+0,5)| ≤ raio: com destino
           fracionário e raio 0 isso é impossível para coordenada inteira, e o
           A* varria o mapa inteiro para devolver nada — o trator desistia de
           toda célula mesmo cercado de entulho. Com destino fracionário e raio
           1, o contrário: quatro células diferentes contam como "cheguei", a
           rota volta vazia e ele congela. Medido nos dois casos. */
        if ((!u.rota || !u.rota.length) &&
            !this.pedirRota(u, { x: alvoPosto.x, y: alvoPosto.y }, { raioChegada: 0 })) {
          /* `pedirRota` devolve falso por DOIS motivos, e só um deles é "não há
             caminho": o outro é a espera de 1,6 s entre tentativas. Banir a
             célula nos dois casos fazia a lista negra engolir o bairro em menos
             de dois segundos, sem ninguém ter procurado caminho nenhum — é a
             causa do "limpa três ou quatro e para". `u.bloqueado` só fica
             verdadeiro na falha de verdade; na espera, é apenas esperar.
             É o que a OpenRA faz no `MoveCooldownHelper`: bloqueio é
             temporário e se tenta de novo, nunca se bane. */
          if (u.bloqueado) this.desistirDaCelula(tarefa, al);
          return;
        }
        if (!u.rota.length) {
          /* Rota vazia com a máquina fora da célula do posto: o buscador
             considera alcançado o que para nós não é. Desiste desta célula em
             vez de ficar parado — é o laço que travava o trator. */
          this.desistirDaCelula(tarefa, al);
          return;
        }
        this.andar(u, dt);
        return;
      }
      u.rota = null;
      u.bloqueado = false;
      tarefa.progresso = (tarefa.progresso || 0) + dt / (u.def.limpeza || 4);
      /* Um baque a cada meio segundo, com poeira. O trabalho leva segundos e,
         sem nada na tela, a máquina parece parada em cima do entulho — foi o
         que o Pedro viu e chamou de "não limpa nada". Trabalho que não faz
         barulho nem levanta pó não parece trabalho. */
      tarefa.baque = (tarefa.baque || 0) + dt;
      if (tarefa.baque > 0.5) {
        tarefa.baque = 0;
        this.emitir('escavando', { x: al.x, y: al.y, progresso: tarefa.progresso });
      }
      if (tarefa.progresso < 1) return;
      tarefa.progresso = 0;
      var oque = w.limparCelula(al.x, al.y);
      if (oque) {
        this.emitir('terrenoLimpo', { x: al.x, y: al.y, era: oque });
        if (oque === 'ruina') this.aviso('Passagem aberta no entulho.', 'info');
      }
      /* TERMINA A CÉLULA ANTES DE SAIR DELA. Derrubar a ruína deixa ENTULHO,
         que continua na tela: para quem está olhando, o trator "passou e não
         sumiu com nada". Ficando até o chão abrir, cada célula que ele deixa
         para trás está de fato limpa — e a máquina já está no posto certo, de
         modo que a segunda passada não custa caminhada nenhuma. */
      if (w.limpavel(al.x, al.y)) { tarefa.progresso = 0; return; }
      tarefa.alvo = null;
      tarefa.posto = null;
      return;
    }

    if (tarefa.tipo === 'reparar') {
      var alvo = this.estruturas[tarefa.alvo];
      if (!alvo || alvo.morta || alvo.hp >= alvo.hpMax) { u.tarefa = { tipo: 'ocioso' }; return; }
      if (!this.encostouEm(u, alvo, 1.05)) {
        if (!u.rota && !this.pedirRota(u, alvo, { raioChegada: 1 })) return;
        this.andar(u, dt);
        return;
      }
      u.rota = null;
      var eficiente = this.jogador.pesquisas.reparoEficiente;
      var taxaHp = (alvo.hpMax / 14) * (eficiente ? 1.5 : 1) * dt;
      var mineralPorHp = (0.4 * (alvo.custo.m || 12) / alvo.hpMax) * (eficiente ? 0.6 : 1);
      var custo = taxaHp * mineralPorHp;
      if (tarefa.automatico && this.jogador.m - custo < this.reparoAuto.reserva) { u.tarefa = { tipo: 'ocioso' }; return; }
      if (this.jogador.m < custo) { this.aviso('Sem minerais para o reparo.', 'atencao'); u.tarefa = { tipo: 'ocioso' }; return; }
      this.jogador.m -= custo;
      this.estatisticas.gastoReparo += custo;
      alvo.hp = Math.min(alvo.hpMax, alvo.hp + taxaHp);
      if (alvo.hp >= alvo.hpMax) u.tarefa = { tipo: 'ocioso' };
      return;
    }

    if (tarefa.tipo === 'minerar') {
      var j = w.jazidaPorId(tarefa.jazida);
      if (!j || (j.estoque <= 0 && u.carga === 0)) {
        var outra = this.jazidaLivreMaisProxima(u.x, u.y);
        if (outra) { this.darTarefa(u, { tipo: 'minerar', jazida: outra.id }); }
        else { u.tarefa = { tipo: 'ocioso' }; u.bloqueado = true; }
        return;
      }
      if (tarefa.estado === 'indo') {
        if (!this.encostouEm(u, j, 1.05)) {
          if (!u.rota && !this.pedirRota(u, j, { raioChegada: 1, jazidaDestino: j.id })) return;
          this.andar(u, dt);
          return;
        }
        u.rota = null;
        if (!tarefa.contabilizada) { j.ocupadas++; tarefa.contabilizada = true; }
        tarefa.estado = 'coletando';
        var rapido = this.jogador.pesquisas.coleta ? 0.7 : 1;
        tarefa.relogio = R.coletaBase * rapido;
        return;
      }
      if (tarefa.estado === 'coletando') {
        tarefa.relogio -= dt;
        if (tarefa.relogio <= 0) {
          var cap = this.jogador.pesquisas.carga ? 12 : R.cargaBase;
          var qtd = Math.min(cap, j.estoque);
          j.estoque -= qtd;
          u.carga = qtd; u.cargaTipo = j.tipo;
          if (tarefa.contabilizada) { j.ocupadas = Math.max(0, j.ocupadas - 1); tarefa.contabilizada = false; }
          if (j.estoque <= 0) this.emitir('jazidaEsgotada', { id: j.id });
          tarefa.estado = qtd > 0 ? 'voltando' : 'indo';
          u.rota = null;
        }
        return;
      }
      if (tarefa.estado === 'voltando') {
        var dep = this.depositoMaisProximo(u.x, u.y);
        if (!dep) {
          if (!u.bloqueado) this.aviso('Sem depósito acessível: a carga fica com o operário.', 'atencao');
          u.bloqueado = true;
          return;
        }
        u.bloqueado = false;
        if (tarefa.deposito !== dep.id) { tarefa.deposito = dep.id; u.rota = null; }
        if (!this.encostouEm(u, dep, 1.05)) {
          if (!u.rota && !this.pedirRota(u, dep, { raioChegada: 1 })) return;
          this.andar(u, dt);
          return;
        }
        /* Entrega: soma uma única vez e zera o inventário. */
        u.rota = null;
        if (u.carga > 0) {
          if (u.cargaTipo === 'petroleo') this.jogador.c += u.carga;
          else { this.jogador.m += u.carga; this.estatisticas.entregue += u.carga; }
          this.emitir('entrega', { id: u.id, qtd: u.carga, recurso: u.cargaTipo });
          u.carga = 0;
        }
        tarefa.estado = 'indo';
        var jaz2 = w.jazidaPorId(tarefa.jazida);
        if (!jaz2 || jaz2.estoque <= 0) {
          var nova = this.jazidaLivreMaisProxima(u.x, u.y);
          if (nova) tarefa.jazida = nova.id; else u.tarefa = { tipo: 'ocioso' };
        }
        return;
      }
    }
  };

  S.inimigoProximo = function (u, raio) {
    for (var i = 0; i < this.unidades.length; i++) {
      var e = this.unidades[i];
      if (e.lado !== 'inimigo' || e.morta) continue;
      if (U.dist(u.x, u.y, e.x, e.y) <= raio) return e;
    }
    return null;
  };

  S.liberarObra = function (u) {
    if (u.tarefa && u.tarefa.tipo === 'construir') {
      var b = this.estruturas[u.tarefa.alvo];
      if (b) b.construtores = Math.max(0, b.construtores - 1);
    }
    /* A VAGA NA JAZIDA também tem de voltar. Operário morto enquanto extraía
       deixava `ocupadas` contando um trabalhador que não existe mais, e a
       jazida ficava "4/4 operários" com um vivo — para sempre, sem aviso
       nenhum. O invasor que caça minerador existe justamente para isso
       acontecer. */
    if (u.tarefa && u.tarefa.tipo === 'minerar' && u.tarefa.contabilizada) {
      var jaz = this.world.jazidaPorId(u.tarefa.jazida);
      if (jaz) jaz.ocupadas = Math.max(0, jaz.ocupadas - 1);
      u.tarefa.contabilizada = false;
    }
    u.tarefa = { tipo: 'ocioso' };
    u.rota = null;
  };

  /* A célula limpável mais perto do centro da ordem, dentro do raio. Varre em
     anéis para pegar primeiro a que está mais perto — limpar de fora para
     dentro deixaria buracos. */
  /* ALCANÇÁVEL quer dizer: tem pelo menos um vizinho livre onde a máquina possa
     encostar. Ruína no MEIO de um quarteirão não tem — toda célula em volta
     também é ruína — e o trator ficava parado olhando para ela, com rota de
     tamanho zero, para sempre. Era esse o "não limpa nada".

     Exigindo vizinho livre, o bloco é comido pela BORDA: derrubada a casca, as
     de dentro passam a ter vizinho livre e entram na vez. É como uma máquina
     de verdade faria, e resolve sozinho o caso que travava. */
  /* Guarda o que não deu para alcançar, para não tentar a mesma no quadro
     seguinte e travar. A lista vive na TAREFA: ordem nova começa limpa. */
  S.desistirDaCelula = function (tarefa, cel) {
    if (!tarefa.desistidas) tarefa.desistidas = {};
    tarefa.desistidas[cel.x + ',' + cel.y] = 1;
    tarefa.versaoDaLista = this.world.versaoRota;
    tarefa.alvo = null;
    tarefa.posto = null;
  };

  /* A lista negra CADUCA quando o mapa muda. O próprio trator derruba paredes:
     a célula que estava atrás de uma ruína fica alcançável assim que ela cai, e
     mantê-la banida era condenar o resto da quadra por causa de uma tentativa
     velha. `versaoRota` sobe a cada mudança de navegabilidade e é o carimbo
     exato de "a lista é de antes". */
  S.revalidarDesistencias = function (tarefa) {
    if (!tarefa.desistidas) return;
    if (tarefa.versaoDaLista === this.world.versaoRota) return;
    tarefa.desistidas = null;
    tarefa.versaoDaLista = this.world.versaoRota;
  };

  S.encostavel = function (x, y) {
    var w = this.world;
    return w.livre(x - 1, y) || w.livre(x + 1, y) ||
      w.livre(x, y - 1) || w.livre(x, y + 1);
  };

  S.celulaLimpavelProxima = function (centro, raio, pular, area) {
    var w = this.world;
    var cx = Math.floor(centro.x), cy = Math.floor(centro.y);
    for (var r = 0; r <= raio; r++) {
      for (var dx = -r; dx <= r; dx++) {
        for (var dy = -r; dy <= r; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          var x = cx + dx, y = cy + dy;
          if (pular && pular[x + ',' + y]) continue;
          /* Área pintada pelo jogador: fora dela o trator não mexe. Sem isto
             uma ordem de "limpe esta quadra" viraria "limpe a cidade". */
          if (area && (x < area.x0 || x > area.x1 || y < area.y0 || y > area.y1)) continue;
          if (w.limpavel(x, y) && this.encostavel(x, y)) return { x: x, y: y };
        }
      }
    }
    return null;
  };

  S.estruturaMaisFeridaProxima = function (x, y) {
    var melhor = null, melhorPont = 0;
    for (var i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (!b.construida || b.morta || b.hp >= b.hpMax) continue;
      var falta = 1 - b.hp / b.hpMax;
      var d = U.distToRect(x, y, b.x, b.y, b.w, b.h);
      if (d > 22) continue;
      var pont = falta * 100 - d;
      if (pont > melhorPont) { melhorPont = pont; melhor = b; }
    }
    return melhor;
  };

  /* ------------------------------------------------------------- produção */
  S.encomendar = function (estruturaId, tipoUnidade) {
    var b = this.estruturas[estruturaId];
    if (!b || !b.construida || b.morta) return { ok: false, motivo: 'Estrutura indisponível' };
    if (!b.def.produz || b.def.produz.indexOf(tipoUnidade) < 0) return { ok: false, motivo: 'Esta estrutura não produz isso' };
    var def = UNID[tipoUnidade];
    var falta = this.requisitoFaltante(def);
    if (falta) return { ok: false, motivo: falta };
    var custo = this.custoDe(def);
    if (!this.temRecurso(custo)) return { ok: false, motivo: 'Recursos insuficientes' };
    if (this.popLivre() < (def.pop || 0)) return { ok: false, motivo: 'Sem capacidade de população' };
    if (b.fila.length >= 6) return { ok: false, motivo: 'Fila cheia' };
    /* Reserva no ato da confirmação: duas filas não ultrapassam a capacidade. */
    this.cobrar(custo);
    this.jogador.popReservada += def.pop || 0;
    b.fila.push({ tipo: tipoUnidade, custo: custo, pop: def.pop || 0, tempo: def.tempo, progresso: 0 });
    return { ok: true };
  };

  S.cancelarEncomenda = function (estruturaId, indice) {
    var b = this.estruturas[estruturaId];
    if (!b || !b.fila[indice]) return { ok: false };
    var item = b.fila[indice];
    var comecou = indice === 0 && item.progresso > 0;
    this.devolver(item.custo, comecou ? R.reembolso : 1);
    this.jogador.popReservada = Math.max(0, this.jogador.popReservada - item.pop);
    b.fila.splice(indice, 1);
    return { ok: true, reembolso: comecou ? R.reembolso : 1 };
  };

  S.atualizarProducao = function (b, dt, deficit) {
    if (!b.fila.length || !b.construida || b.morta) return;
    if (deficit && b.def.energia) { b.pausadaPorEnergia = true; return; }
    b.pausadaPorEnergia = false;
    var item = b.fila[0];
    item.progresso += dt / item.tempo;
    if (item.progresso < 1) return;
    var saida = this.pontoDeSaida(b);
    if (!saida) { item.progresso = 1; b.semSaida = true; return; }
    b.semSaida = false;
    b.fila.shift();
    this.jogador.popReservada = Math.max(0, this.jogador.popReservada - item.pop);
    var u = this.criarUnidade(item.tipo, saida.x + 0.5, saida.y + 0.5, 'aliado');
    if (b.rally) {
      var cel = this.nav.celulaLivreProxima(b.rally.x, b.rally.y, 6);
      /* Quem não luta vai MOVER. O trator não é operário, então caía em
         `moverAtacando` — e o laço dele é o dos trabalhos, que não tem esse
         ramo: a máquina nascia e congelava para sempre com a tarefa
         "avançando", e nem o botão de ociosos a encontrava. */
      var pacifico = u.operario || !u.def.arma;
      if (cel) this.darTarefa(u, { tipo: pacifico ? 'mover' : 'moverAtacando', destino: cel });
    }
    this.emitir('unidadePronta', { id: u.id, tipo: item.tipo, estrutura: b.id });
  };

  /* A unidade sai pela FRENTE da estrutura, não pelo primeiro canto livre que
     a varredura encontrar. A ordem antiga começava em dy = -1, que na projeção
     isométrica é o fundo: o soldado nascia atrás do prédio, escondido por ele,
     e só reaparecia depois de andar — parecia que tinha vindo do nada.
     Na tela, x e y maiores estão mais à frente, então a preferência é por
     (dx + dy) maior; entre iguais, o mais perto do centro da fachada. */
  S.pontoDeSaida = function (b) {
    for (var r = 0; r <= 3; r++) {
      var candidatas = [];
      for (var dy = -1 - r; dy <= b.h + r; dy++) {
        for (var dx = -1 - r; dx <= b.w + r; dx++) {
          var borda = dx < 0 || dy < 0 || dx >= b.w || dy >= b.h;
          if (!borda) continue;
          var cx = b.x + dx, cy = b.y + dy;
          if (!this.world.livre(cx, cy)) continue;
          candidatas.push({ x: cx, y: cy, frente: dx + dy,
            desvio: Math.abs(dx - (b.w - 1) / 2) + Math.abs(dy - (b.h - 1) / 2) });
        }
      }
      if (!candidatas.length) continue;
      candidatas.sort(function (m, n) {
        return (n.frente - m.frente) || (m.desvio - n.desvio);
      });
      return { x: candidatas[0].x, y: candidatas[0].y };
    }
    return null;
  };

  /* -------------------------------------------------------------- pesquisa */
  S.pesquisaDisponivel = function (p) {
    if (this.jogador.pesquisas[p.id]) return { ok: false, motivo: 'Concluída' };
    if (p.req) {
      for (var i = 0; i < p.req.length; i++) {
        if (!this.jogador.pesquisas[p.req[i]]) {
          var nome = D.PESQUISAS.filter(function (q) { return q.id === p.req[i]; })[0];
          return { ok: false, motivo: 'Exige ' + (nome ? nome.nome : p.req[i]) };
        }
      }
    }
    if (p.tech && p.tech > 1 && p.id.indexOf('tech') !== 0 && this.jogador.tech < p.tech) {
      return { ok: false, motivo: 'Exige tecnologia ' + ['', 'I', 'II', 'III'][p.tech] };
    }
    if (!this.temEstrutura('pesquisa')) return { ok: false, motivo: 'Exige Centro de Pesquisa' };
    if (this.jogador.pesquisaAtual) return { ok: false, motivo: 'Laboratório ocupado' };
    if (!this.temRecurso(p.custo)) return { ok: false, motivo: 'Recursos insuficientes' };
    return { ok: true };
  };

  S.pesquisar = function (id) {
    var p = null;
    for (var i = 0; i < D.PESQUISAS.length; i++) if (D.PESQUISAS[i].id === id) p = D.PESQUISAS[i];
    if (!p) return { ok: false, motivo: 'Pesquisa desconhecida' };
    var ver = this.pesquisaDisponivel(p);
    if (!ver.ok) return ver;
    this.cobrar(p.custo);
    this.jogador.pesquisaAtual = { id: id, def: p, progresso: 0, pausada: false };
    return { ok: true };
  };

  S.cancelarPesquisa = function () {
    var pa = this.jogador.pesquisaAtual;
    if (!pa) return { ok: false };
    this.devolver(pa.def.custo, R.reembolso);
    this.jogador.pesquisaAtual = null;
    return { ok: true, reembolso: R.reembolso };
  };

  S.atualizarPesquisa = function (dt) {
    var pa = this.jogador.pesquisaAtual;
    if (!pa) return;
    var lab = this.temEstrutura('pesquisa');
    if (!lab) { pa.pausada = true; return; }
    pa.pausada = false;
    pa.progresso += dt / pa.def.tempo;
    if (pa.progresso < 1) return;
    this.jogador.pesquisas[pa.id] = true;
    if (pa.def.tech) this.jogador.tech = Math.max(this.jogador.tech, pa.def.tech);
    if (pa.id === 'muroReforcado') this.reforcarMuros();
    if (pa.id === 'formacao') this.reforcarTropas();
    this.aviso('Pesquisa concluída: ' + pa.def.nome, 'bom');
    this.emitir('pesquisaConcluida', { id: pa.id });
    this.jogador.pesquisaAtual = null;
  };

  /* Pesquisas globais valem para o que já existe (página 12). */
  S.reforcarMuros = function () {
    for (var i = 0; i < this.listaEstruturas.length; i++) {
      var b = this.listaEstruturas[i];
      if (!b.muro || b.morta) continue;
      var frac = b.hp / b.hpMax;
      b.hpMax = Math.round(b.def.hp * 1.6);
      b.hp = Math.round(b.hpMax * frac);
    }
  };

  S.reforcarTropas = function () {
    for (var i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (u.lado !== 'aliado' || u.operario || u.morta) continue;
      var frac = u.hp / u.hpMax;
      u.hpMax = Math.round(u.def.hp * 1.2);
      u.hp = Math.round(u.hpMax * frac);
    }
  };

  /* -------------------------------------------------------- ordens globais */
  S.produzirOperario = function () {
    if (!this.central || this.central.morta) return { ok: false, motivo: 'Sem Central de Comando' };
    return this.encomendar(this.central.id, 'operario');
  };

  S.distribuirMineracao = function () {
    var n = 0;
    for (var i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (!u.operario || u.morta) continue;
      if (u.tarefa && (u.tarefa.tipo === 'construir')) continue;
      var j = this.jazidaLivreMaisProxima(u.x, u.y);
      if (j) { this.darTarefa(u, { tipo: 'minerar', jazida: j.id }); n++; }
    }
    this.aviso(n + ' operário(s) enviados à mineração.', 'info');
    return n;
  };

  S.recolherTodos = function () {
    if (!this.central) return 0;
    var ponto = this.nav.celulaLivreProxima(this.central.x + this.central.w / 2, this.central.y + this.central.h + 1, 8);
    if (!ponto) return 0;
    var n = 0;
    for (var i = 0; i < this.unidades.length; i++) {
      var u = this.unidades[i];
      if (!u.operario || u.morta) continue;
      this.liberarObra(u);
      this.darTarefa(u, { tipo: 'mover', destino: ponto }, true);
      n++;
    }
    this.aviso('Operários recolhidos para a Central.', 'info');
    return n;
  };

  S.repararLinha = function () {
    this.reparoAuto.ativo = !this.reparoAuto.ativo;
    if (!this.reparoAuto.ativo) { this.aviso('Reparo automático desligado.', 'info'); return false; }
    var enviados = 0;
    for (var i = 0; i < this.unidades.length && enviados < this.reparoAuto.max; i++) {
      var u = this.unidades[i];
      if (!u.operario || u.morta) continue;
      if (u.tarefa && u.tarefa.tipo === 'construir') continue;
      var alvo = this.estruturaMaisFeridaProxima(u.x, u.y);
      if (!alvo) break;
      this.darTarefa(u, { tipo: 'reparar', alvo: alvo.id, automatico: true });
      enviados++;
    }
    this.aviso(enviados ? ('Reparo automático ligado (' + enviados + ' operários, reserva de ' + this.reparoAuto.reserva + ' minerais).') : 'Nada danificado para reparar.', enviados ? 'bom' : 'info');
    return true;
  };
})(typeof window !== 'undefined' ? window : globalThis);
