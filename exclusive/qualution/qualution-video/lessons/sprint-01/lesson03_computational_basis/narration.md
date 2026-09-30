# QUALUTION Voiceover & Narration Script — The Computational Basis

- **Lesson ID**: `s1-theory-computational-basis`
- **Sprint**: Sprint 1 (Quantum Foundations)
- **Target Video Duration**: 3m 50s (230s)
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
0:00 - 0:20  scene-01     To measure and navigate physical space, we rely on coordinate axes: X, Y, and Z. In quantum computing, the computational basis serves as the foundational coordinate system for all quantum information.

0:20 - 0:45  scene-02     By international convention, the standard computational basis corresponds to measurement along the Z-axis of the Bloch sphere. We denote these standard eigenstates as ket zero and ket one.

0:45 - 1:15  scene-03     For every ket vector |ψ⟩ in our Hilbert space, there is a corresponding dual vector called a bra, written ⟨ψ|. Mathematically, the bra is formed by taking the complex conjugate transpose of the column ket.

1:15 - 1:50  scene-04     When a bra and ket meet, they form a bracket—an inner product representing geometric overlap. The computational basis states are orthonormal: ⟨0|0⟩ equals one, ⟨1|1⟩ equals one, but ⟨0|1⟩ equals zero.

1:50 - 2:20  scene-05     Because {|0⟩, |1⟩} spans the entire two-dimensional space, we can project any state vector onto our basis using inner products. The amplitude α is simply ⟨0|ψ⟩, and β is ⟨1|ψ⟩.

2:20 - 2:45  scene-06     By summing the outer products of our orthonormal basis, we obtain the identity operator: |0⟩⟨0| + |1⟩⟨1| equals the identity matrix I. This completeness relation ensures quantum operations preserve total geometry.

2:45 - 3:20  scene-07     In physical quantum hardware—whether transmon microwave resonators or ion-trap lasers—readout devices measure qubits directly in this computational Z-basis, collapsing quantum superposition into classical bits.

3:20 - 3:50  scene-08     We have seen that the computational basis provides the orthonormal coordinates for quantum computation: ⟨i|j⟩ = δ_ij. Next, we discover what happens when a qubit occupies both states simultaneously: Superposition.

```
