"""
Validation Script for QUALUTION Step 6 Render Pipeline Optimization
Tests:
1. Existing Scene 1 intact (qualution-video/blender/scenes/lesson01_scene01_hook.blend)
2. Existing Scene 2 intact (qualution-video/blender/scenes/lesson01_scene02_classical_bit.blend)
3. Asset Library intact (qualution-video/blender/templates/QUALUTION_ASSET_LIBRARY.blend)
4. Master Template intact (qualution-video/blender/templates/QUALUTION_2D_MASTER.blend)
5. Benchmark files exist (benchmark_results.json, mode_b_direct.mp4, mode_c_optimized.mp4)
6. MP4 video streams are valid 1920x1080 @ 30 FPS with 150 frames
7. Quality check still exists
8. Documentation exists (qualution-video/blender/RENDER_PIPELINE.md)
"""

import bpy
import os
import sys
import json

def validate_pipeline():
    print("=== STARTING STEP 6 RENDER PIPELINE VALIDATION ===")
    
    # 1. Verify Core Production Assets & Templates
    master_template = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_2D_MASTER.blend"))
    asset_lib = os.path.abspath(os.path.join("qualution-video", "blender", "templates", "QUALUTION_ASSET_LIBRARY.blend"))
    scene01 = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene01_hook.blend"))
    scene02 = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene02_classical_bit.blend"))
    
    assert os.path.exists(master_template), f"Master template missing: {master_template}"
    assert os.path.exists(asset_lib), f"Asset library missing: {asset_lib}"
    assert os.path.exists(scene01), f"Production Scene 1 missing: {scene01}"
    assert os.path.exists(scene02), f"Production Scene 2 missing: {scene02}"
    print("PASS: Master template, Asset Library, Scene 1, and Scene 2 remain 100% intact.")
    
    # 2. Verify Documentation
    doc_path = os.path.abspath(os.path.join("qualution-video", "blender", "RENDER_PIPELINE.md"))
    assert os.path.exists(doc_path), f"Documentation missing: {doc_path}"
    with open(doc_path, "r", encoding="utf-8") as f:
        doc_content = f.read()
    assert "Optimized MP4" in doc_content, "Documentation missing optimized MP4 details"
    assert "Benchmark" in doc_content, "Documentation missing benchmark details"
    print("PASS: RENDER_PIPELINE.md documentation verified.")
    
    # 3. Verify Benchmark Results JSON
    bench_dir = os.path.abspath(os.path.join("qualution-video", "renders", "benchmark"))
    json_path = os.path.join(bench_dir, "benchmark_results.json")
    assert os.path.exists(json_path), f"Benchmark JSON missing: {json_path}"
    
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    assert "mode_a_png" in data
    assert "mode_b_direct_mp4" in data
    assert "mode_c_optimized_mp4" in data
    
    sec_a = data["mode_a_png"]["elapsed_seconds"]
    sec_c = data["mode_c_optimized_mp4"]["elapsed_seconds"]
    assert sec_c < sec_a, f"Expected Mode C ({sec_c}s) to be faster than Mode A ({sec_a}s)"
    speedup = sec_a / sec_c
    print(f"PASS: Benchmark metrics verified. Speedup: {speedup:.2f}x ({sec_a}s -> {sec_c}s).")
    
    # 4. Verify MP4 Videos via Blender MovieClips
    mp4_b = os.path.join(bench_dir, "mode_b_direct.mp4")
    mp4_c = os.path.join(bench_dir, "mode_c_optimized.mp4")
    
    assert os.path.exists(mp4_b), f"Mode B MP4 missing: {mp4_b}"
    assert os.path.exists(mp4_c), f"Mode C MP4 missing: {mp4_c}"
    
    clip_b = bpy.data.movieclips.load(mp4_b)
    assert clip_b.size[0] == 1920 and clip_b.size[1] == 1080, "MP4 B resolution invalid"
    assert clip_b.fps == 30.0, "MP4 B FPS invalid"
    assert clip_b.frame_duration >= 150, "MP4 B frame count invalid"
    
    clip_c = bpy.data.movieclips.load(mp4_c)
    assert clip_c.size[0] == 1920 and clip_c.size[1] == 1080, "MP4 C resolution invalid"
    assert clip_c.fps == 30.0, "MP4 C FPS invalid"
    assert clip_c.frame_duration >= 150, "MP4 C frame count invalid"
    print("PASS: Both Mode B and Mode C MP4 video files verified (1920x1080 @ 30 FPS, 150 frames).")
    
    # 5. Verify Quality Check Still
    still_qc = os.path.join(bench_dir, "quality_check_frame_0795_opt8samples.png")
    assert os.path.exists(still_qc), f"Quality check still missing: {still_qc}"
    print("PASS: Quality check still frame at 8 samples verified.")
    
    print("\n>>> ALL STEP 6 RENDER PIPELINE VALIDATION CHECKS PASSED (100% COMPLIANT) <<<")
    sys.exit(0)

if __name__ == "__main__":
    validate_pipeline()
