#!/usr/bin/env python3
import json
from pathlib import Path

def main():
    script_path = Path('script.json')
    with open(script_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    for idx, scene in enumerate(data['scenes']):
        num = f"{idx + 1:02d}"
        scene_file = Path(f"scenes/scene_{num}.html")
        if scene_file.exists():
            content = scene_file.read_text(encoding='utf-8')
            scene['html'] = content
            print(f"Loaded scene_{num}.html ({len(content)} chars)")
        else:
            print(f"Warning: {scene_file} not found")

    data['pipeline']['html'] = 'completed'

    with open(script_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print("Successfully updated script.json with all 7 scene HTMLs.")

if __name__ == '__main__':
    main()
