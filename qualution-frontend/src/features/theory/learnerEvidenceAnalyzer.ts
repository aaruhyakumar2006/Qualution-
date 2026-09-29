/**
 * learnerEvidenceAnalyzer.ts
 *
 * PHASE 16: Deterministic Learner Evidence Analyzer.
 *
 * Evaluates multi-source educational evidence across the pedagogical loop:
 * TEACH → PREDICT → BUILD → RUN → OBSERVE → EXPLAIN → ASSESS → ANALYZE
 *
 * Key guarantees:
 * - Deterministic & explainable (no LLM, no hallucinated diagnostics).
 * - Avoids over-diagnosis: single errors do not trigger NEEDS_REINFORCEMENT.
 * - Slices confidence into explainable categories: NOT_SUPPORTED, POSSIBLE, SUPPORTED.
 * - Extracts learner-facing remediation guidance from the misconception catalog.
 */

import type {
  LessonEvidence,
  MisconceptionAnalysis,
  ConceptMasteryStatus,
} from './learningEvidence';
import { MISCONCEPTION_CATALOG } from './misconceptionCatalog';

export interface EvidenceSummary {
  predictionCompleted: boolean;
  predictionCorrect: boolean;
  experimentCompleted: boolean;
  assessmentCompleted: boolean;
  assessmentCorrect: boolean;
}

export interface LearnerAnalysisResult {
  conceptStatus: ConceptMasteryStatus;
  detectedMisconceptions: MisconceptionAnalysis[];
  evidenceSummary: EvidenceSummary;
  remediationFeedback?: string;
  auditReason: string;
}

/**
 * Deterministically analyzes lesson evidence to classify concept mastery and identify
 * possible misconceptions without speculative psychological inferences.
 */
export function analyzeLessonEvidence(evidence: LessonEvidence): LearnerAnalysisResult {
  const { prediction, experiment, assessment } = evidence.evidence;

  const summary: EvidenceSummary = {
    predictionCompleted: Boolean(prediction),
    predictionCorrect: Boolean(prediction?.correct),
    experimentCompleted: Boolean(experiment?.completed),
    assessmentCompleted: Boolean(assessment),
    assessmentCorrect: Boolean(assessment?.correct),
  };

  // Case 1: No evidence submitted
  if (!summary.predictionCompleted && !summary.assessmentCompleted && !summary.experimentCompleted) {
    return {
      conceptStatus: 'NOT_ATTEMPTED',
      detectedMisconceptions: [],
      evidenceSummary: summary,
      auditReason: 'No learner interaction evidence recorded for this lesson.',
    };
  }

  const detectedMisconceptions: MisconceptionAnalysis[] = [];

  // Evaluate responses against misconception catalog
  for (const rule of Object.values(MISCONCEPTION_CATALOG)) {
    const evidenceItems: MisconceptionAnalysis['evidence'] = [];

    // Check prediction answer
    if (prediction && !prediction.correct) {
      const predAns = prediction.selectedAnswer.toLowerCase();
      const predMatch =
        rule.matchingAnswers.checkpointOptionIds?.includes(predAns) ||
        rule.matchingAnswers.checkpointTexts?.some((txt) =>
          (prediction.explanation || '').toLowerCase().includes(txt)
        );

      if (predMatch) {
        evidenceItems.push({
          source: 'checkpoint',
          id: prediction.checkpointId,
          selectedAnswer: prediction.selectedAnswer,
        });
      }
    }

    // Check assessment answer
    if (assessment && !assessment.correct) {
      const assessAns = assessment.selectedAnswer.toLowerCase();
      const assessMatch =
        rule.matchingAnswers.assessmentOptionIds?.includes(assessAns) ||
        rule.matchingAnswers.assessmentTexts?.some((txt) =>
          (assessment.explanation || '').toLowerCase().includes(txt)
        );

      if (assessMatch) {
        evidenceItems.push({
          source: 'assessment',
          id: assessment.assessmentId,
          selectedAnswer: assessment.selectedAnswer,
        });
      }
    }

    // Determine confidence based on cross-source evidence
    if (evidenceItems.length >= 2) {
      // Repeated evidence across prediction checkpoint and final assessment
      detectedMisconceptions.push({
        misconceptionId: rule.id,
        concept: rule.concept,
        confidence: 'SUPPORTED',
        evidence: evidenceItems,
        reason: `The learner repeatedly selected responses consistent with ${rule.name} across multiple lesson touchpoints.`,
        learnerFeedback: rule.learnerFeedback,
      });
    } else if (evidenceItems.length === 1 && !summary.assessmentCorrect) {
      // Single error in assessment matching a documented misconception
      detectedMisconceptions.push({
        misconceptionId: rule.id,
        concept: rule.concept,
        confidence: 'POSSIBLE',
        evidence: evidenceItems,
        reason: `The learner selected an answer in the assessment consistent with ${rule.name}.`,
        learnerFeedback: rule.learnerFeedback,
      });
    }
  }

  // Determine Concept Status
  let conceptStatus: ConceptMasteryStatus;
  let auditReason = '';
  let remediationFeedback: string | undefined;

  const supportedMisconception = detectedMisconceptions.find((m) => m.confidence === 'SUPPORTED');

  if (supportedMisconception) {
    // Repeated misconception pattern -> NEEDS_REINFORCEMENT
    conceptStatus = 'NEEDS_REINFORCEMENT';
    auditReason = supportedMisconception.reason;
    remediationFeedback = supportedMisconception.learnerFeedback;
  } else if (summary.assessmentCorrect) {
    // Final assessment is correct -> UNDERSTOOD (single prediction mistakes do NOT over-diagnose)
    conceptStatus = 'UNDERSTOOD';
    auditReason = 'Available evidence consistently demonstrates correct conceptual understanding.';
  } else if (summary.assessmentCompleted && !summary.assessmentCorrect) {
    // Final assessment is incorrect but no multi-source repeated pattern -> ATTEMPTED
    conceptStatus = 'ATTEMPTED';
    auditReason = 'Learner completed the assessment but did not establish full conceptual understanding.';
    if (detectedMisconceptions.length > 0) {
      remediationFeedback = detectedMisconceptions[0].learnerFeedback;
    }
  } else {
    conceptStatus = 'ATTEMPTED';
    auditReason = 'Partial interaction recorded without final assessment completion.';
  }

  return {
    conceptStatus,
    detectedMisconceptions,
    evidenceSummary: summary,
    remediationFeedback,
    auditReason,
  };
}
