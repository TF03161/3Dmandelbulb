/**
 * Quaternion Julia SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface QuaternionParams {
  maxIterations: number;
  quatC: Float32Array; // 4D constant
  quatPower: number;
  quatScale: number;
  morphOn: number;
  time: number;
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec4Length(v: Vec4): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z + v.w * v.w);
}

export function sdfQuaternion(p: Vec3, params: QuaternionParams): number {
  let z: Vec4 = { x: p.x, y: p.y, z: p.z, w: 0.0 };
  let dr = 1.0;
  let r = 0.0;

  // Animated C parameter
  const animatedC: Vec4 = {
    x: params.quatC[0] + 0.25 * Math.sin(params.time * 0.3) * params.morphOn,
    y: params.quatC[1] + 0.25 * Math.cos(params.time * 0.27) * params.morphOn,
    z: params.quatC[2] + 0.2 * Math.sin(params.time * 0.17 + 1.5) * params.morphOn,
    w: params.quatC[3],
  };

  const iterLimit = Math.min(params.maxIterations, 250);

  for (let i = 0; i < iterLimit; i++) {
    r = vec4Length(z);
    if (r > 6.0) break;

    // Quaternion power operation
    const safeR = Math.max(r, 1e-6);
    const theta = Math.acos(Math.max(-1, Math.min(1, z.w / safeR)));
    const v: Vec3 = { x: z.x, y: z.y, z: z.z };
    const vLen = vec3Length(v);
    const vNorm: Vec3 = vLen > 0.0 ? { x: v.x / vLen, y: v.y / vLen, z: v.z / vLen } : { x: 0, y: 0, z: 0 };
    const rn = Math.pow(safeR, params.quatPower);
    const ang = theta * params.quatPower;
    const sinAng = Math.sin(ang);
    const cosAng = Math.cos(ang);

    const zPow: Vec4 = {
      x: vNorm.x * sinAng * rn,
      y: vNorm.y * sinAng * rn,
      z: vNorm.z * sinAng * rn,
      w: cosAng * rn,
    };

    z = {
      x: params.quatScale * zPow.x + animatedC.x,
      y: params.quatScale * zPow.y + animatedC.y,
      z: params.quatScale * zPow.z + animatedC.z,
      w: params.quatScale * zPow.w + animatedC.w,
    };

    dr = dr * params.quatPower * Math.pow(safeR, params.quatPower - 1.0) * Math.abs(params.quatScale) + 1.0;
  }

  return 0.5 * Math.log(Math.max(r, 1e-6)) * r / Math.abs(dr);
}
