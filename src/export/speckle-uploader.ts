/**
 * Speckle Cloud Integration
 *
 * Uploads architectural models to Speckle BIM platform for:
 * - Revit, Rhino, Grasshopper, Blender integration
 * - Real-time collaboration
 * - Version control
 * - Cloud storage
 */

import type { ArchitecturalModel, Mesh, LineSegment } from '../pipelines/build-architectural-model';

/**
 * Speckle configuration
 */
export interface SpeckleConfig {
  serverUrl: string;       // Default: https://speckle.xyz
  token: string;           // Personal Access Token
  streamId?: string;       // Optional: existing stream ID
  branchName?: string;     // Default: 'main'
  commitMessage?: string;  // Default: auto-generated
}

/**
 * Speckle upload result
 */
export interface SpeckleUploadResult {
  success: boolean;
  streamId: string;
  commitId: string;
  objectId: string;
  url: string;
  error?: string;
}

/**
 * Speckle Base object (simplified)
 */
interface SpeckleBase {
  speckle_type: string;
  id?: string;
  applicationId?: string;
  totalChildrenCount?: number;
  [key: string]: any;
}

/**
 * Speckle Mesh object
 */
interface SpeckleMesh extends SpeckleBase {
  speckle_type: 'Objects.Geometry.Mesh';
  vertices: number[];      // Flattened [x,y,z,x,y,z,...]
  faces: number[];         // [n, i1, i2, ..., in, n, ...]
  colors?: number[];       // Optional vertex colors
  textureCoordinates?: number[];
  bbox?: {
    min: { x: number; y: number; z: number };
    max: { x: number; y: number; z: number };
  };
}

/**
 * Speckle Line object
 */
interface SpeckleLine extends SpeckleBase {
  speckle_type: 'Objects.Geometry.Line';
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  length?: number;
  domain?: { start: number; end: number };
}

/**
 * Convert 3Dmandelbulb Mesh to Speckle Mesh
 */
function meshToSpeckleMesh(mesh: Mesh, name: string): SpeckleMesh {
  const { positions, normals, indices } = mesh;

  // Flatten vertices
  const vertices: number[] = [];
  for (let i = 0; i < positions.length; i += 3) {
    vertices.push(positions[i], positions[i + 1], positions[i + 2]);
  }

  // Convert indices to Speckle face format: [n, i1, i2, ..., in, n, ...]
  // Assuming triangles (n=3)
  const faces: number[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    faces.push(3); // Triangle
    faces.push(indices[i], indices[i + 1], indices[i + 2]);
  }

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

  return {
    speckle_type: 'Objects.Geometry.Mesh',
    vertices,
    faces,
    bbox: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ }
    },
    name,
    units: 'm'
  };
}

/**
 * Convert LineSegment to Speckle Line
 */
function lineSegmentToSpeckleLine(segment: LineSegment, name: string): SpeckleLine {
  const { start, end } = segment;

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    speckle_type: 'Objects.Geometry.Line',
    start: { x: start.x, y: start.y, z: start.z },
    end: { x: end.x, y: end.y, z: end.z },
    length,
    domain: { start: 0, end: 1 },
    name,
    units: 'm'
  };
}

/**
 * Convert ArchitecturalModel to Speckle Base object
 */
function architecturalModelToSpeckle(model: ArchitecturalModel, metadata: any = {}): SpeckleBase {
  const root: SpeckleBase = {
    speckle_type: 'Base',
    name: metadata.name || '3Dmandelbulb Architecture',
    description: metadata.description || 'Fractal-derived architectural model',
    applicationId: '3Dmandelbulb',
    ...metadata
  };

  // Convert Shell mesh
  if (model.shell) {
    root['@shell'] = meshToSpeckleMesh(model.shell, 'Shell');
  }

  // Convert Frame lines
  if (model.frame && model.frame.length > 0) {
    root['@frame'] = model.frame.map((line, i) =>
      lineSegmentToSpeckleLine(line, `Frame_${i}`)
    );
  }

  // Convert Floors
  if (model.floors && model.floors.length > 0) {
    root['@floors'] = model.floors.map((floor, i) =>
      meshToSpeckleMesh(floor, `Floor_${i}`)
    );
  }

  // Convert Core points (as polyline)
  if (model.core && model.core.length > 0) {
    const coreVertices: number[] = [];
    for (const point of model.core) {
      coreVertices.push(point.x, point.y, point.z);
    }

    root['@core'] = {
      speckle_type: 'Objects.Geometry.Polyline',
      value: coreVertices,
      closed: false,
      name: 'Core',
      units: 'm'
    };
  }

  // Convert Panels
  if (model.panels && model.panels.length > 0) {
    root['@panels'] = model.panels.map((panel, i) =>
      meshToSpeckleMesh(panel, `Panel_${i}`)
    );
  }

  return root;
}

/**
 * Upload architectural model to Speckle
 *
 * Note: This is a simplified implementation using Speckle REST API.
 * For production, use the official @speckle/objectloader package.
 */
export async function uploadToSpeckle(
  model: ArchitecturalModel,
  config: SpeckleConfig,
  metadata: any = {},
  onProgress?: (message: string, progress: number) => void
): Promise<SpeckleUploadResult> {
  try {
    onProgress?.('Converting to Speckle format...', 0.1);

    // Convert model to Speckle objects
    const speckleObject = architecturalModelToSpeckle(model, metadata);

    onProgress?.('Creating/getting stream...', 0.3);

    // Get or create stream
    let streamId = config.streamId;
    if (!streamId) {
      streamId = await createStream(config.serverUrl, config.token, {
        name: metadata.name || '3Dmandelbulb Architecture',
        description: metadata.description || 'Fractal-derived architectural model',
        isPublic: true
      });
    }

    onProgress?.('Uploading objects...', 0.5);

    // Upload objects (simplified - in production use ObjectLoader)
    const objectId = await uploadObjects(config.serverUrl, config.token, streamId, speckleObject);

    onProgress?.('Creating commit...', 0.8);

    // Create commit
    const branchName = config.branchName || 'main';
    const commitMessage = config.commitMessage || `3Dmandelbulb export - ${new Date().toISOString()}`;

    const commitId = await createCommit(config.serverUrl, config.token, streamId, branchName, objectId, commitMessage);

    onProgress?.('Upload complete!', 1.0);

    const url = `${config.serverUrl}/streams/${streamId}/commits/${commitId}`;

    return {
      success: true,
      streamId,
      commitId,
      objectId,
      url
    };

  } catch (error) {
    console.error('Speckle upload failed:', error);
    return {
      success: false,
      streamId: '',
      commitId: '',
      objectId: '',
      url: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Create a new stream
 */
async function createStream(serverUrl: string, token: string, streamData: { name: string; description: string; isPublic: boolean }): Promise<string> {
  const query = `
    mutation StreamCreate($stream: StreamCreateInput!) {
      streamCreate(stream: $stream)
    }
  `;

  const variables = {
    stream: streamData
  };

  const response = await fetch(`${serverUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Failed to create stream: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors[0].message}`);
  }

  return result.data.streamCreate;
}

/**
 * Upload objects to Speckle
 * (Simplified - uses JSON serialization instead of proper ObjectLoader)
 */
async function uploadObjects(serverUrl: string, token: string, streamId: string, obj: SpeckleBase): Promise<string> {
  // Generate object ID (simplified)
  const objectId = generateId();
  obj.id = objectId;

  // Flatten object tree
  const objects = flattenObject(obj);

  // Upload via REST API
  const response = await fetch(`${serverUrl}/api/getobjects/${streamId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(objects)
  });

  if (!response.ok) {
    throw new Error(`Failed to upload objects: ${response.statusText}`);
  }

  return objectId;
}

/**
 * Create a commit
 */
async function createCommit(serverUrl: string, token: string, streamId: string, branchName: string, objectId: string, message: string): Promise<string> {
  const query = `
    mutation CommitCreate($commit: CommitCreateInput!) {
      commitCreate(commit: $commit)
    }
  `;

  const variables = {
    commit: {
      streamId,
      branchName,
      objectId,
      message,
      sourceApplication: '3Dmandelbulb'
    }
  };

  const response = await fetch(`${serverUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Failed to create commit: ${response.statusText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(`GraphQL error: ${result.errors[0].message}`);
  }

  return result.data.commitCreate;
}

/**
 * Flatten object tree (simplified)
 */
function flattenObject(obj: any): any[] {
  const objects: any[] = [obj];

  // Recursively collect nested objects
  for (const key in obj) {
    if (key.startsWith('@') && obj[key]) {
      if (Array.isArray(obj[key])) {
        for (const item of obj[key]) {
          if (typeof item === 'object') {
            objects.push(...flattenObject(item));
          }
        }
      } else if (typeof obj[key] === 'object') {
        objects.push(...flattenObject(obj[key]));
      }
    }
  }

  return objects;
}

/**
 * Generate unique ID (simplified)
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
