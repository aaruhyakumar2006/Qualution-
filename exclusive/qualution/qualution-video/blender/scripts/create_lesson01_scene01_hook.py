"""
QUALUTION Lesson 1 Scene 1 Generator: The Hook
File: qualution-video/blender/scenes/lesson01_scene01_hook.blend
Duration: 18.0 seconds (Frames 1–540 @ 30 FPS)
Resolution: 1920x1080 (16:9)

Story Flow:
- 0:00–0:04 (Fr 1–120): "CLASSICAL COMPUTING" + Structured binary data matrix
- 0:04–0:08 (Fr 121–240): "THE CLASSICAL BIT" + "0 OR 1" State toggling
- 0:08–0:12 (Fr 241–360): The Visual Hook: "WHAT IF WE COMPUTED DIFFERENTLY?" + Transformation
- 0:12–0:18 (Fr 361–540): "QUANTUM COMPUTING" + QUALUTION_Qubit introduction + Clean transition
"""

import bpy
import os
import math

def build_scene():
    # 1. Reset to empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    scene = bpy.context.scene
    scene.name = "Lesson01_Scene01_TheHook"
    
    # 2. Render Settings (1920x1080, 30 FPS, Frames 1-540)
    render = scene.render
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.resolution_percentage = 100
    render.fps = 30
    render.fps_base = 1.0
    
    scene.frame_start = 1
    scene.frame_end = 540
    scene.frame_current = 1
    
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
    
    # 4. Materials Setup (Clean Flat Vector Palette)
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
    mat_card_dark = create_mat("QUALUTION_Mat_CardDark", (0.118, 0.161, 0.231, 1.0)) # #1E293B
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

    # -------------------------------------------------------------
    # CAPTIONS SYSTEM (Collection CAPTIONS)
    # 4 Narration Subtitles Synchronized with Voiceover
    # -------------------------------------------------------------
    def create_caption(name, text_body, start_f, end_f):
        c_curve = make_text(f"{name}_Curve", text_body, 0.38, 'CENTER', 'CENTER')
        obj = bpy.data.objects.new(name, c_curve)
        obj.location = (0.0, -3.5, 0.1)
        obj.data.materials.append(mat_caption)
        cols["CAPTIONS"].objects.link(obj)
        
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=max(1, start_f - 6))
        
        obj.scale = (1.0, 1.0, 1.0)
        obj.keyframe_insert(data_path="scale", frame=start_f + 4)
        obj.keyframe_insert(data_path="scale", frame=end_f - 4)
        
        obj.scale = (0.0, 0.0, 0.0)
        obj.keyframe_insert(data_path="scale", frame=end_f + 6)
        return obj

    cap1 = create_caption("Caption_01", "Classical computers have transformed our world, powering modern technology.", 1, 115)
    cap2 = create_caption("Caption_02", "They process information using classical bits that are strictly 0 or 1.", 120, 235)
    cap3 = create_caption("Caption_03", "But what happens when we design computers that operate by the rules of quantum mechanics?", 240, 355)
    cap4 = create_caption("Caption_04", "Quantum computing manipulates quantum states to explore entirely new possibilities.", 360, 535)

    # -------------------------------------------------------------
    # ACT 1: CLASSICAL COMPUTING & BINARY MATRIX (Frames 1 - 120)
    # 0:00 - 0:04
    # -------------------------------------------------------------
    act1_group = bpy.data.objects.new("Act1_ClassicalComputing_Group", None)
    act1_group.location = (0.0, 0.2, 0.0)
    cols["MAIN_VISUAL"].objects.link(act1_group)
    
    act1_title = bpy.data.objects.new("Act1_Title", make_text("A1_TitleCurve", "CLASSICAL COMPUTING", 0.75, 'CENTER', 'CENTER'))
    act1_title.location = (0.0, 1.8, 0.1)
    act1_title.data.materials.append(mat_cyan)
    act1_title.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(act1_title)
    
    # Binary Grid Array (clean infographic cards: 0 1 1 0 1 0 0 1)
    bits_pattern = ["0", "1", "1", "0", "1", "0", "0", "1"]
    bit_objs = []
    spacing = 1.3
    start_x = - (len(bits_pattern) - 1) * spacing / 2.0
    
    for idx, b_val in enumerate(bits_pattern):
        bx = start_x + idx * spacing
        b_box = bpy.data.objects.new(f"Act1_BitBox_{idx}", make_rect(f"BBoxMesh_{idx}", 1.1, 1.3))
        b_box.location = (bx, -0.2, 0.0)
        b_box.data.materials.append(mat_card_dark)
        b_box.parent = act1_group
        cols["MAIN_VISUAL"].objects.link(b_box)
        
        b_txt = bpy.data.objects.new(f"Act1_BitTxt_{idx}", make_text(f"BTxtCurve_{idx}", b_val, 0.65, 'CENTER', 'CENTER'))
        b_txt.location = (bx, -0.25, 0.02)
        b_txt.data.materials.append(mat_emerald if b_val == "0" else mat_amber)
        b_txt.parent = act1_group
        cols["MAIN_VISUAL"].objects.link(b_txt)
        bit_objs.append((b_box, b_txt))

    # Binary data circuit bus line beneath
    bus_line = bpy.data.objects.new("Act1_BusLine", make_rect("BusMesh", 10.5, 0.04))
    bus_line.location = (0.0, -1.2, 0.0)
    bus_line.data.materials.append(mat_wire)
    bus_line.parent = act1_group
    cols["MAIN_VISUAL"].objects.link(bus_line)

    # Act 1 Keyframes
    act1_group.scale = (0.0, 0.0, 0.0)
    act1_group.keyframe_insert(data_path="scale", frame=1)
    act1_group.scale = (1.0, 1.0, 1.0)
    act1_group.keyframe_insert(data_path="scale", frame=25)
    
    # Subtle wave pulse across binary bits
    for idx, (box_o, txt_o) in enumerate(bit_objs):
        f_pulse = 25 + idx * 8
        box_o.scale = (1.0, 1.0, 1.0)
        box_o.keyframe_insert(data_path="scale", frame=f_pulse - 4)
        box_o.scale = (1.15, 1.15, 1.0)
        box_o.keyframe_insert(data_path="scale", frame=f_pulse)
        box_o.scale = (1.0, 1.0, 1.0)
        box_o.keyframe_insert(data_path="scale", frame=f_pulse + 4)
        
    act1_group.scale = (1.0, 1.0, 1.0)
    act1_group.keyframe_insert(data_path="scale", frame=110)
    act1_group.scale = (0.0, 0.0, 0.0)
    act1_group.keyframe_insert(data_path="scale", frame=120)

    # -------------------------------------------------------------
    # ACT 2: THE CLASSICAL BIT — 0 OR 1 (Frames 121 - 240)
    # 0:04 - 0:08
    # -------------------------------------------------------------
    act2_group = bpy.data.objects.new("Act2_ClassicalBit_Group", None)
    act2_group.location = (0.0, 0.2, 0.0)
    cols["MAIN_VISUAL"].objects.link(act2_group)
    
    act2_title = bpy.data.objects.new("Act2_Title", make_text("A2_TitleCurve", "THE CLASSICAL BIT", 0.65, 'CENTER', 'CENTER'))
    act2_title.location = (0.0, 2.2, 0.1)
    act2_title.data.materials.append(mat_cyan)
    act2_title.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(act2_title)
    
    act2_sub = bpy.data.objects.new("Act2_SubTitle", make_text("A2_SubCurve", "0 OR 1", 0.85, 'CENTER', 'CENTER'))
    act2_sub.location = (0.0, 1.4, 0.1)
    act2_sub.data.materials.append(mat_white)
    act2_sub.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(act2_sub)
    
    # State Pill 0
    box_0 = bpy.data.objects.new("Act2_Box0", make_rect("A2Box0Mesh", 2.2, 2.2))
    box_0.location = (-2.2, -0.3, 0.0)
    box_0.data.materials.append(mat_card_dark)
    box_0.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(box_0)
    
    border_0 = bpy.data.objects.new("Act2_Border0", make_ring("A2Border0Mesh", 1.05, 1.15, segs=32))
    border_0.location = (-2.2, -0.3, 0.01)
    border_0.data.materials.append(mat_emerald)
    border_0.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(border_0)
    
    txt_0 = bpy.data.objects.new("Act2_Txt0", make_text("A2Txt0Curve", "0", 1.2, 'CENTER', 'CENTER'))
    txt_0.location = (-2.2, -0.4, 0.02)
    txt_0.data.materials.append(mat_emerald)
    txt_0.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(txt_0)

    # State Pill 1
    box_1 = bpy.data.objects.new("Act2_Box1", make_rect("A2Box1Mesh", 2.2, 2.2))
    box_1.location = (2.2, -0.3, 0.0)
    box_1.data.materials.append(mat_card_dark)
    box_1.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(box_1)
    
    border_1 = bpy.data.objects.new("Act2_Border1", make_ring("A2Border1Mesh", 1.05, 1.15, segs=32))
    border_1.location = (2.2, -0.3, 0.01)
    border_1.data.materials.append(mat_amber)
    border_1.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(border_1)
    
    txt_1 = bpy.data.objects.new("Act2_Txt1", make_text("A2Txt1Curve", "1", 1.2, 'CENTER', 'CENTER'))
    txt_1.location = (2.2, -0.4, 0.02)
    txt_1.data.materials.append(mat_amber)
    txt_1.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(txt_1)

    # Selector Arrow Indicator
    ptr_mesh = make_arrow("A2PtrMesh", length=1.2, shaft_w=0.08, head_w=0.30, head_len=0.35)
    ptr_obj = bpy.data.objects.new("Act2_SelectorArrow", ptr_mesh)
    ptr_obj.location = (-2.2, -2.1, 0.05)
    ptr_obj.data.materials.append(mat_yellow)
    ptr_obj.parent = act2_group
    cols["MAIN_VISUAL"].objects.link(ptr_obj)

    # Act 2 Keyframes
    act2_group.scale = (0.0, 0.0, 0.0)
    act2_group.keyframe_insert(data_path="scale", frame=120)
    act2_group.scale = (1.0, 1.0, 1.0)
    act2_group.keyframe_insert(data_path="scale", frame=140)
    
    # Arrow flips between 0 and 1
    ptr_obj.location = (-2.2, -2.1, 0.05)
    ptr_obj.keyframe_insert(data_path="location", frame=140)
    ptr_obj.keyframe_insert(data_path="location", frame=175)
    ptr_obj.location = (2.2, -2.1, 0.05)
    ptr_obj.keyframe_insert(data_path="location", frame=195)
    ptr_obj.keyframe_insert(data_path="location", frame=230)
    
    # Exit Act 2 (Frames 230-240)
    act2_group.scale = (1.0, 1.0, 1.0)
    act2_group.keyframe_insert(data_path="scale", frame=230)
    act2_group.scale = (0.0, 0.0, 0.0)
    act2_group.keyframe_insert(data_path="scale", frame=240)

    # -------------------------------------------------------------
    # ACT 3: THE VISUAL HOOK & QUESTION (Frames 241 - 360)
    # 0:08 - 0:12
    # "WHAT IF WE COMPUTED DIFFERENTLY?"
    # -------------------------------------------------------------
    act3_group = bpy.data.objects.new("Act3_HookQuestion_Group", None)
    act3_group.location = (0.0, 0.2, 0.0)
    cols["MAIN_VISUAL"].objects.link(act3_group)
    
    hook_q1 = bpy.data.objects.new("Act3_QuestionLine1", make_text("A3_Q1Curve", "WHAT IF WE COMPUTED", 0.72, 'CENTER', 'CENTER'))
    hook_q1.location = (0.0, 1.4, 0.1)
    hook_q1.data.materials.append(mat_white)
    hook_q1.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(hook_q1)
    
    hook_q2 = bpy.data.objects.new("Act3_QuestionLine2", make_text("A3_Q2Curve", "DIFFERENTLY?", 0.92, 'CENTER', 'CENTER'))
    hook_q2.location = (0.0, 0.4, 0.1)
    hook_q2.data.materials.append(mat_cyan)
    hook_q2.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(hook_q2)
    
    # Converging Energy Ring / Quantum Transition Nexus
    nexus_ring1 = bpy.data.objects.new("Act3_NexusRing1", make_ring("NexusRing1Mesh", 1.4, 1.48, segs=48))
    nexus_ring1.location = (0.0, -1.0, 0.0)
    nexus_ring1.data.materials.append(mat_cyan_halo)
    nexus_ring1.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(nexus_ring1)
    
    nexus_ring2 = bpy.data.objects.new("Act3_NexusRing2", make_ring("NexusRing2Mesh", 0.85, 0.92, segs=36))
    nexus_ring2.location = (0.0, -1.0, 0.01)
    nexus_ring2.data.materials.append(mat_violet)
    nexus_ring2.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(nexus_ring2)
    
    nexus_core = bpy.data.objects.new("Act3_NexusCore", make_disc("NexusCoreMesh", 0.35, segs=24))
    nexus_core.location = (0.0, -1.0, 0.02)
    nexus_core.data.materials.append(mat_white)
    nexus_core.parent = act3_group
    cols["MAIN_VISUAL"].objects.link(nexus_core)

    # Act 3 Keyframes
    act3_group.scale = (0.0, 0.0, 0.0)
    act3_group.keyframe_insert(data_path="scale", frame=240)
    act3_group.scale = (1.0, 1.0, 1.0)
    act3_group.keyframe_insert(data_path="scale", frame=260)
    
    # Pulse nexus rings smoothly
    nexus_ring1.scale = (1.0, 1.0, 1.0)
    nexus_ring1.keyframe_insert(data_path="scale", frame=260)
    nexus_ring1.scale = (1.25, 1.25, 1.0)
    nexus_ring1.keyframe_insert(data_path="scale", frame=310)
    nexus_ring1.scale = (1.0, 1.0, 1.0)
    nexus_ring1.keyframe_insert(data_path="scale", frame=350)
    
    # Exit Act 3 (Frames 350-360)
    act3_group.scale = (1.0, 1.0, 1.0)
    act3_group.keyframe_insert(data_path="scale", frame=350)
    act3_group.scale = (0.0, 0.0, 0.0)
    act3_group.keyframe_insert(data_path="scale", frame=360)

    # -------------------------------------------------------------
    # ACT 4: QUANTUM COMPUTING & THE QUBIT (Frames 361 - 540)
    # 0:12 - 0:18
    # "QUANTUM COMPUTING"
    # "Computing with the rules of quantum mechanics."
    # -------------------------------------------------------------
    act4_group = bpy.data.objects.new("Act4_QuantumComputing_Group", None)
    act4_group.location = (0.0, 0.2, 0.0)
    cols["MAIN_VISUAL"].objects.link(act4_group)
    
    act4_title = bpy.data.objects.new("Act4_Title", make_text("A4_TitleCurve", "QUANTUM COMPUTING", 0.78, 'CENTER', 'CENTER'))
    act4_title.location = (0.0, 2.2, 0.1)
    act4_title.data.materials.append(mat_cyan)
    act4_title.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(act4_title)
    
    act4_sub = bpy.data.objects.new("Act4_SubTitle", make_text("A4_SubCurve", "Computing with the rules of quantum mechanics.", 0.40, 'CENTER', 'CENTER'))
    act4_sub.location = (0.0, 1.5, 0.1)
    act4_sub.data.materials.append(mat_white)
    act4_sub.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(act4_sub)
    
    # Reusable QUALUTION_Qubit Asset Representation
    qubit_root = bpy.data.objects.new("QUALUTION_Qubit", None)
    qubit_root.location = (0.0, -0.2, 0.0)
    qubit_root.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(qubit_root)
    
    q_ring = bpy.data.objects.new("QUALUTION_Qubit_Ring", make_ring("QRingMesh", 1.05, 1.18, segs=48))
    q_ring.data.materials.append(mat_cyan_halo)
    q_ring.parent = qubit_root
    cols["MAIN_VISUAL"].objects.link(q_ring)
    
    q_core = bpy.data.objects.new("QUALUTION_Qubit_Core", make_disc("QCoreMesh", 0.72, segs=48))
    q_core.data.materials.append(mat_cyan)
    q_core.parent = qubit_root
    cols["MAIN_VISUAL"].objects.link(q_core)
    
    q_dot = bpy.data.objects.new("QUALUTION_Qubit_Dot", make_disc("QDotMesh", 0.24, segs=24))
    q_dot.data.materials.append(mat_white)
    q_dot.location = (0.0, 0.0, 0.01)
    q_dot.parent = qubit_root
    cols["MAIN_VISUAL"].objects.link(q_dot)
    
    orbit_pivot = bpy.data.objects.new("QUALUTION_Qubit_OrbitPivot", None)
    orbit_pivot.location = (0.0, 0.0, 0.0)
    orbit_pivot.parent = qubit_root
    cols["MAIN_VISUAL"].objects.link(orbit_pivot)
    
    orbit_node = bpy.data.objects.new("QUALUTION_Qubit_OrbitNode", make_disc("OrbitNodeMesh", 0.16, segs=24))
    orbit_node.location = (1.12, 0.0, 0.02)
    orbit_node.data.materials.append(mat_yellow)
    orbit_node.parent = orbit_pivot
    cols["MAIN_VISUAL"].objects.link(orbit_node)
    
    # Flanking Subtle State Badges: |0⟩ and |1⟩
    ket0_group = bpy.data.objects.new("QUALUTION_Ket0", None)
    ket0_group.location = (-3.8, -0.2, 0.0)
    ket0_group.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(ket0_group)
    
    k0_b = bpy.data.objects.new("K0_Badge", make_rect("K0BMesh", 1.6, 1.6))
    k0_b.data.materials.append(mat_card_dark)
    k0_b.parent = ket0_group
    cols["MAIN_VISUAL"].objects.link(k0_b)
    
    k0_brd = bpy.data.objects.new("K0_Border", make_ring("K0BrdMesh", 0.75, 0.82, segs=36))
    k0_brd.data.materials.append(mat_emerald)
    k0_brd.location = (0.0, 0.0, 0.01)
    k0_brd.parent = ket0_group
    cols["MAIN_VISUAL"].objects.link(k0_brd)
    
    k0_txt = bpy.data.objects.new("K0_Txt", make_text("K0TCurve", "|0⟩", 0.75, 'CENTER', 'CENTER'))
    k0_txt.location = (0.0, -0.05, 0.02)
    k0_txt.data.materials.append(mat_emerald)
    k0_txt.parent = ket0_group
    cols["MAIN_VISUAL"].objects.link(k0_txt)

    ket1_group = bpy.data.objects.new("QUALUTION_Ket1", None)
    ket1_group.location = (3.8, -0.2, 0.0)
    ket1_group.parent = act4_group
    cols["MAIN_VISUAL"].objects.link(ket1_group)
    
    k1_b = bpy.data.objects.new("K1_Badge", make_rect("K1BMesh", 1.6, 1.6))
    k1_b.data.materials.append(mat_card_dark)
    k1_b.parent = ket1_group
    cols["MAIN_VISUAL"].objects.link(k1_b)
    
    k1_brd = bpy.data.objects.new("K1_Border", make_ring("K1BrdMesh", 0.75, 0.82, segs=36))
    k1_brd.data.materials.append(mat_amber)
    k1_brd.location = (0.0, 0.0, 0.01)
    k1_brd.parent = ket1_group
    cols["MAIN_VISUAL"].objects.link(k1_brd)
    
    k1_txt = bpy.data.objects.new("K1_Txt", make_text("K1TCurve", "|1⟩", 0.75, 'CENTER', 'CENTER'))
    k1_txt.location = (0.0, -0.05, 0.02)
    k1_txt.data.materials.append(mat_amber)
    k1_txt.parent = ket1_group
    cols["MAIN_VISUAL"].objects.link(k1_txt)

    # Act 4 Keyframes
    act4_group.scale = (0.0, 0.0, 0.0)
    act4_group.keyframe_insert(data_path="scale", frame=360)
    act4_group.scale = (1.0, 1.0, 1.0)
    act4_group.keyframe_insert(data_path="scale", frame=385)
    
    # Orbital rotation
    orbit_pivot.rotation_euler = (0.0, 0.0, 0.0)
    orbit_pivot.keyframe_insert(data_path="rotation_euler", frame=360)
    orbit_pivot.rotation_euler = (0.0, 0.0, math.radians(540.0))
    orbit_pivot.keyframe_insert(data_path="rotation_euler", frame=540)
    
    # Subtle halo expansion
    q_ring.scale = (1.0, 1.0, 1.0)
    q_ring.keyframe_insert(data_path="scale", frame=385)
    q_ring.scale = (1.12, 1.12, 1.0)
    q_ring.keyframe_insert(data_path="scale", frame=460)
    q_ring.scale = (1.0, 1.0, 1.0)
    q_ring.keyframe_insert(data_path="scale", frame=520)

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

    # Fade in at start (Fr 1-15) and fade out at end (Fr 515-540)
    t_bsdf.inputs['Alpha'].default_value = 1.0
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=1)
    t_bsdf.inputs['Alpha'].default_value = 0.0
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=15)
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=510)
    t_bsdf.inputs['Alpha'].default_value = 1.0
    t_bsdf.inputs['Alpha'].keyframe_insert(data_path="default_value", frame=540)

    # Save to scenes directory
    script_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd()
    scenes_dir = os.path.abspath(os.path.join(script_dir, "qualution-video", "blender", "scenes"))
    os.makedirs(scenes_dir, exist_ok=True)
    
    out_blend = os.path.join(scenes_dir, "lesson01_scene01_hook.blend")
    bpy.ops.wm.save_as_mainfile(filepath=out_blend)
    print(f"SUCCESS: Saved polished Scene 1 (The Hook) to: {out_blend}")

if __name__ == "__main__":
    build_scene()
