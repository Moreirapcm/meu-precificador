#!/usr/bin/env python3
"""Separa uma FOLHA de peças (várias peças soltas num fundo já recortado) em
arquivos individuais, um por peça.

Existe porque pedir seis peças numa geração só é o que mantém o estilo igual
entre elas — o mesmo motivo das tiras de animação. Mas o jogo precisa de cada
peça sozinha, no seu próprio arquivo, para poder espalhá-las pelo mapa.

O corte não é em grade: é por ilha de pixels opacos. Grade erra sempre que o
gerador não respeita o alinhamento pedido, e ele quase nunca respeita.

    fatiar-folha.py folha.png saida/prefixo [--min 4000]
"""
import sys, pathlib
from collections import deque
from PIL import Image

entrada = pathlib.Path(sys.argv[1])
prefixo = pathlib.Path(sys.argv[2])
minimo = 4000
if '--min' in sys.argv:
    minimo = int(sys.argv[sys.argv.index('--min') + 1])
colunas = 0
if '--colunas' in sys.argv:
    colunas = int(sys.argv[sys.argv.index('--colunas') + 1])

img = Image.open(entrada).convert('RGBA')
L, A = img.size
alfa = img.getchannel('A').load()


def por_colunas(n):
    """Corta em N faixas verticais, acertando o corte no VALE mais vazio.

    A separação por ilha de pixels falha quando as peças se encostam — e elas
    se encostam sempre que uma tem fogo, fumaça ou uma arma comprida saindo
    para o lado. Aqui o corte é guiado pelo perfil de opacidade: soma-se o alfa
    de cada coluna e procura-se, perto de onde a divisão ideal cairia, a coluna
    de menor soma. É onde o desenho é mais fino, que é onde doer menos.
    """
    perfil = []
    for x in range(L):
        soma = 0
        for y in range(0, A, 3):
            soma += alfa[x, y]
        perfil.append(soma)
    cortes = [0]
    janela = max(6, L // (n * 6))
    for i in range(1, n):
        ideal = i * L // n
        ini = max(1, ideal - janela)
        fim = min(L - 1, ideal + janela)
        melhor = min(range(ini, fim), key=lambda x: perfil[x])
        cortes.append(melhor)
    cortes.append(L)
    caixas = []
    for i in range(n):
        faixa = img.crop((cortes[i], 0, cortes[i + 1], A))
        caixa = faixa.getbbox()
        if not caixa:
            continue
        caixas.append((cortes[i] + caixa[0], caixa[1],
                       cortes[i] + caixa[2], caixa[3], 0))
    return caixas
visto = bytearray(L * A)
caixas = []

if colunas:
    caixas = por_colunas(colunas)

for y0 in range(A) if not colunas else []:
    for x0 in range(L):
        if visto[y0 * L + x0] or alfa[x0, y0] < 40:
            continue
        fila = deque([(x0, y0)])
        visto[y0 * L + x0] = 1
        n = 0
        xi = xa = x0
        yi = ya = y0
        while fila:
            x, y = fila.popleft()
            n += 1
            xi, xa = min(xi, x), max(xa, x)
            yi, ya = min(yi, y), max(ya, y)
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < L and 0 <= ny < A and not visto[ny * L + nx] and alfa[nx, ny] >= 40:
                    visto[ny * L + nx] = 1
                    fila.append((nx, ny))
        if n >= minimo:
            caixas.append((xi, yi, xa + 1, ya + 1, n))

# ordem de leitura: linha de cima para baixo, esquerda para direita
if not colunas:
    caixas.sort(key=lambda c: (round(c[1] / 120), c[0]))
prefixo.parent.mkdir(parents=True, exist_ok=True)
for i, (xi, yi, xa, ya, n) in enumerate(caixas, 1):
    peca = img.crop((xi, yi, xa, ya))
    saida = prefixo.parent / (prefixo.name + '-%d.png' % i)
    peca.save(saida)
    print('%s  %dx%d  %d px' % (saida, xa - xi, ya - yi, n))
print('%d peças' % len(caixas))
