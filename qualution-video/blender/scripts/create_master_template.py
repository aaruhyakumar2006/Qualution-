"""
QUALUTION 2D Master Blender Template Generator
Creates qualution-video/blender/templates/QUALUTION_2D_MASTER.blend
"""

import bpy
import os

def create_master_template():
    # 1. Reset scene to a completely blank slate
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    scene = bpy.context.scene
    scene.name = "QUALUTION_Master_Scene"
    
    # 2. Configure Render and Output Settings
    render = scene.render
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.resolution_percentage = 100
    render.fps = 30
    render.fps_base = 1.0
    
    # Timeline frame range (1 to 300 initial template range)
    scene.frame_start = 1
    scene.frame_end = 300
    scene.frame_current = 1
    
    # Safe Areas settings on scene if available
    if hasattr(scene, 'safe_areas'):
        scene.safe_areas.title[0] = 0.1
        scene.safe_areas.title[1] = 0.1
        scene.safe_areas.action[0] = 0.05
        scene.safe_areas.action[1] = 0.05
    
    # Color Management & Render Engine for clean educational infographic output
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
    
    # Output format settings (Clean PNG sequence default)
    render.image_settings.file_format = 'PNG'
    render.image_settings.color_mode = 'RGBA'
    render.image_settings.color_depth = '8'
    
    # 3. Build Collection Hierarchy under QUALUTION_MASTER
    master_col = bpy.data.collections.new("QUALUTION_MASTER")
    scene.collection.children.link(master_col)
    
    sub_collection_names = [
        "CAMERA",
        "BACKGROUND",
        "TITLE",
        "MAIN_VISUAL",
        "SUPPORTING_VISUAL",
        "DIAGRAM",
        "ANNOTATIONS",
        "CAPTIONS",
        "TRANSITIONS",
        "GUIDES",
    ]
    
    sub_cols = {}
    for name in sub_collection_names:
        col = bpy.data.collections.new(name)
        master_col.children.link(col)
        sub_cols[name] = col
        
    # Hide GUIDES collection from render
    sub_cols["GUIDES"].hide_render = True
    
    # 4. Materials Setup (Clean 2D Vector Flat Aesthetic)
    def create_flat_material(name, rgba):
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        nodes.clear()
        
        # Use Emission shader for pure, crisp, unlit vector flat color
        shader = nodes.new(type='ShaderNodeEmission')
        shader.inputs['Color'].default_value = rgba
        shader.inputs['Strength'].default_value = 1.0
        
        output = nodes.new(type='ShaderNodeOutputMaterial')
        mat.node_tree.links.new(shader.outputs['Emission'], output.inputs['Surface'])
        return mat
    
    mat_bg = create_flat_material("QUALUTION_Mat_Background", (0.043, 0.059, 0.098, 1.0)) # Deep Navy #0B0F19
    mat_title = create_flat_material("QUALUTION_Mat_TitleCyan", (0.0, 0.85, 0.95, 1.0)) # Quantum Cyan #00D9F2
    mat_lesson = create_flat_material("QUALUTION_Mat_TextWhite", (0.95, 0.97, 1.0, 1.0)) # Crisp White
    mat_caption = create_flat_material("QUALUTION_Mat_CaptionSlate", (0.80, 0.86, 0.94, 1.0)) # Light Slate #CBD5E1
    
    # 5. Camera Setup (Orthographic 16:9 Canvas)
    # Coordinate system: Width = 16.0 (-8.0 to +8.0), Height = 9.0 (-4.5 to +4.5)
    cam_data = bpy.data.cameras.new("QUALUTION_Camera")
    cam_data.type = 'ORTHO'
    cam_data.sensor_fit = 'HORIZONTAL'
    cam_data.ortho_scale = 16.0
    cam_data.clip_start = 0.1
    cam_data.clip_end = 100.0
    cam_data.show_composition_center = True
    cam_data.show_safe_areas = True
    
    cam_obj = bpy.data.objects.new("QUALUTION_Camera", cam_data)
    cam_obj.location = (0.0, 0.0, 10.0)
    cam_obj.rotation_euler = (0.0, 0.0, 0.0)
    sub_cols["CAMERA"].objects.link(cam_obj)
    scene.camera = cam_obj
    
    # 6. Background Plane
    mesh_bg = bpy.data.meshes.new("QUALUTION_BackgroundMesh")
    # Sized slightly larger than canvas (20 x 12) at Z = -1.0
    half_w, half_h = 10.0, 6.0
    verts = [(-half_w, -half_h, 0.0), (half_w, -half_h, 0.0), (half_w, half_h, 0.0), (-half_w, half_h, 0.0)]
    faces = [(0, 1, 2, 3)]
    mesh_bg.from_pydata(verts, [], faces)
    mesh_bg.update()
    
    bg_obj = bpy.data.objects.new("QUALUTION_BackgroundPlane", mesh_bg)
    bg_obj.location = (0.0, 0.0, -1.0)
    bg_obj.data.materials.append(mat_bg)
    sub_cols["BACKGROUND"].objects.link(bg_obj)
    
    # 7. Helper to create wireframe guide rectangles (non-rendering)
    def create_guide_box(name, width, height, center_x, center_y):
        mesh = bpy.data.meshes.new(f"{name}_Mesh")
        hw, hh = width / 2.0, height / 2.0
        verts = [
            (center_x - hw, center_y - hh, 0.0),
            (center_x + hw, center_y - hh, 0.0),
            (center_x + hw, center_y + hh, 0.0),
            (center_x - hw, center_y + hh, 0.0)
        ]
        edges = [(0, 1), (1, 2), (2, 3), (3, 0)]
        mesh.from_pydata(verts, edges, [])
        mesh.update()
        
        obj = bpy.data.objects.new(name, mesh)
        obj.location = (0.0, 0.0, 0.05)
        obj.display_type = 'WIRE'
        obj.hide_render = True
        sub_cols["GUIDES"].objects.link(obj)
        return obj

    # Guide 1: 16:9 Full Canvas Margins (16 x 9)
    create_guide_box("QUALUTION_Guide_OuterCanvasMargins", 16.0, 9.0, 0.0, 0.0)
    
    # Guide 2: Mobile & Action Safe Area (80% frame: 12.8 x 7.2)
    create_guide_box("QUALUTION_Guide_SafeArea", 12.8, 7.2, 0.0, 0.0)
    
    # Guide 3: Title / Header Safe Area (12.8 x 1.4 at Top, Y = 3.4)
    create_guide_box("QUALUTION_Guide_HeaderSafe", 12.8, 1.4, 0.0, 3.4)
    
    # Guide 4: Main Visual Area (8.4 x 4.8 at Center-Left, X = -2.0, Y = 0.1)
    create_guide_box("QUALUTION_Guide_MainVisualArea", 8.4, 4.8, -2.0, 0.1)
    
    # Guide 5: Supporting Visual / Secondary Diagram Area (4.0 x 4.8 at Right, X = 4.4, Y = 0.1)
    create_guide_box("QUALUTION_Guide_SupportVisualArea", 4.0, 4.8, 4.4, 0.1)
    
    # Guide 6: Bottom Caption / Subtitle Safe Area (12.8 x 1.4 at Bottom, Y = -3.4)
    create_guide_box("QUALUTION_Guide_CaptionSafe", 12.8, 1.4, 0.0, -3.4)

    # 8. Title Area Text Placeholders
    # A. "QUALUTION" (Category / Brand Header)
    text_qualution = bpy.data.curves.new(name="QUALUTION_Title_Curve", type='FONT')
    text_qualution.body = "QUALUTION"
    text_qualution.size = 0.38
    text_qualution.align_x = 'LEFT'
    text_qualution.align_y = 'TOP'
    
    title_obj = bpy.data.objects.new("QUALUTION_Title", text_qualution)
    title_obj.location = (-6.4, 3.9, 0.1)
    title_obj.data.materials.append(mat_title)
    sub_cols["TITLE"].objects.link(title_obj)
    
    # B. "Lesson Title" (Primary Headline Placeholder)
    text_lesson = bpy.data.curves.new(name="QUALUTION_LessonTitle_Curve", type='FONT')
    text_lesson.body = "Lesson Title"
    text_lesson.size = 0.62
    text_lesson.align_x = 'LEFT'
    text_lesson.align_y = 'TOP'
    
    lesson_obj = bpy.data.objects.new("QUALUTION_LessonTitle", text_lesson)
    lesson_obj.location = (-6.4, 3.35, 0.1)
    lesson_obj.data.materials.append(mat_lesson)
    sub_cols["TITLE"].objects.link(lesson_obj)

    # 9. Main Visual & Supporting Visual Anchors
    main_anchor = bpy.data.objects.new("QUALUTION_MainVisualAnchor", None)
    main_anchor.empty_display_type = 'PLAIN_AXES'
    main_anchor.empty_display_size = 1.0
    main_anchor.location = (-2.0, 0.1, 0.0)
    sub_cols["MAIN_VISUAL"].objects.link(main_anchor)
    
    support_anchor = bpy.data.objects.new("QUALUTION_SupportVisualAnchor", None)
    support_anchor.empty_display_type = 'PLAIN_AXES'
    support_anchor.empty_display_size = 0.75
    support_anchor.location = (4.4, 0.1, 0.0)
    sub_cols["SUPPORTING_VISUAL"].objects.link(support_anchor)
    
    # 10. Caption Area Placeholders
    caption_anchor = bpy.data.objects.new("QUALUTION_CaptionAnchor", None)
    caption_anchor.empty_display_type = 'SINGLE_ARROW'
    caption_anchor.empty_display_size = 0.5
    caption_anchor.location = (0.0, -3.4, 0.0)
    sub_cols["CAPTIONS"].objects.link(caption_anchor)
    
    text_caption = bpy.data.curves.new(name="QUALUTION_Caption_Curve", type='FONT')
    text_caption.body = "Caption / narration text"
    text_caption.size = 0.42
    text_caption.align_x = 'CENTER'
    text_caption.align_y = 'CENTER'
    
    caption_obj = bpy.data.objects.new("QUALUTION_Caption", text_caption)
    caption_obj.location = (0.0, -3.4, 0.1)
    caption_obj.data.materials.append(mat_caption)
    sub_cols["CAPTIONS"].objects.link(caption_obj)

    # 11. Transition Setup (Fade Overlay Plane with keyframeable transparency)
    mesh_trans = bpy.data.meshes.new("QUALUTION_TransitionMesh")
    t_hw, t_hh = 10.0, 6.0
    t_verts = [(-t_hw, -t_hh, 0.0), (t_hw, -t_hh, 0.0), (t_hw, t_hh, 0.0), (-t_hw, t_hh, 0.0)]
    t_faces = [(0, 1, 2, 3)]
    mesh_trans.from_pydata(t_verts, [], t_faces)
    mesh_trans.update()
    
    mat_trans = bpy.data.materials.new(name="QUALUTION_Mat_Transition")
    mat_trans.use_nodes = True
    t_nodes = mat_trans.node_tree.nodes
    t_nodes.clear()
    
    t_bsdf = t_nodes.new(type='ShaderNodeBsdfPrincipled')
    t_bsdf.inputs['Base Color'].default_value = (0.0, 0.0, 0.0, 1.0)
    t_bsdf.inputs['Alpha'].default_value = 0.0 # Default transparent (no fade active)
    
    t_output = t_nodes.new(type='ShaderNodeOutputMaterial')
    mat_trans.node_tree.links.new(t_bsdf.outputs['BSDF'], t_output.inputs['Surface'])
    
    trans_obj = bpy.data.objects.new("QUALUTION_TransitionPlate", mesh_trans)
    trans_obj.location = (0.0, 0.0, 5.0) # In front of all visual layers, behind camera (Z=10)
    trans_obj.data.materials.append(mat_trans)
    sub_cols["TRANSITIONS"].objects.link(trans_obj)

    # 12. Embedded Text Block / Scene Metadata Documentation
    notes_doc = """# QUALUTION 2D EDUCATIONAL VIDEO MASTER TEMPLATE
# ===============================================
#
# 1. ARCHITECTURE & PURPOSE:
#    - This is the QUALUTION 2D educational video master template.
#    - Blender is used for offline content production of high-fidelity infographic animations.
#    - Final learner-facing media will be rendered to lightweight web video formats (MP4/WebM).
#    - Lesson-specific assets should be built from this template rather than creating unrelated scenes.
#
# 2. DOCUMENT SETTINGS:
#    - Canvas Resolution: 1920 x 1080 (16:9 Aspect Ratio)
#    - Frame Rate: 30 FPS
#    - Frame Range: 1 - 300 (Initial 10-second reference range)
#    - Camera: Orthographic camera framing the complete 16:9 canvas
#
# 3. SPATIAL COORDINATE SYSTEM:
#    - Camera Ortho Scale: 16.0 units (Horizontal Fit)
#    - Canvas Boundaries: X in [-8.0, +8.0], Y in [-4.5, +4.5]
#    - Mobile / Action Safe Margin: X in [-6.4, +6.4], Y in [-3.6, +3.6]
#
# 4. COLLECTION STRUCTURE:
#    QUALUTION_MASTER/
#    ├── CAMERA             - QUALUTION_Camera
#    ├── BACKGROUND         - QUALUTION_BackgroundPlane
#    ├── TITLE              - QUALUTION_Title, QUALUTION_LessonTitle
#    ├── MAIN_VISUAL        - QUALUTION_MainVisualAnchor (Center-Left)
#    ├── SUPPORTING_VISUAL  - QUALUTION_SupportVisualAnchor (Right)
#    ├── DIAGRAM            - Reusable circuit/state diagram containers
#    ├── ANNOTATIONS        - Pointers, math labels, callouts
#    ├── CAPTIONS           - QUALUTION_CaptionAnchor, QUALUTION_Caption
#    ├── TRANSITIONS        - QUALUTION_TransitionPlate (Fade In/Out)
#    └── GUIDES             - Non-rendering layout & mobile safe bounding guides
#
# 5. PRODUCTION GUIDELINES:
#    - Keep critical educational visuals centered within the mobile-safe region.
#    - Guides are marked non-rendering (hide_render = True).
#    - Render lightweight web MP4s (H.264 / AAC) for web delivery.
"""
    
    text_block = bpy.data.texts.new("QUALUTION_TEMPLATE_NOTES")
    text_block.write(notes_doc)
    
    # 13. Save .blend file to templates directory
    script_dir = os.path.dirname(bpy.data.filepath) if bpy.data.filepath else os.getcwd()
    output_dir = os.path.abspath(os.path.join(script_dir, "qualution-video", "blender", "templates"))
    os.makedirs(output_dir, exist_ok=True)
    
    output_blend_path = os.path.join(output_dir, "QUALUTION_2D_MASTER.blend")
    bpy.ops.wm.save_as_mainfile(filepath=output_blend_path)
    print(f"SUCCESS: Saved QUALUTION master template to: {output_blend_path}")

if __name__ == "__main__":
    create_master_template()
