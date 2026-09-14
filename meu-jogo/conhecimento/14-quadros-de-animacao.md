# Contagem de quadros: Age of Empires II e StarCraft, número por número

O capítulo [03](03-animacao-2d-jogo.md) responde *onde* vale gastar quadro. Este
responde **quantos**. Nada aqui é estimativa: os números do Age of Empires II
foram **medidos no arquivo `.dat` do próprio jogo** e os do StarCraft **no
`iscript.bin` original**, com as ferramentas da comunidade. Cada linha de tabela
diz de onde veio.

## 0. Como cada motor guarda os quadros

Os dois resolvem o mesmo problema — muitas poses × muitas direções — de formas
opostas, e a diferença decide o custo de arte.

| | Age of Empires II (Genie) | StarCraft / Brood War |
|---|---|---|
| Um arquivo guarda | **uma animação inteira** (parado, ou andar, ou atacar…) | **tudo da unidade**, numa lista plana |
| Eixo da direção | `angle_count` no `.dat`; o SLP guarda ângulo por ângulo | somado ao índice do quadro, em **blocos de 17** |
| Quem escolhe o quadro | o motor, por `frame_rate` (segundos por quadro) | o **script** (`iscript`), quadro a quadro, por tick |
| Quanto tempo cada quadro fica | um número em segundos, no dado | um `wait N` escrito no script |

O campo do Genie, literal da engenharia reversa:

| campo | o que é | fonte |
|---|---|---|
| `frame_count` | "number of frames per angle" | [openage `graphic.py`](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/graphic.py) |
| `angle_count` | "number of heading angles stored, some of the frames must be mirrored" | idem |
| `frame_rate` / `FrameDuration` | "how long a frame is displayed" / "Frame rate in seconds. (Delay between frames)" | openage; [genieutils `Graphic.h`](https://github.com/sandsmark/genieutils/blob/master/include/genie/dat/Graphic.h) |
| `replay_delay` | "seconds to wait before current_frame=0 again" | openage |
| `speed_adjust` / `SpeedMultiplier` | "multiplies the speed of the unit this graphic is applied to" / "If over 0, replaces unit speed with this value" | openage; genieutils |

No StarCraft o equivalente do `frame_rate` não existe: quem segura o quadro é o
opcode `wait`, e quem move a unidade é o opcode `move`, **dentro da própria
animação**.

---

## 1. Age of Empires II — medido no `.dat`

**Método.** Baixei o `empires2_x2_p1.dat` (versão `VER 7.7`, Definitive Edition)
publicado em
[cnordenb/dev_Age-of-Kings-1.0](https://github.com/cnordenb/dev_Age-of-Kings-1.0/blob/main/resources/_common/dat/empires2_x2_p1.dat)
e li com o parser [`genieutils-py`](https://pypi.org/project/genieutils-py/).
São **12 731 gráficos** e **1 592 unidades**. Os números abaixo saíram desse
arquivo; a leitura é reprodutível com quinze linhas de Python.

Notação: `quadros × ângulos @ segundos por quadro`. "Quadros" é **por ângulo** —
o total desenhado é o produto.

| unidade | parado | 2º parado | andar | atacar | morrer | apodrecer | fonte |
|---|---|---|---|---|---|---|---|
| Milícia (`SPRMN`) | 30×16 @0,050 | — | 30×16 @0,028 | 30×16 @0,033 | 30×16 @0,033 | 30×16 @1,000 | `.dat` DE, medido |
| Espadachim (`THSWD`) | 60×16 @0,025 | — | 30×16 @0,030 | 30×16 @0,042 | 30×16 @0,033 | 30×16 @1,000 | idem |
| Arqueiro (`ARCHR`) | 60×16 @0,050 | — | 30×16 @0,024 | 30×16 @0,023 | 30×16 @0,033 | 30×16 @1,000 | idem |
| Lanceiro (`PKEMN`) | 60×16 @0,050 | — | 30×16 @0,023 | 30×16 @0,033 | 30×16 @0,033 | 30×16 @1,000 | idem |
| **Cavaleiro (`KNGHT`)** | 45×16 @0,067 | **45×16 @0,067** | 30×16 @0,037 | 30×16 @0,045 | 45×16 @0,041 | 30×16 @1,000 | idem |
| Aldeão (`VMBAS`) | 60×16 @0,050 | — | 30×16 @0,029 | 60×16 @0,021 | 30×16 @0,050 | 30×16 @1,000 | idem |
| Monge (`MONKX`) | 60×16 @0,050 | — | 30×16 @0,023 | 45×16 @0,033 | 45×16 @0,022 | 30×16 @1,000 | idem |
| Mangonel (`MANGO`) | **1**×16 | — | 60×16 @0,012 | 60×16 @0,017 | 60×16 @0,017 | 30×16 @1,000 | idem |
| **Trabuco (`TREBU`)** | **1×32** | — | **1×32** | 60×32 @0,037 | 60×32 @0,025 | 30×32 @1,000 | idem |
| Aríete (`BTRAM`) | **1**×16 | — | 60×16 @0,017 | 60×16 @0,025 | 60×16 @0,020 | 30×16 @1,000 | idem |
| Escorpião (`SCBAL`) | **1**×16 | — | 60×16 @0,012 | 60×16 @0,005 | 60×16 @0,017 | 30×16 @1,000 | idem |
| Águia (`EAGLE`) | 60×16 @0,058 | — | 30×16 @0,053 | 30×16 @0,053 | 45×16 @0,028 | 30×16 @1,000 | idem |
| Ovelha (`SHEEP`) | 60×16 @0,050 | — | 30×16 @0,027 (correr 30×16, `speed×1,9`) | 60×16 @0,025 | 30×16 @0,043 | 30×16 @1,000 | idem |
| **Barco de pesca (`FSHSP`)** | **1×16 @0,200** | — | **1×16 @0,100** | **1×16** | **120**×16 @0,038 | — | idem |
| **Longboat (`LNGBT`)** | **1×16 @0,200** | — | **1×16 @0,100** | **1×16** | **120**×16 @0,038 | — | idem |

O formato da geração anterior, para comparar (é o número que o capítulo 03 já
citava, e continua valendo para o jogo de 1999):

| coisa | quadros | direções | total por SLP | fonte |
|---|---|---|---|---|
| objeto que se move | **10** | **5 desenhadas** (3 espelhadas) | **50** | [openage, `slp-files.md`](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md) |
| flecha / projétil | **35** | 5 | **175** — "because they need a smoother transition between up- and downwards motion" | idem |
| prédio | **1** | — | 1 (mais pedaços para camadas) | idem |

E esse formato antigo **ainda está dentro do `.dat` da Definitive Edition**: dos
12 731 gráficos, **1 133 têm 8 ângulos** e a contagem de quadros deles se junta
em **5 (100 gráficos), 10 (537) e 15 (187)** — a assinatura da geração SLP. Os
**2 833 gráficos de 16 ângulos** são a arte refeita. (Medido no mesmo `.dat`.)

### A forma dos dados, no `.dat` inteiro

| medida | valores mais comuns | leitura |
|---|---|---|
| `angle_count` | 1 (6 613), **16 (2 833)**, 8 (1 133), 5 (272), 32 (51) | 16 é o padrão da unidade refeita; 5 é herança do AoC |
| `frame_count` | 1 (4 972), 20 (1 807), 10 (938), **30 (832)**, 60 (702), 45 (409), 15 (231) | metade de tudo é **um quadro só** |
| `frame_count` do **andar** (629 unidades têm gráfico de andar) | 30 → **402**; 60 → 79; **1 → 71**; 11 → 41; 10 → 21; 45 → 12; 3 → 3 | 30 é a caminhada padrão da DE — e **71 unidades andam com um quadro só** |
| `replay_delay` | 0 em 11 951; 1 s em 386; **50 s em 83; 60 s em 61** | a pausa antes de repetir; 50–60 s é ritmo de *fidget* |
| 2º gráfico de parado | **122 unidades de 1 592** | a variação de parado é **exceção**, não regra |

Todos medidos no mesmo arquivo.

### O cadáver do AoE2 é uma unidade separada

Medido: `dead_unit_id` do Arqueiro aponta para `ARCHR_D`, cujo gráfico parado é
**"Archer (Decay)": 30 quadros × 16 ângulos a 1,000 segundo por quadro**. Trinta
quadros a um segundo = **trinta segundos de cadáver**, que é exatamente o número
que o capítulo 03 tinha citado de fórum. Vale igual para Milícia, Cavaleiro,
Aldeão, Monge, Mangonel, Aríete, Águia, Ovelha; para o Trabuco são 30×32.
Navio não tem: ele afunda (120 quadros) e acabou.

Na Definitive Edition **nenhuma das 1 592 unidades usa o campo `undead_graphic`**
— o "apodrecer" virou uma unidade de cadáver própria, não um segundo gráfico da
unidade viva.

### O quadro em que o golpe sai

O `.dat` guarda `frame_delay`: em que quadro da animação de ataque o projétil
parte. Medido: **Arqueiro = 15** (de 30, a metade exata) e **Trabuco = 24** (de
60). Nas unidades corpo a corpo o valor é 0. É a mesma ideia do "dano no quadro
8" do Diablo II citada no capítulo 03 — o som e o dano saem do quadro certo, não
do início da animação.

---

## 2. StarCraft / Brood War — medido no `iscript.bin`

**Método.** O `iscript.bin` (40 482 bytes), o `images.dat` e o `sprites.dat`
originais estão publicados em
[andreas-volz/icecc](https://github.com/andreas-volz/icecc); foram lidos com o
formato de
[PyMS `IScriptBIN.py`](https://github.com/poiuyqwert/PyMS/blob/master/PyMS/FileFormats/IScriptBIN.py).
Os totais por GRP são **limites inferiores exatos** — derivados de todos os
`playfram` de todas as entradas de animação —, porque os binários `.grp` não
estão publicados.

### Quadros por animação

| unidade | andar | ataque (início) | ataque (repetição) | parado | morrer | fonte |
|---|---|---|---|---|---|---|
| Marine | **8** | 4 poses | 2 alternando | 1 + *fidget* | **8** | `iscript.bin`, medido |
| Firebat | 8 (7 + volta) | 2 | 2 | 1 + *fidget* (4) | — (explosão) | idem |
| **SCV** | **1 — nenhuma** | 2 | 2 | 1 | — (explosão) | idem |
| Siege Tank (base) | 3 | — | — | 1 | — | idem |
| **Siege Tank (torre)** | **0** | **0** (só som + clarão) | 0 | 0 | — | idem |
| Zealot | 8 | 5 | 5 | **1** | 7 | idem |
| Dragoon | 8 | 8 | 3 | **8 (laço de verdade)** | 7 | idem |
| Zergling | 7 (6 + volta) | 6 | 6 | **1** | 7 | idem |
| Hydralisk | 7 (6 + volta) | 5 | 2 | 1 + *fidget* (11) | 8 | idem |
| Mutalisk | 5 | 5 | 5 | 5 | — | idem |
| Ultralisk | 10 | 5 | 5 | **1** | 10 | idem |

### Tamanho do GRP

| unidade | GRP | blocos de 17 | quadros direcionais | quadros de morte | total (mín.) |
|---|---|---|---|---|---|
| Marine | `terran\marine.grp` | 13 | 221 | 8 | 229 |
| Zealot | `protoss\zealot.grp` | 13 | 221 | 7 | 228 |
| Zergling | `zerg\zergling.grp` | 17 | 289 | 7 | 296 |
| Dragoon | `protoss\dragoon.grp` | 24 | 408 | 7 | 415 |
| Ultralisk | `zerg\ultra.grp` | 15 | 255 | 10 | 265 |
| Mutalisk | `zerg\mutalid.grp` | 5 | 85 | — | 85 |
| **SCV** | `terran\SCV.grp` | **3** | **51** | — | **51** |
| **Siege Tank (torre)** | `terran\tankt.grp` | **1** | **17** | — | **17** |

Medido no mesmo `iscript.bin`; o cabeçalho do GRP guarda a contagem de quadros
num campo de 2 bytes e o quadro vai até 255×255 px
([GRP Image Format](https://wiki.staredit.net/wiki/GRP_Image_Format),
[irongrp](https://github.com/sjoblomj/irongrp)).

### O script do Marine, na íntegra do que interessa

```
MarineWalking:
	move 4 / wait 1 / playfram 0x55      ← bloco 5
	move 4 / wait 1 / playfram 0x66      ← bloco 6
	... até o bloco 12, e volta ao 4
```

Oito poses, **uma por tick**, cada uma carregando `move 4` — quatro pixels. Oito
quadros × 4 px = **32 px por ciclo, que é exatamente um ladrilho**.

```
MarineGndAttkInit:  playfram 0x00 / 0x11 / 0x22     ← 3 quadros para erguer a arma
MarineGndAttkRpt:   playfram 0x33 ↔ 0x22, três vezes ← 2 poses alternando
MarineDeath:        playfram 0xdd .. 0xe4, wait 2    ← 8 quadros CONSECUTIVOS
```

([Exemplo de decompilação do `iscript.bin`, icecc](https://github.com/andreas-volz/icecc/blob/main/Examples/Marine%20Storm%20Script.txt)
— o `useweapon 84` que aparece nesse arquivo é a modificação do exemplo; o resto
é o script original.)

---

## 3. Direções: quantas desenhadas, quantas espelhadas

**Age of Empires II.** Cinco desenhadas, três espelhadas, na geração SLP:
"each animation has 10 keyframes and 5 directions. The other 3 directions are
generated later by flipping the sprite on the y axis"
([openage](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
O campo é `angle_count` — "number of heading angles stored, **some of the frames
must be mirrored**". Medido na Definitive Edition: **16** ângulos guardados na
unidade refeita, **32** no Trabuco, **8** e **5** na arte herdada.

**StarCraft.** Trinta e dois rumos de sprite, **17 desenhados e 15 espelhados**.
Não é folclore — é a aritmética do motor, literal
([OpenBW, `bwgame.h`](https://github.com/OpenBW/openbw/blob/master/bwgame.h)):

```cpp
size_t frame_index_offset = (direction_index(heading) + 4) / 8;
bool flipped = false;
if (frame_index_offset > 16) {
    frame_index_offset = 32 - frame_index_offset;
    flipped = true;
}
```

O rumo mora em 256 unidades; dividido por 8 dá 0…32. De 0 a 16 são **17 imagens
desenhadas**; de 17 a 31 o motor faz `32 − x` e liga o espelho — **15
espelhadas**. É daí que sai o "bloco de 17": `playfram` escolhe a base e o motor
soma o rumo. Confirmação independente no PyGRP: *"exporting GRP's to a Single BMP
(Framsets) when there arn't a multiple of 17 frames"*
([pygrp.txt](https://github.com/poiuyqwert/PyMS/blob/master/Docs/pygrp.txt)).
Das 999 entradas de `images.dat`, **159 têm `gfx_turns` ligado**, e só **57** são
imagem de unidade de verdade — o resto é sombra e sobreposição.

---

## 4. A taxa de quadros, e se ela acompanha a velocidade

**StarCraft: o quadro anda com o relógio, e o CORPO anda com o quadro.** O
`iscript` executa um passo por tick; `wait N` são N ticks; no *Fastest* o tick é
de **42 ms = 23,81 quadros por segundo**
([BWAPI `setLocalSpeed`](https://bwapi.github.io/class_b_w_a_p_i_1_1_game.html)).
O deslocamento está **dentro** da animação, no opcode `move`, que "sets the unit
to move forward a certain number of pixels". Medido, por quadro do ciclo:

| unidade | `move` de cada quadro | o que isso faz |
|---|---|---|
| Marine | 4, 4, 4, 4, 4, 4, 4, 4, 4 | passo constante |
| Zealot | 4 × 8 | constante |
| Hydralisk | 2, 2, 2, 6, 6, 6, 2 | acelera no meio |
| **Zergling** | 2, 8, 9, 5, 6, 7, 2 | **bote** — o salto é o número, não o desenho |
| Dragoon | 4, 6, 8, 8, 2, 2, 6, 6 | perna mecânica |
| Ultralisk | 2, 6, 4, 3, 2, 7, 8, 7, 8, 7 | galope |
| Mutalisk | **nenhum `move`** | voador: bate asa em ritmo fixo |

O pé não patina porque **a animação dita a distância**, e não o contrário. É a
mesma identidade da seção 4 do capítulo 03, resolvida pelo outro lado: nós
integramos a fase a partir da distância; a Blizzard escreveu a distância dentro
da fase. O código do OpenBW confirma que o `move` passa por
`get_modified_unit_speed` — a melhoria de velocidade multiplica o avanço **sem
mudar a taxa de quadros**, então unidade melhorada anda com passada mais larga.

**Age of Empires II: a taxa é um número em segundos, e o andar é atado à
velocidade da unidade.** `frame_rate` é "how long a frame is displayed"
(openage). Medido na DE: a caminhada da Milícia é 0,028 s por quadro (≈36 qps), a
do Cavaleiro 0,037 (≈27 qps), a do Mangonel 0,012 (≈86 qps). E o gráfico de
caminhada carrega `speed_multiplier = 1,0` em **todas** as unidades medidas — o
campo que "multiplies the speed of the unit this graphic is applied to". Quem
prova que ele é usado de verdade é a **Ovelha**: o gráfico de correr é o mesmo de
andar, 30 quadros, com `speed_multiplier = 1,9`. A animação de correr **é** a de
andar, com o multiplicador mudando o passo.

---

## 5. O caso mínimo — mais importante que o caso máximo

**StarCraft: o mínimo é 17 quadros, ou seja, UM bloco — zero animação, só
rotação.** Quatorze imagens direcionais de unidade têm um bloco só. Medido:

| unidade | blocos | quadros | `playfram` distintos no script inteiro |
|---|---|---|---|
| **Torre do Siege Tank** (`tankt.grp`) | 1 | 17 | **0** |
| Probe, Shuttle, Carrier, Battlecruiser, Dropship, Wraith, Vulture, Science Vessel | 1 | 17 | 1 |
| Interceptor, Arbiter, Scout | 2 | 34 | 2 |
| **SCV**, Siege Tank (base) | 3 | 51 | 3 |
| Overlord | 4 | 68 | 4 |

Dois achados que valem o capítulo inteiro:

- **A torre do Siege Tank não tem um único `playfram`.** O ataque dela é
  `wait 1` → som → `imgol 536` (o clarão do cano, sprite separado) → `wait 2` →
  `attackwith` → repete. O disparo é **som mais sobreposição**, nunca um quadro
  novo do canhão. E é a arma mais icônica do jogo.
- **O SCV não tem ciclo de caminhada.** O bloco `Walking` inteiro é
  `playfram 0` → `imgol 249` (o brilho) → `setvertpos 0` → laço. Ele desliza pelo
  mapa há vinte e oito anos e ninguém reclamou — porque ele **quica**
  (`shvertpos 0,1,2,3,2,1`, seis passos de sobe-e-desce) e porque tem pressa.

**Age of Empires II: o mínimo é 1 quadro × 16 ângulos, e quem faz isso é o
barco.** Medido: Barco de pesca e Longboat têm **parado = 1 quadro, andar = 1
quadro, atacar = 1 quadro** — e **120 quadros de afundar**. Corpo rígido que só
gira não precisa de ciclo; todo o orçamento foi para a morte. O Trabuco tem
`parado` e `andar` com **1 quadro × 32 ângulos**, e 60 no ataque. Mangonel,
Aríete e Escorpião: parado com 1 quadro.

A regra que os dois jogos escrevem junto: **quadro desenhado é para a AÇÃO e
para a MORTE. Para existir, um quadro basta.**

---

## 6. Parado: um quadro, e o resto é truque

**StarCraft.** Na maioria — Zealot, Zergling, Ultralisk, SCV, Siege Tank — o
bloco `Init` é literalmente `playfram X` → `wait 125` → laço. **Um quadro.**

O Marine parece animado e quase não é. Medido:

```
playfram 68          ← a pose parada
waitrand 63 75       ← espera de 63 a 75 ticks = 2,6 a 3,1 s no Fastest
randcondjmp 25 ...   ← 25 em 256 ≈ 10% de chance de fazer alguma coisa
```

e o ramo mais provável (50%) é `turnccwise 2` cinco vezes, `wait 3`, e
`turncwise 2` cinco vezes — **ele só gira no lugar**. Girar não custa quadro
nenhum: troca o índice de rumo, que já existe. Só o último ramo gasta dois blocos
novos. Hydralisk: igual. **O Dragoon é a única exceção real** — laço permanente
de 8 blocos com `wait 2`, porque as pernas dele nunca param.

**Age of Empires II.** Aí o parado é animado de verdade: 30 a 60 quadros por
ângulo. Mas a *variação* de parado — o `2nd Standing Graphic` — existe em
**122 unidades de 1 592**, quase todas heróis e a linha do Cavaleiro (que tem
`Knight (IdleC)` e `Knight (IdleA)`, 45 quadros cada). E quando o motor precisa
de pausa entre repetições, ela é longa: dos gráficos com `replay_delay` diferente
de zero, **83 esperam 50 segundos e 61 esperam 60 segundos**.

Ou seja: *fidget* a cada 3 segundos com 10% de chance (StarCraft) ou a cada 50 a
60 segundos (Age of Empires). Nunca é um segundo laço rodando o tempo todo.

---

## 7. Morte e cadáver

**StarCraft: 7 a 10 quadros, e UMA direção.** O bloco `Death` do Marine começa
com `setfldirect 0` — trava o rumo em zero — e então toca **quadros
consecutivos**, não múltiplos de 17. Medido:

| unidade | quadros de morte | direções | duração (`wait 2` cada, Fastest) |
|---|---|---|---|
| Marine | 8 | **1** | ≈ 0,67 s |
| Zealot, Dragoon, Zergling | 7 | 1 | ≈ 0,59 s |
| Hydralisk | 8 | 1 | ≈ 0,67 s |
| Ultralisk | 10 | 1 | ≈ 0,84 s |

O cadáver é outro sprite: `lowsprul 236` cria, por baixo de tudo, o sprite 236 =
`terran\tmaDeath.grp`, com `gfx_turns` desligado. O script dele, inteiro:
`playfram 0 / wait 50 / playfram 1 / wait 50 / playfram 2 / wait 50 / end`.
**Três quadros, uma direção, 150 ticks = 6,3 segundos**, e some.

**Age of Empires II: 30 a 60 quadros de morrer, e trinta segundos de cadáver.**
O morrer é 30×16 na infantaria, 45×16 no Cavaleiro e no Monge, 60 no cerco,
**120 no navio afundando**. O cadáver é uma unidade `_D` própria, com 30 quadros
a **um segundo cada**.

A diferença entre os dois é de orçamento, não de gosto: o StarCraft matou a
unidade em oito quadros e pôs o corpo num arquivo de três; o Age of Empires
gastou trinta quadros em dezesseis ângulos nas duas coisas.

---

## 8. O que o Definitive Edition e o Remastered refizeram

**Age of Empires II: Definitive Edition — refez tudo, e multiplicou por dez.**
Comparando o documentado do SLP com o medido no `.dat` da DE:

| | Age of Kings (1999) | Definitive Edition (2019) | multiplicador |
|---|---|---|---|
| quadros de uma animação de unidade | **10** | **30** (402 unidades andam com 30) | 3× |
| ângulos guardados | **5** (3 espelhados) | **16** (32 no Trabuco) | 3,2× |
| imagens desenhadas por animação | 10 × 5 = **50** | 30 × 16 = **480** | **9,6×** |
| formato | SLP | SMX / SLD, até 3 camadas (principal, sombra, contorno) | — |
| apodrecimento | SLP próprio de "decaying" por unidade | unidade de cadáver com 30 quadros a 1 s | — |

Fontes: [openage `slp-files.md`](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)
e [`smx-files.md`](https://github.com/SFTtech/openage/blob/master/doc/media/smx-files.md)
para os formatos; o resto medido no `empires2_x2_p1.dat`.

**StarCraft: Remastered — não acrescentou um quadro sequer.** Isto é verificável
e é o achado mais útil dos dois:

| fato | valor | evidência |
|---|---|---|
| entradas de sprite no `mainSD.anim` | **999** — as mesmas 999 de 1998 | [Animosity](https://github.com/neivv/animosity) |
| tabela de quadros do SD | "mainSD.anim's frame tables are the classic GRP frame tables **verbatim** (byte-identical offsets/sizes)" | [broodmap, `render-design.md`](https://github.com/ShieldBattery/broodmap/blob/master/docs/render-design.md) |
| escala | HD2 = 2×, HD = 4× o SD | Animosity |
| camadas por quadro | até **7** (difusa, cor de time, brilho, normal, especular, profundidade, emissiva) | Animosity |
| GRP original ainda em uso | sim, para decidir o pixel clicável: "The SD pixels are used even in HD mode" | Animosity |

O texto oficial da Blizzard fala só em resolução — *"updating the graphics to 4K
resolution"*
([Remastering StarCraft's Art](https://news.blizzard.com/en-us/article/20695698/remastering-starcrafts-art))
— e nenhuma contagem de quadros foi publicada. Sobre o pipeline de 1998, o
retrospecto diz que a equipe *"would render the models out to tiny little images
at each of the angles"*, limitada a quinze cores por modelo
([StarCraft's Wild Youth](https://news.blizzard.com/en-us/article/20719767/starcrafts-wild-youth-a-look-back-at-development)).

**A lição dos dois remasters, junta:** um deles multiplicou a arte por dez e o
outro multiplicou a **resolução** por quatro mantendo a contagem de quadros. Os
dois ficaram bons. O segundo custou uma fração do primeiro.

---

## O que serve para nós

### O que temos hoje, medido

`ls assets/unidades assets/inimigos` e a tabela `TIRAS` de
[`src/sprites.js:47`](../src/sprites.js): **89 peças** (49 de unidade, 40 de
invasor), 2,0 MB em `assets/`, e o arquivo único de `dist/` está em 2,75 MB — as
imagens são praticamente o arquivo inteiro. Cada peça nova custa ~10 a 13 KB em
disco e ~14 KB no arquivo offline.

O pedido falava em 13 unidades e 8 invasores; `data.js` tem **9 unidades**
(`operario, fuzileiro, trator, cao, incendiario, medico, lanceiro, drone,
tanque`) e **8 invasores**. Dezessete corpos, não vinte e um.

| corpo | base | andar | atacar | queda | morto | o que falta |
|---|---|---|---|---|---|---|
| operário | sim | **5 dir × 4 quadros** | — (minerar, 4 quadros) | 2 | 1 | nada urgente |
| fuzileiro | sim | — | 5 dir × **1** | 2 | 1 | 2ª pose de tiro |
| incendiário | sim | — | 5 dir × **1** | 2 | 1 | 2ª pose de tiro |
| lanceiro | sim | — | 5 dir × **1** | 2 | 1 | 2ª pose de tiro |
| médico | sim | — | — | 2 | 1 | nada urgente |
| drone | sim | — | — | 1 | 1 | nada urgente |
| tanque | sim | — | — | 1 | 1 | nada urgente |
| **cão de guerra** | sim | — | — | **0** | **0** | **morre e some** |
| **trator** | sim | — | — | **0** | **0** | **morre e some** |
| 8 invasores | sim | — | 3 dir × **1** | **0** | 1 | **queda** |

O que o desenho já resolve sem arte, em [`src/anima.js`](../src/anima.js):
perna recortada girando no quadril para os seis bípedes de `Anima.PERNAS:47`;
`Anima.GALOPE:71` para os sete quadrúpedes; respiração de dezessete ciclos por
minuto com fase tirada do id (`anima.js:295`); tombo calculado, coice do tiro,
tremida de dano; veículo que afunda em vez de tombar (`Anima.VEICULO:69`).
No desenho, `R.tiraDaDirecao` (`render2.js:511`) cobre direção faltante com a
vizinha, e `TEMPO_CADAVER = 26` (`render2.js:414`) guarda o corpo no chão.

**Confrontando com os números acima, nós já estamos acima do StarCraft em duas
coisas** — o parado do Zealot é um quadro e o nosso respira; o SCV não tem
caminhada e os nossos bípedes têm perna que gira. **E abaixo em duas**: a mordida
do tiro (o Marine tem 2 poses alternando, nós temos 1) e a queda (o Marine tem 8
quadros, metade dos nossos corpos não tem nenhum).

### Plano mínimo, em ordem

A unidade de custo é a **geração** — um pedido ao gerador. Medido no repositório:
uma folha humanoide de 5 direções sai em **1 geração**
(`arte/origem/fuzileiro-atirar.jpg`, 1024×559); uma tira de 4 quadros de **uma**
direção sai em 1 geração (grade 2×2, `andar-leste.jpg`, 513×1024); criatura e
veículo não aceitam folha e custam **1 geração por direção**
(`gerar-direcoes-uma-a-uma.sh`). A caminhada do operário custou **9 gerações para
5 direções entregues** — fator de refação medido de 1,8×.

| # | o que | por quê | peças | gerações (com refação) |
|---|---|---|---|---|
| **1** | `cao-caindo1`, `cao-morto`, `trator-caindo1`, `trator-morto` | são os únicos dois corpos que **somem no ar**. O StarCraft dá corpo até a quem explode (Firebat vira sprite de explosão) | 4 | 4 (≈7) |
| **2** | `<invasor>-caindo1` para os 8 | eles já têm `-morto`; falta o quadro do impacto. Uma direção só serve — o `Death` do Marine trava o rumo em zero (`setfldirect 0`) | 8 | 8 (≈14) |
| **3** | 2ª pose de tiro do fuzileiro, lanceiro e incendiário (folha de 5 direções, 1 geração cada) | o Marine alterna **duas** poses no `GndAttkRpt`; nós temos uma. E o quadro passa a sair do `recarga`, não do relógio — hoje `render2.js:610` usa `sim.t * 10`, que desamarra o quadro do disparo | 15 arquivos (5 dir × 3 soldados, virando tiras de n=2) | 3 (≈6) |
| **4** | `<invasor>-caindo2` para os 4 que mais aparecem (corredor, predador, cuspidor, detonador) | o meio do caminho da queda; só depois do item 2 e só se o item 2 se mostrar curto | 4 | 4 (≈7) |

**Total do plano mínimo: 15 gerações, ~27 com refação, 31 peças novas** —
uma alta de 35% no número de peças e ~+430 KB no arquivo offline (de 2,75 para
~3,2 MB). Os itens 1 e 2 sozinhos são 12 gerações e fecham o buraco mais visível
do jogo: corpo que desaparece no ar.

Mudanças de código que acompanham (nenhuma custa arte):

- `render2.js:610` — quadro de ataque pela fase do disparo (`u.recarga / arma.cad`),
  não por `sim.t * 10`. É o mesmo princípio do `frame_delay` do Genie (Arqueiro
  dispara no quadro 15 de 30) e do `attack25` do iscript, que fica no meio da
  sequência.
- `sprites.js:47` — as chaves de `-atirar-` passam de `1` para `2` quando as
  tiras novas entrarem.
- *Fidget* em `anima.js`: um giro curto a cada 50–60 s, que é o `replay_delay` do
  Age of Empires, ou 10% de chance a cada 3 s, que é o `randcondjmp 25` do
  Marine. **Custo zero de arte** — o Marine faz isso girando no lugar.

### O que NÃO vale a pena desenhar

- **Caminhada desenhada para bípede.** Já temos perna recortada em
  `R.caminhada` (`render2.js:654`), dirigida por distância percorrida. O SCV não
  tem caminhada nenhuma e é a unidade mais vista do StarCraft; o barco do Age of
  Empires anda com **1 quadro**. Gastar 5 gerações por soldado aqui compra pouco.
- **Caminhada desenhada para o quadrúpede.** `Anima.GALOPE` já dá salto, balanço
  e *squash*. É o que o `move 2,8,9,5,6,7,2` do Zergling faz com número em vez de
  desenho. Só reconsiderar se um bicho específico ficar visivelmente errado.
- **Parado animado.** Zealot, Zergling, Ultralisk e SCV: **um quadro**. Nossa
  respiração procedural já é mais do que eles têm.
- **Mais direções.** Cinco desenhadas mais espelho é exatamente o Age of Kings;
  três mais vizinhas cobrem o invasor (`VIZINHAS`, `render2.js:503`). Dezesseis
  ângulos é o que a Definitive Edition fez, e custou 9,6× a arte.
- **Morte por direção.** O `Death` do StarCraft é não-direcional por decisão de
  projeto. Um `-morto` mais espelho está certo.
- **Quadro para o canhão do tanque e da torre.** A torre do Siege Tank não tem
  **um** `playfram`: som mais clarão sobreposto. Nós já fazemos isso em
  `R.canhaoDeVeiculo`.
- **Apodrecimento desenhado quadro a quadro.** O Age of Kings desenhava; a
  Definitive Edition trocou por unidade de cadáver e o nosso sumiço por
  transparência já cobre. Se um dia incomodar, é um escurecimento no `ctx`, não
  arte.
- **Trinta quadros de qualquer coisa.** 30 × 16 = 480 imagens por animação por
  unidade é orçamento de estúdio, não nosso.

---

## Fontes

Medições próprias, reprodutíveis:
`empires2_x2_p1.dat` (`VER 7.7`, Definitive Edition) de
[cnordenb/dev_Age-of-Kings-1.0](https://github.com/cnordenb/dev_Age-of-Kings-1.0/tree/main/resources/_common/dat),
lido com [`genieutils-py`](https://pypi.org/project/genieutils-py/);
`iscript.bin`, `images.dat` e `sprites.dat` de
[andreas-volz/icecc](https://github.com/andreas-volz/icecc), lidos com o formato
de [PyMS](https://github.com/poiuyqwert/PyMS/blob/master/PyMS/FileFormats/IScriptBIN.py).

Documentação de formato e de motor:
[openage — SLP](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md),
[openage — SMX](https://github.com/SFTtech/openage/blob/master/doc/media/smx-files.md),
[openage — `graphic.py`](https://github.com/SFTtech/openage/blob/master/openage/convert/value_object/read/media/datfile/graphic.py),
[genieutils — `Graphic.h`](https://github.com/sandsmark/genieutils/blob/master/include/genie/dat/Graphic.h),
[OpenBW — `bwgame.h`](https://github.com/OpenBW/openbw/blob/master/bwgame.h),
[OpenBW — `data_types.h`](https://github.com/OpenBW/openbw/blob/master/data_types.h),
[StarEdit — GRP Image Format](https://wiki.staredit.net/wiki/GRP_Image_Format),
[StarEdit — IceCC Animations](https://wiki.staredit.net/wiki/IceCC_Animations),
[PyMS — `ImagesDAT.py`](https://github.com/poiuyqwert/PyMS/blob/master/PyMS/FileFormats/DAT/ImagesDAT.py),
[PyMS — `pygrp.txt`](https://github.com/poiuyqwert/PyMS/blob/master/Docs/pygrp.txt),
[irongrp](https://github.com/sjoblomj/irongrp),
[Animosity — formato `.anim` do Remastered](https://github.com/neivv/animosity),
[broodmap — `render-design.md`](https://github.com/ShieldBattery/broodmap/blob/master/docs/render-design.md),
[BWAPI — `setLocalSpeed`](https://bwapi.github.io/class_b_w_a_p_i_1_1_game.html),
[StarCraft Editing Bible, cap. 4](https://files.campaigncreations.org/misc/tutorials/starcraft/bible/chap4_ice_opcodes.shtml).

Blizzard:
[Remastering StarCraft's Art](https://news.blizzard.com/en-us/article/20695698/remastering-starcrafts-art),
[StarCraft's Wild Youth](https://news.blizzard.com/en-us/article/20719767/starcrafts-wild-youth-a-look-back-at-development).

Não encontrado, e fica registrado para ninguém procurar de novo: contagem de
quadros por unidade publicada pela Blizzard ou pela Microsoft; entrevista técnica
do Remastered com número de quadros; os binários `.grp` do StarCraft (os totais
da seção 2 são limites inferiores derivados do script); e uma cópia pública do
`.dat` do Age of Kings de 1999, que permitiria medir o clássico do mesmo jeito
que medimos a Definitive Edition.
