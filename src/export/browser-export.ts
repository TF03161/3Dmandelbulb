/**
 * Browser-based GLB export functionality
 * Integrates SDF sampling, Marching Cubes, and GLB generation in browser
 */

import { sdfFoLDome, type FoLDParams } from './sdf/fol-dome';
import { sdfMandelbulb, type MandelbulbParams } from './sdf/mandelbulb';
import { sdfFibonacci, type FibonacciParams } from './sdf/fibonacci';
import { sdfMandelbox, type MandelboxParams } from './sdf/mandelbox';
import { sdfMetatron, type MetatronParams } from './sdf/metatron';
import { sdfGyroid, type GyroidParams } from './sdf/gyroid';
import { sdfTyphoon, type TyphoonParams } from './sdf/typhoon';
import { sdfQuaternion, type QuaternionParams } from './sdf/quaternion';
import { sdfCosmic, type CosmicParams } from './sdf/cosmic';
import { marchingCubes, type BoundingBox } from './marching/marching-cubes';

// Simple Vec3 type for browser export
interface Vec3 {
  x: number;
  y: number;
  z: number;
}

// Inline vec3 utilities to avoid import issues
function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function vec3Normalize(v: Vec3): Vec3 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (len > 0) {
    return { x: v.x / len, y: v.y / len, z: v.z / len };
  }
  return { x: 0, y: 0, z: 0 };
}

export interface BrowserExportOptions {
  mode: number;          // Fractal mode (0=Mandelbulb, 1=FoLD, 2=Fibonacci, 3=Mandelbox, 4=Metatron, 5=Gyroid, 6=Typhoon, 7=Quaternion, 8=Cosmic)
  resolution: number;    // Grid resolution (e.g., 128, 192, 256)

  // Common params
  maxIterations?: number;
  powerBase?: number;
  powerAmp?: number;
  fold?: number;
  boxSize?: number;
  morphOn?: number;

  // FoLD params (mode=1)
  radius?: number;
  count?: number;
  width?: number;
  thickness?: number;
  smooth?: number;
  strength?: number;

  // Fibonacci params (mode=2)
  fibSpiral?: number;
  fibBend?: number;
  fibWarp?: number;
  fibOffset?: number;
  fibLayer?: number;
  fibInward?: number;
  fibBandGap?: number;
  fibVortex?: number;

  // Mandelbox params (mode=3)
  mbScale?: number;
  mbMinRadius?: number;
  mbFixedRadius?: number;
  mbIter?: number;

  // Metatron params (mode=4)
  metaRadius?: number;
  metaSpacing?: number;
  metaNode?: number;
  metaStrut?: number;
  metaLayer?: number;
  metaTwist?: number;

  // Gyroid params (mode=5)
  gyroLevel?: number;
  gyroScale?: number;
  gyroMod?: number;

  // Typhoon params (mode=6)
  tyEye?: number;
  tyPull?: number;
  tyWall?: number;
  tySpin?: number;
  tyBand?: number;
  tyNoise?: number;

  // Quaternion params (mode=7)
  quatC?: Float32Array;
  quatPower?: number;
  quatScale?: number;

  // Cosmic params (mode=8)
  cosRadius?: number;
  cosExpansion?: number;
  cosRipple?: number;
  cosSpiral?: number;

  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Sample scalar field from SDF (generic version)
 */
function sampleScalarField(
  sdfFunction: (p: Vec3) => number,
  bbox: BoundingBox,
  resolution: [number, number, number],
  onProgress?: (current: number, total: number, message: string) => void
): number[][][] {
  const [nx, ny, nz] = resolution;
  const { min, max } = bbox;
  const dx = (max.x - min.x) / (nx - 1);
  const dy = (max.y - min.y) / (ny - 1);
  const dz = (max.z - min.z) / (nz - 1);

  const field: number[][][] = [];
  const totalSamples = nx * ny * nz;
  let sampleCount = 0;

  for (let iz = 0; iz < nz; iz++) {
    field[iz] = [];
    for (let iy = 0; iy < ny; iy++) {
      field[iz][iy] = [];
      for (let ix = 0; ix < nx; ix++) {
        const p: Vec3 = {
          x: min.x + ix * dx,
          y: min.y + iy * dy,
          z: min.z + iz * dz,
        };
        field[iz][iy][ix] = sdfFunction(p);
        sampleCount++;

        if (onProgress && sampleCount % 100000 === 0) {
          onProgress(sampleCount, totalSamples, 'Sampling scalar field');
        }
      }
    }
  }

  if (onProgress) {
    onProgress(totalSamples, totalSamples, 'Sampling complete');
  }

  return field;
}

/**
 * Calculate vertex normals from triangle mesh
 */
function calculateNormals(positions: number[], indices: number[]): number[] {
  const numVertices = positions.length / 3;
  const normals = new Array(positions.length).fill(0);

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i];
    const i1 = indices[i + 1];
    const i2 = indices[i + 2];

    const v0: Vec3 = { x: positions[i0 * 3], y: positions[i0 * 3 + 1], z: positions[i0 * 3 + 2] };
    const v1: Vec3 = { x: positions[i1 * 3], y: positions[i1 * 3 + 1], z: positions[i1 * 3 + 2] };
    const v2: Vec3 = { x: positions[i2 * 3], y: positions[i2 * 3 + 1], z: positions[i2 * 3 + 2] };

    const e1 = vec3Sub(v1, v0);
    const e2 = vec3Sub(v2, v0);
    const normal = vec3Cross(e1, e2);

    for (const idx of [i0, i1, i2]) {
      normals[idx * 3] += normal.x;
      normals[idx * 3 + 1] += normal.y;
      normals[idx * 3 + 2] += normal.z;
    }
  }

  for (let i = 0; i < numVertices; i++) {
    const n: Vec3 = {
      x: normals[i * 3],
      y: normals[i * 3 + 1],
      z: normals[i * 3 + 2],
    };
    const normalized = vec3Normalize(n);
    normals[i * 3] = normalized.x;
    normals[i * 3 + 1] = normalized.y;
    normals[i * 3 + 2] = normalized.z;
  }

  return normals;
}

/**
 * Create GLB file from mesh data (browser-compatible)
 */
function createGLB(positions: number[], indices: number[], normals: number[]): ArrayBuffer {
  // Convert to typed arrays
  const posArray = new Float32Array(positions);
  const idxArray = new Uint32Array(indices);
  const normArray = new Float32Array(normals);

  // Calculate bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxX = Math.max(maxX, positions[i]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }

  // Create GLB JSON structure
  const gltf = {
    asset: { version: '2.0', generator: '3Dmandelbulb FoLD Export' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
      }],
    }],
    materials: [{
      name: 'FoLDome_Material',
      pbrMetallicRoughness: {
        baseColorFactor: [0.9, 0.9, 0.92, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.6,
      },
    }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126, // FLOAT
        count: positions.length / 3,
        type: 'VEC3',
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
      },
      {
        bufferView: 1,
        componentType: 5126, // FLOAT
        count: normals.length / 3,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        componentType: 5125, // UNSIGNED_INT
        count: indices.length,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posArray.byteLength },
      { buffer: 0, byteOffset: posArray.byteLength, byteLength: normArray.byteLength },
      { buffer: 0, byteOffset: posArray.byteLength + normArray.byteLength, byteLength: idxArray.byteLength },
    ],
    buffers: [{ byteLength: posArray.byteLength + normArray.byteLength + idxArray.byteLength }],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunkLength = jsonBytes.length + jsonPadding;

  // Create binary buffer
  const binaryData = new Uint8Array(posArray.byteLength + normArray.byteLength + idxArray.byteLength);
  binaryData.set(new Uint8Array(posArray.buffer), 0);
  binaryData.set(new Uint8Array(normArray.buffer), posArray.byteLength);
  binaryData.set(new Uint8Array(idxArray.buffer), posArray.byteLength + normArray.byteLength);

  const binaryPadding = (4 - (binaryData.length % 4)) % 4;
  const binaryChunkLength = binaryData.length + binaryPadding;

  // GLB header
  const totalLength = 12 + 8 + jsonChunkLength + 8 + binaryChunkLength;
  const glb = new ArrayBuffer(totalLength);
  const view = new DataView(glb);
  const bytes = new Uint8Array(glb);

  let offset = 0;

  // GLB header
  view.setUint32(offset, 0x46546C67, true); // magic "glTF"
  offset += 4;
  view.setUint32(offset, 2, true); // version
  offset += 4;
  view.setUint32(offset, totalLength, true); // length
  offset += 4;

  // JSON chunk
  view.setUint32(offset, jsonChunkLength, true); // chunk length
  offset += 4;
  view.setUint32(offset, 0x4E4F534A, true); // chunk type "JSON"
  offset += 4;
  bytes.set(jsonBytes, offset);
  offset += jsonBytes.length;
  for (let i = 0; i < jsonPadding; i++) {
    bytes[offset++] = 0x20; // space padding
  }

  // Binary chunk
  view.setUint32(offset, binaryChunkLength, true); // chunk length
  offset += 4;
  view.setUint32(offset, 0x004E4942, true); // chunk type "BIN\0"
  offset += 4;
  bytes.set(binaryData, offset);
  offset += binaryData.length;
  for (let i = 0; i < binaryPadding; i++) {
    bytes[offset++] = 0x00; // zero padding
  }

  return glb;
}

/**
 * Main export function for browser (generic version)
 */
export async function exportModelInBrowser(options: BrowserExportOptions): Promise<Blob> {
  const { mode, resolution, onProgress } = options;

  let sdfFunction: (p: Vec3) => number;
  let bbox: BoundingBox;
  let modelName: string;

  if (mode === 0) {
    // Mandelbulb
    const params: MandelbulbParams = {
      maxIterations: options.maxIterations || 15,
      powerBase: options.powerBase || 8.0,
      powerAmp: options.powerAmp || 0.0,
      time: 0, // Static export
    };

    sdfFunction = (p: Vec3) => sdfMandelbulb(p, params);
    bbox = {
      min: { x: -2.5, y: -2.5, z: -2.5 },
      max: { x: 2.5, y: 2.5, z: 2.5 },
    };
    modelName = 'Mandelbulb';

  } else if (mode === 1) {
    // FoLD (Flower of Life Dome)
    const radius = options.radius || 15.0;
    const params: FoLDParams = {
      uFoLDomeRadius: radius,
      uFoLDomeCount: options.count || 0.5,
      uFoLDomeWidth: options.width || 0.20,
      uFoLDomeThickness: options.thickness || 0.12,
      uFoLDomeSmooth: options.smooth || 0.08,
      uFoLDomeStrength: options.strength || 0.30,
    };

    sdfFunction = (p: Vec3) => sdfFoLDome(p, params);
    const margin = radius * 0.2;
    bbox = {
      min: { x: -radius - margin, y: 0, z: -radius - margin },
      max: { x: radius + margin, y: radius + margin, z: radius + margin },
    };
    modelName = 'FoLDome';

  } else if (mode === 2) {
    // Fibonacci Shell
    const params: FibonacciParams = {
      maxIterations: options.maxIterations || 80,
      powerBase: options.powerBase || 8.0,
      powerAmp: options.powerAmp || 0.0,
      time: 0,
      fold: options.fold || 1.0,
      boxSize: options.boxSize || 2.0,
      fibSpiral: options.fibSpiral || 0.5,
      fibBend: options.fibBend || 0.0,
      fibWarp: options.fibWarp || 0.3,
      fibOffset: options.fibOffset || 0.2,
      fibLayer: options.fibLayer || 0.3,
      fibInward: options.fibInward || 0.4,
      fibBandGap: options.fibBandGap || 0.5,
      fibVortex: options.fibVortex || 0.3,
      morphOn: options.morphOn || 0.0,
    };

    sdfFunction = (p: Vec3) => sdfFibonacci(p, params);
    bbox = {
      min: { x: -3.5, y: -3.5, z: -3.5 },
      max: { x: 3.5, y: 3.5, z: 3.5 },
    };
    modelName = 'Fibonacci';

  } else if (mode === 3) {
    // Mandelbox
    const params: MandelboxParams = {
      mbScale: options.mbScale || -1.5,
      mbMinRadius: options.mbMinRadius || 0.5,
      mbFixedRadius: options.mbFixedRadius || 1.0,
      mbIter: options.mbIter || 10,
    };

    sdfFunction = (p: Vec3) => sdfMandelbox(p, params);
    bbox = {
      min: { x: -6, y: -6, z: -6 },
      max: { x: 6, y: 6, z: 6 },
    };
    modelName = 'Mandelbox';

  } else if (mode === 4) {
    // Metatron Cube
    const params: MetatronParams = {
      metaRadius: options.metaRadius || 2.0,
      metaSpacing: options.metaSpacing || 1.0,
      metaNode: options.metaNode || 0.5,
      metaStrut: options.metaStrut || 0.5,
      metaLayer: options.metaLayer || 0.8,
      metaTwist: options.metaTwist || 0.0,
    };

    sdfFunction = (p: Vec3) => sdfMetatron(p, params);
    bbox = {
      min: { x: -5, y: -5, z: -5 },
      max: { x: 5, y: 5, z: 5 },
    };
    modelName = 'Metatron';

  } else if (mode === 5) {
    // Gyroid Cathedral
    const params: GyroidParams = {
      gyroLevel: options.gyroLevel || 0.0,
      gyroScale: options.gyroScale || 3.0,
      gyroMod: options.gyroMod || 0.0,
    };

    sdfFunction = (p: Vec3) => sdfGyroid(p, params);
    bbox = {
      min: { x: -12, y: -12, z: -12 },
      max: { x: 12, y: 12, z: 12 },
    };
    modelName = 'Gyroid';

  } else if (mode === 6) {
    // Typhoon
    const params: TyphoonParams = {
      maxIterations: options.maxIterations || 80,
      powerBase: options.powerBase || 8.0,
      powerAmp: options.powerAmp || 0.0,
      time: 0,
      tyEye: options.tyEye || 0.4,
      tyPull: options.tyPull || 0.6,
      tyWall: options.tyWall || 1.2,
      tySpin: options.tySpin || 1.5,
      tyBand: options.tyBand || 3.0,
      tyNoise: options.tyNoise || 0.3,
      morphOn: options.morphOn || 0.0,
    };

    sdfFunction = (p: Vec3) => sdfTyphoon(p, params);
    bbox = {
      min: { x: -6, y: -6, z: -6 },
      max: { x: 6, y: 6, z: 6 },
    };
    modelName = 'Typhoon';

  } else if (mode === 7) {
    // Quaternion Julia
    const params: QuaternionParams = {
      maxIterations: options.maxIterations || 80,
      quatC: options.quatC || new Float32Array([-0.2, 0.6, 0.2, 0.0]),
      quatPower: options.quatPower || 2.0,
      quatScale: options.quatScale || 1.0,
      morphOn: options.morphOn || 0.0,
      time: 0,
    };

    sdfFunction = (p: Vec3) => sdfQuaternion(p, params);
    bbox = {
      min: { x: -6, y: -6, z: -6 },
      max: { x: 6, y: 6, z: 6 },
    };
    modelName = 'Quaternion';

  } else if (mode === 8) {
    // Cosmic Bloom
    const params: CosmicParams = {
      cosRadius: options.cosRadius || 2.0,
      cosExpansion: options.cosExpansion || 0.5,
      cosRipple: options.cosRipple || 0.6,
      cosSpiral: options.cosSpiral || 0.4,
      time: 0,
    };

    sdfFunction = (p: Vec3) => sdfCosmic(p, params);
    bbox = {
      min: { x: -2.5, y: -2.5, z: -2.5 },
      max: { x: 2.5, y: 2.5, z: 2.5 },
    };
    modelName = 'Cosmic';

  } else {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  // Sample scalar field
  if (onProgress) onProgress(0, 100, 'Sampling scalar field...');
  const scalarField = sampleScalarField(sdfFunction, bbox, [resolution, resolution, resolution], onProgress);

  // Run Marching Cubes
  if (onProgress) onProgress(50, 100, 'Running Marching Cubes...');
  const result = marchingCubes(scalarField, bbox, [resolution, resolution, resolution], 0.0);

  // Calculate normals
  if (onProgress) onProgress(75, 100, 'Calculating normals...');
  const normals = calculateNormals(result.positions, result.indices);

  // Create GLB
  if (onProgress) onProgress(90, 100, 'Generating GLB file...');
  const glbBuffer = createGLB(result.positions, result.indices, normals);

  if (onProgress) onProgress(100, 100, 'Export complete!');

  return new Blob([glbBuffer], { type: 'model/gltf-binary' });
}

/**
 * Trigger browser download of GLB file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
