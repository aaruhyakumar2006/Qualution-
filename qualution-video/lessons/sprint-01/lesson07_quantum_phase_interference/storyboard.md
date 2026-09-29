# QUALUTION Visual Storyboard — Quantum Phase & Interference

- **Lesson ID**: `s1-theory-quantum-phase`
- **Total Duration**: 210s (6300 frames at 30 fps)

---

### Scene scene-01: The Double Slit and Quantum Waves (20s | Frames 1-600)

- **Educational Purpose**: Introduce the physical wave nature of quantum states.
- **Spoken Narration**: *"In the famous double slit experiment, particles shot through two barriers create an alternating pattern of bright and dark fringes. Quantum computers harness this identical phenomenon: Wave Interference."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 7: QUANTUM PHASE & INTERFERENCE at position [-6.0, 3.8, 0.1]
  - `[SUBHEADER]` Constructive Reinforcement & Destructive Cancellation at position [-6.0, 3.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-02: Constructive vs Destructive Interference (25s | Frames 601-1350)

- **Educational Purpose**: Illustrate constructive and destructive interference with wave graphics.
- **Spoken Narration**: *"When two quantum paths are in phase (peaks aligned with peaks), their amplitudes add constructively, amplifying probability. When they are 180 degrees out of phase, peaks meet troughs and cancel out completely."*
- **On-Screen Typography**:
  - `[HEADER]` Principles of Quantum Wave Interference at position [0.0, 2.5, 0.1]
  - `[BODY]` Constructive: (+A) + (+A) = +2A (P ∝ 4A²) at position [-4.0, 0.0, 0.1]
  - `[BODY]` Destructive: (+A) + (-A) = 0 (P = 0) at position [4.0, 0.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-03: The Pauli-Z Phase Gate (30s | Frames 1351-2250)

- **Educational Purpose**: Define the Pauli-Z gate and its selective phase-flip action.
- **Spoken Narration**: *"To control phase in a quantum circuit, we use phase gates. The foundational phase gate is Pauli-Z. Acting on |0⟩, Z leaves it unchanged. But acting on |1⟩, it flips the sign, imparting a 180-degree relative phase shift."*
- **On-Screen Typography**:
  - `[FORMULA]` Z = [ [1,  0], [0, -1] ] at position [0.0, 1.2, 0.1]
  - `[FORMULA]` Z |0⟩ = |0⟩  |  Z |1⟩ = -|1⟩ at position [0.0, -0.6, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-04: Transforming |+⟩ to |-⟩ (30s | Frames 2251-3150)

- **Educational Purpose**: Show how Pauli-Z toggles between the plus and minus states.
- **Spoken Narration**: *"Consider what happens when Z acts on the plus state |+⟩ = (|0⟩ + |1⟩)/√2. The |0⟩ term remains positive, while the |1⟩ term flips negative, transforming |+⟩ directly into the minus state |-⟩!"*
- **On-Screen Typography**:
  - `[FORMULA]` Z |+⟩ = |-⟩ at position [0.0, 0.8, 0.1]
  - `[FORMULA]` Z |-⟩ = |+⟩ at position [0.0, -0.6, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-05: The H-Z-H Interference Experiment (35s | Frames 3151-4200)

- **Educational Purpose**: Walk through the foundational H-Z-H circuit showing path interference.
- **Spoken Narration**: *"Now let us observe the full power of interference. Start in |0⟩. Apply H to create |+⟩. Apply Z to flip the phase to |-⟩. Now apply H a second time! The paths to |0⟩ destructively cancel, and we measure |1⟩ with 100% certainty!"*
- **On-Screen Typography**:
  - `[FORMULA]` H · Z · H = X (Bit-Flip via Phase Interference) at position [0.0, 1.0, 0.1]
  - `[SUBHEADER]` Paths to |0⟩: (+1/2) + (-1/2) = 0 | Paths to |1⟩: (+1/2) + (+1/2) = 1 at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-06: How Quantum Algorithms Work (35s | Frames 4201-5250)

- **Educational Purpose**: Demystify quantum computational advantage as guided wave interference.
- **Spoken Narration**: *"This reveals the master blueprint behind all quantum algorithms: we configure quantum gates so that incorrect solutions destructively cancel out, while the correct answers constructively amplify into high probability."*
- **On-Screen Typography**:
  - `[HEADER]` The Quantum Algorithmic Engine at position [0.0, 2.5, 0.1]
  - `[BODY]` Wrong Answers ───> Destructive Interference (P -> 0) at position [0.0, 0.5, 0.1]
  - `[BODY]` Correct Solution ───> Constructive Interference (P -> 1) at position [0.0, -0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-07: Summary & Next Steps (35s | Frames 5251-6300)

- **Educational Purpose**: Recap interference fundamentals and preview single-qubit gate taxonomy.
- **Spoken Narration**: *"In summary: Phase is the rudder that steers quantum interference. By manipulating relative phases, gates orchestrate constructive and destructive wave behavior. In Lesson 8, we explore the complete canonical suite of Single-Qubit Gates."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 7 SUMMARY at position [0.0, 3.0, 0.1]
  - `[BODY]` 1. Interference: Constructive (+) amplifies; Destructive (-) cancels at position [0.0, 1.2, 0.1]
  - `[BODY]` 2. Pauli-Z Gate: Inverts phase of |1⟩ while preserving |0⟩ at position [0.0, 0.2, 0.1]
  - `[BODY]` 3. HZH = X: A phase flip sandwiched between Hadamards flips the bit at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: fade_to_black

---

