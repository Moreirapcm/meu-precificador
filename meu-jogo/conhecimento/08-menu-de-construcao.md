# O menu de construção do aldeão: como o Age of Empires organizava

A pergunta que gerou este capítulo foi direta: *"no Age of Empires o menu de
construção era por categorias — torres, exército, defesa… como era exatamente?"*

A resposta curta, e ela vem do manual impresso do jogo, não de dedução: **eram
DOIS botões, e só dois.** Chamavam-se **Buildings** e **Military Buildings**. Não
havia um botão "torres", nem um "exército", nem um "defesa". Eram duas páginas —
economia de um lado, guerra do outro — e dentro de cada página os prédios ficavam
soltos, sem subdivisão.

---

## As fontes

Tudo aqui sai destas seis, e cada afirmação diz de qual:

- **Manual do Age of Empires II: The Age of Kings** (Microsoft, 1999),
  digitalizado —
  [archive.org/details/Age_of_Empires_II](https://archive.org/details/Age_of_Empires_II);
  texto corrido em
  [Age_of_Empires_II_djvu.txt](https://archive.org/stream/Age_of_Empires_II/Age_of_Empires_II_djvu.txt).
  Citado como *manual AoK, p. N* (numeração impressa; no PDF do Archive a página
  impressa e a página do PDF coincidem com desvio de 3).
- **Manual do The Conquerors** (2000), com o cartão de atalhos —
  [archive.org/stream/manual_201704/manual_djvu.txt](https://archive.org/stream/manual_201704/manual_djvu.txt).
- **Manual do Age of Empires** (Microsoft, 1997) —
  [archive.org/details/manual_Age_of_Empires](https://archive.org/details/manual_Age_of_Empires).
  Citado como *manual AoE I, p. N*.
- **Lista de atalhos padrão do AoK**, fórum Age of Kings Heaven —
  [aok.heavengames.com, "Noobie Default Hotkey list"](https://aok.heavengames.com/cgi-bin/aokcgi/display.cgi?action=ct&f=3%2C33570%2C%2Call).
  Fonte de comunidade, não oficial; uso só onde o manual cala, e digo quando é.
- **Fóruns oficiais da World's Edge** —
  [forums.ageofempires.com](https://forums.ageofempires.com/) — para o
  comportamento da Definitive Edition.
- **Layout da grade de atalhos da DE** —
  [github.com/eirikpre/AoE2_hotkeys](https://github.com/eirikpre/AoE2_hotkeys),
  [aoe2.guide](https://aoe2.guide/learning-and-setting-up-hotkeys/),
  [DiamondLobby](https://diamondlobby.com/age-of-empires-2/hotkey-guide-aoe2/),
  [TutorialTactic](https://tutorialtactic.com/blog/age-of-empires-shortcuts/).

---

## 1. Os dois botões, com o nome exato

O manual ensina a construir três prédios diferentes no capítulo de abertura, e
nas três vezes nomeia o botão em negrito. Duas vezes é um botão, uma vez é o
outro (*manual AoK, p. 5 e p. 6*):

> **To build a House** — "Click a villager, click the **Buildings** button, click
> the **Build House** button, and then click a location on the map."
>
> **To build a Mill** — "Click a villager, click the **Buildings** button, click
> the **Build Mill** button, and then click a location near a forage bush."
>
> **To build a Barracks** — "Click a villager, click the **Military Buildings**
> button, click the **Barracks** button, and then click a location on the map."

E o procedimento formal, no capítulo III (*manual AoK, p. 27*), confirma que a
escolha entre os dois é o **passo 2 obrigatório**, antes de escolher o prédio:

> **To construct a building**
> 1. Click a villager (or select a group). The more villagers assigned to a
>    building, the faster it is built.
> 2. **Click the Buildings button or Military Buildings button.**
> 3. Click the button of the building to build. For example, to build a House,
>    click the **Build House** button. To display additional buildings your
>    villagers can construct, click the **More Buildings** button.
> 4. Click a location on the map. The building is shown in flashing red if you
>    cannot build in a particular location.

Portanto: **confirmado, com fonte primária.** Dois botões, e os nomes são
*Buildings* e *Military Buildings*. O uso corrente ("econômico" e "militar") não
é o rótulo da tela — é o rótulo do apêndice do manual, que separa a tabela em
**ECONOMIC** e **MILITARY** (*manual AoK, p. 107*, seção 2 aqui).

As teclas dos dois botões, do cartão de referência do **Conquerors**
([manual_djvu.txt](https://archive.org/stream/manual_201704/manual_djvu.txt)):

| ação | tecla |
|---|---|
| Build building (econômico) | `B`, depois a letra do prédio |
| Build military building | `V`, depois a letra do prédio |
| Build House | `B`, depois `E` |
| Build Farm | `B`, depois `F` |
| Build Tower | `B`, depois `T` |

⚠️ Reparo importante nesse cartão: ele lista **Build Tower como `B`, `T`** — na
página *econômica*. Mas a torre está na tabela **MILITARY** do apêndice. Ou o
cartão do Conquerors tem um erro de revisão, ou a fileira da torre mudou de
página entre AoK e Conquerors. Não consegui resolver isso com fonte; registro a
divergência em vez de escolher.

## 2. Que prédio ficava em qual grupo, com a era

O apêndice **Building Attributes** (*manual AoK, p. 107*) é a fonte definitiva:
a tabela é literalmente partida em dois blocos com os cabeçalhos `ECONOMIC` e
`MILITARY`, e traz a coluna `AGE` em algarismo romano — I = Dark, II = Feudal,
III = Castle, IV = Imperial.

**Página ECONOMIC (botão "Buildings") — 13 linhas:**

| prédio | era | custo |
|---|---|---|
| House | I | 30 madeira |
| Mill | I | 100 madeira |
| Mining Camp | I | 100 madeira |
| Lumber Camp | I | 100 madeira |
| Dock | I | 150 madeira |
| Farm | I | 60 madeira |
| Fish Trap | II | 100 madeira |
| Market | II | 175 madeira |
| **Blacksmith** | II | 150 madeira |
| Monastery | III | 175 madeira |
| University | III | 200 madeira |
| **Town Center** | III | 275 madeira |
| Wonder | IV | 1000 madeira+pedra+ouro |

**Página MILITARY (botão "Military Buildings") — 14 linhas:**

| prédio | era | custo |
|---|---|---|
| Barracks | I | 175 madeira |
| Palisade Wall | I | 2 madeira |
| Outpost | I | 25 madeira + 25 pedra |
| Stable | II | 175 madeira |
| Archery Range | II | 175 madeira |
| Gate | II | 30 pedra |
| Stone Wall | II | 5 pedra |
| Watch Tower | II | 125 pedra + 25 madeira |
| Castle | III | 650 pedra |
| Siege Workshop | III | 200 madeira |
| Fortified Wall | III | 5 pedra |
| Guard Tower | III | 125 pedra + 25 madeira |
| Keep | IV | 125 pedra + 25 madeira |
| Bombard Tower | IV | 125 pedra + 100 ouro |

Três coisas contraintuitivas saem daí, e todas têm valor de projeto:

1. **A ferraria (Blacksmith) é ECONÔMICA.** Ela só faz melhoria militar — ataque
   e blindagem de infantaria, cavalaria e arqueiro — e mesmo assim mora na
   página da economia. O critério do AoE II **não** é "serve para a guerra"; é
   **"quem produz soldado e quem segura terreno vai para o militar; o resto vai
   para o econômico"**. Universidade e Mosteiro seguem a mesma lógica: são
   pesquisa, logo economia. (Confirmado de forma independente na lista de
   atalhos da DE, onde Blacksmith é `Q` → `S`, dentro do menu econômico —
   [DiamondLobby](https://diamondlobby.com/age-of-empires-2/hotkey-guide-aoe2/).)
2. **Muro, portão e torre são MILITARES.** Não existe uma categoria "defesa"
   separada: muralha, portão e as quatro torres dividem a página com o quartel e
   o estábulo.
3. **Watch Tower → Guard Tower → Keep é uma fileira só.** As três aparecem na
   tabela como prédios distintos com era distinta, mas na tela ocupam **uma
   casa**, que troca de conteúdo com a era — na DE a casa é a tecla `W` → `F`,
   "Tower", uma só ([DiamondLobby](https://diamondlobby.com/age-of-empires-2/hotkey-guide-aoe2/)).
   Como o SCV do StarCraft, cuja casa "Gather" vira "Return Cargo": **posição
   fixa, conteúdo contextual** (ver `04-painel-de-controle.md`, seção 3).

E o **Fish Trap**, apesar de estar na tabela econômica, **não é do aldeão**: o
manual manda "click a villager or Fishing Ship" só para o reparo, e o prédio "are
available in the Feudal Age, **after you build a Fishing Ship**" (*manual AoK,
p. 52*). Quem o planta é o barco. A página econômica do aldeão tem, portanto, 12
botões no jogo de 1999.

## 3. Prédio que a era ainda não liberou: some, apaga ou nem aparece?

O manual descreve o momento da virada de era assim (*manual AoK, p. 7*):

> "After several seconds, your existing buildings change in appearance to Feudal
> Age buildings. **If you click a villager now, you see that additional buildings
> are available in the lower-left corner of the game screen.**"

Isso prova que a era **acrescenta** botões, mas a frase não diz se antes o botão
estava apagado ou ausente. O caso que **está** documentado é o outro bloqueio — o
de pré-requisito, e aí é **apagado, não escondido**. O relatório de erro no fórum
oficial da World's Edge sobre o menu do aldeão descreve o comportamento esperado
nestes termos:

> "A villager's ability to build a building that requires a pre-requisite
> building (Archery Range, Stable, Siege Workshop) would be based on what
> pre-requisite buildings are built at the time of the attempt to build said
> building, and not when the ui is originally loaded."

— e o defeito relatado é justamente que **o botão continua cinza** depois que o
quartel fica pronto, até fechar e reabrir o painel
([forums.ageofempires.com, tópico 245039](https://forums.ageofempires.com/t/villager-build-options-dont-update-when-building-is-finished-only-when-ui-is-loaded/245039)).
Ou seja: sem quartel, o Archery Range **aparece, apagado**.

**Raciocínio nosso** (não é citação, é dedução a partir de fonte): na Definitive
Edition a tecla de cada prédio é a **posição dele na grade** — House é sempre
`Q`, Mill sempre `W`, Mining Camp sempre `E`
([aoe2.guide](https://aoe2.guide/learning-and-setting-up-hotkeys/),
[TutorialTactic](https://tutorialtactic.com/blog/age-of-empires-shortcuts/)).
Esse mapeamento é fixo e **não muda com a era**. Se os prédios ainda não
liberados sumissem e os de baixo subissem, a tecla de cada prédio mudaria a cada
virada de era, e o sistema inteiro de atalhos cairia. Logo, a casa é reservada.
O que não sei com fonte é se a casa reservada aparece **cinza** ou **vazia** antes
da era chegar. É o único ponto deste capítulo que ficou em aberto.

## 4. Quantas casas o painel tinha, e o que acontecia quando não cabia

**A grade da Definitive Edition é 5 colunas × 3 linhas = 15 casas**, e a fonte é
o mapeamento de teclas, que é o mapa da grade:

> "Row 1: QWERT — Row 2: ASDFG — Row 3: ZXCVB"
> ([github.com/eirikpre/AoE2_hotkeys](https://github.com/eirikpre/AoE2_hotkeys))

O princípio é o mesmo declarado pelo próprio estúdio para o AoE I remasterizado:
"Building hotkeys are now mapped to the UI grid by default, making it easy to
remember which key to hit to build your dock! (hint: it's **T**.)"
([What's new in Age of Empires: Definitive Edition, ageofempires.com](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/)).
`T` é a 5ª casa da 1ª linha. A grade **é** o teclado.

Não consegui fonte primária para o número de casas do painel de **1999**. O que
o manual de 1999 documenta é o **mecanismo de transbordo**, e ele é explícito
(*manual AoK, p. 27*):

> "To display additional buildings your villagers can construct, click the
> **More Buildings** button."

Na DE esse botão continua existindo e tem casa fixa na grade — `V`, isto é,
**4ª coluna da 3ª linha** da página econômica
([DiamondLobby](https://diamondlobby.com/age-of-empires-2/hotkey-guide-aoe2/)).
E os prédios que as expansões acrescentaram e não couberam ganharam letra **fora**
da grade: Feitoria e Caravanserai são `H`, que não é nenhuma das 15
(mesma fonte; a regra "letters outside the grid may be used without modifiers"
está no [README do eirikpre](https://github.com/eirikpre/AoE2_hotkeys)).

**A lição de projeto, que é o que interessa:** quando a lista crescia além da
grade, o AoE II **não** encolhia o botão, **não** rolava a tira e **não**
reordenava. Ele gastava uma das 15 casas com um botão de *próxima página*. A
posição das outras 14 continuava intocada.

## 5. O botão de voltar e a tecla

Aqui o manual do AoE II **cala**: a palavra *cancel* aparece uma única vez no
manual inteiro, e é sobre tributo ("click Clear Tributes", *p. 47*). Não há
descrição do botão de retorno da página de construção nem tecla para ele no
cartão do Conquerors.

O que **está** documentado é a tecla de cancelar a *colocação* do prédio, e é o
`Esc`. A resposta do T-West (autor de ferramentas conhecidas da comunidade) na
discussão oficial do Steam sobre reatribuir teclas:

> "By default it has actions to **deselect the currently selected units and to
> cancel placing a building foundation when building with Villagers**."
> — e "It's not possible to unbind the 'open menu' behavior from Escape"
> ([Steam, AoE II: DE](https://steamcommunity.com/app/813780/discussions/0/2994296376475114512/))

O `Esc` do AoE II carrega três funções ao mesmo tempo — abrir o menu, limpar a
seleção, cancelar a fundação — e a comunidade reclama disso desde o beta da DE.
**É um erro a não copiar**: a mesma tecla fazendo três coisas garante que uma
delas vai disparar na hora errada.

Onde o botão ficava fisicamente, só consegui medir no **AoE I** (seção 7): lá a
coluna da direita do painel é reservada, com a seta de próxima página em cima e
o **X** de fechar embaixo. Para o AoE II, não afirmo a posição.

## 6. As teclas de cada prédio

**Clássicas (AoK 1999 / Conquerors).** Eram **mnemônicas**, não posicionais — a
letra lembrava o nome. A lista abaixo é da comunidade
([Age of Kings Heaven](https://aok.heavengames.com/cgi-bin/aokcgi/display.cgi?action=ct&f=3%2C33570%2C%2Call)),
e bate com as cinco linhas que o cartão oficial do Conquerors traz (House `E`,
Farm `F`, Tower `T`, e os prefixos `B`/`V`) — por isso confio nela, mas ela não
é fonte oficial:

| prédio | tecla | prédio | tecla |
|---|---|---|---|
| House | `E` | Barracks | `B` |
| Mill | `I` | Archery Range | `A` |
| Lumber Camp | `Z` | Stable | `L` |
| Mining Camp | `G` | Siege Workshop | `K` |
| Farm | `F` | Castle | `V` |
| Dock | `D` | Outpost | `Q` |
| Blacksmith | `S` | Tower | `T` |
| Market | `M` | Bombard Tower | `J` |
| Monastery | `Y` | Wall | `W` |
| University | `U` | Palisade Wall | `P` |
| Town Center | `N` | Gate | `/` |
| Wonder | `O` | | |

Prefixadas por `B` (econômico) ou `V` (militar). O comentário do próprio autor
da lista resume o critério: *"the letter corresponds with the building's name
leaving them easy to remember."*

**Definitive Edition (2019).** Deixaram de ser mnemônicas e viraram **posição na
grade**. Menu econômico abre com `Q`, militar com `W`
([aoe2.guide](https://aoe2.guide/learning-and-setting-up-hotkeys/),
[TutorialTactic](https://tutorialtactic.com/blog/age-of-empires-shortcuts/)):

| econômico (`Q` …) | | militar (`W` …) | |
|---|---|---|---|
| House | `Q` | Barracks | `Q` |
| Mill | `W` | Archery Range | `W` |
| Mining Camp | `E` | Stable | `E` |
| Lumber Camp | `R` | Siege Workshop | `R` |
| Dock | `T` | Krepost¹ | `T` |
| Farm | `A` | Outpost | `A` |
| Blacksmith | `S` | Palisade Wall | `S` |
| Market | `D` | Stone Wall | `D` |
| Monastery | `F` | Tower | `F` |
| University | `G` | Bombard Tower | `G` |
| Town Center | `Z` | Gate | `Z` |
| Wonder | `X` | Palisade Gate | `X` |
| More Buildings | `V` | Castle | `C` |
| Feitoria / Caravanserai¹ | `H` (fora da grade) | | |

¹ prédios de civilização única, acrescentados pelas expansões da DE.
Fonte da tabela: [DiamondLobby](https://diamondlobby.com/age-of-empires-2/hotkey-guide-aoe2/).

Repare no efeito colateral que a mudança comprou: **a mesma tecla faz coisas
diferentes nas duas páginas.** `Q` é House no menu econômico e Barracks no
militar — "Build house and build Barracks are both 'Q.' The game will favor
whichever menu is active"
([Steam, tópico de grid hotkeys](https://steamcommunity.com/app/221380/discussions/0/828938532772119365/)).
Isso é o preço de a tecla ser o endereço da casa e não o nome do prédio: dez
letras cobrem vinte e seis prédios.

## 7. A Definitive Edition mudou o quê, exatamente

Do que consegui documentar:

| o que | 1999 / Conquerors | Definitive Edition (2019) | fonte |
|---|---|---|---|
| quantos botões de construção | 2 (*Buildings*, *Military Buildings*) | 2, os mesmos | *manual AoK, p. 27* / [aoe2.guide](https://aoe2.guide/learning-and-setting-up-hotkeys/) |
| tecla dos dois botões | `B` e `V` | `Q` e `W` | [Conquerors](https://archive.org/stream/manual_201704/manual_djvu.txt) / [aoe2.guide](https://aoe2.guide/learning-and-setting-up-hotkeys/) |
| tecla de cada prédio | mnemônica (House = `E`) | posicional na grade (House = `Q`) | [AoK Heaven](https://aok.heavengames.com/cgi-bin/aokcgi/display.cgi?action=ct&f=3%2C33570%2C%2Call) / [DiamondLobby](https://diamondlobby.com/age-of-empires-2/hotkey-guide-aoe2/) |
| transbordo | botão *More Buildings* | idem, com casa fixa (`V`) | *manual AoK, p. 27* / [DiamondLobby](https://diamondlobby.com/age-of-empires-2/hotkey-guide-aoe2/) |
| tamanho do painel | não documentado | 5 × 3 = 15 casas | [eirikpre](https://github.com/eirikpre/AoE2_hotkeys) |
| tamanho da fonte e do painel | fixo | ajustável nas opções | [ageofempires.com](https://www.ageofempires.com/news/whats-new-age-empires-definitive-edition-2/) |

**A divisão em dois botões econômico/militar sobreviveu intacta de 1999 a 2019.**
Mudaram as teclas e o tamanho do painel; a taxonomia, não. Isso é o argumento
mais forte a favor dela: vinte anos de partidas competitivas e ninguém pediu uma
terceira página.

## 8. O Age of Empires I (1997), mais curto — e o que mudou

O AoE I **não tinha duas páginas**. Tinha **um** botão *Build*, e uma **seta de
próxima página** ao lado da tira de ícones (*manual AoE I, p. 32*):

> **To construct a building**
> 1. Click a villager (or select a group)…
> 2. **Click the Build button.**
> 3. Click the button of the building to build… **To display more buildings,
>    click the arrow button to the right of the building icons.**

E "To display all of the buildings you can construct, **you must click the arrow
button to the right of the building icons** at the bottom of the game screen."

A figura rotulada da interface (*manual AoE I, p. 20*) confirma e nomeia a peça:

> **Next button** — "Displays more buildings that you can construct."
> **Command/Build/Upgrade/Research Buttons** — "Displays commands, buildings you
> can construct, units you can upgrade, and technologies you can research."
> **Status line** — "Displays label for buttons with **hot key**, cost, and
> benefit (if applicable)."

**Medido por mim na figura da p. 20** (renderizei a página a 300 dpi e ampliei a
região do painel — arquivo intermediário, não versionado): a tira de construção é
uma grade de **6 colunas × 2 linhas**, e a **última coluna é reservada à
navegação** — seta de próxima página em cima, **X** de fechar embaixo. Sobram
**10 casas** para prédio. Na figura, a 1ª linha está cheia (5 ícones) e a 2ª tem
4 ícones e uma casa vazia — **casa vazia, não reordenada**, exatamente o
princípio do StarCraft descrito em `04-painel-de-controle.md`.

Repare também no que o AoE I fazia e o AoE II abandonou: **o atalho do botão
aparecia na linha de estado ao passar o cursor**, junto com custo e benefício. O
AoE II moveu o atalho para dentro do próprio botão.

O AoE I também tinha uma taxonomia de prédios — mas ela **não era a do menu**
(*manual AoE I, p. 32*):

> "There are two types of buildings: **Technology buildings**, such as the
> Barracks, let you create new military units, upgrade military units, and
> research technologies. **Non-technology buildings**, such as walls and Farms,
> provide a benefit to your civilization but do not let you research new military
> units or technologies."

Isto é: no AoE I a divisão conceitual era *produz/pesquisa* contra *não produz*, e
ela **não** organizava a tela. A tela era uma lista só, paginada.

**O que mudou de 1997 para 1999, em uma linha:** o Age of Empires II trocou
**uma lista paginada por seta** por **duas páginas nomeadas por assunto** — e
guardou a seta (*More Buildings*) como recurso de último caso, para o transbordo
dentro de cada página.

| | AoE I (1997) | AoE II (1999) |
|---|---|---|
| botões de construção | 1 (*Build*) | 2 (*Buildings*, *Military Buildings*) |
| como vê o resto | seta *Next*, casa fixa à direita | *More Buildings*, casa fixa na grade |
| casas para prédio | 10 (medido na figura, p. 20) | não documentado em 1999; 15 na DE |
| fechar o painel | **X**, casa fixa (medido, p. 20) | não documentado; `Esc` cancela a fundação |
| onde vê o atalho | na linha de estado, ao passar o cursor | dentro do botão |
| agrupamento | nenhum na tela | econômico × militar |

---

## Proposta para o nosso jogo

Hoje temos **19 estruturas além da Central** em `src/data.js:22`, e elas já
carregam um campo `cat` com quatro valores. A contagem, medida no arquivo:

| `cat` | quantas | quais |
|---|---|---|
| `base` | 6 | Alojamento, Usina solar, Usina eólica, Usina nuclear, Reator de fusão, Depósito avançado |
| `producao` | 2 | Quartel, Oficina |
| `tecnologia` | 3 | Centro de Pesquisa, Bomba de petróleo, Radar |
| `defesa` | 8 | Muro, Portão, Torre de muralha, Bastião, Sentinela, Torre de Gelo, Artilharia, Torre de Plasma |

E a tela de hoje (`UI.paginaConstruir`, `src/ui2.js:374`) mostra **as 19 de uma
vez**, numa tira única com rolagem horizontal (`#barraAcoes .botoes` é
`display:flex; overflow-x:auto`, `style.css:194`), separadas por quatro riscos
com o nome da categoria de pé (`.divisor-acao`, `style.css:245`). O botão
**Voltar** é o **primeiro** da tira, com tecla `Esc` (`src/ui2.js:376`).

### Resposta: o `cat` serve. O que não serve é o número de páginas.

**Não inventar categoria nova.** Os quatro valores de `cat` estão certos como
*dado* — descrevem o papel da estrutura e são o que a gaveta usa para agrupar
(`UI.gavetaConstruir`, `src/ui2.js:563`). Mudá-los custaria tocar em `data.js`,
que é o arquivo de equilíbrio, sem ganho nenhum.

O que proponho mudar é só o **mapa de `cat` para botão**: **dois botões, não
quatro**, formados por pares dos `cat` que já existem.

| botão | `cat` que entram | quantas | estruturas |
|---|---|---|---|
| **BASE** (tecla `b`) | `base` + `tecnologia` | **9** | Alojamento · Usina solar · Usina eólica · Usina nuclear · Reator de fusão · Depósito avançado · Centro de Pesquisa · Bomba de petróleo · Radar |
| **DEFESA** (tecla `v`) | `producao` + `defesa` | **10** | Quartel · Oficina · Muro · Portão · Torre de muralha · Bastião · Sentinela · Torre de Gelo · Artilharia · Torre de Plasma |

Por que assim, e não de outro jeito:

1. **É o corte do Age of Empires II, linha por linha.** O Quartel e a Oficina
   produzem tropa → vão para o militar, como Barracks, Stable, Archery Range e
   Siege Workshop (*manual AoK, p. 107*). Muro, Portão e as seis torres vão junto,
   como Palisade Wall, Stone Wall, Gate, Outpost e a fileira Watch/Guard/Keep/
   Bombard. E o **Centro de Pesquisa vai para a página da base**, exatamente como
   a University e a Blacksmith — que só fazem melhoria militar e mesmo assim são
   ECONOMIC no apêndice. O critério é *"quem produz soldado e quem segura
   terreno"*, não *"quem ajuda na guerra"*.
2. **Duas páginas de 9 e 10 cabem; quatro páginas de 2 e 3, não compensam.** Uma
   página com dois botões (`producao`) gasta um toque para mostrar duas coisas —
   é o pior negócio possível numa tela de celular. O AoE II resolveu 26 prédios
   com 2 páginas; 19 com 4 é excesso de hierarquia.
3. **Nove e dez cabem na tela sem rolar.** Cada `.acao` tem `min-width: 62px` +
   6px de vão (`style.css:197`): dez botões dão ~680 px, contra ~1300 px das 19
   de hoje. Numa tela de celular deitado, a página de 10 cabe inteira — e **tira
   está é a rolagem horizontal**, que é o que hoje impede o botão de ter endereço
   fixo. Isso fecha o item 1 da lista de `04-painel-de-controle.md`: casa fixa
   só existe de verdade quando o painel inteiro é visível.
4. **Os riscos de categoria continuam úteis dentro da página.** `BASE` e
   `TECNOLOGIA` como dois riscos dentro da página da base; `PRODUÇÃO` e `DEFESA`
   como dois riscos dentro da outra. O AoE II não subdividia, mas o `.divisor-acao`
   já existe, é de um pixel e não gasta casa — é ganho de graça.

### Três detalhes menores, cada um com a fonte

- **O botão de voltar deveria ser o último, não o primeiro.** No AoE I o X é a
  casa da última coluna, embaixo (medido, *manual AoE I, p. 20*); no StarCraft o
  cancelar é a última casa da grade (`04-painel-de-controle.md`, seção 3). Hoje o
  nosso Voltar é o primeiro (`src/ui2.js:376`). **Ressalva honesta:** enquanto a
  tira rolar, "último" quer dizer "fora da tela"; só faz sentido mover depois que
  a página couber inteira — isto é, depois do item 3 acima. Enquanto isso,
  primeiro está certo.
- **A tecla `Esc` do Voltar já está certa e é melhor que a do AoE II.** Lá o
  `Esc` faz três coisas ao mesmo tempo e a comunidade reclama desde o beta
  ([Steam](https://steamcommunity.com/app/813780/discussions/0/2994296376475114512/)).
  No nosso, ele faz uma. Não mexer.
- **Prédio sem requisito: já fazemos o certo, e por acidente melhor que a DE.**
  `UI.paginaConstruir` desabilita por requisito de tecnologia e **não** por falta
  de minério (`src/ui2.js:393-403`) — o botão continua clicável e só perde a cor,
  com a razão escrita no comentário: *"Recurso que falta NÃO desabilita: o preço
  já está escrito no botão e daqui a dez segundos ele dá."* Isso é exatamente o
  comportamento do AoE II para pré-requisito (apagado, presente, na mesma casa) e
  evita o defeito da DE, onde o botão cinza só atualiza ao reabrir o painel
  ([tópico 245039](https://forums.ageofempires.com/t/villager-build-options-dont-update-when-building-is-finished-only-when-ui-is-loaded/245039)).
  Não mexer.

### O que NÃO copiar

- **A tecla posicional da DE.** Ela obriga `Q` a significar duas coisas
  diferentes conforme a página ativa
  ([Steam](https://steamcommunity.com/app/221380/discussions/0/828938532772119365/)).
  Com 19 estruturas em dois grupos, ainda dá para dar uma letra mnemônica por
  prédio, como o AoK de 1999 fazia — e o nosso `botao()` já sabe desenhar a letra
  no canto (`.acao u`, `style.css:212`).
- **Uma página só com `producao`.** Dois botões não justificam uma página.
- **Rolagem horizontal como solução de transbordo.** Nem o AoE I nem o AoE II
  rolaram nunca: gastaram uma casa com "próxima página" e mantiveram as outras
  paradas. Se um dia passarmos de uma tela por página, a saída documentada é essa,
  não a rolagem.
