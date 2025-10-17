/**
 * Minimal vec3 utilities for 3D math operations
 */

export const vec3 = {
  create: (): Float32Array => new Float32Array(3),

  set: (out: Float32Array, x: number, y: number, z: number): Float32Array => {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  },

  fromValues: (x: number, y: number, z: number): Float32Array =>
    new Float32Array([x, y, z]),

  copy: (out: Float32Array, a: Float32Array): Float32Array => {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  },

  add: (out: Float32Array, a: Float32Array, b: Float32Array): Float32Array => {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  },

  sub: (out: Float32Array, a: Float32Array, b: Float32Array): Float32Array => {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  },

  cross: (out: Float32Array, a: Float32Array, b: Float32Array): Float32Array => {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  },

  scaleAndAdd: (out: Float32Array, a: Float32Array, b: Float32Array, s: number): Float32Array => {
    out[0] = a[0] + b[0] * s;
    out[1] = a[1] + b[1] * s;
    out[2] = a[2] + b[2] * s;
    return out;
  },

  normalize: (out: Float32Array, a: Float32Array): Float32Array => {
    const x = a[0], y = a[1], z = a[2];
    const len = Math.hypot(x, y, z);
    if (len > 0) {
      out[0] = x / len;
      out[1] = y / len;
      out[2] = z / len;
    } else {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }
    return out;
  },

  // Alias for sub
  subtract: (out: Float32Array, a: Float32Array, b: Float32Array): Float32Array => {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  },

  // Calculate length of vector
  length: (a: Float32Array): number => {
    return Math.hypot(a[0], a[1], a[2]);
  }
};
