/**
 * Mandelbox SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MandelboxParams {
  mbScale: number;
  mbMinRadius: number;
  mbFixedRadius: number;
  mbIter: number;
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function boxFold(p: Vec3, size: number): Vec3 {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  return {
    x: clamp(p.x, -size, size) * 2.0 - p.x,
    y: clamp(p.y, -size, size) * 2.0 - p.y,
    z: clamp(p.z, -size, size) * 2.0 - p.z,
  };
}

export function sdfMandelbox(p: Vec3, params: MandelboxParams): number {
  const offset = { ...p };
  let z = { ...offset };
  let dr = 1.0;
  const scale = params.mbScale;
  const minRadius2 = params.mbMinRadius * params.mbMinRadius;
  const fixedRadius2 = params.mbFixedRadius * params.mbFixedRadius;

  for (let i = 0; i < params.mbIter; i++) {
    // Box fold
    z = boxFold(z, 1.0);

    // Sphere fold
    const r2 = vec3Dot(z, z);

    if (r2 < minRadius2) {
      const temp = fixedRadius2 / minRadius2;
      z.x *= temp;
      z.y *= temp;
      z.z *= temp;
      dr *= temp;
    } else if (r2 < fixedRadius2) {
      const temp = fixedRadius2 / r2;
      z.x *= temp;
      z.y *= temp;
      z.z *= temp;
      dr *= temp;
    }

    // Scale and translate
    z.x = z.x * scale + offset.x;
    z.y = z.y * scale + offset.y;
    z.z = z.z * scale + offset.z;
    dr = dr * Math.abs(scale) + 1.0;
  }

  const r = vec3Length(z);
  return r / Math.abs(dr);
}
