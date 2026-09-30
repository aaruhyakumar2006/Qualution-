"""
Production Generator for QUALUTION Theoretical Video Pipeline - Part 2
Generates complete, schema-compliant specifications for Lessons 05 to 07 in Sprint 1.
"""

import json
import os

LESSONS_DATA = [
    {
        "folder": "lesson05_measurement_and_born_rule",
        "lessonId": "s1-theory-measurement-probability",
        "lessonTitle": "Measurement & Born's Rule",
        "targetDuration": 240,
        "objectives": [
            "Explain the non-deterministic nature of quantum measurement.",
            "Formulate and compute probabilities using Born's Rule: P(x) = |⟨x|ψ⟩|².",
            "Understand wavefunction collapse and projection onto eigenstates.",
            "Distinguish irreversible measurement from reversible unitary operations.",
            "Analyze the connection between repeated circuit shots and theoretical distributions."
        ],
        "boundaries": {
            "topicsCovered": [
                "The Measurement Postulate of quantum mechanics",
                "Max Born's 1926 probability interpretation (Born's Rule)",
                "Calculation: P(0) = |α|², P(1) = |β|²",
                "Wavefunction collapse (state projection)",
                "Irreversibility of measurement and loss of quantum phase",
                "Empirical histograms vs analytical probabilities (shots)"
            ],
            "topicsDeferred": [
                "Complex phase interference effects before measurement (Lesson 7)",
                "Generalized POVM measurements (Sprint 3)",
                "Entanglement-induced subsystem collapse (Sprint 2)"
            ]
        },
        "scenes": [
            {
                "title": "The Measurement Enigma",
                "duration": 20,
                "narration": "In classical physics, observing an object does not change its state. But in quantum mechanics, the very act of observation irreversibly changes what is being observed. This is the quantum measurement problem.",
                "captions": [
                    {"text": "Classical observation is passive and non-invasive.", "dur": 9},
                    {"text": "In quantum mechanics, measurement irreversibly transforms the state.", "dur": 11}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 5: MEASUREMENT & BORN'S RULE", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "The Irreversible Collapse of Quantum Superposition", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Introduce the foundational paradox of quantum observation and wavefunction collapse."
            },
            {
                "title": "Max Born and the Probability Rule",
                "duration": 25,
                "narration": "In 1926, physicist Max Born discovered how mathematical wavefunctions translate into physical experimental reality. He postulated that the probability of measuring an outcome is the absolute square of its amplitude.",
                "captions": [
                    {"text": "In 1926, Max Born formulated the quantum probability postulate.", "dur": 12},
                    {"text": "The probability of an outcome equals the absolute square of its amplitude.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_born_title", "text": "Born's Rule (1926 Nobel Prize Formulation)", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_born_eq", "text": "P(x) = |⟨x|ψ⟩|²", "role": "formula", "position": [0.0, 0.5, 0.1]}
                ],
                "purpose": "Introduce Born's Rule mathematically and historically."
            },
            {
                "title": "Calculating Probabilities for a Single Qubit",
                "duration": 30,
                "narration": "For a single qubit state |ψ⟩ = α|0⟩ + β|1⟩, the probability of measuring zero is P(0) = |α|², and the probability of measuring one is P(1) = |β|². Because the probabilities must sum to 1, |α|² + |β|² = 1.",
                "captions": [
                    {"text": "Probability of outcome 0: P(0) = |α|².", "dur": 14},
                    {"text": "Probability of outcome 1: P(1) = |β|² where |α|² + |β|² = 1.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_p0", "text": "P(0) = |α|² = |⟨0|ψ⟩|²", "role": "formula", "position": [-3.5, 0.8, 0.1]},
                    {"id": "txt_p1", "text": "P(1) = |β|² = |⟨1|ψ⟩|²", "role": "formula", "position": [3.5, 0.8, 0.1]},
                    {"id": "txt_total_p", "text": "P(0) + P(1) = |α|² + |β|² = 1.0", "role": "subheader", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Provide concrete mathematical derivation of single-qubit measurement probabilities."
            },
            {
                "title": "Wavefunction Collapse in Real Time",
                "duration": 30,
                "narration": "Before measurement, the qubit held infinite continuous possibilities. But the moment a measurement occurs, the state vector instantaneously collapses onto the observed eigenstate: either strictly |0⟩ or strictly |1⟩.",
                "captions": [
                    {"text": "Before measurement: coherent superposition α|0⟩ + β|1⟩.", "dur": 14},
                    {"text": "After measurement: state collapses completely to |0⟩ or |1⟩.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_before", "text": "Before: |ψ⟩ = α|0⟩ + β|1⟩", "role": "body", "position": [-4.0, 0.5, 0.1]},
                    {"id": "txt_arrow", "text": "───[ MEASURE ]───>", "role": "header", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_after", "text": "After: |0⟩  OR  |1⟩", "role": "body", "position": [4.0, 0.5, 0.1]}
                ],
                "purpose": "Illustrate state vector projection and wavefunction collapse dynamically."
            },
            {
                "title": "Irreversibility: The Loss of Phase",
                "duration": 30,
                "narration": "Notice an essential fact: quantum gates are reversible unitaries, but measurement is strictly irreversible. Once collapsed, all information about the relative phase angle θ is permanently destroyed.",
                "captions": [
                    {"text": "Quantum gates are reversible unitary operations: U†U = I.", "dur": 14},
                    {"text": "Measurement is irreversible projection: relative phase information is lost.", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_rev", "text": "Quantum Gates = Reversible Unitaries", "role": "body", "position": [-3.5, 0.5, 0.1]},
                    {"id": "txt_irrev", "text": "Measurement = Irreversible Projection", "role": "body", "position": [3.5, 0.5, 0.1]}
                ],
                "purpose": "Differentiate unitary reversible quantum evolution from non-unitary measurement."
            },
            {
                "title": "Shots and Empirical Sampling",
                "duration": 35,
                "narration": "Because a single measurement returns only one bit, quantum computers execute circuits over many repetitions called shots. Running 1,000 shots on an equal superposition yields approximately 500 zeros and 500 ones.",
                "captions": [
                    {"text": "Quantum programs are executed across multiple repeated 'shots'.", "dur": 16},
                    {"text": "By accumulating shot histograms, we reconstruct theoretical probability distributions.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_shots", "text": "Empirical Sampling via Circuit Shots", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_hist", "text": "1,000 Shots on |+⟩: ~500 |0⟩, ~500 |1⟩", "role": "subheader", "position": [0.0, 0.0, 0.1]}
                ],
                "purpose": "Connect single-shot measurement collapse to experimental quantum hardware execution."
            },
            {
                "title": "Summary & Practical Connection",
                "duration": 35,
                "narration": "To conclude: Born's Rule dictates that P(x) = |⟨x|ψ⟩|². Measurement collapses superposition into classical reality, producing empirical counts. Next in Lesson 6, we examine the inner structure of complex probability amplitudes.",
                "captions": [
                    {"text": "Summary: P(x) = |⟨x|ψ⟩|² governs outcome likelihoods upon collapse.", "dur": 15},
                    {"text": "Next: Lesson 6 — Complex Probability Amplitudes & Geometry.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 5 SUMMARY", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_k1", "text": "1. Born's Rule: P(0) = |α|², P(1) = |β|²", "role": "body", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_k2", "text": "2. Wavefunction Collapse: State projects onto observed basis state", "role": "body", "position": [0.0, 0.2, 0.1]},
                    {"id": "txt_k3", "text": "3. Shots: Accumulate measurement samples to reveal probabilities", "role": "body", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Summarize key principles and bridge forward to probability amplitudes."
            }
        ]
    },
    {
        "folder": "lesson06_probability_amplitudes",
        "lessonId": "s1-theory-probability-amplitudes",
        "lessonTitle": "Probability Amplitudes & Phases",
        "targetDuration": 240,
        "objectives": [
            "Deconstruct complex numbers into polar form: r e^(iθ).",
            "Understand why amplitudes can cancel through destructive interference.",
            "Differentiate global phase e^(iγ) from relative phase e^(iφ).",
            "Prove why global phase is physically unobservable: |e^(iγ)ψ|² = |ψ|².",
            "Map single-qubit state space using spherical coordinates (θ, φ)."
        ],
        "boundaries": {
            "topicsCovered": [
                "Complex numbers z = a + bi = r e^(iθ)",
                "Absolute value squared |z|² = a² + b²",
                "Negative and imaginary amplitudes",
                "Global phase invariance |e^(iγ)α|² = |α|²",
                "Relative phase parameterization: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩"
            ],
            "topicsDeferred": [
                "Full wave interference demonstrations using Mach-Zehnder (Lesson 7)",
                "Phase kickback in multi-qubit circuits (Sprint 2)"
            ]
        },
        "scenes": [
            {
                "title": "The Secret Currency of Quantum Computing",
                "duration": 20,
                "narration": "Classical probabilities can only be positive real numbers between zero and one. But quantum mechanics runs on a richer currency: complex numbers that can be positive, negative, or imaginary.",
                "captions": [
                    {"text": "Classical probabilities are strictly non-negative real numbers: p ∈ [0, 1].", "dur": 10},
                    {"text": "Quantum amplitudes are complex numbers (ℂ) capable of wave cancellation.", "dur": 10}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 6: PROBABILITY AMPLITUDES & PHASES", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "The Complex Arithmetic Underlying Quantum Advantage", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Hook learner with the mathematical power of complex amplitudes vs real probabilities."
            },
            {
                "title": "Complex Numbers in Polar Form",
                "duration": 25,
                "narration": "Any complex amplitude α can be written in rectangular form as a + bi, or in polar form as r times e to the power of i theta. Here, r is the magnitude, and theta is the phase angle.",
                "captions": [
                    {"text": "Rectangular form: α = a + bi.  Polar form: α = r e^(iθ).", "dur": 12},
                    {"text": "r represents the amplitude magnitude; θ represents the phase angle.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_polar", "text": "α = a + bi = r · e^(iθ)", "role": "formula", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_mag", "text": "Magnitude: r = √(a² + b²)  |  Phase: θ = arctan(b/a)", "role": "body", "position": [0.0, -0.6, 0.1]}
                ],
                "purpose": "Review Euler's formula and polar decomposition of complex amplitudes."
            },
            {
                "title": "Why Negative Amplitudes Matter",
                "duration": 30,
                "narration": "Consider the state |+⟩ with amplitude +1/√2, and |-⟩ with amplitude -1/√2 for state |1⟩. Both square to 1/2 upon measurement. But before measurement, adding +1/√2 and -1/√2 results in zero—complete cancellation!",
                "captions": [
                    {"text": "|+1/√2|² = 1/2, and |-1/√2|² = 1/2. Measurement probabilities are identical.", "dur": 14},
                    {"text": "Yet amplitudes can add constructively (1) or destructively cancel to 0!", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_cancel", "text": "Destructive Amplitude Interference", "role": "header", "position": [0.0, 2.0, 0.1]},
                    {"id": "txt_math", "text": "(+1/√2) + (-1/√2) = 0", "role": "formula", "position": [0.0, 0.2, 0.1]}
                ],
                "purpose": "Demonstrate destructive cancellation mathematically."
            },
            {
                "title": "Global Phase Invariance",
                "duration": 30,
                "narration": "What happens if we multiply the entire quantum state by a phase factor e to the i gamma? When we calculate measurement probabilities, the phase factor conjugates to one and vanishes. Global phase is physically undetectable!",
                "captions": [
                    {"text": "Multiplying a state by e^(iγ): |ψ'⟩ = e^(iγ)|ψ⟩.", "dur": 13},
                    {"text": "Probability: |e^(iγ)ψ|² = |e^(iγ)|² |ψ|² = 1 · |ψ|². Global phase is undetectable!", "dur": 17}
                ],
                "onScreenText": [
                    {"id": "txt_global", "text": "Global Phase Invariance: |e^(iγ)ψ|² = |ψ|²", "role": "formula", "position": [0.0, 0.8, 0.1]},
                    {"id": "txt_note", "text": "Global phase leaves all physical observables unchanged", "role": "subheader", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Formalize the proof of global phase invariance."
            },
            {
                "title": "The Power of Relative Phase",
                "duration": 35,
                "narration": "In contrast, the relative phase—the difference in phase between |0⟩ and |1⟩—is intensely physical! By factoring out global phase, any single-qubit pure state can be written using two angles: theta and phi.",
                "captions": [
                    {"text": "Relative phase is the phase angle difference between |0⟩ and |1⟩.", "dur": 15},
                    {"text": "Canonical parameterization: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_param", "text": "|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩", "role": "formula", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_angles", "text": "θ ∈ [0, π] (Colatitude)  |  φ ∈ [0, 2π) (Longitude)", "role": "subheader", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Derive the standard spherical parameterization of a single qubit."
            },
            {
                "title": "Phase on the Bloch Equator",
                "duration": 35,
                "narration": "When theta equals 90 degrees, the qubit sits on the equator of the Bloch sphere. Here, varying the relative phase phi rotates the state from |+⟩ at phi equals 0, to |i⟩ at 90 degrees, to |-⟩ at 180 degrees.",
                "captions": [
                    {"text": "On the equator (θ = π/2), varying relative phase φ rotates the vector.", "dur": 16},
                    {"text": "φ = 0 gives |+⟩; φ = π/2 gives |+i⟩; φ = π gives |-⟩.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_eq", "text": "Equatorial Relative Phase States", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_p_state", "text": "|+⟩ = (|0⟩ + |1⟩)/√2 (φ = 0)", "role": "body", "position": [0.0, 1.0, 0.1]},
                    {"id": "txt_i_state", "text": "|+i⟩ = (|0⟩ + i|1⟩)/√2 (φ = π/2)", "role": "body", "position": [0.0, 0.0, 0.1]},
                    {"id": "txt_m_state", "text": "|-⟩ = (|0⟩ - |1⟩)/√2 (φ = π)", "role": "body", "position": [0.0, -1.0, 0.1]}
                ],
                "purpose": "Connect relative phase parameterization to Bloch sphere longitude."
            },
            {
                "title": "Summary & Next Steps",
                "duration": 35,
                "narration": "To summarize: complex amplitudes give quantum states phase. While global phase is invisible, relative phase alters the state's geometry and drives wave interference. In Lesson 7, we explore Quantum Phase and Interference in action.",
                "captions": [
                    {"text": "Summary: Amplitudes α, β ∈ ℂ possess magnitude and relative phase.", "dur": 15},
                    {"text": "Next: Lesson 7 — Quantum Phase & Wave Interference.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 6 SUMMARY", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_a1", "text": "1. Polar Form: α = r e^(iθ) with magnitude r and phase θ", "role": "body", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_a2", "text": "2. Global Phase e^(iγ): Completely undetectable experimentally", "role": "body", "position": [0.0, 0.2, 0.1]},
                    {"id": "txt_a3", "text": "3. Relative Phase e^(iφ): Highly physical; defines equatorial position", "role": "body", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Recap probability amplitude insights and transition to Lesson 7."
            }
        ]
    },
    {
        "folder": "lesson07_quantum_phase_interference",
        "lessonId": "s1-theory-quantum-phase",
        "lessonTitle": "Quantum Phase & Interference",
        "targetDuration": 240,
        "objectives": [
            "Understand wave interference: constructive vs destructive.",
            "Analyze how the Pauli-Z gate applies relative phase: Z|1⟩ = -|1⟩.",
            "Trace the Hadamard-Z-Hadamard sequence and its destructive cancellation.",
            "Distinguish classical probabilistic transitions from quantum phase interference.",
            "Understand interference as the computational mechanism of quantum algorithms."
        ],
        "boundaries": {
            "topicsCovered": [
                "Constructive interference (waves in phase reinforce)",
                "Destructive interference (waves out of phase cancel)",
                "Pauli-Z phase flip: Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩",
                "H-Z-H circuit identity (transforming Z into X: HZH = X)",
                "Interference-based algorithm principles (Grover, Deutsch-Jozsa preview)"
            ],
            "topicsDeferred": [
                "Continuous rotation gates Rz(θ), Rx(θ) (Lesson 8)",
                "Phase kickback in controlled operations (Sprint 2)",
                "Quantum Fourier Transform (Sprint 3)"
            ]
        },
        "scenes": [
            {
                "title": "The Double Slit and Quantum Waves",
                "duration": 20,
                "narration": "In the famous double slit experiment, particles shot through two barriers create an alternating pattern of bright and dark fringes. Quantum computers harness this identical phenomenon: Wave Interference.",
                "captions": [
                    {"text": "The double-slit experiment revealed the wave nature of quantum particles.", "dur": 10},
                    {"text": "Quantum computers engineer wave interference to amplify correct answers.", "dur": 10}
                ],
                "onScreenText": [
                    {"id": "txt_head", "text": "LESSON 7: QUANTUM PHASE & INTERFERENCE", "role": "header", "position": [-6.0, 3.8, 0.1]},
                    {"id": "txt_sub", "text": "Constructive Reinforcement & Destructive Cancellation", "role": "subheader", "position": [-6.0, 3.2, 0.1]}
                ],
                "purpose": "Introduce the physical wave nature of quantum states."
            },
            {
                "title": "Constructive vs Destructive Interference",
                "duration": 25,
                "narration": "When two quantum paths are in phase (peaks aligned with peaks), their amplitudes add constructively, amplifying probability. When they are 180 degrees out of phase, peaks meet troughs and cancel out completely.",
                "captions": [
                    {"text": "Constructive: in-phase waves add together, amplifying probability.", "dur": 12},
                    {"text": "Destructive: opposite-phase waves cancel out, driving probability to zero.", "dur": 13}
                ],
                "onScreenText": [
                    {"id": "txt_interf", "text": "Principles of Quantum Wave Interference", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_const", "text": "Constructive: (+A) + (+A) = +2A (P ∝ 4A²)", "role": "body", "position": [-4.0, 0.0, 0.1]},
                    {"id": "txt_dest", "text": "Destructive: (+A) + (-A) = 0 (P = 0)", "role": "body", "position": [4.0, 0.0, 0.1]}
                ],
                "purpose": "Illustrate constructive and destructive interference with wave graphics."
            },
            {
                "title": "The Pauli-Z Phase Gate",
                "duration": 30,
                "narration": "To control phase in a quantum circuit, we use phase gates. The foundational phase gate is Pauli-Z. Acting on |0⟩, Z leaves it unchanged. But acting on |1⟩, it flips the sign, imparting a 180-degree relative phase shift.",
                "captions": [
                    {"text": "The Pauli-Z gate imparts a 180° (π) relative phase shift to |1⟩.", "dur": 14},
                    {"text": "Z|0⟩ = |0⟩, while Z|1⟩ = -|1⟩. Z leaves computational probabilities unchanged!", "dur": 16}
                ],
                "onScreenText": [
                    {"id": "txt_z_mat", "text": "Z = [ [1,  0], [0, -1] ]", "role": "formula", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_z_act", "text": "Z |0⟩ = |0⟩  |  Z |1⟩ = -|1⟩", "role": "formula", "position": [0.0, -0.6, 0.1]}
                ],
                "purpose": "Define the Pauli-Z gate and its selective phase-flip action."
            },
            {
                "title": "Transforming |+⟩ to |-⟩",
                "duration": 30,
                "narration": "Consider what happens when Z acts on the plus state |+⟩ = (|0⟩ + |1⟩)/√2. The |0⟩ term remains positive, while the |1⟩ term flips negative, transforming |+⟩ directly into the minus state |-⟩!",
                "captions": [
                    {"text": "Z |+⟩ = Z [ (|0⟩ + |1⟩)/√2 ] = (|0⟩ - |1⟩)/√2 = |-⟩.", "dur": 15},
                    {"text": "Z rotates the state vector across the equator of the Bloch sphere.", "dur": 15}
                ],
                "onScreenText": [
                    {"id": "txt_z_plus", "text": "Z |+⟩ = |-⟩", "role": "formula", "position": [0.0, 0.8, 0.1]},
                    {"id": "txt_z_minus", "text": "Z |-⟩ = |+⟩", "role": "formula", "position": [0.0, -0.6, 0.1]}
                ],
                "purpose": "Show how Pauli-Z toggles between the plus and minus states."
            },
            {
                "title": "The H-Z-H Interference Experiment",
                "duration": 35,
                "narration": "Now let us observe the full power of interference. Start in |0⟩. Apply H to create |+⟩. Apply Z to flip the phase to |-⟩. Now apply H a second time! The paths to |0⟩ destructively cancel, and we measure |1⟩ with 100% certainty!",
                "captions": [
                    {"text": "Start at |0⟩ -> H -> |+⟩ -> Z -> |-⟩ -> H -> |1⟩.", "dur": 16},
                    {"text": "The paths to |0⟩ cancel to 0; the paths to |1⟩ reinforce to 100% certainty!", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_hzh", "text": "H · Z · H = X (Bit-Flip via Phase Interference)", "role": "formula", "position": [0.0, 1.0, 0.1]},
                    {"id": "txt_tree", "text": "Paths to |0⟩: (+1/2) + (-1/2) = 0 | Paths to |1⟩: (+1/2) + (+1/2) = 1", "role": "subheader", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Walk through the foundational H-Z-H circuit showing path interference."
            },
            {
                "title": "How Quantum Algorithms Work",
                "duration": 35,
                "narration": "This reveals the master blueprint behind all quantum algorithms: we configure quantum gates so that incorrect solutions destructively cancel out, while the correct answers constructively amplify into high probability.",
                "captions": [
                    {"text": "The quantum algorithm blueprint: cancel wrong paths, amplify the right ones.", "dur": 16},
                    {"text": "Interference enables Grover search, Shor's algorithm, and quantum simulation.", "dur": 19}
                ],
                "onScreenText": [
                    {"id": "txt_algo_title", "text": "The Quantum Algorithmic Engine", "role": "header", "position": [0.0, 2.5, 0.1]},
                    {"id": "txt_bad", "text": "Wrong Answers ───> Destructive Interference (P -> 0)", "role": "body", "position": [0.0, 0.5, 0.1]},
                    {"id": "txt_good", "text": "Correct Solution ───> Constructive Interference (P -> 1)", "role": "body", "position": [0.0, -0.5, 0.1]}
                ],
                "purpose": "Demystify quantum computational advantage as guided wave interference."
            },
            {
                "title": "Summary & Next Steps",
                "duration": 35,
                "narration": "In summary: Phase is the rudder that steers quantum interference. By manipulating relative phases, gates orchestrate constructive and destructive wave behavior. In Lesson 8, we explore the complete canonical suite of Single-Qubit Gates.",
                "captions": [
                    {"text": "Summary: Phase steers constructive amplification and destructive cancellation.", "dur": 15},
                    {"text": "Next: Lesson 8 — Single-Qubit Quantum Gates.", "dur": 20}
                ],
                "onScreenText": [
                    {"id": "txt_sum_title", "text": "LESSON 7 SUMMARY", "role": "header", "position": [0.0, 3.0, 0.1]},
                    {"id": "txt_i1", "text": "1. Interference: Constructive (+) amplifies; Destructive (-) cancels", "role": "body", "position": [0.0, 1.2, 0.1]},
                    {"id": "txt_i2", "text": "2. Pauli-Z Gate: Inverts phase of |1⟩ while preserving |0⟩", "role": "body", "position": [0.0, 0.2, 0.1]},
                    {"id": "txt_i3", "text": "3. HZH = X: A phase flip sandwiched between Hadamards flips the bit", "role": "body", "position": [0.0, -0.8, 0.1]}
                ],
                "purpose": "Recap interference fundamentals and preview single-qubit gate taxonomy."
            }
        ]
    }
]

def generate_part2():
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__))))
    from generate_sprint01_specs_part1 import generate_lesson_spec
    for item in LESSONS_DATA:
        generate_lesson_spec(item)

if __name__ == "__main__":
    generate_part2()
