# Pipeline de sprite isométrico: como os clássicos e os modernos fazem

Como sprites isométricos saem do modelo e chegam ao arquivo que o jogo carrega.
Fato e fonte; onde a fonte é comunidade de modding e não o estúdio, está dito.
Escopo: dos três "modernos" pedidos nenhum é isométrico — Dead Cells é lateral,
Hades três-quartos, Wargroove grade quadrada vista de cima. Neles mudou o
**pipeline**, não a projeção, e é disso que trata a seção 6.

## 1. Os quatro pipelines clássicos

Os quatro fazem a mesma coisa: **modelam em 3D, renderizam em N ângulos, retocam
em 2D, empacotam em formato próprio de paleta indexada**. Muda o N e o formato.

### Age of Empires (1997) e Age of Empires II (1999)

Ensemble decidiu cedo que, mesmo com a tela toda em 2D, **toda a arte viria de
modelos 3D**; produção em 3D Studio e 3D Studio MAX, e como render era lento cada
artista recebeu duas máquinas
([Postmortem: Age of Empires](https://www.gamedeveloper.com/game-platforms/the-game-developer-archives-postmortem-ensemble-s-age-of-empires-),
[Postmortem: Age of Kings](https://www.gamedeveloper.com/design/postmortem-ensemble-studio-s-age-of-empires-ii-age-of-kings)).
O número oficial vem do estúdio da Definitive Edition: "criamos todas as unidades,
prédios e árvores como modelos 3D, mas os renderizamos como imagens 2D"; no jogo
original as unidades giravam em **8 direções**, e a DE subiu para **32**. Para o
zoom, na DE **cada asset foi renderizado três vezes**, de HD até 4K
([World's Edge](https://www.ageofempires.com/news/age-empires-definitive-edition-3d-2d-game/)).

O formato é o **SLP**, paleta indexada de 256 cores guardada fora do arquivo,
comprimido por comandos de linha: desenhar N índices, **pular** N pixels
transparentes, preencher N vezes a mesma cor — transparência não ocupa bytes.
Cada quadro guarda seu **centro (X, Y)**, a âncora de onde a figura assenta ([openage, slp-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).

### StarCraft (1998)

Unidades têm **256 direções internas**, agrupadas em **32 direções gráficas**
começando às 12 horas e girando no sentido horário
([StarEdit Network Wiki](http://staredit.net/wiki/index.php/Changing_Unit_Speeds)).
Só metade é desenhada: **aéreas guardam 17 quadros por pose (34 com os espelhados)
e as terrestres 9** ([StarEdit Network](https://staredit.net/topic/17793/)). 17 e
não 16 porque a direção do meio — o norte puro — é o eixo, não tem espelho.

O **GRP** é um arquivo de quadros ordenados e nada mais: "GRPs não são sprites,
são imagens ordenadas num arquivo; não contêm dado nenhum sobre como tocar a
animação" ([Starcraft Editing Bible, cap. 4](https://files.campaigncreations.org/misc/tutorials/starcraft/bible/chap4_intro.shtml)).
Quem amarra quadro a comportamento é o `iscript.bin`; qual GRP, qual paleta e
qual sombra cada imagem usa está no `images.dat`.

### Diablo II (2000)

Blizzard modelou e renderizou no **3ds Max**, em vista **ortográfica**, sem filtro
sobre o render, girando o modelo pelo menos 8 vezes para monstro
([The Phrozen Keep](http://d2mods.info/forum/viewtopic.php?t=14662)); a grade de
animação de monstro clássico é **8 direções × 32 quadros**
([tutorial DCC](https://d2mods.info/resources/infinitum/tut_files/dcc_tutorial/chapter4.html)).

Formatos **DC6** e **DCC**, paletizados e — de novo — **sem a paleta dentro do
arquivo**; no DC6 a compressão existe só para as faixas transparentes, e os pixels
sólidos vão crus ([OpenDiablo2/dc6](https://github.com/OpenDiablo2/dc6)).

### Command & Conquer

O mesmo **SHP**: quadros de índices de "256 cores de uma paleta externa"
([ModEnc](https://modenc.renegadeprojects.com/SHP)). A ruptura vem em Tiberian Sun
e Red Alert 2, que **abandonam o sprite para veículos**: infantaria, prédios,
ícones e animações continuam SHP, mas **veículo, aeronave e torreta viram voxel**,
rasterizados em tempo de execução no ângulo exato
([ModEnc](https://modenc.renegadeprojects.com/Voxel)) — com voxel, N é infinito e
não custa disco.

| Jogo | Direções | Desenhadas | Formato |
|---|---|---|---|
| Age of Empires / AoE II | 8 | parte, resto espelhado | SLP |
| AoE: Definitive Edition | 32 | 32, em 3 resoluções | SLP / SLD |
| StarCraft | 32 | 17 (ar) / 9 (solo) | GRP |
| Diablo II | 8 | 8 | DC6 / DCC |
| C&C Tiberian Sun (veículo) | contínuo | nenhuma — voxel | VXL |

---

## 2. Por que 8, 16 ou 32 — e quando espelhar quebra

O número de direções é o erro angular que o jogador tolera entre para onde a
unidade **anda** e para onde ela **aponta**: 8 direções erram até 22,5°; 16,
11,25°; 32, 5,6°. Unidade pequena e lenta esconde 22,5°; veículo longo com canhão
não — daí a C&C tirar o veículo do sprite e pôr no voxel, e a AoE:DE saltar de 8
para 32 quando deixou de pagar disco por isso.

O custo multiplica tudo: direções × quadros × poses × unidades. Em Diablo II uma
animação de monstro é 8 × 32 = 256 imagens — para **uma** pose.

**Espelhar corta o custo quase pela metade** porque metade do círculo é o reflexo
da outra: o StarCraft guarda 17 de 32 e o AoE espelha parte das 8
([StarEdit Network](https://staredit.net/topic/17793/)). Duas regras caem daí:

- **O eixo não espelha.** Norte e sul puros são o próprio reflexo; espelhá-los não
  produz direção nova. Daí 17 e não 16.
- **Espelhar inverte tudo que é lateral.** Em Age of Empires II a consequência é
  visível e conhecida: a arma **troca de mão** quando a unidade cruza o eixo.
  Cicatriz, coldre, mochila, insígnia e logo fazem o mesmo. Luz pintada no sprite
  também inverte — se a iluminação do render vem da esquerda, o espelho põe a
  sombra do lado errado do mapa inteiro.

Espelhar funciona com figura **simétrica no eixo vertical**, luz frontal ou
zenital e nenhum identificador de um lado só. A saída barata dos clássicos é
**projetar a assimetria para dentro da simetria** — arma centrada no peito,
insígnia nos dois ombros, mochila no meio das costas — em vez de desenhar as
direções que faltam.

---

## 3. Tamanho do sprite em função do tile

Não existe número universal; existe a razão entre a altura da figura e o
**losango de uma célula**. Referências medidas:

- StarCraft: tile de terreno de **32×32 px**
  ([StarEdit Network Wiki](https://staredit-network.fandom.com/wiki/Terrain)).
- Diablo II: tile de chão de **160×80 px**, subdividido em subtiles
  ([The Phrozen Keep](https://d2mods.info/forum/viewtopic.php?t=46249)); a figura
  de exemplo do tutorial oficial de conversão tem **65×65 px**
  ([tutorial DCC](https://d2mods.info/resources/infinitum/tut_files/dcc_tutorial/chapter4.html)) —
  **menos de meia célula de largura**.
- Dead Cells: o personagem foi modelado mirando **~50 px de altura** na tela, e
  essa meta governou o detalhe do modelo 3D
  ([Game Developer](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-)).

As regras práticas que saem daí:

1. **Altura em tela primeiro, modelo depois.** Nos três casos acima o alvo em
   pixels veio antes da malha.
2. **Mede-se em células, não em metros.** Escala realista quebra a leitura: gente
   de tamanho real ao lado de um prédio 4×4 some.
3. **Guarde maior que o tamanho de tela** — a AoE:DE guarda três resoluções por
   asset porque o zoom existe.
4. **Corte rente e guarde a âncora.** O SLP guarda o centro X/Y de cada quadro
   ([openage](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)):
   quem alinha é a âncora, não a moldura.

---

## 4. Formatos, compressão e empacotamento

**Paleta indexada** foi o padrão dos quatro — SLP, GRP, DC6/DCC e SHP guardam
índices de 256 cores com a paleta fora do arquivo
([openage](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md),
[ModEnc](https://modenc.renegadeprojects.com/SHP),
[OpenDiablo2](https://github.com/OpenDiablo2/dc6)). Não era só economia: paleta
externa permite **trocar a cor sem tocar no sprite**. O SLP tem comando de cor de
jogador (o índice real é `índice_base + jogador × 16`) e um de **contorno**
(`0x4E`), a silhueta que aparece quando a unidade passa atrás de um prédio.

**Chroma key** é técnica de captura, não de armazenamento: recorta o que veio de
gerador ou câmera sem canal alfa. Os formatos acima guardam a transparência como
**comando de pular N pixels**, não como cor.

**Alfa pré-multiplicado** importa quando há filtragem. Sem pré-multiplicar, a
interpolação bilinear mistura na borda o RGB dos pixels transparentes (em geral
preto, ou o verde do chroma) e sobra franja; pré-multiplicando, cada pixel entra
na média **pesado pelo próprio alfa** e o totalmente transparente não contribui ([Shawn Hargreaves](https://shawnhargreaves.com/blog/premultiplied-alpha.html)).

**Atlas e padding.** Num sprite sheet a filtragem lê pixel do vizinho quando a
amostra cai na borda. A correção tem duas partes: **espaço vazio** entre as peças
e **dilatação** — repetir os pixels de borda para dentro desse espaço, para que a
amostra que escapa leia a cor da própria peça. Mipmap piora, porque cada nível
mistura vizinhança maior: em arte de tamanho fixo, desligue o mipmap ou dê
padding que sobreviva ao menor nível usado
([WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-qna-how-to-prevent-texture-bleeding-with-a-texture-atlas.html)).

---

## 5. Sombra

Nenhum dos clássicos calculava sombra em tempo real. Os três caminhos:

- **Comando dedicado no formato.** O SLP tem comando de sombra (`0x0B`), que
  escurece o que já está embaixo com uma paleta de sombra — "uma variação
  escurecida da paleta do gráfico"; desde a versão 4.0 do formato **a sombra é
  quadro separado dentro do mesmo arquivo**
  ([openage](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
- **Imagem separada, marcada como sombra.** No StarCraft, `images.dat` tem uma
  função de desenho cujo valor 10 faz o gráfico ser sombra (cinza translúcido), e
  cada imagem declara qual GRP e qual sombra usa
  ([images.dat](https://github.com/toshok/scsharp/blob/master/docs/images.dat)).
- **Sprite deformado.** O caminho comum em 2D isométrico: pegar o sprite,
  inclinar, escurecer e compor no chão. Em Diablo II a sombra é montada em tempo
  real pelo mesmo caminho do personagem, e por isso acompanha a troca de
  equipamento ([GameDev.net](https://gamedev.net/forums/topic/316925-shadows-in-2d-games/)).

Consequência comum aos três: **a sombra não é renderizada junto com a figura**.
Sombra projetada colada na imagem congela a direção da luz, impede tratá-la à
parte e, em arte recortada por chroma, a mancha entra na máscara e suja o corte.

---

## 6. O que mudou nos modernos

**Dead Cells** é o caso documentado. Thomas Vasseur desenha primeiro uma folha de
modelo **em pixel art 2D**, usa-a como base para construir personagem e esqueleto
**em 3ds Max**, exporta em FBX, e um **programa caseiro** renderiza a malha "num
tamanho muito pequeno e sem antialiasing, o que dá aquele aspecto pixelado". Cada
quadro sai como PNG **acompanhado do seu normal map**, o que permite render de
volume com um toon shader e luz dinâmica no jogo 2D. A animação é montada por
**key frames**, como animação 2D, com interpolação acrescentada depois; saída a
30 fps; alvo de ~50 px de altura
([Game Developer](https://www.gamedeveloper.com/production/art-design-deep-dive-using-a-3d-pipeline-for-2d-animation-in-i-dead-cells-i-),
[Game Anim](https://www.gameanim.com/2018/01/31/dead-cells-3d-pipeline-2d-animation/)).
Três diferenças reais em relação a 1999: o **normal map** por quadro, a
**iteração** (mudar a animação para caber no gameplay sem redesenhar) e uma
pessoa só dando conta do volume no primeiro ano.

**Hades** usa 3D por outro motivo. Personagens são esculpidos em **ZBrush** a
partir do retrato 2D feito à mão — com a transparência do ZBrush sobre o desenho
para casar as feições —, refinados e retopologizados em **Maya**, texturizados em
**Substance** com oclusão e curvatura assadas, e então o **traço preto é pintado
à mão** por cima para bater com o desenho 2D ([Game Developer](https://www.gamedeveloper.com/art/learn-how-supergiant-brought-i-hades-i-hand-painted-characters-to-life)).
O 3D aqui é andaime de consistência; o acabamento continua sendo mão.

**Wargroove** é o contraponto: pixel art **desenhada à mão**, cerca de 15 mil
quadros, cada facção inteiramente reanimada, com o custo declarado pelo estúdio
("pixel art exige tantos quadros desenhados à mão que fica muito lento e muito
caro"). A modernidade está no encanamento: o pipeline consome o **.ase nativo do
Aseprite**, com tempo de quadro e tags vindo do arquivo do artista, em vez de
sprite sheets exportadas à mão
([Game Developer](https://www.gamedeveloper.com/design/an-inside-look-at-i-wargroove-s-i-wicked-design-choices)).

Linha comum aos três: **o formato proprietário morreu**. PNG + atlas + metadado
substituíram SLP, GRP e DC6 — o que antes era comando de bit hoje é canal alfa.

---

## APLICAÇÃO NESTE PROJETO

1. **Direções.** `src/anima.js:260-290` já faz 5 desenhadas + 3 espelhadas, e o
   `arte/LEIA.md` já cita AoE e StarCraft. A fonte confirma o motivo do ímpar:
   o eixo não tem espelho (17 de 32, não 16).
2. **Torreta.** O item aberto em `LEIA.md` ("torreta separada da base, 8 ou 16
   direções") é exatamente o problema que a C&C resolveu com voxel e a AoE:DE com
   32 ângulos. 16 direções (erro de 11°) é o piso para cano longo.
3. **Assimetria.** Sem tabela de exceção hoje: se alguma unidade ganhar arma de um
   ombro só ou insígnia lateral, `direcao()` passa a inverter a marca. Regra
   barata: manter a identificação centrada.
4. **Sombra.** `render2.js:596` desenha elipse de contato calculada — que é a
   escolha certa, e o `arte/LEIA.md` já proíbe sombra projetada no render pelo
   motivo do recorte. Só falta sombra para estrutura, hoje inexistente.
5. **Tamanho.** `Anima.ALTURA` em células sobre `ALT = 32` é a regra 2 da seção 3;
   e `assets/` guardar o dobro do tamanho de tela é a regra 3 (a AoE:DE guarda 3×).
6. **Formato.** WebP com alfa + data URI (`src/sprites.js`, `build.cjs`) ocupa o
   lugar do SLP. Não há atlas — cada peça é um arquivo —, então padding e
   sangramento ainda não são problema; passam a ser se as tiras virarem folha
   única. As tiras de `TIRAS` são fatiadas por divisão exata da largura: sem
   margem, um arredondamento já puxa pixel do quadro vizinho.
