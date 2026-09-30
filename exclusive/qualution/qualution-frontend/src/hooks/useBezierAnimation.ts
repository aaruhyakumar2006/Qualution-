import { useState, useEffect, useRef } from 'react';

/**
 * Calculates a point on a quadratic bezier curve.
 * @param t Progress from 0 to 1
 * @param p0 Start point {x, y}
 * @param p1 Control point {x, y}
 * @param p2 End point {x, y}
 */
const getQuadraticBezierPoint = (
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) => {
  const invT = 1 - t;
  const x = invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x;
  const y = invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y;
  return { x, y };
};

/**
 * Animates a point from its current position to the target (x, y) along a curved path.
 */
export const useBezierAnimation = (
  targetX: number,
  targetY: number,
  durationMs: number = 800
) => {
  const [currentPos, setCurrentPos] = useState({ x: targetX, y: targetY });
  const startPosRef = useRef({ x: targetX, y: targetY });
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // If the target hasn't changed significantly, do nothing
    if (Math.abs(targetX - currentPos.x) < 1 && Math.abs(targetY - currentPos.y) < 1) {
      return;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const startX = currentPos.x;
    const startY = currentPos.y;
    startPosRef.current = { x: startX, y: startY };

    // Calculate a control point to create an arc.
    // We take the midpoint and offset it perpendicularly by a fraction of the distance.
    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2;
    const dx = targetX - startX;
    const dy = targetY - startY;
    
    // Perpendicular vector (-dy, dx) normalized or scaled
    // We want the arc to bow outwards depending on the direction.
    // Randomize the bow direction slightly for natural human feel, or keep it consistent.
    const bowFactor = 0.25; // 25% of the distance
    
    // Choose which way to bow. E.g., always bow "up/left" relative to the movement vector.
    const controlX = midX - dy * bowFactor;
    const controlY = midY + dx * bowFactor;

    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      let progress = Math.min(elapsed / durationMs, 1);

      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const nextPos = getQuadraticBezierPoint(
        easedProgress,
        { x: startX, y: startY },
        { x: controlX, y: controlY },
        { x: targetX, y: targetY }
      );

      setCurrentPos(nextPos);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetX, targetY, durationMs]);

  // Disable standard CSS transition since we are doing 60fps JS animation
  return {
    x: currentPos.x,
    y: currentPos.y,
  };
};
