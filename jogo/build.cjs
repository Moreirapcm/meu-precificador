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

const js = scripts.map(rel => {
  const codigo = fs.readFileSync(path.join(raiz, rel), 'utf8');
  return `/* ===== ${rel} ===== */\n${codigo}`;
}).join('\n');

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
