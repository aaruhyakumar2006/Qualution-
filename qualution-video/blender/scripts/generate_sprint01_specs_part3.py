"""
Production Generator for QUALUTION Theoretical Video Pipeline - Part 3
Generates complete, schema-compliant specifications for Lessons 08 to 11 in Sprint 1.
"""

import json
import os

LESSONS_DATA = [
    {
        "folder": "lesson08_single_qubit_gates",
        "lessonId": "s1-theory-single-qubit-gates",
        "lessonTitle": "Single-Qubit Quantum Gates",
        "targetDuration": 240,
        "objectives": [
            "Understand quantum gates as unitary matrices acting on state vectors.",
            "Analyze the Pauli group: X (NOT), Y (bit-and-phase flip), Z (phase flip).",
            "Understand phase gates S (π/2) and T (π/4).",
            "Analyze continuous rotation gates Rx(θ), Ry(θ), and Rz(θ).",
            "Prove unitarity U†U = I and probability conservation."
        ],
        "boundaries": {
            "topicsCovered": [
                "Unitary matrices U (2x2 complex matrices satisfying U†U = I)",
                "Pauli gates X, Y, Z",
                "Hadamard gate H",
                "S gate (Phase) and T gate (π/8 gate)",
                "Parametric rotations Rx(θ), Ry(θ), Rz(θ)",
                "Geometric rotations around the Bloch sphere axes"
            ],
            "topicsDeferred": [
                "Two-qubit gates like CNOT and CZ (Sprint 2)",
                "Clifford group and universal gate sets (Sprint 2 & 3)"
            ]
        },
        "scenes": [
            {
                "title": "Quantum Gates as State Rotations",
                "duration": 20,
                "narration": "In classical circuits, logic gates manipulate discrete bits through Boolean algebra: AND, OR, NOT. In quantum circuits, single-qubit gates are continuous geometric rotations of our state vector across the Bloch sphere.",
                "captions": [
                    {"text": "Classical logic gates perform discrete Boolean operations (AND, OR, NOT).", "dur": 10},
                    {"text": "Quantum single-qubit gates perform continuous geometric rotations in Hilbert space.", "dur": 10}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 8: SINGLE-QUBIT QUANTUM GATES", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "Unitary Operators & The Geometry of Computation", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Introduce quantum gates as geometric rotations on the Bloch sphere."
            },
            {
                "title": "The Unitarity Requirement",
                "duration": 25,
                "narration": "Every valid quantum gate must be represented by a unitary matrix U. Unitarity means that U dagger times U equals the identity matrix. This guarantees that total probability is strictly conserved and operations are reversible.",
                "captions": [
                    {"text": "Every quantum gate is a unitary matrix U satisfying U†U = I.", "dur": 12},
                    {"text": "Unitarity preserves vector length (||U|ψ⟩|| = 1) and ensures reversibility.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_unit_title", "text": "The Unitarity Condition", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_unit_eq", "text": "U† · U = I  (U† = (U*)ᵀ)", "role": "formula", "position": [0.0, 0.2, 0.1]}
                ],
                "purpose": "Define unitary matrices and explain why quantum operations preserve probability."
            },
            {
                "title": "The Pauli Gates: X, Y, and Z",
                "duration": 35,
                "narration": "The fundamental single-qubit operators are the Pauli matrices. Pauli-X is the quantum NOT gate, rotating 180 degrees around the X-axis. Pauli-Z flips phase by 180 degrees around the Z-axis. And Pauli-Y flips both bit and phase.",
                "captions": [
                    {"text": "Pauli-X flips bit values: X|0⟩ = |1⟩, X|1⟩ = |0⟩ (180° rotation about X).", "dur": 16},
                    {"text": "Pauli-Z flips phase: Z|1⟩ = -|1⟩. Pauli-Y combines bit flip and phase shift.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_paulix", "text": "X = [ [0, 1], [1, 0] ]", "role": "formula", "position": [-4.5, 0.5, 0.1]},
                    {"id": "txt_pauliy", "text": "Y = [ [0, -i], [i, 0] ]", "role": "formula", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_pauliz", "text": "Z = [ [1, 0], [0, -1] ]", "role": "formula", "position": [4.5, 0.5, 0.1]}
                ],
                "purpose": "Introduce the three Pauli matrices and their algebraic actions."
            },
            {
                "title": "Phase Gates: S and T",
                "duration": 30,
                "narration": "Beyond full 180-degree flips, we need finer phase control. The S gate applies a 90-degree phase shift—it is the square root of Z. The T gate applies a 45-degree phase shift—the fourth root of Z, crucial for universal quantum computation.",
                "captions": [
                    {"text": "S Gate: applies a 90° (π/2) phase shift. S² = Z.", "dur": 14},
                    {"text": "T Gate: applies a 45° (π/4) phase shift. T² = S, T⁴ = Z. Crucial for universality!", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_sgate", "text": "S = [ [1, 0], [0, i] ]", "role": "formula", "position": [-3.5, 0.5, 0.1]},
                    {"id": "txt_tgate", "text": "T = [ [1, 0], [0, e^(iπ/4)] ]", "role": "formula", "position": [3.5, 0.5, 0.1]}
                ],
                "purpose": "Explain the S and T phase hierarchy (Z -> S -> T)."
            },
            {
                "title": "Continuous Rotation Gates: Rx, Ry, Rz",
                "duration": 35,
                "narration": "To point anywhere on the Bloch sphere, we use continuous rotation gates: Rx(θ), Ry(θ), and Rz(θ). These parametric gates rotate the state vector by any arbitrary angle theta around their respective Cartesian axes.",
                "captions": [
                    {"text": "Parametric rotation gates allow continuous navigation of the Bloch sphere.", "dur": 16},
                    {"text": "R_x(θ), R_y(θ), and R_z(θ) rotate by angle θ around X, Y, and Z axes.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_rot_title", "text": "Continuous Parametric Rotation Gates", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_rz", "text": "Rz(θ) = [ [e^(-iθ/2), 0], [0, e^(iθ/2)] ]", "role": "formula", "position": [0.0, 0.2, 0.1]}
                ],
                "purpose": "Introduce continuous rotation gates used in quantum algorithms and machine learning."
            },
            {
                "title": "Self-Inverse and Cancellation Rules",
                "duration": 30,
                "narration": "Many quantum gates are self-inverse: applying X twice returns the state to identity: X · X = I. The same holds for Hadamard: H · H = I. In QUALUTION's circuit optimizer, adjacent identical gates are automatically cancelled!",
                "captions": [
                    {"text": "Self-inverse gates: X² = I, Y² = I, Z² = I, and H² = I.", "dur": 14},
                    {"text": "QUALUTION's optimizer detects and cancels redundant self-inverse gates automatically.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_canc", "text": "Self-Inverse Cancellation Rules", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_rules", "text": "X · X = I   |   H · H = I   |   Z · Z = I", "role": "formula", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Connect linear algebraic gate inverses to compiler circuit optimization."
            },
            {
                "title": "Summary & Next Steps",
                "duration": 35,
                "narration": "We now possess the complete single-qubit gate toolkit: Pauli X, Y, Z, Hadamard, S, T, and continuous rotations. In Lesson 9, we assemble these gates into full quantum circuits on a quantum circuit timeline.",
                "captions": [
                    {"text": "Summary: Single-qubit gates are unitary matrices that rotate statevectors.", "dur": 15},
                    {"text": "Next: Lesson 9 — Assembling States into Quantum Circuits.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 8 SUMMARY", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_g1", "text": "1. Unitarity: U†U = I preserves probability length", "role": "body", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_g2", "text": "2. Pauli Gates: X (Bit flip), Z (Phase flip), Y (Both)", "role": "body", "position": [0.0, 0.2, 0.1]},
                    {"id": "txt_g3", "text": "3. Phase & Rotations: H (Superposition), S, T, Rx, Ry, Rz", "role": "body", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Consolidate gate taxonomy and preview multi-gate circuit architecture."
            }
        ]
    },
    {
        "folder": "lesson09_states_to_circuits",
        "lessonId": "s1-theory-states-to-circuits",
        "lessonTitle": "From Quantum States to Circuits",
        "targetDuration": 240,
        "objectives": [
            "Read and interpret quantum circuit diagrams.",
            "Understand wire initialization in the canonical |0⟩ state.",
            "Trace chronological execution flow from left to right.",
            "Calculate circuit depth, gate counts, and two-qubit ratios.",
            "Bridge visual drag-and-drop circuits to executable Python code (Qiskit, PennyLane, Cirq)."
        ],
        "boundaries": {
            "topicsCovered": [
                "Circuit wire conventions and chronological time progression (left to right)",
                "Initialization in |0⟩...|0⟩",
                "Gate placement and serial application",
                "Measurement operations and classical registers",
                "Circuit metrics: Depth, Total Gate Count, Active Wires",
                "Code generation from circuit diagrams (Qiskit / PennyLane / Cirq)"
            ],
            "topicsDeferred": [
                "Two-qubit entangling gates CNOT / CZ (Sprint 2)",
                "Circuit compilation and transpilation to physical device topologies (Sprint 2)"
            ]
        },
        "scenes": [
            {
                "title": "The Musical Score of Quantum Computing",
                "duration": 20,
                "narration": "A quantum circuit is like a musical score. Each horizontal line is a wire representing a qubit progressing through time from left to right, while gates are musical notes transforming the harmony of quantum states.",
                "captions": [
                    {"text": "A quantum circuit is a chronological score for quantum states.", "dur": 10},
                    {"text": "Horizontal wires track qubits over time; gates transform state amplitudes.", "dur": 10}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 9: FROM QUANTUM STATES TO CIRCUITS", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "Anatomy of Quantum Circuit Diagrams", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Provide an accessible mental model for reading quantum circuit diagrams."
            },
            {
                "title": "Wire Initialization & Time Flow",
                "duration": 25,
                "narration": "By convention, every qubit wire begins at time zero in the ground state |0⟩. Operations execute sequentially from left to right. When two gates sit in the same vertical column on different wires, they execute simultaneously.",
                "captions": [
                    {"text": "Qubits initialize in |0⟩ at the far left.", "dur": 12},
                    {"text": "Time flows left to right. Gates in the same column execute concurrently.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_wire_diag", "text": "q[0]: |0⟩ ─────[ H ]─────[ Z ]─────[ M ] ───> c[0]", "role": "formula", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_time_arrow", "text": "TIME PROGRESSION ─────────────────────────>", "role": "subheader", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Explain circuit diagram syntax and initialization standards."
            },
            {
                "title": "Matrix Multiplication in Reverse Order",
                "duration": 30,
                "narration": "Here is a crucial rule for every quantum programmer: while circuits execute left-to-right, mathematical matrix multiplication is written right-to-left! If a circuit applies gate A then gate B, the overall unitary is B times A.",
                "captions": [
                    {"text": "Visual circuit flow: left to right (Gate A then Gate B).", "dur": 14},
                    {"text": "Matrix algebra order: right to left! Overall unitary: U = B · A.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_order_title", "text": "The Operator Ordering Rule", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_vis", "text": "Circuit: ───[ A ]───[ B ]───>", "role": "body", "position": [-3.5, 0.5, 0.1]},
                    {"id": "txt_mat", "text": "Math: |ψ_final⟩ = (B · A) |0⟩", "role": "body", "position": [3.5, 0.5, 0.1]}
                ],
                "purpose": "Warn students about the classic left-to-right vs right-to-left ordering trap."
            },
            {
                "title": "Circuit Depth and Gate Count",
                "duration": 35,
                "narration": "To evaluate circuit efficiency, we measure two key structural metrics: Total Gate Count—the sum of all operations—and Circuit Depth—the number of sequential time steps required to execute the circuit when parallel gates run together.",
                "captions": [
                    {"text": "Total Gate Count: the total number of quantum gates in the circuit.", "dur": 16},
                    {"text": "Circuit Depth: the number of concurrent time-steps required to run all gates.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_metrics_title", "text": "Circuit Complexity Metrics", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_gc", "text": "Total Gate Count = Total number of gates", "role": "body", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_depth", "text": "Circuit Depth = Length of critical time path", "role": "body", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Introduce circuit depth and complexity analysis."
            },
            {
                "title": "Measurement and Classical Registers",
                "duration": 30,
                "narration": "At the end of a circuit, measurement meters convert quantum statevectors into classical bits, storing the results in a classical register denoted with double lines. This marks the transition from quantum coherence to classical data.",
                "captions": [
                    {"text": "Measurement meters convert quantum information into classical bits.", "dur": 14},
                    {"text": "Classical registers are indicated by double lines (c[0], c[1]).", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_meter", "text": "q[0] ───[ M ]───\n          ║\n          ▼\nc[0] ════════════ (Classical Bit Storage)", "role": "formula", "position": [0.0, 0.2, 0.1]}
                ],
                "purpose": "Explain measurement meter symbols and classical registers."
            },
            {
                "title": "Code Generation: From Visual Canvas to Python",
                "duration": 35,
                "narration": "In QUALUTION, your visual circuit is bidirectionally synchronized with real quantum code. As you drag gates, the platform automatically generates idiomatic Qiskit, PennyLane, or Cirq scripts ready for real quantum hardware.",
                "captions": [
                    {"text": "Visual circuits compile directly into real Python code.", "dur": 16},
                    {"text": "Export instantly to Qiskit, PennyLane, Cirq, or OpenQASM 2.0.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_codegen_title", "text": "Unified Code Generation Architecture", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_code_ex", "text": "qc = QuantumCircuit(1, 1)\nqc.h(0)\nqc.z(0)\nqc.measure(0, 0)", "role": "formula", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Connect visual diagramming directly to software engineering code generation."
            },
            {
                "title": "Summary & Sprint 1 Milestone",
                "duration": 35,
                "narration": "Congratulations! You have mastered the journey from quantum states to full circuit diagrams. Next, we consolidate everything in Lesson 10 with our Sprint 1 Comprehensive Review and Knowledge Check.",
                "captions": [
                    {"text": "Milestone: You now read, write, and analyze quantum circuits like a pro.", "dur": 15},
                    {"text": "Next: Lesson 10 — Sprint 1 Comprehensive Review & Knowledge Check.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 9 SUMMARY", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_c1", "text": "1. Circuits flow left-to-right in time; operators multiply right-to-left", "role": "body", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_c2", "text": "2. Circuit Depth measures execution steps along the critical path", "role": "body", "position": [0.0, 0.2, 0.1]},
                    {"id": "txt_c3", "text": "3. Visual circuits translate 1:1 into Qiskit, PennyLane, and Cirq", "role": "body", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Celebrate completion of core single-qubit curriculum."
            }
        ]
    },
    {
        "folder": "lesson10_sprint_review_knowledge_check",
        "lessonId": "s1-theory-knowledge-check",
        "lessonTitle": "Sprint 1 Comprehensive Knowledge Check",
        "targetDuration": 240,
        "objectives": [
            "Synthesize all core concepts of Sprint 1 (Quantum Foundations).",
            "Review state vector representation, Born's Rule, and normalization.",
            "Compare Pauli X, Y, Z, Hadamard, and phase gates.",
            "Walk through diagnostic multi-step circuit analysis questions.",
            "Prepare learner for the formal Sprint 1 Theoretical Assessment."
        ],
        "boundaries": {
            "topicsCovered": [
                "Synthesis of Lessons 1 through 9",
                "Statevector mathematics |ψ⟩ = α|0⟩ + β|1⟩",
                "Born rule probability verification",
                "Bloch sphere geometric coordinates",
                "Circuit trace walkthroughs",
                "Common student misconceptions and remediation"
            ],
            "topicsDeferred": [
                "Two-qubit entanglement (Sprint 2)",
                "Hardware error mitigation (Sprint 3)"
            ]
        },
        "scenes": [
            {
                "title": "Welcome to the Sprint 1 Review",
                "duration": 20,
                "narration": "You have traveled from the basic definition of a qubit to full circuit design and wave interference. In this review, we synthesize every concept to ensure you have rock-solid quantum foundations.",
                "captions": [
                    {"text": "Welcome to the Sprint 1 Comprehensive Knowledge Review.", "dur": 10},
                    {"text": "Let us synthesize every foundational concept before the formal assessment.", "dur": 10}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 10: SPRINT 1 KNOWLEDGE CHECK", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "Mastery Review & Diagnostic Synthesis", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Frame review session and motivate student readiness."
            },
            {
                "title": "Pillar 1: The Quantum State Vector",
                "duration": 30,
                "narration": "Remember Pillar 1: A qubit is a unit vector |ψ⟩ = α|0⟩ + β|1⟩ in two-dimensional complex Hilbert space. The normalization constraint |α|² + |β|² = 1 guarantees that total probability is always 100 percent.",
                "captions": [
                    {"text": "Pillar 1: |ψ⟩ = α|0⟩ + β|1⟩ in ℂ² Hilbert space.", "dur": 14},
                    {"text": "Conservation of probability: |α|² + |β|² = 1.0 always.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_p1_title", "text": "Pillar 1: The Quantum State Vector", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_p1_eq", "text": "|ψ⟩ = α|0⟩ + β|1⟩  with  |α|² + |β|² = 1", "role": "formula", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Reinforce state vector definition and normalization."
            },
            {
                "title": "Pillar 2: Born's Rule & Measurement",
                "duration": 30,
                "narration": "Pillar 2: Measurement is non-deterministic and irreversible. Born's Rule tells us that the probability of observing outcome x is the absolute square of its inner product with the state: P(x) = |⟨x|ψ⟩|².",
                "captions": [
                    {"text": "Pillar 2: Measurement collapses superposition irreversibly.", "dur": 14},
                    {"text": "Born's Rule: P(x) = |⟨x|ψ⟩|². P(0) = |α|², P(1) = |β|².", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_p2_title", "text": "Pillar 2: Born's Rule & Collapse", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_p2_eq", "text": "P(x) = |⟨x|ψ⟩|²  (Irreversible Projection)", "role": "formula", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Reinforce measurement mechanics and Born's Rule."
            },
            {
                "title": "Pillar 3: The Single-Qubit Gate Suite",
                "duration": 35,
                "narration": "Pillar 3: All single-qubit gates are unitary rotations. X flips bits; Z flips relative phase; H creates superposition; S and T apply π/2 and π/4 phase shifts; and Rx, Ry, Rz provide continuous angle control.",
                "captions": [
                    {"text": "Pillar 3: Quantum gates are unitary rotations (U†U = I).", "dur": 16},
                    {"text": "X = Bit-flip | Z = Phase-flip | H = Superposition | S, T = Phase shifts.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_p3_title", "text": "Pillar 3: Canonical Single-Qubit Gates", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_p3_grid", "text": "X, Y, Z (Pauli) | H (Hadamard) | S, T (Phase) | R_x, R_y, R_z (Rotations)", "role": "body", "position": [0.0, 0.5, 0.1]}
                ],
                "purpose": "Summarize the complete gate taxonomy."
            },
            {
                "title": "Pillar 4: Quantum Phase & Interference",
                "duration": 35,
                "narration": "Pillar 4: Relative phase drives wave interference. By chaining gates like Hadamard and Z, quantum algorithms engineer destructive cancellation for incorrect paths and constructive amplification for the solution.",
                "captions": [
                    {"text": "Pillar 4: Relative phase steers constructive and destructive interference.", "dur": 16},
                    {"text": "H · Z · H = X: Interference transforms a phase flip into a bit flip.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_p4_title", "text": "Pillar 4: Wave Interference in Action", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_p4_interf", "text": "H · Z · H = X (Interference Identity)", "role": "formula", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Revisit interference mechanics as the core computational mechanism."
            },
            {
                "title": "Diagnostic Practice Question",
                "duration": 40,
                "narration": "Let us test your intuition: Starting in state |0⟩, what state results from applying an X gate followed by an H gate? First, X flips |0⟩ to |1⟩. Then H transforms |1⟩ into the minus state: (|0⟩ - |1⟩) / √2!",
                "captions": [
                    {"text": "Diagnostic Challenge: What is the state after applying X then H to |0⟩?", "dur": 18},
                    {"text": "Step 1: X|0⟩ = |1⟩. Step 2: H|1⟩ = |-⟩ = (|0⟩ - |1⟩)/√2. Excellent!", "dur": 22}
                ],
                "onScreenText": [
                    {"id": "txt_diag_q", "text": "Challenge: H · X |0⟩ = ?", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_ans", "text": "Answer: |-⟩ = (|0⟩ - |1⟩) / √2", "role": "formula", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Provide an active retrieval practice exercise."
            },
            {
                "title": "Ready for the Assessment",
                "duration": 30,
                "narration": "You are now thoroughly prepared! Proceed to Lesson 11 for the formal Sprint 1 Theoretical Assessment to prove your mastery, earn your Sprint 1 badge, and advance to multi-qubit systems in Sprint 2.",
                "captions": [
                    {"text": "You are now fully prepared for the Sprint 1 Theoretical Assessment.", "dur": 14},
                    {"text": "Proceed to Lesson 11 to demonstrate your quantum mastery!", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_ready_title", "text": "SPRINT 1 ASSESSMENT READY", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_badge", "text": "Earn the 'Quantum Foundations Master' Credential", "role": "subheader", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Inspire confidence and transition to the final assessment."
            }
        ]
    },
    {
        "folder": "lesson11_theoretical_assessment",
        "lessonId": "s1-theory-assessment",
        "lessonTitle": "Sprint 1 Theoretical Assessment",
        "targetDuration": 240,
        "objectives": [
            "Evaluate comprehensive theoretical mastery across all 10 Sprint 1 concepts.",
            "Test mathematical statevector calculations and Born's rule evaluations.",
            "Verify understanding of gate unitary identities and matrix products.",
            "Assess diagnostic ability to predict measurement outcomes from circuit diagrams.",
            "Award Sprint 1 Quantum Foundations certification on passing."
        ],
        "boundaries": {
            "topicsCovered": [
                "Comprehensive Sprint 1 assessment guidelines",
                "Scoring rubric: 80% passing threshold",
                "Multi-concept synthesis problems",
                "Step-by-step mathematical reasoning checks",
                "Sprint 2 curriculum preview: Entanglement & Multi-Qubit Circuits"
            ],
            "topicsDeferred": [
                "Multi-qubit operations (Sprint 2)"
            ]
        },
        "scenes": [
            {
                "title": "The Sprint 1 Milestone Assessment",
                "duration": 20,
                "narration": "Welcome to the Sprint 1 Theoretical Assessment. This rigorous 10-question examination evaluates your complete theoretical mastery of quantum computing fundamentals.",
                "captions": [
                    {"text": "Welcome to the Sprint 1 Theoretical Assessment.", "dur": 10},
                    {"text": "Test your mastery across 10 rigorous quantum theory problems.", "dur": 10}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 11: SPRINT 1 THEORETICAL ASSESSMENT", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "Official Qualification & Competency Certification", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Establish high academic standards and solemnity for the certification exam."
            },
            {
                "title": "Assessment Structure & Topics",
                "duration": 25,
                "narration": "The assessment spans five core competency areas: Qubit State Vectors, Computational Basis Orthogonality, Born's Rule Calculations, Single-Qubit Gate Identities, and Circuit Time Traces.",
                "captions": [
                    {"text": "Five core competencies: State Vectors, Basis Vectors, Born's Rule,", "dur": 12},
                    {"text": "Gate Identities, and Circuit Time Evolution.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_topics_title", "text": "Assessment Competency Matrix", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_t1", "text": "1. State Space & Normalization (|α|² + |β|² = 1)", "role": "body", "position": [0.0, 1.0, 0.1]},
                    {"id": "txt_t2", "text": "2. Born's Rule & Probability Distributions (P = |⟨x|ψ⟩|²)", "role": "body", "position": [0.0, 0.0, 0.1]},
                    {"id": "txt_t3", "text": "3. Unitary Gate Matrices & Wave Interference (HZH = X)", "role": "body", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Break down the exam rubric clearly."
            },
            {
                "title": "Strategy for Quantum Calculations",
                "duration": 35,
                "narration": "When solving quantum problems: First, always verify normalization. Second, keep track of complex phases before applying measurement. And third, remember that circuit gates apply from left to right, but multiply from right to left!",
                "captions": [
                    {"text": "Key Strategy 1: Check state normalization first.", "dur": 11},
                    {"text": "Key Strategy 2: Track complex relative phases carefully before measuring.", "dur": 12},
                    {"text": "Key Strategy 3: Apply operators in reverse matrix multiplication order.", "dur": 12}
                ],
                "onScreenText": [
                    {"id": "txt_strat_title", "text": "Exam Problem-Solving Strategy", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_s1", "text": "Rule 1: Always check normalization: |α|² + |β|² = 1", "role": "body", "position": [0.0, 0.8, 0.1]},
                    {"id": "txt_s2", "text": "Rule 2: Trace phase interference before computing probabilities", "role": "body", "position": [0.0, -0.2, 0.1]},
                    {"id": "txt_s3", "text": "Rule 3: U_total = U_n · ... · U_2 · U_1", "role": "body", "position": [0.0, -1.2, 0.1]}
                ],
                "purpose": "Equip student with high-confidence problem-solving heuristics."
            },
            {
                "title": "Passing Criteria & Certification",
                "duration": 30,
                "narration": "To earn your Sprint 1 Quantum Foundations Certificate and unlock Sprint 2, you must achieve a score of 80 percent or higher. You will receive detailed explanations and feedback for every answer.",
                "captions": [
                    {"text": "Passing Threshold: 80% (8 out of 10 correct answers).", "dur": 14},
                    {"text": "Instant auto-grading with complete step-by-step solutions and feedback.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_criteria", "text": "Passing Threshold: 80% (8/10 Correct)", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_unlock", "text": "Unlocks: Sprint 2 — Entanglement & Multi-Qubit Systems", "role": "subheader", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Explain passing score and progression incentive."
            },
            {
                "title": "Preview of Sprint 2: Quantum Entanglement",
                "duration": 40,
                "narration": "Once you pass, Sprint 2 awaits! You will leave the single-qubit world behind to explore Einstein's 'spooky action at a distance'—quantum entanglement, Bell states, CNOT gates, and Grover's search algorithm.",
                "captions": [
                    {"text": "Coming next in Sprint 2: Quantum Entanglement and Multi-Qubit Circuits!", "dur": 18},
                    {"text": "Build Bell states, harness CNOT gates, and discover quantum teleportation.", "dur": 22}
                ],
                "onScreenText": [
                    {"id": "txt_s2_title", "text": "NEXT: SPRINT 2 — QUANTUM ENTANGLEMENT", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_bell", "text": "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2", "role": "formula", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_cnot", "text": "Controlled-NOT (CNOT) & Two-Qubit Tensor Products", "role": "subheader", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Build intense excitement for Sprint 2."
            },
            {
                "title": "Begin Your Assessment",
                "duration": 35,
                "narration": "Take a deep breath, trust your understanding, and answer the questions below with care. The quantum universe is governed by elegance, symmetry, and math. Begin your assessment now!",
                "captions": [
                    {"text": "Trust your understanding and read each question carefully.", "dur": 16},
                    {"text": "Begin your Sprint 1 Theoretical Assessment now. Good luck!", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_begin_title", "text": "BEGIN SPRINT 1 ASSESSMENT", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_quote", "text": "\"Those who are not shocked when they first come across quantum theory cannot possibly have understood it.\" — Niels Bohr", "role": "subheader", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Inspire and initiate assessment."
            },
            {
                "title": "Summary & Closing",
                "duration": 30,
                "narration": "This concludes the video curriculum for Sprint 1. Review any past lessons anytime, and proceed directly to the interactive assessment below. Best of luck from the QUALUTION team!",
                "captions": [
                    {"text": "This concludes the Sprint 1 video curriculum.", "dur": 14},
                    {"text": "Proceed to the assessment below. Best of luck!", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_closing", "text": "QUALUTION: QUANTUM EDUCATION PLATFORM", "role": "header", "position": [0.0, 1.5, 0.1]},
                    {"id": "txt_goodluck", "text": "Complete the Assessment Below to Earn Your Credential", "role": "subheader", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Final wrap up."
            }
        ]
    }
]

def generate_part3():
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
    from generate_sprint01_specs_part1 import generate_lesson_spec
    for item in LESSONS_DATA:
        generate_lesson_spec(item)

if __name__ == "__main__":
    generate_part3()
