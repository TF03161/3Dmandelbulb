/**
 * Unit tests for vec3 utilities
 */

import { describe, it, expect } from 'vitest';
import { vec3 } from '../src/utils/vec3';

describe('vec3 utilities', () => {
  describe('create', () => {
    it('should create a zero vector', () => {
      const v = vec3.create();
      expect(v).toBeInstanceOf(Float32Array);
      expect(v.length).toBe(3);
      expect(v[0]).toBe(0);
      expect(v[1]).toBe(0);
      expect(v[2]).toBe(0);
    });
  });

  describe('set', () => {
    it('should set vector components', () => {
      const v = vec3.create();
      vec3.set(v, 1, 2, 3);
      expect(v[0]).toBe(1);
      expect(v[1]).toBe(2);
      expect(v[2]).toBe(3);
    });

    it('should return the same vector', () => {
      const v = vec3.create();
      const result = vec3.set(v, 1, 2, 3);
      expect(result).toBe(v);
    });
  });

  describe('fromValues', () => {
    it('should create vector from values', () => {
      const v = vec3.fromValues(4, 5, 6);
      expect(v).toBeInstanceOf(Float32Array);
      expect(v[0]).toBe(4);
      expect(v[1]).toBe(5);
      expect(v[2]).toBe(6);
    });
  });

  describe('copy', () => {
    it('should copy vector values', () => {
      const a = vec3.fromValues(1, 2, 3);
      const b = vec3.create();
      vec3.copy(b, a);
      expect(b[0]).toBe(1);
      expect(b[1]).toBe(2);
      expect(b[2]).toBe(3);
    });

    it('should not affect source vector', () => {
      const a = vec3.fromValues(1, 2, 3);
      const b = vec3.create();
      vec3.copy(b, a);
      b[0] = 999;
      expect(a[0]).toBe(1);
    });
  });

  describe('add', () => {
    it('should add two vectors', () => {
      const a = vec3.fromValues(1, 2, 3);
      const b = vec3.fromValues(4, 5, 6);
      const out = vec3.create();
      vec3.add(out, a, b);
      expect(out[0]).toBe(5);
      expect(out[1]).toBe(7);
      expect(out[2]).toBe(9);
    });

    it('should handle negative values', () => {
      const a = vec3.fromValues(-1, -2, -3);
      const b = vec3.fromValues(4, 5, 6);
      const out = vec3.create();
      vec3.add(out, a, b);
      expect(out[0]).toBe(3);
      expect(out[1]).toBe(3);
      expect(out[2]).toBe(3);
    });
  });

  describe('sub and subtract', () => {
    it('should subtract two vectors', () => {
      const a = vec3.fromValues(5, 7, 9);
      const b = vec3.fromValues(1, 2, 3);
      const out = vec3.create();
      vec3.sub(out, a, b);
      expect(out[0]).toBe(4);
      expect(out[1]).toBe(5);
      expect(out[2]).toBe(6);
    });

    it('subtract should behave same as sub', () => {
      const a = vec3.fromValues(5, 7, 9);
      const b = vec3.fromValues(1, 2, 3);
      const out1 = vec3.create();
      const out2 = vec3.create();
      vec3.sub(out1, a, b);
      vec3.subtract(out2, a, b);
      expect(out1[0]).toBe(out2[0]);
      expect(out1[1]).toBe(out2[1]);
      expect(out1[2]).toBe(out2[2]);
    });
  });

  describe('cross', () => {
    it('should compute cross product of orthogonal vectors', () => {
      const x = vec3.fromValues(1, 0, 0);
      const y = vec3.fromValues(0, 1, 0);
      const out = vec3.create();
      vec3.cross(out, x, y);
      expect(out[0]).toBeCloseTo(0, 5);
      expect(out[1]).toBeCloseTo(0, 5);
      expect(out[2]).toBeCloseTo(1, 5);
    });

    it('should compute cross product of arbitrary vectors', () => {
      const a = vec3.fromValues(1, 2, 3);
      const b = vec3.fromValues(4, 5, 6);
      const out = vec3.create();
      vec3.cross(out, a, b);

      // Cross product formula:
      // (ay*bz - az*by, az*bx - ax*bz, ax*by - ay*bx)
      // = (2*6 - 3*5, 3*4 - 1*6, 1*5 - 2*4)
      // = (12-15, 12-6, 5-8)
      // = (-3, 6, -3)
      expect(out[0]).toBeCloseTo(-3, 5);
      expect(out[1]).toBeCloseTo(6, 5);
      expect(out[2]).toBeCloseTo(-3, 5);
    });

    it('cross product of parallel vectors should be zero', () => {
      const a = vec3.fromValues(1, 2, 3);
      const b = vec3.fromValues(2, 4, 6);
      const out = vec3.create();
      vec3.cross(out, a, b);
      expect(out[0]).toBeCloseTo(0, 5);
      expect(out[1]).toBeCloseTo(0, 5);
      expect(out[2]).toBeCloseTo(0, 5);
    });
  });

  describe('scaleAndAdd', () => {
    it('should scale and add vectors', () => {
      const a = vec3.fromValues(1, 2, 3);
      const b = vec3.fromValues(4, 5, 6);
      const out = vec3.create();
      vec3.scaleAndAdd(out, a, b, 2);

      // Result should be a + b*2 = (1+8, 2+10, 3+12) = (9, 12, 15)
      expect(out[0]).toBe(9);
      expect(out[1]).toBe(12);
      expect(out[2]).toBe(15);
    });

    it('should handle negative scale', () => {
      const a = vec3.fromValues(10, 10, 10);
      const b = vec3.fromValues(1, 2, 3);
      const out = vec3.create();
      vec3.scaleAndAdd(out, a, b, -2);

      // Result should be a + b*(-2) = (10-2, 10-4, 10-6) = (8, 6, 4)
      expect(out[0]).toBe(8);
      expect(out[1]).toBe(6);
      expect(out[2]).toBe(4);
    });
  });

  describe('normalize', () => {
    it('should normalize a vector to unit length', () => {
      const a = vec3.fromValues(3, 4, 0);
      const out = vec3.create();
      vec3.normalize(out, a);

      // Length should be 5, so normalized = (3/5, 4/5, 0)
      expect(out[0]).toBeCloseTo(0.6, 5);
      expect(out[1]).toBeCloseTo(0.8, 5);
      expect(out[2]).toBeCloseTo(0, 5);

      // Verify unit length
      const len = vec3.length(out);
      expect(len).toBeCloseTo(1.0, 5);
    });

    it('should handle arbitrary vectors', () => {
      const a = vec3.fromValues(1, 2, 3);
      const out = vec3.create();
      vec3.normalize(out, a);

      const len = vec3.length(out);
      expect(len).toBeCloseTo(1.0, 5);
    });

    it('should handle zero vector gracefully', () => {
      const a = vec3.fromValues(0, 0, 0);
      const out = vec3.create();
      vec3.normalize(out, a);

      expect(out[0]).toBe(0);
      expect(out[1]).toBe(0);
      expect(out[2]).toBe(0);
    });

    it('should not modify input vector', () => {
      const a = vec3.fromValues(1, 2, 3);
      const original = [a[0], a[1], a[2]];
      const out = vec3.create();
      vec3.normalize(out, a);

      expect(a[0]).toBe(original[0]);
      expect(a[1]).toBe(original[1]);
      expect(a[2]).toBe(original[2]);
    });
  });

  describe('length', () => {
    it('should calculate length of vector', () => {
      const a = vec3.fromValues(3, 4, 0);
      const len = vec3.length(a);
      expect(len).toBeCloseTo(5, 5);
    });

    it('should handle 3D vectors', () => {
      const a = vec3.fromValues(1, 2, 2);
      const len = vec3.length(a);
      expect(len).toBeCloseTo(3, 5);
    });

    it('should return zero for zero vector', () => {
      const a = vec3.fromValues(0, 0, 0);
      const len = vec3.length(a);
      expect(len).toBe(0);
    });

    it('should handle negative components', () => {
      const a = vec3.fromValues(-3, -4, 0);
      const len = vec3.length(a);
      expect(len).toBeCloseTo(5, 5);
    });
  });

  describe('edge cases', () => {
    it('should handle very large numbers', () => {
      const a = vec3.fromValues(1e10, 1e10, 1e10);
      const b = vec3.fromValues(1e10, 1e10, 1e10);
      const out = vec3.create();
      vec3.add(out, a, b);
      expect(out[0]).toBe(2e10);
      expect(out[1]).toBe(2e10);
      expect(out[2]).toBe(2e10);
    });

    it('should handle very small numbers', () => {
      const a = vec3.fromValues(1e-10, 1e-10, 1e-10);
      const len = vec3.length(a);
      expect(len).toBeGreaterThan(0);
    });

    it('should allow in-place operations', () => {
      const a = vec3.fromValues(1, 2, 3);
      vec3.add(a, a, a); // a = a + a
      expect(a[0]).toBe(2);
      expect(a[1]).toBe(4);
      expect(a[2]).toBe(6);
    });
  });
});
