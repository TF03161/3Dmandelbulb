/**
 * Metatron's Cube SDF (Signed Distance Function)
 * Ported from GLSL fragment shader
 */

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MetatronParams {
  metaRadius: number;
  metaSpacing: number;
  metaNode: number;
  metaStrut: number;
  metaLayer: number;
  metaTwist: number;
}

function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function rot2D(v: { x: number; y: number }, angle: number): { x: number; y: number } {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: c * v.x - s * v.y,
    y: s * v.x + c * v.y,
  };
}

function sdCapsule(p: Vec3, a: Vec3, b: Vec3, r: number): number {
  const pa = vec3Sub(p, a);
  const ba = vec3Sub(b, a);
  const h = Math.max(0, Math.min(1, vec3Dot(pa, ba) / Math.max(vec3Dot(ba, ba), 1e-6)));
  return vec3Length({ x: pa.x - ba.x * h, y: pa.y - ba.y * h, z: pa.z - ba.z * h }) - r;
}

export function sdfMetatron(p: Vec3, params: MetatronParams): number {
  const scale = Math.max(params.metaRadius, 0.2);
  let q = { x: p.x / scale, y: p.y / scale, z: p.z / scale };

  // Apply twist
  if (Math.abs(params.metaTwist) > 1e-5) {
    const angA = params.metaTwist * 0.45;
    const angB = params.metaTwist * 0.22;
    const rotA = rot2D({ x: q.x, y: q.y }, angA);
    q.x = rotA.x;
    q.y = rotA.y;
    const rotB = rot2D({ x: q.x, y: q.z }, angB);
    q.x = rotB.x;
    q.z = rotB.y;
  }

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const ringRad = (0.7 + 0.7 * clamp(params.metaSpacing, 0.0, 1.5));
  const layerH = (0.0 + 1.2 * clamp(params.metaLayer, 0.0, 1.5));
  const nodeR = (0.08 + 0.37 * clamp(params.metaNode, 0.0, 1.0));
  const strutR = nodeR * (0.3 + 0.55 * clamp(params.metaStrut, 0.0, 1.0));

  // Center node
  let minField = vec3Length(q) - nodeR;

  // Top and bottom centers
  const topCenter: Vec3 = { x: 0.0, y: layerH, z: 0.0 };
  const bottomCenter: Vec3 = { x: 0.0, y: -layerH, z: 0.0 };
  minField = Math.min(minField, vec3Length(vec3Sub(q, topCenter)) - nodeR * 0.9);
  minField = Math.min(minField, vec3Length(vec3Sub(q, bottomCenter)) - nodeR * 0.9);
  minField = Math.min(minField, sdCapsule(q, topCenter, bottomCenter, strutR));

  // 6 radial points + connections
  const PI2 = 6.28318530718;
  for (let i = 0; i < 6; i++) {
    const ang = PI2 * i / 6.0;
    const circle = { x: Math.cos(ang), y: Math.sin(ang) };
    const angNext = PI2 * (i + 1) / 6.0;
    const circleNext = { x: Math.cos(angNext), y: Math.sin(angNext) };

    const base: Vec3 = { x: circle.x * ringRad, y: 0.0, z: circle.y * ringRad };
    const baseNext: Vec3 = { x: circleNext.x * ringRad, y: 0.0, z: circleNext.y * ringRad };
    const top: Vec3 = { x: circle.x * (ringRad * 0.6), y: layerH, z: circle.y * (ringRad * 0.6) };
    const topNext: Vec3 = { x: circleNext.x * (ringRad * 0.6), y: layerH, z: circleNext.y * (ringRad * 0.6) };
    const bottom: Vec3 = { x: circle.x * (ringRad * 0.6), y: -layerH, z: circle.y * (ringRad * 0.6) };
    const bottomNext: Vec3 = { x: circleNext.x * (ringRad * 0.6), y: -layerH, z: circleNext.y * (ringRad * 0.6) };

    minField = Math.min(minField, vec3Length(vec3Sub(q, base)) - nodeR);
    minField = Math.min(minField, vec3Length(vec3Sub(q, top)) - nodeR * 0.85);
    minField = Math.min(minField, vec3Length(vec3Sub(q, bottom)) - nodeR * 0.85);
    minField = Math.min(minField, sdCapsule(q, { x: 0, y: 0, z: 0 }, base, strutR));
    minField = Math.min(minField, sdCapsule(q, topCenter, top, strutR * 0.85));
    minField = Math.min(minField, sdCapsule(q, bottomCenter, bottom, strutR * 0.85));
    minField = Math.min(minField, sdCapsule(q, base, baseNext, strutR));
    minField = Math.min(minField, sdCapsule(q, top, topNext, strutR * 0.75));
    minField = Math.min(minField, sdCapsule(q, bottom, bottomNext, strutR * 0.75));
    minField = Math.min(minField, sdCapsule(q, base, top, strutR * 0.72));
    minField = Math.min(minField, sdCapsule(q, base, bottom, strutR * 0.72));
  }

  // Corner connections
  for (let sx = -1; sx <= 1; sx += 2) {
    for (let sz = -1; sz <= 1; sz += 2) {
      const corner: Vec3 = { x: sx * ringRad * 0.6, y: 0.0, z: sz * ringRad * 0.6 };
      minField = Math.min(minField, vec3Length(vec3Sub(q, corner)) - nodeR * 0.85);
      minField = Math.min(minField, sdCapsule(q, topCenter, corner, strutR * 0.68));
      minField = Math.min(minField, sdCapsule(q, bottomCenter, corner, strutR * 0.68));
    }
  }

  return minField * scale;
}
