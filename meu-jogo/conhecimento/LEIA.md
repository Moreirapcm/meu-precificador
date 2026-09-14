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
