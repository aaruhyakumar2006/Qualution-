# QUALUTION Visual Storyboard — The Computational Basis

- **Lesson ID**: `s1-theory-computational-basis`
- **Total Duration**: 230s (6900 frames at 30 fps)

---

### Scene scene-01: Coordinate Systems of Quantum Reality (20s | Frames 1-600)

- **Educational Purpose**: Establish coordinate system analogy for computational basis vectors.
- **Spoken Narration**: *"To measure and navigate physical space, we rely on coordinate axes: X, Y, and Z. In quantum computing, the computational basis serves as the foundational coordinate system for all quantum information."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 3: THE COMPUTATIONAL BASIS at position [-6.0, 3.8, 0.1]
  - `[SUBHEADER]` Reference Frames & Orthonormal Coordinates at position [-6.0, 3.2, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-02: The Z-Basis: |0⟩ and |1⟩ (25s | Frames 601-1350)

- **Educational Purpose**: Formalize the Z-basis eigenstates and Pauli-Z eigenvalues.
- **Spoken Narration**: *"By international convention, the standard computational basis corresponds to measurement along the Z-axis of the Bloch sphere. We denote these standard eigenstates as ket zero and ket one."*
- **On-Screen Typography**:
  - `[HEADER]` Standard Z-Basis: B = { |0⟩, |1⟩ } at position [0.0, 2.0, 0.1]
  - `[FORMULA]` σ_z |0⟩ = +1|0⟩,   σ_z |1⟩ = -1|1⟩ at position [0.0, 0.0, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-03: Bra Vectors and Dual Space (30s | Frames 1351-2250)

- **Educational Purpose**: Introduce bra vectors and conjugate transpose operations.
- **Spoken Narration**: *"For every ket vector |ψ⟩ in our Hilbert space, there is a corresponding dual vector called a bra, written ⟨ψ|. Mathematically, the bra is formed by taking the complex conjugate transpose of the column ket."*
- **On-Screen Typography**:
  - `[FORMULA]` ⟨0| = [ 1, 0 ] at position [0.0, 1.2, 0.1]
  - `[FORMULA]` ⟨1| = [ 0, 1 ] at position [0.0, -0.4, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-04: The Inner Product & Orthonormality (35s | Frames 2251-3300)

- **Educational Purpose**: Demonstrate the mathematical definition and geometric meaning of orthogonality.
- **Spoken Narration**: *"When a bra and ket meet, they form a bracket—an inner product representing geometric overlap. The computational basis states are orthonormal: ⟨0|0⟩ equals one, ⟨1|1⟩ equals one, but ⟨0|1⟩ equals zero."*
- **On-Screen Typography**:
  - `[FORMULA]` ⟨i|j⟩ = δ_ij (Kronecker Delta) at position [0.0, 1.0, 0.1]
  - `[SUBHEADER]` ⟨0|0⟩ = 1 (Identical) | ⟨0|1⟩ = 0 (Orthogonal) at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-05: Decomposition of Arbitrary States (30s | Frames 3301-4200)

- **Educational Purpose**: Show how projection onto basis vectors extracts probability amplitudes.
- **Spoken Narration**: *"Because {|0⟩, |1⟩} spans the entire two-dimensional space, we can project any state vector onto our basis using inner products. The amplitude α is simply ⟨0|ψ⟩, and β is ⟨1|ψ⟩."*
- **On-Screen Typography**:
  - `[FORMULA]` α = ⟨0|ψ⟩,   β = ⟨1|ψ⟩ at position [0.0, 0.8, 0.1]
  - `[FORMULA]` |ψ⟩ = |0⟩⟨0|ψ⟩ + |1⟩⟨1|ψ⟩ at position [0.0, -0.6, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-06: The Completeness Identity (25s | Frames 4201-4950)

- **Educational Purpose**: Introduce projection operators and the completeness relation.
- **Spoken Narration**: *"By summing the outer products of our orthonormal basis, we obtain the identity operator: |0⟩⟨0| + |1⟩⟨1| equals the identity matrix I. This completeness relation ensures quantum operations preserve total geometry."*
- **On-Screen Typography**:
  - `[FORMULA]` |0⟩⟨0| + |1⟩⟨1| = I = [ [1, 0], [0, 1] ] at position [0.0, 0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-07: Physical Readout in the Z-Basis (35s | Frames 4951-6000)

- **Educational Purpose**: Tie mathematical basis projection directly to physical quantum computer measurement.
- **Spoken Narration**: *"In physical quantum hardware—whether transmon microwave resonators or ion-trap lasers—readout devices measure qubits directly in this computational Z-basis, collapsing quantum superposition into classical bits."*
- **On-Screen Typography**:
  - `[HEADER]` Physical Readout & Wavefunction Collapse at position [0.0, 2.5, 0.1]
  - `[BODY]` Outcome 0: State collapses to |0⟩ at position [0.0, 0.5, 0.1]
  - `[BODY]` Outcome 1: State collapses to |1⟩ at position [0.0, -0.5, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: smooth_crossfade

---

### Scene scene-08: Summary & Next Steps (30s | Frames 6001-6900)

- **Educational Purpose**: Wrap up computational basis concepts and preview superposition.
- **Spoken Narration**: *"We have seen that the computational basis provides the orthonormal coordinates for quantum computation: ⟨i|j⟩ = δ_ij. Next, we discover what happens when a qubit occupies both states simultaneously: Superposition."*
- **On-Screen Typography**:
  - `[HEADER]` LESSON 3 SUMMARY at position [0.0, 3.0, 0.1]
  - `[BODY]` 1. Computational Basis = Standard Z-Axis Coordinate Frame at position [0.0, 1.2, 0.1]
  - `[BODY]` 2. Orthonormality: ⟨0|0⟩ = 1, ⟨1|1⟩ = 1, ⟨0|1⟩ = 0 at position [0.0, 0.2, 0.1]
  - `[BODY]` 3. Amplitude extraction via projection: α = ⟨0|ψ⟩, β = ⟨1|ψ⟩ at position [0.0, -0.8, 0.1]
- **Visual Elements & Rigging**: background_plate, vector_diagram
- **Camera & Transition**: fade_to_black

---

