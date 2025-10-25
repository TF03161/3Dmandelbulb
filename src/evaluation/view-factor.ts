/**
 * View Factor Calculation
 *
 * Calculates view openness from floors to assess spatial quality
 * and external visibility using horizontal ray casting.
 */

import type { Mesh, Vec3 } from '../pipelines/build-architectural-model';

export interface CardinalViews {
  north: number;   // 0.0 - 1.0
  south: number;
  east: number;
  west: number;
}

export interface FloorViewResult {
  floorId: number;
  viewFactor: number;          // 0.0 - 1.0 (overall openness)
  averageViewDistance: number; // meters
  cardinalViews: CardinalViews;
}

export interface ViewEvaluationResult {
  floors: FloorViewResult[];
  averageViewFactor: number;
  averageViewDistance: number;
}

const DEFAULT_SAMPLE_RADIUS = 50; // meters
const NUM_DIRECTIONS = 16;        // 360° / 16 = 22.5° intervals
const NUM_HEIGHT_LEVELS = 3;      // Sample at 3 heights per floor

/**
 * Evaluate view factors for all floors
 */
export function evaluateViewFactors(
  floors: Mesh[],
  shell: Mesh,
  sampleRadius: number = DEFAULT_SAMPLE_RADIUS
): ViewEvaluationResult {
  console.log('👁️  Evaluating view factors...');
  console.time('View evaluation');

  const floorResults: FloorViewResult[] = [];
  let totalViewFactor = 0;
  let totalViewDistance = 0;

  floors.forEach((floor, idx) => {
    const result = evaluateFloorView(floor, shell, sampleRadius, idx);
    floorResults.push(result);
    totalViewFactor += result.viewFactor;
    totalViewDistance += result.averageViewDistance;
  });

  console.timeEnd('View evaluation');

  const averageViewFactor = floors.length > 0 ? totalViewFactor / floors.length : 0;
  const averageViewDistance = floors.length > 0 ? totalViewDistance / floors.length : 0;

  console.log(`   Avg View Factor: ${averageViewFactor.toFixed(2)}`);
  console.log(`   Avg View Distance: ${averageViewDistance.toFixed(1)}m`);

  return {
    floors: floorResults,
    averageViewFactor,
    averageViewDistance
  };
}

/**
 * Evaluate view factor for a single floor
 */
function evaluateFloorView(
  floor: Mesh,
  shell: Mesh,
  sampleRadius: number,
  floorId: number
): FloorViewResult {
  // Compute floor centroid and bounds
  const { centroid, minY, maxY } = computeFloorCentroidAndBounds(floor);

  // Sample at multiple heights
  const heights = [];
  for (let i = 0; i < NUM_HEIGHT_LEVELS; i++) {
    heights.push(minY + ((maxY - minY) * (i + 1)) / (NUM_HEIGHT_LEVELS + 1));
  }

  const cardinalDistances = {
    north: [] as number[],
    south: [] as number[],
    east: [] as number[],
    west: [] as number[]
  };

  let totalDistance = 0;
  let totalSamples = 0;

  // Cast rays in all directions at each height
  for (const height of heights) {
    const samplePoint: Vec3 = { x: centroid.x, y: height, z: centroid.z };

    for (let i = 0; i < NUM_DIRECTIONS; i++) {
      const angle = (i / NUM_DIRECTIONS) * Math.PI * 2;
      const direction: Vec3 = {
        x: Math.sin(angle),
        y: 0, // Horizontal rays
        z: Math.cos(angle)
      };

      const hit = rayIntersectsShell(samplePoint, direction, shell, sampleRadius);
      const distance = hit.hit ? hit.distance : sampleRadius;

      totalDistance += distance;
      totalSamples++;

      // Classify by cardinal direction
      const cardinal = angleToCardinal(angle);
      cardinalDistances[cardinal].push(distance);
    }
  }

  // Compute cardinal view factors (normalized distance)
  const cardinalViews: CardinalViews = {
    north: average(cardinalDistances.north) / sampleRadius,
    south: average(cardinalDistances.south) / sampleRadius,
    east: average(cardinalDistances.east) / sampleRadius,
    west: average(cardinalDistances.west) / sampleRadius
  };

  const averageViewDistance = totalSamples > 0 ? totalDistance / totalSamples : 0;
  const viewFactor = averageViewDistance / sampleRadius;

  return {
    floorId,
    viewFactor,
    averageViewDistance,
    cardinalViews
  };
}

/**
 * Ray-shell intersection (reuse from lighting-approximation logic)
 */
function rayIntersectsShell(
  origin: Vec3,
  direction: Vec3,
  shell: Mesh,
  maxDistance: number
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
    distance: closestDist < maxDistance ? closestDist : maxDistance
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

  if (Math.abs(a) < EPSILON) return -1;

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
 * Compute floor centroid and Y bounds
 */
function computeFloorCentroidAndBounds(floor: Mesh): { centroid: Vec3; minY: number; maxY: number } {
  const { positions } = floor;
  const numVertices = positions.length / 3;

  let centroid: Vec3 = { x: 0, y: 0, z: 0 };
  let minY = Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < numVertices; i++) {
    const y = positions[i * 3 + 1];
    centroid.x += positions[i * 3];
    centroid.y += y;
    centroid.z += positions[i * 3 + 2];

    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  centroid.x /= numVertices;
  centroid.y /= numVertices;
  centroid.z /= numVertices;

  return { centroid, minY, maxY };
}

/**
 * Convert angle to cardinal direction
 */
function angleToCardinal(angle: number): keyof CardinalViews {
  // 0 = North, π/2 = East, π = South, 3π/2 = West
  const normalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

  if (normalized < Math.PI / 4 || normalized >= (7 * Math.PI) / 4) {
    return 'north';
  } else if (normalized < (3 * Math.PI) / 4) {
    return 'east';
  } else if (normalized < (5 * Math.PI) / 4) {
    return 'south';
  } else {
    return 'west';
  }
}

/**
 * Compute average of array
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
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
