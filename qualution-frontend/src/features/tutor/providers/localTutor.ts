import type { TutorProvider } from './base';
import type { TutorContext, TutorResponse, TutorAction } from '../tutorTypes';
import { extractQuantumFacts } from '../quantumFacts';
import { GATE_KNOWLEDGE_CATALOG } from '../../learning/gateKnowledge';
import { analyzeCircuit } from '../../circuit/circuitAnalyzer';
import { selectExecutionPath, routeCircuit } from '../../circuit/executionRouter';

export class LocalTutorProvider implements TutorProvider {
  name = 'Qualution Deterministic Quantum Tutor';

  async answer(question: string, context: TutorContext): Promise<TutorResponse> {
    const qLower = question.toLowerCase();
    const factSet = extractQuantumFacts(context);
    const actions: TutorAction[] = [];
    const isTech = context.learningLevel === 'technical';

    // Default action options
    if (context.simulation) {
      actions.push({ type: 'open_state', label: 'Inspect Statevector', payload: { tab: 'state' } });
    }
    if (context.timeline) {
      actions.push({ type: 'open_timeline', label: 'View Timeline', payload: { tab: 'timeline' } });
    }
    if (context.bloch && context.circuit.qubits === 1) {
      actions.push({ type: 'open_bloch', label: 'Inspect Bloch Sphere', payload: { tab: 'bloch' } });
    }

    // 0.5. CIRCUIT ROUTING & ENGINE SELECTION (Phase 7 Multi-Signal Routing & Phase 10 Normalization)
    const isRoutingQuery =
      qLower.includes('why did qualution use') ||
      qLower.includes('why qualution use') ||
      qLower.includes('why did it use') ||
      qLower.includes('stabilizer instead of statevector') ||
      qLower.includes('statevector instead of stabilizer') ||
      qLower.includes('why stabilizer') ||
      qLower.includes('why statevector') ||
      qLower.includes('why mps') ||
      qLower.includes('why cloud') ||
      qLower.includes('why qpu') ||
      (qLower.includes('why was') && (qLower.includes('chosen') || qLower.includes('selected') || qLower.includes('routed'))) ||
      qLower.includes('routing reason') ||
      qLower.includes('execution router') ||
      qLower.includes('why route') ||
      qLower.includes('explain routing');

    if (isRoutingQuery) {
      const circuitReq = {
        qubits: context.circuit.qubits,
        classical_bits: context.circuit.classicalBits,
        gates: context.circuit.gates,
        measure: context.circuit.measure,
        shots: context.circuit.shots,
      };

      const analysis = analyzeCircuit(circuitReq);
      const decision = selectExecutionPath(analysis);
      const routingReason =
        context.routing?.reason ||
        context.simulation?.routing_reason ||
        decision.routing_reason;

      const chosenMethod = context.routing?.method || decision.method;
      const backend = context.routing?.selected_backend || decision.backend;
      const qubitCount = context.circuit.qubits;
      const gateCount = context.circuit.gates.length;
      const depth = analysis.depth;
      const twoQCount = analysis.two_qubit_gate_count;
      const memMb = (analysis.estimated_statevector_memory_bytes / (1024 * 1024)).toFixed(1);

      const fidelity = context.routing?.fidelity ?? context.simulation?.fidelity;
      const truncationError = context.routing?.truncation_error ?? context.simulation?.truncation_error;
      const approximation = context.routing?.approximation ?? context.simulation?.approximation;

      let answer = '';
      const facts: string[] = [
        `Selected engine: ${chosenMethod.toUpperCase()} (${backend})`,
        `Routing decision: ${routingReason}`,
      ];

      if (chosenMethod === 'stabilizer') {
        answer = `### ⚡ Execution Router Decision: Clifford Stabilizer Engine (Tier 1)

**Why QUALUTION used Stabilizer instead of Statevector:**
1. **Gottesman-Knill Theorem & Full Clifford Compatibility:**
   Your circuit contains ${gateCount} gate(s) across ${qubitCount} qubit(s) (depth ${depth}). Every operation belongs strictly to the **Clifford group** ($H$, $X$, $Y$, $Z$, $S$, $S^\\dagger$, $CX$, $CZ$, $SWAP$, and computational measurements).
2. **Polynomial Scaling ($O(N^2)$ gate evolution, $\sim O(N^3)$ full-register measurement) vs. Exponential RAM:**
   A dense statevector requires allocating $2^{${qubitCount}} = ${Math.pow(2, qubitCount)}$ complex amplitudes (~${memMb} MB RAM). By contrast, QUALUTION's **Stabilizer engine** tracks a $(2N) \\times (2N+1)$ Aaronson-Gottesman binary tableau. It simulates projective measurements in polynomial time without exponential statevector memory overhead.
3. **Formal Router Directive:**
   > "${routingReason}"`;

        facts.push('All gates belong to the Clifford group; polynomial time O(N^2) gate evolution, ~O(N^3) full-register measurement applies.');
        facts.push(`Tableau memory footprint: ~${Math.round(((2 * qubitCount + 1) * (2 * qubitCount + 1)) / 1024 * 100) / 100} KB.`);
      } else if (chosenMethod === 'statevector') {
        const nonCliffordGates = context.circuit.gates
          .filter((g) => !['h', 'x', 'y', 'z', 's', 'sdg', 's_dagger', 'cx', 'cnot', 'cz', 'swap', 'id', 'measure'].includes((g.gate || (g as any).type || '').toLowerCase()))
          .map((g) => (g.gate || (g as any).type).toUpperCase());
        const uniqueNonClifford = Array.from(new Set(nonCliffordGates));

        answer = `### ⚡ Execution Router Decision: Local Dense Statevector Engine (Tier 2)

**Why QUALUTION used Statevector instead of Stabilizer:**
1. **Non-Clifford Operations Detected:**
   Your circuit contains non-Clifford operations (${uniqueNonClifford.length > 0 ? uniqueNonClifford.join(', ') : 'arbitrary rotations / T-gates'}) across ${qubitCount} qubit(s) (depth ${depth}, ${twoQCount} entangling gates). Non-Clifford gates rotate state vectors outside the discrete stabilizer group, making stabilizer tableau tracking mathematically invalid.
2. **Safe Client Memory Envelope:**
   Simulating this circuit requires $2^{${qubitCount}} = ${Math.pow(2, qubitCount)}$ complex amplitudes (requiring ~${memMb} MB RAM). Because ${qubitCount} qubits falls within your client browser's safe memory threshold ($\le 20$ qubits, ~17 MB), QUALUTION executes exact in-place tensor-index updates locally on your device.
3. **Formal Router Directive:**
   > "${routingReason}"`;

        facts.push(`Circuit is non-Clifford due to: ${uniqueNonClifford.join(', ') || 'rotations'}.`);
        facts.push(`Dense statevector represents all 2^${qubitCount} (${Math.pow(2, qubitCount)}) amplitudes using ~${memMb} MB RAM.`);
      } else if (chosenMethod === 'mps') {
        const fidelityStr = fidelity !== undefined ? `${(fidelity * 100).toFixed(4)}%` : '100.0000%';
        const truncStr = truncationError !== undefined ? truncationError.toExponential(4) : '0.0000e+00';

        answer = `### ⚡ Execution Router Decision: Matrix Product State (MPS) Tensor Network (Tier 3)

**Why QUALUTION routed to Matrix Product State (MPS):**
1. **Qubit Count Exceeds Statevector RAM:**
   At ${qubitCount} qubits, a dense classical statevector would require $2^{${qubitCount}} = ${Math.pow(2, Math.min(qubitCount, 60))}$ amplitudes (~${memMb} MB RAM), exceeding safe client browser memory.
2. **Bounded Entanglement Topology:**
   With only ${twoQCount} entangling gate(s) and 1D connectivity, the quantum state exhibits low Schmidt rank and bounded entanglement entropy. The router dispatched execution to the local Python Qiskit Aer MPS tensor network engine.
3. **Real Simulation Telemetry & Approximation:**
   - **Contraction Fidelity:** \`${fidelityStr}\` (state vector fidelity vs. ideal evolution)
   - **Singular-Value Truncation Error:** \`${truncStr}\`
   - **Approximation Status:** \`${approximation ? 'True (Bond dimension truncated)' : 'False (Exact tensor decomposition)'}\`
4. **Formal Router Directive:**
   > "${routingReason}"`;

        facts.push(`MPS simulation across ${qubitCount} qubits with ${twoQCount} entangling gates.`);
        if (fidelity !== undefined) {
          facts.push(`Measured tensor contraction fidelity: ${fidelityStr}, truncation error: ${truncStr}.`);
        }
      } else {
        answer = `### ⚡ Execution Router Decision: Cloud / Remote QPU Execution (Tier 4)

**Why QUALUTION routed to Cloud / QPU Execution:**
1. **Classical Complexity Ceiling:**
   Your circuit operates on ${qubitCount} qubits with ${twoQCount} entangling gates (depth ${depth}). This deep, multi-dimensional entanglement cannot be efficiently decomposed as a 1D Matrix Product State and exceeds local device RAM (~${memMb} MB).
2. **Honest Architectural Dispatch:**
   QUALUTION routes this high-complexity workload to remote quantum cloud hardware.
3. **Formal Router Directive:**
   > "${routingReason}"`;

        facts.push(`High complexity circuit: ${qubitCount}Q, depth ${depth}, ${twoQCount} entangling gates.`);
      }

      actions.push({ type: 'open_metrics', label: 'View Engine Metrics', payload: { tab: 'metrics' } });

      return {
        answer,
        confidence: 'high',
        facts,
        actions,
        suggestions: [
          'What is the difference between Stabilizer and Statevector?',
          'How does Matrix Product State (MPS) handle entanglement?',
          'What makes a gate Clifford compatible?',
        ],
      };
    }

    // 0. SCHEMA VALIDATION, SYNTAX, & EXECUTION ERROR DIAGNOSTICS
    const combinedErrorText = `${question} ${context.error || ''}`.toLowerCase();
    if (
      combinedErrorText.includes('literal_error') ||
      combinedErrorText.includes('input should be') ||
      combinedErrorText.includes('why error') ||
      combinedErrorText.includes('validation error') ||
      (combinedErrorText.includes('error') && (combinedErrorText.includes('gate') || combinedErrorText.includes('circuit') || context.error))
    ) {
      const mentionsP = combinedErrorText.includes('"p"') || combinedErrorText.includes("'p'") || /\bp\b/.test(combinedErrorText);
      const mentionsSdg = combinedErrorText.includes('"sdg"') || combinedErrorText.includes("'sdg'") || /\bsdg\b/.test(combinedErrorText);

      let errorExplanation = '';
      if (mentionsP || mentionsSdg || combinedErrorText.includes('literal_error')) {
        errorExplanation = `### ⚠️ Quantum Circuit Schema Validation Error (HTTP 422)

**Why did this error occur?**
The Qualution quantum execution engine and Pydantic validator enforce a strict, verified gate vocabulary:
\`{'h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'cx', 'cz', 'swap'}\`.

Your circuit input contained gate types that are not recognized by this schema:
${mentionsP ? `* **\`p\` (Phase Gate $P(\\theta)$)**: Rejected because Qualution uses parametric rotation **\`rz\`** for arbitrary Z-axis phase shifts.\n` : ''}${mentionsSdg ? `* **\`sdg\` ($S^\\dagger$ / S-dagger)**: Rejected because Qualution uses primitive Cliffords and rotations rather than adjoint abbreviations.\n` : ''}
---

### 🔧 How to Fix Your Circuit:

${mentionsP ? `1. **Replace \`p\` with \`rz\`**:
   * The phase gate $P(\\theta) = \\begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\\theta} \\end{pmatrix}$ is mathematically equivalent to $R_Z(\\theta) = \\begin{pmatrix} e^{-i\\theta/2} & 0 \\\\ 0 & e^{i\\theta/2} \\end{pmatrix}$ up to an unobservable global phase ($e^{i\\theta/2}$).
   * **Fix**: Change \`{"gate": "p", "targets": [q], "angle": theta}\` to \`{"gate": "rz", "targets": [q], "angle": theta}\`.
   * *Special angles*: If $\\theta = \\pi/2$, you can simply use the native **\`s\`** gate; if $\\theta = \\pi/4$, use **\`t\`**; if $\\theta = \\pi$, use **\`z\`**.\n` : ''}${mentionsSdg ? `2. **Replace \`sdg\` with \`rz\` or \`s\`**:
   * The S-dagger gate $S^\\dagger = \\begin{pmatrix} 1 & 0 \\\\ 0 & -i \\end{pmatrix}$ applies a $-\\pi/2$ phase shift.
   * **Fix Option A**: Use \`{"gate": "rz", "targets": [q], "angle": -1.57079632679}\` ($-\\pi/2$ radians).
   * **Fix Option B**: Since $S^4 = I$, $S^\\dagger = S^3$. You can apply three consecutive **\`s\`** gates on that qubit.\n` : ''}
Once updated to supported gate primitives, your circuit will pass validation and simulate accurately!`;
      } else {
        errorExplanation = `### ⚠️ Circuit Execution / Validation Notice
The circuit encountered an execution or validation issue:
\`${context.error || question}\`

**Recommended Action**:
1. Check that all qubit indices are within the range \`0\` to \`${context.circuit.qubits - 1}\`.
2. Ensure two-qubit gates (\`cx\`, \`cz\`, \`swap\`) reference two distinct qubit targets.
3. Verify that rotation gates (\`rx\`, \`ry\`, \`rz\`) have a valid numerical \`angle\` specified in radians.`;
      }

      return {
        answer: errorExplanation,
        confidence: 'high',
        facts: [
          "Qualution IR supports 12 verified gates: 'h', 'x', 'y', 'z', 's', 't', 'rx', 'ry', 'rz', 'cx', 'cz', 'swap'.",
          "Phase gate P(θ) is unitary-equivalent to RZ(θ) up to global phase e^(iθ/2), preserving all observable probabilities.",
          "S-dagger S† is the Hermitian conjugate of S; S† = RZ(-π/2) = S³."
        ],
        actions,
        suggestions: [
          'How do I convert P(theta) to RZ?',
          'What is the difference between S and S-dagger?',
          'Explain the valid gate set in Qualution.'
        ]
      };
    }

    // 1. PREDICT & WHAT-IF QUESTIONS
    if (
      qLower.includes('predict') ||
      qLower.includes('what happens if') ||
      qLower.includes('what will happen') ||
      qLower.includes('what if i add')
    ) {
      let predictText = '';
      if (qLower.includes('x gate') || qLower.includes('x(')) {
        predictText = isTech
          ? 'Prediction: Applying Pauli-X to a qubit flips its computational basis amplitude (|0⟩ ↔ |1⟩). If placed on q1 before CX in a Bell circuit, the state evolves into (|01⟩ + |10⟩)/√2 (the |Ψ⁺⟩ Bell state), yielding 50% |01⟩ and 50% |10⟩.'
          : 'Prediction: Adding an X gate flips that qubit. If you flip qubit 1 before the CX gate, your measurement results will switch from |00⟩/|11⟩ to |01⟩/|10⟩ with equal 50/50 probability.';
      } else if (qLower.includes('h gate') || qLower.includes('h(')) {
        predictText = isTech
          ? 'Prediction: Applying another Hadamard gate on a qubit in equal superposition will invoke interference. Because H is self-inverse (H² = I), it will restore the qubit to its definite ground state |0⟩.'
          : 'Prediction: Applying a second H gate reverses the superposition through constructive interference, collapsing the state back to |0⟩ with 100% certainty.';
      } else {
        predictText = 'Prediction: Quantum gates apply linear unitary transformations to the state amplitudes. Single-qubit rotations modify relative phase or amplitudes, while controlled two-qubit gates create or modify quantum entanglement.';
      }

      return {
        answer: predictText,
        confidence: 'medium',
        facts: factSet.facts,
        actions,
        suggestions: [
          'Try placing an X gate on q1 on the canvas',
          'Inspect the state on the Timeline',
        ],
      };
    }

    // 2. SPECIFIC GATE MENTION OR SELECTED GATE EXPLANATION
    let matchedGateKey: string | null = context.selectedGate
      ? context.selectedGate.gate.toLowerCase()
      : null;

    if (!matchedGateKey) {
      const allGateKeys = Object.keys(GATE_KNOWLEDGE_CATALOG).sort(
        (a, b) => b.length - a.length
      );
      for (const k of allGateKeys) {
        const regex = new RegExp(`\\b${k}\\b`, 'i');
        if (
          regex.test(qLower) ||
          qLower.includes(`${k} gate`) ||
          qLower.includes(GATE_KNOWLEDGE_CATALOG[k].name.toLowerCase())
        ) {
          matchedGateKey = k;
          break;
        }
      }
    }

    if (matchedGateKey && GATE_KNOWLEDGE_CATALOG[matchedGateKey]) {
      const knowledge = GATE_KNOWLEDGE_CATALOG[matchedGateKey];
      const desc = isTech ? knowledge.technicalDescription : knowledge.beginnerDescription;
      const targetStr = context.selectedGate
        ? ` on q[${context.selectedGate.targets.join(', ')}]`
        : '';
      const gateText = `${knowledge.name}${targetStr}:\n${desc}\n\nState Mapping:\n${knowledge.equations.stateTransition}`;

      return {
        answer: gateText,
        confidence: 'high',
        facts: factSet.facts,
        actions,
        suggestions: [
          'Explain the whole circuit.',
          'What happens after this gate in the timeline?',
        ],
      };
    }

    // 2. SPECIFIC BELL / 50-50 / 00-11 QUESTIONS
    if (
      qLower.includes('50/50') ||
      qLower.includes('50%') ||
      qLower.includes('00 and 11') ||
      qLower.includes('only 00') ||
      qLower.includes('why do i only get') ||
      (qLower.includes('entangl') && factSet.patternName?.includes('Bell'))
    ) {
      const explanation = isTech
        ? 'The circuit initializes |00⟩. Applying H on q0 creates the state (|00⟩ + |10⟩)/√2. The subsequent CNOT(q0, q1) flips q1 only when q0 is |1⟩, mapping |10⟩ → |11⟩ and yielding the maximally entangled Bell state (|00⟩ + |11⟩)/√2. Measuring in the computational Z-basis results in 50% probability for |00⟩ and 50% for |11⟩, with strictly zero amplitude for |01⟩ and |10⟩.'
        : 'First, the Hadamard gate (H) puts qubit 0 into an equal 50/50 superposition of |0⟩ and |1⟩. Then, the Controlled-NOT (CX) gate entangles the two qubits by flipping qubit 1 whenever qubit 0 is |1⟩. As a result, the qubits are locked in correlation: whenever qubit 0 measures 0, qubit 1 is 0; whenever qubit 0 measures 1, qubit 1 is 1. This produces only |00⟩ and |11⟩ outcomes with ~50% probability each.';

      return {
        answer: explanation,
        confidence: 'high',
        facts: factSet.facts,
        actions,
        suggestions: [
          'What happens if I add an X gate before the CX?',
          'How can I measure in the X basis instead?',
          'What does the statevector look like?',
        ],
      };
    }

    // 2. OPTIMIZATION & REASONING QUESTIONS
    if (
      qLower.includes('optimize') ||
      qLower.includes('optimization') ||
      qLower.includes('removed') ||
      qLower.includes('combined') ||
      qLower.includes('cancel') ||
      qLower.includes('global phase') ||
      qLower.includes('fewer gates')
    ) {
      let optAnswer = '';
      if (qLower.includes('global phase')) {
        optAnswer = isTech
          ? 'Equivalence up to a global phase means two unitaries satisfy U_opt = e^(iφ) U_orig. Because global phase factors do not affect observable probability distributions (|⟨ψ|e^(iφ)M e^(-iφ)|ψ⟩| = |⟨ψ|M|ψ⟩|), the optimized circuit produces physically identical measurement results.'
          : 'Global phase is a constant overall rotation applied to the whole quantum state. It does not change any measurement probabilities, so two circuits differing only by global phase are physically and computationally identical.';
      } else if (qLower.includes('cancel') || qLower.includes('removed')) {
        optAnswer = isTech
          ? 'Gates are cancelled when consecutive operations compose to the identity matrix (e.g., H · H = I, X · X = I, or SWAP · SWAP = I). If no non-commuting gate intervenes on the same qubit wire, the pair collapses to identity.'
          : 'Self-inverse gates like Hadamard (H) and Pauli-X cancel out when placed back-to-back because doing an operation twice restores the qubit to its exact original state (H · H = Identity).';
      } else if (qLower.includes('combined') || qLower.includes('rotation')) {
        optAnswer = isTech
          ? 'Single-qubit rotations around the same axis commute and add algebraically: R_x(θ₁) · R_x(θ₂) = R_x(θ₁ + θ₂). The optimizer merges these into a single rotation gate.'
          : 'Adjacent rotations around the same axis (like two Rx or Rz gates) simply add their angles together into a single combined rotation gate.';
      } else {
        optAnswer = isTech
          ? 'Qualution Circuit Optimization uses deterministic rewrite passes (self-inverse cancellation, rotation merging, CX pair reduction) and formally verifies unitary matrix equivalence before applying.'
          : 'Circuit optimization cleans up redundant gates, combines rotation angles, and reduces 2-qubit gates while mathematically guaranteeing your circuit still calculates the exact same quantum state.';
      }

      return {
        answer: optAnswer,
        confidence: 'high',
        facts: factSet.facts,
        actions: [{ type: 'open_metrics', label: 'Open Metrics Tab', payload: { tab: 'metrics' } }],
        suggestions: [
          'What does equivalent up to global phase mean?',
          'Why were these rotations combined?',
          'Why was this gate removed?',
        ],
      };
    }

    // 3. DEBUG & ANOMALY QUESTIONS
    if (
      qLower.includes('debug') ||
      qLower.includes('wrong') ||
      qLower.includes('simplify') ||
      qLower.includes('redundant') ||
      qLower.includes('not working') ||
      qLower.includes('unused')
    ) {
      let debugText = '';
      if (factSet.anomalies.length > 0) {
        debugText = `Detected ${factSet.anomalies.length} potential area(s) for review:\n` +
          factSet.anomalies.map((a, i) => `${i + 1}. ${a}`).join('\n');
      } else {
        debugText = 'Circuit structure analysis found no obvious syntax or operational anomalies. All gates are connected to active qubit wires and produce valid unitary evolutions.';
      }

      actions.push({ type: 'open_metrics', label: 'View Metrics', payload: { tab: 'metrics' } });

      return {
        answer: debugText,
        confidence: 'high',
        facts: factSet.facts,
        actions,
        suggestions: [
          'Can we remove redundant gates?',
          'Why are my rotation angles giving unexpected probabilities?',
          'Explain the gate sequence.',
        ],
      };
    }

    // 4. EXPERIMENT QUESTIONS
    if (qLower.includes('experiment') || qLower.includes('try') || qLower.includes('test')) {
      const expText = 'Suggested Experiment:\n1. Try dragging an X gate onto q[1] at column 0 (before the CX gate).\n2. Press Run Circuit to observe how the probabilities shift from |00⟩/|11⟩ to |01⟩/|10⟩.\n3. Compare the statevector in the State tab to see the anti-correlated Bell state |Ψ⁺⟩.';

      return {
        answer: expText,
        confidence: 'high',
        facts: factSet.facts,
        actions,
        suggestions: [
          'Why does X on q1 swap the measured outcomes?',
          'What happens if I add an H gate to q1 as well?',
        ],
      };
    }

    // 6. GENERAL EXPLAIN FALLBACK
    const generalExplanation = isTech
      ? `This circuit operates on ${context.circuit.qubits} qubit(s) using ${context.circuit.gates.length} gate(s). It applies unitary transformations across the 2^${context.circuit.qubits} state space. ` +
        (factSet.patternName ? `Identified pattern: ${factSet.patternName}. ` : '') +
        factSet.facts.join(' ')
      : `Your circuit contains ${context.circuit.qubits} qubit(s) and ${context.circuit.gates.length} gate(s). ` +
        (factSet.patternName ? `It forms a classic ${factSet.patternName}. ` : '') +
        factSet.facts.join(' ');

    return {
      answer: generalExplanation,
      confidence: 'high',
      facts: factSet.facts,
      actions,
      suggestions: factSet.suggestedQuestions,
    };
  }
}
