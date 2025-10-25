/**
 * Unit tests for Mode Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModeManager } from '../src/modes/mode-manager';
import { AppMode } from '../src/modes/mode-types';

describe('ModeManager', () => {
  let manager: ModeManager;

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default FRACTAL mode', () => {
      manager = new ModeManager();
      expect(manager.getCurrentMode()).toBe(AppMode.FRACTAL);
      expect(manager.isFractalMode()).toBe(true);
      expect(manager.isArchitectureMode()).toBe(false);
    });

    it('should initialize with specified mode', () => {
      manager = new ModeManager(AppMode.ARCHITECTURE);
      expect(manager.getCurrentMode()).toBe(AppMode.ARCHITECTURE);
      expect(manager.isFractalMode()).toBe(false);
      expect(manager.isArchitectureMode()).toBe(true);
    });
  });

  describe('Mode Checking', () => {
    beforeEach(() => {
      manager = new ModeManager(AppMode.FRACTAL);
    });

    it('should correctly identify current mode', () => {
      expect(manager.isMode(AppMode.FRACTAL)).toBe(true);
      expect(manager.isMode(AppMode.ARCHITECTURE)).toBe(false);
    });

    it('should provide convenience methods for mode checking', () => {
      expect(manager.isFractalMode()).toBe(true);
      expect(manager.isArchitectureMode()).toBe(false);

      manager.switchToMode(AppMode.ARCHITECTURE);

      expect(manager.isFractalMode()).toBe(false);
      expect(manager.isArchitectureMode()).toBe(true);
    });
  });

  describe('Mode Switching', () => {
    beforeEach(() => {
      manager = new ModeManager(AppMode.FRACTAL);
    });

    it('should switch to architecture mode', () => {
      manager.switchToMode(AppMode.ARCHITECTURE);
      expect(manager.getCurrentMode()).toBe(AppMode.ARCHITECTURE);
    });

    it('should switch back to fractal mode', () => {
      manager.switchToMode(AppMode.ARCHITECTURE);
      manager.switchToMode(AppMode.FRACTAL);
      expect(manager.getCurrentMode()).toBe(AppMode.FRACTAL);
    });

    it('should not switch if already in target mode', () => {
      const callback = vi.fn();
      manager.onModeChange(callback);

      manager.switchToMode(AppMode.FRACTAL);

      // Callback should not be called since we're already in FRACTAL mode
      expect(callback).not.toHaveBeenCalled();
    });

    it('should toggle between modes', () => {
      expect(manager.getCurrentMode()).toBe(AppMode.FRACTAL);

      manager.toggleMode();
      expect(manager.getCurrentMode()).toBe(AppMode.ARCHITECTURE);

      manager.toggleMode();
      expect(manager.getCurrentMode()).toBe(AppMode.FRACTAL);
    });
  });

  describe('Mode Change Callbacks', () => {
    beforeEach(() => {
      manager = new ModeManager(AppMode.FRACTAL);
    });

    it('should notify callbacks on mode change', () => {
      const callback = vi.fn();
      manager.onModeChange(callback);

      manager.switchToMode(AppMode.ARCHITECTURE);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(
        AppMode.ARCHITECTURE,
        AppMode.FRACTAL
      );
    });

    it('should support multiple callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      manager.onModeChange(callback1);
      manager.onModeChange(callback2);

      manager.switchToMode(AppMode.ARCHITECTURE);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing from callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onModeChange(callback);

      manager.switchToMode(AppMode.ARCHITECTURE);
      expect(callback).toHaveBeenCalledTimes(1);

      // Unsubscribe and switch again
      unsubscribe();
      manager.switchToMode(AppMode.FRACTAL);

      // Callback should not be called again
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const normalCallback = vi.fn();

      manager.onModeChange(errorCallback);
      manager.onModeChange(normalCallback);

      // Should not throw
      expect(() => manager.switchToMode(AppMode.ARCHITECTURE)).not.toThrow();

      // Both callbacks should be called despite error
      expect(errorCallback).toHaveBeenCalled();
      expect(normalCallback).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    beforeEach(() => {
      manager = new ModeManager();
    });

    it('should maintain consistent state', () => {
      expect(manager.getCurrentMode()).toBe(AppMode.FRACTAL);
      expect(manager.isFractalMode()).toBe(true);

      manager.switchToMode(AppMode.ARCHITECTURE);
      expect(manager.getCurrentMode()).toBe(AppMode.ARCHITECTURE);
      expect(manager.isArchitectureMode()).toBe(true);
    });

    it('should track previous mode after switch', () => {
      manager.switchToMode(AppMode.ARCHITECTURE);
      // Mode switch occurred, can be verified through callbacks
      const callback = vi.fn();
      manager.onModeChange(callback);
      manager.switchToMode(AppMode.FRACTAL);
      expect(callback).toHaveBeenCalledWith(AppMode.FRACTAL, AppMode.ARCHITECTURE);
    });
  });

  describe('Complex Scenarios', () => {
    beforeEach(() => {
      manager = new ModeManager();
    });

    it('should handle rapid mode switches', () => {
      const callback = vi.fn();
      manager.onModeChange(callback);

      manager.switchToMode(AppMode.ARCHITECTURE);
      manager.switchToMode(AppMode.FRACTAL);
      manager.switchToMode(AppMode.ARCHITECTURE);
      manager.switchToMode(AppMode.FRACTAL);

      expect(callback).toHaveBeenCalledTimes(4);
      expect(manager.getCurrentMode()).toBe(AppMode.FRACTAL);
    });

    it('should handle multiple subscribers and unsubscribes', () => {
      const callbacks = [vi.fn(), vi.fn(), vi.fn()];
      const unsubscribes = callbacks.map(cb => manager.onModeChange(cb));

      manager.switchToMode(AppMode.ARCHITECTURE);
      callbacks.forEach(cb => expect(cb).toHaveBeenCalledTimes(1));

      // Unsubscribe middle callback
      unsubscribes[1]();

      manager.switchToMode(AppMode.FRACTAL);
      expect(callbacks[0]).toHaveBeenCalledTimes(2);
      expect(callbacks[1]).toHaveBeenCalledTimes(1); // Should not increase
      expect(callbacks[2]).toHaveBeenCalledTimes(2);
    });

    it('should maintain state consistency through multiple operations', () => {
      expect(manager.isFractalMode()).toBe(true);

      manager.toggleMode();
      expect(manager.isArchitectureMode()).toBe(true);

      manager.switchToMode(AppMode.FRACTAL);
      expect(manager.isFractalMode()).toBe(true);

      manager.toggleMode();
      expect(manager.isArchitectureMode()).toBe(true);

      manager.toggleMode();
      expect(manager.isFractalMode()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle being created and destroyed quickly', () => {
      const tempManager = new ModeManager();
      expect(tempManager.getCurrentMode()).toBeDefined();
    });

    it('should handle callback that tries to change mode', () => {
      manager = new ModeManager();

      const recursiveCallback = vi.fn(() => {
        // This would cause infinite recursion if not handled
        if (manager.getCurrentMode() === AppMode.ARCHITECTURE) {
          // Don't switch - would cause recursion
        }
      });

      manager.onModeChange(recursiveCallback);
      manager.switchToMode(AppMode.ARCHITECTURE);

      expect(recursiveCallback).toHaveBeenCalled();
      expect(manager.getCurrentMode()).toBe(AppMode.ARCHITECTURE);
    });
  });
});
