import urllib.request
import re
import json
import xml.etree.ElementTree as ET

url = 'https://www.youtube.com/watch?v=_cDIzwycANg'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
    
    m = re.search(r'"captionTracks":\s*(\[.*?\])', html)
    if m:
        tracks = json.loads(m.group(1))
        print(f"Found {len(tracks)} caption tracks")
        for t in tracks:
            print("Track:", t.get('name', {}).get('simpleText'), t.get('languageCode'))
            base_url = t.get('baseUrl')
            if base_url:
                sub_req = urllib.request.Request(base_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(sub_req, timeout=10) as sub_resp:
                    sub_xml = sub_resp.read().decode('utf-8', errors='ignore')
                print("Response length:", len(sub_xml), "Preview:", sub_xml[:200])
                root = ET.fromstring(sub_xml)
                lines = []
                for p in root.findall('.//text'):
                    start = p.attrib.get('start', '0')
                    dur = p.attrib.get('dur', '0')
                    text = p.text or ''
                    lines.append(f"[{float(start):.2f}s] {text}")
                print("\n".join(lines[:30]))
                with open("e:/SIH140-finals-winner-26/jinkichan/qualution-frontend/scratch/video_transcript.txt", "w", encoding="utf-8") as f:
                    f.write("\n".join(lines))
                print(f"Saved {len(lines)} lines of transcript to scratch/video_transcript.txt")
                break
    else:
        print("captionTracks not found in HTML")
except Exception as e:
    print("Error:", e)
