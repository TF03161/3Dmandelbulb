/**
 * Application Mode Types
 *
 * Defines the two main modes:
 * - Fractal Mode: Original fractal visualization
 * - Architecture Mode: Building-focused parametric design
 */

export enum AppMode {
  FRACTAL = 'fractal',
  ARCHITECTURE = 'architecture'
}

export interface ModeState {
  current: AppMode;
  previousMode?: AppMode;
  transitionDuration: number; // ms
}

export interface ModeConfig {
  mode: AppMode;
  name: string;
  icon: string;
  description: string;
  uiElements: string[];
}

export const MODE_CONFIGS: Record<AppMode, ModeConfig> = {
  [AppMode.FRACTAL]: {
    mode: AppMode.FRACTAL,
    name: 'Fractal Mode',
    icon: '🌀',
    description: 'Pure fractal mathematics and artistic visualization',
    uiElements: [
      'fractal-parameters',
      'color-themes',
      'rendering-quality',
      'morphing-presets'
    ]
  },
  [AppMode.ARCHITECTURE]: {
    mode: AppMode.ARCHITECTURE,
    name: 'Architecture Mode',
    icon: '🏙️',
    description: 'Building-focused parametric architectural design',
    uiElements: [
      'building-type',
      'shape-generator',
      'floor-configuration',
      'facade-system',
      'structural-system',
      'code-compliance',
      'environmental'
    ]
  }
};
