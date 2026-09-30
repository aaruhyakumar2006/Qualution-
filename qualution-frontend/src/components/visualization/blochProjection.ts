/**
 * Mathematical projection of a 3D Bloch Vector (x, y, z) into 2D SVG canvas coordinates.
 * Coordinates are defined with standard quantum mechanics axes:
 * - +Z is North (|0⟩)
 * - -Z is South (|1⟩)
 * - +X is East / South-East (|+⟩)
 * - -X is West / North-West (|-⟩)
 * - +Y is into screen / tilted (+Y Circular |i⟩)
 * - -Y is out of screen / tilted (-Y Circular |-i⟩)
 */

export interface ProjectedPoint {
  x: number;
  y: number;
  depth: number;
}

export interface CameraRotation {
  rotX: number; // pitch in degrees
  rotY: number; // yaw in degrees
  zoom: number; // zoom factor
}

export const DEFAULT_CAMERA: CameraRotation = {
  rotX: 20,
  rotY: -35,
  zoom: 1.0,
};

/**
 * Projects (x, y, z) Bloch vector into 2D screen space (cx, cy) with radius R,
 * applying 3D spherical Euler camera rotation.
 */
export function projectBlochVector(
  x: number,
  y: number,
  z: number,
  cx = 100,
  cy = 100,
  radius = 68,
  camera: CameraRotation = DEFAULT_CAMERA
): ProjectedPoint {
  // Convert camera angles to radians
  const radX = (camera.rotX * Math.PI) / 180;
  const radY = (camera.rotY * Math.PI) / 180;

  // 1. Rotate around Y-axis (Yaw)
  const x1 = x * Math.cos(radY) + y * Math.sin(radY);
  const y1 = -x * Math.sin(radY) + y * Math.cos(radY);
  const z1 = z;

  // 2. Rotate around X-axis (Pitch)
  const x2 = x1;
  const y2 = y1 * Math.cos(radX) - z1 * Math.sin(radX);
  const z2 = y1 * Math.sin(radX) + z1 * Math.cos(radX);

  const effectiveRadius = radius * camera.zoom;

  // Screen mapping:
  // x2 maps to screen horizontal (+X is right)
  // z2 maps to screen vertical (+Z is UP, so screen Y decreases)
  const screenX = cx + x2 * effectiveRadius;
  const screenY = cy - z2 * effectiveRadius;

  return {
    x: screenX,
    y: screenY,
    depth: y2, // depth for z-indexing
  };
}

/**
 * Standard cubic ease-in-out easing function for smooth vector transitions.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
