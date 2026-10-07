#!/usr/bin/env bash
# Publica as 8 direções de uma torre renderizada no Blender.
#
#   montar-direcoes-torre.sh <tipo> <cor-corpo> <cor-detalhe> [largura] [perfil]
#
# O PERFIL escolhe a coroa: misto, obus, emissor ou feixe. Só a cor não basta —
# seis torres com a mesma silhueta viram a mesma mancha no teste do preto.
#
# Existe por causa de um defeito real: a conversão PNG -> WebP foi feita à mão
# uma vez, com um `-flatten` no meio, e o `-flatten` ACHATA O ALFA. O arquivo
# vira RGB opaco com fundo preto, e no jogo a torre aparece dentro de um
# retângulo preto do tamanho do sprite — sem erro nenhum no console.
#
# Por isso duas regras estão embutidas aqui:
#   - NUNCA `-flatten`, `-alpha remove`, `-alpha off` nem `-background <cor>`.
#   - o PORTÃO no fim: se algum arquivo sair sem alfa, o script falha.
#
# `-level 4%,100%` no canal alfa é cinto de segurança: zera o resíduo abaixo de
# ~10/255 e REESCALA o resto, então a antisserrilha continua gradual. Não use
# `-threshold`, que destrói a borda suave.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
tipo="${1:?uso: montar-direcoes-torre.sh <tipo> <cor-corpo> <cor-detalhe> [largura]}"
corpo="${2:?falta a cor do corpo, ex: #4a6a78}"
detalhe="${3:?falta a cor do detalhe, ex: #7fd7ff}"
larg="${4:-190}"
perfil="${5:-misto}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

blender -b -P "$raiz/arte/modelos/torreta.py" -- "$corpo" "$detalhe" "$tmp/$tipo" 8 "$perfil" \
  | grep -E "RENDER|Error" || true

for i in 0 1 2 3 4 5 6 7; do
  convert "$tmp/$tipo-$i.png" \
    -channel A -level 4%,100% +channel \
    -filter Lanczos -resize "${larg}x" \
    -quality 90 -define webp:method=6 -define webp:alpha-quality=100 \
    "$raiz/assets/estruturas/$tipo-dir$i.webp"
done

falhou=0
for i in 0 1 2 3 4 5 6 7; do
  arq="$raiz/assets/estruturas/$tipo-dir$i.webp"
  a=$(identify -format "%A" "$arq")
  if [ "$a" != "True" ]; then echo "SEM ALFA: $arq"; falhou=1; fi
done
[ "$falhou" = 0 ] || { echo "== portão reprovou: sprite sem alfa vira retângulo preto no jogo"; exit 1; }
echo "== $tipo: 8 direções publicadas, todas com alfa"
