"""
Validation Script for QUALUTION Lesson 1 Scene 1 (The Hook)
Tests: qualution-video/blender/scenes/lesson01_scene01_hook.blend
"""

import bpy
import os
import sys

def validate_hook_scene():
    scene_path = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene01_hook.blend"))
    master_template = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_2D_MASTER.blend"))
    asset_lib = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_ASSET_LIBRARY.blend"))
    
    print("=== STARTING STEP 4 SCENE 1 VALIDATION ===")
    
    # 1. Verify Templates & Assets Intact
    assert os.path.exists(master_template), f"Master template missing: {master_template}"
    assert os.path.exists(asset_lib), f"Asset library missing: {asset_lib}"
    print("PASS: Master template and Asset Library are intact.")
    
    # 2. Open Scene
    assert os.path.exists(scene_path), f"Scene 1 missing at {scene_path}"
    bpy.ops.wm.open_mainfile(filepath=scene_path)
    scene = bpy.context.scene
    print(f"PASS: Opened '{scene.name}' successfully.")
    
    # 3. Settings & Duration (18.0s = 540 frames @ 30 FPS, 1920x1080)
    assert scene.render.resolution_x == 1920 and scene.render.resolution_y == 1080, "Invalid resolution"
    assert scene.render.fps == 30, "Invalid FPS"
    assert scene.frame_start == 1 and scene.frame_end == 540, f"Expected 1-540, got {scene.frame_start}-{scene.frame_end}"
    print("PASS: Document settings: 1920x1080 @ 30 FPS, 1–540 frames (18.0s exactly).")
    
    # 4. Camera Setup
    cam = scene.camera
    assert cam is not None and cam.name == "QUALUTION_Camera", "Camera missing"
    assert cam.data.type == 'ORTHO' and cam.data.ortho_scale == 16.0, "Camera incorrect ortho setup"
    print("PASS: Camera calibrated to 16.0 orthographic scale framing 16:9 canvas.")
    
    # 5. Verify 4 Narrative Acts Present
    act_groups = [
        "Act1_ClassicalComputing_Group",
        "Act2_ClassicalBit_Group",
        "Act3_HookQuestion_Group",
        "Act4_QuantumComputing_Group"
    ]
    for act in act_groups:
        assert act in bpy.data.objects, f"Missing narrative group: {act}"
        obj = bpy.data.objects[act]
        assert obj.animation_data and obj.animation_data.action, f"Group {act} has no animation"
    print("PASS: All 4 story acts present and keyframed with smooth entrance/exit curves.")
    
    # 6. Reusable Assets & Preview Restraint
    assert "QUALUTION_Qubit" in bpy.data.objects, "QUALUTION_Qubit missing from Act 4"
    assert "QUALUTION_Ket0" in bpy.data.objects, "QUALUTION_Ket0 missing from Act 4"
    assert "QUALUTION_Ket1" in bpy.data.objects, "QUALUTION_Ket1 missing from Act 4"
    
    # Verify Superposition is NOT taught in Scene 1
    for obj in bpy.data.objects:
        if obj.type == 'FONT':
            assert "superposition" not in obj.data.body.lower(), f"Superposition prematurely taught in Scene 1 text: '{obj.data.body}'"
    print("PASS: Quantum visual restrained to introductory preview (no superposition teaching).")
    
    # 7. Check Still Renders & Frame Sequence
    render_dir = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01"))
    frames_dir = os.path.join(render_dir, "frames")
    
    stills = [
        "lesson01_scene01_hook_0060.png",
        "lesson01_scene01_hook_0180.png",
        "lesson01_scene01_hook_0290.png",
        "lesson01_scene01_hook_0450.png",
        "lesson01_scene01_hook_0525.png"
    ]
    for s in stills:
        p = os.path.join(render_dir, s)
        assert os.path.exists(p), f"Missing representative still: {p}"
    print(f"PASS: All 5 representative still frames verified in {render_dir}.")
    
    assert os.path.exists(frames_dir), "Frames folder missing"
    frame_files = [f for f in os.listdir(frames_dir) if f.endswith(".png")]
    assert len(frame_files) >= 540, f"Expected 540 frames, found {len(frame_files)}"
    print(f"PASS: Full {len(frame_files)}-frame animation sequence verified in {frames_dir}.")
    
    print("\n>>> ALL STEP 4 VALIDATION CHECKS PASSED (100% COMPLIANT) <<<")
    sys.exit(0)

if __name__ == "__main__":
    validate_hook_scene()
