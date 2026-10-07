#!/usr/bin/env bash
# Recorta, redimensiona e registra os quadros de queda de uma unidade.
#
#   integrar-queda.sh <tipo> [pasta]      pasta: unidades (padrão) ou inimigos
#
# Repetir isso à mão para cada unidade é onde entra erro: um esqueceu o
# registro em TIRAS e o quadro nunca aparece, sem erro nenhum na tela.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
tipo="${1:?uso: integrar-queda.sh <tipo> [pasta]}"
pasta="${2:-unidades}"
tmp="$(mktemp -d)"

for q in caindo1 caindo2; do
  ent="$raiz/arte/origem/$tipo-$q-leste.jpg"
  [ -s "$ent" ] || { echo "== $tipo-$q: sem imagem, pulei"; continue; }
  alt=$([ "$q" = caindo1 ] && echo 244 || echo 190)
  "$raiz/arte/ferramentas/recortar-fundo.sh" "$ent" "$tmp/$q.png" >/dev/null 2>&1
  mkdir -p "$raiz/arte/$pasta/animacao"
  cp "$tmp/$q.png" "$raiz/arte/$pasta/animacao/$tipo-$q.png"
  convert "$tmp/$q.png" -trim +repage -resize "x$alt" -quality 88 \
    -define webp:method=6 "$raiz/assets/$pasta/$tipo-$q.webp"
  chave="$pasta/$tipo-$q"
  if grep -q "'$chave'" "$raiz/src/sprites.js"; then
    echo "== $chave: já registrado"
  else
    python3 - "$raiz/src/sprites.js" "$chave" <<'PY'
import sys, pathlib
arq, chave = sys.argv[1], sys.argv[2]
p = pathlib.Path(arq); s = p.read_text()
marca = "\n  };"
i = s.index("var TIRAS = {")
fim = s.index(marca, i)
s = s[:fim] + ",\n    '" + chave + "': 1" + s[fim:]
p.write_text(s)
print("== " + chave + ": registrado")
PY
  fi
done
rm -rf "$tmp"
