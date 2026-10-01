#!/usr/bin/env bash
# Gera as CINCO direções de uma pose, UMA POR PEDIDO, no LNV.
#
#   gerar-direcoes-uma-a-uma.sh <prompt-base.txt> <nome> <acao> [ref.jpg]
#
# Existe porque o gerador só monta folha de cinco poses quando o personagem é
# HUMANOIDE. Para criatura e para veículo ele devolve UMA figura, por mais
# explícito que seja o pedido — medido em três tentativas com fraseados
# diferentes, inclusive "isto é uma folha de sprite, são cinco corpos".
#
# Aqui cada direção é um pedido próprio, e o que mantém as cinco parecidas é a
# mesma imagem de referência em todas, mais o texto idêntico com uma única
# frase trocada. É mais lento — cinco idas em vez de uma — e é o que funciona.
set -uo pipefail
raiz="$(cd "$(dirname "$0")/../.." && pwd)"
base="${1:?uso: gerar-direcoes-uma-a-uma.sh base.txt nome acao [ref.jpg]}"
nome="${2:?falta o nome}"
acao="${3:?falta a acao}"
ref="${4:-}"
# Bicho roxo, rosa ou magenta não pode posar em fundo magenta: o recorte por
# matiz apaga o brilho dele junto com o fundo, e o recorte por borda atravessa
# a membrana translúcida da asa e come a asa inteira — medido na Asa corrosiva.
# Nesses casos: FUNDO="VERDE LIMAO" e depois `recortar-fundo.sh --verde`.
FUNDO="${FUNDO:-MAGENTA}"

descreve() {
  case "$1" in
    leste)    echo "vista em PERFIL PURO, DE LADO. A cabeca aponta exatamente para a BORDA DIREITA do quadro e vemos o FLANCO inteiro do bicho, como quem fotografa um cavalo de lado. NENHUMA parte da cara vira para quem olha: so um olho aparece, o do lado de ca. As patas deste lado tapam parcialmente as do outro. Se a cara aparecer virada para nos, a imagem esta errada." ;;
    nordeste) echo "virada para a DIREITA E PARA CIMA, na diagonal, mostrando o dorso de tres quartos." ;;
    norte)    echo "AFASTANDO-SE de quem olha, indo para o fundo da cena. Estamos ATRAS e um pouco acima dela. Vemos o DORSO inteiro e o alto das costas, a traseira vem na nossa direcao e a cabeca esta LA NA FRENTE, longe, pequena e quase escondida atras da curva do corpo. A cara NAO aparece. A criatura continua com o MESMO numero de patas no chao, na mesma postura de sempre — so o ponto de vista mudou. Se a cara estiver virada para nos, a imagem esta errada." ;;
    sudeste)  echo "virada para a DIREITA E PARA BAIXO, na diagonal, mostrando a frente de tres quartos." ;;
    sul)      echo "VINDO NA DIRECAO de quem olha, saindo do fundo para a frente da cena: vemos o PEITO e a cara de frente, as patas dianteiras vindo para nos, a cauda ao fundo e pequena. A criatura continua com o MESMO numero de patas no chao, na mesma postura de sempre — e so o ponto de vista que mudou." ;;
  esac
}

# Três direções, não cinco, quando a quinta não sai: `R.tiraDaDirecao` cai na
# vizinha. Passe DIRECOES no ambiente para mudar a lista.
for dir in ${DIRECOES:-leste norte sudeste}; do
  saida="$raiz/arte/origem/$nome-$dir.jpg"
  [ -s "$saida" ] && { echo "== $dir: ja existe, pulei"; continue; }
  tmp="$(mktemp /tmp/uf-dir-XXXX.txt)"
  {
    cat "$base"
    echo
    echo "A ACAO: $acao"
    echo
    echo "A DIRECAO, e so existe UMA figura nesta imagem: a criatura esta $(descreve "$dir")"
    echo
    echo "Gere UMA UNICA figura, centralizada, ocupando boa parte do quadro. Fundo $FUNDO puro chapado, sem sombra projetada no chao, sem texto, sem moldura."
  } > "$tmp"
  echo "== $dir"
  "$raiz/arte/ferramentas/gerar-no-lnv.sh" "$tmp" "$saida" $ref 2>&1 | tail -1
  rm -f "$tmp"
done
echo "== FIM"
