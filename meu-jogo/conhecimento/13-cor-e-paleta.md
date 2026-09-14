# Cor e paleta: como o Age of Empires II e o StarCraft resolveram

Os capítulos [01](01-pipeline-sprite-isometrico.md), [02](02-acabamento-2d.md) e
[03](03-animacao-2d-jogo.md) já cobrem o pipeline (quantas direções, que
formato), o acabamento (silhueta, redução, sombra de contato) e a animação. Este
aqui não repete: entra no que ficou de fora, que é a **decisão de cor**. Quantos
índices sobravam depois de reservar o time, por que a unidade não vira mancha
quando muda de cor, de que cor era a sombra de verdade, e o que os dois remasters
mudaram e recusaram mudar.

Onde diz **medido**, o número saiu de arquivo real — a paleta 50500 do Age of
Empires II baixada do repositório, ou os nossos próprios `assets/`.

---

## 1. Os 256 índices, e quantos sobravam

**A mecânica.** A paleta é um arquivo de texto JASC Paint Shop Pro: cabeçalho
`JASC-PAL`, versão, número de entradas, e depois uma linha `r g b` por cor. "As
cores da paleta são referenciadas nos arquivos SLP com um índice. O índice se
refere a uma linha da paleta" — linha 3 é o índice 0
([openage/slp-files](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
No Age of Empires a paleta mora dentro do `interfac.drs` e **a arte de jogo usa a
de id 50500** — uma só, para tudo.

**Medição da 50500 real** (arquivo
[`50500.pal`](https://github.com/JanWichelmann/TechTreeEditor/blob/master/TechTreeEditor/Resources/50500.pal),
extraído do jogo):

| medida | valor |
|---|---|
| entradas | 256 |
| cores distintas | 253 (3 repetidas) |
| índices travados em cor de time | **64** (8 jogadores × 8 degraus) |
| índice 252 | `255 0 255` — o magenta de recorte |
| sobra para todo o resto | **191** |

Cento e noventa e um índices para terreno, prédio, unidade, fogo, água, fonte e
interface — **do jogo inteiro**, não por peça. É esse o orçamento real com que os
artistas da Ensemble trabalhavam.

**O StarCraft dividiu o problema de outro jeito: uma paleta por cenário.** O
OpenBW — reimplementação que lê os arquivos originais — carrega
`Tileset/<nome>.wpe` para cada um dos **oito** cenários (`badlands`, `platform`,
`install`, `AshWorld`, `Jungle`, `Desert`, `Ice`, `Twilight`) e verifica
`wpe.size() != 256 * 4`: 256 entradas RGBA, por cenário
([openbw/ui.h, l. 185-246 e 2030-2040](https://github.com/OpenBW/openbw/blob/master/ui/ui.h)).
A consequência é a que interessa: **a unidade é desenhada na paleta do terreno**.
O mesmo índice do GRP do fuzileiro vira uma cor no `Jungle` e outra no `Desert`.
Não havia "paleta da unidade" separada da paleta do chão — havia uma só, e o
terreno chegava primeiro.

**O que os formatos guardavam além dos pixels.**

- **SLP** (Age of Empires): por quadro, uma `slp_frame_info` com deslocamento da
  tabela de comandos, deslocamento da **tabela de bordas**, largura, altura e o
  **ponto de ancoragem** (`hotspot_x`, `hotspot_y`) — o ponto do sprite que
  encosta no chão. Transparência não é cor: é comando de pular N pixels. E há
  comandos que não desenham pixel nenhum e sim *intenção*: `0x06` cor de
  jogador, `0x4E` contorno, `0x0B` sombra
  ([openage/slp-files](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
- **SMX/SMP** (Definitive Edition): o quadro virou um **campo de bits de
  camadas** — bit 7 gráfico principal, bit 6 sombra, bit 5 contorno, bit 3 "as
  sombras de outras animações caem sobre esta"; e cada pixel guarda ainda um
  **modificador de dano** de 16 bits, usado para escurecer o prédio conforme ele
  perde vida
  ([openage/smx-files](https://github.com/SFTtech/openage/blob/master/doc/media/smx-files.md),
  [smp-files](https://github.com/SFTtech/openage/blob/master/doc/media/smp-files.md)).
- **GRP** (StarCraft): o pixel é índice puro; o que o motor sabe sobre a imagem
  está **fora** dela, no `images.dat` — qual GRP usar, qual sombra, e o
  *modificador de desenho* que decide se aquele gráfico é cor de time, sombra,
  brilho, distorção ou camuflagem (os ramos `image->modifier` em
  [openbw/ui.h, l. 917-975](https://github.com/OpenBW/openbw/blob/master/ui/ui.h)).

---

## 2. Cor de time: um índice, não um pixel

**Age of Empires.** O comando `0x06` não escreve cor: escreve um índice
*relativo*. "O índice real da paleta é `player_color_palette_index + player * 16`,
onde `player` é o id do jogador (1-8)." E as posições são fixas: "no AoK e SWGB,
as cores azuis do jogador começam no índice 16 da paleta, vermelho no 32, verde
no 48, amarelo no 64, laranja no 80, ciano no 96, roxo no 112 e cinza no 128"
([openage/slp-files](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
Dentro de cada bloco de 16, só os **8 primeiros** são a rampa de time ("índices
entre 0x00, o mais escuro, e 0x07, o mais claro").

Medido na 50500 real, os oito degraus de cada time, em luminância
(0,2126·R + 0,7152·G + 0,0722·B):

| time | degrau 1 → 8 |
|---|---|
| azul | 6 · 24 · 51 · 90 · 117 · 159 · 198 · 241 |
| vermelho | 14 · 30 · 49 · 57 · 54 · 133 · 180 · 227 |
| verde | 0 · 5 · 23 · 42 · 62 · 82 · 101 · 121 |
| amarelo | 55 · 86 · 129 · 197 · 234 · 244 · 249 · 253 |
| laranja | 40 · 58 · 84 · 111 · 147 · 184 · 210 · 234 |
| ciano | 13 · 29 · 63 · 94 · 134 · 180 · 217 · 238 |
| roxo | 13 · 22 · 46 · 81 · 101 · 145 · 193 · 223 |
| cinza | 28 · 67 · 106 · 145 · 185 · 223 · 247 · 255 |

**É por isso que a unidade continua legível quando muda de cor.** Não é o matiz
que carrega a leitura: é a **escada de valor**. Seis das oito rampas sobem do
quase-preto ao quase-branco em oito passos, então trocar o time troca o matiz e
mantém a distribuição de claro e escuro do sprite. O artista pintou a unidade uma
vez, com sombra e luz *nos índices*, e o motor só reescreve qual cor cada degrau
significa. E a medição também mostra o preço disso: **o verde vai só até 121** e
o amarelo já está em 234 no quarto degrau — dois times com a mesma peça têm
contraste bem diferente contra o mesmo chão. Rampa mal calibrada é desvantagem de
jogo, não detalhe de arte.

**StarCraft.** A regra está em uma linha do desenho de sprite: os índices
`>= 8 && < 16` do GRP são substituídos pela cor do jogador; todo o resto passa
intocado ([openbw/ui.h, l. 919-923](https://github.com/OpenBW/openbw/blob/master/ui/ui.h)).
São **oito índices — 8 a 15 —, e só eles.** A tabela de substituição vem de
`game/tunit.pcx`, que o motor exige que seja **128×1 pixels**: 16 cores de
jogador × 8 índices cada (l. 159-165). Os irmãos menores da mesma ideia:
`tminimap.pcx` é 16×1 — um índice por jogador para o ponto no minimapa — e
`tselect.pcx` é 24×1, para o círculo de seleção.

Ou seja: das 256 cores de um cenário do StarCraft, **exatamente 8 pertencem ao
time**. O resto da unidade é cinza, metal e sombra — deliberadamente neutro, para
que os 8 índices coloridos sejam a única coisa saturada no corpo dela.

**Como os remasters resolveram sem paleta indexada — e são respostas opostas.**

- **Age of Empires II: Definitive Edition não abandonou o índice; escalou.** O
  SMP/SMX continua com comando `Playercolor Draw` e o pixel guarda *índice da
  paleta + número da paleta + seção*; as paletas agora têm **1024 cores** e há
  várias, escolhidas por pixel
  ([openage/smp-files](https://github.com/SFTtech/openage/blob/master/doc/media/smp-files.md)).
  O contorno também continua sendo índice, não desenho: "arquivos SMP não
  especificam uma cor de paleta para contornos" — ele é pintado na cor do
  jogador.
- **StarCraft: Remastered trocou índice por máscara.** O formato `.anim` tem até
  sete camadas de textura — `diffuse`, `teamcolor`, `bright`, `normal`,
  `specular`, `ao_depth`, `emissive` — e a cor de time virou uma textura de
  máscara multiplicada: "um pixel branco `#ffffff` na base resulta na cor de time
  aplicada sem alteração; `#00ff80` não aplicaria nada do canal vermelho, o verde
  inteiro e o azul a 50%" ([animosity](https://github.com/neivv/animosity)). O
  efeito colateral foi notado pelos modders: "no 1.16.1 os jogadores têm 8 cores
  separadas para remapear; no SC:R eles usam só a primeira cor definida e
  preenchem o resto automaticamente com cores fora da paleta"
  ([StarEdit](http://www.staredit.net/371125/)). A escada de oito degraus
  pintada à mão virou um degradê calculado.

---

## 3. Sombra: qual cor, e por que era quadro separado

Nenhum dos dois pintava sombra preta por cima. Os dois **escureciam o que já
estava embaixo**.

**Age of Empires, SLP até a versão 3.0.** O comando `0x0B` marca "um bloco de
pixels de sombra. Os pixels que estão por baixo destes são identificados dentro
de uma *paleta de sombra* e usados para desenhar no buffer. A paleta de sombra é
essencialmente uma variação escurecida da paleta do gráfico (50500)"
([openage/slp-files](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
Sombra, ali, é uma **tabela de escurecimento** — o chão de terra continua terra,
só mais escuro. Não é preto, e não é uma camada translúcida: é uma segunda
paleta.

**Onde a sombra ficava guardada.** "Até o SLP v3.0, unidades móveis guardam a
sombra no mesmo quadro do gráfico principal, mas prédios e outros objetos têm a
sombra em SLPs separados. Desde a versão 4.0, as sombras ficam em **quadros
separados dentro do mesmo arquivo**." Na Definitive Edition virou **camada** do
quadro (bit 6 do `frame_type`), e — detalhe que fecha a pergunta — a camada de
sombra do SMP é "um array de `pixel_count * 4` bytes preenchido com **valores de
alfa de 1 byte**"
([smp-files](https://github.com/SFTtech/openage/blob/master/doc/media/smp-files.md)).
Sem cor nenhuma. A sombra moderna do Age of Empires é alfa puro.

**StarCraft.** O modificador de desenho 10 é a sombra, e o código é uma tabela de
consulta que **ignora o pixel do sprite**:

```cpp
} else if (image->modifier == 10) {
  uint8_t* ptr = &tileset_img.dark_pcx.data[256 * 18];
  auto shadow = [ptr](uint8_t, uint8_t old_value) { return ptr[old_value]; };
```
([openbw/ui.h, l. 953-957](https://github.com/OpenBW/openbw/blob/master/ui/ui.h))

O primeiro argumento — o pixel da sombra — é descartado; o que entra na tabela é
`old_value`, a cor **que já estava na tela**. O `dark.pcx` é 256×32 (l. 235-236):
32 níveis de escurecimento para os 256 índices, **por cenário**. A sombra usa a
linha 18. Resultado: a sombra do StarCraft tem a cor do chão do cenário,
escurecida — verde escuro na selva, ocre escuro no deserto. **Nunca preto puro, e
nunca a mesma cor em dois cenários.**

**Por que quadro separado, em ambos.** Porque sombra que vem colada na figura
congela a direção da luz, não pode ser escurecida ou espalhada à parte, e — no
nosso caso, que recorta por fundo chapado — entra na máscara e suja o corte (o
`arte/LEIA.md` já proíbe sombra projetada no render por esse motivo). No pipeline
de arte da comunidade do Age of Empires isso vira uma regra de rig: "nenhuma das
luzes lança sombra, **exceto o sol, que só lança sombra e nenhuma luz** — porque
o sol lança uma sombra muito forte no plano do chão, necessária para se ter uma
sombra preta de chão"
([AoKH, tutorial de câmera e iluminação](http://aok.heavengames.com/cgi-bin/forums/display.cgi?action=ct&f=26,42291,,10)).
A sombra sai em passada própria, preta, sobre o plano de chão — e só depois o
motor decide como escurecê-la.

---

## 4. Contraste: como a figura não some no chão

**O caso documentado, e é do StarCraft.** No material de bastidores do
Remastered, o problema de visibilidade aparece nomeado: "um desafio específico
envolvia os cenários: mapas de deserto tinham problema de balanço de cor, em que
as cores de time laranja se misturavam ao terreno laranja, causando problema de
visibilidade das unidades"
([Blizzard](https://news.blizzard.com/en-us/article/20726732/behind-the-scenes-of-starcraft-remastered)).
Vinte anos de jogo profissional e o defeito continuava lá: **matiz do time igual
ao matiz do chão apaga a unidade**, mesmo com silhueta boa.

**O dispositivo que os dois usam contra isso é o contorno, e ele é de motor, não
de arte.** No SLP, o comando `0x4E`: "`palette_index = player_index = player *
16`; se obstruído, desenha a cor do jogador, senão transparente. É o contorno de
cor de jogador que você vê quando a unidade está atrás de um prédio"
([openage/slp-files](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
Na Definitive Edition o contorno virou **camada própria do quadro** (bit 5),
guardada sem compressão e desenhada na cor do jogador
([smx-files](https://github.com/SFTtech/openage/blob/master/doc/media/smx-files.md)).
Vinte anos e três formatos depois, o contorno continua sendo camada de primeira
classe — não um efeito ligado por opção.

**E o valor é a régua, não o matiz.** A rampa medida na seção 2 é a prova em
dados: o que a paleta reserva por time são oito **degraus de luminância**, do
quase-preto ao quase-branco. O matiz muda; a escada não. Quem pinta a unidade
está pintando um mapa de valores, e o time é só a tinta que cai nele.

**O que os dois recusaram mexer.** No Age of Empires II: DE, "queríamos ter
certeza de que você ainda reconhecesse aquela unidade como um camelo, 20 anos
depois", extrapolando o pixel art original para cima em vez de redesenhar
([Game Developer](https://www.gamedeveloper.com/design/rebuilding-a-classic-in-i-age-of-empires-ii-definitive-edition-i-)).
No StarCraft: Remastered, o artista Brian Sousa manteve as silhuetas originais
intactas — "o fato de as pessoas *não conseguirem* perceber a diferença me mostra
que fizemos nosso trabalho certo"
([Blizzard](https://news.blizzard.com/en-us/article/20726732/behind-the-scenes-of-starcraft-remastered)).
Nos dois, a silhueta é património; a cor é o que se pode mexer.

**A régua numérica que este capítulo adota.** Os clássicos não publicaram um
número de contraste. A norma de acessibilidade publica: um objeto gráfico
precisa de **3:1** contra o que está do lado para ser distinguível
([WCAG 2.1, Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)).
É o piso que vamos usar para medir a nossa arte na última seção — não porque o
Age of Empires o usava, mas porque é a única régua verificável que existe.

---

## 5. Direção da luz: uma só, e é do jogo

O rig que a comunidade do Age of Empires padronizou para produzir gráficos novos
compatíveis com os antigos é um **arquivo único, distribuído pronto**
(`basic_setup_v0.1.blend`), e o autor pede explicitamente que ninguém o refaça do
zero. A configuração
([AoKH](http://aok.heavengames.com/cgi-bin/forums/display.cgi?action=ct&f=26,42291,,10)):

- **Câmera:** ortográfica, valor 11,5; rotação `x:60° y:0° z:-135°`; posição
  `x:-12 y:12 z:10`. (O autor anota que "alguns dizem que é 59° no eixo x, mas
  não faz muita diferença".)
- **Luzes:** quatro. Spot atrás (energia 2,0; 52° para baixo); spot à esquerda
  (1,8; 58°; **só difusa**); sol à frente (2,0; **20° para baixo; só sombras**);
  point à frente (7,0; 25°). Quinta opcional, de interior, área amarelo/laranja.
- **Regra:** "um erro comum entre modeladores iniciantes é sobrecarregar a cena
  de luzes. Para ter uma cena 3D mais realista e bonita, é muito importante
  mostrar contraste forte entre luz e sombra. Então mantenha o número de luzes no
  mínimo."

O que importa aqui não é o grau de cada luz: é que **é um rig só, salvo em
arquivo, reusado em cada peça**. A luz não é escolha da peça — é constante do
jogo. Peça com luz própria entra na cena como corpo estranho, e nenhum acabamento
2D conserta isso depois.

---

## 6. O que os remasters mudaram em cor — e o que recusaram

**StarCraft: Remastered.**

| mudou | manteve |
|---|---|
| Efeitos: os originais eram "só quatro cores!"; as explosões passaram a usar "todas as cores que a gente tem" ([Blizzard](https://news.blizzard.com/en-us/article/20726732/behind-the-scenes-of-starcraft-remastered)) | As **silhueta**s das unidades, intocadas de propósito (mesma fonte) |
| Corrigiu o balanço de cor dos cenários de deserto, onde a cor de time laranja sumia no chão laranja (mesma fonte) | A possibilidade de **desligar** quase todos os efeitos novos e voltar ao original (mesma fonte) |
| Cor de time: de 8 índices de paleta para **máscara de textura** multiplicada ([animosity](https://github.com/neivv/animosity)) | — e com isso perdeu os 8 tons definidos à mão: passou a usar "só a primeira cor definida" e gerar o resto ([StarEdit](http://www.staredit.net/371125/)) |

**Age of Empires II: Definitive Edition.**

| mudou | manteve |
|---|---|
| Resolução: sprites de ~100 px de altura refeitos com ~**4× de fidelidade**, tudo do zero ([Game Developer](https://www.gamedeveloper.com/design/rebuilding-a-classic-in-i-age-of-empires-ii-definitive-edition-i-)) | **Continua 2D**: "muita gente acha que agora é 3D, mas são sprites 2D porque queríamos mesmo manter aquela sensação antiga" (mesma fonte) |
| Paletas de **1024 cores**, várias, escolhidas por pixel (número + seção) ([smp-files](https://github.com/SFTtech/openage/blob/master/doc/media/smp-files.md)) | **A indexação por paleta em si** — o pixel ainda é índice, a cor de time ainda é comando de desenho, o contorno ainda é cor de jogador |
| Sombra virou camada de **alfa de 1 byte**, e cada pixel ganhou modificador de dano (mesma fonte) | Sombra e contorno como **camadas separadas** do quadro, como em 1999 |

A linha comum: **os dois trocaram o encanamento e recusaram trocar a leitura.**
Silhueta, contorno e sombra atravessaram os vinte anos inteiros.

---

## O QUE SERVE PARA NÓS

Medido em 14/09/2026, sobre `assets/` de verdade (110 peças: 49 unidades, 40
inimigos, 21 estruturas), com o chão de referência `assets/cenario/chao-pavimento.webp`.
O script está no fim da seção.

### Onde estamos fora do que os clássicos faziam

| # | medida nossa | clássicos | onde está no código |
|---|---|---|---|
| 1 | **442.160 cores distintas** em `assets/` | 256 no jogo inteiro (AoE2), 256 por cenário (SC) | sem paleta comum; `arte/ferramentas/polir-sprite.sh` não remapeia |
| 2 | Contraste médio da figura contra o chão: **1,68:1** unidades, **1,45:1** inimigos, **1,30:1** estruturas | piso verificável 3:1 ([WCAG](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)) | `assets/` + `src/render.js:28-35` (`PALETAS`) |
| 3 | **18 de 21 estruturas** abaixo de 1,5:1. Piores: `bastiao` 1,02 · `muro` 1,03 · `radar` 1,05 | — | `src/render2.js:38-49` — `spriteNaFundacao` chama `ctx.drawImage` **direto**: estrutura não tem contorno nem sombra |
| 4 | **19 de 40 inimigos** abaixo de 1,5:1. Piores: `cuspidor-atacar-leste` 1,02 · `corredor-atacar-sudeste` 1,04 | o caso do deserto laranja do SC:R | matiz dominante do inimigo **0-30°** (vermelho/laranja) contra chão de matiz **51°** — vizinhos na roda |
| 5 | Luz medida peça a peça (centroide dos 15% pixels mais claros): **69 de 110 peças têm o brilho à DIREITA**, 23 à esquerda | um rig só, em arquivo, para todas as peças ([AoKH](http://aok.heavengames.com/cgi-bin/forums/display.cgi?action=ct&f=26,42291,,10)) | 45 de 56 prompts pedem "luz de cima e da esquerda" (`arte/prompts/`); `src/render2.js:379-392` deita a sombra assumindo luz da esquerda; `src/render2.js:81-82` sombreia a face **esquerda** a 0,6 e a **direita** a 0,86, e `src/render.js:1016` faz o mesmo com 0,55 e 0,76 — ou seja, o código geométrico ilumina pela **direita** |
| 6 | Média de **14-20% dos pixels** de cada peça a menos de 15 de luminância do chão; pior peça: **80%** | — | consequência de 2 e 4 |
| 7 | Sombra: `src/render2.js:342-357` pinta a silhueta de **`#000` puro** a alfa 0,46 | AoE2 ≤3.0 e SC escurecem **a cor do chão** por tabela; AoE2:DE usa alfa puro | o nosso é o caminho do DE — está certo, mas a inclinação assume a luz errada (item 5) |
| 8 | Cor de time: **não existe**. Amigo × inimigo é pasta (`unidades/` × `inimigos/`) e ponto de minimapa (`src/render2.js:1363`) | 64 índices (AoE2), 8 índices (SC) | aceitável em jogo só contra a máquina; o custo aparece se algum dia houver dois lados humanos |

O que já está **igual aos clássicos** e não precisa mexer: o contorno de silhueta
desenhado no tamanho de tela (`src/render2.js:292-322`, `#0c0f14`, oito
deslocamentos) é exatamente o `0x4E` do SLP e a camada de contorno do SMX; e a
sombra em camada própria, calculada, é o caminho do Definitive Edition.

### Os três ajustes de maior efeito

**1. Passar a estrutura pelo contorno e pela sombra que as unidades já usam.**
`spriteNaFundacao` (`src/render2.js:38-49`) desenha os 21 sprites de estrutura com
`ctx.drawImage` cru; `imagemComSilhueta` e `sombraDeSprite` existem a 350 linhas
dali e nunca são chamados para prédio. É o item com pior contraste medido (1,30:1,
18 de 21 abaixo de 1,5:1) e o de menor custo: duas chamadas, zero arte nova.
*Medição que confirma:* rodar o script abaixo compondo a peça **já com o contorno**
sobre o chão e recontar quantas das 21 ficam abaixo de 1,5:1 — a meta é zero, e o
contraste do contorno `#0c0f14` contra `chao-pavimento` é 4,24:1 (medido), então ele sozinho
resolve a borda. Visualmente: `node build.cjs`, abrir e comparar a mesma base
antes e depois no mesmo enquadramento.

**2. Resolver a direção da luz — escolher uma e valer para tudo.** Hoje três
lugares discordam: o prompt pede esquerda, `sombraDeSprite` deita a mancha para a
direita *porque* acha que a luz vem da esquerda, e `desenharEstrutura` escurece a
face esquerda (0,6) e clareia a direita (0,86), que é luz da direita. A medição
diz que a arte gerada seguiu a direita em 69 de 110 peças — o prompt não pegou. O
caminho barato é **adotar a direita** (é o que a maioria da arte já tem e o que o
código geométrico já faz) e corrigir os dois lugares que assumem esquerda; o caro
é regerar 110 peças. *Medição que confirma:* o mesmo script, campo `deslocamento
do brilho`; a meta é 90% ou mais das peças do mesmo lado, e os comentários de
`render2.js:379-392` e `src/data.js`/`prompts` batendo com esse lado.

**3. Abrir o vão de valor entre figura e chão — pelo chão.** O chão medido tem
L≈116 (textura) e as cores de `PALETAS` vão de L=123 a L=170 na rua do deserto;
as figuras têm L≈75-105. O vão é pequeno demais dos dois lados, e mexer em 110
peças de arte é caro enquanto mexer em `src/render.js:28-35` são seis linhas.
Escurecer e dessaturar o chão (a `rua` do deserto em L=170 é o pior caso) empurra
o contraste para cima em todas as peças de uma vez, e aproxima o nosso terreno do
padrão dos clássicos, em que o chão é o elemento mais neutro da tela. O inimigo
tem um problema extra de **matiz**: 38% dos pixels dele estão em 0-30°, vizinhos
do chão em 51° — é literalmente o deserto laranja do StarCraft.
*Medição que confirma:* rodar o script antes e depois; a meta é contraste médio
≥2,0:1 por grupo, nenhuma peça abaixo de 1,3:1, e a fração de pixels "a menos de
15 de luminância do chão" cair de 14-20% para menos de 10%. **E rodar
`node tests/aceitacao.cjs` (28/28) e `node tests/equilibrio.cjs`** — cor não
muda regra, então qualquer mudança neles é bug em outro lugar.

### O script da medição

Não altera nada; só lê `assets/`. Guardar em `arte/ferramentas/` quando for usado
de verdade.

```python
from PIL import Image
import glob, os, statistics as st, colorsys

def srgbL(r, g, b):
    def f(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def contraste(a, b):
    a, b = max(a, b), min(a, b)
    return (a + 0.05) / (b + 0.05)          # WCAG 2.1

im = Image.open('assets/cenario/chao-pavimento.webp').convert('RGB')
p = im.load()
chao = st.mean([srgbL(*p[x, y]) for y in range(0, im.size[1], 2)
                                for x in range(0, im.size[0], 2)])

for grupo in ('unidades', 'inimigos', 'estruturas'):
    linhas = []
    for f in sorted(glob.glob(f'assets/{grupo}/*.webp')):
        im = Image.open(f).convert('RGBA'); p = im.load(); w, h = im.size
        vis = [(srgbL(r, g, b), x) for y in range(h) for x in range(w)
               for (r, g, b, a) in [p[x, y]] if a >= 128]
        if not vis: continue
        vis.sort()
        rel = st.mean([v[0] for v in vis])
        topo = vis[int(len(vis) * 0.85):]        # 15% mais claros
        luz = (st.mean([v[1] for v in topo]) - st.mean([v[1] for v in vis])) / w
        linhas.append((os.path.basename(f), contraste(rel, chao), luz))
    cs = [c for _, c, _ in linhas]
    print(f'{grupo}: contraste medio {st.mean(cs):.2f}:1 | '
          f'abaixo de 1,5:1 = {sum(1 for c in cs if c < 1.5)}/{len(cs)} | '
          f'brilho a direita = {sum(1 for _, _, l in linhas if l > 0.02)}/{len(linhas)}')
    for nome, c, _ in sorted(linhas, key=lambda t: t[1])[:5]:
        print(f'   {nome:34s} {c:.2f}:1')
```

---

## Fontes

- [openage — formato SLP](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)
  (paleta 50500, comandos `0x06` cor de jogador, `0x4E` contorno, `0x0B` sombra)
- [openage — formato SMX](https://github.com/SFTtech/openage/blob/master/doc/media/smx-files.md)
  (camadas de gráfico, sombra e contorno na Definitive Edition)
- [openage — formato SMP](https://github.com/SFTtech/openage/blob/master/doc/media/smp-files.md)
  (paletas de 1024 cores, sombra em alfa de 1 byte, modificador de dano)
- [OpenBW — `ui/ui.h`](https://github.com/OpenBW/openbw/blob/master/ui/ui.h)
  (paleta `.wpe` por cenário, `tunit.pcx` 128×1, cor de time nos índices 8-15,
  sombra pelo `dark.pcx`)
- [Blizzard — *Behind the Scenes of StarCraft: Remastered*](https://news.blizzard.com/en-us/article/20726732/behind-the-scenes-of-starcraft-remastered)
- [Game Developer — *Rebuilding a classic in Age of Empires II: Definitive Edition*](https://www.gamedeveloper.com/design/rebuilding-a-classic-in-i-age-of-empires-ii-definitive-edition-i-)
- [AoK Heaven — *Blender 3D modeling ~ 1. Camera and Lighting Setup*](http://aok.heavengames.com/cgi-bin/forums/display.cgi?action=ct&f=26,42291,,10)
- [animosity — camadas do formato `.anim` do StarCraft: Remastered](https://github.com/neivv/animosity)
- [StarEdit — cor de time por `tunit.pcx`, e o que mudou no SC:R](http://www.staredit.net/371125/)
- [W3C — WCAG 2.1, *Non-text Contrast* (3:1)](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html)
- [Paleta 50500 do Age of Empires II, arquivo medido](https://github.com/JanWichelmann/TechTreeEditor/blob/master/TechTreeEditor/Resources/50500.pal)
