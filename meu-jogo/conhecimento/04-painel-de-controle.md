# O painel de controle das unidades

Como eram, por dentro, os dois consoles que definiram o gênero: o do
**StarCraft** (Blizzard, 1998) e o do **Age of Empires II: The Age of Kings**
(Ensemble/Microsoft, 1999). Cada afirmação daqui sai do manual do próprio jogo,
do site oficial da época ou das notas de atualização do estúdio. Onde a fonte é
uma figura, digo que foi medido na figura e em qual página.

As duas fontes primárias que mais aparecem:

- **Manual do StarCraft** (Blizzard, 1998), PDF —
  [devnonsense.com/pdf/StarCraft-manual.pdf](https://devnonsense.com/pdf/StarCraft-manual.pdf),
  também no [Internet Archive](https://archive.org/details/manual_Starcraft).
  Citado como *manual SC, p. N*.
- **Manual do Age of Empires II: The Age of Kings** (Microsoft, 1999),
  digitalizado — [archive.org/details/Age_of_Empires_II](https://archive.org/details/Age_of_Empires_II).
  Citado como *manual AoK, p. N* (numeração impressa no rodapé).

---

## 1. Onde cada coisa ficava

O manual do StarCraft abre o capítulo de interface com a tela inteira rotulada
(*manual SC, p. 13*). Da esquerda para a direita, na faixa de baixo:
**Mini Map · Status Display · Portrait · Command Buttons**, com o botão
**Menu** encostado no retrato e os **Resources** sozinhos no alto da tela. O
manual define cada peça em uma linha:

> **PORTRAIT** — "This is a close up of the unit currently selected."
> **STATUS DISPLAY** — "This is detailed information, including numeric
> statistics on any building or single unit selected in the Main Screen."
> **COMMAND BUTTONS** — "These are the different commands available to the unit,
> such as Build, Attack, etc."
> **MINI MAP** — "This is a bird's eye view of your Main Screen that allows you
> to see the entire battlefield at once."

O Age of Empires II **inverte quase tudo**: os recursos ficam "in the upper-left
corner of the screen" e a minimapa "in the lower-right corner" (*manual AoK,
p. 4*). O painel de baixo é chamado o tempo inteiro de **status area at the
bottom of the screen** — é o termo do manual, e ele aparece em umas dez
passagens diferentes, cada uma pendurando mais uma informação ali.

A lição que vem de graça dessa comparação: **as duas equipes chegaram
independentemente à mesma faixa inferior contínua**, mudando só a ordem interna.
Não é convenção copiada — é o lugar onde a mão já está.

## 2. O painel do StarCraft, peça por peça

A página 19 do manual SC traz a segunda figura rotulada, a do Marine
selecionado, com sete chamadas. As definições são do próprio manual:

| peça | onde fica (medido na figura, p. 19) | o que é, no manual |
|---|---|---|
| **Wireframe** | canto esquerdo do Status Display | "A graphic representation of the health of your unit" |
| **Hit Points** | logo abaixo do wireframe (`40/40`) | "A numeric representation of the health of your unit" |
| **Unit Designation** | centro, primeira linha (`Terran Marine`) | "The name of your unit" |
| **Rank** | centro, segunda linha (`Private`) | "The military rank of your unit" |
| **Kills** | centro, terceira linha (`Kills: 0`) | "Number of enemy units personally eliminated in battle" |
| **Equipment** | dois ícones no rodapé do painel (`+0`, `+0`) | "Armor, Weapons or Special Equipment and their levels of upgrade" |
| **Portrait** | caixa própria, à direita do Status Display | "A close-up view of your unit" |

Três coisas valem ser notadas nessa lista, porque contrariam a expectativa
moderna:

1. **O wireframe é a barra de vida.** Não há barra separada no painel: o boneco
   de arame vai apagando por partes. O número `40/40` ao lado é a versão exata
   da mesma informação. O manual junta as duas explicitamente ao descrever um
   prédio sob ataque: "Note that the hit point bar, numerical ratio and unit
   wireframe reflect the state of the structure as it sustains damage"
   (*manual SC, p. 20*).
2. **Não há ataque, blindagem, alcance, linha de visão nem velocidade em
   número.** O que aparece é o **nível de upgrade** de armadura e arma (o `+0`
   dos dois ícones de Equipment). O valor absoluto do dano nunca esteve no
   painel do StarCraft.
3. **Rank e Kills não afetam regra nenhuma** — são identidade. O manual não
   promete efeito, e não há efeito. É o painel gastando espaço para fazer a
   unidade parecer um soldado com biografia em vez de uma ficha.

Para **prédios**, o mesmo painel mostra progresso: "If you select the new Supply
Depot while it is being constructed, you will notice a completion bar in the
Status Display area" e "the state of completion and the units in the queue to be
built are shown in the Status Display area" (*manual SC, pp. 14 e 16*).

## 3. A command card: grade 3×3, posição fixa, letra colorida

**Nove botões, três colunas por três linhas.** Contei na figura do próprio
manual: a página 13 mostra a Command Center selecionada com 3×3 compartimentos,
a maioria vazia; a página 19 mostra o Marine com **Move, Stop e Attack na linha
de cima e Patrol e Hold Position nas duas primeiras casas da linha do meio** — e
os quatro compartimentos restantes ficam vazios em vez de as casas ocupadas se
reorganizarem. (Medição minha nas figuras de pp. 13 e 19 do manual SC; o texto
do manual chama a área só de "Command Button area" e não cita a dimensão.)

Essa é a regra que faz a coisa funcionar: **o comando tem endereço fixo**. Um
Marine, um Zealot e um Hydralisk têm Move no mesmo pixel. O comando ausente não
promove o de baixo — deixa buraco.

**A letra de atalho vem colorida, não sublinhada.** O manual explica a convenção
logo na primeira tela do jogo: "Note that the letter S in 'Single Player' is a
different color than the rest of the title. This different colored letter is a
'hotkey' (or keyboard shortcut) which, when entered, allows you to bypass
clicking with the mouse. **This convention is used throughout the game**"
(*manual SC, p. 12*). O compêndio oficial da Blizzard repete para os botões de
unidade: "Every unit command has a hot key... Note that one of the letters
appears in **Yellow** — this is the hot key for that command"
([classic.battle.net/scc/gs/control.shtml](https://classic.battle.net/scc/gs/control.shtml)).
Os atalhos documentados na página de comandos da Blizzard são **Move = M,
Stop = S, Attack = A, Patrol = P**
([classic.battle.net/scc/gs/com.shtml](https://classic.battle.net/scc/gs/com.shtml)).

**A construção abre uma segunda página.** "Move the arrow over the Build
Structure button in the Command Button area and select this option. **This will
open the Basic Structure selection panel**" (*manual SC, p. 15*). A mesma grade
3×3 é reaproveitada para listar os prédios; o retorno é o botão de cancelar
(na figura, a última casa da grade). É o mesmo mecanismo do "Build Advanced
Structure" e, do lado do Age of Empires, do `B` seguido da letra do prédio
(seção 4).

**O custo aparece ao passar o dedo, não gravado no botão.** "Move the arrow over
the SCV Command Button. The words Build SCV will appear in an automated heads-up
display. Note that the cost of building this unit and how many supplies it
requires appears in a heads-up display that is directly connected to the Command
Button. **All costs for buildings and upgrades will appear in the same way**"
(*manual SC, p. 14*). O ícone fica limpo; o preço é sob demanda.

**O compartimento troca de comando conforme o estado.** "If you stop an SCV
while it is returning to the Command Center with a load of resources, **the
Gather button will be replaced by a Return Cargo button**" (*manual SC, p. 18*).
Ou seja: a posição é fixa, o conteúdo é contextual — e é assim que 9 casas dão
conta de dezenas de situações.

## 4. O painel do Age of Empires II

O Age of Empires II não tem retrato animado nem wireframe. Tem uma **status
area** que acumula informação por tipo de coisa selecionada, e é o manual que
enumera:

- **Vida, em barra verde.** "The status area at the bottom of the screen shows
  how much damage a building or unit has taken. **The more green in the hit
  point bar, the healthier your building or unit**" (*manual AoK, p. 28*).
- **A tarefa atual do aldeão, escrita no nome.** "When you put a villager to
  work, **its name in the status area at the bottom of the screen indicates its
  current task**" — Farmer, Lumberjack, Builder, e assim por diante (*manual
  AoK, p. 24*). O nome do objeto selecionado é um campo dinâmico, não um rótulo.
- **Força de ataque, com o bônus de guarnição entre parênteses.** "To see the
  additional attack strength of a Castle or tower with garrisoned units, click
  it and look in the status area at the bottom of the screen. **The number in
  parentheses after the attack strength is the bonus for garrisoned units**"
  (*manual AoK, p. 38*).
- **Capacidade de transporte como razão.** "The status area at the bottom of the
  screen shows how many units the Transport Ship can carry
  (**current/maximum**)" (*manual AoK, p. 36*).
- **Estoque restante de uma jazida**, ao clicar no recurso (*manual AoK, p. 26*),
  **porcentagem de recuperação do monge** após uma conversão (*p. 39*) e **ouro
  que a carroça de comércio está trazendo** (*p. 47*) — tudo na mesma faixa.

**Ataque, armadura e armadura de perfuração** são os atributos que a aba de
atributos do painel exibe; a
[página de interface da wiki da série](https://ageofempires.fandom.com/wiki/User_interface)
descreve exatamente isso — ressalva honesta: essa página está atrás de proteção
anti-robô e não consegui abri-la nesta pesquisa; a descrição veio do resumo
indexado, e é a única afirmação deste capítulo sem fonte que eu tenha lido
inteira.

O que **não** estava lá tem prova documental melhor: em dezembro de 2023, a
World's Edge acrescentou a opção *Extended Unit Stats* ao Age of Empires II:
Definitive Edition, e a lista do que ela passou a mostrar é a lista do que faltou
por 24 anos — "**Reload time, Movement Speed, Blast Radius, Regeneration Rate,
Work Rate, Nearby Enhancement**", mais uma seta no ícone de ataque quando o dano
é perfurante e o alcance escrito como `máximo/mínimo`
([Update 99311, ageofempires.com](https://www.ageofempires.com/news/age-of-empires-ii-definitive-edition-update-99311/)).
**Velocidade de movimento e cadência de tiro nunca estiveram no painel original.**

### A fila de produção, e o cancelamento por item

Esta é a parte do AoE II que o StarCraft não tem, e está no manual palavra por
palavra (*manual AoK, p. 30*):

> "Click any unit button to add one of that unit to the production queue (shown
> in the status area at the bottom of the screen). **Click a unit in the queue to
> remove it from the queue.**"
> "You can train different units at the same building at the same time (for
> example, archers and skirmishers at the Archery Range). **You can queue up to
> 15 units.** Units are created in the order they are queued. The resources are
> deducted from your stockpile **at the time a unit is added to the queue**. If
> you remove a unit from the queue, **the resources are returned to your
> stockpile**."

Quatro decisões embutidas em um parágrafo: fila visível, teto de 15, cobrança na
entrada da fila, e **cancelar é um clique no próprio item** — sem botão de
cancelar separado, sem confirmação. O item da fila *é* o botão de cancelar.

### A fileira de ícones e a segunda página

O cartão de referência do **The Conquerors** documenta a navegação por letra,
que é de dois níveis como a do StarCraft
([manual do Conquerors, Internet Archive](https://archive.org/stream/manual_201704/manual_djvu.txt)):

| ação | teclas |
|---|---|
| Build House | `B`, depois `E` |
| Build Farm | `B`, depois `F` |
| Build Tower | `B`, depois `T` |
| Build building | `B`, depois a letra do prédio |
| Build military building | `V`, depois a letra do prédio |

E há botões que moram **fora** da fileira de ações, colados na minimapa: o
**Idle Villager button**, que salta para o próximo aldeão parado, e o **Advanced
Commands button**, que abre as estatísticas (*manual AoK, pp. 17 e 26*). O
manual ainda anota o atalho equivalente: tecla `.` para ciclar aldeões ociosos e
`,` para militares ociosos (cartão do Conquerors).

## 5. Seleção múltipla: 12 contra 40

**StarCraft: doze.** "Up to twelve units may be placed in any one group"
(*manual SC, p. 20*); "You can assign a building, building add-on, or a group of
**up to 12 units** to a single key" e "Double-Clicking on a unit will select all
units of the same type that are on the screen (**up to 12**)"
([control.shtml](https://classic.battle.net/scc/gs/control.shtml)). A página de
comandos da Blizzard chama 12 de "the selection limit" ao explicar por que a
corrente de *follow* é útil
([com.shtml](https://classic.battle.net/scc/gs/com.shtml)).

**Age of Empires II: quarenta.** A prova é do próprio estúdio, nas notas do
patch 2.5 da HD Edition (2013): "**Maximum Selection Size — Increased from 40
(2.3) to 60 (2.5).** Backed down from 200 in 2.4beta"; e no corpo do post,
"While **the 40 from the original game** was often cited as restrictive, in
upping the limit to 200 we ran into several new challenges"
([Steam, Patch 2.5 Beta](https://steamcommunity.com/app/221380/discussions/1/864973123495272133/)).
O mesmo post explica *por que* o limite existia — "the command structure and
pathing for the game was handled in a way designed for 28.8 or 56k modems and
Pentium CPUs", e com 200 unidades em formação "there were a number of unexpected
and quirky behaviors". **O limite de seleção era um limite de simulação
disfarçado de interface.**

### Clicar em um membro do grupo

Nos dois jogos, os ícones do grupo no painel **são clicáveis e agem só naquela
unidade**. É a parte mais subestimada do desenho.

StarCraft (*manual SC, p. 21*):

> "Holding shift while clicking on a wireframe in the Status Display area will
> remove just that unit from a group."
> "**Clicking on a wireframe in the Status Display area will select ONLY that
> unit** and remove all other units from the group."
> "If you have only one unit selected and **click on his portrait, it will center
> the Main Screen on his location**."

E, com um transporte selecionado, clicar no wireframe de um passageiro
desembarca **só ele** (*manual SC, pp. 21 e 39*). O compêndio oficial acrescenta
o filtro por tipo: "In the Status Display, hold down Control and select the
Portrait of the unit you want to single out. This will select a group of those
types of units" ([control.shtml](https://classic.battle.net/scc/gs/control.shtml)).

Age of Empires II (*manual AoK, p. 38*), para um prédio com guarnição:

> "To ungarrison a particular unit — **Click the unit in the status area at the
> bottom of the screen.**"
> "To eject all units except one — Hold down CTRL, and then click the unit to
> remain garrisoned."
> "To eject all units of the same type — Hold down SHIFT, and then click the type
> of unit."

Mesma ideia, mesmo ano, dois estúdios: **a tira de ícones do grupo é um segundo
campo de jogo, com suas próprias regras de modificador.** Ela não é um resumo
passivo da seleção.

Quando há mais de um selecionado, os números somem: a área que mostrava atributos
passa a mostrar os ícones das unidades. É o que a wiki da série descreve para o
AoE II (mesma ressalva da seção 4), e é o que se vê no StarCraft — o Status
Display de uma seleção múltipla exibe a grade de wireframes, não a ficha.

## 6. A minimapa

**StarCraft** (*manual SC, pp. 13 e 18*):

- O que aparece: "Your buildings and units appear as green squares. Other
  player's units, buildings and resource nodes appear as different colors. **This
  map will increase in detail as you explore the lands surrounding your
  outpost.**"
- Câmera por arraste e por salto: "select the white box and move it around by
  holding down the left mouse button and dragging it where desired"; "**You can
  also select any area on the Mini Map and immediately jump to that location.**"
- **Dois modos de exibição, por tecla:** `Tab` = "Hide/Reveal Terrain in
  Minimap" e `Shift+Tab` = "Toggle Diplomacy Colors in Minimap — Green: Your
  troops / Yellow: Allied Troops / Red: Enemy Troops" (*lista de atalhos, p. 22*).
  O manual justifica o primeiro: "Hiding terrain **may make it easier to spot
  enemy units**" (p. 14). O modo existe para aumentar contraste, não para
  enfeitar.
- **Ordem pela minimapa:** os waypoints e comandos enfileirados são dados
  "clicking on each point **on either the mini-map or main screen**"
  ([control.shtml](https://classic.battle.net/scc/gs/control.shtml)). Clicar na
  minimapa com tropa selecionada não é só mover a câmera.

**Age of Empires II**: três modos, anunciados como novidade do jogo — "the
mini-map has **Normal, Combat, and Economic** modes" (*manual AoK, p. 2*). O modo
escolhido muda até o que o botão de estatísticas mostra: "If you have the Normal
mini-map mode selected, the score for each player appears. If you have the
Combat or Economic mode selected, different information appears" (*manual AoK,
p. 17*). E a ordem pela minimapa é o primeiro comando que o manual ensina:
"Click the unit, and then right-click any location on the map **or on the
mini-map in the lower-right corner**" (*manual AoK, p. 4*).

## 7. O que o painel dava que não se obtinha de outro jeito

Esta é a pergunta que justifica o painel existir. Separando o que era
**redundante** (também visível no campo) do que era **exclusivo**:

| informação | dava para ver no campo? | fonte |
|---|---|---|
| vida aproximada | sim (barra sobre a unidade, prédio pegando fogo) | *AoK, p. 28* |
| **vida exata em número** | **não** | *SC, p. 19* |
| **nome do que foi selecionado** | não, fora do reconhecimento visual | *SC, p. 13* |
| **tarefa atual do trabalhador** | não | *AoK, p. 24* |
| **nível de upgrade de arma e armadura** | **não** — nada no sprite muda | *SC, p. 19* |
| **fila de produção e ordem dela** | **não** | *AoK, p. 30* |
| **progresso de obra em %** | parcialmente (o prédio sobe) | *SC, p. 16* |
| **capacidade de transporte (atual/máx)** | **não** | *AoK, p. 36* |
| **bônus de ataque por guarnição** | **não** | *AoK, p. 38* |
| **estoque restante de uma jazida** | **não** | *AoK, p. 26* |
| **quais comandos esta unidade aceita** | **não** | *SC, p. 13* |
| custo de um comando | não, até passar o dedo | *SC, p. 14* |

O padrão é nítido: **o painel existe para mostrar estado invisível e opções
invisíveis.** Vida, o campo já dá de forma grosseira — e mesmo assim o painel
repete, porque em combate a diferença entre "quase morto" e "38 de 40" decide
recuar ou não. Mas tudo que é *intenção*, *acúmulo* e *possibilidade* — a fila,
a tarefa, o upgrade, o estoque, o cardápio de comandos — só existe no painel.

Um corolário que vale para qualquer jogo: **se um número do painel também está
escrito no campo e não muda decisão nenhuma, ele está ocupando lugar.** O
StarCraft mostra Kills e Rank, que não mudam regra nenhuma, e mostra `+0` de
armadura, que muda — e não mostra o dano, que o jogador decora. As escolhas não
são óbvias; foram feitas.

---

## O que isso significa para o nosso jogo

Hoje a nossa faixa inferior é `#barraAcoes` no `index.html`: um bloco com
`#selNome`, `#selDetalhe` e o contêiner `#acoesContexto`, preenchido por
`UI.atualizarAcoes` (`src/ui2.js:105`). A seleção mora em `src/ui.js`
(`selecionar`, `selecionarNaCaixa`, `gravarGrupo`, `chamarGrupo`). Comparando com
o que está documentado acima, oito pontos, em ordem de valor:

1. **Os botões de ação não têm posição fixa — e essa é a diferença mais cara.**
   `UI.acoesDeTropa` e `UI.acoesDeUnidade` (`src/ui2.js:174` e `:193`) fazem
   `cx.appendChild(...)` condicional: um operário ganha "Minerar" e perde
   "Atacar"/"Patrulhar", então **Recuar muda de casa conforme o que está
   selecionado**. É exatamente o que a grade 3×3 do StarCraft proíbe. Correção
   barata e sem mexer em simulação: uma grade de slots fixos no CSS de
   `#acoesContexto`, com `botao()` recebendo um índice de casa e as casas vazias
   renderizando desabilitadas em vez de sumirem.
2. **Falta a letra de atalho no botão.** O teclado já existe e é bom
   (`src/ui.js:178-207`: `m` mover, `a` atacar, `s` parar, `b` construir,
   `q`/`w` habilidades, `h` base, `.`/`,` ociosos, Ctrl+dígito grava grupo) —
   mas nada disso aparece na tela. O padrão das duas fontes é o mesmo: a letra
   fica **dentro do botão**, destacada (amarela no StarCraft). `botao()` em
   `src/ui2.js:96` já monta `<i>ícone</i><b>rótulo</b><small>sub</small>`;
   acrescentar a letra é um campo a mais no mesmo HTML, sem tocar em lógica.
3. **A fila de produção está escondida na gaveta.** `UI.desenharGaveta` já
   desenha a fila com cancelamento por item (`src/ui2.js:352-366`, chamando
   `sim.cancelarEncomenda`) — que é **exatamente** o desenho do AoE II, item da
   fila *é* o botão de cancelar. Mas ela só aparece depois de tocar em
   "Produzir" e abrir a gaveta. No AoE II a fila mora na faixa de baixo, sempre
   que o prédio está selecionado. Mover (ou espelhar) essa tira para
   `#barraAcoes` quando a estrutura selecionada tem `def.produz` é o item de
   maior retorno por linha de código. Nota: nosso teto é **6** por fila
   (`src/sim-unidades.js:410`) contra os 15 do AoE II — o teto é escolha nossa,
   mas a fila invisível não é.
4. **Seleção múltipla não tem tira de ícones clicável.** Hoje, com mais de uma
   unidade, `atualizarAcoes` escreve `"Grupo · N"` em `#selNome`
   (`src/ui2.js:130-136`) e pronto. Os dois clássicos transformam essa área na
   grade de membros, e **clicar num membro age só nele**: seleciona só ele (SC),
   tira só ele do grupo com Shift (SC), desembarca/desguarnece só ele (SC e
   AoE II). Isso resolve, sem inventar nada, o caso que hoje é impossível no
   nosso jogo: *tirar um operário de uma seleção mista*. A precedência
   soldado-sobre-operário de `selecionarNaCaixa` (`src/ui.js:294-300`) é um
   remendo para esse mesmo problema — com tira clicável, ela deixa de ser
   necessária.
5. **Não temos teto de seleção, e provavelmente devíamos.** `selecionarNaCaixa`
   aceita quantas unidades a caixa pegar. O post do patch 2.5 do AoE II HD
   mostra que 40 e 12 não eram estética: eram o ponto onde a rota e a formação
   ainda se comportavam. O nosso A* é `src/path.js` com `world.versaoRota`; um
   teto explícito é mais honesto do que descobrir o limite em queda de quadro.
6. **`#selDetalhe` é uma linha de texto corrida fazendo o trabalho de seis
   campos.** Hoje sai `"38/40 · minerando · carga 8 · SEM ROTA"`
   (`src/ui2.js:200-208`). Os dois clássicos separam em campos com posição fixa:
   vida à esquerda (gráfico + número), nome no centro, estado embaixo. Campo com
   lugar fixo o olho acha sem ler; texto corrido, não. Mesma quantidade de
   informação, `#barraAcoes` no mesmo tamanho.
7. **A minimapa só move a câmera.** `irPeloMini` (`src/ui.js:167-176`) chama
   `render.centralizarEm` e para por aí. Nos dois jogos a minimapa **aceita
   ordem**: clique com tropa selecionada manda a tropa. Como já temos
   `ordemNoTerreno(p, ehDireito)`, é converter a coordenada da minimapa para
   coordenada de mundo e chamá-la — as duas funções já existem lado a lado no
   mesmo arquivo. E os **modos de exibição** (`Tab` do StarCraft escondendo o
   terreno para destacar inimigo; Normal/Combate/Economia do AoE II) são a
   resposta pronta para quando a minimapa ficar poluída.
8. **O custo já está certo, o retrato não existe — e tudo bem.** Nosso `sub` do
   botão mostra o preço direto (`precoTexto`), enquanto o StarCraft o guardava no
   heads-up ao passar o dedo; num jogo de toque, mostrar é melhor, e não há o que
   mudar. Quanto ao retrato: ele custa arte por unidade e, pela tabela da
   seção 7, é a única peça do painel clássico que **não** carrega informação
   exclusiva — o nome já identifica. Vale como último item da lista de arte, não
   como item de interface.

Uma coisa que **não** deve ser copiada: Rank e Kills. Bonitos no StarCraft,
mas ali servem à ficção militar dele. No nosso caso o espaço equivalente rende
mais mostrando **carga**, **rota bloqueada** e **alvo atual** — estado que muda
decisão, que é o critério da seção 7.
