# Última Fronteira

Jogo de defesa de base em português, Canvas 2D com visual isométrico.

## Revisão de combate

Invasores atacam torres destrutíveis e o núcleo de forma contínua. Oito tipos de inimigo, blindagem real, fogo de área, alcance mínimo, ataques aéreos e Matriarca com fúria e bombardeio anunciado. Torres exigem tempo de construção/evolução; reparos são graduais. Bombardeio localizado e escudo compartilham energia. A preparação entre ondas dura 24 segundos.

## Executar

Sirva dist/ com um servidor HTTP estático. review/Ultima-Fronteira.html é uma cópia autocontida para revisão local, com cenário e scripts incorporados. Fontes online são opcionais, com alternativas locais. Recarregar reinicia a partida; o recorde v2 é local ao dispositivo.

## Controles

Toque em uma defesa e em uma plataforma. Toque no inimigo para marcar prioridade. Bombardeio requer um segundo toque no terreno. Escudo e reparo da linha são ações de um toque. Espaço pausa, 1–4 escolhem torres, E evolui, R repara a selecionada, B mira bombardeio, S ativa escudo.

## Verificação

- node tests/combat.cjs: dano, destruição, reparo, pausa, projéteis, blindagem, ar, habilidades, pesquisa, temporizador e chefe.
- node tests/balance.cjs: quatro estratégias; defesa ativa em três sementes, sem recursos adicionais. Resultados em research/balance-results.json.
- node tests/interface.cjs: inicialização, referências de interface e chamadas de renderização durante combate em contexto simulado.

Não houve QA visual ou sessão humana em navegador. WebMCP não foi validado em contexto real compatível.

## Pesquisa

research/Estudo-StarCraft.md contém análise das sete fontes oficiais da Blizzard, diagnóstico, decisões de adaptação e limites das simulações. Os valores de equilíbrio são próprios deste jogo, não de StarCraft.
