"""
Servidor Flask para gerar imagens de "lousa" para o Professor IA.
Recebe dados da questão e gera uma imagem estilizada de quadro-negro
com a conta matemática destacada.

Uso: python lousa_generator.py
Endpoint: POST /gerar-lousa
"""

import io
import json
import math
from flask import Flask, request, send_file, jsonify
from PIL import Image, ImageDraw, ImageFont

app = Flask(__name__)

# Configurações da lousa
LARGURA = 800
ALTURA = 600
COR_FUNDO = (34, 60, 34)         # Verde quadro-negro
COR_BORDA = (139, 90, 43)        # Marrom madeira
COR_TEXTO = (255, 255, 255)      # Branco giz
COR_DESTAQUE = (255, 255, 100)   # Amarelo giz
COR_TITULO = (173, 216, 230)     # Azul claro
BORDA = 20

# Símbolos das operações
SIMBOLOS = {
    "soma": "+",
    "subtração": "−",
    "multiplicação": "×",
    "divisão": "÷",
}


def obter_fonte(tamanho):
    """Tenta carregar fonte, com fallback para default."""
    caminhos = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    ]
    for caminho in caminhos:
        try:
            return ImageFont.truetype(caminho, tamanho)
        except (IOError, OSError):
            continue
    return ImageFont.load_default()


def desenhar_bolinhas(draw, quantidade, x_inicio, y_inicio, grupos=1, cor=COR_DESTAQUE):
    """Desenha bolinhas como representação visual (dica visual)."""
    raio = 12
    espacamento = 30
    por_grupo = math.ceil(quantidade / max(grupos, 1))
    x = x_inicio
    y = y_inicio
    contador = 0
    for g in range(grupos):
        for i in range(por_grupo):
            if contador >= quantidade:
                break
            draw.ellipse(
                [x - raio, y - raio, x + raio, y + raio],
                fill=cor,
                outline=COR_TEXTO,
                width=1,
            )
            x += espacamento
            contador += 1
        # Separador entre grupos
        if g < grupos - 1 and contador < quantidade:
            x += 15
            draw.line([(x, y - 20), (x, y + 20)], fill=COR_TEXTO, width=2)
            x += 15


def gerar_imagem_lousa(texto_lousa, numeros, tipo_operacao, dica_visual=""):
    """Gera a imagem da lousa com a conta destacada."""
    img = Image.new("RGB", (LARGURA, ALTURA), COR_FUNDO)
    draw = ImageDraw.Draw(img)

    # Borda de madeira
    draw.rectangle([0, 0, LARGURA - 1, ALTURA - 1], outline=COR_BORDA, width=BORDA)
    # Borda interna
    draw.rectangle(
        [BORDA, BORDA, LARGURA - BORDA - 1, ALTURA - BORDA - 1],
        outline=(60, 90, 60),
        width=2,
    )

    fonte_titulo = obter_fonte(28)
    fonte_conta = obter_fonte(52)
    fonte_texto = obter_fonte(20)
    fonte_dica = obter_fonte(16)

    y_pos = BORDA + 30

    # Título
    titulo = "📚 Professor IA - Lousa"
    bbox = draw.textbbox((0, 0), titulo, font=fonte_titulo)
    tw = bbox[2] - bbox[0]
    draw.text(((LARGURA - tw) / 2, y_pos), titulo, fill=COR_TITULO, font=fonte_titulo)
    y_pos += 50

    # Linha decorativa
    draw.line(
        [(BORDA + 30, y_pos), (LARGURA - BORDA - 30, y_pos)],
        fill=COR_TITULO,
        width=2,
    )
    y_pos += 30

    # Conta principal
    simbolo = SIMBOLOS.get(tipo_operacao, "?")
    if len(numeros) >= 2:
        conta = f"{numeros[0]} {simbolo} {numeros[1]} = ?"
    elif len(numeros) == 1:
        conta = f"{numeros[0]} {simbolo} ? = ?"
    else:
        conta = texto_lousa

    bbox = draw.textbbox((0, 0), conta, font=fonte_conta)
    tw = bbox[2] - bbox[0]
    draw.text(((LARGURA - tw) / 2, y_pos), conta, fill=COR_DESTAQUE, font=fonte_conta)
    y_pos += 80

    # Texto da lousa original
    if texto_lousa and texto_lousa != conta:
        linhas = texto_lousa.split("\n")
        for linha in linhas[:3]:
            bbox = draw.textbbox((0, 0), linha, font=fonte_texto)
            tw = bbox[2] - bbox[0]
            draw.text(
                ((LARGURA - tw) / 2, y_pos),
                linha,
                fill=COR_TEXTO,
                font=fonte_texto,
            )
            y_pos += 30

    y_pos += 20

    # Representação visual com bolinhas
    if numeros and tipo_operacao in ("divisão", "multiplicação"):
        total = numeros[0] if numeros else 0
        grupos = numeros[1] if len(numeros) > 1 else 1
        if tipo_operacao == "divisão" and grupos > 0 and total <= 30:
            desenhar_bolinhas(draw, total, BORDA + 60, y_pos, grupos)
            y_pos += 50
    elif numeros and tipo_operacao == "soma" and sum(numeros) <= 30:
        desenhar_bolinhas(draw, numeros[0], BORDA + 60, y_pos, cor=COR_DESTAQUE)
        y_pos += 40
        if len(numeros) > 1:
            desenhar_bolinhas(
                draw,
                numeros[1],
                BORDA + 60,
                y_pos,
                cor=(255, 180, 100),
            )
            y_pos += 40

    # Dica visual
    if dica_visual:
        y_pos = max(y_pos, ALTURA - BORDA - 80)
        draw.line(
            [(BORDA + 30, y_pos), (LARGURA - BORDA - 30, y_pos)],
            fill=(60, 90, 60),
            width=1,
        )
        y_pos += 10
        dica_texto = f"💡 {dica_visual}"
        # Quebrar texto longo
        palavras = dica_texto.split()
        linha = ""
        for palavra in palavras:
            teste = f"{linha} {palavra}".strip()
            bbox = draw.textbbox((0, 0), teste, font=fonte_dica)
            tw = bbox[2] - bbox[0]
            if tw > LARGURA - BORDA * 2 - 60:
                draw.text(
                    (BORDA + 40, y_pos), linha, fill=(200, 200, 200), font=fonte_dica
                )
                y_pos += 22
                linha = palavra
            else:
                linha = teste
        if linha:
            draw.text(
                (BORDA + 40, y_pos), linha, fill=(200, 200, 200), font=fonte_dica
            )

    # Efeito giz (pontos aleatórios sutis)
    import random

    random.seed(42)
    for _ in range(200):
        rx = random.randint(BORDA + 5, LARGURA - BORDA - 5)
        ry = random.randint(BORDA + 5, ALTURA - BORDA - 5)
        alpha = random.randint(5, 25)
        draw.point((rx, ry), fill=(255, 255, 255, alpha))

    return img


@app.route("/gerar-lousa", methods=["POST"])
def endpoint_gerar_lousa():
    """Endpoint para gerar imagem da lousa."""
    try:
        dados = request.get_json()
        texto_lousa = dados.get("texto_lousa", "")
        numeros = dados.get("numeros", [])
        tipo_operacao = dados.get("tipo_operacao", "")
        dica_visual = dados.get("dica_visual", "")

        img = gerar_imagem_lousa(texto_lousa, numeros, tipo_operacao, dica_visual)

        buffer = io.BytesIO()
        img.save(buffer, format="PNG", quality=95)
        buffer.seek(0)

        return send_file(buffer, mimetype="image/png", download_name="lousa.png")

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok", "service": "Professor IA - Lousa Generator"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
