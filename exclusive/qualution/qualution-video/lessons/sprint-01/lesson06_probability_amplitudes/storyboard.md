# QUALUTION Visual Storyboard — Probability Amplitudes & Phases

- **Lesson ID**: `s1-theory-probability-amplitudes`
- **Total Duration**: 210s (6300 frames at 30 fps)

---

### Scene scene-01: The Secret Currency of Quantum Computing (20s | Frames 1-600)

- **Educational Purpose**: Hook learner with the mathematical power of complex amplitudes vs real probabilities.
- **Spoken Narration**: *"Classical probabilities can only be positive real numbers between zero and one. But quantum mechanics runs on a richer currency: complex numbers that can be positive, negative, or imaginary."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 6: PROBABILITY AMPLITUDES & PHASES at position [-6.0, 3.8, 0.1]
  - `[SUBHEADER]` The Complex Arithmetic Underlying Quantum Advantage at position [-6.0, 3.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-02: Complex Numbers in Polar Form (25s | Frames 601-1350)

- **Educational Purpose**: Review Euler's formula and polar decomposition of complex amplitudes.
- **Spoken Narration**: *"Any complex amplitude α can be written in rectangular form as a + bi, or in polar form as r times e to the power of i theta. Here, r is the magnitude, and theta is the phase angle."*
- **On-Screen Typography**:
  - `[FORMULA]` α = a + bi = r · e^(iθ) at position [0.0, 1.2, 0.1]
  - `[BODY]` Magnitude: r = √(a² + b²)  |  Phase: θ = arctan(b/a) at position [0.0, -0.6, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-03: Why Negative Amplitudes Matter (30s | Frames 1351-2250)

- **Educational Purpose**: Demonstrate destructive cancellation mathematically.
- **Spoken Narration**: *"Consider the state |+⟩ with amplitude +1/√2, and |-⟩ with amplitude -1/√2 for state |1⟩. Both square to 1/2 upon measurement. But before measurement, adding +1/√2 and -1/√2 results in zero—complete cancellation!"*
- **On-Screen Typography**:
  - `[HEADER]` Destructive Amplitude Interference at position [0.0, 2.0, 0.1]
  - `[FORMULA]` (+1/√2) + (-1/√2) = 0 at position [0.0, 0.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-04: Global Phase Invariance (30s | Frames 2251-3150)

- **Educational Purpose**: Formalize the proof of global phase invariance.
- **Spoken Narration**: *"What happens if we multiply the entire quantum state by a phase factor e to the i gamma? When we calculate measurement probabilities, the phase factor conjugates to one and vanishes. Global phase is physically undetectable!"*
- **On-Screen Typography**:
  - `[FORMULA]` Global Phase Invariance: |e^(iγ)ψ|² = |ψ|² at position [0.0, 0.8, 0.1]
  - `[SUBHEADER]` Global phase leaves all physical observables unchanged at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-05: The Power of Relative Phase (35s | Frames 3151-4200)

- **Educational Purpose**: Derive the standard spherical parameterization of a single qubit.
- **Spoken Narration**: *"In contrast, the relative phase—the difference in phase between |0⟩ and |1⟩—is intensely physical! By factoring out global phase, any single-qubit pure state can be written using two angles: theta and phi."*
- **On-Screen Typography**:
  - `[FORMULA]` |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩ at position [0.0, 0.5, 0.1]
  - `[SUBHEADER]` θ ∈ [0, π] (Colatitude)  |  φ ∈ [0, 2π) (Longitude) at position [0.0, -1.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-06: Phase on the Bloch Equator (35s | Frames 4201-5250)

- **Educational Purpose**: Connect relative phase parameterization to Bloch sphere longitude.
- **Spoken Narration**: *"When theta equals 90 degrees, the qubit sits on the equator of the Bloch sphere. Here, varying the relative phase phi rotates the state from |+⟩ at phi equals 0, to |i⟩ at 90 degrees, to |-⟩ at 180 degrees."*
- **On-Screen Typography**:
  - `[HEADER]` Equatorial Relative Phase States at position [0.0, 2.5, 0.1]
  - `[BODY]` |+⟩ = (|0⟩ + |1⟩)/√2 (φ = 0) at position [0.0, 1.0, 0.1]
  - `[BODY]` |+i⟩ = (|0⟩ + i|1⟩)/√2 (φ = π/2) at position [0.0, 0.0, 0.1]
  - `[BODY]` |-⟩ = (|0⟩ - |1⟩)/√2 (φ = π) at position [0.0, -1.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-07: Summary & Next Steps (35s | Frames 5251-6300)

- **Educational Purpose**: Recap probability amplitude insights and transition to Lesson 7.
- **Spoken Narration**: *"To summarize: complex amplitudes give quantum states phase. While global phase is invisible, relative phase alters the state's geometry and drives wave interference. In Lesson 7, we explore Quantum Phase and Interference in action."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 6 SUMMARY at position [0.0, 3.0, 0.1]
  - `[BODY]` 1. Polar Form: α = r e^(iθ) with magnitude r and phase θ at position [0.0, 1.2, 0.1]
  - `[BODY]` 2. Global Phase e^(iγ): Completely undetectable experimentally at position [0.0, 0.2, 0.1]
  - `[BODY]` 3. Relative Phase e^(iφ): Highly physical; defines equatorial position at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: fade_to_black

---

