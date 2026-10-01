# Última Fronteira — protótipo jogável

Estratégia em tempo real com defesa de base, em visão isométrica, rodando no
navegador. Feito a partir do documento de projeto *Última Fronteira — Projeto
completo* (edição 3.0) e da versão 2 anexada nele.

A ação se passa em **cidades reais da Terra**, semidestruídas pela invasão.
Cada setor usa as coordenadas verdadeiras do lugar e o terreno é gerado a partir
da geografia dele: rios, baía, morros, deserto, ilha e a borda da cratera de
Chicxulub. O mapa estratégico desenha os continentes com dados de contorno do
Natural Earth (domínio público).

## Como jogar

**Já publicado:** abra o link do jogo no celular ou no computador. Nada para instalar.

**Do código, em casa:**

```bash
# a partir desta pasta:
python3 -m http.server 8000     # ou: npx serve .
# abra http://localhost:8000
```

**Offline, um arquivo só:**

```bash
node build.cjs                  # gera dist/ultima-fronteira.html
```

`dist/ultima-fronteira.html` é autossuficiente: dá para mandar por WhatsApp,
salvar no celular e abrir com dois cliques, sem internet e sem servidor.

## Os seis setores

| # | Setor | Lugar real | O que ensina |
|---|-------|-----------|--------------|
| 1 | Porto de Manaus | Manaus, AM · 3°08'S 60°01'O | Economia básica e primeiro perímetro |
| 2 | Zona Portuária do Rio | Rio de Janeiro, RJ | Proteger a rota de extração |
| 3 | Marginal Tietê | São Paulo, SP | Cerco em malha urbana densa |
| 4 | Cairo · Margem do Nilo | Cairo, Egito | Defesa antiaérea em terreno aberto |
| 5 | Ilha de Manhattan | Nova York, EUA | Frente estreita, sem recuo |
| 6 | Mérida · Cratera de Chicxulub | Yucatán, México | A Matriarca |

Cada setor é liberado ao concluir o anterior. Modos: campanha, sobrevivência e
construção livre.

## O que está implementado

- **Mapa livre:** escolha do local da Central em qualquer área 4×4 válida, com
  visor que explica o motivo quando o lugar não serve.
- **Economia física:** o minério só vira recurso quando a carga chega a um
  depósito. Operário morto perde a carga.
- **Operários:** mineram, constroem, reparam e exploram; fogem do combate quando
  não receberam ordem manual.
- **Muros e portões:** traçado por arraste com custo antes de confirmar; portão
  abre para aliados e fecha com inimigo perto; muro destruído vira brecha
  transitável na hora e os invasores recalculam a rota.
- **Cerco:** sem caminho até o alvo, o invasor derruba o obstáculo alcançável
  mais próximo em vez de ficar parado.
- **Energia elétrica:** capacidade distribuída a cada quadro, com prioridade
  para as torres; a produção avançada pausa primeiro.
- **Tropas:** seis unidades, fila com reserva de recursos e população, ponto de
  encontro, e ordens de mover, atacar em movimento, patrulhar e recuar.
- **Tecnologia:** treze pesquisas em quatro ramos; o efeito vale para o que já
  existe e para o que vier depois.
- **Invasores:** os oito arquétipos da versão 2, com blindagem, área, ácido,
  voo e a Matriarca.
- **Postos abandonados:** ruínas de bases que resistiram antes de você; um
  operário reativa cada uma sem custo de minerais.
- **Salvamento:** autosave a cada 30 s, ao pausar e ao sair; exportação em
  arquivo para levar o progresso a outro aparelho.

## Controles

**Toque:** tocar seleciona · tocar no terreno com tropas selecionadas dá a ordem ·
arrastar em espaço vazio move a câmera · pinça aproxima · muro tem modo próprio
de arraste.

**Teclado:** `espaço` pausa · `B` construir · `M` mover · `A` atacar em movimento ·
`R` reparar linha · `Q` bombardeio · `W` escudo · `E` velocidade · `Esc` cancela ·
`1`–`4` grupos rápidos.

## Verificação

```bash
node tests/aceitacao.cjs    # 27 testes do plano da página 24 do documento
node tests/equilibrio.cjs   # simula partidas inteiras em todos os setores
```

`aceitacao.cjs` cobre entrega única da carga, brecha após destruir muro, obra
que exige construtor, jazida esgotada, depósito destruído, população reservada,
pesquisa interrompida, unidade aérea, identidade do alvo do projétil, salvar sob
ataque e recursos nunca negativos.

`equilibrio.cjs` joga sozinho duas estratégias em cada setor. O resultado
esperado reproduz o diagnóstico do documento: repetir torres não sustenta a
campanha; economia, tropas, pesquisa e reparo sustentam.

## Como o código está organizado

A simulação não desenha nada e não lê a interface. A apresentação só lê estado.

```
src/util.js          números, tempo, aleatório com semente
src/data.js          catálogo: estruturas, unidades, invasores, pesquisas, setores
src/geo.js           contorno real dos continentes e coordenadas
src/world.js         terreno, malha urbana, rios, cratera, jazidas, visibilidade
src/path.js          A* em grade, com cerco e portões
src/sim.js           estado, validação de posicionamento, muros
src/sim-unidades.js  operários, tarefas, produção, pesquisa
src/sim-combate.js   combate, invasores, ondas, habilidades, ciclo principal
src/salvar.js        serialização, progresso, exportação
src/render.js        projeção isométrica, terreno, ruínas
src/render2.js       estruturas, unidades, efeitos, névoa, minimapa
src/audio.js         som sintetizado, sem arquivos externos
src/ui.js            entrada por toque e teclado, ordens, construção
src/ui2.js           barra superior, ações contextuais, gaveta, modais
src/mundo-ui.js      mapa estratégico da Terra
src/main.js          montagem e laço principal
```

Um comando segue sempre o mesmo caminho: interface valida a intenção →
simulação confere requisitos → reserva ou cobra → altera estado → emite evento →
apresentação atualiza. A interface nunca concede dano, minério ou tecnologia.

## Equilíbrio

Os números vivem todos em `src/data.js`. Os valores atuais são um ponto de
partida medido por simulação, não um balanceamento final: mexer neles é a parte
que mais precisa de gente jogando.

## Versão 2

`v2-referencia/` guarda o jogo anterior extraído do PDF, preservado como
referência e ponto de retorno. É outro jogo: doze ondas sobre doze plataformas
fixas, sem mapa livre nem economia física.
