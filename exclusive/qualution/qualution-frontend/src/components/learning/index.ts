/**
 * 3D Game-Based Learning Map Components
 * Export all components for easy integration
 */

export { GameMapLearningPath } from './GameMapLearningPath';
export type { LessonNode } from './GameMapLearningPath';

export {
  convertLessonsToNodes,
  calculateTotalXP,
  calculateCurrentXP,
  generateLessonPositions,
  generatePathLayout,
} from './GameMapIntegration';
