/**
 * Tests for Gyroid SDF
 */

import { describe, it, expect } from 'vitest';
import { sdfGyroid, type GyroidParams } from '../../src/export/sdf/gyroid';

describe('Gyroid SDF', () => {
  describe('Basic Functionality', () => {
    it('should return a number for valid input', () => {
      const p = { x: 0, y: 0, z: 0 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result = sdfGyroid(p, params);
      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });

    it('should return different values for different points', () => {
      const p1 = { x: 0, y: 0, z: 0 };
      const p2 = { x: 1, y: 1, z: 1 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result1 = sdfGyroid(p1, params);
      const result2 = sdfGyroid(p2, params);
      expect(result1).not.toBe(result2);
    });

    it('should handle origin point', () => {
      const p = { x: 0, y: 0, z: 0 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result = sdfGyroid(p, params);
      expect(isFinite(result)).toBe(true);
    });
  });

  describe('Parameter Effects', () => {
    it('should respond to scale parameter', () => {
      const p = { x: 1, y: 1, z: 1 };

      const params1: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const params2: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 2.0,
        gyroMod: 0.0
      };

      const result1 = sdfGyroid(p, params1);
      const result2 = sdfGyroid(p, params2);

      expect(result1).not.toBe(result2);
    });

    it('should respond to level parameter', () => {
      const p = { x: 1, y: 1, z: 1 };

      const params1: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const params2: GyroidParams = {
        gyroLevel: 0.5,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result1 = sdfGyroid(p, params1);
      const result2 = sdfGyroid(p, params2);

      expect(result1).not.toBe(result2);
    });

    it('should respond to modulation parameter', () => {
      const p = { x: 1, y: 1, z: 1 };

      const params1: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const params2: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.5
      };

      const result1 = sdfGyroid(p, params1);
      const result2 = sdfGyroid(p, params2);

      expect(result1).not.toBe(result2);
    });
  });

  describe('Scale Behavior', () => {
    it('should handle very small scale', () => {
      const p = { x: 1, y: 1, z: 1 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 0.05,
        gyroMod: 0.0
      };

      const result = sdfGyroid(p, params);
      expect(isFinite(result)).toBe(true);
    });

    it('should clamp scale to minimum value', () => {
      const p = { x: 1, y: 1, z: 1 };

      // Scale less than 0.1 should be clamped to 0.1
      const params1: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 0.01,
        gyroMod: 0.0
      };

      const params2: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 0.1,
        gyroMod: 0.0
      };

      const result1 = sdfGyroid(p, params1);
      const result2 = sdfGyroid(p, params2);

      // Both should give same result due to clamping
      expect(result1).toBe(result2);
    });

    it('should handle large scale', () => {
      const p = { x: 1, y: 1, z: 1 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 10.0,
        gyroMod: 0.0
      };

      const result = sdfGyroid(p, params);
      expect(isFinite(result)).toBe(true);
    });
  });

  describe('Modulation Effects', () => {
    it('should not apply repetition when modulation is zero', () => {
      const p = { x: 5, y: 5, z: 5 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result = sdfGyroid(p, params);
      expect(isFinite(result)).toBe(true);
    });

    it('should apply repetition when modulation is > 0.01', () => {
      const p = { x: 10, y: 10, z: 10 };

      const params1: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const params2: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.5
      };

      const result1 = sdfGyroid(p, params1);
      const result2 = sdfGyroid(p, params2);

      expect(result1).not.toBe(result2);
    });

    it('should handle maximum modulation', () => {
      const p = { x: 1, y: 1, z: 1 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 1.0
      };

      const result = sdfGyroid(p, params);
      expect(isFinite(result)).toBe(true);
    });
  });

  describe('Periodicity', () => {
    it('should exhibit periodic behavior', () => {
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      // Gyroid has approximate period of 2π in unscaled space
      const period = 2 * Math.PI;

      const p1 = { x: 0, y: 0, z: 0 };
      const p2 = { x: period, y: 0, z: 0 };

      const result1 = sdfGyroid(p1, params);
      const result2 = sdfGyroid(p2, params);

      // Should be similar due to periodicity (allowing for numerical error)
      expect(Math.abs(result1 - result2)).toBeLessThan(0.1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative coordinates', () => {
      const p = { x: -5, y: -5, z: -5 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result = sdfGyroid(p, params);
      expect(isFinite(result)).toBe(true);
    });

    it('should handle very large coordinates', () => {
      const p = { x: 1000, y: 1000, z: 1000 };
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result = sdfGyroid(p, params);
      expect(isFinite(result)).toBe(true);
    });

    it('should handle extreme level values', () => {
      const p = { x: 1, y: 1, z: 1 };

      const params1: GyroidParams = {
        gyroLevel: -10.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const params2: GyroidParams = {
        gyroLevel: 10.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      const result1 = sdfGyroid(p, params1);
      const result2 = sdfGyroid(p, params2);

      expect(isFinite(result1)).toBe(true);
      expect(isFinite(result2)).toBe(true);
    });
  });

  describe('Symmetry', () => {
    it('should be symmetric under certain transformations', () => {
      const params: GyroidParams = {
        gyroLevel: 0.0,
        gyroScale: 1.0,
        gyroMod: 0.0
      };

      // Gyroid has 3-fold rotational symmetry
      const p1 = { x: 1, y: 0, z: 0 };
      const p2 = { x: 0, y: 1, z: 0 };
      const p3 = { x: 0, y: 0, z: 1 };

      const result1 = sdfGyroid(p1, params);
      const result2 = sdfGyroid(p2, params);
      const result3 = sdfGyroid(p3, params);

      // All three should be equal due to symmetry
      expect(Math.abs(result1 - result2)).toBeLessThan(0.0001);
      expect(Math.abs(result2 - result3)).toBeLessThan(0.0001);
    });
  });
});
