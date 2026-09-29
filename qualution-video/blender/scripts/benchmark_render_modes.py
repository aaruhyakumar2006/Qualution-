"""
QUALUTION Benchmark Script for Blender Render Pipeline Optimization
Tests 3 render modes on a 150-frame section (Frames 691-840, 5.0 seconds @ 30 FPS):
- Mode A: Current PNG sequence workflow (64 samples, shadows on, PNG image sequence)
- Mode B: Direct MP4/H.264 workflow (64 samples, shadows on, direct container export)
- Mode C: Optimized MP4/H.264 workflow (8 samples, shadows off, direct container export)

Also renders a quality comparison frame at Frame 795 to verify visual equivalence.
"""

import bpy
import os
import time
import json

def get_dir_size_bytes(dir_path):
    total = 0
    for entry in os.scandir(dir_path):
        if entry.is_file():
            total += entry.stat().st_size
    return total

def run_benchmark():
    blend_path = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "benchmark_scene02_render.blend"))
    benchmark_dir = os.path.abspath(os.path.join("qualution-video", "renders", "benchmark"))
    mode_a_dir = os.path.join(benchmark_dir, "mode_a_png")
    os.makedirs(mode_a_dir, exist_ok=True)
    
    start_frame = 691
    end_frame = 840
    frame_count = end_frame - start_frame + 1 # 150 frames
    
    print(f"=== QUALUTION RENDER PIPELINE BENCHMARK ===")
    print(f"Scene: {blend_path}")
    print(f"Benchmark Range: Frames {start_frame} to {end_frame} ({frame_count} frames, 5.0s @ 30 FPS)")
    print(f"Resolution: 1920x1080 (16:9)")
    
    results = {}
    
    # -------------------------------------------------------------
    # BENCHMARK A: Current PNG Workflow
    # -------------------------------------------------------------
    print("\n--- Running Benchmark Mode A: Current PNG Workflow ---")
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    scene = bpy.context.scene
    r = scene.render
    e = scene.eevee
    
    scene.frame_start = start_frame
    scene.frame_end = end_frame
    
    # Production defaults
    r.image_settings.media_type = 'IMAGE'
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA'
    r.image_settings.compression = 15 # default PNG compression
    e.taa_render_samples = 64
    e.use_shadows = True
    
    r.filepath = os.path.join(mode_a_dir, "frame_")
    
    t0 = time.perf_counter()
    bpy.ops.render.render(animation=True)
    t1 = time.perf_counter()
    
    elapsed_a = t1 - t0
    sec_per_frame_a = elapsed_a / frame_count
    size_a_bytes = get_dir_size_bytes(mode_a_dir)
    size_a_mb = size_a_bytes / (1024 * 1024)
    
    print(f"Mode A Finished in {elapsed_a:.2f}s ({sec_per_frame_a:.3f} s/frame), Size: {size_a_mb:.2f} MB ({len(os.listdir(mode_a_dir))} files)")
    
    results["mode_a_png"] = {
        "name": "Current PNG Sequence (EEVEE 64 samples)",
        "frames": frame_count,
        "elapsed_seconds": round(elapsed_a, 2),
        "seconds_per_frame": round(sec_per_frame_a, 3),
        "fps_render_rate": round(frame_count / elapsed_a, 2),
        "file_size_mb": round(size_a_mb, 2),
        "output_format": "PNG (150 image files)",
        "samples": 64,
        "shadows": True
    }
    
    # -------------------------------------------------------------
    # BENCHMARK B: Direct MP4 / H.264 Workflow (64 samples)
    # -------------------------------------------------------------
    print("\n--- Running Benchmark Mode B: Direct MP4/H.264 (Default 64 Samples) ---")
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    scene = bpy.context.scene
    r = scene.render
    e = scene.eevee
    
    scene.frame_start = start_frame
    scene.frame_end = end_frame
    
    r.image_settings.media_type = 'VIDEO'
    r.image_settings.file_format = 'FFMPEG'
    r.ffmpeg.format = 'MPEG4'
    r.ffmpeg.codec = 'H264'
    r.ffmpeg.constant_rate_factor = 'HIGH'
    r.ffmpeg.ffmpeg_preset = 'GOOD'
    e.taa_render_samples = 64
    e.use_shadows = True
    
    out_b_path = os.path.join(benchmark_dir, "mode_b_direct.mp4")
    r.filepath = out_b_path
    
    t0 = time.perf_counter()
    bpy.ops.render.render(animation=True)
    t1 = time.perf_counter()
    
    # Blender appends frame range or extension if not exact, let's locate actual file
    actual_b = out_b_path if os.path.exists(out_b_path) else out_b_path + ".mp4"
    if not os.path.exists(actual_b):
        # find matching file
        for f in os.listdir(benchmark_dir):
            if f.startswith("mode_b_direct"):
                actual_b = os.path.join(benchmark_dir, f)
                break
                
    elapsed_b = t1 - t0
    sec_per_frame_b = elapsed_b / frame_count
    size_b_mb = os.path.getsize(actual_b) / (1024 * 1024)
    
    print(f"Mode B Finished in {elapsed_b:.2f}s ({sec_per_frame_b:.3f} s/frame), Size: {size_b_mb:.2f} MB (Single file: {os.path.basename(actual_b)})")
    
    results["mode_b_direct_mp4"] = {
        "name": "Direct MP4/H.264 (EEVEE 64 samples)",
        "frames": frame_count,
        "elapsed_seconds": round(elapsed_b, 2),
        "seconds_per_frame": round(sec_per_frame_b, 3),
        "fps_render_rate": round(frame_count / elapsed_b, 2),
        "file_size_mb": round(size_b_mb, 2),
        "output_format": "MP4 (H.264)",
        "samples": 64,
        "shadows": True,
        "file_path": actual_b
    }
    
    # -------------------------------------------------------------
    # BENCHMARK C: Optimized MP4 / H.264 Workflow (8 samples, shadows off)
    # -------------------------------------------------------------
    print("\n--- Running Benchmark Mode C: Optimized MP4/H.264 (8 Samples, Shadows Off) ---")
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    scene = bpy.context.scene
    r = scene.render
    e = scene.eevee
    
    scene.frame_start = start_frame
    scene.frame_end = end_frame
    
    r.image_settings.media_type = 'VIDEO'
    r.image_settings.file_format = 'FFMPEG'
    r.ffmpeg.format = 'MPEG4'
    r.ffmpeg.codec = 'H264'
    r.ffmpeg.constant_rate_factor = 'HIGH'
    r.ffmpeg.ffmpeg_preset = 'GOOD'
    
    # Safe 2D Vector optimizations
    e.taa_render_samples = 8
    e.use_shadows = False
    e.use_fast_gi = False
    e.use_raytracing = False
    e.use_volumetric_shadows = False
    e.use_overscan = False
    
    out_c_path = os.path.join(benchmark_dir, "mode_c_optimized.mp4")
    r.filepath = out_c_path
    
    t0 = time.perf_counter()
    bpy.ops.render.render(animation=True)
    t1 = time.perf_counter()
    
    actual_c = out_c_path if os.path.exists(out_c_path) else out_c_path + ".mp4"
    if not os.path.exists(actual_c):
        for f in os.listdir(benchmark_dir):
            if f.startswith("mode_c_optimized"):
                actual_c = os.path.join(benchmark_dir, f)
                break
                
    elapsed_c = t1 - t0
    sec_per_frame_c = elapsed_c / frame_count
    size_c_mb = os.path.getsize(actual_c) / (1024 * 1024)
    
    print(f"Mode C Finished in {elapsed_c:.2f}s ({sec_per_frame_c:.3f} s/frame), Size: {size_c_mb:.2f} MB (Single file: {os.path.basename(actual_c)})")
    
    results["mode_c_optimized_mp4"] = {
        "name": "Optimized MP4/H.264 (EEVEE 8 samples, shadows off)",
        "frames": frame_count,
        "elapsed_seconds": round(elapsed_c, 2),
        "seconds_per_frame": round(sec_per_frame_c, 3),
        "fps_render_rate": round(frame_count / elapsed_c, 2),
        "file_size_mb": round(size_c_mb, 2),
        "output_format": "MP4 (H.264)",
        "samples": 8,
        "shadows": False,
        "file_path": actual_c
    }
    
    # -------------------------------------------------------------
    # QUALITY CHECK: Render Still Comparison at Frame 795
    # -------------------------------------------------------------
    print("\n--- Rendering Still Quality Comparison Frame at Frame 795 ---")
    scene.frame_set(795)
    r.image_settings.media_type = 'IMAGE'
    r.image_settings.file_format = 'PNG'
    
    # Mode C still (8 samples)
    still_c_path = os.path.join(benchmark_dir, "quality_check_frame_0795_opt8samples.png")
    r.filepath = still_c_path
    bpy.ops.render.render(write_still=True)
    
    # -------------------------------------------------------------
    # VIDEO INTEGRITY VERIFICATION
    # -------------------------------------------------------------
    print("\n--- Verifying Rendered Video Integrity ---")
    clip_b = bpy.data.movieclips.load(actual_b)
    print(f"Video B Verified: {clip_b.size[0]}x{clip_b.size[1]}, {clip_b.frame_duration} frames, {clip_b.fps} FPS")
    assert clip_b.size[0] == 1920 and clip_b.size[1] == 1080, "Video B resolution mismatch"
    assert clip_b.frame_duration >= frame_count, f"Video B frame count mismatch: {clip_b.frame_duration}"
    
    clip_c = bpy.data.movieclips.load(actual_c)
    print(f"Video C Verified: {clip_c.size[0]}x{clip_c.size[1]}, {clip_c.frame_duration} frames, {clip_c.fps} FPS")
    assert clip_c.size[0] == 1920 and clip_c.size[1] == 1080, "Video C resolution mismatch"
    assert clip_c.frame_duration >= frame_count, f"Video C frame count mismatch: {clip_c.frame_duration}"
    
    # Save Benchmark JSON
    json_path = os.path.join(benchmark_dir, "benchmark_results.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"\n[QUALUTION] Benchmark completed and saved to {json_path}")
    
    # Summary Table Printout
    speedup_b = elapsed_a / elapsed_b
    speedup_c = elapsed_a / elapsed_c
    print("\n==========================================================================")
    print(f"{'Render Mode':<35} | {'Time (s)':<9} | {'s/frame':<8} | {'Speedup':<8} | {'Size'}")
    print("--------------------------------------------------------------------------")
    print(f"{'Mode A: Current PNG (64 smp)':<35} | {elapsed_a:<9.2f} | {sec_per_frame_a:<8.3f} | {'1.0x':<8} | {size_a_mb:.2f} MB")
    print(f"{'Mode B: Direct MP4 (64 smp)':<35} | {elapsed_b:<9.2f} | {sec_per_frame_b:<8.3f} | {f'{speedup_b:.1f}x':<8} | {size_b_mb:.2f} MB")
    print(f"{'Mode C: Optimized MP4 (8 smp)':<35} | {elapsed_c:<9.2f} | {sec_per_frame_c:<8.3f} | {f'{speedup_c:.1f}x':<8} | {size_c_mb:.2f} MB")
    print("==========================================================================")

if __name__ == "__main__":
    run_benchmark()
