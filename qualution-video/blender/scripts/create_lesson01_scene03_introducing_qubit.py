"""
QUALUTION Lesson 1 Scene 3 Generator: Introducing the Qubit
File: qualution-video/blender/scenes/lesson01_scene03_introducing_qubit.blend
Duration: 28.0 seconds exactly (Frames 1261–2100 @ 30 FPS, 840 frames total)
Resolution: 1920x1080 (16:9)
Pipeline: Optimized Direct MP4 (EEVEE 8 samples, shadows off, H.264 in MP4)

Story Flow:
- Act 1 (0:00–0:05, Fr 1261–1410): "FROM BIT TO QUBIT" — Bridge from classical bit to qubit
- Act 2 (0:05–0:11, Fr 1411–1590): "THE QUBIT" — Hero QUALUTION_Qubit introduction
- Act 3 (0:11–0:17, Fr 1591–1770): "COMPUTATIONAL BASIS STATES" — |0⟩ and |1⟩ introduction
- Act 4 (0:17–0:23, Fr 1771–1950): "QUANTUM STATE NOTATION" — |ψ⟩ = α|0⟩ + β|1⟩ high-level preview
- Act 5 (0:23–0:28, Fr 1951–2100): "HOW IS A QUBIT REPRESENTED?" — Preview of Lesson 2
"""

import bpy
import os
import math

def build_scene():
    # 1. Reset to empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    scene = bpy.context.scene
    scene.name = "Lesson01_Scene03_IntroducingQubit"
    
    # 2. Render Settings (1920x1080, 30 FPS, Frames 1261-2100)
    render = scene.render
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.resolution_percentage = 100
    render.fps = 30
    render.fps_base = 1.0
    
    scene.frame_start = 1261
    scene.frame_end = 2100
    scene.frame_current = 1261
    
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
    
    # 3. Optimized Production Render Pipeline Settings (from RENDER_PIPELINE.md)
    eevee = scene.eevee
    eevee.taa_render_samples = 8
    eevee.use_shadows = False
    eevee.use_fast_gi = False
    eevee.use_raytracing = False
    eevee.use_volumetric_shadows = False
    eevee.use_overscan = False
    
    render.image_settings.media_type = 'VIDEO'
    render.image_settings.file_format = 'FFMPEG'
    render.ffmpeg.format = 'MPEG4'
    render.ffmpeg.codec = 'H264'
    render.ffmpeg.constant_rate_factor = 'HIGH'
    render.ffmpeg.ffmpeg_preset = 'GOOD'
    
    out_dir = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01", "scene03"))
    os.makedirs(out_dir, exist_ok=True)
    render.filepath = os.path.join(out_dir, "lesson01_scene03_introducing_qubit.mp4")
    
    # 4. Collection Structure under QUALUTION_MASTER
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
    
    # 5. Materials Setup (Flat Vector Palette)
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
    
    # 6. Geometry Helpers
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

    def make_ring(name, in_r, out_r, segs=48):
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

    def make_disc(name, r, segs=48):
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

    def make_arrow(name, length=1.2, shaft_w=0.08, head_w=0.28, head_len=0.35):
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

    # 7. Camera & Background Setup (Orthographic 16:9)
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

    # 8. Persistent Top Header (Collection TITLE)
    header_cat = bpy.data.objects.new("QUALUTION_Category", make_text("CatCurve", "QUALUTION — LESSON 1", 0.36, 'LEFT', 'TOP'))
    header_cat.location = (-6.4, 3.9, 0.1)
    header_cat.data.materials.append(mat_cyan)
    cols["TITLE"].objects.link(header_cat)
    
    header_title = bpy.data.objects.new("QUALUTION_LessonTitle", make_text("TitleCurve", "What Is Quantum Computing?", 0.58, 'LEFT', 'TOP'))
    header_title.location = (-6.4, 3.4, 0.1)
    header_title.data.materials.append(mat_white)
    cols["TITLE"].objects.link(header_title)

    header_scene_tag = bpy.data.objects.new("QUALUTION_SceneTag", make_text("TagCurve", "SCENE 3: INTRODUCING THE QUBIT", 0.32, 'RIGHT', 'TOP'))
    header_scene_tag.location = (6.4, 3.8, 0.1)
    header_scene_tag.data.materials.append(mat_dim_white)
    cols["TITLE"].objects.link(header_scene_tag)

    # -------------------------------------------------------------
    # CAPTIONS SYSTEM (Collection CAPTIONS)
    # Synchronized Subtitles Across 5 Story Acts (Frames 1261 - 2100)
    # -------------------------------------------------------------
    def create_caption(name, text_body, start_f, end_f):
        c_curve = make_text(f"{name}_Curve", text_body, 0.36, 'CENTER', 'CENTER')
        obj = bpy.data.objects.new(name, c_curve)
        obj.location = (0.0, -3.5, 0.1)
        obj.data.materials.append(mat_caption)
        cols["CAPTIONS"].objects.link(obj)
        
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=max(1261, start_f - 6))
        
        obj.scale = (1.0, 1.0, 1.0)
        obj.keyframe_insert(data_path="scale", frame=start_f + 4)
        obj.keyframe_insert(data_path="scale", frame=end_f - 4)
        
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=end_f + 6)
        return obj

    cap1 = create_caption("Caption_01", "In quantum computing, the fundamental unit of information is called a qubit.", 1265, 1405)
    cap2 = create_caption("Caption_02", "A qubit is the basic unit used to represent and process quantum information.", 1415, 1585)
    cap3 = create_caption("Caption_03", "Like a classical bit, a qubit has two computational basis states, written as |0⟩ and |1⟩.", 1595, 1765)
    cap4 = create_caption("Caption_04", "Quantum states are commonly written using notation such as |ψ⟩. We'll unpack this in the next lesson.", 1775, 1945)
    cap5 = create_caption("Caption_05", "In the next lesson, we'll dive deep into qubits, state vectors, and how quantum information behaves.", 1955, 2095)

    # -------------------------------------------------------------
    # ACT 1: BRIDGE FROM BIT TO QUBIT (Frames 1261 - 1410)
    # 0:00 - 0:05 (150 frames)
    # -------------------------------------------------------------
    act1_group = bpy.data.objects.new("Act1_Bridge_Group", None)
    act1_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act1_group)

    a1_title = bpy.data.objects.new("Act1_Title", make_text("A1TitleCurve", "FROM BIT TO QUBIT", 0.65, 'CENTER', 'CENTER'))
    a1_title.location = (0.0, 2.3, 0.1)
    a1_title.data.materials.append(mat_white)
    a1_title.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_title)

    a1_sub = bpy.data.objects.new("Act1_Sub", make_text("A1SubCurve", "A NEW UNIT OF INFORMATION", 0.32, 'CENTER', 'CENTER'))
    a1_sub.location = (0.0, 1.7, 0.1)
    a1_sub.data.materials.append(mat_cyan)
    a1_sub.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_sub)

    # Left: Classical Bit Card (X = -3.2, Y = -0.3)
    a1_bit_card = bpy.data.objects.new("Act1_BitCard", make_rect("A1BitCardMesh", 3.2, 3.0))
    a1_bit_card.location = (-3.2, -0.3, 0.0)
    a1_bit_card.data.materials.append(mat_card_dark)
    a1_bit_card.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_bit_card)

    a1_bit_border = bpy.data.objects.new("Act1_BitBorder", make_border_frame("A1BitBorderMesh", 3.2, 3.0, 0.05))
    a1_bit_border.location = (-3.2, -0.3, 0.02)
    a1_bit_border.data.materials.append(mat_card_border)
    a1_bit_border.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_bit_border)

    a1_bit_lbl = bpy.data.objects.new("Act1_BitLbl", make_text("A1BitLblCurve", "CLASSICAL", 0.22, 'CENTER', 'CENTER'))
    a1_bit_lbl.location = (-3.2, 0.75, 0.04)
    a1_bit_lbl.data.materials.append(mat_dim_white)
    a1_bit_lbl.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_bit_lbl)

    a1_bit_txt = bpy.data.objects.new("Act1_BitTxt", make_text("A1BitTxtCurve", "BIT", 1.1, 'CENTER', 'CENTER'))
    a1_bit_txt.location = (-3.2, -0.2, 0.04)
    a1_bit_txt.data.materials.append(mat_white)
    a1_bit_txt.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_bit_txt)

    a1_bit_val = bpy.data.objects.new("Act1_BitVal", make_text("A1BitValCurve", "0  OR  1", 0.26, 'CENTER', 'CENTER'))
    a1_bit_val.location = (-3.2, -1.2, 0.04)
    a1_bit_val.data.materials.append(mat_yellow)
    a1_bit_val.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_bit_val)

    # Center: Transition Arrow (Point right: rotate Z -90 deg)
    a1_arrow = bpy.data.objects.new("Act1_Arrow", make_arrow("A1ArrowMesh", 1.6, 0.10, 0.36, 0.45))
    a1_arrow.location = (-0.8, -0.3, 0.02)
    a1_arrow.rotation_euler = (0.0, 0.0, -math.pi / 2.0)
    a1_arrow.data.materials.append(mat_cyan)
    a1_arrow.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_arrow)

    # Right: Qubit Card (X = +3.2, Y = -0.3)
    a1_qubit_card = bpy.data.objects.new("Act1_QubitCard", make_rect("A1QubitCardMesh", 3.2, 3.0))
    a1_qubit_card.location = (3.2, -0.3, 0.0)
    a1_qubit_card.data.materials.append(mat_card_dark)
    a1_qubit_card.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_qubit_card)

    a1_qubit_border = bpy.data.objects.new("Act1_QubitBorder", make_border_frame("A1QubitBorderMesh", 3.2, 3.0, 0.06))
    a1_qubit_border.location = (3.2, -0.3, 0.02)
    a1_qubit_border.data.materials.append(mat_cyan)
    a1_qubit_border.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_qubit_border)

    a1_qubit_lbl = bpy.data.objects.new("Act1_QubitLbl", make_text("A1QubitLblCurve", "QUANTUM", 0.22, 'CENTER', 'CENTER'))
    a1_qubit_lbl.location = (3.2, 0.75, 0.04)
    a1_qubit_lbl.data.materials.append(mat_cyan)
    a1_qubit_lbl.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_qubit_lbl)

    a1_qubit_txt = bpy.data.objects.new("Act1_QubitTxt", make_text("A1QubitTxtCurve", "QUBIT", 1.0, 'CENTER', 'CENTER'))
    a1_qubit_txt.location = (3.2, -0.2, 0.04)
    a1_qubit_txt.data.materials.append(mat_cyan)
    a1_qubit_txt.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_qubit_txt)

    a1_qubit_val = bpy.data.objects.new("Act1_QubitVal", make_text("A1QubitValCurve", "|0⟩  AND  |1⟩", 0.26, 'CENTER', 'CENTER'))
    a1_qubit_val.location = (3.2, -1.2, 0.04)
    a1_qubit_val.data.materials.append(mat_yellow)
    a1_qubit_val.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(a1_qubit_val)

    # Act 1 Keyframes
    act1_group.scale = (0.0, 0.0, 0.0)
    act1_group.keyframe_insert(data_path="scale", frame=1261)
    act1_group.scale = (1.0, 1.0, 1.0)
    act1_group.keyframe_insert(data_path="scale", frame=1295)
    act1_group.scale = (1.0, 1.0, 1.0)
    act1_group.keyframe_insert(data_path="scale", frame=1385)
    act1_group.scale = (0.0, 0.0, 0.0)
    act1_group.keyframe_insert(data_path="scale", frame=1410)

    # -------------------------------------------------------------
    # ACT 2: HERO QUBIT INTRODUCTION (Frames 1411 - 1590)
    # 0:05 - 0:11 (180 frames)
    # -------------------------------------------------------------
    act2_group = bpy.data.objects.new("Act2_HeroQubit_Group", None)
    act2_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act2_group)

    a2_title = bpy.data.objects.new("Act2_Title", make_text("A2TitleCurve", "THE QUBIT", 0.75, 'CENTER', 'CENTER'))
    a2_title.location = (0.0, 2.3, 0.1)
    a2_title.data.materials.append(mat_cyan)
    a2_title.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_title)

    a2_sub = bpy.data.objects.new("Act2_Sub", make_text("A2SubCurve", "UNIT OF QUANTUM INFORMATION", 0.36, 'CENTER', 'CENTER'))
    a2_sub.location = (0.0, 1.65, 0.1)
    a2_sub.data.materials.append(mat_white)
    a2_sub.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_sub)

    # Reusable QUALUTION_Qubit Hero Node (at X=0, Y=-0.2)
    qubit_hero = bpy.data.objects.new("QUALUTION_Qubit", None)
    qubit_hero.location = (0.0, -0.2, 0.0)
    qubit_hero.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(qubit_hero)

    q_outer_halo = bpy.data.objects.new("QUALUTION_Qubit_OuterHalo", make_ring("QOuterHaloMesh", 1.45, 1.62, segs=48))
    q_outer_halo.location = (0.0, 0.0, 0.01)
    q_outer_halo.data.materials.append(mat_cyan_halo)
    q_outer_halo.parent = qubit_hero
    cols["MAIN_VISUAL"].objects.link(q_outer_halo)

    q_core_disc = bpy.data.objects.new("QUALUTION_Qubit_Core", make_disc("QCoreMesh", 1.05, segs=48))
    q_core_disc.data.materials.append(mat_card_dark)
    q_core_disc.parent = qubit_hero
    cols["MAIN_VISUAL"].objects.link(q_core_disc)

    q_core_ring = bpy.data.objects.new("QUALUTION_Qubit_Ring", make_ring("QRingMesh", 1.02, 1.15, segs=48))
    q_core_ring.location = (0.0, 0.0, 0.02)
    q_core_ring.data.materials.append(mat_cyan)
    q_core_ring.parent = qubit_hero
    cols["MAIN_VISUAL"].objects.link(q_core_ring)

    q_center_dot = bpy.data.objects.new("QUALUTION_Qubit_Dot", make_disc("QDotMesh", 0.30, segs=36))
    q_center_dot.location = (0.0, 0.0, 0.03)
    q_center_dot.data.materials.append(mat_white)
    q_center_dot.parent = qubit_hero
    cols["MAIN_VISUAL"].objects.link(q_center_dot)

    # Orbital Ring & Revolving Quantum Electron
    q_orbit_pivot = bpy.data.objects.new("QUALUTION_Qubit_OrbitPivot", None)
    q_orbit_pivot.location = (0.0, 0.0, 0.0)
    q_orbit_pivot.parent = qubit_hero
    cols["MAIN_VISUAL"].objects.link(q_orbit_pivot)

    q_orbit_node = bpy.data.objects.new("QUALUTION_Qubit_OrbitNode", make_disc("QOrbitNodeMesh", 0.18, segs=24))
    q_orbit_node.location = (1.53, 0.0, 0.04)
    q_orbit_node.data.materials.append(mat_yellow)
    q_orbit_node.parent = q_orbit_pivot
    cols["MAIN_VISUAL"].objects.link(q_orbit_node)

    # Continuous smooth rotation of orbit node (Frames 1411 - 1590)
    q_orbit_pivot.rotation_euler = (0.0, 0.0, 0.0)
    q_orbit_pivot.keyframe_insert(data_path="rotation_euler", frame=1411)
    q_orbit_pivot.rotation_euler = (0.0, 0.0, 2.0 * math.pi)
    q_orbit_pivot.keyframe_insert(data_path="rotation_euler", frame=1590)

    # Bottom Hero Callout Badge
    a2_badge_bg = bpy.data.objects.new("Act2_BadgeBg", make_rect("A2BadgeBgMesh", 7.6, 0.55))
    a2_badge_bg.location = (0.0, -2.4, 0.01)
    a2_badge_bg.data.materials.append(mat_card_dark)
    a2_badge_bg.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_badge_bg)

    a2_badge_border = bpy.data.objects.new("Act2_BadgeBorder", make_border_frame("A2BadgeBorderMesh", 7.6, 0.55, 0.03))
    a2_badge_border.location = (0.0, -2.4, 0.02)
    a2_badge_border.data.materials.append(mat_cyan)
    a2_badge_border.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_badge_border)

    a2_badge_txt = bpy.data.objects.new("Act2_BadgeTxt", make_text("A2BadgeTxtCurve", "THE FUNDAMENTAL BUILDING BLOCK OF QUANTUM LOGIC", 0.25, 'CENTER', 'CENTER'))
    a2_badge_txt.location = (0.0, -2.4, 0.04)
    a2_badge_txt.data.materials.append(mat_white)
    a2_badge_txt.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(a2_badge_txt)

    # Act 2 Keyframes
    act2_group.scale = (0.0, 0.0, 0.0)
    act2_group.keyframe_insert(data_path="scale", frame=1411)
    act2_group.scale = (1.0, 1.0, 1.0)
    act2_group.keyframe_insert(data_path="scale", frame=1445)
    act2_group.scale = (1.0, 1.0, 1.0)
    act2_group.keyframe_insert(data_path="scale", frame=1565)
    act2_group.scale = (0.0, 0.0, 0.0)
    act2_group.keyframe_insert(data_path="scale", frame=1590)

    # -------------------------------------------------------------
    # ACT 3: COMPUTATIONAL BASIS STATES (|0⟩ and |1⟩) (Frames 1591 - 1770)
    # 0:11 - 0:17 (180 frames)
    # -------------------------------------------------------------
    act3_group = bpy.data.objects.new("Act3_BasisStates_Group", None)
    act3_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act3_group)

    a3_title = bpy.data.objects.new("Act3_Title", make_text("A3TitleCurve", "COMPUTATIONAL BASIS STATES", 0.65, 'CENTER', 'CENTER'))
    a3_title.location = (0.0, 2.4, 0.1)
    a3_title.data.materials.append(mat_white)
    a3_title.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_title)

    a3_sub = bpy.data.objects.new("Act3_Sub", make_text("A3SubCurve", "THE QUANTUM COUNTERPARTS TO CLASSICAL 0 AND 1", 0.30, 'CENTER', 'CENTER'))
    a3_sub.location = (0.0, 1.8, 0.1)
    a3_sub.data.materials.append(mat_cyan)
    a3_sub.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_sub)

    # Center Qubit Node (Compact)
    a3_qubit = bpy.data.objects.new("Act3_CenterQubit", make_disc("A3CenterQubitMesh", 0.75, segs=36))
    a3_qubit.location = (0.0, -0.3, 0.0)
    a3_qubit.data.materials.append(mat_card_dark)
    a3_qubit.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_qubit)

    a3_qubit_ring = bpy.data.objects.new("Act3_CenterQubitRing", make_ring("A3CenterQubitRingMesh", 0.72, 0.82, segs=36))
    a3_qubit_ring.location = (0.0, -0.3, 0.02)
    a3_qubit_ring.data.materials.append(mat_cyan)
    a3_qubit_ring.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_qubit_ring)

    a3_qubit_txt = bpy.data.objects.new("Act3_CenterQubitTxt", make_text("A3CenterQubitTxtCurve", "QUBIT", 0.28, 'CENTER', 'CENTER'))
    a3_qubit_txt.location = (0.0, -0.35, 0.04)
    a3_qubit_txt.data.materials.append(mat_cyan)
    a3_qubit_txt.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_qubit_txt)

    # Connecting Wire Rays to Left & Right Basis Cards
    a3_wire_l = bpy.data.objects.new("Act3_WireL", make_rect("A3WireLMesh", 1.8, 0.04))
    a3_wire_l.location = (-1.8, -0.3, 0.01)
    a3_wire_l.data.materials.append(mat_wire)
    a3_wire_l.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_wire_l)

    a3_wire_r = bpy.data.objects.new("Act3_WireR", make_rect("A3WireRMesh", 1.8, 0.04))
    a3_wire_r.location = (1.8, -0.3, 0.01)
    a3_wire_r.data.materials.append(mat_wire)
    a3_wire_r.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_wire_r)

    # Reusable QUALUTION_Ket0 Asset (X = -3.4, Y = -0.3)
    ket0_root = bpy.data.objects.new("QUALUTION_Ket0", None)
    ket0_root.location = (-3.4, -0.3, 0.0)
    ket0_root.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(ket0_root)

    k0_card_bg = bpy.data.objects.new("QUALUTION_Ket0_CardBg", make_rect("K0CardBgMesh", 2.8, 2.8))
    k0_card_bg.data.materials.append(mat_card_dark)
    k0_card_bg.parent = ket0_root
    cols["MAIN_VISUAL"].objects.link(k0_card_bg)

    k0_border = bpy.data.objects.new("QUALUTION_Ket0_Border", make_border_frame("K0BorderMesh", 2.8, 2.8, 0.05))
    k0_border.location = (0.0, 0.0, 0.02)
    k0_border.data.materials.append(mat_emerald)
    k0_border.parent = ket0_root
    cols["MAIN_VISUAL"].objects.link(k0_border)

    k0_text = bpy.data.objects.new("QUALUTION_Ket0_Text", make_text("K0TextCurve", "|0⟩", 1.25, 'CENTER', 'CENTER'))
    k0_text.location = (0.0, -0.15, 0.04)
    k0_text.data.materials.append(mat_emerald)
    k0_text.parent = ket0_root
    cols["MAIN_VISUAL"].objects.link(k0_text)

    k0_label = bpy.data.objects.new("QUALUTION_Ket0_Label", make_text("K0LabelCurve", "BASIS STATE |0⟩", 0.22, 'CENTER', 'CENTER'))
    k0_label.location = (0.0, -1.15, 0.04)
    k0_label.data.materials.append(mat_white)
    k0_label.parent = ket0_root
    cols["MAIN_VISUAL"].objects.link(k0_label)

    # Reusable QUALUTION_Ket1 Asset (X = +3.4, Y = -0.3)
    ket1_root = bpy.data.objects.new("QUALUTION_Ket1", None)
    ket1_root.location = (3.4, -0.3, 0.0)
    ket1_root.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(ket1_root)

    k1_card_bg = bpy.data.objects.new("QUALUTION_Ket1_CardBg", make_rect("K1CardBgMesh", 2.8, 2.8))
    k1_card_bg.data.materials.append(mat_card_dark)
    k1_card_bg.parent = ket1_root
    cols["MAIN_VISUAL"].objects.link(k1_card_bg)

    k1_border = bpy.data.objects.new("QUALUTION_Ket1_Border", make_border_frame("K1BorderMesh", 2.8, 2.8, 0.05))
    k1_border.location = (0.0, 0.0, 0.02)
    k1_border.data.materials.append(mat_amber)
    k1_border.parent = ket1_root
    cols["MAIN_VISUAL"].objects.link(k1_border)

    k1_text = bpy.data.objects.new("QUALUTION_Ket1_Text", make_text("K1TextCurve", "|1⟩", 1.25, 'CENTER', 'CENTER'))
    k1_text.location = (0.0, -0.15, 0.04)
    k1_text.data.materials.append(mat_amber)
    k1_text.parent = ket1_root
    cols["MAIN_VISUAL"].objects.link(k1_text)

    k1_label = bpy.data.objects.new("QUALUTION_Ket1_Label", make_text("K1LabelCurve", "BASIS STATE |1⟩", 0.22, 'CENTER', 'CENTER'))
    k1_label.location = (0.0, -1.15, 0.04)
    k1_label.data.materials.append(mat_white)
    k1_label.parent = ket1_root
    cols["MAIN_VISUAL"].objects.link(k1_label)

    # Bottom Notation Banner
    a3_banner_bg = bpy.data.objects.new("Act3_BannerBg", make_rect("A3BannerBgMesh", 8.2, 0.52))
    a3_banner_bg.location = (0.0, -2.5, 0.01)
    a3_banner_bg.data.materials.append(mat_card_dark)
    a3_banner_bg.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_banner_bg)

    a3_banner_border = bpy.data.objects.new("Act3_BannerBorder", make_border_frame("A3BannerBorderMesh", 8.2, 0.52, 0.03))
    a3_banner_border.location = (0.0, -2.5, 0.02)
    a3_banner_border.data.materials.append(mat_card_border)
    a3_banner_border.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_banner_border)

    a3_banner_txt = bpy.data.objects.new("Act3_BannerTxt", make_text("A3BannerTxtCurve", "WRITTEN USING DIRAC BRA-KET NOTATION: |0⟩ AND |1⟩", 0.25, 'CENTER', 'CENTER'))
    a3_banner_txt.location = (0.0, -2.5, 0.04)
    a3_banner_txt.data.materials.append(mat_yellow)
    a3_banner_txt.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(a3_banner_txt)

    # Act 3 Keyframes
    act3_group.scale = (0.0, 0.0, 0.0)
    act3_group.keyframe_insert(data_path="scale", frame=1591)
    act3_group.scale = (1.0, 1.0, 1.0)
    act3_group.keyframe_insert(data_path="scale", frame=1620)
    act3_group.scale = (1.0, 1.0, 1.0)
    act3_group.keyframe_insert(data_path="scale", frame=1745)
    act3_group.scale = (0.0, 0.0, 0.0)
    act3_group.keyframe_insert(data_path="scale", frame=1770)

    # -------------------------------------------------------------
    # ACT 4: STATE NOTATION PREVIEW (|ψ⟩ = α|0⟩ + β|1⟩) (Frames 1771 - 1950)
    # 0:17 - 0:23 (180 frames)
    # -------------------------------------------------------------
    act4_group = bpy.data.objects.new("Act4_StateNotation_Group", None)
    act4_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act4_group)

    a4_title = bpy.data.objects.new("Act4_Title", make_text("A4TitleCurve", "QUANTUM STATE NOTATION", 0.65, 'CENTER', 'CENTER'))
    a4_title.location = (0.0, 2.4, 0.1)
    a4_title.data.materials.append(mat_white)
    a4_title.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_title)

    a4_sub = bpy.data.objects.new("Act4_Sub", make_text("A4SubCurve", "REPRESENTING THE STATE OF A QUANTUM SYSTEM", 0.30, 'CENTER', 'CENTER'))
    a4_sub.location = (0.0, 1.8, 0.1)
    a4_sub.data.materials.append(mat_cyan)
    a4_sub.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_sub)

    # Central Equation Card (X = 0, Y = -0.1)
    a4_card_bg = bpy.data.objects.new("Act4_CardBg", make_rect("A4CardBgMesh", 8.4, 2.4))
    a4_card_bg.location = (0.0, -0.1, 0.0)
    a4_card_bg.data.materials.append(mat_card_dark)
    a4_card_bg.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_card_bg)

    a4_card_border = bpy.data.objects.new("Act4_CardBorder", make_border_frame("A4CardBorderMesh", 8.4, 2.4, 0.05))
    a4_card_border.location = (0.0, -0.1, 0.02)
    a4_card_border.data.materials.append(mat_cyan)
    a4_card_border.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_card_border)

    a4_tag = bpy.data.objects.new("Act4_Tag", make_text("A4TagCurve", "STATE VECTOR NOTATION", 0.22, 'CENTER', 'CENTER'))
    a4_tag.location = (0.0, 0.75, 0.04)
    a4_tag.data.materials.append(mat_dim_white)
    a4_tag.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_tag)

    # The Hero Equation: |ψ⟩ = α|0⟩ + β|1⟩
    a4_eq = bpy.data.objects.new("Act4_Equation", make_text("A4EqCurve", "|ψ⟩  =  α|0⟩  +  β|1⟩", 0.82, 'CENTER', 'CENTER'))
    a4_eq.location = (0.0, -0.1, 0.05)
    a4_eq.data.materials.append(mat_white)
    a4_eq.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_eq)

    a4_beam = bpy.data.objects.new("Act4_Beam", make_rect("A4BeamMesh", 6.8, 0.03))
    a4_beam.location = (0.0, -0.7, 0.03)
    a4_beam.data.materials.append(mat_cyan)
    a4_beam.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_beam)

    # Bottom Curriculum-Safe Restraint Card
    a4_note_bg = bpy.data.objects.new("Act4_NoteBg", make_rect("A4NoteBgMesh", 8.4, 0.52))
    a4_note_bg.location = (0.0, -2.45, 0.01)
    a4_note_bg.data.materials.append(mat_card_dark)
    a4_note_bg.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_note_bg)

    a4_note_border = bpy.data.objects.new("Act4_NoteBorder", make_border_frame("A4NoteBorderMesh", 8.4, 0.52, 0.03))
    a4_note_border.location = (0.0, -2.45, 0.02)
    a4_note_border.data.materials.append(mat_card_border)
    a4_note_border.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_note_border)

    a4_note_txt = bpy.data.objects.new("Act4_NoteTxt", make_text("A4NoteTxtCurve", "PREVIEW: WE'LL UNPACK SUPERPOSITION AND COEFFICIENTS IN LESSON 2", 0.23, 'CENTER', 'CENTER'))
    a4_note_txt.location = (0.0, -2.45, 0.04)
    a4_note_txt.data.materials.append(mat_yellow)
    a4_note_txt.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(a4_note_txt)

    # Act 4 Keyframes
    act4_group.scale = (0.0, 0.0, 0.0)
    act4_group.keyframe_insert(data_path="scale", frame=1771)
    act4_group.scale = (1.0, 1.0, 1.0)
    act4_group.keyframe_insert(data_path="scale", frame=1800)
    act4_group.scale = (1.0, 1.0, 1.0)
    act4_group.keyframe_insert(data_path="scale", frame=1925)
    act4_group.scale = (0.0, 0.0, 0.0)
    act4_group.keyframe_insert(data_path="scale", frame=1950)

    # -------------------------------------------------------------
    # ACT 5: TRANSITION TO LESSON 2 (Frames 1951 - 2100)
    # 0:23 - 0:28 (150 frames)
    # -------------------------------------------------------------
    act5_group = bpy.data.objects.new("Act5_TransitionLesson2_Group", None)
    act5_group.location = (0.0, 0.0, 0.0)
    cols["MAIN_VISUAL"].objects.link(act5_group)

    a5_title = bpy.data.objects.new("Act5_Title", make_text("A5TitleCurve", "HOW IS A QUBIT REPRESENTED?", 0.70, 'CENTER', 'CENTER'))
    a5_title.location = (0.0, 2.3, 0.1)
    a5_title.data.materials.append(mat_cyan)
    a5_title.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_title)

    a5_sub = bpy.data.objects.new("Act5_Sub", make_text("A5SubCurve", "PREVIEW OF LESSON 2: QUBITS & QUANTUM STATES", 0.32, 'CENTER', 'CENTER'))
    a5_sub.location = (0.0, 1.65, 0.1)
    a5_sub.data.materials.append(mat_white)
    a5_sub.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_sub)

    # Coordinate Circle / Compass Preview (Y = -0.2)
    a5_dial = bpy.data.objects.new("Act5_DialDisc", make_disc("A5DialDiscMesh", 1.25, segs=48))
    a5_dial.location = (0.0, -0.2, 0.0)
    a5_dial.data.materials.append(mat_card_dark)
    a5_dial.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_dial)

    a5_dial_ring = bpy.data.objects.new("Act5_DialRing", make_ring("A5DialRingMesh", 1.22, 1.28, segs=48))
    a5_dial_ring.location = (0.0, -0.2, 0.02)
    a5_dial_ring.data.materials.append(mat_card_border)
    a5_dial_ring.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_dial_ring)

    # Basis labels on compass
    a5_lbl_k0 = bpy.data.objects.new("Act5_LblK0", make_text("A5LblK0Curve", "|0⟩", 0.32, 'CENTER', 'CENTER'))
    a5_lbl_k0.location = (0.0, 1.25, 0.04)
    a5_lbl_k0.data.materials.append(mat_emerald)
    a5_lbl_k0.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_lbl_k0)

    a5_lbl_k1 = bpy.data.objects.new("Act5_LblK1", make_text("A5LblK1Curve", "|1⟩", 0.32, 'CENTER', 'CENTER'))
    a5_lbl_k1.location = (1.45, -0.2, 0.04)
    a5_lbl_k1.data.materials.append(mat_amber)
    a5_lbl_k1.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_lbl_k1)

    # Reusable State Vector Arrow (QUALUTION_StateVector) pointing dynamically
    state_vector_root = bpy.data.objects.new("QUALUTION_StateVector", None)
    state_vector_root.location = (0.0, -0.2, 0.03)
    state_vector_root.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(state_vector_root)

    v_arrow = bpy.data.objects.new("QUALUTION_StateVector_Arrow", make_arrow("VArrowMesh", 1.15, 0.08, 0.28, 0.32))
    v_arrow.rotation_euler = (0.0, 0.0, -math.pi / 4.0) # 45 degrees
    v_arrow.data.materials.append(mat_cyan)
    v_arrow.parent = state_vector_root
    cols["MAIN_VISUAL"].objects.link(v_arrow)

    v_dot = bpy.data.objects.new("QUALUTION_StateVector_Origin", make_disc("VOriginMesh", 0.16, segs=24))
    v_dot.data.materials.append(mat_white)
    v_dot.location = (0.0, 0.0, 0.04)
    v_dot.parent = state_vector_root
    cols["MAIN_VISUAL"].objects.link(v_dot)

    v_lbl = bpy.data.objects.new("Act5_StateVectorLbl", make_text("A5StateVectorLblCurve", "|ψ⟩", 0.44, 'CENTER', 'CENTER'))
    v_lbl.location = (0.95, 0.65, 0.05)
    v_lbl.data.materials.append(mat_cyan)
    v_lbl.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(v_lbl)

    # Bottom Lesson 2 Preview Card
    a5_prev_bg = bpy.data.objects.new("Act5_PrevBg", make_rect("A5PrevBgMesh", 8.2, 0.55))
    a5_prev_bg.location = (0.0, -2.4, 0.01)
    a5_prev_bg.data.materials.append(mat_card_dark)
    a5_prev_bg.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_prev_bg)

    a5_prev_border = bpy.data.objects.new("Act5_PrevBorder", make_border_frame("A5PrevBorderMesh", 8.2, 0.55, 0.03))
    a5_prev_border.location = (0.0, -2.4, 0.02)
    a5_prev_border.data.materials.append(mat_cyan)
    a5_prev_border.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_prev_border)

    a5_prev_txt = bpy.data.objects.new("Act5_PrevTxt", make_text("A5PrevTxtCurve", "NEXT ➔ LESSON 2: QUBITS & QUANTUM STATES", 0.28, 'CENTER', 'CENTER'))
    a5_prev_txt.location = (0.0, -2.4, 0.04)
    a5_prev_txt.data.materials.append(mat_yellow)
    a5_prev_txt.parent = act5_group
    cols["MAIN_VISUAL"].objects.link(a5_prev_txt)

    # Act 5 Keyframes
    act5_group.scale = (0.0, 0.0, 0.0)
    act5_group.keyframe_insert(data_path="scale", frame=1951)
    act5_group.scale = (1.0, 1.0, 1.0)
    act5_group.keyframe_insert(data_path="scale", frame=1980)
    act5_group.scale = (1.0, 1.0, 1.0)
    act5_group.keyframe_insert(data_path="scale", frame=2100)

    # Save Scene File
    blend_dir = os.path.abspath(os.path.join("qualution-video", "blender", "scenes"))
    os.makedirs(blend_dir, exist_ok=True)
    blend_path = os.path.join(blend_dir, "lesson01_scene03_introducing_qubit.blend")
    
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"\n[QUALUTION] Successfully generated Lesson 1 Scene 3:")
    print(f"  Target File: {blend_path}")
    print(f"  Frame Range: {scene.frame_start} - {scene.frame_end} ({scene.frame_end - scene.frame_start + 1} frames @ {render.fps} FPS = {(scene.frame_end - scene.frame_start + 1)/render.fps:.1f}s)")
    print(f"  Resolution: {render.resolution_x}x{render.resolution_y} (16:9)")
    print(f"  Direct MP4 Output: {render.filepath}")

if __name__ == "__main__":
    build_scene()
