/**
 * Tower to SDF Converter
 *
 * Converts parametric tower geometry to Signed Distance Field (SDF)
 * for real-time rendering and integration with existing pipeline
 */

import type { TowerGeometry, TowerFloor } from './parametric-tower';

type Vec3 = [number, number, number];

/**
 * Convert tower geometry to SDF function
 */
export function towerToSDF(tower: TowerGeometry): (p: Vec3) => number {
  const floors = tower.floors;

  return (p: Vec3): number => {
    const [x, y, z] = p;

    // Find the two floors that sandwich this point
    let floorIndex = Math.floor(y / (floors[1]?.height || 3.0));
    floorIndex = Math.max(0, Math.min(floors.length - 2, floorIndex));

    const floor1 = floors[floorIndex];
    const floor2 = floors[Math.min(floorIndex + 1, floors.length - 1)];

    if (!floor1 || !floor2) {
      return 1000; // Far outside
    }

    // Interpolation factor between floors
    const t = (y - floor1.height) / Math.max(0.01, floor2.height - floor1.height);

    // Interpolate radius
    const radius = floor1.radius + (floor2.radius - floor1.radius) * t;

    // Interpolate rotation
    const rotation = floor1.rotation + (floor2.rotation - floor1.rotation) * t;

    // Calculate distance from center in XZ plane
    const dx = x;
    const dz = z;

    // Apply rotation
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    const rx = dx * cos - dz * sin;
    const rz = dx * sin + dz * cos;

    // Distance from axis
    const dist2D = Math.sqrt(rx * rx + rz * rz);

    // Simple cylinder approximation
    // TODO: Could be improved to match exact floor shape
    const sdf = dist2D - radius;

    // Add vertical bounds
    if (y < 0) {
      return Math.max(sdf, -y);
    }
    if (y > floors[floors.length - 1].height) {
      return Math.max(sdf, y - floors[floors.length - 1].height);
    }

    return sdf;
  };
}

/**
 * Convert tower to SDF with proper floor shape matching
 */
export function towerToSDFPrecise(tower: TowerGeometry): (p: Vec3) => number {
  const floors = tower.floors;

  return (p: Vec3): number => {
    const [x, y, z] = p;

    // Vertical bounds check
    if (y < 0) return -y + 10;
    if (y > floors[floors.length - 1].height) {
      return y - floors[floors.length - 1].height + 10;
    }

    // Find containing floor pair
    let floorIndex = 0;
    for (let i = 0; i < floors.length - 1; i++) {
      if (y >= floors[i].height && y <= floors[i + 1].height) {
        floorIndex = i;
        break;
      }
    }

    const floor1 = floors[floorIndex];
    const floor2 = floors[Math.min(floorIndex + 1, floors.length - 1)];

    // Interpolation factor
    const t = (y - floor1.height) / Math.max(0.01, floor2.height - floor1.height);

    // Get distance to floor1 polygon
    const dist1 = distanceToPolygon2D(x, z, floor1.vertices, floor1.rotation);

    // Get distance to floor2 polygon
    const dist2 = distanceToPolygon2D(x, z, floor2.vertices, floor2.rotation);

    // Interpolate distances
    return dist1 + (dist2 - dist1) * t;
  };
}

/**
 * Calculate 2D distance to a polygon defined by vertices
 */
function distanceToPolygon2D(x: number, z: number, vertices: Vec3[], rotation: number): number {
  if (vertices.length === 0) return 1000;

  let minDist = Infinity;
  let inside = false;

  // Apply inverse rotation to point
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const rx = x * cos - z * sin;
  const rz = x * sin + z * cos;

  // Check each edge
  for (let i = 0; i < vertices.length; i++) {
    const v1 = vertices[i];
    const v2 = vertices[(i + 1) % vertices.length];

    const x1 = v1[0];
    const z1 = v1[2];
    const x2 = v2[0];
    const z2 = v2[2];

    // Distance to edge
    const edgeDist = distanceToSegment2D(rx, rz, x1, z1, x2, z2);
    minDist = Math.min(minDist, edgeDist);

    // Inside/outside test (ray casting)
    if ((z1 > rz) !== (z2 > rz)) {
      const intersectX = (x2 - x1) * (rz - z1) / (z2 - z1) + x1;
      if (rx < intersectX) {
        inside = !inside;
      }
    }
  }

  return inside ? -minDist : minDist;
}

/**
 * Distance from point to line segment in 2D
 */
function distanceToSegment2D(
  px: number,
  pz: number,
  x1: number,
  z1: number,
  x2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len2 = dx * dx + dz * dz;

  if (len2 === 0) {
    // Point
    const dpx = px - x1;
    const dpz = pz - z1;
    return Math.sqrt(dpx * dpx + dpz * dpz);
  }

  // Parameter t
  let t = ((px - x1) * dx + (pz - z1) * dz) / len2;
  t = Math.max(0, Math.min(1, t));

  // Closest point on segment
  const cx = x1 + t * dx;
  const cz = z1 + t * dz;

  // Distance
  const dpx = px - cx;
  const dpz = pz - cz;
  return Math.sqrt(dpx * dpx + dpz * dpz);
}

/**
 * Create a hybrid SDF that combines tower with environment
 */
export function createHybridTowerSDF(
  tower: TowerGeometry,
  groundSDF: (p: Vec3) => number = (p) => p[1] // Simple ground plane
): (p: Vec3) => number {
  const towerSDF = towerToSDFPrecise(tower);

  return (p: Vec3): number => {
    const towerDist = towerSDF(p);
    const groundDist = groundSDF(p);

    // Union (min)
    return Math.min(towerDist, groundDist);
  };
}
