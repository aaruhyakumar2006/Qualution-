"""
QUALUTION Video Assembly Script: Lesson 1 Demo (Bits to Qubits)
Combines:
- Scene 1: The Hook (Frames 1-540, 18.0s @ 30 FPS)
- Scene 2: What Is a Classical Bit? (Frames 541-1260, 24.0s @ 30 FPS)
Total: 1260 frames @ 30 FPS = 42.0 seconds exactly

Outputs:
1. Production Export: qualution-video/exports/lesson01_demo_bits_to_qubits.mp4
2. Frontend Public Video: qualution-frontend/public/videos/lesson01_demo_bits_to_qubits.mp4
3. Frontend Poster Image: qualution-frontend/public/videos/lesson01_demo_bits_to_qubits_poster.png
"""

import bpy
import os
import shutil
import time

def assemble_demo_video():
    print("=== ASSEMBLING LESSON 1 DEMO VIDEO (42 SECONDS) ===")
    
    # 1. Reset to empty scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.name = "Lesson01_Demo_Assembly"
    
    # 2. Render Settings (1920x1080 @ 30 FPS, Frames 1-1260 = 42.0s)
    render = scene.render
    render.resolution_x = 1920
    render.resolution_y = 1080
    render.resolution_percentage = 100
    render.fps = 30
    render.fps_base = 1.0
    
    scene.frame_start = 1
    scene.frame_end = 1260
    scene.frame_current = 1
    
    # Color management
    scene.display_settings.display_device = 'sRGB'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    
    # Direct FFmpeg MP4 / H.264 Export
    render.image_settings.media_type = 'VIDEO'
    render.image_settings.file_format = 'FFMPEG'
    render.ffmpeg.format = 'MPEG4'
    render.ffmpeg.codec = 'H264'
    render.ffmpeg.constant_rate_factor = 'HIGH'  # Optimal web quality (~CRF 18-20)
    render.ffmpeg.ffmpeg_preset = 'GOOD'
    
    export_dir = os.path.abspath(os.path.join("qualution-video", "exports"))
    os.makedirs(export_dir, exist_ok=True)
    mp4_path = os.path.join(export_dir, "lesson01_demo_bits_to_qubits.mp4")
    render.filepath = mp4_path
    
    # 3. Sequence Editor Setup
    se = scene.sequence_editor_create()
    
    s1_frames_dir = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01", "frames"))
    s2_frames_dir = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01", "scene02", "frames"))
    
    assert os.path.exists(s1_frames_dir), f"Scene 1 frames missing: {s1_frames_dir}"
    assert os.path.exists(s2_frames_dir), f"Scene 2 frames missing: {s2_frames_dir}"
    
    s1_files = sorted([f for f in os.listdir(s1_frames_dir) if f.startswith("scene01_hook_") and f.endswith(".png")])
    s2_files = sorted([f for f in os.listdir(s2_frames_dir) if f.startswith("scene02_bit_") and f.endswith(".png")])
    
    assert len(s1_files) == 540, f"Expected 540 frames for Scene 1, found {len(s1_files)}"
    assert len(s2_files) == 720, f"Expected 720 frames for Scene 2, found {len(s2_files)}"
    
    print(f"Adding Strip 1 (Scene 1 Hook): {len(s1_files)} frames (Fr 1 - 540)")
    strip1 = se.strips.new_image(
        name="Scene01_TheHook",
        filepath=os.path.join(s1_frames_dir, s1_files[0]),
        channel=1,
        frame_start=1
    )
    for fname in s1_files[1:]:
        strip1.elements.append(fname)
        
    print(f"Adding Strip 2 (Scene 2 Classical Bit): {len(s2_files)} frames (Fr 541 - 1260)")
    strip2 = se.strips.new_image(
        name="Scene02_ClassicalBit",
        filepath=os.path.join(s2_frames_dir, s2_files[0]),
        channel=1,
        frame_start=541
    )
    for fname in s2_files[1:]:
        strip2.elements.append(fname)
        
    print(f"\n--- Encoding 42-Second Video: {mp4_path} ---")
    t0 = time.perf_counter()
    bpy.ops.render.render(animation=True)
    t1 = time.perf_counter()
    
    actual_mp4 = mp4_path if os.path.exists(mp4_path) else mp4_path + ".mp4"
    if not os.path.exists(actual_mp4):
        for f in os.listdir(export_dir):
            if f.startswith("lesson01_demo_bits_to_qubits") and f.endswith(".mp4"):
                actual_mp4 = os.path.join(export_dir, f)
                break
                
    file_size_mb = os.path.getsize(actual_mp4) / (1024 * 1024)
    elapsed = t1 - t0
    print(f"Render Complete in {elapsed:.2f}s! File size: {file_size_mb:.2f} MB")
    
    # 4. Copy to Frontend Public Assets
    frontend_videos_dir = os.path.abspath(os.path.join("qualution-frontend", "public", "videos"))
    os.makedirs(frontend_videos_dir, exist_ok=True)
    frontend_mp4_path = os.path.join(frontend_videos_dir, "lesson01_demo_bits_to_qubits.mp4")
    shutil.copyfile(actual_mp4, frontend_mp4_path)
    print(f"Copied MP4 to frontend: {frontend_mp4_path}")
    
    # 5. Generate and Copy Poster Image
    poster_src = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01", "scene02", "lesson01_scene02_classical_bit_0795.png"))
    poster_dst = os.path.join(frontend_videos_dir, "lesson01_demo_bits_to_qubits_poster.png")
    shutil.copyfile(poster_src, poster_dst)
    print(f"Copied Poster to frontend: {poster_dst}")
    
    # 6. Verify Integrity
    clip = bpy.data.movieclips.load(actual_mp4)
    print("\n--- Output Verification ---")
    print(f"Resolution: {clip.size[0]} x {clip.size[1]}")
    print(f"Frame Count: {clip.frame_duration} frames")
    print(f"Frame Rate: {clip.fps} FPS")
    print(f"Duration: {clip.frame_duration / clip.fps:.1f} seconds")
    
    assert clip.size[0] == 1920 and clip.size[1] == 1080, "Resolution mismatch"
    assert clip.fps == 30.0, "FPS mismatch"
    assert clip.frame_duration >= 1260, f"Expected 1260 frames, got {clip.frame_duration}"
    
    print("\n>>> LESSON 1 DEMO VIDEO ASSEMBLY SUCCESSFUL <<<")

if __name__ == "__main__":
    assemble_demo_video()
