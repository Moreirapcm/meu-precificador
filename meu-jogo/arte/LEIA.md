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
| `extrator.png` | Extrator de cristais | 2×2 |
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
