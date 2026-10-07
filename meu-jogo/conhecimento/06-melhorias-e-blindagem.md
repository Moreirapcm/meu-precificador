# Melhorias, blindagem e por que empilhar torre não ganha

Como o Age of Empires II e o StarCraft/Brood War resolveram a evolução de armas,
blindagens e melhorias. Todo número aqui vem de página de dado do jogo (wiki
oficial de cada série, fórmula de dano documentada), não de lembrança nem de
dedução. Quando a fonte se contradiz, os dois valores estão registrados.

---

## 1. Age of Empires II — a ferraria

A ferraria (*Blacksmith*) tem **cinco linhas de três degraus**: uma de ataque
corpo a corpo, uma de ataque à distância e três de blindagem (infantaria,
cavalaria, arqueiro). Um degrau por idade: Feudal, Castelo, Imperial. Nenhum
degrau é opcional dentro da linha — *Iron Casting* exige *Forging*, *Blast
Furnace* exige *Iron Casting*.

### 1.1 Ataque corpo a corpo — Forging → Iron Casting → Blast Furnace

| Pesquisa | Idade | Custo | Tempo | Efeito |
|---|---|---|---|---|
| Forging | Feudal | 150 comida | 50 s | Infantaria, cavalaria e linha Hulk **+1 de ataque** |
| Iron Casting | Castelo | 220 comida + 120 ouro | 75 s | **+1 de ataque** |
| Blast Furnace | Imperial | 275 comida + 225 ouro | 100 s | **+2 de ataque** |

Total da linha: **+4 de ataque corpo a corpo**, por 645 comida + 345 ouro e
225 s de pesquisa.
Fontes: [Forging](https://ageofempires.fandom.com/wiki/Forging),
[Iron Casting](https://ageofempires.fandom.com/wiki/Iron_Casting),
[Blast Furnace](https://ageofempires.fandom.com/wiki/Blast_Furnace).

O Elefante Balista **não** é beneficiado apesar de ser cavalaria, porque o dano
dele é perfurante e não corpo a corpo — o degrau melhora a *classe de ataque*,
não a unidade ([Forging](https://ageofempires.fandom.com/wiki/Forging)).

### 1.2 Ataque à distância e alcance — Fletching → Bodkin Arrow → Bracer

| Pesquisa | Idade | Custo | Tempo | Efeito |
|---|---|---|---|---|
| Fletching | Feudal | 100 comida + 50 ouro | 30 s | **+1 ataque, +1 alcance, +1 linha de visão** |
| Bodkin Arrow | Castelo | 200 comida + 100 ouro | 35 s | **+1 / +1 / +1** |
| Bracer | Imperial | 300 comida + 200 ouro | 40 s | **+1 / +1 / +1** |

Total: **+3 de ataque e +3 de alcance**. A descrição do jogo é explícita sobre
quem recebe: *"Archery Units, Skirmishers, ranged Warships, ranged
Fortifications +1 attack, +1 range; Town Centers +1 attack."* — ou seja, **a
torre é beneficiada junto com o arqueiro**, pela mesma pesquisa.
Fontes: [Fletching](https://ageofempires.fandom.com/wiki/Fletching),
[Bodkin Arrow](https://ageofempires.fandom.com/wiki/Bodkin_Arrow),
[Bracer](https://ageofempires.fandom.com/wiki/Bracer).

Guarde esse detalhe: ele é metade da resposta da seção 8. O AoE II **melhora a
torre de verdade** — e ainda assim empilhar torre não ganha partida.

### 1.3 As três linhas de blindagem

Cada linha protege uma família de unidade, e cada degrau dá **dois números ao
mesmo tempo**: blindagem normal (corpo a corpo) e blindagem perfurante.

| Linha | Degrau | Idade | Custo | Tempo | Efeito (normal/perfurante) |
|---|---|---|---|---|---|
| Infantaria | Scale Mail Armor | Feudal | 100 comida | 40 s | **+1 / +1** |
| | Chain Mail Armor | Castelo | 200 comida + 100 ouro | 55 s | **+1 / +1** |
| | Plate Mail Armor | Imperial | 300 comida + 150 ouro | 70 s | **+1 / +2** |
| Cavalaria | Scale Barding Armor | Feudal | 150 comida | 45 s | **+1 / +1** |
| | Chain Barding Armor | Castelo | 250 comida + 150 ouro | 60 s | **+1 / +1** |
| | Plate Barding Armor | Imperial | 350 comida + 200 ouro | 75 s | **+1 / +2** |
| Arqueiro | Padded Archer Armor | Feudal | 100 comida | 40 s | **+1 / +1** |
| | Leather Archer Armor | Castelo | 150 comida + 150 ouro | 55 s | **+1 / +1** |
| | Ring Archer Armor | Imperial | 250 comida + 250 ouro | 70 s | **+1 / +2** |

Total de qualquer linha completa: **+3 de blindagem normal e +4 de perfurante**.
Fontes: [Scale Mail](https://ageofempires.fandom.com/wiki/Scale_Mail_Armor),
[Chain Mail](https://ageofempires.fandom.com/wiki/Chain_Mail_Armor),
[Plate Mail](https://ageofempires.fandom.com/wiki/Plate_Mail_Armor),
[Scale Barding](https://ageofempires.fandom.com/wiki/Scale_Barding_Armor),
[Chain Barding](https://ageofempires.fandom.com/wiki/Chain_Barding_Armor),
[Plate Barding](https://ageofempires.fandom.com/wiki/Plate_Barding_Armor),
[Padded Archer](https://ageofempires.fandom.com/wiki/Padded_Archer_Armor),
[Leather Archer](https://ageofempires.fandom.com/wiki/Leather_Archer_Armor),
[Ring Archer](https://ageofempires.fandom.com/wiki/Ring_Archer_Armor).

**O padrão de desenho, em três frases.** Ataque e blindagem custam quase o mesmo
e destravam na mesma idade — quem só sobe ataque perde para quem subiu
blindagem, e vice-versa. O último degrau de blindagem dá **+2 perfurante** em vez
de +1: é um empurrão deliberado contra a linha de arqueiro no fim de jogo. E cada
família tem a *sua* linha — melhorar o arqueiro não melhora o cavaleiro, então o
jogador que mistura tropas paga duas vezes.

---

## 2. Por que duas blindagens, e a fórmula exata

### 2.1 A fórmula

O dano no AoE II é, em uma linha
([Pierce armor](https://ageofempires.fandom.com/wiki/Pierce_armor)):

```
Dano = max(1,
           ( max(0, Ataque_m − Blindagem_m)
           + max(0, Ataque_p − Blindagem_p)
           + k_resist × Σᵢ max(0, BônusAtaque_i − ResistBônus_i) )
           × k_elev × k_cracked )
```

- `m` = corpo a corpo (melee), `p` = perfurante (pierce).
- `k_elev` = **1,25** atacando de cima (morro ou penhasco), **0,75** atacando de
  baixo (só morro), 1 no plano. Para os Tártaros, 1,5 de cima.
- `k_cracked` = **1,2** se o alvo é um prédio em terreno rachado de deserto.
- `k_resist` = 0,6 para infantaria/cavalaria/arqueiro siciliano, 0,75 para
  elefante bengali e Castelo persa com *Citadels*, 1 no resto.

A versão em passos, da página de classes de armadura
([Armor class (AoE II)](https://ageofempires.fandom.com/wiki/Armor_class_(Age_of_Empires_II))),
detalha o resto: multiplicadores de ataque entram **antes** (passo 1, e o ataque
é guardado como inteiro, arredondando); a subtração por classe é
`Damage1ᵢ = max(min(0, Ataqueᵢ), Ataqueᵢ − Blindagemᵢ)`; a soma das classes vem
antes dos multiplicadores de dano; e o passo final é

> **Step 6 - Result:** `Dano = max(1, Damage4)` — *"This is to ensure that even
> if Damage4 < 1, the unit must receive a minimum of 1 damage since it is being
> attacked. Note that the minimum damage rule is applied after all the attack
> multipliers."*

Detalhe fino da mesma página: o dano **pode ser fracionário**, a interface só
mostra a parte inteira dos pontos de vida, e a unidade morre quando o que resta
cai **abaixo de 1** — não quando chega a zero.

### 2.2 Por que duas, e não uma

Porque com **uma** blindagem só existe "unidade dura" e "unidade mole", e o
contra-ataque vira aritmética de números maiores. Com duas, a mesma unidade pode
ser dura contra uma coisa e mole contra outra, e isso é o que faz o jogo de
pedra-papel-tesoura existir sem nenhuma regra especial.

O caso limpo é o *Skirmisher*: **0 de blindagem normal, 3 de perfurante**, 30 de
vida ([Skirmisher](https://ageofempires.fandom.com/wiki/Skirmisher_(Age_of_Empires_II))).
Ele aguenta flecha e derrete no soco — sem precisar de nenhuma regra
"skirmisher resiste a flecha". A regra é o número.

**Os bônus por classe passam por fora das duas blindagens.** É o que a wiki diz
textualmente: *"Bonus attack cannot be reduced by melee or pierce value."* O
bônus é subtraído pelo valor da unidade *naquela classe*, que quase sempre é 0.
Por isso investir blindagem não protege contra o contra-ataque desenhado: o
Halberdier passa reto.

### 2.3 Três exemplos resolvidos (verbatim da wiki)

| Caso | Conta | Dano |
|---|---|---|
| Karambit Warrior → Eagle Warrior | `(7−0)[melee] + (2−0)[Eagle]` | **9** |
| Plumed Archer → Spearman | `(5−0)[pierce] + (2−0)[Spearman] + (1−0)[Infantry]` | **8** |
| Plumed Archer → Man-at-Arms | `(5−1)[pierce] + (1−0)[Infantry]` | **5** |
| Halberdier → Cataphract | `(6−2)[melee] + (32−12)[Cavalry]` | **24** |
| Halberdier boêmio → Cataphract | `(6−2) + (round(32×1,25)−12) = (6−2)+(40−12)` | **32** |

Repare no último par: **+25% de ataque virou +33% de dano**, porque o
multiplicador entra antes da subtração da blindagem. É o mesmo motivo pelo qual
+25% de dano (bônus de morro) rende menos que +25% de ataque. Fonte:
[Armor class (AoE II)](https://ageofempires.fandom.com/wiki/Armor_class_(Age_of_Empires_II)).

O mínimo de 1 não é decoração: o Mangonel dispara o projétil principal **mais 5
projéteis adicionais, cada um causando exatamente o dano mínimo**
([Mangonel](https://ageofempires.fandom.com/wiki/Mangonel_(Age_of_Empires_II))).
O piso virou mecânica.

---

## 3. Age of Empires II — universidade: prédio, muro e torre

| Pesquisa | Idade | Custo | Tempo | Efeito em número |
|---|---|---|---|---|
| Masonry | Castelo | 150 comida + 175 madeira | 50 s | Prédios **+10% de vida, +1 blindagem normal, +1 perfurante, +3 blindagem antiprédio** (não vale para muros, portões e fazendas) |
| Architecture | Imperial | 300 comida + 200 madeira | 70 s | O mesmo pacote de novo: **+10% vida, +1/+1, +3 antiprédio** |
| Ballistics | Castelo | 300 madeira + 175 ouro | 60 s | Projétil passa a mirar **onde o alvo vai estar**, não onde está |
| Chemistry | Imperial | 300 comida + 200 ouro | 100 s | Arqueiros, navios e **fortificações à distância +1 de ataque**; libera pólvora |
| Heated Shot | Castelo | 350 comida + 100 ouro | 30 s | Torres **+125% de ataque contra navios**; Castelos, Docas, Portos **+4 contra navios** |
| Murder Holes | Castelo | 200 comida + 100 pedra | 35 s (60 s antes da atualização 81058) | **Elimina o alcance mínimo** de todas as torres, Castelos e Portos |
| Arrowslits | Imperial | 250 comida + 250 madeira | 25 s | Watch Tower **+1**, Guard Tower **+2**, Keep e Donjon **+3** de ataque |
| Fortified Wall | Castelo | 200 comida + 100 madeira | 10 s | Muro de pedra: **+1.200 de vida (+67%), +4 normal, +2 perfurante, +8 antiprédio** |
| Guard Tower | Castelo | 100 comida + 250 madeira | 30 s | Sobe a Watch Tower a Guard Tower |
| Keep | Imperial | 500 comida + 350 madeira | 75 s | Sobe a Guard Tower a Keep |
| Bombard Tower | Imperial | 800 comida + 400 madeira | 60 s | Libera a Torre Bombarda (exige Chemistry) |
| Treadmill Crane | Castelo | 200 madeira + 50 pedra | 20 s | Aldeões constroem **20% mais rápido** (−16,67% no tempo de obra) |
| Siege Engineers | Imperial | 500 comida + 600 madeira | 45 s | Cerco à distância **+1 de alcance**; todo cerco **+20% de bônus contra prédios**; suicidas **+40%** |

Fontes: [Masonry](https://ageofempires.fandom.com/wiki/Masonry),
[Architecture](https://ageofempires.fandom.com/wiki/Architecture_(Age_of_Empires_II)),
[Ballistics](https://ageofempires.fandom.com/wiki/Ballistics_(Age_of_Empires_II)),
[Chemistry](https://ageofempires.fandom.com/wiki/Chemistry_(Age_of_Empires_II)),
[Heated Shot](https://ageofempires.fandom.com/wiki/Heated_Shot_(Age_of_Empires_II)),
[Murder Holes](https://ageofempires.fandom.com/wiki/Murder_Holes),
[Arrowslits](https://ageofempires.fandom.com/wiki/Arrowslits_(Age_of_Empires_II)),
[Fortified Wall](https://ageofempires.fandom.com/wiki/Fortified_Wall_(Age_of_Empires_II)),
[Guard Tower](https://ageofempires.fandom.com/wiki/Guard_Tower_(Age_of_Empires_II)),
[Keep](https://ageofempires.fandom.com/wiki/Keep_(Age_of_Empires_II)),
[Bombard Tower (technology)](https://ageofempires.fandom.com/wiki/Bombard_Tower_(technology)),
[Treadmill Crane](https://ageofempires.fandom.com/wiki/Treadmill_Crane),
[Siege Engineers](https://ageofempires.fandom.com/wiki/Siege_Engineers).

### 3.1 O degrau de torre, em números

O que muda ao subir a torre não é um percentual — é a ficha inteira:

| | Watch Tower | Guard Tower | Keep |
|---|---|---|---|
| Idade | Feudal | Castelo | Imperial |
| Custo de construção | 35 madeira + 125 pedra | 35 madeira + 125 pedra | 35 madeira + 125 pedra |
| Vida | 850 (Feudal) / 1.020 (Castelo) | **1.500** | **2.250** |
| Ataque (perfurante) | 5 | **7** | **8** |
| Blindagem normal / perfurante | 1 / 7 | **2 / 8** | **3 / 9** |
| Alcance | 8 | 8 | 8 |
| Cadência | 2,0 s | 2,0 s | 2,0 s |
| Guarnição | 5 | 5 | 5 |
| Alcance mínimo | 1 | 1 | 1 |

Fontes: [Watch Tower](https://ageofempires.fandom.com/wiki/Watch_Tower_(Age_of_Empires_II)),
[Guard Tower](https://ageofempires.fandom.com/wiki/Guard_Tower_(Age_of_Empires_II)),
[Keep](https://ageofempires.fandom.com/wiki/Keep_(Age_of_Empires_II)).

Duas coisas para copiar: **o custo de construção não muda** — quem já tem torres
recebe todas melhoradas de uma vez, e quem constrói depois paga o mesmo; e **o
alcance nunca sobe pelo degrau** (sobe pela ferraria, +3). O degrau engorda;
a pesquisa estica.

Aldeões e arqueiros **guarnicionados aumentam o número de flechas** que a torre
dispara, até 5 unidades, e recuperam vida dentro dela pela metade da taxa do
Castelo ([Watch Tower](https://ageofempires.fandom.com/wiki/Watch_Tower_(Age_of_Empires_II))).

---

## 4. Age of Empires II — mosteiro: a unidade de apoio

O monge não tem linha de ataque nem de blindagem. **Toda a árvore dele mexe em
tempo, alcance e resistência da conversão** — o recurso escasso dele é a fé, não
o dano.

| Pesquisa | Idade | Custo | Tempo | Efeito |
|---|---|---|---|---|
| Fervor | Castelo | 140 ouro | 50 s | Monges **+15% de velocidade** |
| Sanctity | Castelo | 175 ouro (120 antes da atualização 87863) | 60 s | Monges **+15 de vida** |
| Redemption | Castelo | 475 ouro | 50 s | Monge passa a **converter prédios e máquinas de cerco** |
| Atonement | Castelo | 325 ouro | 40 s | Monge passa a **converter monges inimigos** |
| Herbal Medicine | Castelo | 200 ouro (350 antes de *Dawn of the Dukes*) | 35 s | Unidade guarnicionada cura **6× mais rápido** (4× antes da Definitive Edition) |
| Heresy | Castelo | 1.000 ouro | 60 s | Unidade convertida pelo inimigo **morre** em vez de trocar de dono |
| Devotion (DE, atualização 99311) | Castelo | 100 comida + 200 ouro | 40 s | Conversão fica **1 s mais lenta** (mín. e máx.) — "15% mais difícil" |
| Faith | Imperial | 550 comida + 750 ouro (750 + 1.000 antes da 99311) | 60 s | Conversão fica **4 s mais lenta** — "50% mais difícil" |
| Block Printing | Imperial | 200 ouro | 55 s | **+3 de alcance de conversão e de linha de visão** |
| Illumination | Imperial | 120 ouro | 65 s | Fé volta **87,5% mais rápido**: nova conversão em **33 s em vez de 62 s** (a árvore de tecnologia diz 50%, e está errada) |
| Theocracy | Imperial | 200 ouro (400 comida + 800 ouro antes do patch 1.0b) | 75 s | Num grupo que converte, **só um monge precisa descansar** |

Fontes: [Fervor](https://ageofempires.fandom.com/wiki/Fervor_(Age_of_Empires_II)),
[Sanctity](https://ageofempires.fandom.com/wiki/Sanctity_(Age_of_Empires_II)),
[Redemption](https://ageofempires.fandom.com/wiki/Redemption),
[Atonement](https://ageofempires.fandom.com/wiki/Atonement),
[Herbal Medicine](https://ageofempires.fandom.com/wiki/Herbal_Medicine_(Age_of_Empires_II)),
[Heresy](https://ageofempires.fandom.com/wiki/Heresy),
[Devotion](https://ageofempires.fandom.com/wiki/Devotion),
[Faith](https://ageofempires.fandom.com/wiki/Faith),
[Block Printing](https://ageofempires.fandom.com/wiki/Block_Printing),
[Illumination](https://ageofempires.fandom.com/wiki/Illumination),
[Theocracy](https://ageofempires.fandom.com/wiki/Theocracy_(Age_of_Empires_II)).

**O padrão:** Illumination e Theocracy não aumentam nenhum número da ficha — elas
**encurtam o tempo morto** entre dois usos. Block Printing não aumenta potência,
aumenta **distância segura** (e a wiki diz por quê: contra Onager, o monge morre
em um tiro). Faith e Heresy são as duas únicas **defensivas**, e custam mais que
todas as ofensivas juntas.

---

## 5. StarCraft / Brood War — três níveis por raça

O StarCraft é o extremo oposto do AoE II na quantidade de linhas: **duas ou três
por família de unidade**, cada uma com **exatamente três níveis**, e o preço sobe
a cada nível. Não há idade: o que destrava o nível 2 e 3 é um **prédio**.

### 5.1 Terran

| Melhoria | Prédio | Nível 1 | Nível 2 | Nível 3 | Efeito por nível |
|---|---|---|---|---|---|
| Infantry Weapons | Engineering Bay | 100/100 | 175/175 | 250/250 | **+1** por ataque (marine, ghost); **+2** (firebat) |
| Infantry Armor | Engineering Bay | 100/100 | 175/175 | 250/250 | **+1** de blindagem (SCV, marine, firebat, ghost, medic) |
| Vehicle Weapons | Armory | 100/100 | 175/175 | 250/250 | **+1** goliath solo; **+4** goliath ar (+2 por míssil); **+2** vulture; **+3** tanque modo tanque; **+5** modo cerco |
| Vehicle Plating | Armory | 100/100 | 175/175 | 250/250 | **+1** de blindagem (goliath, tanque, vulture) |
| Ship Weapons | Armory | 100/100 | 150/150 | 200/200 | **+1** wraith solo e valkyrie; **+2** wraith ar; **+3** battlecruiser |
| Ship Plating | Armory | 150/150 | 225/225 | 300/300 | **+1** de blindagem (wraith, dropship, battlecruiser, science vessel, valkyrie) |

Níveis 2 e 3 exigem **Science Facility**.

### 5.2 Zerg

| Melhoria | Prédio | Nível 1 | Nível 2 | Nível 3 | Efeito por nível |
|---|---|---|---|---|---|
| Melee Attacks | Evolution Chamber | 100/100 | 150/150 | 200/200 | **+1** zergling e broodling; **+3** ultralisk |
| Missile Attacks | Evolution Chamber | 100/100 | 150/150 | 200/200 | **+1** hydralisk; **+2** lurker |
| Carapace | Evolution Chamber | 150/150 | 225/225 | 300/300 | **+1** de blindagem (terrestres) |
| Flyer Attacks | Spire | 100/100 | 175/175 | 250/250 | **+1** mutalisk; **+2** guardian e devourer |
| Flyer Carapace | Spire | 150/150 | 225/225 | 300/300 | **+1** de blindagem (voadores, inclusive overlord) |

Nível 2 exige **Lair**, nível 3 exige **Hive**.

### 5.3 Protoss

| Melhoria | Prédio | Nível 1 | Nível 2 | Nível 3 | Efeito por nível |
|---|---|---|---|---|---|
| Ground Weapons | Forge | 100/100 | 150/150 | 200/200 | **+2** zealot e dragoon; **+3** dark templar e archon |
| Ground Armor | Forge | 100/100 | 175/175 | 250/250 | **+1** de blindagem |
| Plasma Shields | Forge | 200/200 | 300/300 | 400/400 | **+1** de blindagem de escudo para **todas as unidades e todos os prédios** |
| Air Weapons | Cybernetics Core | 100/100 | 175/175 | 250/250 | **+1** de ataque |
| Air Armor | Cybernetics Core | 150/150 | 225/225 | 300/300 | **+1** de blindagem |

Níveis 2 e 3 exigem **Templar Archives** (terrestre), **Fleet Beacon** (aéreo) e
**Cybernetics Core** (escudos).

Os custos estão em **minerais/gás**. Tempo de pesquisa: **267 / 300 / 333** nos
três níveis de toda melhoria de arma ou blindagem, e **166** nas melhorias de
nível único (a Liquipedia registra ≈266 s para o nível 1 de Infantry Weapons,
batendo com o valor da outra fonte).
Fontes: templates de dado da StarCraft Wiki —
[Infantry Weapons](https://starcraft.fandom.com/wiki/Infantry_Weapons),
[Template:SC1TerrUpgrdInfArm](https://starcraft.fandom.com/wiki/Template:SC1TerrUpgrdInfArm),
[Template:SC1TerrUpgrdVehWeap](https://starcraft.fandom.com/wiki/Template:SC1TerrUpgrdVehWeap),
[Template:SC1TerrUpgrdVehPlate](https://starcraft.fandom.com/wiki/Template:SC1TerrUpgrdVehPlate),
[Template:SC1TerrShipWeap](https://starcraft.fandom.com/wiki/Template:SC1TerrShipWeap),
[Template:SC1TerrShipArm](https://starcraft.fandom.com/wiki/Template:SC1TerrShipArm),
[Template:SC1ZergMeleeAttacks](https://starcraft.fandom.com/wiki/Template:SC1ZergMeleeAttacks),
[Template:SC1ZergMissileAttacks](https://starcraft.fandom.com/wiki/Template:SC1ZergMissileAttacks),
[Template:SC1ZergCarapace](https://starcraft.fandom.com/wiki/Template:SC1ZergCarapace),
[Template:SC1ZergFlyerAttacks](https://starcraft.fandom.com/wiki/Template:SC1ZergFlyerAttacks),
[Template:SC1ZergFlyerCarapace](https://starcraft.fandom.com/wiki/Template:SC1ZergFlyerCarapace),
[Template:SC1ProtUpgrdGrndWeap](https://starcraft.fandom.com/wiki/Template:SC1ProtUpgrdGrndWeap),
[Template:SC1ProtUpgrdGrndArm](https://starcraft.fandom.com/wiki/Template:SC1ProtUpgrdGrndArm),
[Template:SC1ProtUpgrdShield](https://starcraft.fandom.com/wiki/Template:SC1ProtUpgrdShield),
[Template:SC1ProtUpgrAirWeap](https://starcraft.fandom.com/wiki/Template:SC1ProtUpgrAirWeap),
[Template:SC1ProtUpgrdAirArm](https://starcraft.fandom.com/wiki/Template:SC1ProtUpgrdAirArm),
[Engineering Bay — Liquipedia](https://liquipedia.net/starcraft/Engineering_Bay).

### 5.4 Duas assimetrias deliberadas

1. **A blindagem custa mais que a arma** em quase toda linha — Carapace começa em
   150/150 contra 100/100 do ataque, e o nível 3 vai a 300/300 contra 200/200.
   O jogo cobra caro para tornar o combate lento.
2. **A melhoria de arma vale mais para quem bate forte e devagar.** +1 de nível
   no ultralisk vale **+3**, no zergling vale **+1**; no tanque em modo cerco
   vale **+5**, no vulture **+2**. O número escala com o dano base, não é fixo —
   é o que impede a melhoria de virar bônus percentual disfarçado.

Fora das linhas de três níveis há as melhorias de **uma peça só**, que mexem em
alcance e não em dano — e são das mais decisivas da metade do jogo:
**U-238 Shells** (150/150, tempo 100) dá **+1 de alcance ao marine (de 4 para 5)**;
**Charon Boosters** (100/100, tempo 133) dá **+3 de alcance antiaéreo ao goliath
(de 5 para 8)**
([U-238](https://starcraft.fandom.com/wiki/Template:SC1TerrU238),
[Charon Boosters](https://starcraft.fandom.com/wiki/Template:SC1CharonBoosters)).

---

## 6. StarCraft — tipo de dano e tamanho, em vez de duas blindagens

### 6.1 A tabela

O Brood War não tem "blindagem normal e perfurante". Tem **um** número de
blindagem e uma **matriz 3×3**: três tipos de dano contra três tamanhos de
unidade.

| Alvo | Concussivo | Normal | Explosivo |
|---|---|---|---|
| Unidade **pequena** | **100%** | 100% | **50%** |
| Unidade **média** | **50%** | 100% | **75%** |
| Unidade **grande** | **25%** | 100% | **100%** |
| **Prédios** | **25%** | 100% | **100%** |
| **Escudos protoss** | 100% | 100% | 100% |

Fonte: [Damage types](https://starcraft.fandom.com/wiki/Damage_types).

Quem dá concussivo: vulture, ghost, firebat. Quem dá explosivo: todo míssil
(missile turret, antiaéreo do goliath, do scout, do wraith, valkyrie), quase todo
canhão pesado (tanque, dragoon), hydralisk, sunken colony, infested terran,
devourer. Normal: todo corpo a corpo, lasers, a maioria das balas, **e o photon
cannon, o archon, o spore colony, o guardian e o scourge** — que "parecem"
explosivos e não são.

Tamanho tem pouco a ver com o desenho do sprite: *"Unit size is more closely
linked to armor quality."* Quase toda unidade aérea é grande — **toda** aérea
terran é, inclusive o wraith — e por isso quase todo antiaéreo forte é explosivo.
A exceção famosa é o mutalisk, que é **pequeno** e por isso leva metade do dano
de todo míssil que existe.

### 6.2 A ordem das operações e o piso

> Subtrai a blindagem do dano → aplica o multiplicador de tipo/tamanho → aplica o
> resultado. *"If the remaining damage is one-half or less, it will do a
> half-point of damage."*

Ou seja: **a blindagem entra antes do multiplicador**, e o piso é **0,5 de dano**
([Damage — starcraftai.com](https://www.starcraftai.com/wiki/Damage),
[Damage Order of Operations — Liquipedia](https://liquipedia.net/starcraft/Damage_Order_of_Operations)).
⚠️ A StarCraft Wiki da Fandom afirma na página
[Armor](https://starcraft.fandom.com/wiki/Armor) que *"all attacks will do a
minimum of 1 damage"* — as duas fontes se contradizem no piso (0,5 × 1) e
concordam no resto. Ficam as duas registradas.

Da mesma página de blindagem, dois fatos que valem mais que a fórmula:
**ataques de feitiço ignoram blindagem** por completo; e **cada ponto de
blindagem tira 1 de dano por golpe**, o que pune desproporcionalmente quem bate
muitas vezes fraco. O exemplo dado é literal: *"zerglings die to zealots in 2
hits instead of 3 if the zealots have 1 weapon upgrade and the zerglings have no
carapace upgrade"* — um degrau de melhoria mudou o número de golpes em 33%.

### 6.3 Por que essa escolha, e não a do AoE II

Os dois sistemas resolvem o mesmo problema — fazer uma unidade ser forte contra
uma coisa e fraca contra outra — com a conta em lugares diferentes:

| | Age of Empires II | StarCraft / Brood War |
|---|---|---|
| Onde mora a assimetria | no **alvo** (duas blindagens + classes de armadura) | no **atacante** (tipo de dano) cruzado com o **tamanho** do alvo |
| Operação | **subtração** por canal, somada | **subtração** única, depois **multiplicação** |
| Quantos números a unidade carrega | 2 blindagens + 1 valor por classe de armadura (dezenas de classes) | 1 blindagem + 1 tamanho |
| O que o jogador vê | números na ficha (só a partir da Definitive Edition dá para ver as classes) | 3 palavras: pequeno/médio/grande |
| Melhorias | 5 linhas de 3, separadas por família | 2–3 linhas de 3, separadas por família |

A vantagem do StarCraft é ser **legível**: o jogador decora três palavras e
prevê metade das trocas do jogo. A vantagem do AoE II é a **granularidade**: dá
para desenhar um contra-ataque exato (o Halberdier com +32 contra cavalaria) sem
mexer no resto do jogo. O preço, admitido pela própria wiki, é que o sistema é
**semi-oculto** — antes da Definitive Edition não havia como ver as classes de
armadura no jogo, só no editor.

---

## 7. Unidade de apoio no StarCraft

O medic terran é o análogo direto do nosso Médico de campo. A ficha:
**60 de vida, 200 de energia (começa com 50), 1 de blindagem, custo 50
minerais + 25 gás, 30 s**; a cura gasta **1 de energia a cada 2 pontos de vida**,
alcance 2, e vale para qualquer unidade **biológica** — inclusive protoss e zerg
aliados ([Medic](https://starcraft.fandom.com/wiki/Medic_(StarCraft))).

| Melhoria | Prédio | Custo | Tempo | Efeito |
|---|---|---|---|---|
| Caduceus Reactor | Academy | 150/150 | 166 | **+50 de energia máxima**; energia inicial sobe de 50 para 62,5 |
| Restoration | Academy | 100/100 | 80 | Habilidade nova (custa 50 de energia, alcance 6): remove parasita, ensnare, plague, ácido de devourer, maelstrom, lockdown, optical flare e irradiate — **uma conjuração tira qualquer combinação deles** |
| Optical Flare | Academy | 100/100 | 80 | Habilidade nova (75 de energia, alcance 9): reduz a visão do alvo a **1** e **remove a capacidade de detecção** |

**Todo feiticeiro do jogo segue a mesma forma.** A melhoria de energia é sempre
**+50 de máximo e início em ~62**, e custa quase sempre **150/150, tempo 166**:

| Melhoria | Unidade | Prédio | Custo |
|---|---|---|---|
| Caduceus Reactor | medic | Academy | 150/150 |
| Khaydarin Amulet | high templar | Templar Archives | 150/150 |
| Argus Talisman | dark archon | Templar Archives | 150/150 |
| Argus Jewel | corsair | Fleet Beacon | **100/100** |
| Gamete Meiosis | queen | Queen's Nest | 150/150 |
| Metasynaptic Node | defiler | Defiler Mound | 150/150 |

Fontes: [Caduceus reactor](https://starcraft.fandom.com/wiki/Caduceus_reactor),
[Template:SC1TerrRestoration](https://starcraft.fandom.com/wiki/Template:SC1TerrRestoration),
[Template:SC1TerrOpticFlare](https://starcraft.fandom.com/wiki/Template:SC1TerrOpticFlare),
[Template:SC1KhaydarinAmulet](https://starcraft.fandom.com/wiki/Template:SC1KhaydarinAmulet),
[Template:SC1ArgusTalisman](https://starcraft.fandom.com/wiki/Template:SC1ArgusTalisman),
[Template:SC1ArgusJewel](https://starcraft.fandom.com/wiki/Template:SC1ArgusJewel),
[Template:SC1GameteMeiosis](https://starcraft.fandom.com/wiki/Template:SC1GameteMeiosis),
[Template:SC1MetasynapticNode](https://starcraft.fandom.com/wiki/Template:SC1MetasynapticNode).

**A lição de desenho é a mesma do monge do AoE II:** a unidade de apoio não
melhora em potência, melhora em **quantas vezes ela pode agir**. No AoE II é
Illumination cortando o descanso de 62 s para 33 s; no StarCraft é +50 de energia
— um uso extra de Restoration, ou dois de cura. Ninguém dá "+2 de cura por
segundo" a essas unidades.

---

## 8. Torre e muralha: o que impedia empilhar torre

Este é o diagnóstico do nosso documento de projeto, e os dois jogos o resolvem
com **mecanismos diferentes**. Vale conhecer os dois porque eles não são
substituíveis.

### 8.1 Age of Empires II — a torre é boa, mas o recurso é finito e o cerco é maior

O AoE II **não** enfraquece a torre. Ao contrário: Fletching/Bodkin/Bracer dão a
ela +3 de ataque e +3 de alcance, Chemistry mais +1, Arrowslits até +3, Heated
Shot +125% contra navio, Masonry e Architecture dão +20% de vida e +2/+2 de
blindagem, o degrau Guard Tower/Keep leva de 850 para 2.250 de vida. Uma Keep
totalmente melhorada é um prédio muito forte. Quatro coisas seguram o empilhamento:

**1. A torre custa pedra, e pedra é um recurso separado e finito.** Cada torre
custa **125 de pedra**. Uma jazida de pedra tem **350** e se extrai a ~22 por
minuto ([Stone Mine](https://ageofempires.fandom.com/wiki/Stone_Mine)) — ou seja,
uma jazida inteira dá menos de três torres. E, nas palavras da própria wiki, as
torres *"compete for this resource with additional Town Centers and Castles"*
([Watch Tower](https://ageofempires.fandom.com/wiki/Watch_Tower_(Age_of_Empires_II))).
A pedra não renasce: quando acaba, só resta o mercado. **Cada torre é um Castelo
que não foi construído** — o Castelo custa 650 de pedra, tem 4.800 de vida,
8/11 de blindagem, dispara 5 projéteis de 11 e dá 20 de população.

**2. O cerco tem alcance maior que a torre, e bônus absurdo contra prédio.** A
torre tem alcance **8**. O Trebuchet tem alcance **16** e **+250 de ataque contra
a classe "All Buildings"**, sobre 200 de ataque perfurante base
([Trebuchet](https://ageofempires.fandom.com/wiki/Trebuchet)). O Bombard Cannon
tem alcance 12, 40 de ataque, **+200 contra prédios e +40 contra "Stone
Defense"** — e a torre *é* Stone Defense
([Bombard Cannon](https://ageofempires.fandom.com/wiki/Bombard_Cannon)). Até o
Mangonel, de Castelo, tem **+35 contra prédios**
([Mangonel](https://ageofempires.fandom.com/wiki/Mangonel_(Age_of_Empires_II))).
E — este é o ponto exato — **bônus por classe não é reduzido por blindagem normal
nem perfurante** (seção 2.2). Masonry e Architecture não protegem contra nada
disso. O jogador que gastou toda a pedra em torre perde para quem gastou madeira
e ouro em trabuco.

**3. A torre tem alcance mínimo, e consertá-lo custa pedra também.** Alcance
mínimo **1** significa que a unidade colada na base da torre não é atingida. A
cura é **Murder Holes**, que custa **200 comida + 100 pedra** — mais pedra. E a
wiki é direta sobre o que isso sinaliza: *"researching the technology is a sign"*
de que o jogador comprometeu pedra que faltará em outro lugar
([Murder Holes](https://ageofempires.fandom.com/wiki/Murder_Holes)).

**4. A torre não se move.** Uma torre só defende o que está a 8 de alcance dela.
Vinte torres defendem vinte pontos; vinte cavaleiros defendem o mapa. É por isso
que o *trush* (tower rush) existe como estratégia de **negação de recurso** e não
de vitória: a própria wiki descreve o objetivo como *"not generally to fight the
enemy outright but to deny them access to resources"*
([Watch Tower](https://ageofempires.fandom.com/wiki/Watch_Tower_(Age_of_Empires_II))).

### 8.2 StarCraft — a defesa estática simplesmente não melhora

O Brood War resolve o mesmo problema com uma regra só, e ela é brutal:

> *"Structures generally have 1 base armor and cannot be upgraded. Exceptions
> include static defense structures in StarCraft, which have 0 armor, and a
> further exception to the sunken colony, which has 2."*
> — [Armor](https://starcraft.fandom.com/wiki/Armor)

**Prédio não recebe melhoria de blindagem. Defesa estática tem blindagem zero.**
E a arma também não melhora: nenhuma das seis linhas terran, cinco zerg ou cinco
protoss beneficia torre. A única exceção do jogo inteiro é o **Plasma Shields
protoss**, que dá +1 de blindagem de escudo *"for all units and structures"* — e
custa 200/200 → 300/300 → 400/400, o mais caro do jogo.

As fichas, para ver o que isso significa:

| Defesa estática | Custo | Vida | Blindagem | Ataque | Cadência | Alcance |
|---|---|---|---|---|---|---|
| Photon Cannon (protoss) | 150 minerais | 100 + 100 de escudo | **0** | 20 normal (solo e ar) | 22 | 7 |
| Sunken Colony (zerg) | 50 minerais (175 com o drone) | 300 | **2** | 40 explosivo (só solo) | 32 | 7 |
| Spore Colony (zerg) | 50 minerais | 400 | **0** | 15 normal (só ar) | 15 | 7 |
| Missile Turret (terran) | 75 minerais | 200 | **0** | 20 explosivo (só ar) | 15 | 7 |
| Bunker (terran) | 100 minerais | 350 | 1 | — (4 guarnecidos, **+1 de alcance**) | — | — |

Fontes: [Photon cannon](https://starcraft.fandom.com/wiki/Photon_cannon),
[Sunken colony](https://starcraft.fandom.com/wiki/Sunken_colony),
[Spore colony](https://starcraft.fandom.com/wiki/Spore_colony),
[Missile turret](https://starcraft.fandom.com/wiki/Missile_turret),
[Bunker](https://starcraft.fandom.com/wiki/Bunker).

O resultado é que a defesa estática **encolhe sozinha com o tempo de partida**: o
exército melhora três níveis, a torre não melhora nenhum. A wiki do missile
turret diz isso sem rodeio: *"In the late game their lack of upgrades makes
upgraded goliaths more attractive. Upgraded goliaths deal damage faster and, most
importantly of all, have the mobility to concentrate against enemy air fleets."*
E ainda: torres *"are only a serious threat against a determined air attack if
built in clusters. Otherwise their immobility means they can be destroyed
piecemeal."*

Repare no par de mecanismos do **bunker**: ele não atira: ele **guarnece 4
unidades e dá +1 de alcance a elas**. É o mesmo desenho da guarnição da torre do
AoE II — a estrutura vale pelas tropas que estão dentro, não por si. A defesa
estática, nos dois jogos, é uma **multiplicadora de exército**, nunca um
substituto dele.

### 8.3 Os quatro freios, resumidos

| Freio | Como o AoE II faz | Como o StarCraft faz |
|---|---|---|
| **Recurso separado e escasso** | torre custa pedra (125), jazida de 350, não renasce, disputa com Castelo e Centro Urbano | não usa (todas as defesas custam só minerais) |
| **A torre não acompanha a melhoria** | não usa — a torre **é** melhorada (ferraria, Chemistry, Arrowslits, Masonry, degrau) | regra central: prédio não melhora blindagem, defesa estática tem 0, arma não melhora |
| **Alcance do cerco > alcance da torre** | Trebuchet alcance 16 vs torre 8, +250 contra prédios; bônus ignora blindagem | siege tank em modo cerco, guardian, Yamato do battlecruiser atingem de fora |
| **Imobilidade** | 20 torres defendem 20 pontos | idem, e a wiki chama pelo nome: *destroyed piecemeal* |

---

## 9. O que isso significa para o nosso jogo

### 9.1 O que a nossa lista tem hoje

`src/data.js`, vetor `PESQUISAS` (linhas 237–268): **13 pesquisas em 4 ramos**,
todas de **degrau único** — nenhuma tem nível 2 e 3.

| Ramo | Pesquisas | O que faz |
|---|---|---|
| comando | `tech2`, `tech3` | destrava conteúdo (idade) |
| comando | `formacao`, `autonomia` | soldados +20% de vida; reparo automático |
| economia | `carga`, `coleta`, `logistica` | 8→12 por viagem; +30% de coleta; +20% de velocidade e +40% no extrator |
| fortificacao | `muroReforcado`, `reparoEficiente`, `antiacido` | muro +60% de vida; reparo −40% de custo e +50% de velocidade; ácido pela metade |
| armamento | `precisao`, `penetracao`, `artilhariaAv` | +18% de dano (torres **e** soldados); ignora blindagem; +35% de área e +15% de alcance nas armas de área |

E o nosso modelo de dano, em `src/sim-combate.js` (`aplicarDano`, linhas 228–244):

```js
var blind = (alvo.def && alvo.def.blind) || 0;
if (opts.metadeBlindagem) blind *= 0.5;
if (!opts.perfura) dano = Math.max(dano * 0.12, dano - blind);
```

**Uma** blindagem, subtrativa, com piso proporcional (12% do dano) em vez do piso
fixo de 1 do AoE II ou 0,5 do StarCraft. Nossa escolha é defensável — o piso
proporcional escala junto com o dano da unidade e não inventa um mínimo absoluto
num jogo que tem tiro de 5 e tiro de 106.

### 9.2 O que falta, comparado com os dois

| Ramo dos clássicos | Nós temos? | Observação |
|---|---|---|
| **Blindagem pesquisável (Scale/Chain/Plate; Carapace; Ground Armor)** | ❌ **Não temos nada** | Este é o buraco grande — ver 9.3 |
| Ataque pesquisável | ⚠️ meio | `precisao` é **um** degrau de +18%, multiplicativo, para tudo que é nosso |
| Blindagem normal × perfurante | ❌ | temos uma blindagem só, e um `perfura` booleano |
| Alcance pesquisável (Fletching, U-238, Charon) | ⚠️ meio | `artilhariaAv` dá +15% de alcance **só nas armas de área** |
| Vida/blindagem de prédio (Masonry, Architecture) | ⚠️ meio | `muroReforcado` só vale para muro e portão (`def.muro`), em `sim.js:298` |
| Degrau de torre (Watch→Guard→Keep) | ❌ | nossas torres são modelos independentes, comprados do zero |
| Fim do alcance mínimo (Murder Holes) | ❌ | Artilharia tem `alcMin: 2.2`, Tanque `alcMin: 2` — e não há cura |
| Melhoria de apoio (monge, medic) | ❌ | o Médico de campo tem `cura: { taxa: 14, alc: 4, reserva: 320 }` e **nenhuma pesquisa o toca** |
| Precisão contra alvo móvel (Ballistics) | ✅ não precisa | nosso projétil guarda o **id** do alvo e não erra; Ballistics não tem análogo aqui |
| Velocidade de obra (Treadmill Crane) | ❌ | — |
| Cerco vs prédio (Siege Engineers) | ❌ | é melhoria do atacante, e o atacante aqui é a colmeia |

**Três achados que valem mais que a lista:**

1. **Os invasores têm blindagem e nós não temos como subir a nossa.**
   `INVASORES` traz `blind` de 0 (Corredor, Cuspidor, Detonador) a **10** na
   Matriarca, passando por 6 no Couraçado e 8 no Titã. As nossas unidades têm
   `blind` fixo: Fuzileiro 0, Incendiário 1, Lanceiro 2, Tanque 3 — e **nenhuma
   pesquisa mexe nisso**. Metade simétrica do sistema está faltando. É
   exatamente o que o AoE II e o StarCraft nunca deixam faltar: as duas linhas,
   ataque e blindagem, saem na mesma hora e custam parecido.

2. **Nossas estruturas não têm blindagem nenhuma.** Nenhuma entrada de
   `ESTRUTURAS` tem a chave `blind` — torre, muro e Central absorvem dano cheio.
   No AoE II a Watch Tower nasce com **1/7** e chega a **3/9** com o degrau, mais
   +2/+2 de Masonry+Architecture. É por isso que uma torre do AoE II resiste a
   flecha e a nossa não resiste a nada — ela só tem vida.

3. **A descrição de `penetracao` está mais fraca que o código.** O texto em
   `data.js` diz *"Ignora metade da blindagem inimiga"*, e o projétil em
   `sim-combate.js` (linhas 164–165) recebe **as duas bandeiras ao mesmo tempo**:
   `perfura: true` e `metadeBlindagem: true`. Só que em `aplicarDano` a subtração
   está dentro de `if (!opts.perfura)` — com `perfura` ligado, o `blind *= 0.5`
   acontece e **é jogado fora**: a blindagem **inteira** é ignorada, não a
   metade. Contra a Matriarca (`blind: 10`) e o Titã (`blind: 8`) a diferença é
   grande. **Não alterei nada**: fica registrado para decidir qual dos dois é o
   comportamento desejado — e, se for "metade", basta não marcar `perfura`.

### 9.3 O que eu proporia (sem implementar), em ordem de valor

**1. Linha de blindagem em três degraus — o que mais falta.**
É a metade que não existe do nosso próprio sistema de dano, e o mecanismo já está
pronto (`aplicarDano` já subtrai `blind`). Molde: ramo `fortificacao` ou um ramo
novo `blindagem`, com **+1 por degrau** para tropas, ao estilo Scale/Chain/Plate,
e o preço subindo como no StarCraft (a blindagem custa mais que a arma). Com
tropas em `blind` 0–3, +3 é uma mudança enorme — provavelmente **dois** degraus
de +1, não três, e medir com `equilibrio.cjs`.
*Por que primeiro:* hoje o jogador só tem uma alavanca ofensiva (`precisao`,
`penetracao`) e nenhuma defensiva para a tropa. O diagnóstico do documento —
"empilhar torre não sustenta a campanha" — só se resolve se a tropa tiver para
onde crescer.

**2. Blindagem e vida para estrutura (Masonry/Architecture).**
Hoje só o muro engorda, e só em vida. Um degrau que desse **+1 de blindagem a
toda estrutura** mudaria completamente quem morre para o Cuspidor (18 de dano) e
para o Corredor (7) sem mexer no Titã (78) — é o efeito não-linear da subtração,
o mesmo que faz o zergling sofrer com carapace e o ultralisk não ligar.
*Cuidado medido:* com piso de 12%, +2 de blindagem contra o tiro de 7 do Corredor
já corta o dano quase pela metade. Isto é forte. Medir antes.

**3. Degrau de torre no lugar de torre nova.**
A Sentinela (80 minerais, dano 14) fica obsoleta e é demolida. No AoE II a Watch
Tower vira Guard Tower e depois Keep **pelo mesmo custo de construção**, e todas
as já construídas sobem juntas. Portar isso salva o investimento inicial do
jogador e dá uma decisão nova ("subo as sete que tenho ou construo duas
Artilharias?"). Encaixa no ramo `fortificacao`.

**4. Fim do alcance mínimo (Murder Holes), para Artilharia e Tanque.**
Pesquisa pequena, barata, de sabor imediato, e resolve uma frustração real
(`alcMin: 2.2` faz a Artilharia ficar muda quando o Predador encosta). No AoE II
ela custa **pedra** de propósito — no nosso caso, o custo em barris (`c`) faz o
mesmo papel de recurso escasso.

**5. Melhoria do Médico de campo (Caduceus Reactor / Illumination).**
Nosso médico tem `reserva: 320` e nenhuma pesquisa. A regra dos dois clássicos é
clara: unidade de apoio não ganha potência, ganha **número de usos**. Uma
pesquisa `+50% de reserva` é o porte exato do Caduceus Reactor (+50 de energia
sobre 200 = +25%) e não desequilibra o combate direto.

**6. Alcance separado do dano (Fletching / U-238).**
`precisao` hoje mistura tudo num +18% de dano. Nos dois jogos, **alcance é uma
linha própria** — e é a melhoria que mais muda o comportamento tático sem mudar a
aritmética do dano. Um `+1 de alcance para torres` (sobre alcances de 6 a 10)
vale mais que um +18% de dano e é mais fácil de equilibrar.

### 9.4 Uma observação sobre o nosso freio anti-empilhamento

Dos quatro freios da seção 8.3, **nós já temos dois**: o cerco inimigo tem
alcance e área (Titã `area: 1.6`, Matriarca `area: 2.4`, Detonador `area: 2.2`
com 108 de dano), e a torre é imóvel como em todo lugar.

Nos outros dois, estamos descobertos:

- **Não temos recurso separado.** Torre custa minério, como tudo. O AoE II
  separou a pedra exatamente para que "mais uma torre" fosse "menos um Castelo".
  O que temos mais próximo é a **energia** (`energia: 1` na Torre de muralha até
  `4` na de Plasma, contra `fornece` das usinas) — e ela é o candidato natural a
  virar o nosso análogo da pedra, porque já existe e já cria a decisão
  "torre ou oficina?". A diferença é que energia se compra com o mesmo minério:
  é um limite de **fluxo**, não de **estoque finito**. Um teto de energia por
  setor (como `REGRAS.energiaMax`, que hoje serve às habilidades) seria a versão
  forte disso.
- **A nossa torre melhora junto com a tropa.** `precisao` dá +18% para torre
  **e** soldado, com a mesma pesquisa — que é o desenho do AoE II, não o do
  StarCraft. Só que o AoE II podia fazer isso porque cobrava pedra; nós não
  cobramos nada equivalente. **Separar `precisao` em duas pesquisas** — uma para
  tropa, uma para torre, cada uma com o seu preço — é a mudança de uma linha de
  dado que mais aproximaria o nosso equilíbrio do diagnóstico do documento.

---

## Onde isto encosta no repositório

| Assunto | Arquivo |
|---|---|
| Lista `PESQUISAS`, `blind` das unidades e invasores, fichas das torres | `src/data.js` (linhas 19–268) |
| Aplicação de blindagem, `perfura`, piso de 12% | `src/sim-combate.js`, `aplicarDano` (228–244) |
| `precisao`, `penetracao`, `artilhariaAv` no disparo | `src/sim-combate.js` (121–164) |
| `muroReforcado` (+60% de vida, só `def.muro`) | `src/sim.js:298` |
| `formacao` (+20% de vida, só quem tem `pop`) | `src/sim-unidades.js:32` |
| `reparoEficiente`, `carga`, `coleta`, `logistica`, `autonomia` | `src/sim-unidades.js` (166, 230, 286, 316, 323) |
| Medição de qualquer mudança destas | `node tests/equilibrio.cjs`, antes e depois |
