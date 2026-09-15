# Torre de defesa em 8 direções, do jeito que os clássicos faziam: um modelo, a
# câmera gira em volta, e cada ângulo vira um quadro.
#
#   blender -b -P torreta.py -- <cor-corpo> <cor-detalhe> <saída> [lados]
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
mat_base = material("base", "#4a555e", metal=0.25, rugos=0.8)
mat_luz = material("luz", cor_det, metal=0.0, rugos=0.2, brilho=3.2)
mat_luz_fraca = material("luzfraca", cor_det, metal=0.0, rugos=0.2, brilho=2.0)

base, topo = [], []
def add(lista, mat):
    o = bpy.context.object
    o.data.materials.append(mat)
    lista.append(o)

# ------------------------------------------------------------------ PLATAFORMA
# Octogonal: girada 45 graus é indistinguível de si mesma, então o quadro não
# denuncia que só a torreta girou.
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.86, depth=0.26, location=(0, 0, 0.13))
add(base, mat_base)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.70, depth=0.34, location=(0, 0, 0.4))
add(base, mat_base)
# chapa de advertência numa faceta só: laranja com FUNÇÃO, e assimétrico.
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.62, 0.3, 0.3))
bpy.context.object.scale = (0.05, 0.3, 0.16)
add(base, mat_acento)
# ANTENA: sinal de detecção, e o elemento fixo que dá identidade aos 8 quadros.
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.035, depth=1.5, location=(-0.5, -0.42, 1.05))
add(base, mat_escuro)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.24, depth=0.03,
                                    location=(-0.5, -0.42, 1.8), rotation=(math.radians(32), 0, 0))
add(base, mat_base)

# --------------------------------------------------------------------- PESCOÇO
# A cintura da ampulheta. Escura de propósito: cavidade escura é o que faz o
# ciano do anel parecer luz e não tinta.
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.34, depth=0.5, location=(0, 0, 0.82))
add(topo, mat_escuro)
bpy.ops.mesh.primitive_torus_add(major_radius=0.355, minor_radius=0.028, location=(0, 0, 0.9),
                                 major_segments=16, minor_segments=8)
add(topo, mat_luz)

# --------------------------------------------------------------------- TORRETA
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.05, 0, 1.32))
c = bpy.context.object
c.scale = (0.72, 0.62, 0.42)
bpy.ops.object.modifier_add(type='BEVEL')
c.modifiers["Bevel"].width = 0.11
c.modifiers["Bevel"].segments = 1
bpy.ops.object.modifier_apply(modifier="Bevel")
c.data.materials.append(mat_corpo)
topo.append(c)
# CORTES DE VERDADE, por booleano. A primeira versão usava cubos escuros para
# "simular" o corte — e cubo não corta, cubo cobre: a torreta virou um amontoado
# de blocos pretos e a cor do corpo sumiu da peça inteira.
def cortar(alvo, local, escala, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=local, rotation=rot)
    faca = bpy.context.object
    faca.scale = escala
    m = alvo.modifiers.new("corte", 'BOOLEAN')
    m.operation = 'DIFFERENCE'
    m.object = faca
    bpy.context.view_layer.objects.active = alvo
    bpy.ops.object.modifier_apply(modifier="corte")
    bpy.data.objects.remove(faca, do_unlink=True)

# canto traseiro-superior cortado: assimetria dá direção lida na silhueta.
cortar(c, (-0.78, 0, 1.66), (0.42, 0.7, 0.42), (0, math.radians(45), 0))
# sulco único e grande: corte pequeno some na redução para 85px de tela.
cortar(c, (-0.05, 0, 1.16), (0.8, 0.68, 0.055))
# VISOR: a fenda emissiva na frente. É o "olho" e identifica a frente nos 8 quadros.
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.64, 0, 1.4))
bpy.context.object.scale = (0.05, 0.38, 0.1)
add(topo, mat_luz)

# ------------------------------------------------------- ARMA EM DUAS CAMADAS
# Em cima, inclinado: bloco de tubos = "atira no ar".
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.5, 0, 1.78), rotation=(0, math.radians(-35), 0))
bpy.context.object.scale = (0.5, 0.42, 0.24)
add(topo, mat_escuro)
for dy, dz in ((-0.13, 0.08), (0, 0.08), (0.13, 0.08), (-0.13, -0.08), (0, -0.08), (0.13, -0.08)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.05, depth=0.5,
                                        location=(0.74 + dz * 0.7, dy, 1.9 + dz),
                                        rotation=(0, math.radians(55), 0))
    add(topo, mat_corpo)
# Embaixo, horizontal: cano curto e grosso = "atira no chão".
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.105, depth=0.95,
                                    location=(0.62, 0, 1.2), rotation=(0, math.pi / 2, 0))
add(topo, mat_escuro)
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.13, depth=0.12,
                                    location=(1.04, 0, 1.2), rotation=(0, math.pi / 2, 0))
add(topo, mat_corpo)
bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.055, depth=0.04,
                                    location=(1.1, 0, 1.2), rotation=(0, math.pi / 2, 0))
add(topo, mat_luz_fraca)

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
cena.render.resolution_x = 384
cena.render.resolution_y = 384
cena.render.image_settings.file_format = 'PNG'
cena.render.image_settings.color_mode = 'RGBA'
cena.eevee.taa_render_samples = 64
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
# Bloom leve: é o que dá núcleo estourado ao emissivo sem lavar a peça.
if hasattr(cena.eevee, "use_bloom"):
    cena.eevee.use_bloom = True
    cena.eevee.bloom_intensity = 0.04
    cena.eevee.bloom_radius = 4.0
    cena.eevee.bloom_threshold = 1.0

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
