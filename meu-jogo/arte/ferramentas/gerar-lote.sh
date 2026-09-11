#!/usr/bin/env bash
# Gera as peças nomeadas, recorta e salva DIRETO em arte/<pasta>/, uma a uma.
#
#   gerar-lote.sh <pasta-destino> <nome> [nome...]
#
# Cada peça é salva assim que fica pronta, e não no fim do lote: um lote de sete
# peças levou vinte minutos e se perdeu inteiro quando a pasta temporária foi
# limpa antes de eu copiar para o projeto. O prompt vem de arte/prompts/<nome>.txt,
# e o modo de recorte sai da primeira linha que disser FUNDO: VERDE.
set -uo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
S="$HOME/.claude/skills/gerar-imagem-web/scripts"
destino="${1:?uso: gerar-lote.sh <pasta-destino> <nome>...}"
shift
mkdir -p "$raiz/arte/$destino" "$raiz/arte/origem"

for nome in "$@"; do
  prompt="$raiz/arte/prompts/$nome.txt"
  [ -f "$prompt" ] || { echo "== $nome: sem prompt, pulei"; continue; }
  cru="$raiz/arte/origem/$nome-v1.jpg"
  echo "== $nome"
  "$S/gerar2.sh" "$cru" "$(cat "$prompt")" 70 2>&1 | tail -1
  [ -s "$cru" ] || { echo "   $nome: nao veio imagem"; continue; }
  modo=""
  grep -q 'FUNDO: VERDE' "$prompt" && modo="--verde"
  "$raiz/arte/ferramentas/recortar-fundo.sh" "$cru" "$raiz/arte/$destino/$nome.png" $modo
done
echo "== FIM"
