/**
 * Fibonacci Shell SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface FibonacciParams {
  maxIterations: number;
  powerBase: number;
  powerAmp: number;
  time: number;
  fold: number;
  boxSize: number;
  fibSpiral: number;
  fibBend: number;
  fibWarp: number;
  fibOffset: number;
  fibLayer: number;
  fibInward: number;
  fibBandGap: number;
  fibVortex: number;
  morphOn: number;
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len > 0) {
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }
  return { x: 0, y: 0, z: 0 };
}

function boxFold(p: Vec3, size: number): Vec3 {
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  return {
    x: clamp(p.x, -size, size) * 2.0 - p.x,
    y: clamp(p.y, -size, size) * 2.0 - p.y,
    z: clamp(p.z, -size, size) * 2.0 - p.z,
  };
}

function mix(a: number, b: number, t: number): number {
  return a * (1.0 - t) + b * t;
}

function mixVec3(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: mix(a.x, b.x, t),
    y: mix(a.y, b.y, t),
    z: mix(a.z, b.z, t),
  };
}

export function sdfFibonacci(p: Vec3, params: FibonacciParams): number {
  const goldenAngle = 2.399963229728653;
  const eps = 1e-4;
  let z = { ...p };
  let dr = 1.0;
  let r = 0.0;
  const power = params.powerBase + params.powerAmp * Math.sin(params.time * 0.5);
  const safePower = Math.max(1.5, Math.min(12.0, power));
  const iterLimit = Math.min(params.maxIterations, 250);
  const maxIterF = Math.max(iterLimit - 1, 1.0);

  for (let i = 0; i < iterLimit; i++) {
    r = vec3Length(z);
    if (r > 6.0) break;

    // Box fold
    if (params.fold > 0.0) {
      const folded = boxFold(z, params.boxSize);
      z = mixVec3(z, folded, params.fold);
    }

    const safeR = Math.max(r, eps);
    const theta = Math.acos(Math.max(-1, Math.min(1, z.z / safeR)));
    const phi = Math.atan2(z.y, z.x);
    const iterRatio = i / maxIterF;

    // Radial direction
    const planeRadius = Math.max(Math.sqrt(z.x * z.x + z.y * z.y), eps);
    const radialDir = vec3Normalize({ x: z.x, y: z.y, z: 0 });

    // Band frequency and phase
    const bandFreq = Math.max(params.fibBandGap, 0.05);
    const bandPhase = iterRatio * 6.2831 * bandFreq + params.time * 0.7;
    const layerPhase = iterRatio * 6.2831 * (0.6 + 0.4 * bandFreq) + params.time * 0.45;
    const bandWave = Math.sin(bandPhase);
    const bandPulse = 0.5 + 0.5 * bandWave;

    // Offset
    z.x += radialDir.x * (params.fibOffset * bandPulse);
    z.y += radialDir.y * (params.fibOffset * bandPulse);
    z.z += params.fibLayer * 0.6 * Math.sin(layerPhase);

    // Inward pull
    const inwardPulse = 0.5 + 0.5 * Math.sin(params.time * 0.52 + iterRatio * 5.2 + bandWave * 0.6);
    const inwardStrength = Math.max(0, Math.min(0.95, params.fibInward * inwardPulse * Math.exp(-planeRadius * (0.45 + 0.25 * bandPulse))));
    z.x = mix(z.x, z.x * (1.0 - 0.55 * inwardStrength), 0.7);
    z.y = mix(z.y, z.y * (1.0 - 0.55 * inwardStrength), 0.7);
    z.x -= radialDir.x * (inwardStrength * 0.18);
    z.y -= radialDir.y * (inwardStrength * 0.18);

    // Spiral and vortex
    const morph = 0.55 + 0.45 * params.morphOn;
    const spiralOsc = Math.sin(params.time * 0.6 + i * params.fibWarp * 0.35 + bandPhase * 0.25);
    const spiralPush = params.fibSpiral * morph * (0.4 + 0.6 * (0.5 + 0.5 * spiralOsc)) + params.fibLayer * (iterRatio - 0.5) * (0.7 + 0.3 * bandPulse);
    const bendOsc = params.fibBend * Math.sin(params.time * 0.5 + i * 0.38);
    const vortexBase = params.fibVortex * (0.25 + 0.75 * iterRatio);
    const vortexAccel = params.fibVortex * (0.12 + 0.35 * inwardStrength) * (0.5 + 0.5 * bandWave);

    // Power iteration
    const rp = Math.pow(safeR, safePower);
    dr = rp / safeR * safePower * dr + 1.0;
    const newTheta = theta * safePower + bendOsc + (0.18 + 0.12 * params.fibVortex) * Math.sin(iterRatio * 9.0 + params.time * 0.4) + params.fibInward * 0.08 * Math.cos(bandPhase - params.time * 0.3);
    const newPhi = phi + goldenAngle + spiralPush + vortexBase + vortexAccel * Math.sin(params.time * 0.55 + i * 0.42 + bandPhase);

    // Convert back to cartesian
    const zn: Vec3 = {
      x: rp * Math.sin(newTheta) * Math.cos(newPhi),
      y: rp * Math.sin(newTheta) * Math.sin(newPhi),
      z: rp * Math.cos(newTheta),
    };

    const feedbackMix = mix(0.18 + 0.22 * params.morphOn, 0.08 + 0.12 * params.morphOn, inwardStrength);
    z = {
      x: zn.x + mix(p.x, z.x, feedbackMix),
      y: zn.y + mix(p.y, z.y, feedbackMix),
      z: zn.z + mix(p.z, z.z, feedbackMix),
    };
  }

  return 0.5 * Math.log(Math.max(r, eps)) * r / dr;
}
