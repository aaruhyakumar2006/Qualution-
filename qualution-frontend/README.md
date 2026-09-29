# Qualution Frontend

Professional Quantum Learning &amp; Integrated Development Environment (IDE) built with **React**, **TypeScript**, and **Vite**.

Qualution connects to the **Qualution FastAPI Backend** to simulate quantum circuits on **Qiskit Aer** and **PennyLane**, providing real-time drag-and-drop circuit composition, bidirectional source code synchronization, exact statevector analysis, 3D Bloch sphere projections, educational gate-by-gate timeline inspection, and an interactive deterministic learning engine.

---

## 🚀 Features (Step 20 Interactive Learning Layer)

* **Interactive Learning Panel (`Learn` Tab):**
  * **Gate Knowledge Engine:** Structured educational definitions, mathematical state mapping ($|0\rangle \to \frac{|0\rangle+|1\rangle}{\sqrt{2}}$), matrix representations, Bloch sphere effects, and real-world algorithm uses for all 12 canonical gates (`H`, `X`, `Y`, `Z`, `S`, `T`, `Rx`, `Ry`, `Rz`, `CX`, `CZ`, `SWAP`).
  * **Selected Gate Inspector:** Clicking any gate on the canvas displays its specific role, target qubits, rotation angle in terms of $\pi$, and direct shortcuts to inspect on the **Bloch Sphere** or **Timeline**.
  * **Concept Inference:** Automatically derives quantum concepts from the circuit (e.g. *Superposition*, *Entanglement*, *Continuous Rotations*, *Quantum Phase*, *Wavefunction Collapse*).
  * **Circuit Pattern Recognition:** Detects landmark quantum architectures such as **Bell State ($|\Phi^+\rangle$)**, **GHZ State**, and single-qubit superpositions with detailed educational descriptions.
  * **Beginner & Technical Modes:** Switch between intuitive conceptual explanations and rigorous matrix/Hamiltonian transformations.
  * **Interactive Practice Quiz:** Deterministic circuit-derived multiple-choice questions with instant feedback, hints, and mathematical explanations.
* **Quantum Visualization Dashboard:**
  * **Results:** Sorted measurement basis probabilities ($|00\rangle, |11\rangle$) with shot counts and execution latency.
  * **State:** Exact complex statevector amplitudes ($\alpha_i = a + bi$), normalization checks ($\sum |\alpha_i|^2 = 1.000000$), and magnitude vs. probability comparisons ($|\alpha|$ vs. $|\alpha|^2$).
  * **Bloch Sphere:** Interactive 3D SVG isometric projection of single-qubit pure states.
  * **Timeline:** Step-by-step gate execution stepper with Previous/Next controls and state inspection at every gate.
  * **Metrics:** Detailed circuit structure breakdown, 2-qubit gate ratio, depth, and theoretical statevector memory footprint warnings for large circuits.
* **Single Source of Truth (Qualution Circuit IR):**
  * Both the Visual Circuit Grid and Monaco Code Editor interface with the central framework-independent Circuit IR.
* **Bidirectional Code Sync:**
  * Canvas $\to$ Code auto-generation for Qiskit and PennyLane.
  * Code $\to$ Canvas AST parsing via `POST /api/v1/codeparse/{framework}` with diff conflict preview modal.

---

## 📁 Project Structure

```text
qualution-frontend/
├── src/
│   ├── api/
│   │   ├── client.ts                # Typed fetch wrapper with JSON error handling
│   │   ├── circuitApi.ts            # API endpoints (/circuits/run, /codeparse/{framework}, /ready, /backends)
│   │   └── circuitApi.test.ts       # API client unit tests
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx           # Navigation, backend selector, Run button
│   │   │   ├── Header.css
│   │   │   ├── Sidebar.tsx          # 12 draggable gates palette
│   │   │   ├── Sidebar.css
│   │   │   ├── BottomPanel.tsx      # Live metrics & status bar
│   │   │   └── BottomPanel.css
│   │   │
│   │   ├── circuit/
│   │   │   ├── CircuitCanvas.tsx    # Interactive quantum grid canvas & drop slots
│   │   │   ├── CircuitCanvas.css
│   │   │   ├── RotationModal.tsx    # Angle dialog for Rx, Ry, Rz
│   │   │   ├── RotationModal.css
│   │   │   ├── TwoQubitTargetModal.tsx # Target selection for CX, CZ, SWAP
│   │   │   └── TwoQubitTargetModal.css
│   │   │
│   │   ├── code/
│   │   │   ├── CodeEditor.tsx       # Monaco Editor with framework switch & Sync button
│   │   │   ├── CodeEditor.css
│   │   │   ├── SyncConflictModal.tsx # Conflict resolution dialog
│   │   │   └── SyncConflictModal.css
│   │   │
│   │   └── visualization/
│   │       ├── VisualizationPanel.tsx # 6-tab dashboard (Results, State, Bloch, Timeline, Metrics, Learn)
│   │       ├── VisualizationPanel.css
│   │       ├── ProbabilityHistogram.tsx # Basis state probability distribution chart
│   │       ├── ProbabilityHistogram.css
│   │       ├── StatevectorView.tsx   # Complex amplitudes & normalization display
│   │       ├── StatevectorView.css
│   │       ├── BlochSphere.tsx       # 3D isometric SVG Bloch sphere
│   │       ├── BlochSphere.css
│   │       ├── TimelineView.tsx      # Step-by-step gate progression stepper
│   │       ├── TimelineView.css
│   │       ├── MetricsView.tsx       # Structural metrics & memory scaling
│   │       ├── MetricsView.css
│   │       ├── LearningPanel.tsx     # Interactive learning & quiz panel
│   │       └── LearningPanel.css
│   │
│   ├── features/
│   │   ├── circuit/
│   │   │   ├── types.ts             # Framework-independent circuit & response models
│   │   │   ├── state.ts             # Default state, sanitizers, and frontend metric helpers
│   │   │   ├── codegen.ts           # Deterministic Qiskit & PennyLane code generators
│   │   │   └── codegen.test.ts      # Code generation unit tests
│   │   │
│   │   └── learning/
│   │       ├── learningTypes.ts     # Models for gate knowledge, explanations, practice
│   │       ├── gateKnowledge.ts     # Metadata & math for all 12 supported gates
│   │       ├── explanationEngine.ts # Concept inference, pattern recognition, quizzes
│   │       └── explanationEngine.test.ts # Learning engine unit tests
│   │
│   ├── pages/
│   │   ├── IDEPage.tsx              # Main IDE orchestration page
│   │   └── IDEPage.css
│   │
│   ├── test/
│   │   └── setup.ts                 # Vitest testing setup
│   │
│   ├── App.tsx                      # Root component
│   ├── App.test.tsx                 # Integration test suite (25 tests total across files)
│   ├── main.tsx                     # Vite entry point
│   └── index.css                    # Design tokens & global dark theme
│
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### 1. Start the Qualution Backend (Terminal 1)

```powershell
cd "D:\DELUSION AI\qualution-backend"
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

### 2. Start the Frontend (Terminal 2)

```powershell
cd "D:\DELUSION AI\qualution-frontend"
npm run dev
```

Frontend runs at `http://localhost:5173`.

---

## 🧪 Testing & Build

Run frontend tests:

```powershell
npm run test
```

Run frontend production build:

```powershell
npm run build
```
