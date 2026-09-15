# Torreta em 8 direções, do jeito que os clássicos faziam: um modelo, a câmera
# gira em volta, e cada ângulo vira um quadro.
#
#   blender -b -P torreta.py -- <cor-corpo> <cor-detalhe> <saída> [lados]
#
# O StarCraft e o Age of Empires II não desenhavam direção por direção: eles
# renderizavam modelos 3D e exportavam 8, 16 ou 32 ângulos do mesmo objeto. É a
# única forma de a peça girar sem mudar de identidade a cada quadro — e é
# exatamente o que a geração por IA não faz, porque ela muda a pose em vez de
# mover a câmera.
#
# A projeção é a NOSSA: 2:1, ou seja, elevação de atan(1/2) = 26,565 graus, com
# câmera ortográfica. Assim a peça renderizada encaixa na grade do jogo sem
# correção depois. A luz vem da DIREITA, que é o lado medido nas 110 peças de
# arte que já existem.
import bpy, sys, math, os

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
cor_corpo = argv[0] if len(argv) > 0 else "#4a6a78"
cor_det = argv[1] if len(argv) > 1 else "#7fd7ff"
saida = argv[2] if len(argv) > 2 else "/tmp/torreta"
lados = int(argv[3]) if len(argv) > 3 else 8

def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)) + (1.0,)

def material(nome, cor, metal=0.55, rugos=0.45):
    m = bpy.data.materials.new(nome)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = rgb(cor)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rugos
    return m

bpy.ops.wm.read_factory_settings(use_empty=True)

mat_corpo = material("corpo", cor_corpo)
mat_det = material("detalhe", cor_det, metal=0.3, rugos=0.25)
mat_cano = material("cano", "#2e3a42", metal=0.8, rugos=0.35)

mat_base = material("base", "#3e4a52", metal=0.25, rugos=0.75)
mat_acento = material("acento", "#e07a2a", metal=0.3, rugos=0.4)

pecas = []
def add(obj, mat):
    obj.data.materials.append(mat)
    pecas.append(obj)

# PLATAFORMA. Octogonal de propósito: ela não gira junto com a torreta na vida
# real, e um octógono girado 45 graus é indistinguível de si mesmo — assim a
# peça inteira pode ser renderizada num objeto só, sem a base "dançar" entre um
# quadro e outro.
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=1.18, depth=0.3, location=(0, 0, 0.15))
add(bpy.context.object, mat_base)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.94, depth=0.46, location=(0, 0, 0.4))
add(bpy.context.object, mat_base)
# faixa de acento na borda da plataforma
bpy.ops.mesh.primitive_torus_add(major_radius=0.96, minor_radius=0.055, location=(0, 0, 0.6),
                                 major_segments=8, minor_segments=6)
add(bpy.context.object, mat_acento)

# base giratória
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.62, depth=0.26, location=(0, 0, 0.73))
add(bpy.context.object, mat_corpo)
# corpo da torreta, um bloco chanfrado
bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.06, 0, 1.02))
c = bpy.context.object
c.scale = (0.58, 0.5, 0.34)
bpy.ops.object.modifier_add(type='BEVEL')
c.modifiers["Bevel"].width = 0.06
c.modifiers["Bevel"].segments = 2
add(c, mat_corpo)
# visor, na frente (eixo +X é a frente)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.42, 0, 1.1))
v = bpy.context.object
v.scale = (0.06, 0.3, 0.12)
add(v, mat_det)
# dois canos
for dy in (-0.16, 0.16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.072, depth=1.15,
                                        location=(0.78, dy, 1.06), rotation=(0, math.pi / 2, 0))
    add(bpy.context.object, mat_cano)
# boca dos canos
for dy in (-0.16, 0.16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.1, depth=0.14,
                                        location=(1.3, dy, 1.06), rotation=(0, math.pi / 2, 0))
    add(bpy.context.object, mat_corpo)

# junta tudo num objeto só, para girar de uma vez
bpy.ops.object.select_all(action='DESELECT')
for o in pecas:
    o.select_set(True)
bpy.context.view_layer.objects.active = pecas[0]
bpy.ops.object.join()
torreta = bpy.context.object

# CÂMERA ORTOGRÁFICA na nossa projeção 2:1
elev = math.atan(0.5)
dist = 8.0
cam_data = bpy.data.cameras.new("cam")
cam_data.type = 'ORTHO'
cam_data.ortho_scale = 3.5
cam = bpy.data.objects.new("cam", cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (dist * math.cos(elev), 0, dist * math.sin(elev) + 0.75)
cam.rotation_euler = (math.pi / 2 - elev, 0, math.pi / 2)
bpy.context.scene.camera = cam

# LUZ DA DIREITA, com preenchimento frio do lado oposto
sol = bpy.data.lights.new("sol", type='SUN')
sol.energy = 5.4
sol.angle = 0.35
o_sol = bpy.data.objects.new("sol", sol)
bpy.context.collection.objects.link(o_sol)
o_sol.rotation_euler = (math.radians(52), 0, math.radians(-125))

preench = bpy.data.lights.new("preench", type='SUN')
preench.energy = 0.75
preench.color = (0.55, 0.68, 0.85)
o_pre = bpy.data.objects.new("preench", preench)
bpy.context.collection.objects.link(o_pre)
o_pre.rotation_euler = (math.radians(60), 0, math.radians(70))

cena = bpy.context.scene
cena.render.engine = 'BLENDER_EEVEE'
cena.render.film_transparent = True
cena.render.resolution_x = 320
cena.render.resolution_y = 320
cena.render.image_settings.file_format = 'PNG'
cena.render.image_settings.color_mode = 'RGBA'
cena.eevee.taa_render_samples = 64

os.makedirs(os.path.dirname(saida) or ".", exist_ok=True)
for i in range(lados):
    torreta.rotation_euler = (0, 0, math.radians(360.0 * i / lados))
    cena.render.filepath = "%s-%d.png" % (saida, i)
    bpy.ops.render.render(write_still=True)
    print("RENDER %d ok" % i)
