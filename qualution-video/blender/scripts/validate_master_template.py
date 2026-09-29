"""
Validation Script for QUALUTION_2D_MASTER.blend
Inspects and tests all requirements specified in Step 2.2.
"""

import bpy
import os
import sys

def validate_template():
    target_path = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_2D_MASTER.blend"))
    
    print(f"--- VALIDATING: {target_path} ---")
    if not os.path.exists(target_path):
        print(f"FAIL: File does not exist: {target_path}")
        sys.exit(1)
        
    bpy.ops.wm.open_mainfile(filepath=target_path)
    scene = bpy.context.scene
    
    errors = []
    checks = []
    
    # 1. Document & Render Settings
    res_x = scene.render.resolution_x
    res_y = scene.render.resolution_y
    fps = scene.render.fps
    f_start = scene.frame_start
    f_end = scene.frame_end
    
    if res_x == 1920 and res_y == 1080:
        checks.append(f"Resolution: {res_x}x{res_y} (16:9) [PASS]")
    else:
        errors.append(f"Invalid resolution: {res_x}x{res_y} (expected 1920x1080)")
        
    if fps == 30:
        checks.append(f"Frame rate: {fps} FPS [PASS]")
    else:
        errors.append(f"Invalid FPS: {fps} (expected 30)")
        
    if f_start == 1 and f_end == 300:
        checks.append(f"Frame range: {f_start} to {f_end} (300 frames) [PASS]")
    else:
        errors.append(f"Invalid frame range: {f_start}-{f_end}")

    # 2. Camera
    cam_obj = scene.camera
    if cam_obj and cam_obj.name == "QUALUTION_Camera":
        cam_data = cam_obj.data
        if cam_data.type == 'ORTHO' and cam_data.ortho_scale == 16.0:
            checks.append(f"Camera: {cam_obj.name} (Orthographic, scale={cam_data.ortho_scale}) [PASS]")
        else:
            errors.append(f"Camera exists but type={cam_data.type}, scale={cam_data.ortho_scale}")
    else:
        errors.append("Active scene camera 'QUALUTION_Camera' missing")

    # 3. Collections
    expected_master = "QUALUTION_MASTER"
    expected_sub_cols = [
        "CAMERA", "BACKGROUND", "TITLE", "MAIN_VISUAL",
        "SUPPORTING_VISUAL", "DIAGRAM", "ANNOTATIONS",
        "CAPTIONS", "TRANSITIONS", "GUIDES"
    ]
    
    if expected_master in bpy.data.collections:
        checks.append(f"Master Collection '{expected_master}' exists [PASS]")
        master_col = bpy.data.collections[expected_master]
        child_names = [c.name for c in master_col.children]
        
        for sc in expected_sub_cols:
            if sc in child_names:
                checks.append(f"  - Sub-collection '{sc}' present [PASS]")
            else:
                errors.append(f"Missing sub-collection: '{sc}'")
    else:
        errors.append(f"Master collection '{expected_master}' not found")

    # 4. Guides non-rendering check
    if "GUIDES" in bpy.data.collections:
        g_col = bpy.data.collections["GUIDES"]
        if g_col.hide_render:
            checks.append("GUIDES collection hide_render = True [PASS]")
        else:
            errors.append("GUIDES collection hide_render is False (guides would render)")
            
        for obj in g_col.objects:
            if not obj.hide_render:
                errors.append(f"Guide object '{obj.name}' hide_render is False")
        checks.append(f"All {len(g_col.objects)} guide objects confirmed non-rendering [PASS]")

    # 5. Placeholders & Anchors
    expected_objects = [
        "QUALUTION_Title",
        "QUALUTION_LessonTitle",
        "QUALUTION_Caption",
        "QUALUTION_MainVisualAnchor",
        "QUALUTION_SupportVisualAnchor",
        "QUALUTION_CaptionAnchor",
        "QUALUTION_BackgroundPlane",
        "QUALUTION_TransitionPlate"
    ]
    
    for obj_name in expected_objects:
        if obj_name in bpy.data.objects:
            checks.append(f"Required object '{obj_name}' present [PASS]")
        else:
            errors.append(f"Missing required object: '{obj_name}'")

    # 6. Embedded Documentation
    if "QUALUTION_TEMPLATE_NOTES" in bpy.data.texts:
        doc_text = bpy.data.texts["QUALUTION_TEMPLATE_NOTES"].as_string()
        if "QUALUTION 2D EDUCATIONAL VIDEO MASTER TEMPLATE" in doc_text:
            checks.append("Embedded documentation 'QUALUTION_TEMPLATE_NOTES' present [PASS]")
        else:
            errors.append("Embedded text block missing expected header")
    else:
        errors.append("Embedded text block 'QUALUTION_TEMPLATE_NOTES' not found")

    # 7. Prohibition checks: No quantum models, bloch spheres, gates, or characters
    forbidden_terms = ["bloch", "sphere", "qubit", "gate", "character", "hadamard"]
    found_forbidden = []
    for obj in bpy.data.objects:
        for term in forbidden_terms:
            if term in obj.name.lower():
                found_forbidden.append(obj.name)
    if found_forbidden:
        errors.append(f"Found premature models violating Step 2.2 scope: {found_forbidden}")
    else:
        checks.append("Scope discipline check: Zero premature quantum/lesson models [PASS]")

    # Summary
    print("\n--- CHECK RESULTS ---")
    for c in checks:
        print(f"  + {c}")
        
    if errors:
        print("\n--- ERRORS FOUND ---")
        for e in errors:
            print(f"  x {e}")
        sys.exit(1)
    else:
        print("\n>>> ALL VALIDATION CHECKS PASSED SUCCESSFULLY (100%) <<<")
        sys.exit(0)

if __name__ == "__main__":
    validate_template()
