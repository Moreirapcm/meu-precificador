# Inventário do gênero — o que um RTS clássico tinha

A pergunta que este capítulo responde é a do dono do jogo: **"o que mais preciso
colocar nessa lista?"**. Não é lista de desejos. É o inventário do que
StarCraft, Warcraft II e III, Age of Empires II, Command & Conquer e os
descendentes modernos do gênero (They Are Billions, Kingdom Rush) tinham, com
fonte, e ao lado de cada item o que ele acrescenta **num jogo de defesa de base
para celular** e quanto custa **para nós**.

## Como ler a coluna de custo

Nosso gargalo não é código: é **arte nova**. O capítulo 01 mostrou a conta —
quadros × direções. Então:

- **barato** — só simulação, interface ou som. Nenhum desenho novo, ou no
  máximo um ícone. Cabe numa tarde.
- **médio** — reaproveita sprite existente (recolorido, um estado novo, um
  retrato recortado da arte que já temos) ou é um sistema de simulação inteiro
  sem arte.
- **caro** — **unidade ou estrutura nova desenhada**: 5 direções × (andar +
  atirar + morrer) é a conta do capítulo 03, dezenas de imagens por figura, mais
  ícone, mais retrato. Também entra aqui o que precisa de gravação de voz.

Tudo o que está em "já temos" foi **medido no código em 13/09/2026**, com
arquivo e linha.

---

## 1. Heróis e poder de herói

### O que os clássicos fizeram

**StarCraft (1998) — herói de campanha, sem nível.** Unidade-herói lá é uma
unidade normal turbinada: "powered-up forms of base units that usually come with
all upgrades and abilities available, have more HP, shields and armor, and
higher attack power", e "if a hero unit dies, the player receives a notification
of this and **the mission fails**"
([StarCraft Wiki — Hero unit](https://starcraft.fandom.com/wiki/Hero_unit)).
Não há experiência, não há item, não há inventário. O herói é *narrativa +
números*, e custa ao estúdio um retrato e um nome — o corpo é o sprite do
Marine, do Vulture, do Zealot (a exceção é Kerrigan, que ganhou sprite próprio).
Herói ali é reconhecido pela **cor do jogador**, não pelo desenho.

A escala dos números, medida nas fichas:

| herói | unidade-base | vida do herói | vida da base |
|---|---|---|---|
| Jim Raynor (fuzileiro) | Marine | 200 | 40 |
| Jim Raynor (moto) | Vulture | 300 | 80 |
| Sarah Kerrigan | Ghost | 250 | 45 |
| Fenix (zealot) | Zealot | 240 + 240 escudo | 100 + 60 |
| Zeratul | — | 60 + **400** escudo | — |

([Liquipedia — Raynor (Marine)](https://liquipedia.net/starcraft/Jim_Raynor_(Marine)),
[Marine](https://liquipedia.net/starcraft/Marine),
[Zealot](https://liquipedia.net/starcraft/Zealot);
[Fandom — Kerrigan](https://starcraft.fandom.com/wiki/Sarah_Kerrigan_(ghost)),
[Zeratul](https://starcraft.fandom.com/wiki/Zeratul_(StarCraft)))

Três a cinco vezes a vida, uma vez e meia a três vezes o dano, mais dois ou três
de blindagem. E um detalhe que vale ouro para o equilíbrio: Kerrigan tem
**alcance menor** que o Ghost comum (6 contra 7) — herói não precisa ser melhor
em tudo.

**Warcraft II (1995) — o herói mais barato que existe, e a prova de que dá
certo.** A definição da wiki é a receita inteira: "Each hero is based on a
certain unit and has the same basic abilities as that unit ..., but different
stats and **a unique portrait**"
([Warcraft II units](https://warcraft.wiki.gg/wiki/Warcraft_II_units)). Retrato
novo, corpo emprestado.

E há uma experiência natural dentro do próprio jogo, que é o achado mais útil
desta seção: "The five heroes introduced in *Tides of Darkness* have
approximately the same stats as the unit they're based on (and are sometimes
actually weaker), while the ten heroes introduced in *Beyond the Dark Portal*
are much stronger" (mesma página). No jogo base, Gul'dan tem **40 de vida contra
60 do Cavaleiro da Morte comum** — o "herói" é mais fraco que a tropa. Na
expansão, Danath tem 220 contra 60 do Footman (+267%) e Deathwing tem 800 contra
100 do Dragão.

O que faz o herói funcionar nos dois casos não é o número: é **a regra da
missão** — "In most campaign missions you must prevent your heroes from dying
and/or escort them to a **Circle of Power**" (mesma página). Custo de arte:
**um retrato**. Valor: alto, porque transforma "sobreviver" em "proteger
alguém".

**Warcraft III (2002) — o sistema completo.** A página oficial da Blizzard é
explícita sobre o papel: "Heroes are the backbone of an assault force"
([Battle.net — Heroes](https://classic.battle.net/war3/basics/heroes.shtml)).
Os números, na mesma página e na wiki:

- nível máximo **10**; "Heroes can carry up to 6 items"; cada herói tem
  **4 habilidades base**, e "Every Hero will have one ultimate ability"
  disponível a partir do nível 6
  ([Battle.net](https://classic.battle.net/war3/basics/heroes.shtml));
- **1 ponto de habilidade por nível**, três atributos (Força, Agilidade,
  Inteligência) com um deles primário, e **até três heróis** por jogador; o
  primeiro custa só comida (5)
  ([Warcraft Wiki](https://warcraft.wiki.gg/wiki/Hero_(Warcraft_III)));
- morto, o herói **ressuscita pagando por nível**: 200 de ouro no nível 1 até
  650 no nível 10 ([guia de experiência, GameFAQs](https://gamefaqs.gamespot.com/pc/589475-warcraft-iii-the-frozen-throne/faqs/18218));
- o custo de subir é explícito: a experiência do nível seguinte é *(a do nível
  anterior) + (100 × nível)*, e quem morre fica parado — "While your Hero is
  dead, you are not gaining experience and friendly troops aren't provided with
  beneficial Auras"
  ([Battle.net — Hero Control](https://classic.battle.net/war3/basics/herocontrol.shtml));
- e o freio que mantém o herói dentro da economia: "Once your Hero is level 5 he
  can only gain experience from other player controlled units" — a partir do
  nível 5 **monstro neutro não dá mais experiência**
  ([Battle.net](https://classic.battle.net/war3/basics/heroes.shtml)).

Esse último detalhe é o que faz o sistema não virar bola de neve: o herói sobe
rápido no começo e depois só cresce se o jogador **arriscar** o herói contra o
inimigo de verdade.

Duas separações do Warcraft III que valem mais que o resto do sistema, porque
são grátis de implementar e evitam confusão de equilíbrio:

- **"Only Heroes can use items"**
  ([Battle.net — Hero Items](https://classic.battle.net/war3/basics/heroitems.shtml))
  — item é a moeda do herói, e de mais ninguém;
- **"Normal upgrades will not affect Heroes. Heroes are upgraded by leveling up
  and using Hero Items"**
  ([Warcraft Wiki](https://warcraft.wiki.gg/wiki/Hero_(Warcraft_III))) — a curva
  do exército e a curva do herói **não se somam**. É por isso que o herói não
  explode no fim da partida.

E um aviso de balanceamento que nos poupa uma armadilha: a Blizzard precisou
criar um **tipo de dano "Hero"** no patch 1.06 "so that heroes no longer
strongly counter ranged units such as Archers and Crypt Fiends" (mesma página).
Herói forte demais não quebra a defesa do jogador — quebra o **contra-ataque do
inimigo**.

**De onde vinha a experiência: os monstros neutros.** A wiki é explícita sobre o
propósito deles — "Creeps are an RPG element ... It also adds a method for
players that are outmatched by another player to try to get back into a game by
killing creeps for items and levels"
([Warcraft Wiki — Creep](https://warcraft.wiki.gg/wiki/Creep)) — e a Blizzard
admite o motivo emocional: "Some players find Creeping a lot of fun because it's
a 'mini-game' like Diablo within Warcraft III"
([Battle.net — Creeping](https://classic.battle.net/war3/basics/creeping.shtml)).
Nós já temos o equivalente pronto e nem estamos usando: os **postos abandonados**
(`ruinas` em `data.js`), que hoje um operário reativa de graça. Eles são o nosso
acampamento de creep — o lugar do mapa que paga por sair da base.

**Kingdom Rush (2011) — o modelo barato, e o que serve para celular.** Torre de
defesa com herói: o herói começa **nível 1 em cada fase**, sobe até **10**
ganhando vida e ataque, tem **duas habilidades** liberadas por nível, e
**volta sozinho depois de um tempo** quando morre — o nível zera quando a fase
acaba ([Kingdom Rush Wiki — Heroes](https://kingdomrushtd.fandom.com/wiki/Heroes/Kingdom_Rush)).
É o Warcraft III sem inventário, sem altar, sem economia paralela: **toda a
progressão cabe dentro de uma partida**. Para o nosso jogo, que é exatamente
"uma partida = um setor", esse é o modelo certo.

**They Are Billions (2019)** — o parente mais próximo do nosso jogo — usa o
herói **fora** da defesa de colônia: nas missões táticas, "use your hero to
explore pre-apocalypse bunkers and factories to acquire new technology"
([Neoseeker — Campaign Tech Tree Guide](https://www.neoseeker.com/they-are-billions/guide/Campaign_Tech_Tree_Guide)).

### Por que o herói entrou — e o que ele arrasta junto

Esta é a parte que quase nenhum projeto caseiro lê antes de colocar herói, e é a
mais importante. Rob Pardo, designer-líder do Warcraft III, explicou a ordem
causal numa entrevista publicada no livro *Game Design Workshop*:

> "In StarCraft you can just throw lots of units into the battlefield and not
> care whether they live or die. You can get an army of 50 to 100 units going
> and it's no big deal. For War III we wanted to get rid of what we call the
> **'fodder' unit**. We want you to care about every grunt and every footman.
> Part of the reasoning for that was the increased focus on heroes. We wanted a
> hero to be a dominant force in the battlefield ... So if we know there's going
> to be 50 units on the battlefield then we'd have to make the hero ridiculously
> powerful for him to have a meaningful impact. **If you have a battlefield with
> say 10 or 20 units then the hero could be more realistically balanced.**"
> ([entrevista com Rob Pardo](https://flylib.com/books/en/2.489.1.80/1/))

Leia na ordem em que ele diz: **herói dominante primeiro, exército pequeno em
consequência**. Não são duas decisões — é uma. E o upkeep (seção 3) nasceu como
o instrumento econômico dessa mesma decisão; Pardo, na mesma entrevista: "The
concept of upkeep is: the bigger your army is the more it saps your gold income."

A Blizzard descreveu a mudança de geração em uma frase: "In Warcraft II and
StarCraft, the focus was on large groups of units, unit match ups, and sometimes
unit control. **In Warcraft III, the focus is on Heroes, spellcasting, and unit
control.** Unit match ups and numbers of units come in secondary"
([Battle.net](https://classic.battle.net/war3/basics/heroes.shtml)) — e foi
honesta sobre o preço: "Heroes are very weak at low levels and very powerful at
high levels."

**O que isso significa para nós, concretamente.** Nosso exército cabe na conta
de Pardo: a população começa em 12 e o jogador raramente passa de 20 unidades
(`REGRAS.popInicial`, Alojamento +10). Ou seja, **o campo de batalha já tem o
tamanho que o herói exige** — não precisamos encolher nada. Mas a consequência
também vale ao contrário: um herói forte muda o orçamento das ondas
(`orcamentoDaOnda`), e isso é exatamente o que `equilibrio.cjs` mede. Herói não
é mudança de conteúdo; é mudança de equilíbrio.

### O que o herói acrescenta a um jogo de defesa de base

Três coisas que nenhuma torre dá:

1. **Uma unidade que o jogador conhece pelo nome.** O apego é o que faz o
   jogador voltar; torre 14 não tem nome.
2. **Uma decisão a cada 40 segundos.** Herói é o único motivo para tirar os
   olhos da economia e olhar a linha de frente — é ele que vai tapar a brecha.
3. **Progressão dentro da partida.** Nosso jogo já tem pesquisa (lenta) e onda
   (rápida). Falta a curva do meio: algo que fica mais forte enquanto a partida
   corre, sem custar minério.

### O custo de desenho que ele traz

Aqui é honesto: **caro** na forma completa, **médio** na forma mínima.

- Caro: figura nova, 5 direções, andar + atirar + morrer, mais retrato, mais
  ícones de habilidade, mais o sistema de inventário e a tela dele.
- Médio, e é o que recomendo: o **Comandante** usa o corpo do Fuzileiro
  recolorido — que é literalmente o que o Warcraft II fazia, "based on a certain
  unit ..., but different stats and a unique portrait" —, ganha **três** níveis
  por partida (não dez), tem **duas** habilidades ativas com ícone, sem item e
  sem inventário, e volta sozinho na Central depois de um tempo, como no Kingdom
  Rush. O sistema de níveis é ~80 linhas em `sim-unidades.js` + `data.js`.
- E há a versão de custo **zero** em arte, boa para experimentar antes de
  desenhar qualquer coisa: nenhum herói novo, e sim a **regra de missão** do
  Warcraft II — um setor em que uma unidade marcada tem de sobreviver, ou ser
  escoltada até um ponto. É uma condição de vitória a mais, nada além disso.
  Se o jogador se importar com ela, o Comandante vale o desenho; se não se
  importar, a gente economizou a arte.

Duas regras que valem copiar do Warcraft III desde o primeiro dia, porque
consertam problema que ainda não aconteceu: **pesquisa normal não melhora o
herói** (as duas curvas não se somam) e o herói **não dá bônus enquanto está
morto** — "While your Hero is dead, you are not gaining experience and friendly
troops aren't provided with beneficial Auras"
([Battle.net](https://classic.battle.net/war3/basics/herocontrol.shtml)).

---

## 2. Unidades de apoio além do médico

> O capítulo [06 — melhorias e blindagem](06-melhorias-e-blindagem.md) trata da
> unidade de apoio pelo lado do equilíbrio (mosteiro do AoE II, apoio do
> StarCraft). Aqui a pergunta é outra: **quais papéis de apoio não existem no
> nosso jogo**, e quanto custa cada um.

| unidade | jogo de origem | o que faz | nosso custo |
|---|---|---|---|
| **Reparador** | SCV do StarCraft; aldeão do AoE II | conserta máquina e estrutura no campo | **já temos** |
| **Transporte** | Dropship / Shuttle / Overlord (SC) | carrega tropa por cima de obstáculo | médio |
| **Detector** | Science Vessel, Observer, Comsat (SC) | enxerga o que está invisível/enterrado | médio (exige inimigo invisível: caro) |
| **Aura / buff de área** | auras do Warcraft III | melhora quem está perto, sem clique | **barato** |
| **Construtor de campo** | SCV constrói em qualquer lugar (SC) | ergue defesa longe da base | **já temos** |
| **Guarnição** | AoE II: unidade entra no prédio | protege e reforça a torre | barato |

**Reparo: a regra de custo que já acertamos sem saber.** O StarCraft cobra o
reparo **na mesma moeda da construção** — "If the unit or building requires only
Minerals to build ..., you will be charged in Minerals to repair"; se exigiu gás,
o reparo também exige
([Battle.net — SCV, arquivado](https://web.archive.org/web/2008id_/http://classic.battle.net/scc/terran/uscv.shtml)).
O Age of Empires II cobra **metade do custo original**, debitado aos poucos
conforme a vida sobe, e o aldeão **para e fica ocioso** se o recurso acabar no
meio ([Age of Empires Wiki — Villager](https://ageofempires.fandom.com/wiki/Villager_(Age_of_Empires_II))).
É exatamente a nossa regra (custo de reparo proporcional ao custo de construção,
`CLAUDE.md`) — e confirma que o posto abandonado de custo zero reparar de graça
é coerente com o gênero, não um bug.

Dois detalhes deles que ainda não temos e são baratos: **mais operários reparando
= mais rápido** (mas construir não acelera com mais gente — regra explícita do
StarCraft) e **operário que fica sem recurso no meio do reparo para**, em vez de
consumir silenciosamente.

**Detector, com fonte.** A Blizzard define o problema em uma frase: "The Terrans
have two units capable of cloaking: the Ghost and the Wraith" e "Terrans can
detect cloaked units using Missile Turrets, Science Vessels, and using Scanner
Sweep, a special ability of the ComSat Station"
([Battle.net — Cloaking and Detection](https://classic.battle.net/scc/terran/cloak.shtml)).
O detalhe de desenho que interessa: o *Scanner Sweep* custa 50 de energia e
"reveals a 20x20 area of the map for 15 seconds, and provides detection in that
area"
([Battle.net — habilidades Terran, arquivado](https://web.archive.org/web/2008id_/http://classic.battle.net/scc/terran/tspecial.shtml)),
e é **o único detector que não pode ser detectado**
([Liquipedia — Detection](https://liquipedia.net/starcraft/Detection)). Do outro
lado, detector fixo enxerga a **7** de distância e unidade detectora enxerga até
o alcance da própria visão
([StarCraft Wiki — Detector](https://starcraft.fandom.com/wiki/Detector)).

Ou seja, o gênero resolveu "invisível" com **duas** respostas: uma torre estática
que enxerga sempre, e um poder gastável que enxerga um pedaço do mapa por 15
segundos. Nós já temos as duas peças de encaixe — o **Radar** (visão 17) e a
**energia tática** que paga bombardeio e escudo. Um "varredura" por 50 de energia
tática é o Scanner Sweep inteiro, sem desenhar nada.

Para nós: invisível só vale a pena quando existir um invasor invisível, e isso é
**arte nova** (caro). Mas a metade barata dá para fazer hoje — o **Radar** já
existe em `data.js` e já antecipa a onda; dar a ele o papel de detector é a
metade que não custa desenho.

**Aura é o item mais barato desta seção.** No Warcraft III uma aura é um efeito
passivo, permanente e sem custo de mana, num raio fixo: a *Devotion Aura* do
Paladino dá **+1,5 de armadura** no nível 1 e +3 no nível 2, em área 90, para
aliados e para o próprio herói
([Battle.net — Paladin, arquivado](https://web.archive.org/web/2008id_/http://classic.battle.net/war3/human/units/paladin.shtml)).
Duas regras deles que valem copiar inteiras, porque são as que impedem a bola de
neve: **auras iguais não se somam** e auras **não são magia** — pegam até quem é
imune a magia
([Battle.net — Spell Basics, arquivado](https://web.archive.org/web/2008id_/http://classic.battle.net/war3/basics/spellbasics.shtml)).
Em Canvas 2D, uma aura é um `for` de distância no `atualizar()` e **um círculo
desenhado no chão** — zero sprite novo, e muda o jeito de posicionar tropa.

**Guarnição (AoE II).** Unidade entra no prédio; o prédio atira mais. Uma torre
vazia do AoE II atira 5 flechas; guarnecida chega a **21**
([Age of Empires Wiki — Garrison](https://ageofempires.fandom.com/wiki/Garrison)).
Isso dá, de graça, três coisas que a gente não tem: esconder operário do ataque,
transformar torre em investimento de tropa, e um lugar seguro para o ferido.
Custo para nós: **barato** (contador na estrutura, sprite escondido, ícone de
"3/5" na torre).

**Onde cada raça pode construir — a regra que define o jogo inteiro.** As três
raças do StarCraft são três respostas para a mesma pergunta: o Terran constrói
**em qualquer lugar** (e o Command Center ainda levanta voo para mudar de
jazida, [StarCraft Wiki](https://starcraft.fandom.com/wiki/Command_center)); o
Zerg só constrói **sobre o creep**, e o que sai dele definha
([Creep](https://starcraft.fandom.com/wiki/Creep)); o Protoss só constrói
**dentro do campo do Pylon**, e prédio que perde a conexão desliga até
reconectar ([Psionic matrix](https://starcraft.fandom.com/wiki/Psionic_matrix)).

Vale reparar no que isso significa para nós: a nossa **energia elétrica** já é
uma matriz protoss disfarçada — capacidade distribuída a cada quadro, com
prioridade para as torres e pausa na produção quando falta. A diferença é que a
nossa é global e a deles é **geográfica**. Amarrar a energia à distância do
gerador seria uma mudança grande de equilíbrio (e cara de ensinar), então fica
registrada como possibilidade, não como recomendação.

**Transporte** só ganha sentido com água ou desnível intransponível. Temos
água (`TERRENO.AGUA` bloqueia) e mapas de ilha — Manhattan é um deles. O detalhe
de regra que o StarCraft acertou: a capacidade é de **8 espaços**, e cada unidade
ocupa conforme o tamanho — "any combination of these units can be loaded into
the Shuttle as long as they don't require more than 8 Slots in total"
([Battle.net — Shuttle, arquivado](https://web.archive.org/web/2008id_/http://classic.battle.net/scc/protoss/units/shuttle.shtml)):
oito leves, quatro médias ou **duas** pesadas. Isso transforma o transporte numa
decisão ("levo tropa leve ou uma peça pesada?") em vez de um botão. E o risco é
total, o que é metade da graça: "If a Shuttle is destroyed while transporting
units not only is the Shuttle lost, but **the units inside will also perish**"
(mesma página). Fica como **médio**: o custo é o sprite da nave nova.

---

## 3. Economia

**Fila de produção.** No StarCraft "each unit is capable of queuing several
commands at once", com um limite que o jogo avisa ao atingir
([Battle.net — Control](https://classic.battle.net/scc/gs/control.shtml)).
**Já temos**, com limite 6 e — melhor que o original — **reserva de recurso e
população no ato de enfileirar** (`sim-unidades.js:410-414`), o que evita a fila
fantasma.

**Ponto de encontro.** **Já temos**, por estrutura (`sim.js:277`, `ui.js:532`,
`sim-unidades.js:442`), inclusive com célula livre mais próxima. O que falta é o
degrau seguinte, e ele vem com a melhor justificativa de design que encontrei
para qualquer item deste capítulo. No StarCraft II o jogador pode marcar o ponto
de encontro **em cima do recurso**, e o trabalhador novo já sai minerando; o
motivo, dito pelo designer-líder Dustin Browder, é que **mover o trabalhador à
mão "does not create an interesting choice for the player, because it's the same
all the time"** ([StarCraft Wiki — Automine](https://starcraft.fandom.com/wiki/Automine)).
O Age of Empires II faz o mesmo pelo *Gather Point*
([Age of Empires Wiki](https://ageofempires.fandom.com/wiki/Gather_Point)).

É a régua para o jogo inteiro, e vale mais que o item: **toque que é sempre o
mesmo não é decisão, é imposto**. No celular, onde cada toque custa o dobro,
isso é lei. Nós já temos o botão "Distribuir" (`ui2.js`, todos à mineração) —
falta o operário **nascer** sabendo para onde ir. Custo: **barato**.

**Limite de população, e o que o jogador faz para subir.** Cada jogo escolheu um
freio diferente:

- StarCraft: cada Supply Depot/Pylon/Overlord dá mais teto — construir é o único
  jeito de crescer.
- Warcraft III: além da comida existe **upkeep**, um imposto sobre o ouro. Os
  números oficiais: "No Upkeep (0-50 Food: 100% income)", "Low Upkeep (51-80
  Food: 70% income)", "High Upkeep (81-100 Food: 40% income)" — e a intenção,
  escrita pela própria Blizzard: "High Upkeep is **MEANT** to be very punishing.
  Players should not be in it for long"
  ([Battle.net — Upkeep](https://classic.battle.net/war3/basics/upkeep.shtml)).

E há uma frase no documento oficial do upkeep que **fecha o argumento da seção
1** — é a Blizzard dizendo que o imposto existe por causa do herói:

> "Upkeep is also instituted to focus the game on smaller numbers of units.
> **The more units that are allowed in the game, the less powerful Heroes will
> be relative to your army. This is simple math.**"
> ([Battle.net — Upkeep, arquivado](https://web.archive.org/web/20080509084000/http://classic.battle.net/war3/basics/upkeep.shtml))

Herói forte, exército pequeno e imposto sobre exército grande são **a mesma
decisão vista de três ângulos**. Quem coloca o herói sem o freio econômico
recebe o herói irrelevante — ou o herói absurdo.

O problema que o upkeep resolve, na voz de quem o desenhou: sem ele "players
would build up to the cap in the game and just play there. Then if they lost
their units they'd have this big gold and lumber surplus that they'd just spend
to rebuild their army and max out again. It just didn't play very fun" (Rob
Pardo, [entrevista](https://flylib.com/books/en/2.489.1.80/1/)).

Nós temos o teto (Alojamento, +10, `data.js:30`) e **não** temos o imposto. O
upkeep é o remédio exato para o diagnóstico do nosso documento de projeto
("empilhar torre não sustenta a campanha"): ele pune o exército parado sem
proibi-lo. É **barato** — três linhas na coleta e um aviso no HUD — e é a
mudança de equilíbrio mais barata da lista. Exige rodar `equilibrio.cjs` antes e
depois.

**Segundo e terceiro recurso, e por que existem.** Warcraft III começa com "500
Gold and 150 Lumber" ([Battle.net — Resources](https://classic.battle.net/war3/basics/resources.shtml));
StarCraft tem mineral e gás; AoE II tem quatro. O papel do segundo recurso é
sempre o mesmo: **separar o que é volume do que é avanço**. A Blizzard escreve
isso sem rodeio — "Gas is by far the most coveted resource ... it is used for
upgrades and to build all higher-tier units and buildings"
([Blizzard — Resources](https://news.blizzard.com/en-us/article/4488900/game-guide-resources)).
No Age of Empires II cada recurso tranca um assunto: a **pedra** é a defesa
estática, "mainly used to build static defenses like towers and walls"
([Age of Empires Wiki — Stone](https://ageofempires.fandom.com/wiki/Stone)).
Mineral compra quantidade; gás compra tecnologia; pedra compra muro. Nós já fazemos isso: minério (`m`) é volume,
barril de petróleo (`c`) trava as pesquisas e as unidades pesadas, e a **energia
tática** (◉) é um terceiro recurso que só compra habilidade
(`REGRAS.custoBombardeio`). Ou seja: **já temos os três**, e o que falta não é um
quarto recurso — é **fazer o petróleo doer mais**.

**Comércio.** O Mercado do AoE II troca comida, madeira e pedra por ouro em
lotes de 100, com **taxa de 30%** (o que se vende por 70 se recompra por 130), e
cada transação move a cotação em ±2 — uma cotação **global, compartilhada por
todos os jogadores** ([Age of Empires Wiki — Market](https://ageofempires.fandom.com/wiki/Market_(Age_of_Empires_II))).
A carroça de comércio é a outra metade: o ouro que ela rende cresce quase com o
quadrado da distância entre os dois mercados, e é por isso que "trade routes are
a primary target for attacks"
([Trade Cart](https://ageofempires.fandom.com/wiki/Trade_Cart_(Age_of_Empires_II))).
O propósito é claro: equilibrar a economia de quem ficou preso num recurso só. Para nós é
**barato** de programar (um modal e uma curva de preço) mas **duvidoso de
design**: com dois recursos e sem adversário econômico, trocar minério por
petróleo pode desmontar a trava de tecnologia que o petróleo representa. Fica
como proposta, não como recomendação.

**Veterania — o que falta entre "unidade" e "herói".** Em C&C Generals a
unidade sobe de posto matando: três níveis (Veteran, Elite, Heroic), cada posto
dando **+20% de cadência e +10% de dano**, mais vida, e auto-cura nos dois
últimos ([C&C Wiki — Veterancy](https://cnc.fandom.com/wiki/Veterancy)); o guia
competitivo lista as marcas de experiência em 200/400/800/1200/1500 pontos
([GameReplays](https://www.gamereplays.org/cncgenerals/portals.php?show=page&name=experience-guide-ccg-4-11-2011)).
Custo para nós: **barato** (um campo `xp` na unidade, três divisas desenhadas
por cima do sprite — o `render2` já compõe HUD em cima da figura). Valor: dá ao
jogador um motivo para **preservar** tropa, que hoje não existe — hoje tropa é
descartável, que é exatamente a *fodder unit* que Pardo quis eliminar (seção 1).
E é o caminho mais barato para o efeito do herói sem desenhar herói nenhum: o
fuzileiro que sobreviveu a seis ondas vira *aquele* fuzileiro.

---

## 4. Apresentação

**Retrato falante.** No StarCraft o retrato é literalmente **vídeo**: os
arquivos `.SMK` (Smacker, da RAD Game Tools) são usados "for unit portraits, UI
animations ... and cinematics"
([staredit wiki — Modding Files Overview](https://wiki.staredit.net/wiki/Modding_Files_Overview)),
e a arte toda era 3D pré-renderizada: "pre-rendered sprites and backgrounds,
constructed using 3D Studio Max"
([Wikipedia — StarCraft](https://en.wikipedia.org/wiki/StarCraft_(video_game))).
O mesmo pipeline do Age of Empires Definitive Edition: "we're creating all our
units, buildings and trees as 3D models, but then render them out as 2D images"
([ageofempires.com](https://www.ageofempires.com/news/age-empires-definitive-edition-3d-2d-game/)).
E a regra que vale para o nosso retrato, dita pela Blizzard ao refazer a arte do
Remastered: "We kept the same silhouettes because we wanted you to immediately
recognize them" (Brian Sousa,
[Blizzard News](https://news.blizzard.com/en-us/article/20726732/behind-the-scenes-of-starcraft-remastered)).
Para nós, retrato **não precisa ser vídeo**: um recorte do sprite em tamanho
grande dentro da barra de seleção já faz 80% do trabalho (dizer *quem* está
selecionado) — e a silhueta que a gente já desenha é o que faz reconhecer.
Custo: **médio** — um recorte por unidade, reaproveitando arte existente.

**Falas de unidade.** É a assinatura do gênero, e os clássicos organizavam as
falas em **categorias fixas**, não em frases soltas. Warcraft II tem *Ready*,
*What*, *Yes*, *Job Complete* e *Pissed* — esta última é a fala de quem clicou
demais no mesmo bicho ("Hee hee hee! That tickles.", "My tummy feels funny.")
([Warcraft Wiki — Quotes of Warcraft II](https://warcraft.wiki.gg/wiki/Quotes_of_Warcraft_II)).
O "work work" do peão do Warcraft III está na categoria *Yes*, a de confirmação
de ordem ([Quotes of Warcraft III — Orc](https://warcraft.wiki.gg/wiki/Quotes_of_Warcraft_III/Orc_Horde)).
No StarCraft o desenho é o mesmo: "The Pissed quotes are the quotes when you
select a unit without giving it an action a lot of times"
([guia de falas](https://nikolaiwoo.wordpress.com/2007/06/29/starcraft-unit-quotes-guide/)).
Nós **decidimos não gravar**, e a decisão está escrita em `audio.js:15`:
"RÁDIO no lugar de voz. Gravar 'sim, senhor' exigiria arquivo; dois bipes curtos
com um chiado no fim dizem a mesma coisa". A decisão continua certa para o
tamanho do arquivo. Mas existe um caminho que não pesa byte nenhum: a
**síntese de voz do próprio navegador** (`speechSynthesis`), disponível "across
browsers since September 2018"
([MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)) — voz
em português, zero download. Custo: **barato**, com a ressalva de que a voz
depende do aparelho e pode não existir offline; tem de ser opcional e nunca
obrigatória para entender o jogo.

**Alerta de ataque com aviso na minimapa.** Temos o texto e a direção
(`sim-combate.js:583`) e o Radar antecipando a quantidade. Falta o **ponto
piscando na minimapa e o toque que leva a câmera até lá**.

Aqui existe uma fonte primária rara: a EA abriu o código do Command & Conquer, e
dentro dele está a tabela de falas da EVA comentada linha a linha —
`"CONSTRU1", // construction complete`, `"UNITREDY", // unit ready`,
`"BASEATK1", // our base is under attack`, `"NOCASH1", // insufficient funds`
([CnC_Remastered_Collection/TIBERIANDAWN/AUDIO.CPP](https://github.com/electronicarts/CnC_Remastered_Collection/blob/master/TIBERIANDAWN/AUDIO.CPP)).
Duas lições vêm do mesmo código:

1. **A voz já nasce com a coordenada.** A assinatura é
   `Speak(VoxType voice, HouseClass *house, COORDINATE coord)`, e quando recebe
   coordenada ela chama `On_Ping` — voz e ponto na minimapa são **um evento só**,
   não dois sistemas.
2. **Alerta bom é raro por construção.** Existe um `SpeakAttackDelay`: o aviso de
   "base sob ataque" tinha **2 minutos** de espera entre repetições no original,
   reduzido no Remastered
   ([TIBERIANDAWN/HOUSE.CPP](https://github.com/electronicarts/CnC_Remastered_Collection/blob/master/TIBERIANDAWN/HOUSE.CPP)).

O StarCraft II fechou o ciclo do lado do jogador: a barra de espaço "centers the
camera on the last warning notification, such as 'base is under attack'"
([Blizzard — Simplified Controls](https://news.blizzard.com/en-us/starcraft2/6640645/game-guide-simplified-controls)).
E a prova do contrário está no fórum oficial do AoE II: aviso de "under attack"
demais vira ruído
([fórum oficial](https://forums.ageofempires.com/t/under-attack-notifications-are-annoying-and-useless-please-fix-them/241084)).

Para nós, isso vira uma regra de implementação de três partes, e as três são
**baratas**: um aviso **carrega a coordenada**; a minimapa pisca naquele ponto
(ela já é desenhada em `render2.js:1204`); tocar no aviso leva a câmera. Mais um
tempo mínimo entre avisos do mesmo tipo — o `SpeakAttackDelay` deles.

**Névoa de guerra com memória.** O gênero usa **três** estados, não dois:
"completely unexplored areas are fully black", "explored but currently
unobserved areas are covered in a grey shroud", e nesse véu "only terrain is
visible, but changes in enemy units or bases are not"
([Wikipedia — Fog of war](https://en.wikipedia.org/wiki/Fog_of_war); o primeiro
uso é de 1977, no *Empire*). **Já temos os três**, e nos vetores certos:
`explorado` permanente e `visivel` agora; inimigo fora de `visivel` some, o
terreno explorado fica (`render.js:799`, `render2.js:1045-1048`).

**Contorno de unidade atrás do prédio.** Temos `spriteContornado`
(`render2.js:279`), que é contorno de **silhueta contra o fundo** — não é a
mesma coisa. O que falta é a **oclusão**: quando a unidade passa atrás de uma
estrutura, redesenhar a silhueta dela por cima, com transparência. No Age of
Empires isso é comportamento esperado, a ponto de a ausência virar relatório de
bug ("units only showed their health bar; not their unit outline",
[fórum oficial](https://forums.ageofempires.com/t/bug-units-completely-hidden-behind-castle-no-unit-outline/73253));
e a reclamação mais comum é sobre **opacidade** — silhueta apagada demais some
contra fundo claro, enquanto o Age of Mythology usa cor forte e fica legível
([fórum oficial](https://forums.ageofempires.com/t/units-silhouettes-when-behind-buildings-need-adjusting/220962)).
Ou seja: se for fazer, faz **opaco**. Em Canvas 2D é um segundo desenho com
`globalCompositeOperation` e o cache de contorno que já existe. Custo:
**barato**, e é o item de apresentação com melhor relação valor/custo desta
seção — hoje a unidade simplesmente some atrás do prédio.

---

## 5. Campanha e progressão

**Objetivos e gatilhos.** Nossos setores têm um campo `objetivo` de texto e uma
condição fixa por modo (`data.js` + `sim-combate.js:661`). O que os clássicos
tinham era um **sistema de gatilho**, e o do StarCraft está documentado até o
detalhe: "A trigger will run for the specified players when all of its
conditions are met. Its actions will be executed in order from top to bottom"
([staredit wiki — Triggers](https://wiki.staredit.net/wiki/Triggers)). O
vocabulário inteiro de uma campanha sai de meia dúzia de peças: a condição
*Bring* ("when a certain unit, or group of units is brought to a location"), a
condição *Deaths* ligada à ação *Defeat* — que é como se escreve "a missão falha
se X morrer" — e as ações *Set Mission Objectives* e *Display Text Message*
([condições](https://wiki.staredit.net/wiki/List_of_Trigger_Conditions),
[ações](https://wiki.staredit.net/wiki/List_of_Trigger_Actions)).

Para nós isso é **médio** (um pequeno interpretador de `{quando: ..., então:
...}` em `data.js`), e é o que destrava tudo o que vem abaixo. Vale copiar a
lista de condições deles quase inteira: chegar a um lugar, ter N de recurso, ter
N de um tipo, perder N de um tipo, passar T segundos. Com essas cinco já dá para
escrever tutorial, objetivo secundário e derrota por perda de unidade.

**Tutorial encaixado na primeira fase.** É o item nº 2 da nossa própria lista de
próximos passos no `CLAUDE.md`, e o gênero inteiro concorda: ensina-se jogando.
Com gatilho, o tutorial de Manaus é **dado**, não código: "quando tiver 2
operários minerando → peça um Alojamento". Custo: **barato depois do gatilho**;
caro antes dele (vira código solto).

**Cena entre fases.** A sala de briefing do StarCraft tem quatro retratos, e a
peça que monta a cena é uma ação só: *Transmission* — "a combo of the DISPLAY
SPEAKING PORTRAIT, PLAY WAV, and TEXT MESSAGE functions"
([staredit wiki — Mission Briefings](https://wiki.staredit.net/wiki/Mission_Briefings)).
Retrato que "fala" + texto + som, na mesma ordem, repetidos. O Warcraft III
intercala interlúdios não jogáveis entre capítulos
([Warcraft Wiki](https://warcraft.wiki.gg/wiki/Warcraft_III_campaigns)).

Nós temos o mapa-múndi (`mundo-ui.js`) e o texto de `resumo`/`risco`/`fato` do
setor, que já é meia cena. Falta o ritmo: uma tela de texto **antes** do setor e
uma **depois**, com o que mudou no mundo — e, se o retrato da seção 4 existir,
ele entra aqui de graça. Custo: **barato** (texto + CSS), e é o que dá à
campanha a sensação de campanha.

**Meta-progressão entre setores.** They Are Billions resolve assim: pontos de
pesquisa ganhos nas missões compram melhorias permanentes numa árvore fora da
partida ([They Are Billions Wiki — Technology Tree](https://they-are-billions.fandom.com/wiki/Technology_Tree)).
Nós já guardamos progresso e recorde por setor (`salvar.js:158-176`), então o
gancho existe. Custo: **médio**. Valor alto: é o que faz perder um setor não
apagar a noite do jogador.

---

## 6. Conforto moderno

> O capítulo [05 — seleção e controle](05-selecao-e-controle.md) destrincha este
> assunto sozinho: clique duplo, grupos, Shift, rally, ocioso, attack-move,
> formação, postura e a tradução de tudo isso para o toque. Aqui fica só a
> entrada de inventário, com o custo, para a tabela de prioridade.

O que o jogador de hoje espera e o clássico não tinha:

- **Fila com Shift em tudo** (andar, construir, atacar em sequência). A regra
  oficial do SC2: "To queue commands, hold down the Shift button and issue
  commands to the unit" — e o exemplo que a Blizzard escolhe é justamente o de
  trabalhador, "command a worker to build a structure, then gather minerals"
  ([Blizzard — Special Control](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control)).
  Não temos — `grep shift` em `src/` só acha `Array.shift`. Custo: **barato**; a
  tarefa da unidade já é uma estrutura, falta virar lista. **No celular não há
  Shift**: o gesto equivalente é tocar segurando, ou um botão "encadear" que
  fica ligado enquanto o jogador dá a sequência.
- **Seleção sem limite.** Os limites dos clássicos estão nas próprias páginas da
  Blizzard: Warcraft II **9** unidades
  ([battle.net](http://classic.battle.net/war2/gs/hksc.shtml)), StarCraft **12**
  ([battle.net](https://classic.battle.net/scc/gs/control.shtml)), Warcraft III
  "You can group select up to 12 units"
  ([battle.net](https://classic.battle.net/war3/basics/specialcommands.shtml)).
  Hoje isso é considerado defeito, não desafio. Nós **já** não temos limite
  (caixa de seleção em `ui.js:139`).
- **Ponto de encontro por tipo** (soldado vai para a linha, operário vai para a
  jazida). Custo: **barato**, e no celular vale mais que no PC — é um toque a
  menos por unidade. Cuidado documentado: no SC2, definir rally de um grupo de
  estruturas com clique-direito **reseta** o rally ao mandar atacar
  ([Blizzard](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control))
  — o mesmo botão fazendo duas coisas é armadilha.
- **Lançamento automático de habilidade (autocast).** No SC2 algumas
  habilidades "can be set to automatically cast", e as de **reparo e cura** vêm
  ligadas por padrão
  ([Blizzard — Simplified Controls](https://news.blizzard.com/en-us/starcraft2/6640645/game-guide-simplified-controls)).
  Nós já fazemos isso no reparo (`reparoAuto`) e no médico; o que falta é dizer
  na interface que está ligado.
- **Repetir a última construção.** Um toque para repetir o que acabou de
  construir, sem reabrir a gaveta. Custo: **barato**, e é o atalho que mais
  economiza toque num jogo de muro.
- **Toque duplo = selecionar todos do mesmo tipo na tela.** É do StarCraft:
  "Double-Clicking on a unit will select all units of the same type that are on
  the screen"
  ([Battle.net](https://classic.battle.net/scc/gs/control.shtml)). Num celular
  isso vale mais que grupo de controle, porque não exige memorizar número —
  e nós já temos grupos, que é a parte difícil. Custo: **barato**.
- **Desfazer.** Raríssimo no gênero, e por um motivo: tempo real não desfaz. O
  substituto honesto é o que já existe — **reembolso de 60% ao cancelar**
  (`REGRAS.reembolso`). Recomendo **não** fazer desfazer.
- **Salvar automático.** **Já temos**: a cada 30 s, ao pausar e ao sair
  (`main.js:316`), mais exportar/importar entre aparelhos (`salvar.js:188`).
- **Escala de interface para celular.** Não temos. Há zoom de câmera (pinça) e o
  canvas respeita `devicePixelRatio` (`render.js:88`), mas o HUD é de tamanho
  fixo e o `safe-area` só cobre a borda de baixo (`style.css:19`). Custo:
  **barato** (uma variável CSS `--ui` num seletor de três posições).
- **Pausa que aceita ordem.** They Are Billions fez disso a ideia central: o
  jogo "allows players to pause the action to take strategic and tactical
  decisions", construindo e dando ordem com o jogo parado
  ([página oficial na Steam](https://store.steampowered.com/app/644930/They_Are_Billions/)).
  Medido no nosso código: a pausa **não bloqueia a entrada** (`main.js:270` só
  para o relógio; `ui.js` não consulta `pausado`) — ou seja, **já temos**, sem
  nunca ter dito ao jogador. Falta escrever isso na tela.
- **Roda de comando no toque.** Ao portar Company of Heroes para celular, a
  Feral criou duas interfaces: o painel de sempre e uma **roda** — "select a
  squad then tap and hold on it to bring up the Command Wheel containing all of
  that squad's unique abilities" — "designed specifically for mobile screens"
  ([FAQ oficial da Feral](https://www.feralinteractive.com/en/faqs/companyofheroes/1.0.2/ios/)).
  Nós já usamos toque longo para a caixa de seleção (`ui.js:49`); a roda é a
  evolução natural. Custo: **médio** (é interface nova, mas sem arte).
- **Postura de unidade.** O AoE II introduziu quatro: agressivo, defensivo,
  segurar posição, não atacar
  ([Age of Empires Wiki — Unit stance](https://ageofempires.fandom.com/wiki/Unit_stance)).
  Nós temos ordens (mover sem perseguir, atacar em movimento, patrulhar, recuar)
  mas não postura persistente. Custo: **barato**, e resolve o problema real de
  tropa que persegue invasor para fora do muro.

---

## 7. Modos

- **Escaramuça contra a máquina.** É o modo que toda série do gênero tinha —
  "'skirmish' matches in which players can face AI enemies"
  ([Wikipedia — Command & Conquer](https://en.wikipedia.org/wiki/Command_%26_Conquer_(video_game))).
  Não temos: não há adversário que construa. Custo: **caro** — é uma IA de
  construção inteira, e o jogo não foi desenhado para isso (as ondas vêm de
  `orcamentoDaOnda`, não de uma base inimiga). Recomendo **não fazer**.
- **Ondas infinitas.** **Já temos** (`selModo` → `sobrevivencia`,
  `sim.js:49` com `total: Infinity`). Vale lembrar de onde vem o nosso próprio
  gênero: a defesa por ondas nasceu de mapas personalizados do Warcraft III —
  "The World Editor was used as a tool for creating many popular custom maps
  that served as inspiration for the standalone tower defense games, such as
  Plants vs. Zombies"
  ([Wikipedia — Warcraft III](https://en.wikipedia.org/wiki/Warcraft_III:_Reign_of_Chaos)).
- **Desafio com placar.** É o item mais barato de todos os modos, e o Kingdom
  Rush mostra como: o desafio é **o mesmo mapa com uma restrição** — no *Iron
  Challenge* "the player only has one life" e algumas torres ficam bloqueadas;
  no *Heroic Challenge* o herói não está disponível e há teto de melhoria
  ([Kingdom Rush Wiki — Iron](https://kingdomrushtd.fandom.com/wiki/Iron_Challenge),
  [Heroic](https://kingdomrushtd.fandom.com/wiki/Heroic_Challenge)). **Nenhuma
  arte nova.** O mesmo desenho aparece no *Art of War* do Age of Empires, com
  medalha por critério — "you can see what you need to do for a gold, silver or
  bronze medal. Like reach the goal fast or lose less than x troops"
  ([discussão na Steam](https://steamcommunity.com/app/813780/discussions/0/2260186248408550192/))
  — e o propósito declarado é ensinar: "Learn how to play RTS and learn the cool
  things about this game"
  ([PCGamesN](https://www.pcgamesn.com/age-of-empires-iii-definitive-edition/art-of-war)).
  Ou seja: **desafio é tutorial disfarçado de placar**. E nós já guardamos
  recorde por setor (`salvar.js:175`): falta a restrição e a estrela na tela do
  mapa-múndi.

---

## 8. Tabela final de prioridade

Ordenada por valor dividido por custo. "Já temos" fecha o assunto.

| item | valor para o jogador | custo | já temos? |
|---|---|---|---|
| Contorno da unidade atrás do prédio (oclusão) | alto — hoje a unidade **some** | barato | não (só contorno contra fundo) |
| Alerta de ataque clicável + piscar na minimapa | alto — chegar a tempo | barato | metade (texto e direção) |
| Fila de ordens com toque/Shift | alto — menos toque no celular | barato | não |
| Repetir a última construção | alto no celular | barato | não |
| Postura de unidade (agressivo/segurar/não atacar) | alto — tropa para de sair do muro | barato | não |
| Modo desafio com restrição + estrela | alto — rejogabilidade sem arte | barato | metade (recorde salvo) |
| Operário nasce indo para a jazida (rally em recurso) | alto — mata um toque repetido por unidade | barato | metade (botão "Distribuir") |
| Aura / buff de área | alto — posicionar passa a valer | barato | não |
| Varredura por energia tática (o Scanner Sweep) | médio-alto — revela e antecipa, sem arte | barato | não (Radar é a metade fixa) |
| Missão de escolta ("mantenha X vivo") — o herói sem arte nenhuma | alto — testa o apego antes de desenhar | barato | não |
| Upkeep (imposto sobre exército grande) | alto — conserta "empilhar" | barato | não |
| Veterania de tropa (3 divisas) | médio-alto — preservar tropa | barato | não |
| Guarnição em torre/estrutura | médio-alto — esconder operário | barato | não |
| Dizer na tela que a pausa aceita ordem | médio — desbloqueia o que existe | barato | **sim, mas escondido** |
| Escala de interface (3 tamanhos) | médio — celular pequeno | barato | não |
| Ponto de encontro por tipo | médio | barato | não (rally único) |
| Toque duplo seleciona todos do mesmo tipo | médio-alto no celular | barato | não |
| Postos abandonados dando experiência ao herói | médio — motivo para sair da base | barato | metade (ruínas existem) |
| Cena curta antes e depois do setor | médio — vira campanha | barato | metade (mapa-múndi) |
| Fala de unidade por síntese do navegador | médio — assinatura do gênero | barato | não (rádio, por decisão) |
| **Herói (Comandante), forma mínima** | **muito alto — apego e foco** | **médio** | não |
| Sistema de gatilho (condição → ação) | alto — destrava tutorial e missão | médio | não |
| Tutorial encaixado no setor 1 | alto para quem chega | médio (barato após gatilho) | não |
| Retrato grande na barra de seleção | médio | médio | não |
| Meta-progressão entre setores | alto — perder não apaga a noite | médio | gancho pronto |
| Roda de comando no toque longo | médio-alto no celular | médio | não (toque longo = caixa) |
| Transporte | médio (só em mapa de água) | médio | não |
| Detector + invasor invisível | médio — ameaça nova | caro (arte) | Radar pode virar metade |
| Herói completo (10 níveis, itens, altar) | alto, mas repetido | caro | não |
| Comércio / mercado | baixo — pode quebrar a trava do petróleo | barato, mas arriscado | não |
| Escaramuça contra IA construtora | baixo para este jogo | caro | não |
| Desfazer | baixo — tempo real não desfaz | médio | reembolso de 60% já cobre |

---

## O que isto muda no repositório

- **Barato e em `sim*.js` + `data.js`:** upkeep (`sim-unidades.js`, coleta),
  veterania (campo na unidade + `aplicarDano`), aura (laço de distância em
  `S.atualizar`), postura (campo na tarefa), guarnição (contador na estrutura).
  Todo número novo nasce em `data.js`, como manda o `CLAUDE.md`.
- **Barato e em `ui*.js` + `render2.js`:** alerta clicável na minimapa
  (`render2.js:1204`), oclusão com o cache de `spriteContornado`
  (`render2.js:279`), repetir última construção (`ui2.js`), escala de interface
  (variável CSS), aviso de que a pausa aceita ordem.
- **Médio e novo:** gatilhos (`data.js` + um avaliador em `sim.js`), herói
  (`data.js` + `sim-unidades.js` + dois ícones), roda de comando (`ui.js`).
- **Sempre:** `node tests/aceitacao.cjs` antes de commitar, e `equilibrio.cjs`
  antes e depois de qualquer mudança de número — upkeep e veterania mexem
  exatamente nos números que aquele teste mede.

## Fontes

Todas as afirmações estão linkadas no texto. As principais, por ordem de peso:

**Primárias (documentação do próprio estúdio, ou código).**
[Código-fonte do Command & Conquer aberto pela EA](https://github.com/electronicarts/CnC_Remastered_Collection/blob/master/TIBERIANDAWN/AUDIO.CPP)
— a tabela de falas da EVA, a voz que carrega coordenada e o intervalo mínimo
entre alertas;
[Battle.net — Warcraft III Heroes](https://classic.battle.net/war3/basics/heroes.shtml),
[Hero Items](https://classic.battle.net/war3/basics/heroitems.shtml),
[Hero Control](https://classic.battle.net/war3/basics/herocontrol.shtml),
[Creeping](https://classic.battle.net/war3/basics/creeping.shtml),
[Upkeep](https://classic.battle.net/war3/basics/upkeep.shtml),
[Resources](https://classic.battle.net/war3/basics/resources.shtml),
[Special Commands](https://classic.battle.net/war3/basics/specialcommands.shtml);
[Battle.net — StarCraft: Cloaking and Detection](https://classic.battle.net/scc/terran/cloak.shtml),
[Control](https://classic.battle.net/scc/gs/control.shtml);
[Battle.net arquivado — SCV](https://web.archive.org/web/2008id_/http://classic.battle.net/scc/terran/uscv.shtml),
[Shuttle](https://web.archive.org/web/2008id_/http://classic.battle.net/scc/protoss/units/shuttle.shtml),
[habilidades Terran](https://web.archive.org/web/2008id_/http://classic.battle.net/scc/terran/tspecial.shtml),
[Spell Basics](https://web.archive.org/web/2008id_/http://classic.battle.net/war3/basics/spellbasics.shtml),
[Paladin](https://web.archive.org/web/2008id_/http://classic.battle.net/war3/human/units/paladin.shtml),
[Upkeep (versão arquivada, com a razão do herói)](https://web.archive.org/web/20080509084000/http://classic.battle.net/war3/basics/upkeep.shtml);
[Blizzard — SC2 Special Control](https://news.blizzard.com/en-us/article/4552955/game-guide-special-control),
[Resources](https://news.blizzard.com/en-us/article/4488900/game-guide-resources),
[Simplified Controls](https://news.blizzard.com/en-us/starcraft2/6640645/game-guide-simplified-controls),
[Behind the Scenes of StarCraft Remastered](https://news.blizzard.com/en-us/article/20726732/behind-the-scenes-of-starcraft-remastered);
[Feral Interactive — Company of Heroes iOS FAQ](https://www.feralinteractive.com/en/faqs/companyofheroes/1.0.2/ios/);
[MDN — SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis).

**Entrevista de design.**
[Rob Pardo, em *Game Design Workshop*](https://flylib.com/books/en/2.489.1.80/1/)
— a unidade descartável, o herói dominante e o exército pequeno como uma
decisão só, e a razão do upkeep.

**Wikis e documentação de comunidade.**
[Warcraft Wiki — Hero (Warcraft III)](https://warcraft.wiki.gg/wiki/Hero_(Warcraft_III)),
[Warcraft II units](https://warcraft.wiki.gg/wiki/Warcraft_II_units),
[Creep](https://warcraft.wiki.gg/wiki/Creep),
[Quotes of Warcraft II](https://warcraft.wiki.gg/wiki/Quotes_of_Warcraft_II);
[staredit wiki — Triggers](https://wiki.staredit.net/wiki/Triggers),
[Mission Briefings](https://wiki.staredit.net/wiki/Mission_Briefings),
[Modding Files Overview](https://wiki.staredit.net/wiki/Modding_Files_Overview);
[StarCraft Wiki — Hero unit](https://starcraft.fandom.com/wiki/Hero_unit);
[Liquipedia — Detection](https://liquipedia.net/starcraft/Detection),
[Dropship](https://liquipedia.net/starcraft/Dropship);
[C&C Wiki — Veterancy](https://cnc.fandom.com/wiki/Veterancy);
[Age of Empires Wiki — Garrison](https://ageofempires.fandom.com/wiki/Garrison),
[Unit stance](https://ageofempires.fandom.com/wiki/Unit_stance),
[Market](https://ageofempires.fandom.com/wiki/Market_(Age_of_Empires_II));
[Kingdom Rush Wiki — Heroes](https://kingdomrushtd.fandom.com/wiki/Heroes/Kingdom_Rush),
[Iron Challenge](https://kingdomrushtd.fandom.com/wiki/Iron_Challenge);
[They Are Billions — Steam](https://store.steampowered.com/app/644930/They_Are_Billions/),
[Technology Tree](https://they-are-billions.fandom.com/wiki/Technology_Tree);
[Wikipedia — Fog of war](https://en.wikipedia.org/wiki/Fog_of_war),
[Warcraft III](https://en.wikipedia.org/wiki/Warcraft_III:_Reign_of_Chaos),
[StarCraft](https://en.wikipedia.org/wiki/StarCraft_(video_game)).

**O que ficou sem fonte, e por isso não está afirmado aqui:** o número exato de
cliques que dispara a fala de unidade irritada no StarCraft; o limite oficial de
seleção do StarCraft II pela Blizzard; documentação oficial da técnica de
oclusão de silhueta. As wikis do Fandom responderam HTTP 402 e a Liquipedia
HTTP 429 em boa parte das tentativas — o que veio delas veio pelo resultado de
busca, e está marcado pelo endereço.
