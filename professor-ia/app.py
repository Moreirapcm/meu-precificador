"""
=================================================================
Professor IA - Backend Completo (Self-Hosted)
=================================================================
Servidor Flask que roda na sua VPS com:
  - Login/cadastro próprio (SQLite + bcrypt)
  - API do Gemini para analisar questões
  - Gerador de lousa (Pillow)
  - Histórico de conversas

Para rodar:
  pip install -r requirements.txt
  python app.py

Acesse: http://localhost:5000
=================================================================
"""

import os
import io
import json
import math
import uuid
import random
import base64
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import (
    Flask, request, jsonify, send_file, session,
    render_template, redirect, url_for
)
from PIL import Image, ImageDraw, ImageFont
import requests as http_requests

# =================================================================
# CONFIGURAÇÃO DO APP
# =================================================================
def calcular_fatoracao_simultanea(numeros):
    """Calcula fatoracao simultanea - metodo escolar brasileiro."""
    nums = list(numeros)
    linhas = []
    primo = 2

    def is_primo(n):
        if n < 2: return False
        for i in range(2, int(n**0.5)+1):
            if n % i == 0: return False
        return True

    def proximo_primo(n):
        n += 1
        while not is_primo(n):
            n += 1
        return n

    while any(n > 1 for n in nums):
        divide_algum = any(n % primo == 0 for n in nums)
        if divide_algum:
            divide_todos = all(n % primo == 0 for n in nums)
            linhas.append({
                "valores": list(nums),
                "primo": primo,
                "divide": divide_todos
            })
            nums = [n // primo if n % primo == 0 else n for n in nums]
        else:
            primo = proximo_primo(primo)

    fatores_mdc = [l["primo"] for l in linhas if l["divide"]]
    fatores_mmc = [l["primo"] for l in linhas]
    mdc = 1
    for f in fatores_mdc:
        mdc *= f
    mmc = 1
    for f in fatores_mmc:
        mmc *= f

    return {
        "usar": True,
        "numeros": list(numeros),
        "linhas": linhas,
        "fatores_comuns": fatores_mdc,
        "resultado_mdc": mdc,
        "resultado_mmc": mmc
    }


app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(32))

# Gemini API Key (pode ser configurada por env ou pelo usuário na interface)
GEMINI_API_KEY_GLOBAL = os.environ.get("GEMINI_API_KEY", "")

# =================================================================
# BANCO DE DADOS (SQLite)
# =================================================================
DB_PATH = os.environ.get("DB_PATH", "professor_ia.db")


def get_db():
    """Abre conexão com o banco SQLite."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # Retorna dicts ao invés de tuplas
    conn.execute("PRAGMA journal_mode=WAL")  # Melhor performance
    return conn


def init_db():
    """Cria as tabelas se não existirem."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            nivel TEXT DEFAULT '4-5',
            gemini_key TEXT DEFAULT '',
            voz_narrador TEXT DEFAULT 'onyx',
            nome_professor TEXT DEFAULT 'Professor Max',
            criado_em TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS conversas (
            id TEXT PRIMARY KEY,
            usuario_id TEXT NOT NULL,
            titulo TEXT NOT NULL,
            criada_em TEXT DEFAULT (datetime('now')),
            ultima_msg TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        );

        CREATE TABLE IF NOT EXISTS mensagens (
            id TEXT PRIMARY KEY,
            conversa_id TEXT NOT NULL,
            tipo TEXT NOT NULL,
            conteudo TEXT NOT NULL,
            tem_imagem INTEGER DEFAULT 0,
            criada_em TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (conversa_id) REFERENCES conversas(id)
        );
    """)
    conn.commit()
    conn.close()


# =================================================================
# AUTENTICAÇÃO (Senha com hash + sessão)
# =================================================================
def hash_senha(senha):
    """Cria hash seguro da senha usando SHA-256 + salt."""
    salt = secrets.token_hex(16)
    h = hashlib.sha256((salt + senha).encode()).hexdigest()
    return f"{salt}:{h}"


def verificar_senha(senha, senha_hash):
    """Verifica se a senha confere com o hash salvo."""
    salt, h = senha_hash.split(":")
    return hashlib.sha256((salt + senha).encode()).hexdigest() == h


def login_required(f):
    """Decorator: exige que o usuário esteja logado."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"erro": "Não autenticado"}), 401
        return f(*args, **kwargs)
    return decorated


# =================================================================
# ROTAS DE AUTENTICAÇÃO
# =================================================================
@app.route("/")
def index():
    """Página principal - redireciona para o app ou login."""
    return render_template("index.html")


@app.route("/tiktok4vcuoTvvhd5PrjzCi4mydRrmJ8owCmRC.txt")
def tiktok_verify_root():
    return "tiktok-developers-site-verification=4vcuoTvvhd5PrjzCi4mydRrmJ8owCmRC", 200, {"Content-Type": "text/plain"}


@app.route("/termos/tiktokDMmouW47cslJE3VLNmoxGtJZm3uFZi8P.txt")
def tiktok_verify():
    return "tiktok-developers-site-verification=DMmouW47cslJE3VLNmoxGtJZm3uFZi8P", 200, {"Content-Type": "text/plain"}


@app.route("/privacidade/tiktokLUT2raDrcgYMSxbmr7Ut3UtmBwTIodTj.txt")
def tiktok_verify_privacy():
    return "tiktok-developers-site-verification=LUT2raDrcgYMSxbmr7Ut3UtmBwTIodTj", 200, {"Content-Type": "text/plain"}


@app.route("/tiktok/demo")
def tiktok_demo():
    return render_template("tiktok_demo.html")


@app.route("/termos")
def termos():
    return render_template("termos.html")


@app.route("/privacidade")
def privacidade():
    return render_template("privacidade.html")


@app.route("/api/cadastro", methods=["POST"])
def cadastro():
    """Cria uma nova conta de aluno."""
    dados = request.get_json()
    nome = dados.get("nome", "").strip()
    email = dados.get("email", "").strip().lower()
    senha = dados.get("senha", "")
    nivel = dados.get("nivel", "4-5")

    if not nome or not email or not senha:
        return jsonify({"erro": "Preencha todos os campos."}), 400
    if len(senha) < 6:
        return jsonify({"erro": "A senha precisa ter pelo menos 6 caracteres."}), 400

    conn = get_db()
    try:
        # Verificar se email já existe
        existente = conn.execute("SELECT id FROM usuarios WHERE email = ?", (email,)).fetchone()
        if existente:
            conn.close()
            return jsonify({"erro": "Este e-mail já está cadastrado."}), 400

        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO usuarios (id, nome, email, senha_hash, nivel) VALUES (?, ?, ?, ?, ?)",
            (user_id, nome, email, hash_senha(senha), nivel)
        )
        conn.commit()
        conn.close()

        # Logar automaticamente
        session["user_id"] = user_id
        session["user_nome"] = nome
        session.permanent = True
        app.permanent_session_lifetime = timedelta(days=30)

        return jsonify({"ok": True, "nome": nome})
    except Exception as e:
        conn.close()
        return jsonify({"erro": str(e)}), 500


@app.route("/api/login", methods=["POST"])
def login():
    """Faz login com email e senha."""
    dados = request.get_json()
    email = dados.get("email", "").strip().lower()
    senha = dados.get("senha", "")

    if not email or not senha:
        return jsonify({"erro": "Preencha e-mail e senha."}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM usuarios WHERE email = ?", (email,)).fetchone()
    conn.close()

    if not user or not verificar_senha(senha, user["senha_hash"]):
        return jsonify({"erro": "E-mail ou senha incorretos."}), 401

    session["user_id"] = user["id"]
    session["user_nome"] = user["nome"]
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=30)

    return jsonify({"ok": True, "nome": user["nome"]})


@app.route("/api/logout", methods=["POST"])
def logout():
    """Faz logout."""
    session.clear()
    return jsonify({"ok": True})


@app.route("/api/eu")
def eu():
    """Retorna dados do usuário logado."""
    if "user_id" not in session:
        return jsonify({"logado": False})

    conn = get_db()
    user = conn.execute("SELECT id, nome, email, nivel, gemini_key, nome_professor, voz_narrador FROM usuarios WHERE id = ?",
                        (session["user_id"],)).fetchone()
    conn.close()

    if not user:
        session.clear()
        return jsonify({"logado": False})

    return jsonify({
        "logado": True,
        "id": user["id"],
        "nome": user["nome"],
        "email": user["email"],
        "nivel": user["nivel"],
        "gemini_key": user["gemini_key"] or "",
        "nome_professor": user["nome_professor"] or "Professor Max",
        "tem_gemini": bool(user["gemini_key"] or GEMINI_API_KEY_GLOBAL),
        "voz_narrador": user["voz_narrador"] if "voz_narrador" in user.keys() else "onyx"
    })


# =================================================================
# ROTAS DE CONFIGURAÇÃO
# =================================================================
@app.route("/api/config", methods=["POST"])
@login_required
def salvar_config():
    """Salva configurações do aluno."""
    dados = request.get_json()
    print(f"CONFIG SAVE: {dados}", flush=True)
    conn = get_db()
    conn.execute(
        "UPDATE usuarios SET nivel=?, gemini_key=?, nome_professor=?, voz_narrador=? WHERE id=?",
        (
            dados.get("nivel", "4-5"),
            dados.get("gemini_key", ""),
            dados.get("nome_professor", "Professor Max"),
            dados.get("voz_narrador", "onyx"),
            session["user_id"]
        )
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


# =================================================================
# ROTAS DA IA (GEMINI)
# =================================================================
@app.route("/api/perguntar", methods=["POST"])
@login_required
def perguntar():
    """
    Endpoint principal: recebe pergunta (texto e/ou imagem) e retorna
    a explicação socrática do Professor IA.
    """
    dados = request.get_json()
    texto = dados.get("texto", "").strip()
    imagem_base64 = dados.get("imagem", "")  # base64 sem prefixo data:
    conversa_id = dados.get("conversa_id", "")

    # Buscar dados do usuário
    conn = get_db()
    user = conn.execute("SELECT * FROM usuarios WHERE id = ?", (session["user_id"],)).fetchone()
    conn.close()

    # Determinar chave do Gemini
    gemini_key = user["gemini_key"] or GEMINI_API_KEY_GLOBAL
    if not gemini_key:
        return jsonify({"erro": "Configure sua chave do Gemini nas configurações."}), 400

    # Criar conversa se necessário
    if not conversa_id:
        conversa_id = str(uuid.uuid4())
        titulo = texto[:50] if texto else "Questão com imagem"
        conn = get_db()
        conn.execute(
            "INSERT INTO conversas (id, usuario_id, titulo) VALUES (?, ?, ?)",
            (conversa_id, session["user_id"], titulo)
        )
        conn.commit()
        conn.close()

    # Salvar pergunta do aluno
    conn = get_db()
    conn.execute(
        "INSERT INTO mensagens (id, conversa_id, tipo, conteudo, tem_imagem) VALUES (?, ?, 'aluno', ?, ?)",
        (str(uuid.uuid4()), conversa_id, texto or "Foto da questão", 1 if imagem_base64 else 0)
    )
    conn.commit()
    conn.close()

    # Montar prompt para o Gemini
    nivel = user["nivel"] or "4-5"
    nome_prof = user["nome_professor"] or "Professor Max"
    resposta_ia = chamar_openai(gemini_key, texto, imagem_base64, nivel, nome_prof)
    # Injetar fatoracao calculada pelo Python se for MDC ou MMC
    tipo_op = str(resposta_ia.get("tipo_operacao", "")).lower()
    if "mdc" in tipo_op or "mmc" in tipo_op:
        numeros = resposta_ia.get("dados_extraidos", {}).get("numeros", [])
        if len(numeros) >= 2:
            try:
                tab = calcular_fatoracao_simultanea([int(n) for n in numeros[:3]])
                tab["tipo"] = "MMC" if "mmc" in tipo_op else "MDC"
                tab["resultado"] = tab["resultado_mmc"] if "mmc" in tipo_op else tab["resultado_mdc"]
                resposta_ia["tabela_fatoracao"] = tab
                print(f"FATORACAO CALCULADA: {tab['tipo']} = {tab['resultado']}", flush=True)
            except Exception as e:
                print(f"ERRO FATORACAO: {e}", flush=True)

    if "erro" in resposta_ia:
        return jsonify(resposta_ia), 500
    print(f"PASSOS: {resposta_ia.get('passos_lousa', [])}", flush=True)
    print(f"TIPO: {resposta_ia.get('tipo_operacao', '')}", flush=True)

    # Validar calculos com Python
    if 'dados_extraidos' in resposta_ia and 'tipo_operacao' in resposta_ia:
        correcoes, erros = validar_calculos(resposta_ia)
        if correcoes:
            resposta_ia['_correcoes_python'] = correcoes
            passos = resposta_ia.get('passos_lousa', [])
            for passo in passos:
                calculo = passo.get('calculo', '')
                if '?' in calculo:
                    for chave, valor in correcoes.items():
                        passo['calculo'] = calculo.replace('?', str(valor))

    # Salvar resposta do professor
    conn = get_db()
    conn.execute(
        "INSERT INTO mensagens (id, conversa_id, tipo, conteudo) VALUES (?, ?, 'professor', ?)",
        (str(uuid.uuid4()), conversa_id, json.dumps(resposta_ia, ensure_ascii=False))
    )
    conn.execute(
        "UPDATE conversas SET ultima_msg = datetime('now') WHERE id = ?",
        (conversa_id,)
    )
    conn.commit()
    conn.close()

    resposta_ia["conversa_id"] = conversa_id
    return jsonify(resposta_ia)


def validar_calculos(dados):
    """Valida e corrige os cálculos matemáticos extraídos pelo Gemini."""
    import math
    erros = []
    correcoes = {}

    tipo = dados.get('tipo_operacao', '').lower()
    dados_extraidos = dados.get('dados_extraidos', {})

    try:
        if tipo in ['mdc', 'mmc']:
            nums = dados_extraidos.get('numeros', [])
            if len(nums) >= 2:
                a, b = int(nums[0]), int(nums[1])
                mdc_correto = math.gcd(a, b)
                mmc_correto = abs(a * b) // mdc_correto
                correcoes['mdc'] = mdc_correto
                correcoes['mmc'] = mmc_correto

        if tipo == 'divisao' or 'divisão' in tipo:
            nums = dados_extraidos.get('numeros', [])
            if len(nums) >= 2 and int(nums[1]) != 0:
                correcoes['resultado_divisao'] = int(nums[0]) / int(nums[1])

        if tipo in ['fracao', 'fração']:
            total = dados_extraidos.get('total')
            denominador = dados_extraidos.get('denominador')
            numerador = dados_extraidos.get('numerador')
            if total and denominador and numerador:
                correcoes['parte'] = int(total) // int(denominador)
                correcoes['resultado'] = (int(total) // int(denominador)) * int(numerador)

        if tipo in ['multiplicacao', 'multiplicação']:
            nums = dados_extraidos.get('numeros', [])
            if len(nums) >= 2:
                correcoes['resultado'] = int(nums[0]) * int(nums[1])

        if tipo in ['soma', 'adicao', 'adição']:
            nums = dados_extraidos.get('numeros', [])
            if nums:
                correcoes['resultado'] = sum(int(n) for n in nums)

        if tipo in ['subtracao', 'subtração']:
            nums = dados_extraidos.get('numeros', [])
            if len(nums) >= 2:
                correcoes['resultado'] = int(nums[0]) - int(nums[1])

    except Exception as e:
        erros.append(str(e))

    return correcoes, erros


def detectar_genero(nome):
    """Detecta gênero pelo nome para usar artigo correto."""
    nome_lower = nome.lower()
    # Nomes femininos comuns
    femininos = ['maria','ana','julia','juliana','fernanda','patricia','beatriz','camila',
                 'carla','claudia','cristina','daniela','debora','elaine','fabiana','gabriela',
                 'leticia','lucia','luciana','mariana','natalia','paula','priscila','renata',
                 'sandra','simone','vanessa','viviane','professora','profa']
    for f in femininos:
        if f in nome_lower:
            return 'feminino'
    # Termina em 'a' geralmente feminino
    partes = nome_lower.split()
    for parte in partes:
        if parte.endswith('a') and parte not in ['costa','souza','silva','garcia','rocha']:
            return 'feminino'
    return 'masculino'


def chamar_openai(api_key, texto, imagem_base64, nivel, nome_prof):
    """Chama a API do OpenAI GPT-4o para analisar a questão."""
    niveis = {
        "1-3": "crianças de 6 a 8 anos (1° ao 3° ano). Use palavras BEM simples, exemplos com brinquedos e desenhos.",
        "4-5": "crianças de 9 a 10 anos (4° ao 5° ano). Use linguagem simples e exemplos do dia a dia.",
        "6-9": "alunos de 11 a 14 anos (6° ao 9° ano). Pode usar termos mais técnicos."
    }
    genero = detectar_genero(nome_prof)
    artigo = "a" if genero == "feminino" else "o"
    prof_a = "a" if genero == "feminino" else ""

    prompt = f"""Você é {artigo} {nome_prof}, um{prof_a} professor{prof_a} particular incrível, paciente e didático{prof_a}.
Está explicando uma tarefa de casa para {niveis.get(nivel, niveis["4-5"])}.

MISSÃO: Explicar a resolução COMPLETA passo a passo, como numa lousa, de forma EXTREMAMENTE didática.
- Use analogias do dia a dia (balas, frutas, dinheiro, pizza, etc.)
- Explique o PORQUÊ de cada passo, não apenas o como
- Linguagem natural, animada, como um professor falando em voz alta
- NÃO revele a resposta final (deixe o aluno descobrir)

REGRAS CRÍTICAS PARA O CAMPO "calculo":
- SEMPRE coloque o resultado correto nos passos intermediários. Ex: "4.2 × 100 = 420 cm"
- APENAS o passo FINAL deve ter "= ?" pois o aluno vai resolver
- Máximo 30 caracteres por calculo
- UMA única operação por calculo
- Pode incluir unidades simples (cm, m, kg, L) quando relevante
- SEM expoentes (^), SEM múltiplas operações na mesma linha
- Símbolos permitidos: + - × ÷ = . , ( ) e unidades simples
- EXEMPLOS CORRETOS: "4.2 × 100 = 420 cm", "1300 ÷ 420 = 3", "MDC(420,1300) ="
- EXEMPLOS ERRADOS: "420 = 2^2 × 3 × 5" (expoente e longo)

REGRAS PARA PASSOS (muito importante):
- Para MDC: mostre TODOS os passos do algoritmo de Euclides (divisões sucessivas)
- Para MMC: mostre TODOS os passos da fatoração
- Para frações: mostre cada operação separadamente
- Mínimo 4 passos, máximo 8 passos
- Cada passo deve ter UMA operação clara no canvas
- A explicação deve ser DIDÁTICA com analogia do dia a dia

RESPONDA em JSON válido (sem markdown, sem ```):
{{
  "saudacao": "frase curta animada de saudação mencionando o assunto",
  "questao_identificada": "texto exato da questão",
  "tipo_operacao": "soma|subtracao|multiplicacao|divisao|fracao|equacao|geometria|mdc|mmc|outro",
  "conceito": "explicação do conceito em 2-3 frases simples com analogia do dia a dia",
  "dados_extraidos": {{
    "descricao": "o que você identificou na imagem com os números",
    "numeros": [números principais da questão],
    "total": null,
    "denominador": null,
    "numerador": null
  }},
  "confirmacao_pergunta": "pergunta confirmando os dados identificados na imagem",
  "passos_lousa": [
    {{
      "titulo": "Passo N - nome curto",
      "explicacao": "explicacao didatica do passo com analogia se possivel",
      "calculo": "expressao matematica curta COM resultado (ex: 4,2 x 100 = 420 cm)"
    }}
  ],
  "tabela_fatoracao": {{
    "usar": true,
    "numeros": [420, 1300],
    "linhas": [
      {{"valores": [420, 1300], "primo": 2, "divide": true}},
      {{"valores": [210, 650], "primo": 2, "divide": true}},
      {{"valores": [105, 325], "primo": 5, "divide": true}},
      {{"valores": [21, 65], "primo": 7, "divide": false}},
      {{"valores": [3, 65], "primo": 13, "divide": false}},
      {{"valores": [1, 1], "primo": null, "divide": false}}
    ],
    "fatores_comuns": [2, 2, 5],
    "resultado": 20,
    "tipo": "MDC"
  }},
  "resposta_final": "",
  "dica_extra": "macete ou dica visual para lembrar",
  "encorajamento": "frase motivacional curta e carinhosa"
}}
REGRA IMPORTANTE: O campo "tabela_fatoracao.usar" deve ser true APENAS para questoes de MDC ou MMC.
Para MDC: use fatoracao simultanea - divida os numeros pelo mesmo primo quando TODOS dividem.
Para MMC: use fatoracao simultanea - divida quando PELO MENOS UM divide (use 1 para os que nao dividem).
Para outros tipos de questao: "tabela_fatoracao": {{"usar": false}}
{f"QUESTÃO: {texto}" if texto else "Analise a imagem e explique a resolução completa."}
Responda APENAS com JSON válido."""

    openai_key = os.environ.get("OPENAI_API_KEY", "") or api_key
    if not openai_key:
        return {"erro": "Chave OpenAI não configurada"}

    try:
        messages_content = [{"type": "text", "text": prompt}]
        if imagem_base64:
            img_data = imagem_base64
            if "," in img_data:
                img_data = img_data.split(",")[1]
            messages_content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{img_data}"}
            })

        system_prompt = """Você é um professor particular brasileiro, didático e animado.
Responda SEMPRE em JSON válido sem markdown.

MÉTODOS OBRIGATÓRIOS - USE EXATAMENTE COMO NAS ESCOLAS BRASILEIRAS (livros PNLD):

1. MDC e MMC: Use SEMPRE a DECOMPOSIÇÃO SIMULTÂNEA (fatoração simultânea).
   NUNCA use o Algoritmo de Euclides (divisões sucessivas com resto).
   REGRAS da fatoração simultânea:
   - Divida os números pelo menor primo possível a cada linha
   - Se o primo divide TODOS os números: divide=true (fator comum do MDC)
   - Se um número NÃO divide: REPITA ele na linha seguinte (não pule)
   - Continue até todos chegarem em 1
   - MDC = produto dos fatores com divide=true
   - MMC = produto de TODOS os fatores usados
   Exemplo MDC e MMC de 420 e 1300:
     420 | 1300 | 2  → divide=true
     210 |  650 | 2  → divide=true
     105 |  325 | 5  → divide=true
      21 |   65 | 3  → divide=false (65 não divide por 3, repete 65)
       7 |   65 | 7  → divide=false (65 não divide por 7, repete 65)
       1 |   65 | 5  → divide=false
       1 |   13 | 13 → divide=false
       1 |    1 |    → fim
   MDC(420,1300) = 2×2×5 = 20
   MMC(420,1300) = 2×2×5×3×7×5×13 = 27300
   Preencha tabela_fatoracao com TODAS as linhas acima.

2. MULTIPLICAÇÃO/DIVISÃO simples: "4,2 × 100 = 420 cm"
3. FRAÇÕES: mostre numerador e denominador separados
4. EQUAÇÕES: mostre cada passo de isolamento
5. REGRA DE TRÊS: monte tabela proporcional

Use analogias do dia a dia (balas, pizza, dinheiro, futebol).
NUNCA revele a resposta final - deixe o aluno descobrir.
Responda APENAS com JSON válido sem markdown."""

        payload = {
            "model": "gpt-4o",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": messages_content}
            ],
            "max_tokens": 8192,
            "temperature": 0.4,
            "response_format": {"type": "json_object"}
        }

        resp = http_requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=60
        )

        if resp.status_code != 200:
            return {"erro": f"Erro OpenAI: {resp.status_code} - {resp.text[:200]}"}

        raw = resp.json()["choices"][0]["message"]["content"]
        print(f"OpenAI RAW (primeiros 300): {raw[:300]}", flush=True)

        try:
            return json.loads(raw)
        except Exception as e:
            print(f"JSON ERRO OpenAI: {e}", flush=True)
            return {"erro": "Resposta da IA em formato inválido"}

    except requests.exceptions.Timeout:
        return {"erro": "A IA demorou muito para responder. Tente novamente."}
    except Exception as e:
        return {"erro": f"Erro ao conectar com a IA: {str(e)}"}


def chamar_gemini(api_key, texto, imagem_base64, nivel, nome_prof):
    """Chama a API do Gemini Vision para analisar a questão."""
    niveis = {
        "1-3": "crianças de 6 a 8 anos (1° ao 3° ano). Use palavras BEM simples, exemplos com brinquedos e desenhos.",
        "4-5": "crianças de 9 a 10 anos (4° ao 5° ano). Use linguagem simples e exemplos do dia a dia.",
        "6-9": "alunos de 11 a 14 anos (6° ao 9° ano). Pode usar termos mais técnicos."
    }

    genero = detectar_genero(nome_prof)
    artigo = "a" if genero == "feminino" else "o"
    titulo = "Professora" if genero == "feminino" else "Professor"
    prompt = f"""Você é {artigo} {nome_prof}, um{("a" if genero=="feminino" else "")} professor{"a" if genero=="feminino" else ""} particular incrível, paciente e didático{"a" if genero=="feminino" else ""}.
Você está explicando uma tarefa de casa para {niveis.get(nivel, niveis['4-5'])}.
Seja EXTREMAMENTE didático(a): use analogias do dia a dia, exemplos concretos, linguagem simples e acolhedora.
Explique o PORQUÊ de cada passo, não apenas o como. Faça o aluno ENTENDER, não apenas copiar.

Sua missão é explicar a resolução COMPLETA como se estivesse numa lousa, falando em voz alta para o aluno.
Escreva como um professor fala durante uma aula: natural, animado, detalhado.

REGRAS:
1. Identifique a questão na imagem ou no texto.
2. Explique o CONCEITO por trás do exercício antes de resolver.
3. Mostre os PASSOS DO RACIOCÍNIO passo a passo como na lousa, mas NÃO REVELE a resposta final.
4. Use exemplos do dia a dia para ilustrar (balas, frutas, dinheiro, etc.).
5. Mostre os cálculos intermediários mas deixe o resultado final em branco ou com "?".
6. Use linguagem adequada para a idade do aluno.
7. Seja encorajador e convide o aluno a tentar resolver agora.
8. O campo "resposta_final" deve ficar VAZIO - o aluno precisa tentar primeiro.

RESPONDA em JSON válido (sem markdown):
{{
  "saudacao": "frase curta e animada de saudação",
  "questao_identificada": "texto exato da questão encontrada",
  "tipo_operacao": "soma|subtração|multiplicação|divisão|fração|equação|geometria|outro",
  "conceito": "explicação do conceito/teoria por trás do exercício (2-3 frases simples)",
  "dados_extraidos": {{
    "descricao": "descreva exatamente o que você viu na imagem com os números identificados",
    "numeros": [lista dos números principais encontrados na questão],
    "total": numero total se aplicável,
    "denominador": denominador se for fração,
    "numerador": numerador se for fração
  }},
  "confirmacao_pergunta": "pergunta curta pedindo ao aluno para confirmar os dados que você identificou na imagem ex: Encontrei uma barra com 3 linhas e 6 colunas totalizando 18 quadradinhos. Está correto?",
  "passos_lousa": [
    {{
      "titulo": "Passo 1 - nome curto do passo",
      "explicacao": "texto explicativo do passo em linguagem simples para o aluno",
      "calculo": "APENAS UMA expressão matemática simples, máximo 25 caracteres, ex: 18 ÷ 6 = 3 ou 420 × 100 = . SEM texto, SEM palavras, SEM expoentes (^), SEM múltiplas operações na mesma linha, SÓ números e símbolos básicos (+ - × ÷ = . , ( ))"
    }}
  ],
  "resposta_final": "",
  "dica_extra": "um macete ou dica visual para lembrar esse tipo de problema",
  "encorajamento": "frase motivacional curta e carinhosa"
}}

{f'QUESTÃO DO ALUNO: {texto}' if texto else 'O aluno enviou uma foto da tarefa de casa. Analise a imagem e explique a resolução completa.'}

Responda APENAS com JSON válido."""

    parts = [{"text": prompt}]

    # Se tem imagem, adiciona como inline_data
    if imagem_base64:
        # Remove prefixo data:image/...;base64, se existir
        if "," in imagem_base64:
            header, img_data = imagem_base64.split(",", 1)
            mime = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
        else:
            img_data = imagem_base64
            mime = "image/jpeg"

        parts.append({
            "inline_data": {
                "mime_type": mime,
                "data": img_data
            }
        })

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    try:
        resp = http_requests.post(url, json={
            "contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 8192}
        }, timeout=30)

        if resp.status_code != 200:
            err = resp.json().get("error", {}).get("message", "Erro desconhecido")
            return {"erro": f"Erro do Gemini: {err}"}

        data = resp.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

        # Limpar markdown
        text = text.replace("```json", "").replace("```", "").strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            import re, sys
            print(f"JSON ERRO: {e}", file=sys.stderr)
            print(f"JSON RAW: {repr(text[:300])}", file=sys.stderr)
            # Segunda tentativa: regex para pegar só o objeto JSON
            match = re.search(r'(?s)\{.*\}', text)
            if match:
                try:
                    return json.loads(match.group())
                except Exception as e2:
                    print(f"REGEX PARSE ERRO: {e2}", file=sys.stderr)
            # Fallback
            return {
                "saudacao": "Oi! Aqui está a explicação:",
                "questao_identificada": texto or "questão da imagem",
                "conceito": "",
                "passos_lousa": [
                    {"titulo": "Explicação completa", "conteudo": text[:2000]}
                ],
                "resposta_final": "",
                "pergunta_verificacao": "",
                "dica_extra": "",
                "encorajamento": "Você consegue!"
            }

    except http_requests.exceptions.Timeout:
        return {"erro": "A IA demorou muito para responder. Tente novamente."}
    except Exception as e:
        return {"erro": f"Erro ao conectar com a IA: {str(e)}"}


def avaliar_tentativa(api_key, questao_original, resposta_correta, tentativa_texto, tentativa_imagem, nivel, nome_prof):
    """Avalia a tentativa do aluno e revela a resposta final."""
    niveis = {
        "1-3": "criança de 6 a 8 anos",
        "4-5": "criança de 9 a 10 anos",
        "6-9": "aluno de 11 a 14 anos"
    }
    prompt = f"""Você é o {nome_prof}, professor carinhoso e encorajador.
O aluno ({niveis.get(nivel, niveis['4-5'])}) acabou de tentar resolver a seguinte questão:
QUESTÃO: {questao_original}
RESPOSTA CORRETA: {resposta_correta}
TENTATIVA DO ALUNO: {tentativa_texto or '(enviou foto da tentativa)'}

Avalie a tentativa com carinho e revele a resposta final agora.

RESPONDA em JSON válido (sem markdown):
{{
  "acertou": true ou false,
  "parcialmente": true ou false,
  "elogio": "elogio caloroso pelo esforço independente do resultado",
  "avaliacao": "análise gentil da tentativa do aluno apontando o que acertou",
  "correcao": "se errou, explica onde errou de forma gentil e didática (vazio se acertou)",
  "resposta_final": "a resposta final completa e clara",
  "parabenizacao": "mensagem final motivadora"
}}
Responda APENAS com JSON válido."""

    parts = [{"text": prompt}]
    if tentativa_imagem:
        if "," in tentativa_imagem:
            header, img_data = tentativa_imagem.split(",", 1)
            mime = header.split(":")[1].split(";")[0] if ":" in header else "image/jpeg"
        else:
            img_data = tentativa_imagem
            mime = "image/jpeg"
        parts.append({"inline_data": {"mime_type": mime, "data": img_data}})

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    try:
        resp = http_requests.post(url, json={
            "contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1500}
        }, timeout=30)
        data = resp.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        text = text.replace("```json", "").replace("```", "").strip()
        try:
            return json.loads(text)
        except:
            import re
            match = re.search(r'(?s)\{.*\}', text)
            if match:
                try:
                    return json.loads(match.group())
                except:
                    pass
            return {"acertou": False, "parcialmente": False, "elogio": "Que esforço!", "avaliacao": text, "correcao": "", "resposta_final": "", "parabenizacao": "Continue tentando!"}
    except Exception as e:
        return {"erro": str(e)}


@app.route("/api/conversas")
@login_required
def listar_conversas():
    """Lista as conversas do aluno."""
    conn = get_db()
    conversas = conn.execute(
        "SELECT id, titulo, criada_em, ultima_msg FROM conversas WHERE usuario_id = ? ORDER BY ultima_msg DESC LIMIT 30",
        (session["user_id"],)
    ).fetchall()
    conn.close()
    return jsonify([dict(c) for c in conversas])


@app.route("/api/conversas/<conversa_id>")
@login_required
def ver_conversa(conversa_id):
    """Retorna as mensagens de uma conversa."""
    conn = get_db()
    # Verificar se a conversa pertence ao usuário
    conversa = conn.execute(
        "SELECT * FROM conversas WHERE id = ? AND usuario_id = ?",
        (conversa_id, session["user_id"])
    ).fetchone()
    if not conversa:
        conn.close()
        return jsonify({"erro": "Conversa não encontrada."}), 404

    mensagens = conn.execute(
        "SELECT id, tipo, conteudo, tem_imagem, criada_em FROM mensagens WHERE conversa_id = ? ORDER BY criada_em ASC",
        (conversa_id,)
    ).fetchall()
    conn.close()
    return jsonify([dict(m) for m in mensagens])


@app.route("/api/conversas/<conversa_id>", methods=["DELETE"])
@login_required
def deletar_conversa(conversa_id):
    """Deleta uma conversa e suas mensagens."""
    conn = get_db()
    conn.execute("DELETE FROM mensagens WHERE conversa_id = ?", (conversa_id,))
    conn.execute("DELETE FROM conversas WHERE id = ? AND usuario_id = ?",
                 (conversa_id, session["user_id"]))
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


# =================================================================
# GERADOR DE LOUSA (Pillow) — mantido do código original
# =================================================================
LARGURA = 800
ALTURA = 600
COR_FUNDO = (34, 60, 34)
COR_BORDA = (139, 90, 43)
COR_TEXTO = (255, 255, 255)
COR_DESTAQUE = (255, 255, 100)
COR_TITULO = (173, 216, 230)
BORDA = 20
SIMBOLOS = {"soma": "+", "subtração": "−", "multiplicação": "×", "divisão": "÷"}


def obter_fonte(tamanho):
    for caminho in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]:
        try:
            return ImageFont.truetype(caminho, tamanho)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def desenhar_bolinhas(draw, quantidade, x_inicio, y_inicio, grupos=1, cor=COR_DESTAQUE):
    raio, espacamento = 12, 30
    por_grupo = math.ceil(quantidade / max(grupos, 1))
    x, y, contador = x_inicio, y_inicio, 0
    for g in range(grupos):
        for _ in range(por_grupo):
            if contador >= quantidade:
                break
            draw.ellipse([x - raio, y - raio, x + raio, y + raio], fill=cor, outline=COR_TEXTO, width=1)
            x += espacamento
            contador += 1
        if g < grupos - 1 and contador < quantidade:
            x += 15
            draw.line([(x, y - 20), (x, y + 20)], fill=COR_TEXTO, width=2)
            x += 15


@app.route("/api/lousa", methods=["POST"])
@login_required
def gerar_lousa():
    """Gera imagem PNG da lousa com a conta."""
    dados = request.get_json()
    texto_lousa = dados.get("texto_lousa", "")
    numeros = dados.get("numeros", [])
    tipo_operacao = dados.get("tipo_operacao", "")
    dica_visual = dados.get("dica_visual", "")

    img = Image.new("RGB", (LARGURA, ALTURA), COR_FUNDO)
    draw = ImageDraw.Draw(img)

    draw.rectangle([0, 0, LARGURA - 1, ALTURA - 1], outline=COR_BORDA, width=BORDA)
    draw.rectangle([BORDA, BORDA, LARGURA - BORDA - 1, ALTURA - BORDA - 1], outline=(60, 90, 60), width=2)

    f_titulo = obter_fonte(28)
    f_conta = obter_fonte(52)
    f_texto = obter_fonte(20)
    f_dica = obter_fonte(16)
    y = BORDA + 30

    # Título
    titulo = "Professor IA - Lousa"
    bb = draw.textbbox((0, 0), titulo, font=f_titulo)
    draw.text(((LARGURA - (bb[2] - bb[0])) / 2, y), titulo, fill=COR_TITULO, font=f_titulo)
    y += 50

    draw.line([(BORDA + 30, y), (LARGURA - BORDA - 30, y)], fill=COR_TITULO, width=2)
    y += 30

    # Conta principal
    simbolo = SIMBOLOS.get(tipo_operacao, "?")
    if len(numeros) >= 2:
        conta = f"{numeros[0]} {simbolo} {numeros[1]} = ?"
    elif len(numeros) == 1:
        conta = f"{numeros[0]} {simbolo} ? = ?"
    else:
        conta = texto_lousa or "?"

    bb = draw.textbbox((0, 0), conta, font=f_conta)
    draw.text(((LARGURA - (bb[2] - bb[0])) / 2, y), conta, fill=COR_DESTAQUE, font=f_conta)
    y += 80

    if texto_lousa and texto_lousa != conta:
        for linha in texto_lousa.split("\n")[:3]:
            bb = draw.textbbox((0, 0), linha, font=f_texto)
            draw.text(((LARGURA - (bb[2] - bb[0])) / 2, y), linha, fill=COR_TEXTO, font=f_texto)
            y += 30
    y += 20

    # Bolinhas visuais
    if numeros and tipo_operacao in ("divisão", "multiplicação"):
        total = numeros[0] if numeros else 0
        grupos = numeros[1] if len(numeros) > 1 else 1
        if tipo_operacao == "divisão" and grupos > 0 and total <= 30:
            desenhar_bolinhas(draw, total, BORDA + 60, y, grupos)
            y += 50
    elif numeros and tipo_operacao == "soma" and sum(numeros) <= 30:
        desenhar_bolinhas(draw, numeros[0], BORDA + 60, y, cor=COR_DESTAQUE)
        y += 40
        if len(numeros) > 1:
            desenhar_bolinhas(draw, numeros[1], BORDA + 60, y, cor=(255, 180, 100))
            y += 40

    # Dica visual
    if dica_visual:
        y = max(y, ALTURA - BORDA - 80)
        draw.line([(BORDA + 30, y), (LARGURA - BORDA - 30, y)], fill=(60, 90, 60), width=1)
        y += 10
        palavras = f"Dica: {dica_visual}".split()
        linha = ""
        for p in palavras:
            teste = f"{linha} {p}".strip()
            bb = draw.textbbox((0, 0), teste, font=f_dica)
            if (bb[2] - bb[0]) > LARGURA - BORDA * 2 - 60:
                draw.text((BORDA + 40, y), linha, fill=(200, 200, 200), font=f_dica)
                y += 22
                linha = p
            else:
                linha = teste
        if linha:
            draw.text((BORDA + 40, y), linha, fill=(200, 200, 200), font=f_dica)

    # Efeito giz
    random.seed(42)
    for _ in range(200):
        draw.point(
            (random.randint(BORDA + 5, LARGURA - BORDA - 5), random.randint(BORDA + 5, ALTURA - BORDA - 5)),
            fill=(255, 255, 255, random.randint(5, 25))
        )

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return send_file(buf, mimetype="image/png", download_name="lousa.png")


# =================================================================
# HEALTH CHECK
# =================================================================
@app.route('/api/tts', methods=['POST'])
@login_required
def tts():
    """Converte texto em audio usando OpenAI TTS."""
    data = request.get_json()
    texto = data.get('texto', '')
    if not texto:
        return jsonify({"erro": "Texto vazio"}), 400

    openai_key = os.environ.get('OPENAI_API_KEY', '')
    if not openai_key:
        return jsonify({"erro": "OpenAI não configurada"}), 500

    conn = get_db()
    user = conn.execute("SELECT voz_narrador FROM usuarios WHERE id=?", (session["user_id"],)).fetchone()
    conn.close()
    voz = user["voz_narrador"] if user and user["voz_narrador"] else "onyx"

    try:
        resp = http_requests.post(
            "https://api.openai.com/v1/audio/speech",
            headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
            json={"model": "tts-1", "input": texto[:4096], "voice": voz, "speed": 0.9},
            timeout=30
        )
        if resp.status_code != 200:
            return jsonify({"erro": "Erro na OpenAI TTS"}), 500

        import base64
        audio_b64 = base64.b64encode(resp.content).decode('utf-8')
        return jsonify({"audio": audio_b64})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route('/api/avaliar', methods=['POST'])
@login_required
def avaliar():
    data = request.get_json()
    questao = data.get('questao', '')
    resposta_correta = data.get('resposta_correta', '')
    tentativa_texto = data.get('tentativa_texto', '')
    tentativa_imagem = data.get('tentativa_imagem', '')
    usuario_data = get_current_user()
    nivel = usuario_data.get('nivel', '4-5')
    nome_prof = usuario_data.get('nome_professor', 'Professor Max')
    gemini_key = usuario_data.get('gemini_key') or app.config.get('GEMINI_API_KEY')
    resultado = avaliar_tentativa(gemini_key, questao, resposta_correta, tentativa_texto, tentativa_imagem, nivel, nome_prof)
    return jsonify(resultado)


@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "Professor IA"})


# =================================================================
# INICIALIZAÇÃO
# =================================================================
if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    print("=" * 50)
    print("  Professor IA - Tutor de Matemática")
    print(f"  Rodando em http://localhost:{port}")
    print("=" * 50)
    app.run(host="0.0.0.0", port=port, debug=debug)
