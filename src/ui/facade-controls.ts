/**
 * Facade Design Controls
 * Separate UI module for advanced facade design parameters
 */

import type GUI from 'lil-gui';
import {
  FacadePattern,
  PanelType,
  MaterialType,
  DEFAULT_FACADE_PARAMS,
  FACADE_PRESETS,
  type FacadeDesignParameters
} from '../generators/facade-designer';

/**
 * Add Advanced Facade Design folder to Architecture Mode GUI
 */
export function addFacadeDesignControls(parentFolder: GUI, onUpdate?: () => void): FacadeDesignParameters {
  const facadeParams = { ...DEFAULT_FACADE_PARAMS };

  // Helper to trigger updates
  const triggerUpdate = () => {
    if (onUpdate) onUpdate();
  };

  // Advanced Facade Folder
  const advFacadeFolder = parentFolder.addFolder('🎨 Advanced Facade Design');

  // Facade Pattern Selection
  const patternFolder = advFacadeFolder.addFolder('📐 Pattern');
  const patternOptions = {
    'Grid': FacadePattern.GRID,
    'Diagonal Grid': FacadePattern.DIAGONAL_GRID,
    'Hexagonal': FacadePattern.HEXAGONAL,
    'Triangular': FacadePattern.TRIANGULAR,
    'Voronoi Cells': FacadePattern.VORONOI,
    'Parametric Waves': FacadePattern.PARAMETRIC_WAVES,
    'Parametric Fins': FacadePattern.PARAMETRIC_FINS,
    'Parametric Scales': FacadePattern.PARAMETRIC_SCALES,
    'Curtain Wall': FacadePattern.CURTAIN_WALL,
    'Ribbon Windows': FacadePattern.RIBBON_WINDOWS,
    'Punched Windows': FacadePattern.PUNCHED_WINDOWS,
    'Fractal': FacadePattern.FRACTAL,
    'Cellular': FacadePattern.CELLULAR,
    'Organic': FacadePattern.ORGANIC
  };
  patternFolder.add({ value: facadeParams.pattern }, 'value', patternOptions)
    .name('Pattern Type')
    .onChange((v: string) => {
      facadeParams.pattern = v as FacadePattern;
      console.log(`🎨 Facade pattern: ${v}`);
      triggerUpdate();
    });
  patternFolder.add(facadeParams, 'patternScale', 0.5, 5.0, 0.1).name('Pattern Scale').onChange(triggerUpdate);
  patternFolder.add(facadeParams, 'patternRotation', 0, 360, 5).name('Rotation (deg)').onChange(triggerUpdate);
  patternFolder.add(facadeParams, 'patternRandomness', 0, 1, 0.05).name('Randomness').onChange(triggerUpdate);

  // Panel System
  const panelFolder = advFacadeFolder.addFolder('📦 Panel System');
  const panelTypeOptions = {
    'Flat': PanelType.FLAT,
    'Extruded': PanelType.EXTRUDED,
    'Recessed': PanelType.RECESSED,
    'Folded': PanelType.FOLDED,
    'Curved': PanelType.CURVED
  };
  panelFolder.add({ value: facadeParams.panelType }, 'value', panelTypeOptions)
    .name('Panel Type')
    .onChange((v: string) => {
      facadeParams.panelType = v as PanelType;
      console.log(`📦 Panel type: ${v}`);
    });
  panelFolder.add(facadeParams, 'panelWidth', 0.5, 5.0, 0.1).name('Panel Width (m)');
  panelFolder.add(facadeParams, 'panelHeight', 0.5, 5.0, 0.1).name('Panel Height (m)');
  panelFolder.add(facadeParams, 'panelDepth', 0, 0.5, 0.01).name('Panel Depth (m)');
  panelFolder.add(facadeParams, 'panelRotation', 0, 45, 1).name('Panel Rotation (deg)');
  panelFolder.add(facadeParams, 'panelGap', 0, 0.1, 0.001).name('Panel Gap (m)');

  // Window System
  const windowFolder = advFacadeFolder.addFolder('🪟 Window System');
  windowFolder.add(facadeParams, 'windowRatio', 0, 1, 0.05).name('Window Ratio');
  windowFolder.add(facadeParams, 'windowWidth', 0.5, 3.0, 0.1).name('Window Width (m)');
  windowFolder.add(facadeParams, 'windowHeight', 0.5, 3.0, 0.1).name('Window Height (m)');
  const windowPatternOptions = {
    'Regular': 'regular',
    'Random': 'random',
    'Gradient': 'gradient'
  };
  windowFolder.add({ value: facadeParams.windowPattern }, 'value', windowPatternOptions)
    .name('Window Pattern')
    .onChange((v: string) => {
      facadeParams.windowPattern = v as any;
    });
  windowFolder.add(facadeParams, 'windowRecess', 0, 0.3, 0.01).name('Window Recess (m)');
  windowFolder.add(facadeParams, 'mullionWidth', 0.01, 0.1, 0.005).name('Mullion Width (m)');

  // Material System
  const materialFolder = advFacadeFolder.addFolder('🎭 Materials');
  const materialOptions = {
    'Glass': MaterialType.GLASS,
    'Metal': MaterialType.METAL,
    'Concrete': MaterialType.CONCRETE,
    'Wood': MaterialType.WOOD,
    'Composite': MaterialType.COMPOSITE,
    'Ceramic': MaterialType.CERAMIC,
    'Stone': MaterialType.STONE
  };
  materialFolder.add({ value: facadeParams.primaryMaterial }, 'value', materialOptions)
    .name('Primary Material')
    .onChange((v: string) => {
      facadeParams.primaryMaterial = v as MaterialType;
      console.log(`🎭 Primary material: ${v}`);
    });
  materialFolder.add({ value: facadeParams.secondaryMaterial }, 'value', materialOptions)
    .name('Secondary Material')
    .onChange((v: string) => {
      facadeParams.secondaryMaterial = v as MaterialType;
    });
  materialFolder.add(facadeParams, 'materialMix', 0, 1, 0.05).name('Material Mix');
  materialFolder.add(facadeParams, 'surfaceReflectivity', 0, 1, 0.05).name('Reflectivity');
  materialFolder.add(facadeParams, 'surfaceRoughness', 0, 1, 0.05).name('Roughness');
  materialFolder.add(facadeParams, 'surfaceMetallic', 0, 1, 0.05).name('Metallic');

  // Color System
  const colorFolder = advFacadeFolder.addFolder('🌈 Colors');
  const colorProxy = {
    primaryR: facadeParams.primaryColor[0] * 255,
    primaryG: facadeParams.primaryColor[1] * 255,
    primaryB: facadeParams.primaryColor[2] * 255,
    secondaryR: facadeParams.secondaryColor[0] * 255,
    secondaryG: facadeParams.secondaryColor[1] * 255,
    secondaryB: facadeParams.secondaryColor[2] * 255
  };
  colorFolder.add(colorProxy, 'primaryR', 0, 255, 1).name('Primary R').onChange((v: number) => {
    facadeParams.primaryColor[0] = v / 255;
  });
  colorFolder.add(colorProxy, 'primaryG', 0, 255, 1).name('Primary G').onChange((v: number) => {
    facadeParams.primaryColor[1] = v / 255;
  });
  colorFolder.add(colorProxy, 'primaryB', 0, 255, 1).name('Primary B').onChange((v: number) => {
    facadeParams.primaryColor[2] = v / 255;
  });
  colorFolder.add(colorProxy, 'secondaryR', 0, 255, 1).name('Secondary R').onChange((v: number) => {
    facadeParams.secondaryColor[0] = v / 255;
  });
  colorFolder.add(colorProxy, 'secondaryG', 0, 255, 1).name('Secondary G').onChange((v: number) => {
    facadeParams.secondaryColor[1] = v / 255;
  });
  colorFolder.add(colorProxy, 'secondaryB', 0, 255, 1).name('Secondary B').onChange((v: number) => {
    facadeParams.secondaryColor[2] = v / 255;
  });
  colorFolder.add(facadeParams, 'colorGradient').name('Color Gradient');
  colorFolder.add(facadeParams, 'colorVariation', 0, 1, 0.05).name('Color Variation');

  // Balcony System
  const balconyFolder = advFacadeFolder.addFolder('🏖️ Balcony System');
  balconyFolder.add(facadeParams, 'balconyEnabled').name('Enable Balconies');
  balconyFolder.add(facadeParams, 'balconyRatio', 0, 1, 0.05).name('Balcony Ratio');
  balconyFolder.add(facadeParams, 'balconyDepth', 0.5, 3.0, 0.1).name('Balcony Depth (m)');
  balconyFolder.add(facadeParams, 'balconyWidth', 0.5, 1.0, 0.05).name('Balcony Width Ratio');
  balconyFolder.add(facadeParams, 'balconyRailing').name('Add Railing');
  const balconyPatternOptions = {
    'Every Floor': 'every-floor',
    'Alternating': 'alternating',
    'Random': 'random'
  };
  balconyFolder.add({ value: facadeParams.balconyPattern }, 'value', balconyPatternOptions)
    .name('Balcony Pattern')
    .onChange((v: string) => {
      facadeParams.balconyPattern = v as any;
    });

  // Shading System
  const shadingFolder = advFacadeFolder.addFolder('🌤️ Shading System');
  shadingFolder.add(facadeParams, 'shadingEnabled').name('Enable Shading');
  const shadingTypeOptions = {
    'Horizontal': 'horizontal',
    'Vertical': 'vertical',
    'Diagonal': 'diagonal',
    'Egg-Crate': 'eggcrate'
  };
  shadingFolder.add({ value: facadeParams.shadingType }, 'value', shadingTypeOptions)
    .name('Shading Type')
    .onChange((v: string) => {
      facadeParams.shadingType = v as any;
    });
  shadingFolder.add(facadeParams, 'shadingDepth', 0.1, 1.0, 0.05).name('Shading Depth (m)');
  shadingFolder.add(facadeParams, 'shadingSpacing', 0.2, 2.0, 0.1).name('Shading Spacing (m)');
  shadingFolder.add(facadeParams, 'shadingAngle', 0, 90, 5).name('Shading Angle (deg)');

  // Lighting Integration
  const lightingFolder = advFacadeFolder.addFolder('💡 Lighting');
  lightingFolder.add(facadeParams, 'backlitPanels').name('Backlit Panels');
  lightingFolder.add(facadeParams, 'ledStrips').name('LED Strips');
  const lightColorProxy = {
    r: facadeParams.lightingColor[0] * 255,
    g: facadeParams.lightingColor[1] * 255,
    b: facadeParams.lightingColor[2] * 255
  };
  lightingFolder.add(lightColorProxy, 'r', 0, 255, 1).name('Light R').onChange((v: number) => {
    facadeParams.lightingColor[0] = v / 255;
  });
  lightingFolder.add(lightColorProxy, 'g', 0, 255, 1).name('Light G').onChange((v: number) => {
    facadeParams.lightingColor[1] = v / 255;
  });
  lightingFolder.add(lightColorProxy, 'b', 0, 255, 1).name('Light B').onChange((v: number) => {
    facadeParams.lightingColor[2] = v / 255;
  });

  // Advanced Features
  const advancedFolder = advFacadeFolder.addFolder('⚙️ Advanced');
  advancedFolder.add(facadeParams, 'parametricModulation', 0, 1, 0.05).name('Parametric Modulation');
  advancedFolder.add(facadeParams, 'verticalGradient').name('Vertical Gradient');
  const cornerOptions = {
    'Sharp': 'sharp',
    'Chamfered': 'chamfered',
    'Rounded': 'rounded'
  };
  advancedFolder.add({ value: facadeParams.cornerTreatment }, 'value', cornerOptions)
    .name('Corner Treatment')
    .onChange((v: string) => {
      facadeParams.cornerTreatment = v as any;
    });
  const topCapOptions = {
    'Flat': 'flat',
    'Sloped': 'sloped',
    'Curved': 'curved',
    'Crown': 'crown'
  };
  advancedFolder.add({ value: facadeParams.topCap }, 'value', topCapOptions)
    .name('Top Cap')
    .onChange((v: string) => {
      facadeParams.topCap = v as any;
    });

  // Facade Style Presets
  const facadePresetsFolder = advFacadeFolder.addFolder('🎭 Facade Presets');

  Object.entries(FACADE_PRESETS).forEach(([key, preset]) => {
    const applyPreset = () => {
      console.log(`🎨 Applying facade preset: ${preset.name}`);

      // Apply preset parameters
      Object.assign(facadeParams, preset.params);

      // Update all UI controllers to reflect new values
      advFacadeFolder.controllersRecursive().forEach((c: any) => c.updateDisplay());

      // Trigger update to renderer immediately
      triggerUpdate();

      // Force additional update after a short delay to ensure rendering
      setTimeout(() => {
        triggerUpdate();
      }, 100);

      console.log(`✅ Applied preset: ${preset.name}`, preset.params);
    };

    // Add button using the same pattern as Building Presets
    facadePresetsFolder.add({ preset: applyPreset }, 'preset').name(`${preset.icon} ${preset.name}`);
  });

  console.log('✅ Advanced Facade Design System initialized');

  // Return facade parameters for external use
  return facadeParams;
}
