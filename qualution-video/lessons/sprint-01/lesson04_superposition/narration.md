# QUALUTION Voiceover & Narration Script — Understanding Superposition

- **Lesson ID**: `s1-theory-superposition`
- **Sprint**: Sprint 1 (Quantum Foundations)
- **Target Video Duration**: 4m 0s (240s)
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
0:00 - 0:20  scene-01     Popular media often claims that a qubit is 'in two states at the same time.' But mathematically, a qubit in superposition is simply in ONE definite quantum state—a linear combination of basis vectors.

0:20 - 0:45  scene-02     Think of classical bits as navigating along a single vertical line between 0 and 1. A qubit expands this line into a continuous plane: by adding vectors α|0⟩ and β|1⟩, we point anywhere on the unit circle.

0:45 - 1:15  scene-03     A classical coin spinning in the air has a 50 percent chance of heads, but at every microsecond it is in a definite classical state—you simply lack knowledge. A qubit in superposition is fundamentally indeterminate until measured.

1:15 - 1:45  scene-04     How do we create superposition in a quantum circuit? The most important tool is the Hadamard gate, denoted H. Applying H to the ground state |0⟩ produces an equal superposition of |0⟩ and |1⟩.

1:45 - 2:15  scene-05     When H acts on |0⟩, it creates the plus state |+⟩. But when H acts on |1⟩, it introduces a negative sign: the minus state |-⟩ = (|0⟩ - |1⟩)/√2. Both have equal 50/50 measurement probabilities, but different internal phases!

2:15 - 2:50  scene-06     On the Bloch sphere, the Hadamard gate rotates the state vector 90 degrees from the North Pole down to the equator along the positive X-axis for |+⟩, and the negative X-axis for |-⟩.

2:50 - 3:25  scene-07     Superposition is the engine of quantum advantage. When we place n qubits into superposition, our register simultaneously represents 2 to the power of n basis states—allowing a quantum computer to evaluate entire search spaces in parallel.

3:25 - 4:00  scene-08     To recap: superposition is a coherent linear combination of quantum basis states created by gates like the Hadamard. Next in Lesson 5, we discover what happens when we observe a superposition: Born's Rule and wavefunction collapse.

```
