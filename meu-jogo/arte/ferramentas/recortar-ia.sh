#!/usr/bin/env bash
# Recorta o fundo de uma arte gerada usando IA (rembg) em vez de chroma key.
#
#   recortar-ia.sh entrada.jpg saida.png [largura]
#
# O recorte por matiz falha quando a peça tem a MESMA cor do fundo: a torre de
# plasma perdeu o brilho roxo, e qualquer bicho rosa some junto com o magenta.
# O rembg decide por forma, não por cor, então não tem esse problema — e ainda
# acerta borda de vidro, fumaça e pá de rotor, onde a máscara dura serrilha.
#
# MEDIDO, e o resultado surpreende: para peça com fundo magenta chapado o
# chroma key (`recortar-fundo.sh`) ganha, e continua sendo o padrão. O rembg
# recorta pela SILHUETA, então come o que está solto no ar — o clarão da boca
# do cano do fuzileiro sumiu inteiro, porque para ele aquilo é fundo.
# Use este aqui quando a peça tiver a MESMA COR do fundo (a torre de plasma
# roxa, um bicho rosa), que é justamente onde o chroma key apaga a figura.
set -euo pipefail
PY="$HOME/.venvs/rembg/bin/python"
entrada="${1:?uso: recortar-ia.sh entrada.jpg saida.png [largura]}"
saida="${2:?falta a saida}"
largura="${3:-}"

[ -x "$PY" ] || { echo "rembg nao instalado em ~/.venvs/rembg"; exit 1; }
"$PY" - "$entrada" "$saida" <<'PYCODE'
import sys
from rembg import remove, new_session
from PIL import Image
ent, sai = sys.argv[1], sys.argv[2]
img = Image.open(ent).convert('RGBA')
# isnet-general-use recorta melhor objeto único com fundo chapado que o u2net
sessao = new_session('isnet-general-use')
fora = remove(img, session=sessao, post_process_mask=True)
fora.save(sai)
PYCODE
# O rembg decide a SILHUETA, mas não tira a cor do fundo que vazou na borda:
# o primeiro teste saiu com uma franja magenta em volta da figura inteira, pior
# que o chroma key. Erodir o alfa em um pixel come essa franja; o despill
# converte o que sobrar de rosa em cinza de mesma luminosidade.
convert "$saida" \
  -channel A -morphology Erode Disk:1 +channel \
  \( +clone -alpha extract \) -alpha off -compose CopyOpacity -composite \
  "$saida"
"$PY" - "$saida" <<'PYCODE'
import sys
from PIL import Image
sai = sys.argv[1]
img = Image.open(sai).convert('RGBA')
px = img.load()
L, A = img.size
for y in range(A):
    for x in range(L):
        r, g, b, a = px[x, y]
        # magenta vazado: vermelho e azul altos, verde baixo
        if a and r > g + 22 and b > g + 22:
            m = (r + g + b) // 3
            px[x, y] = (m, m, m, a)
img.save(sai)
PYCODE

if [ -n "$largura" ]; then
  convert "$saida" -trim +repage -resize "${largura}x" "$saida"
else
  convert "$saida" -trim +repage "$saida"
fi
identify -format "%f %wx%h alpha=%[opaque]\n" "$saida"
