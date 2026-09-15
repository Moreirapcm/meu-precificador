# 11 — O que ainda falta

Auditoria de 13/09/2026. Não é pesquisa nova: é o confronto entre o que os
capítulos 04 a 10 documentaram nos clássicos e o que o **código tem hoje**, lido
arquivo por arquivo. Cada linha da tabela cita onde eu olhei.

Método, para quem for conferir:

- li `src/data.js`, `src/sim.js`, `src/sim-unidades.js`, `src/sim-combate.js`,
  `src/ui.js`, `src/ui2.js`, `src/render.js`, `src/render2.js`, `src/world.js`,
  `src/main.js`, `src/salvar.js`, `index.html`, `style.css` e o `CLAUDE.md`;
- rodei `node tests/aceitacao.cjs` → **28 passaram, 0 falharam**;
- **não alterei nada em `src/`**;
- o que aparece aqui como proposta minha, sem capítulo de origem, está marcado
  com *(proposta minha)* e justificado.

**A primeira notícia é boa e precisa ser dita antes da lista:** boa parte do que
os capítulos 04, 05, 08 e 09 listavam como falta **já foi feita** entre a
pesquisa e hoje — casa fixa de comando, letra de atalho no botão, fila de
produção na barra, duplo toque, botão de ocioso com contador e ciclo, paginação
da construção por categoria, pesquisa morando na estrutura, e as duas causas do
travamento do trator (D1 e D2 do capítulo 10). A seção final lista isso item por
item. A tabela abaixo é só o que **sobrou**.

## Como ler as colunas

- **custo** — mesma régua do capítulo 07: *barato* = só simulação, interface ou
  som, cabe numa tarde; *médio* = sistema inteiro, ou reaproveita arte
  existente; *caro* = arte nova desenhada (unidade/estrutura), pelo cálculo do
  capítulo 03.
- **valor** — o que muda para quem está jogando, não o que fica bonito no
  código.
- A ordem é **valor dividido por custo**. Os **cinco primeiros estão marcados
  `PRÓXIMO`**.

---

## A tabela

| # | item | o que o clássico fazia (cap.) | o que temos hoje (arquivo:linha) | falta o quê | custo | valor |
|---|---|---|---|---|---|---|
| 1 **FEITO** | **`penetracao` ignora a blindagem inteira** | AoE II: subtração por canal com piso de 1; SC: subtração e depois multiplicador, piso de 0,5. A metade da blindagem é um efeito desenhado, não um acidente (**cap. 06 §2.1, §6.2, §9.2**) | o texto em `data.js:309` promete *"ignora metade da blindagem"*; o disparo marca **as duas bandeiras**, `perfura: true` e `metadeBlindagem: true` (`sim-combate.js:164-165`), e `aplicarDano` faz a subtração **dentro de `if (!opts.perfura)`** (`sim-combate.js:233`) — o `blind *= 0.5` é calculado e jogado fora | decidir qual é o comportamento desejado e fazer uma coisa só. Se for "metade", basta **não** marcar `perfura` na linha 164 | barato (1 linha) | alto — contra Matriarca (`blind: 10`) e Titã (`blind: 8`) a diferença é o dobro do efeito prometido. É **defeito**, não ausência |
| 2 **FEITO** | **Linha de blindagem pesquisável** | AoE II: três linhas de três degraus, **+3 normal / +4 perfurante**, ataque e blindagem destravam na mesma idade e custam parecido. SC: Carapace/Plating em três níveis, e a blindagem custa **mais** que a arma (**cap. 06 §1.3, §5.4**) | `PESQUISAS` tem 13 entradas em 4 ramos (`data.js:286-317`) e **nenhuma toca blindagem**. As tropas têm `blind` fixo — Fuzileiro 0, Incendiário 1, Lanceiro 2, Tanque 3 (`data.js:151-211`) — enquanto os invasores vão de 0 a **10** (`data.js:219-267`). `aplicarDano` já subtrai (`sim-combate.js:231-233`) | dois degraus de **+1** num ramo novo `blindagem`, com preço subindo como no SC. Medir com `equilibrio.cjs` antes e depois | barato (só `data.js` + o gancho que já existe) | **muito alto** — é a metade que falta do nosso próprio sistema de dano. Hoje o jogador só tem alavanca ofensiva (`precisao`, `penetracao`) e nenhuma defensiva para a tropa |
| 3 **FEITO** | **Ponto de encontro sobre recurso (e por tipo)** | SC II/WC III/AoE II: rally em cima da jazida e o trabalhador **nasce minerando**. Browder: mover o trabalhador à mão *"does not create an interesting choice, because it's the same all the time"* (**cap. 05 §4, cap. 07 §3 e §6**) | `b.rally` é só `{x, y}` (`ui.js:812`, `sim.js:277`) e a unidade nova recebe `mover`/`moverAtacando` (`sim-unidades.js:651-654`). Existe o botão global "Distribuir" (`ui2.js:344`), que é outra coisa | guardar `{tipo:'jazida'\|'unidade', id}` no rally, e tratar o **alvo que morre** (a Blizzard documenta os dois casos, cap. 05 §4). Junto: rally por tipo — soldado vai à linha, operário à jazida | barato | alto — mata um toque repetido **por unidade produzida**, e no celular cada toque custa o dobro |
| 4 **FEITO** | **Minimapa que aceita ordem, e alerta que leva a câmera** | SC e AoE II: clicar na minimapa com tropa selecionada **manda a tropa**; C&C: a voz de alerta já nasce com a coordenada e faz `On_Ping`; SC II: barra de espaço centra no último aviso (**cap. 04 §6, cap. 07 §4**) | `irPeloMini` só chama `centralizarEm` (`ui.js:197-205`). O contato vira efeito **no campo**, não na minimapa, e não é clicável (`main.js:290`, `render2.js:847`). `desenharMinimapa` (`render2.js:1238`) não tem ponto piscando nem modos de exibição | converter a coordenada da minimapa e chamar `ordemNoTerreno`, que está no mesmo arquivo; piscar o ponto do contato na minimapa; tocar no aviso leva a câmera | barato | alto — hoje o jogador sabe **que** há contato e não sabe chegar lá a tempo |
| 5 **FEITO** | **Postura de combate persistente** | AoE II: agressiva, defensiva (persegue poucos ladrilhos e **volta ao ponto de origem**), parada, sem ataque. Num jogo de defesa o padrão deve ser defensiva (**cap. 05 §8, cap. 07 §6**) | a coleira existe, mas **embutida e fixa**: `defender` e `patrulhar` usam `tarefa.raio \|\| 7` (`sim-combate.js:477-482`), e não há campo de postura em lugar nenhum (`grep` em `src/`: só `anima.js:201`, que é pose de desenho) | um campo na unidade, quatro valores, e um botão na casa livre da grade de tropa (`CASAS_TROPA`, `ui2.js:110`) | barato | alto — resolve o caso real de tropa que sai do muro atrás de um bicho, e dá ao jogador uma decisão que hoje é nossa |
| 6 **FEITO** | **Construir por cima já manda limpar** | Spring: *"should be resolved automatically by the constructing unit"*; AoE II: a fundação derruba a árvore isolada (**cap. 10 §6.3, P14**) | `construivel` exige `T.ASFALTO` (`world.js:75-80`); o jogador tem de limpar antes, à mão, com o trator | **feito** em `sim.js` (`podeColocar` devolve `limpar`), `sim-unidades.js` (`agendarObra`, `atenderObrasPendentes`) e `salvar.js`. Descoberto de quebra: `CRATERA` vale 3, o mesmo que `ESCOMBRO`, e a recusa "Cratera: terreno irregular" era na verdade a recusa do entulho | barato | alto — o trator é novo e esta é a fricção que ele criou |
| 7 **FEITO** | **Blindagem e vida para estrutura** | AoE II *Masonry* + *Architecture*: **+20% de vida e +2/+2 de blindagem** em todo prédio; a Watch Tower **nasce** com 1/7 (**cap. 06 §3, §3.1**) | nenhuma entrada de `ESTRUTURAS` tem a chave `blind` (`data.js:22-140`): torre, muro e Central absorvem dano cheio. `muroReforcado` dá só **vida**, e só a `def.muro` (`sim.js:298`) | **feito**: `blind` base em toda estrutura (`data.js`, 2 em muro/portão/Central, 1 no resto — torre baixa de propósito) e a pesquisa `alvenaria`, +1 de blindagem e +10% de vida em tudo que já está de pé (`reforcarEstruturas`). Medido: padrão de vitória/derrota idêntico nos 12 jogos, e a única mudança foi Mérida linha completa indo de 7/13 para 8/13 — ganho do lado certo, "só torres" não andou em setor nenhum | barato, mas exige `equilibrio.cjs` | alto — é o efeito não-linear da subtração, que separa o que mata operário do que mata Titã |
| 8 **FEITO** | **Guarnição em torre/estrutura** | AoE II: até 5 unidades dentro; torre vazia atira 5 flechas, guarnecida chega a 21. SC: o Bunker **não atira**, guarnece 4 e dá +1 de alcance (**cap. 06 §8.2, cap. 07 §2**) | não existe nada de guarnição em `sim*.js` | **feito**: `guarnicao` em `data.js` (torre 4, Bastião 5, Torre de muralha 2, Central 10), e `guarnecer`/`desocupar`/`atualizarGuarnicao` em `sim-combate.js`. Quem entra SAI de `sim.unidades` — foi o que barateou tudo, porque são 48 laços de unidade e marcar bandeira exigiria lembrar dela em todos. Em troca, `recalcularPop` e `salvar.js` olham `sim.guarnecidas`. Toque na própria estrutura guarnece; `x` desocupa | barato | médio-alto — esconde operário do ataque, dá lugar seguro ao ferido e transforma torre em investimento de tropa |
| 9 | **Veterania de tropa (3 divisas)** | C&C Generals: Veteran/Elite/Heroic, **+20% de cadência e +10% de dano** por posto, auto-cura nos dois últimos (**cap. 07 §3**) | não existe `xp` nem posto em `sim*.js` | um campo na unidade, um incremento em `matar`, três divisas por cima do sprite (`render2` já compõe HUD sobre a figura) | barato | médio-alto — dá motivo para **preservar** tropa, que é a *fodder unit* que Pardo quis eliminar |
| 10 | **Tira de membros clicável na seleção múltipla** | SC: clicar num wireframe seleciona **só aquele**; Shift tira só ele do grupo. AoE II: mesma coisa para desguarnecer (**cap. 04 §5**) | com mais de um selecionado, a barra escreve `"Operário · 7"` e para por aí (`ui2.js:307-313`). O remendo de hoje é a precedência soldado-sobre-operário (`ui.js:367-373`) | a tira de ícones em `#barraAcoes`, com clique agindo só no membro | barato | médio-alto — resolve *tirar um operário de uma seleção mista*, que hoje é impossível |
| 11 | **Aura / bônus de área** | WC III *Devotion Aura*: +1,5 de armadura em raio fixo, passiva, sem clique; auras iguais **não somam** (**cap. 07 §2**) | não existe | um `for` de distância em `S.atualizar` e um círculo desenhado no chão | barato | médio-alto — faz posicionar tropa valer alguma coisa, sem sprite novo |
| 12 | **Varredura por energia tática (*Scanner Sweep*)** | SC: 50 de energia revela 20×20 por 15 s e **dá detecção** ali (**cap. 07 §2**) | temos as duas metades soltas: o Radar com `visao: 17` (`data.js:84-88`) e a energia tática que paga bombardeio e escudo (`data.js:403-405`, `sim-combate.js:758-772`) | uma terceira habilidade no mesmo molde das duas que já existem | barato | médio — revela e antecipa sem desenhar nada |
| 13 | **Fim do alcance mínimo (*Murder Holes*)** | AoE II: 200 comida + **100 pedra** elimina o alcance mínimo de torres e castelos (**cap. 06 §3**) | `artilharia` tem `alcMin: 2.2` e `tanque` `alcMin: 2` (`data.js:131, 211`), e o recuo forçado está em `sim-combate.js:483-487`. Nenhuma pesquisa cura isso | uma pesquisa pequena no ramo `fortificacao`, custando barris (`c`), que é o nosso recurso escasso | barato | médio — resolve frustração real: a Artilharia fica muda quando o Predador encosta |
| 14 | **Alcance como linha própria de pesquisa** | AoE II Fletching/Bodkin/Bracer: **+3 de ataque e +3 de alcance**, e a torre é beneficiada junto. SC: U-238 dá +1 ao marine, Charon +3 ao goliath (**cap. 06 §1.2, §5.4**) | `precisao` mistura tudo num **+18% de dano** para torre *e* soldado (`data.js:306`, aplicado em `sim-combate.js:122`); só `artilhariaAv` mexe em alcance, e só nas armas de área | um `+1 de alcance` separado, sobre alcances de 6 a 10 | barato | médio — muda o comportamento tático sem mexer na aritmética do dano, que é mais fácil de equilibrar |
| 15 | **Separar `precisao` em torre e tropa** | AoE II podia melhorar a torre junto com o arqueiro **porque cobrava pedra**; o SC simplesmente não melhora defesa estática (**cap. 06 §8.1, §8.2, §9.4**) | uma pesquisa só beneficia os dois (`sim-combate.js:122`), e a torre custa o mesmo minério de tudo — não temos o recurso separado que fazia o freio funcionar | duas pesquisas, cada uma com o seu preço | barato (uma linha de dado) | médio-alto — é a mudança mais barata que ataca o diagnóstico "empilhar torre não sustenta a campanha" |
| 16 | **Melhoria da unidade de apoio** | AoE II *Illumination* (fé volta 87,5% mais rápido) e SC *Caduceus Reactor* (+50 de energia): apoio não ganha potência, ganha **número de usos** (**cap. 06 §4, §7**) | o Médico tem `cura: { taxa: 14, alc: 4, reserva: 320 }` (`data.js:196`) e **nenhuma pesquisa o toca** | uma pesquisa de +50% de reserva — o porte exato do Caduceus | barato | médio |
| 17 | **Dizer na tela que a pausa aceita ordem** | They Are Billions fez disso a ideia central: pausar para decidir (**cap. 07 §6**) | **já funciona e ninguém sabe**: `main.js:270-278` só congela o relógio, e `ui.js` não consulta `pausado` em lugar nenhum | uma linha no modal de pausa e no "Como se joga" | barato | médio — desbloqueia um recurso que já está pago |
| 18 | **Modo desafio com restrição + estrela** | Kingdom Rush *Iron/Heroic*: o **mesmo mapa** com uma restrição, nenhuma arte nova. AoE III *Art of War*: medalha por critério (**cap. 07 §7**) | guardamos recorde por setor (`salvar.js:168-177`) e o mapa-múndi existe (`mundo-ui.js`) | a restrição e a estrela na tela do mapa | barato | médio-alto — rejogabilidade sem desenhar nada |
| 19 | **Upkeep (imposto sobre exército grande)** | WC III: 0–50 comida = 100% de renda, 51–80 = 70%, 81–100 = 40%. *"High Upkeep is MEANT to be very punishing"* (**cap. 07 §3**) | temos o teto (`popInicial: 12`, Alojamento +10) e **nenhum imposto** (`sim.js:159-175`) | três linhas na entrega de carga e um aviso no HUD | barato, mas exige `equilibrio.cjs` | médio-alto — pune o exército parado sem proibi-lo. Risco real de desequilíbrio: medir antes e depois |
| 20 | **Missão de escolta — o herói de custo zero** | WC II: *"prevent your heroes from dying and/or escort them to a Circle of Power"*. O herói funcionava pela **regra da missão**, não pelo número (**cap. 07 §1**) | condição de vitória é fixa por modo (`sim-combate.js:788-803`); os setores têm só `objetivo` em texto (`data.js:323-390`) | uma condição de vitória a mais num setor | barato | alto — **testa se o jogador se apega antes de desenhar qualquer herói**. Se ele não ligar, economizamos a arte inteira |
| 21 | **Busca de alvo do trator pelo grafo de rota** | OpenRA: a busca de alvo **é** o pathfinder; AoE2 DE Update 50292: *"pathing distance instead of tile distance"* (**cap. 10 D3, P1, P2**) | `celulaLimpavelProxima` varre anéis de Chebyshev e aceita a primeira que passa em `limpavel && encostavel` (`sim-unidades.js:575-592`); `encostavel` só pergunta se existe vizinho livre (`569-573`) — "tem vizinho livre" não é "dá para chegar lá" | usar `nav.buscar` como busca, não só como locomoção. Feito isso, a lista negra e a espera deixam de ser necessárias | médio | médio-alto — hoje o trator ainda escolhe alvo inalcançável primeiro, porque o inalcançável costuma estar mais perto |
| 22 | **Âncora da ordem de limpeza parada** | 0 A.D. guarda `initPos` e procura nos **dois** centros; OpenRA prioriza `lastHarvestedCell → doca → self` (**cap. 10 D4, P5**) | `tarefa.area` recorta a busca (`sim-unidades.js:586`, `ui.js:743-786`) mas o **centro ainda é o trator** (`sim-unidades.js:307`): cada célula limpa move o raio | guardar o ponto onde a ordem foi dada e usar os dois centros | barato | médio |
| 23 | **Reserva de célula entre tratores** | OpenRA `ResourceClaimLayer`: a célula reservada **nem aparece** como candidata (**cap. 10 D5, P12**) | nada marca a célula como tomada; dois tratores com a mesma ordem escolhem a mesma, e `w.livre` (`world.js:83-88`) nem olha unidades, então o segundo pode tomar o posto do primeiro | um mapa de reservas dentro do predicado da busca | barato | médio — só aparece com dois tratores, que é o caso que o jogador vai criar |
| 24 | **Patrulhar limpando de passagem** | Supreme Commander: *"reclaim (…) automatically included in the patrol (…) any trees, rocks or wreckage within range"* (**cap. 10 §6.2, P13**) | o trator nunca patrulha: `ordemNoTerreno` desvia ele para `limpar` ou `mover` antes disso (`ui.js:647-657`) | dar ao trator o ramo da patrulha, limpando o que estiver ao alcance | barato | médio — **elimina a escolha de alvo, e com ela a classe inteira de travamento** |
| 25 | **Gestos de área que faltam na limpeza** | DF tem retângulo **e** pincel **e** borracha; Cities: Skylines fixa o tipo pelo primeiro alvo; Spring deixa o jogador escolher entre terminar e esperar (`Alt`) (**cap. 10 D8, P8/P9/P11**) | temos o retângulo por arrasto, com a conta ao vivo (`ui.js:743-757`, `concluirAreaLimpeza` 759). Só existe "terminar" quando a lista esvazia (`sim-unidades.js:315-319`) | pincel, borracha, tipo fixo pelo primeiro alvo, e a escolha terminar/esperar | barato cada um | médio |
| 26 | **Fila de ordens (Shift / encadear)** | SC: *"hold down the shift button and issue commands"* — anda, constrói, ataca em sequência; SC II enfileira quase tudo (**cap. 05 §3, cap. 07 §6**) | `darTarefa` **substitui** `u.tarefa` sempre (`sim-unidades.js:46-57`); `grep shiftKey` em `src/` não acha nada | `u.filaTarefas`, um teto de comandos, o desenho do trajeto — e, no celular, um botão "encadear" que fica ligado durante a sequência | médio (é estrutural) | alto para quem vem do PC, médio no celular |
| 27 | **Shift+número, número duas vezes, Shift+clique** | SC: `Ctrl`+número grava, número chama, **número duas vezes centra**; SC II: `Shift`+número **soma** ao grupo; Shift+clique soma à seleção (**cap. 05 §2, §9**) | `gravarGrupo`/`chamarGrupo` fazem só as duas primeiras operações (`ui.js:426-451`); o ramo de teclado não olha `e.shiftKey` (`ui.js:267-273`) | guardar o instante da última chamada (centrar) e um ramo com Shift (somar) | barato | médio — e como **não temos teto de seleção**, o capítulo 05 §9 avisa que o grupo deixa de ser atalho e vira a interface principal |
| 28 | **Página de construção que não rola** | Nem o SC nem o AoE rolaram nunca: teto por página e uma casa gasta com "próxima". A casa que anda o dedo não decora (**cap. 08 §4, cap. 09 §4**) | já paginamos por categoria (`ui2.js:445-492`) e o Voltar é o primeiro, sempre visível (`ui2.js:447`) — mas `defesa` tem **8 estruturas + Voltar** numa tira com `overflow-x:auto` e `.acao { min-width: 62px }` (`style.css:194-197`): a 390 px ainda rola | ou partir `defesa` em duas, ou reduzir o botão, ou duas linhas. A regra a copiar é "a página não passa do que cabe", não o número 8 | barato | médio |
| 29 | **Letra mnemônica em cada estrutura** | AoK 1999: `B` + a letra do prédio (House `E`, Tower `T`); SC: cada casa da grade tem letra, escolhida pela **colisão** (Bunker é `U`) (**cap. 08 §6, cap. 09 §3**) | o `botao()` sabe desenhar a letra (`ui2.js:156-158`) e os comandos a têm — mas as estruturas em `paginaGrupo` (`ui2.js:483`) não recebem `tecla` nenhuma, e não há atalho de teclado por prédio | uma letra por estrutura em `data.js` e o ramo no teclado | barato | médio no notebook, baixo no celular |
| 30 | **Degrau de torre (Watch → Guard → Keep)** | AoE II: **o custo de construção não muda**, todas as já construídas sobem juntas, o alcance nunca sobe pelo degrau (**cap. 06 §3.1**) | nossas torres são modelos independentes comprados do zero (`data.js:104-139`); a Sentinela fica obsoleta e é demolida | uma pesquisa que troque a ficha das torres existentes | médio | médio-alto — salva o investimento inicial e cria a decisão "subo as sete que tenho ou construo duas Artilharias?" |
| 31 | **Sistema de gatilho (condição → ação)** | SC: *"A trigger will run when all of its conditions are met"* — e meia dúzia de peças escreve campanha inteira (**cap. 07 §5**) | condição fixa por modo (`sim-combate.js:788-803`); `objetivo` é texto (`data.js:329`) | um avaliador pequeno de `{quando, então}` em `sim.js`, com cinco condições: chegar a um lugar, ter N de recurso, ter N de um tipo, perder N de um tipo, passar T segundos | médio | alto — **destrava tutorial, objetivo secundário e missão de escolta de uma vez** |
| 32 | **Tutorial encaixado no setor 1** | O gênero inteiro concorda: ensina-se jogando. É o item nº 2 da nossa própria lista no `CLAUDE.md` (**cap. 07 §5**) | não existe nada | com gatilho é **dado**, não código: "quando tiver 2 operários minerando → peça um Alojamento" | médio (barato depois do gatilho) | alto para quem chega |
| 33 | **Herói (Comandante), forma mínima** | WC II: *"based on a certain unit, but different stats and a unique portrait"*. Kingdom Rush: nível zera a cada fase, sobe até 10, volta sozinho ao morrer. WC III: pesquisa normal **não** melhora o herói, e herói morto **não** dá bônus (**cap. 07 §1**) | não existe. E a conta de Pardo já bate: nosso campo de batalha tem o tamanho que o herói exige (`popInicial: 12`, Alojamento +10) | corpo do Fuzileiro recolorido, três níveis por partida, duas habilidades, sem item; ~80 linhas em `sim-unidades.js` + `data.js` | médio | **muito alto — apego e foco.** Mas fazer **depois** do item 20: a escolta testa o apego de graça |
| 34 | **Meta-progressão entre setores** | They Are Billions: pontos ganhos nas missões compram melhorias permanentes fora da partida (**cap. 07 §5**) | o gancho existe — `concluidos` e `recordes` por setor (`salvar.js:158-177`) | a árvore fora da partida | médio | alto — é o que faz perder um setor não apagar a noite do jogador |
| 35 | **Retrato grande na barra de seleção** | SC: o retrato é vídeo `.SMK`; a Blizzard manteve as silhuetas no Remastered *"because we wanted you to immediately recognize them"* (**cap. 04 §2, cap. 07 §4**) | não existe; a barra mostra nome, vida em barra e número, e estado (`ui2.js:228-241`) | um recorte do sprite por unidade | médio | **baixo-médio, e o capítulo 04 §7 é honesto sobre isso**: é a única peça do painel clássico que **não** carrega informação exclusiva. Último item da lista de arte |
| 36 | **Roda de comando no toque longo** | Feral no Company of Heroes móvel: *"tap and hold to bring up the Command Wheel"*, desenhada para celular (**cap. 05 §10, cap. 07 §6**) | o toque longo **já é** a caixa de seleção (`ui.js:71-79`) — há conflito real de gesto | decidir antes: toque longo em unidade = roda, no vazio = caixa. Não trocar um gesto que funciona sem medir | médio | médio-alto no celular, **mas com decisão pendente** |
| 37 | **Fala de unidade** | WC II/SC organizavam falas em categorias fixas — *Ready*, *Yes*, *Pissed*. Decidimos rádio em vez de voz, e a decisão está escrita em `audio.js:15` (**cap. 07 §4**) | rádio sintetizado, por decisão registrada | `speechSynthesis` do navegador, zero download — mas depende do aparelho e tem de ser opcional | barato | médio — é a assinatura do gênero, e o único item cuja ausência foi uma **escolha** nossa, não um esquecimento |
| 38 | **Formações** | AoE II: linha, caixa, dispersa, flanco — cada uma contra uma ameaça concreta; "dispersa" existe porque grupo colado morre junto para dano em área (**cap. 05 §7**) | `ordemNoTerreno` distribui os destinos numa grade 3×3 (`ui.js:642`), que é uma "caixa" acidental | espaçamento e ordem de fila, não IA | barato | **baixo hoje** — vale quando houver mais dano em área do lado inimigo. Está aqui para não ser esquecido, não para ser feito |
| 39 | **Modos da minimapa** | SC: `Tab` esconde o terreno *"may make it easier to spot enemy units"*; AoE II: Normal/Combate/Economia (**cap. 04 §6**) | um modo só (`render2.js:1238`) | os modos | barato | baixo agora — é a resposta pronta para quando a minimapa ficar poluída, não antes |
| 40 | **Teto de seleção** | SC 12, AoE II 40→60. O post do patch 2.5 mostra que o limite era **de simulação**, disfarçado de interface (**cap. 04 §5, cap. 05 §9**) | não temos (`selecionarNaCaixa`, `ui.js:356-382`) | nada, por enquanto | barato | **baixo — e a escolha atual está certa.** Só vale se `equilibrio.cjs` ou o celular mostrarem queda de quadro |
| 41 | **Transporte** | SC Shuttle: **8 espaços**, unidade grande ocupa 4; destruído, *"the units inside will also perish"* (**cap. 07 §2**) | temos água e mapas de ilha (Manhattan, `data.js:369-378`), e nada de transporte | a nave nova | médio (sprite) | médio — só rende em mapa de água |
| 42 | **Detector + invasor invisível** | SC: torre estática que enxerga sempre **e** poder gastável de 15 s. Duas respostas, não uma (**cap. 07 §2**) | o Radar é a metade fixa pronta (`data.js:84-88`) | o invasor invisível — que é arte nova | caro | médio — a ameaça é nova, mas o preço é desenho |
| 43 | **Escaramuça contra IA construtora** | *"skirmish matches in which players can face AI enemies"* (**cap. 07 §7**) | não existe adversário que construa: as ondas vêm de `orcamentoDaOnda` (`sim-combate.js:659`) | uma IA de construção inteira | caro | **baixo para este jogo — o capítulo 07 recomenda NÃO fazer** |
| 44 | **Comércio / mercado** | AoE II: lotes de 100 com taxa de 30%, cotação global (**cap. 07 §3**) | não existe | um modal e uma curva de preço | barato, **mas arriscado** | baixo — pode desmontar a trava de tecnologia que o petróleo representa. Proposta, não recomendação |
| 45 | **Desfazer** | Raríssimo no gênero: tempo real não desfaz (**cap. 07 §6**) | reembolso de 60% ao cancelar (`data.js:406`) | nada | — | **nenhum — não fazer** |
| 46 | *(proposta minha)* **Escala de interface em três tamanhos** | o capítulo 07 §6 lista o item como falta, sem fonte de clássico — é conforto moderno, não padrão do gênero | `safe-area` só cobre a borda de baixo (`style.css:19`); o HUD é de tamanho fixo, com `.acao { min-width: 62px; height: 58px }` (`style.css:197`) | uma variável CSS `--ui` e um seletor de três posições | barato | médio — **justificativa:** o Pedro joga no celular e no notebook, e a mesma barra serve os dois hoje. É o item que eu levantaria sem fonte |

---

## O defeito medido, em detalhe

É a linha 1 da tabela e merece ser dita fora dela, porque é a única coisa nesta
auditoria que está **errada** e não apenas **ausente**:

```js
// src/sim-combate.js:164-165 — o projétil recebe as DUAS bandeiras
perfura: !!arma.perfura || (origem.lado !== 'inimigo' && !!this.jogador.pesquisas.penetracao && Math.random() < 1),
metadeBlindagem: origem.lado !== 'inimigo' && !!this.jogador.pesquisas.penetracao,

// src/sim-combate.js:231-233 — e a subtração está dentro do if
var blind = (alvo.def && alvo.def.blind) || 0;
if (opts.metadeBlindagem) blind *= 0.5;
if (!opts.perfura) dano = Math.max(dano * 0.12, dano - blind);
```

Com `penetracao` pesquisada, `perfura` fica verdadeiro, o `blind *= 0.5` é
calculado e **descartado**, e a blindagem inteira é ignorada. O texto que o
jogador lê diz outra coisa (`data.js:309`). O capítulo 06 §9.2 já tinha
registrado o achado, sem alterar nada — e continua assim. De quebra,
`Math.random() < 1` na mesma linha é sempre verdadeiro e não faz nada: é ruído
que sobrou.

Não toquei. Fica a decisão: se o desejado é "metade", basta não marcar `perfura`
na linha 164; se é "ignora tudo", o texto de `data.js:309` é que está errado.
Qualquer dos dois muda números — `equilibrio.cjs` antes e depois.

---

## Onde já estamos iguais aos clássicos, ou melhores

Isto não é consolo: é o outro lado da conta, medido no mesmo código.

**Igual aos clássicos, feito depois da pesquisa:**

- **Casa fixa de comando** (`ui2.js:110-128`, `montarCasas` 169) — é a grade 3×3
  do StarCraft, com o comando ausente deixando buraco em vez de promover o
  vizinho. Era, palavra do capítulo 04, "a nossa maior distância dos clássicos".
- **Letra de atalho dentro do botão** (`ui2.js:156-158`) — o `<u>` do `botao()`.
- **Fila de produção na faixa de baixo, com cancelamento por item**
  (`ui2.js:698-718`) — o desenho do AoE II *à letra*: o item da fila **é** o
  botão de cancelar, sem confirmação.
- **Campos de posição fixa na seleção** (`ui2.js:228-241`) — vida em barra +
  número, nome e estado, cada um no seu lugar, no lugar da linha de texto
  corrida.
- **Duplo toque = todos do mesmo tipo na tela** (`ui.js:392-421`), com o escopo
  certo (tela, não mapa) e Ctrl+clique como variante, exatamente como o SC II.
- **Botão de ocioso com contador e ciclo de um em um** (`ui2.js:183-193`,
  `ui.js:490-509`) — as três partes que o capítulo 05 §5 diz que raramente vêm
  juntas: contador visível, ciclo com a câmera junto, e `,` para pegar todos.
- **Paginação da construção em vez de rolagem** (`ui2.js:445-492`), com
  **bloqueado apagado e presente**, e **recurso que falta NÃO desabilitando** —
  que é a distinção exata do *manual SC, p. 15*, e evita o defeito que a
  Definitive Edition tem até hoje.
- **Pesquisa morando na estrutura que a abriga** (`data.js` campo `casa`,
  `ui2.js:648-664`) — o modelo do AoE II: ferraria faz arma e armadura, mosteiro
  faz as do monge. Dá segundo emprego a prédio que só tinha um.
- **Intervalo mínimo entre alertas** (`sim-combate.js:360-371`) — é o
  `SpeakAttackDelay` do código aberto do C&C, com trava por unidade **e** trava
  global. O fórum do AoE II reclama até hoje de aviso demais; nós não temos esse
  problema.
- **Névoa com os três estados** (`explorado` permanente, `visivel` agora) e
  **oclusão de unidade atrás do prédio** (`render.js:697-731`, `desenharVultos`)
  — este último era o item de melhor valor/custo da seção de apresentação do
  capítulo 07, e está feito.
- **Contorno de silhueta** (`render2.js:292`) — o passo que faltava do pipeline
  do AoE II.

**Melhor que os clássicos, e dá para defender:**

- **A caixa de seleção no toque não exige dois dedos** (`ui.js:71-79`): toque
  longo e pronto. O porte do Company of Heroes exige *"a double-tap with two
  fingers followed by a drag"*, e a crítica bateu nisso — nós fizemos melhor.
- **Reserva de recurso e de população no ato de enfileirar**
  (`sim-unidades.js:619-624`): o AoE II cobra na entrada da fila, mas nós também
  reservamos **população**, o que elimina a fila fantasma que ele tem.
- **O preço escrito no botão** (`precoDe`, `ui2.js:754`) em vez do *heads-up* ao
  passar o cursor: num jogo de toque não existe "passar o dedo por cima", e
  mostrar é melhor. O capítulo 09 chama isso de "uma das poucas coisas em que o
  toque é melhor que o mouse".
- **O `Esc` faz UMA coisa por vez** (`ui.js:217-232`): volta um nível de cada
  vez. No AoE II o mesmo `Esc` abre o menu, limpa a seleção e cancela a fundação,
  e a comunidade reclama desde o beta.
- **O projétil guarda o id do alvo** e não erra (`sim-combate.js:161`,
  `atualizarProjeteis` 173): o *Ballistics* do AoE II custava 300 madeira + 175
  ouro para resolver o que aqui nunca foi problema — e ainda emitimos o impacto
  no chão quando o alvo morre no caminho, para o tiro não sumir no ar.
- **O piso de dano é proporcional (12%)** e não um mínimo absoluto
  (`sim-combate.js:233`): num jogo com tiro de 5 e tiro de 106, o piso fixo de 1
  do AoE II ou de 0,5 do SC seria arbitrário. Esta é escolha nossa e é melhor
  para o nosso caso.
- **Atacar-movendo é o clique simples** (`ui.js:667`): a conclusão do capítulo 05
  §6 é que o jogador quer isso 90% das vezes, e nós já tínhamos chegado lá antes
  da pesquisa. O `mover` puro é que tem botão e tecla.
- **"Feridos" como grupo rápido** (`ui.js:593-609`, tecla 4): não tem paralelo
  nos clássicos. É nosso.
- **Fogo concentrado por toque no inimigo** (`ui.js:344-347`, `alvoPrioritario`):
  também não tem nome consagrado no gênero.
- **A tropa nova sai do prédio protegida** (`sim-unidades.js:653`): soldado
  recebe `moverAtacando` e operário recebe `mover` — a distinção que o capítulo
  05 §6 diz que separa exército que briga de exército que morre marchando.
- **O aviso de travamento é honesto** (`ui.js:472-484`): o nosso "ocioso" inclui
  a unidade **bloqueada**, que é pior que ociosa porque *acha* que está
  trabalhando. O AoE II levou até o Update 153015 para tratar isso.
- **Pausa que aceita ordem** (`main.js:270-278`): They Are Billions vende isso
  como a ideia central do jogo. Nós temos e não contamos a ninguém — o que é o
  item 17 da tabela.

---

## O que esta auditoria recomenda NÃO fazer

Com fonte, para não voltar à mesa:

- **Desfazer** — tempo real não desfaz; o reembolso de 60% já é o substituto
  honesto (cap. 07 §6).
- **Escaramuça contra IA construtora** — caro, e o jogo não foi desenhado para
  isso (cap. 07 §7).
- **Rank e Kills no painel** — bonitos no StarCraft, mas não mudam regra
  nenhuma. O mesmo espaço rende mais com carga, rota bloqueada e alvo atual
  (cap. 04 §7).
- **Tecla posicional da Definitive Edition** — obriga `Q` a significar duas
  coisas conforme a página ativa (cap. 08, "o que NÃO copiar").
- **Trocar o toque longo da caixa de seleção pela roda de comando sem decidir
  antes** — é exatamente o erro que o `CLAUDE.md` da casa proíbe: abandonar um
  caminho que funciona por outro que não foi medido.
- **Mudar qualquer número desta lista "no olho"** — `equilibrio.cjs` antes e
  depois. Blindagem, upkeep e veterania mexem exatamente no que aquele teste
  mede.
