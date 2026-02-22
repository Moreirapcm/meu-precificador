"""
=================================================================
SERVIDOR DA LOUSA - Professor IA
=================================================================
Este arquivo cria um servidor web (usando Flask) que gera imagens
de "lousa/quadro-negro" com contas de matemática.

Como funciona:
  1. O n8n envia os dados da questão (números, operação, etc.)
  2. Este servidor recebe via HTTP POST
  3. Usa a biblioteca Pillow para DESENHAR a imagem
  4. Retorna a imagem PNG pronta

Para rodar sozinho (sem Docker):
  pip install flask pillow
  python lousa_generator.py
  # Acesse http://localhost:5000/health para testar

Para testar a geração de imagem:
  curl -X POST http://localhost:5000/gerar-lousa \
    -H "Content-Type: application/json" \
    -d '{"texto_lousa":"10 + 5 = ?","numeros":[10,5],"tipo_operacao":"soma"}' \
    --output teste.png
=================================================================
"""

# ---------------------------------------------------------------
# IMPORTAÇÕES
# Cada 'import' traz uma ferramenta que vamos usar
# ---------------------------------------------------------------
import io       # Para trabalhar com dados em memória (a imagem antes de enviar)
import json     # Para ler dados JSON (formato de texto estruturado)
import math     # Para cálculos matemáticos (arredondar pra cima, etc.)
import random   # Para efeito aleatório de "giz" na lousa

# Flask = framework web (cria o servidor HTTP que recebe requisições)
from flask import Flask, request, send_file, jsonify

# Pillow (PIL) = biblioteca de imagem (cria e desenha imagens)
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------
# CRIAÇÃO DO APP FLASK
# Isso cria o "servidor web" que vai ficar escutando requisições
# ---------------------------------------------------------------
app = Flask(__name__)

# ---------------------------------------------------------------
# CONFIGURAÇÕES DA LOUSA
# Aqui definimos as cores e tamanhos da imagem.
# Você pode mudar esses valores para personalizar a aparência!
#
# Cores são definidas em RGB (Vermelho, Verde, Azul)
# Cada valor vai de 0 a 255
# (0,0,0) = preto   |   (255,255,255) = branco
# ---------------------------------------------------------------
LARGURA = 800                     # Largura da imagem em pixels
ALTURA = 600                      # Altura da imagem em pixels
COR_FUNDO = (34, 60, 34)         # Verde escuro (quadro-negro)
COR_BORDA = (139, 90, 43)        # Marrom (moldura de madeira)
COR_TEXTO = (255, 255, 255)      # Branco (giz normal)
COR_DESTAQUE = (255, 255, 100)   # Amarelo claro (giz destaque)
COR_TITULO = (173, 216, 230)     # Azul claro (título)
BORDA = 20                        # Espessura da borda em pixels

# Mapa de operações para seus símbolos matemáticos
SIMBOLOS = {
    "soma": "+",
    "subtração": "−",       # Obs: esse é o símbolo "menos" (−), não o hífen (-)
    "multiplicação": "×",
    "divisão": "÷",
}


def obter_fonte(tamanho):
    """
    Tenta carregar uma fonte bonita do sistema.
    Se não encontrar nenhuma, usa a fonte padrão do Pillow.

    Por que precisamos disso?
    - O Pillow precisa de um arquivo de fonte (.ttf) para escrever texto bonito
    - Dependendo do sistema operacional, as fontes ficam em caminhos diferentes
    - Tentamos vários caminhos comuns no Linux
    """
    caminhos_possiveis = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",      # Debian/Ubuntu
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",  # Fedora
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",        # Alternativa
    ]
    for caminho in caminhos_possiveis:
        try:
            return ImageFont.truetype(caminho, tamanho)
        except (IOError, OSError):
            continue  # Não encontrou? Tenta o próximo

    # Se nenhuma fonte foi encontrada, usa a default (menor e mais simples)
    return ImageFont.load_default()


def desenhar_bolinhas(draw, quantidade, x_inicio, y_inicio, grupos=1, cor=COR_DESTAQUE):
    """
    Desenha bolinhas coloridas na lousa para representar quantidades visualmente.

    Exemplo: para "10 ÷ 2", desenhamos 10 bolinhas em 2 grupos:
        ●●●●● | ●●●●●

    Parâmetros:
        draw       = objeto que desenha na imagem
        quantidade = total de bolinhas (ex: 10)
        x_inicio   = posição horizontal inicial
        y_inicio   = posição vertical
        grupos     = em quantos grupos dividir (ex: 2 para divisão)
        cor        = cor das bolinhas
    """
    raio = 12          # Tamanho de cada bolinha
    espacamento = 30   # Distância entre bolinhas

    # Calcula quantas bolinhas em cada grupo
    # math.ceil arredonda para cima: ceil(10/3) = 4
    por_grupo = math.ceil(quantidade / max(grupos, 1))

    x = x_inicio
    y = y_inicio
    contador = 0

    for g in range(grupos):
        for i in range(por_grupo):
            if contador >= quantidade:
                break

            # Desenha um círculo (bolinha)
            draw.ellipse(
                [x - raio, y - raio, x + raio, y + raio],  # Coordenadas do retângulo que contém o círculo
                fill=cor,           # Cor de preenchimento
                outline=COR_TEXTO,  # Cor da borda
                width=1,            # Espessura da borda
            )
            x += espacamento   # Move para a direita
            contador += 1

        # Desenha uma linha vertical separando os grupos
        if g < grupos - 1 and contador < quantidade:
            x += 15
            draw.line([(x, y - 20), (x, y + 20)], fill=COR_TEXTO, width=2)
            x += 15


def gerar_imagem_lousa(texto_lousa, numeros, tipo_operacao, dica_visual=""):
    """
    FUNÇÃO PRINCIPAL: Gera a imagem da lousa com a conta.

    Passo a passo do que essa função faz:
    1. Cria uma imagem verde (fundo do quadro)
    2. Desenha a borda de madeira
    3. Escreve o título
    4. Escreve a conta em destaque (ex: "10 ÷ 2 = ?")
    5. Desenha bolinhas visuais (se aplicável)
    6. Adiciona a dica visual
    7. Aplica efeito de textura de giz
    8. Retorna a imagem pronta

    Parâmetros:
        texto_lousa    = texto descritivo da conta
        numeros        = lista de números (ex: [10, 2])
        tipo_operacao  = "soma", "subtração", "multiplicação" ou "divisão"
        dica_visual    = texto de dica para mostrar no rodapé
    """

    # --- PASSO 1: Criar a imagem base ---
    # Image.new cria uma imagem do zero: modo RGB, tamanho, cor de fundo
    img = Image.new("RGB", (LARGURA, ALTURA), COR_FUNDO)

    # ImageDraw permite DESENHAR sobre a imagem (linhas, textos, formas)
    draw = ImageDraw.Draw(img)

    # --- PASSO 2: Desenhar a borda de madeira ---
    # Rectangle = retângulo. Fazemos um grande na borda toda.
    draw.rectangle([0, 0, LARGURA - 1, ALTURA - 1], outline=COR_BORDA, width=BORDA)
    # Borda interna mais fina (detalhe visual)
    draw.rectangle(
        [BORDA, BORDA, LARGURA - BORDA - 1, ALTURA - BORDA - 1],
        outline=(60, 90, 60),  # Verde um pouco mais claro
        width=2,
    )

    # --- Carregar fontes em diferentes tamanhos ---
    fonte_titulo = obter_fonte(28)   # Título
    fonte_conta = obter_fonte(52)    # Conta principal (BEM grande)
    fonte_texto = obter_fonte(20)    # Texto normal
    fonte_dica = obter_fonte(16)     # Dica (menor)

    # y_pos controla a posição VERTICAL (vai descendo conforme adicionamos coisas)
    y_pos = BORDA + 30

    # --- PASSO 3: Escrever o título ---
    titulo = "Professor IA - Lousa"

    # textbbox calcula o tamanho que o texto vai ocupar
    bbox = draw.textbbox((0, 0), titulo, font=fonte_titulo)
    tw = bbox[2] - bbox[0]  # largura do texto

    # Centraliza: (LARGURA - largura_do_texto) / 2
    draw.text(((LARGURA - tw) / 2, y_pos), titulo, fill=COR_TITULO, font=fonte_titulo)
    y_pos += 50  # Desce para a próxima linha

    # Linha decorativa horizontal
    draw.line(
        [(BORDA + 30, y_pos), (LARGURA - BORDA - 30, y_pos)],
        fill=COR_TITULO,
        width=2,
    )
    y_pos += 30

    # --- PASSO 4: Escrever a conta em destaque ---
    # Escolhe o símbolo correto (+ - × ÷)
    simbolo = SIMBOLOS.get(tipo_operacao, "?")

    # Monta a string da conta
    if len(numeros) >= 2:
        conta = f"{numeros[0]} {simbolo} {numeros[1]} = ?"
    elif len(numeros) == 1:
        conta = f"{numeros[0]} {simbolo} ? = ?"
    else:
        conta = texto_lousa  # Se não tem números, usa o texto original

    # Centraliza e escreve em AMARELO GRANDE
    bbox = draw.textbbox((0, 0), conta, font=fonte_conta)
    tw = bbox[2] - bbox[0]
    draw.text(((LARGURA - tw) / 2, y_pos), conta, fill=COR_DESTAQUE, font=fonte_conta)
    y_pos += 80

    # Texto complementar da lousa (se diferente da conta)
    if texto_lousa and texto_lousa != conta:
        linhas = texto_lousa.split("\n")
        for linha in linhas[:3]:  # Máximo 3 linhas para não estourar
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

    # --- PASSO 5: Desenhar bolinhas visuais ---
    # Só desenha se os números forem pequenos (até 30), senão fica poluído

    if numeros and tipo_operacao in ("divisão", "multiplicação"):
        total = numeros[0] if numeros else 0
        grupos = numeros[1] if len(numeros) > 1 else 1
        if tipo_operacao == "divisão" and grupos > 0 and total <= 30:
            # Ex: 10÷2 = 10 bolinhas em 2 grupos: ●●●●● | ●●●●●
            desenhar_bolinhas(draw, total, BORDA + 60, y_pos, grupos)
            y_pos += 50

    elif numeros and tipo_operacao == "soma" and sum(numeros) <= 30:
        # Ex: 10+5 = uma fileira de 10 amarelas + uma fileira de 5 laranjas
        desenhar_bolinhas(draw, numeros[0], BORDA + 60, y_pos, cor=COR_DESTAQUE)
        y_pos += 40
        if len(numeros) > 1:
            desenhar_bolinhas(
                draw,
                numeros[1],
                BORDA + 60,
                y_pos,
                cor=(255, 180, 100),  # Laranja para diferenciar
            )
            y_pos += 40

    # --- PASSO 6: Adicionar dica visual no rodapé ---
    if dica_visual:
        # Posiciona a dica perto do final da imagem
        y_pos = max(y_pos, ALTURA - BORDA - 80)

        # Linha separadora
        draw.line(
            [(BORDA + 30, y_pos), (LARGURA - BORDA - 30, y_pos)],
            fill=(60, 90, 60),
            width=1,
        )
        y_pos += 10

        dica_texto = f"Dica: {dica_visual}"

        # Quebra automática de texto (se for muito longo para uma linha)
        palavras = dica_texto.split()
        linha = ""
        for palavra in palavras:
            teste = f"{linha} {palavra}".strip()
            bbox = draw.textbbox((0, 0), teste, font=fonte_dica)
            tw = bbox[2] - bbox[0]

            if tw > LARGURA - BORDA * 2 - 60:
                # Linha ficou longa demais, escreve e começa nova linha
                draw.text(
                    (BORDA + 40, y_pos), linha, fill=(200, 200, 200), font=fonte_dica
                )
                y_pos += 22
                linha = palavra
            else:
                linha = teste

        # Escreve a última linha
        if linha:
            draw.text(
                (BORDA + 40, y_pos), linha, fill=(200, 200, 200), font=fonte_dica
            )

    # --- PASSO 7: Efeito de textura de giz ---
    # Adiciona pontinhos brancos aleatórios para parecer giz de verdade
    random.seed(42)  # Seed fixo = mesmos pontos sempre (consistência)
    for _ in range(200):
        rx = random.randint(BORDA + 5, LARGURA - BORDA - 5)
        ry = random.randint(BORDA + 5, ALTURA - BORDA - 5)
        alpha = random.randint(5, 25)  # Bem transparente (sutil)
        draw.point((rx, ry), fill=(255, 255, 255, alpha))

    # --- PASSO 8: Retorna a imagem pronta ---
    return img


# ---------------------------------------------------------------
# ENDPOINTS (rotas HTTP do servidor)
# São os "endereços" que o servidor aceita requisições
# ---------------------------------------------------------------

@app.route("/gerar-lousa", methods=["POST"])
def endpoint_gerar_lousa():
    """
    Endpoint principal: recebe dados JSON e retorna imagem PNG.

    O n8n chama esse endpoint assim:
        POST http://localhost:5000/gerar-lousa
        Body: {
            "texto_lousa": "10 dividido por 2",
            "numeros": [10, 2],
            "tipo_operacao": "divisão",
            "dica_visual": "Imagine 10 balas para 2 amigos"
        }

    Retorna: imagem PNG da lousa
    """
    try:
        # 1. Pega os dados que vieram na requisição
        dados = request.get_json()
        texto_lousa = dados.get("texto_lousa", "")
        numeros = dados.get("numeros", [])
        tipo_operacao = dados.get("tipo_operacao", "")
        dica_visual = dados.get("dica_visual", "")

        # 2. Gera a imagem
        img = gerar_imagem_lousa(texto_lousa, numeros, tipo_operacao, dica_visual)

        # 3. Salva em memória (não em arquivo) e retorna
        buffer = io.BytesIO()           # Cria um "arquivo virtual" em memória
        img.save(buffer, format="PNG")  # Salva a imagem nele
        buffer.seek(0)                  # Volta ao início para leitura

        return send_file(buffer, mimetype="image/png", download_name="lousa.png")

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """
    Health check: verifica se o servidor está vivo.

    Acesse http://localhost:5000/health para testar.
    O Docker usa isso para verificar se o container está saudável.
    """
    return jsonify({"status": "ok", "service": "Professor IA - Lousa Generator"})


# ---------------------------------------------------------------
# INICIALIZAÇÃO
# Esse bloco só roda quando você executa: python lousa_generator.py
# (não roda quando importado como módulo)
# ---------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 50)
    print("  Professor IA - Servidor da Lousa")
    print("  Rodando em http://localhost:5000")
    print("  Health check: http://localhost:5000/health")
    print("=" * 50)
    app.run(host="0.0.0.0", port=5000, debug=False)
