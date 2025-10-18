#!/usr/bin/env ts-node
/**
 * Flower of Life Dome (FoLD) - GLB Exporter
 *
 * Fastest route: Command-line tool to export FoLD to GLB
 *
 * Usage:
 *   npx ts-node tools/export-fol-dome.ts --radius 15 --res 256 --out exports/fol-dome.glb
 */

import * as path from 'path';
import * as fs from 'fs';
import { sdfFoLDome, createDefaultFoLDParams, type FoLDParams, type Vec3 } from '../src/export/sdf/fol-dome';
import { marchingCubes, type BoundingBox } from '../src/export/marching/marching-cubes';
import { exportToGLB, calculateNormals } from '../src/export/writers/gltf-writer';

interface ExportConfig {
  /** Dome radius [meters] */
  radius: number;

  /** Grid resolution (cubic) */
  resolution: number;

  /** FoLD parameters */
  params: Partial<FoLDParams>;

  /** Output file path */
  outputPath: string;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): ExportConfig {
  const args = process.argv.slice(2);
  const config: ExportConfig = {
    radius: 15.0,
    resolution: 256,
    params: {},
    outputPath: 'exports/fol-dome-R15m.glb'
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--radius':
      case '-r':
        config.radius = parseFloat(next);
        i++;
        break;
      case '--res':
      case '--resolution':
        config.resolution = parseInt(next, 10);
        i++;
        break;
      case '--count':
        config.params.uFoLDomeCount = parseFloat(next);
        i++;
        break;
      case '--width':
        config.params.uFoLDomeWidth = parseFloat(next);
        i++;
        break;
      case '--thickness':
        config.params.uFoLDomeThickness = parseFloat(next);
        i++;
        break;
      case '--smooth':
        config.params.uFoLDomeSmooth = parseFloat(next);
        i++;
        break;
      case '--strength':
        config.params.uFoLDomeStrength = parseFloat(next);
        i++;
        break;
      case '--out':
      case '-o':
        config.outputPath = next;
        i++;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function printHelp(): void {
  console.log(`
Flower of Life Dome (FoLD) - GLB Exporter

Usage:
  npx ts-node tools/export-fol-dome.ts [options]

Options:
  --radius, -r <number>      Dome radius in meters (default: 15.0)
  --res <number>             Grid resolution (default: 256)
  --count <0..1>             Band count (default: 0.5)
  --width <0..1>             Band width (default: 0.20)
  --thickness <0..1>         Band thickness (default: 0.12)
  --smooth <0..1>            Smoothing factor (default: 0.08)
  --strength <0..1>          Field strength (default: 0.30)
  --out, -o <path>           Output GLB file path (default: exports/fol-dome-R15m.glb)
  --help, -h                 Show this help

Example:
  npx ts-node tools/export-fol-dome.ts --radius 15 --res 256 --count 0.50 --width 0.20 --thickness 0.12 --smooth 0.08 --strength 0.30 --out exports/fol-dome-R15m.glb
  `);
}

/**
 * Sample SDF on 3D grid
 */
function sampleScalarField(
  sdf: (p: Vec3, params: FoLDParams) => number,
  params: FoLDParams,
  bbox: BoundingBox,
  resolution: number
): number[][][] {
  console.log(`Sampling scalar field at resolution ${resolution}^3...`);

  const { min, max } = bbox;
  const dx = (max.x - min.x) / (resolution - 1);
  const dy = (max.y - min.y) / (resolution - 1);
  const dz = (max.z - min.z) / (resolution - 1);

  const field: number[][][] = [];

  let sampleCount = 0;
  const totalSamples = resolution * resolution * resolution;

  for (let iz = 0; iz < resolution; iz++) {
    const sliceZ: number[][] = [];
    const z = min.z + iz * dz;

    for (let iy = 0; iy < resolution; iy++) {
      const rowY: number[] = [];
      const y = min.y + iy * dy;

      for (let ix = 0; ix < resolution; ix++) {
        const x = min.x + ix * dx;
        const p: Vec3 = { x, y, z };
        const value = sdf(p, params);
        rowY.push(value);

        sampleCount++;
        if (sampleCount % 100000 === 0) {
          const percent = ((sampleCount / totalSamples) * 100).toFixed(1);
          process.stdout.write(`\rSampling: ${percent}%`);
        }
      }
      sliceZ.push(rowY);
    }
    field.push(sliceZ);
  }

  process.stdout.write('\rSampling: 100.0%\n');
  return field;
}

/**
 * Main export function
 */
async function exportFoLDome(config: ExportConfig): Promise<void> {
  console.log('='.repeat(60));
  console.log('Flower of Life Dome (FoLD) - GLB Exporter');
  console.log('='.repeat(60));

  // Merge parameters
  const defaults = createDefaultFoLDParams();
  const params: FoLDParams = {
    ...defaults,
    uFoLDomeRadius: config.radius,
    ...config.params
  };

  console.log('\nParameters:');
  console.log(`  Radius:     ${params.uFoLDomeRadius.toFixed(2)} m`);
  console.log(`  Count:      ${params.uFoLDomeCount.toFixed(2)} (≈${Math.round(6 + 24 * params.uFoLDomeCount)} bands)`);
  console.log(`  Width:      ${params.uFoLDomeWidth.toFixed(2)}`);
  console.log(`  Thickness:  ${params.uFoLDomeThickness.toFixed(2)}`);
  console.log(`  Smooth:     ${params.uFoLDomeSmooth.toFixed(2)}`);
  console.log(`  Strength:   ${params.uFoLDomeStrength.toFixed(2)}`);
  console.log(`  Resolution: ${config.resolution}^3`);

  // Calculate bounding box (sphere + margin)
  const margin = 1.5; // meters
  const R = params.uFoLDomeRadius;
  const bbox: BoundingBox = {
    min: { x: -(R + margin), y: -(R + margin), z: -(R + margin) },
    max: { x: (R + margin), y: (R + margin), z: (R + margin) }
  };

  console.log(`\nBounding box: [${bbox.min.x.toFixed(1)}, ${bbox.max.x.toFixed(1)}]^3 m`);

  // Sample scalar field
  const startSample = Date.now();
  const scalarField = sampleScalarField(sdfFoLDome, params, bbox, config.resolution);
  const sampleTime = ((Date.now() - startSample) / 1000).toFixed(1);
  console.log(`Sampling completed in ${sampleTime}s`);

  // Marching Cubes
  console.log('\nRunning Marching Cubes...');
  const startMC = Date.now();
  const result = marchingCubes(
    scalarField,
    bbox,
    [config.resolution, config.resolution, config.resolution],
    0.0 // isoLevel
  );
  const mcTime = ((Date.now() - startMC) / 1000).toFixed(1);

  const vertexCount = result.positions.length / 3;
  const triangleCount = result.indices.length / 3;

  console.log(`Marching Cubes completed in ${mcTime}s`);
  console.log(`  Vertices:  ${vertexCount.toLocaleString()}`);
  console.log(`  Triangles: ${triangleCount.toLocaleString()}`);

  // Calculate normals
  console.log('\nCalculating normals...');
  const startNorm = Date.now();
  const normals = calculateNormals(result.positions, result.indices);
  const normTime = ((Date.now() - startNorm) / 1000).toFixed(1);
  console.log(`Normals calculated in ${normTime}s`);

  // Ensure output directory exists
  const outputDir = path.dirname(config.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Export to GLB
  console.log(`\nExporting to ${config.outputPath}...`);
  const startExport = Date.now();
  await exportToGLB(result.positions, result.indices, normals, {
    outputPath: config.outputPath,
    meshName: `FoLDome_R${R.toFixed(0)}m`,
    sceneName: `FoLD_R${R.toFixed(0)}m_Scene`,
    material: {
      baseColor: [0.9, 0.9, 0.92, 1.0],
      metallic: 0.0,
      roughness: 0.6
    }
  });
  const exportTime = ((Date.now() - startExport) / 1000).toFixed(1);
  console.log(`GLB export completed in ${exportTime}s`);

  // File size
  const stats = fs.statSync(config.outputPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`File size: ${sizeMB} MB`);

  const totalTime = ((Date.now() - startSample) / 1000).toFixed(1);
  console.log(`\nTotal time: ${totalTime}s`);
  console.log('='.repeat(60));
  console.log('✓ Export complete!');
  console.log('='.repeat(60));
}

// Run
(async () => {
  try {
    const config = parseArgs();
    await exportFoLDome(config);
  } catch (error) {
    console.error('\n❌ Export failed:');
    console.error(error);
    process.exit(1);
  }
})();
