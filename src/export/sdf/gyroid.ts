/**
 * Gyroid Cathedral SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface GyroidParams {
  gyroLevel: number;
  gyroScale: number;
  gyroMod: number;
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function repeatAround(p: Vec3, period: number): Vec3 {
  const mod = (a: number, b: number) => a - b * Math.floor(a / b);
  return {
    x: mod(p.x + 0.5 * period, period) - 0.5 * period,
    y: mod(p.y + 0.5 * period, period) - 0.5 * period,
    z: mod(p.z + 0.5 * period, period) - 0.5 * period,
  };
}

export function sdfGyroid(p: Vec3, params: GyroidParams): number {
  const scale = Math.max(params.gyroScale, 0.1);
  let q = { x: p.x / scale, y: p.y / scale, z: p.z / scale };

  // Apply modulo repetition if needed
  if (params.gyroMod > 0.01) {
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const period = 4.0 + 8.0 * clamp(params.gyroMod, 0.0, 1.0);
    q = repeatAround(q, period);
  }

  // Gyroid function: sin(x)*cos(y) + sin(y)*cos(z) + sin(z)*cos(x)
  const gyroidValue =
    Math.sin(q.x) * Math.cos(q.y) +
    Math.sin(q.y) * Math.cos(q.z) +
    Math.sin(q.z) * Math.cos(q.x);

  const targetLevel = params.gyroLevel;
  const dist = Math.abs(gyroidValue - targetLevel);

  // Gradient magnitude for normalization
  const gradMag = vec3Length({
    x: Math.cos(q.x) * Math.cos(q.y) - Math.sin(q.z) * Math.sin(q.x),
    y: -Math.sin(q.x) * Math.sin(q.y) + Math.cos(q.y) * Math.cos(q.z),
    z: -Math.sin(q.y) * Math.sin(q.z) + Math.cos(q.z) * Math.cos(q.x),
  });

  const approxDist = dist / Math.max(gradMag, 0.1);

  return approxDist * scale * 0.5;
}
