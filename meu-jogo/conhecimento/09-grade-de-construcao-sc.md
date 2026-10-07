# A grade de construção do StarCraft

O dono do jogo lembra de **categorias** na construção do StarCraft. Este
capítulo confere essa lembrança contra o manual da Blizzard de 1998, o
compêndio oficial da própria Blizzard e as figuras do manual medidas uma a uma.

**Resposta curta: ele lembra quase certo, e o "quase" é o que interessa.**
Havia sim **duas páginas** de construção, e o operário tinha **dois botões**
para elas — `Build Structure` (tecla `B`) e `Build Advanced Structure`
(tecla `V`). Mas a divisão **não é temática** ("defesa", "economia",
"produção"): é **básico contra avançado**, ou seja, começo de partida contra
fim de partida. E as duas páginas juntas tinham um teto duro de **8 estruturas
cada**, porque a grade era 3×3 e a nona casa era do **Cancelar**.

---

## Fontes

- **Manual do StarCraft** (Blizzard, 1998), PDF —
  [devnonsense.com/pdf/StarCraft-manual.pdf](https://devnonsense.com/pdf/StarCraft-manual.pdf),
  também no [Internet Archive](https://archive.org/details/manual_Starcraft).
  Citado como *manual SC, p. N* (numeração impressa no rodapé). As figuras
  foram renderizadas a 600 dpi e medidas; onde eu digo "medido na figura",
  digo em qual página.
- **StarCraft Compendium**, o guia oficial da Blizzard em
  [classic.battle.net/scc/](https://classic.battle.net/scc/) — em especial as
  páginas de **Hot Keys** de cada raça, que listam letra por letra o conteúdo
  das duas páginas de construção:
  [Terran](https://classic.battle.net/scc/terran/hk.shtml),
  [Zerg](https://classic.battle.net/scc/zerg/hk.shtml),
  [Protoss](https://classic.battle.net/scc/protoss/hk.shtml). E
  [Hot Keys & Special Commands](https://classic.battle.net/scc/gs/control.shtml)
  para a convenção da letra amarela.
- **Documentação de EUD/FireGraft do StarEdit Network**,
  [staredit.net/topic/17533/](http://staredit.net/topic/17533/) — engenharia
  reversa da estrutura de botões do jogo de varejo. É de comunidade, não da
  Blizzard; mas é a única fonte que mostra os **campos internos** de um botão
  (posição, ícone, texto disponível, texto indisponível, requisitos) e por isso
  é o que prova como o jogo tratava um botão bloqueado.
- **StarCraft Wiki** (Fandom),
  [Hotkey](https://starcraft.fandom.com/wiki/Hotkey) — usado só para dois fatos
  que as fontes da Blizzard não cobrem: a tecla do Cancelar e a contagem de
  teclas do perfil Grid do StarCraft II.

---

## 1. A grade é 3×3, e as casas são numeradas 1 a 9

Isto não é dedução de figura: é a estrutura de dados do próprio jogo. A
documentação de FireGraft descreve os campos de um botão da command card
([staredit.net](http://staredit.net/topic/17533/)):

> **Position:** The position the button appears on the card.
> ```
> 1 2 3
> 4 5 6
> 7 8 9
> ```
> **Icon:** The icon the button has.
> **Available:** The text the button has when it's available. The first
> character will be the hotkey for the button.
> **Unavailable:** The text the button has when it's unavailable.
> **Conditions:** The type of conditions required.

Cinco coisas saem daí, e todas importam:

1. **Nove casas, endereço fixo, numeração em leitura ocidental.** A casa é uma
   propriedade do botão, não do desenho.
2. **A letra de atalho mora dentro do texto do botão** — é o primeiro caractere
   da string. Não é uma tabela separada de teclas: o rótulo e o atalho são a
   mesma coisa.
3. **Todo botão tem DOIS textos**: um para quando está disponível, outro para
   quando não está. Um botão bloqueado continua existindo e continua tendo o
   que dizer.
4. **Requisito é uma lista de condições do botão**, e é ela que decide entre os
   dois textos.
5. **Trocar de página é trocar a command card inteira.** O mesmo documento diz,
   ao ensinar a fazer um menu novo: *"This works similarly to the command card
   changes that workers have when creating buildings"*, e logo em seguida *"We
   need to create a cancel button that will bring us back to the Marine's
   command card"*. O botão de construir não abre uma janela: ele **substitui**
   a carta, e o Cancelar é o caminho de volta.

A convenção da letra é oficial, do compêndio da Blizzard
([control.shtml](https://classic.battle.net/scc/gs/control.shtml)):

> "Every unit command has a hot key, or keyboard shortcut, associated with it.
> Holding the cursor over any unit command button will display the name of the
> command. Note that one of the letters appears in **Yellow** — this is the hot
> key for that command. Using hot keys for special abilities, attacking, and
> **construction** can save a lot of time."

---

## 2. A carta de comandos do operário

### SCV (Terran) — medido na figura do *manual SC, p. 17*

A figura de "Gathering Resources" mostra a command card do SCV inteira e
legível. Os ícones são os mesmos que o manual rotula na página 19 (Move =
círculo com seta, Stop = círculo com X, Attack = moldura de quatro cantos com
ponto no meio), então a leitura não é chute:

```
┌──────────┬──────────┬──────────┐
│  MOVER   │  PARAR   │  ATACAR  │
│  (M) →   │  (S) ⊗   │  (A) ⊹   │
├──────────┼──────────┼──────────┤
│ REPARAR  │          │  COLETAR │
│  (R) ✕✕  │  vazia   │  (G) ↻   │
├──────────┼──────────┼──────────┤
│ CONSTRUIR│ CONSTRUIR│          │
│ BÁSICA(B)│ AVANÇ.(V)│  vazia   │
└──────────┴──────────┴──────────┘
```

Duas casas ficam **vazias** — não encolhem, não puxam o vizinho. É a mesma
regra da carta do Marine na *p. 19*, onde só as casas 1–5 têm ícone (Move,
Stop, Attack na linha de cima; Patrol e Hold Position nas duas primeiras da
linha do meio) e as outras quatro são soquetes escuros.

E aqui há uma correção honesta ao que o capítulo 04 diz. **O endereço é fixo
por tipo de unidade, não por comando no jogo inteiro.** A casa 4 é *Patrol* no
Marine (*p. 19*) e *Reparar* no SCV (*p. 17*). O que é realmente universal é a
**linha de cima**: Mover, Parar, Atacar, nessa ordem, em toda unidade. A
promessa que o jogo cumpre é "o mesmo SCV sempre mostra Reparar na mesma
casa" — e isso já basta para o dedo decorar.

O conteúdo da casa também é contextual dentro da mesma posição (*manual SC,
p. 18*):

> "If you stop an SCV while it is returning to the Command Center with a load of
> resources, **the Gather button will be replaced by a Return Cargo button**."

### Probe (Protoss) e Drone (Zerg)

Aqui eu não tenho figura do manual, e digo isso sem rodeio: o que segue vem das
páginas de atalho da Blizzard mais o texto do manual, não de medição.

- O **Probe** tem os mesmos dois botões de construção, `B` e `V`
  ([protoss/hk.shtml](https://classic.battle.net/scc/protoss/hk.shtml)), e
  **não tem Reparar** — a estrutura protoss não é construída, é **teleportada
  pronta**: *"Robotic Probes use special warp beacons to provide an anchor and
  entry point for a special warp gate that brings in the fully functional
  building from Aiur"* (*manual SC, p. 79*). O Probe planta a baliza e sai
  andando.
- O **Drone** tem os mesmos dois botões, e a Blizzard os chama de outra coisa:
  **"Basic Mutation (Buildings)"** e **"Advanced Mutation (Buildings)"**
  ([zerg/hk.shtml](https://classic.battle.net/scc/zerg/hk.shtml)). O Drone não
  constrói: ele **vira** a estrutura e desaparece — *"engineered with the
  Larvae's ability to break down their own genetic coding and transform
  themselves into rudimentary Zerg structures"* (*manual SC, p. 56*).

Três modelos de construção diferentes, **a mesma grade e as mesmas duas
teclas**. Foi assim que a Blizzard resolveu: a ficção muda, a interface não.

---

## 3. As duas páginas, raça por raça, com a letra de cada estrutura

Tudo abaixo é copiado das páginas de Hot Keys do compêndio oficial. O
**mapeamento casa a casa** é reconstrução minha: a Blizzard lista as
estruturas em ordem, e essa ordem bate com a figura medida do manual (seção 4).
Onde a reconstrução pode estar errada, ela está errada no mesmo lugar para
todo mundo — a lista e as letras são certas.

### Terran — `B` básicas (8) e `V` avançadas (4)

Fonte: [classic.battle.net/scc/terran/hk.shtml](https://classic.battle.net/scc/terran/hk.shtml)

```
PÁGINA BÁSICA (B)                    PÁGINA AVANÇADA (V)
┌─────────┬─────────┬─────────┐      ┌─────────┬─────────┬─────────┐
│ Command │ Supply  │Refinery │      │ Factory │Starport │ Science │
│ Center C│ Depot  S│        R│      │        F│        S│ Facil. I│
├─────────┼─────────┼─────────┤      ├─────────┼─────────┼─────────┤
│Barracks │ Engin.  │ Missile │      │ Armory  │         │         │
│        B│ Bay    E│ Turret T│      │        A│  vazia  │  vazia  │
├─────────┼─────────┼─────────┤      ├─────────┼─────────┼─────────┤
│ Academy │ Bunker  │ CANCELAR│      │         │         │ CANCELAR│
│        A│        U│    ⊘    │      │  vazia  │  vazia  │    ⊘    │
└─────────┴─────────┴─────────┘      └─────────┴─────────┴─────────┘
```

Repare no `U` de B**u**nker: o `B` já era do Barracks. A Blizzard escolheu a
letra pela **colisão**, não pela inicial.

Os **add-ons** ficam fora das duas páginas: ComSat Station (`C`) e Nuclear Silo
(`N`) na carta do Command Center, Machine Shop (`C`) na do Factory, Covert Ops
(`C`) e Physics Lab (`P`) na do Science Facility. Eles são construídos **pelo
prédio-mãe**, não pelo SCV — e é assim que 18 estruturas terran cabem em duas
páginas de 8.

### Protoss — `B` básicas (8) e `V` avançadas (8)

Fonte: [classic.battle.net/scc/protoss/hk.shtml](https://classic.battle.net/scc/protoss/hk.shtml)

```
PÁGINA BÁSICA (B)                    PÁGINA AVANÇADA (V)
┌─────────┬─────────┬─────────┐      ┌─────────┬─────────┬─────────┐
│  Nexus  │  Pylon  │Assimilat│      │Robotics │Stargate │ Citadel │
│        N│        P│        A│      │ Facil. R│        S│ of Adun C│
├─────────┼─────────┼─────────┤      ├─────────┼─────────┼─────────┤
│ Gateway │  Forge  │ Photon  │      │Robotics │  Fleet  │ Templar │
│        G│        F│ Cannon C│      │ Sup.BayB│ Beacon F│ Archiv.T│
├─────────┼─────────┼─────────┤      ├─────────┼─────────┼─────────┤
│Cybernet.│ Shield  │ CANCELAR│      │Observat.│ Arbiter │ CANCELAR│
│ Core   Y│ Battery B│   ⊘    │      │        O│Tribunal A│   ⊘    │
└─────────┴─────────┴─────────┘      └─────────┴─────────┴─────────┘
```

**O Protoss enche as duas páginas exatamente.** São 16 estruturas protoss no
Brood War e 16 casas úteis (8 + 8). Não sobra uma. Isso não é coincidência: é o
teto da grade definindo quantos prédios a raça pode ter.

E o `Y` de C**y**bernetics Core conta a mesma história do Bunker: `C` já era do
Photon Cannon.

### Zerg — `B` mutação básica (6) e `V` mutação avançada (5)

Fonte: [classic.battle.net/scc/zerg/hk.shtml](https://classic.battle.net/scc/zerg/hk.shtml)

```
PÁGINA BÁSICA (B)                    PÁGINA AVANÇADA (V)
┌─────────┬─────────┬─────────┐      ┌─────────┬─────────┬─────────┐
│Hatchery │  Creep  │Extractor│      │  Spire  │ Queen's │  Nydus  │
│        H│ Colony C│        E│      │        S│ Nest   Q│ Canal  N│
├─────────┼─────────┼─────────┤      ├─────────┼─────────┼─────────┤
│Spawning │Evolution│Hydralisk│      │Ultralisk│ Defiler │         │
│ Pool   S│ Chamber V│ Den   D│      │ Cavern U│ Mound  D│  vazia  │
├─────────┼─────────┼─────────┤      ├─────────┼─────────┼─────────┤
│         │         │ CANCELAR│      │         │         │ CANCELAR│
│  vazia  │  vazia  │    ⊘    │      │  vazia  │  vazia  │    ⊘    │
└─────────┴─────────┴─────────┘      └─────────┴─────────┴─────────┘
```

A página do Zerg é a mais instrutiva, porque a Blizzard **escreveu na própria
página o raciocínio das colisões**:

> "**D** — Hydralisk **D**en (H is already used for 'H'atchery)"
> "**V** — Advanced Mutation (Buildings, **A is used for Attack and is not
> available for 'A'dvanced**)"

Ou seja: a letra `V` de "aVançado", que virou padrão nas três raças, existe
porque `A` estava ocupado por Atacar. Um acidente de teclado que virou
convenção do gênero.

**E o resto das estruturas zerg?** Sunken Colony e Spore Colony não estão na
carta do Drone: nascem da **Creep Colony**, que *"can be transformed to provide
either air or ground defense for the Hive cluster"* (*manual SC, p. 64*). Lair
e Hive nascem da Hatchery (*p. 63*), Greater Spire nasce do Spire. São 5
estruturas que **não ocupam casa nenhuma na carta do operário** porque moram na
carta do prédio que as gera.

Essa é a válvula de escape do desenho inteiro, e vale escrever em uma linha:
**quando não cabe na carta do operário, a estrutura passa a ser filha de outra
estrutura.** Terran fez com os add-ons, Zerg fez com as mutações, Protoss não
precisou porque coube certinho.

---

## 4. Dentro da página: casas, Cancelar, tecla, e o botão bloqueado

### Quantas casas, e onde fica o Cancelar

**Nove casas, e a nona — canto inferior direito, posição 9 — é o Cancelar.**
Medido nas figuras do *manual SC, p. 15 e p. 18*: nas duas, o SCV está com a
página básica aberta ("Select Location" na tela) e a casa 9 mostra o símbolo
⊘ (círculo cortado). As outras oito casas estão todas ocupadas por ícone de
prédio.

**Teto de 8 estruturas por página.** Não é convenção: é subtração. Nove menos
o Cancelar.

### A tecla

**`Escape`.** A lista de atalhos do *manual SC, p. 22* não cobre a construção
(ela para nos comandos de jogo e de janela), mas o Escape como Cancelar está
documentado na [StarCraft Wiki](https://starcraft.fandom.com/wiki/Hotkey), na
seção de comandos universais do StarCraft — junto com `B - Build Structure` e
`V - Build Advanced Structure`, que batem com as páginas oficiais da Blizzard e
servem de aferição para a fonte.

### O que aparecia numa casa cuja estrutura ainda não estava liberada

**A casa continua lá, com o ícone, apagada.** Não some e não fica vazia.

A prova de mecanismo é a estrutura interna do botão: ele tem um campo
**Unavailable** separado do **Available**, e a documentação de FireGraft
descreve o efeito em texto ([staredit.net](http://staredit.net/topic/17533/)):

> "**GREYING OUT BUTTONS** — This tutorial will teach you an easy way to grey
> out buttons. (…) The red circle shows the **Unavailable text. This is the
> text that appears when the player mouses over a button that is greyed out.**
> (…) In this example, I am making the requirement 'Is researched… Irradiate.'
> What this means is **the button is greyed out until Irradiate has been
> researched by the player.**"

A prova de que era assim no jogo de 1998 está na figura do *manual SC, p. 15*.
Naquele momento da partida o jogador tem apenas Command Center e Supply Depot,
e 150 de minério: pode construir Command Center, Supply Depot, Refinery,
Barracks e Engineering Bay — **não** pode Missile Turret (pede Engineering
Bay), Academy nem Bunker (pedem Barracks). Medindo o brilho de cada casa na
digitalização a 600 dpi, todas as oito têm desenho, e as três mais escuras são
exatamente as casas **6, 7 e 8** — Missile Turret, Academy e Bunker:

| casa | estrutura | podia construir? | brilho máximo medido |
|---|---|---|---|
| 1 | Command Center | sim | 163 |
| 2 | Supply Depot | sim | 144 |
| 3 | Refinery | sim | **202** |
| 4 | Barracks | sim | **190** |
| 5 | Engineering Bay | sim | **202** |
| 6 | Missile Turret | **não** | 118 |
| 7 | Academy | **não** | **91** |
| 8 | Bunker | **não** | 135 |
| 9 | Cancelar | — | 248 |

Ressalva honesta: é uma digitalização em tons de cinza de uma página impressa
em 1998, e o ícone de cada prédio tem brilho próprio. A medição **não** prova
sozinha o apagamento — ela é consistente com ele, e as três casas indisponíveis
serem as três mais escuras entre oito é o tipo de coincidência que não acontece
por acaso. A prova de mecanismo é o campo `Unavailable`; a medição é a
confirmação de que ele estava em uso na página de construção.

---

## 5. Falta de recurso e falta de pré-requisito **não** eram tratadas igual

Esta é a parte mais útil do capítulo, e as duas fontes convergem.

**Pré-requisito que falta → o botão apaga.** É a condição do botão, o campo
`Conditions` da seção 1: *"the button is greyed out until Irradiate has been
researched"*. O jogador vê o cadeado e o texto do que falta ao passar o cursor.
É informação **permanente** — não muda sozinha, só construindo alguma coisa.

**Recurso que falta → o botão continua aceso, e o jogo reclama depois de você
apertar.** O manual documenta isso passo a passo no tutorial (*manual SC,
p. 15*):

> "4. Should you attempt to build another SCV, the message **Not Enough
> Supplies… Build More Supply Depots** will display directly on the Main
> Screen."

Você aperta. O botão responde. A mensagem aparece **no campo de jogo**, não no
painel. E para minério é a mesma lógica — o manual manda **esperar**, não
manda procurar o botão de volta (*manual SC, p. 18*):

> "Move the arrow over the buttons and select the one that says Build Refinery.
> **Once you have collected the required amount of resources as indicated in
> the heads-up display**, select the Build Refinery button."

O custo, aliás, nunca ficou gravado no botão: aparecia ao passar o cursor
(*manual SC, p. 14*) — *"Note that the cost of building this unit and how many
supplies it requires appears in a heads-up display that is directly connected
to the Command Button. **All costs for buildings and upgrades will appear in
the same way**"*.

**A regra por trás disso, em uma frase:** o que muda sozinho em dez segundos
não desabilita botão; o que só muda se o jogador fizer alguma coisa, sim. O
minério sobe enquanto você olha; o Barracks não aparece sozinho. Tratar os dois
como "indisponível" ensinaria ao jogador que o painel mente.

E há um terceiro canal, para o erro de **lugar** (*manual SC, p. 16*):

> "If you attempt to place a building in a location that is restricted, the
> portion of the building image that lies within the restricted location will
> be denoted by a **red tint**. Also, **a message will inform you why you
> cannot build there**, and you will be unable to place the building."

Três problemas, três canais diferentes: pré-requisito no **botão**, recurso na
**mensagem**, lugar no **fantasma da estrutura**. Nenhum dos três usa o canal
do outro.

---

## 6. O que o StarCraft II mudou

O que **não** mudou: a carta de construção continua sendo duas páginas com as
mesmas teclas. A [StarCraft Wiki](https://starcraft.fandom.com/wiki/Hotkey)
lista, na seção do StarCraft II, os mesmos `B - Build Structure`,
`V - Build Advanced Structure` e `Escape - Cancel` que lista na seção do
StarCraft I. Doze anos depois, o mesmo desenho.

O que mudou:

1. **A grade cresceu de 9 para 15 casas** — três linhas de cinco. A evidência é
   o perfil de atalhos "Grid" que a Blizzard passou a oferecer:
   *"There are profile options for Standard, **Grid (which maps everything to
   15 specific keys)**, left-handed options for both, and the original
   StarCraft's hotkeys, as well as custom profiles"*
   ([StarCraft Wiki, Hotkey](https://starcraft.fandom.com/wiki/Hotkey)). Grid é
   literalmente "a tecla é a posição": 15 teclas porque 15 casas.
2. **A posição da casa virou assunto de nota de atualização.** Uma nota do
   beta de Heart of the Swarm registra que *o botão Build SCV do Command Center
   foi movido de volta para a casa do canto superior esquerdo* — mexer em qual
   casa um comando ocupa passou a ser mudança digna de changelog, do mesmo
   tamanho de um ajuste de equilíbrio. Ressalva: achei essa linha no
   [compilado de notas de beta de HotS da StarCraft Wiki](https://starcraft.fandom.com/wiki/StarCraft_II:_Heart_of_the_Swarm_beta_patch)
   e **não** consegui abrir a cópia da Blizzard que a contém — as notas
   oficiais que li (2.0.1 e 2.0.2) não têm essa linha.
3. **Apareceu uma carta simplificada para iniciante.** As notas oficiais do
   beta 2.0.2 acrescentam, entre as novas opções de controle "added to help
   newer players", uma chamada **"Simple Command Card"**
   ([Blizzard News, HotS Beta Patch 2.0.2](https://news.blizzard.com/en-gb/article/10053252/starcraft-ii-heart-of-the-swarm-beta-patch-2-0-2)).
   A Blizzard mediu que 15 casas eram demais para quem estava chegando e
   ofereceu menos, em vez de reorganizar.

**Declaração de designer explicando o porquê: eu não achei.** Procurei nas
entrevistas do Dustin Browder (Game Informer, Gamasutra, Escapist), nas notas
de atualização e na documentação do editor, e o que existe é o comportamento
registrado, não a justificativa. Registro isso como lacuna em vez de inventar
motivo.

---

## O que serve para nós

Nossa barra é `#barraAcoes` (`index.html:130`), com `#acoesContexto` recebendo
os botões por `UI.atualizarAcoes` (`src/ui2.js`). A página de construção já
existe — `UI.botaoConstruir` e `UI.paginaConstruir` (`src/ui2.js:368` e `:376`)
— e já faz duas coisas certas por conta própria: troca a carta inteira em vez
de abrir janela, e **apaga por requisito mas não por recurso** (o comentário no
código diz exatamente isso, e a seção 5 acima confirma que era assim mesmo).

O problema medido é de **largura**. A conta do CSS a 390 px: `#barraAcoes` tira
20 px de padding, `.selecao-info` toma até 34 % (≈126 px), sobra ≈234 px para
`.botoes`; com `.acao { min-width: 62px }` e `gap: 6px`, cabem **3 botões no
piso do CSS** — e como os rótulos reais ("Centro de Pesquisa", "Torre de
muralha") empurram o botão para além dos 62 px, na tela dá os **2 botões e
meio** que o dono mediu. Contra isso, `paginaConstruir` despeja **19
estruturas** numa fileira só que rola (`src/data.js`: 20 estruturas, menos a
Central).

### A solução do StarCraft para este mesmo problema

**Ele nunca rolou nada.** A resposta dele, em ordem de importância:

1. **Teto duro por página, e o teto é o que cabe na tela.** Oito. Se não cabe,
   não é "role mais" — é outra página.
2. **Quando não cabe nem em duas páginas, a estrutura muda de dono.** Add-on
   vira filho do prédio-mãe (Terran), mutação vira filha da colônia (Zerg).
3. **Cancelar/Voltar sempre na mesma casa**, a última.
4. **Bloqueado apaga, não some.** Casa que aparece e desaparece conforme o
   minério é casa que anda, e casa que anda o dedo não decora.

### O que disso cabe numa barra horizontal de celular

**Cabe o item 1, e ele é a correção.** Nossas quatro categorias em
`CATEGORIAS` (`src/ui2.js:529`) já dividem as 19 estruturas em **base 6,
produção 2, tecnologia 3, defesa 8** — nenhuma passa do teto de oito do
StarCraft. Trocar a fileira única de 19 por uma escolha de categoria (4 botões,
que também não cabem de uma vez, mas 4 rolam e 19 não) e depois a página da
categoria é aplicar o mecanismo do Zerg um nível mais fundo. Custo honesto:
**um toque a mais** para chegar na estrutura. Ganho: nenhuma página passa de 8,
e a estrutura tem endereço — "defesa, terceira" é decorável, "a décima quarta
da fileira" não é.

**Cabe o item 3, com uma inversão que a gente já fez certo.** O StarCraft põe o
Cancelar na última casa porque a grade 3×3 está **inteira na tela**, sempre.
Numa fileira que rola, a última casa é justamente a que não se vê — e
`paginaConstruir` já põe o "Voltar" **primeiro** (`src/ui2.js:378`). Está
certo: a regra do StarCraft não é "na casa 9", é "na casa que está sempre
visível". Vale escrever o porquê no código, para ninguém "consertar" depois.

**Cabe o item 4, e já está feito** — `desativado` por `requisitoFaltante` e
classe `sem-recurso` por `temRecurso` (`src/ui2.js:395-405`). É a seção 5 deste
capítulo, implementada antes de ser pesquisada.

### O que NÃO dá para copiar, sem enrolação

- **A grade 3×3.** Ela custa três alturas de botão. O StarCraft tinha 640×480
  com um console fixo ocupando um quarto da tela; nós temos um canvas que
  precisa da altura toda. Duas linhas já seriam +58 px de campo de batalha
  perdidos. Se um dia sobrar altura, duas linhas de 4 resolvem uma categoria
  inteira sem rolagem — mas é uma troca contra o jogo, não um ganho de graça.
- **O custo aparecendo só ao passar o cursor** (*manual SC, p. 14*). Não existe
  "passar o dedo por cima" sem tocar. O nosso `precoTexto` escrito no botão é a
  adaptação certa, e é uma das poucas coisas em que o toque é melhor que o
  mouse.
- **O teto de oito como número.** Oito era o que cabia na tela dele. Na nossa,
  cabem três. O que se copia é a **regra** — a página não passa do que cabe —,
  não o número.
- **A letra amarela.** Nossos botões já carregam `tecla` (`src/ui2.js:140`), e
  num celular sem teclado ela não serve de atalho. Serve de **nome curto**, o
  que é outra coisa: mantém para quem joga no notebook, não conta como solução
  de largura.
- **A rolagem.** Não há resposta do StarCraft para rolar uma barra, porque o
  StarCraft não rolava. Qualquer desenho nosso que dependa de o jogador
  descobrir que a barra rola está resolvendo um problema que o clássico
  eliminou em vez de administrar.
