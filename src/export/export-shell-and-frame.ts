/**
 * Architectural GLB Export
 *
 * Exports architectural model (Shell, Frame, Floor, Core, Panel) to GLB format
 * with embedded metadata for BIM/architectural workflows.
 *
 * Based on: 3Dmandelbulb 建築転用拡張 要件定義書
 */

import type { ArchitecturalModel, Mesh, LineSegment, Vec3 } from '../pipelines/build-architectural-model';

export interface ArchitecturalGLBMetadata {
  architectural_type: string;
  fractal_seed: string;
  export_date: string;
  units: string;
  floor_heights: number[];
  total_floors: number;
  core_radius: number;
  panel_count: number;
  evaluation?: {
    lighting: {
      average_sky_view_factor: number;
      panels_with_direct_sun: number;
      average_irradiance: number;
    };
    view: {
      average_view_factor: number;
      average_view_distance: number;
    };
    structural: {
      column_density: number;
      max_span_length: number;
      eccentricity: number;
      structural_score: number;
      warnings: string[];
    };
  };
}

/**
 * Export architectural model to GLB with metadata
 */
export function exportArchitecturalGLB(
  model: ArchitecturalModel,
  fractalSeed: string = 'mandelbulb'
): ArrayBuffer {
  console.log('🏛️  Exporting architectural GLB...');

  // Create metadata
  const metadata: ArchitecturalGLBMetadata = {
    architectural_type: 'sdf_derived_building',
    fractal_seed: fractalSeed,
    export_date: new Date().toISOString(),
    units: 'meters',
    floor_heights: model.metadata.floorHeights,
    total_floors: model.metadata.totalFloors,
    core_radius: model.metadata.coreRadius,
    panel_count: model.metadata.panelCount
  };

  // Build glTF structure with multiple nodes
  const gltf = buildArchitecturalGLTF(model, metadata);

  // Serialize to GLB binary format
  return createGLBFromGLTF(gltf);
}

/**
 * Export architectural model to GLTF JSON format with embedded base64 data
 * (Three.js editor compatible - single self-contained file)
 */
export function exportArchitecturalGLTF(
  model: ArchitecturalModel,
  fractalSeed: string = 'mandelbulb',
  includeEvaluation: boolean = false
): string {
  console.log('🏛️  Exporting architectural GLTF (embedded base64)...');

  // Create base metadata
  const metadata: ArchitecturalGLBMetadata = {
    architectural_type: 'sdf_derived_building',
    fractal_seed: fractalSeed,
    export_date: new Date().toISOString(),
    units: 'meters',
    floor_heights: model.metadata.floorHeights,
    total_floors: model.metadata.totalFloors,
    core_radius: model.metadata.coreRadius,
    panel_count: model.metadata.panelCount
  };

  // Add evaluation if requested
  if (includeEvaluation) {
    const evaluation = evaluateArchitecturalModel(model);
    metadata.evaluation = evaluation;
  }

  // Build glTF structure
  const gltf = buildArchitecturalGLTF(model, metadata);

  // Extract binary buffer
  const binaryData = gltf.binaryBuffer as Uint8Array;
  delete gltf.binaryBuffer;

  // Convert binary data to base64
  const base64 = arrayBufferToBase64(binaryData.buffer);

  // Embed as data URI
  gltf.buffers[0].uri = `data:application/octet-stream;base64,${base64}`;

  // Return JSON string
  return JSON.stringify(gltf, null, 2);
}

/**
 * Evaluate architectural model (lighting, view, structural)
 */
function evaluateArchitecturalModel(model: ArchitecturalModel): NonNullable<ArchitecturalGLBMetadata['evaluation']> {
  // Dynamic imports to avoid circular dependencies
  const { evaluateLighting } = require('../evaluation/lighting-approximation');
  const { evaluateViewFactors } = require('../evaluation/view-factor');
  const { evaluateStructuralHeuristics } = require('../evaluation/structural-heuristics');

  // Run evaluations
  const lightingResult = evaluateLighting(model.shell, model.panels);
  const viewResult = evaluateViewFactors(model.floors, model.shell);
  const structuralResult = evaluateStructuralHeuristics(model.frame, model.floors, model.core, model.shell);

  return {
    lighting: {
      average_sky_view_factor: lightingResult.averageSkyViewFactor,
      panels_with_direct_sun: lightingResult.panelsWithDirectSun,
      average_irradiance: lightingResult.averageIrradiance
    },
    view: {
      average_view_factor: viewResult.averageViewFactor,
      average_view_distance: viewResult.averageViewDistance
    },
    structural: {
      column_density: structuralResult.columnDensity,
      max_span_length: structuralResult.maxSpanLength,
      eccentricity: structuralResult.eccentricity,
      structural_score: structuralResult.structuralScore,
      warnings: structuralResult.warnings
    }
  };
}

/**
 * Download GLB file to user's computer
 */
export function downloadArchitecturalGLB(glb: ArrayBuffer, filename: string = 'architectural-model.glb'): void {
  const blob = new Blob([glb], { type: 'model/gltf-binary' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log(`✅ Downloaded: ${filename} (${(glb.byteLength / 1024 / 1024).toFixed(2)} MB)`);
}

/**
 * Download GLTF JSON file (self-contained with base64 embedded data)
 */
export function downloadArchitecturalGLTF(
  gltfJson: string,
  filename: string = 'architectural-model.gltf'
): void {
  const blob = new Blob([gltfJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  console.log(`✅ Downloaded: ${filename} (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000; // Process in 32KB chunks to avoid stack overflow

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
}

/**
 * Build glTF JSON structure with architectural elements
 */
function buildArchitecturalGLTF(model: ArchitecturalModel, metadata: ArchitecturalGLBMetadata): any {
  const buffers: ArrayBuffer[] = [];
  const accessors: any[] = [];
  const bufferViews: any[] = [];
  const meshes: any[] = [];
  const nodes: any[] = [];

  let currentBufferOffset = 0;

  // Helper: Add mesh to glTF
  function addMesh(mesh: Mesh, name: string, materialIdx: number): number {
    // Convert to typed arrays
    const positions = new Float32Array(mesh.positions);
    const indices = new Uint32Array(mesh.indices);
    const normals = mesh.normals ? new Float32Array(mesh.normals) : new Float32Array(mesh.positions.length).fill(0);

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < mesh.positions.length; i += 3) {
      minX = Math.min(minX, mesh.positions[i]);
      minY = Math.min(minY, mesh.positions[i + 1]);
      minZ = Math.min(minZ, mesh.positions[i + 2]);
      maxX = Math.max(maxX, mesh.positions[i]);
      maxY = Math.max(maxY, mesh.positions[i + 1]);
      maxZ = Math.max(maxZ, mesh.positions[i + 2]);
    }

    // Add buffers
    buffers.push(positions.buffer, normals.buffer, indices.buffer);

    // Add buffer views
    const posViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentBufferOffset,
      byteLength: positions.byteLength
    });
    currentBufferOffset += positions.byteLength;

    const normViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentBufferOffset,
      byteLength: normals.byteLength
    });
    currentBufferOffset += normals.byteLength;

    const indViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentBufferOffset,
      byteLength: indices.byteLength
    });
    currentBufferOffset += indices.byteLength;

    // Add accessors
    const posAccIdx = accessors.length;
    accessors.push({
      bufferView: posViewIdx,
      componentType: 5126, // FLOAT
      count: mesh.positions.length / 3,
      type: 'VEC3',
      min: [minX, minY, minZ],
      max: [maxX, maxY, maxZ]
    });

    const normAccIdx = accessors.length;
    accessors.push({
      bufferView: normViewIdx,
      componentType: 5126, // FLOAT
      count: normals.length / 3,
      type: 'VEC3'
    });

    const indAccIdx = accessors.length;
    accessors.push({
      bufferView: indViewIdx,
      componentType: 5125, // UNSIGNED_INT
      count: indices.length,
      type: 'SCALAR'
    });

    // Add mesh
    const meshIdx = meshes.length;
    meshes.push({
      name,
      primitives: [{
        attributes: {
          POSITION: posAccIdx,
          NORMAL: normAccIdx
        },
        indices: indAccIdx,
        material: materialIdx
      }]
    });

    return meshIdx;
  }

  // Helper: Add lines (frame) to glTF
  function addLines(segments: LineSegment[], name: string, materialIdx: number): number {
    const positions: number[] = [];
    const indices: number[] = [];

    segments.forEach((seg, i) => {
      const idx = i * 2;
      positions.push(seg.start.x, seg.start.y, seg.start.z);
      positions.push(seg.end.x, seg.end.y, seg.end.z);
      indices.push(idx, idx + 1);
    });

    const posArray = new Float32Array(positions);
    const indArray = new Uint32Array(indices);

    buffers.push(posArray.buffer, indArray.buffer);

    const posViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentBufferOffset,
      byteLength: posArray.byteLength
    });
    currentBufferOffset += posArray.byteLength;

    const indViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentBufferOffset,
      byteLength: indArray.byteLength
    });
    currentBufferOffset += indArray.byteLength;

    const posAccIdx = accessors.length;
    accessors.push({
      bufferView: posViewIdx,
      componentType: 5126, // FLOAT
      count: positions.length / 3,
      type: 'VEC3'
    });

    const indAccIdx = accessors.length;
    accessors.push({
      bufferView: indViewIdx,
      componentType: 5125, // UNSIGNED_INT
      count: indices.length,
      type: 'SCALAR'
    });

    const meshIdx = meshes.length;
    meshes.push({
      name,
      primitives: [{
        attributes: {
          POSITION: posAccIdx
        },
        indices: indAccIdx,
        mode: 1, // LINES
        material: materialIdx
      }]
    });

    return meshIdx;
  }

  // Helper: Add point cloud (core) to glTF
  function addPointCloud(points: Vec3[], name: string, materialIdx: number): number {
    const positions: number[] = [];

    points.forEach(p => {
      positions.push(p.x, p.y, p.z);
    });

    const posArray = new Float32Array(positions);
    buffers.push(posArray.buffer);

    const posViewIdx = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset: currentBufferOffset,
      byteLength: posArray.byteLength
    });
    currentBufferOffset += posArray.byteLength;

    const posAccIdx = accessors.length;
    accessors.push({
      bufferView: posViewIdx,
      componentType: 5126, // FLOAT
      count: positions.length / 3,
      type: 'VEC3'
    });

    const meshIdx = meshes.length;
    meshes.push({
      name,
      primitives: [{
        attributes: {
          POSITION: posAccIdx
        },
        mode: 0, // POINTS
        material: materialIdx
      }]
    });

    return meshIdx;
  }

  // 1. Shell
  const shellMeshIdx = addMesh(model.shell, 'Building_Shell', 0);
  nodes.push({ name: 'Building_Shell', mesh: shellMeshIdx });

  // 2. Frame
  if (model.frame.length > 0) {
    const frameMeshIdx = addLines(model.frame, 'Structural_Frame', 1);
    nodes.push({ name: 'Structural_Frame', mesh: frameMeshIdx });
  }

  // 3. Floors
  model.floors.forEach((floor, i) => {
    const floorMeshIdx = addMesh(floor, `Floor_${String(i + 1).padStart(2, '0')}`, 2);
    nodes.push({ name: `Floor_${String(i + 1).padStart(2, '0')}`, mesh: floorMeshIdx });
  });

  // 4. Core
  if (model.core.length > 0) {
    const coreMeshIdx = addPointCloud(model.core, 'Vertical_Core', 3);
    nodes.push({ name: 'Vertical_Core', mesh: coreMeshIdx });
  }

  // 5. Panels
  model.panels.forEach((panel, i) => {
    // Determine panel direction from position (simplified)
    const panelName = `Panel_${String(i + 1).padStart(2, '0')}`;
    const panelMeshIdx = addMesh(panel, panelName, 4);
    nodes.push({ name: panelName, mesh: panelMeshIdx });
  });

  // Materials
  const materials = [
    {
      name: 'Shell_Material',
      pbrMetallicRoughness: {
        baseColorFactor: [0.9, 0.9, 0.92, 1.0],
        metallicFactor: 0.1,
        roughnessFactor: 0.5
      }
    },
    {
      name: 'Frame_Material',
      pbrMetallicRoughness: {
        baseColorFactor: [0.3, 0.3, 0.3, 1.0],
        metallicFactor: 0.8,
        roughnessFactor: 0.2
      }
    },
    {
      name: 'Floor_Material',
      pbrMetallicRoughness: {
        baseColorFactor: [0.8, 0.75, 0.7, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 0.7
      }
    },
    {
      name: 'Core_Material',
      pbrMetallicRoughness: {
        baseColorFactor: [1.0, 0.5, 0.2, 1.0],
        metallicFactor: 0.0,
        roughnessFactor: 1.0
      }
    },
    {
      name: 'Panel_Material',
      pbrMetallicRoughness: {
        baseColorFactor: [0.7, 0.8, 0.9, 0.8],
        metallicFactor: 0.3,
        roughnessFactor: 0.4
      }
    }
  ];

  // Combine all buffers
  const totalBufferSize = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const combinedBuffer = new Uint8Array(totalBufferSize);
  let offset = 0;
  buffers.forEach(buf => {
    combinedBuffer.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  });

  // Build final glTF structure
  return {
    asset: {
      version: '2.0',
      generator: '3Dmandelbulb Architectural Export'
    },
    scene: 0,
    scenes: [{
      name: 'Architectural_Model',
      nodes: nodes.map((_, i) => i),
      extras: metadata
    }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: totalBufferSize }],
    binaryBuffer: combinedBuffer
  };
}

/**
 * Create GLB binary from glTF JSON structure
 */
function createGLBFromGLTF(gltf: any): ArrayBuffer {
  // Extract binary buffer
  const binaryData = gltf.binaryBuffer as Uint8Array;
  delete gltf.binaryBuffer;

  // Serialize JSON
  const jsonStr = JSON.stringify(gltf);
  const jsonBytes = new TextEncoder().encode(jsonStr);
  const jsonPadding = (4 - (jsonBytes.length % 4)) % 4;
  const jsonChunkLength = jsonBytes.length + jsonPadding;

  const binaryPadding = (4 - (binaryData.length % 4)) % 4;
  const binaryChunkLength = binaryData.length + binaryPadding;

  // GLB total length
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
  view.setUint32(offset, jsonChunkLength, true);
  offset += 4;
  view.setUint32(offset, 0x4E4F534A, true); // "JSON"
  offset += 4;
  bytes.set(jsonBytes, offset);
  offset += jsonBytes.length;
  for (let i = 0; i < jsonPadding; i++) {
    bytes[offset++] = 0x20; // space padding
  }

  // Binary chunk
  view.setUint32(offset, binaryChunkLength, true);
  offset += 4;
  view.setUint32(offset, 0x004E4942, true); // "BIN\0"
  offset += 4;
  bytes.set(binaryData, offset);
  offset += binaryData.length;
  for (let i = 0; i < binaryPadding; i++) {
    bytes[offset++] = 0x00; // zero padding
  }

  return glb;
}
