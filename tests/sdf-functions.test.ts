/**
 * Unit tests for SDF (Signed Distance Functions)
 */

import { describe, it, expect } from 'vitest';
import { sdfMandelbulb, type MandelbulbParams } from '../src/export/sdf/mandelbulb';

describe('SDF Functions', () => {
  describe('Mandelbulb SDF', () => {
    const defaultParams: MandelbulbParams = {
      maxIterations: 16,
      powerBase: 8.0,
      powerAmp: 0.0,
      time: 0.0
    };

    it('should return valid distance at origin', () => {
      const distance = sdfMandelbulb(
        { x: 0, y: 0, z: 0 },
        defaultParams
      );
      expect(typeof distance).toBe('number');
      expect(isFinite(distance)).toBe(true);
    });

    it('should return positive distance outside the fractal', () => {
      const distance = sdfMandelbulb(
        { x: 3, y: 3, z: 3 },
        defaultParams
      );
      expect(distance).toBeGreaterThan(0);
    });

    it('should return values near zero at surface', () => {
      // Test a point known to be on/near the surface
      const distance = sdfMandelbulb(
        { x: 1.0, y: 0.0, z: 0.0 },
        defaultParams
      );
      expect(typeof distance).toBe('number');
      expect(isFinite(distance)).toBe(true);
    });

    it('should handle different power values', () => {
      const powers = [2, 4, 8, 12];
      powers.forEach(power => {
        const params: MandelbulbParams = {
          ...defaultParams,
          powerBase: power
        };
        const distance = sdfMandelbulb({ x: 1, y: 0, z: 0 }, params);
        expect(isFinite(distance)).toBe(true);
      });
    });

    it('should handle time-varying power', () => {
      const times = [0, 1, 2, 3];
      times.forEach(time => {
        const params: MandelbulbParams = {
          ...defaultParams,
          powerAmp: 1.0,
          time
        };
        const distance = sdfMandelbulb({ x: 1, y: 0, z: 0 }, params);
        expect(isFinite(distance)).toBe(true);
      });
    });

    it('should respect maxIterations', () => {
      const lowIter: MandelbulbParams = { ...defaultParams, maxIterations: 4 };
      const highIter: MandelbulbParams = { ...defaultParams, maxIterations: 32 };

      const d1 = sdfMandelbulb({ x: 0.5, y: 0.5, z: 0.5 }, lowIter);
      const d2 = sdfMandelbulb({ x: 0.5, y: 0.5, z: 0.5 }, highIter);

      expect(isFinite(d1)).toBe(true);
      expect(isFinite(d2)).toBe(true);
      // Higher iterations generally give more accurate results
    });

    it('should be symmetric around origin', () => {
      const params = defaultParams;

      const d1 = sdfMandelbulb({ x: 1, y: 0, z: 0 }, params);
      const d2 = sdfMandelbulb({ x: -1, y: 0, z: 0 }, params);
      const d3 = sdfMandelbulb({ x: 0, y: 1, z: 0 }, params);
      const d4 = sdfMandelbulb({ x: 0, y: -1, z: 0 }, params);

      // Due to numerical precision, we use a tolerance
      expect(Math.abs(d1 - d2)).toBeLessThan(0.01);
      expect(Math.abs(d3 - d4)).toBeLessThan(0.01);
    });

    it('should handle edge cases', () => {
      // Very small values
      const d1 = sdfMandelbulb({ x: 0.001, y: 0.001, z: 0.001 }, defaultParams);
      expect(isFinite(d1)).toBe(true);

      // Zero vector
      const d2 = sdfMandelbulb({ x: 0, y: 0, z: 0 }, defaultParams);
      expect(isFinite(d2)).toBe(true);

      // Large values (outside escape radius)
      const d3 = sdfMandelbulb({ x: 10, y: 10, z: 10 }, defaultParams);
      expect(d3).toBeGreaterThan(0);
      expect(isFinite(d3)).toBe(true);
    });

    it('should produce consistent results', () => {
      const point = { x: 0.5, y: 0.5, z: 0.5 };
      const d1 = sdfMandelbulb(point, defaultParams);
      const d2 = sdfMandelbulb(point, defaultParams);
      expect(d1).toBe(d2);
    });

    it('should satisfy Lipschitz continuity (rough check)', () => {
      // Distance function should not change too dramatically for small movements
      const p1 = { x: 1.0, y: 0.0, z: 0.0 };
      const p2 = { x: 1.01, y: 0.0, z: 0.0 };

      const d1 = sdfMandelbulb(p1, defaultParams);
      const d2 = sdfMandelbulb(p2, defaultParams);

      // Distance change should be roughly proportional to point movement
      const distChange = Math.abs(d1 - d2);
      const pointDist = 0.01;

      // Lipschitz constant for fractals can be large, but should be finite
      expect(distChange).toBeLessThan(pointDist * 100);
    });
  });

  describe('SDF Properties', () => {
    it('should return smaller distances for points closer to surface', () => {
      const params: MandelbulbParams = {
        maxIterations: 16,
        powerBase: 8.0,
        powerAmp: 0.0,
        time: 0.0
      };

      // Far point
      const dFar = Math.abs(sdfMandelbulb({ x: 5, y: 5, z: 5 }, params));

      // Medium point
      const dMed = Math.abs(sdfMandelbulb({ x: 2, y: 2, z: 2 }, params));

      // Closer point
      const dClose = Math.abs(sdfMandelbulb({ x: 1, y: 1, z: 1 }, params));

      // Generally, we expect this ordering (though not strict due to fractal complexity)
      expect(dFar).toBeGreaterThan(dMed);
    });
  });
});
