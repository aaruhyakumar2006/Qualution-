# Frontend Evidence Collection Guide

## Overview

Phase M7 instruments all learning interactions to automatically collect evidence for misconception detection.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  React Components                            │
│              (Quiz, Circuit, Lesson, etc.)                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ useEvidence Hooks
                 ▼
┌─────────────────────────────────────────────────────────────┐
│            Evidence Collector Service                        │
│  • Queue management                                          │
│  • Batching & debouncing                                     │
│  • Automatic submission                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                Evidence API Client                           │
│  • submitEvidence()                                          │
│  • processLessonEvent()                                      │
│  • getMisconceptionProfile()                                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP POST
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Misconception Engine                    │
│  • Detection                                                 │
│  • Confidence scoring                                        │
│  • Intervention recommendations                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. **Evidence API Client** (`evidenceApi.ts`)

TypeScript client for all misconception engine endpoints.

**Key Functions:**
```typescript
// Submit evidence with detection
submitEvidence(request: EvidenceSubmissionRequest): Promise<EvidenceSubmissionResponse>

// Submit event during lesson
processLessonEvent(request: LessonEventRequest): Promise<LessonEventResponse>

// Get learner profile
getLearnerProfile(): Promise<LearnerMisconceptionProfile>

// Get active misconceptions
getActiveMisconceptions(params): Promise<LearnerMisconceptionSummary[]>

// Check if intervention needed
checkIntervention(request): Promise<InterventionCheckResponse>

// Get intervention lesson
getInterventionLesson(misconceptionId): Promise<InterventionLessonResponse>
```

### 2. **Evidence Collector Service** (`evidenceCollector.ts`)

Centralized service for collecting and submitting evidence.

**Features:**
- ✅ Automatic submission
- ✅ Event queuing
- ✅ Batching support
- ✅ Error recovery
- ✅ Lesson context tracking
- ✅ Event listeners

**Usage:**
```typescript
import { evidenceCollector } from './evidenceCollector';

// Configure
evidenceCollector.configure({
  autoSubmit: true,
  enableBatching: false,
  debug: true
});

// Set lesson context
evidenceCollector.setLessonContext(lessonId, stepId, stepNumber);

// Collect events
await evidenceCollector.collectQuizAnswer({
  conceptId: 'superposition',
  questionId: 'q1',
  correct: false,
  expected: { answer: 'A' },
  actual: { answer: 'B' }
});

// Listen for responses
evidenceCollector.addListener((response) => {
  if (response.detection_result.interventions.length > 0) {
    console.log('Intervention needed!');
  }
});
```

### 3. **Evidence Hooks** (`useEvidence.ts`)

React hooks for easy component integration.

#### **useEvidenceCollection()**
Main hook for collecting evidence.

```typescript
function QuizQuestion() {
  const { collectQuizAnswer, pendingIntervention } = useEvidenceCollection();

  const handleSubmit = async (answer: string) => {
    await collectQuizAnswer({
      conceptId: 'superposition',
      questionId: question.id,
      correct: answer === correctAnswer,
      expected: { answer: correctAnswer },
      actual: { answer }
    });
  };

  // Show intervention if pending
  if (pendingIntervention) {
    return <InterventionModal intervention={pendingIntervention} />;
  }

  return <QuizForm onSubmit={handleSubmit} />;
}
```

#### **useMisconceptionProfile()**
Access learner's misconception profile.

```typescript
function MisconceptionDashboard() {
  const { profile, loading, refresh } = useMisconceptionProfile();

  if (loading) return <Spinner />;

  return (
    <div>
      <h2>Active: {profile.active_misconceptions.length}</h2>
      <h2>Resolved: {profile.resolved_misconceptions.length}</h2>
      
      {profile.active_misconceptions.map(m => (
        <MisconceptionCard key={m.misconception_id} misconception={m} />
      ))}
      
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

#### **useActiveMisconceptions()**
Monitor active misconceptions for a concept.

```typescript
function ConceptProgress({ conceptId }: { conceptId: string }) {
  const { misconceptions, loading } = useActiveMisconceptions(conceptId, 0.3);

  if (misconceptions.length > 0) {
    return (
      <Alert severity="warning">
        You have {misconceptions.length} misconceptions to address
      </Alert>
    );
  }

  return <Progress value={100} label="Mastered!" />;
}
```

#### **useLessonContext()**
Set lesson context for evidence collection.

```typescript
function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // All evidence in this component will be associated with this lesson
  useLessonContext(lesson.id, lesson.steps[currentStep].id, currentStep);

  return <LessonContent />;
}
```

### 4. **Teaching Integration** (`teachingEvidenceIntegration.ts`)

Integrates misconception detection with the teaching controller.

**Features:**
- ✅ Automatic evidence collection during lessons
- ✅ Intervention injection
- ✅ Intervention type filtering (MICRO/MINI/FULL)
- ✅ Lesson state preservation
- ✅ Auto-resume after intervention

**Usage:**
```typescript
import { TeachingController } from './teachingController';
import { enableEvidenceCollection } from './teachingEvidenceIntegration';

// Create controller
const controller = new TeachingController(hooks);

// Enable evidence collection
const integrator = enableEvidenceCollection(controller, {
  autoInject: true,
  injectMicro: true,
  injectMini: true,
  injectFull: true,
  showNotifications: true
});

// Now the controller automatically:
// - Collects evidence from all interactions
// - Checks for interventions at break points
// - Injects intervention lessons when needed
// - Resumes original lesson after intervention
```

## Event Types

### Quiz Answer
```typescript
await collectQuizAnswer({
  conceptId: 'superposition',
  questionId: 'q1',
  correct: false,
  expected: { answer: 'A', explanation: '...' },
  actual: { answer: 'B' },
  context: { attempt: 1, timeSpent: 45 }
});
```

### Prediction Answer
```typescript
await collectPredictionAnswer({
  conceptId: 'measurement',
  lessonId: 'lesson_measurement_intro',
  checkpointId: 'cp_1',
  correct: false,
  expectedOption: 0,
  actualOption: 2,
  context: { checkpoint_question: '...' }
});
```

### Circuit Construction
```typescript
await collectCircuitConstruction({
  conceptId: 'entanglement',
  circuitId: 'circuit_123',
  gates: [
    { gate: 'H', targets: [0], column: 0 },
    { gate: 'CNOT', targets: [0, 1], column: 1 }
  ],
  qubits: 2,
  context: { task: 'Create entangled pair' }
});
```

### Gate Placement
```typescript
await collectGatePlacement({
  conceptId: 'superposition',
  circuitId: 'circuit_123',
  gate: 'H',
  qubit: 0,
  column: 0,
  context: { expected_gate: 'X', mistake_type: 'wrong_gate' }
});
```

### Simulation Interpretation
```typescript
await collectSimulationInterpretation({
  conceptId: 'measurement',
  circuitId: 'circuit_123',
  simulationResults: {
    counts: { '00': 512, '11': 512 },
    shots: 1024
  },
  userInterpretation: 'The results are random',
  correct: false,
  context: { expected: 'Entangled Bell state' }
});
```

## Instrumentation Checklist

### ✅ Quiz Components
- [ ] Multiple choice questions
- [ ] True/False questions
- [ ] Fill-in-the-blank
- [ ] Code completion

### ✅ Teaching Controller
- [ ] Prediction submissions
- [ ] Checkpoint answers
- [ ] Step completion

### ✅ Circuit Editor
- [ ] Gate placement
- [ ] Gate removal
- [ ] Circuit reset
- [ ] Circuit submission

### ✅ Simulation Runner
- [ ] Simulation execution
- [ ] Result interpretation
- [ ] Visualization interaction

### ✅ Learning Activities
- [ ] Concept explanations viewed
- [ ] Video completions
- [ ] Interactive demos

## Integration Examples

### Example 1: Quiz Component

```typescript
import { useEvidenceCollection } from '../evidence/useEvidence';

function MultipleChoiceQuestion({ question, conceptId }) {
  const { collectQuizAnswer, pendingIntervention } = useEvidenceCollection();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const correct = selectedAnswer === question.correctAnswer;
    
    await collectQuizAnswer({
      conceptId,
      questionId: question.id,
      correct,
      expected: { answer: question.correctAnswer },
      actual: { answer: selectedAnswer },
      context: {
        question_text: question.text,
        options: question.options
      }
    });

    setSubmitted(true);
  };

  // Show intervention if detected
  if (pendingIntervention) {
    return <InterventionDialog intervention={pendingIntervention} />;
  }

  return (
    <div>
      <h3>{question.text}</h3>
      {question.options.map((option, index) => (
        <button
          key={index}
          onClick={() => setSelectedAnswer(index)}
          disabled={submitted}
        >
          {option}
        </button>
      ))}
      <button onClick={handleSubmit} disabled={!selectedAnswer || submitted}>
        Submit
      </button>
    </div>
  );
}
```

### Example 2: Circuit Editor Integration

```typescript
import { evidenceCollector } from '../evidence/evidenceCollector';

function CircuitEditor({ conceptId }) {
  const [circuit, setCircuit] = useState({ gates: [], qubits: 1 });

  const handleGatePlace = async (gate: string, qubit: number, column: number) => {
    // Update circuit
    const newCircuit = {
      ...circuit,
      gates: [...circuit.gates, { gate, targets: [qubit], column }]
    };
    setCircuit(newCircuit);

    // Collect evidence
    await evidenceCollector.collectGatePlacement({
      conceptId,
      circuitId: 'circuit_' + Date.now(),
      gate,
      qubit,
      column,
      context: {
        total_gates: newCircuit.gates.length,
        circuit_qubits: newCircuit.qubits
      }
    });
  };

  const handleSubmitCircuit = async () => {
    await evidenceCollector.collectCircuitConstruction({
      conceptId,
      circuitId: 'circuit_' + Date.now(),
      gates: circuit.gates,
      qubits: circuit.qubits,
      context: {
        task: 'Build Bell state circuit'
      }
    });
  };

  return (
    <div>
      <GatePalette onSelect={(gate) => handleGatePlace(gate, 0, circuit.gates.length)} />
      <CircuitDisplay circuit={circuit} />
      <button onClick={handleSubmitCircuit}>Submit</button>
    </div>
  );
}
```

### Example 3: Teaching Controller Integration

```typescript
import { TeachingController } from './teachingController';
import { enableEvidenceCollection } from './teachingEvidenceIntegration';

function LessonPlayer() {
  const [controller] = useState(() => {
    const ctrl = new TeachingController(hooks);
    
    // Enable automatic evidence collection
    enableEvidenceCollection(ctrl, {
      autoInject: true,
      injectMicro: true,    // Auto-inject quick hints
      injectMini: true,     // Auto-inject brief explanations
      injectFull: false,    // Require explicit confirmation for full remediation
      showNotifications: true
    });
    
    return ctrl;
  });

  // Controller now automatically:
  // - Collects evidence from predictions
  // - Checks for interventions between steps
  // - Injects intervention lessons
  // - Tracks intervention effectiveness

  return <TeachingView controller={controller} />;
}
```

## Best Practices

### 1. **Always Include Context**
```typescript
// ❌ Bad - minimal context
await collectQuizAnswer({
  conceptId: 'superposition',
  questionId: 'q1',
  correct: false,
  expected: 'A',
  actual: 'B'
});

// ✅ Good - rich context
await collectQuizAnswer({
  conceptId: 'superposition',
  questionId: 'q1',
  correct: false,
  expected: { 
    answer: 'A',
    explanation: 'Superposition is a definite quantum state'
  },
  actual: { 
    answer: 'B',
    reasoning: 'User thought superposition was randomness'
  },
  context: {
    attempt: 1,
    timeSpent: 45,
    previous_answer: 'C',
    lesson_progress: 0.6
  }
});
```

### 2. **Use Lesson Context**
```typescript
// ✅ Always set lesson context for lesson-based interactions
function Lesson({ lesson }) {
  useLessonContext(lesson.id, currentStep.id, currentStepNumber);
  // All evidence now includes lesson context
  return <LessonContent />;
}
```

### 3. **Handle Interventions Gracefully**
```typescript
function Component() {
  const { pendingIntervention, clearPendingIntervention } = useEvidenceCollection();

  if (pendingIntervention) {
    return (
      <InterventionModal
        intervention={pendingIntervention}
        onComplete={() => {
          clearPendingIntervention();
          // Resume normal flow
        }}
      />
    );
  }

  return <NormalContent />;
}
```

### 4. **Batch When Appropriate**
```typescript
// For rapid interactions (e.g., gate dragging), enable batching
evidenceCollector.configure({
  enableBatching: true,
  batchSize: 5,
  batchTimeout: 2000
});
```

### 5. **Debug During Development**
```typescript
if (import.meta.env.DEV) {
  evidenceCollector.configure({ debug: true });
}
```

## Testing

### Unit Tests
```typescript
describe('Evidence Collection', () => {
  it('should collect quiz answer', async () => {
    const mockApi = jest.spyOn(evidenceApi, 'submitEvidence');
    
    await evidenceCollector.collectQuizAnswer({
      conceptId: 'test',
      questionId: 'q1',
      correct: false,
      expected: 'A',
      actual: 'B'
    });

    expect(mockApi).toHaveBeenCalledWith({
      event: expect.objectContaining({
        event_type: 'QUIZ_ANSWER',
        concept_id: 'test'
      }),
      run_detection: true
    });
  });
});
```

### Integration Tests
```typescript
describe('Teaching Integration', () => {
  it('should inject intervention after failed prediction', async () => {
    const controller = new TeachingController(hooks);
    const integrator = enableEvidenceCollection(controller);

    // Submit wrong prediction
    await controller.submitPrediction(2); // Wrong answer

    // Wait for detection
    await waitFor(() => {
      const status = integrator.getStatus();
      expect(status.interventionActive).toBe(true);
    });
  });
});
```

## Configuration

### Evidence Collector
```typescript
evidenceCollector.configure({
  autoSubmit: true,         // Auto-submit events
  enableBatching: false,    // Batch multiple events
  batchSize: 5,            // Events per batch
  batchTimeout: 2000,      // Max wait time (ms)
  debug: false             // Debug logging
});
```

### Teaching Integrator
```typescript
const integrator = enableEvidenceCollection(controller, {
  autoInject: true,        // Auto-inject interventions
  injectMicro: true,       // MICRO_CORRECTION interventions
  injectMini: true,        // MINI_REMEDIATION interventions
  injectFull: true,        // FULL_REMEDIATION interventions
  showNotifications: true, // Show intervention alerts
  debug: false             // Debug logging
});
```

## Monitoring

### View Collection History
```typescript
const history = evidenceCollector.getHistory();
console.log('Collected events:', history.length);
console.log('Submitted:', history.filter(e => e.submitted).length);
console.log('Failed:', history.filter(e => e.error).length);
```

### Listen for Detections
```typescript
evidenceCollector.addListener((response) => {
  console.log('Detection result:', response.detection_result);
  
  if (response.detection_result.new_detections.length > 0) {
    console.log('New misconceptions detected!');
  }
  
  if (response.detection_result.requires_immediate_intervention) {
    console.log('Immediate intervention required!');
  }
});
```

## Next Steps

### Phase M8: Remediation Strategy Executor
- Build structured remediation sequences
- Implement COMPARE, DEMONSTRATE, VISUALIZE strategies
- Create intervention lesson templates

### Phase M9: Testing Suite
- Detection accuracy tests
- False positive prevention
- Integration test coverage

### Phase M10: Teacher Analytics Dashboard
- Class-level misconception insights
- Intervention effectiveness reports
- Student progress tracking
