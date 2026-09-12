#!/usr/bin/env python3
"""Desenha a tira de bonecos de palito do ciclo de caminhada.

Existe porque DESCREVER a pose em texto não funciona: o gerador de imagem
entende o pedido e mesmo assim devolve a figura quase parada, puxada de volta
pelo que ele mais viu — gente em pé. Pose entra por imagem, não por palavra.
Desenhando aqui, a passada é garantida por construção: os ângulos são estes,
não os que o modelo achar razoáveis.

    python3 guia-poses.py saida.png
"""
import math, subprocess, sys, tempfile, pathlib

# Ciclo clássico de 4 poses. Ângulos em graus, medidos da vertical:
# positivo = à frente. (coxa_esq, joelho_esq, coxa_dir, joelho_dir, braco_esq, braco_dir)
# Ciclo clássico: contact, passing, e os dois espelhados. Ângulos em graus,
# medidos da vertical; positivo = à frente. O quadril humano leva a coxa a ~30°
# à frente e ~10° atrás; o joelho da perna que balança chega a ~60°; o ombro faz
# 20 a 30°. São esses números, não chute.
POSES = [
    # (coxa_e, joelho_e, coxa_d, joelho_d, ombro_e, cotovelo_e, ombro_d, cotovelo_d)
    ("contact",  (-20,  10,  28,   5,   24,  12, -18,  10)),
    ("passing",  ( 16,  60,  -6,   6,    4,  14,  -4,  12)),
    ("contact2", ( 28,   5, -20,  10,  -18,  10,  24,  12)),
    ("passing2", ( -6,   6,  16,  60,   -4,  12,   4,  14)),
]
# O corpo DESCE no contato (o peso cai sobre a perna da frente) e SOBE na
# passagem (perna de apoio esticada). É o contrário do que parece intuitivo, e
# é o que separa uma caminhada de um boneco deslizando.
SOBE = [4, -8, 4, -8]

L, A = 220, 340              # quadro
QUADRIL, OMBRO = 200, 105    # alturas no quadro
COXA, CANELA, BRACO = 52, 52, 50

def ponto(x, y, ang, comp):
    r = math.radians(ang)
    return x + math.sin(r) * comp, y + math.cos(r) * comp

def boneco(dx, pose, sobe):
    ce, je, cd, jd, oe, te, od, td = pose
    qx, qy = dx + L / 2, QUADRIL + sobe
    ox, oy = dx + L / 2, OMBRO + sobe
    p = [f'<line x1="{ox}" y1="{oy}" x2="{qx}" y2="{qy}"/>',
         f'<circle cx="{ox}" cy="{oy - 26}" r="19"/>']
    for coxa, joelho in ((ce, je), (cd, jd)):
        jx, jy = ponto(qx, qy, coxa, COXA)
        px, py = ponto(jx, jy, coxa - joelho, CANELA)
        p.append(f'<line x1="{qx}" y1="{qy}" x2="{jx:.1f}" y2="{jy:.1f}"/>')
        p.append(f'<line x1="{jx:.1f}" y1="{jy:.1f}" x2="{px:.1f}" y2="{py:.1f}"/>')
        p.append(f'<line x1="{px:.1f}" y1="{py:.1f}" x2="{px + 15:.1f}" y2="{py:.1f}"/>')
    # Braço em DOIS segmentos, com cotovelo. Um traço reto só saindo do ombro o
    # modelo lê como braço aberto de lado, e devolve o personagem em pose de
    # briga; com cotovelo ele lê como braço balançando ao lado do corpo.
    for ombro, cotovelo in ((oe, te), (od, td)):
        cx_, cy_ = ponto(ox, oy, ombro, BRACO * 0.55)
        mx, my = ponto(cx_, cy_, ombro - cotovelo, BRACO * 0.5)
        p.append(f'<line x1="{ox}" y1="{oy}" x2="{cx_:.1f}" y2="{cy_:.1f}"/>')
        p.append(f'<line x1="{cx_:.1f}" y1="{cy_:.1f}" x2="{mx:.1f}" y2="{my:.1f}"/>')
    return "\n".join(p)

saida = sys.argv[1] if len(sys.argv) > 1 else "guia-poses.png"
corpos = "\n".join(boneco(i * L, p, s) for i, (_, p), s in
                   zip(range(4), POSES, SOBE))
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{L*4}" height="{A}">
<rect width="100%" height="100%" fill="white"/>
<g stroke="black" stroke-width="9" stroke-linecap="round" fill="none">
{corpos}
</g></svg>'''
tmp = pathlib.Path(tempfile.mkdtemp()) / "g.svg"
tmp.write_text(svg)
subprocess.run(["convert", str(tmp), saida], check=True)
print(saida)
