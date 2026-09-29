"""
Comprehensive Validator for all Sprint 1 Video Specs (Lessons 01 to 11)
Checks:
- File existence: scene-spec.json, narration.md, storyboard.md
- Valid JSON schema compliance
- Continuous frame progression (startFrame, endFrame)
- Target duration matching sum of scene durations (between 120s and 420s)
- Required scene keys
- Learning objectives and curriculum boundaries
"""

import json
import os
import sys

def validate_all():
    base_dir = os.path.abspath(os.path.join("qualution-video", "lessons", "sprint-01"))
    lessons = sorted([d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d)) and d.startswith("lesson")])
    
    print(f"=== VALIDATING ALL {len(lessons)} SPRINT 1 LESSON SPECIFICATIONS ===")
    assert len(lessons) == 11, f"Expected 11 lesson directories, found {len(lessons)}"
    
    total_curriculum_duration = 0
    total_scenes_count = 0
    
    for l_folder in lessons:
        lesson_path = os.path.join(base_dir, l_folder)
        spec_path = os.path.join(lesson_path, "scene-spec.json")
        narr_path = os.path.join(lesson_path, "narration.md")
        story_path = os.path.join(lesson_path, "storyboard.md")
        
        for p, name in [(spec_path, "scene-spec.json"), (narr_path, "narration.md"), (story_path, "storyboard.md")]:
            if not os.path.exists(p):
                print(f"FAIL [{l_folder}]: Missing {name}")
                sys.exit(1)
                
        with open(spec_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        target_duration = data["targetDurationSeconds"]
        fps = data.get("fps", 30)
        scenes = data.get("scenes", [])
        
        assert len(scenes) >= 6, f"[{l_folder}] Expected at least 6 scenes, got {len(scenes)}"
        
        current_frame = 1
        calc_seconds = 0
        
        for idx, s in enumerate(scenes):
            dur = s["durationSeconds"]
            calc_seconds += dur
            start_f = s["startFrame"]
            end_f = s["endFrame"]
            
            assert start_f == current_frame, f"[{l_folder}] Scene {s['id']} startFrame {start_f} != {current_frame}"
            expected_end = start_f + int(dur * fps) - 1
            assert end_f == expected_end, f"[{l_folder}] Scene {s['id']} endFrame {end_f} != {expected_end}"
            current_frame = end_f + 1
            
            # Check required keys
            for k in ["id", "title", "narration", "captions", "onScreenText", "visualElements", "animationActions", "assetsRequired", "educationalPurpose", "transitionOut"]:
                assert k in s, f"[{l_folder}] Scene {s['id']} missing key: {k}"
                
            # Check narration and captions
            assert len(s["narration"]["text"]) > 10, f"[{l_folder}] Scene {s['id']} narration text too short"
            assert len(s["captions"]) >= 1, f"[{l_folder}] Scene {s['id']} has no captions"
            
        assert calc_seconds == target_duration, f"[{l_folder}] calc_seconds {calc_seconds} != {target_duration}"
        assert 120 <= calc_seconds <= 420, f"[{l_folder}] duration {calc_seconds}s outside 2-7 min bounds"
        
        # Check objectives and boundaries
        assert len(data.get("learningObjectives", [])) >= 5
        assert "topicsCovered" in data.get("curriculumBoundaries", {})
        
        total_curriculum_duration += calc_seconds
        total_scenes_count += len(scenes)
        print(f"PASS [{l_folder}]: {data['lessonTitle']} — {calc_seconds}s ({calc_seconds/60:.2f} mins, {len(scenes)} scenes)")
        
    mins = total_curriculum_duration / 60
    print(f"\n==================================================================")
    print(f"ALL 11 SPRINT 1 VIDEO SPECS VALIDATED (100% COMPLIANT)!")
    print(f"Total Video Curriculum: {total_curriculum_duration}s (~{mins:.1f} minutes of educational content)")
    print(f"Total Scenes Across All Lessons: {total_scenes_count}")
    print(f"==================================================================")
    return True

if __name__ == "__main__":
    if validate_all():
        sys.exit(0)
    sys.exit(1)
