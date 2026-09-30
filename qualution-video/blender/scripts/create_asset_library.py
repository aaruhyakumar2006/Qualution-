"""
QUALUTION Asset Library Generator
Generates:
- qualution-video/blender/templates/QUALUTION_ASSET_LIBRARY.blend
- qualution-video/blender/scenes/QUALUTION_ASSETS.blend
Contains the 11 reusable 2D quantum educational visual assets.
"""

import bpy
import os
import math

def create_flat_material(name, rgba):
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

def create_rect_mesh(name, width, height, origin_at_center=True):
    mesh = bpy.data.meshes.new(name)
    if origin_at_center:
        hw, hh = width / 2.0, height / 2.0
        verts = [(-hw, -hh, 0.0), (hw, -hh, 0.0), (hw, hh, 0.0), (-hw, hh, 0.0)]
    else: # Origin at left center
        hh = height / 2.0
        verts = [(0.0, -hh, 0.0), (width, -hh, 0.0), (width, hh, 0.0), (0.0, hh, 0.0)]
    faces = [(0, 1, 2, 3)]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh

def create_ring_mesh(name, inner_r, outer_r, segments=36):
    mesh = bpy.data.meshes.new(name)
    verts = []
    faces = []
    for i in range(segments):
        angle = 2.0 * math.pi * (i / segments)
        cos_a = math.cos(angle)
        sin_a = math.sin(angle)
        verts.append((inner_r * cos_a, inner_r * sin_a, 0.0))
        verts.append((outer_r * cos_a, outer_r * sin_a, 0.0))
    for i in range(segments):
        next_i = (i + 1) % segments
        v0 = i * 2
        v1 = i * 2 + 1
        v2 = next_i * 2 + 1
        v3 = next_i * 2
        faces.append((v0, v1, v2, v3))
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh

def create_circle_disc_mesh(name, radius, segments=36):
    mesh = bpy.data.meshes.new(name)
    verts = [(0.0, 0.0, 0.0)]
    faces = []
    for i in range(segments):
        angle = 2.0 * math.pi * (i / segments)
        verts.append((radius * math.cos(angle), radius * math.sin(angle), 0.0))
    for i in range(segments):
        v1 = 1 + i
        v2 = 1 + ((i + 1) % segments)
        faces.append((0, v1, v2))
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh

def create_arrow_mesh(name, total_length=2.0, shaft_width=0.08, head_width=0.36, head_length=0.5):
    mesh = bpy.data.meshes.new(name)
    shaft_len = total_length - head_length
    hw_s = shaft_width / 2.0
    hw_h = head_width / 2.0
    
    verts = [
        (-hw_s, 0.0, 0.0),          # 0: bottom left
        (hw_s, 0.0, 0.0),           # 1: bottom right
        (hw_s, shaft_len, 0.0),     # 2: shaft top right
        (-hw_s, shaft_len, 0.0),    # 3: shaft top left
        (-hw_h, shaft_len, 0.0),    # 4: head bottom left
        (hw_h, shaft_len, 0.0),     # 5: head bottom right
        (0.0, total_length, 0.0)    # 6: head tip
    ]
    faces = [
        (0, 1, 2, 3), # shaft
        (4, 5, 6)     # arrowhead
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh

def create_arc_mesh(name, radius, width=0.04, start_deg=-60, end_deg=60, segments=24):
    mesh = bpy.data.meshes.new(name)
    verts = []
    faces = []
    r_in = radius - width / 2.0
    r_out = radius + width / 2.0
    
    rad_start = math.radians(start_deg)
    rad_end = math.radians(end_deg)
    
    for i in range(segments + 1):
        t = i / float(segments)
        ang = rad_start + t * (rad_end - rad_start)
        # rotated so 0 deg is pointing upwards (+Y)
        x = math.sin(ang)
        y = math.cos(ang)
        verts.append((r_in * x, r_in * y, 0.0))
        verts.append((r_out * x, r_out * y, 0.0))
        
    for i in range(segments):
        v0 = i * 2
        v1 = i * 2 + 1
        v2 = (i + 1) * 2 + 1
        v3 = (i + 1) * 2
        faces.append((v0, v1, v2, v3))
        
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    return mesh

def build_asset_library():
    # 1. Start clean
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    scene = bpy.context.scene
    scene.name = "QUALUTION_Asset_Library"
    
    # 2. Render Settings (1080p, 30fps)
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps = 30
    scene.frame_start = 1
    scene.frame_end = 300
    scene.render.image_settings.file_format = 'PNG'
    
    # Standard view transform for accurate 2D infographic colors
    scene.display_settings.display_device = 'sRGB'
    scene.view_settings.view_transform = 'Standard'
    
    # 3. Materials Palette
    mat_bg = create_flat_material("QUALUTION_Mat_SlateBg", (0.043, 0.059, 0.098, 1.0)) # #0B0F19
    mat_cyan = create_flat_material("QUALUTION_Mat_Cyan", (0.0, 0.85, 0.95, 1.0)) # #00D9F2
    mat_cyan_halo = create_flat_material("QUALUTION_Mat_CyanHalo", (0.22, 0.74, 0.97, 0.6)) # #38BDF8
    mat_white = create_flat_material("QUALUTION_Mat_White", (0.97, 0.98, 1.0, 1.0)) # #F8FAFC
    mat_emerald = create_flat_material("QUALUTION_Mat_Emerald", (0.063, 0.725, 0.506, 1.0)) # #10B981
    mat_amber = create_flat_material("QUALUTION_Mat_Amber", (0.96, 0.62, 0.043, 1.0)) # #F59E0B
    mat_violet = create_flat_material("QUALUTION_Mat_Violet", (0.65, 0.33, 0.98, 1.0)) # #A855F7
    mat_dark_slate = create_flat_material("QUALUTION_Mat_BoxFill", (0.118, 0.161, 0.231, 1.0)) # #1E293B
    mat_wire_gray = create_flat_material("QUALUTION_Mat_WireGray", (0.392, 0.455, 0.545, 1.0)) # #64748B
    mat_accent_yellow = create_flat_material("QUALUTION_Mat_Yellow", (0.98, 0.8, 0.082, 1.0)) # #FACC15
    
    # 4. Master Collection Hierarchy
    master_col = bpy.data.collections.new("QUALUTION_ASSETS")
    scene.collection.children.link(master_col)
    
    def get_or_create_col(name):
        col = bpy.data.collections.new(name)
        master_col.children.link(col)
        return col
    
    col_qubit = get_or_create_col("01_QUBIT")
    col_kets = get_or_create_col("02_KET_STATES")
    col_vectors = get_or_create_col("03_VECTORS")
    col_prob = get_or_create_col("04_PROBABILITY")
    col_circuit = get_or_create_col("05_CIRCUIT_ELEMENTS")
    col_gates = get_or_create_col("06_GATES")
    col_annot = get_or_create_col("07_ANNOTATIONS")
    col_scene = get_or_create_col("00_SCENE_SETUP")
    
    # Setup Camera & Background for library showcase
    cam_data = bpy.data.cameras.new("QUALUTION_Camera")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'HORIZONTAL'
    cam_data.ortho_scale = 16.0
    cam_obj = bpy.data.objects.new("QUALUTION_Camera", cam_data)
    cam_obj.location = (0.0, 0.0, 10.0)
    col_scene.objects.link(cam_obj)
    scene.camera = cam_obj
    
    bg_mesh = create_rect_mesh("QUALUTION_BackgroundMesh", 20.0, 12.0)
    bg_obj = bpy.data.objects.new("QUALUTION_BackgroundPlane", bg_mesh)
    bg_obj.location = (0.0, 0.0, -1.0)
    bg_obj.data.materials.append(mat_bg)
    col_scene.objects.link(bg_obj)
    
    # -------------------------------------------------------------
    # ASSET 1: QUALUTION_Qubit
    # Stylized 2D qubit node with core, outer halo ring, and orbital indicator
    # -------------------------------------------------------------
    qubit_root = bpy.data.objects.new("QUALUTION_Qubit", None)
    qubit_root.empty_display_type = 'PLAIN_AXES'
    qubit_root.empty_display_size = 0.5
    qubit_root.location = (-5.2, 2.0, 0.0)
    col_qubit.objects.link(qubit_root)
    
    # Outer Ring
    mesh_q_ring = create_ring_mesh("QUALUTION_Qubit_RingMesh", 0.72, 0.80)
    obj_q_ring = bpy.data.objects.new("QUALUTION_Qubit_Ring", mesh_q_ring)
    obj_q_ring.data.materials.append(mat_cyan_halo)
    obj_q_ring.parent = qubit_root
    col_qubit.objects.link(obj_q_ring)
    
    # Core Disc
    mesh_q_core = create_circle_disc_mesh("QUALUTION_Qubit_CoreMesh", 0.45)
    obj_q_core = bpy.data.objects.new("QUALUTION_Qubit_Core", mesh_q_core)
    obj_q_core.data.materials.append(mat_cyan)
    obj_q_core.parent = qubit_root
    col_qubit.objects.link(obj_q_core)
    
    # Inner center dot
    mesh_q_dot = create_circle_disc_mesh("QUALUTION_Qubit_DotMesh", 0.15)
    obj_q_dot = bpy.data.objects.new("QUALUTION_Qubit_Dot", mesh_q_dot)
    obj_q_dot.data.materials.append(mat_white)
    obj_q_dot.location = (0.0, 0.0, 0.01)
    obj_q_dot.parent = qubit_root
    col_qubit.objects.link(obj_q_dot)

    # -------------------------------------------------------------
    # ASSET 2: QUALUTION_Ket0
    # Clean visual representation of |0⟩
    # -------------------------------------------------------------
    ket0_root = bpy.data.objects.new("QUALUTION_Ket0", None)
    ket0_root.empty_display_type = 'PLAIN_AXES'
    ket0_root.empty_display_size = 0.4
    ket0_root.location = (-2.8, 2.0, 0.0)
    col_kets.objects.link(ket0_root)
    
    # Badge Pill Background
    mesh_ket0_badge = create_rect_mesh("QUALUTION_Ket0_BadgeMesh", 1.4, 1.4)
    obj_ket0_badge = bpy.data.objects.new("QUALUTION_Ket0_Badge", mesh_ket0_badge)
    obj_ket0_badge.data.materials.append(mat_dark_slate)
    obj_ket0_badge.parent = ket0_root
    col_kets.objects.link(obj_ket0_badge)
    
    # Border
    mesh_ket0_border = create_ring_mesh("QUALUTION_Ket0_BorderMesh", 0.65, 0.70, segments=32)
    obj_ket0_border = bpy.data.objects.new("QUALUTION_Ket0_Border", mesh_ket0_border)
    obj_ket0_border.data.materials.append(mat_emerald)
    obj_ket0_border.location = (0.0, 0.0, 0.01)
    obj_ket0_border.parent = ket0_root
    col_kets.objects.link(obj_ket0_border)
    
    # Text |0⟩
    font_ket0 = bpy.data.curves.new("QUALUTION_Ket0_Curve", type='FONT')
    font_ket0.body = "|0⟩"
    font_ket0.size = 0.65
    font_ket0.align_x = 'CENTER'
    font_ket0.align_y = 'CENTER'
    obj_ket0_text = bpy.data.objects.new("QUALUTION_Ket0_Text", font_ket0)
    obj_ket0_text.location = (0.0, -0.05, 0.02)
    obj_ket0_text.data.materials.append(mat_emerald)
    obj_ket0_text.parent = ket0_root
    col_kets.objects.link(obj_ket0_text)

    # -------------------------------------------------------------
    # ASSET 3: QUALUTION_Ket1
    # Clean visual representation of |1⟩
    # -------------------------------------------------------------
    ket1_root = bpy.data.objects.new("QUALUTION_Ket1", None)
    ket1_root.empty_display_type = 'PLAIN_AXES'
    ket1_root.empty_display_size = 0.4
    ket1_root.location = (-1.0, 2.0, 0.0)
    col_kets.objects.link(ket1_root)
    
    # Badge Pill Background
    mesh_ket1_badge = create_rect_mesh("QUALUTION_Ket1_BadgeMesh", 1.4, 1.4)
    obj_ket1_badge = bpy.data.objects.new("QUALUTION_Ket1_Badge", mesh_ket1_badge)
    obj_ket1_badge.data.materials.append(mat_dark_slate)
    obj_ket1_badge.parent = ket1_root
    col_kets.objects.link(obj_ket1_badge)
    
    # Border
    mesh_ket1_border = create_ring_mesh("QUALUTION_Ket1_BorderMesh", 0.65, 0.70, segments=32)
    obj_ket1_border = bpy.data.objects.new("QUALUTION_Ket1_Border", mesh_ket1_border)
    obj_ket1_border.data.materials.append(mat_amber)
    obj_ket1_border.location = (0.0, 0.0, 0.01)
    obj_ket1_border.parent = ket1_root
    col_kets.objects.link(obj_ket1_border)
    
    # Text |1⟩
    font_ket1 = bpy.data.curves.new("QUALUTION_Ket1_Curve", type='FONT')
    font_ket1.body = "|1⟩"
    font_ket1.size = 0.65
    font_ket1.align_x = 'CENTER'
    font_ket1.align_y = 'CENTER'
    obj_ket1_text = bpy.data.objects.new("QUALUTION_Ket1_Text", font_ket1)
    obj_ket1_text.location = (0.0, -0.05, 0.02)
    obj_ket1_text.data.materials.append(mat_amber)
    obj_ket1_text.parent = ket1_root
    col_kets.objects.link(obj_ket1_text)

    # -------------------------------------------------------------
    # ASSET 4: QUALUTION_StateVector
    # Reusable state vector arrow (origin at tail base for easy rotation)
    # -------------------------------------------------------------
    vec_root = bpy.data.objects.new("QUALUTION_StateVector", None)
    vec_root.empty_display_type = 'SINGLE_ARROW'
    vec_root.empty_display_size = 0.5
    vec_root.location = (1.2, 1.1, 0.0) # Base tail at Y=1.1, arrow points to Y=2.9
    col_vectors.objects.link(vec_root)
    
    # Base Tail Dot
    mesh_vec_base = create_circle_disc_mesh("QUALUTION_StateVector_BaseMesh", 0.10)
    obj_vec_base = bpy.data.objects.new("QUALUTION_StateVector_BaseDot", mesh_vec_base)
    obj_vec_base.data.materials.append(mat_white)
    obj_vec_base.parent = vec_root
    col_vectors.objects.link(obj_vec_base)
    
    # Arrow Body (length = 1.8)
    mesh_vec_arrow = create_arrow_mesh("QUALUTION_StateVector_Mesh", total_length=1.8, shaft_width=0.08, head_width=0.32, head_length=0.45)
    obj_vec_arrow = bpy.data.objects.new("QUALUTION_StateVector_Arrow", mesh_vec_arrow)
    obj_vec_arrow.data.materials.append(mat_cyan)
    obj_vec_arrow.location = (0.0, 0.0, 0.01)
    obj_vec_arrow.parent = vec_root
    col_vectors.objects.link(obj_vec_arrow)

    # -------------------------------------------------------------
    # ASSET 5: QUALUTION_ProbabilityBar
    # Horizontal probability bar visualization (0% - 100%)
    # -------------------------------------------------------------
    prob_root = bpy.data.objects.new("QUALUTION_ProbabilityBar", None)
    prob_root.empty_display_type = 'PLAIN_AXES'
    prob_root.empty_display_size = 0.4
    prob_root.location = (3.4, 2.0, 0.0)
    col_prob.objects.link(prob_root)
    
    # Track (Width = 3.6, Height = 0.4, Origin at left: 0.0 to 3.6)
    mesh_prob_track = create_rect_mesh("QUALUTION_ProbTrackMesh", 3.6, 0.4, origin_at_center=False)
    obj_prob_track = bpy.data.objects.new("QUALUTION_ProbabilityBar_Track", mesh_prob_track)
    obj_prob_track.data.materials.append(mat_dark_slate)
    obj_prob_track.parent = prob_root
    col_prob.objects.link(obj_prob_track)
    
    # Track Border Line
    mesh_prob_border = create_rect_mesh("QUALUTION_ProbBorderMesh", 3.64, 0.44, origin_at_center=False)
    obj_prob_border = bpy.data.objects.new("QUALUTION_ProbabilityBar_Border", mesh_prob_border)
    obj_prob_border.data.materials.append(mat_wire_gray)
    obj_prob_border.location = (-0.02, 0.0, -0.01)
    obj_prob_border.parent = prob_root
    col_prob.objects.link(obj_prob_border)
    
    # Fill Bar (Default 50% = Width 1.8, easy to scale along X!)
    mesh_prob_fill = create_rect_mesh("QUALUTION_ProbFillMesh", 1.8, 0.34, origin_at_center=False)
    obj_prob_fill = bpy.data.objects.new("QUALUTION_ProbabilityBar_Fill", mesh_prob_fill)
    obj_prob_fill.data.materials.append(mat_cyan)
    obj_prob_fill.location = (0.03, 0.0, 0.01)
    obj_prob_fill.parent = prob_root
    col_prob.objects.link(obj_prob_fill)
    
    # Percentage Label
    font_prob = bpy.data.curves.new("QUALUTION_ProbLabel_Curve", type='FONT')
    font_prob.body = "P = 50%"
    font_prob.size = 0.32
    font_prob.align_x = 'LEFT'
    font_prob.align_y = 'BOTTOM'
    obj_prob_label = bpy.data.objects.new("QUALUTION_ProbabilityBar_Label", font_prob)
    obj_prob_label.location = (0.0, 0.35, 0.02)
    obj_prob_label.data.materials.append(mat_white)
    obj_prob_label.parent = prob_root
    col_prob.objects.link(obj_prob_label)

    # -------------------------------------------------------------
    # ASSET 6: QUALUTION_QuantumWire
    # Clean horizontal quantum circuit wire
    # -------------------------------------------------------------
    wire_root = bpy.data.objects.new("QUALUTION_QuantumWire", None)
    wire_root.empty_display_type = 'PLAIN_AXES'
    wire_root.empty_display_size = 0.4
    wire_root.location = (-5.5, -1.8, 0.0)
    col_circuit.objects.link(wire_root)
    
    # Horizontal Wire Line (Width = 4.0, Height = 0.04)
    mesh_wire_line = create_rect_mesh("QUALUTION_QuantumWire_Mesh", 4.0, 0.04, origin_at_center=False)
    obj_wire_line = bpy.data.objects.new("QUALUTION_QuantumWire_Line", mesh_wire_line)
    obj_wire_line.data.materials.append(mat_wire_gray)
    obj_wire_line.parent = wire_root
    col_circuit.objects.link(obj_wire_line)
    
    # Wire Qubit Label "|q⟩" / "q[0]"
    font_wire = bpy.data.curves.new("QUALUTION_WireLabel_Curve", type='FONT')
    font_wire.body = "q[0]"
    font_wire.size = 0.32
    font_wire.align_x = 'RIGHT'
    font_wire.align_y = 'CENTER'
    obj_wire_label = bpy.data.objects.new("QUALUTION_QuantumWire_Label", font_wire)
    obj_wire_label.location = (-0.15, 0.0, 0.01)
    obj_wire_label.data.materials.append(mat_white)
    obj_wire_label.parent = wire_root
    col_circuit.objects.link(obj_wire_label)

    # -------------------------------------------------------------
    # ASSET 7: QUALUTION_Gate_X
    # Flat/vector X gate
    # -------------------------------------------------------------
    gate_x_root = bpy.data.objects.new("QUALUTION_Gate_X", None)
    gate_x_root.empty_display_type = 'PLAIN_AXES'
    gate_x_root.empty_display_size = 0.4
    gate_x_root.location = (-0.8, -1.8, 0.0)
    col_gates.objects.link(gate_x_root)
    
    # Gate Box Fill (1.2 x 1.2)
    mesh_gx_box = create_rect_mesh("QUALUTION_GateX_BoxMesh", 1.2, 1.2)
    obj_gx_box = bpy.data.objects.new("QUALUTION_Gate_X_Box", mesh_gx_box)
    obj_gx_box.data.materials.append(mat_dark_slate)
    obj_gx_box.parent = gate_x_root
    col_gates.objects.link(obj_gx_box)
    
    # Gate Border Outline
    mesh_gx_border = create_rect_mesh("QUALUTION_GateX_BorderMesh", 1.26, 1.26)
    obj_gx_border = bpy.data.objects.new("QUALUTION_Gate_X_Border", mesh_gx_border)
    obj_gx_border.data.materials.append(mat_cyan)
    obj_gx_border.location = (0.0, 0.0, -0.01)
    obj_gx_border.parent = gate_x_root
    col_gates.objects.link(obj_gx_border)
    
    # Gate Letter "X"
    font_gx = bpy.data.curves.new("QUALUTION_GateX_Curve", type='FONT')
    font_gx.body = "X"
    font_gx.size = 0.68
    font_gx.align_x = 'CENTER'
    font_gx.align_y = 'CENTER'
    obj_gx_text = bpy.data.objects.new("QUALUTION_Gate_X_Text", font_gx)
    obj_gx_text.location = (0.0, -0.05, 0.02)
    obj_gx_text.data.materials.append(mat_cyan)
    obj_gx_text.parent = gate_x_root
    col_gates.objects.link(obj_gx_text)

    # -------------------------------------------------------------
    # ASSET 8: QUALUTION_Gate_H
    # Flat/vector Hadamard H gate
    # -------------------------------------------------------------
    gate_h_root = bpy.data.objects.new("QUALUTION_Gate_H", None)
    gate_h_root.empty_display_type = 'PLAIN_AXES'
    gate_h_root.empty_display_size = 0.4
    gate_h_root.location = (0.8, -1.8, 0.0)
    col_gates.objects.link(gate_h_root)
    
    # Gate Box Fill
    mesh_gh_box = create_rect_mesh("QUALUTION_GateH_BoxMesh", 1.2, 1.2)
    obj_gh_box = bpy.data.objects.new("QUALUTION_Gate_H_Box", mesh_gh_box)
    obj_gh_box.data.materials.append(mat_dark_slate)
    obj_gh_box.parent = gate_h_root
    col_gates.objects.link(obj_gh_box)
    
    # Gate Border Outline
    mesh_gh_border = create_rect_mesh("QUALUTION_GateH_BorderMesh", 1.26, 1.26)
    obj_gh_border = bpy.data.objects.new("QUALUTION_Gate_H_Border", mesh_gh_border)
    obj_gh_border.data.materials.append(mat_violet)
    obj_gh_border.location = (0.0, 0.0, -0.01)
    obj_gh_border.parent = gate_h_root
    col_gates.objects.link(obj_gh_border)
    
    # Gate Letter "H"
    font_gh = bpy.data.curves.new("QUALUTION_GateH_Curve", type='FONT')
    font_gh.body = "H"
    font_gh.size = 0.68
    font_gh.align_x = 'CENTER'
    font_gh.align_y = 'CENTER'
    obj_gh_text = bpy.data.objects.new("QUALUTION_Gate_H_Text", font_gh)
    obj_gh_text.location = (0.0, -0.05, 0.02)
    obj_gh_text.data.materials.append(mat_violet)
    obj_gh_text.parent = gate_h_root
    col_gates.objects.link(obj_gh_text)

    # -------------------------------------------------------------
    # ASSET 9: QUALUTION_Gate_Z
    # Flat/vector Phase Z gate
    # -------------------------------------------------------------
    gate_z_root = bpy.data.objects.new("QUALUTION_Gate_Z", None)
    gate_z_root.empty_display_type = 'PLAIN_AXES'
    gate_z_root.empty_display_size = 0.4
    gate_z_root.location = (2.4, -1.8, 0.0)
    col_gates.objects.link(gate_z_root)
    
    # Gate Box Fill
    mesh_gz_box = create_rect_mesh("QUALUTION_GateZ_BoxMesh", 1.2, 1.2)
    obj_gz_box = bpy.data.objects.new("QUALUTION_Gate_Z_Box", mesh_gz_box)
    obj_gz_box.data.materials.append(mat_dark_slate)
    obj_gz_box.parent = gate_z_root
    col_gates.objects.link(obj_gz_box)
    
    # Gate Border Outline
    mesh_gz_border = create_rect_mesh("QUALUTION_GateZ_BorderMesh", 1.26, 1.26)
    obj_gz_border = bpy.data.objects.new("QUALUTION_Gate_Z_Border", mesh_gz_border)
    obj_gz_border.data.materials.append(mat_emerald)
    obj_gz_border.location = (0.0, 0.0, -0.01)
    obj_gz_border.parent = gate_z_root
    col_gates.objects.link(obj_gz_border)
    
    # Gate Letter "Z"
    font_gz = bpy.data.curves.new("QUALUTION_GateZ_Curve", type='FONT')
    font_gz.body = "Z"
    font_gz.size = 0.68
    font_gz.align_x = 'CENTER'
    font_gz.align_y = 'CENTER'
    obj_gz_text = bpy.data.objects.new("QUALUTION_Gate_Z_Text", font_gz)
    obj_gz_text.location = (0.0, -0.05, 0.02)
    obj_gz_text.data.materials.append(mat_emerald)
    obj_gz_text.parent = gate_z_root
    col_gates.objects.link(obj_gz_text)

    # -------------------------------------------------------------
    # ASSET 10: QUALUTION_Measurement
    # Measurement icon with meter box, dial gauge arc, and indicator needle
    # -------------------------------------------------------------
    meas_root = bpy.data.objects.new("QUALUTION_Measurement", None)
    meas_root.empty_display_type = 'PLAIN_AXES'
    meas_root.empty_display_size = 0.4
    meas_root.location = (4.0, -1.8, 0.0)
    col_gates.objects.link(meas_root)
    
    # Meter Box (1.2 x 1.2)
    mesh_m_box = create_rect_mesh("QUALUTION_MeasBoxMesh", 1.2, 1.2)
    obj_m_box = bpy.data.objects.new("QUALUTION_Measurement_Box", mesh_m_box)
    obj_m_box.data.materials.append(mat_dark_slate)
    obj_m_box.parent = meas_root
    col_gates.objects.link(obj_m_box)
    
    mesh_m_border = create_rect_mesh("QUALUTION_MeasBorderMesh", 1.26, 1.26)
    obj_m_border = bpy.data.objects.new("QUALUTION_Measurement_Border", mesh_m_border)
    obj_m_border.data.materials.append(mat_amber)
    obj_m_border.location = (0.0, 0.0, -0.01)
    obj_m_border.parent = meas_root
    col_gates.objects.link(obj_m_border)
    
    # Dial Gauge Arc
    mesh_m_arc = create_arc_mesh("QUALUTION_MeasArcMesh", radius=0.42, width=0.04, start_deg=-60, end_deg=60, segments=18)
    obj_m_arc = bpy.data.objects.new("QUALUTION_Measurement_Dial", mesh_m_arc)
    obj_m_arc.data.materials.append(mat_white)
    obj_m_arc.location = (0.0, -0.15, 0.02)
    obj_m_arc.parent = meas_root
    col_gates.objects.link(obj_m_arc)
    
    # Meter Pointer Needle (angled at 25 deg)
    mesh_m_needle = create_arrow_mesh("QUALUTION_MeasNeedleMesh", total_length=0.48, shaft_width=0.03, head_width=0.10, head_length=0.12)
    obj_m_needle = bpy.data.objects.new("QUALUTION_Measurement_Needle", mesh_m_needle)
    obj_m_needle.data.materials.append(mat_amber)
    obj_m_needle.location = (0.0, -0.15, 0.03)
    obj_m_needle.rotation_euler = (0.0, 0.0, math.radians(-25.0))
    obj_m_needle.parent = meas_root
    col_gates.objects.link(obj_m_needle)

    # -------------------------------------------------------------
    # ASSET 11: QUALUTION_AnnotationArrow
    # Reusable annotation arrow/pointer
    # -------------------------------------------------------------
    annot_root = bpy.data.objects.new("QUALUTION_AnnotationArrow", None)
    annot_root.empty_display_type = 'SINGLE_ARROW'
    annot_root.empty_display_size = 0.5
    annot_root.location = (5.8, -2.4, 0.0) # Base tail at Y=-2.4, points to Y=-1.0
    col_annot.objects.link(annot_root)
    
    mesh_annot_arrow = create_arrow_mesh("QUALUTION_AnnotArrowMesh", total_length=1.4, shaft_width=0.08, head_width=0.34, head_length=0.4)
    obj_annot_arrow = bpy.data.objects.new("QUALUTION_AnnotationArrow_Graphic", mesh_annot_arrow)
    obj_annot_arrow.data.materials.append(mat_accent_yellow)
    obj_annot_arrow.location = (0.0, 0.0, 0.01)
    obj_annot_arrow.parent = annot_root
    col_annot.objects.link(obj_annot_arrow)

    # Embedded Notes
    notes_doc = """# QUALUTION REUSABLE QUANTUM ASSET LIBRARY
# ==========================================
#
# This library contains the 11 foundational 2D educational assets:
# 1. QUALUTION_Qubit           - Stylized 2D qubit node (core, halo, orbital dot)
# 2. QUALUTION_Ket0            - Basis state |0⟩ badge & notation
# 3. QUALUTION_Ket1            - Basis state |1⟩ badge & notation
# 4. QUALUTION_StateVector     - Reusable vector arrow (origin at base tail)
# 5. QUALUTION_ProbabilityBar  - Probability gauge (track, fill bar with X-scale)
# 6. QUALUTION_QuantumWire     - Circuit wire with qubit register label
# 7. QUALUTION_Gate_X          - Pauli-X bit-flip gate
# 8. QUALUTION_Gate_H          - Hadamard superposition gate
# 9. QUALUTION_Gate_Z          - Pauli-Z phase-flip gate
# 10. QUALUTION_Measurement    - Quantum measurement meter & needle
# 11. QUALUTION_AnnotationArrow- Annotation pointer arrow (origin at base)
#
# These source assets are designed for clean appending/linking into lesson scenes.
"""
    text_block = bpy.data.texts.new("QUALUTION_ASSET_NOTES")
    text_block.write(notes_doc)

    # Save to both templates and scenes directories
    script_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd()
    templates_dir = os.path.abspath(os.path.join(script_dir, "qualution-video", "blender", "templates"))
    scenes_dir = os.path.abspath(os.path.join(script_dir, "qualution-video", "blender", "scenes"))
    os.makedirs(templates_dir, exist_ok=True)
    os.makedirs(scenes_dir, exist_ok=True)
    
    out_template = os.path.join(templates_dir, "QUALUTION_ASSET_LIBRARY.blend")
    out_scene = os.path.join(scenes_dir, "QUALUTION_ASSETS.blend")
    
    bpy.ops.wm.save_as_mainfile(filepath=out_template)
    print(f"SUCCESS: Saved asset library template to: {out_template}")
    
    bpy.ops.wm.save_as_mainfile(filepath=out_scene)
    print(f"SUCCESS: Saved asset scene to: {out_scene}")

if __name__ == "__main__":
    build_asset_library()
