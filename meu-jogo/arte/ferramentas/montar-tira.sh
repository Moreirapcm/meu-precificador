#!/usr/bin/env bash
# Recorta a grade 2x2 (ou 4x1) de uma geração, alinha os quatro pela base e
# monta a tira horizontal usada pelo jogo.
#
#   montar-tira.sh <origem.jpg> <saida.png>
#
# Alinha pela BASE de propósito: recortado rente, o ponto mais baixo é o pé de
# apoio, e os quadros têm alturas diferentes justamente porque o corpo sobe e
# desce — é o bob da caminhada, e ele tem que ficar.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
src="${1:?uso: montar-tira.sh origem.jpg saida.png}"
out="${2:?falta a saida}"
tmp=$(mktemp -d)

larg=$(identify -format %w "$src"); alt=$(identify -format %h "$src")
if [ "$alt" -gt "$larg" ]; then corte="2x2@"; else corte="4x1@"; fi
convert "$src" -crop "$corte" +repage "$tmp/q%d.png"
for i in 0 1 2 3; do
  "$raiz/arte/ferramentas/recortar-fundo.sh" "$tmp/q$i.png" "$tmp/c$i.png" >/dev/null
done
W=0; H=0
for i in 0 1 2 3; do
  w=$(identify -format %w "$tmp/c$i.png"); h=$(identify -format %h "$tmp/c$i.png")
  [ "$w" -gt "$W" ] && W=$w; [ "$h" -gt "$H" ] && H=$h
done
W=$((W + 12)); H=$((H + 6))
for i in 0 1 2 3; do
  convert "$tmp/c$i.png" -background none -gravity south -extent "${W}x${H}" "$tmp/a$i.png"
done
convert "$tmp/a0.png" "$tmp/a1.png" "$tmp/a2.png" "$tmp/a3.png" +append -background none "$out"
rm -rf "$tmp"
identify -format "%f %wx%h\n" "$out"
