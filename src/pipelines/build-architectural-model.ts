/**
 * Architectural Model Builder
 *
 * Extracts semantic building elements (Shell, Frame, Floor, Core, Panel) from SDF
 * for architectural applications and GLB/IFC export.
 *
 * Based on: 3Dmandelbulb 建築転用拡張 要件定義書
 */

import { marchingCubes, type BoundingBox, type MarchingCubesResult } from '../export/marching/marching-cubes';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface LineSegment {
  start: Vec3;
  end: Vec3;
}

export interface Mesh {
  positions: number[];
  indices: number[];
  normals?: number[];
}

export interface ArchitecturalModelParams {
  shellThreshold: number;        // Isosurface threshold for shell extraction (default: 0.0)
  floorHeight: number;            // Floor height in meters (default: 3.5)
  coreRadius: number;             // Core radius in meters (default: 5.0)
  panelAngleThreshold: number;    // Angle threshold for panel clustering in degrees (default: 15)
  resolution: number;             // Marching cubes resolution (default: 128)
  curvatureEpsilon: number;       // Epsilon for curvature calculation (default: 0.01)
  frameThreshold: number;         // Curvature threshold for frame extraction (default: 0.8)
}

export interface ArchitecturalModel {
  shell: Mesh;
  frame: LineSegment[];
  floors: Mesh[];
  core: Vec3[];
  panels: Mesh[];
  metadata: {
    totalFloors: number;
    floorHeights: number[];
    coreRadius: number;
    panelCount: number;
  };
}

type SDFFunction = (p: Vec3) => number;

/**
 * Default parameters for architectural model extraction
 */
export const DEFAULT_PARAMS: ArchitecturalModelParams = {
  shellThreshold: 0.0,
  floorHeight: 3.5,
  coreRadius: 5.0,
  panelAngleThreshold: 15,
  resolution: 128,
  curvatureEpsilon: 0.01,
  frameThreshold: 0.8
};

/**
 * Main pipeline: Build architectural model from SDF
 */
export function buildArchitecturalModel(
  sdfFunc: SDFFunction,
  bbox: BoundingBox,
  params: Partial<ArchitecturalModelParams> = {}
): ArchitecturalModel {
  const p = { ...DEFAULT_PARAMS, ...params };

  console.log('🏛️  Building architectural model...');
  console.time('Total extraction time');

  // 1. Extract Shell (outer surface mesh)
  console.time('Shell extraction');
  const shell = extractShell(sdfFunc, bbox, p);
  console.timeEnd('Shell extraction');
  console.log(`   Shell: ${shell.positions.length / 3} vertices`);

  // 2. Extract Frame (structural edges/ridges)
  console.time('Frame extraction');
  const frame = extractFrame(sdfFunc, bbox, p);
  console.timeEnd('Frame extraction');
  console.log(`   Frame: ${frame.length} line segments`);

  // 3. Extract Floors (horizontal slices)
  console.time('Floor extraction');
  const { floors, floorHeights } = extractFloors(sdfFunc, bbox, p);
  console.timeEnd('Floor extraction');
  console.log(`   Floors: ${floors.length} levels at heights [${floorHeights.join(', ')}]`);

  // 4. Extract Core (central vertical column)
  console.time('Core extraction');
  const core = extractCore(sdfFunc, bbox, p);
  console.timeEnd('Core extraction');
  console.log(`   Core: ${core.length} points`);

  // 5. Extract Panels (facade subdivision)
  console.time('Panel extraction');
  const panels = extractPanels(shell, p);
  console.timeEnd('Panel extraction');
  console.log(`   Panels: ${panels.length} facade elements`);

  console.timeEnd('Total extraction time');

  return {
    shell,
    frame,
    floors,
    core,
    panels,
    metadata: {
      totalFloors: floors.length,
      floorHeights,
      coreRadius: p.coreRadius,
      panelCount: panels.length
    }
  };
}

/**
 * Extract Shell (outer surface) using Marching Cubes
 */
function extractShell(
  sdfFunc: SDFFunction,
  bbox: BoundingBox,
  params: ArchitecturalModelParams
): Mesh {
  const res = params.resolution;
  const scalarField: number[][][] = [];

  // Build 3D scalar field
  const dx = (bbox.max.x - bbox.min.x) / (res - 1);
  const dy = (bbox.max.y - bbox.min.y) / (res - 1);
  const dz = (bbox.max.z - bbox.min.z) / (res - 1);

  for (let iz = 0; iz < res; iz++) {
    scalarField[iz] = [];
    for (let iy = 0; iy < res; iy++) {
      scalarField[iz][iy] = [];
      for (let ix = 0; ix < res; ix++) {
        const p: Vec3 = {
          x: bbox.min.x + ix * dx,
          y: bbox.min.y + iy * dy,
          z: bbox.min.z + iz * dz
        };
        scalarField[iz][iy][ix] = sdfFunc(p);
      }
    }
  }

  // Run Marching Cubes
  const result = marchingCubes(scalarField, bbox, [res, res, res], params.shellThreshold);

  // Compute normals
  const normals = computeNormals(result.positions, result.indices);

  return {
    positions: result.positions,
    indices: result.indices,
    normals
  };
}

/**
 * Extract Frame (structural edges) using principal curvature analysis
 */
function extractFrame(
  sdfFunc: SDFFunction,
  bbox: BoundingBox,
  params: ArchitecturalModelParams
): LineSegment[] {
  const frame: LineSegment[] = [];
  const step = (bbox.max.x - bbox.min.x) / 32; // Coarser sampling for performance

  // Sample points and identify high-curvature regions
  for (let x = bbox.min.x; x <= bbox.max.x; x += step) {
    for (let y = bbox.min.y; y <= bbox.max.y; y += step) {
      for (let z = bbox.min.z; z <= bbox.max.z; z += step) {
        const p: Vec3 = { x, y, z };
        const dist = sdfFunc(p);

        // Only analyze points near surface
        if (Math.abs(dist) > step * 0.5) continue;

        const curvature = computePrincipalCurvature(p, sdfFunc, params.curvatureEpsilon);

        // High curvature indicates edges/ridges
        if (curvature.k1 > params.frameThreshold || curvature.k2 > params.frameThreshold) {
          // Create small line segment along gradient direction
          const grad = computeGradient(p, sdfFunc, params.curvatureEpsilon);
          const len = Math.sqrt(grad.x * grad.x + grad.y * grad.y + grad.z * grad.z);

          if (len > 1e-6) {
            const halfLen = step * 0.3;
            frame.push({
              start: {
                x: p.x - (grad.x / len) * halfLen,
                y: p.y - (grad.y / len) * halfLen,
                z: p.z - (grad.z / len) * halfLen
              },
              end: {
                x: p.x + (grad.x / len) * halfLen,
                y: p.y + (grad.y / len) * halfLen,
                z: p.z + (grad.z / len) * halfLen
              }
            });
          }
        }
      }
    }
  }

  return frame;
}

/**
 * Extract Floors (horizontal slices at regular intervals)
 */
function extractFloors(
  sdfFunc: SDFFunction,
  bbox: BoundingBox,
  params: ArchitecturalModelParams
): { floors: Mesh[]; floorHeights: number[] } {
  const floors: Mesh[] = [];
  const floorHeights: number[] = [];
  const sliceThickness = 0.1; // Thin slice for floor extraction

  for (let y = bbox.min.y; y <= bbox.max.y; y += params.floorHeight) {
    // Extract horizontal slice at height y
    const sliceBBox: BoundingBox = {
      min: { x: bbox.min.x, y: y - sliceThickness, z: bbox.min.z },
      max: { x: bbox.max.x, y: y + sliceThickness, z: bbox.max.z }
    };

    const res = Math.floor(params.resolution / 2); // Lower resolution for slices
    const scalarField: number[][][] = [];

    const dx = (sliceBBox.max.x - sliceBBox.min.x) / (res - 1);
    const dy = (sliceBBox.max.y - sliceBBox.min.y) / (res - 1);
    const dz = (sliceBBox.max.z - sliceBBox.min.z) / (res - 1);

    for (let iz = 0; iz < res; iz++) {
      scalarField[iz] = [];
      for (let iy = 0; iy < res; iy++) {
        scalarField[iz][iy] = [];
        for (let ix = 0; ix < res; ix++) {
          const p: Vec3 = {
            x: sliceBBox.min.x + ix * dx,
            y: sliceBBox.min.y + iy * dy,
            z: sliceBBox.min.z + iz * dz
          };
          scalarField[iz][iy][ix] = sdfFunc(p);
        }
      }
    }

    const result = marchingCubes(scalarField, sliceBBox, [res, res, res], params.shellThreshold);

    // Only add floor if it has sufficient geometry
    if (result.positions.length > 300) { // At least 100 vertices
      const normals = computeNormals(result.positions, result.indices);
      floors.push({
        positions: result.positions,
        indices: result.indices,
        normals
      });
      floorHeights.push(y);
    }
  }

  return { floors, floorHeights };
}

/**
 * Extract Core (central vertical column points)
 */
function extractCore(
  sdfFunc: SDFFunction,
  bbox: BoundingBox,
  params: ArchitecturalModelParams
): Vec3[] {
  const core: Vec3[] = [];
  const center: Vec3 = {
    x: (bbox.min.x + bbox.max.x) * 0.5,
    y: (bbox.min.y + bbox.max.y) * 0.5,
    z: (bbox.min.z + bbox.max.z) * 0.5
  };

  const step = params.coreRadius / 10;

  // Sample points within core radius
  for (let r = 0; r <= params.coreRadius; r += step) {
    for (let theta = 0; theta < Math.PI * 2; theta += Math.PI / 8) {
      for (let y = bbox.min.y; y <= bbox.max.y; y += step * 2) {
        const p: Vec3 = {
          x: center.x + r * Math.cos(theta),
          y: y,
          z: center.z + r * Math.sin(theta)
        };

        const dist = sdfFunc(p);

        // Point is inside or very close to surface
        if (dist < step * 0.5) {
          core.push(p);
        }
      }
    }
  }

  return core;
}

/**
 * Extract Panels (facade subdivision by normal clustering)
 */
function extractPanels(shell: Mesh, params: ArchitecturalModelParams): Mesh[] {
  if (!shell.normals || shell.normals.length === 0) {
    return []; // Cannot cluster without normals
  }

  const panels: Mesh[] = [];
  const angleThresholdRad = (params.panelAngleThreshold * Math.PI) / 180;

  // Simple clustering: group faces by normal direction
  // This is a simplified version - production code would use better clustering
  const clusters: Map<string, number[]> = new Map();

  for (let i = 0; i < shell.indices.length; i += 3) {
    const i0 = shell.indices[i] * 3;
    const i1 = shell.indices[i + 1] * 3;
    const i2 = shell.indices[i + 2] * 3;

    // Average normal for this triangle
    const nx = (shell.normals[i0] + shell.normals[i1] + shell.normals[i2]) / 3;
    const ny = (shell.normals[i0 + 1] + shell.normals[i1 + 1] + shell.normals[i2 + 1]) / 3;
    const nz = (shell.normals[i0 + 2] + shell.normals[i1 + 2] + shell.normals[i2 + 2]) / 3;

    // Quantize normal to cluster key (6 primary directions + intermediate)
    const clusterKey = quantizeNormal({ x: nx, y: ny, z: nz }, angleThresholdRad);

    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey)!.push(i, i + 1, i + 2);
  }

  // Convert clusters to panel meshes
  clusters.forEach((triangleIndices, key) => {
    if (triangleIndices.length < 3) return; // Skip tiny clusters

    const panelPositions: number[] = [];
    const panelIndices: number[] = [];
    const vertexMap = new Map<number, number>();

    for (const idx of triangleIndices) {
      const vertIdx = shell.indices[idx];

      if (!vertexMap.has(vertIdx)) {
        const newIdx = panelPositions.length / 3;
        vertexMap.set(vertIdx, newIdx);
        panelPositions.push(
          shell.positions[vertIdx * 3],
          shell.positions[vertIdx * 3 + 1],
          shell.positions[vertIdx * 3 + 2]
        );
      }

      panelIndices.push(vertexMap.get(vertIdx)!);
    }

    const normals = computeNormals(panelPositions, panelIndices);
    panels.push({ positions: panelPositions, indices: panelIndices, normals });
  });

  return panels;
}

/**
 * Compute vertex normals from mesh geometry
 */
function computeNormals(positions: number[], indices: number[]): number[] {
  const normals = new Array(positions.length).fill(0);

  // Accumulate face normals
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const v0: Vec3 = { x: positions[i0], y: positions[i0 + 1], z: positions[i0 + 2] };
    const v1: Vec3 = { x: positions[i1], y: positions[i1 + 1], z: positions[i1 + 2] };
    const v2: Vec3 = { x: positions[i2], y: positions[i2 + 1], z: positions[i2 + 2] };

    const e1: Vec3 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const e2: Vec3 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

    // Cross product
    const n: Vec3 = {
      x: e1.y * e2.z - e1.z * e2.y,
      y: e1.z * e2.x - e1.x * e2.z,
      z: e1.x * e2.y - e1.y * e2.x
    };

    normals[i0] += n.x;
    normals[i0 + 1] += n.y;
    normals[i0 + 2] += n.z;
    normals[i1] += n.x;
    normals[i1 + 1] += n.y;
    normals[i1 + 2] += n.z;
    normals[i2] += n.x;
    normals[i2 + 1] += n.y;
    normals[i2 + 2] += n.z;
  }

  // Normalize
  for (let i = 0; i < normals.length; i += 3) {
    const len = Math.sqrt(normals[i] * normals[i] + normals[i + 1] * normals[i + 1] + normals[i + 2] * normals[i + 2]);
    if (len > 1e-6) {
      normals[i] /= len;
      normals[i + 1] /= len;
      normals[i + 2] /= len;
    }
  }

  return normals;
}

/**
 * Compute gradient (surface normal) at point using finite differences
 */
function computeGradient(p: Vec3, sdf: SDFFunction, eps: number): Vec3 {
  const dx = sdf({ x: p.x + eps, y: p.y, z: p.z }) - sdf({ x: p.x - eps, y: p.y, z: p.z });
  const dy = sdf({ x: p.x, y: p.y + eps, z: p.z }) - sdf({ x: p.x, y: p.y - eps, z: p.z });
  const dz = sdf({ x: p.x, y: p.y, z: p.z + eps }) - sdf({ x: p.x, y: p.y, z: p.z - eps });

  return { x: dx / (2 * eps), y: dy / (2 * eps), z: dz / (2 * eps) };
}

/**
 * Compute principal curvatures using Hessian matrix (simplified 2D eigenvalue approximation)
 */
function computePrincipalCurvature(
  p: Vec3,
  sdf: SDFFunction,
  eps: number
): { k1: number; k2: number } {
  // Compute Hessian matrix (second derivatives)
  const fxx = (sdf({ x: p.x + eps, y: p.y, z: p.z }) - 2 * sdf(p) + sdf({ x: p.x - eps, y: p.y, z: p.z })) / (eps * eps);
  const fyy = (sdf({ x: p.x, y: p.y + eps, z: p.z }) - 2 * sdf(p) + sdf({ x: p.x, y: p.y - eps, z: p.z })) / (eps * eps);
  const fzz = (sdf({ x: p.x, y: p.y, z: p.z + eps }) - 2 * sdf(p) + sdf({ x: p.x, y: p.y, z: p.z - eps })) / (eps * eps);

  const fxy =
    (sdf({ x: p.x + eps, y: p.y + eps, z: p.z }) - sdf({ x: p.x + eps, y: p.y - eps, z: p.z }) -
      sdf({ x: p.x - eps, y: p.y + eps, z: p.z }) + sdf({ x: p.x - eps, y: p.y - eps, z: p.z })) /
    (4 * eps * eps);

  // Simplified: use largest diagonal elements as principal curvatures
  // Full implementation would solve eigenvalue problem
  const eigenvalues = [Math.abs(fxx), Math.abs(fyy), Math.abs(fzz)].sort((a, b) => b - a);

  return { k1: eigenvalues[0], k2: eigenvalues[1] };
}

/**
 * Quantize normal vector to cluster key
 */
function quantizeNormal(n: Vec3, threshold: number): string {
  // Simple quantization to 6 primary directions + combinations
  const axes = ['x', 'y', 'z'];
  const signs = ['+', '-'];
  let maxAxis = 'x';
  let maxValue = Math.abs(n.x);

  if (Math.abs(n.y) > maxValue) {
    maxAxis = 'y';
    maxValue = Math.abs(n.y);
  }
  if (Math.abs(n.z) > maxValue) {
    maxAxis = 'z';
  }

  const sign = (maxAxis === 'x' ? n.x : maxAxis === 'y' ? n.y : n.z) > 0 ? '+' : '-';

  return `${sign}${maxAxis}`;
}
