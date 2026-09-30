import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Grover Lesson 41-second Bug Fix', () => {
  it('should have the scene.checkpointShown flag to prevent repeated checkpoints', () => {
    const htmlPath = path.resolve(__dirname, '../../public/player-grover.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Verify the bug fix is implemented
    expect(htmlContent).toContain('!scene.checkpointShown');
    expect(htmlContent).toContain('scene.checkpointShown = true;');
  });
});
