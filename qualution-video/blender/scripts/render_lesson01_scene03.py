"""
Render Script for QUALUTION Lesson 1 Scene 3: Introducing the Qubit
Outputs:
1. 5 representative still frames under qualution-video/renders/lesson01/scene03/
2. Complete 28-second direct MP4 video under qualution-video/renders/lesson01/scene03/lesson01_scene03_introducing_qubit.mp4
"""

import bpy
import os
import time

def render_scene03():
    blend_path = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene03_introducing_qubit.blend"))
    out_dir = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01", "scene03"))
    os.makedirs(out_dir, exist_ok=True)
    
    print(f"Loading scene: {blend_path}")
    bpy.ops.wm.open_mainfile(filepath=blend_path)
    scene = bpy.context.scene
    r = scene.render
    
    # 1. Render 5 Representative Still Frames
    still_frames = [1335, 1500, 1680, 1860, 2025]
    print("\n--- Rendering 5 Representative Still Frames ---")
    
    # Temporarily set to PNG for still frame export
    r.image_settings.media_type = 'IMAGE'
    r.image_settings.file_format = 'PNG'
    r.image_settings.color_mode = 'RGBA'
    
    for f in still_frames:
        scene.frame_set(f)
        still_out = os.path.join(out_dir, f"lesson01_scene03_introducing_qubit_{f:04d}.png")
        r.filepath = still_out
        print(f"Rendering still frame {f} -> {still_out}")
        bpy.ops.render.render(write_still=True)
        assert os.path.exists(still_out), f"Missing still at {still_out}"
        
    print("--- 5 Still Frames Rendered Successfully ---")
    
    # 2. Render Direct MP4 Video (Frames 1261 - 2100)
    print(f"\n--- Rendering Direct MP4 Video ({scene.frame_start} to {scene.frame_end}, 840 frames @ 30 FPS) ---")
    r.image_settings.media_type = 'VIDEO'
    r.image_settings.file_format = 'FFMPEG'
    r.ffmpeg.format = 'MPEG4'
    r.ffmpeg.codec = 'H264'
    r.ffmpeg.constant_rate_factor = 'HIGH'
    r.ffmpeg.ffmpeg_preset = 'GOOD'
    
    mp4_target = os.path.join(out_dir, "lesson01_scene03_introducing_qubit.mp4")
    r.filepath = mp4_target
    
    t0 = time.perf_counter()
    bpy.ops.render.render(animation=True)
    t1 = time.perf_counter()
    
    elapsed = t1 - t0
    frame_count = scene.frame_end - scene.frame_start + 1
    sec_per_frame = elapsed / frame_count
    
    # Locate output file (Blender may append extension or frame range)
    actual_mp4 = mp4_target if os.path.exists(mp4_target) else mp4_target + ".mp4"
    if not os.path.exists(actual_mp4):
        for fname in os.listdir(out_dir):
            if fname.startswith("lesson01_scene03_introducing_qubit") and fname.endswith(".mp4"):
                actual_mp4 = os.path.join(out_dir, fname)
                break
                
    file_size_mb = os.path.getsize(actual_mp4) / (1024 * 1024)
    print(f"\n[QUALUTION] Direct MP4 Render Completed:")
    print(f"  Output File: {actual_mp4}")
    print(f"  File Size: {file_size_mb:.2f} MB")
    print(f"  Elapsed Time: {elapsed:.2f} s ({sec_per_frame:.3f} s/frame, {frame_count/elapsed:.2f} FPS)")

if __name__ == "__main__":
    render_scene03()
