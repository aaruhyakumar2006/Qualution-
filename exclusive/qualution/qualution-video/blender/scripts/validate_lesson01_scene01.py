"""
Validation Script for QUALUTION Lesson 1 Scene 1 Animated Educational Scene (Step 2.5 Refined)
Tests: qualution-video/blender/scenes/lesson01_scene01_bits_to_qubits.blend
"""

import bpy
import os
import sys

def validate_scene():
    target_scene = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene01_bits_to_qubits.blend"))
    master_template = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_2D_MASTER.blend"))
    asset_library = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_ASSET_LIBRARY.blend"))
    
    print("=== STARTING STEP 2.5 CURRICULUM REFINEMENT VALIDATION ===")
    
    # 1. Verify Master Template & Asset Library Intact
    assert os.path.exists(master_template), f"Master template missing at {master_template}"
    assert os.path.exists(asset_library), f"Asset library missing at {asset_library}"
    print("PASS: Master template and Asset Library remain intact.")
    
    # 2. Open Animated Scene
    assert os.path.exists(target_scene), f"Animated scene file missing at {target_scene}"
    bpy.ops.wm.open_mainfile(filepath=target_scene)
    scene = bpy.context.scene
    print(f"PASS: Opened animated scene '{scene.name}' successfully.")
    
    # 3. Document Settings & 16:9 Composition
    res_x = scene.render.resolution_x
    res_y = scene.render.resolution_y
    fps = scene.render.fps
    f_start = scene.frame_start
    f_end = scene.frame_end
    
    assert res_x == 1920 and res_y == 1080, f"Unexpected resolution: {res_x}x{res_y}"
    assert fps == 30, f"Unexpected FPS: {fps}"
    assert f_start == 1 and f_end == 750, f"Unexpected frame range: {f_start}-{f_end} (expected 1-750, 25.0s)"
    print(f"PASS: 1920x1080 @ 30 FPS, Timeline 1-750 (25.0 seconds).")
    
    # 4. Camera Orthographic 16:9 Setup
    cam = scene.camera
    assert cam is not None and cam.name == "QUALUTION_Camera", "QUALUTION_Camera missing"
    assert cam.data.type == 'ORTHO' and cam.data.ortho_scale == 16.0, "Camera not properly configured"
    print("PASS: Orthographic camera calibrated to 16.0 scale framing 16:9 canvas.")
    
    # 5. Curriculum Content Checks:
    # Verify Superposition is NOT framed as the main concept of Shot 2 or Shot 3
    s2_title_obj = bpy.data.objects.get("Shot2_Title")
    assert s2_title_obj is not None and s2_title_obj.data.body == "THE QUBIT", f"Shot 2 title should be 'THE QUBIT', got '{getattr(s2_title_obj.data, 'body', None)}'"
    print("PASS: Shot 2 properly titled 'THE QUBIT' (no superposition framing).")
    
    s3_title_obj = bpy.data.objects.get("Shot3_Title")
    assert s3_title_obj is not None and "QUANTUM STATE" in s3_title_obj.data.body, f"Shot 3 title should focus on 'QUANTUM STATE', got '{getattr(s3_title_obj.data, 'body', None)}'"
    print("PASS: Shot 3 properly titled 'QUANTUM STATE NOTATION'.")
    
    # 6. Reusable Asset Utilization
    reusable_asset_roots = [
        "QUALUTION_Qubit",
        "QUALUTION_Ket0",
        "QUALUTION_Ket1",
        "QUALUTION_StateVector",
        "QUALUTION_QuantumWire",
        "QUALUTION_Gate_H",
        "QUALUTION_Measurement",
        "QUALUTION_AnnotationArrow",
        "QUALUTION_TransitionPlate"
    ]
    for asset_name in reusable_asset_roots:
        assert asset_name in bpy.data.objects, f"Required reusable asset '{asset_name}' not used in scene"
    print("PASS: All required reusable assets integrated and active.")
    
    # 7. Storyboard Animation Keyframes & Captions
    captions = [
        "Caption_Shot1", "Caption_Shot2", "Caption_Shot3",
        "Caption_Shot4", "Caption_Shot5"
    ]
    for cap in captions:
        assert cap in bpy.data.objects, f"Caption object '{cap}' missing"
        obj = bpy.data.objects[cap]
        assert obj.animation_data and obj.animation_data.action, f"Caption '{cap}' has no keyframe animation"
    print("PASS: All 5 storyboard narration subtitles sequenced and animated.")
    
    # 8. Check Renders Exist
    expected_renders = [
        "lesson01_shot_0060.png",
        "lesson01_shot_0220.png",
        "lesson01_shot_0380.png",
        "lesson01_shot_0550.png",
        "lesson01_shot_0680.png"
    ]
    render_dir = os.path.abspath(os.path.join("qualution-video", "renders"))
    for r in expected_renders:
        r_path = os.path.join(render_dir, r)
        assert os.path.exists(r_path), f"Render preview file missing: {r_path}"
    print(f"PASS: All 5 rendered shot preview frames verified in {render_dir}.")
    
    print("\n>>> ALL STEP 2.5 REFINEMENT CHECKS PASSED SUCCESSFULLY (100%) <<<")
    sys.exit(0)

if __name__ == "__main__":
    validate_scene()
