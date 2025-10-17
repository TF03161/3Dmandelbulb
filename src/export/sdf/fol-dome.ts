/**
 * Flower of Life Dome (FoLD) - Distance Field
 *
 * TypeScript port of the GLSL FoLD distance estimator
 * for isosurface extraction and mesh generation.
 *
 * Building-scale implementation (meters)
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface FoLDParams {
  /** Base radius of the dome [meters] */
  uFoLDomeRadius: number;

  /** Number of bands (normalized 0..1, maps to 6..30 internally) */
  uFoLDomeCount: number;

  /** Band width (normalized 0..1) */
  uFoLDomeWidth: number;

  /** Band thickness/depth (normalized 0..1) */
  uFoLDomeThickness: number;

  /** Smoothing factor (normalized 0..1) */
  uFoLDomeSmooth: number;

  /** Field strength (normalized 0..1) */
  uFoLDomeStrength: number;
}

// Math utilities (GLSL equivalents)
const TAU = 2.0 * Math.PI;
const PHI = 1.61803398875; // Golden ratio

function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

function smoothMin(a: number, b: number, k: number): number {
  const h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len < 1e-8) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Fibonacci spiral direction on unit sphere
 * @param index Point index
 * @param total Total number of points
 */
function fibonacciDirection(index: number, total: number): Vec3 {
  const goldenAngle = TAU / (PHI + 1.0); // ≈ 2.399963...
  const i = index + 0.5;
  const t = i / total;
  const theta = goldenAngle * i;
  const y = 1.0 - 2.0 * t; // -1 to 1
  const radius = Math.sqrt(Math.max(0.0, 1.0 - y * y));

  return {
    x: Math.cos(theta) * radius,
    y: y,
    z: Math.sin(theta) * radius
  };
}

/**
 * Flower of Life Dome Distance Estimator
 *
 * Creates a spherical shell with Fibonacci-arranged band patterns.
 * The structure is: abs(r - R) + strength * field
 * where field is created by smoothMin of arc distances to Fibonacci points.
 *
 * @param p Position in world space [meters]
 * @param params FoLD parameters
 * @returns Signed distance to surface (negative = inside)
 */
export function sdfFoLDome(p: Vec3, params: FoLDParams): number {
  const {
    uFoLDomeRadius: R,
    uFoLDomeCount: countNorm,
    uFoLDomeWidth: widthNorm,
    uFoLDomeThickness: thicknessNorm,
    uFoLDomeSmooth: smoothNorm,
    uFoLDomeStrength: strengthNorm
  } = params;

  // Map UI values to physical parameters
  const bandCount = Math.round(mix(6, 30, clamp(countNorm, 0, 1)));
  const bandWidth = mix(0.05, 0.3, clamp(widthNorm, 0, 1)) * R; // [m]
  const bandDepth = mix(0.02, 0.15, clamp(thicknessNorm, 0, 1)) * R; // [m]
  const smoothK = mix(0.01, 0.2, clamp(smoothNorm, 0, 1)) * R; // [m]
  const fieldStrength = mix(0.0, 1.0, clamp(strengthNorm, 0, 1));

  // Current radius from origin
  const r = vec3Length(p);
  if (r < 1e-6) return R; // Handle center singularity

  // Normalized direction
  const dir = vec3Normalize(p);

  // Base shell: abs(r - R) gives a thin spherical shell
  const baseShell = Math.abs(r - R);

  // Band field: smooth union of arc distances to Fibonacci points
  let field = 1e6; // Start with large positive value

  for (let i = 0; i < bandCount; i++) {
    const fibDir = fibonacciDirection(i, bandCount);

    // Arc distance on sphere of radius R
    const dotProduct = clamp(vec3Dot(dir, fibDir), -1.0, 1.0);
    const arcAngle = Math.acos(dotProduct);
    const arcDist = R * arcAngle;

    // Distance to band (cylinder on sphere surface)
    const distToBand = arcDist - bandWidth;

    // Accumulate with smooth minimum
    field = smoothMin(field, distToBand, smoothK);
  }

  // Combine shell with band modulation
  // Formula: abs(r - R) + strength * field
  // This creates a shell with carved-out bands
  const result = baseShell + fieldStrength * Math.min(field, bandDepth);

  return result;
}

/**
 * Helper: Create default FoLD parameters (architectural scale)
 */
export function createDefaultFoLDParams(): FoLDParams {
  return {
    uFoLDomeRadius: 15.0,      // 15m dome
    uFoLDomeCount: 0.5,         // ~18 bands
    uFoLDomeWidth: 0.20,        // 20% width
    uFoLDomeThickness: 0.12,    // 12% thickness
    uFoLDomeSmooth: 0.08,       // 8% smoothing
    uFoLDomeStrength: 0.30      // 30% strength
  };
}
