import asyncio
import json
import os
import re
import edge_tts

VOICE = "en-US-ChristopherNeural"
SCRIPT_PATH = "script.json"
AUDIO_DIR = "audio"

def clean_tts_text(text: str) -> str:
    # Replace [pause] with punctuation pause
    text = re.sub(r'\[pause\]', '... ', text, flags=re.IGNORECASE)
    # Remove any other [stage direction]
    text = re.sub(r'\[.*?\]', '', text)
    # Normalize spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

async def generate_scene_audio(scene_id: str, text: str, output_path: str):
    clean_text = clean_tts_text(text)
    print(f"Generating audio for {scene_id}: \"{clean_text[:60]}...\"")
    communicate = edge_tts.Communicate(clean_text, voice=VOICE)
    await communicate.save(output_path)

async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    with open(SCRIPT_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    total_audio_bytes = 0
    report = []

    for scene in data.get("scenes", []):
        scene_id = scene["scene_id"]
        narration = scene.get("tts_narration") or scene.get("speech")
        out_filename = f"{scene_id}.mp3"
        out_rel_path = f"{AUDIO_DIR}/{out_filename}"

        await generate_scene_audio(scene_id, narration, out_rel_path)

        file_size = os.path.getsize(out_rel_path)
        total_audio_bytes += file_size
        scene["audio_path"] = out_rel_path

        report.append({
            "scene_id": scene_id,
            "duration_ms": scene["duration_ms"],
            "file": out_rel_path,
            "bytes": file_size,
            "kb": round(file_size / 1024, 2)
        })

    data["pipeline"]["audio"] = "completed"

    with open(SCRIPT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("\n" + "="*50)
    print("AUDIO GENERATION REPORT (48 kbps CBR Mono MP3)")
    print("="*50)
    for r in report:
        print(f"  {r['scene_id']} ({r['duration_ms']/1000:4.1f}s): {r['kb']:6.2f} KB  ({r['bytes']:,} bytes) -> {r['file']}")
    print("-" * 50)
    print(f"Total Audio Size: {total_audio_bytes / 1024:.2f} KB ({total_audio_bytes:,} bytes)")
    json_size = os.path.getsize(SCRIPT_PATH)
    print(f"Script JSON Size: {json_size / 1024:.2f} KB ({json_size:,} bytes)")
    print(f"Combined Payload: {(total_audio_bytes + json_size) / 1024:.2f} KB")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(main())
