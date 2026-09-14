# 10 — Limpar e alterar terreno com uma unidade

Como os jogos de estratégia resolveram o problema de mandar **uma máquina**
derrubar, cortar ou varrer **células do mapa** — e por que o nosso Trator de
Limpeza trava depois de três ou quatro células.

A regra do capítulo é a de sempre: afirmação técnica vem com fonte. Onde a
fonte é código, o link vai para o arquivo e a função. Onde é medição nossa,
está dito que é medição nossa.

> **Estado do código citado.** As linhas de `src/` neste capítulo foram lidas
> em 13/09/2026 no commit `080b26a` (*"O trator trabalha: destino inteiro e
> rota vazia que vira nula"*), com `src/sim-unidades.js` e `src/ui.js` ainda
> modificados na árvore de trabalho. O arquivo está sendo mexido: confira o
> número antes de confiar nele.

---

## 1. Age of Empires — o aldeão, a árvore e a floresta

### 1.1 A árvore é célula SÓLIDA, e o aldeão corta de fora

Em *Age of Empires II* a floresta bloqueia. A página [Tree](https://ageofempires.fandom.com/wiki/Tree)
do wiki oficial da série diz, sobre as versões originais e *Definitive*:

> "it is possible to destroy many individual 'straggler' trees by constructing
> buildings on top of them. **Forests are blocks to potential building sites**,
> however, and some Forest Trees occur singly."

E, sobre *Return of Rome*, as árvores importadas do AoE2 "**always block
potential building sites**". Fonte: [Tree](https://ageofempires.fandom.com/wiki/Tree).

O aldeão não entra na árvore. Ele trabalha **à distância de trabalho** a partir
de uma célula vizinha. Isso não é folclore: é um campo do formato de dados do
motor Genie (AoE1, AoE2, Star Wars: Galactic Battlegrounds). A biblioteca
`genieutils`, que lê e escreve os `.dat` do Genie, declara na estrutura `Task`
(a "tarefa" de uma unidade — Gather, Build, Attack…) o campo `WorkRange`:

```
int16_t ActionType;      float WorkValue1;   float WorkValue2;
float   WorkRange;       uint8_t AutoSearchTargets;  float SearchWaitTime;
```

Fonte: [`include/genie/dat/UnitCommand.h`, struct `Task`](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h).

**Isto é o padrão que estamos copiando sem saber**: o alcance de trabalho é um
número da tarefa, não a posição da unidade. Quem trabalha numa célula sólida
fica FORA dela, dentro do `WorkRange`.

### 1.2 Como o aldeão escolhe a próxima árvore: `AutoSearchTargets` + `SearchWaitTime` + `SearchRadius`

Os três campos que respondem "como o jogo escolhe a próxima árvore" estão no
mesmo formato de dados:

- **`AutoSearchTargets`** (por tarefa) — a tarefa procura alvo sozinha.
  Fonte: [`UnitCommand.h`](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h).
- **`SearchWaitTime`** (por tarefa) — **quanto tempo esperar entre as buscas**.
  Mesma fonte.
- **`SearchRadius`** (por unidade, na classe `Bird`, que é a classe das unidades
  com tarefa) — o raio da busca automática, ao lado de `DefaultTaskID` e
  `WorkRate`. Fonte: [`include/genie/dat/unit/Bird.h`](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/unit/Bird.h).

Três lições diretas:

1. A busca é **automática e repetida**, não "uma vez e desiste".
2. A busca é **esperada**, não feita todo quadro (`SearchWaitTime`). É o mesmo
   remédio que a OpenRA aplica com o cooldown (§5.2): o gasto de repathing por
   quadro é o que mata.
3. O raio é **por unidade**, um número de dados — não um `|| 10` no meio da
   lógica. (Nosso `raio: 10` está cravado em `src/ui.js`; ver §9.)

### 1.3 Escolher o alvo por DISTÂNCIA DE CAMINHO, não por distância de ladrilho

Este é o item mais importante do capítulo inteiro, e é uma nota de versão
oficial. O [Update 50292](https://ageofempires.fandom.com/wiki/Update_50292) do
*Age of Empires II: Definitive Edition*, seção **Pathfinding**:

> "Villagers now take **pathing distance** into account when selecting their
> nearest drop site (**instead of tile distance**)."

Vinte anos depois do lançamento, a Forgotten Empires trocou "o mais perto em
ladrilhos" por "o mais perto em caminho". O motivo é exatamente o nosso: o
depósito do outro lado da muralha é o mais perto em linha reta e o mais longe
em pernas.

A mesma nota de versão traz dois irmãos do nosso bug:

> "Fixed a rare issue where units tried to avoid **no longer present objects**
> when targeting solid objects, causing odd pathing quirks around seemingly
> invisible objects."

> "Fixed a rare issue where Onagers pathed through trees after being command
> queued to target certain nearby trees."

Fonte: [Update 50292](https://ageofempires.fandom.com/wiki/Update_50292).
Obstrução velha em cache = unidade parada ou atravessando parede. É a mesma
família de defeito que o nosso `versaoRota` existe para evitar.

### 1.4 E quando ele trava mesmo assim? Vira OCIOSO, visível

O [Update 153015](https://ageofempires.fandom.com/wiki/Update_153015) mostra que
o problema nunca foi "resolvido de uma vez" — foi cercado por rede de segurança:

> "**Stuck Villagers or Trade Carts should always show up as idle now.**"

> "Improved Villager behavior to unstuck themselves when working close together."

> "Fixed an issue in which a Villager initially trying to **path through trees
> instead of going around the forest**."

> "Fixed an issue with Villager getting stuck while trying to drop-off and never
> show up as idle."

Fonte: [Update 153015](https://ageofempires.fandom.com/wiki/Update_153015).

E a rede de segurança tem interface: desde o [Update 81058](https://ageofempires.fandom.com/wiki/Villager_(Age_of_Empires_II))
existe a opção **"Idle Pointers"**, que põe uma exclamação em cima do aldeão
ocioso. Fonte: [Villager (Age of Empires II)](https://ageofempires.fandom.com/wiki/Villager_(Age_of_Empires_II)).

**A doutrina do AoE2 é: travar é inevitável; ficar travado EM SILÊNCIO não é.**
A unidade presa tem de aparecer como ociosa, e ociosa tem de aparecer na tela.

### 1.5 O alvo exaurido: procurar perto, e senão FICAR OCIOSO

O *Age of Empires IV* documenta a regra de recolocação automática com todas as
letras, na página [Gather Point](https://ageofempires.fandom.com/wiki/Gather_Point):

> "If a resource node on which an economic Rally Point has been set is
> exhausted, **Villagers will automatically move to a nearby resource of the
> same type. Otherwise they will remain idle.**"

Duas saídas, e só duas: acha perto → vai; não acha → ocioso. Não existe a
terceira ("fica parado tentando").

### 1.6 A célula só libera quando o trabalho TERMINA — e isso é de propósito

Nosso desenho de dois degraus (ruína → entulho → chão) tem precedente explícito,
e é uma decisão de equilíbrio, não um detalhe:

- AoE2: "If destroyed by the units above **or if all wood from a tree has been
  gathered**, buildings can be placed on the tile."
  Fonte: [Tree](https://ageofempires.fandom.com/wiki/Tree).
- AoE IV, [update 9.1.176](https://ageofempires.fandom.com/wiki/Tree): "Originally,
  trees could be bypassed as soon as they were felled, but with update 9.1.176,
  **it is no longer possible to forcibly tunnel through woodlines** by chopping
  trees and moving past them. **Felled trees now act as movement blockers** the
  same as when they are part of a woodline, and **only once they are fully
  harvested do they allow for movement** to reach the trees behind them."

Ou seja: a Relic *removeu* a passagem antecipada porque virou exploit de furar
floresta. Um estado intermediário que já deixa passar é uma escolha de
equilíbrio com consequência conhecida — no nosso caso, entulho transitável é
justamente o que queremos (abre caminho antes de abrir canteiro), mas agora com
a nota de que é uma alavanca forte.

O caminho inverso também existe no AoE2: o [Update 141935](https://ageofempires.fandom.com/wiki/Tree)
introduziu os **Felled Tree objects**, que "do not have to be cut down before
harvesting the wood" — o degrau do corte foi eliminado para esse objeto.

### 1.7 Abrir caminho na marra: ordem de ÁREA no chão

Quando o jogador quer um buraco na floresta e não quer madeira, o AoE2 dá uma
ordem de **área no terreno**:

> "Onagers and Heavy Rocket Carts have the ability to **attack specified areas on
> the ground** and cut down trees, making them **extremely useful in creating a
> path to somewhere that was blocked by trees**. (…) **Other units which can cut
> down trees only cut one tree at a time.**"

Fonte: [Tree](https://ageofempires.fandom.com/wiki/Tree).

Duas ferramentas separadas, e a distinção é a mesma que a nossa: a unidade
econômica faz **uma célula por vez** e rende recurso; a ferramenta de área abre
passagem e **perde** o recurso ("the wood is lost in this case", mesma fonte).

---

## 2. Command & Conquer — o dozer limpa ÁREA, e destroço não se limpa

### 2.1 Não existe "limpar destroços" em C&C

Medição, não dedução: o wiki de Command & Conquer **não tem artigo "Rubble"**.
A busca por `Rubble` na API do wiki devolve só páginas sem relação (Battering
ram, Parliament House, Eiffel Tower…) — medido em 13/09/2026 via
`https://cnc.fandom.com/api.php?action=opensearch&search=Rubble`. Não há, na
documentação da série, uma unidade cuja função seja varrer escombro para liberar
canteiro. O destroço de prédio em C&C é cenário; construir por cima é o normal.

**Isso é uma informação de projeto, não uma lacuna:** a série que inventou o
bulldozer como unidade escolheu NÃO fazer da limpeza de escombro uma tarefa.

### 2.2 O que o dozer faz que interessa: ordem de ÁREA sobre células

O Construction Dozer de *Command & Conquer: Generals* tem três funções, e a
terceira é a nossa:

> "Build & repair buildings / **Clear mines**"

> "This multipurpose vehicle is the backbone of the USA fighting forces. In
> addition to constructing all of the USA military structures, you can use the
> Construction Dozer to repair occupied structures. **It is also effective at
> clearing minefields.**" — manual de *Generals*

E a descrição do botão da habilidade:

> "The construction dozer will **clear mines and booby traps within the assigned
> area**."

Fonte: [Construction dozer (Generals 1)](https://cnc.fandom.com/wiki/Construction_dozer_(Generals_1)).

**"Within the assigned area"** é a forma da ordem: o jogador aponta uma REGIÃO,
não uma célula, e a máquina consome a região. É o mesmo formato que a Spring
(§6) e a Factorio (§4) usam, e é o que o nosso `tarefa.area` está começando a
virar.

---

## 3. StarCraft II — os destroços destrutíveis

### 3.1 São ESTRUTURAS com vida, não terreno

A ficha do wiki de StarCraft descreve **Destructible Rocks** com
`hp = 2000`, `armor = 3`, `type = Armored`, `usearmor = Hardened Material` e a
marcação `structure = x`. Ou seja: **uma estrutura neutra que se mata a tiro**,
não um tipo de piso.

> "Destructible rocks block strategic points on the map, such as ramps and
> passages, but can also be found on mining sites with golden minerals, where a
> command center, nexus, or hatchery would be built. **In some cases the player
> needs to destroy it to build** a command center, a hatchery or a nexus, near
> the minerals."

> "The rocks **cannot be repaired, nor do they regenerate hit points**."

Fonte: [Destructible rock](https://starcraft.fandom.com/wiki/Destructible_rock).
A afirmação sobre reparo tem referência a um post do desenvolvedor Cydra nos
fóruns oficiais (2009-01-08), citado na própria página.

Na *Legacy of the Void* aparece uma variante com `hp = 500` na missão "Ghosts in
the Fog", que "must be destroyed to reveal vespene vents" — mesma fonte.

Três consequências de projeto que valem para nós:

1. **Bloqueia duas coisas ao mesmo tempo**: passagem (rampa, corredor) e
   canteiro (a expansão dourada). É exatamente o par ruína/entulho do nosso
   mapa, só que fundido num objeto só.
2. **Não regenera e não se conserta**: o progresso do jogador no terreno é
   permanente. O nosso `limparCelula` também é irreversível — está certo.
3. **A vida é alta de propósito** (2000 com blindagem 3): derrubar rocha custa
   tempo de exército, e é por isso que abrir o caminho é decisão estratégica.

### 3.2 O mapa pode FECHAR também: o rock pillar

A *Heart of the Swarm* trouxe o **rock pillar** / *collapsible rock tower*
(`hp = 500`, `armor = 3`, `structure = x`):

> "**Destroying a rock pillar can block off a choke point** by creating
> destructible rocks. **If a unit or structure ends up underneath the rocks when
> the pillar is collapsed, it is destroyed no matter its stats** (particularly
> seen on the map Altitude, where there are expansions blocked off by Xel'naga
> towers that can only be destroyed by collapsing a nearby pillar)."

Fonte: [Rock pillar](https://starcraft.fandom.com/wiki/Rock_pillar).

Duas ideias fortes de graça: **terreno que fecha** (não só abre), e a regra
brutal e clara de *o que estiver embaixo morre, custe o que custar* — resolve o
caso de borda "e se tiver unidade na célula" com uma frase, sem física.

---

## 4. Factorio — a resposta mais radical: tire o caminhar do trabalhador

### 4.1 A ordem é um CARIMBO NO MUNDO, com arrasto

O **deconstruction planner** marca por arrasto:

> "click-drag it (Left mouse button is held down while moving the mouse) over
> existing structures and ghosts to mark them for deconstruction."

O que é marcado, com um planejador em branco: "Any entities and entity ghosts,
**including trees, rocks, cliffs and fish**"; tile ghosts; e telhas só quando não
há entidade na área. O marcado ganha "a red 'X'".

Há **filtro de tipo**: o botão de árvores/rochas, "when enabled the
deconstruction planner will filter on all kinds of trees and rocks from the
Environment section".

Fonte: [Deconstruction planner](https://wiki.factorio.com/Deconstruction_planner).

Três coisas que tiramos disto:

- A ordem **vive na célula**, não na unidade. O robô pode morrer; o X continua.
- O arrasto é o gesto padrão para "essa região inteira".
- O **filtro** evita a demolição acidental do que não se quis (a mesma ideia
  reaparece no Cities: Skylines, §7.1).

### 4.2 A lista é consumida por uma ÁREA DE SERVIÇO, não pelo alcance da unidade

> "If the deconstruction orders are **within the construction area of
> construction robots** the orders will be added to the **bots' queue** and will
> be removed in due course."

Mesma fonte. O limite do trabalho é o alcance do **roboport** — um prédio fixo —,
e não o quanto o robô conseguiu andar. Quem quer limpar mais longe põe outro
roboport. É a mesma ideia do Gathering Post do Frostpunk (§8).

### 4.3 E o robô VOA

> "Construction robots are **autonomous floating devices** capable of repairing
> or building the player's structures."

> "They **remove entities marked with the deconstruction planner**. (…) This
> includes environmental entities such as fish and trees; **cliffs can be
> 'deconstructed'** if a construction robot has access to cliff explosives in a
> provider or storage chest."

Fonte: [Construction robot](https://wiki.factorio.com/Construction_robot).

**Este é o atalho mais honesto do gênero**: o problema "o trabalhador não
consegue chegar na célula que ele mesmo vai abrir" simplesmente não existe se o
trabalhador voa. A Factorio não resolveu o pathfinding da limpeza — ela o
deletou.

Vale como opção de projeto nossa: *um trator que não colide e atravessa entulho*
custa uma linha e mata a classe inteira de bug. O preço é a leitura ("por que
essa máquina passa por dentro da ruína?").

Vale também a nota do histórico 2.0.7: "Construction robots **can be assigned
multiple tasks** instead of only being given new ones after completing their
current task" — fila de trabalho por robô, não um alvo por vez. Mesma fonte.

---

## 5. OpenRA (C&C reimplementado) — a busca de alvo É o pathfinder

Este é o achado técnico mais forte do capítulo. A OpenRA resolve "qual a próxima
célula de trabalho, sem entrar em laço com as inalcançáveis" de um jeito que
torna a lista negra **desnecessária**.

### 5.1 Não varre anéis e depois testa alcance: varre o GRAFO DE CAMINHO

O método `ClosestHarvestablePos` não faz um laço de dx/dy. Ele chama o buscador
de rota com um **predicado**:

```csharp
var path = mobile.PathFinder.FindPathToTargetCellByPredicate(
    self,
    [searchFromLoc, self.Location],
    loc => harv.CanHarvestCell(loc) && claimLayer.CanClaimCell(self, loc),
    BlockedByActor.Stationary,
    loc => {
        if ((loc - searchFromLoc).LengthSquared > searchRadiusSquared)
            return PathGraph.PathCostForInvalidPath;
        ...
    });

if (path.Count > 0) return path[0];
return null;
```

Fonte: [`OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs`](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs).

Leia o que isso dá de graça:

- **Alcançável por construção.** A busca só expande por células andáveis. Célula
  no meio do quarteirão nunca é escolhida, porque a busca nem chega lá. Não há
  o que blindar com lista negra.
- **A resposta já é a rota.** `path[0]` é o alvo E o caminho. Não existe "achei o
  alvo e agora descobri que não dá para ir".
- **O raio entra como CUSTO**, não como recorte de retângulo:
  `> searchRadiusSquared → PathCostForInvalidPath`. O limite da ordem é imposto
  dentro do próprio buscador.
- **O alvo é reservado.** `claimLayer.CanClaimCell` — a `ResourceClaimLayer`
  impede que dois colhedores briguem pela mesma célula.
- **Há penalidade direcional** para o colhedor não andar em linha reta para
  longe da refinaria ("reduces the tendency for harvesters to move in straight
  lines", mesma fonte). Preferência de *qual* alvo, separada de *se* o alvo vale.

### 5.2 Dois centros de busca, com prioridade — e um recuo, não uma desistência

```csharp
// Prioritise search by these locations in this order:
//   lastHarvestedCell -> lastLinkedDock -> self.
```

E, quando a busca perto do campo atual falha:

```csharp
if (!closestHarvestableCell.HasValue)
{
    if (lastHarvestedCell != null)
    {
        lastHarvestedCell = null; // Forces search from backup position.
        closestHarvestableCell = ClosestHarvestablePos(self);
        LastSearchFailed = !closestHarvestableCell.HasValue;
    }
    else
        LastSearchFailed = true;
}
```

Mesma fonte. **Falhou perto, tenta do outro centro.** Só depois é que o estado
vira "busca falhou".

### 5.3 Falhou? ESPERA e tenta de novo. Nunca "bane para sempre"

```csharp
// After a failed search, wait and sit still for a bit before searching again.
if (LastSearchFailed && !hasWaited)
{
    QueueChild(new Wait(harv.Info.WaitDuration));
    hasWaited = true;
    return false;
}
hasWaited = false;
```

E, quando o **destino** está bloqueado (e não o alvo), há um auxiliar dedicado,
o `MoveCooldownHelper`, com documentação explícita:

> "If a move failed because the destination was blocked, indicates if we should
> **try again**."

> "**This cooldown is important to avoid lag spikes caused by pathfinding every
> tick because the destination is unreachable.** Defaults to (20, 31)."

> "Applying some **jitter** to the wait time helps avoid multiple units repathing
> on the same tick and creating a lag spike."

Fonte: [`MoveCooldownHelper.cs`](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/Move/MoveCooldownHelper.cs).
E o colhedor o instancia com `RetryIfDestinationBlocked = true`
([FindAndDeliverResources.cs](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs)).

**Resumo do padrão OpenRA:** bloqueio é *temporário até prova em contrário*. O
remédio contra o laço não é banir a célula — é **esperar com jitter**. Que é,
não por acaso, o `SearchWaitTime` do Genie (§1.2).

---

## 6. Total Annihilation / Supreme Commander / Spring — a ordem de ÁREA e a patrulha que trabalha

### 6.1 A ordem de área: apertar a tecla e ARRASTAR um círculo

O manual de ordens do Balanced Annihilation (motor Spring, linhagem Total
Annihilation) define a ordem de **Reclaim**:

> "**Default Behavior:** Simply clicking on a feature, a wreck, or an enemy unit
> with a construction unit will reclaim it by default. **Hitting 'E' and dragging
> with the left mouse button issues an area reclaim order, and tells the unit to
> reclaim any wrecks or features in that area.**"

> "Hold the Ctrl key to **force** area reclaim. This will reclaim
> non-autoreclaimable features (such as dragon's teeth), **starting with metal
> features first**."

> "Hold the Alt key to make the area reclaim order **persistent**, e.g. **the
> order will remain even when there is nothing more to reclaim**."

Fonte: [Balanced Annihilation: Giving Orders](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders).

Esta é a especificação completa de "ordem por área" que a tarefa pedia:

| pergunta | resposta do Spring |
|---|---|
| como o jogador pinta | tecla + **arrasto**, raio do círculo = tamanho do arrasto |
| o que entra na lista | "any wrecks or features in that area" |
| ordem de consumo | por prioridade (`Ctrl` = metal primeiro), não por índice |
| e quando a lista esvazia | **a ordem termina** — a menos que o jogador segure `Alt`, e aí ela fica esperando trabalho novo |
| como se enxerga a fila | "**purple lines** reclaim orders" na fila de ordens com Shift (mesma fonte) |

O `Alt` persistente é a peça que falta em quase toda implementação caseira:
existem **dois** comportamentos desejáveis quando acaba o serviço, e o jogo deixa
o jogador escolher qual.

### 6.2 A solução mais elegante do gênero: PATRULHAR e limpar de passagem

O wiki de Supreme Commander:

> "**Reclaim is automatically included in the patrol and attack move commands for
> engineers** when the mass storage is not full."

> "You can efficiently **cut a way through walls** by ordering any unit capable of
> reclaiming **to go on a patrol** that will lead it near or through the wall.
> This is because placing any unit capable of reclaiming on patrol will cause it
> to **automatically reclaim any trees, rocks or wreckage within range**."

Fonte: [Reclaim (Supreme Commander wiki)](https://supcom.fandom.com/wiki/Reclaim).

O Spring tem o mesmo, com modificadores: patrulha reclama por padrão; `Alt`
manda preservar corpos ressuscitáveis; `Meta` manda reclamar inimigos também
([Giving Orders](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders)).

**Por que isso é ouro para o nosso trator:** na patrulha, **a unidade nunca
escolhe um alvo de trabalho**. Ela escolhe um *caminho*, e trabalha no que
estiver ao alcance enquanto passa. O laço "escolher alvo → falhar rota → escolher
de novo" some, porque não existe escolha de alvo. É impossível travar procurando
o que limpar, pois nada é procurado.

### 6.3 Construir por cima já manda limpar

Ainda no mesmo manual, sobre a grade de posicionamento de prédio:

> "If the grid is green with some yellow-green squares in it somewhere, it means
> **the groundplate is blocked by a mobile unit or reclaimable feature. This
> situation should be resolved automatically by the constructing unit.**"

Fonte: [Giving Orders](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders).

Ou seja: o jogador NÃO precisa limpar antes de construir. Ele põe o prédio em
cima do entulho e o construtor limpa sozinho como primeiro passo da obra. O
mesmo comportamento existe no AoE2 com árvores isoladas ("it is possible to
destroy many individual 'straggler' trees by constructing buildings on top of
them" — [Tree](https://ageofempires.fandom.com/wiki/Tree)) e o Update 50292
inclusive o **apertou** ("Now the foundation construction has to be started to
remove the trees" — [Update 50292](https://ageofempires.fandom.com/wiki/Update_50292)).

---

## 7. Os construtores de cidade — a ordem sem unidade

### 7.1 Cities: Skylines — o pincel de arrasto, com trava de tipo

> "Demolition is the process of removing buildings and other things to make new
> space. Demolition can be done by clicking the bulldozer icon located on the
> lower-right corner."

> "**Trees.** To clear large numbers of trees, **click on a tree and hold the mouse
> button while moving the bulldozer cursor over other trees. It will not bulldoze
> roads or buildings as long as the mouse button remains depressed.**"

> "Burning trees cannot be bulldozed."

Fonte: [Demolition — Cities: Skylines Wiki (Paradox)](https://skylines.paradoxwikis.com/Demolition).

O gesto é **pincel**, não retângulo: o jogador pinta. E a regra de segurança é
linda de simples — **o primeiro clique fixa o tipo**: começou numa árvore, o
arrasto só derruba árvore. Não há caixa de diálogo, não há filtro a configurar;
o primeiro alvo É o filtro. Isso resolve sozinho o medo de "arrastei demais e
demoli meu quartel".

Nota: aqui não há unidade nenhuma. A demolição é instantânea e custa dinheiro.
Todo o problema de caminhar desaparece.

### 7.2 SimCity (2013) — a ruína como PENDÊNCIA contada na interface

> "**Bulldoze**: this brings up the bulldozing interface, allowing players to
> select zones or buildings they want to delete. **The right menu shows the number
> of currently abandoned buildings and rubble that need attention.** The icon will
> also change to a bulldozer."

Fonte: [Interface (SimCity (2013))](https://simcity.fandom.com/wiki/Interface_(SimCity_(2013))).

E o Cities: Skylines diz o porquê de o jogo cobrar isso do jogador:

> "To keep land value in check, demolish abandoned and burned down buildings.
> Abandoned buildings can be renovated or rebuilt automatically, but **burned
> buildings must be demolished** for a new building to construct."

Fonte: [Demolition](https://skylines.paradoxwikis.com/Demolition).

**A ruína vira um CONTADOR na barra** — "quantos ainda precisam de atenção". É
uma ideia barata e boa para nós: um número de células limpáveis no setor diz ao
jogador que ainda há serviço, e o trator ocioso deixa de ser mistério.

O Cities: Skylines tem ainda uma regra de consequência que vale citar:
"**Bulldozing the destroyed buildings before searching will result in the loss of
any citizens who might otherwise have been rescued**" (mesma fonte). Limpar cedo
demais custa caro. Dá uma decisão ao jogador de graça.

---

## 8. Frostpunk — matar o problema tirando o andarilho

A resposta do Frostpunk à pergunta "como o trabalhador escolhe o próximo alvo" é
não ter trabalhador andando. O **Gathering Post** é um prédio 3×2 com 10
trabalhadores e um raio:

> "People working here gather resources from nearby Coal Piles, Wood Crates and
> Steel Wreckage."

> "**Place the gathering post next to resource piles** (…) and staff it with
> people and **they will gather from any piles within range.**"

E a regra de escolha de alvo, com todas as letras:

> "Gathering posts handle multiple resource piles by assigning individual workers
> to each resource pile. **Each worker will be assigned to one resource pile,
> starting at the resource pile closest to the post and moving outward, and then
> repeating.** This gives the player **very limited control** as to which piles are
> gathered from."

Fonte: [Gathering Post](https://frostpunk.fandom.com/wiki/Gathering_Post).

Três decisões embutidas:

1. **A âncora é um PRÉDIO**, parado. O raio não anda junto com o trabalhador —
   é o contrário exato do nosso `celulaLimpavelProxima(u, …)`, que centra a busca
   no trator e deixa a área derivar.
2. **Mais perto da âncora primeiro, depois para fora, e repete.** Anéis, como o
   nosso — mas ao redor de algo que não se move.
3. **Quando acaba, o jogador MOVE a construção.** O wiki de recursos diz o mesmo
   do Sawmill: "once all the trees around it are gone, **it will have to be
   moved**" ([Resources](https://frostpunk.fandom.com/wiki/Resources)).

Isto é literalmente o nosso aviso *"Trator sem mais entulho ao alcance. Leve-o
para outro ponto."* — e o Frostpunk mostra que a mensagem está certa. O que está
errado é ela disparar quando ainda HÁ entulho ao alcance (§9).

---

## 9. Dwarf Fortress — a designação que mora na célula

O modelo mais puro de "lista de trabalho no mundo" é a designação do DF:

> "To designate an area, select the desired designation from the menu, place your
> cursor over the first tile, click once, then **drag your cursor over to another
> tile — which will create a rectangle**, then click again. You can also choose to
> **'paint' an area**, which lets you specifically designate tiles one by one."

> "To cancel a designation, use **Remove Designations**."

Fonte: [Designations menu](https://dwarffortresswiki.org/index.php/Designations_menu).

E, na mineração, o mesmo gesto com o mesmo vocabulário: "Draw a **rectangle**
using the mouse. An area should now be highlighted, indicating the area to be
mined" — e o cancelamento por **borracha de área**: "open the eraser tool (…) and
select an area you want to cancel". Fonte:
[Mining](https://dwarffortresswiki.org/index.php/Mining).

Há também designações com **regra automática**, que estendem a marcação sozinhas:
o modo de automineração "allow you to quickly assign mining tasks to entire veins"
(mesma fonte de [Mining](https://dwarffortresswiki.org/index.php/Mining)) — marcar
um veio inteiro com um clique, que é o análogo de "limpe este quarteirão".

O que o DF fixa como vocabulário e vale copiar:

- **Dois gestos**: retângulo (arrasto) e pincel (célula a célula). Ambos, não um.
- **Borracha**: desmarcar é uma ordem de área também.
- A marcação é **do mapa**. Nenhum anão é dono dela. Quem estiver livre pega.

---

## 10. O que NÃO encontrei documentado

Registro honesto, para ninguém refazer a busca:

- **Anno 1800**: o wiki não tem página de "Construction", "Demolish" ou remoção
  de obstáculo. Medido em 13/09/2026 por `action=opensearch` em
  `https://anno1800.fandom.com/api.php` com os termos `demolish` e `construction`
  — devolveu só páginas de mercadoria (Bricks, Timber, Steel Beams…).
- **They Are Billions**: o wiki ativo é `they-are-billions.fandom.com`; a busca
  por `trees` e `clear` devolveu Technology Tree, Sawmill, Buildings e nomes de
  missão — **nenhuma página de unidade ou ordem de limpeza de terreno**. Medido
  em 13/09/2026.
- **Liquipedia (StarCraft II)** ficou inacessível o tempo todo (HTTP 429 em
  todas as tentativas, inclusive pela API). Os dados de rocha aqui vêm do wiki de
  StarCraft, que referencia fórum oficial e material da Blizzard.
- **A busca da web desta sessão estourou a cota** (200/200 chamadas antes deste
  trabalho começar). Tudo aqui foi obtido por acesso direto a URL e a API de cada
  wiki, e por leitura de código-fonte no GitHub.

---

## 11. Os padrões, destilados

| # | padrão | de onde | o que resolve |
|---|---|---|---|
| P1 | **A busca de alvo É o pathfinder** (inundação por células andáveis com predicado) | [OpenRA](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs) | alcançabilidade por construção; **dispensa lista negra** |
| P2 | **Escolher por distância de CAMINHO, não de ladrilho** | [AoE2 DE Update 50292](https://ageofempires.fandom.com/wiki/Update_50292) | o alvo do outro lado do muro deixa de ser "o mais perto" |
| P3 | **Falha de rota = ESPERAR, com jitter** — nunca banir | [OpenRA MoveCooldownHelper](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/Move/MoveCooldownHelper.cs), [Genie `SearchWaitTime`](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h) | laço de repathing por quadro, sem falso "acabou o serviço" |
| P4 | **Excluir só o alvo ANTERIOR**, não um conjunto que cresce | [0 A.D. UnitAI](https://github.com/0ad/0ad/blob/master/binaries/data/mods/public/simulation/components/UnitAI.js) | não repetir o alvo que acabou de falhar, sem perder o mapa |
| P5 | **Dois centros de busca**: onde estou + **onde a ordem foi dada** | [0 A.D. `initPos`](https://github.com/0ad/0ad/blob/master/binaries/data/mods/public/simulation/components/UnitAI.js), [OpenRA `lastHarvestedCell` → doca → self](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs) | a área de trabalho não deriva junto com a máquina |
| P6 | **Comer o bloco pela BORDA** — só é alvo o que tem lado livre | [AoE2: floresta bloqueia, corta-se de fora](https://ageofempires.fandom.com/wiki/Tree); [Genie `WorkRange`](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h) | célula sólida no meio do quarteirão nunca é escolhida |
| P7 | **Posto de trabalho = célula vizinha livre + alcance de trabalho** | [Genie `WorkRange`](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h) | trabalhar em célula onde não se pode entrar |
| P8 | **Ordem de ÁREA por arrasto**, retângulo ou pincel; com borracha | [Spring](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders), [Factorio](https://wiki.factorio.com/Deconstruction_planner), [DF](https://dwarffortresswiki.org/index.php/Designations_menu), [Cities: Skylines](https://skylines.paradoxwikis.com/Demolition) | "limpe esta quadra" num gesto |
| P9 | **O primeiro alvo do arrasto fixa o TIPO** | [Cities: Skylines](https://skylines.paradoxwikis.com/Demolition) | pincelada larga sem destruir o que não se quis |
| P10 | **A ordem vive na CÉLULA**, não na unidade (marca persistente) | [Factorio](https://wiki.factorio.com/Deconstruction_planner), [DF](https://dwarffortresswiki.org/index.php/Designations_menu) | máquina morre, o serviço continua; várias máquinas dividem |
| P11 | **Lista vazia: terminar a ordem — ou ficar, se o jogador pedir (`Alt`)** | [Spring](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders) | os dois comportamentos são legítimos; quem escolhe é o jogador |
| P12 | **Reserva de alvo** entre trabalhadores | [OpenRA `ResourceClaimLayer`](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs) | dois tratores na mesma célula |
| P13 | **Patrulhar e limpar de passagem** — sem escolher alvo | [Supreme Commander](https://supcom.fandom.com/wiki/Reclaim), [Spring](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders) | elimina a classe de bug inteira |
| P14 | **Construir por cima já manda limpar** | [Spring](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders), [AoE2](https://ageofempires.fandom.com/wiki/Tree) | o jogador nem precisa dar ordem de limpeza |
| P15 | **Travado tem de aparecer OCIOSO** — e ocioso tem de ser visível | [AoE2 DE Update 153015](https://ageofempires.fandom.com/wiki/Update_153015), [Idle Pointers](https://ageofempires.fandom.com/wiki/Villager_(Age_of_Empires_II)) | o jogador vê a máquina parada em vez de adivinhar |
| P16 | **A célula só libera quando o trabalho TERMINA** | [AoE2 e AoE IV update 9.1.176](https://ageofempires.fandom.com/wiki/Tree) | nada de furar bloco pela metade |
| P17 | **O trabalhador voa** | [Factorio](https://wiki.factorio.com/Construction_robot) | deleta o problema inteiro, ao preço da leitura |
| P18 | **Contar a pendência na interface** | [SimCity (2013)](https://simcity.fandom.com/wiki/Interface_(SimCity_(2013))), [Cities: Skylines](https://skylines.paradoxwikis.com/Demolition) | "ainda tem serviço" deixa de ser invisível |

---

## O que serve para nós

Lido `src/sim-unidades.js` no commit `080b26a` (árvore de trabalho suja). A
tarefa `limpar` começa em **`sim-unidades.js:296`**; os auxiliares estão em
**`desistirDaCelula` (541)**, **`encostavel` (548)** e
**`celulaLimpavelProxima` (554)**; a ordem nasce em **`ui.js:636`** e o terreno
muda em **`world.js:49` (`limparCelula`)** e **`world.js:67` (`limpavel`)**.

O nosso desenho já acertou três coisas dos clássicos:

- **P7** — o posto é um vizinho ortogonal livre e o trabalho acontece de fora
  (`sim-unidades.js:342-357`). É o `WorkRange` do Genie, com outro nome.
- **P6** — `encostavel` (548) exige lado livre, então o bloco é comido pela
  borda, como no AoE2.
- **P16** — `sim-unidades.js:414` (`if (w.limpavel(al.x, al.y)) { tarefa.progresso = 0; return; }`)
  segura o trator na célula até o chão abrir. É a regra do update 9.1.176 do
  AoE IV.

Onde diferimos — em ordem do que mais provavelmente causa o travamento:

### D1 — Estrangulamento de rota tratado como "inalcançável". **É esta a causa mais provável.**

`pedirRota` (**`sim-unidades.js:115-117`**) começa com
`if (this.t < u.tentarRotaEm) return false;` e, quando uma busca falha, marca
`u.tentarRotaEm = this.t + 1.6` (**linha 126**). Ou seja: `false` significa
**duas coisas diferentes** — "não há caminho" e "ainda não é hora de procurar".

Na tarefa `limpar`, **`sim-unidades.js:374-379`** trata os dois iguais:

```js
if ((!u.rota || !u.rota.length) &&
    !this.pedirRota(u, { x: alvoPosto.x, y: alvoPosto.y }, { raioChegada: 0 })) {
  this.desistirDaCelula(tarefa, al);   // ← bane a célula
  u.bloqueado = true;
  return;
}
```

Uma única falha real abre uma janela de **1,6 segundo** em que TODA célula
escolhida é banida sem que ninguém tenha procurado rota para ela. A 60 quadros
por segundo, isso é uma execução por quadro: em menos de dois segundos a lista
negra engole o bairro inteiro, `celulaLimpavelProxima` devolve `null` e a linha
**317** dispara *"Trator sem mais entulho ao alcance"* com entulho encostado na
máquina. **É exatamente o sintoma relatado: limpa três ou quatro e para.**

Os clássicos separam as duas coisas com nomes distintos. Na OpenRA, destino
bloqueado entra no `MoveCooldownHelper`, que "**avoids lag spikes caused by
pathfinding every tick because the destination is unreachable**" e **volta a
tentar** (`RetryIfDestinationBlocked = true`) — nunca marca nada como perdido
([MoveCooldownHelper.cs](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/Move/MoveCooldownHelper.cs)).
No Genie o mesmo freio é o `SearchWaitTime`, um campo da tarefa
([UnitCommand.h](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h)).
**Padrão P3.**

### D2 — A lista negra é permanente e nunca é invalidada quando o terreno muda

`desistirDaCelula` (**541**) grava em `tarefa.desistidas` e nada nunca apaga. O
comentário da **539** diz "ordem nova começa limpa" — mas dentro de uma ordem a
lista só cresce, e `celulaLimpavelProxima` pula tudo que está nela (**562**).

O problema é que **o mapa muda debaixo da lista**: `world.js:49-58` incrementa
`versaoRota` ao derrubar ruína, justamente porque "Derrubar ruína muda a
NAVEGABILIDADE — abre caminho onde não havia". A célula banida por estar atrás
de uma parede continua banida **depois que o próprio trator derruba a parede**.

O 0 A.D. exclui **só o alvo anterior**, um elemento, e nada mais:

```js
let filter = (ent, type, template) => {
    if (previousTarget == ent) return false;
    ...
};
```

([UnitAI.js, `GATHER.FINDINGNEWTARGET`](https://github.com/0ad/0ad/blob/master/binaries/data/mods/public/simulation/components/UnitAI.js)).
**Padrões P4 e P3.** No mínimo, `tarefa.desistidas` tem de morrer quando
`world.versaoRota` sobe.

### D3 — Escolhe o alvo por Chebyshev e testa alcance por vizinhança geométrica

`celulaLimpavelProxima` (**554-571**) varre anéis
`Math.max(Math.abs(dx), Math.abs(dy)) === r` e aceita a primeira célula que
passa em `limpavel && encostavel`. E `encostavel` (**548-552**) só pergunta se
existe algum dos quatro vizinhos ortogonais livre.

**"Tem vizinho livre" não é "dá para chegar lá".** Uma ruína cujo único lado
livre está do outro lado de uma muralha nossa passa no teste e falha na rota —
e cai na lista negra de D2. A cada célula limpa, o mesmo anel é varrido de novo
do zero, e as inalcançáveis vêm primeiro porque estão mais perto.

Este é o item que o AoE2 DE corrigiu em 2021, com estas palavras: "Villagers now
take **pathing distance** into account when selecting their nearest drop site
(instead of tile distance)" ([Update 50292](https://ageofempires.fandom.com/wiki/Update_50292)).
E é o que a OpenRA torna impossível de errar, porque a busca do alvo **é** o
buscador de rota: `FindPathToTargetCellByPredicate(...)` devolve `path[0]`, o
alvo e o caminho de uma vez
([FindAndDeliverResources.cs](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs)).
**Padrões P1 e P2.** Nós já temos `nav.buscar` em `path.js` — falta usá-lo como
busca, não só como locomoção.

### D4 — O centro da busca anda junto com a máquina

**`sim-unidades.js:306`** passa `u` como centro:
`this.celulaLimpavelProxima(u, tarefa.raio || 10, …)`. O raio 10 é medido a
partir do trator, então a área de trabalho **deriva**: cada célula limpa move o
centro, e a ordem "limpe esta quadra" vira "limpe na direção que você andou".

Os dois clássicos guardam a âncora da ordem: o 0 A.D. mantém `initPos` e procura
**nos dois centros** — posição atual e posição em que a ordem foi dada
([UnitAI.js](https://github.com/0ad/0ad/blob/master/binaries/data/mods/public/simulation/components/UnitAI.js)) —
e a OpenRA prioriza `lastHarvestedCell → doca → self`
([FindAndDeliverResources.cs](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs)).
O Frostpunk é o extremo: a âncora é um **prédio** que não anda
([Gathering Post](https://frostpunk.fandom.com/wiki/Gathering_Post)).
**Padrão P5.**

O `tarefa.area` recém-acrescentado (**306-307** e **563-565**) tapa metade do
buraco: o retângulo pintado agora recorta a busca. Falta o raio parar de andar
com a máquina.

### D5 — Não há reserva de célula entre tratores

Nada em `limpar` marca a célula como tomada. Dois tratores com a mesma ordem
escolhem a mesma célula, e o segundo fica olhando o primeiro trabalhar — e como
o posto é escolhido por `w.livre` (**350-351**), o segundo pode até tomar o
posto do primeiro.

A OpenRA resolve com uma camada dedicada: `claimLayer.CanClaimCell(self, loc)`
entra **dentro do predicado da busca**, então a célula reservada nem aparece como
candidata ([FindAndDeliverResources.cs](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs)).
**Padrão P12.**

### D6 — Abrir passagem não faz ninguém aproveitar o atalho

`world.js:49-58` sobe `versaoRota` ao derrubar ruína, e `andar`
(**`sim-unidades.js:138-150`**) reage revalidando **só os seis passos à frente**
e só contra ocupação de estrutura (`world.occ`). Isso é uma rede de segurança
contra rota inválida, **não** um reaproveitamento: quem já tinha rota longa
continua dando a volta no quarteirão que acabou de abrir.

O AoE2 trata a mesma família de defeito como bug de pathfinding — "Fixed a rare
issue where units tried to avoid **no longer present objects** when targeting
solid objects" ([Update 50292](https://ageofempires.fandom.com/wiki/Update_50292)).
Aqui o dado não está velho, mas a oportunidade é ignorada. Vale medir antes de
mexer: repathing de todo mundo a cada ruína derrubada é caro, e o AoE2 gasta
`SearchWaitTime` justamente para não fazer isso.

### D7 — Só quatro vizinhos, e `livre` ignora o próprio trator

`encostavel` (**548-552**) e a lista de postos (**346-347**) usam apenas os
quatro vizinhos ortogonais. Abertura em diagonal não conta, e a máquina desiste
de célula que daria para trabalhar. O `WorkRange` do Genie
([UnitCommand.h](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h))
é um **raio**, não uma lista de quatro casas.

E `w.livre` (**`world.js:83-88`**) olha terreno, `occ` e `recurso` — não olha
unidades. Duas máquinas podem escolher o mesmo posto (ver D5).

### D8 — A ordem de área é retângulo implícito, sem os gestos dos clássicos

`ui.js:636` dá `{ tipo: 'limpar', raio: 10, … }` a partir de **um toque**, e o
rótulo da ordem (`ui.js:612`) é *"Toque onde começar a limpeza"*. O `tarefa.area`
que apareceu agora é um retângulo `x0/x1/y0/y1` (**565**).

Falta o vocabulário que os clássicos fixaram (**P8, P9, P10, P11**):

- arrasto de retângulo **e** pincel célula a célula — o DF tem os dois
  ([Designations menu](https://dwarffortresswiki.org/index.php/Designations_menu));
- **borracha** de área para desmarcar (mesma fonte);
- o primeiro alvo do arrasto **fixando o tipo** — pintei em entulho, só limpo
  entulho ([Cities: Skylines](https://skylines.paradoxwikis.com/Demolition));
- a escolha explícita entre **terminar** e **ficar esperando** quando a lista
  esvazia — o `Alt` do Spring
  ([Giving Orders](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders)).
  Hoje só existe "terminar", em `sim-unidades.js:315-318`.

### D9 — Duas coisas que os clássicos dão de graça e nós não temos

- **Construir por cima já manda limpar** (**P14**). Hoje o jogador precisa
  limpar antes; `world.js:75-80` (`construivel`) exige `T.ASFALTO`. No Spring
  isso "should be resolved automatically by the constructing unit"
  ([Giving Orders](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders)),
  e no AoE2 a fundação derruba a árvore isolada
  ([Tree](https://ageofempires.fandom.com/wiki/Tree)).
- **Patrulhar limpando** (**P13**). A patrulha já existe no jogo, mas só para
  tropa: `ui.js:612` traz o rótulo "Toque no outro extremo da patrulha", e
  `ui.js:633-641` desvia o trator para `limpar` ou `mover` antes de chegar lá —
  ou seja, o trator nunca patrulha. Dar a ele o comportamento do
  engenheiro de Supreme Commander — "reclaim (…) **automatically included in the
  patrol** (…) any trees, rocks or wreckage **within range**"
  ([Reclaim](https://supcom.fandom.com/wiki/Reclaim)) — elimina a escolha de
  alvo, e com ela a classe inteira de travamento. É o caminho mais barato de
  todos, porque não precisa de busca nenhuma.

### O que eu faria primeiro

Uma coisa, não um menu: **separar "ainda não procurei" de "não há caminho"**
(D1). Enquanto `pedirRota` devolver `false` pelos dois motivos e a linha 376
banir a célula em cima disso, qualquer melhoria de busca vai continuar
alimentando uma lista negra mentirosa. Depois, na ordem: apagar `desistidas`
quando `versaoRota` subir (D2) e trocar a varredura de anéis pela busca em grafo
do `path.js` (D3, P1) — que, feita a troca, torna D2 e D1 desnecessários, porque
não existe mais célula inalcançável para banir.

---

## Fontes

**Age of Empires** — [Tree](https://ageofempires.fandom.com/wiki/Tree) ·
[Villager (Age of Empires II)](https://ageofempires.fandom.com/wiki/Villager_(Age_of_Empires_II)) ·
[Gather Point](https://ageofempires.fandom.com/wiki/Gather_Point) ·
[Update 50292](https://ageofempires.fandom.com/wiki/Update_50292) ·
[Update 153015](https://ageofempires.fandom.com/wiki/Update_153015) ·
[Villager Priority](https://ageofempires.fandom.com/wiki/Villager_Priority)

**Motor Genie (AoE1/AoE2)** — [genieutils `UnitCommand.h` (struct `Task`)](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/UnitCommand.h) ·
[genieutils `unit/Bird.h` (`SearchRadius`, `WorkRate`, `DefaultTaskID`)](https://github.com/Tapsa/genieutils/blob/master/include/genie/dat/unit/Bird.h)

**StarCraft II** — [Destructible rock](https://starcraft.fandom.com/wiki/Destructible_rock) ·
[Rock pillar](https://starcraft.fandom.com/wiki/Rock_pillar)

**Command & Conquer** — [Construction dozer (Generals 1)](https://cnc.fandom.com/wiki/Construction_dozer_(Generals_1))

**OpenRA (C&C reimplementado, código-fonte)** — [`FindAndDeliverResources.cs`](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/FindAndDeliverResources.cs) ·
[`MoveCooldownHelper.cs`](https://github.com/OpenRA/OpenRA/blob/bleed/OpenRA.Mods.Common/Activities/Move/MoveCooldownHelper.cs)

**0 A.D. (código-fonte)** — [`UnitAI.js`](https://github.com/0ad/0ad/blob/master/binaries/data/mods/public/simulation/components/UnitAI.js)

**Spring / Total Annihilation / Supreme Commander** — [Balanced Annihilation: Giving Orders](https://springrts.com/wiki/Balanced_Annihilation:Giving_Orders) ·
[Reclaim (Supreme Commander)](https://supcom.fandom.com/wiki/Reclaim)

**Factorio** — [Deconstruction planner](https://wiki.factorio.com/Deconstruction_planner) ·
[Construction robot](https://wiki.factorio.com/Construction_robot)

**Construtores de cidade** — [Demolition (Cities: Skylines)](https://skylines.paradoxwikis.com/Demolition) ·
[Interface (SimCity (2013))](https://simcity.fandom.com/wiki/Interface_(SimCity_(2013))) ·
[Gathering Post (Frostpunk)](https://frostpunk.fandom.com/wiki/Gathering_Post) ·
[Resources (Frostpunk)](https://frostpunk.fandom.com/wiki/Resources)

**Dwarf Fortress** — [Designations menu](https://dwarffortresswiki.org/index.php/Designations_menu) ·
[Mining](https://dwarffortresswiki.org/index.php/Mining)
