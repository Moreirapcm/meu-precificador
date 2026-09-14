# Conhecimento — o que a gente aprendeu para fazer este jogo

Não é enciclopédia. É o manual do NOSSO pipeline: cada documento termina
amarrando o que foi pesquisado aos arquivos que já existem no repositório, com
nome de função e número de linha. Quem ler um capítulo aqui tem de saber o que
mudar em `src/` ou em `arte/ferramentas/` na mesma hora.

A regra de escrita é uma só: **afirmação técnica vem com fonte**. O que não
tiver fonte é medição nossa, e aí diz onde foi medida.

| arquivo | assunto | serve para |
|---|---|---|
| [01 — pipeline de sprite isométrico](01-pipeline-sprite-isometrico.md) | como Age of Empires, StarCraft, Diablo II e Dead Cells transformam modelo em sprite: quantas direções, que formato, como resolviam a sombra | decidir quantas direções desenhar, como nomear e cortar as tiras |
| [02 — acabamento 2D](02-acabamento-2d.md) | o retoque que a Ensemble fazia à mão no Photoshop, traduzido em comando de ImageMagick: silhueta, redução, despill, paleta, sombra de contato | polir arte crua até virar sprite legível no tamanho de jogo |
| [03 — animação 2D de jogo](03-animacao-2d-jogo.md) | quantos quadros por estado nos clássicos, o que dá para animar deformando uma imagem só, e por que a passada avança por distância | decidir onde vale gastar quadro desenhado e onde o código resolve |
| [04 — painel de controle](04-painel-de-controle.md) | o console de baixo do StarCraft e do Age of Empires II pelos manuais: retrato, wireframe, os números que apareciam, a grade 3×3 de comandos, a fila de produção, seleção múltipla e minimapa | decidir o que a nossa barra de ações mostra, onde cada botão fica e o que a seleção de grupo permite fazer |
| [05 — seleção e controle de tropas](05-selecao-e-controle.md) | o vocabulário que StarCraft, Age of Empires e Total Annihilation fixaram — clique duplo, grupos de controle, fila com Shift, ponto de encontro, ocioso, attack-move, postura, formação — e como isso virou gesto de toque nos RTS de celular | decidir o que falta na nossa `ui.js` e qual gesto cabe em cada dedo |
| [06 — melhorias e blindagem](06-melhorias-e-blindagem.md) | a ferraria, a universidade e o mosteiro do Age of Empires II com custo e efeito de cada pesquisa; a fórmula de dano com duas blindagens e o mínimo de 1; os três níveis de arma e blindagem do StarCraft, os tipos de dano contra tamanho de unidade; e os quatro freios que impediam empilhar torre | decidir que ramos de pesquisa faltam em `data.js` e quanto cada degrau deve dar |
| [07 — inventário do gênero](07-inventario-do-genero.md) | o que StarCraft, Warcraft II e III, Age of Empires II, C&C, They Are Billions e Kingdom Rush tinham: herói, apoio, economia, apresentação, campanha, conforto e modos — com o que já temos medido no código | decidir o que entra na próxima lista de trabalho, por valor dividido por custo de arte |
| [08 — menu de construção](08-menu-de-construcao.md) | os DOIS botões do aldeão do Age of Empires II pelo manual de 1999 — *Buildings* e *Military Buildings* —, que prédio ia em cada um e em que era, como o prédio bloqueado ficava apagado no lugar, o transbordo por *More Buildings*, as teclas de cada prédio no clássico e na Definitive Edition, e a lista paginada por seta do Age of Empires I | decidir em quantos botões de categoria cabem as nossas 19 estruturas e o que muda em `UI.paginaConstruir` |
| [09 — a grade de construção do StarCraft](09-grade-de-construcao-sc.md) | as duas páginas de construção do SCV, Drone e Probe pelo manual de 1998 e pelas páginas de atalho da Blizzard: a grade 3×3 numerada, a letra de cada estrutura, o Cancelar na casa 9, o botão apagado por pré-requisito e a mensagem por falta de recurso — e o que o StarCraft II mudou | decidir quantas estruturas cabem numa página do nosso painel, como dividir as 19 em páginas e onde fica o Voltar |
| [10 — limpeza e alteração de terreno](10-limpeza-de-terreno.md) | como Age of Empires, StarCraft II, C&C Generals, OpenRA, 0 A.D., Supreme Commander/Spring, Factorio, Dwarf Fortress, Cities: Skylines, SimCity e Frostpunk mandam uma máquina derrubar, cortar e varrer células do mapa: escolher o próximo alvo pelo buscador de rota em vez de por distância de ladrilho, esperar em vez de banir a célula, comer o bloco pela borda, trabalhar de fora da célula sólida, ordem por arrasto de área e patrulha que limpa de passagem | entender por que o Trator de Limpeza limpa três ou quatro células e para, e o que muda na tarefa `limpar` de `sim-unidades.js` |
| [11 — o que ainda falta](11-o-que-falta.md) | a auditoria de 13/09/2026: cada item que os capítulos 04 a 10 apontam como padrão dos clássicos, confrontado com o código de hoje (arquivo e linha), dizendo se temos, se temos pela metade ou se não temos — mais o que já está igual ou melhor que o StarCraft e o Age of Empires | escolher o próximo trabalho por valor dividido por custo, sem repesquisar nada |
| [12 — sensação de jogo](12-sensacao-de-jogo.md) | a camada que ninguém lista e todo mundo sente: o turno de 200 ms do Age of Empires e o tick de 42 ms do StarCraft, a colisão de coletor desligada de propósito por falta de tempo, a caixa de 1,00 ladrilho do Dragoon contra a de 0,72 do Zealot, a mordida de 17 a 33% da vida por golpe nos dois clássicos, a trompa e o sino do manual do Age of Kings, e o que os dois remasters mudaram — e recusaram mudar | decidir se o problema é resposta (não é: respondemos em 33 ms), corpo (é: `andar` não vê outra unidade), mordida por golpe (14 tiros para matar um Predador) ou alerta de ataque (não existe) |
| [13 — cor e paleta](13-cor-e-paleta.md) | os 256 índices do Age of Empires II medidos no arquivo real (64 travados em cor de time, 191 sobrando para o jogo inteiro) e os 256 por cenário do StarCraft, onde a unidade é desenhada na paleta do terreno; a cor de time como escada de 8 degraus de valor, não de matiz; a sombra que escurece a cor do chão por tabela em vez de pintar preto; o contorno como camada de primeira classe nos três formatos; o rig de luz único; e o que os dois remasters mudaram e recusaram mudar | entender por que a nossa figura se aproxima do chão (contraste medido 1,30:1 nas estruturas, 1,45:1 nos inimigos), por que a luz do desenho briga com a sombra do código, e quais três ajustes em `render2.js` e `render.js` valem mais |
| [14 — contagem de quadros](14-quadros-de-animacao.md) | os números que o capítulo 03 não tinha, medidos nos arquivos dos próprios jogos: o `.dat` da Definitive Edition (30 quadros × 16 ângulos por animação, cadáver de 30 quadros a 1 s, 122 unidades de 1 592 com variação de parado) e o `iscript.bin` do Brood War (Marine com 8 quadros de andar e 8 de morrer, SCV sem caminhada nenhuma, torre do Siege Tank com zero `playfram`, 17 direções desenhadas e 15 espelhadas) — mais o que o Remastered **não** refez | decidir quantos quadros por animação valem a pena nas nossas 9 unidades e 8 invasores, em que ordem, e quais peças NÃO desenhar |
| [15 — terreno e prédios](15-terreno-e-predios.md) | o chão e a construção, que os capítulos 01 a 03 não cobrem: o ladrilho de 97×49 e os 100 desenhos por terreno do Age of Empires II, o `blendomatic` com 9 modos × 31 máscaras alfa e 4 variantes por direção "para evitar o padrão repetitivo", os 32×32 e os 16 megatiles por grupo do StarCraft, os 17 níveis de elevação contra os 3 do StarCraft, as 4 faixas de obra (0-25-50-75-100), o fogo que só começa abaixo de 2/3 da vida em `2n` degraus, o entulho que substitui o prédio, e a camada de máscara de dano que a Definitive Edition inventou | decidir o que fazer com `prepararTerreno`, `suavizarBordas` e `desenharEstrutura` — com a medição dos seis setores: 694 a 1228 cantos diagonais sem transição, 158 a 598 fronteiras ruína/escombro ignoradas, 20 de 20 prédios sem sombra e sem nada em movimento, e o prédio destruído que continua com a altura inteira |

## Como isto é usado

Quando aparecer uma dúvida de produção de arte — "quantas direções?", "por que
a unidade some no chão claro?", "vale animar a morte?" — a resposta está aqui, e
com fonte. Se não estiver, o capítulo cresce: pesquisa, medição no nosso
próprio jogo, e a conclusão amarrada ao arquivo que muda.

Três coisas que já saíram daqui e estão no jogo:

- o **contorno de silhueta** em `render2.js` (`spriteContornado`), que é o passo
  que faltava do pipeline do Age of Empires II;
- a **folha de cinco direções** para humanoide, e a descoberta medida de que o
  gerador NÃO faz isso para criatura e veículo — daí
  `gerar-direcoes-uma-a-uma.sh`;
- a decisão de **não desenhar cinco poses de tanque**: torre que gira é
  geometria, não desenho (`canhaoDeVeiculo`).
