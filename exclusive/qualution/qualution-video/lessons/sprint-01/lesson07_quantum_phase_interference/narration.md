# QUALUTION Voiceover & Narration Script — Quantum Phase & Interference

- **Lesson ID**: `s1-theory-quantum-phase`
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
0:00 - 0:20  scene-01     In the famous double slit experiment, particles shot through two barriers create an alternating pattern of bright and dark fringes. Quantum computers harness this identical phenomenon: Wave Interference.

0:20 - 0:45  scene-02     When two quantum paths are in phase (peaks aligned with peaks), their amplitudes add constructively, amplifying probability. When they are 180 degrees out of phase, peaks meet troughs and cancel out completely.

0:45 - 1:15  scene-03     To control phase in a quantum circuit, we use phase gates. The foundational phase gate is Pauli-Z. Acting on |0⟩, Z leaves it unchanged. But acting on |1⟩, it flips the sign, imparting a 180-degree relative phase shift.

1:15 - 1:45  scene-04     Consider what happens when Z acts on the plus state |+⟩ = (|0⟩ + |1⟩)/√2. The |0⟩ term remains positive, while the |1⟩ term flips negative, transforming |+⟩ directly into the minus state |-⟩!

1:45 - 2:20  scene-05     Now let us observe the full power of interference. Start in |0⟩. Apply H to create |+⟩. Apply Z to flip the phase to |-⟩. Now apply H a second time! The paths to |0⟩ destructively cancel, and we measure |1⟩ with 100% certainty!

2:20 - 2:55  scene-06     This reveals the master blueprint behind all quantum algorithms: we configure quantum gates so that incorrect solutions destructively cancel out, while the correct answers constructively amplify into high probability.

2:55 - 3:30  scene-07     In summary: Phase is the rudder that steers quantum interference. By manipulating relative phases, gates orchestrate constructive and destructive wave behavior. In Lesson 8, we explore the complete canonical suite of Single-Qubit Gates.

```
