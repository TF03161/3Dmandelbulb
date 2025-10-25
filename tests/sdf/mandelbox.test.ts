/**
 * Tests for Mandelbox SDF
 */

import { describe, it, expect } from 'vitest';
import { sdfMandelbox, type MandelboxParams } from '../../src/export/sdf/mandelbox';

describe('Mandelbox SDF', () => {
  describe('Basic Functionality', () => {
    it('should return a number for valid input', () => {
      const p = { x: 0, y: 0, z: 0 };
      const params: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const result = sdfMandelbox(p, params);
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });

    it('should return different values for different points', () => {
      const p1 = { x: 0, y: 0, z: 0 };
      const p2 = { x: 1, y: 1, z: 1 };
      const params: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const result1 = sdfMandelbox(p1, params);
      const result2 = sdfMandelbox(p2, params);
      expect(result1).not.toBe(result2);
    });

    it('should be symmetric for certain axes', () => {
      const params: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const p1 = { x: 1, y: 0, z: 0 };
      const p2 = { x: -1, y: 0, z: 0 };

      const result1 = sdfMandelbox(p1, params);
      const result2 = sdfMandelbox(p2, params);

      expect(Math.abs(result1 - result2)).toBeLessThan(0.0001);
    });
  });

  describe('Parameter Effects', () => {
    it('should respond to scale parameter', () => {
      const p = { x: 0.5, y: 0.5, z: 0.5 };

      const params1: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const params2: MandelboxParams = {
        mbScale: 3.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const result1 = sdfMandelbox(p, params1);
      const result2 = sdfMandelbox(p, params2);

      expect(result1).not.toBe(result2);
    });

    it('should respond to iteration parameter', () => {
      const p = { x: 0.5, y: 0.5, z: 0.5 };

      const params1: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 5
      };

      const params2: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 20
      };

      const result1 = sdfMandelbox(p, params1);
      const result2 = sdfMandelbox(p, params2);

      expect(result1).not.toBe(result2);
    });

    it('should respond to radius parameters', () => {
      const p = { x: 0.5, y: 0.5, z: 0.5 };

      const params1: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const params2: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.25,
        mbFixedRadius: 1.5,
        mbIter: 15
      };

      const result1 = sdfMandelbox(p, params1);
      const result2 = sdfMandelbox(p, params2);

      expect(result1).not.toBe(result2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle origin point', () => {
      const p = { x: 0, y: 0, z: 0 };
      const params: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const result = sdfMandelbox(p, params);
      expect(isFinite(result)).toBe(true);
    });

    it('should handle large coordinates', () => {
      const p = { x: 100, y: 100, z: 100 };
      const params: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      const result = sdfMandelbox(p, params);
      expect(isFinite(result)).toBe(true);
      expect(result).toBeGreaterThan(0); // Should be outside the fractal
    });

    it('should handle minimal iterations', () => {
      const p = { x: 0.5, y: 0.5, z: 0.5 };
      const params: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 1
      };

      const result = sdfMandelbox(p, params);
      expect(isFinite(result)).toBe(true);
    });
  });

  describe('Box Folding Behavior', () => {
    it('should fold points outside unit box', () => {
      const params: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.5,
        mbFixedRadius: 1.0,
        mbIter: 15
      };

      // Points that should be affected by box folding
      const p1 = { x: 1.5, y: 0, z: 0 };
      const p2 = { x: 0, y: 1.5, z: 0 };

      const result1 = sdfMandelbox(p1, params);
      const result2 = sdfMandelbox(p2, params);

      expect(isFinite(result1)).toBe(true);
      expect(isFinite(result2)).toBe(true);
    });
  });

  describe('Sphere Folding Behavior', () => {
    it('should affect points near min radius', () => {
      const p = { x: 0.3, y: 0, z: 0 };

      const params1: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.25,
        mbFixedRadius: 1.0,
        mbIter: 10
      };

      const params2: MandelboxParams = {
        mbScale: 2.0,
        mbMinRadius: 0.75,
        mbFixedRadius: 1.0,
        mbIter: 10
      };

      const result1 = sdfMandelbox(p, params1);
      const result2 = sdfMandelbox(p, params2);

      expect(result1).not.toBe(result2);
    });
  });
});
