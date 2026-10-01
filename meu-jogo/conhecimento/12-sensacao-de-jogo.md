# 12 — Sensação de jogo: por que StarCraft e Age of Empires são gostosos de jogar

Este capítulo não é sobre quantas unidades cada jogo tinha. É sobre a camada que
ninguém lista na caixa e todo mundo sente em dez segundos de partida: **quanto
tempo a unidade demora para obedecer, quanto pesa cada golpe, e o que dá para ler
com a tela cheia.**

Regra de escrita da pasta: afirmação técnica vem com fonte. Aqui vale duas vezes,
porque "sensação" é o assunto em que mais se inventa. Tudo abaixo tem link ou é
medição feita no nosso próprio código, e nesse caso está dito onde.

Fonte curiosa e recorrente: os números duros do StarCraft não saem de wiki
nenhuma neste capítulo — saem das tabelas que a **BWAPI** extrai do jogo
(`UnitType.cpp`, `WeaponType.cpp`), que são as mesmas que o executável usa.

---

## 1. Resposta ao comando: o clique e a obediência

### 1.1 O número que a indústria mediu

O texto de referência é o postmortem técnico de rede do Age of Empires, escrito
por **Mark Terrano e Paul Bettner**
([*1500 Archers on a 28.8*, Game Developer](https://www.gamedeveloper.com/programming/1500-archers-on-a-28-8-network-programming-in-age-of-empires-and-beyond)).
Eles mediram com jogadores o que é tolerável:

- > "For RTS games, 250 milliseconds of command latency was not even noticed"
- > "between 250 and 500 msec was very playable"
- > "beyond 500 it started to be noticeable"

E a descoberta que importa mais que o número:

- > "A consistent slower response was better than alternating between fast and
  > slow command latency... one that varied was considered 'jerky'"

**Constância ganha de velocidade.** Um atraso de 300 ms sempre igual some da
percepção; um atraso que oscila entre 80 e 300 ms é sentido como jogo quebrado,
mesmo sendo mais rápido em média.

Isso conversa com o limite clássico de interface de
[Jakob Nielsen (1993)](https://www.nngroup.com/articles/response-times-3-important-limits/):
**0,1 s** é "the limit for having the user feel that the system is reacting
instantaneously"; **1,0 s** é o limite para o pensamento não se interromper. O RTS
vive no meio: acima dos 100 ms do "instantâneo", muito abaixo do 1 s do
"perceptível como espera".

### 1.2 Como o Age of Empires viveu com passo fixo

O Age of Empires roda em **lockstep determinístico**: todas as máquinas executam
a mesma simulação, e só os comandos trafegam. O mesmo artigo:

- > "Turns were typically 200 msec in length, with commands being sent out during
  > the turn."
- > "commands issued during turn 1000 would be scheduled for execution during
  > turn 1002"
- > "The game's outcome depended on all of the users executing exactly the same
  > simulation"
- > "Comm. turns were separated in AoE from actual rendering frames."

Ou seja: **até 400 ms entre o clique e a ordem virar estado**, e o desenho
continua a 30/60 quadros enquanto isso. O jogo não trava esperando a rede — ele
desenha, anima e só *depois* aplica.

Por que isso não foi feito de outro jeito? Porque a alternativa não cabia na
banda da época:

- > "Just passing X and Y coordinates, status, action, facing and damage
  > would... limit us to 250 moving units in the game at the most."

E os autores registram o que o jogador faz com esse atraso — ele **aprende**:

- > players developed "a mental expectation of the lag between when they clicked
  > and when their unit responded"

Há ainda um dado de ritmo de entrada que serve de orçamento de projeto: os
jogadores davam comando **a cada 1,5 a 2 segundos**, com picos de **3 a 4
comandos por segundo** em combate.

### 1.3 O passo do StarCraft

O StarCraft não tem "turno de comunicação" de 200 ms — ele tem **tick**. Na
velocidade *Fastest*, um tick dura **42 ms** (≈ 23,8 Hz), e um "segundo de jogo"
interno são 16 ticks, o que faz o *Fastest* rodar a cerca de **1,5× o tempo real**
([Staredit Network Wiki, *Game speed*](https://wiki.staredit.net/wiki/Game_speed)).

Toda duração do jogo é contada em quadros, não em segundos. A ficha do
[Nuclear Missile no mesmo wiki](https://wiki.staredit.net/wiki/Nuclear_Missile)
mostra a conversão que o próprio projeto usava: **"Build time: 1500 frames -
62.5 seconds"** — 24 quadros por segundo, redondos.

Em partida local isso significa que a ordem vira estado no tick seguinte: **≤ 42
ms**. Em rede, o StarCraft empilha turnos de latência por cima disso. É por isso
que a mesma partida "parece mais dura" na rede que sozinha, com exatamente as
mesmas unidades.

### 1.4 O que os dois faziam para a ordem parecer instantânea

Nenhum dos dois esconde o atraso com truque de física. Os dois fazem a mesma
coisa, e ela é de interface:

1. **Responder na hora, mesmo que a ação não tenha acontecido.** O manual do
   StarCraft descreve a recusa como resposta imediata e escrita na tela: ao
   tentar treinar sem suprimento, *"the message **Not Enough Supplies… Build More
   Supply Depots** will display directly on the Main Screen"*
   ([manual original, Blizzard, 1998](https://archive.org/details/manual_Starcraft) —
   [texto](https://archive.org/download/manual_Starcraft/Starcraft_djvu.txt)).
   A página de comandos da Blizzard repete o padrão para ordem impossível: se a
   unidade não pode atacar aquele alvo, *"you will receive a message indicating
   that problem to you"*
   ([StarCraft Compendium — Unit Commands](https://classic.battle.net/scc/gs/com.shtml)).
   O jogo **sempre responde**; às vezes a resposta é "não".

2. **Separar o relógio do desenho do relógio da simulação**, que é a frase do
   artigo do AoE citada acima. A animação nunca espera a lógica.

3. **Aceitar o atraso e mantê-lo constante**, em vez de caçar milissegundos.

**A lição, ao contrário do que se espera:** o RTS clássico não é gostoso por ser
rápido a responder. Ele responde entre 42 e 400 ms — muito acima dos 100 ms do
"instantâneo" de Nielsen. É gostoso porque a resposta é *previsível* e porque
**existe sempre uma resposta**, ainda que seja uma mensagem de recusa.

---

## 2. Qualidade da movimentação: unidade que empurra unidade

### 2.1 O que o StarCraft realmente faz

Primeiro, o fato que desmonta a lenda de que "a movimentação do StarCraft é
genial". O programador do jogo, **Patrick Wyatt**, publicou o que ele mesmo chama
de gambiarra ([*The StarCraft path-finding hack*](https://www.codeofhonor.com/blog/the-starcraft-path-finding-hack/)):

> "Players want to max-out the number of harvesters working on each mineral
> deposit to maximize their cash flow. Those harvesters are commuting between the
> minerals and their base so they're constantly running headlong into other
> harvesters traveling in the opposite direction."

A solução:

> "Whenever harvesters are on their way to get minerals, or when they're on the
> way back carrying those minerals, **they ignore collisions with other harvesters
> in the same state**."

E como se enxerga o truque:

> "It's possible to notice this behavior by selecting a large group of harvesters
> who are working a plot of crystals and telling them to halt. They immediately
> spread out to find tiles that aren't occupied by other harvesters."

Isto é: **a colisão entre coletores foi desligada de propósito**, e a única razão
pela qual ninguém repara é que eles se reorganizam assim que param. Wyatt é
explícito sobre o motivo — não havia tempo de reescrever o motor de terreno:
*"it was inconceivable that there was enough time to re-engineer the terrain
engine"*.

A frase mais citada dele, reproduzida tanto no verbete da Wikipédia quanto no
ensaio do TeamLiquid, fecha o assunto:

> "To handle all the tricky edge-cases, the path[find]ing code exploded into a
> gigantic state machine which encoded all sorts of specialized 'get me out of
> here' hacks."
> ([via Wikipédia, *StarCraft: Remastered*](https://en.wikipedia.org/wiki/StarCraft:_Remastered))

### 2.2 O Dragoon, e por que ele é o Dragoon

O ensaio *Broodwar and Starcraft 2 — Pathing*, de Thieving Magpie
([TeamLiquid](https://tl.net/blogs/429573-broodwar-and-starcraft-2-pathing) —
[cópia arquivada](https://web.archive.org/web/20170901153953/http://www.teamliquid.net/blogs/429573-broodwar-and-starcraft-2-pathing)),
explica a mecânica inteira em linguagem de jogador:

> "Broodwar pathing is a grid based system of open squares and closed squares. (…)
> Each unit that will pass by those grids, due to their varying unit sizes, will
> treat each grid differently."

> "notice how the Dragoon is double the size of the zealot? The dragoon wants to
> be as centered on a square as the zealot is: but when you're a unit that big,
> **which of the 4-8 squares that you're standing in do you decide to walk into?**
> The answer is all of them"

> "This is where a large majority of a unit glitches come from in Broodwar, but
> **it is also where the micro potential comes from as well**."

E a descrição exata do que o jogador vê como "dragoon burro":

> "The dragoons inside the ball have not been given a hold position and so they
> want to fit into an empty square. Because they are unable to find an empty one,
> **they jitter and wiggle as their pathfinding continually reroutes them over and
> over again** looking for that empty square."

> "If no terrain or hold position units were there to stop the correction, the
> slowly spreading jiggling of dragoons would spread the tight dragoon ball into a
> spaced out army that fills 2-3 screens."

A conclusão de projeto, que é o que interessa:

> "What does this mean? It means you have to use the whole command card."

O defeito virou vocabulário: *Move*, *Attack*, *Patrol* e *Hold Position* deixam
de ser quatro sinônimos e viram quatro **formas de arrumar o exército no chão**.

### 2.3 Os números da caixa de colisão

O ensaio acima fala em "o dobro do tamanho". Dá para checar. A BWAPI carrega a
tabela `unitDimensions` do próprio jogo
([`UnitType.cpp`](https://github.com/bwapi/bwapi/blob/main/bwapi/BWAPILIB/Source/UnitType.cpp)),
em pixels, com o ladrilho valendo 32 px:

| unidade (Brood War) | caixa de colisão | em ladrilhos |
|---|---|---|
| Zergling | 16 × 16 px | 0,50 × 0,50 |
| Marine | 17 × 20 px | 0,53 × 0,62 |
| Zealot | 23 × 19 px | 0,72 × 0,59 |
| Hydralisk | 21 × 23 px | 0,66 × 0,72 |
| SCV / Drone / Probe | 23 × 23 px | 0,72 × 0,72 |
| **Dragoon** | **32 × 32 px** | **1,00 × 1,00** |
| Siege Tank (modo tanque) | 32 × 32 px | 1,00 × 1,00 |
| Vulture / Goliath / Archon | 32 × 32 px | 1,00 × 1,00 |

O Dragoon é o **único bípede de infantaria com caixa de veículo**. Ele anda com
Zealots de 0,72 e tenta caber nas mesmas frestas — e não cabe. Não é um bug de
código: é uma caixa 1,8× maior em área que a do companheiro de pelotão.

### 2.4 Peso de marcha: aceleração e raio de giro

A mesma fonte traz três campos que explicam por que o Marine parece leve e o
Vulture parece pesado — `unitAcceleration`, `unitHaltDistance` e
`unitTurnRadius`:

| unidade | vel. máx. (px/quadro) | aceleração | distância de parada | raio de giro |
|---|---|---|---|---|
| Marine | 4,00 | 1 | 1 | 40 |
| Zealot | 4,00 | 1 | 1 | 40 |
| Zergling | 5,49 | 1 | 1 | 27 |
| Dragoon | 5,00 | 1 | 1 | 40 |
| Siege Tank | 4,00 | 1 | 1 | **13** |
| SCV / Drone / Probe | 4,92 | 67 | 12 227 | 40 |
| Vulture | 6,40 | 100 | **14 569** | 40 |

Leitura: **a infantaria do Brood War não tem rampa de aceleração nenhuma**
(aceleração 1, parada 1) — ela arranca e para no mesmo quadro. Quem tem peso são
os **veículos**: o Vulture continua deslizando por quase 57 px (≈ 1,8 ladrilho)
depois da ordem de parar, e o operário desliza ≈ 1,5 ladrilho. E o Siege Tank tem
raio de giro **13 contra 40** do Marine: vira três vezes mais devagar.

O "peso" do Brood War não está numa física global. Está em **três números por
unidade**, ligados só em quem devia ser pesado.

### 2.5 O que o Age of Empires II faz diferente

O Age of Empires II não tem gambiarra de colisão desligada: ele tem **muito mais
código**. O postmortem da Ensemble Studios
([Game Developer](https://www.gamedeveloper.com/design/postmortem-ensemble-studio-s-age-of-empires-ii-age-of-kings))
diz o tamanho do problema:

> "The game engine's movement system was redesigned and **no fewer than three
> separate pathfinding and two obstruction systems** were developed, requiring
> five different people working on them at various times."

Para um time de **40 pessoas em 24 meses** (mesma fonte), cinco pessoas em
caminhamento e obstrução é uma fatia enorme — e é a resposta à crítica número um
ao primeiro Age of Empires.

E o AoE II resolve a formação **por fora** da colisão, com um sistema de arrumação
explícito. O postmortem:

> "Automatic Formations" — "automatically arrange themselves logically by putting
> the strongest units up front and the ones needing protection in the rear."

O que a Definitive Edition ainda estava consertando em 2024–2025 mostra que o
problema nunca fecha ([Update 99311](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/)):

- > "Fixed an issue where units would regroup and cycle to the back of their
  > formation with every right click or attack command."
- > "Individual units will now join the formation of larger groups of units that
  > were already moving if the player selects both groups and issues a movement
  > command."
- > "Fixed an issue where moving large groups of units would cause some units to
  > stop reacting to group commands."
- > "Units no longer change direction rapidly when their path is obstructed when
  > the player has issued a Follow command on a unit."
- > "The game no longer treats Mule Carts as a hard obstruction; this should help
  > pathing around them."

### 2.6 O que é defeito virado charme e o que é acerto de verdade

| | veredito |
|---|---|
| Coletor do StarCraft atravessando coletor | **Defeito assumido.** Wyatt diz que foi falta de tempo. Vira charme porque ninguém vê: eles se espalham ao parar. |
| Dragoon travando na multidão | **Defeito que virou vocabulário.** A caixa de 1,00 ladrilho contra 0,72 do Zealot é acidente; o que virou jogo foi o jogador aprender *Hold Position* para congelar a formação. |
| Ter uma caixa de colisão **por unidade**, de tamanhos diferentes | **Acerto de verdade.** É o que faz exército ter forma, frente e retaguarda sem código de formação. |
| Aceleração e raio de giro só nos veículos | **Acerto de verdade.** Peso onde o peso conta, resposta instantânea onde ela conta. |
| Formação automática do AoE II | **Acerto de verdade**, e caro: cinco pessoas, três caminhadores, dois sistemas de obstrução. |
| Empilhar unidade voadora (*mutas stack*) | **Defeito preservado de propósito** — ver a seção dos remasters. |

---

## 3. Peso do combate: cadência, tempo de morte e dano visível

### 3.1 Cadência do StarCraft, em quadros

`WeaponType.cpp` da BWAPI guarda o `damageCooldown` de cada arma em quadros. A 42
ms por quadro (*Fastest*):

| arma (unidade) | recarga | segundos | alcance |
|---|---|---|---|
| Claws (Zergling) | 8 quadros | **0,34 s** | 0,5 ladrilho |
| Gauss Rifle (Marine) | 15 | **0,63 s** | 4,0 |
| Needle Spines (Hydralisk) | 15 | 0,63 | 4,0 |
| Particle Beam (Probe) | 22 | 0,92 | 1,0 |
| Flame Thrower (Firebat) | 22 | 0,92 | 1,0 |
| Photon Cannon | 22 | 0,92 | 7,0 |
| Phase Disruptor (Dragoon) | 30 | 1,26 | 4,0 |
| Burst Lasers (Wraith) | 30 | 1,26 | 5,0 |
| Arclite Cannon (Siege Tank) | 37 | **1,55 s** | 7,0 |

Fonte: [`WeaponType.cpp`](https://github.com/bwapi/bwapi/blob/main/bwapi/BWAPILIB/Source/WeaponType.cpp),
conversão de quadro para segundo pelo [Game speed](https://wiki.staredit.net/wiki/Game_speed).

### 3.2 Cadência do Age of Empires II, e a antecipação do golpe

O despejo de dados do [aoe2techtree.net](https://aoe2techtree.net/)
([JSON](https://aoe2techtree.net/data/data.json)) traz dois campos que não existem
no StarCraft e que são exatamente "peso": `ReloadTime` (recarga) e
`AttackDelaySeconds` / `FrameDelay` — **quanto tempo depois do início da animação o
dano é aplicado**.

| unidade (AoE II DE) | vida | ataque | recarga | atraso do golpe | alcance | vel. | treino |
|---|---|---|---|---|---|---|---|
| Aldeão | 25 | 3 | 2,0 s | 0 | corpo a corpo | 0,80 | 25 s |
| Militia / Man-at-Arms | 40–45 | 4–6 | 2,0 s | 0 | corpo a corpo | 0,90–0,96 | 21 s |
| Long Swordsman | 60 | 9 | 2,0 s | 0 | corpo a corpo | 0,96 | 21 s |
| Archer | 30 | 4 | 2,0 s | **0,35 s** (15 quadros) | 4 | 0,96 | 35 s |
| Crossbowman | 30 | 5 | 3,0 s | **0,507 s** (19 quadros) | 4 | 0,96 | 26 s |
| Knight | 100 | 10 | 1,8 s | **0,672 s** (13 quadros) | corpo a corpo | 1,35 | 30 s |
| Mangonel | 50 | 40 | 6,0 s | 0 | 7 | 0,60 | 46 s |
| Trebuchet | 150 | 200 | 10,0 s | **0,88 s** (24 quadros) | 16 | — | 50 s |

Repare no Knight: **0,672 s de espada no ar antes do dano sair**, num ciclo de 1,8
s. Mais de um terço do ciclo é antecipação. É a diferença entre "o número caiu" e
"ele bateu".

### 3.3 O que importa não é o dano por segundo — é a mordida por golpe

Aqui está o achado que mais serve para nós. Juntando as duas tabelas:

| golpe | dano | vida do alvo | **fração da vida por golpe** | golpes até a morte |
|---|---|---|---|---|
| Marine → Zergling | 6 | 35 | **17 %** | 6 |
| Hydralisk → Marine | 10 | 40 | **25 %** | 4 |
| Long Swordsman → Spearman | 9 | 45 | **20 %** | 5 |
| Knight → Archer | 10 | 30 | **33 %** | 3 |

(Vidas e danos: [`UnitType.cpp`](https://github.com/bwapi/bwapi/blob/main/bwapi/BWAPILIB/Source/UnitType.cpp)
para o Brood War, [aoe2techtree](https://aoe2techtree.net/data/data.json) para o
AoE II, sem melhorias pesquisadas.)

**Entre três e seis golpes matam.** Nenhum dos dois jogos tem duelo de vinte
tiros. É por isso que o combate "conta uma história": cada disparo é um evento
visível de 1/3 a 1/6 da vida do alvo, e o jogador consegue ver quem está
perdendo antes de a barra acabar.

### 3.4 O que acontece na tela quando a coisa morre — e por que dano invisível parece falso

Os dois jogos gastam desenho na leitura da vida, não só no número:

- **StarCraft** põe no console, o tempo todo, *wireframe* + pontos de vida +
  retrato + patente + abates
  ([manual](https://archive.org/download/manual_Starcraft/Starcraft_djvu.txt)).
  E inventa um estado visual só para "quase morto": o prédio Terran severamente
  danificado *"drops into the 'red zone', indicated by the structure's Hit Point
  bar turning red. A building so damaged will continue to lose Hit Points unless
  it is repaired"* (mesmo manual). A cor da barra deixa de ser enfeite e vira
  regra.
- **Age of Empires II** descreve no manual um som por evento de dano, não por
  golpe — ver a seção 4.

O enquadramento teórico disso é o de **Steve Swink**
([*Game Feel: The Secret Ingredient*, Game Developer, 2007](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient)),
que separa o *feel* em seis camadas — *Input, Response, Context, Polish,
Metaphor, Rules* — e define a que nos interessa:

> **Polish** — "The interactive impression of physicality created by the harmony
> of animation, sounds, and effects with input-driven motion"

> "Any effect that enhances the impression that the game world has its own self
> consistent physics is fair game"

Traduzindo para RTS: **combate sem dano visível parece falso porque a única
evidência de que o tiro existiu é um número caindo numa barra de 3 pixels.** Sem
clarão, sem recuo, sem som de impacto, o jogador não distingue "estou ganhando a
escaramuça" de "estou apenas parado perto do inimigo" — e a decisão de recuar,
que é o coração do RTS, fica sem informação.

---

## 4. Som como informação, não como enfeite

### 4.1 O sistema de alerta do Age of Empires II, literal, do manual

Esta é a página mais útil deste capítulo inteiro. Do manual do *Age of Kings*
([archive.org](https://archive.org/details/Age_of_Empires_II) —
[texto](https://archive.org/stream/Age_of_Empires_II/Age_of_Empires_II_djvu.txt), seção
"Attack notification"):

> "A **horn** notification sounds when your **military units** come under attack
> (or you initiate an attack). A **bell** notification sounds when your
> **non-military units or buildings** come under attack (or you initiate an
> attack). The horn or bell sounds once for every attack by a specific enemy
> within the area of the initial attack. **After a brief period, the attack area
> is reset**, and the horn or bell sounds again if the area is still under attack.
> Attacks outside the original area (or by different players) generate additional
> notifications."

Quatro decisões de projeto numa página:

1. **Dois timbres, dois significados.** Trompa = meus soldados. Sino = minha
   economia. O jogador sabe *que tipo* de emergência é antes de olhar.
2. **Agrupamento por área**, não por golpe. Senão vira chiado.
3. **Reinício por tempo**, para o alerta voltar se o ataque continuar.
4. **Inimigo diferente ou área diferente = alerta novo.** Dois ataques
   simultâneos soam como dois.

E há o alerta silencioso mais copiado do gênero — o **sino da cidade**:

> "Ringing the town bell (at the Town Center) causes all of your villagers to
> garrison inside" … "To sound the 'all clear', click the Ring Town Bell button
> again."

O manual também usa som para coisa que a tela nunca mostra por conta própria:
quando uma Fazenda se esgota, *"you hear a notification sound. To go to the
location, click the Idle Villager button"* — **som + botão de ir até lá**, o par
completo.

### 4.2 StarCraft

O StarCraft usa o mesmo princípio com a voz. Documentado:

- Recusa falada/escrita imediata: *"Not Enough Supplies… Build More Supply
  Depots"* na tela principal
  ([manual](https://archive.org/download/manual_Starcraft/Starcraft_djvu.txt)).
- Ordem impossível avisa: *"you will receive a message indicating that problem to
  you"* ([Unit Commands](https://classic.battle.net/scc/gs/com.shtml)).
- Clipe de voz por evento estratégico: a wiki de edição de mapas registra o
  comportamento do trecho *"Nuclear missile ready"* e o fato de que míssil criado
  por gatilho *não* o dispara automaticamente
  ([Staredit, *Nuclear Missile*](https://wiki.staredit.net/wiki/Nuclear_Missile)) —
  ou seja, o alerta é um objeto de jogo, ligado ao evento, não à animação.

A prova mais forte de que a Blizzard trata a voz como **canal de informação de
primeira classe** vem vinte anos depois: o StarCraft: Remastered passou a vender
**pacotes de locutor**, com narradores substituindo o anunciador padrão
([Wikipédia](https://en.wikipedia.org/wiki/StarCraft:_Remastered)). Ninguém vende
enfeite duas décadas depois.

### 4.3 A armadilha conhecida

Alerta demais vira ruído, e isso está registrado na própria comunidade do AoE II
— há uma discussão intitulada
["Under attack notifications are annoying and useless, please fix them"](https://forums.ageofempires.com/t/under-attack-notifications-are-annoying-and-useless-please-fix-them/241084)
nos fóruns oficiais. O agrupamento por área e o reinício por tempo do manual de
1999 existem exatamente por isso; quando a regra afrouxa, o jogador reclama.

---

## 5. Leitura do campo: silhueta, contraste e cor de time

### 5.1 Quantas direções, e por que 2D

O Age of Empires: Definitive Edition manteve o motor isométrico 2D de propósito e
explicou como
([ageofempires.com](https://www.ageofempires.com/news/age-empires-definitive-edition-3d-2d-game/)):

> "the same 2 dimensional isometric engine that is so recognisable from the
> original Age of Empires"

> criam "3D models, but then render them out as 2D images"

> as unidades "path their way through the game showcasing **32 directions**"

> "Zoom Levels" — "**every asset in the game has been rendered 3 times**"

Três decisões de legibilidade: sprite pré-renderizado (silhueta controlada),
32 direções (o rumo da unidade se lê sem ambiguidade) e três resoluções de asset
(nada de sprite borrado no zoom, que é onde a silhueta morre).

### 5.2 Contorno quando o corpo some atrás de um prédio

O Age of Empires II DE desenha **contorno na cor do jogador** quando a unidade
fica escondida atrás de construção. Que isso é tratado como funcionalidade de
primeira linha, e não como enfeite, aparece nas notas de atualização:

> "**Units standing behind Mule Carts now display outlines.**"
> ([Update 99311](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/))

Quando falha, vira relatório de bug: *"At a certain point (left side of castle,
behind it), units only showed their health bar; not their unit outline"*
([fórum oficial](https://forums.ageofempires.com/t/bug-units-completely-hidden-behind-castle-no-unit-outline/73253)).

> Nosso `spriteContornado` em `render2.js` veio deste mesmo raciocínio e já está
> registrado no capítulo [02 — acabamento 2D](02-acabamento-2d.md).

### 5.3 Legibilidade do projétil

O mais fino dos exemplos, e o que mostra o nível de cuidado: na mesma
atualização, o AoE II mudou a arte de um projétil **só para o jogador entender o
bônus de dano**:

> "Galley-line secondary projectile changed to always be an arrow for **better
> readability of the bonus**."

E acrescentou uma opção de interface que é pura leitura de campo — *Extended Unit
Stats*, mostrando tempo de recarga, velocidade de movimento, raio de explosão,
taxa de trabalho, com ícones de ataque indicando dano perfurante e alcance
mínimo (mesma fonte).

### 5.4 O limite de seleção como decisão de leitura

O limite de 12 unidades por seleção do StarCraft não é só interface: é o que
mantém a tela lida. A página da Blizzard descreve o truque de contorná-lo — a
"conga line" de unidades seguindo umas às outras — e a chama pelo nome:
*"This can allow you to control over 12 units (**the selection limit**) at one
time"* ([Unit Commands](https://classic.battle.net/scc/gs/com.shtml)).

E o limite **sobreviveu ao remaster**. Ver a seção 7.

---

## 6. Ritmo da partida: começo, meio e fim em números

### 6.1 Tempos de construção e de tropa

| | StarCraft (Brood War) | Age of Empires II (DE) |
|---|---|---|
| operário | SCV / Drone / Probe — **12,5 s** (300 quadros) | Aldeão — **25 s** |
| casa / suprimento | Supply Depot — **25 s** (600 q.) | House — **25 s** |
| quartel | Barracks — **50 s** (1200 q.) | Barracks — **50 s** |
| infantaria básica | Marine — **15 s** (360 q.) | Militia — **21 s**; Archer — **35 s** |
| unidade cara | Dragoon — **31,25 s** (750 q.) | Knight — **30 s** |
| centro de comando | Command Center — **75 s** (1800 q.) | Town Center — **100 s** |
| torre | Photon Cannon — **31,25 s** (750 q.) | Watch Tower — **80 s** |
| muro | — | Palisade **7 s**; Muro de pedra **10 s** |

Quadros da BWAPI ([`UnitType.cpp`](https://github.com/bwapi/bwapi/blob/main/bwapi/BWAPILIB/Source/UnitType.cpp),
campo `defaultTimeCost`) convertidos a 24 quadros/s conforme
[Staredit](https://wiki.staredit.net/wiki/Nuclear_Missile); AoE II do
[aoe2techtree](https://aoe2techtree.net/data/data.json), campo `TrainTime`.

### 6.2 Quando chega o primeiro ataque

Os dois jogos põem **um portão de tempo** entre o início e a primeira briga, e
ele não é o mesmo:

- **Age of Empires II** exige subir de era. A pesquisa da Idade Feudal sozinha
  custa **500 de comida e 130 segundos** de Centro Urbano parado; a Idade dos
  Castelos, **160 s**, e a Imperial, **190 s**
  ([dados](https://aoe2techtree.net/data/data.json) — no despejo os nomes internos
  estão deslocados: `Middle Age` é a Feudal, `Feudal Age` é a Castelos).
  Ou seja: **antes dos 130 s de pesquisa, o jogador ainda está juntando 500 de
  comida.** O começo é longo por construção.
- **StarCraft** não tem portão de era; tem portão de **prédio**. O caminho mais
  curto para a primeira briga é Barracks (50 s) ou equivalente, mais a tropa (15
  s). Nada chega antes de uns 65 segundos de produção pura, sem contar o caminho
  até a base inimiga.

**A forma que os dois compartilham:** um começo em que o jogador só arruma a
economia, um meio em que economia e exército disputam o mesmo minério, e um fim
em que a decisão já foi tomada há dois minutos. O primeiro contato **não** cai em
cima do jogador antes de ele ter feito escolhas.

### 6.3 O ritmo de dedo do jogador

Do artigo do AoE: comandos **a cada 1,5–2 s**, com picos de **3–4 por segundo**.
Esse é o orçamento real de atenção. Qualquer coisa que exija mais que isso para
não perder — micro obrigatório em três lugares ao mesmo tempo — sai do ritmo que
os dois jogos foram medidos para sustentar.

---

## 7. O que os remasters mudaram — e o que recusaram mudar

### 7.1 StarCraft: Remastered (2017)

**Mudaram:** gráficos até 4K, trilha e efeitos sonoros **regravados**,
infraestrutura moderna de contas e pareamento, nuvem para réplicas, mapas e
atalhos, e a possibilidade de **alternar entre o visual original e o novo** em
partida — mais níveis de zoom
([Wikipédia](https://en.wikipedia.org/wiki/StarCraft:_Remastered)). Depois vieram
pacotes de locutor e até um pacote gráfico de desenho animado (*StarCraft:
Cartooned*). Tudo isso é **apresentação**.

**Não mudaram:** a simulação. Dos próprios responsáveis, Robert Bridenbecker e
Pete Stilwell, via
[Vice](https://www.vice.com/en/article/starcraft-remastered-doesnt-fix-brood-wars-broken-perfection/):

> "**StarCraft: Remastered uses all the same gameplay code as Brood War.**"

> "**Dragoons and Goliaths are still a bit derpy in how they react to movement
> commands. The Reaver's shot doesn't always find a target. Mutas stack.**"

> "The gameplay is identical enough that **old replays from 1.16 will play and
> work just fine** under StarCraft: Remastered."

A Wikipédia registra a mesma decisão pelo lado técnico — *"the remaster features
redone visuals and sound assets while still using the same engine as the
original, which allows for cross-play compatibility across both versions"* — e
registra também o preço: houve crítica de que **o jogo não foi feito amigável a
jogador novo**, com a Softpedia escrevendo que *"the new generation might not
appreciate it"*.

**O que isso informa:** eles tinham a lista dos defeitos, nomeados um a um
(Dragoon, Goliath, Reaver, empilhamento de Mutalisk), e escolheram **não
consertar nenhum**. Porque o defeito já estava dentro da mão do jogador: é o que
o *Hold Position* e o *Move* existem para administrar. A réplica de 1998 rodar em
2017 é a prova formal.

### 7.2 Age of Empires II: Definitive Edition

O caminho oposto, e igualmente informativo: a DE **continua mexendo no
caminhamento e na formação** anos depois do lançamento. Da
[Update 99311](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/):

> "Fixed several issues with villager pathfinding around resources, especially
> regarding Mule Carts."

> "Fixed a rare issue where units would slide across untraversable terrain when
> being patrolled on Stand Ground."

> "Fixed an issue where rams grouped with other units would stop moving before
> reaching an enemy target when the player issued an Attack Move."

E também mexe em **legibilidade** — contornos, cor de jogador nos ícones, o
projétil que virou flecha "for better readability", o painel *Extended Unit
Stats*.

**A diferença entre os dois remasters é a diferença entre os dois jogos.** No
Brood War o comportamento errático virou ferramenta competitiva, e consertar
quebraria vinte anos de técnica. No Age of Empires II a movimentação sempre
quis ser *correta* — cinco pessoas, três caminhadores, dois sistemas de obstrução
já em 1999 — e portanto todo defeito remanescente continua sendo defeito.

**A lição para quem escreve um RTS hoje:** decida cedo de que lado está. Ou o
comportamento estranho é vocabulário e você o ensina, ou é erro e você o conserta
para sempre. O que não funciona é o meio-termo — comportamento estranho que o
jogador não consegue nem usar nem prever.

---

## O que serve para nós

Tudo abaixo é medição no repositório, em `src/data.js`, `src/sim-combate.js`,
`src/sim-unidades.js`, `src/anima.js` e `src/main.js`, contra os números com
fonte das seções acima.

### N1 — Resposta ao comando: já estamos à frente dos dois. Não mexer.

`src/main.js:8` — `var PASSO = 1 / 30;` → **33,3 ms por passo de simulação**.
`ui.js:tocar` → `ordemNoTerreno` chama `sim.darTarefa(...)` **no próprio evento de
ponteiro**, de forma síncrona, e no fim faz duas coisas boas:
`this.render.efeitos.push(this.marcaDeOrdem(...))` e `UF.audio.evento('clique')`.

| | latência clique → ordem virar estado |
|---|---|
| **Última Fronteira** | **0 a 33 ms** (a ordem entra no estado no mesmo quadro; o efeito visível vem no passo seguinte) |
| StarCraft, partida local | ≤ 42 ms (um tick) |
| Age of Empires, em rede | 200 a 400 ms (turno de 200 ms + 2 turnos) |

E já fazemos o que os dois clássicos fazem de mais importante: **respondemos
sempre**, inclusive quando negamos — `UF.audio.evento('negado')` aparece em seis
pontos de `ui.js` (construção inválida, muro inválido, energia insuficiente,
rally inválido). Isso é o equivalente direto do *"Not Enough Supplies…"* do
StarCraft.

**Conclusão:** não há nada a ganhar aqui, e há o que perder. O risco no nosso caso
é o oposto do deles — variação. Se em algum quadro pesado o laço de `main.js`
rodar as 12 voltas do `while (self.acumulado >= PASSO && voltas++ < 12)` e depois
zerar o acumulado, a resposta oscila; e o artigo do AoE mediu que **oscilar é pior
que ser lento**.

### N2 — Movimentação: não temos colisão entre unidades. Nenhuma.

Este é o achado mais duro do capítulo. `S.andar` em `src/sim-unidades.js:135`
consulta **apenas `this.world.occ[idx]`**, que guarda id de *estrutura*. Não há
uma única leitura de posição de outra unidade no caminho de deslocamento. Duas,
dez ou trinta unidades ocupam exatamente as mesmas coordenadas.

O espalhamento que temos é um só, e é da interface: em `ui.js:ordemNoTerreno`,
`destino = { x: cel.x + (i % 3) - 1, y: cel.y + Math.floor(i / 3) % 3 - 1 }` —
um leque de **3 × 3 = 9 posições**. A décima unidade e a trigésima recebem as
mesmas nove.

| | tem caixa de colisão por unidade? |
|---|---|
| Brood War | sim — de 16×16 px (Zergling, 0,50 ladrilho) a 32×32 px (Dragoon, 1,00) |
| Age of Empires II | sim — dois sistemas de obstrução, cinco pessoas trabalhando neles |
| **Última Fronteira** | **não — só estrutura bloqueia** |

Consequência direta na leitura: um pelotão de 20 fuzileiros é um sprite só com 19
cópias por baixo. O jogador não enxerga frente, flanco nem retaguarda, não
percebe que o cerco fechou, e não tem nada a fazer com um comando de *Hold
Position* — porque não existe posição para segurar.

Aceleração e giro, por outro lado, estão **certos por acaso**: `u.x += dx / d *
passo` é arranque e parada instantâneos, que é exatamente o que o Brood War faz
com infantaria (aceleração 1, distância de parada 1). O que falta é o outro lado
da moeda: o Brood War dá **raio de giro 13 contra 40** ao Siege Tank e **14 569 de
distância de parada** ao Vulture. Nosso Tanque (vel 1,6), Trator (1,9) e Titã
(1,4) são lentos, mas não são *pesados*: param no pixel e giram no quadro.

### N3 — Peso do combate: nosso golpe morde um terço do que morde nos clássicos

Medido rodando `src/data.js` no Node e aplicando a fórmula de
`S.aplicarDano` (`dano - blind`, mínimo de 12 %):

| golpe | dano efetivo | vida do alvo | **fração por golpe** | golpes até a morte | tempo |
|---|---|---|---|---|---|
| Marine → Zergling (BW) | 6 | 35 | 17 % | 6 | 3,8 s |
| Knight → Archer (AoE II) | 10 | 30 | 33 % | 3 | 5,4 s |
| Long Sword → Spearman (AoE II) | 9 | 45 | 20 % | 5 | 10,0 s |
| **Fuzileiro → Predador** | **11** | **150** | **7,3 %** | **14** | **9,6 s** |
| **Cão → Predador** | 14 | 150 | 9,3 % | 11 | 5,4 s |
| **Predador → Fuzileiro** | 10 | 130 | 7,7 % | 13 | 10,4 s |
| **Cuspidor → Fuzileiro** | 18 | 130 | 13,8 % | 8 | 11,6 s |
| Fuzileiro → Couraçado | 6 (blind 6) | 520 | 1,2 % | 87 | 60,7 s |

Os extremos estão certos — Detonador (108 de dano, mata um fuzileiro em 3,6 s),
Titã (78) e Matriarca (106) mordem como deve. **O problema é o miolo**, que é onde
o jogo passa 90 % do tempo: o combate padrão do nosso jogo é fuzileiro contra
predador, e ele são **catorze tiros**.

O que temos de certo e não se deve perder:
- Cadência do fuzileiro **0,7 s** contra 0,63 s do Marine — praticamente igual.
- Velocidade do fuzileiro **2,7 células/s** contra ≈ 2,98 ladrilhos/s do Marine
  (4,0 px/quadro a 23,8 Hz, 32 px por ladrilho). Também igual.
- Alcance 5,5 contra 4,0 do Marine. Um pouco maior; ok.
- **Já existe clarão de dano** — `render2.js:463`, `brightness(2.6)` por 0,11 s.
- **Já existe tremida de impacto** — `anima.js:132`, 0,28 s, com desvio de até 5
  px em x e 3 px em y.
- **Já existe cadáver** — `render2.js:344`, `TEMPO_CADAVER = 26` s, com atraso de
  1,1 s para o tombo.

Falta antecipação no corpo a corpo. `S.atirar` em `sim-combate.js:135` aplica o
dano **no mesmo instante** em que a recarga zera, quando a distância é menor que
1,6 célula. O AoE II nunca faz isso: o Knight tem **0,672 s** de espada no ar
dentro de um ciclo de 1,8 s. O tiro à distância, esse, já tem peso — o projétil
do fuzileiro a 18 células/s leva ≈ 0,31 s para cruzar 5,5 células.

### N4 — Som: não existe alerta de ataque. É o buraco mais barato de tapar.

Varredura em `src/*.js`: não há nenhum evento de "sua base está sob ataque", nem
piscada de minimapa, nem atalho para ir ao ponto. `src/audio.js` tem `avisoOnda`,
`ondaComecou`, `chefeEntrou` — tudo sobre a **onda**, nada sobre **o que está sendo
mordido agora**.

| | avisa que algo meu está sendo atacado? |
|---|---|
| Age of Empires II | sim — **trompa** (militar) e **sino** (civil/prédio), agrupados por área, com reinício por tempo |
| StarCraft | sim — voz e mensagem na tela; e a Blizzard vende pacotes de locutor desde 2019 |
| **Última Fronteira** | **não** |

O nosso minimapa desenha inimigo em vermelho (`render2.js:1286`), mas só isso: o
jogador que estiver olhando a fila de produção não sabe que um Corredor está
comendo operário do outro lado do setor. E o Corredor existe exatamente para
isso — `mira: 'economia'` em `data.js`.

### N5 — Ritmo: construímos de três a cinco vezes mais rápido que os dois

| | nosso | Brood War | AoE II |
|---|---|---|---|
| operário | **12 s** | 12,5 s | 25 s |
| infantaria básica | Fuzileiro **11 s** | Marine 15 s | Militia 21 s / Archer 35 s |
| quartel | **16 s** | 50 s | 50 s |
| torre básica | Sentinela **8 s** | Photon Cannon 31,25 s | Watch Tower 80 s |
| casa / suprimento | Alojamento **10 s** | Supply Depot 25 s | House 25 s |
| muro (1 célula) | **2,5 s** | — | 7 s (paliçada) / 10 s (pedra) |
| centro de comando | Central **0 s** | 75 s | 100 s |
| primeiro contato | **90 s** (`REGRAS.primeiroAtaque`) | ~65 s de produção pura + travessia | ≥ 130 s só da pesquisa Feudal, depois de juntar 500 de comida |

Não estou dizendo que está errado — é um jogo de defesa de base, comprimido de
propósito, e `equilibrio.cjs` existe exatamente para julgar isso com partida
inteira. Estou dizendo qual é **a forma**: o nosso começo é três a cinco vezes
mais denso que o dos clássicos, e a onda 1 chega em 90 s, num intervalo de 62 s
(`REGRAS.intervaloOnda`) com aviso de 20 s (`REGRAS.avisoAtaque`). Cabe uma
Sentinela (8 s) e um Quartel (16 s) antes da primeira briga, e pouco mais.

---

## Os três ajustes de maior efeito

### Ajuste 1 — dar corpo às unidades (separação mínima entre unidades)

**O que:** dar a cada unidade um raio de ocupação e um empurrão suave para fora
quando dois corpos se sobrepõem. Os invasores **já têm** o campo — `raio` em
`data.js`, de 0,28 (Corredor) a 0,8 (Matriarca) — e nada o usa em `andar`. As
nossas unidades não têm nenhum.

**Por que primeiro:** é o único item que muda ao mesmo tempo leitura de campo
(§5), peso de combate (§3) e valor do comando (§2). Sem corpo, *Hold Position*,
formação e flanqueamento não existem como conceito; e o Brood War inteiro —
incluindo o que os jogadores chamam de micro — sai de as caixas serem diferentes
entre si ([TeamLiquid](https://tl.net/blogs/429573-broodwar-and-starcraft-2-pathing)).

**Ordem de grandeza sugerida, pela proporção do Brood War:** soldado ≈ 0,3 célula
de raio (Marine: 0,53 ladrilho de largura), Cão ≈ 0,25 (Zergling: 0,50), Tanque e
Trator ≈ 0,5 (Dragoon e Siege Tank: 1,00 ladrilho). E aumentar o leque de
`ordemNoTerreno` de 3×3 para algo que cresça com o tamanho do grupo.

**Medição para confirmar:**
1. *Antes*: script que instancia 20 fuzileiros, dá uma ordem para um ponto, roda
   600 passos de `PASSO` e mede (a) a **distância mediana entre pares vizinhos**
   e (b) a **área do fecho convexo** do pelotão parado. Hoje a expectativa é
   ≈ 0 em ambos.
2. *Depois*: mesma medição. Alvo: mediana ≥ 0,6 célula, e área do fecho crescendo
   com o número de unidades.
3. **Guarda-corpo obrigatório**: contar `nav.buscar` por segundo antes e depois no
   mesmo cenário. Separação que dobra o número de buscas de rota compra leitura
   com engasgo — foi o que custou cinco pessoas à Ensemble. Se subir, resolver a
   sobreposição por empurrão direto de posição, **sem** invalidar `u.rota`.
4. `node tests/aceitacao.cjs` tem de continuar 28/28 — a invariante "célula
   destruída libera a ocupação na hora" não pode ser afetada.

### Ajuste 2 — aumentar a mordida por golpe sem mexer no dano por segundo

**O que:** subir dano e cadência **na mesma proporção** nas armas do miolo, para
que cada tiro tire entre 15 % e 30 % da vida do alvo típico e a morte aconteça em
**4 a 8 golpes**, como nos dois clássicos — e não em 14.

Exemplo do que a conta pede (ilustração, não proposta fechada): fuzileiro de
`dano 12 / cad 0,7` (17,1 dps, 14 tiros no Predador) para `dano 24 / cad 1,4`
(17,1 dps, 7 tiros). Mesmo dano por segundo, metade dos tiros, cada um valendo
16 % da vida do Predador — praticamente o número do Marine contra o Zergling.

**Por que:** é o que faz o combate "contar uma história" (§3.3) e é o que dá
sentido aos efeitos que já existem — o clarão de 0,11 s e a tremida de 0,28 s de
`anima.js` hoje disparam catorze vezes por morte, o que é ruído; a sete, viram
pontuação.

**Atenção à regra do CLAUDE.md:** número de equilíbrio não se muda no olho. Este
ajuste é uma **hipótese com desenho de medição**, não uma mudança a fazer.

**Medição para confirmar:**
1. Script que percorre `UNIDADES` × `INVASORES` e imprime golpes-até-a-morte e
   fração-por-golpe para todos os pares. Meta: mediana entre 4 e 8 golpes,
   fração entre 15 % e 30 %.
2. `node tests/equilibrio.cjs` **antes e depois**, nos 6 setores, comparando
   ondas sobrevividas, minerais entregues e perdas. Se o dps foi preservado, os
   agregados devem ficar dentro do ruído da semente; se se moverem muito, o
   efeito não é só de percepção e o equilíbrio mudou de verdade.
3. Um segundo cenário para o risco conhecido: dano por pedaço maior faz o
   **excesso** (*overkill*) crescer quando várias torres miram o mesmo alvo. Medir
   dano desperdiçado em alvos já mortos por onda, antes e depois.

### Ajuste 3 — alerta de ataque com timbre por tipo, agrupado por área

**O que:** copiar o sistema do manual do Age of Kings, que já vem pronto e
testado: **dois timbres** (um para tropa nossa sendo atacada, outro para
estrutura/operário), **agrupamento por área** do primeiro golpe, **reinício por
tempo** para o alerta voltar se o ataque continuar, e **alerta novo** se a área ou
o atacante for outro. Mais o par que o AoE II sempre usa junto: som + um jeito de
**ir até lá** (piscada no minimapa e uma tecla que centraliza a câmera no último
alerta).

**Por que:** é o canal de informação que a tela não tem como dar — o jogador está
olhando a base enquanto o Corredor (`mira: 'economia'`, vel 4,1, o mais rápido do
jogo) come operário na jazida distante. Custo baixo: `sim-combate.js` já emite
`golpe`, `impacto` e `estruturaDestruida` com coordenada, e `audio.js` já tem
oscilador e canais. É juntar, agrupar e dar destino ao toque.

**Medição para confirmar:**
1. Instrumentar uma partida inteira (um setor, semente fixa) e registrar todo
   evento de dano a entidade nossa **fora da área visível da câmera**, com o
   tempo até a câmera chegar lá. Hoje essa latência é ilimitada: é o tempo até o
   jogador reparar sozinho.
2. Depois do ajuste, a meta é **alerta ≤ 1 s** do primeiro golpe e o caminho para
   o local a uma tecla.
3. O contra-teste importa tanto quanto: contar **alertas por minuto** durante a
   onda mais cheia (setor 6, onda 13, com a Matriarca). Se passar de uns poucos
   por minuto, o agrupamento por área está frouxo e o alerta virou chiado — que é
   a reclamação registrada no próprio fórum do Age of Empires
   ([aqui](https://forums.ageofempires.com/t/under-attack-notifications-are-annoying-and-useless-please-fix-them/241084)).

### Nota de rodapé — dois ajustes pequenos que ficam na fila

- **Peso só onde deve haver peso.** Dar raio de giro e distância de parada ao
  Tanque, ao Trator, ao Titã e à Matriarca, e a mais ninguém — que é exatamente o
  que o Brood War faz (Siege Tank giro 13 contra 40 do Marine; Vulture desliza
  1,8 ladrilho depois do "pare").
- **Antecipação no corpo a corpo.** `sim-combate.js:135` aplica o dano no mesmo
  instante abaixo de 1,6 célula. Um atraso da ordem de um terço do ciclo — o
  Knight do AoE II gasta 0,672 s de 1,8 s — deixaria o golpe do Cão e do Predador
  com o mesmo peso que o tiro já tem pelo tempo de voo do projétil.

---

## Fontes deste capítulo

| fonte | o que dá |
|---|---|
| [Terrano & Bettner — *1500 Archers on a 28.8*](https://www.gamedeveloper.com/programming/1500-archers-on-a-28-8-network-programming-in-age-of-empires-and-beyond) | turno de 200 ms, execução com 2 turnos de atraso, 250 ms imperceptível, constância > velocidade, comm turn separado do quadro de desenho, ritmo de comando do jogador |
| [Nielsen — *Response Times: The 3 Important Limits*](https://www.nngroup.com/articles/response-times-3-important-limits/) | 0,1 s / 1 s / 10 s |
| [Staredit Wiki — *Game speed*](https://wiki.staredit.net/wiki/Game_speed) | 42 ms por tick, 23,8 Hz, Fastest ≈ 1,5× tempo real |
| [Staredit Wiki — *Nuclear Missile*](https://wiki.staredit.net/wiki/Nuclear_Missile) | conversão quadro→segundo (1500 q. = 62,5 s); clipe de voz como objeto de jogo |
| [Patrick Wyatt — *The StarCraft path-finding hack*](https://www.codeofhonor.com/blog/the-starcraft-path-finding-hack/) | colisão entre coletores desligada de propósito; falta de tempo como causa |
| [Thieving Magpie — *Broodwar and Starcraft 2: Pathing*](https://tl.net/blogs/429573-broodwar-and-starcraft-2-pathing) | grade, tamanhos diferentes de caixa, Dragoon em 4–8 casas, jitter, magic box, "use the whole command card" |
| [BWAPI — `UnitType.cpp`](https://github.com/bwapi/bwapi/blob/main/bwapi/BWAPILIB/Source/UnitType.cpp) | vida, custo, tempo de construção em quadros, velocidade, aceleração, distância de parada, raio de giro, caixa de colisão |
| [BWAPI — `WeaponType.cpp`](https://github.com/bwapi/bwapi/blob/main/bwapi/BWAPILIB/Source/WeaponType.cpp) | recarga em quadros e alcance em pixels de cada arma |
| [Manual do StarCraft (1998)](https://archive.org/details/manual_Starcraft) · [texto](https://archive.org/download/manual_Starcraft/Starcraft_djvu.txt) | recusa escrita na tela, wireframe + HP + retrato, barra vermelha e dano crítico |
| [StarCraft Compendium — Unit Commands](https://classic.battle.net/scc/gs/com.shtml) | Stop, Attack-Move, mensagem de ordem impossível, limite de 12 e a "conga line" |
| [Manual do Age of Empires II](https://archive.org/details/Age_of_Empires_II) · [texto](https://archive.org/stream/Age_of_Empires_II/Age_of_Empires_II_djvu.txt) | trompa vs sino, agrupamento por área, reinício por tempo, sino da cidade, som de fazenda esgotada + botão de ocioso |
| [aoe2techtree.net](https://aoe2techtree.net/) · [dados](https://aoe2techtree.net/data/data.json) | recarga, atraso do golpe em quadros, tempo de treino, velocidade, vida e ataque do AoE II DE |
| [Ensemble Studios — postmortem do AoE II](https://www.gamedeveloper.com/design/postmortem-ensemble-studio-s-age-of-empires-ii-age-of-kings) | três caminhadores + dois sistemas de obstrução, cinco pessoas, formações automáticas, 40 pessoas / 24 meses |
| [AoE II DE — Update 99311](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/) | correções de caminhamento e formação, contorno atrás de obstáculo, projétil trocado por legibilidade, Extended Unit Stats |
| [AoE DE — *3D to 2D*](https://www.ageofempires.com/news/age-empires-definitive-edition-3d-2d-game/) | motor 2D isométrico mantido, 32 direções, três resoluções de asset |
| [Fórum AoE — contorno que falha](https://forums.ageofempires.com/t/bug-units-completely-hidden-behind-castle-no-unit-outline/73253) · [alerta que incomoda](https://forums.ageofempires.com/t/under-attack-notifications-are-annoying-and-useless-please-fix-them/241084) | contorno tratado como funcionalidade; alerta demais vira ruído |
| [Vice — *Remastered Doesn't Fix the Broken Perfection*](https://www.vice.com/en/article/starcraft-remastered-doesnt-fix-brood-wars-broken-perfection/) | "same gameplay code"; Dragoons/Goliaths derpy, Reaver, mutas stack; réplicas de 1.16 rodando |
| [Wikipédia — *StarCraft: Remastered*](https://en.wikipedia.org/wiki/StarCraft:_Remastered) | 4K, áudio regravado, alternar visual, mesmo motor, pacotes de locutor, crítica de não ser amigável a jogador novo |
| [Steve Swink — *Game Feel: The Secret Ingredient*](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient) | as seis camadas; *polish* como "impressão interativa de fisicalidade" |
