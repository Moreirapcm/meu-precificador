# Professor IA - Guia de Deploy na VPS

## O que é isso?

Uma aplicação web completa de tutoria de matemática:

```
Aluno abre o site → faz login → envia foto da questão
                                        ↓
                              Gemini IA analisa a foto
                                        ↓
                      Aluno recebe explicação socrática + lousa visual
```

**Tudo roda na sua VPS.** Não depende de Firebase, Telegram, n8n, nem nada externo
(exceto a API do Gemini para a IA).

---

## Estrutura do Projeto

```
professor-ia/
├── app.py                # Backend Flask (login, API Gemini, lousa, histórico)
├── gunicorn.conf.py      # Config do servidor de produção
├── templates/
│   └── index.html        # Frontend completo (chat, lousa, login)
├── static/               # Arquivos estáticos (se precisar)
├── requirements.txt      # Dependências Python
├── Dockerfile            # Container de produção
├── docker-compose.yml    # Orquestração com um comando
├── .env.example          # Modelo de variáveis de ambiente
└── SETUP.md              # Este arquivo
```

---

## Deploy na VPS (3 passos)

### Passo 1: Clonar e configurar

```bash
# Na sua VPS:
git clone https://github.com/Moreirapcm/meu-precificador.git
cd meu-precificador/professor-ia

# Criar arquivo de config
cp .env.example .env
nano .env
```

No `.env`, preencha:
```env
# Gere com: python3 -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY=cole_aqui_sua_chave_secreta

# Opcional: se quiser que os alunos não precisem configurar chave Gemini
GEMINI_API_KEY=sua_chave_gemini_aqui
```

### Passo 2: Subir com Docker

```bash
docker-compose up -d
```

Pronto! O app está rodando na porta 5000.

### Passo 3: Apontar o domínio (Nginx reverse proxy)

```nginx
server {
    listen 80;
    server_name professor.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }
}
```

Para HTTPS (recomendado):
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d professor.seudominio.com
```

---

## Rodar sem Docker (desenvolvimento)

```bash
cd professor-ia
pip install -r requirements.txt
python app.py
# Acesse http://localhost:5000
```

---

## Como funciona

### Autenticação
- Login/cadastro com email e senha
- Senhas armazenadas com hash + salt (SHA-256)
- Sessões persistentes por 30 dias
- Banco de dados SQLite (arquivo local, sem servidor)

### Fluxo da IA
1. Aluno envia foto ou digita a questão
2. Backend envia para API Gemini (Vision para fotos, Text para texto)
3. Gemini retorna JSON com explicação socrática
4. Frontend renderiza a explicação + lousa visual em HTML/CSS

### Lousa Visual
- Gerada direto no navegador com HTML/CSS (sem servidor Python separado)
- Endpoint `/api/lousa` também gera PNG com Pillow (para uso externo)
- Mostra a conta, bolinhas visuais e dica

### Histórico
- Conversas salvas no SQLite
- Aluno pode ver conversas anteriores, continuar ou deletar

---

## APIs do Backend

| Método | Rota | O que faz |
|--------|------|-----------|
| POST | `/api/cadastro` | Criar conta |
| POST | `/api/login` | Fazer login |
| POST | `/api/logout` | Fazer logout |
| GET | `/api/eu` | Dados do usuário logado |
| POST | `/api/config` | Salvar configurações |
| POST | `/api/perguntar` | Enviar pergunta para a IA |
| GET | `/api/conversas` | Listar conversas |
| GET | `/api/conversas/:id` | Ver mensagens de uma conversa |
| DELETE | `/api/conversas/:id` | Deletar conversa |
| POST | `/api/lousa` | Gerar imagem PNG da lousa |
| GET | `/api/health` | Health check |

---

## Custos

| Item | Custo |
|------|-------|
| VPS | O que você já paga |
| Domínio | O que você já paga |
| Gemini API | Grátis (15 req/min) |
| SQLite | Grátis |
| **Total extra** | **R$ 0** |

---

## Comandos úteis

```bash
# Ver se está rodando
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Reiniciar
docker-compose restart

# Atualizar (após git pull)
docker-compose up -d --build

# Backup do banco de dados
docker cp professor-ia-professor-ia-1:/app/data/professor_ia.db ./backup.db
```
