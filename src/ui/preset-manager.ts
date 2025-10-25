/**
 * Preset Manager
 *
 * Manages saving, loading, and organizing fractal parameter presets
 */

export interface PresetParams {
  mode: number;
  maxIterations: number;
  powerBase: number;
  powerAmp: number;
  scale: number;
  epsilon: number;
  maxSteps: number;
  aoIntensity: number;
  reflectivity: number;
  palSpeed: number;
  palSpread: number;
  juliaMix: number;
  twist: number;
  morphOn: number;
  fold: number;
  boxSize: number;
  mbScale: number;
  mbMinRadius: number;
  mbFixedRadius: number;
  mbIter: number;
  gyroLevel: number;
  gyroScale: number;
  gyroMod: number;
  colorMode: number;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  params: Partial<PresetParams>;
  createdAt: string;
  author?: string;
  tags?: string[];
}

export class PresetManager {
  private static readonly STORAGE_KEY = '3dmandelbulb_presets';
  private presets: Map<string, Preset> = new Map();

  constructor() {
    this.loadPresetsFromStorage();
  }

  /**
   * Save a new preset
   */
  savePreset(preset: Omit<Preset, 'id' | 'createdAt'>): Preset {
    const newPreset: Preset = {
      ...preset,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };

    this.presets.set(newPreset.id, newPreset);
    this.savePresetsToStorage();

    return newPreset;
  }

  /**
   * Load a preset by ID
   */
  loadPreset(id: string): Preset | undefined {
    return this.presets.get(id);
  }

  /**
   * Delete a preset
   */
  deletePreset(id: string): boolean {
    const deleted = this.presets.delete(id);
    if (deleted) {
      this.savePresetsToStorage();
    }
    return deleted;
  }

  /**
   * Get all presets
   */
  getAllPresets(): Preset[] {
    return Array.from(this.presets.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Get presets by category
   */
  getPresetsByCategory(category: string): Preset[] {
    return this.getAllPresets().filter(p => p.category === category);
  }

  /**
   * Get presets by tag
   */
  getPresetsByTag(tag: string): Preset[] {
    return this.getAllPresets().filter(p => p.tags?.includes(tag));
  }

  /**
   * Search presets by name or description
   */
  searchPresets(query: string): Preset[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPresets().filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Export presets to JSON
   */
  exportPresets(): string {
    const presets = this.getAllPresets();
    return JSON.stringify(presets, null, 2);
  }

  /**
   * Import presets from JSON
   */
  importPresets(json: string): number {
    try {
      const presets: Preset[] = JSON.parse(json);
      let imported = 0;

      for (const preset of presets) {
        // Generate new ID to avoid conflicts
        const newPreset = {
          ...preset,
          id: this.generateId(),
          createdAt: new Date().toISOString()
        };
        this.presets.set(newPreset.id, newPreset);
        imported++;
      }

      this.savePresetsToStorage();
      return imported;
    } catch (error) {
      console.error('Failed to import presets:', error);
      return 0;
    }
  }

  /**
   * Load presets from localStorage
   */
  private loadPresetsFromStorage(): void {
    try {
      const stored = localStorage.getItem(PresetManager.STORAGE_KEY);
      if (stored) {
        const presets: Preset[] = JSON.parse(stored);
        this.presets.clear();
        presets.forEach(p => this.presets.set(p.id, p));
      } else {
        // Load default presets if nothing in storage
        this.loadDefaultPresets();
      }
    } catch (error) {
      console.error('Failed to load presets from storage:', error);
      this.loadDefaultPresets();
    }
  }

  /**
   * Save presets to localStorage
   */
  private savePresetsToStorage(): void {
    try {
      const presets = this.getAllPresets();
      localStorage.setItem(PresetManager.STORAGE_KEY, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save presets to storage:', error);
    }
  }

  /**
   * Load default presets
   */
  private loadDefaultPresets(): void {
    const defaults: Omit<Preset, 'id' | 'createdAt'>[] = [
      {
        name: 'Classic Mandelbulb',
        description: 'The original Mandelbulb with power 8',
        category: 'Mandelbulb',
        author: '3Dmandelbulb',
        tags: ['classic', 'power8'],
        params: {
          mode: 0,
          powerBase: 8,
          powerAmp: 0,
          maxIterations: 15,
          scale: 1.5,
          colorMode: 0
        }
      },
      {
        name: 'Twisted Dream',
        description: 'Mandelbulb with dramatic twist effect',
        category: 'Mandelbulb',
        author: '3Dmandelbulb',
        tags: ['twisted', 'artistic'],
        params: {
          mode: 0,
          powerBase: 7,
          powerAmp: 1,
          maxIterations: 20,
          twist: 45,
          scale: 1.8,
          colorMode: 1
        }
      },
      {
        name: 'Box Cathedral',
        description: 'Mandelbox with architectural feel',
        category: 'Mandelbox',
        author: '3Dmandelbulb',
        tags: ['architecture', 'cubic'],
        params: {
          mode: 3,
          mbScale: 2.0,
          mbMinRadius: 0.5,
          mbFixedRadius: 1.0,
          mbIter: 15,
          scale: 2.0,
          colorMode: 2
        }
      },
      {
        name: 'Gyroid Waves',
        description: 'Flowing gyroid surface',
        category: 'Gyroid',
        author: '3Dmandelbulb',
        tags: ['minimal', 'smooth'],
        params: {
          mode: 5,
          gyroScale: 1.5,
          gyroLevel: 0.0,
          gyroMod: 0.3,
          scale: 1.0,
          colorMode: 3
        }
      },
      {
        name: 'Crystal Spikes',
        description: 'Sharp crystalline Mandelbulb',
        category: 'Mandelbulb',
        author: '3Dmandelbulb',
        tags: ['sharp', 'crystal'],
        params: {
          mode: 0,
          powerBase: 9,
          powerAmp: 0,
          maxIterations: 25,
          scale: 1.2,
          aoIntensity: 1.5,
          colorMode: 4
        }
      },
      {
        name: 'Soft Organic',
        description: 'Smooth, organic Mandelbulb forms',
        category: 'Mandelbulb',
        author: '3Dmandelbulb',
        tags: ['smooth', 'organic'],
        params: {
          mode: 0,
          powerBase: 5,
          powerAmp: 0.5,
          maxIterations: 12,
          scale: 2.0,
          colorMode: 5
        }
      },
      {
        name: 'Infinite Surface',
        description: 'Gyroid with high modulation',
        category: 'Gyroid',
        author: '3Dmandelbulb',
        tags: ['complex', 'infinite'],
        params: {
          mode: 5,
          gyroScale: 1.0,
          gyroLevel: 0.2,
          gyroMod: 0.8,
          scale: 1.5,
          colorMode: 6
        }
      },
      {
        name: 'Cubic Labyrinth',
        description: 'Complex Mandelbox structure',
        category: 'Mandelbox',
        author: '3Dmandelbulb',
        tags: ['complex', 'maze'],
        params: {
          mode: 3,
          mbScale: 2.5,
          mbMinRadius: 0.25,
          mbFixedRadius: 1.2,
          mbIter: 20,
          scale: 2.5,
          colorMode: 7
        }
      }
    ];

    defaults.forEach(preset => this.savePreset(preset));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

// Singleton instance
export const presetManager = new PresetManager();
