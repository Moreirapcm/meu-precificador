# Animação de sprite em jogo de estratégia

Quantos quadros os clássicos usavam, quais estados pagam o próprio custo, e o
que dá para fazer deformando uma imagem só. Números de documentação de
engenharia reversa e de modding — não estimativa.

## 1. Quantos quadros, nos clássicos

**Age of Empires II.** Cada animação de unidade tem **10 quadros-chave e 5
direções**; as outras 3 direções saem espelhando no eixo Y. Um arquivo SLP guarda
uma animação — **50 quadros por SLP**
([openage/slp-files.md](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md)).
Os espaços de gráfico por unidade no Genie Editor são *Attack, Standing, 2nd
Standing, Dying, Undead, Walking, Running, Special*
([Genie Editor](https://ageofempires.fandom.com/wiki/Genie_Editor)): cinco a sete
animações de 10 quadros. Na Definitive Edition são 16 direções em vez de 8.

**StarCraft.** O GRP guarda os quadros **em conjuntos de 17**. O `playfram`
escolhe o conjunto e o motor soma de 0 a 16 e espelha conforme a direção
([Editing Bible, cap. 4](https://files.campaigncreations.org/misc/tutorials/starcraft/bible/chap4_ice_opcodes.shtml))
— 32 facings desenhando 17. O caminhar do Marine percorre os conjuntos 5 a 12 e
volta ao 4 (≈8 poses de passada); o início do tiro tem **3 conjuntos** só para
erguer a arma ([staredit.net](https://staredit.net/topic/440/#15)).

**Diablo II.** Relógio fixo em **25 ticks por segundo**. Os modos são
DT (morte), DD (morto), NU (neutro), TN (neutro na cidade), WL (andar),
RN (correr), TW (andar na cidade), A1/A2 (ataque), TH, SC, KK, BL, GH (levar
golpe), S1–S4
([Extracting D2 Animations](https://archive.org/stream/ExtractingDiabloIIAnimations/Extracting%20Diablo%20II%20Animations_djvu.txt)).
Direções são 1, 2, 4, 8, 16 ou 32, e **todas têm o mesmo número de quadros**: uma
animação de 96 quadros em 8 direções tem 12 por direção
([OpenDiablo2/dcc](https://github.com/OpenDiablo2/dcc)). Exemplos reais: ataque
de arco da amazona (`AMA1BOW`) = **9 quadros por direção**, velocidade 256
([Phrozen Keep](https://d2mods.info/forum/viewtopic.php?t=48761)); ataque do
Carver = 10 quadros numa direção.

**Referência indie (pixel art), para orçamento pequeno:** parado 2–4 quadros,
caminhada **4** (6 é mais suave, 8+ é exagero), ataque 3–6, morte 3–5; 100–150 ms
por quadro andando, 80–100 correndo, 400–500 ms no parado, e o quadro de impacto
segurado 150–200 ms contra 80 ms dos outros
([Sprite-AI](https://www.sprite-ai.art/guides/how-to-animate-pixel-art)).

**A conta que decide tudo é quadros × direções.** Quatro quadros de caminhada em
5 direções já são 20 imagens **por unidade**; com morte e ataque passa de 40. Por
isso a pergunta certa não é "quantos quadros", é "quais estados".

## 2. Quais estados valem o custo, e em que ordem

O tutorial de conversão de animação do Diablo II manda criar, no mínimo:
**A1, A2, DD, DT, GH, NU e WL** — ataque, morto, morrendo, levando golpe, parado
e andando ([Phrozen Keep, anexo](https://d2mods.info/resources/infinitum/tut_files/dcc_tutorial/annex.html)).
É a mesma lista do AoE2 em outra ordem. Para orçamento pequeno, a ordem por
retorno visual:

1. **Andar** (4 quadros × 5 direções). É o estado em que a unidade passa mais
   tempo visível e o único que denuncia o deslizamento do pé.
2. **Morrer** (3–5 quadros, **1 direção serve**). Ver seção 5: é o que mais
   rende por quadro desenhado.
3. **Parado/idle** — mas por deformação, não por quadro (seção 6). Custo zero.
4. **Atacar**: comece com **1 quadro por direção** (a pose de tiro), não com uma
   sequência. O que o jogador lê num soldado parado é *para onde* ele atira; o
   movimento do disparo pode vir do coice e do clarão da boca do cano.
5. **Levar golpe (GH)**: piscada branca + tremida resolvem sem arte nenhuma.
6. Corrida, andar "de cidade", habilidades: só depois de tudo acima.

Direções: desenhe **5** (leste, nordeste, norte, sudeste, sul) e espelhe as
outras três. Frente e costas não devem ser espelhadas — mochila e detalhes
assimétricos saltam de lado quando a unidade cruza o eixo.

## 3. Animação por deformação (recorte / esqueleto 2D)

Girar e recortar **uma imagem só** é boneco de papel articulado — a ideia do
Spine, que guarda osso em vez de uma imagem por quadro, usa muito menos arte e
interpola em qualquer taxa ([Spine: In Depth](https://en.esotericsoftware.com/spine-in-depth)).

**Funciona** quando o movimento é rotação de uma peça em torno de uma junta na
**borda** da figura, ou translação do corpo inteiro:

- **Passada**: perna recortada girando no quadril (a perna está na borda de
  baixo — só há perna ali).
- **Respiração**: 1 px de sobe-e-desce, ou escala vertical de ~1%.
- **Coice do tiro**: deslocamento curto para trás + rotação pequena do corpo.
- **Inclinação de corrida**: o corpo deitado para a frente alguns graus.
- **Tombo da morte**: rotação de ~80°, achatamento vertical e afundamento.
- **Tremida de dano**: ruído de 2–5 px por 0,3 s.
- **Torre e canhão**: retângulo girado num pivô — precisão de grau, zero arte.

**Falha** — e aí só quadro desenhado resolve:

- **Membro no meio do corpo.** Recortar um retângulo sobre o braço leva junto um
  naco do peito; girado, esse naco vira borrão no ombro. Braço separado exige a
  arte em camada, com o corpo desenhado sem braço.
- **Mudança de silhueta**: arma erguida, boca abrindo, perna cruzando na frente
  do tronco, escorço (membro apontando para a câmera). São pixels que não
  existem na imagem.
- **Pixel art denso**: rotacionar e escalar briga com a borda alinhada ao pixel,
  e deformação forte estica a textura de forma visível
  ([Unity × Spine](https://retrostylegames.com/blog/unity-2d-animation-vs-spine/)).

Regra prática: deformação dá **vida**; quadro desenhado dá **ação**. Se o que
falta é "parece congelado", é deformação. Se o que falta é "não dá para ver o
que ele está fazendo", é quadro.

## 4. Timing: a fase anda por distância, não por relógio

O *foot sliding* é o artefato mais comum de caminhada em jogo lançado, e a causa
é sempre a mesma: **descompasso entre o deslocamento da animação e a velocidade
real de movimento**. A correção canônica é medir a passada completa e casar a
velocidade com ela
([MoCap Online](https://mocaponline.com/blogs/mocap-news/walk-cycle-animation)).
Num jogo em que a velocidade varia (pesquisa, terreno, dano) isso é impossível —
então inverte-se: **a animação é dirigida pela distância percorrida**.

Com a perna de comprimento `L` girando de `+A` a `−A` no quadril, o pé anda para
trás, em relação ao corpo:

```
passo (meio ciclo) = 2 · L · sen(A)
```

Se o corpo avança exatamente isso no mesmo meio ciclo, o pé fica cravado no chão.
Daí o avanço de fase por quadro, dado o deslocamento `Δd`:

```
Δfase = π · Δd / (2 · L · sen(A))          [radianos, ciclo = 2π]
```

Consequências que caem de graça:

- **Abrir mais a perna não traz o deslizamento de volta** — só faz o passo ser
  mais largo e, por isso, mais espaçado.
- **Isométrico**: use o deslocamento **horizontal em tela**
  (`Δx_tela = (Δx − Δy) · largura/2`). Unidade andando "para dentro" do mapa quase
  não anda de lado e a perna quase não abre — correto, e sem código extra.
- **Com quadros desenhados** a mesma fase escolhe o quadro:
  `q = floor(fase / 2π · n)` — o quadro de contato cai quando o pé está mesmo no
  chão. Trocar quadro por relógio traz o deslizamento pela porta dos fundos.
- A curva do ângulo **não é um seno**: o que precisa ser reto na fase é `sen(θ)`,
  que é o que vira posição horizontal do pé (`θ = asin(sen(A)·s)`, `s` linear no
  apoio, suave no balanço).
- **O corpo desce quando a perna abre** (`L·cos(θ)`), duas vezes por passada.
  Subir na abertura tira o pé do chão e é metade da sensação de flutuar.

O quadril humano faz ~30° numa caminhada, e o passo é assimétrico (~30° à frente,
~10° atrás). A caminhada clássica tem 8 poses-chave: contato, baixo, passagem e
alto, duas de cada.

## 5. Morte: é ela que vende o combate

Enquanto a unidade vive, o sinal de dano dura um décimo de segundo. A morte é o
**registro permanente**: é o que diz se a troca de tiros foi vitória ou derrota, e
é o que fica na tela depois. O que os clássicos faziam:

- **Dois estados separados.** AoE2 tem *Dying Graphic* e *Undead Graphic* (o
  gráfico de decomposição); Diablo II tem **DT** (morrendo) e **DD** (morto, a
  pose deitada). Não é a mesma animação: uma roda uma vez, a outra é o repouso.
- **O corpo fica.** No AoE2 o cadáver permanece por volta de **30 segundos**
  antes de sumir; `Corpse Decay Time` é o número de segundos de cadáver e
  entulho visíveis ([Fórum AoE](https://forums.ageofempires.com/t/corpse-decay-time-triggers/158668)).
- **Decomposição desenhada.** No AoE2 original o corpo sangrava e virava
  esqueleto, quadro a quadro no sprite; a DE refez com shader
  ([Fórum AoE](https://forums.ageofempires.com/t/mod-visible-corpses/66831)).
- **Quadro de dano marcado.** No D2 o arquivo diz em que quadro o golpe acerta
  ("dano no quadro 8") — som e dano saem dali, não do início.

Barato e eficaz, na ordem: tombo por deformação → 3–5 quadros desenhados de queda
→ pose deitada que fica alguns segundos → sumiço por transparência (nunca corte
seco de um quadro para o outro).

## 6. Parado e variação: custo quase zero

Uma unidade parada sem micro-movimento lê como **estátua**, não como personagem
esperando ordem. O mínimo que resolve:

- **Respiração**: 1 px de deslocamento vertical já lê como "vivo" em velocidade
  de jogo ([Sprite-AI](https://www.sprite-ai.art/guides/how-to-animate-pixel-art)).
  Ritmo natural: 15–20 respirações por minuto relaxado, 20–25 em alerta.
- **Transferência de peso**: um balanço lento, ciclo de 4–8 segundos
  ([MoCap Online](https://mocaponline.com/blogs/mocap-news/idle-animation-game-dev-guide)).
- **Defasagem por unidade.** Some um deslocamento de fase derivado do id: vinte
  soldados respirando no mesmo compasso viram um organismo só.
- **Fidget ocasional.** É para isso que serve o *2nd Standing Graphic* do AoE2:
  uma variação curta disparada de vez em quando. Com deformação dá para imitar
  com uma inclinação ou um giro rápido a cada N segundos.

Tudo isso é seno sobre a pose parada: nenhum quadro desenhado.

## 7. Folha de sprites (sprite sheet)

**Organização padrão: linha = direção, coluna = quadro** — o recorte vira
aritmética. Arquivos separados por direção são equivalentes e mais fáceis de
gerar por IA. O que não muda: todos os quadros de uma tira precisam ter
**exatamente a mesma largura**.

**Bleeding.** Com filtragem bilinear, a amostra na borda de um quadro puxa pixel
do quadro vizinho e aparece uma costura ou uma franja colorida. Duas correções,
usadas juntas:

- **Padding**: 1 a 2 px de calha entre os quadros (2–4 px em imagem grande ou com
  mipmap).
- **Extrusão**: duplicar os pixels da borda para dentro da calha, de modo que uma
  amostra logo além da borda leia a cor do próprio quadro
  ([Bugnet](https://bugnet.io/blog/how-to-fix-texture-bleeding-and-seams-in-an-atlas),
  [WebGL Fundamentals](https://webglfundamentals.org/webgl/lessons/webgl-qna-how-to-prevent-texture-bleeding-with-a-texture-atlas.html)).

No Canvas 2D isso aparece em `drawImage` com retângulo de origem quando há zoom
e `imageSmoothingEnabled` ligado. Além do padding: retângulo de origem em
coordenadas inteiras e, para quadro que precise de contorno, recortar primeiro
num canvas próprio — nunca contornar a folha inteira.

**Atenção ao contrato do carregador:** se ele calcula a largura do quadro como
`largura_da_imagem / n`, qualquer calha embutida desloca todos os quadros. Ou a
calha entra no cálculo, ou a folha vai sem calha e o recorte fica inteiro.

## O QUE JÁ TEMOS E O QUE FALTA

**Temos.** `Anima.prototype.avancar` já integra a fase por **distância horizontal
em tela**, com `ABERTURA = 0.58 rad` e `pernaEm()` — é a fórmula da seção 4,
inclusive o retorno ao repouso quando a unidade para. `passada()` usa `asin`
(apoio reto, balanço suave) e `passadaAr()` põe a assimetria só na perna do ar;
`Anima.ALTURA`/`Anima.PERNAS` são a fonte única do comprimento de perna, lida
também pelo render. `postura()` dá coice do tiro, inclinação de corrida, tremida
de dano, golpe de picareta e o tombo da morte (giro 1,45 rad, `escalaY` 0,75,
afundamento e sumiço por `alfa` em 2,4 s); `direcao()` faz 5 direções mais
espelho, sem espelhar frente e costas. No render: `R.caminhada`, `R.spriteUnidade`
(quadro por `fase/2π·n`), `R.imagemComSilhueta`/`R.spriteContornado`,
`R.golpeDePerto`, `R.canhaoDeVeiculo`. `UF.sprites.tira` + tabela `TIRAS`:
operário com 4 quadros em 5 direções, pose de tiro de 1 quadro nos soldados.

**Feito depois desta pesquisa** (13/09/2026). **Pose deitada**: existe, como
sprite `-morto` por unidade, e o corpo fica 26 s no chão com poça de sangue —
`R.deitarCadaver`/`R.desenharCadaver`, fora da simulação. **Idle**: `postura()`
respira, dezessete ciclos por minuto, com a fase tirada do id da unidade, como
esta seção recomenda. **Quadrúpede**: `Anima.GALOPE` dá salto, balanço e squash
pela distância percorrida — antes os bichos deslizavam.

**Falta.** Tira `-morrer-` de verdade (a transição entre o vivo e o caído ainda
é o tombo calculado). **Ataque**: `-atirar-` tem `n = 1`, e com `n > 1` o quadro
sai do relógio (`sim.t * 10`), não do disparo. **Caminhada** só do operário.
**Fidget** ocasional, o *2nd Standing Graphic* do AoE2: não existe.

## Fontes

Todas as afirmações acima estão linkadas no texto. As principais:
[openage/SLP](https://github.com/SFTtech/openage/blob/master/doc/media/slp-files.md),
[StarCraft Editing Bible cap. 4](https://files.campaigncreations.org/misc/tutorials/starcraft/bible/chap4_ice_opcodes.shtml),
[Extracting Diablo II Animations](https://archive.org/stream/ExtractingDiabloIIAnimations/Extracting%20Diablo%20II%20Animations_djvu.txt),
[Phrozen Keep](https://d2mods.info/resources/infinitum/tut_files/dcc_tutorial/annex.html),
[Spine: In Depth](https://en.esotericsoftware.com/spine-in-depth),
[MoCap Online](https://mocaponline.com/blogs/mocap-news/walk-cycle-animation),
[Bugnet — texture bleeding](https://bugnet.io/blog/how-to-fix-texture-bleeding-and-seams-in-an-atlas).
