/* Última Fronteira — navegação em grade.
   A* de 8 direções. Células ocupadas por estruturas destrutíveis têm custo alto
   em vez de serem intransponíveis: assim o invasor sem rota escolhe sozinho qual
   obstáculo derrubar (o "cerco" descrito na página 7 do documento). */
(function (global) {
  'use strict';
  var UF = global.UF || (global.UF = {});

  var DX = [1, -1, 0, 0, 1, 1, -1, -1];
  var DY = [0, 0, 1, -1, 1, -1, 1, -1];
  var DCUSTO = [1, 1, 1, 1, 1.4142, 1.4142, 1.4142, 1.4142];

  function Heap() { this.a = []; this.p = []; }
  Heap.prototype.push = function (v, prio) {
    var a = this.a, p = this.p, i = a.length;
    a.push(v); p.push(prio);
    while (i > 0) {
      var pai = (i - 1) >> 1;
      if (p[pai] <= p[i]) break;
      var t = a[i]; a[i] = a[pai]; a[pai] = t;
      var q = p[i]; p[i] = p[pai]; p[pai] = q;
      i = pai;
    }
  };
  Heap.prototype.pop = function () {
    var a = this.a, p = this.p, topo = a[0];
    var ultimo = a.pop(), up = p.pop();
    if (a.length) {
      a[0] = ultimo; p[0] = up;
      var i = 0, n = a.length;
      for (;;) {
        var e = 2 * i + 1, d = e + 1, menor = i;
        if (e < n && p[e] < p[menor]) menor = e;
        if (d < n && p[d] < p[menor]) menor = d;
        if (menor === i) break;
        var t = a[i]; a[i] = a[menor]; a[menor] = t;
        var q = p[i]; p[i] = p[menor]; p[menor] = q;
        i = menor;
      }
    }
    return topo;
  };
  Heap.prototype.vazio = function () { return this.a.length === 0; };

  function Navegador(world) {
    this.w = world;
    var n = world.n;
    this.g = new Float32Array(n);
    this.veio = new Int32Array(n);
    this.marca = new Int32Array(n);
    this.geracao = 0;
    this.buscas = 0;
  }

  /* Custo de entrar numa célula. Infinity = intransponível.
     ctx.aliado: portões aliados abrem; muros próprios nunca são atravessados.
     ctx.custoMuro: preço de romper uma estrutura inimiga (usado só por invasores). */
  Navegador.prototype.custo = function (x, y, ctx) {
    var w = this.w;
    if (!w.dentro(x, y)) return Infinity;
    var i = w.idx(x, y);
    if (w.solido(x, y)) return Infinity;
    if (w.recurso[i] !== 0 && !(ctx.jazidaDestino && w.recurso[i] === ctx.jazidaDestino)) return Infinity;
    var ed = w.occ[i];
    if (ed === 0) return 1;
    if (ctx.ignorar && ctx.ignorar[ed]) return 1;
    var b = ctx.estruturas[ed];
    /* Marca sem estrutura conhecida (ex.: prévia de muro em validação) também
       bloqueia: do contrário a checagem de perímetro passaria direto por ela. */
    if (!b) return ctx.aliado ? Infinity : (ctx.custoMuro || 42);
    if (ctx.aliado) return (b.portao && b.portaoModo !== 'fechado') ? 1.25 : Infinity;
    return ctx.custoMuro || 42;
  };

  /* Busca uma rota. destino pode ser célula ({x,y}) ou retângulo ({x,y,w,h}),
     nesse caso basta encostar. Devolve null quando não há caminho algum. */
  Navegador.prototype.buscar = function (sx, sy, destino, ctx) {
    var w = this.w;
    sx = Math.floor(sx); sy = Math.floor(sy);
    if (!w.dentro(sx, sy)) return null;
    this.buscas++;
    var gen = ++this.geracao;
    var g = this.g, veio = this.veio, marca = this.marca;
    var heap = new Heap();
    var alvoX = destino.x + ((destino.w || 1) - 1) / 2;
    var alvoY = destino.y + ((destino.h || 1) - 1) / 2;
    var raio = ctx.raioChegada || 0;

    function chegou(x, y) {
      if (destino.w || destino.h) {
        var dx = Math.max(destino.x - x, 0, x - (destino.x + (destino.w || 1) - 1));
        var dy = Math.max(destino.y - y, 0, y - (destino.y + (destino.h || 1) - 1));
        return Math.max(dx, dy) <= Math.max(1, raio);
      }
      return Math.abs(x - destino.x) <= raio && Math.abs(y - destino.y) <= raio;
    }

    var inicio = w.idx(sx, sy);
    g[inicio] = 0; veio[inicio] = -1; marca[inicio] = gen;
    heap.push(inicio, Math.hypot(sx - alvoX, sy - alvoY));
    var limite = ctx.limite || 9000, visitados = 0, fim = -1;

    while (!heap.vazio()) {
      var atual = heap.pop();
      var ax = atual % w.w, ay = (atual / w.w) | 0;
      if (chegou(ax, ay)) { fim = atual; break; }
      if (++visitados > limite) break;
      for (var k = 0; k < 8; k++) {
        var nx = ax + DX[k], ny = ay + DY[k];
        if (!w.dentro(nx, ny)) continue;
        var c = this.custo(nx, ny, ctx);
        if (c === Infinity) continue;
        /* Diagonal só passa se os dois lados ortogonais estiverem livres. */
        if (k >= 4) {
          if (this.custo(ax + DX[k], ay, ctx) === Infinity) continue;
          if (this.custo(ax, ay + DY[k], ctx) === Infinity) continue;
        }
        var ni = ny * w.w + nx;
        var novo = g[atual] + c * DCUSTO[k];
        if (marca[ni] === gen && g[ni] <= novo) continue;
        marca[ni] = gen; g[ni] = novo; veio[ni] = atual;
        heap.push(ni, novo + Math.hypot(nx - alvoX, ny - alvoY));
      }
    }

    if (fim < 0) return null;
    var rota = [];
    for (var no = fim; no !== -1; no = veio[no]) rota.push({ x: no % w.w, y: (no / w.w) | 0 });
    rota.reverse();
    rota.shift(); /* a primeira célula é onde a unidade já está */
    return rota;
  };

  /* Célula livre mais próxima de (x,y), usada por pontos de encontro e recuos. */
  Navegador.prototype.celulaLivreProxima = function (x, y, max) {
    var w = this.w;
    x = Math.floor(x); y = Math.floor(y);
    if (w.livre(x, y)) return { x: x, y: y };
    for (var r = 1; r <= (max || 8); r++) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          var nx = x + dx, ny = y + dy;
          if (w.livre(nx, ny)) return { x: nx, y: ny };
        }
      }
    }
    return null;
  };

  /* Conjunto de células alcançáveis a pé a partir de um ponto, sem romper nada.
     Usado para avisar que o perímetro prenderia os operários. */
  Navegador.prototype.alcancaveis = function (sx, sy, ctx) {
    var w = this.w, vis = new Uint8Array(w.n);
    sx = Math.floor(sx); sy = Math.floor(sy);
    if (!w.dentro(sx, sy)) return vis;
    var fila = [w.idx(sx, sy)]; vis[fila[0]] = 1;
    while (fila.length) {
      var i = fila.pop(), ax = i % w.w, ay = (i / w.w) | 0;
      for (var k = 0; k < 8; k++) {
        var nx = ax + DX[k], ny = ay + DY[k];
        if (!w.dentro(nx, ny)) continue;
        var j = ny * w.w + nx;
        if (vis[j]) continue;
        if (this.custo(nx, ny, ctx) === Infinity) continue;
        if (k >= 4 && (this.custo(ax + DX[k], ay, ctx) === Infinity || this.custo(ax, ay + DY[k], ctx) === Infinity)) continue;
        vis[j] = 1; fila.push(j);
      }
    }
    return vis;
  };

  UF.Navegador = Navegador;
})(typeof window !== 'undefined' ? window : globalThis);
