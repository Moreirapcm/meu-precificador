#!/usr/bin/env bash
# Gera UMA folha com a mesma unidade em CINCO direções, fazendo a mesma ação.
#
#   gerar-folha-direcoes.sh <referencia.jpg> <nome-saida> "<acao>"
#
# Cinco e não oito porque as três que faltam saem espelhadas na hora de
# desenhar — é o que Age of Empires e StarCraft faziam, e o que `anima.js` já
# espera em `direcao()`.
#
# Numa folha só, e não uma por pedido, pelo mesmo motivo das tiras de
# caminhada ao contrário: ali cada pedido pedia QUATRO poses em movimento e o
# modelo se perdia; aqui é UMA pose por direção, e mantê-las na mesma geração é
# o que garante que as cinco sejam o mesmo boneco.
set -uo pipefail
S="$HOME/.claude/skills/gerar-imagem-web/scripts"
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
ref="${1:?uso: gerar-folha-direcoes.sh ref.jpg nome \"acao\"}"
nome="${2:?falta o nome}"
acao="${3:?falta a acao}"

# Conversa NOVA a cada folha. Sem isto o coletor devolve a última imagem que já
# estava na página: pedi a folha de novo com o estilo corrigido e recebi de
# volta, byte por byte, a folha errada da tentativa anterior — e só percebi
# comparando as duas com Vision.
node "$S/reset_ia.mjs" >/dev/null 2>&1
sleep 3
node "$S/fechar_overlay.mjs" >/dev/null 2>&1
timeout 300 node "$S/gerar_imagem.mjs" --foto "$ref" --prompt \
"Esta e uma unidade do meu jogo de estrategia isometrico. Copie a identidade EXATAMENTE: as mesmas cores, o mesmo uniforme, o mesmo equipamento, a mesma luz vindo de cima e da esquerda. A cor e o desenho do personagem NAO podem mudar.

O ESTILO TAMBEM NAO PODE MUDAR, e isso e tao importante quanto a cor: e RENDERIZACAO 3D LIMPA, com volume, sombra suave e material pintado, do jeito que a imagem de referencia esta. NAO e desenho animado: sem contorno preto em volta da figura, sem traco de caneta, sem sombreado em blocos chapados, sem estilo anime ou mangá, sem cel shading. Se a imagem sair parecendo desenho de revista em quadrinhos, esta errada.

Desenhe ele CINCO vezes numa linha horizontal, bem espacados, sem encostar um no outro. Em todas as cinco ele esta fazendo A MESMA COISA: $acao

O QUE MUDA ENTRE AS CINCO E SO A DIRECAO PARA ONDE ELE ESTA VIRADO. E uma vista isometrica de cima em tres quartos, entao pense assim:

1. VIRADO PARA A DIREITA DA TELA, de perfil, o corpo atravessado.
2. VIRADO PARA A DIREITA E PARA CIMA, na diagonal, mostrando as costas de tres quartos.
3. VIRADO PARA CIMA, de costas para quem olha, mostrando as costas e a nuca.
4. VIRADO PARA A DIREITA E PARA BAIXO, na diagonal, mostrando o rosto de tres quartos.
5. VIRADO PARA BAIXO, de frente para quem olha, mostrando o rosto inteiro.

NENHUMA das cinco pode estar virada para a esquerda: as que faltam eu faco espelhando.

Todas do MESMO TAMANHO, todas apoiadas na MESMA LINHA DE CHAO, todas com a mesma iluminacao.

FUNDO: MAGENTA puro chapado em toda a area, sem sombra projetada no chao, sem divisoria, sem moldura, sem texto, sem numero." \
  --saida "$raiz/arte/origem/$nome.jpg" --espera 95
echo "saida: arte/origem/$nome.jpg"
