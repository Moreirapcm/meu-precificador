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

img = Image.open(entrada).convert('RGBA')
L, A = img.size
alfa = img.getchannel('A').load()
visto = bytearray(L * A)
caixas = []

for y0 in range(A):
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
caixas.sort(key=lambda c: (round(c[1] / 120), c[0]))
prefixo.parent.mkdir(parents=True, exist_ok=True)
for i, (xi, yi, xa, ya, n) in enumerate(caixas, 1):
    peca = img.crop((xi, yi, xa, ya))
    saida = prefixo.parent / (prefixo.name + '-%d.png' % i)
    peca.save(saida)
    print('%s  %dx%d  %d px' % (saida, xa - xi, ya - yi, n))
print('%d peças' % len(caixas))
