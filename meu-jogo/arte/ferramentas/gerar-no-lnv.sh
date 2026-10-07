#!/usr/bin/env bash
# Gera uma imagem no NOTEBOOK LNV e traz o arquivo para cá.
#
#   gerar-no-lnv.sh <arquivo-prompt.txt> <saida.jpg> [referencia.jpg]
#
# Existe para não ocupar o Chrome desta máquina: gerar arte prende a janela por
# um a dois minutos por peça, e o Pedro usa o navegador daqui para trabalhar.
#
# O envio e a coleta são passos SEPARADOS de propósito. O `gerar_imagem.mjs`
# manda o pedido e tenta baixar sozinho, mas a rotina de download dele falha na
# página do Gemini (canvas contaminado); o `pegar_img2.mjs` busca pela rede e
# funciona. Então aqui o erro do primeiro é ignorado e quem coleta é o segundo.
set -uo pipefail
prompt="${1:?uso: gerar-no-lnv.sh prompt.txt saida.jpg [ref.jpg]}"
saida="${2:?falta a saida}"
ref="${3:-}"
remoto="/home/pedro/.claude/skills/gerar-imagem-web/scripts"
tmp="/tmp/uf-$(date +%s).jpg"
nodeenv='export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh" >/dev/null 2>&1'

scp -q "$prompt" lnv:/tmp/uf-prompt.txt || { echo "sem acesso ao LNV"; exit 1; }

# REGRA DO PEDRO, 13/09/2026: a janela de criar imagem no LNV é aberta por este
# script, sempre, antes de qualquer pedido. Ela cai sozinha — por reinício da
# máquina, por fechar o Chrome, por um `reset_ia` que derruba o processo — e
# quando cai o erro que aparece é "ECONNREFUSED 9370", que não diz nada a quem
# só queria a arte. `abrir_janela_ia.sh` não faz nada se ela já estiver de pé.
ssh lnv "$nodeenv; bash $remoto/abrir_janela_ia.sh >/dev/null 2>&1" || true
args=""
if [ -n "$ref" ]; then
  scp -q "$ref" lnv:/tmp/uf-ref.jpg || exit 1
  args="--foto /tmp/uf-ref.jpg"
fi

ssh lnv "$nodeenv; node $remoto/reset_ia.mjs >/dev/null 2>&1; sleep 3; \
  node $remoto/gerar_imagem.mjs $args --prompt \"\$(cat /tmp/uf-prompt.txt)\" \
    --saida $tmp --espera 95 >/dev/null 2>&1; \
  node $remoto/pegar_img2.mjs $tmp" | tail -1
scp -q "lnv:$tmp" "$saida" || { echo "nao veio imagem"; exit 1; }
ls -la "$saida" | awk '{print $NF, $5" bytes"}'
