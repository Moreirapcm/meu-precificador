# Última Fronteira — guia para trabalhar neste diretório

Jogo de estratégia em tempo real com defesa de base, Canvas 2D isométrico, em
português. Roda no navegador sem build e sem dependência. Implementa a expansão
descrita no documento de projeto *Última Fronteira* (edição 3.0); o jogo anterior
está preservado em `v2-referencia/` e não deve ser alterado.

## Rodar e verificar

```bash
python3 -m http.server 8000    # daqui; abre http://localhost:8000
node tests/aceitacao.cjs       # 27 testes de regra — precisa passar 27/27
node tests/equilibrio.cjs      # simula partidas inteiras nos 6 setores (~3 min)
node build.cjs                 # gera dist/ (arquivo único offline + página do artifact)
```

Rode `aceitacao.cjs` antes de qualquer commit. Ele é rápido e pega quase toda
regressão de regra. `equilibrio.cjs` não tem resultado "certo": é medição. O
padrão esperado é o diagnóstico do documento — empilhar torre não sustenta a
campanha; economia + tropas + pesquisa + reparo sustentam.

Depois de mexer em `src/`, rode `node build.cjs` para `dist/` não ficar velho.

## Regras de arquitetura

Três camadas, e a direção da dependência importa:

1. **Simulação** (`sim*.js`, `world.js`, `path.js`, `data.js`) — não desenha, não
   lê o DOM, não conhece a interface. Recebe comandos, valida, altera estado e
   publica eventos em `sim.eventos`.
2. **Apresentação** (`render*.js`, `audio.js`) — só lê o estado. Nunca escreve.
3. **Interface** (`ui*.js`, `mundo-ui.js`, `main.js`) — traduz toque e teclado em
   chamadas da simulação.

Um comando segue sempre: interface valida a intenção → simulação confere
requisitos → reserva ou cobra → altera estado → emite evento → apresentação
atualiza. **A interface nunca concede dano, minério, população ou tecnologia.**
Se aparecer `jogador.m +=` fora de `sim*.js`, é bug.

## Convenções de código

- **Português** em nomes, comentários e texto de interface. `estruturas`, não
  `buildings`.
- **Scripts clássicos com IIFE e `var`**, anexando em `window.UF`. Não é
  preferência estética: é o que faz o jogo abrir por `file://` com dois cliques,
  sem servidor. Não converter para módulos ES sem trocar também a forma de
  distribuir — `import` não funciona em `file://`.
- Sem dependências, sem npm, sem transpilador. `build.cjs` só concatena.
- Comentário explica **o porquê**, não o quê. O código já diz o quê.
- Números de equilíbrio ficam **todos** em `src/data.js`. Nada de constante de
  balanceamento solta no meio da lógica.

## Mapa dos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/util.js` | números, tempo, aleatório com semente (`rng`) |
| `src/data.js` | **todo o equilíbrio**: estruturas, unidades, invasores, pesquisas, setores |
| `src/geo.js` | contorno real dos continentes, projeção, coordenadas |
| `src/world.js` | terreno, malha urbana, rios, cratera, jazidas, névoa |
| `src/path.js` | A* em grade, com cerco e portões |
| `src/sim.js` | estado, posicionamento, muros, energia |
| `src/sim-unidades.js` | operários, tarefas, produção, pesquisa |
| `src/sim-combate.js` | combate, invasores, ondas, habilidades, `atualizar()` |
| `src/salvar.js` | serialização, progresso entre setores, exportar/importar |
| `src/render.js` | projeção isométrica, terreno, ruínas |
| `src/render2.js` | estruturas, unidades, efeitos, névoa, minimapa |
| `src/ui.js` | entrada por toque e teclado, ordens, construção |
| `src/ui2.js` | barra superior, ações contextuais, gaveta, modais |
| `src/mundo-ui.js` | mapa estratégico da Terra |
| `src/main.js` | montagem, troca de telas, laço principal |

Ordem dos `<script>` em `index.html` é dependência real: `util` → `data` → `geo`
→ `world` → `path` → `sim*` → `salvar` → `render*` → `audio` → `ui*` →
`mundo-ui` → `main`. `build.cjs` lê essa ordem do próprio HTML; para acrescentar
um arquivo, basta pôr a tag no lugar certo.

## Invariantes que os testes protegem

Quebrar qualquer uma destas é regressão, não escolha de design:

- Recursos e população nunca ficam negativos.
- Uma carga é entregue **uma única vez**; operário morto perde a carga.
- Entidade destruída não recebe ordem nova.
- Célula destruída libera a ocupação **na hora** (a brecha é transitável no mesmo
  quadro) e incrementa `world.versaoRota`.
- Reservas de recurso e população são liberadas ao cancelar.
- Projétil guarda o **id** do alvo, não só a posição.
- Confirmar um traçado de muro é atômico: valida tudo antes de cobrar qualquer
  coisa.
- Pesquisa não dá bônus antes de concluir; sem laboratório, pausa sem retroceder.

## Armadilhas conhecidas

- **`world.occ`** guarda o id da estrutura. Valor diferente de zero sem estrutura
  correspondente deve bloquear (é o que a validação de perímetro usa). Já houve
  bug aqui.
- **`world.versaoRota`** precisa subir sempre que a navegabilidade muda; é o que
  faz as unidades recalcularem rota. `ocupar()` já cuida disso.
- **Névoa** tem dois vetores: `explorado` (já visto, permanente) e `visivel`
  (agora). Inimigo fora de `visivel` não é desenhado; terreno explorado continua.
- **`podeColocar`** exige terreno explorado. Na fase de escolha da Central isso
  ainda não vale — use `podeColocarSemExploracao`.
- Custo de reparo é proporcional ao custo de construção; estrutura com
  `custo.m = 0` (posto abandonado) repara de graça, e isso é intencional.
- CSS: `[hidden]` perde para `display: flex`. Todo elemento escondido por atributo
  precisa de regra `[hidden] { display: none }` explícita.

## Próximos passos, em ordem de valor

1. **Equilíbrio dos setores 3 a 6.** É o que mais precisa de gente jogando. Tudo
   em `data.js`: `pressao` por setor, `orcamentoDaOnda()` em `sim-combate.js`,
   custo e dano das torres. Medir com `equilibrio.cjs` antes e depois.
2. **Tutorial do primeiro setor.** Hoje o jogador aprende por tentativa. Uma
   sequência curta de objetivos em Manaus resolveria.
3. **Arte.** O desenho é geométrico e procedural. Substituir por sprites mantém a
   simulação intacta — `render*.js` é a única camada que muda.
4. **Diretor de invasão mais esperto.** Hoje a composição é sorteada dentro de um
   orçamento. Reagir à defesa do jogador (mais voadores contra base sem
   antiaéreo, mais cerco contra muralha) tornaria as ondas menos repetitivas.
5. **Som.** É sintetizado em `audio.js`, sem trilha.

## O que não fazer

- Não mexer em `v2-referencia/`: é o jogo anterior, preservado como referência.
- Não adicionar dependência ou etapa de build sem necessidade real.
- Não desativar teste para passar no verde.
- Não mudar número de equilíbrio "no olho" sem rodar `equilibrio.cjs` e comparar.
