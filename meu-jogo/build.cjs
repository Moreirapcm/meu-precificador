#!/usr/bin/env node
/* Gera versões de arquivo único a partir dos fontes.
   - dist/ultima-fronteira.html : página completa, abre offline com dois cliques.
   - dist/pagina-artifact.html  : só o conteúdo, para publicar como Artifact. */
const fs = require('fs');
const path = require('path');
const raiz = __dirname;

const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(raiz, 'style.css'), 'utf8');

const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
if (!scripts.length) { console.error('nenhum script encontrado em index.html'); process.exit(1); }

/* As imagens viram data URI: o arquivo único tem que abrir por file:// sem
   pasta ao lado. Sem isso o dist perde toda a arte e volta ao desenho geométrico
   — em silêncio, porque o carregador trata imagem que não veio como ausente. */
function assetsEmbutidos() {
  const base = path.join(raiz, 'assets');
  if (!fs.existsSync(base)) return { mapa: {}, bytes: 0, n: 0 };
  const mapa = {};
  let bytes = 0;
  const andar = dir => {
    for (const nome of fs.readdirSync(dir).sort()) {
      const alvo = path.join(dir, nome);
      if (fs.statSync(alvo).isDirectory()) { andar(alvo); continue; }
      if (!nome.endsWith('.webp')) continue;
      const chave = path.relative(base, alvo).replace(/\\/g, '/').replace(/\.webp$/, '');
      const dados = fs.readFileSync(alvo).toString('base64');
      mapa[chave] = 'data:image/webp;base64,' + dados;
      bytes += dados.length;
    }
  };
  andar(base);
  return { mapa, bytes, n: Object.keys(mapa).length };
}

const assets = assetsEmbutidos();

const js = scripts.map(rel => {
  const codigo = fs.readFileSync(path.join(raiz, rel), 'utf8');
  return `/* ===== ${rel} ===== */\n${codigo}`;
}).join('\n')
  + (assets.n ? `\n/* ===== assets embutidos ===== */\nUF.sprites._embutir(${JSON.stringify(assets.mapa)});\n` : '');

/* Miolo do <body> do index.html, sem as tags de script. */
const corpo = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace(/<script src="[^"]+"><\/script>\s*/g, '')
  .trim();

const titulo = (html.match(/<title>([^<]*)<\/title>/) || [, 'Última Fronteira'])[1];
const descricao = (html.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1];

const fontes = (html.match(/<link rel="preconnect"[^>]*>|<link rel="stylesheet" href="https:\/\/fonts[^>]*>/g) || []).join('\n');

const conteudo = `<title>${titulo}</title>
<meta name="description" content="${descricao}">
${fontes}
<style>
${css}
</style>

${corpo}

<script>
${js}
</script>`;

const paginaCompleta = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#070a10">
${conteudo.slice(0, conteudo.indexOf('</style>') + 8)}
</head>
<body>
${conteudo.slice(conteudo.indexOf('</style>') + 8)}
</body>
</html>
`;

fs.mkdirSync(path.join(raiz, 'dist'), { recursive: true });
fs.writeFileSync(path.join(raiz, 'dist/ultima-fronteira.html'), paginaCompleta);
fs.writeFileSync(path.join(raiz, 'dist/pagina-artifact.html'), conteudo);

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('dist/ultima-fronteira.html  ' + kb(paginaCompleta.length) + '  (offline, arquivo único)');
console.log('dist/pagina-artifact.html   ' + kb(conteudo.length) + '  (para publicar)');
console.log('scripts embutidos: ' + scripts.length);
console.log('imagens embutidas: ' + assets.n + '  ' + kb(assets.bytes));
