# Torre de defesa em 8 direções, do jeito que os clássicos faziam: um modelo, a
# câmera gira em volta, e cada ângulo vira um quadro.
#
#   blender -b -P torreta.py -- <cor-corpo> <cor-detalhe> <saída> [lados] [perfil]
#
# O PERFIL é a coroa da torre — a arma que ela leva em cima. Só trocar a cor
# deixaria as seis torres com a MESMA silhueta, e o teste do preto sólido
# reprova na hora: se duas viram a mesma mancha, o problema é de forma, não de
# cor. É o que o They Are Billions faz — cada torre com um coroamento próprio,
# que é o que aparece na silhueta.
#
#   misto    — bloco de mísseis inclinado + cano horizontal (terra-ar)
#   pesado   — canos gêmeos grossos e escudo frontal (o ponto forte da muralha)
#   leve     — um cano curto e nada mais (a torre de 1x1, que aparece pequena)
#   obus     — cano longo e grosso inclinado, com defletor (só solo, área)
#   emissor  — bocal largo com aletas, sem cano (só solo, lentidão)
#   feixe    — lente emissiva num berço aberto, sem cano (energia)
#
# O StarCraft e o Age of Empires II não desenhavam direção por direção: eles
# renderizavam modelos 3D e exportavam 8, 16 ou 32 ângulos do mesmo objeto. É a
# única forma de a peça girar sem mudar de identidade a cada quadro — e é
# exatamente o que a geração por IA não faz, porque ela muda a POSE em vez de
# mover a câmera.
#
# A projeção é a NOSSA: 2:1. A elevação da câmera é asin(1/2) = 30 graus, e NÃO
# atan(1/2) = 26,565 — este segundo é o ângulo que a aresta do losango faz na
# TELA, não o da câmera. Confundir os dois custa 11% de achatamento: medido,
# 26,565 devolve um losango 2,22:1 e 30 devolve 1,99:1.
#
# A luz vem da DIREITA e da FRENTE. Medido também: com o azimute negativo que
# este arquivo usava, a chave entrava por TRÁS — contraluz — e a peça inteira
# ficava escura; só o sinal trocado levou a luminância média de 0,177 para 0,263.
#
# A FORMA segue o levantamento dos clássicos (Photon Cannon e Missile Turret do
# StarCraft, Prism Tower e Flak Cannon do Red Alert 2, Supreme Commander):
#
#   - AMPULHETA, NÃO PIRÂMIDE. Base estreita, pescoço fino, cabeça larga. A
#     cintura é o que faz a peça parecer sustentada por tecnologia e não por
#     concreto. Medido na versão anterior: 70% da massa de pixel estava na
#     metade de baixo — um bunker com chapéu.
#   - TERRA-AR SEM TEXTO, em dois sinais somados: um bloco de tubos inclinado a
#     35 graus (munição contável apontada para cima diz "ar") e um cano curto e
#     grosso horizontal (diz "solo"). É o vocabulário do Missile Turret e do
#     Flak Cannon.
#   - EMISSIVO EM TRÊS PONTOS, não mais: visor, anel do pescoço e boca do cano.
#     Área pequena e núcleo estourado; o contrário — muita área e brilho fraco —
#     lê como tinta fluorescente. Na versão anterior nenhum pixel passava de
#     0,84 de valor, e por isso a peça parecia plástico pintado.
#   - A BASE NÃO GIRA. Ela leva a antena, que é o único elemento estável nos
#     oito quadros; com tudo girando junto, a largura da silhueta variava 37%.
import bpy, sys, math, os

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
cor_corpo = argv[0] if len(argv) > 0 else "#4a6a78"
cor_det = argv[1] if len(argv) > 1 else "#7fd7ff"
saida = argv[2] if len(argv) > 2 else "/tmp/torreta"
lados = int(argv[3]) if len(argv) > 3 else 8
perfil = argv[4] if len(argv) > 4 else "misto"

def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)) + (1.0,)

def linear(c):
    """sRGB -> linear. O Blender guarda cor em espaço LINEAR; passar o hex cru
    devolve um pixel mais claro do que o hex pedido, e aí escolher cor vira
    adivinhação. Com `view_transform = 'Standard'` a volta é exata."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def rgb_lin(h):
    r, g, b, a = rgb(h)
    return (linear(r), linear(g), linear(b), a)

def mistura(c, k, para):
    """Escurece ou clareia `c` por `k`, puxando para a cor `para`. É o que faz a
    sombra ser AZUL e a luz ser QUENTE em vez de cinza interpolado — a diferença
    entre arte pintada e render."""
    t = 0.0 if k >= 1 else (1 - k) * 0.55
    saida = []
    for i in range(3):
        v = c[i] * k * (1 - t) + para[i] * t
        saida.append(min(1.0, max(0.0, v)))
    return tuple(saida) + (1.0,)

SOMBRA_FRIA = (0.10, 0.16, 0.30)
LUZ_QUENTE = (1.0, 0.94, 0.80)

def material(nome, cor, metal=0.55, rugos=0.45, brilho=0.0):
    """CEL SHADING, não PBR.

    Medido pelo levantamento: a mesma peça em Principled dá 838 cores distintas
    e em cel dá 373, com banda dura e limpa. Render pequeno com gradiente
    contínuo lê como plástico; o que lê como arte pintada é degrau.

    O caminho é `Shader to RGB` — que só existe no EEVEE — pegando a iluminação
    de um Diffuse e passando por uma rampa com interpolação CONSTANT. O
    `Toon BSDF` do Blender NÃO serve: o EEVEE o ignora por completo, e qualquer
    ajuste nele dá diferença zero de pixel.

    Emissivo continua Principled: quem é fonte de luz não tem sombra para
    bandar."""
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    if brilho:
        p = m.node_tree.nodes["Principled BSDF"]
        p.inputs["Base Color"].default_value = rgb_lin(cor)
        p.inputs["Metallic"].default_value = metal
        p.inputs["Roughness"].default_value = rugos
        # No Blender 4.0 o socket virou "Emission Color" + "Emission Strength";
        # o "Emission" de antes não existe mais e falha silenciosamente.
        p.inputs["Emission Color"].default_value = rgb_lin(cor)
        p.inputs["Emission Strength"].default_value = brilho
        return m

    base = rgb_lin(cor)
    rampa = [
        (0.00, mistura(base, 0.22, SOMBRA_FRIA)),
        (0.30, mistura(base, 0.48, SOMBRA_FRIA)),
        (0.62, base),
        (0.88, mistura(base, 1.55, LUZ_QUENTE))
    ]
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    dif = nt.nodes.new("ShaderNodeBsdfDiffuse")
    dif.inputs["Color"].default_value = (1, 1, 1, 1)
    dif.inputs["Roughness"].default_value = 0.0
    s2r = nt.nodes.new("ShaderNodeShaderToRGB")     # RGB maiúsculo; só EEVEE
    rn = nt.nodes.new("ShaderNodeValToRGB")
    cr = rn.color_ramp
    cr.interpolation = 'CONSTANT'
    while len(cr.elements) > 1:
        cr.elements.remove(cr.elements[-1])
    cr.elements[0].position, cr.elements[0].color = rampa[0]
    for pos, col in rampa[1:]:
        cr.elements.new(pos).color = col
    emi = nt.nodes.new("ShaderNodeEmission")
    L = nt.links
    L.new(dif.outputs["BSDF"], s2r.inputs["Shader"])
    L.new(s2r.outputs["Color"], rn.inputs["Fac"])
    L.new(rn.outputs["Color"], emi.inputs["Color"])
    L.new(emi.outputs["Emission"], out.inputs["Surface"])
    return m

bpy.ops.wm.read_factory_settings(use_empty=True)

mat_corpo = material("corpo", cor_corpo)
mat_escuro = material("escuro", "#1b2228", metal=0.85, rugos=0.3)
mat_acento = material("acento", "#e07a2a", metal=0.3, rugos=0.4)
mat_base = material("base", "#39434b", metal=0.25, rugos=0.8)
mat_luz = material("luz", cor_det, metal=0.0, rugos=0.2, brilho=3.2)
mat_luz_fraca = material("luzfraca", cor_det, metal=0.0, rugos=0.2, brilho=2.0)

base, topo = [], []
def add(lista, mat):
    o = bpy.context.object
    o.data.materials.append(mat)
    lista.append(o)

def cortar(alvo, local, escala, rot=(0, 0, 0)):
    """Corte de verdade, por booleano. Cubo escuro por cima NÃO corta: cobre —
    e a peça vira um amontoado de blocos pretos, que foi o que aconteceu na
    primeira tentativa."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=local, rotation=rot)
    faca = bpy.context.object
    faca.scale = escala
    m = alvo.modifiers.new("corte", 'BOOLEAN')
    m.operation = 'DIFFERENCE'
    m.object = faca
    bpy.context.view_layer.objects.active = alvo
    bpy.ops.object.modifier_apply(modifier="corte")
    bpy.data.objects.remove(faca, do_unlink=True)

def rebite(lista, x, y, z, r=0.032, h=0.03, mat=None):
    """Rebite é detalhe de SILHUETA INTERNA: sozinho some, em fila lê como chapa
    aparafusada. Por isso eles sempre vêm em linha, nunca soltos."""
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=r, depth=h, location=(x, y, z))
    add(lista, mat)

# ============================================================== PLATAFORMA
# Dois degraus octogonais, o de baixo mais largo. Escura: base clara puxa o olho
# para o chão, e quem tem de ler é a arma.
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.80, depth=0.17, location=(0, 0, 0.085))
piso = bpy.context.object
add(base, mat_base)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.62, depth=0.24, location=(0, 0, 0.29))
degrau = bpy.context.object
add(base, mat_base)

# JUNTAS DO PISO: quatro sulcos rasos cruzando o degrau de cima. É o que faz o
# concreto parecer montado em placas em vez de fundido num bloco só.
for ang in (0, math.pi / 2):
    cortar(degrau, (0, 0, 0.41), (1.6, 0.03, 0.05), (0, 0, ang))
cortar(piso, (0, 0, 0.165), (2.0, 0.03, 0.04), (0, 0, math.radians(45)))

# REBITES na borda do degrau, um por face do octógono.
for k in range(8):
    a = math.radians(22.5 + 45 * k)
    rebite(base, math.cos(a) * 0.73, math.sin(a) * 0.73, 0.185, 0.038, 0.03, mat_escuro)

# ESCOTILHA de acesso, atrás: diz que alguém entra ali para dar manutenção.
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.2, depth=0.04, location=(-0.44, 0.26, 0.42))
add(base, mat_escuro)
rebite(base, -0.44, 0.26, 0.45, 0.045, 0.03, mat_corpo)

# CAIXA DE MUNIÇÃO encostada na plataforma, com tampa e alça. Peça assimétrica:
# é ela que dá "lado" à base nos oito quadros, junto com a antena.
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.66, -0.46, 0.28))
caixa = bpy.context.object
caixa.scale = (0.3, 0.44, 0.24)
bpy.ops.object.modifier_add(type='BEVEL')
caixa.modifiers["Bevel"].width = 0.03
caixa.modifiers["Bevel"].segments = 1
bpy.ops.object.modifier_apply(modifier="Bevel")
add(base, mat_escuro)
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.66, -0.46, 0.41))
bpy.context.object.scale = (0.32, 0.46, 0.03)
add(base, mat_corpo)

# CHAPA DE ADVERTÊNCIA: laranja com função, numa faceta só, assimétrica.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.5, 0.45, 0.28))
bpy.context.object.scale = (0.05, 0.26, 0.14)
add(base, mat_acento)

# ANTENA: sinal de detecção e elemento fixo que dá identidade aos 8 quadros.
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.032, depth=1.45, location=(-0.5, -0.42, 1.05))
add(base, mat_escuro)
# treliça: dois anéis na haste, que é o que separa "antena" de "vareta"
for z in (0.72, 1.08):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.07, minor_radius=0.014,
                                     location=(-0.5, -0.42, z), major_segments=8, minor_segments=5)
    add(base, mat_corpo)
bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.23, depth=0.028,
                                    location=(-0.5, -0.42, 1.78), rotation=(math.radians(32), 0, 0))
prato = bpy.context.object
add(base, mat_base)
cortar(prato, (-0.5, -0.42, 1.78), (0.07, 0.5, 0.5), (math.radians(32), 0, 0))
bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.035, depth=0.12,
                                    location=(-0.5, -0.38, 1.72), rotation=(math.radians(32), 0, 0))
add(base, mat_luz_fraca)

# CABOS: dois vindo da caixa para o pescoço. Cabo é o detalhe mais barato que
# existe para dizer "isto é alimentado" — e quebra a linha reta da base.
for dy in (-0.1, 0.06):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.038, depth=0.62,
                                        location=(-0.44, -0.4 + dy, 0.6),
                                        rotation=(0, math.radians(58), 0))
    add(base, mat_escuro)

# ================================================================= PESCOÇO
# A cintura da ampulheta, e o rolamento que explica o giro.
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.31, depth=0.42, location=(0, 0, 0.62))
add(topo, mat_escuro)
# rolamento: dois anéis de raio diferente, um deles emissivo
bpy.ops.mesh.primitive_torus_add(major_radius=0.355, minor_radius=0.026, location=(0, 0, 0.72),
                                 major_segments=16, minor_segments=8)
add(topo, mat_luz)
bpy.ops.mesh.primitive_torus_add(major_radius=0.35, minor_radius=0.03, location=(0, 0, 0.5),
                                 major_segments=16, minor_segments=6)
add(topo, mat_corpo)
# PISTÕES: dois cilindros inclinados ligando o pescoço à torreta. É o detalhe
# que faz a peça parecer que se move, mesmo parada.
for lado in (-1, 1):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.05, depth=0.5,
                                        location=(0.2, 0.3 * lado, 1.02),
                                        rotation=(math.radians(20 * lado), math.radians(-28), 0))
    add(topo, mat_escuro)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.068, depth=0.2,
                                        location=(0.09, 0.26 * lado, 0.92),
                                        rotation=(math.radians(20 * lado), math.radians(-28), 0))
    add(topo, mat_corpo)

# ================================================================= TORRETA
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.05, 0, 1.3))
c = bpy.context.object
c.scale = (0.78, 0.66, 0.46)
bpy.ops.object.modifier_add(type='BEVEL')
c.modifiers["Bevel"].width = 0.09
c.modifiers["Bevel"].segments = 1
bpy.ops.object.modifier_apply(modifier="Bevel")
c.data.materials.append(mat_corpo)
topo.append(c)
# canto traseiro-superior cortado: assimetria dá direção lida na silhueta
cortar(c, (-0.76, 0, 1.64), (0.42, 0.7, 0.42), (0, math.radians(45), 0))
# sulco horizontal, grande: corte pequeno some na redução para 85px de tela
cortar(c, (-0.05, 0, 1.16), (0.8, 0.68, 0.05))
# GRADE DE VENTILAÇÃO na lateral esquerda: quatro ranhuras, que em fila leem
# como respiro de máquina. Uma sozinha seria sujeira.
for k in range(4):
    cortar(c, (-0.3 + k * 0.16, -0.31, 1.36), (0.07, 0.1, 0.19))
# chapa aparafusada na lateral direita
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.16, 0.31, 1.34))
bpy.context.object.scale = (0.44, 0.03, 0.26)
add(topo, mat_escuro)
for k in range(3):
    rebite(topo, -0.34 + k * 0.18, 0.33, 1.34, 0.028, 0.03, mat_corpo)
# SENSOR no topo, com cúpula: o "olho" alto que aparece na silhueta
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.12, depth=0.1, location=(-0.24, 0, 1.56))
add(topo, mat_escuro)
bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.09, location=(-0.24, 0, 1.62))
add(topo, mat_luz_fraca)
# VISOR: a fenda emissiva na frente, o que identifica a frente nos 8 quadros
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.62, 0, 1.38))
bpy.context.object.scale = (0.05, 0.36, 0.09)
add(topo, mat_luz)
# moldura do visor, para o brilho nascer de dentro de uma cavidade escura
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.6, 0, 1.38))
bpy.context.object.scale = (0.04, 0.44, 0.15)
add(topo, mat_escuro)

# ========================================================== COROA / ARMA
if perfil == "misto":
    # Duas camadas: bloco de tubos inclinado diz "ar", cano horizontal diz "solo".
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.48, 0, 1.76), rotation=(0, math.radians(-35), 0))
    bloco = bpy.context.object
    bloco.scale = (0.48, 0.44, 0.24)
    bpy.ops.object.modifier_add(type='BEVEL')
    bloco.modifiers["Bevel"].width = 0.035
    bloco.modifiers["Bevel"].segments = 1
    bpy.ops.object.modifier_apply(modifier="Bevel")
    bloco.data.materials.append(mat_escuro)
    topo.append(bloco)
    for dy, dz in ((-0.135, 0.085), (0, 0.085), (0.135, 0.085),
                   (-0.135, -0.085), (0, -0.085), (0.135, -0.085)):
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.048, depth=0.46,
                                            location=(0.72 + dz * 0.7, dy, 1.88 + dz),
                                            rotation=(0, math.radians(55), 0))
        add(topo, mat_corpo)
        bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.052, depth=0.05,
                                            location=(0.85 + dz * 0.7, dy, 1.98 + dz),
                                            rotation=(0, math.radians(55), 0))
        add(topo, mat_escuro)
    for lado in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.3, 0.26 * lado, 1.62),
                                        rotation=(0, math.radians(-35), 0))
        bpy.context.object.scale = (0.3, 0.035, 0.1)
        add(topo, mat_corpo)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.095, depth=0.95,
                                        location=(0.62, 0, 1.16), rotation=(0, math.pi / 2, 0))
    add(topo, mat_escuro)
    for dx in (0.34, 0.5, 0.66):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.11, minor_radius=0.022,
                                         location=(dx, 0, 1.16), rotation=(0, math.pi / 2, 0),
                                         major_segments=10, minor_segments=5)
        add(topo, mat_corpo)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.125, depth=0.16,
                                        location=(1.02, 0, 1.16), rotation=(0, math.pi / 2, 0))
    freio = bpy.context.object
    add(topo, mat_corpo)
    for lado in (-1, 1):
        cortar(freio, (1.02, 0.12 * lado, 1.16), (0.1, 0.1, 0.06))
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.05, depth=0.03,
                                        location=(1.1, 0, 1.16), rotation=(0, math.pi / 2, 0))
    add(topo, mat_luz_fraca)

elif perfil == "pesado":
    # CANOS GÊMEOS e escudo frontal. O Bastião é o ponto forte da linha, e o que
    # diz isso num sprite pequeno é MASSA na frente: chapa larga cobrindo a
    # torreta e dois canos grossos saindo dela. Sem o escudo ele viraria uma
    # Sentinela mais azul, e duas torres com a mesma mancha é falha de silhueta.
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.5, 0, 1.42), rotation=(0, math.radians(-12), 0))
    escudo = bpy.context.object
    escudo.scale = (0.12, 0.8, 0.62)
    bpy.ops.object.modifier_add(type='BEVEL')
    escudo.modifiers["Bevel"].width = 0.05
    escudo.modifiers["Bevel"].segments = 1
    bpy.ops.object.modifier_apply(modifier="Bevel")
    escudo.data.materials.append(mat_corpo)
    topo.append(escudo)
    for lado in (-1, 1):
        cortar(escudo, (0.5, 0.22 * lado, 1.42), (0.4, 0.12, 0.16), (0, math.radians(-12), 0))
    for lado in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.1, depth=1.0,
                                            location=(0.78, 0.22 * lado, 1.44),
                                            rotation=(0, math.radians(78), 0))
        add(topo, mat_escuro)
        for t in (-0.2, 0.05):
            bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.026,
                                             location=(0.78 + t, 0.22 * lado, 1.44 + t * 0.2),
                                             rotation=(0, math.radians(78), 0),
                                             major_segments=10, minor_segments=5)
            add(topo, mat_corpo)
        bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.14, depth=0.12,
                                            location=(1.2, 0.22 * lado, 1.53),
                                            rotation=(0, math.radians(78), 0))
        add(topo, mat_corpo)
    # mira de ferro em cima do escudo, que é o que dá altura à silhueta
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.4, 0, 1.82))
    bpy.context.object.scale = (0.14, 0.1, 0.22)
    add(topo, mat_escuro)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.4, 0, 1.94))
    bpy.context.object.scale = (0.2, 0.3, 0.05)
    add(topo, mat_corpo)

elif perfil == "leve":
    # UM cano curto e nada mais. A Torre de muralha é 1x1 e aparece com metade
    # do tamanho das outras: qualquer detalhe a mais vira sujeira, e a leitura
    # que sobra tem de ser "arma pequena encaixada no muro".
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.11, depth=0.8,
                                        location=(0.52, 0, 1.3), rotation=(0, math.radians(84), 0))
    add(topo, mat_escuro)
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.145, depth=0.12,
                                        location=(0.86, 0, 1.34), rotation=(0, math.radians(84), 0))
    add(topo, mat_corpo)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.06, depth=0.03,
                                        location=(0.93, 0, 1.35), rotation=(0, math.radians(84), 0))
    add(topo, mat_luz_fraca)

elif perfil == "obus":
    # UM cano, longo e grosso, inclinado 18 graus. Obus lê pelo COMPRIMENTO: é o
    # que diz "tiro indireto, cai lá longe" — e o alcance mínimo da peça no jogo
    # tem essa mesma explicação. Sem nada apontado para o céu, porque ela não
    # atira em voador.
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.13, depth=1.55,
                                        location=(0.62, 0, 1.44),
                                        rotation=(0, math.radians(72), 0))
    add(topo, mat_escuro)
    for t in (0.2, 0.42, 0.64):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.028,
                                         location=(0.62 - 0.55 + t * 1.1, 0, 1.44 - 0.18 + t * 0.36),
                                         rotation=(0, math.radians(72), 0),
                                         major_segments=10, minor_segments=5)
        add(topo, mat_corpo)
    # defletor na boca: dois discos, que é a assinatura de obuseiro
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.22, depth=0.06,
                                        location=(1.26, 0, 1.65), rotation=(0, math.radians(72), 0))
    add(topo, mat_corpo)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.16, depth=0.1,
                                        location=(1.34, 0, 1.68), rotation=(0, math.radians(72), 0))
    add(topo, mat_escuro)
    # berço de recuo, ligando o cano ao corpo
    for lado in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.3, 0.24 * lado, 1.34))
        bpy.context.object.scale = (0.4, 0.05, 0.14)
        add(topo, mat_corpo)

elif perfil == "emissor":
    # BOCAL largo com aletas, sem cano. Uma boca cônica grande lê como "sopra
    # alguma coisa" em vez de "dispara projétil" — é a diferença entre a torre
    # de gelo e as outras num sprite pequeno.
    bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.12, radius2=0.34, depth=0.66,
                                    location=(0.66, 0, 1.28), rotation=(0, math.radians(90), 0))
    add(topo, mat_escuro)
    for k in range(6):
        a = math.radians(60 * k)
        bpy.ops.mesh.primitive_cube_add(size=1,
                                        location=(0.72, math.cos(a) * 0.26, 1.28 + math.sin(a) * 0.26),
                                        rotation=(a, 0, 0))
        bpy.context.object.scale = (0.4, 0.05, 0.1)
        add(topo, mat_corpo)
    # anel emissivo dentro da boca: a carga que vai sair
    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.035,
                                     location=(0.94, 0, 1.28), rotation=(0, math.radians(90), 0),
                                     major_segments=12, minor_segments=6)
    add(topo, mat_luz)
    # tanques de carga nas costas, que é de onde vem o que ela sopra
    for lado in (-1, 1):
        bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.14, depth=0.5,
                                            location=(-0.42, 0.3 * lado, 1.44))
        add(topo, mat_corpo)

elif perfil == "feixe":
    # LENTE num berço aberto. Sem cano nenhum: o que dispara luz não tem tubo, e
    # essa ausência é justamente o que separa a torre de energia das de bala num
    # relance. É o vocabulário da Prism Tower e do Photon Cannon.
    for lado in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0.42, 0.34 * lado, 1.62),
                                        rotation=(0, math.radians(-18), 0))
        bpy.context.object.scale = (0.62, 0.07, 0.36)
        add(topo, mat_corpo)
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.3, depth=0.14,
                                        location=(0.62, 0, 1.68), rotation=(0, math.radians(72), 0))
    add(topo, mat_escuro)
    bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=0.22, depth=0.06,
                                        location=(0.72, 0, 1.72), rotation=(0, math.radians(72), 0))
    add(topo, mat_luz)
    # bobinas nas costas, carregando a lente
    for k, z in enumerate((1.3, 1.5)):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.26, minor_radius=0.04,
                                         location=(-0.2, 0, z), rotation=(0, math.radians(90), 0),
                                         major_segments=12, minor_segments=6)
        add(topo, mat_luz_fraca if k else mat_corpo)

def juntar(lista):
    bpy.ops.object.select_all(action='DESELECT')
    for o in lista:
        o.select_set(True)
    bpy.context.view_layer.objects.active = lista[0]
    bpy.ops.object.join()
    return bpy.context.object

obj_base = juntar(base)
obj_topo = juntar(topo)

elev = math.asin(0.5)
dist = 9.0
cam_data = bpy.data.cameras.new("cam")
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 3.0
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (dist * math.cos(elev), 0, dist * math.sin(elev) + 0.95)
cam.rotation_euler = (math.pi / 2 - elev, 0, math.pi / 2)
bpy.context.scene.camera = cam

sol = bpy.data.lights.new("sol", type='SUN')
sol.energy = 3.4
sol.angle = 0.35
o_sol = bpy.data.objects.new("sol", sol)
bpy.context.collection.objects.link(o_sol)
o_sol.rotation_euler = (math.radians(50), 0, math.radians(125))

preench = bpy.data.lights.new("preench", type='SUN')
preench.energy = 0.8
preench.color = (0.55, 0.68, 0.85)
o_pre = bpy.data.objects.new("preench", preench)
bpy.context.collection.objects.link(o_pre)
o_pre.rotation_euler = (math.radians(62), 0, math.radians(35))

cena = bpy.context.scene
cena.render.engine = 'BLENDER_EEVEE'
cena.render.film_transparent = True
cena.render.resolution_x = 760
cena.render.resolution_y = 760
cena.render.image_settings.file_format = 'PNG'
cena.render.image_settings.color_mode = 'RGBA'
cena.eevee.taa_render_samples = 96
# O padrão do Blender 4.0 é AgX, que tonemapeia e dessatura TODA cor escolhida —
# é a causa número um do aspecto de plástico, e faz ajustar cor virar chute.
cena.view_settings.view_transform = 'Standard'
cena.view_settings.look = 'None'
# Oclusão de ambiente: é o que assenta a torreta na plataforma. Sem ela as duas
# peças flutuam uma sobre a outra.
cena.eevee.use_gtao = True
cena.eevee.gtao_distance = 0.4
cena.eevee.gtao_factor = 1.0
cena.eevee.shadow_cube_size = '2048'
cena.eevee.shadow_cascade_size = '4096'
cena.eevee.use_soft_shadows = True
# BLOOM DESLIGADO. Ele espalha alfa residual pela moldura, e o contorno do jogo
# desenha a figura oito vezes deslocada antes de chapar de preto — nessa conta
# alfa 5 vira 37, que já é visível. O emissivo com força 3,2 estoura sozinho.
#
# ⚠️ Mas o retângulo preto que apareceu na tela NÃO era isto, embora eu tenha
# culpado o bloom na primeira olhada. Medido depois: o resíduo na moldura era
# ZERO, e os arquivos publicados estavam sem CANAL ALFA nenhum — RGB opaco com
# fundo preto, porque a conversão para WebP foi feita à mão com um `-flatten`
# no meio. `arte/ferramentas/montar-direcoes-torre.sh` existe por causa disso e
# tem o portão que reprova sprite sem alfa.
if hasattr(cena.eevee, "use_bloom"):
    cena.eevee.use_bloom = False

# MOLDURA FIXA, sem recorte depois: a largura da imagem vale sempre as mesmas
# 3,0 unidades de mundo, então a base ocupa a mesma fração em todos os oito
# quadros. Recortar pelo conteúdo (`-trim`) faria a antena, que é assimétrica,
# mudar a escala de quadro para quadro — e o jogo dimensiona o sprite pela
# LARGURA da fundação, então a peça inteira cresceria e encolheria girando.
# SEM POSTERIZE. A receita da pesquisa mandava seis degraus no compositor, e
# medido isolado ela derruba de 1.500 para 90 cores. Aplicada DEPOIS do cel
# shading, que já banda a iluminação em quatro níveis, ela colapsa: a peça
# inteira vira silhueta preta com manchas azul-elétrico. Duas quantizações em
# série não somam, se anulam — a banda tem de vir de um lugar só, e aqui vem da
# rampa CONSTANT do material.
os.makedirs(os.path.dirname(saida) or ".", exist_ok=True)
for i in range(lados):
    obj_topo.rotation_euler = (0, 0, math.radians(360.0 * i / lados))
    cena.render.filepath = "%s-%d.png" % (saida, i)
    bpy.ops.render.render(write_still=True)
    print("RENDER %d ok" % i)
