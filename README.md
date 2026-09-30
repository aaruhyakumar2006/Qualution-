<div align="center">
<img width="1024" height="572" alt="image" src="https://github.com/user-attachments/assets/303d62ca-144a-450f-a633-2e2f9eb00623" />


# ⚛️ QUALUTION

### Live-taught quantum learning, built on a real quantum workbench

**Learn the concept. Build the circuit. Predict the result. Execute the computation. Analyze the evidence. Prove mastery.**

*The AI explains. The quantum engine verifies.*

<br>

![Smart India Hackathon 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-orange?style=for-the-badge)
![Problem Statement](https://img.shields.io/badge/Problem%20Statement-26140-blue?style=for-the-badge)
![Team](https://img.shields.io/badge/Team-DADBODS-6f42c1?style=for-the-badge)

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![Qiskit](https://img.shields.io/badge/Qiskit-6929C4?logo=qiskit&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline%20ready-5A0FC8?logo=pwa&logoColor=white)

[Overview](#overview) · [Solution](#our-solution) · [Users](#users-and-roles) · [Features](#key-features) · [Architecture](#architecture) · [Benchmarks](#-benchmarks) · [Erwin](#erwin-socratic-ai-companion) · [Getting Started](#getting-started) · [Links](#links)

<br>



</div>

---

## At a glance

| ⚡ 2,000 qubits | 🧮 1,000 qubits | 📦 5 KB to 60 KB | 🔀 4 backends |
|:---:|:---:|:---:|:---:|
| MPS circuit, 1,000 shots in **574.72 ms**, under **10 MB** | Stabilizer circuit, tableau memory **3.82 MB** | Size of a full interactive lesson, so it works on low bandwidth | Statevector, Stabilizer, MPS and Cloud/QPU, chosen automatically |

---

## SIH Problem Statement

| | |
|---|---|
| **Problem Statement ID** | 26140 |
| **Title** | AI-Based Interactive Quantum Algorithm Learning Platform |
| **Theme** | Smart Education |
| **Category** | Software |


---

## Table of Contents

1. [Overview](#overview)
2. [The Problem](#the-problem)
3. [Our Solution](#our-solution)
4. [Users and Roles](#users-and-roles)
5. [The QUALUTION Learning Loop](#the-qualution-learning-loop)
6. [Key Features](#key-features)
7. [How We Are Different](#how-we-are-different)
8. [Architecture](#architecture)
9. [Adaptive Circuit Execution](#adaptive-circuit-execution)
10. [Benchmarks](#-benchmarks)
11. [JSON-Driven Live Teaching](#json-driven-live-teaching)
12. [Mario: Socratic AI Companion](#erwin-socratic-ai-companion)
13. [Assessment and Certification Flow](#assessment-and-certification-flow)
14. [Curriculum](#curriculum)
15. [Impact](#impact)
16. [Feasibility and Risk Mitigation](#feasibility-and-risk-mitigation)
17. [Project Status and Roadmap](#project-status-and-roadmap)
18. [Getting Started](#getting-started)
19. [Tech Stack](#tech-stack)
20. [Team](#team)
21. [Links](#links)
22. [References](#references)
23. [License](#license)

---

## Overview

Quantum computing is becoming an important computational paradigm, but it is hard to learn. Students face abstract mathematics, unfamiliar computational ideas, circuit-based reasoning, and specialised software, usually spread across separate lecture notes, simulators, and coding tools.

**QUALUTION unifies all of it.** It combines structured lessons, live teaching, a professional Quantum Workbench, multi-backend simulation, an AI tutor, assessments, a student and teacher LMS, and certification into one continuous environment.

---

## The Problem

| # | Challenge | What it looks like today |
|:-:|---|---|
| 1 | **High-complexity concepts** | Superposition, entanglement and interference are hard to grasp without seeing circuit behaviour. |
| 2 | **Theory and practice are separated** | Notes in one place, a simulator in another. Concept → circuit → execution → understanding is broken across tools. |
| 3 | **Static learning** | Videos and PDFs offer no continuous interaction, experimentation, or feedback. |
| 4 | **Limited hardware access** | Real QPUs are scarce, and local simulation gets exponentially expensive as qubits grow. |
| 5 | **Shallow feedback** | Automated grading says "wrong", but not which misconception caused it. |
| 6 | **Fragmented management** | Students lack learning paths and proof of mastery, and teachers lack visibility into progress. |

---

## Our Solution

QUALUTION answers each gap directly.

- 🎓 **Interactive, visual learning** that makes quantum behaviour observable.
- 🧪 **All-in-one Quantum Workbench** where theory, coding, simulation and assessment live together.
- 🔀 **Circuit-intelligent execution** that picks the right simulation strategy for each circuit.
- 🤖 **Misconception-aware AI (Erwin)** that diagnoses the root cause of an error through Socratic guidance.
- 📊 **Evidence-driven curriculum** that uses demonstrated reasoning to choose the learner's next activity.
- 🏫 **Student LMS, teacher analytics, and certification** that close the loop from learning to proof of mastery.

---

## Users and Roles

QUALUTION serves four kinds of users, each with their own view of the same platform.

```mermaid
flowchart LR
    S(["Student"])
    T(["Teacher"])
    P(["Industry professional"])
    I(["Institution admin"])

    subgraph QUAL["QUALUTION"]
        L["Interactive lessons"]
        W["Quantum Workbench"]
        E["Erwin AI tutor"]
        C["Challenges and XP"]
        A["Assessment and certification"]
        D["Teacher analytics dashboard"]
        M["LMS management"]
    end

    S --> L
    S --> W
    S --> E
    S --> C
    S --> A
    P --> W
    P --> E
    P --> A
    T --> D
    T --> L
    T --> C
    I --> M
    I --> D
```

### Student journey

```mermaid
flowchart TD
    A["Sign in"] --> B["Pick a track and module"]
    B --> C["Live lesson in the Workbench"]
    C --> D["Predict the outcome"]
    D --> E["Build and run the circuit"]
    E --> F{"Prediction correct?"}
    F -- "Yes" --> G["Practical challenge"]
    F -- "No" --> H["Erwin asks Socratic questions"]
    H --> I["Revise circuit and rerun"]
    I --> F
    G --> J{"Passed?"}
    J -- "No" --> K["Learner model picks a remedial activity"]
    K --> C
    J -- "Yes" --> L["XP earned and next module unlocked"]
    L --> M{"Track complete?"}
    M -- "No" --> B
    M -- "Yes" --> N["Certification"]
```

### Teacher flow

```mermaid
flowchart LR
    A["Create or pick a JSON lesson"] --> B["Assign to a class"]
    B --> C["Students learn and run circuits"]
    C --> D["Progress, scores and prediction accuracy collected"]
    D --> E["Teacher dashboard"]
    E --> F{"Class struggling on a concept?"}
    F -- "Yes" --> G["Adjust lesson or add a challenge"]
    G --> B
    F -- "No" --> H["Approve certification"]
```

---

## The QUALUTION Learning Loop

```mermaid
flowchart LR
    A["1 Learn<br/>Structured explanation"] --> B["2 Interact<br/>Visual, hands-on content"]
    B --> C["3 Predict<br/>Commit to an outcome"]
    C --> D["4 Build<br/>Construct the circuit"]
    D --> E["5 Execute<br/>Run on the right backend"]
    E --> F["6 Analyze<br/>States and measurements"]
    F --> G["7 Prove<br/>Challenge or assessment"]
    F -. "Prediction and result differ" .-> H{"Erwin asks why"}
    H -. "Learner revises prediction or circuit" .-> C
```

*Commit to a prediction first, then let the evidence decide.*

| Stage | What the learner does |
|---|---|
| **Learn** | Receives a structured explanation of a concept |
| **Interact** | Engages with visual teaching content instead of passive media |
| **Predict** | Commits to an expected outcome before running anything |
| **Build** | Constructs the circuit in the Workbench |
| **Execute** | Runs it on an appropriate backend |
| **Analyze** | Inspects states, probabilities and measurement results |
| **Prove** | Completes a practical challenge or assessment |

---

## Key Features

### 🧪 Quantum Workbench
Drag-and-drop circuit construction, gate placement and editing, a code editor, and OpenQASM-based workflows. Circuit and code stay in sync in both directions, so learners never have to choose between visual and programmatic thinking.

### 🎬 JSON-Driven Live Teaching (QUALUTION Cursor)
Lessons are lightweight structured data that drive the real Workbench. A teacher cursor places gates, highlights components, runs circuits and asks prediction questions. The learner can take over at any moment.

### 🧠 Intelligent Circuit Analyzer
Inspects qubit count, gate composition, entanglement and complexity, then routes the circuit to the best backend automatically.

### 🤖 Erwin, the AI Learning Companion
Detects misconceptions and guides with Socratic questions instead of handing over answers.

### ✅ Verifiable AI
AI predictions are executed and compared against simulator results, so unsupported quantum claims are caught.

### 📈 Visualisation
Circuit diagrams, probability distributions, Bloch sphere and Q-sphere views.

### 🎮 Gamified Learning Path
Structured modules, practical challenges, XP and mastery progression.

### 🏫 Student LMS and Teacher Visualisation
Track lessons, challenges, scores and prediction performance. Teachers see progress and where learners struggle.

### 🤝 Collaborative Learning
Shared circuit challenges and a shared learning workflow.

### 🏅 Assessment and Certification
Practical grading of circuit construction, gate usage, measurement probabilities, required or forbidden operations, target outcomes and state fidelity, leading to certification.

### 📴 Local-First and Low-Bandwidth
Lessons ship as 5 KB to 60 KB JSON. Browser execution, WebAssembly, Web Workers, IndexedDB (Dexie.js) and PWA capabilities keep selected workloads running offline. The principle is **local when possible, cloud when necessary.**

---

## How We Are Different

> Teaching happens **inside** the Workbench. Structured lessons directly control live teaching, visualisation and experimentation in the same production environment.

| Capability | Conventional fragmented workflow | QUALUTION |
|---|---|---|
| **Theory** | Separate learning resources | Integrated interactive lessons |
| **Practical work** | Separate simulator and coding tools | Unified Quantum Workbench |
| **Teaching** | Passive videos and documents | Structured live teaching inside the Workbench |
| **Visualisation** | Separate tools | Integrated Bloch and Q-sphere views |
| **AI assistance** | Generic chatbot | Erwin with Socratic, misconception-aware guidance |
| **Execution** | Single or limited backend | Capability-based multi-backend routing |
| **Assessment** | Separate quizzes testing recall | Practical circuit challenges |
| **Student management** | Separate LMS | Integrated Student LMS |
| **Teacher monitoring** | Limited | Teacher visualisation and analytics |
| **Certification** | Separate process | Connected mastery pathway |

---

## Architecture

**Design principle:** education, AI, circuit analysis, and quantum execution are separate layers that communicate through defined interfaces. Each can evolve independently.

```mermaid
flowchart TB
    subgraph EDU["Education layer"]
        WB["Quantum Workbench<br/>drag-and-drop and code editor"]
        TC["Teaching Controller<br/>QUALUTION Cursor"]
        LMS["Student LMS and Teacher Analytics"]
        CERT["Assessment and Certification"]
    end

    subgraph AI["AI layer"]
        ERWIN["Erwin<br/>Socratic tutor"]
        MIS["Misconception engine"]
        LM["Multi-signal learner model"]
        VER["Verification pipeline<br/>deterministic and equivalence checks"]
    end

    subgraph ANA["Circuit analysis layer"]
        CA["Circuit Analyzer<br/>qubits, gates, entanglement, complexity"]
        RT["Backend Router"]
    end

    subgraph EXE["Quantum execution layer"]
        SV["Local Statevector"]
        ST["Stabilizer"]
        MPS["MPS"]
        CLOUD["Cloud / QPU"]
    end

    subgraph DATA["Local-first data"]
        PWA["PWA and Web Workers"]
        IDB["IndexedDB via Dexie.js"]
        LES["JSON lessons<br/>5 KB to 60 KB"]
    end

    LES --> TC
    TC --> WB
    WB --> CA
    CA --> RT
    RT --> SV
    RT --> ST
    RT --> MPS
    RT --> CLOUD
    SV --> WB
    ST --> WB
    MPS --> WB
    CLOUD --> WB

    WB --> ERWIN
    ERWIN --> MIS
    MIS --> LM
    ERWIN --> VER
    VER --> RT
    LM --> LMS
    LM --> TC
    WB --> CERT
    CERT --> LMS
    WB --> IDB
    PWA --> IDB
```

### Request flow: from circuit to insight

```mermaid
sequenceDiagram
    participant U as Learner
    participant WB as Workbench (React)
    participant API as FastAPI backend
    participant CA as Circuit Analyzer
    participant EX as Execution engine
    participant ER as Erwin

    U->>WB: Build or edit circuit
    WB->>CA: Analyze circuit
    CA-->>WB: Backend choice and reason
    alt Runs locally
        WB->>EX: Execute in browser (WASM / Web Worker)
    else Needs server or cloud
        WB->>API: Submit circuit
        API->>EX: Execute on Stabilizer, MPS or Cloud/QPU
    end
    EX-->>WB: Statevector, counts, probabilities
    WB-->>U: Bloch, Q-sphere and histogram views
    WB->>ER: Prediction vs result
    ER-->>U: Socratic feedback
```

---

## Adaptive Circuit Execution

A dense statevector needs memory that grows exponentially with qubit count, so no single simulator suits every circuit. QUALUTION treats simulation as a **backend selection problem** and routes by circuit characteristics.

```mermaid
flowchart TD
    IN["Learner circuit"] --> CA["Circuit Analyzer<br/>qubit count, gate types, entanglement, complexity"]
    CA --> Q1{"Only Clifford gates?"}
    Q1 -- "Yes" --> ST["Stabilizer engine<br/>Gottesman-Knill, polynomial scaling"]
    Q1 -- "No" --> Q2{"Small qubit count?"}
    Q2 -- "Yes" --> SV["Local Statevector<br/>full state detail, works offline"]
    Q2 -- "No" --> Q3{"Entanglement bounded?"}
    Q3 -- "Yes" --> MPS["MPS engine<br/>low memory, scales to thousands of qubits"]
    Q3 -- "No" --> CL["Cloud / QPU<br/>large or specialised workloads"]
    ST --> OUT["Results, probabilities, Bloch and Q-sphere views"]
    SV --> OUT
    MPS --> OUT
    CL --> OUT
    CA -. "Explains the choice to the learner" .-> OUT
```

| Backend | Best for | Why |
|---|---|---|
| **Local Statevector** (on-device / browser) | Small, general, low-complexity circuits | Full state detail, no network needed |
| **Stabilizer** (Gottesman–Knill) | Clifford / stabilizer circuits | Polynomial scaling for this circuit class |
| **MPS** (Matrix Product State) | Larger circuits with limited entanglement | Far less memory than a dense statevector |
| **Cloud / QPU** | Large or specialised workloads | Access beyond local limits, including real hardware |

The analyzer weighs qubit count, gate type, entanglement, and complexity, then **explains its choice to the learner**. Understanding both the algorithm and the resources needed to run it is a professional skill worth teaching.

---

## 📊 Benchmarks

Qualution routes each circuit to the engine that suits it. These benchmarks show why: a dense statevector cannot leave the low-30s of qubits on ordinary hardware, while the Stabilizer and MPS engines keep going into the hundreds and thousands.



### Highlights

| Result | Number |
|---|---|
| Largest MPS circuit simulated | **2,000 qubits**, 1,000 shots in **574.72 ms**, under **10 MB** |
| MPS accuracy on this benchmark | Truncation error **0.000000**, fidelity **1.000000** at every size |
| Largest Stabilizer circuit simulated | **1,000 qubits**, tableau memory **3.82 MB** |
| Dense statevector for comparison | 30 qubits needs **16 GiB**; 50 qubits needs **16 PiB** (2ⁿ × 16 bytes) |

### Test setup

| Item | Value |
|---|---|
| Hardware | `[CPU model, cores, RAM]` |
| OS and runtime | `[OS, Python or Node version]` |
| Library versions | `[Qiskit / Aer / your engine version]` |
| Circuit family (MPS) | Nearest-neighbor bounded entanglement |
| Circuit family (Stabilizer) | `[e.g. random Clifford circuit, depth D]` |
| Shots (MPS) | 1,000 |
| MPS bond dimension limit χ | `[χ]` |
| Runs and statistic | `[e.g. median of 10 runs after 1 warm-up]` |
| Reproduce | `[command, e.g. python benchmarks/run_mps.py]` |

### MPS engine: 1,000 shots, nearest-neighbor bounded entanglement

| Qubits | Time | Truncation error | Fidelity | Memory |
|---:|---:|---:|---:|---|
| 25 | 16.73 ms | 0.000000 | 1.000000 | < 1 MB |
| 30 | 29.85 ms | 0.000000 | 1.000000 | < 1 MB |
| 50 | 26.13 ms | 0.000000 | 1.000000 | < 1 MB |
| 100 | 39.87 ms | 0.000000 | 1.000000 | < 1 MB |
| 200 | 89.11 ms | 0.000000 | 1.000000 | < 2 MB |
| 500 | 94.63 ms | 0.000000 | 1.000000 | < 3 MB |
| 1,000 | 219.16 ms | 0.000000 | 1.000000 | < 5 MB |
| 2,000 | 574.72 ms | 0.000000 | 1.000000 | < 10 MB |

Runtime grows roughly in proportion to qubit count (100 → 2,000 qubits is a 20× increase in size and a 14× increase in time), and memory stays in single-digit megabytes. Small differences between neighboring sizes (for example 30 vs 50 qubits) are within run-to-run timing noise.

### Stabilizer engine: tableau simulation

| Qubits | Single shot | 100 shots | Tableau memory |
|---:|---:|---:|---:|
| 10 | 0.14 ms | 2.68 ms | 441 B |
| 50 | 0.59 ms | 28.64 ms | 9.96 KB |
| 100 | 3.49 ms | 193.81 ms | 39.45 KB |
| 500 | 214.31 ms | 24.54 s | 978.52 KB |
| 1,000 | 1.91 s | 190.87 s | 3.82 MB |

Tableau memory follows (2n + 1)² bytes, so it grows quadratically and stays under 4 MB at 1,000 qubits.

### Scope and honest limits

- **MPS** is efficient only when entanglement stays bounded. Highly entangled circuits need a large bond dimension, and the router sends those elsewhere.
- **Stabilizer** covers Clifford circuits only. In the current implementation each shot is simulated independently, so time scales linearly with shots; reusing the final tableau for sampling is a planned optimization.
- **Statevector** is exact and used for small and general circuits. Its memory doubles with every added qubit, and the workbench shows the requirement before running.
- Timings depend on the hardware above and should be read as relative behavior across engines, not absolute records.

---

## JSON-Driven Live Teaching

Instead of shipping a video, **a lesson is data** that a Teaching Controller plays inside the real Workbench.

A lesson can move the cursor to a circuit element, highlight a component, place a gate, execute a circuit, display math, ask a prediction question, wait for learner input, and validate the learner's actions.

```mermaid
sequenceDiagram
    participant L as JSON Lesson
    participant TC as Teaching Controller
    participant WB as Workbench
    participant EX as Execution Engine
    participant U as Learner

    L->>TC: Load steps
    TC->>WB: moveCursor and placeGate
    TC->>WB: showMath
    TC->>U: askPrediction
    U-->>TC: Prediction submitted
    TC->>WB: runCircuit
    WB->>EX: Execute on the routed backend
    EX-->>WB: Measurement results
    WB-->>U: Distribution and state views
    TC->>TC: Compare prediction with result
    Note over U,WB: Learner can take over at any step
```

<details>
<summary><b>Illustrative lesson snippet</b> (simplified; the real schema may differ)</summary>

```json
{
  "lesson": "superposition-hadamard",
  "steps": [
    { "action": "moveCursor", "target": "qubit0.wire" },
    { "action": "placeGate", "gate": "H", "qubit": 0, "column": 0 },
    { "action": "showMath", "latex": "H|0\\rangle = \\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}" },
    {
      "action": "askPrediction",
      "prompt": "What will measuring qubit 0 give?",
      "options": ["Always 0", "Always 1", "About half 0, half 1"]
    },
    { "action": "waitForInput" },
    { "action": "runCircuit", "shots": 1024 }
  ]
}
```

</details>

| Benefit | Detail |
|---|---|
| **Lightweight** | 5 KB to 60 KB per lesson, so it works on low bandwidth |
| **Interactive** | Teaching actions manipulate the same circuit the learner uses |
| **Learner takeover** | Seamless switch from demonstration to hands-on |
| **Reusable** | New lessons need no Workbench redesign and no hard-coding |
| **Practical** | The lesson flows straight into building and running circuits |

---

## Mario: Socratic AI Companion

Erwin doesn't just say "wrong." **It works out why.**

When a learner predicts an incorrect distribution, Mario asks things like:

> - What state did you expect?
> - Which gate changed the state?
> - What happens right before measurement?
> - Can you modify the circuit and test your hypothesis?

### Verifiable AI pipeline

Generated explanations, code and optimisations are checked against the execution engine using deterministic checks and equivalence verification. The AI never gets to present an unverified quantum result as fact.

```mermaid
sequenceDiagram
    participant U as Learner
    participant MA as Mario
    participant M as Misconception engine
    participant V as Verifier
    participant X as Execution Engine

    U->>E: Prediction or question
    E->>X: Run circuit for ground truth
    X-->>E: Actual distribution
    E->>M: Compare prediction with result
    M-->>E: Likely root cause
    E->>V: Draft explanation or suggested fix
    V->>X: Deterministic and equivalence checks
    X-->>V: Verified or rejected
    V-->>E: Verdict
    E-->>U: Socratic question, never an unverified claim
    U->>E: Revised hypothesis
```

### Multi-signal learner model

Predictions, circuit behaviour and assessment results are combined to spot learning gaps and choose the next activity, so progress is **evidence-driven rather than time-driven**.

```mermaid
flowchart LR
    P["Prediction accuracy"] --> LM
    C["Circuit behaviour<br/>gate choices, edits, retries"] --> LM
    A["Assessment results"] --> LM
    M["Detected misconceptions"] --> LM
    LM["Learner model"] --> G["Identified learning gaps"]
    G --> N["Next activity<br/>remedial lesson, new challenge or advance"]
    G --> T["Teacher dashboard"]
```

---

## Assessment and Certification Flow

```mermaid
flowchart LR
    A["Learner submits circuit"] --> B["Automated practical grader"]
    B --> C["Checks<br/>gate usage, required or forbidden ops,<br/>target probabilities, state fidelity"]
    C --> D{"Meets rubric?"}
    D -- "No" --> E["Feedback and Erwin guidance"]
    E --> A
    D -- "Yes" --> F["Score recorded in LMS"]
    F --> G["Learner model updated"]
    G --> H{"Track mastery reached?"}
    H -- "No" --> I["Next recommended activity"]
    H -- "Yes" --> J["Certificate issued"]
```

---

## Curriculum

| Track | Modules |
|---|---|
| **Foundations** | Bits and Qubits · Superposition and Hadamard · Multi-Qubit Systems and Entanglement · Measurement and Probability |
| **Circuit Design and Algorithms** | Gate Library · Circuit Design and Complexity · Deutsch–Jozsa · Grover Search |
| **Advanced and Variational** | Variational Circuits · QAOA · VQE · Adaptive Execution |

Each module ends with an assessment and a practical challenge.

**Example: learning Grover's Search.** Instead of *watch Grover, answer a quiz*, the learner goes through:

```mermaid
flowchart LR
    A["Understand"] --> B["Predict"] --> C["Build"] --> D["Execute"] --> E["Observe"] --> F["Modify"] --> G["Explain"] --> H["Prove"]
```

They see amplitude amplification, predict which state gets amplified, run the circuit, tweak the oracle or diffusion operator, and rerun. Erwin steps in if the prediction was off, and a challenge closes it out.

---

## Impact

| Audience | Benefit |
|---|---|
| 🎓 **Students** | Hands-on guided learning that shortens the learning curve |
| 👩‍🏫 **Educators and academics** | Adaptive teaching with real experiments and less prep effort |
| 🧑‍💼 **Industry professionals** | Rapid, job-relevant upskilling on real or simulated backends |
| 🏛️ **Institutions** | One scalable environment for learning, experimentation and assessment |
| 🔭 **Quantum enthusiasts** | Accessible, visual, self-paced learning |

| Dimension | Outcome |
|---|---|
| **Educational** | Learning by visualisation and simulation; misconceptions addressed at the root |
| **Economic** | Lower experimentation cost; faster workforce skill development |
| **Social** | Quantum access beyond physical QPU facilities; broader participation |
| **Environmental** | Less physical-lab dependence; simulation-first before QPU use |

---

## Feasibility and Risk Mitigation

| Challenge | Our mitigation |
|---|---|
| **Quantum execution scalability:** exponential resource growth | **Adaptive execution:** resource-aware routing and execution limits for larger circuits |
| **AI trust and quantum correctness:** AI may produce incorrect quantum behaviour | **Quantum verification:** deterministic checks and equivalence verification of AI-generated operations |
| **Adaptive learning accuracy:** is the learner truly understanding? | **Multi-signal learner model:** predictions, circuit behaviour and assessments combined |
| **Interactive teaching at scale:** avoid hard-coding every lesson | **JSON-driven lesson engine:** reusable structured lessons with the QUALUTION Cursor |

**Feasibility:** ✅ Technical (proven methods, mature tech) · ✅ Operational (modular, browser-based) · ✅ Market (growing quantum workforce need) · ✅ Economic (lightweight JSON, reusable lessons, local execution)

---

## Project Status and Roadmap

All core modules are implemented:

- [x] Concept, architecture and learning model
- [x] Quantum Workbench (drag-and-drop + code, bidirectional sync)
- [x] JSON-driven lesson engine and QUALUTION Cursor
- [x] Circuit Analyzer and multi-backend routing (Statevector, Stabilizer, MPS, cloud)
- [x] Erwin AI with Socratic guidance, misconception detection and verification
- [x] Student LMS, challenges and certification
- [x] Teacher visualisation and analytics
- [x] Collaborative learning

### Future directions

- 🔌 Additional cloud quantum hardware providers, enabling a path from simulation to more real QPUs
- 🧠 Richer learner models and deeper misconception analysis
- 👥 Real-time collaborative circuit editing and instructor-led classroom sessions
- 📊 Population-level learning analytics for educators
- 🏆 Expanded competency-based certification

---

## Getting Started

### Prerequisites

- Node.js `[version]` and npm
- Python `[version]` for the backend services
- API keys as needed: AI provider (NVIDIA NIM, Groq) and cloud quantum provider

### Installation

```bash
# 1. Clone the repository
git clone [YOUR_REPO_URL]
cd [YOUR_REPO_NAME]

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# then fill in the required values

# 5. Start the backend and the frontend
[backend start command]
npm run dev
```

Open the local URL printed by the dev server in your browser.


## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite |
| **Animation and UI motion** | Anime.js |
| **Local execution** | WebAssembly, Web Workers |
| **Offline and persistence** | PWA, IndexedDB via Dexie.js |
| **Quantum simulation** | Statevector, Stabilizer, MPS, cloud backend, OpenQASM, Qiskit, Qiskit Aer |
| **AI and learning** | Erwin (Socratic tutor), misconception engine, NVIDIA NIM, Groq, on-device SmolLM-135M |
| **Backend** | Python, FastAPI |
| **Testing** | Vitest, Pytest |

---





<div align="center">

**Learn the concept. Build the circuit. Predict the result. Execute the computation. Analyze the evidence. Collaborate with others. Prove mastery.**

Made with ⚛️ by **Team DADBODS** for **Smart India Hackathon 2026**

</div>
