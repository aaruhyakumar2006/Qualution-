"""
Production Generator for QUALUTION Theoretical Video Pipeline
Generates complete, schema-compliant specifications (scene-spec.json, narration.md, storyboard.md)
for Lessons 02 to 11 in Sprint 1 (Quantum Foundations).
"""

import json
import os

LESSONS_DATA = [
    {
        "folder": "lesson02_qubits_and_states",
        "lessonId": "s1-theory-qubits-states",
        "lessonTitle": "Qubits & Quantum States",
        "targetDuration": 240,
        "objectives": [
            "Explain the physical representation of quantum two-level systems.",
            "Understand Dirac bra-ket notation for state vectors |0⟩ and |1⟩.",
            "Interpret the statevector equation |ψ⟩ = α|0⟩ + β|1⟩.",
            "Recognize complex probability amplitudes α and β.",
            "Understand the normalization constraint |α|² + |β|² = 1.",
            "Visualize state vectors on the 3D Bloch sphere representation."
        ],
        "boundaries": {
            "topicsCovered": [
                "Two-level quantum systems (photons, trapped ions, superconductors)",
                "Dirac ket notation |ψ⟩",
                "Column vector representation of computational basis states",
                "Linear combinations of basis states",
                "Normalization condition |α|² + |β|² = 1",
                "Introduction to the Bloch sphere sphere surface"
            ],
            "topicsDeferred": [
                "Full Born rule collapse dynamics (Lesson 5)",
                "Relative vs global phase geometry (Lesson 7)",
                "Matrix representations of quantum gates (Lesson 8)",
                "Entanglement and multi-qubit tensor products (Sprint 2)"
            ]
        },
        "scenes": [
            {
                "title": "The Quantum Continuum",
                "duration": 20,
                "narration": "In the classical realm, information is rigidly binary: a switch is on or off, a transistor is charged or uncharged. But nature at the microscopic scale is not discrete—it is continuous.",
                "captions": [
                    {"text": "In the classical realm, information is rigidly binary: 0 or 1.", "dur": 9},
                    {"text": "At the microscopic scale, quantum physical systems behave continuously.", "dur": 11}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 2: QUBITS & QUANTUM STATES", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "The Continuous Spectrum of Quantum Information", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Hook the learner by contrasting discrete classical switches with continuous quantum physical systems."
            },
            {
                "title": "Physical Realizations of Qubits",
                "duration": 25,
                "narration": "Any quantum system with two distinct, measurable energy levels can serve as a qubit. Examples include the spin of an electron, the polarization of a photon, or artificial atoms built from superconducting Josephson junctions.",
                "captions": [
                    {"text": "Any two-level quantum system can serve as a physical qubit.", "dur": 11},
                    {"text": "Examples: electron spin, photon polarization, or superconducting circuits.", "dur": 14}
                ],
                "onScreenText": [
                    {"id": "txt_types", "text": "Physical Two-Level Quantum Systems", "role": "header", "position": [-5.0, 3.5, 0.1]},
                    {"id": "txt_spin", "text": "Spin-1/2 Particles (Up / Down)", "role": "body", "position": [-5.0, 2.0, 0.1]},
                    {"id": "txt_super", "text": "Superconducting Transmon Qubits", "role": "body", "position": [-5.0, 1.0, 0.1]}
                ],
                "purpose": "Ground mathematical abstractions in real experimental quantum hardware physics."
            },
            {
                "title": "Dirac Notation & State Vectors",
                "duration": 30,
                "narration": "To mathematically capture quantum states, physicist Paul Dirac introduced bra-ket notation. We write the state of our qubit as a ket vector, denoted |ψ⟩, which lives in a two-dimensional complex Hilbert space.",
                "captions": [
                    {"text": "Physicist Paul Dirac introduced ket notation: |ψ⟩.", "dur": 12},
                    {"text": "A single qubit state lives in a 2-dimensional complex vector space.", "dur": 18}
                ],
                "onScreenText": [
                    {"id": "txt_dirac", "text": "|ψ⟩ = α|0⟩ + β|1⟩", "role": "formula", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_hilbert", "text": "State Vector in Hilbert Space ℂ²", "role": "subheader", "position": [0.0, -1.5, 0.1]}
                ],
                "purpose": "Introduce Dirac notation and formal column vector space conventions."
            },
            {
                "title": "The Basis Vectors |0⟩ and |1⟩",
                "duration": 25,
                "narration": "The standard computational basis consists of two orthogonal column vectors: |0⟩ represented as [1, 0] transpose, and |1⟩ represented as [0, 1] transpose. Any arbitrary state is a linear combination of these two axes.",
                "captions": [
                    {"text": "Computational basis: |0⟩ = [1, 0]ᵀ and |1⟩ = [0, 1]ᵀ.", "dur": 13},
                    {"text": "Any state is a linear superposition: |ψ⟩ = α|0⟩ + β|1⟩.", "dur": 12}
                ],
                "onScreenText": [
                    {"id": "txt_b0", "text": "|0⟩ = [ 1, 0 ]ᵀ", "role": "formula", "position": [-3.5, 0.0, 0.1]},
                    {"id": "txt_b1", "text": "|1⟩ = [ 0, 1 ]ᵀ", "role": "formula", "position": [3.5, 0.0, 0.1]}
                ],
                "purpose": "Connect Dirac notation directly to standard linear algebra matrix/vector notation."
            },
            {
                "title": "Complex Probability Amplitudes",
                "duration": 30,
                "narration": "The coefficients α and β are not probabilities themselves—they are complex numbers known as probability amplitudes. Each amplitude contains both a magnitude and an intrinsic quantum phase angle.",
                "captions": [
                    {"text": "Coefficients α and β are complex probability amplitudes (α, β ∈ ℂ).", "dur": 14},
                    {"text": "Each amplitude possesses both a magnitude and a quantum phase.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_amp", "text": "α, β ∈ ℂ", "role": "formula", "position": [0.0, 1.5, 0.1]},
                    {"id": "txt_polar", "text": "α = r₀ e^(iθ₀),  β = r₁ e^(iθ₁)", "role": "formula", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Clarify the distinction between probability amplitudes and classical probabilities."
            },
            {
                "title": "The Normalization Constraint",
                "duration": 25,
                "narration": "Because total probability must always equal 100%, quantum states obey the strict normalization constraint: the absolute square of α plus the absolute square of β must equal exactly one.",
                "captions": [
                    {"text": "Total probability must equal 1: |α|² + |β|² = 1.", "dur": 12},
                    {"text": "Measurement guarantees one of the two computational basis outcomes.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_norm", "text": "|α|² + |β|² = 1.0", "role": "formula", "position": [0.0, 0.8, 0.1]},
                    {"id": "txt_cons", "text": "Law of Conservation of Quantum Probability", "role": "subheader", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Derive and emphasize the fundamental probability normalization invariant."
            },
            {
                "title": "Bloch Sphere Visualization",
                "duration": 35,
                "narration": "Because of normalization and global phase invariance, every pure single-qubit state maps to a unique point on the surface of a three-dimensional unit sphere called the Bloch Sphere. |0⟩ sits at the North Pole, and |1⟩ at the South Pole.",
                "captions": [
                    {"text": "Pure single-qubit states map to points on the 3D Bloch Sphere.", "dur": 16},
                    {"text": "North Pole represents |0⟩; South Pole represents |1⟩.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_bloch", "text": "The Bloch Sphere Representation", "role": "header", "position": [-5.0, 3.5, 0.1]},
                    {"id": "txt_north", "text": "North Pole: |0⟩", "role": "body", "position": [3.5, 2.5, 0.1]},
                    {"id": "txt_south", "text": "South Pole: |1⟩", "role": "body", "position": [3.5, -2.5, 0.1]}
                ],
                "purpose": "Introduce the geometric representation of single-qubit state space."
            },
            {
                "title": "Key Takeaways & Summary",
                "duration": 30,
                "narration": "In summary: a qubit is a physical two-level quantum system represented as |ψ⟩ = α|0⟩ + β|1⟩. Its complex amplitudes dictate probabilities upon measurement, constrained to total unity. Next, we explore the computational basis in depth.",
                "captions": [
                    {"text": "Summary: |ψ⟩ = α|0⟩ + β|1⟩ with |α|² + |β|² = 1.", "dur": 14},
                    {"text": "Next up: diving into the computational basis and vector orthogonality.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 2 SUMMARY", "role": "header", "position": [0.0, 3.2, 0.1]},
                    {"id": "txt_sum1", "text": "1. Qubit: 2-level quantum state in ℂ²", "role": "body", "position": [0.0, 1.5, 0.1]},
                    {"id": "txt_sum2", "text": "2. State: |ψ⟩ = α|0⟩ + β|1⟩", "role": "body", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_sum3", "text": "3. Normalization: |α|² + |β|² = 1", "role": "body", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Reinforce core concepts and transition smoothly to Lesson 3."
            }
        ]
    },
    {
        "folder": "lesson03_computational_basis",
        "lessonId": "s1-theory-computational-basis",
        "lessonTitle": "The Computational Basis",
        "targetDuration": 240,
        "objectives": [
            "Define orthogonal computational basis states in Hilbert space.",
            "Understand inner products and vector orthonormality ⟨i|j⟩ = δ_ij.",
            "Decompose arbitrary quantum states onto orthogonal basis axes.",
            "Understand quantum measurement as projection onto basis vectors.",
            "Connect computational basis vectors to physical hardware readout registers."
        ],
        "boundaries": {
            "topicsCovered": [
                "Z-basis computational states {|0⟩, |1⟩}",
                "Bra vectors ⟨0| and ⟨1| as conjugate transposes",
                "Inner products and orthonormality: ⟨0|0⟩ = 1, ⟨0|1⟩ = 0",
                "Completeness relation |0⟩⟨0| + |1⟩⟨1| = I",
                "Projective measurement onto the Z-axis"
            ],
            "topicsDeferred": [
                "Alternative basis sets like X-basis {|+⟩, |-⟩} (Lesson 4 & 7)",
                "Unitary transformations rotating basis axes (Lesson 8)",
                "Multi-qubit product basis states (Sprint 2)"
            ]
        },
        "scenes": [
            {
                "title": "Coordinate Systems of Quantum Reality",
                "duration": 20,
                "narration": "To measure and navigate physical space, we rely on coordinate axes: X, Y, and Z. In quantum computing, the computational basis serves as the foundational coordinate system for all quantum information.",
                "captions": [
                    {"text": "Every vector space requires a reference coordinate system.", "dur": 10},
                    {"text": "The computational basis defines the primary reference frame of quantum computing.", "dur": 10}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 3: THE COMPUTATIONAL BASIS", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "Reference Frames & Orthonormal Coordinates", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Establish coordinate system analogy for computational basis vectors."
            },
            {
                "title": "The Z-Basis: |0⟩ and |1⟩",
                "duration": 25,
                "narration": "By international convention, the standard computational basis corresponds to measurement along the Z-axis of the Bloch sphere. We denote these standard eigenstates as ket zero and ket one.",
                "captions": [
                    {"text": "The computational basis aligns with the Z-axis of measurement.", "dur": 12},
                    {"text": "Eigenstates are denoted |0⟩ and |1⟩.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_basis", "text": "Standard Z-Basis: B = { |0⟩, |1⟩ }", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_zaxis", "text": "σ_z |0⟩ = +1|0⟩,   σ_z |1⟩ = -1|1⟩", "role": "formula", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Formalize the Z-basis eigenstates and Pauli-Z eigenvalues."
            },
            {
                "title": "Bra Vectors and Dual Space",
                "duration": 30,
                "narration": "For every ket vector |ψ⟩ in our Hilbert space, there is a corresponding dual vector called a bra, written ⟨ψ|. Mathematically, the bra is formed by taking the complex conjugate transpose of the column ket.",
                "captions": [
                    {"text": "For every ket |ψ⟩, the dual bra vector is ⟨ψ| = (|ψ⟩)†.", "dur": 14},
                    {"text": "The bra vector is the conjugate transpose row vector.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_bra0", "text": "⟨0| = [ 1, 0 ]", "role": "formula", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_bra1", "text": "⟨1| = [ 0, 1 ]", "role": "formula", "position": [0.0, -0.4, 0.1]}
                ],
                "purpose": "Introduce bra vectors and conjugate transpose operations."
            },
            {
                "title": "The Inner Product & Orthonormality",
                "duration": 35,
                "narration": "When a bra and ket meet, they form a bracket—an inner product representing geometric overlap. The computational basis states are orthonormal: ⟨0|0⟩ equals one, ⟨1|1⟩ equals one, but ⟨0|1⟩ equals zero.",
                "captions": [
                    {"text": "A bra and ket form an inner product: ⟨φ|ψ⟩.", "dur": 15},
                    {"text": "Orthonormality: ⟨0|0⟩ = 1, ⟨1|1⟩ = 1, and ⟨0|1⟩ = 0.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_ortho", "text": "⟨i|j⟩ = δ_ij (Kronecker Delta)", "role": "formula", "position": [0.0, 1.0, 0.1]},
                    {"id": "txt_overlap", "text": "⟨0|0⟩ = 1 (Identical) | ⟨0|1⟩ = 0 (Orthogonal)", "role": "subheader", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Demonstrate the mathematical definition and geometric meaning of orthogonality."
            },
            {
                "title": "Decomposition of Arbitrary States",
                "duration": 30,
                "narration": "Because {|0⟩, |1⟩} spans the entire two-dimensional space, we can project any state vector onto our basis using inner products. The amplitude α is simply ⟨0|ψ⟩, and β is ⟨1|ψ⟩.",
                "captions": [
                    {"text": "Any state decomposes as: |ψ⟩ = ⟨0|ψ⟩|0⟩ + ⟨1|ψ⟩|1⟩.", "dur": 14},
                    {"text": "Amplitudes α = ⟨0|ψ⟩ and β = ⟨1|ψ⟩ measure projection onto each basis axis.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_decomp", "text": "α = ⟨0|ψ⟩,   β = ⟨1|ψ⟩", "role": "formula", "position": [0.0, 0.8, 0.1]},
                    {"id": "txt_proj", "text": "|ψ⟩ = |0⟩⟨0|ψ⟩ + |1⟩⟨1|ψ⟩", "role": "formula", "position": [0.0, -0.6, 0.1]}
                ],
                "purpose": "Show how projection onto basis vectors extracts probability amplitudes."
            },
            {
                "title": "The Completeness Identity",
                "duration": 25,
                "narration": "By summing the outer products of our orthonormal basis, we obtain the identity operator: |0⟩⟨0| + |1⟩⟨1| equals the identity matrix I. This completeness relation ensures quantum operations preserve total geometry.",
                "captions": [
                    {"text": "Outer product sum: |0⟩⟨0| + |1⟩⟨1| = I.", "dur": 12},
                    {"text": "Completeness guarantees that probability is conserved across the space.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_id", "text": "|0⟩⟨0| + |1⟩⟨1| = I = [ [1, 0], [0, 1] ]", "role": "formula", "position": [0.0, 0.5, 0.1]}
                ],
                "purpose": "Introduce projection operators and the completeness relation."
            },
            {
                "title": "Physical Readout in the Z-Basis",
                "duration": 35,
                "narration": "In physical quantum hardware—whether transmon microwave resonators or ion-trap lasers—readout devices measure qubits directly in this computational Z-basis, collapsing quantum superposition into classical bits.",
                "captions": [
                    {"text": "Quantum hardware measurement devices operate in the Z-basis.", "dur": 16},
                    {"text": "Measurement projects the qubit onto either |0⟩ or |1⟩.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_meas", "text": "Physical Readout & Wavefunction Collapse", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_m0", "text": "Outcome 0: State collapses to |0⟩", "role": "body", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_m1", "text": "Outcome 1: State collapses to |1⟩", "role": "body", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Tie mathematical basis projection directly to physical quantum computer measurement."
            },
            {
                "title": "Summary & Next Steps",
                "duration": 30,
                "narration": "We have seen that the computational basis provides the orthonormal coordinates for quantum computation: ⟨i|j⟩ = δ_ij. Next, we discover what happens when a qubit occupies both states simultaneously: Superposition.",
                "captions": [
                    {"text": "Summary: Orthonormal basis {|0⟩, |1⟩} spans all single-qubit states.", "dur": 14},
                    {"text": "Next: creating and manipulating quantum Superposition.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 3 SUMMARY", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_s1", "text": "1. Computational Basis = Standard Z-Axis Coordinate Frame", "role": "body", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_s2", "text": "2. Orthonormality: ⟨0|0⟩ = 1, ⟨1|1⟩ = 1, ⟨0|1⟩ = 0", "role": "body", "position": [0.0, 0.2, 0.1]},
                    {"id": "txt_s3", "text": "3. Amplitude extraction via projection: α = ⟨0|ψ⟩, β = ⟨1|ψ⟩", "role": "body", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Wrap up computational basis concepts and preview superposition."
            }
        ]
    },
    {
        "folder": "lesson04_superposition",
        "lessonId": "s1-theory-superposition",
        "lessonTitle": "Understanding Superposition",
        "targetDuration": 240,
        "objectives": [
            "Demystify quantum superposition beyond popular science tropes.",
            "Understand superposition as linear combinations of state vectors in Hilbert space.",
            "Differentiate equal superposition from classical probabilistic mixtures.",
            "Analyze the Hadamard gate H and its transformation of basis vectors.",
            "Recognize the plus state |+⟩ and minus state |-⟩.",
            "Explain quantum parallelism and its computational implications."
        ],
        "boundaries": {
            "topicsCovered": [
                "Linear superposition as vector addition in vector space",
                "Superposition vs classical coin flips / mixed states",
                "The Hadamard gate transformation matrix",
                "Creation of the plus state |+⟩ = (|0⟩ + |1⟩)/√2",
                "Creation of the minus state |-⟩ = (|0⟩ - |1⟩)/√2",
                "Equator of the Bloch sphere"
            ],
            "topicsDeferred": [
                "Exact Born rule probability formulas (Lesson 5)",
                "Relative phase rotations around the Z-axis (Lesson 7)",
                "Multi-qubit superposition and exponential scaling (Lesson 9 & Sprint 2)"
            ]
        },
        "scenes": [
            {
                "title": "The Myth vs Reality of Superposition",
                "duration": 20,
                "narration": "Popular media often claims that a qubit is 'in two states at the same time.' But mathematically, a qubit in superposition is simply in ONE definite quantum state—a linear combination of basis vectors.",
                "captions": [
                    {"text": "Myth: A qubit is 'magically in two places at once.'", "dur": 9},
                    {"text": "Reality: A qubit is in ONE definite state: a linear combination of basis vectors.", "dur": 11}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 4: UNDERSTANDING SUPERPOSITION", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_myth", "text": "Beyond the Pop-Science Tropes", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Debunk misconceptions about superposition and replace them with rigorous linear algebraic intuition."
            },
            {
                "title": "Vector Addition in Hilbert Space",
                "duration": 25,
                "narration": "Think of classical bits as navigating along a single vertical line between 0 and 1. A qubit expands this line into a continuous plane: by adding vectors α|0⟩ and β|1⟩, we point anywhere on the unit circle.",
                "captions": [
                    {"text": "Classical bits exist only at discrete endpoints: 0 or 1.", "dur": 11},
                    {"text": "Quantum superposition is vector addition: α|0⟩ + β|1⟩.", "dur": 14}
                ],
                "onScreenText": [
                    {"id": "txt_vec", "text": "|ψ⟩ = α|0⟩ + β|1⟩", "role": "formula", "position": [0.0, 1.5, 0.1]},
                    {"id": "txt_diag", "text": "Vector Superposition in 2D Complex Plane", "role": "subheader", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Provide visual geometric intuition for linear combinations."
            },
            {
                "title": "Superposition vs Classical Probability",
                "duration": 30,
                "narration": "A classical coin spinning in the air has a 50 percent chance of heads, but at every microsecond it is in a definite classical state—you simply lack knowledge. A qubit in superposition is fundamentally indeterminate until measured.",
                "captions": [
                    {"text": "A flipped coin is classically deterministic with subjective ignorance.", "dur": 14},
                    {"text": "A quantum superposition holds intrinsic wave potential and phase.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_comp", "text": "Classical Mixture vs Quantum Superposition", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_coin", "text": "Coin: Epistemic ignorance (p=0.5)", "role": "body", "position": [-4.0, 0.0, 0.1]},
                    {"id": "txt_qstate", "text": "Qubit: Coherent wave state with phase", "role": "body", "position": [4.0, 0.0, 0.1]}
                ],
                "purpose": "Clearly distinguish epistemic classical uncertainty from quantum ontological coherence."
            },
            {
                "title": "The Hadamard Gate (H)",
                "duration": 30,
                "narration": "How do we create superposition in a quantum circuit? The most important tool is the Hadamard gate, denoted H. Applying H to the ground state |0⟩ produces an equal superposition of |0⟩ and |1⟩.",
                "captions": [
                    {"text": "The Hadamard gate (H) is the primary gateway to superposition.", "dur": 13},
                    {"text": "Applying H to |0⟩ yields: H|0⟩ = (|0⟩ + |1⟩) / √2.", "dur": 17}
                ],
                "onScreenText": [
                    {"id": "txt_h_matrix", "text": "H = (1/√2) [ [1,  1], [1, -1] ]", "role": "formula", "position": [0.0, 1.5, 0.1]},
                    {"id": "txt_h_op", "text": "H |0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2", "role": "formula", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Introduce the Hadamard gate matrix and its mathematical action on basis states."
            },
            {
                "title": "The Plus and Minus States: |+⟩ and |-⟩",
                "duration": 30,
                "narration": "When H acts on |0⟩, it creates the plus state |+⟩. But when H acts on |1⟩, it introduces a negative sign: the minus state |-⟩ = (|0⟩ - |1⟩)/√2. Both have equal 50/50 measurement probabilities, but different internal phases!",
                "captions": [
                    {"text": "H|0⟩ = |+⟩ = (|0⟩ + |1⟩)/√2.  H|1⟩ = |-⟩ = (|0⟩ - |1⟩)/√2.", "dur": 15},
                    {"text": "Both have 50% probabilities, but completely opposite internal phases!", "dur": 15}
                ],
                "onScreenText": [
                    {"id": "txt_plus", "text": "|+⟩ = (|0⟩ + |1⟩) / √2", "role": "formula", "position": [-3.5, 0.5, 0.1]},
                    {"id": "txt_minus", "text": "|-⟩ = (|0⟩ - |1⟩) / √2", "role": "formula", "position": [3.5, 0.5, 0.1]}
                ],
                "purpose": "Demonstrate the critical difference between |+⟩ and |-⟩ states."
            },
            {
                "title": "Superposition on the Bloch Sphere",
                "duration": 35,
                "narration": "On the Bloch sphere, the Hadamard gate rotates the state vector 90 degrees from the North Pole down to the equator along the positive X-axis for |+⟩, and the negative X-axis for |-⟩.",
                "captions": [
                    {"text": "Hadamard rotates the state from the Z-pole to the equatorial plane.", "dur": 16},
                    {"text": "|+⟩ lies along the +X axis; |-⟩ lies along the -X axis.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_bloch_eq", "text": "Equatorial States on the Bloch Sphere", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_xpos", "text": "+X Axis: |+⟩", "role": "body", "position": [3.5, 1.0, 0.1]},
                    {"id": "txt_xneg", "text": "-X Axis: |-⟩", "role": "body", "position": [-3.5, 1.0, 0.1]}
                ],
                "purpose": "Visualize Hadamard rotation geometrically on the Bloch sphere."
            },
            {
                "title": "The Power of Quantum Parallelism",
                "duration": 35,
                "narration": "Superposition is the engine of quantum advantage. When we place n qubits into superposition, our register simultaneously represents 2 to the power of n basis states—allowing a quantum computer to evaluate entire search spaces in parallel.",
                "captions": [
                    {"text": "Superposition is the engine of quantum advantage.", "dur": 15},
                    {"text": "n qubits in superposition encode 2ⁿ basis states simultaneously.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_scale", "text": "Quantum Parallelism: 2ⁿ States", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_ex1", "text": "10 qubits = 1,024 states", "role": "body", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_ex2", "text": "50 qubits = 1.12 × 10¹⁵ states", "role": "body", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Explain how single-qubit superposition scales into multi-qubit exponential parallelism."
            },
            {
                "title": "Summary & Practical Connection",
                "duration": 35,
                "narration": "To recap: superposition is a coherent linear combination of quantum basis states created by gates like the Hadamard. Next in Lesson 5, we discover what happens when we observe a superposition: Born's Rule and wavefunction collapse.",
                "captions": [
                    {"text": "Summary: Superposition is linear vector combination created by H.", "dur": 15},
                    {"text": "Next: Lesson 5 — Measurement, Born's Rule, and Wavefunction Collapse.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 4 SUMMARY", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_r1", "text": "1. |ψ⟩ = α|0⟩ + β|1⟩ represents a coherent vector state", "role": "body", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_r2", "text": "2. H|0⟩ = |+⟩ and H|1⟩ = |-⟩ create equal superpositions", "role": "body", "position": [0.0, 0.2, 0.1]},
                    {"id": "txt_r3", "text": "3. Superposition scales exponentially: 2ⁿ states across n qubits", "role": "body", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Summarize lesson findings and build excitement for measurement theory."
            }
        ]
    }
]

def generate_lesson_spec(lesson_info):
    folder_path = os.path.join("qualution-video", "lessons", "sprint-01", lesson_info["folder"])
    os.makedirs(folder_path, exist_ok=True)
    
    fps = 30
    scenes_spec = []
    current_frame = 1
    total_duration = 0
    
    for idx, s in enumerate(lesson_info["scenes"]):
        dur = s["duration"]
        start_f = current_frame
        end_f = start_f + int(dur * fps) - 1
        total_duration += dur
        
        # Build captions array
        caps = []
        cap_frame = start_f
        for c in s["captions"]:
            c_len = int(c["dur"] * fps)
            caps.append({
                "text": c["text"],
                "startFrame": cap_frame,
                "endFrame": cap_frame + c_len - 1
            })
            cap_frame += c_len
            
        scene_item = {
            "id": f"scene-{idx+1:02d}",
            "title": s["title"],
            "durationSeconds": dur,
            "startFrame": start_f,
            "endFrame": end_f,
            "narration": {
                "speaker": "QUALUTION Narrator",
                "text": s["narration"],
                "tone": "Authoritative, pedagogically clear, engaging",
                "pacingWpm": 130
            },
            "captions": caps,
            "onScreenText": s["onScreenText"],
            "visualElements": [
                {
                    "id": f"vis_{idx+1}_bg",
                    "type": "background_plate",
                    "source": "assets/backgrounds/deep_space_grid.png",
                    "layer": "background"
                },
                {
                    "id": f"vis_{idx+1}_stage",
                    "type": "vector_diagram",
                    "source": "procedural_blender_object",
                    "layer": "primary"
                }
            ],
            "animationActions": [
                {
                    "target": f"vis_{idx+1}_stage",
                    "action": "fade_in_and_settle",
                    "startFrame": start_f,
                    "durationFrames": 30
                }
            ],
            "assetsRequired": ["deep_space_grid.png", "ibm_quantum_palette.blend"],
            "educationalPurpose": s["purpose"],
            "transitionOut": "smooth_crossfade" if idx < len(lesson_info["scenes"]) - 1 else "fade_to_black"
        }
        scenes_spec.append(scene_item)
        current_frame = end_f + 1
        
    spec_data = {
        "$schema": "../scene-schema.md",
        "lessonId": lesson_info["lessonId"],
        "lessonTitle": lesson_info["lessonTitle"],
        "sprintId": "sprint-01",
        "targetDurationSeconds": total_duration,
        "fps": fps,
        "totalFrames": current_frame - 1,
        "resolution": {
            "width": 1920,
            "height": 1080
        },
        "aspectRatio": "16:9",
        "learningObjectives": lesson_info["objectives"],
        "curriculumBoundaries": lesson_info["boundaries"],
        "scenes": scenes_spec
    }
    
    # Write scene-spec.json
    spec_file = os.path.join(folder_path, "scene-spec.json")
    with open(spec_file, "w", encoding="utf-8") as f:
        json.dump(spec_data, f, indent=2)
    print(f"Generated {spec_file} ({total_duration}s, {len(scenes_spec)} scenes)")
    
    # Write narration.md
    narr_file = os.path.join(folder_path, "narration.md")
    with open(narr_file, "w", encoding="utf-8") as f:
        f.write(f"# QUALUTION Voiceover & Narration Script — {lesson_info['lessonTitle']}\n\n")
        f.write(f"- **Lesson ID**: `{lesson_info['lessonId']}`\n")
        f.write(f"- **Sprint**: Sprint 1 (Quantum Foundations)\n")
        f.write(f"- **Target Video Duration**: {total_duration // 60}m {total_duration % 60}s ({total_duration}s)\n")
        f.write(f"- **Average Spoken Pacing**: ~130 words per minute\n")
        f.write(f"- **Tone**: Authoritative, engaging, mathematically sound, educational\n\n---\n\n")
        f.write("## Pronunciation & Key Notation Guide\n\n")
        f.write("| Term | Pronunciation Guide | Meaning |\n|---|---|---|\n")
        f.write("| **Qubit** | `KYOO-bit` | Basic unit of quantum information |\n")
        f.write("| **|0⟩** | `ket zero` | Ground computational basis state |\n")
        f.write("| **|1⟩** | `ket one` | Excited computational basis state |\n")
        f.write("| **|ψ⟩** | `ket psi` (pronounced *sigh*) | General quantum state vector |\n")
        f.write("| **α, β** | `alpha, beta` | Complex probability amplitudes |\n")
        f.write("| **Hadamard** | `HAD-uh-mard` | Superposition gate (H) |\n")
        f.write("| **QUALUTION** | `kwa-LOO-shun` | Quantum Education Platform |\n\n---\n\n")
        f.write("## Full Line-by-Line Narration Script with Caption Sync\n\n```\n")
        f.write("[TIME]       [SCENE]      [NARRATION LINE]\n")
        sec_accum = 0
        for s in scenes_spec:
            start_m, start_s = divmod(sec_accum, 60)
            end_m, end_s = divmod(sec_accum + s["durationSeconds"], 60)
            f.write(f"{start_m}:{start_s:02d} - {end_m}:{end_s:02d}  {s['id']}     {s['narration']['text']}\n\n")
            sec_accum += s["durationSeconds"]
        f.write("```\n")
    print(f"Generated {narr_file}")
    
    # Write storyboard.md
    story_file = os.path.join(folder_path, "storyboard.md")
    with open(story_file, "w", encoding="utf-8") as f:
        f.write(f"# QUALUTION Visual Storyboard — {lesson_info['lessonTitle']}\n\n")
        f.write(f"- **Lesson ID**: `{lesson_info['lessonId']}`\n")
        f.write(f"- **Total Duration**: {total_duration}s ({current_frame-1} frames at {fps} fps)\n\n---\n\n")
        for s in scenes_spec:
            f.write(f"### Scene {s['id']}: {s['title']} ({s['durationSeconds']}s | Frames {s['startFrame']}-{s['endFrame']})\n\n")
            f.write(f"- **Educational Purpose**: {s['educationalPurpose']}\n")
            f.write(f"- **Spoken Narration**: *\"{s['narration']['text']}\"*\n")
            f.write(f"- **On-Screen Typography**:\n")
            for t in s["onScreenText"]:
                f.write(f"  - `[{t['role'].upper()}]` {t['text']} at position {t['position']}\n")
            f.write(f"- **Visual Elements & Rigging**: {', '.join(v['type'] for v in s['visualElements'])}\n")
            f.write(f"- **Camera & Transition**: {s['transitionOut']}\n\n---\n\n")
    print(f"Generated {story_file}")

if __name__ == "__main__":
    for item in LESSONS_DATA:
        generate_lesson_spec(item)
