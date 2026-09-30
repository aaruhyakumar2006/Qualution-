import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CURRICULUM_TRACKS } from '../learning/curriculumData';

describe('Phase 5 — Unify Grover Theory and Practical Experience', () => {
  const htmlPath = path.resolve(__dirname, '../../../public/player-grover.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  describe('1. Theory Completion Screen (player-grover.html)', () => {
    it('contains the mandatory completion message: "YOU UNDERSTAND THE SEARCH." and "NOW BUILD IT."', () => {
      expect(htmlContent).toContain('YOU UNDERSTAND THE SEARCH.');
      expect(htmlContent).toContain('NOW BUILD IT.');
    });

    it('contains the four learned concept pills with proper taxonomy and icons', () => {
      expect(htmlContent).toContain('Superposition');
      expect(htmlContent).toContain('Oracle');
      expect(htmlContent).toContain('Amplitude Amplification');
      expect(htmlContent).toContain('Measurement');
      // Concept pill classes
      expect(htmlContent).toContain('concept-pill superposition');
      expect(htmlContent).toContain('concept-pill oracle');
      expect(htmlContent).toContain('concept-pill amplification');
      expect(htmlContent).toContain('concept-pill measurement');
    });

    it('contains the progress row indicating Theory Complete and Next: Practical Lab', () => {
      expect(htmlContent).toContain('Theory Complete');
      expect(htmlContent).toContain('Next: Practical Lab');
    });

    it('contains the primary CTA "ENTER QUANTUM LAB" with data-testid="handoff-enter-lab-btn"', () => {
      expect(htmlContent).toContain('data-testid="handoff-enter-lab-btn"');
      expect(htmlContent).toContain('ENTER QUANTUM LAB');
    });

    it('contains the secondary link "Return to Academy" with data-testid="handoff-academy-btn"', () => {
      expect(htmlContent).toContain('data-testid="handoff-academy-btn"');
      expect(htmlContent).toContain('Return to Academy without entering Lab');
    });

    it('wires the primary CTA to launch Workbench with ?assessment=lesson-8-grovers-search', () => {
      expect(htmlContent).toContain("type: 'LAUNCH_PRACTICAL_LAB', lessonId: 'lesson-8-grovers-search'");
      expect(htmlContent).toContain("window.location.href = '/?assessment=lesson-8-grovers-search'");
    });

    it('wires the return link to post EXIT_LESSON and navigate to /?view=learn', () => {
      expect(htmlContent).toContain("type: 'EXIT_LESSON'");
      expect(htmlContent).toContain("window.location.href = '/?view=learn'");
    });

    it('activates the handoff card on final Scene 15 completion', () => {
      expect(htmlContent).toContain("sceneIndex === 15");
      expect(htmlContent).toContain("handoffCard.classList.add('active')");
    });

    it('includes CSS animations and styling tokens for the completion screen', () => {
      expect(htmlContent).toContain('fadeInHandoff');
      expect(htmlContent).toContain('.handoff-card');
      expect(htmlContent).toContain('.handoff-box');
      expect(htmlContent).toContain('.concept-pill');
      expect(htmlContent).toContain('.handoff-cta-btn');
    });
  });

  describe('2. Grover Lab Curriculum & Handoff Integrity', () => {
    it('verifies lesson-8-grovers-search exists in curriculum with target state |11⟩', () => {
      const allModules = CURRICULUM_TRACKS.flatMap((t) => t.modules);
      const groverModule = allModules.find((m) => m.id === 'lesson-8-grovers-search');

      expect(groverModule).toBeDefined();
      expect(groverModule?.title).toContain("Grover's Search Algorithm");
      expect(groverModule?.assessment.criteria.targetStateDescription).toContain('|11⟩');
      expect(groverModule?.assessment.criteria.minQubits).toBe(2);
      expect(groverModule?.assessment.criteria.targetProbabilities).toHaveProperty('11');
    });
  });

  describe('3. Workbench Restrained Context Label & Celebration Path', () => {
    const idePagePath = path.resolve(__dirname, '../../pages/IDEPage.tsx');
    const idePageContent = fs.readFileSync(idePagePath, 'utf-8');

    it('contains the restrained context label with data-testid="grover-practical-lab-label"', () => {
      expect(idePageContent).toContain('data-testid="grover-practical-lab-label"');
      expect(idePageContent).toContain("GROVER&apos;S SEARCH");
      expect(idePageContent).toContain('PRACTICAL LAB');
      expect(idePageContent).toContain('LESSON 08');
      expect(idePageContent).toContain('Target: |11⟩');
    });

    it('only renders the restrained context label when assessment is lesson-8-grovers-search', () => {
      expect(idePageContent).toContain("currentAssessment.id === 'lesson-8-grovers-search'");
    });

    it('celebration modal shows customized Grover success title, target verification and badge', () => {
      expect(idePageContent).toContain("GROVER SEARCH MASTERED 🎉");
      expect(idePageContent).toContain("Quantum Searcher");
      expect(idePageContent).toContain("Quantum Fourier Transform");
    });

    it('provides Return to Academy action on celebration modal with data-testid="success-back-academy-btn"', () => {
      expect(idePageContent).toContain('data-testid="success-back-academy-btn"');
      expect(idePageContent).toContain('Return to Academy');
    });

    it('provides Keep Experimenting action on celebration modal with data-testid="success-continue-btn"', () => {
      expect(idePageContent).toContain('data-testid="success-continue-btn"');
      expect(idePageContent).toContain('Keep Experimenting');
    });
  });

  describe('4. Routing Continuity and Deep-linking', () => {
    const appPath = path.resolve(__dirname, '../../App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    it('routes ?assessment= query parameter to the IDE view', () => {
      expect(appContent).toContain("search.includes('assessment=')");
      expect(appContent).toContain("routeStr.includes('assessment=')");
    });

    it('parses assessment parameter to resolve active assessment module', () => {
      expect(appContent).toContain("searchParams.get('assessment')");
      expect(appContent).toContain("resolveAssessment(lId)");
    });

    it('routes ?view=learn / academy route correctly to the Academy view', () => {
      expect(appContent).toContain("routeStr.includes('learn')");
      expect(appContent).toContain("routeStr.includes('academy')");
    });
  });
});

