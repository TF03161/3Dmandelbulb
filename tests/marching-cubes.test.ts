/**
 * Tests for Marching Cubes algorithm
 */

import { describe, it, expect } from 'vitest';
import { marchingCubes, type BoundingBox } from '../src/export/marching/marching-cubes';

describe('Marching Cubes', () => {
  describe('Basic Functionality', () => {
    it('should generate mesh from simple SDF (sphere)', () => {
      // Simple sphere SDF: distance from origin minus radius
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0; // Sphere of radius 1
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const result = marchingCubes(sphereSDF, bbox, 16);

      expect(result).toBeDefined();
      expect(result.positions).toBeDefined();
      expect(result.indices).toBeDefined();
      expect(result.normals).toBeDefined();
      expect(result.positions.length).toBeGreaterThan(0);
      expect(result.indices.length).toBeGreaterThan(0);
    });

    it('should generate positions in groups of 3 (x, y, z)', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0;
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const result = marchingCubes(sphereSDF, bbox, 16);

      expect(result.positions.length % 3).toBe(0);
      expect(result.normals.length % 3).toBe(0);
      expect(result.normals.length).toBe(result.positions.length);
    });

    it('should generate valid triangle indices', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0;
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const result = marchingCubes(sphereSDF, bbox, 16);

      // Indices should come in groups of 3 (triangles)
      expect(result.indices.length % 3).toBe(0);

      // All indices should be valid (less than number of vertices)
      const vertexCount = result.positions.length / 3;
      for (const index of result.indices) {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(vertexCount);
      }
    });
  });

  describe('Resolution Effects', () => {
    it('should generate more vertices with higher resolution', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0;
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const lowRes = marchingCubes(sphereSDF, bbox, 8);
      const highRes = marchingCubes(sphereSDF, bbox, 32);

      expect(highRes.positions.length).toBeGreaterThan(lowRes.positions.length);
      expect(highRes.indices.length).toBeGreaterThan(lowRes.indices.length);
    });

    it('should handle minimum resolution', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0;
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const result = marchingCubes(sphereSDF, bbox, 2);

      expect(result.positions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Different Shapes', () => {
    it('should generate mesh for box SDF', () => {
      // Box SDF
      const boxSDF = (p: { x: number; y: number; z: number }) => {
        const dx = Math.abs(p.x) - 0.5;
        const dy = Math.abs(p.y) - 0.5;
        const dz = Math.abs(p.z) - 0.5;
        return Math.max(dx, Math.max(dy, dz));
      };

      const bbox: BoundingBox = {
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 }
      };

      const result = marchingCubes(boxSDF, bbox, 16);

      expect(result.positions.length).toBeGreaterThan(0);
      expect(result.indices.length).toBeGreaterThan(0);
    });

    it('should generate mesh for torus SDF', () => {
      // Simple torus SDF
      const torusSDF = (p: { x: number; y: number; z: number }) => {
        const R = 1.0; // Major radius
        const r = 0.3; // Minor radius
        const qx = Math.sqrt(p.x * p.x + p.z * p.z) - R;
        return Math.sqrt(qx * qx + p.y * p.y) - r;
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const result = marchingCubes(torusSDF, bbox, 16);

      expect(result.positions.length).toBeGreaterThan(0);
      expect(result.indices.length).toBeGreaterThan(0);
    });
  });

  describe('Bounding Box Handling', () => {
    it('should respect bounding box limits', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0;
      };

      const bbox: BoundingBox = {
        min: { x: -1.5, y: -1.5, z: -1.5 },
        max: { x: 1.5, y: 1.5, z: 1.5 }
      };

      const result = marchingCubes(sphereSDF, bbox, 16);

      // All vertices should be within bounding box (with small tolerance)
      for (let i = 0; i < result.positions.length; i += 3) {
        const x = result.positions[i];
        const y = result.positions[i + 1];
        const z = result.positions[i + 2];

        expect(x).toBeGreaterThanOrEqual(bbox.min.x - 0.2);
        expect(x).toBeLessThanOrEqual(bbox.max.x + 0.2);
        expect(y).toBeGreaterThanOrEqual(bbox.min.y - 0.2);
        expect(y).toBeLessThanOrEqual(bbox.max.y + 0.2);
        expect(z).toBeGreaterThanOrEqual(bbox.min.z - 0.2);
        expect(z).toBeLessThanOrEqual(bbox.max.z + 0.2);
      }
    });

    it('should handle small bounding box', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 0.1;
      };

      const bbox: BoundingBox = {
        min: { x: -0.2, y: -0.2, z: -0.2 },
        max: { x: 0.2, y: 0.2, z: 0.2 }
      };

      const result = marchingCubes(sphereSDF, bbox, 8);

      expect(result.positions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Normal Calculation', () => {
    it('should generate unit normals', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0;
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const result = marchingCubes(sphereSDF, bbox, 16);

      // Check that normals are approximately unit length
      for (let i = 0; i < result.normals.length; i += 3) {
        const nx = result.normals[i];
        const ny = result.normals[i + 1];
        const nz = result.normals[i + 2];

        const length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        expect(length).toBeGreaterThan(0.9);
        expect(length).toBeLessThan(1.1);
      }
    });

    it('should generate outward-pointing normals for sphere', () => {
      const sphereSDF = (p: { x: number; y: number; z: number }) => {
        const r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        return r - 1.0;
      };

      const bbox: BoundingBox = {
        min: { x: -2, y: -2, z: -2 },
        max: { x: 2, y: 2, z: 2 }
      };

      const result = marchingCubes(sphereSDF, bbox, 16);

      // For a sphere, normals should point outward
      // Check a few samples
      let outwardCount = 0;
      const sampleCount = Math.min(30, result.positions.length / 3);

      for (let i = 0; i < sampleCount * 3; i += 3) {
        const px = result.positions[i];
        const py = result.positions[i + 1];
        const pz = result.positions[i + 2];

        const nx = result.normals[i];
        const ny = result.normals[i + 1];
        const nz = result.normals[i + 2];

        // Dot product of position and normal should be positive (outward)
        const dot = px * nx + py * ny + pz * nz;
        if (dot > 0) {
          outwardCount++;
        }
      }

      // Most normals should point outward
      expect(outwardCount).toBeGreaterThan(sampleCount * 0.7);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty SDF (everything outside)', () => {
      const emptySDF = () => 1.0; // Always positive (outside)

      const bbox: BoundingBox = {
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 }
      };

      const result = marchingCubes(emptySDF, bbox, 8);

      // Should generate no or very few vertices
      expect(result.positions.length).toBeLessThan(100);
    });

    it('should handle full SDF (everything inside)', () => {
      const fullSDF = () => -1.0; // Always negative (inside)

      const bbox: BoundingBox = {
        min: { x: -1, y: -1, z: -1 },
        max: { x: 1, y: 1, z: 1 }
      };

      const result = marchingCubes(fullSDF, bbox, 8);

      // Should generate no or very few vertices (no surface)
      expect(result.positions.length).toBeLessThan(100);
    });
  });
});
