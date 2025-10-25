/**
 * Structural Heuristics
 *
 * Simple structural health checks for architectural models:
 * - Column density (frame edges per floor area)
 * - Maximum span length
 * - Eccentricity (core-to-centroid distance)
 */

import type { Mesh, LineSegment, Vec3 } from '../pipelines/build-architectural-model';

export interface StructuralEvaluationResult {
  columnDensity: number;       // columns per 50㎡
  maxSpanLength: number;       // meters
  eccentricity: number;        // meters
  structuralScore: number;     // 0.0 - 1.0
  warnings: string[];
}

// Structural thresholds
const RECOMMENDED_COLUMN_DENSITY = 1.0; // per 50㎡
const WARNING_SPAN_LENGTH = 10.0;       // meters
const WARNING_ECCENTRICITY_RATIO = 0.25; // 1/4 of building width

/**
 * Evaluate structural heuristics
 */
export function evaluateStructuralHeuristics(
  frame: LineSegment[],
  floors: Mesh[],
  core: Vec3[],
  shell: Mesh
): StructuralEvaluationResult {
  console.log('🏗️  Evaluating structural heuristics...');
  console.time('Structural evaluation');

  const warnings: string[] = [];

  // 1. Column density
  const totalFloorArea = computeTotalFloorArea(floors);
  const columnCount = frame.length;
  const columnDensity = totalFloorArea > 0 ? (columnCount / totalFloorArea) * 50 : 0;

  if (columnDensity < RECOMMENDED_COLUMN_DENSITY) {
    warnings.push(`Low column density: ${columnDensity.toFixed(2)} per 50㎡ (recommended: ${RECOMMENDED_COLUMN_DENSITY})`);
  }

  // 2. Maximum span length
  const maxSpanLength = computeMaxSpanLength(frame);

  if (maxSpanLength > WARNING_SPAN_LENGTH) {
    warnings.push(`Large span detected: ${maxSpanLength.toFixed(1)}m (warning threshold: ${WARNING_SPAN_LENGTH}m)`);
  }

  // 3. Eccentricity
  const coreCentroid = computeCentroid(core);
  const shellCentroid = computeMeshCentroid(shell);
  const eccentricity = distance(coreCentroid, shellCentroid);

  const shellBounds = computeMeshBounds(shell);
  const buildingWidth = Math.max(
    shellBounds.max.x - shellBounds.min.x,
    shellBounds.max.z - shellBounds.min.z
  );

  const eccentricityRatio = buildingWidth > 0 ? eccentricity / buildingWidth : 0;

  if (eccentricityRatio > WARNING_ECCENTRICITY_RATIO) {
    warnings.push(
      `High eccentricity: ${eccentricity.toFixed(1)}m (${(eccentricityRatio * 100).toFixed(0)}% of width)`
    );
  }

  // 4. Structural score (0.0 - 1.0)
  const densityScore = Math.min(columnDensity / RECOMMENDED_COLUMN_DENSITY, 1.0);
  const spanScore = Math.max(1.0 - (maxSpanLength - WARNING_SPAN_LENGTH) / 10, 0);
  const eccentricityScore = Math.max(1.0 - eccentricityRatio / WARNING_ECCENTRICITY_RATIO, 0);

  const structuralScore = (densityScore + spanScore + eccentricityScore) / 3;

  console.timeEnd('Structural evaluation');
  console.log(`   Column Density: ${columnDensity.toFixed(2)} per 50㎡`);
  console.log(`   Max Span: ${maxSpanLength.toFixed(1)}m`);
  console.log(`   Eccentricity: ${eccentricity.toFixed(1)}m`);
  console.log(`   Structural Score: ${structuralScore.toFixed(2)}`);

  if (warnings.length > 0) {
    console.log(`   ⚠️  Warnings: ${warnings.length}`);
    warnings.forEach(w => console.log(`      - ${w}`));
  }

  return {
    columnDensity,
    maxSpanLength,
    eccentricity,
    structuralScore,
    warnings
  };
}

/**
 * Compute total floor area
 */
function computeTotalFloorArea(floors: Mesh[]): number {
  let totalArea = 0;

  floors.forEach(floor => {
    totalArea += computeMeshArea(floor);
  });

  return totalArea;
}

/**
 * Compute mesh surface area (approximation using triangle areas)
 */
function computeMeshArea(mesh: Mesh): number {
  const { positions, indices } = mesh;
  let area = 0;

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const v0: Vec3 = { x: positions[i0], y: positions[i0 + 1], z: positions[i0 + 2] };
    const v1: Vec3 = { x: positions[i1], y: positions[i1 + 1], z: positions[i1 + 2] };
    const v2: Vec3 = { x: positions[i2], y: positions[i2 + 1], z: positions[i2 + 2] };

    area += triangleArea(v0, v1, v2);
  }

  return area;
}

/**
 * Compute triangle area using cross product
 */
function triangleArea(v0: Vec3, v1: Vec3, v2: Vec3): number {
  const edge1 = sub(v1, v0);
  const edge2 = sub(v2, v0);
  const crossProd = cross(edge1, edge2);
  const len = Math.sqrt(crossProd.x * crossProd.x + crossProd.y * crossProd.y + crossProd.z * crossProd.z);
  return len * 0.5;
}

/**
 * Compute maximum span length between frame edges
 */
function computeMaxSpanLength(frame: LineSegment[]): number {
  if (frame.length === 0) return 0;

  let maxSpan = 0;

  // Simple approach: find max distance between any two frame endpoints
  const points: Vec3[] = [];
  frame.forEach(seg => {
    points.push(seg.start, seg.end);
  });

  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dist = distance(points[i], points[j]);
      maxSpan = Math.max(maxSpan, dist);
    }
  }

  return maxSpan;
}

/**
 * Compute centroid of point cloud
 */
function computeCentroid(points: Vec3[]): Vec3 {
  if (points.length === 0) return { x: 0, y: 0, z: 0 };

  const centroid: Vec3 = { x: 0, y: 0, z: 0 };

  points.forEach(p => {
    centroid.x += p.x;
    centroid.y += p.y;
    centroid.z += p.z;
  });

  centroid.x /= points.length;
  centroid.y /= points.length;
  centroid.z /= points.length;

  return centroid;
}

/**
 * Compute mesh centroid
 */
function computeMeshCentroid(mesh: Mesh): Vec3 {
  const { positions } = mesh;
  const numVertices = positions.length / 3;

  const centroid: Vec3 = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < numVertices; i++) {
    centroid.x += positions[i * 3];
    centroid.y += positions[i * 3 + 1];
    centroid.z += positions[i * 3 + 2];
  }

  centroid.x /= numVertices;
  centroid.y /= numVertices;
  centroid.z /= numVertices;

  return centroid;
}

/**
 * Compute mesh bounding box
 */
function computeMeshBounds(mesh: Mesh): { min: Vec3; max: Vec3 } {
  const { positions } = mesh;
  const min: Vec3 = { x: Infinity, y: Infinity, z: Infinity };
  const max: Vec3 = { x: -Infinity, y: -Infinity, z: -Infinity };

  for (let i = 0; i < positions.length; i += 3) {
    min.x = Math.min(min.x, positions[i]);
    min.y = Math.min(min.y, positions[i + 1]);
    min.z = Math.min(min.z, positions[i + 2]);

    max.x = Math.max(max.x, positions[i]);
    max.y = Math.max(max.y, positions[i + 1]);
    max.z = Math.max(max.z, positions[i + 2]);
  }

  return { min, max };
}

/**
 * Compute distance between two points
 */
function distance(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Vector utilities
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
