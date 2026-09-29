# Qualution — AI-Powered Interactive Quantum Computing Platform

A unified full-stack monorepo featuring interactive quantum circuit simulation, theoretical and visual pedagogy, AI tutoring, and offline animation pipelines.

---

## 📁 Unified Repository Structure

```
d:/exclusive/qualution/
├── qualution-frontend/          # React 19 + TypeScript + Vite interactive quantum IDE & learning academy
├── qualution-backend/           # FastAPI backend (Qiskit, Aer MPS, Cirq, PennyLane, NVIDIA NIM AI)
├── qualution-remotion/          # Remotion-based programmatic quantum video animations
├── qualution-video/             # Blender offline 2D/3D physics & theory video production pipeline
├── lesson-classical-vs-qubit/   # Standalone Anime.js + KaTeX interactive lesson player engine
├── package.json                 # Monorepo root workspace scripts
├── pyproject.toml               # Python workspace configuration
└── pyrefly.json                 # Python type analysis & interpreter configuration
```

---

## 🚀 Quick Start

### 1. Frontend Development Server
```bash
npm run dev
# or
npm run dev:frontend
```
Runs the Vite development server for `qualution-frontend`.

### 2. Backend API Server
```bash
npm run dev:backend
```
Launches the FastAPI backend on `http://127.0.0.1:8000` with auto-reload.

### 3. Running Backend Tests
```bash
npm run test:backend
```
Executes pytest across the full suite (285+ tests covering circuit simulation, MPS, NVIDIA provider, codegen, and routing).

### 4. Interactive Classical vs. Qubit Lesson
```bash
npm run dev:lesson      # Watch mode with Esbuild
npm run build:lesson    # Production bundle
```

---

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Monaco Editor, OGL (WebGL), KaTeX, Dexie (IndexedDB), Vitest
- **Backend**: Python 3.11, FastAPI, Uvicorn, Qiskit, Qiskit-Aer, Cirq, PennyLane, NumPy, Pytest
- **Video & Animation**: Remotion, Blender, Anime.js, Esbuild
