#!/usr/bin/env bash
# Publica e REGISTRA as poses de ataque já recortadas de uma criatura.
#
#   integrar-ataque.sh <tipo> <pasta> [altura] [direcoes...]
#
# Entra por `arte/<pasta>/animacao/<tipo>-atacar-<dir>.png` — o PNG que já foi
# recortado à mão, porque o modo de recorte muda de bicho para bicho: matiz
# para o que é laranja, floodfill de borda para o que tem contorno preto,
# rembg para o que é da cor do fundo. Automatizar o recorte aqui só esconderia
# essa escolha.
#
# Irmão de `integrar-morto.sh` e pelo mesmo motivo: o registro em `TIRAS` é a
# parte que some sem dar erro. Sem a chave lá, a pose de ataque nunca aparece
# e a criatura ataca de lado — que parece bug de direção e é linha esquecida.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
tipo="${1:?uso: integrar-ataque.sh <tipo> <pasta> [altura] [direcoes...]}"
pasta="${2:?falta a pasta: unidades ou inimigos}"
altura="${3:-200}"
shift 3 2>/dev/null || shift 2
dirs=("$@")
[ ${#dirs[@]} -eq 0 ] && dirs=(leste norte sudeste)

for d in "${dirs[@]}"; do
  ent="$raiz/arte/$pasta/animacao/$tipo-atacar-$d.png"
  [ -s "$ent" ] || { echo "== $tipo-$d: sem PNG recortado, pulei"; continue; }
  convert "$ent" -trim +repage -resize "x$altura" -quality 88 \
    -define webp:method=6 -define webp:alpha-quality=95 \
    "$raiz/assets/$pasta/$tipo-atacar-$d.webp"

  chave="$pasta/$tipo-atacar-$d"
  if grep -q "'$chave'" "$raiz/src/sprites.js"; then
    echo "== $chave: publicado (já registrado)"
  else
    python3 - "$raiz/src/sprites.js" "$chave" <<'PY'
import sys, pathlib
arq, chave = sys.argv[1], sys.argv[2]
p = pathlib.Path(arq); s = p.read_text()
i = s.index("var TIRAS = {")
fim = s.index("\n  };", i)
p.write_text(s[:fim] + ",\n    '" + chave + "': 1" + s[fim:])
print("== " + chave + ": publicado e registrado")
PY
  fi
done
ls -la "$raiz/assets/$pasta/" | grep "$tipo-atacar" | awk '{print "  " $5, $9}'
