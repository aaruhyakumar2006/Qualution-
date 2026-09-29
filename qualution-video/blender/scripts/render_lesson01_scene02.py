"""
Render Script for QUALUTION Lesson 1 Scene 2 (What Is a Classical Bit?)
Outputs:
1. 5 representative storyboard still frames under qualution-video/renders/lesson01/scene02/
2. Full 720-frame animation sequence (541-1260) under qualution-video/renders/lesson01/scene02/frames/
"""

import bpy
import os
import sys

def render_scene02():
    scene_path = os.path.abspath(os.path.join("qualution-video", "blender", "scenes", "lesson01_scene02_classical_bit.blend"))
    output_dir = os.path.abspath(os.path.join("qualution-video", "renders", "lesson01", "scene02"))
    frames_dir = os.path.join(output_dir, "frames")
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(frames_dir, exist_ok=True)
    
    print(f"Loading scene: {scene_path}")
    bpy.ops.wm.open_mainfile(filepath=scene_path)
    scene = bpy.context.scene
    
    # 1. Render 5 Representative Still Frames
    still_frames = [615, 795, 960, 1125, 1220]
    print("\n--- Rendering 5 Representative Still Frames ---")
    for f in still_frames:
        scene.frame_set(f)
        out_file = os.path.join(output_dir, f"lesson01_scene02_classical_bit_{f:04d}.png")
        scene.render.filepath = out_file
        print(f"Rendering still frame {f} -> {out_file}")
        bpy.ops.render.render(write_still=True)
        assert os.path.exists(out_file), f"Failed to save still render at {out_file}"
        
    print("\n--- Successfully rendered all 5 still frames! ---")
    
    # 2. Render Full Animation Sequence (Frames 541 - 1260)
    print(f"\n--- Rendering Full Animation Sequence (Frames {scene.frame_start} to {scene.frame_end}) ---")
    scene.render.filepath = os.path.join(frames_dir, "scene02_bit_")
    bpy.ops.render.render(animation=True)
    
    rendered_frames = [f for f in os.listdir(frames_dir) if f.endswith(".png")]
    print(f"\n[QUALUTION] Successfully rendered full sequence: {len(rendered_frames)} frames in {frames_dir}")

if __name__ == "__main__":
    render_scene02()
