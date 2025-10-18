/**
 * Cosmic Bloom SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface CosmicParams {
  cosRadius: number;
  cosExpansion: number;
  cosRipple: number;
  cosSpiral: number;
  time: number;
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function mix(a: number, b: number, t: number): number {
  return a * (1.0 - t) + b * t;
}

export function sdfCosmic(p: Vec3, params: CosmicParams): number {
  const PHI = 1.61803398875;
  let q = { ...p };
  const r = vec3Length(q);
  const timePhase = params.time * (0.2 + params.cosExpansion * 0.6);
  const dynRadius = params.cosRadius * (1.0 + params.cosExpansion * 0.35 * Math.sin(timePhase));
  const base = r - dynRadius;

  // Normalize direction
  if (r > 0.0) {
    q.x /= r;
    q.y /= r;
    q.z /= r;
  }

  const theta = Math.atan2(q.z, q.x);
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const phi = Math.acos(clamp(q.y, -1.0, 1.0));

  // Harmonic waves
  const harmonic = Math.sin((12.0 + params.cosSpiral * 24.0) * theta + params.time * 0.8) *
                   Math.cos((8.0 + params.cosSpiral * 18.0) * phi - params.time * 0.6);

  // Golden ratio waves
  const goldenWave = Math.sin(phi * PHI * 6.0 + theta * PHI * 5.0 + params.time * 1.4);

  // Radial waves
  const radialWave = Math.sin(r * (18.0 + params.cosSpiral * 40.0) + params.time * 1.1);

  // Combine waves with ripple strength
  const rippleAmp = params.cosRipple * params.cosRadius * 0.1;
  let bloom = base + rippleAmp * (0.45 * harmonic + 0.35 * goldenWave + 0.2 * radialWave);

  // Shell layers
  const shells = Math.sin((r / Math.max(params.cosRadius, 1e-3)) * (6.0 + params.cosSpiral * 10.0) + params.time * 0.4);
  bloom += params.cosRipple * params.cosRadius * 0.04 * shells;

  // Filament patterns
  const filament = Math.sin(theta * (20.0 + params.cosSpiral * 22.0) +
                            phi * (14.0 + params.cosSpiral * 18.0) +
                            params.time * 0.5);
  bloom -= params.cosRipple * params.cosRadius * 0.02 * filament;

  return bloom;
}
