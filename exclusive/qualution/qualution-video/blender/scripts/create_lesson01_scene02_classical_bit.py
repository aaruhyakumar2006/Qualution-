"""
QUALUTION Lesson 1 Scene 2 Generator: What Is a Classical Bit?
File: qualution-video/blender/scenes/lesson01_scene02_classical_bit.blend
Duration: 24.0 seconds exactly (Frames 541–1260 @ 30 FPS, 720 frames total)
Resolution: 1920x1080 (16:9)

Story Flow:
- Act 1 (0:00–0:05, Fr 541–690): "WHAT IS A CLASSICAL BIT?" — Define bit as unit of classical info
- Act 2 (0:05–0:12, Fr 691–900): "TWO DISCRETE VALUES" — 0 OR 1 prominent distinction
- Act 3 (0:12–0:18, Fr 901–1080): "ONE STATE AT A TIME" — Mutually exclusive deterministic states
- Act 4 (0:18–0:21, Fr 1081–1170): "SCALING CLASSICAL INFORMATION" — 5-bit string example (10110)
- Act 5 (0:21–0:24, Fr 1171–1260): "NOW MEET THE QUBIT" — Clean transition into Scene 3
"""

import bpy
import os
import math

def build_scene():
    # 1. Reset to empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    scene = bpy.context.scene
    scene.name = "Lesson01_Scene02_ClassicalBit"
    
    # 2. Render Settings (1920x1080, 30 FPS, Frames 541-1260)
    render = scene.render
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.resolution_percentage = 100
    render.fps = 30
    render.fps_base = 1.0
    
    scene.frame_start = 541
    scene.frame_end = 1260
    scene.frame_current = 541
    
    # Render Engine & View Transform
    engine_names = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
    if 'BLENDER_EEVEE_NEXT' in engine_names:
        render.engine = 'BLENDER_EEVEE_NEXT'
    elif 'BLENDER_EEVEE' in engine_names:
        render.engine = 'BLENDER_EEVEE'
    elif 'BLENDER_WORKBENCH' in engine_names:
        render.engine = 'BLENDER_WORKBENCH'
    else:
        render.engine = 'CYCLES'
        
    scene.display_settings.display_device = 'sRGB'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    render.image_settings.file_format = 'PNG'
    render.image_settings.color_mode = 'RGBA'
    
    # 3. Collection Structure under QUALUTION_MASTER
    master_col = bpy.data.collections.new("QUALUTION_MASTER")
    scene.collection.children.link(master_col)
    
    sub_col_names = [
        "CAMERA", "BACKGROUND", "TITLE", "MAIN_VISUAL",
        "SUPPORTING_VISUAL", "DIAGRAM", "ANNOTATIONS",
        "CAPTIONS", "TRANSITIONS", "GUIDES"
    ]
    cols = {}
    for name in sub_col_names:
        c = bpy.data.collections.new(name)
        master_col.children.link(c)
        cols[name] = c
        
    cols["GUIDES"].hide_render = True
    
    # 4. Materials Setup (Flat Vector Palette)
    def create_mat(name, rgba):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        shader = nodes.new(type='ShaderNodeEmission')
        shader.inputs['Color'].default_value = rgba
        shader.inputs['Strength'].default_value = 1.0
        output = nodes.new(type='ShaderNodeOutputMaterial')
        mat.node_tree.links.new(shader.outputs['Emission'], output.inputs['Surface'])
        return mat

    mat_bg = create_mat("QUALUTION_Mat_BgDark", (0.043, 0.059, 0.098, 1.0)) # #0B0F19
    mat_cyan = create_mat("QUALUTION_Mat_Cyan", (0.0, 0.85, 0.95, 1.0)) # #00D9F2
    mat_cyan_halo = create_mat("QUALUTION_Mat_CyanHalo", (0.22, 0.74, 0.97, 0.6)) # #38BDF8
    mat_white = create_mat("QUALUTION_Mat_White", (0.97, 0.98, 1.0, 1.0)) # #F8FAFC
    mat_dim_white = create_mat("QUALUTION_Mat_DimText", (0.50, 0.58, 0.68, 1.0)) # #818CF8
    mat_emerald = create_mat("QUALUTION_Mat_Emerald", (0.063, 0.725, 0.506, 1.0)) # #10B981
    mat_amber = create_mat("QUALUTION_Mat_Amber", (0.96, 0.62, 0.043, 1.0)) # #F59E0B
    mat_violet = create_mat("QUALUTION_Mat_Violet", (0.65, 0.33, 0.98, 1.0)) # #A855F7
    mat_card_dark = create_mat("QUALUTION_Mat_CardDark", (0.078, 0.110, 0.180, 1.0)) # #141C2E
    mat_card_border = create_mat("QUALUTION_Mat_CardBorder", (0.20, 0.25, 0.33, 1.0)) # #334155
    mat_wire = create_mat("QUALUTION_Mat_Wire", (0.392, 0.455, 0.545, 1.0)) # #64748B
    mat_caption = create_mat("QUALUTION_Mat_Caption", (0.80, 0.86, 0.94, 1.0)) # #CBD5E1
    mat_yellow = create_mat("QUALUTION_Mat_Yellow", (0.98, 0.80, 0.082, 1.0)) # #FACC15
    
    # 5. Geometry Helpers
    def make_rect(name, w, h, origin_center=True):
        mesh = bpy.data.meshes.new(name)
        if origin_center:
            hw, hh = w / 2.0, h / 2.0
            verts = [(-hw, -hh, 0.0), (hw, -hh, 0.0), (hw, hh, 0.0), (-hw, hh, 0.0)]
        else:
            hh = h / 2.0
            verts = [(0.0, -hh, 0.0), (w, -hh, 0.0), (w, hh, 0.0), (0.0, hh, 0.0)]
        faces = [(0, 1, 2, 3)]
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        return mesh

    def make_border_frame(name, w, h, th=0.06):
        mesh = bpy.data.meshes.new(name)
        hw, hh = w / 2.0, h / 2.0
        ihw, ihh = hw - th, hh - th
        verts = [
            (-hw, -hh, 0.0), (hw, -hh, 0.0), (hw, hh, 0.0), (-hw, hh, 0.0),
            (-ihw, -ihh, 0.0), (ihw, -ihh, 0.0), (ihw, ihh, 0.0), (-ihw, ihh, 0.0)
        ]
        faces = [
            (0, 1, 5, 4), # bottom
            (1, 2, 6, 5), # right
            (2, 3, 7, 6), # top
            (3, 0, 4, 7)  # left
        ]
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        return mesh

    def make_ring(name, in_r, out_r, segs=36):
        mesh = bpy.data.meshes.new(name)
        verts, faces = [], []
        for i in range(segs):
            a = 2.0 * math.pi * (i / segs)
            c, s = math.cos(a), math.sin(a)
            verts.append((in_r * c, in_r * s, 0.0))
            verts.append((out_r * c, out_r * s, 0.0))
        for i in range(segs):
            ni = (i + 1) % segs
            faces.append((i*2, i*2+1, ni*2+1, ni*2))
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        return mesh

    def make_disc(name, r, segs=36):
        mesh = bpy.data.meshes.new(name)
        verts = [(0.0, 0.0, 0.0)]
        faces = []
        for i in range(segs):
            a = 2.0 * math.pi * (i / segs)
            verts.append((r * math.cos(a), r * math.sin(a), 0.0))
        for i in range(segs):
            faces.append((0, 1 + i, 1 + ((i + 1) % segs)))
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        return mesh

    def make_arrow(name, length=0.9, shaft_w=0.08, head_w=0.28, head_len=0.3):
        mesh = bpy.data.meshes.new(name)
        sl = length - head_len
        hws, hwh = shaft_w / 2.0, head_w / 2.0
        verts = [
            (-hws, 0.0, 0.0), (hws, 0.0, 0.0), (hws, sl, 0.0), (-hws, sl, 0.0),
            (-hwh, sl, 0.0), (hwh, sl, 0.0), (0.0, length, 0.0)
        ]
        faces = [(0, 1, 2, 3), (4, 5, 6)]
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        return mesh

    def make_text(name, body, size=0.5, align_x='LEFT', align_y='TOP'):
        curve = bpy.data.curves.new(name, type='FONT')
        curve.body = body
        curve.size = size
        curve.align_x = align_x
        curve.align_y = align_y
        return curve

    # 6. Camera & Background Setup (Orthographic 16:9)
    cam_data = bpy.data.cameras.new("QUALUTION_Camera")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'HORIZONTAL'
    cam_data.ortho_scale = 16.0
    cam_obj = bpy.data.objects.new("QUALUTION_Camera", cam_data)
    cam_obj.location = (0.0, 0.0, 10.0)
    cols["CAMERA"].objects.link(cam_obj)
    scene.camera = cam_obj
    
    bg_mesh = make_rect("QUALUTION_BgMesh", 22.0, 14.0)
    bg_obj = bpy.data.objects.new("QUALUTION_BackgroundPlane", bg_mesh)
    bg_obj.location = (0.0, 0.0, -1.0)
    bg_obj.data.materials.append(mat_bg)
    cols["BACKGROUND"].objects.link(bg_obj)

    # 7. Persistent Top Header (Collection TITLE)
    header_cat = bpy.data.objects.new("QUALUTION_Category", make_text("CatCurve", "QUALUTION — LESSON 1", 0.36, 'LEFT', 'TOP'))
    header_cat.location = (-6.4, 3.9, 0.1)
    header_cat.data.materials.append(mat_cyan)
    cols["TITLE"].objects.link(header_cat)
    
    header_title = bpy.data.objects.new("QUALUTION_LessonTitle", make_text("TitleCurve", "What Is Quantum Computing?", 0.58, 'LEFT', 'TOP'))
    header_title.location = (-6.4, 3.4, 0.1)
    header_title.data.materials.append(mat_white)
    cols["TITLE"].objects.link(header_title)

    header_scene_tag = bpy.data.objects.new("QUALUTION_SceneTag", make_text("TagCurve", "SCENE 2: WHAT IS A CLASSICAL BIT?", 0.32, 'RIGHT', 'TOP'))
    header_scene_tag.location = (6.4, 3.8, 0.1)
    header_scene_tag.data.materials.append(mat_dim_white)
    cols["TITLE"].objects.link(header_scene_tag)

    # -------------------------------------------------------------
    # CAPTIONS SYSTEM (Collection CAPTIONS)
    # Synchronized Subtitles Across 5 Story Acts (Frames 541 - 1260)
    # -------------------------------------------------------------
    def create_caption(name, text_body, start_f, end_f):
        c_curve = make_text(f"{name}_Curve", text_body, 0.36, 'CENTER', 'CENTER')
        obj = bpy.data.objects.new(name, c_curve)
        obj.location = (0.0, -3.5, 0.1)
        obj.data.materials.append(mat_caption)
        cols["CAPTIONS"].objects.link(obj)
        
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=max(541, start_f - 6))
        
        obj.scale = (1.0, 1.0, 1.0)
        obj.keyframe_insert(data_path="scale", frame=start_f + 4)
        obj.keyframe_insert(data_path="scale", frame=end_f - 4)
        
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=end_f + 6)
        return obj

    cap1 = create_caption("Caption_01", "At the heart of every classical device is the bit—the basic unit of binary information.", 545, 680)
    cap2 = create_caption("Caption_02", "A classical bit can represent one of two discrete values: zero or one.", 690, 895)
    cap3 = create_caption("Caption_03", "At any given moment, the classical bit has exactly one definite state.", 905, 1075)
    cap4 = create_caption("Caption_04", "Strings of bits combine to encode numbers, text, images, and data.", 1085, 1165)
    cap5 = create_caption("Caption_05", "To unlock new possibilities, we need a new kind of bit: the qubit.", 1175, 1255)

    # -------------------------------------------------------------
    # ACT 1: DEFINE THE CLASSICAL BIT (Frames 541 - 690)
    # 0:00 - 0:05
    # -------------------------------------------------------------
    act1_group = bpy.data.objects.new("Act1_DefineBit_Group", None)
    act1_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act1_group)

    # Act 1 Header & Subtitle
    a1_title = bpy.data.objects.new("Act1_Title", make_text("A1TitleCurve", "WHAT IS A CLASSICAL BIT?", 0.65, 'CENTER', 'CENTER'))
    a1_title.location = (0.0, 2.3, 0.1)
    a1_title.data.materials.append(mat_white)
    a1_title.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_title)

    a1_sub = bpy.data.objects.new("Act1_Sub", make_text("A1SubCurve", "THE ATOMIC UNIT OF CLASSICAL INFORMATION", 0.32, 'CENTER', 'CENTER'))
    a1_sub.location = (0.0, 1.65, 0.1)
    a1_sub.data.materials.append(mat_cyan)
    a1_sub.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_sub)

    # Act 1 Central Bit Card
    a1_card_bg = bpy.data.objects.new("Act1_CardBg", make_rect("A1CardMesh", 4.4, 3.2))
    a1_card_bg.location = (0.0, -0.4, 0.0)
    a1_card_bg.data.materials.append(mat_card_dark)
    a1_card_bg.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_card_bg)

    a1_card_border = bpy.data.objects.new("Act1_CardBorder", make_border_frame("A1BorderMesh", 4.4, 3.2, 0.06))
    a1_card_border.location = (0.0, -0.4, 0.02)
    a1_card_border.data.materials.append(mat_cyan)
    a1_card_border.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_card_border)

    a1_badge_bg = bpy.data.objects.new("Act1_BadgeBg", make_rect("A1BadgeMesh", 2.6, 0.45))
    a1_badge_bg.location = (0.0, 0.8, 0.04)
    a1_badge_bg.data.materials.append(mat_card_border)
    a1_badge_bg.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_badge_bg)

    a1_badge_txt = bpy.data.objects.new("Act1_BadgeTxt", make_text("A1BadgeTxtCurve", "BINARY DIGIT", 0.24, 'CENTER', 'CENTER'))
    a1_badge_txt.location = (0.0, 0.8, 0.06)
    a1_badge_txt.data.materials.append(mat_cyan)
    a1_badge_txt.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_badge_txt)

    a1_bit_label = bpy.data.objects.new("Act1_BitLabel", make_text("A1BitCurve", "BIT", 1.2, 'CENTER', 'CENTER'))
    a1_bit_label.location = (0.0, -0.25, 0.05)
    a1_bit_label.data.materials.append(mat_white)
    a1_bit_label.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_bit_label)

    a1_card_sub = bpy.data.objects.new("Act1_CardSub", make_text("A1CardSubCurve", "DISCRETE STATE: 0  OR  1", 0.28, 'CENTER', 'CENTER'))
    a1_card_sub.location = (0.0, -1.35, 0.05)
    a1_card_sub.data.materials.append(mat_yellow)
    a1_card_sub.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_card_sub)

    # Act 1 Animation (Frames 541 - 690)
    act1_group.scale = (0.0, 0.0, 0.0)
    act1_group.keyframe_insert(data_path="scale", frame=541)
    act1_group.scale = (1.0, 1.0, 1.0)
    act1_group.keyframe_insert(data_path="scale", frame=575)
    act1_group.scale = (1.0, 1.0, 1.0)
    act1_group.keyframe_insert(data_path="scale", frame=665)
    act1_group.scale = (0.0, 0.0, 0.0)
    act1_group.keyframe_insert(data_path="scale", frame=690)

    # -------------------------------------------------------------
    # ACT 2: TWO DISCRETE VALUES (0 OR 1) (Frames 691 - 900)
    # 0:05 - 0:12
    # -------------------------------------------------------------
    act2_group = bpy.data.objects.new("Act2_TwoValues_Group", None)
    act2_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act2_group)

    a2_title = bpy.data.objects.new("Act2_Title", make_text("A2TitleCurve", "TWO DISCRETE VALUES", 0.60, 'CENTER', 'CENTER'))
    a2_title.location = (0.0, 2.3, 0.1)
    a2_title.data.materials.append(mat_white)
    a2_title.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_title)

    a2_sub = bpy.data.objects.new("Act2_Sub", make_text("A2SubCurve", "A CLASSICAL BIT IS STRICTLY EITHER 0 OR 1", 0.32, 'CENTER', 'CENTER'))
    a2_sub.location = (0.0, 1.65, 0.1)
    a2_sub.data.materials.append(mat_cyan)
    a2_sub.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_sub)

    # Card 0 (Left: X = -3.2)
    a2_card0_bg = bpy.data.objects.new("Act2_Card0Bg", make_rect("A2Card0Mesh", 3.2, 3.4))
    a2_card0_bg.location = (-3.2, -0.4, 0.0)
    a2_card0_bg.data.materials.append(mat_card_dark)
    a2_card0_bg.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card0_bg)

    a2_card0_border = bpy.data.objects.new("Act2_Card0Border", make_border_frame("A2Card0BorderMesh", 3.2, 3.4, 0.06))
    a2_card0_border.location = (-3.2, -0.4, 0.02)
    a2_card0_border.data.materials.append(mat_emerald)
    a2_card0_border.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card0_border)

    a2_card0_tag = bpy.data.objects.new("Act2_Card0Tag", make_text("A2Card0TagCurve", "STATE ZERO", 0.24, 'CENTER', 'CENTER'))
    a2_card0_tag.location = (-3.2, 0.8, 0.05)
    a2_card0_tag.data.materials.append(mat_emerald)
    a2_card0_tag.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card0_tag)

    a2_digit0 = bpy.data.objects.new("Act2_Digit0", make_text("A2Digit0Curve", "0", 1.8, 'CENTER', 'CENTER'))
    a2_digit0.location = (-3.2, -0.3, 0.05)
    a2_digit0.data.materials.append(mat_emerald)
    a2_digit0.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_digit0)

    a2_card0_attr = bpy.data.objects.new("Act2_Card0Attr", make_text("A2Card0AttrCurve", "OFF  •  LOW VOLTAGE", 0.20, 'CENTER', 'CENTER'))
    a2_card0_attr.location = (-3.2, -1.5, 0.05)
    a2_card0_attr.data.materials.append(mat_dim_white)
    a2_card0_attr.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card0_attr)

    # Center Connector & "OR" Badge (Center: X = 0.0)
    a2_wire_l = bpy.data.objects.new("Act2_WireL", make_rect("A2WireLMesh", 1.6, 0.04))
    a2_wire_l.location = (-1.6, -0.4, 0.01)
    a2_wire_l.data.materials.append(mat_wire)
    a2_wire_l.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_wire_l)

    a2_wire_r = bpy.data.objects.new("Act2_WireR", make_rect("A2WireRMesh", 1.6, 0.04))
    a2_wire_r.location = (1.6, -0.4, 0.01)
    a2_wire_r.data.materials.append(mat_wire)
    a2_wire_r.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_wire_r)

    a2_or_disc = bpy.data.objects.new("Act2_OrDisc", make_disc("A2OrDiscMesh", 0.75))
    a2_or_disc.location = (0.0, -0.4, 0.02)
    a2_or_disc.data.materials.append(mat_card_dark)
    a2_or_disc.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_or_disc)

    a2_or_ring = bpy.data.objects.new("Act2_OrRing", make_ring("A2OrRingMesh", 0.72, 0.78))
    a2_or_ring.location = (0.0, -0.4, 0.03)
    a2_or_ring.data.materials.append(mat_yellow)
    a2_or_ring.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_or_ring)

    a2_or_txt = bpy.data.objects.new("Act2_OrTxt", make_text("A2OrTxtCurve", "OR", 0.52, 'CENTER', 'CENTER'))
    a2_or_txt.location = (0.0, -0.55, 0.05)
    a2_or_txt.data.materials.append(mat_yellow)
    a2_or_txt.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_or_txt)

    # Card 1 (Right: X = +3.2)
    a2_card1_bg = bpy.data.objects.new("Act2_Card1Bg", make_rect("A2Card1Mesh", 3.2, 3.4))
    a2_card1_bg.location = (3.2, -0.4, 0.0)
    a2_card1_bg.data.materials.append(mat_card_dark)
    a2_card1_bg.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card1_bg)

    a2_card1_border = bpy.data.objects.new("Act2_Card1Border", make_border_frame("A2Card1BorderMesh", 3.2, 3.4, 0.06))
    a2_card1_border.location = (3.2, -0.4, 0.02)
    a2_card1_border.data.materials.append(mat_amber)
    a2_card1_border.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card1_border)

    a2_card1_tag = bpy.data.objects.new("Act2_Card1Tag", make_text("A2Card1TagCurve", "STATE ONE", 0.24, 'CENTER', 'CENTER'))
    a2_card1_tag.location = (3.2, 0.8, 0.05)
    a2_card1_tag.data.materials.append(mat_amber)
    a2_card1_tag.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card1_tag)

    a2_digit1 = bpy.data.objects.new("Act2_Digit1", make_text("A2Digit1Curve", "1", 1.8, 'CENTER', 'CENTER'))
    a2_digit1.location = (3.2, -0.3, 0.05)
    a2_digit1.data.materials.append(mat_amber)
    a2_digit1.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_digit1)

    a2_card1_attr = bpy.data.objects.new("Act2_Card1Attr", make_text("A2Card1AttrCurve", "ON  •  HIGH VOLTAGE", 0.20, 'CENTER', 'CENTER'))
    a2_card1_attr.location = (3.2, -1.5, 0.05)
    a2_card1_attr.data.materials.append(mat_dim_white)
    a2_card1_attr.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_card1_attr)

    # Act 2 Animation (Frames 691 - 900)
    act2_group.scale = (0.0, 0.0, 0.0)
    act2_group.keyframe_insert(data_path="scale", frame=691)
    act2_group.scale = (1.0, 1.0, 1.0)
    act2_group.keyframe_insert(data_path="scale", frame=725)
    act2_group.scale = (1.0, 1.0, 1.0)
    act2_group.keyframe_insert(data_path="scale", frame=875)
    act2_group.scale = (0.0, 0.0, 0.0)
    act2_group.keyframe_insert(data_path="scale", frame=900)

    # -------------------------------------------------------------
    # ACT 3: ONE STATE AT A TIME (Frames 901 - 1080)
    # 0:12 - 0:18 (Pixel-Polished Hierarchy)
    # -------------------------------------------------------------
    act3_group = bpy.data.objects.new("Act3_OneStateAtATime_Group", None)
    act3_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act3_group)

    a3_title = bpy.data.objects.new("Act3_Title", make_text("A3TitleCurve", "ONE STATE AT A TIME", 0.62, 'CENTER', 'CENTER'))
    a3_title.location = (0.0, 2.4, 0.1)
    a3_title.data.materials.append(mat_yellow)
    a3_title.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_title)

    a3_sub = bpy.data.objects.new("Act3_Sub", make_text("A3SubCurve", "MUTUALLY EXCLUSIVE DETERMINISTIC STATES", 0.28, 'CENTER', 'CENTER'))
    a3_sub.location = (0.0, 1.85, 0.1)
    a3_sub.data.materials.append(mat_white)
    a3_sub.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_sub)

    # State Slot 0 (Left: X = -3.0, Y = -0.3)
    a3_slot0_bg = bpy.data.objects.new("Act3_Slot0Bg", make_rect("A3Slot0BgMesh", 3.2, 3.0))
    a3_slot0_bg.location = (-3.0, -0.3, 0.0)
    a3_slot0_bg.data.materials.append(mat_card_dark)
    a3_slot0_bg.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot0_bg)

    a3_slot0_border = bpy.data.objects.new("Act3_Slot0Border", make_border_frame("A3Slot0BorderMesh", 3.2, 3.0, 0.05))
    a3_slot0_border.location = (-3.0, -0.3, 0.02)
    a3_slot0_border.data.materials.append(mat_emerald)
    a3_slot0_border.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot0_border)

    a3_slot0_num = bpy.data.objects.new("Act3_Slot0Num", make_text("A3Slot0NumCurve", "0", 1.5, 'CENTER', 'CENTER'))
    a3_slot0_num.location = (-3.0, -0.2, 0.05)
    a3_slot0_num.data.materials.append(mat_emerald)
    a3_slot0_num.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot0_num)

    a3_slot0_lbl = bpy.data.objects.new("Act3_Slot0Lbl", make_text("A3Slot0LblCurve", "VALUE 0", 0.22, 'CENTER', 'CENTER'))
    a3_slot0_lbl.location = (-3.0, -1.25, 0.05)
    a3_slot0_lbl.data.materials.append(mat_dim_white)
    a3_slot0_lbl.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot0_lbl)

    # State Slot 1 (Right: X = +3.0, Y = -0.3)
    a3_slot1_bg = bpy.data.objects.new("Act3_Slot1Bg", make_rect("A3Slot1BgMesh", 3.2, 3.0))
    a3_slot1_bg.location = (3.0, -0.3, 0.0)
    a3_slot1_bg.data.materials.append(mat_card_dark)
    a3_slot1_bg.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot1_bg)

    a3_slot1_border = bpy.data.objects.new("Act3_Slot1Border", make_border_frame("A3Slot1BorderMesh", 3.2, 3.0, 0.05))
    a3_slot1_border.location = (3.0, -0.3, 0.02)
    a3_slot1_border.data.materials.append(mat_amber)
    a3_slot1_border.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot1_border)

    a3_slot1_num = bpy.data.objects.new("Act3_Slot1Num", make_text("A3Slot1NumCurve", "1", 1.5, 'CENTER', 'CENTER'))
    a3_slot1_num.location = (3.0, -0.2, 0.05)
    a3_slot1_num.data.materials.append(mat_amber)
    a3_slot1_num.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot1_num)

    a3_slot1_lbl = bpy.data.objects.new("Act3_Slot1Lbl", make_text("A3Slot1LblCurve", "VALUE 1", 0.22, 'CENTER', 'CENTER'))
    a3_slot1_lbl.location = (3.0, -1.25, 0.05)
    a3_slot1_lbl.data.materials.append(mat_dim_white)
    a3_slot1_lbl.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_slot1_lbl)

    # Dynamic Active State Selector
    a3_selector = bpy.data.objects.new("Act3_StateSelector", None)
    a3_selector.location = (-3.0, -0.3, 0.04)
    a3_selector.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_selector)

    a3_sel_frame = bpy.data.objects.new("Act3_SelFrame", make_border_frame("A3SelFrameMesh", 3.4, 3.2, 0.07))
    a3_sel_frame.location = (0.0, 0.0, 0.0)
    a3_sel_frame.data.materials.append(mat_cyan)
    a3_sel_frame.parent = a3_selector
    cols["MAIN_VISUAL"].objects.link(a3_sel_frame)

    a3_sel_badge = bpy.data.objects.new("Act3_SelBadge", make_rect("A3SelBadgeMesh", 2.0, 0.38))
    a3_sel_badge.location = (0.0, 1.38, 0.01)
    a3_sel_badge.data.materials.append(mat_cyan)
    a3_sel_badge.parent = a3_selector
    cols["MAIN_VISUAL"].objects.link(a3_sel_badge)

    a3_sel_badge_txt = bpy.data.objects.new("Act3_SelBadgeTxt", make_text("A3SelBadgeTxtCurve", "ACTIVE", 0.20, 'CENTER', 'CENTER'))
    a3_sel_badge_txt.location = (0.0, 1.38, 0.03)
    a3_sel_badge_txt.data.materials.append(mat_bg)
    a3_sel_badge_txt.parent = a3_selector
    cols["MAIN_VISUAL"].objects.link(a3_sel_badge_txt)

    # Reusable Annotation Arrow pointing to active state
    a3_arrow = bpy.data.objects.new("QUALUTION_AnnotationArrow", make_arrow("A3ArrowMesh", 0.75, 0.07, 0.24, 0.25))
    a3_arrow.location = (0.0, -1.95, 0.02)
    a3_arrow.data.materials.append(mat_cyan)
    a3_arrow.parent = a3_selector
    cols["ANNOTATIONS"].objects.link(a3_arrow)

    # Selector Movement Animation (From Slot 0 to Slot 1)
    a3_selector.location = (-3.0, -0.3, 0.04)
    a3_selector.keyframe_insert(data_path="location", frame=901)
    a3_selector.location = (-3.0, -0.3, 0.04)
    a3_selector.keyframe_insert(data_path="location", frame=965)
    a3_selector.location = (3.0, -0.3, 0.04)
    a3_selector.keyframe_insert(data_path="location", frame=1005)
    a3_selector.location = (3.0, -0.3, 0.04)
    a3_selector.keyframe_insert(data_path="location", frame=1080)

    # Bottom Exclusivity Note Card (Positioned at Y = -2.65)
    a3_note_bg = bpy.data.objects.new("Act3_NoteBg", make_rect("A3NoteBgMesh", 8.2, 0.52))
    a3_note_bg.location = (0.0, -2.65, 0.01)
    a3_note_bg.data.materials.append(mat_card_dark)
    a3_note_bg.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_note_bg)

    a3_note_border = bpy.data.objects.new("Act3_NoteBorder", make_border_frame("A3NoteBorderMesh", 8.2, 0.52, 0.03))
    a3_note_border.location = (0.0, -2.65, 0.02)
    a3_note_border.data.materials.append(mat_card_border)
    a3_note_border.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_note_border)

    a3_note_txt = bpy.data.objects.new("Act3_NoteTxt", make_text("A3NoteTxtCurve", "DETERMINISTIC: NEVER BOTH 0 AND 1 SIMULTANEOUSLY", 0.25, 'CENTER', 'CENTER'))
    a3_note_txt.location = (0.0, -2.65, 0.04)
    a3_note_txt.data.materials.append(mat_white)
    a3_note_txt.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_note_txt)

    # Act 3 Group Animation (Frames 901 - 1080)
    act3_group.scale = (0.0, 0.0, 0.0)
    act3_group.keyframe_insert(data_path="scale", frame=901)
    act3_group.scale = (1.0, 1.0, 1.0)
    act3_group.keyframe_insert(data_path="scale", frame=925)
    act3_group.scale = (1.0, 1.0, 1.0)
    act3_group.keyframe_insert(data_path="scale", frame=1060)
    act3_group.scale = (0.0, 0.0, 0.0)
    act3_group.keyframe_insert(data_path="scale", frame=1080)

    # -------------------------------------------------------------
    # ACT 4: SCALING CLASSICAL INFORMATION (Frames 1081 - 1170)
    # 0:18 - 0:21 (5-bit string: 1 0 1 1 0)
    # -------------------------------------------------------------
    act4_group = bpy.data.objects.new("Act4_BinaryStrings_Group", None)
    act4_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act4_group)

    a4_title = bpy.data.objects.new("Act4_Title", make_text("A4TitleCurve", "SCALING CLASSICAL INFORMATION", 0.60, 'CENTER', 'CENTER'))
    a4_title.location = (0.0, 2.3, 0.1)
    a4_title.data.materials.append(mat_white)
    a4_title.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_title)

    a4_sub = bpy.data.objects.new("Act4_Sub", make_text("A4SubCurve", "COMBINING INDEPENDENT BITS INTO DATA STRINGS", 0.32, 'CENTER', 'CENTER'))
    a4_sub.location = (0.0, 1.65, 0.1)
    a4_sub.data.materials.append(mat_cyan)
    a4_sub.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_sub)

    # 5 Register Chips: "1", "0", "1", "1", "0"
    chip_vals = [("1", mat_amber, "BIT 1"), ("0", mat_emerald, "BIT 2"), ("1", mat_amber, "BIT 3"), ("1", mat_amber, "BIT 4"), ("0", mat_emerald, "BIT 5")]
    chip_xs = [-4.0, -2.0, 0.0, 2.0, 4.0]

    for i, (val, mat_val, lbl) in enumerate(chip_vals):
        cx = chip_xs[i]
        
        c_bg = bpy.data.objects.new(f"Act4_ChipBg_{i}", make_rect(f"A4ChipBgMesh_{i}", 1.6, 2.0))
        c_bg.location = (cx, 0.1, 0.0)
        c_bg.data.materials.append(mat_card_dark)
        c_bg.parent = act4_group
        cols["MAIN_VISUAL"].objects.link(c_bg)

        c_border = bpy.data.objects.new(f"Act4_ChipBorder_{i}", make_border_frame(f"A4ChipBorderMesh_{i}", 1.6, 2.0, 0.04))
        c_border.location = (cx, 0.1, 0.02)
        c_border.data.materials.append(mat_val)
        c_border.parent = act4_group
        cols["MAIN_VISUAL"].objects.link(c_border)

        c_num = bpy.data.objects.new(f"Act4_ChipNum_{i}", make_text(f"A4ChipNumCurve_{i}", val, 1.1, 'CENTER', 'CENTER'))
        c_num.location = (cx, 0.2, 0.04)
        c_num.data.materials.append(mat_val)
        c_num.parent = act4_group
        cols["MAIN_VISUAL"].objects.link(c_num)

        c_lbl = bpy.data.objects.new(f"Act4_ChipLbl_{i}", make_text(f"A4ChipLblCurve_{i}", lbl, 0.18, 'CENTER', 'CENTER'))
        c_lbl.location = (cx, -0.65, 0.04)
        c_lbl.data.materials.append(mat_dim_white)
        c_lbl.parent = act4_group
        cols["MAIN_VISUAL"].objects.link(c_lbl)

    # Bus Wire connecting all 5 bits
    a4_bus = bpy.data.objects.new("Act4_BusWire", make_rect("A4BusWireMesh", 10.0, 0.04))
    a4_bus.location = (0.0, -1.2, 0.01)
    a4_bus.data.materials.append(mat_wire)
    a4_bus.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_bus)

    # Bottom Data Representation Note
    a4_note_txt = bpy.data.objects.new("Act4_NoteTxt", make_text("A4NoteTxtCurve", "STRING: 10110  ➔  ENCODES NUMBERS, TEXT, IMAGES, INSTRUCTIONS", 0.28, 'CENTER', 'CENTER'))
    a4_note_txt.location = (0.0, -1.75, 0.05)
    a4_note_txt.data.materials.append(mat_yellow)
    a4_note_txt.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_note_txt)

    a4_note_sub = bpy.data.objects.new("Act4_NoteSub", make_text("A4NoteSubCurve", "Each individual bit remains strictly deterministic.", 0.24, 'CENTER', 'CENTER'))
    a4_note_sub.location = (0.0, -2.35, 0.05)
    a4_note_sub.data.materials.append(mat_dim_white)
    a4_note_sub.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_note_sub)

    # Act 4 Animation (Frames 1081 - 1170)
    act4_group.scale = (0.0, 0.0, 0.0)
    act4_group.keyframe_insert(data_path="scale", frame=1081)
    act4_group.scale = (1.0, 1.0, 1.0)
    act4_group.keyframe_insert(data_path="scale", frame=1105)
    act4_group.scale = (1.0, 1.0, 1.0)
    act4_group.keyframe_insert(data_path="scale", frame=1150)
    act4_group.scale = (0.0, 0.0, 0.0)
    act4_group.keyframe_insert(data_path="scale", frame=1170)

    # -------------------------------------------------------------
    # ACT 5: TRANSITION TO QUBIT (Frames 1171 - 1260)
    # 0:21 - 0:24 (Transition into Scene 3)
    # -------------------------------------------------------------
    act5_group = bpy.data.objects.new("Act5_TransitionQubit_Group", None)
    act5_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act5_group)

    a5_title = bpy.data.objects.new("Act5_Title", make_text("A5TitleCurve", "NOW MEET THE QUBIT", 0.70, 'CENTER', 'CENTER'))
    a5_title.location = (0.0, 2.3, 0.1)
    a5_title.data.materials.append(mat_cyan)
    a5_title.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_title)

    a5_sub = bpy.data.objects.new("Act5_Sub", make_text("A5SubCurve", "COMPUTING WITH THE RULES OF QUANTUM MECHANICS", 0.32, 'CENTER', 'CENTER'))
    a5_sub.location = (0.0, 1.7, 0.1)
    a5_sub.data.materials.append(mat_white)
    a5_sub.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_sub)

    # Center Transforming Quantum Node (Centered at Y = 0.0)
    a5_disc = bpy.data.objects.new("Act5_CoreDisc", make_disc("A5CoreDiscMesh", 1.15))
    a5_disc.location = (0.0, 0.0, 0.0)
    a5_disc.data.materials.append(mat_card_dark)
    a5_disc.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_disc)

    a5_halo = bpy.data.objects.new("Act5_CoreHalo", make_ring("A5CoreHaloMesh", 1.12, 1.30))
    a5_halo.location = (0.0, 0.0, 0.02)
    a5_halo.data.materials.append(mat_cyan_halo)
    a5_halo.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_halo)

    a5_wave = bpy.data.objects.new("Act5_CoreWave", make_ring("A5CoreWaveMesh", 1.45, 1.58))
    a5_wave.location = (0.0, 0.0, 0.02)
    a5_wave.data.materials.append(mat_violet)
    a5_wave.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_wave)

    a5_txt = bpy.data.objects.new("Act5_CoreTxt", make_text("A5CoreTxtCurve", "QUBIT", 0.65, 'CENTER', 'CENTER'))
    a5_txt.location = (0.0, -0.15, 0.05)
    a5_txt.data.materials.append(mat_cyan)
    a5_txt.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_txt)

    # Bottom Transition Preview Badge (Centered at Y = -2.35)
    a5_prev_bg = bpy.data.objects.new("Act5_PrevBg", make_rect("A5PrevBgMesh", 7.2, 0.55))
    a5_prev_bg.location = (0.0, -2.35, 0.01)
    a5_prev_bg.data.materials.append(mat_card_dark)
    a5_prev_bg.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_prev_bg)

    a5_prev_border = bpy.data.objects.new("Act5_PrevBorder", make_border_frame("A5PrevBorderMesh", 7.2, 0.55, 0.03))
    a5_prev_border.location = (0.0, -2.35, 0.02)
    a5_prev_border.data.materials.append(mat_cyan)
    a5_prev_border.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_prev_border)

    a5_prev_txt = bpy.data.objects.new("Act5_PrevTxt", make_text("A5PrevTxtCurve", "NEXT  ➔  SCENE 3: INTRODUCING THE QUBIT", 0.26, 'CENTER', 'CENTER'))
    a5_prev_txt.location = (0.0, -2.35, 0.04)
    a5_prev_txt.data.materials.append(mat_yellow)
    a5_prev_txt.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_prev_txt)

    # Act 5 Animation (Frames 1171 - 1260)
    act5_group.scale = (0.0, 0.0, 0.0)
    act5_group.keyframe_insert(data_path="scale", frame=1171)
    act5_group.scale = (1.0, 1.0, 1.0)
    act5_group.keyframe_insert(data_path="scale", frame=1195)
    act5_group.scale = (1.0, 1.0, 1.0)
    act5_group.keyframe_insert(data_path="scale", frame=1260)

    # Pulse animation on outer wave ring
    a5_wave.scale = (1.0, 1.0, 1.0)
    a5_wave.keyframe_insert(data_path="scale", frame=1195)
    a5_wave.scale = (1.10, 1.10, 1.0)
    a5_wave.keyframe_insert(data_path="scale", frame=1225)
    a5_wave.scale = (1.0, 1.0, 1.0)
    a5_wave.keyframe_insert(data_path="scale", frame=1260)

    # 8. Save Scene File
    out_dir = os.path.abspath(os.path.join("qualution-video", "blender", "scenes"))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "lesson01_scene02_classical_bit.blend")
    
    bpy.ops.wm.save_as_mainfile(filepath=out_path)
    print(f"\n[QUALUTION] Successfully generated Lesson 1 Scene 2:")
    print(f"  Target File: {out_path}")
    print(f"  Frame Range: {scene.frame_start} - {scene.frame_end} ({scene.frame_end - scene.frame_start + 1} frames @ {render.fps} FPS = {(scene.frame_end - scene.frame_start + 1)/render.fps:.1f}s)")
    print(f"  Resolution: {render.resolution_x}x{render.resolution_y} (16:9)")

if __name__ == "__main__":
    build_scene()
