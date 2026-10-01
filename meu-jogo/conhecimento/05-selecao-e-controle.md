# 05 — Seleção e controle de tropas

O que um jogador de RTS "já sabe" antes de abrir o nosso jogo. Este capítulo
levanta o vocabulário que os clássicos fixaram entre 1997 e 2010, com fonte para
cada afirmação, e termina dizendo o que disso já existe em `src/` e o que falta.

A regra da pasta vale aqui: **afirmação técnica vem com link**. Onde a fonte é um
fórum e não a documentação oficial, isso está dito na frase.

---

## 1. Clique duplo: todos do mesmo tipo **na tela**

A página oficial de controles do StarCraft (Blizzard, 1998) é explícita quanto ao
gesto e quanto ao escopo:

> "Double-Clicking on a unit will select all units of the same type that are on
> the screen (up to 12.)"
> — [Blizzard, *StarCraft: Hot Keys and Special Commands*](https://classic.battle.net/scc/gs/control.shtml)

Dois detalhes que costumam ser copiados errado:

- **O escopo é a TELA, não o mapa.** O jogador escolhe o conjunto movendo a
  câmera antes de dar o duplo clique. É por isso que o gesto é seguro: ele nunca
  arrasta para a briga uma unidade que está do outro lado do mapa.
- **O limite de 12** é do StarCraft de 1998 (ver §9), não do conceito.

O **Age of Empires II** adotou o mesmo gesto com o mesmo escopo, e acrescentou a
variante com Shift para **somar** à seleção atual:

> "Double clicking on a unit selects all units of that type that are on your
> screen." / "Shift+double-click adds units of that type to your current
> selection."
> — [fórum oficial da Steam, *hotkeys and mouse shortcuts* (AoE II 2013)](https://steamcommunity.com/app/221380/discussions/0/618453594742210071/)

E o escopo aparece confirmado, com as mesmas palavras, num pedido de melhoria no
fórum oficial do Age of Empires, que descreve o comportamento vigente como
"todas as unidades e construções **que estão na tela** e do tipo clicado":

> "all units and buildings that are both on screen and of the type clicked are
> added to selection"
> — [Age of Empires Forum, *Feature Request: Mimic Double Click Select All with Ctrl-Left Click*](https://forums.ageofempires.com/t/feature-request-mimic-double-click-select-all-with-ctrl-left-click/62346)

### A variante Ctrl+clique

O **StarCraft II** oferece o mesmo resultado sem depender do tempo entre dois
cliques — e essa é a razão declarada do pedido acima: com unidades pequenas,
rápidas ou com a câmera afastada, o clique duplo falha.

> "In addition to dragging a box around multiple units to select more than one
> unit, you can select multiple units of the same type by holding the Ctrl key
> and left-clicking on one unit."
> — [Blizzard, *Game Guide: Special Control* (StarCraft II)](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)

O mesmo guia descreve o Shift como o modificador de **somar**:

> "To add new units to a group of selected units, hold down the Shift key and
> left-click on the desired unit while you have your group selected."
> — [Blizzard, *Game Guide: Special Control*](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)

No Age of Empires II o Ctrl+clique **não** faz isso para unidades (é justamente o
que o tópico do fórum pede); lá o Ctrl+clique serve para selecionar **vários
prédios de produção do mesmo tipo** de uma vez:

> "Select several of the same production building (e.g. barracks) by holding
> **Ctrl + left-click**. Then click the unit portrait as normal (or use the
> hotkey) to **distribute the queue evenly** among all selected buildings."
> — [World's Edge / Microsoft, *What's new in Age of Empires: Definitive Edition?*](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/)

### Antes do clique duplo

O **Total Annihilation** (1997) resolvia o mesmo problema por tecla, não por
gesto: `CTRL+Z` — "Select all units of same type"
([guia de atalhos na Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=2181866522)) —
e a comunidade usa `CTRL`+clique esquerdo para os do mesmo tipo que estão na tela
([Total Annihilation Universe, tópico *CTRL + LEFTCLICK select all units of the same type on screen*](https://www.tauniverse.com/forum/showthread.php?p=734172)).
Ou seja: **o problema é anterior ao gesto**. O que o clique duplo trouxe foi um
atalho que não exige teclado — e é exatamente por isso que ele é o candidato
natural para o toque (§10).

---

## 2. Grupos de controle

A formulação canônica também é de 1998, e já traz as três operações:

> "You can assign a building, building add-on, or a group of up to 12 units to a
> single key." … "Pressing a group number twice will center the screen on the
> group."
> — [Blizzard, *StarCraft: Hot Keys and Special Commands*](https://classic.battle.net/scc/gs/control.shtml)

- **Gravar:** `Ctrl` + número (0–9 no StarCraft; dez grupos).
- **Chamar:** o número sozinho.
- **Centralizar:** o número **duas vezes** em sequência rápida. O StarCraft II
  manteve o comportamento sem mudar uma vírgula:
  > "Pressing the number key twice in quick succession centers your view on the
  > group you've assigned to it."
  > — [Blizzard, *Game Guide: Special Control*](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)

**Acrescentar sem apagar:** no StarCraft II, `Shift`+número **soma** a seleção ao
grupo já existente, enquanto `Ctrl`+número **substitui** o grupo inteiro
([*The Beginner's Guide to Starcraft 2 Part II: Hotkeys*](https://tictactactics.wordpress.com/2015/07/18/the-beginners-guide-to-starcraft-2-part-ii-hotkeys/) —
"select them then hit Shift 3"). No AoE II a mesma dupla aparece descrita pelos
jogadores como `Shift`+número para somar
([fórum da Steam](https://steamcommunity.com/app/221380/discussions/0/618453594742210071/)).

No **Age of Empires II** o conjunto é idêntico, inclusive o duplo toque:

> "Create groups using **Ctrl + 1–9** … Press the number twice to center the
> screen on it — instant map control."
> — [AoE2 DB, *Hotkeys & Ranked Settings*](https://aoe2db.com/hotkeys)

No **Total Annihilation** a tecla muda mas o conceito não: `CTRL+1-9` grava,
`ALT+1-9` chama
([guia de atalhos na Steam](https://steamcommunity.com/sharedfiles/filedetails/?id=2181866522)).

Um quarto verbo, menos conhecido, que o StarCraft tinha: **`Alt`+clique numa
unidade seleciona o grupo inteiro a que ela pertence** — "Hold down Alt and click
on one unit from an earlier assigned group to select all units of that group"
([Blizzard](https://classic.battle.net/scc/gs/control.shtml)). É o caminho
inverso: da unidade para o grupo.

---

## 3. Fila de ordens com Shift (waypoints)

A mecânica é do StarCraft, e a página oficial descreve as duas formas — waypoint
de trajeto e fila de comandos quaisquer:

> "Select the units, then hold down Shift. While holding Shift down, select
> Attack then while continuing to hold down shift, repeatedly select attack and
> click on each point on either the mini-map or main screen you want the units to
> travel to." … "Hold down the shift button, and issue commands to the unit."
> — [Blizzard, *StarCraft: Hot Keys and Special Commands*](https://classic.battle.net/scc/gs/control.shtml)

**O que entra na fila.** No StarCraft II, praticamente toda ordem de unidade:
clique esquerdo e direito, Stop, Attack, Hold Position, Move, Patrol, embarcar e
desembarcar, e também habilidades — o exemplo clássico é mandar o tanque andar e,
com Shift, já apertar a tecla de montar, para ele montar ao chegar
([LearningSC2, *Queuing Commands*](https://learningsc2.com/tag/queuing-commands/)).
O Supreme Commander usa a mesma convenção: "Shift + Right Click: Queue this
command after the current one"
([*Supreme Commander Strategy Guide — Giving Orders*](https://supcom.standardof.net/supreme-commander/controls/giving-orders/)).

**O que não entra, e os limites medidos:**

- **Existe teto de comandos enfileirados.** O guia da Blizzard avisa que o número
  é limitado e que o jogo dá uma mensagem quando se chega ao limite
  ([Blizzard, *Special Control*](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)).
- **No AoE II, o Shift enfileira construções, mas a unidade não atravessa o
  mapa.** O aldeão só começa a próxima obra enfileirada se ela estiver perto (na
  linha de visão dele); se você enfileirar um quartel em cada canto do mapa, ele
  constrói só o último e ignora o resto
  ([fórum da Steam, AoE II](https://steamcommunity.com/app/221380/discussions/0/618460171322095359/)).
- **Produção é outra fila.** `Shift`+clique no retrato da unidade enfileira 5 de
  uma vez — "**Shift + click** to queue 5 at a time"
  ([World's Edge](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/)).
  É uma fila do **prédio**, não da unidade; as duas não se misturam.
- No Supreme Commander, **repetir a fila de produção** não tem atalho: tem de ser
  clicado na interface
  ([*Giving Orders*](https://supcom.standardof.net/supreme-commander/controls/giving-orders/)).

---

## 4. Ponto de encontro (rally point)

O ponto de encontro tem três níveis, e quase todo jogo novo implementa só o
primeiro:

**(a) No chão.** "With any unit production building selected, **right-click** at
any point on the ground to have all units produced at that building gather
there."
([World's Edge](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/)).

**(b) Sobre um recurso — e a unidade já sai trabalhando.** É o que transforma o
rally de conveniência em economia:

> "Setting the Rally Point of your command center / nexus / hatchery on mineral
> patches or vespene geysers will automatically command new workers to begin
> gathering those resources."
> — [Blizzard, *Game Guide: Buildings* (StarCraft II)](https://news.blizzard.com/en-us/article/4488317/game-guide-buildings)

> "You can command workers to build and harvest Lumber or mine Gold by setting
> the Rally Point of the Town Hall on trees or the Gold Mine."
> — [Blizzard, *Warcraft III Basics: Buildings*](http://classic.battle.net/war3/basics/buildings.shtml)

> "With the Town Center selected, **right-click** on anything you could send a
> villager to gather or build. New villagers created at that TC will head
> straight to that resource."
> — [World's Edge](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/)

No AoE II, quando a jazida do ponto de encontro econômico acaba, os aldeões vão
sozinhos para outra do mesmo tipo por perto
([Age of Empires Wiki, *Gather Point*](https://ageofempires.fandom.com/wiki/Gather_Point)).

**(c) Sobre uma unidade.** "Rally Points can also be set on units to ensure that
any new troops emerging from a building will group up around the designated
unit."
([Blizzard, *Game Guide: Buildings*](https://news.blizzard.com/en-us/article/4488317/game-guide-buildings)).
No Warcraft III o rally pode apontar para transporte ou toca, e aí a unidade nova
**embarca sozinha**; e as unidades saem do prédio pelo lado do destino
([Blizzard](http://classic.battle.net/war3/basics/buildings.shtml)).

**O caso do alvo que morre** está documentado e é a parte que costuma virar bug
em jogo caseiro: se o alvo do rally morre **depois** que a unidade já saiu, ela
continua até o último ponto onde ele estava; se morre **antes** de a produção
terminar, a unidade nova fica parada ao lado do prédio, "as if there'd never been
a rally point"
([Blizzard, *Game Guide: Buildings*](https://news.blizzard.com/en-us/article/4488317/game-guide-buildings)).

---

## 5. Botão de ocioso (e a tecla que **percorre**)

O botão de trabalhador ocioso é, junto do attack-move, o item com melhor relação
entre custo de implementação e ganho para o jogador.

> "Clicking this icon (or pressing the **F1** key) will automatically select and
> **cycle through** your idle workers." … "Control and F1 to select all of idle
> workers."
> — [Blizzard, *Game Guide: Special Control* (StarCraft II)](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)

No Age of Empires as teclas são pontuação, e há duas categorias:

> "Hit **hotkey .** to immediately select the next idle villager and get them
> back to work!" … "Hit **hotkey ,** to find your idle military units and send
> them to destroy your opponent!"
> — [World's Edge](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/)

No AoE II DE, `Shift`+`.` seleciona **todos** os aldeões ociosos de uma vez, e
`Shift`+`,` todos os militares ociosos
([fórum da Steam, AoE II DE](https://steamcommunity.com/app/813780/discussions/0/1737758544549549220/)).
O guia de atalhos do AoE2 DB chama o `.` de "the single most valuable hotkey — an
idle villager is wasted resources"
([AoE2 DB](https://aoe2db.com/hotkeys)).

As três partes que fazem a função funcionar, e que raramente vêm juntas:
**(1)** um **contador visível** na tela (o ícone existe antes da tecla),
**(2)** um **ciclo** que vai de um em um e **leva a câmera junto**, e
**(3)** um atalho separado para pegar todos de uma vez.

---

## 6. Attack-move, patrulha, parar — e por que o attack-move é a ordem mais importante do gênero

**Attack-move (`A`).** Move até o ponto; se encontrar inimigo no caminho, ataca.
A razão de ser a ordem mais importante está na consequência de usar a errada:

> "Attack-move causes the selected group to move to a location, and if any
> enemies are encountered along the way, the group will attack that enemy until
> it is killed." … "if they use the 'move' command instead, their armies will
> march right past enemy units without stopping or retaliating to damage, a
> potentially disastrous maneuver."
> — [StarCraft Wiki, *Attack move*](https://starcraft.fandom.com/wiki/Attack_move)

Ou seja: o `move` puro é uma ordem que **desliga a inteligência da tropa**. Toda a
diferença entre um exército que atravessa a base inimiga morrendo sem revidar e
um exército que briga está em qual das duas ordens o jogador deu. Os outros jogos
descrevem a mesma coisa com outras palavras:

> "**Hold A and right-click** to send your army to a location and attack any
> opponents on the way!"
> — [World's Edge, Age of Empires: Definitive Edition](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/)

> "Attack Move instructs units to pursue enemies before completing their move
> order. It is denoted as a red line with a blue Move waypoint."
> — [*Supreme Commander Strategy Guide — Giving Orders*](https://supcom.standardof.net/supreme-commander/controls/giving-orders/)

**Corolário de design:** se o attack-move é o que o jogador quer 90% das vezes, o
**clique simples no terreno deveria ser attack-move**, e o `move` puro é que
merece tecla. Foi a conclusão a que o nosso `ui.js` já tinha chegado (§11).

**Patrulha (`P`).** É o attack-move que **repete**: a unidade vai e volta entre o
ponto atual e o destino, atacando quem encontrar no caminho
([Liquipedia, *Basic Unit Commands* (Brood War)](https://liquipedia.net/starcraft/Basic_Unit_Commands);
discussão comparativa em [TeamLiquid, *Hold Position, Attack-Move, Patrol*](https://tl.net/forum/sc2-strategy/223737-hold-position-attack-move-patrol)).
No Supreme Commander a patrulha ganha um segundo uso econômico: "Engineers set to
Patrol will automatically Repair and Reclaim"
([*Giving Orders*](https://supcom.standardof.net/supreme-commander/controls/giving-orders/)) —
patrulha de engenheiro é manutenção automática, não vigilância.

**Parar / manter posição.** `Stop` cancela a ordem atual; `Hold Position` é
diferente: a unidade **não sai do lugar**, mas continua atirando em quem entrar no
alcance
([StarCraft II mechanics wiki, *Hold Position Command*](https://starcraft-ii-mechanics.fandom.com/wiki/Hold_Position_Command)).
No Age of Empires II a mesma ideia aparece como **postura**, não como ordem (§8).

---

## 7. Formações do Age of Empires II

O AoE II pôs quatro formações num botão só, e cada uma existe por causa de uma
ameaça concreta — não por estética
([Age of Empires Wiki, *Battle Formations*](https://ageofempires.fandom.com/wiki/Battle_Formations) e
[*Unit formation*](https://ageofempires.fandom.com/wiki/Unit_formation)):

| formação | o que faz | por que existe |
|---|---|---|
| **Linha** (Line) | fileiras largas e rasas | apresenta pouca profundidade ao tiro de mangonel |
| **Caixa** (Box) | quadrado com os frágeis (monges, aríetes) no centro | protege o que não pode apanhar |
| **Dispersa** (Staggered) | mesma linha, com o dobro do espaçamento entre unidades | dano em área só pega um por vez |
| **Flanco** (Flank) | divide a seleção em dois blocos | cerca o inimigo pelos dois lados |

A quinta opção, **Split**, dispersa o grupo — usada, por exemplo, para entrar
dentro do alcance mínimo de máquinas de cerco, onde elas não conseguem atirar
([Age of Empires Wiki, *Battle Formations*](https://ageofempires.fandom.com/wiki/Battle_Formations)).

A lição de projeto: **formação, aqui, é só uma regra de espaçamento e de ordem de
fila aplicada ao conjunto selecionado**. Não precisa de IA nova; precisa de uma
função que distribua os destinos ao redor do ponto clicado. E a formação
"dispersa" existir prova que o problema que ela resolve é real: **grupo colado
morre junto para dano em área.**

---

## 8. Postura de combate

O Age of Empires II tem quatro posturas, e a descrição de cada uma é exatamente o
comportamento que o nosso `sim-combate.js` teria de implementar
([Age of Empires Wiki, *Unit stance*](https://ageofempires.fandom.com/wiki/Unit_stance)):

| postura | comportamento |
|---|---|
| **Agressiva** | persegue o inimigo avistado, sem limite de distância, até matá-lo |
| **Defensiva** | ataca quem entra no alcance e persegue **poucos ladrilhos**, depois volta ao ponto de origem; recua alguns ladrilhos se for atingida por algo fora do seu campo de visão |
| **Parada** (Stand Ground) | não se move para atacar, mas atira em quem entra no alcance |
| **Sem ataque** (No Attack) | nunca ataca sozinha; só por ordem explícita |

A linhagem Total Annihilation / Supreme Commander separa a mesma decisão em dois
eixos — um de **fogo**, outro de **movimento**. O estado de fogo alterna entre
**Fire At Will**, **Hold Fire** e **Hold Ground**
([*Giving Orders*](https://supcom.standardof.net/supreme-commander/controls/giving-orders/);
discussão de jogadores sobre o uso do Hold Fire para não revelar posição em
[Steam, Supreme Commander: Forged Alliance](https://steamcommunity.com/app/9420/discussions/0/610573567799671515/)).

Por que isso importa mais do que parece: **a postura agressiva é a causa número um
de exército que se desmancha sozinho**. Uma unidade que persegue sem limite sai da
formação, entra no alcance das torres inimigas e morre longe do grupo. A postura
defensiva com "volta ao ponto de origem" é a correção — e é a razão pela qual
jogos de defesa de base costumam ter **defensiva como padrão**, não agressiva.

---

## 9. Quantas unidades cabem numa seleção (e o que isso muda)

- **StarCraft (1998): 12.** "a group of up to 12 units"
  ([Blizzard](https://classic.battle.net/scc/gs/control.shtml)).
- **Age of Empires II: 40**, elevado para **60** na Definitive Edition; os
  jogadores contornam com grupos de controle
  ([fórum da Steam, AoE II DE](https://steamcommunity.com/app/813780/discussions/0/597399204164303268/)).
- **StarCraft II: sem limite**, com 24 retratos visíveis e abas para o resto
  ([discussão técnica no TeamLiquid](https://tl.net/forum/starcraft-2/53514-no-unit-selection-cap)).

Consequência de projeto: **quando o limite some, o grupo de controle deixa de ser
atalho e vira a interface principal.** Foi o que aconteceu no StarCraft II — e é o
motivo pelo qual o `Shift`+número (somar ao grupo) e o duplo toque (centralizar)
passaram a ser obrigatórios, não enfeite.

---

## 10. Como tudo isso foi traduzido para o toque

### O que funcionou

**Selecionar por unidade lógica, não por pixel.** No *Company of Heroes* para
iPad a unidade de seleção é o **esquadrão**, e o toque em qualquer soldado pega o
grupo inteiro:

> "Tapping on a single member of any squad, will select that entire squad"
> — [Maxi-Geek, *Company of Heroes iPad Review*](https://www.maxi-geek.com/con/company-of-heroes-ipad-review)

**Menu radial no toque longo.** O jogo trouxe **dois** esquemas de controle: o
*Command Panel*, para quem vem do PC, e o *Command Wheel*, um menu radial que
aparece ao tocar e segurar
([Maxi-Geek](https://www.maxi-geek.com/con/company-of-heroes-ipad-review);
[Pocket Tactics, *Company of Heroes review*](https://www.pockettactics.com/company-of-heroes/review) —
"You can also use a convenient pop-up wheel to make specific orders").
Oferecer os dois, e deixar o jogador escolher, é o padrão que sobreviveu.

**Seleção por proximidade em vez de arrasto preciso.** No *Iron Marines*, o
**duplo toque** numa unidade seleciona ela e as que estiverem perto, e arrastar
depois disso já é a ordem de movimento
([Level Winner, *Iron Marines Guide*](https://www.levelwinner.com/iron-marines-ios-guide-18-useful-tips-cheats-tricks/);
[AppUnwrapper, *Iron Marines Walkthrough Guide*](https://www.appunwrapper.com/2017/09/16/iron-marines-walkthrough-guide-tips-and-tricks/)).
No *Rusted Warfare*, segurar o dedo sobre uma unidade faz **crescer um círculo de
seleção** ao redor dela, como alternativa à caixa
([Droid Gamers, *New RTS game for Android, Rusted Warfare*](https://www.droidgamers.com/news/new-rts-game-for-android-rusted-warfare-has-a-lot-of-potential/)).
É o mesmo problema do clique duplo do StarCraft — "me dê o pelotão que está
aqui" — resolvido sem precisão de dedo.

**Simplificar o verbo até caber num toque.** O *Bad North* eliminou a seleção
múltipla inteira:

> "Tap the troop unit and then tap where you want them to go, they'll then attack
> automatically if they are near an enemy unit."
> — [LadiesGamers, *Bad North: Jotunn Edition Review*](https://ladiesgamers.com/bad-north-jotunn-edition-review-nintendo-switch/)

Câmera por gesto, sem botão: "twirl the camera around with a flick of the finger"
e "two fingers to zoom in and out"
([LadiesGamers](https://ladiesgamers.com/bad-north-jotunn-edition-review-nintendo-switch/)).
A acessibilidade era meta declarada do projeto
([entrevista com os desenvolvedores, Nintendo UK](https://www.nintendo.com/en-gb/News/2018/April/Interview-Taking-on-hordes-of-invading-Vikings-in-Bad-North-1368315.html)).

**RTS completo no toque é possível.** O *Rusted Warfare* manteve caixa de seleção
e zoom com multitoque — o próprio desenvolvedor descreve a versão móvel como
tendo "multi-touch interface as mobile (eg box selection, zooming)"
([Steam, *Touch control?*](https://steamcommunity.com/app/647960/discussions/0/2666626816211273542/)).
O *Art of War 3* se anuncia como "Classic RTS controls, adapted perfectly for
mobile" ([site oficial](https://aow3.gear-games.com/)).

### O que não funcionou

**Emular o arrasto do mouse com combinação de dedos.** A caixa de seleção do
*Company of Heroes* móvel exige dois dedos e duplo toque antes de arrastar, e é
citada como o ponto fraco do porte:

> "Pulling up a selection box to grab more than one unit on the map requires a
> double-tap with two fingers followed by a drag."
> — [Pocket Tactics](https://www.pockettactics.com/company-of-heroes/review)

**Empilhar gestos.** A crítica mais dura do mesmo jogo não é a nenhum gesto
específico, mas ao número deles:

> "the only issue with the touch is there is a lot of double taps, holds, taps and
> holds, two finger taps and combinations of them, and sometimes, especially in
> the heat of battle, it is easy to get the combinations mixed up."
> — [Maxi-Geek](https://www.maxi-geek.com/con/company-of-heroes-ipad-review)

**Desistir do controle direto.** O *Age of Empires Mobile* (2024) resolveu o
problema eliminando-o: o jogador comanda o império, não a unidade, e a batalha é
automática.

> "*Age of Empires Mobile* has you commanding your empire rather than individual
> units." … "you cannot command individual units, tactfully placing them in
> advantageous positions and directly manipulating combat in real-time."
> — [Gaming.net, *Age of Empires Mobile Review*](https://www.gaming.net/reviews/age-of-empires-mobile-review-ios-android/)

Vale como aviso, não como exemplo: a mesma análise conclui que "auto-battling does
plenty to take away the thrill of war strategy, which is the core of *Age of
Empires* games". **A marca mais forte do gênero no celular abriu mão da seleção de
tropas, e a crítica registrou isso como perda.**

### Os gestos que viraram padrão

| gesto | significado consolidado |
|---|---|
| toque curto | selecionar / dar a ordem primária |
| toque **longo** | o "botão direito" que não existe — menu de contexto radial (CoH) **ou** caixa de seleção |
| arrastar com 1 dedo | mover a câmera |
| pinça com 2 dedos | zoom |
| duplo toque numa unidade | pegar o pelotão (mesmo tipo / vizinhança) |
| botão grande na tela | substitui a tecla: ocioso, parar, agrupar |

E o limite físico, que decide o tamanho de cada botão: a Apple recomenda alvo
tocável mínimo de **44×44 pt** e o Material Design, **48×48 dp**
(referência da HIG em [Apple, *Human Interface Guidelines — Layout*](https://developer.apple.com/design/human-interface-guidelines/layout);
compilação das duas regras em [Evinced, *Mobile validations — Tappable Area*](https://knowledge.evinced.com/mobile-validations/tappable-area)).
**Um gesto que exige precisão de mouse não sobrevive no celular** — é essa a
frase que explica tanto o círculo do Rusted Warfare quanto o esquadrão do Company
of Heroes.

---

## O que isso significa para o nosso jogo

### O que JÁ TEMOS

| padrão | onde está | observação |
|---|---|---|
| **Caixa de seleção** | `src/ui.js` `ligarControles` (linhas 36–145) e `selecionarNaCaixa` (282) | mouse: botão esquerdo arrasta a caixa; dedo: **toque longo de 500 ms** vira caixa, e um dedo solto arrasta a câmera. É a mesma decisão do *Company of Heroes* móvel, só que sem exigir dois dedos — e portanto melhor do que a solução criticada em §10 |
| **Grupos de controle** | `gravarGrupo` (312) e `chamarGrupo` (320) | `Ctrl`+1..9 grava, número sozinho chama, mortos são filtrados ao chamar. Igual ao StarCraft nessas duas operações |
| **Atalhos de categoria** | `selecionarGrupo` (375) | 1..4 caem em soldados / operários / aéreos / feridos quando o grupo não existe. É o nosso equivalente ao "select all army", e o "feridos" não tem paralelo nos clássicos |
| **Ociosos** | `selecionarOciosos` (341), teclas `.` e `,` | seleciona **todos** os parados de uma vez e centraliza no primeiro |
| **Attack-move como padrão** | `ordemNoTerreno` (413), linha 437: `var tipoOrdem = ordem \|\| 'moverAtacando'` | o clique simples no terreno já é attack-move, que é exatamente a conclusão de §6. Tecla `A`, e botão "Atacar" em `src/ui2.js` `acoesDeTropa` (174) |
| **Mover puro, patrulhar, recuar** | `iniciarOrdem` (405); execução em `src/sim-combate.js` (`patrulhar` 379, `moverAtacando` 408) | temos as três ordens de movimento do gênero, com botão e tecla |
| **Parar** | `pararSelecionados` (355), tecla `S` | |
| **Voltar à base** | `voltarParaBase` (366), tecla `H` | só move a câmera — é o "go to Town Center" do AoE, não uma ordem |
| **Ponto de encontro no chão** | botão "Encontro" em `ui2.js` (242), `confirmarRally` em `ui.js` (531), aplicado em `src/sim-unidades.js` (442) | e com um acerto que vale registrar: a tropa sai do prédio em `moverAtacando` e o operário em `mover` — ou seja, a tropa nova já sai protegida (§6) |
| **Fila de produção** | `src/sim-unidades.js` (410), até 6 itens | é a fila do prédio, não a fila de ordens (§3) |
| **Fogo concentrado** | `alvoPrioritario`, `ui.js` `selecionar` (264) | não tem nome consagrado no gênero; é nosso |

### O que FALTA

Em ordem de valor, medido pelo que o capítulo mostra que os jogadores esperam:

1. **Duplo toque / duplo clique = todos do mesmo tipo na tela** (§1). Não existe
   nenhum `dblclick` no projeto (verificado com `grep` em `index.html`, `ui.js`,
   `ui2.js`, `main.js`). É o gesto mais barato do capítulo: uma função sobre
   `sim.unidades` filtrando por `def` e testando `render.paraTela` dentro do
   retângulo da tela — a mesma varredura que `selecionarNaCaixa` já faz. **No
   celular é ainda mais valioso do que no PC**, porque substitui o arrasto
   preciso.
2. **Botão de ocioso na tela, com contador, e ciclo de um em um** (§5). Hoje só
   existe tecla — e **o celular não tem teclado**. Falta o ícone no HUD
   (`index.html` `#barraTopo` / `#barraAcoes`) e falta o ciclo: `selecionarOciosos`
   pega todos e centraliza no primeiro; o comportamento do StarCraft II e do AoE é
   "próximo ocioso, câmera junto", com `Shift` (ou toque longo) para todos.
3. **Fila de ordens com Shift / waypoints** (§3). `S.darTarefa`
   (`src/sim-unidades.js`, 46) **substitui** `u.tarefa` sempre — não há fila. É a
   mudança mais estrutural da lista: exigiria `u.filaTarefas` e um teto de
   comandos, mais o desenho da linha de trajeto. Deve vir depois das duas de cima.
4. **`Shift`+número para acrescentar ao grupo, e número duas vezes para
   centralizar a câmera** (§2). São dois acréscimos pequenos a `gravarGrupo` e
   `chamarGrupo` — o segundo é só guardar o instante da última chamada.
   `Shift`+clique para somar/remover uma unidade da seleção entra junto.
5. **Rally sobre jazida e sobre unidade** (§4). Hoje `b.rally` é só `{x, y}` e a
   unidade nova recebe `mover`/`moverAtacando`. Guardar `{tipo:'jazida', id}`
   faria o operário novo já sair minerando — que é o ganho econômico real do
   rally, e o que o AoE, o StarCraft II e o Warcraft III todos fazem. Junto vem o
   caso do alvo morto, que a Blizzard documenta (§4) e que seria bug silencioso
   aqui.
6. **Posturas de combate** (§8). Não existe nada de postura em `sim*.js`
   (verificado por `grep`). Para um jogo de **defesa de base**, a postura
   "defensiva" (persegue pouco e volta) e a "parada" são mais úteis do que
   formação — e o padrão deveria ser defensiva, não agressiva.
7. **Formações** (§7). É espaçamento, não IA: `ordemNoTerreno` já distribui os
   destinos numa grade 3×3 (`(i % 3) - 1`), o que é praticamente uma formação
   "caixa" acidental. Dispersa e linha seriam variações da mesma conta. Valor
   menor enquanto não houver dano em área relevante do lado inimigo.
8. **Menu radial no toque longo** (§10). Aqui há um **conflito real a decidir**:
   o nosso toque longo já é a caixa de seleção (`ui.js`, 70–78). Os dois usos não
   cabem no mesmo gesto. O *Company of Heroes* resolveu deixando o jogador
   escolher entre dois esquemas; a alternativa é toque longo **em unidade** = menu
   radial, toque longo **no vazio** = caixa. Não mudar isso sem decidir antes —
   trocar o gesto que já funciona por outro sem medir é exatamente o erro que o
   CLAUDE.md da casa proíbe.

### Uma observação sobre limite de seleção

Não temos limite (`selecionarNaCaixa` aceita tudo o que a caixa pegar). Pelo §9,
isso é a escolha moderna e está certa — mas é **justamente ela** que torna
obrigatórios os itens 1 e 4 da lista acima: sem limite, o grupo de controle deixa
de ser atalho e vira o único jeito prático de mandar em muita gente.
