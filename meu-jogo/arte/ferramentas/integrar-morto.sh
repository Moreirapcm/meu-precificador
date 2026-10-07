#!/usr/bin/env bash
# Recorta, redimensiona e REGISTRA o corpo caído de uma unidade.
#
#   integrar-morto.sh <tipo> <pasta> [altura]
#
# Irmão do `integrar-queda.sh`, e existe pelo mesmo motivo: o registro em
# `TIRAS` é a parte que some sem dar erro. Sem a chave lá, o corpo caído nunca
# aparece e o cadáver cai na mancha escura — que parece "arte faltando" e não
# "linha esquecida".
set -euo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
tipo="${1:?uso: integrar-morto.sh <tipo> <pasta> [altura]}"
pasta="${2:?falta a pasta: unidades ou inimigos}"
altura="${3:-130}"
ent="$raiz/arte/origem/$tipo-morto-leste.jpg"
[ -s "$ent" ] || { echo "== $tipo: sem imagem"; exit 1; }

tmp="$(mktemp -d)"
"$raiz/arte/ferramentas/recortar-fundo.sh" "$ent" "$tmp/m.png" >/dev/null 2>&1
mkdir -p "$raiz/arte/$pasta/animacao"
cp "$tmp/m.png" "$raiz/arte/$pasta/animacao/$tipo-morto.png"
convert "$tmp/m.png" -trim +repage -resize "x$altura" -quality 88 \
  -define webp:method=6 "$raiz/assets/$pasta/$tipo-morto.webp"
rm -rf "$tmp"

chave="$pasta/$tipo-morto"
if grep -q "'$chave'" "$raiz/src/sprites.js"; then
  echo "== $chave: já registrado"
else
  python3 - "$raiz/src/sprites.js" "$chave" <<'PY'
import sys, pathlib
arq, chave = sys.argv[1], sys.argv[2]
p = pathlib.Path(arq); s = p.read_text()
i = s.index("var TIRAS = {")
fim = s.index("\n  };", i)
p.write_text(s[:fim] + ",\n    '" + chave + "': 1" + s[fim:])
print("== " + chave + ": registrado")
PY
fi
