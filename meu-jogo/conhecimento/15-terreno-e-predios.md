# 15 — Terreno e prédios: como o chão e a construção eram desenhados

Os capítulos 01 a 03 cobrem o sprite de **unidade** — direções, quadros, acabamento.
Este cobre as duas outras metades da tela, que ocupam mais pixels e ninguém
lembra de pesquisar: o **chão** e a **construção**.

## De onde vêm os números

A Ensemble e a Blizzard nunca publicaram a especificação dos formatos. O que
existe — e é o que este capítulo usa — é engenharia reversa feita pela
comunidade, em projetos que **rodam** os jogos originais a partir dos arquivos
de dados deles:

- **[openage](https://github.com/SFTtech/openage)** — reimplementação livre do
  Age of Empires II; a pasta [`doc/media/`](https://github.com/SFTtech/openage/tree/master/doc/media)
  documenta os formatos, e o conversor lê o `.dat` do jogo campo a campo.
- **[OpenBW](https://github.com/OpenBW/openbw)** — reimplementação do StarCraft:
  Brood War fiel ao original; [`bwgame.h`](https://github.com/OpenBW/openbw/blob/master/bwgame.h)
  é a lógica de jogo traduzida do binário.
- **[Staredit Network Wiki](https://wiki.staredit.net/)** — a referência de
  modding do StarCraft desde os anos 2000, que documenta o formato de tileset.

Se um número aqui está errado, está errado neles também — mas eles rodam, o que
é uma forma dura de verificação. Onde a afirmação é **medição nossa**, está
dito, com arquivo e linha.

---

## 1. Sistema de ladrilho

### Age of Empires II: 97 × 49 pixels, 100 desenhos por terreno

O `terrain.drs` do Age of Kings guarda **27 arquivos SLP de terreno, um por tipo**
— terra seca, grama, grama escura, água rasa, água profunda, oceano, areia,
deserto, pântano, gelo, neve, fundação antiga, campo de fazenda etc.
([openage/doc/media/terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md)).

O ladrilho é um losango (a documentação diz "paralelogramo de lados iguais, o
mesmo que um losango"). O documento rotula "Tile image height = 97px, Tile image
width = 49px", mas o desenho ASCII logo abaixo mostra os 97 pixels na
**horizontal**, na 25ª linha — os rótulos estão trocados na fonte. A aritmética
fecha do outro lado: a máscara de mistura tem `tile_size` de **2353 pixels** e é
"desenhada com 49 linhas"
([blendomatic.md](https://github.com/SFTtech/openage/blob/master/doc/media/blendomatic.md)),
e 2353 é exatamente a área de um losango de 97 de largura por 49 de altura
(25 linhas de 1 a 97 de quatro em quatro, mais 24 de 93 a 1). Então: **97 × 49**,
proporção 2:1.

O número que importa para quem desenha: **cada terreno traz 100 ladrilhos**
(fazenda madura traz 36, fazenda vazia traz 9). Não são cem variações sorteadas —
são cem posições fixas numa grade 10 × 10, escolhidas pela coordenada da célula:

```python
tc = sqrt(terraintilecount)   # 10 nos terrenos normais
frame_id = (x % tc) + ((y % tc) * tc)
```

([terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md))

Isso é uma decisão de projeto que vale copiar e que quase todo mundo erra:
**a variação é determinística, não sorteada**. A mesma célula devolve sempre o
mesmo desenho — o chão não cintila quando a tela é repintada — e o artista pinta
uma folha de 970 × 490 pixels de grama contínua, corta em cem losangos, e a
repetição só reaparece a cada dez células nos dois eixos.

### StarCraft: 32 × 32 pixels, quatro por quatro miniladrilhos

O StarCraft não usa losango: "a unidade mais básica de terreno é o ladrilho.
Ladrilhos são imagens retangulares de 32 × 32 pixels com propriedades anexadas
de passabilidade, transparência de visão, elevação (baixa, média ou alta) e
aptidão para construção"
([SEN Wiki — Terrain](https://wiki.staredit.net/w/index.php?title=Terrain)).
A ilusão isométrica vem de como os ladrilhos retangulares se encaixam, não da
forma deles: "o terreno isométrico é 'secretamente' feito de ladrilhos
retangulares, projetados para se encaixar".

Por dentro, cada *megatile* de 32 × 32 é uma grade **4 × 4 de miniladrilhos de
8 × 8**, e é no miniladrilho que ficam as regras, não na arte
([SEN Wiki — Terrain Format](https://wiki.staredit.net/w/index.php?title=Terrain_Format)):

| arquivo | guarda | tamanho |
|---|---|---|
| `CV5` | grupos de ladrilho: tipo de terreno, bandeiras, bordas aceitas e **`u16[16] Tiles`** | 52 bytes por grupo |
| `VF4` | 16 bandeiras de miniladrilho por megatile: *Walkable*, *Mid*, *High*, *Blocks View*, *Ramp* | 32 bytes |
| `VX4` | 16 referências gráficas de miniladrilho, com bit de **espelhamento horizontal** | 32 bytes |
| `VR4` | o pixel de verdade: `u8[8][8]` de índices de paleta | 64 bytes |

Duas coisas a tirar daí. Primeira: o grupo `CV5` aponta para **16 megatiles** —
são as variações daquele pedaço de terreno. Segunda: o `VX4` guarda um bit de
espelhamento por miniladrilho, ou seja, **metade das variações é a mesma arte
virada**. Custo de arte zero, repetição pela metade.

### Como os dois evitavam a repetição visível

O StarCraft resolveu por sorteio dentro de um conjunto autorizado: "a maioria
dos ladrilhos tem vários **pares**, que parecem quase iguais. Embora sejam
diferentes, os dois cabem no mesmo lugar sem destoar. Então o StarCraft escolhe
aleatoriamente um dos pares cada vez que precisa de uma peça para um encaixe"
([SEN Wiki — Isometrical Terrain](https://wiki.staredit.net/w/index.php?title=Isometrical_Terrain)).
O editor expõe isso na ferramenta *Subtile*: cada linha da lista de tileset é o
conjunto de alternativas equivalentes daquela peça
([SEN Wiki — Terrain Blending](https://wiki.staredit.net/w/index.php?title=Terrain_Blending)).

O Age of Empires II resolveu por posição (a fórmula `x % 10`, `y % 10` acima) e,
nas **bordas**, por uma segunda camada de variação que é o detalhe mais fino do
sistema todo — está na próxima seção.

---

## 2. Transição entre terrenos: o `blendomatic`

Este é o sistema documentado que a pergunta pedia. O nome é literal: o arquivo
se chama `blendomatic.dat` e o documento da openage se chama
["Blendomatic — ou: como juntar bordas de ladrilho de terreno"](https://github.com/SFTtech/openage/blob/master/doc/media/blendomatic.md).

### A ideia

Não existe ladrilho de canto desenhado à mão para cada par de terrenos. Existe
**máscara alfa**. Cada tipo de terreno tem uma **prioridade**; o vizinho de
prioridade mais alta é recortado por uma máscara e desenhado **por cima** do
ladrilho de prioridade menor. O documento descreve o efeito como inundação:
"terrenos de prioridade mais alta *transbordam* sobre o vizinho. Se você imaginar
`@` como água e `#` como praia, é literalmente uma inundação".

As prioridades do `terrain.drs` vêm tabeladas: terra suja 70, grama normal 100,
areia 110, praia/fundação 122, neve 130, água clara 139, água profunda 140,
oceano 141, fazenda pronta 150
([terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md)).
Água tem prioridade **alta**: é ela que avança sobre a terra, não o contrário.

### Os números

```c
unsigned int nr_blending_modes;   // normalmente 9
unsigned int nr_tiles;            // normalmente 31
unsigned int tile_size;           // normalmente 2353
```

**9 modos × 31 máscaras = 279 máscaras alfa**, cada uma com 2353 valores de alfa
de 7 bits (`128` = pinta o vizinho opaco, `0` = mantém o pixel de baixo), mais
um bitmask de 1 bit por pixel dizendo quais pixels entram na conta
([blendomatic.md](https://github.com/SFTtech/openage/blob/master/doc/media/blendomatic.md)).

Os 9 modos são só **5 formas distintas** — o documento demonstra a redundância:

- modo 0, 1, 7, 8: transição áspera, comprimento inteiro (terra, grama)
- modo 2: transição suave, comprimento inteiro
- modo 3: transição suave, curta
- modo 4 e 6: bordas duras e ásperas, tipo spray
- modo 5: bordas afiadas

Qual modo é usado **não depende da prioridade**, e sim de **quais classes se
encontram**: "gelo precisa de bordas diferentes das da praia". Existe uma tabela
8 × 8 (`blend_mask_lookup`) em que a linha é a classe do ladrilho atual e a
coluna é a do vizinho.

### As 31 máscaras, e por que 31

```
id: 0..3        4..7         8..11        12..15
  inferior-dir  superior-dir inferior-esq superior-esq
id: 16          17           18           19
  direita       baixo        cima         esquerda
id: 20..25   combinações de dois cantos
id: 26..29   "mantém um canto"
id: 30       tudo
```

E aqui está o detalhe fino: **os ids 0 a 15 descrevem só 4 direções, mas são 16
máscaras** — quatro desenhos diferentes para cada direção. A explicação está
escrita no documento, palavra por palavra: *"estas foram criadas para evitar o
padrão obviamente repetitivo"*. A escolha entre as quatro sai dos **dois bits
baixos da coordenada x ou y** do ladrilho de destino. Ou seja: a borda entre
grama e areia não é uma linha, é quatro recortes diferentes alternando por
posição — determinística de novo, nunca sorteada.

Os ids 16 a 19 são as **diagonais** (os vizinhos de canto), e são aplicados
*além* da máscara ortogonal, não no lugar dela. O algoritmo olha **8 vizinhos**:

```
    0
  7   1     => 8 vizinhos influenciam a escolha da máscara
6   @   2
  5   3
    4
```

Com uma regra de desempate que vale anotar: a influência **diagonal é ignorada
se qualquer um dos dois vizinhos ortogonais adjacentes a ela já influencia** —
senão a mesma borda seria pintada duas vezes e a junta ficaria suja.

### Quantas peças por par de terrenos, então

Zero peças desenhadas. O par não custa arte nenhuma: o sistema é **a arte de um
terreno + uma máscara genérica**. As 279 máscaras servem para os 27 terrenos —
qualquer terreno com qualquer outro. É a diferença entre desenhar N² transições
e desenhar N terrenos.

### O StarCraft fez o contrário

No StarCraft as transições são **peças desenhadas**, e o preço aparece no
tamanho do tileset. O terreno isométrico é montado em *pares* de ladrilhos, e os
pares se agrupam em conjuntos maiores; a documentação da comunidade descreve a
montagem de um penhasco como blocos de 2 × 3 ladrilhos, e observa que "cantos,
penhascos compostos, curvas côncavas e faixas finas são onde o sistema de pares
fica um tanto bagunçado"
([Terrain Blending](https://wiki.staredit.net/w/index.php?title=Terrain_Blending)).
O próprio `CV5` tem campos para isso: `Edge Types` (que tipos podem ficar
adjacentes, esquerda/cima/direita/baixo) e `Terrain Piece Type` (blocos
multi-ladrilho, "por exemplo peças de penhasco 2 × 3")
([Terrain Format](https://wiki.staredit.net/w/index.php?title=Terrain_Format)).
A mesma fonte do tutorial admite o custo: *"a Blizzard não foi muito eficiente
no uso de ladrilhos, e por isso você encontra um monte de ladrilhos repetidos
redundantes por aí"*.

---

## 3. Elevação

### Age of Empires II: 17 níveis e um morro que é textura esticada

O `tileedge.dat` tem a estrutura que entrega o número:

```cpp
struct tile_edge {
    uint32_t elevation_offsets[17];
    struct { ... } elevations[17];   // 94 ladrilhos cada, 97x73 pixels de 1 bit
}
```

**17 níveis de elevação**, e para cada nível **94 formas de ladrilho** de
97 × 73 pixels usadas para desenhar as bordas de névoa e de região inexplorada
([terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md)).
Note a altura: **73** em vez de 49 — o ladrilho inclinado é mais alto que o
plano, e isso é o que obriga o resto.

Como o morro é desenhado, textualmente: *"ladrilhos inclinados são gerados
dinamicamente mapeando a textura dos ladrilhos planos sobre o formato inclinado"*,
com **filtragem bilinear ponderada** dos pixels de origem, e *"levantando os
vértices por metade da altura do losango"*. Ou seja — **o artista não desenha
morro**. Desenha o chão plano; a inclinação é uma deformação feita em tempo de
conversão.

A iluminação vem junto e é pré-calculada: o `view_icm.dat` guarda **10 mapas de
cor inversos** de 32 × 32 × 32 bytes (32 KB cada). Um é o neutro; os outros nove
são **4 passos de escurecimento e 4 de clareamento**, mais um neutro, calculados
em HSV (mexendo S e V separadamente) e convertidos de volta para índice de
paleta. Por isso a face do morro voltada para a luz clareia sem custo de
processamento em tempo de jogo — é tabela.

O que a elevação **obriga nas bordas**: as 94 formas por nível existem porque a
silhueta do ladrilho muda com a inclinação, e tudo que encosta nele — névoa,
região inexplorada, a própria mistura de terrenos — precisa da forma certa.
Elevação não é um campo a mais na célula; é uma multiplicação de 17 × 94 no
inventário de formas de borda.

### StarCraft: três níveis e uma regra de jogo

O StarCraft tem exatamente **três alturas**, e elas são bandeiras de
miniladrilho, não números:

```
0x0001 - Walkable
0x0002 - Mid
0x0004 - High     (Mid e High desmarcados = Low)
0x0008 - Blocks View
0x0010 - Ramp     (aparece no meio da maioria das rampas/escadas)
```

([Terrain Format](https://wiki.staredit.net/w/index.php?title=Terrain_Format))

Cada tileset repete os mesmos terrenos em versões de altura diferente. No
Badlands: Dirt, Mud, Water, Grass, Asphalt, Rocky Ground no nível baixo; **High
Dirt, High Grass, Structure** no médio. No Space Platform há terrenos nos três
níveis, inclusive um *Elevated Catwalk* no nível alto
([Terrain Type Elevations](https://wiki.staredit.net/w/index.php?title=Terrain_Type_Elevations)).

As regras próprias que a altura impõe:

1. **Não se empilha penhasco.** "Você não pode pôr terreno de penhasco em cima
   de mais penhascos e empilhar. Em vez disso, ele simplesmente substitui por
   mais penhasco"
   ([Isometrical Terrain](https://wiki.staredit.net/w/index.php?title=Isometrical_Terrain)).
   Fazer uma pilha de dois penhascos exige colar ladrilhos à mão em editor de
   terceiros, remontando o topo de um penhasco de terra-para-água em cima do
   topo de um penhasco de terra-para-terra-alta
   ([Terrain](https://wiki.staredit.net/w/index.php?title=Terrain)).
2. **Altura é visão.** Quem está embaixo não vê o terreno alto. Um tutorial da
   comunidade mede isso caso a caso: "o fantasma na terra não consegue ver o
   terreno alto. Isto é visão estável" — e mostra misturas em que a visão fica
   instável justamente por cruzarem a linha de altura
   ([Tiles Properties](https://wiki.staredit.net/w/index.php?title=Tiles_Properties)).
3. **O que se vê não é o que se anda.** O mesmo tutorial insiste no ponto:
   "*What you see is not what you get*" — as áreas cinzas de impassabilidade não
   coincidem com o desenho, e há misturas em que "nem uma unidade de 1 pixel
   passaria", além de misturas que confundem o buscador de rota a ponto de a
   unidade voltar quando o jogador clica no lugar errado. A recomendação é
   evitar essas misturas em mapas de partida.

---

## 4. Prédio: obra, dano, destroço e sombra

### Estágios de construção

**Age of Empires II: quatro faixas de progresso.** O conversor da openage, que
lê o `.dat` do jogo, monta a habilidade `Constructable` de um prédio com
progressos de intervalos fixos — e os intervalos estão escritos no código, nesta
ordem:

| progresso | intervalo |
|---|---|
| `ConstructionProgress0` | (0,0) — a fundação |
| `ConstructionProgress25` | (0, 25) |
| `ConstructionProgress50` | (25, 50) |
| `ConstructionProgress75` | (50, 75) |
| `ConstructionProgress100` | (75, 100) |

Fazendas (classe 49) são a exceção, com **três** faixas: (0, 33), (33, 66),
(66, 100)
([ability_subprocessor.py, `constructable_ability`](https://github.com/SFTtech/openage/blob/master/openage/convert/processor/conversion/aoc/ability_subprocessor.py)).

A arte que preenche essas faixas é **uma só**: o campo do prédio no `.dat` é
`construction_graphic_id`, singular
([unit.py, classe `Building`](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py)).
É uma animação cujo quadro é escolhido pelo progresso, não quatro desenhos
separados. Junto dela vem o `foundation_terrain_id`, comentado no conversor como
"muda o terreno de baixo para este id quando a construção termina" — o prédio
pronto **altera o chão** em que está.

**StarCraft: uma imagem de construção, trocada ou sobreposta.** No OpenBW,
`set_construction_graphic` substitui as imagens do sprite pela
`unit_type->construction_animation` enquanto a obra corre e devolve a original
no fim; em outro caminho ela entra como imagem **acima** do prédio
(`create_image(u->unit_type->construction_animation, u->sprite, {}, image_order_above)`)
([bwgame.h](https://github.com/OpenBW/openbw/blob/master/bwgame.h)). E o
progresso não é um campo separado: é a **vida**. O prédio em obra ganha
`hp_construction_rate` de vida por tique, e o custo em minério/gás é debitado em
proporção a isso (`target_mineral_cost * hp_construction_rate / (target_max_hp * 3)`).
Prédio meio construído tem, literalmente, meia vida.

### Estágios de dano

**Age of Empires II: uma lista, com limiar e modo de aplicação.** No `.dat` cada
unidade tem `damage_graphic_count` seguido de um vetor de `DamageGraphic`:

```
graphic_id      int16
damage_percent  int8      <- o limiar
apply_mode      int8
```

E os modos, no dicionário de consulta do conversor, são três:

```python
DAMAGE_DRAW_TYPE = {
    0: "TOP",      # adiciona gráficos por cima (ex.: chamas)
    1: "RANDOM",   # adiciona gráficos por cima, aleatoriamente
    2: "REPLACE",  # substitui o gráfico original (ex.: muralhas danificadas)
}
```

([unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py),
[lookup_dicts.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/lookup_dicts.py))

Quer dizer: **o número de estágios não é fixo no motor — é uma lista por
prédio**, e cada entrada diz a partir de que porcentagem entra. O conversor
percorre a lista em ordem crescente montando intervalos `[anterior, damage_percent]`
e prende em cada um uma `AnimationOverlay`, que é fogo/fumaça desenhado **por
cima** do prédio intacto. As muralhas são a exceção que usa `REPLACE`: existem
sprites próprios de muralha danificada, e são **três degraus** — a lista de SLPs
do Age of Conquerors traz, para cada conjunto arquitetônico, "Damaged Stone
Wall", "heavily Damaged Stone Wall" e "severely Damaged Stone Wall", e o mesmo
trio para a muralha fortificada
([aoc-slp-list.md](https://github.com/SFTtech/openage/blob/master/doc/media/aoc-slp-list.md)).
Intacto mais três = **quatro estados** de muralha.

**StarCraft: o fogo começa exatamente abaixo de 2/3 da vida.** A conta está em
`update_unit_damage_overlay`:

```cpp
int states = damage_overlay_states(u);
fp8 max_hp = u->unit_type->hitpoints;
fp8 two_thirds_max_hp = max_hp - max_hp / 3;
fp8 hp_per_state = two_thirds_max_hp / (states + 1);
```

([bwgame.h](https://github.com/OpenBW/openbw/blob/master/bwgame.h))

O terço superior da vida **não mostra nada**. Os dois terços de baixo são
divididos em `states + 1` degraus, e `states` sai de `damage_overlay_states`, que
conta quantos **pontos de encaixe** válidos (deslocamentos diferentes de
`(127,127)`) o sprite declara e devolve **o dobro**. Prédio grande, com mais
pontos de encaixe, ganha mais degraus de fogo que prédio pequeno — sem nenhuma
tabela por prédio.

E o degrau faz uma coisa específica: a cada passo para baixo, uma chama
**pequena** existente vira **grande** no mesmo ponto; se não há nenhuma pequena
para promover, nasce uma nova pequena num ponto de encaixe ainda vazio, escolhido
com `lcg_rand`. Reparar faz o caminho inverso: grande vira pequena, pequena
desaparece. As imagens de chama vão de `IMAGEID_Flames1_Type1_Small` a
`IMAGEID_Flames8_Type3_Small` e o bloco gêmeo `_Large`
([bwenums.h](https://github.com/OpenBW/openbw/blob/master/bwenums.h)) — oito
posições, até três variantes, em dois tamanhos.

O detalhe que fecha: o deslocamento do fogo vem de
`get_image_lo_offset(u->sprite->main_image, 1, index)` — é indexado pelo **quadro
atual** do prédio. O fogo acompanha a animação do prédio em vez de ficar colado
numa coordenada fixa.

### Destroço

**StarCraft: dois sprites por raça, e só.**
`SPRITEID_Terran_Building_Rubble_Small` / `_Large`, e os pares equivalentes para
Zerg e Protoss — **seis sprites de entulho no jogo inteiro**
([bwenums.h](https://github.com/OpenBW/openbw/blob/master/bwenums.h)). Pequeno ou
grande, conforme o tamanho do prédio.

**Age of Empires II: entulho por tamanho de fundação.** A lista de SLPs traz
`Rubble 2 x 2`, `Rubble 2 x 2 more burnt`, `Rubble 3 x 3`, `Rubble 4 x 4`,
`Rubble 5 x 5` e `Wonder size rubble` — cinco tamanhos, com uma variante mais
queimada do menor
([aoc-slp-list.md](https://github.com/SFTtech/openage/blob/master/doc/media/aoc-slp-list.md)).
A Definitive Edition separou explicitamente as duas coisas em campos distintos
do `.dat`: `destruction_graphic_id` (a animação de desabamento) e
`destruction_rubble_graphic_id` (o que fica no chão depois)
([unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py)).

Em ambos os casos, o ponto que interessa: o prédio destruído **não continua com
a silhueta do prédio**. Ele é trocado por uma peça baixa.

### Sombra

A sombra era **desenho separado**, não efeito. No SLP a camada existe à parte, e
a lista do AoC mostra sombras catalogadas como peças próprias: "Arabic town
center support shadows Castle Age", "Feudal Age", "Imperial age" — uma por era —,
"Arabic fortified wall shadows", "Multiple shadows from deciduous forest",
"Multiple shadows from pine forest", e até "animation for mill sails shadows",
que é a sombra **animada** das pás do moinho
([aoc-slp-list.md](https://github.com/SFTtech/openage/blob/master/doc/media/aoc-slp-list.md)).

Na Definitive Edition a sombra virou uma **camada do próprio quadro**: o formato
SLD organiza cada quadro em camadas e uma delas é a *SLD Shadow Graphics Layer*
([sld-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/sld-files.md)).

---

## 5. Animação de prédio: o que se mexia num prédio parado

Um prédio não anda, mas nunca ficava congelado. O catálogo de SLPs do Age of
Conquerors mostra o que se mexia, peça por peça
([aoc-slp-list.md](https://github.com/SFTtech/openage/blob/master/doc/media/aoc-slp-list.md)):

- **Fumaça de chaminé** — `Arabic Smoke from Blacksmith`, `Asian Smoke from
  Blacksmith`: a ferraria solta fumaça, e cada conjunto arquitetônico tem a sua.
  Fumaça é a animação mais barata que existe (sobe, dissipa, repete) e é a que
  diz "este prédio está funcionando".
- **Pás girando** — `animation for mill sails`, com `animation for mill sails
  shadows` a reboque. Movimento mecânico ligado à função do prédio.
- **Bandeira** — a lista tem dezenas de entradas `Flag` e `Flag Banner`,
  inclusive uma "Flag Banner – beta? Hanging in doorway?" (pendurada no vão da
  porta). A bandeira é o que carrega a **cor do jogador** e ondula.
- **Tocha** — `Gaia Torch`: luz que pisca, item de cenário aceso.
- **Fogo de dano** — as chamas do estágio de dano, já vistas.

O motor guarda dois quadros de repouso por unidade, `idle_graphic0` e
`idle_graphic1`
([unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py)),
e há um campo `adjacent_mode` comentado como "1 = unidades adjacentes podem
mudar os gráficos" — é o que faz muralha e portão se costurarem ao vizinho.

A Definitive Edition acrescentou dois campos que valem como aula de projeto:
`research_graphic_id` e `research_complete_graphic_id`
([unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py)).
O prédio **mostra que está pesquisando**, e mostra quando terminou — informação
de jogo virando animação, não enfeite.

No StarCraft o equivalente está nos scripts de animação e nas imagens de apoio:
há quatro `IMAGEID_Building_Landing_Dust_Type1..4` (a poeira do prédio terrano
pousando) e o gêiser de vespene troca entre `Vespene_Geyser_Smoke1` e
`Vespene_Geyser_Smoke1_Overlay` conforme ainda haja recurso
([bwgame.h](https://github.com/OpenBW/openbw/blob/master/bwgame.h),
[bwenums.h](https://github.com/OpenBW/openbw/blob/master/bwenums.h)) — a fumaça
do gêiser é **estado de jogo**, não decoração.

A regra comum, que é a lição: **o que se mexia num prédio parado dizia alguma
coisa** — está funcionando, é meu, está pesquisando, acabou o recurso, está
pegando fogo.

---

## 6. Decoração de cenário (*eye candy*)

### StarCraft: decoração é terreno, e por isso obedece ao terreno

No StarCraft o *doodad* não é um objeto solto: "tecnicamente, doodads são
pedaços especiais de ladrilhos de terreno, ocasionalmente pareados com sprites"
([Doodad](https://wiki.staredit.net/w/index.php?title=Doodad)). Eles ocupam o
tipo de terreno **1** no `CV5` (0 = inutilizável, 1 = doodads, 2+ = terreno
básico e bordas) e trazem campos próprios: `Doodad ID`, `Width`, `Height` em
ladrilhos, `Overlay ID` apontando para `Sprites.dat` ou `Units.dat`, e uma
bandeira `0x0010 - Has doodad cover`
([Terrain Format](https://wiki.staredit.net/w/index.php?title=Terrain_Format)).

A regra de colocação é dura e está num arquivo só para isso, o `DDDATA.BIN`:
512 bytes por doodad listando os grupos `CV5` em que ele pode pousar. A wiki
resume: "doodads tendem a ser bem limitados; só podem ser colocados em formações
de terreno exatas. (Por exemplo, um doodad de rampa só pode ser colocado numa
seção de penhasco com uma largura mínima específica.)".

E a regra de leitura — a que a pergunta pede — está no tutorial de propriedades
de ladrilho, num exemplo concreto: o autor mostra um arbusto que parece bloquear
a passagem e mede que não bloqueia, *"simplesmente porque o que você vê é um
Sprite, e não um Doodad"*
([Tiles Properties](https://wiki.staredit.net/w/index.php?title=Tiles_Properties)).
Ou seja, existem duas categorias e elas são diferentes de propósito: **doodad é
terreno e pode bloquear; sprite é enfeite e nunca bloqueia**. Decoração que
mente sobre passabilidade é um defeito reconhecido, não um efeito colateral.

### Age of Empires II: densidade escrita no script do mapa

A densidade do Age of Empires II não é gosto do artista — é número no script de
mapa aleatório. O Arabia original (cabeçalho `/* 21 DEC 99 */`) distribui assim
([Arabia.rms](https://github.com/fntsrlike/AoE2-RMS-collections/blob/master/AoC/Arabia.rms)):

```
create_terrain DIRT3          /* mancha secundária */
{ number_of_clumps 24   land_percent 2   spacing_to_other_terrain_types 1 }

create_terrain DESERT         /* mancha terciária */
{ number_of_clumps 30   land_percent 2   spacing_to_other_terrain_types 1 }

create_object PALMTREE
{ number_of_objects 30   set_scaling_to_map_size   min_distance_to_players 8 }

create_object DEER
{ number_of_objects 4   group_variance 1   set_loose_grouping
  min_distance_to_players 19 }
```

Três números para guardar:

1. **A variedade do chão é ~2% da área, em 24 a 30 manchas** — por terreno
   extra. Não é ruído por célula; são manchas grandes e contadas, com
   espaçamento mínimo entre tipos.
2. **30 árvores avulsas** no mapa inteiro, escaladas pelo tamanho do mapa.
3. **Distância mínima até o jogador** em quase tudo (8 para árvore, 19 para
   veado): decoração não nasce em cima da base.

Quanto ao inventário de peças puramente decorativas, ele é pequeno e repetido:
`Gaia Flowers Num. 1` a `Num. 4` — **quatro variações de flor** —, mais
`Flower patches`, `Gaia Crack`, `Skeleton`, `Gaia Ruined Building`, `Gaia Torch`
([aoc-slp-list.md](https://github.com/SFTtech/openage/blob/master/doc/media/aoc-slp-list.md)).
Quatro flores cobriam um jogo inteiro.

---

## 7. O que o Definitive Edition refez no terreno, e por quê

### A arte virou renderização de 3D

O texto oficial da Microsoft, sobre a Definitive Edition do primeiro Age of
Empires, é explícito ao responder se o jogo virou 3D:

> "modelos 3D, mas então renderizados como imagens 2D"

([ageofempires.com — "Is it a 3D or a 2D game?"](https://www.ageofempires.com/news/age-empires-definitive-edition-3d-2d-game/))

E traz os números do custo: unidades passaram de 8 para **32 direções**, cada
peça foi **renderizada 3 vezes** em níveis de zoom diferentes para servir de HD a
4K sem pixelar, e o download saltou de **300 MB para 17 GB** — com animações de
destruição a **60 quadros por segundo**. O anúncio do Age of Empires II:
Definitive Edition repete a promessa na mesma linha: "gráficos 4K deslumbrantes,
fiéis à aparência e à sensação do Age of Empires II"
([E3 2019 com a Forgotten Empires](https://www.ageofempires.com/news/e3-2019-demo-recap-with-forgotten-empires/)).

**O porquê:** o ladrilho de 97 × 49 e o sprite de paleta de 256 cores foram
desenhados para 800 × 600. Numa tela 4K o mesmo losango ocupa nove vezes mais
pixels. Não havia como esticar — tinha que redesenhar, e redesenhar à mão 27
terrenos × 100 ladrilhos é inviável; daí o 3D renderizado, que é o mesmo
pipeline que o capítulo 01 descreve para unidade.

### O formato de arquivo mudou duas vezes, e o que ele ganhou diz o que foi refeito

- **SLP** (original): paleta indexada de 256 cores.
- **SMP/SMX** (beta e lançamento da DE): "versão comprimida do formato SMP"
  ([smx-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/smx-files.md)).
- **SLD** (a partir da build 66692): abandona a paleta indexada e usa compressão
  de textura com perdas, **DXT1 e DXT4**
  ([sld-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/sld-files.md)).

E cada quadro SLD é dividido em **quatro camadas**, que é a lista do que a DE
passou a tratar separadamente:

1. **Main Graphics Layer** — o desenho.
2. **Shadow Graphics Layer** — a sombra, agora camada do quadro.
3. **Damage Mask Layer** — e esta é a novidade de verdade.
4. **Playercolor Mask Layer** — a cor do jogador como máscara por pixel.

A camada de dano, na descrição do formato:

> "O *damage mask layer* é uma sobreposição da camada gráfica principal que
> guarda um valor modificador em cada pixel. Internamente, esta máscara é usada
> para exibir o efeito de escurecimento de prédios/unidades danificados. Cada
> pixel da camada de máscara de dano corresponde a um pixel da camada gráfica
> principal. Usando o valor modificador do pixel da máscara e a porcentagem atual
> de dano da unidade, o jogo calcula internamente um multiplicador que é aplicado
> aos valores RGB do pixel da camada principal."

([sld-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/sld-files.md))

**O porquê importa para nós:** o dano deixou de ser *sprite alternativo* e virou
*função contínua da vida*. O prédio escurece progressivamente, por pixel,
guiado por uma máscara que o artista pinta uma vez. É a ideia mais aproveitável
de todo este capítulo para um jogo pequeno — e a versão sem máscara dela é
grátis.

---

# O que serve para nós

Tudo daqui para baixo é **medição no nosso código**, feita em 14/09/2026 com
scripts que carregam `src/` no Node e varrem os seis setores de `data.js`.
Os números de fonte externa continuam com o link de onde vieram.

## O nosso chão, de verdade

### Tipos de terreno: 5, sendo 2 apelidos

`src/data.js:9-17` define cinco valores e dois apelidos:

```js
ASFALTO: 0,  ROCHA: 1,  AGUA: 2,  ESCOMBRO: 3,  RUINA: 4
TERRENO.PLANICIE = TERRENO.ASFALTO;
TERRENO.CRATERA  = TERRENO.ESCOMBRO;
```

Contra **27** no Age of Kings
([terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md))
e 8 tilesets × 6 a 13 terrenos no StarCraft
([Terrain Type Elevations](https://wiki.staredit.net/w/index.php?title=Terrain_Type_Elevations)).
Cinco é pouco em inventário e **suficiente em regra** — cada um dos nossos cinco
muda o jogo (anda/não anda, constrói/não constrói), o que não é verdade dos 27
do Age of Empires, em que grama, grama escura e grama 3 são a mesma regra.

Composição medida por setor (% de células):

| setor | células | asfalto | rocha | água | escombro | ruína |
|---|---|---|---|---|---|---|
| manaus | 4900 | 57,7 | 3,6 | 4,8 | 12,0 | 21,9 |
| rio | 6084 | 51,4 | 15,0 | 3,3 | 11,1 | 19,2 |
| sp | 5776 | 54,1 | 5,0 | 7,3 | 9,5 | 24,1 |
| cairo | 6084 | 51,4 | 5,9 | 7,0 | 10,8 | 25,0 |
| manhattan | 5184 | 26,5 | 5,7 | **53,9** | 4,1 | 9,9 |
| merida | 6400 | 52,9 | 17,8 | 1,7 | 12,1 | 15,5 |

### Variações de arte por tipo: 1

`assets/cenario/` tem **quatro** texturas de chão — `asfalto.webp`,
`chao-pavimento.webp`, `chao-entulho.webp`, `chao-agua.webp` — todas **256 × 256**
(medido com PIL). Uma por tipo. A rocha e a ruína usam a mesma do escombro
(`render.js:481`).

Contra **100 ladrilhos desenhados por terreno** no Age of Empires II e **16
megatiles por grupo CV5** no StarCraft, metade deles espelhados de graça pelo bit
do `VX4`.

A repetição é combatida de três jeitos, e isso é nosso, não copiado:

1. **Cor por célula, com ruído estável** (`render.js:213-217, 286-297`): a mesma
   célula devolve sempre o mesmo valor — mesma escolha do Age of Empires
   (determinístico, não sorteado) — com manchas de grama em escala 4×4 e de terra
   em escala 5×5, mais dois tons alternando no ruído fino.
2. **Textura esticada** (`render.js:499-504`): `k = (10 * LARG) / img.width`, com
   `LARG = 64` e imagem de 256, dá **k = 2,5**. A textura cobre 10 células em vez
   de 4, e o comentário no código já cita o Age of Empires como razão.
3. **`overlay` em vez de multiplicação** (`render.js:519`): a cor do setor
   continua mandando e a imagem entra só como granulação, com alfa 0,34 a 0,62.

O preço do item 2, medido: **25,6 texels de textura por célula**
(256 ÷ 10) contra os **97 × 49 pixels por ladrilho** do Age of Empires II. É uma
diferença de quase 4× na resolução do chão, e é o motivo de o chão ficar macio
de perto.

### Transição entre terrenos: 1 máscara, 4 vizinhos

`Render.prototype.suavizarBordas` (`render.js:436-467`) faz exatamente o que o
blendomatic faz, em miniatura, e o comentário no código já reconhece a dívida:
tabela de prioridade (`render.js:430-434`: asfalto 20, escombro 40, rocha 60,
água 10), o vizinho dominante vaza para dentro da célula, e a fronteira fica
irregular sem borda desenhada.

As diferenças, medidas:

| | Age of Empires II | nosso |
|---|---|---|
| máscaras | 279 (9 modos × 31) | 1 (um gradiente linear) |
| variantes por direção | 4, escolhidas pelos 2 bits baixos de x ou y | 1 |
| vizinhos consultados | 8 (4 ortogonais + 4 diagonais) | **4** |
| classes com borda própria | 5 formas (áspera, suave, curta, spray, afiada) | 1 |

E a medição que dói:

| setor | fronteiras reais | gradientes pintados | **cantos diagonais sem tratamento** | fronteira ruína/escombro **ignorada** |
|---|---|---|---|---|
| manaus | 2928 | 2482 | 891 | 446 |
| rio | 4227 | 3689 | 1195 | 538 |
| sp | 3909 | 3311 | 1159 | 598 |
| cairo | 3592 | 3082 | 1081 | 510 |
| manhattan | 2095 | 1937 | 694 | 158 |
| merida | 4291 | 3778 | 1228 | 513 |

A conta fecha exata nos seis setores: **fronteiras − ruína/escombro = gradientes**
(2928 − 446 = 2482; 4227 − 538 = 3689; e assim por diante). A causa está em
`render.js:444` e `449`: `if (t === T.RUINA) t = T.ESCOMBRO;` dos dois lados,
então ruína e escombro viram o mesmo terreno e **nenhuma** das 158 a 598
fronteiras entre eles recebe transição. Todos os 10 pares possíveis de terreno
aparecem em todos os seis setores — nenhum par é teórico.

### Elevação: zero

Não temos, e a decisão está certa. O preço documentado é 17 níveis × 94 formas
de borda só para a névoa, mais 10 mapas de cor para a iluminação das encostas
([terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md)).
Num jogo de defesa de base num plano, o que a altura compra — visão e vantagem
de tiro — a gente já compra com a névoa de `world.js` e com o alcance da torre.
O que vale anotar como **dívida honesta**: `render.js` tem `alturaRuina`
(`render.js:713`), que é altura de prédio arruinado, não do chão. A cratera de
`world.js:esculpirCratera` é **buraco no mapa de terreno**, não na geometria.

## O prédio, de verdade

### Estágios de obra: 0 desenhados, 1 contínuo procedural

`render2.js:59` decide: se existe sprite e o prédio **não** está em obra, desenha
o sprite e volta. Em obra, cai no caminho procedural e a caixa cresce
continuamente: `altura = v.alt * (0.25 + 0.75 * b.obra)` (`render2.js:76`).

Todas as **20** estruturas de `data.js` têm sprite em `assets/estruturas/`
(medido: zero faltando; sobra um `lancadora.webp` sem estrutura correspondente).
Ou seja: **20 de 20 prédios aparecem de uma vez, prontos, no instante em que a
obra fecha** — não há a transição que o Age of Empires II divide em quatro faixas
(0-25, 25-50, 50-75, 75-100).

O contínuo procedural é, na verdade, mais fino que quatro degraus. O problema não
é a obra: é a **troca** no fim, de caixa cinza para sprite pintado.

### Estágios de dano: 0 no sprite

`R.desgasteEstrutura` (`render2.js:169-182`) é a totalidade do nosso dano em
prédio:

- barra de vida se `vivo < 0.999`, com três cores (verde > 0,5; amarelo > 0,25;
  vermelho abaixo);
- fumaça se `vivo < 0.55`, a cada 3 quadros.

O sprite em si **não muda nunca**. Comparando:

| | limiar | o que muda |
|---|---|---|
| StarCraft | abaixo de **2/3** da vida | chamas em `2n` degraus, pequena→grande, `n` = pontos de encaixe do sprite ([bwgame.h](https://github.com/OpenBW/openbw/blob/master/bwgame.h)) |
| AoE II | lista de `damage_percent` por prédio | sobreposição `TOP`/`RANDOM`, ou `REPLACE` nas muralhas (3 degraus) ([unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py)) |
| AoE II DE | contínuo | escurecimento por pixel guiado pela máscara de dano ([sld-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/sld-files.md)) |
| nós | 0,55 | fumaça flutuando **acima** do prédio; o prédio intacto |

Nossa fumaça a 55% é uma coincidência feliz: fica perto do 2/3 (0,667) do
StarCraft. Mas ela sai do topo do prédio (`y: c.y - g.h`), não de pontos de
encaixe na carcaça.

### Destroço: nenhum, e a silhueta mente

Este é o achado que mais incomoda. Rastreando o código:

1. `S.matar` (`sim-combate.js:305-306`) marca `alvo.morta = true` e chama
   `this.ocupar(alvo, 0)` — **a célula fica transitável na hora** (invariante do
   CLAUDE.md, e está correta).
2. Nenhum lugar de `src/sim*.js` remove a estrutura de `listaEstruturas` (não há
   nenhum `splice`). Ela fica na lista **para sempre**.
3. `montarListaDesenho` (`render.js:797`) põe todas as estruturas da lista no
   desenho, mortas inclusive.
4. `desenharEstrutura` com `b.morta` pula o sprite (`render2.js:59`) e desenha a
   caixa procedural na **altura cheia** (`altura = v.alt`, `render2.js:76`, com
   `emObra` falso) na cor `#3a3630` (`render2.js:74`).

Resultado medido no código: um prédio destruído vira **uma caixa escura da altura
original, de 24 a 28 pixels, que se atravessa a pé**. É o oposto do que os dois
clássicos fazem — StarCraft troca por um de dois sprites de entulho por raça
([bwenums.h](https://github.com/OpenBW/openbw/blob/master/bwenums.h)), o Age of
Empires II troca por entulho do tamanho da fundação (2×2 a 5×5), e a Definitive
Edition chegou a separar a animação de desabamento do entulho que fica
([unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py)).

Temos a explosão certa (`render2.js:961-966`: clarão, 14 cacos, fumaça, tremor de
tela) e o que sobra depois está errado.

### Sombra de prédio: nenhuma

`grep -n "sombra" src/render.js` devolve **uma linha, e é comentário**
(`render.js:323`). A função `R.sombraDeSprite` existe e funciona
(`render2.js:369-395`), mas é chamada em **um** lugar: `render2.js:540`, no
desenho de unidade.

Então, hoje:

- **20** estruturas com sprite: sem sombra.
- **24 a 73** peças de cenário por mapa: sem sombra (`desenharDestroco`,
  `render.js:975-987`, é um `drawImage` e mais nada).
- O marco do setor (Teatro Amazonas, 640 × 566 px): sem sombra.
- Ruínas e rocha: têm um substituto, `escurecerJuntoAosPredios`
  (`render.js:397-419`), que escurece as células livres vizinhas de ruína ou
  rocha com alfa `0.1 + perto * 0.075`. É oclusão de ambiente, e é boa — mas roda
  **uma vez, na preparação do mapa**, no canvas do terreno. Prédio do jogador,
  que nasce depois, não recebe nada.

Nos dois clássicos a sombra é peça de arte catalogada — o Age of Conquerors tem
sombra de centro urbano por era, sombra de muralha, sombra de floresta, sombra
animada das pás do moinho
([aoc-slp-list.md](https://github.com/SFTtech/openage/blob/master/doc/media/aoc-slp-list.md))
— e na Definitive Edition virou camada obrigatória do quadro
([sld-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/sld-files.md)).

### Animação de prédio: zero nos prédios com sprite

`R.detalharEstrutura` (`render2.js:184+`) tem coisas boas: mastro da Central com
luz que pisca em `sin(quadro/16)`, varredura do radar, canhão da torre apontado
para o alvo. **Nada disso roda.** A chamada está em `render2.js:105`, depois do
`return` da linha 70 — o caminho procedural. Com os 20 sprites presentes, o
caminho procedural só é alcançado por prédio em obra, morto ou abandonado.

O comentário de `R.avisosEstrutura` (`render2.js:161-166`) já registra a decisão
consciente sobre o canhão ("a arte já traz uma torreta desenhada, e um segundo
cano por cima dela sai torto"). A luz da Central e a varredura do radar não foram
decididas — foram perdidas junto.

Medição: dos 20 prédios, **0 têm qualquer parte em movimento**. A única coisa
animada num prédio nosso é a fumaça de dano abaixo de 55% de vida.

### Decoração: 24 a 73 peças por mapa

`prepararDestrocos` (`render.js:167-193`) sorteia por hash estável da célula, com
três listas ligadas ao **significado** do terreno:

| terreno | lista | peças | chance |
|---|---|---|---|
| escombro | `DESTROCOS_ENTULHO` | 6 | 0,055 |
| asfalto **de rua** | `DESTROCOS_RUA` | 6 | 0,022 |
| asfalto fora da rua | `VERDE` | 3 (2 distintas) | 0,05 |

Mais **1 marco por bioma** (`MARCOS`, hoje só `porto` → Teatro Amazonas), plantado
sobre um quarteirão de ruína que já bloqueia passagem.

Densidade medida (replicando o mesmo hash, incluindo a regra de afastamento de
5 células):

| setor | entulho | rua | verde | total | % das células |
|---|---|---|---|---|---|
| manaus | 18 | 16 | 19 | 53 | 1,08 |
| rio | 18 | 23 | 26 | 67 | 1,10 |
| sp | 13 | 35 | 14 | 62 | 1,07 |
| cairo | 20 | 25 | 19 | 64 | 1,05 |
| manhattan | 8 | 13 | 3 | 24 | 0,46 |
| merida | 27 | 14 | 32 | 73 | 1,14 |

Contra o Arabia original, que espalha **30 árvores avulsas** num mapa escalado
pelo tamanho
([Arabia.rms](https://github.com/fntsrlike/AoE2-RMS-collections/blob/master/AoC/Arabia.rms)).
Em ordem de grandeza estamos no mesmo lugar, com o dobro de peças porque a nossa
cidade está destruída e a sucata **é** o cenário.

## O que já é melhor que o Age of Empires e o StarCraft

Cinco coisas, com o número ao lado:

1. **A rua é lida do mapa, não autorada.** `prepararTerreno` (`render.js:225-266`)
   mede a largura da faixa livre em cada eixo, célula a célula, e classifica em
   rua-X, rua-Y ou cruzamento com o critério `COMPRIDO = 5` / `ESTREITO = 4`.
   Depois `pintarRuas` desenha tracejado **no eixo certo**, faixa de pedestre no
   cruzamento e meio-fio. Nenhum dos dois clássicos deriva pintura de chão da
   topologia do mapa — no StarCraft "Asphalt" é só mais um terreno da paleta
   Badlands ([Terrain Type Elevations](https://wiki.staredit.net/w/index.php?title=Terrain_Type_Elevations)).
2. **Uma textura serve seis setores.** O `overlay` de `texturarTerreno`
   (`render.js:519`) deixa a cor do setor mandar. O Age of Empires II precisou de
   SLPs inteiros a mais para as versões nevadas: `015027 dirt with snow`,
   `015028/015029 grass with snow`, `015030 ancient building fundaments with snow`
   ([terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md)).
   São 4 arquivos de 100 ladrilhos para fazer o que a gente faz trocando a
   paleta.
3. **Oclusão de ambiente no chão.** `escurecerJuntoAosPredios` dá volume à massa
   construída sem nenhuma arte. O Age of Empires II não tem nada equivalente —
   ele depende da sombra desenhada, uma por peça.
4. **Decoração com semântica de regra.** Verde fora da via, veículo só na via,
   sucata só onde não se constrói, e a peça **some** se alguém constrói na célula
   (`render.js:788`: `if (sim.world.occ[...] !== 0) continue`). É a mesma
   preocupação que separa *doodad* de *sprite* no StarCraft
   ([Tiles Properties](https://wiki.staredit.net/w/index.php?title=Tiles_Properties)),
   resolvida de um jeito que nem o StarCraft tem: lá, doodad colocado por editor
   de terceiros fica bloqueando onde não devia.
5. **Sombra automática de unidade.** `sombraDeSprite` (`render2.js:369`) tira a
   sombra da própria figura, sem quadro desenhado. O Age of Empires II tem a
   sombra como SLP separado, por peça e por era — o nosso custa zero por peça
   nova.

## Os três ajustes de maior efeito

Os três são **CÓDIGO**. Nenhum precisa de desenho novo, e esse é o resultado da
análise: a arte que temos está à frente do que o código faz com ela.

---

### 1 — Sombra de contato nos prédios e nas peças de cenário · **CÓDIGO**

**O que fazer:** chamar `R.sombraDeSprite` (`render2.js:369`, já pronta e em uso
para unidade) também em `R.spriteNaFundacao` (`render2.js:38`) e em
`Render.prototype.desenharDestroco` (`render.js:975`), com `voo = 0`.

**Medição que confirma:** `grep -n "sombra" src/render.js` → 1 ocorrência, e é
comentário. `sombraDeSprite` é chamada em 1 lugar do repositório inteiro
(`render2.js:540`). Hoje **20 de 20 estruturas**, **24 a 73 peças de cenário por
mapa** e o marco de 640 px ficam apoiados no chão sem nenhuma transição. O único
volume que assenta é a ruína, e por outro caminho
(`escurecerJuntoAosPredios`, que roda só na preparação do mapa e não vê prédio do
jogador).

**Por que é o primeiro:** é a diferença entre "objeto colado na tela" e "objeto
no chão", e é o que os dois clássicos nunca dispensaram — a Definitive Edition
chegou ao ponto de fazer da sombra uma **camada obrigatória de cada quadro**
([sld-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/sld-files.md)).

**Medir depois:** contagem de chamadas de `sombraDeSprite` por quadro (deve subir
para ~20-90 em mapa cheio) e o tempo de `desenhar()`; a sombra de unidade já roda
com dezenas de unidades sem custo perceptível, então o risco é baixo — mas a de
prédio é bem maior em área.

---

### 2 — Prédio destruído vira entulho baixo · **CÓDIGO** (a arte já existe)

**O que fazer:** em `desenharEstrutura`, quando `b.morta`, desenhar altura
reduzida (25% de `v.alt`) na cor do entulho, ou reaproveitar
`destroco-predio-caido.webp` / `destroco-entulho.webp` de `assets/cenario/` —
**dez sprites de destroço já estão no repositório** e nenhum é usado para prédio
do jogador.

**Medição que confirma:** com `b.morta`, `emObra` é falso, então
`render2.js:76` calcula `altura = v.alt * 1` — **altura cheia**, de 24 a 28 px
conforme o tipo (`VISUAL`, `render2.js:10-31`). A célula, porém, já foi liberada
por `this.ocupar(alvo, 0)` em `sim-combate.js:309`. Ou seja, existe hoje uma
caixa opaca do tamanho do prédio **que se atravessa a pé**, e ela nunca some:
nenhum `splice` remove a estrutura de `listaEstruturas` em `src/sim*.js`.

**Por que é o segundo:** não é estética, é a silhueta mentindo sobre
passabilidade — o mesmo defeito que o tutorial do StarCraft chama pelo nome,
*"o que você vê não é o que você tem"*
([Tiles Properties](https://wiki.staredit.net/w/index.php?title=Tiles_Properties)).
E os dois clássicos resolvem trocando a peça, não apagando: StarCraft tem
2 sprites de entulho por raça, o Age of Empires II tem 5 tamanhos mais uma
variante mais queimada.

**Medir depois:** rodar `node tests/aceitacao.cjs` (28/28 — a mudança é só de
desenho, mas mexe perto de `matar`) e, à vista, atravessar a pé o lugar de um
prédio destruído: a tropa tem de passar por onde o desenho diz que dá para
passar.

---

### 3 — As diagonais e a ruína em `suavizarBordas` · **CÓDIGO**

**O que fazer:** duas mudanças em `render.js:436-467`. Primeira, acrescentar os
4 vizinhos diagonais ao laço, com o gradiente nascendo no canto — é o que as
máscaras 16 a 19 do blendomatic fazem, e elas são aplicadas **além** da máscara
ortogonal
([blendomatic.md](https://github.com/SFTtech/openage/blob/master/doc/media/blendomatic.md)),
com a regra de não aplicar a diagonal se um dos dois ortogonais vizinhos dela já
influencia. Segunda, dar prioridade própria à ruína em vez de colapsá-la em
escombro nas linhas 444 e 449.

**Medição que confirma:** por mapa, **694 a 1228 cantos diagonais** ficam hoje
com o corte duro do losango, e **158 a 598 fronteiras ruína/escombro** não
recebem transição nenhuma. A conta fecha exata nos seis setores:
fronteiras reais − fronteiras ruína/escombro = gradientes pintados
(manaus 2928 − 446 = 2482; rio 4227 − 538 = 3689; sp 3909 − 598 = 3311;
cairo 3592 − 510 = 3082; manhattan 2095 − 158 = 1937; merida 4291 − 513 = 3778).
Entre 24% e 40% das células do mapa participam de alguma fronteira — não é canto
de mapa, é o mapa.

**Por que é o terceiro e não o primeiro:** custa mais laço que os outros dois e o
ganho é difuso. Mas é grátis em tempo de jogo — `suavizarBordas` roda **uma vez**,
na montagem do canvas de terreno (`render.js:314`), que é guardado e reaproveitado
todo quadro.

**Medir depois:** rodar o mesmo script de contagem de cantos e exigir zero;
medir o tempo de `prepararTerreno` antes e depois (hoje já faz 4 laços completos
sobre `w.n`, e passaria a fazer 8 vizinhos em vez de 4 num deles — um mapa de
6400 células é ~51 mil testes, desprezível numa preparação única).

---

## E o que precisaria de ARTE NOVA (fila abaixo dos três)

Separado de propósito: estes custam desenho, e por isso ficam depois.

1. **Textura de chão em resolução de jogo.** Hoje 256 × 256 esticada 2,5×, ou
   **25,6 texels por célula**, contra 97 × 49 pixels por ladrilho do Age of
   Empires II. Quatro texturas novas em 1024 × 1024 quadruplicariam a nitidez sem
   tocar em uma linha de código — `k` se ajusta sozinho, porque é
   `(10 * LARG) / img.width` (`render.js:500`). Custo: 4 imagens.
2. **Máscara de dano por pixel, à moda da Definitive Edition.** A versão **sem**
   arte nova é código puro e cabe hoje: escurecer o sprite proporcionalmente a
   `1 - vivo` com um `globalCompositeOperation = 'source-atop'`, que é a mesma
   ideia do multiplicador RGB descrito no formato SLD, só que uniforme em vez de
   por pixel. A versão com máscara pintada (20 imagens a mais) fica para depois.
3. **Estágios de obra desenhados.** Quatro faixas, como o Age of Empires II
   (0-25, 25-50, 50-75, 75-100). Custo: 20 prédios × 1 imagem de andaime, e
   provavelmente não se paga — o crescimento contínuo da caixa procedural já
   informa o progresso melhor que quatro degraus.
4. **Uma parte em movimento por prédio.** A Central com a luz piscando e o radar
   varrendo **já estão escritos** em `detalharEstrutura` (`render2.js:184+`) e
   apenas não são alcançados quando há sprite. Trazê-los para o caminho do sprite
   é código; fazer chaminé fumegar na fundição e bandeira ondular no quartel é
   arte. A lição das fontes é escolher o que **diz alguma coisa**: a fumaça da
   ferraria, as pás do moinho, a bandeira com a cor do jogador, e na Definitive
   Edition os gráficos de "pesquisando" e "pesquisa concluída"
   ([unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py)).
5. **Mais marcos de setor.** Temos 1 (`MARCOS.porto`) para 6 setores. Cada marco
   novo é uma imagem e transforma "outra grade cinza" em lugar reconhecível.

---

## Fontes

- openage — [terrain.md](https://github.com/SFTtech/openage/blob/master/doc/media/terrain.md),
  [blendomatic.md](https://github.com/SFTtech/openage/blob/master/doc/media/blendomatic.md),
  [slp-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md),
  [smx-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/smx-files.md),
  [sld-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/sld-files.md),
  [aoc-slp-list.md](https://github.com/SFTtech/openage/blob/master/doc/media/aoc-slp-list.md),
  [unit.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/unit.py),
  [lookup_dicts.py](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/lookup_dicts.py),
  [ability_subprocessor.py](https://github.com/SFTtech/openage/blob/master/openage/convert/processor/conversion/aoc/ability_subprocessor.py)
- OpenBW — [bwgame.h](https://github.com/OpenBW/openbw/blob/master/bwgame.h),
  [bwenums.h](https://github.com/OpenBW/openbw/blob/master/bwenums.h)
- Staredit Network Wiki — [Terrain Format](https://wiki.staredit.net/w/index.php?title=Terrain_Format),
  [Terrain](https://wiki.staredit.net/w/index.php?title=Terrain),
  [Isometrical Terrain](https://wiki.staredit.net/w/index.php?title=Isometrical_Terrain),
  [Terrain Blending](https://wiki.staredit.net/w/index.php?title=Terrain_Blending),
  [Terrain Type Elevations](https://wiki.staredit.net/w/index.php?title=Terrain_Type_Elevations),
  [Doodad](https://wiki.staredit.net/w/index.php?title=Doodad),
  [Tiles Properties](https://wiki.staredit.net/w/index.php?title=Tiles_Properties)
- [Arabia.rms, script original do Age of Conquerors, 21/12/1999](https://github.com/fntsrlike/AoE2-RMS-collections/blob/master/AoC/Arabia.rms)
- ageofempires.com — ["Is it a 3D or a 2D game?"](https://www.ageofempires.com/news/age-empires-definitive-edition-3d-2d-game/),
  [E3 2019 com a Forgotten Empires](https://www.ageofempires.com/news/e3-2019-demo-recap-with-forgotten-empires/)
