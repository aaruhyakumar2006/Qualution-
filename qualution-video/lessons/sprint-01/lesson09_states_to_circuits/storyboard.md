# QUALUTION Visual Storyboard — From Quantum States to Circuits

- **Lesson ID**: `s1-theory-states-to-circuits`
- **Total Duration**: 210s (6300 frames at 30 fps)

---

### Scene scene-01: The Musical Score of Quantum Computing (20s | Frames 1-600)

- **Educational Purpose**: Provide an accessible mental model for reading quantum circuit diagrams.
- **Spoken Narration**: *"A quantum circuit is like a musical score. Each horizontal line is a wire representing a qubit progressing through time from left to right, while gates are musical notes transforming the harmony of quantum states."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 9: FROM QUANTUM STATES TO CIRCUITS at position [-6.0, 3.8, 0.1]
  - `[SUBHEADER]` Anatomy of Quantum Circuit Diagrams at position [-6.0, 3.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-02: Wire Initialization & Time Flow (25s | Frames 601-1350)

- **Educational Purpose**: Explain circuit diagram syntax and initialization standards.
- **Spoken Narration**: *"By convention, every qubit wire begins at time zero in the ground state |0⟩. Operations execute sequentially from left to right. When two gates sit in the same vertical column on different wires, they execute simultaneously."*
- **On-Screen Typography**:
  - `[FORMULA]` q[0]: |0⟩ ─────[ H ]─────[ Z ]─────[ M ] ───> c[0] at position [0.0, 0.5, 0.1]
  - `[SUBHEADER]` TIME PROGRESSION ─────────────────────────> at position [0.0, -1.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-03: Matrix Multiplication in Reverse Order (30s | Frames 1351-2250)

- **Educational Purpose**: Warn students about the classic left-to-right vs right-to-left ordering trap.
- **Spoken Narration**: *"Here is a crucial rule for every quantum programmer: while circuits execute left-to-right, mathematical matrix multiplication is written right-to-left! If a circuit applies gate A then gate B, the overall unitary is B times A."*
- **On-Screen Typography**:
  - `[HEADER]` The Operator Ordering Rule at position [0.0, 2.5, 0.1]
  - `[BODY]` Circuit: ───[ A ]───[ B ]───> at position [-3.5, 0.5, 0.1]
  - `[BODY]` Math: |ψ_final⟩ = (B · A) |0⟩ at position [3.5, 0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-04: Circuit Depth and Gate Count (35s | Frames 2251-3300)

- **Educational Purpose**: Introduce circuit depth and complexity analysis.
- **Spoken Narration**: *"To evaluate circuit efficiency, we measure two key structural metrics: Total Gate Count—the sum of all operations—and Circuit Depth—the number of sequential time steps required to execute the circuit when parallel gates run together."*
- **On-Screen Typography**:
  - `[HEADER]` Circuit Complexity Metrics at position [0.0, 2.5, 0.1]
  - `[BODY]` Total Gate Count = Total number of gates at position [0.0, 0.5, 0.1]
  - `[BODY]` Circuit Depth = Length of critical time path at position [0.0, -0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-05: Measurement and Classical Registers (30s | Frames 3301-4200)

- **Educational Purpose**: Explain measurement meter symbols and classical registers.
- **Spoken Narration**: *"At the end of a circuit, measurement meters convert quantum statevectors into classical bits, storing the results in a classical register denoted with double lines. This marks the transition from quantum coherence to classical data."*
- **On-Screen Typography**:
  - `[FORMULA]` q[0] ───[ M ]───
          ║
          ▼
c[0] ════════════ (Classical Bit Storage) at position [0.0, 0.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-06: Code Generation: From Visual Canvas to Python (35s | Frames 4201-5250)

- **Educational Purpose**: Connect visual diagramming directly to software engineering code generation.
- **Spoken Narration**: *"In QUALUTION, your visual circuit is bidirectionally synchronized with real quantum code. As you drag gates, the platform automatically generates idiomatic Qiskit, PennyLane, or Cirq scripts ready for real quantum hardware."*
- **On-Screen Typography**:
  - `[HEADER]` Unified Code Generation Architecture at position [0.0, 2.5, 0.1]
  - `[FORMULA]` qc = QuantumCircuit(1, 1)
qc.h(0)
qc.z(0)
qc.measure(0, 0) at position [0.0, 0.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-07: Summary & Sprint 1 Milestone (35s | Frames 5251-6300)

- **Educational Purpose**: Celebrate completion of core single-qubit curriculum.
- **Spoken Narration**: *"Congratulations! You have mastered the journey from quantum states to full circuit diagrams. Next, we consolidate everything in Lesson 10 with our Sprint 1 Comprehensive Review and Knowledge Check."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 9 SUMMARY at position [0.0, 3.0, 0.1]
  - `[BODY]` 1. Circuits flow left-to-right in time; operators multiply right-to-left at position [0.0, 1.2, 0.1]
  - `[BODY]` 2. Circuit Depth measures execution steps along the critical path at position [0.0, 0.2, 0.1]
  - `[BODY]` 3. Visual circuits translate 1:1 into Qiskit, PennyLane, and Cirq at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: fade_to_black

---

