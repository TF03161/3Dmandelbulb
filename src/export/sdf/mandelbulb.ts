/**
 * Mandelbulb SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MandelbulbParams {
  maxIterations: number;
  powerBase: number;
  powerAmp: number;
  time: number;
}

export function sdfMandelbulb(p: Vec3, params: MandelbulbParams): number {
  let z = { ...p };
  let dr = 1.0;
  let r = 0.0;
  const power = params.powerBase + params.powerAmp * Math.sin(params.time * 0.5);
  const eps = 1e-4;

  for (let i = 0; i < params.maxIterations; i++) {
    r = Math.sqrt(z.x * z.x + z.y * z.y + z.z * z.z);
    if (r > 2.0) break;

    // Convert to polar coordinates
    const safeR = Math.max(r, eps);
    const theta = Math.acos(Math.max(-1, Math.min(1, z.z / safeR)));
    const phi = Math.atan2(z.y, z.x);

    // Scale and rotate
    dr = Math.pow(safeR, power - 1.0) * power * dr + 1.0;
    const zr = Math.pow(safeR, power);
    const newTheta = theta * power;
    const newPhi = phi * power;

    // Convert back to cartesian coordinates
    z = {
      x: zr * Math.sin(newTheta) * Math.cos(newPhi) + p.x,
      y: zr * Math.sin(newPhi) * Math.sin(newTheta) + p.y,
      z: zr * Math.cos(newTheta) + p.z,
    };
  }

  return 0.5 * Math.log(Math.max(r, eps)) * r / dr;
}
