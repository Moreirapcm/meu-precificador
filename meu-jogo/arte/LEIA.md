# Arte do Última Fronteira

Sprites isométricos renderizados em 3D, no mesmo ângulo 2:1 do jogo
(`LARG = 64, ALT = 32` em `src/render.js`). Todos com fundo transparente.

Ambientação fixada com o Pedro: **Terra, ano de 2050**. A tecnologia humana é
evolução crível do equipamento militar de hoje — nada de ficção científica
distante. O inimigo é orgânico. A leitura de cor separa os dois lados:
**humano = azul aço + laranja de sinalização**, **alienígena = vermelho**.

## O que existe

**Todas as estruturas** de `src/data.js` têm arte. Das unidades e dos invasores,
só uma parte — o que falta está listado abaixo.

### Estruturas (`estruturas/`)

| Arquivo | Peça | Células |
|---|---|---|
| `central.png` | Central de Comando | 4×4 |
| `alojamento.png` | Alojamento | 2×2 |
| `gerador.png` | Gerador | 2×2 |
| `deposito.png` | Depósito avançado | 2×2 |
| `quartel.png` | Quartel | 3×3 |
| `oficina.png` | Oficina | 3×3 |
| `pesquisa.png` | Centro de Pesquisa | 3×3 |
| `bomba.png` | Bomba de petróleo (chave do asset continua `extrator`) | 2×2 |
| `radar.png` | Radar | 2×2 |
| `muro.png` | Segmento de muro | 1×1 |
| `portao.png` | Portão | 2×1 |
| `torre-sentinela.png` | Sentinela (solo + ar) | 2×2 |
| `torre-gelo.png` | Torre de Gelo | 2×2 |
| `torre-artilharia.png` | Artilharia | 2×2 |
| `torre-plasma.png` | Torre de Plasma | 2×2 |
| `torre-lancadora-drones.png` | Lançadora de Drones | 2×2 — **não existe em `data.js`** |

### Unidades (`unidades/`) e inimigos (`inimigos/`)

Completo: `operario`, `fuzileiro`, `incendiario`, `medico`, `lanceiro`, `tanque`,
`drone`. Os soldados partem todos da mesma base — farda azul aço, colete de
placas, capacete com visor — e o que separa um do outro é o **equipamento**, não
o rosto: no tamanho em que aparecem ninguém vê cara nenhuma. O incendiário é o
único com luz laranja, o médico o único com verde, e o lanceiro o único com
exoesqueleto.

A colmeia está completa: `predador`, `corredor`, `cuspidor`, `couracado`,
`detonador`, `asa`, `tita`, `matriarca`. Três delas — detonador, asa e matriarca —
foram geradas com **fundo verde** em vez de magenta, porque a própria criatura é
rosa ou roxa e o recorte por matiz magenta apagaria o brilho dela junto com o
fundo. É o ator que não pode vestir a cor do chroma key. O `--verde` do script
de recorte existe por isso, e `arte/prompts/<nome>.txt` guarda qual fundo cada
peça pediu.

Faltam as unidades que `data.js` já tem e ninguém desenhou ainda: incendiário,
médico de campo e lanceiro pesado; e os invasores corredor, cuspidor, detonador
e couraçado.

### Cenário (`cenario/`)

`jazida-mineral.png` é um objeto solto, como a rocha e a ruína.

O **chão** não é peça solta: é textura que se repete. Ver a seção do mapa.

## O mapa não é uma imagem

`src/world.js` sorteia o terreno a cada partida — o rio, as jazidas e as ruínas
mudam de lugar. Não existe "a imagem do mapa": desenhar uma serviria para uma
partida só. O que o jogo precisa são duas coisas:

- **Texturas de chão** (`cenario/chao-*.png`), que se repetem em grade sem
  emenda: pavimento, entulho, água. Geradas em **cinza neutro** de propósito —
  as seis regiões do mundo têm paletas diferentes em `src/render.js:12-17`, e o
  jogo tinge a mesma textura em vez de guardar seis cópias de cada.
- **Objetos** espalhados por cima (`cenario/rocha.png`, `cenario/ruina.png`,
  `cenario/jazida-mineral.png`), posicionados pelo sorteio.

## Como uma peça nova é feita

1. Gerar com fundo **magenta chapado** (o gerador não entrega transparência).
   O prompt precisa dizer o ângulo isométrico 2:1, a paleta, o tamanho em
   células e **"sem sombra projetada no chão"** — a sombra vira mancha no
   recorte e custa uma volta extra.
2. Recortar com `ferramentas/recortar-fundo.sh`.
3. Conferir com Vision **antes** de aceitar. O gerador não reporta o próprio erro.

## O recorte, e por que não é um `-transparent magenta`

`ferramentas/recortar-fundo.sh entrada.jpg saida.png [largura] [--borda] [--despill]`

- **padrão (matiz)** — apaga onde vermelho e azul são altos e verde é baixo.
  Chroma key por cor exata não serve: o magenta visto *entre as barras* da
  treliça do radar está sombreado, e o `fuzz` grande o bastante para pegá-lo
  come o cinza do próprio prédio.
- **`--borda`** — obrigatório para peça que tem violeta/rosa de verdade (a torre
  de plasma). Só apaga o magenta conectado à borda da imagem; o teste de matiz
  apagaria o emissor junto com o fundo.
- **`--despill`** — para peça semitransparente (as pás do drone). Ali o magenta
  se mistura à cor e sobra um rosa que máscara nenhuma tira, porque o pixel é
  genuinamente rosa. Vira cinza de mesma luminosidade.

## Como a arte entra no jogo

`src/sprites.js` carrega as imagens e `render2.js` desenha o sprite no lugar da
caixa geométrica quando ele já chegou. O desenho procedural **não foi removido**:
ele é o que aparece enquanto a imagem carrega, quando o arquivo falta, e nos três
estados que uma imagem só não cobre — obra subindo, ruína e posto abandonado.

O chão é outro caso: `render.js` pinta o mapa inteiro uma vez num canvas
guardado, e a textura entra ali por cima da cor chapada em modo `overlay` — a
cor do setor continua mandando (é ela que separa deserto de cratera) e a imagem
entra só como granulação. Como as imagens chegam depois do primeiro quadro, o
render repinta o chão uma vez quando elas ficam prontas; sem isso a partida
inteira ficaria na cor chapada.

O sprite de estrutura é encaixado pelo losango da fundação (`R.spriteNaFundacao`): mesma
largura que a base ocupa em tela, apoiado no canto sul. As artes são cortadas
rentes, então a borda de baixo da imagem é a frente da base — não há tabela de
deslocamento peça a peça para manter.

`assets/` guarda as versões prontas para jogar. Estruturas: largura de
`(w+h)×32×2` pixels, o dobro do tamanho em tela para aguentar o zoom. Unidades e
inimigos: 128 px (gente) ou 256 px (veículos e bichos), e a altura na tela vem de
`ALTURA_SPRITE` em `render2.js`, medida em células — não do `raio`, que é colisão
e não diz nada sobre altura. As alturas ali são de escala de jogo, não realistas:
um soldado do tamanho real ao lado de um bunker 4×4 fica ilegível, e foi o que
aconteceu na primeira tentativa. Chão (`cenario/chao-*.webp`): 256×256, espelhado
em X e Y para não ter emenda ao repetir. WebP porque
o mesmo conteúdo em PNG custa nove vezes mais, e isso vai inteiro para dentro do
arquivo único: 26 imagens, 416 KB. `build.cjs` converte tudo em data URI: sem
isso o `dist/` abriria sem arte nenhuma, e em silêncio.

Para trocar ou acrescentar uma peça: escreva o prompt em `arte/prompts/<nome>.txt`
e rode `arte/ferramentas/gerar-lote.sh <pasta> <nome>...`. Ele gera, recorta e
**salva no projeto peça a peça**, não no fim do lote — um lote de sete criaturas
levou vinte minutos e se perdeu inteiro quando a pasta temporária foi limpa antes
da cópia para cá. Depois gere o `.webp` em `assets/` no tamanho da fórmula acima.

Uma armadilha do gerador: ele carrega o contexto da conversa. Uma peça pedida com
fundo magenta logo depois de três com fundo verde sai verde assim mesmo, e o
recorte errado come as cores da figura. Confira a saída antes de aceitar.

## O que ainda falta para isso entrar no jogo

- **Rocha e ruína** (`cenario/`) têm arte mas ainda não são desenhadas: o terreno
  põe rocha e ruína como cor de célula, não como objeto sobre o chão.
- **Torreta separada da base** nas torres. O procedural girava um cano para o
  alvo (`Math.atan2` + `ctx.rotate`); sobre o sprite isso foi desligado, porque a
  arte já traz uma torreta e um segundo cano por cima sai torto. Volta quando a
  torreta for sprite próprio, em 8 ou 16 direções, com a base parada embaixo.
  Até lá, quem mostra a mira é o rastro do projétil.
- **Animação** das unidades: andar, minerar, atacar, morrer. Uma pose parada não
  cobre isso.
- **Estados de estrutura**: em obra, danificada, destruída.
- **Regra da Lançadora de Drones** em `src/data.js` — a arte existe, a estrutura
  não.

## Quadros desenhados ou deformação? Depende do movimento

Medido, não opinado. As duas técnicas convivem, e cada uma ganha num caso:

**Quadros desenhados ganham no GOLPE** (`arte/unidades/animacao/`). A picareta
subindo e descendo é um movimento grande, e desenho de verdade bate qualquer
giro calculado. O que faz funcionar:
- pedir **todos os quadros numa imagem só**, lado a lado. Um a um, cada boneco
  sai diferente do anterior e a sequência pisca;
- mandar **a arte que já existe como imagem de entrada**. Sem isso o modelo
  inventa outro personagem, com outro estilo de pintura;
- alinhar os recortes pela **mesma linha de base e mesma altura de quadro**,
  senão o boneco pula entre quadros.

**Deformação ganha na CAMINHADA.** Tentado duas vezes gerar o ciclo de passo em
quadros, inclusive pedindo passada exagerada de desenho animado
(`arte/origem/tira-andar-tentativa.jpg` guarda o resultado): o modelo mantém a
identidade, mas **não abre as pernas**. Em vista isométrica de cima o passo é
sutil, e ele desenha seis poses quase idênticas — inanimável.
A deformação vence porque ali eu controlo o que importa: a amplitude do passo e,
principalmente, o **pé cravado no chão**, que é conta e não desenho. Ver
`src/anima.js`.

Resumo: **movimento de braço e ferramenta → quadros; locomoção → deformação.**

### Depois descobri por que a caminhada falhava — e como contornar

**Texto não comanda pose.** Descrever "perna direita bem à frente" em seis poses
devolve seis vezes a mesma pessoa quase parada: o modelo entende o pedido e
mesmo assim volta ao que mais viu, gente em pé. O golpe de picareta funcionou
porque a picareta é um objeto grande e de alto contraste, sem nada competindo;
a perna é geometria fina, com um prior forte contra.

**O que faz funcionar: dar a pose como IMAGEM.**
`arte/ferramentas/guia-poses.py` desenha a tira de bonecos de palito do ciclo de
caminhada — os ângulos de coxa, joelho e braço são escolhidos no script, então a
passada é garantida por construção, não negociada com o modelo. Junta-se numa
imagem só o personagem em cima e o guia embaixo, e pede-se para **vestir cada
esqueleto, sem corrigir para uma pose natural**. Aí as pernas abrem.
`arte/origem/teste-guia-poses.jpg` guarda a prova.

Duas coisas que a pesquisa trouxe e valem lembrar:
- Em vista isométrica, uma passada "entrando na tela" projeta só **50 a 58%** do
  comprimento real. Nessas direções, perna quase parada pode estar
  geometricamente **certa** — quem comunica o passo é o joelho subindo e o
  sobe-e-desce do corpo, não a separação horizontal.
- O ciclo clássico tem quatro poses por passo, com nome próprio em inglês —
  **contact, down, passing, up** — e o corpo fica mais BAIXO no *down* (logo após
  o pé tocar) e mais ALTO no *up*. São os termos que a literatura usa, e por isso
  os que o modelo reconhece.

## O chão: o que veio dos clássicos

Três coisas foram trocadas em `src/render.js` depois de estudar como StarCraft,
Age of Empires, Diablo e Celeste montavam terreno:

- **A variação do chão era `(x+y) % 2`** — um xadrez, o padrão que o olho pega
  mais rápido que qualquer outro. Virou ruído com semente: mesma variação, sem
  tabuleiro.
- **A textura cobre ~10 células em vez de 4** (`padrao.setTransform`). É a folha
  grande de terreno do AoE2: azulejo pequeno repete dentro do campo de visão,
  folha grande empurra a repetição para fora dele. Mesma imagem, custo zero.
- **`suavizarBordas`**: onde dois terrenos se encostam, o vizinho de maior
  prioridade vaza para dentro da célula por um gradiente e some no meio dela.
  É a ideia do `blendomatic` do AoE2 — eles pintam o vizinho através de máscaras
  e nunca desenham arte de borda. Sem isso, cada fronteira é um losango cortado
  a faca e o mapa inteiro lê como grade.

O que os clássicos fazem e **não** vale aqui: tiles de transição desenhados par a
par (N terrenos → N² conjuntos de arte), e espelhar arte isométrica — a luz está
pintada na imagem, e espelhar inverte a sombra.

Ainda na mesa, em ordem de valor: **dual grid de 16 peças** para a fronteira ter
forma, e não só gradiente; sorteio **ponderado** das variantes de ruína, como o
`rarity` do Diablo 2; e detritos espalhados com *jitter* em grade, carimbados uma
vez no canvas do terreno — é o que mais quebra a leitura do losango.

## Quadros de caminhada: o que já está e o que falta

`assets/unidades/operario-andar.webp` (4 quadros) e `operario-minerar.webp`
(4 quadros) estão no jogo. Quem escolhe o quadro ao andar é a **fase da passada**
— a mesma que avança por distância percorrida — e não o relógio: assim o quadro
de pé-no-chão cai quando o pé está de fato no chão. Os dois métodos se somam: o
desenho é autoral, o ritmo é calculado.

**Duas armadilhas que custaram tempo e valem ficar escritas:**

- **Não empilhe instruções no pedido.** Pedindo "copie a pose + braços colados +
  mãos livres" de uma vez, o modelo obedeceu os braços e devolveu as pernas
  paradas. Um pedido curto, só sobre a perna, com medida (*"pés afastados pela
  largura de dois ombros"*), resolveu na primeira.
- **Bob duplicado.** O sobe-e-desce do corpo já está NO DESENHO: o quadro de
  pernas abertas é mais curto que o de perna esticada, e recortados rente os dois
  se apoiam no mesmo pé. Somar por cima o bob que `anima.js` calcula aplica o
  movimento duas vezes, e o boneco pula em vez de andar. Por isso `spriteUnidade`
  desconta `pose.subir` no caminho dos quadros.

**As oito direções existem**, pelo método dos clássicos: cinco desenhadas
(`leste`, `nordeste`, `norte`, `sudeste`, `sul`) e três obtidas por espelhamento.
É o que o AoE fazia (5 de 8) e o StarCraft (17 de 32) — metade do círculo é o
espelho da outra. `Anima.prototype.direcao` converte o ângulo do MUNDO para o da
TELA (em isométrico um passo (dx,dy) anda `dx−dy` na horizontal e `(dx+dy)/2` na
vertical) e escolhe a tira. Frente e costas nunca são espelhadas: a mochila
saltaria de lado ao cruzar o eixo.

`arte/ferramentas/gerar-direcao.sh` gera uma direção, e `montar-tira.sh` recorta,
alinha e monta a tira. **Uma direção por pedido, sempre com a referência
anexada** — pedindo três de uma vez o modelo devolve uma só, e sem a referência
ele troca a cor do personagem (a vista de frente saiu cinza-verde na primeira).

**O andar é de PERNA DURA**, sem dobrar o joelho — as duas pernas ficam retas e
abrem no quadril como uma tesoura. Não é escolha estética: comparado lado a lado
com a versão de joelho dobrado, o de perna dura sai **muito mais consistente**
entre os quadros. Quanto menos o modelo tem que variar, menos ele erra; com
joelho, o corpo gira e o tamanho oscila de um desenho para o outro. E perna
rígida girando no quadril é exatamente o modelo de `anima.js`, então desenho e
conta do pé plantado falam a mesma língua.

Conferido peça por peça com Vision, em cinco critérios cada (cor, vista, passada,
perna reta, consistência): **23 de 25 pontos**. No jogo, **8 de 8 direções**.

Três coisas que só apareceram fazendo:

- **Girar uma vista pronta bate gerar do zero.** A diagonal traseira falhou três
  vezes pedida direto (devolveu uma figura só, com picareta). Mandando a vista de
  costas e pedindo *"gire o corpo 45° para a direita"*, saiu de primeira.
- **O coletor devolve a imagem ANTERIOR em silêncio** quando a geração falha —
  sudeste e nordeste saíram byte a byte idênticos. `gerar-direcao.sh` agora
  compara e avisa.
- **Corrigir um defeito por vez, apontando o defeito.** *"O braço está levantado,
  abaixe os dois"* funcionou; refazer tudo do zero, não.

## Ideias combinadas com o Pedro, ainda não feitas

- **Usinas no lugar do Gerador.** Hoje há um botão só, que dá 12 de energia e
  pronto — decisão nenhuma. No lugar, três ou quatro usinas com caráter próprio:
  solar (barata, fraca, ocupa área), eólica (média, exige terreno aberto),
  nuclear (cara, potente, explode ao ser destruída) e **fusão** (a de fim de
  campanha, altíssima potência, tecnologia III). Cabe no jogo sem tocar na
  economia.
- **O cristal virou PETRÓLEO** — ideia do Pedro, e foi a saída certa. Cristal
  alienígena é clichê de RTS espacial e não combina com Terra, 2050. Petróleo
  combina, e o melhor: **a mecânica não mudou uma linha**. Continuam dois
  recursos, o segundo continua raro, a Bomba de petróleo (id interno
  `extrator`) continua tendo que ficar em cima do afloramento. Trocaram-se
  nome, arte e cor (ciano → âmbar); os 27 testes e o
  equilíbrio dos seis setores seguem valendo.
  O caminho caro — trocar a MOEDA do jogo por energia — foi medido e descartado
  por ora: mexe em 15 arquivos, invalida 6 dos 27 testes (os que protegem a
  entrega física da carga) e obriga a remedir os seis mapas. E tira do jogo o
  vaivém do operário, que é o que faz o mapa importar.
