# QUALUTION Theoretical Educational Video Production Pipeline

This directory houses the offline media production pipeline for QUALUTION's theoretical educational video lessons.

---

## 1. Purpose & Architecture Principles

- **Offline Content Production**: This directory is dedicated exclusively to theoretical educational video creation and animation assets.
- **Blender as Production Tool**: Blender (along with Python scripting) serves strictly as an offline content-production tool, not an in-browser runtime engine.
- **Lightweight Web Delivery**: Final learner-facing assets will eventually be exported as optimized, web-compatible media formats (e.g., MP4/WebM/H.264) to ensure fast load times and universal browser compatibility.
- **Independence from App Source**: This production workspace is completely decoupled from the frontend React/TypeScript application (`qualution-frontend`) and backend Python services (`qualution-backend`).

---

## 2. Target Curriculum & Reference Aesthetics

- **First Production Target**: Sprint 1 — Quantum Foundations theoretical curriculum (11 lessons).
- **Reference Visual Style**: Clean, modern, professional 2D educational and vector explainer animations adhering to deep space / IBM Quantum design aesthetics (crisp vector linework, clean mathematical typography, glowing energy accents, and uncluttered pedagogical motion).
- **Target Video Duration**:
  - **Minimum**: 2–3 minutes
  - **Target (Standard)**: ~4 minutes
  - **Maximum**: 5–7 minutes

---

## 3. Directory Structure

```
qualution-video/
├── README.md             # Pipeline documentation and guidelines
├── assets/               # Reusable 2D/vector graphic assets & artwork
│   ├── backgrounds/      # Background grids, gradient plates, and particle fields
│   ├── quantum/          # Vector qubit states, Bloch sphere diagrams, wavepackets, gate symbols
│   ├── characters/       # Pedagogical presenter / avatar illustration assets
│   ├── icons/            # UI icons, checkmarks, badges, and schematic symbols
│   └── typography/       # Title cards, lower thirds, equation plates, and callouts
├── lessons/              # Lesson-specific animation storyboards, scripts & project files
│   └── sprint-01/        # Sprint 1 (Lessons 01 to 11) animation projects
├── blender/              # Blender workspace, Python automation scripts & reusable setups
│   ├── templates/        # Reusable starter .blend files, camera rigs, and lighting presets
│   ├── scenes/           # Shot-by-shot or scene-by-scene Blender project files
│   └── scripts/          # Python automation scripts for procedural rendering & asset generation
├── audio/                # Voiceover narration tracks, ambient cues, and audio stems
├── renders/              # Raw rendered animation image sequences & intermediate video passes
└── exports/              # Final compressed, web-optimized video deliveries
```
