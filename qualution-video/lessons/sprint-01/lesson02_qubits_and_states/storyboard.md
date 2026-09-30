# QUALUTION Visual Storyboard — Qubits & Quantum States

- **Lesson ID**: `s1-theory-qubits-states`
- **Total Duration**: 220s (6600 frames at 30 fps)

---

### Scene scene-01: The Quantum Continuum (20s | Frames 1-600)

- **Educational Purpose**: Hook the learner by contrasting discrete classical switches with continuous quantum physical systems.
- **Spoken Narration**: *"In the classical realm, information is rigidly binary: a switch is on or off, a transistor is charged or uncharged. But nature at the microscopic scale is not discrete—it is continuous."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 2: QUBITS & QUANTUM STATES at position [-6.0, 3.8, 0.1]
  - `[SUBHEADER]` The Continuous Spectrum of Quantum Information at position [-6.0, 3.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-02: Physical Realizations of Qubits (25s | Frames 601-1350)

- **Educational Purpose**: Ground mathematical abstractions in real experimental quantum hardware physics.
- **Spoken Narration**: *"Any quantum system with two distinct, measurable energy levels can serve as a qubit. Examples include the spin of an electron, the polarization of a photon, or artificial atoms built from superconducting Josephson junctions."*
- **On-Screen Typography**:
  - `[HEADER]` Physical Two-Level Quantum Systems at position [-5.0, 3.5, 0.1]
  - `[BODY]` Spin-1/2 Particles (Up / Down) at position [-5.0, 2.0, 0.1]
  - `[BODY]` Superconducting Transmon Qubits at position [-5.0, 1.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-03: Dirac Notation & State Vectors (30s | Frames 1351-2250)

- **Educational Purpose**: Introduce Dirac notation and formal column vector space conventions.
- **Spoken Narration**: *"To mathematically capture quantum states, physicist Paul Dirac introduced bra-ket notation. We write the state of our qubit as a ket vector, denoted |ψ⟩, which lives in a two-dimensional complex Hilbert space."*
- **On-Screen Typography**:
  - `[FORMULA]` |ψ⟩ = α|0⟩ + β|1⟩ at position [0.0, 0.5, 0.1]
  - `[SUBHEADER]` State Vector in Hilbert Space ℂ² at position [0.0, -1.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-04: The Basis Vectors |0⟩ and |1⟩ (25s | Frames 2251-3000)

- **Educational Purpose**: Connect Dirac notation directly to standard linear algebra matrix/vector notation.
- **Spoken Narration**: *"The standard computational basis consists of two orthogonal column vectors: |0⟩ represented as [1, 0] transpose, and |1⟩ represented as [0, 1] transpose. Any arbitrary state is a linear combination of these two axes."*
- **On-Screen Typography**:
  - `[FORMULA]` |0⟩ = [ 1, 0 ]ᵀ at position [-3.5, 0.0, 0.1]
  - `[FORMULA]` |1⟩ = [ 0, 1 ]ᵀ at position [3.5, 0.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-05: Complex Probability Amplitudes (30s | Frames 3001-3900)

- **Educational Purpose**: Clarify the distinction between probability amplitudes and classical probabilities.
- **Spoken Narration**: *"The coefficients α and β are not probabilities themselves—they are complex numbers known as probability amplitudes. Each amplitude contains both a magnitude and an intrinsic quantum phase angle."*
- **On-Screen Typography**:
  - `[FORMULA]` α, β ∈ ℂ at position [0.0, 1.5, 0.1]
  - `[FORMULA]` α = r₀ e^(iθ₀),  β = r₁ e^(iθ₁) at position [0.0, -0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-06: The Normalization Constraint (25s | Frames 3901-4650)

- **Educational Purpose**: Derive and emphasize the fundamental probability normalization invariant.
- **Spoken Narration**: *"Because total probability must always equal 100%, quantum states obey the strict normalization constraint: the absolute square of α plus the absolute square of β must equal exactly one."*
- **On-Screen Typography**:
  - `[FORMULA]` |α|² + |β|² = 1.0 at position [0.0, 0.8, 0.1]
  - `[SUBHEADER]` Law of Conservation of Quantum Probability at position [0.0, -1.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-07: Bloch Sphere Visualization (35s | Frames 4651-5700)

- **Educational Purpose**: Introduce the geometric representation of single-qubit state space.
- **Spoken Narration**: *"Because of normalization and global phase invariance, every pure single-qubit state maps to a unique point on the surface of a three-dimensional unit sphere called the Bloch Sphere. |0⟩ sits at the North Pole, and |1⟩ at the South Pole."*
- **On-Screen Typography**:
  - `[HEADER]` The Bloch Sphere Representation at position [-5.0, 3.5, 0.1]
  - `[BODY]` North Pole: |0⟩ at position [3.5, 2.5, 0.1]
  - `[BODY]` South Pole: |1⟩ at position [3.5, -2.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-08: Key Takeaways & Summary (30s | Frames 5701-6600)

- **Educational Purpose**: Reinforce core concepts and transition smoothly to Lesson 3.
- **Spoken Narration**: *"In summary: a qubit is a physical two-level quantum system represented as |ψ⟩ = α|0⟩ + β|1⟩. Its complex amplitudes dictate probabilities upon measurement, constrained to total unity. Next, we explore the computational basis in depth."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 2 SUMMARY at position [0.0, 3.2, 0.1]
  - `[BODY]` 1. Qubit: 2-level quantum state in ℂ² at position [0.0, 1.5, 0.1]
  - `[BODY]` 2. State: |ψ⟩ = α|0⟩ + β|1⟩ at position [0.0, 0.5, 0.1]
  - `[BODY]` 3. Normalization: |α|² + |β|² = 1 at position [0.0, -0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: fade_to_black

---

