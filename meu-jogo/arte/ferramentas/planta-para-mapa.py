#!/usr/bin/env python3
"""Converte uma PLANTA pintada (imagem em cores chapadas) num mapa do jogo.

A planta é desenhada por IA como mapa técnico — azul é água, branco é rua,
preto é quarteirão de pé, cinza é entulho, verde é praça — e aqui ela vira uma
string de um caractere por célula, embutida em `src/mapas.js`.

Vira TEXTO, e não imagem carregada em tempo de jogo, por dois motivos: imagem
carrega de forma assíncrona e o mundo é montado de uma vez, no construtor; e os
testes rodam em Node, sem canvas. Texto funciona nos dois e continua abrindo
por `file://`.

    planta-para-mapa.py planta.png nome 70 >> src/mapas.js
"""
import sys, pathlib
from PIL import Image

entrada, nome = sys.argv[1], sys.argv[2]
lado = int(sys.argv[3]) if len(sys.argv) > 3 else 70

img = Image.open(entrada).convert('RGB')
L, A = img.size
px = img.load()

# cor de referência -> caractere de terreno
ALVOS = [
    ((0, 0, 255), '~'),      # água
    ((255, 255, 255), '.'),  # rua
    ((0, 0, 0), '#'),        # quarteirão de pé (ruína)
    ((128, 128, 128), ':'),  # entulho
    ((0, 255, 0), ','),      # praça: anda e constrói, mas o desenho põe mato
]

def classificar(r, g, b):
    melhor, dist = '.', 1e9
    for (cr, cg, cb), ch in ALVOS:
        d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if d < dist:
            dist, melhor = d, ch
    return melhor

linhas = []
for cy in range(lado):
    linha = []
    for cx in range(lado):
        # voto da maioria dentro do bloco: a borda entre duas cores não decide
        conta = {}
        x0, x1 = cx * L // lado, max(cx * L // lado + 1, (cx + 1) * L // lado)
        y0, y1 = cy * A // lado, max(cy * A // lado + 1, (cy + 1) * A // lado)
        passo_x = max(1, (x1 - x0) // 4)
        passo_y = max(1, (y1 - y0) // 4)
        for y in range(y0, y1, passo_y):
            for x in range(x0, x1, passo_x):
                ch = classificar(*px[x, y])
                conta[ch] = conta.get(ch, 0) + 1
        # a rua ganha empate: corredor cortado quebra o mapa, quarteirão furado não
        melhor = max(conta.items(), key=lambda kv: (kv[1], kv[0] == '.'))[0]
        linha.append(melhor)
    linhas.append(''.join(linha))

print("  MAPAS['%s'] = {" % nome)
print("    lado: %d," % lado)
print("    celulas: [")
for l in linhas:
    print("      '%s'," % l)
print("    ].join('')")
print("  };")
