/**
 * Facade Designer
 *
 * Advanced facade design system for architectural buildings
 * Provides detailed control over exterior cladding, panels, windows, and materials
 */

// Vec3 type - represents a 3D vector as Float32Array
type Vec3 = Float32Array;

// ====================================================================
// Facade Pattern Types
// ====================================================================

export enum FacadePattern {
  // Geometric Patterns
  GRID = 'grid',                    // Regular grid pattern
  DIAGONAL_GRID = 'diagonal-grid',  // 45° rotated grid
  HEXAGONAL = 'hexagonal',          // Hexagonal tessellation
  TRIANGULAR = 'triangular',        // Triangular pattern
  VORONOI = 'voronoi',              // Voronoi cell pattern

  // Parametric Patterns
  PARAMETRIC_WAVES = 'parametric-waves',    // Undulating wave pattern
  PARAMETRIC_FINS = 'parametric-fins',      // Vertical/horizontal fins
  PARAMETRIC_SCALES = 'parametric-scales',  // Fish-scale pattern

  // Curtain Wall
  CURTAIN_WALL = 'curtain-wall',    // Full glass curtain wall
  RIBBON_WINDOWS = 'ribbon-windows', // Horizontal ribbon windows
  PUNCHED_WINDOWS = 'punched-windows', // Traditional punched openings

  // Advanced
  FRACTAL = 'fractal',              // Fractal-based subdivision
  CELLULAR = 'cellular',            // Cellular automata pattern
  ORGANIC = 'organic'               // Organic flowing pattern
}

export enum PanelType {
  FLAT = 'flat',                    // Flat panel
  EXTRUDED = 'extruded',            // Extruded outward
  RECESSED = 'recessed',            // Recessed inward
  FOLDED = 'folded',                // Folded origami-style
  CURVED = 'curved'                 // Curved panel
}

export enum MaterialType {
  GLASS = 'glass',                  // Glass (transparent/reflective)
  METAL = 'metal',                  // Metal cladding
  CONCRETE = 'concrete',            // Concrete panels
  WOOD = 'wood',                    // Wood panels
  COMPOSITE = 'composite',          // Composite materials
  CERAMIC = 'ceramic',              // Ceramic tiles
  STONE = 'stone'                   // Natural stone
}

// ====================================================================
// Facade Design Parameters
// ====================================================================

export interface FacadeDesignParameters {
  // Pattern Configuration
  pattern: FacadePattern;
  patternScale: number;             // Pattern scale (0.5 - 5.0)
  patternRotation: number;          // Pattern rotation in degrees (0 - 360)
  patternRandomness: number;        // Randomness factor (0 - 1)

  // Panel System
  panelType: PanelType;
  panelWidth: number;               // Panel width in meters (0.5 - 5.0)
  panelHeight: number;              // Panel height in meters (0.5 - 5.0)
  panelDepth: number;               // Panel depth/extrusion (0 - 0.5m)
  panelRotation: number;            // Individual panel rotation (0 - 45°)
  panelGap: number;                 // Gap between panels (0 - 0.1m)

  // Window System
  windowRatio: number;              // Window-to-wall ratio (0 - 1)
  windowWidth: number;              // Window width (0.5 - 3.0m)
  windowHeight: number;             // Window height (0.5 - 3.0m)
  windowPattern: 'regular' | 'random' | 'gradient';
  windowRecess: number;             // Window recess depth (0 - 0.3m)
  mullionWidth: number;             // Mullion width (0.01 - 0.1m)

  // Material Properties
  primaryMaterial: MaterialType;
  secondaryMaterial: MaterialType;
  materialMix: number;              // Mix ratio (0 = all primary, 1 = all secondary)

  // Surface Treatment
  surfaceReflectivity: number;      // Surface reflectivity (0 - 1)
  surfaceRoughness: number;         // Surface roughness (0 - 1)
  surfaceMetallic: number;          // Metallic property (0 - 1)

  // Color System
  primaryColor: [number, number, number];    // RGB 0-1
  secondaryColor: [number, number, number];  // RGB 0-1
  colorGradient: boolean;           // Enable color gradient
  colorVariation: number;           // Color variation per panel (0 - 1)

  // Balcony System
  balconyEnabled: boolean;
  balconyRatio: number;             // Ratio of floors with balconies (0 - 1)
  balconyDepth: number;             // Balcony depth (0.5 - 3.0m)
  balconyWidth: number;             // Balcony width ratio (0.5 - 1.0)
  balconyRailing: boolean;          // Add railing
  balconyPattern: 'every-floor' | 'alternating' | 'random';

  // Shading System
  shadingEnabled: boolean;
  shadingType: 'horizontal' | 'vertical' | 'diagonal' | 'eggcrate';
  shadingDepth: number;             // Shading element depth (0.1 - 1.0m)
  shadingSpacing: number;           // Spacing between elements (0.2 - 2.0m)
  shadingAngle: number;             // Angle in degrees (0 - 90)

  // Lighting Integration
  backlitPanels: boolean;           // Backlit panels for night view
  ledStrips: boolean;               // LED strip integration
  lightingColor: [number, number, number]; // Lighting color RGB

  // Advanced Features
  parametricModulation: number;     // Parametric wave modulation (0 - 1)
  verticalGradient: boolean;        // Vary pattern/material by height
  cornerTreatment: 'sharp' | 'chamfered' | 'rounded';
  topCap: 'flat' | 'sloped' | 'curved' | 'crown';
}

// ====================================================================
// Facade Geometry Output
// ====================================================================

export interface FacadePanel {
  id: string;
  level: number;                    // Floor level
  position: Vec3;                   // Panel center position
  vertices: Vec3[];                 // Panel corner vertices
  normal: Vec3;                     // Panel normal vector
  type: PanelType;
  material: MaterialType;
  color: [number, number, number];
  depth: number;                    // Extrusion depth
  isWindow: boolean;
  isBalcony: boolean;
  metadata: {
    area: number;                   // Panel area in m²
    angle: number;                  // Panel angle to vertical
    illuminated: boolean;           // Is panel backlit?
  };
}

export interface FacadeGeometry {
  panels: FacadePanel[];
  windows: FacadePanel[];
  balconies: FacadePanel[];
  shadingElements: Array<{
    vertices: Vec3[];
    type: string;
  }>;
  totalArea: number;                // Total facade area
  glazingRatio: number;             // Actual glazing ratio
  materialBreakdown: Record<MaterialType, number>; // Material quantities
}

// ====================================================================
// Preset Facade Styles
// ====================================================================

export interface FacadePreset {
  name: string;
  description: string;
  icon: string;
  category: 'modern' | 'classic' | 'parametric' | 'organic' | 'minimalist';
  params: Partial<FacadeDesignParameters>;
}

export const FACADE_PRESETS: Record<string, FacadePreset> = {
  // Modern Styles
  curtainWall: {
    name: 'Curtain Wall',
    description: 'Full-height glass curtain wall with minimal framing',
    icon: '🏢',
    category: 'modern',
    params: {
      pattern: FacadePattern.CURTAIN_WALL,
      panelType: PanelType.FLAT,
      windowRatio: 0.9,
      primaryMaterial: MaterialType.GLASS,
      surfaceReflectivity: 0.7,
      mullionWidth: 0.05,
      balconyEnabled: false
    }
  },

  parametricFins: {
    name: 'Parametric Fins',
    description: 'Dynamic vertical fins with varying depths',
    icon: '📊',
    category: 'parametric',
    params: {
      pattern: FacadePattern.PARAMETRIC_FINS,
      panelType: PanelType.EXTRUDED,
      panelDepth: 0.3,
      patternScale: 2.0,
      parametricModulation: 0.8,
      primaryMaterial: MaterialType.METAL,
      surfaceMetallic: 0.8
    }
  },

  organicScales: {
    name: 'Organic Scales',
    description: 'Fish-scale pattern with curved panels',
    icon: '🐚',
    category: 'organic',
    params: {
      pattern: FacadePattern.PARAMETRIC_SCALES,
      panelType: PanelType.CURVED,
      panelDepth: 0.15,
      patternScale: 1.5,
      patternRandomness: 0.3,
      primaryMaterial: MaterialType.COMPOSITE,
      colorGradient: true,
      verticalGradient: true
    }
  },

  hexagonalGrid: {
    name: 'Hexagonal Grid',
    description: 'Geometric hexagonal tessellation',
    icon: '⬡',
    category: 'modern',
    params: {
      pattern: FacadePattern.HEXAGONAL,
      panelType: PanelType.FLAT,
      patternScale: 1.2,
      windowRatio: 0.4,
      primaryMaterial: MaterialType.COMPOSITE,
      secondaryMaterial: MaterialType.GLASS,
      materialMix: 0.5,
      panelGap: 0.02
    }
  },

  shadedBalconies: {
    name: 'Shaded Balconies',
    description: 'Balconies with horizontal shading elements',
    icon: '🏗️',
    category: 'classic',
    params: {
      pattern: FacadePattern.RIBBON_WINDOWS,
      balconyEnabled: true,
      balconyRatio: 0.7,
      balconyDepth: 1.5,
      balconyPattern: 'every-floor',
      shadingEnabled: true,
      shadingType: 'horizontal',
      shadingDepth: 0.5,
      primaryMaterial: MaterialType.CONCRETE
    }
  },

  fractalSubdivision: {
    name: 'Fractal Subdivision',
    description: 'Recursive fractal panel subdivision',
    icon: '🌀',
    category: 'parametric',
    params: {
      pattern: FacadePattern.FRACTAL,
      panelType: PanelType.RECESSED,
      patternScale: 2.5,
      panelDepth: 0.2,
      patternRandomness: 0.5,
      primaryMaterial: MaterialType.METAL,
      secondaryMaterial: MaterialType.GLASS,
      materialMix: 0.3,
      colorVariation: 0.4
    }
  },

  minimalistConcrete: {
    name: 'Minimalist Concrete',
    description: 'Clean punched windows in concrete',
    icon: '⬜',
    category: 'minimalist',
    params: {
      pattern: FacadePattern.PUNCHED_WINDOWS,
      panelType: PanelType.FLAT,
      windowRatio: 0.3,
      windowWidth: 1.5,
      windowHeight: 2.0,
      windowRecess: 0.2,
      primaryMaterial: MaterialType.CONCRETE,
      surfaceRoughness: 0.8,
      primaryColor: [0.85, 0.85, 0.85],
      balconyEnabled: false
    }
  },

  voronoiCellular: {
    name: 'Voronoi Cellular',
    description: 'Organic cellular pattern with varied panel sizes',
    icon: '🔷',
    category: 'organic',
    params: {
      pattern: FacadePattern.VORONOI,
      panelType: PanelType.FOLDED,
      patternScale: 1.8,
      patternRandomness: 0.7,
      panelDepth: 0.15,
      primaryMaterial: MaterialType.CERAMIC,
      colorGradient: true,
      colorVariation: 0.5,
      verticalGradient: true
    }
  },

  ledBacklit: {
    name: 'LED Backlit',
    description: 'Translucent panels with LED backlighting',
    icon: '💡',
    category: 'modern',
    params: {
      pattern: FacadePattern.GRID,
      panelType: PanelType.FLAT,
      primaryMaterial: MaterialType.COMPOSITE,
      surfaceReflectivity: 0.3,
      surfaceRoughness: 0.5,
      backlitPanels: true,
      ledStrips: true,
      lightingColor: [0.0, 1.0, 0.8],
      patternScale: 1.5,
      panelGap: 0.05
    }
  },

  diagonalDynamic: {
    name: 'Diagonal Dynamic',
    description: 'Diagonal grid with rotating panels',
    icon: '⚡',
    category: 'parametric',
    params: {
      pattern: FacadePattern.DIAGONAL_GRID,
      panelType: PanelType.EXTRUDED,
      patternRotation: 45,
      panelRotation: 15,
      panelDepth: 0.25,
      parametricModulation: 0.6,
      primaryMaterial: MaterialType.METAL,
      surfaceMetallic: 0.9,
      surfaceReflectivity: 0.6
    }
  }
};

// ====================================================================
// Default Parameters
// ====================================================================

export const DEFAULT_FACADE_PARAMS: FacadeDesignParameters = {
  pattern: FacadePattern.GRID,
  patternScale: 1.0,
  patternRotation: 0,
  patternRandomness: 0,

  panelType: PanelType.FLAT,
  panelWidth: 1.5,
  panelHeight: 3.0,
  panelDepth: 0.1,
  panelRotation: 0,
  panelGap: 0.02,

  windowRatio: 0.5,
  windowWidth: 1.2,
  windowHeight: 1.5,
  windowPattern: 'regular',
  windowRecess: 0.1,
  mullionWidth: 0.05,

  primaryMaterial: MaterialType.CONCRETE,
  secondaryMaterial: MaterialType.GLASS,
  materialMix: 0.5,

  surfaceReflectivity: 0.2,
  surfaceRoughness: 0.7,
  surfaceMetallic: 0.0,

  primaryColor: [0.8, 0.8, 0.8],
  secondaryColor: [0.3, 0.3, 0.3],
  colorGradient: false,
  colorVariation: 0.1,

  balconyEnabled: false,
  balconyRatio: 0.3,
  balconyDepth: 1.5,
  balconyWidth: 0.8,
  balconyRailing: true,
  balconyPattern: 'alternating',

  shadingEnabled: false,
  shadingType: 'horizontal',
  shadingDepth: 0.5,
  shadingSpacing: 1.0,
  shadingAngle: 45,

  backlitPanels: false,
  ledStrips: false,
  lightingColor: [1.0, 1.0, 1.0],

  parametricModulation: 0.0,
  verticalGradient: false,
  cornerTreatment: 'sharp',
  topCap: 'flat'
};
