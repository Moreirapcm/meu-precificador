# Briefing para o Claude Code: App Android "PDV + Fiado"

> Documento para colar ou passar ao Claude Code rodando no notebook (Linux Mint).
> Leia tudo antes de começar e siga as etapas em ordem.

## 1. Contexto

- Dono: pequeno empreendedor (delivery/cardápio, vendas no Mercado Livre).
- Já existe um **PDV que roda no notebook**. O objetivo é levá-lo para o **celular Android** e publicar na **Google Play**.
- O diferencial do app é o **Fiado**: vender "na conta" do cliente e cobrar pelo WhatsApp.
- Ambiente: Linux Mint, Claude Code instalado, celular Android ligado no USB com **Depuração USB** ativa.

## 2. Objetivo

Criar um app Android **offline-first** (funciona sem internet) que faça:
1. Vendas rápidas (PDV).
2. Controle de fiado por cliente.
3. Cobrança pelo WhatsApp.

Ele deve ser instalado e testado direto no celular via ADB.

## 3. Etapa 0: Preparar o ambiente

Verifique antes de tudo e instale o que faltar, **pedindo confirmação antes de usar `sudo`**:

```bash
adb version || sudo apt install adb android-sdk-platform-tools-common
adb devices        # precisa listar o celular como "device"
java -version      # JDK 17 é necessário para build Android
```

- Se o `adb devices` mostrar `unauthorized`, peça ao usuário para desbloquear o celular e aceitar o aviso.
- Se mostrar `no permissions`, rode `sudo usermod -aG plugdev $USER` e peça para ele sair e entrar de novo na conta.
- Instale o JDK 17 (`openjdk-17-jdk`) e o Android SDK command-line tools se necessário (`sdkmanager "platforms;android-35" "build-tools;35.0.0"`).

## 4. Etapa 1: Analisar o PDV existente

1. Pergunte ao usuário **onde está a pasta do PDV atual** e leia o código.
2. Faça um resumo para o usuário com:
   - Tecnologia usada (HTML/JS, Python, Delphi, etc.).
   - Funcionalidades existentes.
   - Onde e como os dados são salvos.
   - O que dá para reaproveitar.
3. **Escolha da tecnologia do app:**
   - Se o PDV for **web (HTML/JS)**: use **Capacitor** e reaproveite a interface.
   - Se for outra coisa: use **Kotlin + Jetpack Compose + Room (SQLite)**.
   - Explique a escolha ao usuário em linguagem simples e **espere o OK** antes de começar.

## 5. Funcionalidades do MVP (primeira versão)

### PDV
- Cadastro de produtos: nome, preço, código de barras (opcional), categoria, estoque (opcional).
- Tela de venda com busca rápida, grade de produtos, quantidade e desconto.
- Formas de pagamento: **Dinheiro (com troco), Pix, Cartão, Fiado**.
- Histórico de vendas e resumo do dia (total por forma de pagamento).

### Fiado
- Cadastro de cliente: nome, telefone (WhatsApp) e observação.
- Venda com pagamento "Fiado" exige cliente e lança o débito na conta dele.
- Registro de pagamento parcial ou total.
- Extrato do cliente: compras, pagamentos e saldo.
- Lista de devedores ordenada por **valor** e por **dias em atraso**.
- Botão **"Cobrar no WhatsApp"**: abre `https://wa.me/55<telefone>?text=<mensagem>` com uma mensagem educada, saldo e resumo. O usuário edita antes de enviar.
- Limite de crédito opcional por cliente, com aviso ao ultrapassar.

### Geral
- Funciona 100% offline, com banco local.
- **Backup/restauração** por arquivo (exportar e importar JSON, compartilhável para Drive ou WhatsApp).
- Interface em português, botões grandes, pensada para uso no balcão.
- Valores sempre em centavos (inteiros) para evitar erro de arredondamento.

### Fora do MVP (fazer depois)
- Versão Pro (assinatura), vários aparelhos sincronizados, relatórios avançados, leitor de código de barras pela câmera, impressão de cupom Bluetooth.

## 6. Modelo de dados sugerido

```
Produto(id, nome, preco_centavos, codigo_barras?, categoria?, estoque?, ativo)
Cliente(id, nome, telefone, observacao?, limite_centavos?, criado_em)
Venda(id, data_hora, total_centavos, desconto_centavos, forma_pagamento, cliente_id?, cancelada)
ItemVenda(id, venda_id, produto_id, nome_snapshot, preco_snapshot_centavos, quantidade)
MovimentoFiado(id, cliente_id, tipo[DEBITO|PAGAMENTO], valor_centavos, venda_id?, data_hora, obs?)
```

O saldo do cliente é igual à soma dos DEBITOs menos a soma dos PAGAMENTOs. **Não guardar o saldo como campo**: calcular sempre.

## 7. Como testar no celular (fazer a cada etapa)

```bash
./gradlew assembleDebug                                   # ou o build equivalente do Capacitor
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell monkey -p <package.name> 1                      # abre o app
adb logcat -s AndroidRuntime:E <TagDoApp>:*               # erros em tempo real
adb exec-out screencap -p > /tmp/tela.png                 # print para conferir a tela
```

- Tire print das telas principais e confira o layout.
- Teste o fluxo completo:
  1. Cadastrar produto.
  2. Vender em dinheiro.
  3. Vender fiado.
  4. Registrar pagamento parcial.
  5. Conferir o saldo.
  6. Cobrar no WhatsApp.
  7. Fazer backup e restaurar.
- Escreva testes automatizados para o cálculo de saldo, troco e totais.

## 8. Publicação na Google Play (etapa final)

- Gerar um **AAB assinado** (`bundleRelease`).
- **A keystore de assinatura NUNCA vai para o git.** Guarde fora do projeto e avise o usuário para fazer backup dela, porque perder a keystore impede atualizar o app.
- Usar o target SDK exigido pela Play Store no momento (verificar o requisito atual).
- Preparar:
  - Ícone 512x512.
  - Imagem de destaque 1024x500.
  - Pelo menos 2 prints.
  - Descrição curta e longa.
  - **Política de privacidade** (página simples; pode ser publicada no GitHub Pages).
- Conta de desenvolvedor Google: taxa única de US$ 25.
- **Contas pessoais novas** precisam de **teste fechado com pelo menos 12 testadores por 14 dias** antes de publicar em produção. Avise o usuário cedo para ele já ir juntando os testadores.

## 9. Regras de trabalho

- Explique cada decisão em português simples. O usuário não é programador.
- Trabalhe em etapas pequenas: termine, instale no celular, mostre e só então siga.
- Peça confirmação antes de:
  - instalar pacotes com `sudo`;
  - apagar arquivos;
  - mexer no PDV original. **Trabalhe numa pasta nova** e não altere o PDV atual.
- Use git no projeto novo, com commits frequentes.

## 10. Ideias futuras (registrar, não fazer agora)

1. **Montador de vídeos para e-commerce:** filmar o produto, e a IA gera roteiro, narração, legenda e exporta para ML, Shopee ou Reels. Fica como segundo app, por assinatura, porque tem custo de IA por vídeo.
2. **Avaliações do Mercado Livre pela foto:** a IA identifica o produto, o app busca no ML e resume elogios e reclamações. Pode virar uma função dentro do app de vídeo.
3. Buscador de vídeos por foto foi descartado (o Google Lens já atende).

---

**Primeira mensagem sugerida para o Claude Code do notebook:**

> Leia o arquivo `briefing-app-pdv-fiado.md` e comece pela Etapa 0. Meu PDV atual está na pasta: `<caminho>`.
