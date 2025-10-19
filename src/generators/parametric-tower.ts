/**
 * Parametric Tower Generator
 *
 * Generates architectural tower models with customizable parameters:
 * - Floor shapes (circle, square, star, polygon, etc.)
 * - Tapering (linear, exponential, S-curve)
 * - Twisting (uniform, accelerating)
 * - Facade patterns (grid, panels, balconies)
 */

import type { Vec3 } from '../utils/vec3';

export enum FloorShape {
  CIRCLE = 'circle',
  SQUARE = 'square',
  TRIANGLE = 'triangle',
  PENTAGON = 'pentagon',
  HEXAGON = 'hexagon',
  OCTAGON = 'octagon',
  STAR = 'star',
  CROSS = 'cross',
  L_SHAPE = 'l-shape',
  T_SHAPE = 't-shape',
  H_SHAPE = 'h-shape'
}

export enum TaperingMode {
  NONE = 'none',
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  S_CURVE = 's-curve',
  SETBACK = 'setback'
}

export enum TwistingMode {
  NONE = 'none',
  UNIFORM = 'uniform',
  ACCELERATING = 'accelerating',
  SINE = 'sine'
}

export interface TowerParameters {
  // Basic dimensions
  baseRadius: number;        // Base radius in meters (default: 20)
  height: number;            // Total height in meters (default: 150)
  floorCount: number;        // Number of floors (default: 50)
  floorHeight: number;       // Height per floor in meters (default: 3.0)

  // Shape
  floorShape: FloorShape;    // Floor shape type
  shapeComplexity: number;   // Detail level for shape (3-32, default: 8)
  cornerRadius: number;      // Corner rounding (0-1, default: 0.1)

  // Tapering
  taperingMode: TaperingMode;
  taperingAmount: number;    // How much to taper (0-1, default: 0.3)
  topRadius: number;         // Radius at top (auto-calculated if not set)

  // Twisting
  twistingMode: TwistingMode;
  twistAngle: number;        // Total twist angle in degrees (default: 0)
  twistLevels: number;       // Number of twist segments (default: 10)

  // Variations
  floorVariation: number;    // Random variation per floor (0-0.5, default: 0)
  asymmetry: number;         // Asymmetry factor (0-1, default: 0)

  // Facade
  facadeGridX: number;       // Horizontal grid spacing (default: 3.0m)
  facadeGridZ: number;       // Vertical grid spacing (default: 3.0m)
  panelDepth: number;        // Panel depth variation (0-0.5m, default: 0.1)
  balconyRatio: number;      // Ratio of balconies (0-0.3, default: 0)
}

export interface TowerFloor {
  level: number;
  height: number;           // Height from ground
  radius: number;           // Radius at this level
  rotation: number;         // Rotation angle in radians
  vertices: Vec3[];         // Floor outline vertices
  center: Vec3;             // Floor center point
}

export interface TowerGeometry {
  floors: TowerFloor[];
  shellVertices: Vec3[];    // Outer shell vertices
  shellFaces: number[];     // Triangle indices for shell
  frameLines: Array<{ start: Vec3; end: Vec3 }>; // Structural frame
  facadePanels: Array<{
    vertices: Vec3[];
    depth: number;
    isBalcony: boolean;
  }>;
}

/**
 * Default tower parameters
 */
export const DEFAULT_TOWER_PARAMS: TowerParameters = {
  baseRadius: 20,
  height: 150,
  floorCount: 50,
  floorHeight: 3.0,
  floorShape: FloorShape.CIRCLE,
  shapeComplexity: 16,
  cornerRadius: 0.1,
  taperingMode: TaperingMode.LINEAR,
  taperingAmount: 0.3,
  topRadius: 14,
  twistingMode: TwistingMode.NONE,
  twistAngle: 0,
  twistLevels: 10,
  floorVariation: 0,
  asymmetry: 0,
  facadeGridX: 3.0,
  facadeGridZ: 3.0,
  panelDepth: 0.1,
  balconyRatio: 0
};

/**
 * Generate a parametric tower
 */
export function generateParametricTower(params: Partial<TowerParameters> = {}): TowerGeometry {
  const p = { ...DEFAULT_TOWER_PARAMS, ...params };

  console.log('🏗️ Generating parametric tower:', p);

  const floors = generateFloors(p);
  const shellGeometry = generateShellGeometry(floors);
  const frameLines = generateStructuralFrame(floors, p);
  const facadePanels = generateFacadePanels(floors, p);

  return {
    floors,
    shellVertices: shellGeometry.vertices,
    shellFaces: shellGeometry.faces,
    frameLines,
    facadePanels
  };
}

/**
 * Generate all floor levels with tapering and twisting
 */
function generateFloors(params: TowerParameters): TowerFloor[] {
  const floors: TowerFloor[] = [];

  for (let i = 0; i < params.floorCount; i++) {
    const t = i / (params.floorCount - 1); // Normalized height (0-1)
    const height = i * params.floorHeight;

    // Calculate radius with tapering
    const radius = calculateRadius(t, params);

    // Calculate rotation with twisting
    const rotation = calculateRotation(t, params);

    // Generate floor shape vertices
    const vertices = generateFloorShape(
      params.floorShape,
      radius,
      rotation,
      height,
      params.shapeComplexity,
      params.cornerRadius,
      params.floorVariation * Math.random()
    );

    // Calculate center
    const center: Vec3 = [0, height, 0];

    floors.push({
      level: i,
      height,
      radius,
      rotation,
      vertices,
      center
    });
  }

  return floors;
}

/**
 * Calculate radius at normalized height with tapering
 */
function calculateRadius(t: number, params: TowerParameters): number {
  const { baseRadius, topRadius, taperingMode, taperingAmount } = params;

  switch (taperingMode) {
    case TaperingMode.NONE:
      return baseRadius;

    case TaperingMode.LINEAR:
      return baseRadius - (baseRadius - topRadius) * t;

    case TaperingMode.EXPONENTIAL:
      return baseRadius * Math.pow(topRadius / baseRadius, t);

    case TaperingMode.S_CURVE:
      // Smooth S-curve using smoothstep
      const s = t * t * (3 - 2 * t);
      return baseRadius - (baseRadius - topRadius) * s;

    case TaperingMode.SETBACK:
      // Step-wise setbacks every 25%
      const step = Math.floor(t * 4) / 4;
      return baseRadius - (baseRadius - topRadius) * step;

    default:
      return baseRadius;
  }
}

/**
 * Calculate rotation at normalized height with twisting
 */
function calculateRotation(t: number, params: TowerParameters): number {
  const { twistingMode, twistAngle } = params;
  const maxRadians = (twistAngle * Math.PI) / 180;

  switch (twistingMode) {
    case TwistingMode.NONE:
      return 0;

    case TwistingMode.UNIFORM:
      return maxRadians * t;

    case TwistingMode.ACCELERATING:
      return maxRadians * t * t;

    case TwistingMode.SINE:
      return maxRadians * Math.sin(t * Math.PI / 2);

    default:
      return 0;
  }
}

/**
 * Generate vertices for a floor shape
 */
function generateFloorShape(
  shape: FloorShape,
  radius: number,
  rotation: number,
  height: number,
  complexity: number,
  cornerRadius: number,
  variation: number
): Vec3[] {
  const vertices: Vec3[] = [];

  switch (shape) {
    case FloorShape.CIRCLE:
      return generateCircle(radius, rotation, height, complexity);

    case FloorShape.SQUARE:
      return generatePolygon(4, radius, rotation, height, cornerRadius);

    case FloorShape.TRIANGLE:
      return generatePolygon(3, radius, rotation, height, cornerRadius);

    case FloorShape.PENTAGON:
      return generatePolygon(5, radius, rotation, height, cornerRadius);

    case FloorShape.HEXAGON:
      return generatePolygon(6, radius, rotation, height, cornerRadius);

    case FloorShape.OCTAGON:
      return generatePolygon(8, radius, rotation, height, cornerRadius);

    case FloorShape.STAR:
      return generateStar(5, radius, rotation, height, 0.5);

    case FloorShape.CROSS:
      return generateCross(radius, rotation, height, 0.3);

    case FloorShape.L_SHAPE:
      return generateLShape(radius, rotation, height);

    case FloorShape.T_SHAPE:
      return generateTShape(radius, rotation, height);

    case FloorShape.H_SHAPE:
      return generateHShape(radius, rotation, height);

    default:
      return generateCircle(radius, rotation, height, complexity);
  }
}

/**
 * Generate circle vertices
 */
function generateCircle(radius: number, rotation: number, height: number, segments: number): Vec3[] {
  const vertices: Vec3[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2 + rotation;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    vertices.push([x, height, z]);
  }

  return vertices;
}

/**
 * Generate regular polygon vertices
 */
function generatePolygon(
  sides: number,
  radius: number,
  rotation: number,
  height: number,
  cornerRadius: number
): Vec3[] {
  const vertices: Vec3[] = [];
  const segmentsPerSide = Math.max(1, Math.floor(8 / sides)); // More segments for fewer sides

  for (let i = 0; i < sides; i++) {
    for (let j = 0; j < segmentsPerSide; j++) {
      const t = (i + j / segmentsPerSide) / sides;
      const angle = t * Math.PI * 2 + rotation;

      // Polygon with rounded corners
      let r = radius;
      if (cornerRadius > 0) {
        // Modify radius near corners for rounding
        const cornerT = (t * sides) % 1;
        if (cornerT < 0.1 || cornerT > 0.9) {
          const dist = Math.min(cornerT, 1 - cornerT) * 10;
          r *= 1 - cornerRadius * (1 - dist);
        }
      }

      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;
      vertices.push([x, height, z]);
    }
  }

  return vertices;
}

/**
 * Generate star shape vertices
 */
function generateStar(points: number, radius: number, rotation: number, height: number, innerRatio: number): Vec3[] {
  const vertices: Vec3[] = [];
  const innerRadius = radius * innerRatio;

  for (let i = 0; i < points * 2; i++) {
    const angle = (i / (points * 2)) * Math.PI * 2 + rotation;
    const r = i % 2 === 0 ? radius : innerRadius;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    vertices.push([x, height, z]);
  }

  return vertices;
}

/**
 * Generate cross shape vertices
 */
function generateCross(radius: number, rotation: number, height: number, thickness: number): Vec3[] {
  const t = thickness * radius;
  const r = radius;

  // Cross shape as polygon
  const points: Array<[number, number]> = [
    [-t, r], [t, r], [t, t], [r, t],
    [r, -t], [t, -t], [t, -r], [-t, -r],
    [-t, -t], [-r, -t], [-r, t], [-t, t]
  ];

  return points.map(([x, z]) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return [x * cos - z * sin, height, x * sin + z * cos];
  });
}

/**
 * Generate L-shape vertices
 */
function generateLShape(radius: number, rotation: number, height: number): Vec3[] {
  const t = radius * 0.4; // Thickness

  const points: Array<[number, number]> = [
    [-radius, -radius], [t, -radius], [t, t], [radius, t],
    [radius, radius], [-radius, radius]
  ];

  return points.map(([x, z]) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return [x * cos - z * sin, height, x * sin + z * cos];
  });
}

/**
 * Generate T-shape vertices
 */
function generateTShape(radius: number, rotation: number, height: number): Vec3[] {
  const t = radius * 0.4;

  const points: Array<[number, number]> = [
    [-radius, radius], [radius, radius], [radius, t],
    [t, t], [t, -radius], [-t, -radius],
    [-t, t], [-radius, t]
  ];

  return points.map(([x, z]) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return [x * cos - z * sin, height, x * sin + z * cos];
  });
}

/**
 * Generate H-shape vertices
 */
function generateHShape(radius: number, rotation: number, height: number): Vec3[] {
  const t = radius * 0.3;

  const points: Array<[number, number]> = [
    [-radius, radius], [-t, radius], [-t, t], [t, t],
    [t, radius], [radius, radius], [radius, -radius], [t, -radius],
    [t, -t], [-t, -t], [-t, -radius], [-radius, -radius]
  ];

  return points.map(([x, z]) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return [x * cos - z * sin, height, x * sin + z * cos];
  });
}

/**
 * Generate shell geometry from floors
 */
function generateShellGeometry(floors: TowerFloor[]): { vertices: Vec3[]; faces: number[] } {
  const vertices: Vec3[] = [];
  const faces: number[] = [];

  // Build shell by connecting adjacent floors
  for (let i = 0; i < floors.length - 1; i++) {
    const floor1 = floors[i];
    const floor2 = floors[i + 1];

    const vCount = Math.min(floor1.vertices.length, floor2.vertices.length);

    for (let j = 0; j < vCount; j++) {
      const j1 = (j + 1) % vCount;

      // Add vertices
      const v0 = vertices.length;
      vertices.push(floor1.vertices[j]);
      vertices.push(floor1.vertices[j1]);
      vertices.push(floor2.vertices[j]);
      vertices.push(floor2.vertices[j1]);

      // Add faces (two triangles per quad)
      faces.push(v0, v0 + 1, v0 + 2);
      faces.push(v0 + 1, v0 + 3, v0 + 2);
    }
  }

  return { vertices, faces };
}

/**
 * Generate structural frame lines
 */
function generateStructuralFrame(floors: TowerFloor[], params: TowerParameters): Array<{ start: Vec3; end: Vec3 }> {
  const lines: Array<{ start: Vec3; end: Vec3 }> = [];

  // Vertical columns (every 4th vertex)
  const step = Math.max(1, Math.floor(params.shapeComplexity / 8));

  for (let i = 0; i < floors.length - 1; i++) {
    const floor1 = floors[i];
    const floor2 = floors[i + 1];

    for (let j = 0; j < floor1.vertices.length; j += step) {
      const v1 = floor1.vertices[j % floor1.vertices.length];
      const v2 = floor2.vertices[j % floor2.vertices.length];
      lines.push({ start: v1, end: v2 });
    }
  }

  return lines;
}

/**
 * Generate facade panels
 */
function generateFacadePanels(
  floors: TowerFloor[],
  params: TowerParameters
): Array<{ vertices: Vec3[]; depth: number; isBalcony: boolean }> {
  const panels: Array<{ vertices: Vec3[]; depth: number; isBalcony: boolean }> = [];

  // Generate panels between floors
  for (let i = 0; i < floors.length - 1; i++) {
    const floor1 = floors[i];
    const floor2 = floors[i + 1];

    const vCount = Math.min(floor1.vertices.length, floor2.vertices.length);

    for (let j = 0; j < vCount; j++) {
      const j1 = (j + 1) % vCount;

      const isBalcony = Math.random() < params.balconyRatio;
      const depth = params.panelDepth * (0.5 + Math.random() * 0.5);

      panels.push({
        vertices: [
          floor1.vertices[j],
          floor1.vertices[j1],
          floor2.vertices[j1],
          floor2.vertices[j]
        ],
        depth,
        isBalcony
      });
    }
  }

  return panels;
}
