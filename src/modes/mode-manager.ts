/**
 * Mode Manager
 *
 * Handles switching between Fractal Mode and Architecture Mode
 * Manages UI transitions and state persistence
 */

import { AppMode, ModeState, MODE_CONFIGS } from './mode-types';

export type ModeChangeCallback = (newMode: AppMode, oldMode: AppMode) => void;

export class ModeManager {
  private state: ModeState;
  private callbacks: ModeChangeCallback[] = [];

  constructor(initialMode: AppMode = AppMode.FRACTAL) {
    this.state = {
      current: initialMode,
      transitionDuration: 300 // ms
    };
  }

  /**
   * Get current mode
   */
  getCurrentMode(): AppMode {
    return this.state.current;
  }

  /**
   * Check if in specific mode
   */
  isMode(mode: AppMode): boolean {
    return this.state.current === mode;
  }

  /**
   * Check if in fractal mode
   */
  isFractalMode(): boolean {
    return this.isMode(AppMode.FRACTAL);
  }

  /**
   * Check if in architecture mode
   */
  isArchitectureMode(): boolean {
    return this.isMode(AppMode.ARCHITECTURE);
  }

  /**
   * Switch to specific mode
   */
  switchToMode(mode: AppMode): void {
    if (this.state.current === mode) {
      console.log(`Already in ${mode} mode`);
      return;
    }

    const oldMode = this.state.current;
    this.state.previousMode = oldMode;
    this.state.current = mode;

    console.log(`🔄 Mode switch: ${oldMode} → ${mode}`);

    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(mode, oldMode);
      } catch (error) {
        console.error('Mode change callback error:', error);
      }
    });

    // Save to localStorage
    this.saveMode();
  }

  /**
   * Toggle between modes
   */
  toggleMode(): void {
    const newMode = this.state.current === AppMode.FRACTAL
      ? AppMode.ARCHITECTURE
      : AppMode.FRACTAL;

    this.switchToMode(newMode);
  }

  /**
   * Register callback for mode changes
   */
  onModeChange(callback: ModeChangeCallback): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get mode configuration
   */
  getModeConfig(mode?: AppMode): typeof MODE_CONFIGS[AppMode] {
    return MODE_CONFIGS[mode || this.state.current];
  }

  /**
   * Save current mode to localStorage
   */
  private saveMode(): void {
    try {
      localStorage.setItem('appMode', this.state.current);
    } catch (error) {
      console.warn('Failed to save mode to localStorage:', error);
    }
  }

  /**
   * Load mode from localStorage
   */
  loadMode(): void {
    try {
      const savedMode = localStorage.getItem('appMode') as AppMode;
      if (savedMode && (savedMode === AppMode.FRACTAL || savedMode === AppMode.ARCHITECTURE)) {
        this.switchToMode(savedMode);
      }
    } catch (error) {
      console.warn('Failed to load mode from localStorage:', error);
    }
  }

  /**
   * Get transition duration
   */
  getTransitionDuration(): number {
    return this.state.transitionDuration;
  }

  /**
   * Set transition duration
   */
  setTransitionDuration(duration: number): void {
    this.state.transitionDuration = Math.max(0, duration);
  }
}

// Global singleton instance
export const modeManager = new ModeManager();
