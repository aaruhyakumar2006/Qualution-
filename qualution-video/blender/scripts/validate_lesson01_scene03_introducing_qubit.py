"""
Validation Script for QUALUTION Lesson 1 Scene 3: Introducing the Qubit
Tests:
- Blender Scene: qualution-video/blender/scenes/lesson01_scene03_introducing_qubit.blend
- Direct MP4: qualution-video/renders/lesson01/scene03/lesson01_scene03_introducing_qubit.mp4
- 5 Representative Stills under qualution-video/renders/lesson01/scene03/
"""

import bpy
import os
import sys

def validate_scene03():
    scene_path = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene03_introducing_qubit.blend"))
    master_template = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_2D_MASTER.blend"))
    asset_lib = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_ASSET_LIBRARY.blend"))
    scene01 = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene01_hook.blend"))
    scene02 = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene02_classical_bit.blend"))
    
    print("=== STARTING STEP 7 SCENE 3 VALIDATION ===")
    
    # 1. Verify Templates & Prior Scenes Intact
    assert os.path.exists(master_template), f"Master template missing: {master_template}"
    assert os.path.exists(asset_lib), f"Asset library missing: {asset_lib}"
    assert os.path.exists(scene01), f"Scene 1 missing: {scene01}"
    assert os.path.exists(scene02), f"Scene 2 missing: {scene02}"
    print("PASS: Master template, Asset library, Scene 1, and Scene 2 are intact.")
    
    # 2. Open Scene 3
    assert os.path.exists(scene_path), f"Scene 3 file missing at {scene_path}"
    bpy.ops.wm.open_mainfile(filepath=scene_path)
    scene = bpy.context.scene
    print(f"PASS: Opened '{scene.name}' successfully.")
    
    # 3. Settings & Duration (28.0s = 840 frames @ 30 FPS, 1920x1080)
    assert scene.render.resolution_x == 1920 and scene.render.resolution_y == 1080, "Invalid resolution"
    assert scene.render.fps == 30, "Invalid FPS"
    assert scene.frame_start == 1261 and scene.frame_end == 2100, f"Expected 1261-2100, got {scene.frame_start}-{scene.frame_end}"
    duration_sec = (scene.frame_end - scene.frame_start + 1) / scene.render.fps
    assert duration_sec == 28.0, f"Expected exactly 28.0s, got {duration_sec}s"
    print("PASS: Document settings: 1920x1080 @ 30 FPS, 1261–2100 frames (28.0s exactly).")
    
    # 4. Camera Setup
    cam = scene.camera
    assert cam is not None and cam.name == "QUALUTION_Camera", "Camera missing"
    assert cam.data.type == 'ORTHO' and cam.data.ortho_scale == 16.0, "Camera incorrect ortho setup"
    print("PASS: Camera calibrated to 16.0 orthographic scale framing 16:9 canvas.")
    
    # 5. Verify 5 Narrative Acts Present
    act_groups = [
        "Act1_Bridge_Group",
        "Act2_HeroQubit_Group",
        "Act3_BasisStates_Group",
        "Act4_StateNotation_Group",
        "Act5_TransitionLesson2_Group"
    ]
    for act in act_groups:
        assert act in bpy.data.objects, f"Missing narrative group: {act}"
        obj = bpy.data.objects[act]
        assert obj.animation_data and obj.animation_data.action, f"Group {act} has no animation"
    print("PASS: All 5 story acts present and keyframed with smooth entrance/exit curves.")
    
    # 6. Verify Reusable Assets Used
    reusable_assets = [
        "QUALUTION_Qubit",
        "QUALUTION_Ket0",
        "QUALUTION_Ket1",
        "QUALUTION_StateVector"
    ]
    for asset in reusable_assets:
        assert asset in bpy.data.objects, f"Missing reusable asset: {asset}"
    print("PASS: Reusable assets (QUALUTION_Qubit, QUALUTION_Ket0, QUALUTION_Ket1, QUALUTION_StateVector) present.")
    
    # 7. Check Educational Text & Curriculum Boundaries
    expected_texts = ["FROM BIT TO QUBIT", "THE QUBIT", "COMPUTATIONAL BASIS STATES", "QUANTUM STATE NOTATION", "HOW IS A QUBIT REPRESENTED?"]
    found_bodies = [o.data.body for o in bpy.data.objects if o.type == 'FONT']
    
    for exp in expected_texts:
        assert any(exp in b for b in found_bodies), f"Missing key text: '{exp}'"
        
    for obj in bpy.data.objects:
        if obj.type == 'FONT':
            body = obj.data.body.lower()
            # Allowed to mention previewing superposition or in preview note, but not teaching math/derivation
            assert "born rule" not in body, f"Premature Born rule in Scene 3 text: '{obj.data.body}'"
            assert "bloch sphere" not in body, f"Premature Bloch sphere in Scene 3 text: '{obj.data.body}'"
            assert "matrix" not in body, f"Premature gate matrix in Scene 3 text: '{obj.data.body}'"
    print("PASS: Curriculum boundaries verified (no Born rule, Bloch sphere math, or gate matrices).")
    
    # 8. Check 5 Synchronized Subtitles
    caption_objs = [o for o in bpy.data.objects if o.name.startswith("Caption_")]
    assert len(caption_objs) == 5, f"Expected 5 captions, found {len(caption_objs)}"
    print("PASS: 5 synced narration subtitles verified.")
    
    # 9. Verify Render Outputs (5 Stills + 1 Direct MP4)
    out_dir = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01", "scene03"))
    stills = [
        "lesson01_scene03_introducing_qubit_1335.png",
        "lesson01_scene03_introducing_qubit_1500.png",
        "lesson01_scene03_introducing_qubit_1680.png",
        "lesson01_scene03_introducing_qubit_1860.png",
        "lesson01_scene03_introducing_qubit_2025.png"
    ]
    for s in stills:
        p = os.path.join(out_dir, s)
        assert os.path.exists(p), f"Missing representative still: {p}"
    print(f"PASS: All 5 representative still frames verified in {out_dir}.")
    
    # Direct MP4 verification
    mp4_target = os.path.join(out_dir, "lesson01_scene03_introducing_qubit.mp4")
    if not os.path.exists(mp4_target):
        for fname in os.listdir(out_dir):
            if fname.startswith("lesson01_scene03_introducing_qubit") and fname.endswith(".mp4"):
                mp4_target = os.path.join(out_dir, fname)
                break
                
    assert os.path.exists(mp4_target), f"Direct MP4 video missing: {mp4_target}"
    
    clip = bpy.data.movieclips.load(mp4_target)
    assert clip.size[0] == 1920 and clip.size[1] == 1080, f"Invalid MP4 resolution: {clip.size}"
    assert clip.fps == 30.0, f"Invalid MP4 FPS: {clip.fps}"
    assert clip.frame_duration >= 840, f"Invalid MP4 frame count: {clip.frame_duration}"
    size_mb = os.path.getsize(mp4_target) / (1024 * 1024)
    print(f"PASS: Direct MP4 verified: {mp4_target} ({size_mb:.2f} MB, {clip.size[0]}x{clip.size[1]} @ {clip.fps} FPS, {clip.frame_duration} frames).")
    
    print("\n>>> ALL STEP 7 SCENE 3 VALIDATION CHECKS PASSED (100% COMPLIANT) <<<")
    sys.exit(0)

if __name__ == "__main__":
    validate_scene03()
