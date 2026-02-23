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
    user = conn.execute("SELECT id, nome, email, nivel, gemini_key, nome_professor FROM usuarios WHERE id = ?",
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
        "tem_gemini": bool(user["gemini_key"] or GEMINI_API_KEY_GLOBAL)
    })


# =================================================================
# ROTAS DE CONFIGURAÇÃO
# =================================================================
@app.route("/api/config", methods=["POST"])
@login_required
def salvar_config():
    """Salva configurações do aluno."""
    dados = request.get_json()
    conn = get_db()
    conn.execute(
        "UPDATE usuarios SET nivel=?, gemini_key=?, nome_professor=? WHERE id=?",
        (
            dados.get("nivel", "4-5"),
            dados.get("gemini_key", ""),
            dados.get("nome_professor", "Professor Max"),
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
    resposta_ia = chamar_gemini(gemini_key, texto, imagem_base64, nivel, nome_prof)

    if "erro" in resposta_ia:
        return jsonify(resposta_ia), 500

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


def chamar_gemini(api_key, texto, imagem_base64, nivel, nome_prof):
    """Chama a API do Gemini Vision para analisar a questão."""
    niveis = {
        "1-3": "crianças de 6 a 8 anos (1° ao 3° ano). Use palavras BEM simples, exemplos com brinquedos e desenhos.",
        "4-5": "crianças de 9 a 10 anos (4° ao 5° ano). Use linguagem simples e exemplos do dia a dia.",
        "6-9": "alunos de 11 a 14 anos (6° ao 9° ano). Pode usar termos mais técnicos."
    }

    prompt = f"""Você é o {nome_prof}, um professor de matemática paciente, divertido e carinhoso.
Você ensina para {niveis.get(nivel, niveis['4-5'])}

SUA MISSÃO: Agir como um professor DE VERDADE dando aula na lousa.
Você deve RESOLVER a questão passo a passo, como se estivesse escrevendo na lousa para a turma.

REGRAS:
1. RESOLVA a questão COMPLETAMENTE, mostrando TODOS os passos na lousa.
2. Explique CADA passo como se estivesse falando para a turma ("Olhem aqui, pessoal...")
3. Use exemplos do dia a dia para ilustrar o conceito.
4. Seja encorajador, positivo e divertido.
5. Se houver alternativas, indique a correta e explique POR QUE as outras estão erradas.
6. Se houver imagem, analise a questão nela com atenção.

RESPONDA em JSON válido (sem markdown, sem ```):
{{
  "saudacao": "frase curta de saudação animada",
  "questao_identificada": "transcrição resumida da questão",
  "conceito": "nome do conceito matemático envolvido e uma explicação simples dele (2-3 frases)",
  "passos_lousa": [
    {{
      "titulo": "Passo 1: Título curto do passo",
      "conteudo": "Explicação detalhada deste passo, como se estivesse escrevendo e falando na lousa. Pode incluir cálculos, exemplos visuais, etc."
    }},
    {{
      "titulo": "Passo 2: Título curto",
      "conteudo": "Explicação do segundo passo..."
    }}
  ],
  "resposta_final": "A resposta é X porque...",
  "pergunta_verificacao": "Uma pergunta para o aluno confirmar que entendeu",
  "dica_extra": "Um truque ou macete para lembrar deste tipo de questão",
  "encorajamento": "frase motivacional curta e animada"
}}

IMPORTANTE:
- O campo "passos_lousa" deve ter entre 3 e 6 passos detalhados.
- Cada passo deve ser claro e completo. Escreva como se fosse uma aula de verdade.
- Use linguagem oral, como se estivesse falando para a turma na frente da lousa.

{f'QUESTÃO DO ALUNO: {texto}' if texto else 'O aluno enviou uma foto da questão. Analise a imagem com atenção e resolva.'}

Responda APENAS com o JSON válido, sem nenhum texto antes ou depois."""

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

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"

    try:
        resp = http_requests.post(url, json={
            "contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 4000}
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
        except json.JSONDecodeError:
            # Se o Gemini não retornou JSON válido, tenta encapsular
            return {
                "saudacao": "Oi! Vamos resolver juntos!",
                "questao_identificada": texto or "questão da imagem",
                "conceito": "",
                "passos_lousa": [
                    {"titulo": "Resolução", "conteudo": text}
                ],
                "resposta_final": "",
                "pergunta_verificacao": "Entendeu? Me conta o que achou!",
                "dica_extra": "",
                "encorajamento": "Você consegue!"
            }

    except http_requests.exceptions.Timeout:
        return {"erro": "A IA demorou muito para responder. Tente novamente."}
    except Exception as e:
        return {"erro": f"Erro ao conectar com a IA: {str(e)}"}


# =================================================================
# HISTÓRICO DE CONVERSAS
# =================================================================
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
