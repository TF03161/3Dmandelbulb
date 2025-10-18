/**
 * Typhoon SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface TyphoonParams {
  maxIterations: number;
  powerBase: number;
  powerAmp: number;
  time: number;
  tyEye: number;
  tyPull: number;
  tyWall: number;
  tySpin: number;
  tyBand: number;
  tyNoise: number;
  morphOn: number;
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function mix(a: number, b: number, t: number): number {
  return a * (1.0 - t) + b * t;
}

export function sdfTyphoon(p: Vec3, params: TyphoonParams): number {
  const eps = 1e-4;
  let z = { ...p };
  let dr = 1.0;
  let r = 0.0;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const power = clamp(params.powerBase + params.powerAmp * 0.3 * Math.sin(params.time * 0.45), 2.0, 10.0);
  const iterLimit = Math.min(params.maxIterations, 220);
  const maxIterF = Math.max(iterLimit - 1, 1.0);

  for (let i = 0; i < iterLimit; i++) {
    const pos = { x: z.x, y: z.y };
    const radius2D = Math.sqrt(pos.x * pos.x + pos.y * pos.y) + 1e-4;
    const angle2D = Math.atan2(pos.y, pos.x);
    const iterRatio = i / maxIterF;

    // Breathing effect
    const breath = 0.82 + 0.18 * Math.sin(params.time * 0.35 + iterRatio * 3.14);

    // Spiral arm phase with banding
    const armPhase = angle2D * params.tyBand - params.time * (0.65 + 0.15 * breath) + iterRatio * 4.0;
    const armCos = Math.cos(armPhase);
    const armSin = Math.sin(armPhase);
    const armMask = 0.5 + 0.5 * armCos;
    const armWidth = mix(0.55, 1.45, armMask);

    // Vortex pull towards eye
    const vortexPull = clamp(params.tyPull * breath * Math.exp(-radius2D * (0.5 + 0.2 * armMask)), 0.0, 0.88);
    const inwardRadius = mix(radius2D, params.tyEye * (0.85 + 0.15 * armWidth), vortexPull);
    const contractedRadius = inwardRadius * Math.max(0.05, 1.0 - vortexPull);

    // Spiral compression
    const spiralPush = params.tyPull * 0.18 * breath * armSin;
    const compressedRadius = Math.max(contractedRadius - spiralPush, 0.0001);

    // Vortex spin
    const spinRamp = Math.exp((params.tyEye - compressedRadius) * (0.8 + 0.4 * armMask));
    const vortexSpin = params.tySpin * spinRamp * (0.75 + 0.25 * breath);

    // Noise
    const noiseSpin = params.tyNoise * (0.4 * Math.sin(params.time * 0.9 + iterRatio * 6.2831) + 0.3 * armSin);
    const radiusNoise = params.tyNoise * 0.05 * armSin;

    // Swirl scaling
    const swirlScale = mix(1.0, 0.75 + 0.35 * armWidth, 0.4 + 0.3 * params.morphOn);
    const finalRadius = Math.max((compressedRadius + radiusNoise) * swirlScale * Math.max(0.05, 1.0 - vortexPull * (0.6 + 0.4 * params.morphOn)), 1e-4);

    // Apply spin
    const newAngle = angle2D + vortexSpin + noiseSpin;
    z.x = Math.cos(newAngle) * finalRadius;
    z.y = Math.sin(newAngle) * finalRadius;

    // Wall height profile
    const wallProfile = params.tyWall * Math.exp(-Math.pow((finalRadius - params.tyEye) * (1.6 + params.tyBand * 0.2), 2.0));
    const wallBreath = (0.35 + 0.65 * armMask) * (0.8 + 0.2 * breath);
    z.z = mix(z.z, wallProfile * wallBreath, 0.62);
    z.z += params.tyEye * 0.05 * breath * Math.sin(params.time * 0.3 + finalRadius * (1.8 + 0.3 * armWidth));

    r = vec3Length(z);
    if (r > 6.0) break;

    // Mandelbulb iteration
    const safeR = Math.max(r, eps);
    const theta = Math.acos(clamp(z.z / safeR, -1.0, 1.0));
    const phi = Math.atan2(z.y, z.x);
    const rp = Math.pow(safeR, power);
    dr = rp / safeR * power * dr + 1.0;
    const newTheta = theta * power;
    const newPhi = phi * power;

    const zn: Vec3 = {
      x: rp * Math.sin(newTheta) * Math.cos(newPhi),
      y: rp * Math.sin(newTheta) * Math.sin(newPhi),
      z: rp * Math.cos(newTheta),
    };
    const swirlOffset: Vec3 = { x: 0.0, y: 0.0, z: wallProfile * 0.18 * armSin };
    z = {
      x: zn.x + mix(p.x, swirlOffset.x, 0.22 + 0.18 * params.morphOn),
      y: zn.y + mix(p.y, swirlOffset.y, 0.22 + 0.18 * params.morphOn),
      z: zn.z + mix(p.z, swirlOffset.z, 0.22 + 0.18 * params.morphOn),
    };
  }

  return 0.5 * Math.log(Math.max(r, eps)) * r / dr;
}
