# QUALUTION Voiceover & Narration Script — Single-Qubit Quantum Gates

- **Lesson ID**: `s1-theory-single-qubit-gates`
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
0:00 - 0:20  scene-01     In classical circuits, logic gates manipulate discrete bits through Boolean algebra: AND, OR, NOT. In quantum circuits, single-qubit gates are continuous geometric rotations of our state vector across the Bloch sphere.

0:20 - 0:45  scene-02     Every valid quantum gate must be represented by a unitary matrix U. Unitarity means that U dagger times U equals the identity matrix. This guarantees that total probability is strictly conserved and operations are reversible.

0:45 - 1:20  scene-03     The fundamental single-qubit operators are the Pauli matrices. Pauli-X is the quantum NOT gate, rotating 180 degrees around the X-axis. Pauli-Z flips phase by 180 degrees around the Z-axis. And Pauli-Y flips both bit and phase.

1:20 - 1:50  scene-04     Beyond full 180-degree flips, we need finer phase control. The S gate applies a 90-degree phase shift—it is the square root of Z. The T gate applies a 45-degree phase shift—the fourth root of Z, crucial for universal quantum computation.

1:50 - 2:25  scene-05     To point anywhere on the Bloch sphere, we use continuous rotation gates: Rx(θ), Ry(θ), and Rz(θ). These parametric gates rotate the state vector by any arbitrary angle theta around their respective Cartesian axes.

2:25 - 2:55  scene-06     Many quantum gates are self-inverse: applying X twice returns the state to identity: X · X = I. The same holds for Hadamard: H · H = I. In QUALUTION's circuit optimizer, adjacent identical gates are automatically cancelled!

2:55 - 3:30  scene-07     We now possess the complete single-qubit gate toolkit: Pauli X, Y, Z, Hadamard, S, T, and continuous rotations. In Lesson 9, we assemble these gates into full quantum circuits on a quantum circuit timeline.

```
