/**
 * Lighting Approximation
 *
 * Calculates sky view factor, direct sunlight exposure, and irradiance estimates
 * for architectural panels using ray casting.
 */

import type { Mesh, Vec3 } from '../pipelines/build-architectural-model';

export interface SunAngle {
  altitude: number;  // Degrees (0-90)
  azimuth: number;   // Degrees (0-360, 0=North, 90=East)
}

export interface PanelLightingResult {
  panelId: number;
  skyViewFactor: number;      // 0.0 - 1.0
  directSunlight: boolean;
  estimatedIrradiance: number; // W/m²
}

export interface LightingEvaluationResult {
  panels: PanelLightingResult[];
  averageSkyViewFactor: number;
  panelsWithDirectSun: number;
  averageIrradiance: number;
}

/**
 * Default sun angle (Tokyo, Summer Solstice, Noon)
 * Latitude: 35°N, Altitude: ~78°, Azimuth: ~180° (South)
 */
export const DEFAULT_SUN_ANGLE: SunAngle = {
  altitude: 78,
  azimuth: 180
};

// Solar constants
const DIRECT_IRRADIANCE = 1000; // W/m² (clear sky)
const DIFFUSE_IRRADIANCE = 150;  // W/m² (sky dome)

/**
 * Evaluate lighting conditions for architectural panels
 */
export function evaluateLighting(
  shell: Mesh,
  panels: Mesh[],
  sunAngle: SunAngle = DEFAULT_SUN_ANGLE
): LightingEvaluationResult {
  console.log('☀️  Evaluating lighting conditions...');
  console.time('Lighting evaluation');

  const panelResults: PanelLightingResult[] = [];
  let totalSkyView = 0;
  let directSunCount = 0;
  let totalIrradiance = 0;

  panels.forEach((panel, idx) => {
    // Compute panel centroid and normal
    const { centroid, normal } = computePanelCentroidAndNormal(panel);

    // Sky view factor (hemisphere sampling)
    const skyViewFactor = computeSkyViewFactor(centroid, normal, shell);

    // Direct sunlight check
    const sunDirection = sunAngleToDirection(sunAngle);
    const directSunlight = checkDirectSunlight(centroid, normal, sunDirection, shell);

    // Estimate irradiance
    const directComponent = directSunlight ? DIRECT_IRRADIANCE * Math.max(0, dot(normal, sunDirection)) : 0;
    const diffuseComponent = DIFFUSE_IRRADIANCE * skyViewFactor;
    const estimatedIrradiance = directComponent + diffuseComponent;

    panelResults.push({
      panelId: idx,
      skyViewFactor,
      directSunlight,
      estimatedIrradiance
    });

    totalSkyView += skyViewFactor;
    if (directSunlight) directSunCount++;
    totalIrradiance += estimatedIrradiance;
  });

  console.timeEnd('Lighting evaluation');

  const averageSkyViewFactor = panels.length > 0 ? totalSkyView / panels.length : 0;
  const averageIrradiance = panels.length > 0 ? totalIrradiance / panels.length : 0;

  console.log(`   Avg Sky View Factor: ${averageSkyViewFactor.toFixed(2)}`);
  console.log(`   Panels with Direct Sun: ${directSunCount}/${panels.length}`);
  console.log(`   Avg Irradiance: ${averageIrradiance.toFixed(0)} W/m²`);

  return {
    panels: panelResults,
    averageSkyViewFactor,
    panelsWithDirectSun: directSunCount,
    averageIrradiance
  };
}

/**
 * Compute sky view factor using hemisphere sampling
 */
function computeSkyViewFactor(
  point: Vec3,
  normal: Vec3,
  shell: Mesh,
  numSamples: number = 32
): number {
  let visibleCount = 0;

  for (let i = 0; i < numSamples; i++) {
    const sampleDir = hemisphereSample(normal, i, numSamples);
    const hit = rayIntersectsShell(point, sampleDir, shell, 100);

    if (!hit.hit) {
      visibleCount++;
    }
  }

  return visibleCount / numSamples;
}

/**
 * Check if point receives direct sunlight
 */
function checkDirectSunlight(
  point: Vec3,
  normal: Vec3,
  sunDirection: Vec3,
  shell: Mesh
): boolean {
  // Check if sun is above horizon relative to surface
  const dotProduct = dot(normal, sunDirection);
  if (dotProduct <= 0) return false;

  // Ray cast towards sun
  const offset = 0.01; // Small offset to avoid self-intersection
  const origin: Vec3 = {
    x: point.x + normal.x * offset,
    y: point.y + normal.y * offset,
    z: point.z + normal.z * offset
  };

  const hit = rayIntersectsShell(origin, sunDirection, shell, 1000);
  return !hit.hit; // No obstruction = direct sunlight
}

/**
 * Generate hemisphere sample direction (Fibonacci spiral)
 */
function hemisphereSample(normal: Vec3, index: number, total: number): Vec3 {
  const phi = Math.acos(1 - (index + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index; // Golden angle

  // Spherical to Cartesian
  const x = Math.sin(phi) * Math.cos(theta);
  const y = Math.sin(phi) * Math.sin(theta);
  const z = Math.cos(phi);

  // Transform to local coordinate system aligned with normal
  const localDir: Vec3 = { x, y, z };
  return transformToNormalSpace(localDir, normal);
}

/**
 * Transform direction from unit sphere to normal-aligned space
 */
function transformToNormalSpace(dir: Vec3, normal: Vec3): Vec3 {
  // Build tangent and bitangent
  const tangent = Math.abs(normal.y) < 0.999
    ? normalize(cross({ x: 0, y: 1, z: 0 }, normal))
    : normalize(cross({ x: 1, y: 0, z: 0 }, normal));

  const bitangent = cross(normal, tangent);

  // Transform
  return {
    x: dir.x * tangent.x + dir.y * bitangent.x + dir.z * normal.x,
    y: dir.x * tangent.y + dir.y * bitangent.y + dir.z * normal.y,
    z: dir.x * tangent.z + dir.y * bitangent.z + dir.z * normal.z
  };
}

/**
 * Ray-triangle intersection (Möller-Trumbore algorithm)
 */
function rayIntersectsShell(
  origin: Vec3,
  direction: Vec3,
  shell: Mesh,
  maxDistance: number = 100
): { hit: boolean; distance: number } {
  const { positions, indices } = shell;
  let closestDist = Infinity;

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const v0: Vec3 = { x: positions[i0], y: positions[i0 + 1], z: positions[i0 + 2] };
    const v1: Vec3 = { x: positions[i1], y: positions[i1 + 1], z: positions[i1 + 2] };
    const v2: Vec3 = { x: positions[i2], y: positions[i2 + 1], z: positions[i2 + 2] };

    const t = rayTriangleIntersect(origin, direction, v0, v1, v2);

    if (t > 0 && t < closestDist) {
      closestDist = t;
    }
  }

  return {
    hit: closestDist < maxDistance,
    distance: closestDist
  };
}

/**
 * Möller-Trumbore ray-triangle intersection
 */
function rayTriangleIntersect(
  origin: Vec3,
  direction: Vec3,
  v0: Vec3,
  v1: Vec3,
  v2: Vec3
): number {
  const EPSILON = 1e-8;

  const edge1 = sub(v1, v0);
  const edge2 = sub(v2, v0);
  const h = cross(direction, edge2);
  const a = dot(edge1, h);

  if (Math.abs(a) < EPSILON) return -1; // Parallel

  const f = 1.0 / a;
  const s = sub(origin, v0);
  const u = f * dot(s, h);

  if (u < 0.0 || u > 1.0) return -1;

  const q = cross(s, edge1);
  const v = f * dot(direction, q);

  if (v < 0.0 || u + v > 1.0) return -1;

  const t = f * dot(edge2, q);

  return t > EPSILON ? t : -1;
}

/**
 * Convert sun angle to direction vector
 */
function sunAngleToDirection(angle: SunAngle): Vec3 {
  const altRad = (angle.altitude * Math.PI) / 180;
  const aziRad = (angle.azimuth * Math.PI) / 180;

  return {
    x: Math.cos(altRad) * Math.sin(aziRad),
    y: Math.sin(altRad),
    z: Math.cos(altRad) * Math.cos(aziRad)
  };
}

/**
 * Compute panel centroid and average normal
 */
function computePanelCentroidAndNormal(panel: Mesh): { centroid: Vec3; normal: Vec3 } {
  const { positions, normals } = panel;
  const numVertices = positions.length / 3;

  let centroid: Vec3 = { x: 0, y: 0, z: 0 };
  let avgNormal: Vec3 = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < numVertices; i++) {
    centroid.x += positions[i * 3];
    centroid.y += positions[i * 3 + 1];
    centroid.z += positions[i * 3 + 2];

    if (normals) {
      avgNormal.x += normals[i * 3];
      avgNormal.y += normals[i * 3 + 1];
      avgNormal.z += normals[i * 3 + 2];
    }
  }

  centroid.x /= numVertices;
  centroid.y /= numVertices;
  centroid.z /= numVertices;

  return {
    centroid,
    normal: normalize(avgNormal)
  };
}

// Vector utilities
function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
    z: a.z - b.z
  };
}

function normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len < 1e-8) return { x: 0, y: 1, z: 0 };
  return {
    x: v.x / len,
    y: v.y / len,
    z: v.z / len
  };
}
