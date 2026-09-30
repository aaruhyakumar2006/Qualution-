# QUALUTION Voiceover & Narration Script — From Quantum States to Circuits

- **Lesson ID**: `s1-theory-states-to-circuits`
- **Sprint**: Sprint 1 (Quantum Foundations)
- **Target Video Duration**: 3m 30s (210s)
- **Average Spoken Pacing**: ~130 words per minute
- **Tone**: Authoritative, engaging, mathematically sound, educational

---

## Pronunciation & Key Notation Guide

| Term | Pronunciation Guide | Meaning |
|---|---|---|
| **Qubit** | `KYOO-bit` | Basic unit of quantum information |
| **|0⟩** | `ket zero` | Ground computational basis state |
| **|1⟩** | `ket one` | Excited computational basis state |
| **|ψ⟩** | `ket psi` (pronounced *sigh*) | General quantum state vector |
| **α, β** | `alpha, beta` | Complex probability amplitudes |
| **Hadamard** | `HAD-uh-mard` | Superposition gate (H) |
| **QUALUTION** | `kwa-LOO-shun` | Quantum Education Platform |

---

## Full Line-by-Line Narration Script with Caption Sync

```
[TIME]       [SCENE]      [NARRATION LINE]
0:00 - 0:20  scene-01     A quantum circuit is like a musical score. Each horizontal line is a wire representing a qubit progressing through time from left to right, while gates are musical notes transforming the harmony of quantum states.

0:20 - 0:45  scene-02     By convention, every qubit wire begins at time zero in the ground state |0⟩. Operations execute sequentially from left to right. When two gates sit in the same vertical column on different wires, they execute simultaneously.

0:45 - 1:15  scene-03     Here is a crucial rule for every quantum programmer: while circuits execute left-to-right, mathematical matrix multiplication is written right-to-left! If a circuit applies gate A then gate B, the overall unitary is B times A.

1:15 - 1:50  scene-04     To evaluate circuit efficiency, we measure two key structural metrics: Total Gate Count—the sum of all operations—and Circuit Depth—the number of sequential time steps required to execute the circuit when parallel gates run together.

1:50 - 2:20  scene-05     At the end of a circuit, measurement meters convert quantum statevectors into classical bits, storing the results in a classical register denoted with double lines. This marks the transition from quantum coherence to classical data.

2:20 - 2:55  scene-06     In QUALUTION, your visual circuit is bidirectionally synchronized with real quantum code. As you drag gates, the platform automatically generates idiomatic Qiskit, PennyLane, or Cirq scripts ready for real quantum hardware.

2:55 - 3:30  scene-07     Congratulations! You have mastered the journey from quantum states to full circuit diagrams. Next, we consolidate everything in Lesson 10 with our Sprint 1 Comprehensive Review and Knowledge Check.

```
