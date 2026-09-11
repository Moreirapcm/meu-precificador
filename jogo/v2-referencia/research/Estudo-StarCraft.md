# StarCraft e o redesenho de Última Fronteira

## Conclusão

A principal fragilidade da primeira versão de Última Fronteira era a ausência de oposição às próprias defesas. As torres não tinham integridade nem podiam ser destruídas. O adversário percorria uma rota fixa, sofria disparos e só descontava vida do núcleo se chegasse ao final. Não havia uma batalha entre duas forças: havia uma corrida entre a resistência dos inimigos e a capacidade de dano das torres.

O redesenho transforma esse percurso em combate. Invasores escolhem estruturas próximas, atacam à distância ou em contato e continuam agredindo o núcleo depois de alcançá-lo. A resposta envolve cobertura de fogo, reparos, composição de defesas, prioridade de alvos, pesquisa e habilidades limitadas por energia. A apresentação continua isométrica em 2D, com efeitos de profundidade, sem exigir controles de câmera ou seleção complexa de exércitos.

O objetivo é incorporar princípios de estratégia em tempo real mantendo uma interface adequada a sessões no celular. O resultado permanece um jogo de defesa por ondas com identidade própria. Não reproduz integralmente StarCraft, suas unidades, mapas, personagens ou regras competitivas.

## Escopo e qualidade das referências

As referências são páginas oficiais da Blizzard sobre StarCraft e StarCraft II. Os guias de StarCraft II consultados foram publicados em 2010–2012; as páginas do jogo clássico pertencem ao arquivo oficial. São evidências históricas adequadas para entender o funcionamento e os princípios de projeto, não uma descrição garantida do equilíbrio competitivo de setembro de 2026.

A distinção entre as duas gerações é mantida ao longo da análise. O comportamento do Siege Tank clássico, por exemplo, serve de referência para especialização e vulnerabilidade, sem transferir valores de dano ou alcance para uma regra supostamente atual de StarCraft II. Nenhuma conclusão depende de uma lista de unidades competitivas vigente ou de um patch recente.

As afirmações sobre a versão anterior e a implementação nova derivam da inspeção do projeto e de simulações locais. As decisões de dificuldade, durações, economia e efeitos são propostas de design para Última Fronteira, não números extraídos da Blizzard.

## 1. O que produz decisões relevantes em StarCraft

### Economia e combate disputam a atenção

A Blizzard descreve macro como a administração conjunta de produção, recursos e posicionamento geral, enquanto micro trata do controle das unidades e do uso de suas capacidades em combate. A qualidade da decisão depende das duas escalas. [1]

A adaptação utiliza um único recurso de construção, além de energia para intervenções. Isso preserva a disputa entre investir no futuro e sobreviver agora sem exigir trabalhadores individuais, gás, suprimentos e múltiplas filas. O jogador escolhe se compra uma torre, recupera uma estrutura danificada ou fica temporariamente com menos créditos para financiar pesquisa. Durante uma batalha, também decide onde concentrar fogo e quando gastar energia.

O princípio de projeto é que uma compra precisa criar uma oportunidade e abrir mão de outra. Uma melhoria que aumenta todos os números instantaneamente e sem comprometer a defesa tem pouca força estratégica. Por isso, pesquisa e evolução passam a levar tempo; a torre em evolução deixa de disparar durante seis segundos.

### Crescimento precisa de proteção

O guia oficial da economia Zerg apresenta o conflito entre aumentar a produção econômica e manter tropas suficientes. Também destaca a importância de reconhecer ameaças antes de decidir quanto é seguro investir e recomenda preservar unidades usadas em incursões. [2]

No jogo redesenhado, a mineração aumenta a renda, mas usa os mesmos créditos que comprariam reparos ou uma nova defesa. Não há renda passiva durante a preparação inicial, evitando esperar indefinidamente para enriquecer. Após uma onda, a preparação dura 24 segundos. Antecipar a invasão oferece um pequeno bônus, mas reduz o tempo disponível para recuperar a linha.

O temporizador é uma adaptação própria ao formato de ondas. Seu propósito é manter o ritmo e criar um custo para indecisões, não reproduzir um modo específico de StarCraft. A pausa continua disponível para analisar o campo ou interromper uma sessão.

### Posição altera o resultado

O guia de posicionamento da Blizzard discute cercos, formações, gargalos e a vulnerabilidade de forças agrupadas a dano em área. O espaço pode permitir que mais unidades atirem, proteger unidades frágeis ou expor um grupo ao ataque pelos flancos. [3]

Última Fronteira mantém três corredores legíveis e plataformas fixas. O jogador não precisa desenhar paredes ou comandar trajetórias individuais. Em compensação, a localização deixa de ser puramente uma pergunta sobre alcance: uma torre avançada pode ser atacada cedo, enquanto uma torre de retaguarda preserva a defesa final e tem menos tempo para atingir o avanço inimigo.

As rotas de uma onda são informadas no campo. Invasores terrestres podem abandonar temporariamente o corredor para combater uma estrutura próxima; os voadores seguem para o núcleo. Isso permite que uma mesma disposição seja boa contra uma composição e inadequada contra outra.

### Especialização exige proteção

O Siege Tank do StarCraft clássico combina alcance elevado e dano de área no modo de cerco com vulnerabilidade a ataques muito próximos. O guia recomenda apoio de outras unidades e reparos; também explica limitações como ausência de ataque aéreo. [4]

A Artilharia de Última Fronteira recebe alcance superior, explosão em área e distância mínima de disparo. Não atinge voadores. A Sentinela é uma defesa de disparo rápido capaz de atingir solo e ar; Gelo limita o avanço terrestre; Plasma responde à blindagem e também atinge alvos aéreos. Essa divisão cria dependências compreensíveis em quatro opções.

A proposta não importa todas as regras do tanque clássico. Não há fogo amigo nem alternância manual entre modos, para evitar punições pouco claras na interface de toque. A fraqueza de curta distância aparece visualmente na área de alcance da torre selecionada e no texto de sua função.

### Preservar estruturas é parte do combate

A documentação oficial dos SCVs descreve construção, extração e reparos pagos em unidades e estruturas Terran elegíveis. Reparar pode sustentar uma estrutura sob ataque, em vez de esperar pela sua destruição. [5]

Na adaptação, cada torre tem vida própria e permanece danificada entre ondas. Reparos levam cinco segundos e não interrompem os disparos. O comando de reparo da linha reúne as torres elegíveis, mostra o custo e inicia os mesmos reparos individuais. Não repara estruturas ainda em construção ou evolução, nem restaura instantaneamente torres destruídas.

O núcleo possui um reparo separado: 180 pontos ao longo de sete segundos por 75 créditos. O cuidado com a retaguarda continua sendo uma decisão; a regeneração gratuita de 5% por onda da versão anterior foi retirada.

### Tecnologia não substitui uma defesa viável

O guia oficial de erros comuns alerta para o risco de avançar na árvore tecnológica cedo demais, desatender o combate e colocar estruturas defensivas em lugares sem valor estratégico. Também recomenda considerar o estado de saúde das unidades e a utilidade das melhorias. [6]

A implementação possui três níveis tecnológicos. Plasma depende do segundo; os níveis tecnológicos permitem níveis superiores de torre. Uma pesquisa demora entre oito e dez segundos, e há uma pesquisa global por vez. É possível continuar construindo enquanto ela ocorre, desde que existam recursos.

O objetivo não é obrigar uma única ordem de construção. É tornar visível a diferença entre desbloquear uma ferramenta e possuir força suficiente para sobreviver até usá-la. As simulações verificam que o desbloqueio não ocorre antes da pesquisa terminar.

### Unidade cara não equivale a invulnerabilidade

O guia clássico do Battlecruiser enfatiza o tempo e os recursos comprometidos em unidades caras e a necessidade de preservá-las, apoiá-las e repará-las. [7]

Esse princípio orienta o valor emocional da torre evoluída. Um Plasma avançado representa investimento acumulado e pode ser perdido. Salvá-lo com escudo e reparo passa a ser uma pequena vitória dentro da onda. O indicador de torres perdidas e o relatório final tornam esse custo visível sem depender apenas da porcentagem do núcleo.

## 2. Diagnóstico da primeira versão

A inspeção encontrou seis causas concretas para a sensação de pouca emoção:

| Problema observado | Consequência no jogo | Correção aplicada |
|---|---|---|
| Torres sem vida | A defesa montada não podia perder poder por ataque | Integridade, ataque inimigo e destruição de torres |
| Dano apenas no fim da rota | Os inimigos não ameaçavam a linha de defesa | Alvos próximos, ataques repetidos e projéteis hostis |
| Desaparecimento após atingir o núcleo | Uma invasão era uma perda pontual, não um cerco | Inimigos permanecem e continuam atacando |
| Preparação sem limite após cada onda | Era possível neutralizar a pressão do ritmo | Preparação de 24 segundos com pausa disponível |
| Pulso global | Um botão afetava todos os inimigos sem escolha espacial | Bombardeio localizado com energia e atraso de impacto |
| Identidade pouco distinta entre inimigos | As respostas exigiam pouca adaptação | Blindagem, explosivos, ataque aéreo, cerco e chefe com fases |

A simulação usada na versão anterior demonstrava que uma estratégia conseguia vencer com 100% do núcleo em todas as ondas. Esse teste confirmava que havia uma condição de vitória, mas não avaliava suficientemente a existência de ameaça ou a importância da intervenção. O novo critério precisa medir perdas e diferença entre estilos de jogo, não apenas a possibilidade de chegar ao fim.

## 3. Sistema de combate implementado

### Tipos de invasor

| Invasor | Comportamento | Resposta disponível |
|---|---|---|
| Predador | Avança, aproxima-se das torres e ataca em contato | Fogo rápido e cobertura entre torres |
| Corredor | Move-se depressa e tem pouca resistência | Sentinela e controle de avanço |
| Cuspidor | Dispara ácido de fora do alcance da Sentinela básica | Artilharia, Plasma ou bombardeio localizado |
| Detonador | Aproxima-se e explode perto das estruturas | Prioridade de alvo, Gelo e ataque antes do contato |
| Couraçado | Suporta disparos pequenos por sua blindagem | Plasma, que ignora essa redução |
| Asa corrosiva | Ignora a frente terrestre e ataca o núcleo pelo ar | Sentinela e Plasma na retaguarda |
| Titã de cerco | Combina blindagem, resistência e ataque a distância | Defesas complementares, reparo e escudo |
| Matriarca | Entra em fúria, chama reforços e anuncia bombardeios | Concentrar fogo, reservar energia e reagir aos avisos |

Não existe aplicação automática de dano para simular emoção. O dano resulta de ataques, impactos e explosões. Uma defesa eficiente ainda pode proteger completamente o núcleo. Isso é desejável: o desafio deve permitir que boas decisões previnam perdas, sem criar uma taxa invisível de dano inevitável.

A correção de identidade dos alvos é importante: um projétil disparado contra uma torre destruída não pode atingir automaticamente outra torre construída depois na mesma plataforma. Cada estrutura possui sua própria identidade, validada no impacto.

### Intervenções simples

O toque no inimigo marca um alvo prioritário. Apenas torres com alcance e capacidade compatíveis atendem à marcação. Ela não concede alcance adicional nem permite à Artilharia atingir voadores.

O bombardeio exige 50 pontos de energia. Primeiro o jogador escolhe a habilidade; depois toca no terreno. O impacto ocorre depois de 0,85 segundo, em uma região de raio definido, e atordoa temporariamente sobreviventes. A espera e o raio dão importância ao movimento do alvo. A energia é debitada uma vez na confirmação, e uma nova tentativa durante a recarga é recusada.

O escudo custa 35 pontos de energia, protege o núcleo e as torres por oito segundos e reduz o dano recebido em 70%. Ele não é imunidade e não restaura estruturas destruídas. A recarga impede uso permanente.

A energia recarrega durante o combate, até o máximo de 100. Como as habilidades compartilham esse recurso, bombardear agora pode impedir o uso imediato do escudo. Essa é uma adaptação de design própria, não uma regra atribuída a StarCraft.

### Progressão e recuperação

A campanha continua com 12 ondas. As ameaças se acumulam gradualmente: fogo corrosivo na segunda onda, explosivos na terceira, o primeiro Titã na quarta e incursões aéreas na quinta. A oitava utiliza dois Titãs; a última introduz a Matriarca.

Construir leva de 3,5 a cinco segundos. Evoluir uma torre leva seis segundos, com disparos suspensos durante a obra. O dinheiro pode ser aplicado em armamento, blindagem, mineração, tecnologia ou reparo. As recompensas foram ajustadas depois das simulações para sustentar reconstruções sem remover a possibilidade de colapso.

A venda devolve apenas parte do investimento e considera a saúde restante da estrutura. Assim, vender repetidamente uma torre danificada não funciona como reparo gratuito. Construir uma defesa muito avançada continua sendo um risco calculado, não um investimento permanentemente garantido.

## 4. Efeitos 2D e sensação de profundidade

O campo mantém o cenário ilustrado original. A camada de combate usa desenho isométrico em Canvas 2D, ordenação dos objetos pela profundidade, laterais de estruturas, sombras no solo e alturas distintas para unidades voadoras. É uma apresentação com aparência de volume, frequentemente chamada de 2,5D; não é uma reconstrução tridimensional completa.

Os projéteis de Artilharia percorrem um arco antes de atingir a região escolhida. Disparos corrosivos têm cor e trajetória diferentes das armas humanas. Plasma utiliza um traço luminoso rápido. As explosões geram fragmentos e anéis de impacto, enquanto estruturas comprometidas exibem dano e fumaça.

Os sinais visuais têm funções específicas. A barra de vida mostra a situação de cada unidade ou estrutura; números de impacto ajudam a perceber dano; o contorno do núcleo indica situação crítica; a marcação do inimigo mostra a prioridade ativa. Os bombardeios da Matriarca exibem uma área de risco antes do impacto, dando tempo para usar o escudo.

Os efeitos sonoros são sintetizados e separados por evento. A opção de silenciar continua disponível. A preferência do dispositivo por movimento reduzido suprime tremores e flashes de dano mais fortes. A interface mantém pausa automática quando a página perde visibilidade.

O jogo oferece controles rápidos de construção, bombardeio, escudo e reparo da linha perto do campo, evitando que ações urgentes dependam apenas do painel inferior em telas menores. A intenção é fazer a urgência vir da batalha e da decisão, não da dificuldade de encontrar um botão.

## 5. Verificação e equilíbrio

### Critérios funcionais

Os testes verificam dano repetido ao núcleo, destruição real de torres, reparo gradual, congelamento da simulação durante pausa, identidade de projéteis, efeito da blindagem, penetração de Plasma, restrição antiaérea, custo de energia, raio do bombardeio, desbloqueio tecnológico, início automático das ondas e fases da Matriarca. Também verificam os estados terminais de vitória e derrota.

O teste de destruição coloca uma estrutura sob ataque e confirma que a plataforma fica vazia. O teste de núcleo confirma que o invasor permanece vivo depois de atacar, podendo continuar o cerco. Esses testes cobrem diretamente a reclamação de ausência de dano.

### Cenários de estratégia

Simulações determinísticas usam as mesmas regras de economia e combate do jogo, sem recursos extras ou invulnerabilidade. Elas comparam inação, repetição de um único tipo de torre, mistura sem habilidades e intervenção ativa. A estratégia ativa executa decisões programadas em intervalos de 1,25 segundo, incluindo reparos; não equivale a um teste com pessoas e representa uma execução consistente.

| Cenário / semente | Resultado | Dano acumulado no núcleo | Torres perdidas |
|---|---|---:|---:|
| Sem novas defesas / 71 | Derrota na onda 1 | 600 | 1 |
| Repetição de Sentinelas / 71 | Derrota na onda 4 | 600 | 17 |
| Defesas variadas, sem reparo e habilidades / 71 | Derrota na onda 8 | 600 | 31 |
| Defesa ativa / 71 | Vitória na onda 12 | aproximadamente 91 | 22 |
| Defesa ativa / 7319 | Vitória na onda 12 | 0 | 14 |
| Defesa ativa / 42 | Vitória na onda 12 | aproximadamente 17 | 11 |

Valores de dano em cenários de derrota representam o dano efetivamente aplicado, limitado à vida restante; arredondamentos podem ocorrer na apresentação. Os resultados completos e reproduzíveis devem ser consultados junto aos testes do projeto.

A existência de uma vitória com núcleo intacto não repete o defeito anterior: nesse cenário, a estratégia perdeu 14 torres e dependeu de reparos e habilidades para manter a retaguarda. O núcleo protegido é resultado possível de uma defesa ativa. Os números não são uma taxa de vitória de jogadores, nem provam que a dificuldade será ideal para todas as pessoas.

### Limitações e avaliação posterior

A verificação executada nesta revisão é programática. Não houve sessão visual no navegador nem avaliação humana de conforto dos controles, intensidade percebida, qualidade sonora ou legibilidade em aparelhos específicos. A integração WebMCP também não foi validada em um contexto real de navegador compatível.

A próxima avaliação com uma pessoa deve observar se o primeiro dano é compreendido, se o jogador sabe por que perdeu uma torre, se consegue acionar reparos a tempo e se identifica a resposta aos voadores. Se a derrota parecer arbitrária, deve-se ajustar o aviso ou a resposta disponível antes de simplesmente aumentar os recursos iniciais.

A campanha permanece local à página: recarregar reinicia a partida. O recorde desta revisão é armazenado separadamente no dispositivo, evitando misturar uma campanha antiga mais fácil com a nova regra de combate. Não foram adicionados pagamentos, compras internas ou dependências de serviços de inteligência artificial para jogar.

## Referências

1. Nethaera / Blizzard Entertainment. [The Big Picture on Macro and Micro](https://news.blizzard.com/en-gb/article/9975570/the-big-picture-on-macro-and-micro), 14 de setembro de 2010. Definições de macro, micro e sua relação com combate e economia.
2. Nebu / Blizzard Entertainment. [Game Guide: Zerg: Economy](https://news.blizzard.com/en-us/article/5838583/game-guide-zerg-economy), 1º de fevereiro de 2012. Escolha entre economia, defesa, reconhecimento e preservação de forças.
3. Nebu / Blizzard Entertainment. [Game Guide: Unit Positioning](https://news.blizzard.com/en-us/article/6640646/game-guide-unit-positioning), 4 de fevereiro de 2012. Formações, cercos, gargalos e vulnerabilidade a dano de área.
4. Blizzard Entertainment. [StarCraft Compendium: Siege Tank](https://classic.battle.net/scc/terran/ut.shtml), arquivo oficial, data de publicação não informada. Especialização, alcance mínimo, limitações e apoio ao tanque clássico.
5. Blizzard Entertainment. [StarCraft Compendium: SCV](https://classic.battle.net/scc/terran/uscv.shtml), arquivo oficial, data de publicação não informada. Construção e reparo de unidades e estruturas elegíveis.
6. Nebu / Blizzard Entertainment. [Game Guide: Common Mistakes](https://news.blizzard.com/en-us/article/4552958/game-guide-common-mistakes), 2 de janeiro de 2012. Momento da pesquisa, cuidado com unidades, defesa de locais relevantes e atenção ao combate.
7. Blizzard Entertainment. [StarCraft Compendium: Battlecruiser](https://classic.battle.net/scc/terran/ub.shtml), arquivo oficial, data de publicação não informada. Custo de unidades valiosas, apoio e reparos.

Referências consultadas em 10 de setembro de 2026. Código analisado: versão inicial do projeto Última Fronteira e revisão de combate desta entrega.
