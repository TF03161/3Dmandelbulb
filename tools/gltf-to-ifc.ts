#!/usr/bin/env tsx
/**
 * glTF to IFC Converter CLI
 *
 * Converts architectural GLTF files to IFC (Industry Foundation Classes) format
 * for use in BIM software (Revit, ArchiCAD, Tekla, etc.)
 *
 * Usage:
 *   npm run gltf-to-ifc -- input.gltf output.ifc
 *   npm run gltf-to-ifc -- input.gltf output.ifc --project-name "My Building"
 */

import * as fs from 'fs';
import * as path from 'path';

interface ConversionOptions {
  projectName?: string;
  author?: string;
  organization?: string;
  latitude?: number;
  longitude?: number;
}

interface GLTFNode {
  name?: string;
  mesh?: number;
}

interface GLTFMesh {
  name?: string;
  primitives: Array<{
    attributes: { POSITION: number; NORMAL?: number };
    indices?: number;
    mode?: number;
  }>;
}

interface GLTFAccessor {
  bufferView?: number;
  componentType: number;
  count: number;
  type: string;
  min?: number[];
  max?: number[];
}

interface GLTFBufferView {
  buffer: number;
  byteOffset: number;
  byteLength: number;
}

interface GLTFBuffer {
  byteLength: number;
  uri?: string;
}

interface GLTF {
  asset: { version: string };
  scenes: Array<{ name?: string; nodes: number[]; extras?: any }>;
  nodes: GLTFNode[];
  meshes: GLTFMesh[];
  accessors: GLTFAccessor[];
  bufferViews: GLTFBufferView[];
  buffers: GLTFBuffer[];
}

/**
 * Main conversion function
 */
async function convertGLTFToIFC(
  inputPath: string,
  outputPath: string,
  options: ConversionOptions = {}
): Promise<void> {
  console.log('🔄 Converting glTF to IFC...');
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);

  // Read GLTF file
  const gltfContent = fs.readFileSync(inputPath, 'utf-8');
  const gltf: GLTF = JSON.parse(gltfContent);

  console.log('✅ GLTF loaded successfully');
  console.log(`   Nodes: ${gltf.nodes.length}`);
  console.log(`   Meshes: ${gltf.meshes.length}`);

  // Extract metadata
  const metadata = gltf.scenes[0]?.extras || {};

  // Generate IFC content
  const ifcContent = generateIFC(gltf, metadata, options);

  // Write IFC file
  fs.writeFileSync(outputPath, ifcContent, 'utf-8');

  const sizeKB = (ifcContent.length / 1024).toFixed(2);
  console.log(`✅ IFC file created: ${sizeKB} KB`);
}

/**
 * Generate IFC 4.0 SPF content
 */
function generateIFC(gltf: GLTF, metadata: any, options: ConversionOptions): string {
  const lines: string[] = [];
  let id = 1;

  // Header
  lines.push('ISO-10303-21;');
  lines.push('HEADER;');
  lines.push("FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');");

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '');
  const author = options.author || 'Claude';
  const org = options.organization || '3Dmandelbulb';
  const projectName = options.projectName || metadata.fractal_seed || 'Architectural Model';

  lines.push(
    `FILE_NAME('${path.basename(outputPath)}','${timestamp}',('${author}'),('${org}'),'IFC Converter v1.0','','');`
  );
  lines.push("FILE_SCHEMA(('IFC4'));");
  lines.push('ENDSEC;');
  lines.push('');
  lines.push('DATA;');

  // 1. IfcProject
  const projectId = id++;
  lines.push(`#${projectId}= IFCPROJECT('${guid()}',#${id},'${projectName}',$,$,$,$,$,$);`);

  // 2. IfcOwnerHistory
  const ownerHistoryId = id++;
  lines.push(
    `#${ownerHistoryId}= IFCOWNERHISTORY(#${id},#${id + 1},$,.ADDED.,$,$,$,${Math.floor(Date.now() / 1000)});`
  );

  // 3. IfcPerson
  const personId = id++;
  lines.push(`#${personId}= IFCPERSON($,'${author}',$,$,$,$,$,$);`);

  // 4. IfcOrganization
  const organizationId = id++;
  lines.push(`#${organizationId}= IFCORGANIZATION($,'${org}',$,$,$);`);

  // 5. IfcPersonAndOrganization
  const personAndOrgId = id++;
  lines.push(`#${personAndOrgId}= IFCPERSONANDORGANIZATION(#${personId},#${organizationId},$);`);

  // 6. IfcApplication
  const applicationId = id++;
  lines.push(`#${applicationId}= IFCAPPLICATION(#${organizationId},'1.0','3Dmandelbulb Converter','IFC Exporter');`);

  // 7. IfcSite
  const siteId = id++;
  const lat = options.latitude || 35.6762;
  const lon = options.longitude || 139.6503;
  lines.push(`#${siteId}= IFCSITE('${guid()}',#${ownerHistoryId},'Site',$,$,#${id},$,$,.ELEMENT.,$,$,$,$,$);`);

  // 8. IfcLocalPlacement (Site)
  const sitePlacementId = id++;
  lines.push(`#${sitePlacementId}= IFCLOCALPLACEMENT($,#${id});`);

  // 9. IfcAxis2Placement3D (Site origin)
  const siteAxis2PlacementId = id++;
  lines.push(`#${siteAxis2PlacementId}= IFCAXIS2PLACEMENT3D(#${id},$,$);`);

  // 10. IfcCartesianPoint (Origin)
  const originId = id++;
  lines.push(`#${originId}= IFCCARTESIANPOINT((0.,0.,0.));`);

  // 11. IfcBuilding
  const buildingId = id++;
  lines.push(`#${buildingId}= IFCBUILDING('${guid()}',#${ownerHistoryId},'Building',$,$,#${id},$,$,.ELEMENT.,$,$,$);`);

  // 12. IfcLocalPlacement (Building)
  const buildingPlacementId = id++;
  lines.push(`#${buildingPlacementId}= IFCLOCALPLACEMENT(#${sitePlacementId},#${id});`);

  // 13. IfcAxis2Placement3D (Building)
  const buildingAxis2PlacementId = id++;
  lines.push(`#${buildingAxis2PlacementId}= IFCAXIS2PLACEMENT3D(#${originId},$,$);`);

  // 14-N. Building Storeys (Floors)
  const floorHeights = metadata.floor_heights || [0];
  const storyIds: number[] = [];

  floorHeights.forEach((height: number, idx: number) => {
    const storyId = id++;
    storyIds.push(storyId);

    lines.push(
      `#${storyId}= IFCBUILDINGSTOREY('${guid()}',#${ownerHistoryId},'Floor ${idx + 1}',$,$,#${id},$,$,.ELEMENT.,${height.toFixed(3)});`
    );

    // Story placement
    const storyPlacementId = id++;
    lines.push(`#${storyPlacementId}= IFCLOCALPLACEMENT(#${buildingPlacementId},#${id});`);

    // Story axis (elevated by height)
    const storyAxisId = id++;
    const storyOriginId = id++;
    lines.push(`#${storyAxisId}= IFCAXIS2PLACEMENT3D(#${storyOriginId},$,$);`);
    lines.push(`#${storyOriginId}= IFCCARTESIANPOINT((0.,0.,${height.toFixed(3)}));`);
  });

  // Convert GLTF nodes to IFC elements
  gltf.nodes.forEach((node) => {
    const nodeName = node.name || 'Unnamed';

    if (nodeName.includes('Shell')) {
      // Shell → IfcWall
      const wallId = id++;
      const storyRef = storyIds[0] || buildingId;
      lines.push(
        `#${wallId}= IFCWALL('${guid()}',#${ownerHistoryId},'${nodeName}',$,$,#${storyRef},$,$,$);`
      );
    } else if (nodeName.includes('Frame')) {
      // Frame → IfcColumn
      const columnId = id++;
      const storyRef = storyIds[0] || buildingId;
      lines.push(
        `#${columnId}= IFCCOLUMN('${guid()}',#${ownerHistoryId},'${nodeName}',$,$,#${storyRef},$,$,$);`
      );
    } else if (nodeName.includes('Floor')) {
      // Floor → IfcSlab
      const slabId = id++;
      const floorIdx = parseInt(nodeName.match(/\d+/)?.[0] || '0') - 1;
      const storyRef = storyIds[Math.max(0, floorIdx)] || buildingId;
      lines.push(
        `#${slabId}= IFCSLAB('${guid()}',#${ownerHistoryId},'${nodeName}',$,$,#${storyRef},$,$,.FLOOR.);`
      );
    } else if (nodeName.includes('Core')) {
      // Core → IfcColumn (structural core)
      const coreId = id++;
      const storyRef = storyIds[0] || buildingId;
      lines.push(
        `#${coreId}= IFCCOLUMN('${guid()}',#${ownerHistoryId},'${nodeName}',$,$,#${storyRef},$,$,$);`
      );
    } else if (nodeName.includes('Panel')) {
      // Panel → IfcCurtainWall
      const panelId = id++;
      const storyRef = storyIds[0] || buildingId;
      lines.push(
        `#${panelId}= IFCCURTAINWALL('${guid()}',#${ownerHistoryId},'${nodeName}',$,$,#${storyRef},$,$,$);`
      );
    }
  });

  // Relationships
  // IfcRelAggregates (Project contains Site)
  const relAggregates1 = id++;
  lines.push(
    `#${relAggregates1}= IFCRELAGGREGATES('${guid()}',#${ownerHistoryId},$,$,#${projectId},(#${siteId}));`
  );

  // IfcRelAggregates (Site contains Building)
  const relAggregates2 = id++;
  lines.push(
    `#${relAggregates2}= IFCRELAGGREGATES('${guid()}',#${ownerHistoryId},$,$,#${siteId},(#${buildingId}));`
  );

  // IfcRelAggregates (Building contains Storeys)
  if (storyIds.length > 0) {
    const relAggregates3 = id++;
    const storyList = storyIds.map((id) => `#${id}`).join(',');
    lines.push(
      `#${relAggregates3}= IFCRELAGGREGATES('${guid()}',#${ownerHistoryId},$,$,#${buildingId},(${storyList}));`
    );
  }

  lines.push('ENDSEC;');
  lines.push('END-ISO-10303-21;');

  return lines.join('\n');
}

/**
 * Generate IFC GUID (22 characters, Base64-like)
 */
function guid(): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_$';
  let result = '';
  for (let i = 0; i < 22; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): { input: string; output: string; options: ConversionOptions } {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npm run gltf-to-ifc -- <input.gltf> <output.ifc> [options]');
    console.error('\nOptions:');
    console.error('  --project-name <name>      Project name (default: from GLTF metadata)');
    console.error('  --author <name>            Author name (default: Claude)');
    console.error('  --organization <name>      Organization name (default: 3Dmandelbulb)');
    console.error('  --latitude <lat>           Latitude (default: 35.6762)');
    console.error('  --longitude <lon>          Longitude (default: 139.6503)');
    process.exit(1);
  }

  const input = args[0];
  const output = args[1];
  const options: ConversionOptions = {};

  for (let i = 2; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    if (key === '--project-name') options.projectName = value;
    else if (key === '--author') options.author = value;
    else if (key === '--organization') options.organization = value;
    else if (key === '--latitude') options.latitude = parseFloat(value);
    else if (key === '--longitude') options.longitude = parseFloat(value);
  }

  return { input, output, options };
}

// Main execution
if (require.main === module) {
  try {
    const { input, output, options } = parseArgs();

    if (!fs.existsSync(input)) {
      console.error(`❌ Input file not found: ${input}`);
      process.exit(1);
    }

    convertGLTFToIFC(input, output, options);
  } catch (error) {
    console.error('❌ Conversion failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
