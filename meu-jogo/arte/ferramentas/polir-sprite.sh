#!/usr/bin/env bash
# O "Photoshop quadro a quadro" da Ensemble, automatizado.
#
#   polir-sprite.sh entrada.png saida.png <altura-em-pixels-no-jogo>
#
# No postmortem do Age of Empires II está o passo que faltava no nosso pipeline:
# depois de renderizar o 3D, um especialista 2D abria QUADRO A QUADRO no
# Photoshop e "afiava o detalhe e suavizava a borda das formas irregulares" —
# porque o sprite tem 20 a 100 pixels na tela e, reduzido cru, vira papa.
#
# Aqui isso vira três passos, na ordem que importa:
#  1. REDUZIR já no tamanho de jogo, com filtro Lanczos, que preserva aresta.
#  2. AFIAR (unsharp) só depois de reduzido — afiar antes e reduzir depois
#     joga fora exatamente o que se afiou.
#  3. SILHUETA: um contorno escuro de um pixel por fora do alfa. É o que os dois
#     jogos tinham de graça, porque o render 3D já vinha com oclusão de contato;
#     sem isso a figura se dissolve no chão claro.
# E limpar a franja semitransparente que sobra de qualquer redução, senão ela
# vira um halo claro em volta de cada unidade.
set -euo pipefail
ent="${1:?uso: polir-sprite.sh entrada.png saida.png altura}"
sai="${2:?falta a saida}"
alt="${3:?falta a altura em pixels}"

convert "$ent" -trim +repage \
  -filter Lanczos -resize "x${alt}" \
  -channel A -threshold 45% +channel \
  "$sai"

# contorno: dilata o alfa, pinta de escuro, e põe o sprite por cima
convert "$sai" \
  \( +clone -alpha extract -morphology Dilate Disk:1 \
     -background '#0d1016' -alpha shape \) \
  -compose DstOver -composite \
  "$sai"

convert "$sai" -unsharp 0x0.7+0.9+0.02 "$sai"
identify -format "%f %wx%h\n" "$sai"
