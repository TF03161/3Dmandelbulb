/**
 * Unit tests for Parametric Tower Generator
 */

import { describe, it, expect } from 'vitest';
import {
  FloorShape,
  TaperingMode,
  TwistingMode,
  DEFAULT_TOWER_PARAMS,
  generateParametricTower,
  calculateFloorArea,
  calculateBuildingStats,
  type TowerParameters
} from '../src/generators/parametric-tower';

describe('Parametric Tower Generator', () => {
  describe('Floor Area Calculations', () => {
    it('should calculate circle floor area correctly', () => {
      const radius = 1.0;
      const area = calculateFloorArea(FloorShape.CIRCLE, radius);
      expect(area).toBeCloseTo(Math.PI, 2);
    });

    it('should calculate square floor area correctly', () => {
      const radius = 1.0;
      const area = calculateFloorArea(FloorShape.SQUARE, radius);
      const expectedSide = radius * Math.sqrt(2);
      expect(area).toBeCloseTo(expectedSide * expectedSide, 2);
    });

    it('should calculate hexagon floor area correctly', () => {
      const radius = 1.0;
      const area = calculateFloorArea(FloorShape.HEXAGON, radius);
      const expected = (3 * Math.sqrt(3) / 2) * radius * radius;
      expect(area).toBeCloseTo(expected, 2);
    });

    it('should handle all floor shapes without errors', () => {
      const radius = 1.0;
      const shapes = Object.values(FloorShape);

      shapes.forEach(shape => {
        const area = calculateFloorArea(shape, radius);
        expect(area).toBeGreaterThan(0);
        expect(area).toBeLessThan(10); // Reasonable upper bound for r=1
      });
    });
  });

  describe('Building Statistics', () => {
    it('should calculate basic building stats', () => {
      const params: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        baseRadius: 1.0,
        height: 5.0,
        floorCount: 10,
        floorHeight: 0.5
      };

      const stats = calculateBuildingStats(params);

      expect(stats.totalFloorArea).toBeGreaterThan(0);
      expect(stats.averageFloorArea).toBeGreaterThan(0);
      expect(stats.buildingVolume).toBeGreaterThan(0);
      expect(stats.grossFloorArea).toBe(stats.totalFloorArea);
      expect(stats.floorAreaRatio).toBeGreaterThan(0);
      expect(stats.buildingCoverage).toBe(1.0); // 100%
    });

    it('should account for tapering in floor area calculations', () => {
      const linearParams: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        taperingMode: TaperingMode.LINEAR,
        taperingAmount: 0.5,
        baseRadius: 1.0,
        topRadius: 0.5
      };

      const noTaperParams: TowerParameters = {
        ...linearParams,
        taperingMode: TaperingMode.NONE,
        topRadius: 1.0
      };

      const linearStats = calculateBuildingStats(linearParams);
      const noTaperStats = calculateBuildingStats(noTaperParams);

      // Tapered building should have less total floor area
      expect(linearStats.totalFloorArea).toBeLessThan(noTaperStats.totalFloorArea);
    });

    it('should handle different floor shapes in stats', () => {
      const shapes = [FloorShape.CIRCLE, FloorShape.SQUARE, FloorShape.HEXAGON];

      shapes.forEach(shape => {
        const params: TowerParameters = {
          ...DEFAULT_TOWER_PARAMS,
          floorShape: shape,
          baseRadius: 1.0
        };

        const stats = calculateBuildingStats(params);
        expect(stats.totalFloorArea).toBeGreaterThan(0);
        expect(stats.averageFloorArea).toBeGreaterThan(0);
      });
    });
  });

  describe('Tower Generation', () => {
    it('should generate a basic tower with default parameters', () => {
      const geometry = generateParametricTower(DEFAULT_TOWER_PARAMS);

      expect(geometry).toBeDefined();
      expect(geometry.floors).toHaveLength(DEFAULT_TOWER_PARAMS.floorCount);
      expect(geometry.shellVertices).toBeDefined();
      expect(geometry.shellVertices.length).toBeGreaterThan(0);
      expect(geometry.shellFaces).toBeDefined();
      expect(geometry.shellFaces.length).toBeGreaterThan(0);
    });

    it('should generate floors with correct height progression', () => {
      const params: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        floorCount: 5,
        floorHeight: 1.0
      };

      const geometry = generateParametricTower(params);

      geometry.floors.forEach((floor, index) => {
        expect(floor.level).toBe(index);
        expect(floor.height).toBeCloseTo(index * params.floorHeight, 2);
      });
    });

    it('should apply linear tapering correctly', () => {
      const params: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        taperingMode: TaperingMode.LINEAR,
        baseRadius: 1.0,
        topRadius: 0.5,
        floorCount: 10
      };

      const geometry = generateParametricTower(params);

      const firstFloor = geometry.floors[0];
      const lastFloor = geometry.floors[geometry.floors.length - 1];

      expect(firstFloor.radius).toBeCloseTo(params.baseRadius, 2);
      expect(lastFloor.radius).toBeCloseTo(params.topRadius, 2);

      // Check intermediate floors taper linearly
      const midFloor = geometry.floors[Math.floor(geometry.floors.length / 2)];
      const expectedMidRadius = (params.baseRadius + params.topRadius) / 2;
      expect(midFloor.radius).toBeCloseTo(expectedMidRadius, 1);
    });

    it('should apply uniform twisting correctly', () => {
      const params: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        twistingMode: TwistingMode.UNIFORM,
        twistAngle: 180, // 180 degrees
        floorCount: 10
      };

      const geometry = generateParametricTower(params);

      const firstFloor = geometry.floors[0];
      const lastFloor = geometry.floors[geometry.floors.length - 1];

      expect(firstFloor.rotation).toBeCloseTo(0, 2);
      expect(lastFloor.rotation).toBeCloseTo(Math.PI, 2); // 180 deg = π rad
    });

    it('should generate different shapes correctly', () => {
      const shapes = [
        FloorShape.CIRCLE,
        FloorShape.SQUARE,
        FloorShape.TRIANGLE,
        FloorShape.HEXAGON
      ];

      shapes.forEach(shape => {
        const params: TowerParameters = {
          ...DEFAULT_TOWER_PARAMS,
          floorShape: shape
        };

        const geometry = generateParametricTower(params);
        expect(geometry.floors.length).toBe(params.floorCount);
        expect(geometry.shellVertices.length).toBeGreaterThan(0);
      });
    });

    it('should generate facade panels', () => {
      const params: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        floorCount: 3 // Small number for faster test
      };

      const geometry = generateParametricTower(params);

      expect(geometry.facadePanels).toBeDefined();
      expect(geometry.facadePanels.length).toBeGreaterThan(0);

      // Check panel structure
      geometry.facadePanels.forEach(panel => {
        expect(panel.vertices).toBeDefined();
        expect(panel.vertices.length).toBeGreaterThan(0);
        expect(panel.depth).toBeGreaterThanOrEqual(0);
        expect(typeof panel.isBalcony).toBe('boolean');
      });
    });

    it('should generate frame lines', () => {
      const params: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        floorCount: 3
      };

      const geometry = generateParametricTower(params);

      expect(geometry.frameLines).toBeDefined();
      expect(geometry.frameLines.length).toBeGreaterThan(0);

      // Check frame line structure
      geometry.frameLines.forEach(line => {
        expect(line.start).toBeDefined();
        expect(line.end).toBeDefined();
        expect(Array.isArray(line.start)).toBe(true);
        expect(Array.isArray(line.end)).toBe(true);
        expect(line.start.length).toBe(3);
        expect(line.end.length).toBe(3);
      });
    });

    it('should handle edge cases gracefully', () => {
      // Minimal tower
      const minimalParams: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        floorCount: 2,
        baseRadius: 0.1
      };

      const minimalGeometry = generateParametricTower(minimalParams);
      expect(minimalGeometry.floors.length).toBe(2);

      // Very tall tower
      const tallParams: TowerParameters = {
        ...DEFAULT_TOWER_PARAMS,
        floorCount: 100,
        height: 30.0
      };

      const tallGeometry = generateParametricTower(tallParams);
      expect(tallGeometry.floors.length).toBe(100);
    });
  });

  describe('Default Parameters', () => {
    it('should have valid default parameters', () => {
      expect(DEFAULT_TOWER_PARAMS.baseRadius).toBeGreaterThan(0);
      expect(DEFAULT_TOWER_PARAMS.height).toBeGreaterThan(0);
      expect(DEFAULT_TOWER_PARAMS.floorCount).toBeGreaterThan(0);
      expect(DEFAULT_TOWER_PARAMS.floorHeight).toBeGreaterThan(0);
      expect(DEFAULT_TOWER_PARAMS.topRadius).toBeLessThanOrEqual(DEFAULT_TOWER_PARAMS.baseRadius);
    });

    it('should have valid shape complexity', () => {
      expect(DEFAULT_TOWER_PARAMS.shapeComplexity).toBeGreaterThanOrEqual(3);
      expect(DEFAULT_TOWER_PARAMS.shapeComplexity).toBeLessThanOrEqual(32);
    });

    it('should have valid range parameters', () => {
      expect(DEFAULT_TOWER_PARAMS.cornerRadius).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_TOWER_PARAMS.cornerRadius).toBeLessThanOrEqual(1);
      expect(DEFAULT_TOWER_PARAMS.taperingAmount).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_TOWER_PARAMS.taperingAmount).toBeLessThanOrEqual(1);
      expect(DEFAULT_TOWER_PARAMS.balconyRatio).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_TOWER_PARAMS.balconyRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('Enums', () => {
    it('should have all expected floor shapes', () => {
      const shapes = Object.values(FloorShape);
      expect(shapes).toContain('circle');
      expect(shapes).toContain('square');
      expect(shapes).toContain('hexagon');
      expect(shapes).toContain('star');
    });

    it('should have all tapering modes', () => {
      const modes = Object.values(TaperingMode);
      expect(modes).toContain('none');
      expect(modes).toContain('linear');
      expect(modes).toContain('exponential');
      expect(modes).toContain('s-curve');
    });

    it('should have all twisting modes', () => {
      const modes = Object.values(TwistingMode);
      expect(modes).toContain('none');
      expect(modes).toContain('uniform');
      expect(modes).toContain('accelerating');
    });
  });
});
