#!/usr/bin/env bash
# Monta as cinco tiras de direção de uma unidade e gera os assets do jogo.
#
#   montar-direcoes.sh <tipo-da-unidade>
#
# Espera encontrar arte/origem/andar-{leste,norte,sul,sudeste,nordeste}.jpg.
# As outras três direções o jogo obtém espelhando — é o que o Age of Empires
# fazia (5 desenhadas, 3 espelhadas).
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
tipo="${1:?uso: montar-direcoes.sh <tipo>}"
mkdir -p "$raiz/arte/unidades/animacao"

for d in leste norte sul sudeste nordeste; do
  src="$raiz/arte/origem/andar-$d.jpg"
  [ -f "$src" ] || { echo "falta $src"; continue; }
  png="$raiz/arte/unidades/animacao/$tipo-andar-$d.png"
  "$raiz/arte/ferramentas/montar-tira.sh" "$src" "$png"
  convert "$png" -background none -resize x140 -quality 88 \
    -define webp:alpha-quality=95 "$raiz/assets/unidades/$tipo-andar-$d.webp"
done
echo "assets:"
ls -la "$raiz/assets/unidades/" | grep "$tipo-andar" | awk '{print "  " $5, $9}'
