# Professor IA - Guia Completo para Iniciantes

## O que estamos construindo?

Imagine o seguinte cenário:

> Uma crianca tira foto de uma conta de matemática no caderno
> e envia pelo Telegram. Em segundos, ela recebe de volta:
> 1. Um VIDEO de um professor virtual explicando passo a passo
> 2. Uma IMAGEM de lousa com a conta desenhada
> 3. Perguntas socráticas que ajudam ela a pensar (sem dar a resposta!)

Parece complexo? Na verdade são só **5 peças** conectadas. Vamos entender cada uma.

---

## As 5 Peças do Quebra-Cabeça

Pense no projeto como uma linha de montagem numa fábrica:

```
PEÇA 1          PEÇA 2         PEÇA 3          PEÇA 4         PEÇA 5
Telegram   -->   n8n     -->   Gemini    -->   HeyGen   -->   Telegram
(entrada)     (gerente)      (cérebro)       (avatar)        (saída)
                                  |
                                  v
                             Lousa (Python)
                             (quadro-negro)
```

| Peça | O que é | Papel no projeto | Analogia |
|------|---------|-----------------|----------|
| **Telegram Bot** | App de mensagens | Recebe a foto e devolve a resposta | O **balcão** onde o aluno chega |
| **n8n** | Ferramenta de automação | Conecta tudo, orquestra o fluxo | O **gerente** que manda cada um fazer sua parte |
| **Gemini Vision** | IA do Google | Lê a foto e cria a explicação | O **cérebro** que entende a questão |
| **HeyGen** | Gerador de vídeo | Cria o vídeo do avatar falando | O **ator** que grava a aula |
| **Lousa (Python)** | Servidor de imagem | Desenha a conta num quadro-negro | O **desenhista** que faz a lousa |

---

## Pré-requisitos (o que você precisa ter)

Antes de começar, precisa ter instalado:

### Docker (obrigatório)
Docker é como uma "caixinha" que roda programas isolados no seu computador.
```bash
# Para verificar se já tem:
docker --version
docker-compose --version

# Se não tiver, instale pelo site oficial: https://docs.docker.com/get-docker/
```

### Contas gratuitas necessárias
- Conta no **Telegram** (você provavelmente já tem)
- Conta no **Google AI Studio** (grátis, usa sua conta Google)
- Conta no **HeyGen** (tem plano grátis para testar)

---

## Implementação Passo a Passo

### ETAPA 1: Criar o Bot do Telegram (5 minutos)

O Bot é o "porteiro" do nosso sistema. É por onde o aluno vai falar.

**O que é um Bot?** É uma conta automática no Telegram que responde mensagens
sozinha (através do nosso código).

1. Abra o Telegram no celular ou computador
2. Na busca, digite `@BotFather` e clique nele
3. Envie o comando: `/newbot`
4. Ele vai perguntar o **nome**: digite `Professor IA`
5. Ele vai perguntar o **username**: digite algo como `meu_professor_ia_bot`
   - Precisa terminar com `_bot`
   - Precisa ser único (se já existir, tente outro nome)
6. O BotFather vai responder com um **token** parecido com isto:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
7. **GUARDE ESSE TOKEN!** Vamos usar ele depois.

> Pense no token como a "senha" que permite nosso sistema controlar o bot.

---

### ETAPA 2: Obter a Chave do Gemini (3 minutos)

O Gemini é a IA do Google que vai "olhar" a foto e entender a questão.

**O que é uma API Key?** É como uma senha que permite seu programa usar um serviço externo.

1. Acesse: https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave gerada (parece com: `AIzaSy...longo...texto`)
5. **GUARDE ESSA CHAVE!**

> O Gemini tem uso gratuito generoso: 15 requisições por minuto.
> Para uso educacional, isso é mais que suficiente.

---

### ETAPA 3: Obter a Chave do HeyGen (5 minutos)

O HeyGen gera o vídeo do avatar (professor virtual) falando.

1. Crie uma conta em https://app.heygen.com
2. Após login, vá em **Settings** (engrenagem) -> **API**
3. Clique em **Generate API Key**
4. **GUARDE ESSA CHAVE!**

> **NOTA:** O HeyGen é opcional! Se não quiser usar (ou se o plano gratuito
> acabar), o sistema automaticamente envia a explicação como TEXTO + LOUSA.
> Funciona perfeitamente sem vídeo.

---

### ETAPA 4: Configurar o Projeto (2 minutos)

Agora vamos juntar todas as chaves num arquivo de configuração.

```bash
# 1. Entre na pasta do projeto
cd professor-ia

# 2. Copie o arquivo de exemplo
cp .env.example .env

# 3. Abra o .env para editar (use qualquer editor)
nano .env    # ou: code .env (VS Code), vim .env, etc.
```

Dentro do `.env`, preencha com suas chaves reais:

```env
# Cole o token que o BotFather te deu:
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Cole a chave do Google AI Studio:
GEMINI_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxx

# Cole a chave do HeyGen (pode deixar vazio se não for usar):
HEYGEN_API_KEY=sua_chave_aqui

# Essas podem ficar como estão:
LOUSA_API_URL=http://lousa:5000
N8N_URL=http://localhost:5678
```

> **CUIDADO:** Nunca compartilhe o arquivo `.env` com suas chaves reais!
> Ele já está no `.gitignore` para não ir pro GitHub por acidente.

---

### ETAPA 5: Subir os Serviços com Docker (2 minutos)

Esse é o comando mágico que liga tudo:

```bash
cd professor-ia
docker-compose up -d
```

**O que acontece por trás:**
- O Docker baixa a imagem do n8n (ferramenta de automação)
- O Docker compila nosso servidor da lousa (Python + Flask)
- Ambos começam a rodar em segundo plano (`-d` = detached/desacoplado)

**Para verificar se está tudo rodando:**
```bash
# Ver os containers ativos
docker-compose ps

# Deve mostrar algo assim:
# professor-ia_n8n_1     ... Up    0.0.0.0:5678->5678/tcp
# professor-ia_lousa_1   ... Up    0.0.0.0:5000->5000/tcp

# Testar se o servidor da lousa está vivo:
curl http://localhost:5000/health
# Resposta esperada: {"service":"Professor IA - Lousa Generator","status":"ok"}
```

---

### ETAPA 6: Importar o Workflow no n8n (10 minutos)

Essa é a parte mais importante! O n8n é o "gerente" que conecta tudo.

**O que é o n8n?** É uma ferramenta visual onde você conecta "blocos"
(chamados de nós) para criar automações. Tipo um fluxograma que roda de verdade.

#### 6.1 - Acessar o n8n
1. Abra o navegador
2. Acesse: `http://localhost:5678`
3. Na primeira vez, crie uma conta (é local, só no seu computador)

#### 6.2 - Instalar o plugin do Gemini
1. Clique no **menu** (canto inferior esquerdo)
2. Vá em **Settings**
3. Clique em **Community Nodes**
4. Clique em **Install a community node**
5. Digite: `@n8n/n8n-nodes-langchain`
6. Clique **Install**

> Esse plugin adiciona os nós de IA (Gemini, ChatGPT, etc.) ao n8n.

#### 6.3 - Importar o workflow
1. Na tela principal do n8n, clique nos **3 pontinhos** (menu)
2. Clique em **Import from File**
3. Selecione o arquivo: `professor-ia/workflow-professor-ia.json`
4. O workflow vai aparecer com todos os nós conectados!

#### 6.4 - Configurar as credenciais
Você verá os nós com um triângulo amarelo (significa: "falta credencial").
Clique em cada nó e configure:

**Nó "Telegram Trigger":**
1. Clique duas vezes no nó
2. Em **Credential**, clique em **Create New**
3. Cole seu **token do Telegram** (da Etapa 1)
4. Salve

**Nó "Gemini Vision - Analisar Questão":**
1. Clique duas vezes no nó
2. Em **Credential**, clique em **Create New**
3. Cole sua **chave do Gemini** (da Etapa 2)
4. Salve

**Nó "HeyGen - Gerar Vídeo Avatar" (opcional):**
1. Clique duas vezes no nó
2. Se quiser usar, coloque sua chave do HeyGen
3. Se NÃO quiser usar, pode desconectar esse nó (veja seção "Modo sem Avatar" abaixo)

---

### ETAPA 7: Ativar e Testar (1 minuto)

1. No canto superior direito do n8n, há um toggle **"Inactive"**
2. Clique nele para mudar para **"Active"**
3. Pronto! O bot está ouvindo.

**Teste:**
1. Abra o Telegram
2. Busque pelo username do seu bot (ex: `@meu_professor_ia_bot`)
3. Envie qualquer texto - deve responder com boas-vindas
4. Tire foto de uma conta (ex: `10 ÷ 2 = ?`) e envie
5. Aguarde a resposta!

---

## Entendendo Cada Arquivo

### `workflow-professor-ia.json` - O Cérebro do Projeto

Este arquivo contém o fluxo inteiro do n8n. Ao importar no n8n você vai ver
algo assim visual:

```
[Telegram]-->[Tem Foto?]--SIM-->[Baixar Foto]-->[Gemini IA]-->[Processar]--+
                |                                                           |
                NÃO                                                         |
                |                                                     +-----+------+
                v                                                     |     |      |
          [Boas-vindas]                                           [HeyGen] [Lousa] [Msg]
                                                                     |      |
                                                                     v      v
                                                              [Enviar Vídeo + Lousa]
```

**Os nós (blocos) em ordem:**

| # | Nó | O que faz | Analogia |
|---|-----|-----------|----------|
| 1 | Telegram Trigger | Fica "escutando" mensagens do bot | Porteiro esperando alguém bater |
| 2 | Tem Foto? | Verifica se a mensagem tem imagem | Porteiro pergunta: "trouxe a questão?" |
| 3 | Obter Caminho | Pede ao Telegram o link da foto | Porteiro pega o envelope |
| 4 | Baixar Foto | Faz download da imagem | Porteiro abre o envelope |
| 5 | Gemini Vision | IA analisa a foto e cria explicação | Professor lê a questão |
| 6 | Processar Resposta | Organiza a resposta da IA em dados | Secretária organiza o material |
| 7 | HeyGen | Gera vídeo do avatar falando | Professor grava a videoaula |
| 8 | Gerar Lousa | Cria imagem de quadro-negro | Professor escreve no quadro |
| 9 | Msg Processando | Avisa "estou preparando..." | Recepcionista avisa: "só um momento" |
| 10 | Enviar Vídeo | Manda o vídeo pelo Telegram | Entrega a videoaula |
| 11 | Enviar Lousa | Manda a imagem pelo Telegram | Entrega a foto do quadro |

---

### `lousa_generator.py` - O Desenhista da Lousa

Este é um servidor Python que **gera imagens** de quadro-negro.

**Como funciona, passo a passo:**

```python
# 1. Ele cria uma imagem verde (como um quadro-negro real)
img = Image.new("RGB", (800, 600), cor_verde)

# 2. Desenha uma borda marrom (como madeira do quadro)
draw.rectangle(..., outline=cor_marrom)

# 3. Escreve o título "Professor IA - Lousa"
draw.text("Professor IA - Lousa", cor_azul)

# 4. Escreve a conta em destaque (ex: "10 ÷ 2 = ?")
draw.text("10 ÷ 2 = ?", cor_amarelo, fonte_grande)

# 5. Desenha bolinhas visuais (representação da conta)
#    Ex: para 10÷2, desenha 10 bolinhas divididas em 2 grupos
#    ●●●●● | ●●●●●

# 6. Adiciona a dica na parte de baixo
draw.text("Dica: imagine 10 balas para 2 amigos!")

# 7. Retorna a imagem pronta como PNG
```

**Para testar o servidor isoladamente:**
```bash
# Inicie o servidor
python lousa_generator.py

# Em outro terminal, peça uma imagem:
curl -X POST http://localhost:5000/gerar-lousa \
  -H "Content-Type: application/json" \
  -d '{
    "texto_lousa": "10 dividido por 2",
    "numeros": [10, 2],
    "tipo_operacao": "divisão",
    "dica_visual": "Imagine 10 balas para dividir entre 2 amigos"
  }' \
  --output lousa_teste.png

# Abra lousa_teste.png para ver o resultado!
```

---

### `docker-compose.yml` - O "Liga Tudo"

O Docker Compose sobe todos os serviços com um comando só.

```yaml
services:
  n8n:          # Serviço 1: o n8n (gerente das automações)
    image: n8nio/n8n    # Baixa a imagem pronta do n8n
    ports: 5678         # Acessível em localhost:5678

  lousa:        # Serviço 2: nosso gerador de lousa
    build: .            # Compila nosso Dockerfile
    ports: 5000         # Acessível em localhost:5000
```

**Comandos úteis do Docker Compose:**
```bash
# Subir tudo
docker-compose up -d

# Ver o que está rodando
docker-compose ps

# Ver logs (útil para debug)
docker-compose logs -f

# Ver logs só do n8n
docker-compose logs -f n8n

# Ver logs só da lousa
docker-compose logs -f lousa

# Desligar tudo
docker-compose down

# Reiniciar
docker-compose restart
```

---

### `Dockerfile` - A Receita do Container da Lousa

```dockerfile
FROM python:3.12-slim    # Começa com Python 3.12

RUN apt-get install fonts-dejavu-core    # Instala fontes para o texto

COPY requirements.txt .
RUN pip install -r requirements.txt      # Instala Flask + Pillow

COPY lousa_generator.py .               # Copia nosso código

CMD ["gunicorn", "lousa_generator:app"]  # Roda o servidor
```

> **Analogia:** O Dockerfile é como uma receita de bolo.
> Ele lista todos os ingredientes (Python, fontes, Flask, Pillow)
> e o modo de preparo (copiar código, rodar servidor).

---

## Modo sem Avatar (mais simples e gratuito)

Se você quer começar simples, SEM vídeo de avatar:

O sistema funciona perfeitamente só com **texto + lousa**.
O vídeo do HeyGen é um "plus" legal, mas não é obrigatório.

**Para desativar o vídeo no n8n:**
1. Abra o workflow no n8n
2. Clique com botão direito no nó **"HeyGen - Gerar Vídeo Avatar"**
3. Clique em **Deactivate**
4. O fluxo vai usar automaticamente o caminho de fallback (texto + lousa)

Nesse modo, o aluno recebe:
- Mensagem de texto com a explicação socrática
- Imagem da lousa com a conta desenhada
- Dica visual para ajudar

---

## Exemplo Real do Fluxo

Vamos simular o que acontece quando um aluno envia `10 ÷ 2`:

**1. Aluno envia foto pelo Telegram**

**2. Gemini analisa e responde (JSON):**
```json
{
  "questao_extraida": "10 ÷ 2 = ?",
  "tipo_operacao": "divisão",
  "numeros_envolvidos": [10, 2],
  "roteiro_avatar": "Oi! Vi que você está com uma conta de divisão.
    Olha só para esse 10 na lousa... Se a gente tiver 10 balas
    e 2 amigos, quantas balas cada um ganha antes de sobrar nada?
    Tenta pensar aí!",
  "texto_lousa": "10 ÷ 2 = ?",
  "dica_visual": "desenhar 10 bolinhas divididas em 2 grupos iguais"
}
```

**3. Em paralelo acontecem 3 coisas:**
- HeyGen gera vídeo do avatar falando o `roteiro_avatar`
- Servidor Flask gera imagem da lousa com `10 ÷ 2 = ?` e as bolinhas
- Telegram envia "Estou preparando sua explicação..."

**4. Aluno recebe tudo pelo Telegram!**

---

## Custos: Quanto vou gastar?

| Serviço | Custo | Observação |
|---------|-------|------------|
| Telegram Bot | **Grátis** | Sempre grátis |
| n8n (self-hosted) | **Grátis** | Roda no seu computador |
| Gemini API | **Grátis** | 15 requisições/minuto sem pagar |
| Servidor Lousa | **Grátis** | Roda no seu computador |
| HeyGen | **Pago** (~$24/mês) | Opcional! O fallback de texto é grátis |

> **Resumo:** Dá pra rodar 100% grátis se usar o modo texto + lousa.
> O HeyGen (vídeo do avatar) é a única parte paga, e é opcional.

---

## Solução de Problemas

### "O bot não responde no Telegram"
1. O workflow está **ativo** no n8n? (toggle verde no canto superior direito)
2. O token do Telegram está correto? (confira nas credenciais do n8n)
3. O n8n está rodando? (`docker-compose ps`)

### "O Gemini retorna erro"
1. A chave de API é válida? Teste em https://aistudio.google.com
2. A foto é muito grande? Tente fotos menores que 20MB
3. Veja os logs: `docker-compose logs -f n8n`

### "A lousa não gera"
1. O container está rodando? `docker-compose ps`
2. Teste manualmente: `curl http://localhost:5000/health`
3. Veja os logs: `docker-compose logs -f lousa`

### "O vídeo não gera"
1. Confira seus créditos no painel do HeyGen
2. O HeyGen pode demorar até 2 minutos
3. Não se preocupe: o fallback de texto é automático!

---

## Próximos Passos (ideias para evoluir)

Uma vez que o básico estiver funcionando, você pode:

1. **Adicionar mais matérias** - Mudar o prompt do Gemini para português, ciências, etc.
2. **Histórico do aluno** - Salvar as questões no Firebase (já tem integração no projeto)
3. **Gamificação** - Dar "estrelas" quando o aluno acerta
4. **Múltiplos idiomas** - Adaptar para inglês, espanhol
5. **App próprio** - Trocar o Telegram por um app Streamlit ou Flutter

---

## Estrutura de Arquivos

```
professor-ia/
├── workflow-professor-ia.json   # Fluxo do n8n (IMPORTAR no n8n)
├── lousa_generator.py           # Servidor Python que desenha a lousa
├── requirements.txt             # Bibliotecas Python necessárias
├── Dockerfile                   # Receita do container da lousa
├── docker-compose.yml           # Liga n8n + lousa com um comando
├── .env.example                 # Modelo das chaves (copiar para .env)
└── SETUP.md                     # Este guia que você está lendo!
```
