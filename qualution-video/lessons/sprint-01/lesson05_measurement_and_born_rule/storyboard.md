# QUALUTION Visual Storyboard — Measurement & Born's Rule

- **Lesson ID**: `s1-theory-measurement-probability`
- **Total Duration**: 205s (6150 frames at 30 fps)

---

### Scene scene-01: The Measurement Enigma (20s | Frames 1-600)

- **Educational Purpose**: Introduce the foundational paradox of quantum observation and wavefunction collapse.
- **Spoken Narration**: *"In classical physics, observing an object does not change its state. But in quantum mechanics, the very act of observation irreversibly changes what is being observed. This is the quantum measurement problem."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 5: MEASUREMENT & BORN'S RULE at position [-6.0, 3.8, 0.1]
  - `[SUBHEADER]` The Irreversible Collapse of Quantum Superposition at position [-6.0, 3.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-02: Max Born and the Probability Rule (25s | Frames 601-1350)

- **Educational Purpose**: Introduce Born's Rule mathematically and historically.
- **Spoken Narration**: *"In 1926, physicist Max Born discovered how mathematical wavefunctions translate into physical experimental reality. He postulated that the probability of measuring an outcome is the absolute square of its amplitude."*
- **On-Screen Typography**:
  - `[HEADER]` Born's Rule (1926 Nobel Prize Formulation) at position [0.0, 2.5, 0.1]
  - `[FORMULA]` P(x) = |⟨x|ψ⟩|² at position [0.0, 0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-03: Calculating Probabilities for a Single Qubit (30s | Frames 1351-2250)

- **Educational Purpose**: Provide concrete mathematical derivation of single-qubit measurement probabilities.
- **Spoken Narration**: *"For a single qubit state |ψ⟩ = α|0⟩ + β|1⟩, the probability of measuring zero is P(0) = |α|², and the probability of measuring one is P(1) = |β|². Because the probabilities must sum to 1, |α|² + |β|² = 1."*
- **On-Screen Typography**:
  - `[FORMULA]` P(0) = |α|² = |⟨0|ψ⟩|² at position [-3.5, 0.8, 0.1]
  - `[FORMULA]` P(1) = |β|² = |⟨1|ψ⟩|² at position [3.5, 0.8, 0.1]
  - `[SUBHEADER]` P(0) + P(1) = |α|² + |β|² = 1.0 at position [0.0, -1.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-04: Wavefunction Collapse in Real Time (30s | Frames 2251-3150)

- **Educational Purpose**: Illustrate state vector projection and wavefunction collapse dynamically.
- **Spoken Narration**: *"Before measurement, the qubit held infinite continuous possibilities. But the moment a measurement occurs, the state vector instantaneously collapses onto the observed eigenstate: either strictly |0⟩ or strictly |1⟩."*
- **On-Screen Typography**:
  - `[BODY]` Before: |ψ⟩ = α|0⟩ + β|1⟩ at position [-4.0, 0.5, 0.1]
  - `[HEADER]` ───[ MEASURE ]───> at position [0.0, 0.5, 0.1]
  - `[BODY]` After: |0⟩  OR  |1⟩ at position [4.0, 0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-05: Irreversibility: The Loss of Phase (30s | Frames 3151-4050)

- **Educational Purpose**: Differentiate unitary reversible quantum evolution from non-unitary measurement.
- **Spoken Narration**: *"Notice an essential fact: quantum gates are reversible unitaries, but measurement is strictly irreversible. Once collapsed, all information about the relative phase angle θ is permanently destroyed."*
- **On-Screen Typography**:
  - `[BODY]` Quantum Gates = Reversible Unitaries at position [-3.5, 0.5, 0.1]
  - `[BODY]` Measurement = Irreversible Projection at position [3.5, 0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-06: Shots and Empirical Sampling (35s | Frames 4051-5100)

- **Educational Purpose**: Connect single-shot measurement collapse to experimental quantum hardware execution.
- **Spoken Narration**: *"Because a single measurement returns only one bit, quantum computers execute circuits over many repetitions called shots. Running 1,000 shots on an equal superposition yields approximately 500 zeros and 500 ones."*
- **On-Screen Typography**:
  - `[HEADER]` Empirical Sampling via Circuit Shots at position [0.0, 2.5, 0.1]
  - `[SUBHEADER]` 1,000 Shots on |+⟩: ~500 |0⟩, ~500 |1⟩ at position [0.0, 0.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-07: Summary & Practical Connection (35s | Frames 5101-6150)

- **Educational Purpose**: Summarize key principles and bridge forward to probability amplitudes.
- **Spoken Narration**: *"To conclude: Born's Rule dictates that P(x) = |⟨x|ψ⟩|². Measurement collapses superposition into classical reality, producing empirical counts. Next in Lesson 6, we examine the inner structure of complex probability amplitudes."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 5 SUMMARY at position [0.0, 3.0, 0.1]
  - `[BODY]` 1. Born's Rule: P(0) = |α|², P(1) = |β|² at position [0.0, 1.2, 0.1]
  - `[BODY]` 2. Wavefunction Collapse: State projects onto observed basis state at position [0.0, 0.2, 0.1]
  - `[BODY]` 3. Shots: Accumulate measurement samples to reveal probabilities at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: fade_to_black

---

