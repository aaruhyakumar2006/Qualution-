"""
QUALUTION Lesson 1 Scene 1 Scene Generator: From Bits to Qubits (Curriculum-Accurate Refinement)
Creates: qualution-video/blender/scenes/lesson01_scene01_bits_to_qubits.blend
Total duration: 25.0 seconds (750 frames @ 30 FPS)

Curriculum Alignment:
- Shot 1 (Fr 1-150): Classical Bit (0 or 1, one state at a time)
- Shot 2 (Fr 151-300): The Qubit (Basic unit of quantum info, introduces |0⟩ and |1⟩)
- Shot 3 (Fr 301-465): Quantum State (|ψ⟩ notation and introductory |ψ⟩ = α|0⟩ + β|1⟩)
- Shot 4 (Fr 466-630): Why It Matters (Circuit Preview: q[0] ─── H ─── M)
- Shot 5 (Fr 631-750): Transition ("Quantum computing manipulates quantum states")
"""

import bpy
import os
import math

def setup_scene():
    # 1. Reset to empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    scene = bpy.context.scene
    scene.name = "Lesson01_Scene01_BitsToQubits"
    
    # 2. Render Settings (1920x1080, 30 FPS, Frames 1-750)
    render = scene.render
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.resolution_percentage = 100
    render.fps = 30
    render.fps_base = 1.0
    
    scene.frame_start = 1
    scene.frame_end = 750
    scene.frame_current = 1
    
    # Engine & Color Management
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
    
    # 3. Build Standard QUALUTION Collection Structure
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
    
    # 4. Materials Palette
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
    mat_emerald = create_mat("QUALUTION_Mat_Emerald", (0.063, 0.725, 0.506, 1.0)) # #10B981
    mat_amber = create_mat("QUALUTION_Mat_Amber", (0.96, 0.62, 0.043, 1.0)) # #F59E0B
    mat_violet = create_mat("QUALUTION_Mat_Violet", (0.65, 0.33, 0.98, 1.0)) # #A855F7
    mat_dark_card = create_mat("QUALUTION_Mat_CardDark", (0.118, 0.161, 0.231, 1.0)) # #1E293B
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

    def make_arrow(name, length=2.0, shaft_w=0.08, head_w=0.36, head_len=0.5):
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

    def make_arc(name, radius, width=0.04, start_deg=-60, end_deg=60, segments=24):
        mesh = bpy.data.meshes.new(name)
        verts, faces = [], []
        r_in = radius - width / 2.0
        r_out = radius + width / 2.0
        rad_start = math.radians(start_deg)
        rad_end = math.radians(end_deg)
        for i in range(segments + 1):
            t = i / float(segments)
            ang = rad_start + t * (rad_end - rad_start)
            verts.append((r_in * math.sin(ang), r_in * math.cos(ang), 0.0))
            verts.append((r_out * math.sin(ang), r_out * math.cos(ang), 0.0))
        for i in range(segments):
            faces.append((i*2, i*2+1, (i+1)*2+1, (i+1)*2))
        mesh.from_pydata(verts, [], faces)
        mesh.update()
        return mesh

    # 6. Camera & Background Setup
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

    # 7. Persistent Header Titles (Collection TITLE)
    header_cat = bpy.data.objects.new("QUALUTION_Category", make_text("CatCurve", "QUALUTION — LESSON 1", 0.36, 'LEFT', 'TOP'))
    header_cat.location = (-6.4, 3.9, 0.1)
    header_cat.data.materials.append(mat_cyan)
    cols["TITLE"].objects.link(header_cat)
    
    header_title = bpy.data.objects.new("QUALUTION_LessonTitle", make_text("TitleCurve", "What Is Quantum Computing?", 0.58, 'LEFT', 'TOP'))
    header_title.location = (-6.4, 3.4, 0.1)
    header_title.data.materials.append(mat_white)
    cols["TITLE"].objects.link(header_title)

    # -------------------------------------------------------------
    # CAPTIONS SYSTEM (Collection CAPTIONS)
    # Curriculum-Accurate Narration Subtitles
    # -------------------------------------------------------------
    caption_anchor = bpy.data.objects.new("QUALUTION_CaptionAnchor", None)
    caption_anchor.location = (0.0, -3.5, 0.0)
    cols["CAPTIONS"].objects.link(caption_anchor)
    
    def create_caption_line(name, text_body, start_f, end_f):
        c_curve = make_text(f"{name}_Curve", text_body, 0.38, 'CENTER', 'CENTER')
        obj = bpy.data.objects.new(name, c_curve)
        obj.location = (0.0, -3.5, 0.1)
        obj.data.materials.append(mat_caption)
        cols["CAPTIONS"].objects.link(obj)
        
        # Animate visibility via scale
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=max(1, start_f - 5))
        
        obj.scale = (1.0, 1.0, 1.0)
        obj.keyframe_insert(data_path="scale", frame=start_f + 5)
        obj.keyframe_insert(data_path="scale", frame=end_f - 5)
        
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=end_f + 5)
        return obj

    cap1 = create_caption_line("Caption_Shot1", "A classical bit can only be in one state at any moment: 0 or 1.", 1, 145)
    cap2 = create_caption_line("Caption_Shot2", "A qubit is the basic unit of quantum information, represented by |0⟩ and |1⟩.", 150, 295)
    cap3 = create_caption_line("Caption_Shot3", "A qubit's general state is represented by |ψ⟩, combining basis states |0⟩ and |1⟩.", 300, 460)
    cap4 = create_caption_line("Caption_Shot4", "Quantum circuits process information by transforming quantum states through gates.", 465, 625)
    cap5 = create_caption_line("Caption_Shot5", "Quantum computing manipulates quantum states to solve complex computational problems.", 630, 745)

    # -------------------------------------------------------------
    # SHOT 1: CLASSICAL BIT (Frames 1 - 150)
    # -------------------------------------------------------------
    shot1_root = bpy.data.objects.new("Shot1_ClassicalBit_Group", None)
    shot1_root.location = (0.0, 0.3, 0.0)
    cols["MAIN_VISUAL"].objects.link(shot1_root)
    
    # Shot 1 Header: "CLASSICAL BIT"
    s1_title = bpy.data.objects.new("Shot1_Title", make_text("S1_TitleCurve", "CLASSICAL BIT", 0.65, 'CENTER', 'CENTER'))
    s1_title.location = (0.0, 1.8, 0.1)
    s1_title.data.materials.append(mat_cyan)
    s1_title.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(s1_title)
    
    # State Box 0
    box0 = bpy.data.objects.new("Shot1_Box0", make_rect("Box0Mesh", 2.2, 2.2))
    box0.location = (-2.0, -0.2, 0.0)
    box0.data.materials.append(mat_dark_card)
    box0.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(box0)
    
    border0 = bpy.data.objects.new("Shot1_Border0", make_ring("Border0Mesh", 1.05, 1.15, segs=32))
    border0.location = (-2.0, -0.2, 0.01)
    border0.data.materials.append(mat_emerald)
    border0.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(border0)
    
    text0 = bpy.data.objects.new("Shot1_Text0", make_text("Text0Curve", "0", 1.2, 'CENTER', 'CENTER'))
    text0.location = (-2.0, -0.3, 0.02)
    text0.data.materials.append(mat_emerald)
    text0.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(text0)
    
    # State Box 1
    box1 = bpy.data.objects.new("Shot1_Box1", make_rect("Box1Mesh", 2.2, 2.2))
    box1.location = (2.0, -0.2, 0.0)
    box1.data.materials.append(mat_dark_card)
    box1.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(box1)
    
    border1 = bpy.data.objects.new("Shot1_Border1", make_ring("Border1Mesh", 1.05, 1.15, segs=32))
    border1.location = (2.0, -0.2, 0.01)
    border1.data.materials.append(mat_amber)
    border1.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(border1)
    
    text1 = bpy.data.objects.new("Shot1_Text1", make_text("Text1Curve", "1", 1.2, 'CENTER', 'CENTER'))
    text1.location = (2.0, -0.3, 0.02)
    text1.data.materials.append(mat_amber)
    text1.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(text1)

    # State Selector / Limitation Pointer
    indicator_mesh = make_arrow("ClassicalIndicatorMesh", length=1.2, shaft_w=0.08, head_w=0.30, head_len=0.35)
    indicator = bpy.data.objects.new("Shot1_Indicator", indicator_mesh)
    indicator.location = (-2.0, -2.1, 0.05) # Points to Box 0 initially
    indicator.data.materials.append(mat_yellow)
    indicator.parent = shot1_root
    cols["MAIN_VISUAL"].objects.link(indicator)
    
    # Keyframe Shot 1:
    shot1_root.scale = (0.0, 0.0, 0.0)
    shot1_root.keyframe_insert(data_path="scale", frame=1)
    shot1_root.scale = (1.0, 1.0, 1.0)
    shot1_root.keyframe_insert(data_path="scale", frame=20)
    
    # Indicator toggles from 0 to 1
    indicator.location = (-2.0, -2.1, 0.05)
    indicator.keyframe_insert(data_path="location", frame=1)
    indicator.keyframe_insert(data_path="location", frame=65)
    indicator.location = (2.0, -2.1, 0.05)
    indicator.keyframe_insert(data_path="location", frame=90)
    indicator.keyframe_insert(data_path="location", frame=135)
    
    # Exit Shot 1 (Frames 140-150)
    shot1_root.scale = (1.0, 1.0, 1.0)
    shot1_root.keyframe_insert(data_path="scale", frame=140)
    shot1_root.scale = (0.0, 0.0, 0.0)
    shot1_root.keyframe_insert(data_path="scale", frame=150)

    # -------------------------------------------------------------
    # SHOT 2: THE QUBIT (Frames 151 - 300)
    # Heading: "THE QUBIT"
    # Introduces Qubit, |0⟩, and |1⟩ as the fundamental quantum unit
    # -------------------------------------------------------------
    shot2_root = bpy.data.objects.new("Shot2_Qubit_Group", None)
    shot2_root.location = (0.0, 0.3, 0.0)
    cols["MAIN_VISUAL"].objects.link(shot2_root)
    
    s2_title = bpy.data.objects.new("Shot2_Title", make_text("S2_TitleCurve", "THE QUBIT", 0.70, 'CENTER', 'CENTER'))
    s2_title.location = (0.0, 2.2, 0.1)
    s2_title.data.materials.append(mat_cyan)
    s2_title.parent = shot2_root
    cols["MAIN_VISUAL"].objects.link(s2_title)
    
    s2_sub = bpy.data.objects.new("Shot2_SubTitle", make_text("S2_SubCurve", "Basic Unit of Quantum Information", 0.38, 'CENTER', 'CENTER'))
    s2_sub.location = (0.0, 1.6, 0.1)
    s2_sub.data.materials.append(mat_white)
    s2_sub.parent = shot2_root
    cols["MAIN_VISUAL"].objects.link(s2_sub)
    
    # Central Qubit Visual
    qubit_node = bpy.data.objects.new("QUALUTION_Qubit", None)
    qubit_node.location = (0.0, -0.1, 0.0)
    qubit_node.parent = shot2_root
    cols["MAIN_VISUAL"].objects.link(qubit_node)
    
    q_ring = bpy.data.objects.new("QUALUTION_Qubit_Ring", make_ring("QRingMesh", 0.95, 1.08, segs=48))
    q_ring.data.materials.append(mat_cyan_halo)
    q_ring.parent = qubit_node
    cols["MAIN_VISUAL"].objects.link(q_ring)
    
    q_core = bpy.data.objects.new("QUALUTION_Qubit_Core", make_disc("QCoreMesh", 0.65, segs=48))
    q_core.data.materials.append(mat_cyan)
    q_core.parent = qubit_node
    cols["MAIN_VISUAL"].objects.link(q_core)
    
    q_dot = bpy.data.objects.new("QUALUTION_Qubit_Dot", make_disc("QDotMesh", 0.22, segs=24))
    q_dot.data.materials.append(mat_white)
    q_dot.location = (0.0, 0.0, 0.01)
    q_dot.parent = qubit_node
    cols["MAIN_VISUAL"].objects.link(q_dot)
    
    # Flanking Basis State Badges: |0⟩ and |1⟩
    ket0_group = bpy.data.objects.new("QUALUTION_Ket0", None)
    ket0_group.location = (-3.6, -0.1, 0.0)
    ket0_group.parent = shot2_root
    cols["MAIN_VISUAL"].objects.link(ket0_group)
    
    k0_badge = bpy.data.objects.new("Ket0_Badge", make_rect("K0BadgeMesh", 1.8, 1.8))
    k0_badge.data.materials.append(mat_dark_card)
    k0_badge.parent = ket0_group
    cols["MAIN_VISUAL"].objects.link(k0_badge)
    
    k0_border = bpy.data.objects.new("Ket0_Border", make_ring("K0BorderMesh", 0.85, 0.92, segs=36))
    k0_border.data.materials.append(mat_emerald)
    k0_border.location = (0.0, 0.0, 0.01)
    k0_border.parent = ket0_group
    cols["MAIN_VISUAL"].objects.link(k0_border)
    
    k0_text = bpy.data.objects.new("Ket0_Text", make_text("K0TextCurve", "|0⟩", 0.85, 'CENTER', 'CENTER'))
    k0_text.location = (0.0, -0.05, 0.02)
    k0_text.data.materials.append(mat_emerald)
    k0_text.parent = ket0_group
    cols["MAIN_VISUAL"].objects.link(k0_text)

    ket1_group = bpy.data.objects.new("QUALUTION_Ket1", None)
    ket1_group.location = (3.6, -0.1, 0.0)
    ket1_group.parent = shot2_root
    cols["MAIN_VISUAL"].objects.link(ket1_group)
    
    k1_badge = bpy.data.objects.new("Ket1_Badge", make_rect("K1BadgeMesh", 1.8, 1.8))
    k1_badge.data.materials.append(mat_dark_card)
    k1_badge.parent = ket1_group
    cols["MAIN_VISUAL"].objects.link(k1_badge)
    
    k1_border = bpy.data.objects.new("Ket1_Border", make_ring("K1BorderMesh", 0.85, 0.92, segs=36))
    k1_border.data.materials.append(mat_amber)
    k1_border.location = (0.0, 0.0, 0.01)
    k1_border.parent = ket1_group
    cols["MAIN_VISUAL"].objects.link(k1_border)
    
    k1_text = bpy.data.objects.new("Ket1_Text", make_text("K1TextCurve", "|1⟩", 0.85, 'CENTER', 'CENTER'))
    k1_text.location = (0.0, -0.05, 0.02)
    k1_text.data.materials.append(mat_amber)
    k1_text.parent = ket1_group
    cols["MAIN_VISUAL"].objects.link(k1_text)

    # Shot 2 Keyframes:
    shot2_root.scale = (0.0, 0.0, 0.0)
    shot2_root.keyframe_insert(data_path="scale", frame=150)
    shot2_root.scale = (1.0, 1.0, 1.0)
    shot2_root.keyframe_insert(data_path="scale", frame=170)
    
    # Flanking basis states animate in
    ket0_group.location = (-1.5, -0.1, 0.0)
    ket0_group.keyframe_insert(data_path="location", frame=170)
    ket0_group.location = (-3.6, -0.1, 0.0)
    ket0_group.keyframe_insert(data_path="location", frame=210)
    
    ket1_group.location = (1.5, -0.1, 0.0)
    ket1_group.keyframe_insert(data_path="location", frame=170)
    ket1_group.location = (3.6, -0.1, 0.0)
    ket1_group.keyframe_insert(data_path="location", frame=210)
    
    # Exit Shot 2 (Frames 285-300)
    shot2_root.scale = (1.0, 1.0, 1.0)
    shot2_root.keyframe_insert(data_path="scale", frame=285)
    shot2_root.scale = (0.0, 0.0, 0.0)
    shot2_root.keyframe_insert(data_path="scale", frame=300)

    # -------------------------------------------------------------
    # SHOT 3: QUANTUM STATE NOTATION (Frames 301 - 465)
    # Heading: "QUANTUM STATE NOTATION"
    # Clean, uncluttered presentation of |ψ⟩ and |ψ⟩ = α|0⟩ + β|1⟩
    # -------------------------------------------------------------
    shot3_root = bpy.data.objects.new("Shot3_State_Group", None)
    shot3_root.location = (0.0, 0.2, 0.0)
    cols["MAIN_VISUAL"].objects.link(shot3_root)
    
    s3_title = bpy.data.objects.new("Shot3_Title", make_text("S3_TitleCurve", "QUANTUM STATE NOTATION", 0.65, 'CENTER', 'CENTER'))
    s3_title.location = (0.0, 2.3, 0.1)
    s3_title.data.materials.append(mat_cyan)
    s3_title.parent = shot3_root
    cols["MAIN_VISUAL"].objects.link(s3_title)
    
    # Primary Quantum State Symbol: |ψ⟩
    psi_main = bpy.data.objects.new("Shot3_PsiSymbol", make_text("PsiMainCurve", "|ψ⟩", 1.3, 'CENTER', 'CENTER'))
    psi_main.location = (0.0, 1.1, 0.1)
    psi_main.data.materials.append(mat_cyan)
    psi_main.parent = shot3_root
    cols["MAIN_VISUAL"].objects.link(psi_main)
    
    # Representation Equation: |ψ⟩ = α|0⟩ + β|1⟩
    eq_obj = bpy.data.objects.new("Shot3_Equation", make_text("EqCurve", "|ψ⟩ = α|0⟩ + β|1⟩", 0.85, 'CENTER', 'CENTER'))
    eq_obj.location = (0.0, 0.0, 0.1)
    eq_obj.data.materials.append(mat_white)
    eq_obj.parent = shot3_root
    cols["SUPPORTING_VISUAL"].objects.link(eq_obj)
    
    eq_note = bpy.data.objects.new("Shot3_SubNote", make_text("SubNoteCurve", "A mathematical description combining basis states", 0.38, 'CENTER', 'CENTER'))
    eq_note.location = (0.0, -0.9, 0.1)
    eq_note.data.materials.append(mat_emerald)
    eq_note.parent = shot3_root
    cols["SUPPORTING_VISUAL"].objects.link(eq_note)

    # Flanking decorative state vector arrow indicating general direction
    vec_root = bpy.data.objects.new("QUALUTION_StateVector", None)
    vec_root.location = (-4.4, -0.8, 0.0)
    vec_root.parent = shot3_root
    cols["MAIN_VISUAL"].objects.link(vec_root)
    
    v_base = bpy.data.objects.new("QUALUTION_VectorBase", make_disc("VBaseMesh", 0.12, segs=24))
    v_base.data.materials.append(mat_white)
    v_base.parent = vec_root
    cols["MAIN_VISUAL"].objects.link(v_base)
    
    v_arrow = bpy.data.objects.new("QUALUTION_VectorArrow", make_arrow("VArrowMesh", length=2.0, shaft_w=0.08, head_w=0.32, head_len=0.45))
    v_arrow.data.materials.append(mat_cyan)
    v_arrow.location = (0.0, 0.0, 0.01)
    v_arrow.parent = vec_root
    cols["MAIN_VISUAL"].objects.link(v_arrow)

    # Flanking reference qubit node on right
    q_ref = bpy.data.objects.new("Shot3_QubitRef", None)
    q_ref.location = (4.4, 0.0, 0.0)
    q_ref.parent = shot3_root
    cols["MAIN_VISUAL"].objects.link(q_ref)
    
    q_ref_ring = bpy.data.objects.new("Shot3_QRefRing", make_ring("QRefRingMesh", 0.75, 0.85, segs=36))
    q_ref_ring.data.materials.append(mat_cyan_halo)
    q_ref_ring.parent = q_ref
    cols["MAIN_VISUAL"].objects.link(q_ref_ring)
    
    q_ref_core = bpy.data.objects.new("Shot3_QRefCore", make_disc("QRefCoreMesh", 0.50, segs=36))
    q_ref_core.data.materials.append(mat_cyan)
    q_ref_core.parent = q_ref
    cols["MAIN_VISUAL"].objects.link(q_ref_core)

    # Shot 3 Keyframes:
    shot3_root.scale = (0.0, 0.0, 0.0)
    shot3_root.keyframe_insert(data_path="scale", frame=300)
    shot3_root.scale = (1.0, 1.0, 1.0)
    shot3_root.keyframe_insert(data_path="scale", frame=320)
    
    # State Vector rotates gently to illustrate general state direction
    vec_root.rotation_euler = (0.0, 0.0, 0.0)
    vec_root.keyframe_insert(data_path="rotation_euler", frame=320)
    vec_root.rotation_euler = (0.0, 0.0, math.radians(-50.0))
    vec_root.keyframe_insert(data_path="rotation_euler", frame=440)
    
    # Exit Shot 3 (Frames 450-465)
    shot3_root.scale = (1.0, 1.0, 1.0)
    shot3_root.keyframe_insert(data_path="scale", frame=450)
    shot3_root.scale = (0.0, 0.0, 0.0)
    shot3_root.keyframe_insert(data_path="scale", frame=465)

    # -------------------------------------------------------------
    # SHOT 4: WHY IT MATTERS — CIRCUIT PREVIEW (Frames 466 - 630)
    # Preview: q[0] ─── H ─── M
    # High-level preview of quantum state manipulation
    # -------------------------------------------------------------
    shot4_root = bpy.data.objects.new("Shot4_CircuitPreview_Group", None)
    shot4_root.location = (0.0, 0.2, 0.0)
    cols["DIAGRAM"].objects.link(shot4_root)
    
    s4_title = bpy.data.objects.new("Shot4_Title", make_text("S4_TitleCurve", "CIRCUIT PREVIEW", 0.65, 'CENTER', 'CENTER'))
    s4_title.location = (0.0, 2.2, 0.1)
    s4_title.data.materials.append(mat_cyan)
    s4_title.parent = shot4_root
    cols["DIAGRAM"].objects.link(s4_title)
    
    s4_sub = bpy.data.objects.new("Shot4_SubTitle", make_text("S4_SubCurve", "Transforming and Measuring Quantum States", 0.38, 'CENTER', 'CENTER'))
    s4_sub.location = (0.0, 1.6, 0.1)
    s4_sub.data.materials.append(mat_white)
    s4_sub.parent = shot4_root
    cols["DIAGRAM"].objects.link(s4_sub)
    
    # Quantum Wire (q[0] ─── H ─── M)
    wire_root = bpy.data.objects.new("QUALUTION_QuantumWire", None)
    wire_root.location = (-5.5, 0.0, 0.0)
    wire_root.parent = shot4_root
    cols["DIAGRAM"].objects.link(wire_root)
    
    wire_line = bpy.data.objects.new("Wire_Line", make_rect("WireMesh", 11.0, 0.05, origin_center=False))
    wire_line.data.materials.append(mat_wire)
    wire_line.parent = wire_root
    cols["DIAGRAM"].objects.link(wire_line)
    
    wire_lbl = bpy.data.objects.new("Wire_Label", make_text("WireLblCurve", "q[0]", 0.42, 'RIGHT', 'CENTER'))
    wire_lbl.location = (-0.2, 0.0, 0.01)
    wire_lbl.data.materials.append(mat_white)
    wire_lbl.parent = wire_root
    cols["DIAGRAM"].objects.link(wire_lbl)
    
    # Hadamard Gate [ H ]
    gate_h = bpy.data.objects.new("QUALUTION_Gate_H", None)
    gate_h.location = (-1.2, 0.0, 0.0)
    gate_h.parent = shot4_root
    cols["DIAGRAM"].objects.link(gate_h)
    
    gh_box = bpy.data.objects.new("GateH_Box", make_rect("GHBoxMesh", 1.6, 1.6))
    gh_box.data.materials.append(mat_dark_card)
    gh_box.parent = gate_h
    cols["DIAGRAM"].objects.link(gh_box)
    
    gh_border = bpy.data.objects.new("GateH_Border", make_rect("GHBorderMesh", 1.68, 1.68))
    gh_border.data.materials.append(mat_violet)
    gh_border.location = (0.0, 0.0, -0.01)
    gh_border.parent = gate_h
    cols["DIAGRAM"].objects.link(gh_border)
    
    gh_text = bpy.data.objects.new("GateH_Text", make_text("GHTextCurve", "H", 0.90, 'CENTER', 'CENTER'))
    gh_text.location = (0.0, -0.08, 0.02)
    gh_text.data.materials.append(mat_violet)
    gh_text.parent = gate_h
    cols["DIAGRAM"].objects.link(gh_text)
    
    # Measurement Unit [ M ]
    meas_root = bpy.data.objects.new("QUALUTION_Measurement", None)
    meas_root.location = (2.2, 0.0, 0.0)
    meas_root.parent = shot4_root
    cols["DIAGRAM"].objects.link(meas_root)
    
    m_box = bpy.data.objects.new("Meas_Box", make_rect("MBoxMesh", 1.6, 1.6))
    m_box.data.materials.append(mat_dark_card)
    m_box.parent = meas_root
    cols["DIAGRAM"].objects.link(m_box)
    
    m_border = bpy.data.objects.new("Meas_Border", make_rect("MBorderMesh", 1.68, 1.68))
    m_border.data.materials.append(mat_amber)
    m_border.location = (0.0, 0.0, -0.01)
    m_border.parent = meas_root
    cols["DIAGRAM"].objects.link(m_border)
    
    m_arc = bpy.data.objects.new("Meas_Arc", make_arc("MArcMesh", radius=0.55, width=0.04, start_deg=-60, end_deg=60, segments=24))
    m_arc.data.materials.append(mat_white)
    m_arc.location = (0.0, -0.22, 0.02)
    m_arc.parent = meas_root
    cols["DIAGRAM"].objects.link(m_arc)
    
    m_needle = bpy.data.objects.new("Meas_Needle", make_arrow("MNeedleMesh", length=0.65, shaft_w=0.04, head_w=0.14, head_len=0.16))
    m_needle.data.materials.append(mat_amber)
    m_needle.location = (0.0, -0.22, 0.03)
    m_needle.rotation_euler = (0.0, 0.0, math.radians(-25.0))
    m_needle.parent = meas_root
    cols["DIAGRAM"].objects.link(m_needle)

    # Annotation Callout Pointer
    annot_arrow = bpy.data.objects.new("QUALUTION_AnnotationArrow", None)
    annot_arrow.location = (-1.2, -1.8, 0.0)
    annot_arrow.parent = shot4_root
    cols["ANNOTATIONS"].objects.link(annot_arrow)
    
    arrow_obj = bpy.data.objects.new("ArrowGraphic", make_arrow("AnnotArrowMesh", length=1.0, shaft_w=0.08, head_w=0.28, head_len=0.32))
    arrow_obj.data.materials.append(mat_yellow)
    arrow_obj.parent = annot_arrow
    cols["ANNOTATIONS"].objects.link(arrow_obj)
    
    annot_lbl = bpy.data.objects.new("Annot_Label", make_text("AnnotLblCurve", "Quantum Gate Transformation Preview", 0.34, 'CENTER', 'TOP'))
    annot_lbl.location = (0.0, -0.15, 0.01)
    annot_lbl.data.materials.append(mat_yellow)
    annot_lbl.parent = annot_arrow
    cols["ANNOTATIONS"].objects.link(annot_lbl)

    # Shot 4 Keyframes:
    shot4_root.scale = (0.0, 0.0, 0.0)
    shot4_root.keyframe_insert(data_path="scale", frame=465)
    shot4_root.scale = (1.0, 1.0, 1.0)
    shot4_root.keyframe_insert(data_path="scale", frame=485)
    
    # Gate H pulse highlight
    gate_h.scale = (1.0, 1.0, 1.0)
    gate_h.keyframe_insert(data_path="scale", frame=485)
    gate_h.scale = (1.12, 1.12, 1.0)
    gate_h.keyframe_insert(data_path="scale", frame=530)
    gate_h.scale = (1.0, 1.0, 1.0)
    gate_h.keyframe_insert(data_path="scale", frame=560)
    
    # Measurement needle animated twitch (dynamic readout preview)
    m_needle.rotation_euler = (0.0, 0.0, math.radians(-25.0))
    m_needle.keyframe_insert(data_path="rotation_euler", frame=530)
    m_needle.rotation_euler = (0.0, 0.0, math.radians(25.0))
    m_needle.keyframe_insert(data_path="rotation_euler", frame=570)
    m_needle.rotation_euler = (0.0, 0.0, math.radians(-10.0))
    m_needle.keyframe_insert(data_path="rotation_euler", frame=600)

    # Exit Shot 4 (Frames 615-630)
    shot4_root.scale = (1.0, 1.0, 1.0)
    shot4_root.keyframe_insert(data_path="scale", frame=615)
    shot4_root.scale = (0.0, 0.0, 0.0)
    shot4_root.keyframe_insert(data_path="scale", frame=630)

    # -------------------------------------------------------------
    # SHOT 5: TRANSITION TO NEXT THEORETICAL LESSON (Frames 631 - 750)
    # "Quantum computing manipulates quantum states."
    # -------------------------------------------------------------
    shot5_root = bpy.data.objects.new("Shot5_Transition_Group", None)
    shot5_root.location = (0.0, 0.3, 0.0)
    cols["MAIN_VISUAL"].objects.link(shot5_root)
    
    s5_statement = bpy.data.objects.new("Shot5_Statement", make_text("S5_StmtCurve", "Quantum computing manipulates quantum states.", 0.60, 'CENTER', 'CENTER'))
    s5_statement.location = (0.0, 1.2, 0.1)
    s5_statement.data.materials.append(mat_white)
    s5_statement.parent = shot5_root
    cols["MAIN_VISUAL"].objects.link(s5_statement)
    
    s5_next = bpy.data.objects.new("Shot5_NextLesson", make_text("S5_NextCurve", "Next: Qubits & Quantum States (Lesson 2)", 0.44, 'CENTER', 'CENTER'))
    s5_next.location = (0.0, 0.2, 0.1)
    s5_next.data.materials.append(mat_cyan)
    s5_next.parent = shot5_root
    cols["MAIN_VISUAL"].objects.link(s5_next)

    # Decorative Quantum Node at Center
    s5_node = bpy.data.objects.new("Shot5_Node", make_ring("S5NodeMesh", 0.4, 0.48, segs=36))
    s5_node.location = (0.0, -1.0, 0.05)
    s5_node.data.materials.append(mat_cyan_halo)
    s5_node.parent = shot5_root
    cols["MAIN_VISUAL"].objects.link(s5_node)

    # Shot 5 Keyframes:
    shot5_root.scale = (0.0, 0.0, 0.0)
    shot5_root.keyframe_insert(data_path="scale", frame=630)
    shot5_root.scale = (1.0, 1.0, 1.0)
    shot5_root.keyframe_insert(data_path="scale", frame=650)

    # -------------------------------------------------------------
    # TRANSITIONS (Fade Overlay)
    # -------------------------------------------------------------
    mesh_trans = make_rect("TransitionMesh", 22.0, 14.0)
    mat_trans = bpy.data.materials.new(name="QUALUTION_Mat_Fade")
    mat_trans.use_nodes = True
    t_nodes = mat_trans.node_tree.nodes
    t_nodes.clear()
    t_bsdf = t_nodes.new(type='ShaderNodeBsdfPrincipled')
    t_bsdf.inputs['Base Color'].default_value = (0.0, 0.0, 0.0, 1.0)
    t_bsdf.inputs['Alpha'].default_value = 0.0
    t_out = t_nodes.new(type='ShaderNodeOutputMaterial')
    mat_trans.node_tree.links.new(t_bsdf.outputs['BSDF'], t_out.inputs['Surface'])
    
    trans_plate = bpy.data.objects.new("QUALUTION_TransitionPlate", mesh_trans)
    trans_plate.location = (0.0, 0.0, 5.0)
    trans_plate.data.materials.append(mat_trans)
    cols["TRANSITIONS"].objects.link(trans_plate)

    # Fade in at start (Fr 1-15) and fade out at end (Fr 730-750)
    t_bsdf.inputs['Alpha'].default_value = 1.0
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=1)
    t_bsdf.inputs['Alpha'].default_value = 0.0
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=15)
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=725)
    t_bsdf.inputs['Alpha'].default_value = 1.0
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=750)

    # Save Scene File
    script_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd()
    scenes_dir = os.path.abspath(os.path.join(script_dir, "qualution-video", "blender", "scenes"))
    os.makedirs(scenes_dir, exist_ok=True)
    
    out_blend = os.path.join(scenes_dir, "lesson01_scene01_bits_to_qubits.blend")
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"SUCCESS: Saved curriculum-aligned animated scene to: {out_blend}")

if __name__ == "__main__":
    setup_scene()
