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
