/**
 * glTF/GLB Writer
 *
 * Exports mesh data to glTF 2.0 / GLB format using @gltf-transform/core
 * Architectural scale (meters), right-handed (+Y up, +Z forward)
 */

import { Document, NodeIO, Material, Primitive } from '@gltf-transform/core';
import type { Vec3 } from '../sdf/fol-dome';

export interface GLTFExportOptions {
  /** Output file path */
  outputPath: string;

  /** Mesh name in glTF */
  meshName?: string;

  /** Scene name in glTF */
  sceneName?: string;

  /** Material properties */
  material?: {
    baseColor?: [number, number, number, number];
    metallic?: number;
    roughness?: number;
  };
}

/**
 * Export mesh to GLB file
 *
 * @param positions Flat array of vertex positions [x,y,z, ...]
 * @param indices Triangle indices
 * @param normals Optional vertex normals
 * @param options Export options
 */
export async function exportToGLB(
  positions: number[],
  indices: number[],
  normals: number[] | undefined,
  options: GLTFExportOptions
): Promise<void> {
  const doc = new Document();
  const buffer = doc.createBuffer();

  // Create accessors
  const posAccessor = doc
    .createAccessor()
    .setArray(new Float32Array(positions))
    .setType('VEC3')
    .setBuffer(buffer);

  const indAccessor = doc
    .createAccessor()
    .setArray(new Uint32Array(indices))
    .setType('SCALAR')
    .setBuffer(buffer);

  // Create primitive
  const prim = doc
    .createPrimitive()
    .setIndices(indAccessor)
    .setAttribute('POSITION', posAccessor);

  // Add normals if provided
  if (normals && normals.length > 0) {
    const normAccessor = doc
      .createAccessor()
      .setArray(new Float32Array(normals))
      .setType('VEC3')
      .setBuffer(buffer);
    prim.setAttribute('NORMAL', normAccessor);
  }

  // Create material
  const mat = doc.createMaterial(options.meshName || 'FoLDome_Material');
  const matOptions = options.material || {};
  mat
    .setBaseColorFactor(matOptions.baseColor || [0.9, 0.9, 0.92, 1.0])
    .setMetallicFactor(matOptions.metallic ?? 0.0)
    .setRoughnessFactor(matOptions.roughness ?? 0.6);

  prim.setMaterial(mat);

  // Create mesh
  const mesh = doc.createMesh(options.meshName || 'FoLDome_Mesh');
  mesh.addPrimitive(prim);

  // Create node and scene
  const node = doc.createNode(options.meshName || 'FoLDome_Node');
  node.setMesh(mesh);

  const scene = doc.createScene(options.sceneName || 'FoLDome_Scene');
  scene.addChild(node);
  doc.getRoot().setDefaultScene(scene);

  // Write GLB
  const io = new NodeIO();
  await io.write(options.outputPath, doc);
}

/**
 * Calculate vertex normals from positions and indices
 */
export function calculateNormals(
  positions: number[],
  indices: number[]
): number[] {
  const normals = new Float32Array(positions.length);

  // Accumulate face normals
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    // Triangle vertices
    const v0: Vec3 = { x: positions[i0], y: positions[i0 + 1], z: positions[i0 + 2] };
    const v1: Vec3 = { x: positions[i1], y: positions[i1 + 1], z: positions[i1 + 2] };
    const v2: Vec3 = { x: positions[i2], y: positions[i2 + 1], z: positions[i2 + 2] };

    // Edges
    const e1: Vec3 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const e2: Vec3 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

    // Cross product (face normal)
    const n: Vec3 = {
      x: e1.y * e2.z - e1.z * e2.y,
      y: e1.z * e2.x - e1.x * e2.z,
      z: e1.x * e2.y - e1.y * e2.x
    };

    // Accumulate to each vertex
    normals[i0] += n.x;
    normals[i0 + 1] += n.y;
    normals[i0 + 2] += n.z;

    normals[i1] += n.x;
    normals[i1 + 1] += n.y;
    normals[i1 + 2] += n.z;

    normals[i2] += n.x;
    normals[i2 + 1] += n.y;
    normals[i2 + 2] += n.z;
  }

  // Normalize
  for (let i = 0; i < normals.length; i += 3) {
    const x = normals[i];
    const y = normals[i + 1];
    const z = normals[i + 2];
    const len = Math.sqrt(x * x + y * y + z * z);

    if (len > 1e-8) {
      normals[i] /= len;
      normals[i + 1] /= len;
      normals[i + 2] /= len;
    } else {
      // Degenerate normal, use up vector
      normals[i] = 0;
      normals[i + 1] = 1;
      normals[i + 2] = 0;
    }
  }

  return Array.from(normals);
}
