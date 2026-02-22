# Professor IA - Tutor Socrático com Avatar

Sistema de tutoria inteligente que recebe fotos de questões de matemática via Telegram,
analisa com IA (Gemini Vision), gera uma explicação socrática em vídeo com avatar e
envia de volta com uma lousa visual.

## Arquitetura do Fluxo

```
Aluno (Telegram)
    │
    ▼
[1] Telegram Bot recebe foto da questão
    │
    ▼
[2] n8n Workflow dispara
    │
    ├──► [3] Gemini Vision analisa a imagem
    │         └── Extrai questão + gera roteiro socrático (JSON)
    │
    ├──► [4a] HeyGen/D-ID gera vídeo do Avatar falando
    │
    ├──► [4b] Servidor Lousa gera imagem do quadro-negro
    │
    └──► [4c] Telegram envia "processando..."
              │
              ▼
         [5] Telegram envia vídeo + lousa para o aluno
```

## Pré-requisitos

- Docker e Docker Compose instalados
- Conta no Telegram (para criar o bot)
- Chave da API Google Gemini
- Chave da API HeyGen (ou D-ID como alternativa)

## Configuração Passo a Passo

### 1. Criar o Bot do Telegram

1. Abra o Telegram e busque `@BotFather`
2. Envie `/newbot`
3. Escolha um nome: `Professor IA`
4. Escolha um username: `professor_ia_tutor_bot` (deve ser único)
5. Copie o **token** gerado (formato: `123456789:ABCdefGHI...`)

### 2. Obter Chaves de API

**Google Gemini:**
1. Acesse [Google AI Studio](https://aistudio.google.com/apikey)
2. Crie uma nova chave de API
3. Copie a chave

**HeyGen (para vídeo do avatar):**
1. Crie conta em [HeyGen](https://app.heygen.com)
2. Vá em Settings → API
3. Copie a chave de API

**Alternativa - D-ID:**
1. Crie conta em [D-ID Studio](https://studio.d-id.com)
2. Vá em Account Settings → API
3. Copie a chave

### 3. Configurar Variáveis de Ambiente

```bash
cd professor-ia
cp .env.example .env
# Edite o .env com suas chaves reais
```

### 4. Subir os Serviços

```bash
cd professor-ia
docker-compose up -d
```

Isso vai iniciar:
- **n8n** em `http://localhost:5678`
- **Servidor da Lousa** em `http://localhost:5000`

### 5. Importar o Workflow no n8n

1. Acesse `http://localhost:5678`
2. Login: `admin` / `mudar_senha_aqui` (altere no docker-compose.yml)
3. Vá em **Settings → Community Nodes** e instale:
   - `@n8n/n8n-nodes-langchain` (para o nó do Gemini)
4. Clique em **Import Workflow**
5. Selecione o arquivo `workflow-professor-ia.json`
6. Configure as credenciais:
   - **Telegram:** Cole o token do BotFather
   - **Google Gemini:** Cole a chave de API
   - **HeyGen:** Cole a chave de API (opcional)

### 6. Ativar o Workflow

1. No n8n, abra o workflow importado
2. Clique no botão **Active** (toggle no canto superior direito)
3. O webhook do Telegram será registrado automaticamente

### 7. Testar

1. Abra o Telegram e busque seu bot pelo username
2. Envie `/start` - deve receber a mensagem de boas-vindas
3. Tire uma foto de uma questão de matemática e envie
4. Aguarde a resposta com a explicação + lousa

## Estrutura de Arquivos

```
professor-ia/
├── workflow-professor-ia.json   # Workflow n8n (importar no n8n)
├── lousa_generator.py           # Servidor Flask para gerar imagens da lousa
├── requirements.txt             # Dependências Python
├── Dockerfile                   # Container do servidor da lousa
├── docker-compose.yml           # Orquestração n8n + lousa
├── .env.example                 # Template de variáveis de ambiente
└── SETUP.md                     # Este arquivo
```

## Fluxo do Workflow n8n

| Nó | Função |
|----|--------|
| Telegram Trigger | Recebe mensagens do bot |
| Tem Foto? | Verifica se a mensagem contém imagem |
| Obter Caminho do Arquivo | Busca o file_path na API do Telegram |
| Baixar Foto | Faz download da imagem |
| Gemini Vision | Analisa a imagem e gera roteiro socrático em JSON |
| Processar Resposta | Parse do JSON e preparação dos dados |
| HeyGen - Gerar Vídeo | Cria vídeo do avatar falando a explicação |
| Gerar Imagem Lousa | Chama o servidor Flask para criar a lousa |
| Enviar Msg Processando | Avisa o aluno que está preparando |
| Verificar Status Vídeo | Polling do status do vídeo no HeyGen |
| Enviar Vídeo Avatar | Envia o vídeo pronto via Telegram |
| Enviar Lousa | Envia a imagem da lousa via Telegram |
| Enviar Texto (Fallback) | Se o vídeo falhar, envia texto da explicação |

## Personalização

### Trocar o Avatar do HeyGen

No workflow, no nó "HeyGen - Gerar Vídeo Avatar", altere:
- `avatar_id`: ID do avatar desejado (veja no painel do HeyGen)
- `voice_id`: ID da voz em pt-BR

### Ajustar o Prompt do Gemini

No nó "Gemini Vision - Analisar Questão", edite o prompt para:
- Mudar o tom (mais formal/informal)
- Alterar a matéria (português, ciências, etc.)
- Ajustar o nível de dificuldade
- Adicionar campos extras ao JSON de saída

### Personalizar a Lousa

No `lousa_generator.py`, ajuste as constantes:
- `COR_FUNDO`: Cor do quadro-negro
- `COR_DESTAQUE`: Cor dos números destacados
- `LARGURA/ALTURA`: Dimensões da imagem

## Modo sem Avatar (Somente Texto + Lousa)

Se não quiser usar HeyGen/D-ID, o workflow tem um fallback automático:
quando o vídeo falha, ele envia a explicação como texto + imagem da lousa.

Para desativar o avatar permanentemente, no n8n desconecte o nó
"HeyGen - Gerar Vídeo Avatar" e conecte "Processar Resposta"
diretamente ao "Enviar Texto (Fallback)" e "Enviar Lousa".

## Custos Estimados

| Serviço | Plano Gratuito | Custo Mensal (uso moderado) |
|---------|----------------|----------------------------|
| Gemini API | 15 req/min grátis | ~$0 (uso educacional) |
| HeyGen | 1 crédito grátis | ~$24/mês (Creator) |
| D-ID | 5 min grátis | ~$5.90/mês (Lite) |
| n8n | Self-hosted grátis | $0 |
| Telegram Bot | Grátis | $0 |

## Solução de Problemas

**Bot não responde:**
- Verifique se o workflow está ativo no n8n
- Confira o token do Telegram nas credenciais

**Gemini retorna erro:**
- Verifique se a chave de API é válida
- Confira se a imagem não está muito grande (>20MB)

**Lousa não gera:**
- Verifique se o container `lousa` está rodando: `docker-compose ps`
- Teste: `curl http://localhost:5000/health`

**Vídeo não gera:**
- HeyGen pode demorar até 2 minutos para gerar
- Verifique seus créditos no painel do HeyGen
- O fallback de texto será usado automaticamente
