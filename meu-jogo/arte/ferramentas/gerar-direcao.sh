#!/usr/bin/env bash
# Gera a tira de 4 quadros de caminhada de UMA direção.
#
#   gerar-direcao.sh <referencia.jpg> <nome-saida> "<descricao da vista>"
#
# Três regras aprendidas no caminho, todas por erro:
#  - SEMPRE com a imagem de referência anexada. Sem ela o modelo troca a cor do
#    personagem — a vista de frente saiu cinza-verde em vez de azul aço.
#  - UMA direção por pedido. Pedindo três de uma vez ele devolve uma só.
#  - PERNA DURA, sem joelho. Não é escolha estética: quanto menos o modelo tem
#    que variar entre quadros, mais idênticos eles saem. Com joelho dobrado o
#    corpo gira e o tamanho oscila de um quadro para o outro. E perna rígida
#    girando no quadril é exatamente o modelo de `anima.js`, então o desenho e a
#    conta do pé plantado falam a mesma língua.
set -uo pipefail
S="$HOME/.claude/skills/gerar-imagem-web/scripts"
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
ref="${1:?uso: gerar-direcao.sh ref.jpg nome \"vista\"}"
nome="${2:?falta o nome}"
vista="${3:?falta a descricao da vista}"

node "$S/fechar_overlay.mjs" >/dev/null 2>&1
timeout 240 node "$S/gerar_imagem.mjs" --foto "$ref" --prompt \
"Este e o operario do meu jogo. Copie a identidade EXATAMENTE: macacao AZUL ACO ESCURO com faixas LARANJA, capacete LARANJA com visor, mochila de equipamento nas costas, luvas e botas cinza, mesmo estilo de pintura, mesma luz de cima e da esquerda. A cor nao pode mudar.

Desenhe ele QUATRO vezes numa linha horizontal. $vista

A CARACTERISTICA PRINCIPAL DO ANDAR: ele anda de PERNA DURA, sem dobrar o joelho em momento nenhum. As duas pernas ficam RETAS E ESTICADAS o tempo todo, como as de um boneco de madeira articulado so no quadril. O movimento e so abrir e fechar as pernas, como uma tesoura.

1. pernas retas e bem abertas, uma esticada a frente e outra esticada atras, pes afastados pela largura de dois ombros
2. pernas retas quase juntas, passando uma pela outra
3. igual ao 1, pernas trocadas
4. igual ao 2

Em NENHUM dos quatro o joelho dobra. Nenhum pe erguido no ar: as pernas sempre retas, sempre perto do chao.

Maos livres, sem ferramenta. Mesmo tamanho e mesma linha de chao nos quatro.

FUNDO: MAGENTA puro chapado, sem sombra, sem divisoria, sem texto." \
  --saida "$raiz/arte/origem/$nome.jpg" --espera 85 >/dev/null 2>&1
node "$S/pegar_img2.mjs" "$raiz/arte/origem/$nome.jpg"

# O coletor pega "a última imagem grande da conversa". Se a geração falhou, ele
# devolve em silêncio a imagem ANTERIOR — e o lote termina com dois arquivos
# byte a byte iguais, um deles com o nome errado. Aconteceu: sudeste e nordeste
# saíram idênticos. Avisar aqui é mais barato que descobrir olhando.
anterior=$(ls -t "$raiz"/arte/origem/andar-*.jpg 2>/dev/null | grep -v "/$nome.jpg$" | head -1)
if [ -n "$anterior" ] && cmp -s "$anterior" "$raiz/arte/origem/$nome.jpg"; then
  echo "AVISO: $nome saiu IGUAL a $(basename "$anterior") — a geração falhou, refaça."
fi
