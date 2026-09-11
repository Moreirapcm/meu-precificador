#!/usr/bin/env bash
# Tira o fundo magenta de uma arte gerada por IA e devolve PNG com transparência.
#
#   recortar-fundo.sh entrada.jpg saida.png [largura] [--borda|--verde] [--despill]
#
# Modo padrão (matiz): a máscara é "vermelho e azul altos, verde baixo" = magenta.
# O chroma key por cor exata não serve porque o magenta visto entre as barras de
# uma treliça está sombreado, e o fuzz alto o bastante para pegá-lo come o cinza
# do prédio. A erosão de 1px remove a franja de antialiasing do JPEG.
#
# Modo --verde: para a peça cujo fundo foi gerado VERDE em vez de magenta — o que
# se faz quando a própria criatura é rosa, roxa ou magenta e o teste de matiz
# magenta apagaria o brilho dela junto com o fundo. Mesma ideia, matiz trocado.
#
# Modo --borda (floodfill): obrigatório para peças que TÊM violeta, rosa ou roxo
# na própria arte (a torre de plasma) — o teste de matiz apagaria o brilho da
# peça junto com o fundo. Aqui só some o magenta conectado à borda da imagem.
#
# --despill: onde a peça é SEMITRANSPARENTE (as pás de rotor do drone, um rastro
# de vapor), o magenta do fundo se mistura à cor e sobra um rosa que nenhuma
# máscara tira, porque o pixel é genuinamente rosa. Aqui ele vira cinza de mesma
# luminosidade. Não usar em peça que tenha rosa ou violeta de verdade.
set -euo pipefail
entrada="${1:?uso: recortar-fundo.sh entrada.jpg saida.png [largura] [--borda]}"
saida="${2:?falta a saida}"
largura=""
modo="matiz"
despill=0
for a in "${@:3}"; do
  case "$a" in
    --borda) modo="borda" ;;
    --verde) modo="verde" ;;
    --despill) despill=1 ;;
    *) largura="$a" ;;
  esac
done

if [ "$modo" = "borda" ]; then
  fundo=$(convert "$entrada" -format "%[pixel:p{2,2}]" info:)
  L=$(identify -format %w "$entrada"); A=$(identify -format %h "$entrada")
  # Os quatro cantos, porque a sombra projetada que o gerador às vezes deixa forma
  # uma mancha encostada numa borda só — partindo de um canto apenas, ela sobrevive.
  convert "$entrada" -alpha set -channel RGBA -fuzz 18% -fill "rgba(0,0,0,0)" \
    -floodfill +0+0 "$fundo" \
    -floodfill +$((L-1))+0 "$fundo" \
    -floodfill +0+$((A-1)) "$fundo" \
    -floodfill +$((L-1))+$((A-1)) "$fundo" +channel \
    -channel A -morphology Erode Disk:1 +channel \
    -trim +repage PNG32:"$saida"
elif [ "$modo" = "verde" ]; then
  convert "$entrada" -alpha set \
    \( +clone -fx "(g>r*1.35 && g>b*1.35) ? 0 : 1" -blur 0x0.5 \) \
    -alpha off -compose CopyOpacity -composite \
    -channel A -morphology Erode Disk:1 +channel \
    -trim +repage PNG32:"$saida"
else
  convert "$entrada" -alpha set \
    \( +clone -fx "(r>g*1.35 && b>g*1.25) ? 0 : 1" -blur 0x0.5 \) \
    -alpha off -compose CopyOpacity -composite \
    -channel A -morphology Erode Disk:1 +channel \
    -trim +repage PNG32:"$saida"
fi

if [ "$despill" = 1 ]; then
  tmp=$(mktemp -d)
  convert "$saida" -alpha extract "$tmp/a.png"
  if [ "$modo" = "verde" ]; then
    teste="(g>r*1.08 && g>b*1.08)"
  else
    teste="(r>g*1.08 && b>g*1.08)"
  fi
  convert "$saida" -alpha off -fx "$teste ? (r+g+b)/3 : u" "$tmp/rgb.png"
  convert "$tmp/rgb.png" "$tmp/a.png" -alpha off -compose CopyOpacity -composite PNG32:"$saida"
  rm -rf "$tmp"
fi

[ -n "$largura" ] && convert "$saida" -background none -resize "${largura}x" PNG32:"$saida"
identify -format "%f %wx%h alpha=%A modo=$modo\n" "$saida"
