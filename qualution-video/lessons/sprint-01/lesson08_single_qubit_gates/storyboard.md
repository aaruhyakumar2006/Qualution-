# QUALUTION Visual Storyboard — Single-Qubit Quantum Gates

- **Lesson ID**: `s1-theory-single-qubit-gates`
- **Total Duration**: 210s (6300 frames at 30 fps)

---

### Scene scene-01: Quantum Gates as State Rotations (20s | Frames 1-600)

- **Educational Purpose**: Introduce quantum gates as geometric rotations on the Bloch sphere.
- **Spoken Narration**: *"In classical circuits, logic gates manipulate discrete bits through Boolean algebra: AND, OR, NOT. In quantum circuits, single-qubit gates are continuous geometric rotations of our state vector across the Bloch sphere."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 8: SINGLE-QUBIT QUANTUM GATES at position [-6.0, 3.8, 0.1]
  - `[SUBHEADER]` Unitary Operators & The Geometry of Computation at position [-6.0, 3.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-02: The Unitarity Requirement (25s | Frames 601-1350)

- **Educational Purpose**: Define unitary matrices and explain why quantum operations preserve probability.
- **Spoken Narration**: *"Every valid quantum gate must be represented by a unitary matrix U. Unitarity means that U dagger times U equals the identity matrix. This guarantees that total probability is strictly conserved and operations are reversible."*
- **On-Screen Typography**:
  - `[HEADER]` The Unitarity Condition at position [0.0, 2.0, 0.1]
  - `[FORMULA]` U† · U = I  (U† = (U*)ᵀ) at position [0.0, 0.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-03: The Pauli Gates: X, Y, and Z (35s | Frames 1351-2400)

- **Educational Purpose**: Introduce the three Pauli matrices and their algebraic actions.
- **Spoken Narration**: *"The fundamental single-qubit operators are the Pauli matrices. Pauli-X is the quantum NOT gate, rotating 180 degrees around the X-axis. Pauli-Z flips phase by 180 degrees around the Z-axis. And Pauli-Y flips both bit and phase."*
- **On-Screen Typography**:
  - `[FORMULA]` X = [ [0, 1], [1, 0] ] at position [-4.5, 0.5, 0.1]
  - `[FORMULA]` Y = [ [0, -i], [i, 0] ] at position [0.0, 0.5, 0.1]
  - `[FORMULA]` Z = [ [1, 0], [0, -1] ] at position [4.5, 0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-04: Phase Gates: S and T (30s | Frames 2401-3300)

- **Educational Purpose**: Explain the S and T phase hierarchy (Z -> S -> T).
- **Spoken Narration**: *"Beyond full 180-degree flips, we need finer phase control. The S gate applies a 90-degree phase shift—it is the square root of Z. The T gate applies a 45-degree phase shift—the fourth root of Z, crucial for universal quantum computation."*
- **On-Screen Typography**:
  - `[FORMULA]` S = [ [1, 0], [0, i] ] at position [-3.5, 0.5, 0.1]
  - `[FORMULA]` T = [ [1, 0], [0, e^(iπ/4)] ] at position [3.5, 0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-05: Continuous Rotation Gates: Rx, Ry, Rz (35s | Frames 3301-4350)

- **Educational Purpose**: Introduce continuous rotation gates used in quantum algorithms and machine learning.
- **Spoken Narration**: *"To point anywhere on the Bloch sphere, we use continuous rotation gates: Rx(θ), Ry(θ), and Rz(θ). These parametric gates rotate the state vector by any arbitrary angle theta around their respective Cartesian axes."*
- **On-Screen Typography**:
  - `[HEADER]` Continuous Parametric Rotation Gates at position [0.0, 2.5, 0.1]
  - `[FORMULA]` Rz(θ) = [ [e^(-iθ/2), 0], [0, e^(iθ/2)] ] at position [0.0, 0.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-06: Self-Inverse and Cancellation Rules (30s | Frames 4351-5250)

- **Educational Purpose**: Connect linear algebraic gate inverses to compiler circuit optimization.
- **Spoken Narration**: *"Many quantum gates are self-inverse: applying X twice returns the state to identity: X · X = I. The same holds for Hadamard: H · H = I. In QUALUTION's circuit optimizer, adjacent identical gates are automatically cancelled!"*
- **On-Screen Typography**:
  - `[HEADER]` Self-Inverse Cancellation Rules at position [0.0, 2.0, 0.1]
  - `[FORMULA]` X · X = I   |   H · H = I   |   Z · Z = I at position [0.0, 0.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-07: Summary & Next Steps (35s | Frames 5251-6300)

- **Educational Purpose**: Consolidate gate taxonomy and preview multi-gate circuit architecture.
- **Spoken Narration**: *"We now possess the complete single-qubit gate toolkit: Pauli X, Y, Z, Hadamard, S, T, and continuous rotations. In Lesson 9, we assemble these gates into full quantum circuits on a quantum circuit timeline."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 8 SUMMARY at position [0.0, 3.0, 0.1]
  - `[BODY]` 1. Unitarity: U†U = I preserves probability length at position [0.0, 1.2, 0.1]
  - `[BODY]` 2. Pauli Gates: X (Bit flip), Z (Phase flip), Y (Both) at position [0.0, 0.2, 0.1]
  - `[BODY]` 3. Phase & Rotations: H (Superposition), S, T, Rx, Ry, Rz at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: fade_to_black

---

