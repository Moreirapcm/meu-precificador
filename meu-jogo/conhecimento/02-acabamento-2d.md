# Acabamento 2D: do render cru ao sprite legível

As técnicas do Photoshop em linha de comando. Testado com **ImageMagick 6.9.12**
(`convert`) e **PIL/numpy**; no IM 7 troque `convert` por `magick`. Ordem fixa,
com a redução **antes** de contorno e afiação: `recortar fundo → despill →
REDUZIR → limpar alfa → contorno → afiar → paleta`.

## 1. Silhueta e contorno

O sprite tem 20 a 100px na tela: quem identifica a peça é a borda, não o detalhe
interno, e sem contorno a figura se dissolve em fundo de valor parecido. Daí o
teste de silhueta — forma preenchida de uma cor só, se ainda é reconhecível,
funciona em movimento ([Pixnote](https://pixnote.net/en/learn/glossary/)).

**Externo vs interno.** Externo dilata o alfa: não come arte, mas engorda a
silhueta e funde detalhe fino. Interno mantém a silhueta exata e devora arte —
num sprite de 40px isso é metade de um braço. **Para RTS, externo de 1px**;
interno só em estrutura grande.

**Cor.** Preto puro se descola: o salto da sombra mais escura para `#000` fica
duro e serrilhado. O padrão é um tom escuro da própria peça, mais escuro que a
peça E que o fundo ([Lospec](https://lospec.com/articles/pixel-art-outlines-part-2-using-color/)).

```bash
# contorno externo 1px, cor fixa do jogo
convert entrada.png \
  \( +clone -channel A -morphology EdgeOut Diamond +channel \
     +level-colors '#0d1016' \) \
  -compose DstOver -composite saida.png

# contorno com a COR DA PRÓPRIA PEÇA escurecida (RGB × 0.35)
convert entrada.png \
  \( +clone -channel A -morphology EdgeOut Diamond +channel \
     -channel RGB -evaluate Multiply 0.35 +channel \) \
  -compose DstOver -composite saida.png
```

`EdgeOut` devolve só o anel que a dilatação acrescentaria, sem tocar no original
([Morphology](https://usage.imagemagick.org/morphology/), [Outline/Halo](https://usage.imagemagick.org/masking/)).

**Espessura** é função da altura final, não do arquivo grande: até 32px use 1px
com `Diamond`; de 33 a 80px, 1px com `Disk:1` (canto mais redondo); acima de 96px
(estruturas), 2px com `Dilate Disk:2` no lugar do `EdgeOut Diamond` acima.

## 2. Redução (downscale)

**Lanczos** para sprite: o mais afiado da família, e aresta viva é o que se quer
preservar (o preço é halo, irrelevante sob contorno). **Mitchell** (default do
IM) é mais macio e sem halo — use quando o Lanczos deixar franja clara em
contraste forte. **Box** só em divisor exato (2x, 4x); fora disso borra sem
compensar ([Filters](https://usage.imagemagick.org/filter/),
[Robidoux](https://usage.imagemagick.org/filter/nicolas/)).

```bash
convert entrada.png -filter Lanczos  -resize x48 saida.png
convert entrada.png -filter Mitchell -resize x48 saida.png
```

**Afiar DEPOIS.** Afiando a 700px e reduzindo para 48, o filtro faz média de ~15
pixels por pixel final: a afiação some na média e sobra só o ruído que ela criou.

```bash
convert entrada.png -filter Lanczos -resize x48 -unsharp 0x0.7+0.9+0.02 saida.png
```

**Franja de alfa não pré-multiplicado.** O filtro faz média do RGB *inclusive dos
pixels totalmente transparentes* — em PNG recortado esse RGB costuma ser preto
(`none`), então a média puxa a borda para o escuro e sai contorno sujo; com
branco transparente, sai halo claro
([Resize Halo Bug](https://usage.imagemagick.org/bugs/resize_halo/)).

```bash
convert entrada.png -alpha Associate \
  -filter Lanczos -resize x48 \
  -alpha Disassociate PNG32:saida.png
```

`Associate` multiplica RGB por alfa, `Disassociate` divide de volta. Paliativo
barato: `-background '#FFFF'` em peça clara. Em PIL, explícito:

```python
from PIL import Image
import numpy as np
im = Image.open('entrada.png').convert('RGBA')
a = np.asarray(im).astype(np.float32) / 255.0
a[..., :3] *= a[..., 3:4]                       # pré-multiplica
pre = Image.fromarray((a * 255 + 0.5).astype('uint8'), 'RGBA')
pre = pre.resize((im.width * 48 // im.height, 48), Image.LANCZOS)
b = np.asarray(pre).astype(np.float32) / 255.0
al = np.maximum(b[..., 3:4], 1e-6)
b[..., :3] = np.clip(b[..., :3] / al, 0, 1)     # desfaz
Image.fromarray((b * 255 + 0.5).astype('uint8'), 'RGBA').save('saida.png')
```

## 3. Limpeza de borda

Três ferramentas, cada uma estraga uma coisa diferente.

**Despill.** O fundo reflete na peça e vaza no pixel semitransparente (pá de
rotor, vidro, vapor); nenhuma máscara tira, porque o pixel é genuinamente rosa. A
fórmula padrão limita o canal do fundo à média dos outros dois:
`g > (r+b)/2 ? (r+b)/2 : g` ([Nukepedia](https://www.nukepedia.com/tools/gizmos/keyer/bm_despill/)).

```bash
# fundo VERDE
convert entrada.png -channel RGB \
  -fx "g>(r+b)/2 ? ((c==1) ? (r+b)/2 : u) : u" +channel PNG32:saida.png

# fundo MAGENTA (o alfa precisa ser guardado e recolado)
convert entrada.png -alpha extract mascara.png
convert entrada.png -alpha off \
  -fx "(r>g*1.08 && b>g*1.08) ? (r+g+b)/3 : u" rgb.png
convert rgb.png mascara.png -alpha off -compose CopyOpacity -composite PNG32:saida.png
```

*Estraga quando* a peça tem a cor do fundo de verdade — despill magenta apaga o
brilho roxo da torre de plasma. Nesse caso gere a arte com fundo verde.

**Erosão de alfa.** Come 1px e leva junto a franja de antialiasing do JPEG.

```bash
convert entrada.png -channel A -morphology Erode Disk:1 +channel PNG32:saida.png
```

*Estraga quando* a peça já é pequena ou tem detalhe de 1–2px (antena, cabo) —
**erode antes de reduzir.**

**Threshold de alfa.** Corta o meio-termo e dá borda dura de pixel art.

```bash
convert entrada.png -channel A -threshold 45% +channel PNG32:saida.png
```

*Estraga quando* há transparência real (vidro, fumaça, rastro): vira sólido ou
buraco. E serrilha curva em sprite grande. Regra — **threshold em unidade opaca,
erosão em detalhe fino, despill sempre que houve chroma key.**

## 4. Paleta

**Por que 256.** VGA 320x200 é indexado: cada pixel guarda um índice numa tabela
de 256 cores, não um RGB — um byte por pixel em vez de três
([VGA 320](https://people.cs.umass.edu/~verts/cs32/vga_320.html),
[ModdingWiki](https://moddingwiki.shikadi.net/wiki/VGA_Palette)). O efeito
colateral virou técnica: trocando a tabela, o mesmo sprite vira outro personagem
(Scorpion/Sub-Zero, Mario/Luigi) — e os times de cor de qualquer RTS.

**Dithering** espalha o erro de quantização em ruído. *Ajuda* em gradiente grande
e suave (céu, chão, fundo de tela). *Atrapalha* em sprite pequeno: compete com o
detalhe, some no escalonamento, vira sujeira em movimento — a doc do IM recomenda
nenhum ou ordenado em imagem pequena ([Quantize](https://usage.imagemagick.org/quantize/)).

```bash
convert entrada.png +dither -colors 32 saida.png             # sprite: SEM
convert fundo.png -dither FloydSteinberg -colors 64 sai.png  # gradiente: COM
```

**Identidade de cor entre peças.** Quantizar sprite isolado dá uma paleta por
arquivo: o cinza do tanque não bate com o do fuzileiro. Gere paleta comum e
remapeie todos nela.

```bash
convert arte/unidades/*.png +append -colors 48 -unique-colors paleta.png
for f in arte/unidades/*.png; do
  convert "$f" -dither None -remap paleta.png PNG32:"${f%.png}-pal.png"
done
```

`-remap` obriga o uso exato daquele conjunto (é o colormap global do GIF); use
`-quantize HSL` se a arte for chapada e o `-colors` estiver comendo matizes.

## 5. Leitura em tamanho pequeno

**Valor, não matiz.** Em 40px quem separa formas é claro/escuro; dois matizes
opostos de mesmo valor viram a mesma mancha cinza
([Pixel-Editor](https://www.pixel-editor.com/articles/color-theory-for-pixel-art)).
**Silhueta em preto:** se você não identifica a unidade, o jogador também não vai,
no meio de uma onda.

```bash
# teste de valor
convert entrada.png -colorspace Gray -filter Lanczos -resize x48 teste-valor.png
# teste de silhueta
convert entrada.png -filter Lanczos -resize x48 \
  -fill black -colorize 100 -background '#b9c0c8' -flatten PNG24:silhueta.png
```

**Como testar:** reduzir para a altura real e montar folha de contato com todas
as peças lado a lado, no fundo do jogo. Peça isolada em 700px não prova nada.

```bash
convert arte/unidades/*.png -filter Lanczos -resize x48 \
  -background '#3a4250' -gravity south -splice 0x4 +append \
  -bordercolor '#3a4250' -border 8 folha-teste.png
```

## 6. Sombra de contato

Sem sombra a unidade flutua. O padrão é a *blob shadow*: elipse escura e borrada
que não imita o contorno, só diz onde o objeto toca o chão, e é barata
([Blob Shadows](https://github.com/Delt06/toon-rp/wiki/Blob-Shadows)).

```bash
# a) elipse borrada, desenhada uma vez e reusada por todas as peças do mesmo porte
convert -size 64x24 xc:none -fill 'rgba(0,0,0,0.55)' \
  -draw 'ellipse 32,12 30,10 0,360' -blur 0x3 PNG32:sombra.png

# b) gradiente radial achatado — queda mais natural na borda
convert -size 64x64 radial-gradient:'rgba(0,0,0,0.6)'-none \
  -resize 64x24\! PNG32:sombra.png

# c) oclusão: a própria silhueta achatada, escurecida e borrada (peça grande)
convert entrada.png -alpha extract -resize 100x35% \
  -background black -alpha shape -channel A -evaluate Multiply 0.5 +channel \
  -blur 0x2 PNG32:sombra.png
```

Em Canvas 2D, desenhar a sombra antes do sprite, centrada na base. Reusar um só
PNG (a) por porte é o melhor custo/benefício: uma textura, zero cálculo.

## 7. Normal map / iluminação 2D

Normal map guarda em RGB a direção da superfície por pixel; um shader combina com
a luz e a peça ganha relevo dinâmico (Sprite DLight,
[SpriteIlluminator](https://www.codeandweb.com/spriteilluminator)).

**Não vale aqui.** Exige renderizador com shader (WebGL, Phaser, Pixi): Canvas 2D
não tem onde rodar cálculo por pixel, e na CPU seria refazer a iluminação a cada
quadro por unidade. Dobra os assets e obriga a regerar tudo a cada mudança de
arte. **O que substitui, de graça:** a luz já vem pintada no render — direção
única para todo o jogo (alto-esquerda), contorno escuro do item 1, sombra de
contato do item 6. É o que Age of Empires fez. Se migrar para WebGL, volta.

## O que já existe no repositório

De `arte/ferramentas/polir-sprite.sh`, `recortar-fundo.sh` e `recortar-ia.sh`:

**Feito.** Recorte por matiz (magenta e verde), floodfill de borda e IA
(rembg/isnet), com a escolha certa documentada por medição. Despill magenta em
`-fx` e em PIL. Erosão de alfa 1px em todos os caminhos. Redução Lanczos já na
altura de jogo. Threshold de alfa a 45%. Contorno externo 1px (`Dilate Disk:1`,
`#0d1016`). Unsharp depois da redução. `-trim +repage` em toda saída.

**Falta.** (1) Pré-multiplicar o alfa antes de reduzir: `polir-sprite.sh` reduz
sem `-alpha Associate` e o threshold a 45% mascara a franja em vez de evitá-la —
em peça com transparência real isso apaga vidro e pá de rotor. (2) Contorno com a
cor da própria peça e espessura em função da altura (hoje 1px e `#0d1016` para
tudo, inclusive estrutura grande). (3) Sombra de contato: não existe nenhuma.
(4) Paleta comum entre peças — nada de `-remap`. (5) Folha de contato na altura
real para os testes de silhueta e valor: é o gate mais barato que falta.
