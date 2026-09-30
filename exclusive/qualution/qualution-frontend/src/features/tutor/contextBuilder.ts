import type {
  CircuitRequest,
  CircuitRunResponse,
  Gate,
} from '../circuit/types';
import type { TutorContext, CompactStatevectorSummary, LearningLevel } from './tutorTypes';
import { progressService } from '../progress/progressService';
import { resolveCircuitRouting, routeCircuit } from '../circuit/executionRouter';

const MAX_AMPLITUDES_IN_CONTEXT = 16;

/**
 * Builds a compact, deterministic, and bounded TutorContext from active frontend state
 */
export function buildTutorContext(
  circuit: CircuitRequest,
  simulationResult: CircuitRunResponse | null,
  selectedGate: Gate | null,
  learningLevel: LearningLevel = 'beginner',
  error?: string | null,
  activeLessonId?: string
): TutorContext {
  // Compact statevector extraction with truncation to avoid bloated payloads
  let statevectorSummary: CompactStatevectorSummary | null = null;
  if (simulationResult?.simulation?.statevector) {
    const rawAmplitudes = simulationResult.simulation.statevector;
    const nQubits = circuit.qubits;
    const limit = Math.min(rawAmplitudes.length, MAX_AMPLITUDES_IN_CONTEXT);
    const amplitudes = [];

    for (let i = 0; i < limit; i++) {
      const comp = rawAmplitudes[i];
      const binary = i.toString(2).padStart(nQubits, '0');
      const magnitude = Math.sqrt(comp.real * comp.real + comp.imag * comp.imag);
      amplitudes.push({
        binary,
        magnitude,
        real: comp.real,
        imag: comp.imag,
      });
    }

    statevectorSummary = {
      amplitudes,
      isTruncated: rawAmplitudes.length > MAX_AMPLITUDES_IN_CONTEXT,
    };
  }

  // Compact timeline extraction
  let timelineSummary: TutorContext['timeline'] = null;
  if (simulationResult?.visualization?.timeline) {
    const tl = simulationResult.visualization.timeline;
    timelineSummary = {
      totalSteps: tl.total_steps,
      qubits: tl.qubits,
      steps: tl.steps.map((s) => ({
        step: s.step,
        operation: s.operation,
        qubits: s.qubits,
        probabilities: s.probabilities,
      })),
    };
  }

  // Extract student profile & progress
  let userSummary: TutorContext['user'] = undefined;
  try {
    const profile = progressService.getLearnerProfile();
    userSummary = {
      currentLevel: profile.currentLevel,
      overallProgress: profile.overallProgress,
      currentStreak: profile.currentStreak,
      activeLesson: activeLessonId,
    };
  } catch {
    userSummary = {
      currentLevel: learningLevel,
      activeLesson: activeLessonId,
    };
  }

  const routingSummary =
    simulationResult?.routing ||
    (circuit ? resolveCircuitRouting(circuit, simulationResult?.execution_time_ms || 1.0) : null);
  const routeDecision = circuit ? routeCircuit(circuit) : null;

  const simResAny = simulationResult as any;
  const fidelity = simResAny?.fidelity ?? simResAny?.simulation?.fidelity;
  const truncationError = simResAny?.truncation_error ?? simResAny?.simulation?.truncation_error;
  const approximation = simResAny?.approximation ?? simResAny?.simulation?.approximation;
  const routingReason =
    simResAny?.routing_reason ??
    simulationResult?.routing?.reason ??
    routeDecision?.routing_reason ??
    routingSummary?.reason;

  return {
    circuit: {
      qubits: circuit.qubits,
      classicalBits: circuit.classical_bits,
      gates: circuit.gates,
      measure: circuit.measure,
      shots: circuit.shots,
    },
    selectedGate,
    metrics: simulationResult?.metrics || null,
    simulation: simulationResult
      ? {
          backend: simulationResult.simulation.backend,
          mode: simulationResult.simulation.mode,
          shots: simulationResult.simulation.shots,
          executionTimeMs: simulationResult.simulation.execution_time_ms,
          probabilities: simulationResult.simulation.probabilities,
          counts: simulationResult.simulation.counts,
          fidelity,
          truncation_error: truncationError,
          approximation,
          routing_reason: routingReason,
        }
      : null,
    routing: routingSummary
      ? {
          ...routingSummary,
          reason: routingReason || routingSummary.reason,
          method: routeDecision?.method,
          fidelity,
          truncation_error: truncationError,
          approximation,
        }
      : null,
    statevector: statevectorSummary,
    bloch: simulationResult?.visualization?.bloch || null,
    timeline: timelineSummary,
    learningLevel,
    error: error ?? null,
    user: userSummary,
    code: {
      framework: simulationResult?.routing?.framework || 'qiskit',
      hasErrors: Boolean(error),
    },
  };
}
