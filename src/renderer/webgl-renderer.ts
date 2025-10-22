/**
 * WebGL2 Renderer for 3D Mandelbulb
 * Handles shader compilation, uniforms, and rendering loop
 */

import { vec3 } from '../utils/vec3';
import vertexShaderSource from '../shaders/vertex.glsl?raw';
import fragmentShaderSource from '../shaders/fragment.glsl?raw';
import { PostProcessor, PostProcessParams } from './post-processor';

interface UniformLocations {
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uCamPos: WebGLUniformLocation | null;
  uCamRot: WebGLUniformLocation | null;
  uFov: WebGLUniformLocation | null;
  uMode: WebGLUniformLocation | null;
  uColorMode: WebGLUniformLocation | null;
  uMaxIterations: WebGLUniformLocation | null;
  uPowerBase: WebGLUniformLocation | null;
  uPowerAmp: WebGLUniformLocation | null;
  uScale: WebGLUniformLocation | null;
  uEpsilon: WebGLUniformLocation | null;
  uMaxSteps: WebGLUniformLocation | null;
  uAOInt: WebGLUniformLocation | null;
  uReflect: WebGLUniformLocation | null;
  uSeed: WebGLUniformLocation | null;
  uPalSpeed: WebGLUniformLocation | null;
  uPalSpread: WebGLUniformLocation | null;
  uJuliaMix: WebGLUniformLocation | null;
  uTwist: WebGLUniformLocation | null;
  uMorphOn: WebGLUniformLocation | null;
  uFold: WebGLUniformLocation | null;
  uBoxSize: WebGLUniformLocation | null;
  uMaterialMode: WebGLUniformLocation | null;
  uBumpStrength: WebGLUniformLocation | null;
  uIor: WebGLUniformLocation | null;
  uShadowSoft: WebGLUniformLocation | null;
  uSpecPow: WebGLUniformLocation | null;
  uLightDir: WebGLUniformLocation | null;
  uJitter: WebGLUniformLocation | null;
  uFloRadius: WebGLUniformLocation | null;
  uFloSpacing: WebGLUniformLocation | null;
  uFloThickness: WebGLUniformLocation | null;
  uFloExtrude: WebGLUniformLocation | null;
  uFloTwist: WebGLUniformLocation | null;
  uFloSpiral: WebGLUniformLocation | null;
  uFloHarmonic: WebGLUniformLocation | null;
  uFloHyper: WebGLUniformLocation | null;
  uFloComplexity: WebGLUniformLocation | null;
  uFibSpiral: WebGLUniformLocation | null;
  uFibBend: WebGLUniformLocation | null;
  uFibWarp: WebGLUniformLocation | null;
  uFibOffset: WebGLUniformLocation | null;
  uFibLayer: WebGLUniformLocation | null;
  uFibInward: WebGLUniformLocation | null;
  uFibBandGap: WebGLUniformLocation | null;
  uFibVortex: WebGLUniformLocation | null;
  uMbScale: WebGLUniformLocation | null;
  uMbMinRadius: WebGLUniformLocation | null;
  uMbFixedRadius: WebGLUniformLocation | null;
  uMbIter: WebGLUniformLocation | null;
  uMetaRadius: WebGLUniformLocation | null;
  uMetaSpacing: WebGLUniformLocation | null;
  uMetaNode: WebGLUniformLocation | null;
  uMetaStrut: WebGLUniformLocation | null;
  uMetaLayer: WebGLUniformLocation | null;
  uMetaTwist: WebGLUniformLocation | null;
  uGyroLevel: WebGLUniformLocation | null;
  uGyroScale: WebGLUniformLocation | null;
  uGyroMod: WebGLUniformLocation | null;
  uTyEye: WebGLUniformLocation | null;
  uTyPull: WebGLUniformLocation | null;
  uTyWall: WebGLUniformLocation | null;
  uTySpin: WebGLUniformLocation | null;
  uTyBand: WebGLUniformLocation | null;
  uTyNoise: WebGLUniformLocation | null;
  uQuatC: WebGLUniformLocation | null;
  uQuatPower: WebGLUniformLocation | null;
  uQuatScale: WebGLUniformLocation | null;
  uCosRadius: WebGLUniformLocation | null;
  uCosExpansion: WebGLUniformLocation | null;
  uCosRipple: WebGLUniformLocation | null;
  uCosSpiral: WebGLUniformLocation | null;
  // Parametric Tower uniforms
  uTowerBaseRadius: WebGLUniformLocation | null;
  uTowerTopRadius: WebGLUniformLocation | null;
  uTowerHeight: WebGLUniformLocation | null;
  uTowerFloorCount: WebGLUniformLocation | null;
  uTowerFloorHeight: WebGLUniformLocation | null;
  uTowerTwist: WebGLUniformLocation | null;
  uTowerShapeType: WebGLUniformLocation | null;
  uTowerTaperingType: WebGLUniformLocation | null;
  uTowerTwistingType: WebGLUniformLocation | null;
  uTowerBalconyDepth: WebGLUniformLocation | null;
  uTowerBalconyRatio: WebGLUniformLocation | null;
  uTowerWindowSize: WebGLUniformLocation | null;
  uTowerFacadeType: WebGLUniformLocation | null;
  uTowerShapeComplexity: WebGLUniformLocation | null;
  uTowerCornerRadius: WebGLUniformLocation | null;
  uTowerTwistLevels: WebGLUniformLocation | null;
  uTowerFloorVariation: WebGLUniformLocation | null;
  uTowerAsymmetry: WebGLUniformLocation | null;
  uTowerFacadeGridX: WebGLUniformLocation | null;
  uTowerFacadeGridZ: WebGLUniformLocation | null;
  uTowerPanelDepth: WebGLUniformLocation | null;
  uTowerTaperingAmount: WebGLUniformLocation | null;
}

interface RenderParams {
  mode: number;
  colorMode: number;
  maxIterations: number;
  powerBase: number;
  powerAmp: number;
  scale: number;
  epsilon: number;
  maxSteps: number;
  aoIntensity: number;
  reflectivity: number;
  seed: Float32Array;
  palSpeed: number;
  palSpread: number;
  juliaMix: number;
  twist: number;
  morphOn: number;
  fold: number;
  boxSize: number;
  materialMode: number;
  bumpStrength: number;
  ior: number;
  shadowSoft: number;
  specPow: number;
  folRadius: number;
  folSpacing: number;
  folThickness: number;
  folExtrude: number;
  folTwist: number;
  folSpiral: number;
  folHarmonic: number;
  folHyper: number;
  folComplexity: number;
  fibSpiral: number;
  fibBend: number;
  fibWarp: number;
  fibOffset: number;
  fibLayer: number;
  fibInward: number;
  fibBandGap: number;
  fibVortex: number;
  mbScale: number;
  mbMinRadius: number;
  mbFixedRadius: number;
  mbIter: number;
  metaRadius: number;
  metaSpacing: number;
  metaNode: number;
  metaStrut: number;
  metaLayer: number;
  metaTwist: number;
  gyroLevel: number;
  gyroScale: number;
  gyroMod: number;
  tyEye: number;
  tyPull: number;
  tyWall: number;
  tySpin: number;
  tyBand: number;
  tyNoise: number;
  quatC: Float32Array;
  quatPower: number;
  quatScale: number;
  cosRadius: number;
  cosExpansion: number;
  cosRipple: number;
  cosSpiral: number;
}

class WebGLRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private uniforms: UniformLocations;
  private startTime: number;

  // Camera - Orbit Controls (camera revolves around object center)
  private camPos: Float32Array = vec3.fromValues(0, 0, -4);
  private camRot: Float32Array = new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ]);
  private fov: number = 45;
  private lastMode: number = 0;

  // Orbit parameters
  private orbitTarget: Float32Array = vec3.fromValues(0, 0, 0); // Object center (always at origin)
  private orbitDistance: number = 4; // Distance from target
  private orbitTheta: number = Math.PI * 0.5; // Vertical angle (latitude)
  private orbitPhi: number = 0; // Horizontal angle (longitude)

  // Architecture mode: Building sits on ground, camera orbits at eye level
  private isArchitectureMode: boolean = false;
  private archOrbitTarget: Float32Array = vec3.fromValues(0, 2.5, 0); // Mid-height of tower
  private archOrbitDistance: number = 6.0; // Distance from building
  private archOrbitTheta: number = Math.PI * 0.45; // Eye level (slightly above horizontal)
  private archOrbitPhi: number = 0; // Horizontal rotation around building

  // Mouse interaction
  private mouseDown: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;

  // Auto morphing control
  public autoMorphing: boolean = false;
  public autoColorCycle: boolean = false;
  private lastColorChangeTime: number = 0;
  private originalPalSpeed: number = 0.08;

  // Auto Morph: Preset cycling
  private currentPresetIndex: number = 0;
  private lastPresetChangeTime: number = 0;
  private presetChangeDuration: number = 8.0; // 8 seconds per preset
  private morphPresets = [
    { name: 'Classic', powerBase: 8, powerAmp: 0, maxIterations: 80, twist: 0, fold: 1, juliaMix: 0 },
    { name: 'Twisted Dream', powerBase: 8, powerAmp: 2, maxIterations: 80, twist: 3.14, fold: 1.5, juliaMix: 0.3 },
    { name: 'Quantum Foam', powerBase: 6, powerAmp: 1.5, maxIterations: 80, twist: 0, fold: 2, juliaMix: 0.5 },
    { name: 'Alien Architecture', powerBase: 12, powerAmp: 0, maxIterations: 80, twist: 1.57, fold: 1.2, juliaMix: 0.2 }
  ];

  // Post-processing
  private postProcessor: PostProcessor | null = null;
  public postProcessParams: PostProcessParams;

  // Render parameters
  public params: RenderParams = {
    mode: 0, // 0 = Mandelbulb, 1 = Flower of Life, 2 = Fibonacci, 3 = Mandelbox, 4 = Metatron, 5 = Gyroid
    colorMode: 0, // Color theme: 0=Rainbow, 1=Electric Dreams, etc.
    maxIterations: 80, // Increased from 8 to 80 (matching original HTML)
    powerBase: 8.0,
    powerAmp: 0.0,
    scale: 1.0,
    epsilon: 0.002, // Increased from 0.0005 to 0.002 for better quality/performance balance
    maxSteps: 140, // Increased from 128 to 140 (matching original HTML)
    aoIntensity: 1.2,
    reflectivity: 0.3,
    seed: vec3.fromValues(0.0, 0.33, 0.67),
    palSpeed: 0.08,
    palSpread: 3.5,
    juliaMix: 0.0,
    twist: 0.0,
    morphOn: 0.0,
    fold: 1.0,
    boxSize: 2.0,
    materialMode: 0,
    bumpStrength: 0.3,
    ior: 1.5,
    shadowSoft: 4.0,
    specPow: 32.0,
    folRadius: 2.0,
    folSpacing: 1.0,
    folThickness: 0.08,
    folExtrude: 0.0,
    folTwist: 0.0,
    folSpiral: 0.0,
    folHarmonic: 0.0,
    folHyper: 0.0,
    folComplexity: 0.0,
    fibSpiral: 0.5,
    fibBend: 0.0,
    fibWarp: 0.3,
    fibOffset: 0.2,
    fibLayer: 0.3,
    fibInward: 0.4,
    fibBandGap: 0.5,
    fibVortex: 0.3,
    mbScale: -1.5,
    mbMinRadius: 0.5,
    mbFixedRadius: 1.0,
    mbIter: 10,
    metaRadius: 2.0,
    metaSpacing: 1.0,
    metaNode: 0.5,
    metaStrut: 0.5,
    metaLayer: 0.8,
    metaTwist: 0.0,
    gyroLevel: 0.0,
    gyroScale: 3.0,
    gyroMod: 0.0,
    tyEye: 0.4,
    tyPull: 0.6,
    tyWall: 1.2,
    tySpin: 1.5,
    tyBand: 3.0,
    tyNoise: 0.3,
    quatC: new Float32Array([-0.2, 0.6, 0.2, 0.0]),
    quatPower: 2.0,
    quatScale: 1.0,
    cosRadius: 2.0,
    cosExpansion: 0.5,
    cosRipple: 0.6,
    cosSpiral: 0.4
  };

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId);
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas element with id "${canvasId}" not found`);
    }
    this.canvas = canvas;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      desynchronized: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true
    });

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;
    this.uniforms = {} as UniformLocations;
    this.startTime = Date.now();

    // Initialize post-processing parameters
    this.postProcessParams = {
      bloomStrength: 0.4,
      bloomThreshold: 0.8,
      chromatic: 0.0,
      vignette: 0.3,
      exposure: 1.0,
      saturation: 1.2,
      gamma: 2.2,
      taaEnabled: false, // Disabled by default to avoid flickering
      taaBlend: 0.9,
      hdrEnabled: true,
      tonemapMode: 2, // ACES by default
      dofEnabled: false,
      dofFocusDistance: 4.0,
      dofAperture: 0.3,
      dofMaxBlur: 10.0
    };

    // Initialize camera position properly
    this.updateOrbitCamera();

    this.init();
    this.setupEventListeners();
    this.resize();
    this.render();
  }

  private init(): void {
    const { gl } = this;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
    if (!this.program) {
      throw new Error('Failed to create shader program');
    }

    gl.useProgram(this.program);

    // Get uniform locations
    this.uniforms = {
      uResolution: gl.getUniformLocation(this.program, 'uResolution'),
      uTime: gl.getUniformLocation(this.program, 'uTime'),
      uCamPos: gl.getUniformLocation(this.program, 'uCamPos'),
      uCamRot: gl.getUniformLocation(this.program, 'uCamRot'),
      uFov: gl.getUniformLocation(this.program, 'uFov'),
      uMode: gl.getUniformLocation(this.program, 'uMode'),
      uColorMode: gl.getUniformLocation(this.program, 'uColorMode'),
      uMaxIterations: gl.getUniformLocation(this.program, 'uMaxIterations'),
      uPowerBase: gl.getUniformLocation(this.program, 'uPowerBase'),
      uPowerAmp: gl.getUniformLocation(this.program, 'uPowerAmp'),
      uScale: gl.getUniformLocation(this.program, 'uScale'),
      uEpsilon: gl.getUniformLocation(this.program, 'uEpsilon'),
      uMaxSteps: gl.getUniformLocation(this.program, 'uMaxSteps'),
      uAOInt: gl.getUniformLocation(this.program, 'uAOInt'),
      uReflect: gl.getUniformLocation(this.program, 'uReflect'),
      uSeed: gl.getUniformLocation(this.program, 'uSeed'),
      uPalSpeed: gl.getUniformLocation(this.program, 'uPalSpeed'),
      uPalSpread: gl.getUniformLocation(this.program, 'uPalSpread'),
      uJuliaMix: gl.getUniformLocation(this.program, 'uJuliaMix'),
      uTwist: gl.getUniformLocation(this.program, 'uTwist'),
      uMorphOn: gl.getUniformLocation(this.program, 'uMorphOn'),
      uFold: gl.getUniformLocation(this.program, 'uFold'),
      uBoxSize: gl.getUniformLocation(this.program, 'uBoxSize'),
      uMaterialMode: gl.getUniformLocation(this.program, 'uMaterialMode'),
      uBumpStrength: gl.getUniformLocation(this.program, 'uBumpStrength'),
      uIor: gl.getUniformLocation(this.program, 'uIor'),
      uShadowSoft: gl.getUniformLocation(this.program, 'uShadowSoft'),
      uSpecPow: gl.getUniformLocation(this.program, 'uSpecPow'),
      uLightDir: gl.getUniformLocation(this.program, 'uLightDir'),
      uJitter: gl.getUniformLocation(this.program, 'uJitter'),
      uFloRadius: gl.getUniformLocation(this.program, 'uFloRadius'),
      uFloSpacing: gl.getUniformLocation(this.program, 'uFloSpacing'),
      uFloThickness: gl.getUniformLocation(this.program, 'uFloThickness'),
      uFloExtrude: gl.getUniformLocation(this.program, 'uFloExtrude'),
      uFloTwist: gl.getUniformLocation(this.program, 'uFloTwist'),
      uFloSpiral: gl.getUniformLocation(this.program, 'uFloSpiral'),
      uFloHarmonic: gl.getUniformLocation(this.program, 'uFloHarmonic'),
      uFloHyper: gl.getUniformLocation(this.program, 'uFloHyper'),
      uFloComplexity: gl.getUniformLocation(this.program, 'uFloComplexity'),
      uFibSpiral: gl.getUniformLocation(this.program, 'uFibSpiral'),
      uFibBend: gl.getUniformLocation(this.program, 'uFibBend'),
      uFibWarp: gl.getUniformLocation(this.program, 'uFibWarp'),
      uFibOffset: gl.getUniformLocation(this.program, 'uFibOffset'),
      uFibLayer: gl.getUniformLocation(this.program, 'uFibLayer'),
      uFibInward: gl.getUniformLocation(this.program, 'uFibInward'),
      uFibBandGap: gl.getUniformLocation(this.program, 'uFibBandGap'),
      uFibVortex: gl.getUniformLocation(this.program, 'uFibVortex'),
      uMbScale: gl.getUniformLocation(this.program, 'uMbScale'),
      uMbMinRadius: gl.getUniformLocation(this.program, 'uMbMinRadius'),
      uMbFixedRadius: gl.getUniformLocation(this.program, 'uMbFixedRadius'),
      uMbIter: gl.getUniformLocation(this.program, 'uMbIter'),
      uMetaRadius: gl.getUniformLocation(this.program, 'uMetaRadius'),
      uMetaSpacing: gl.getUniformLocation(this.program, 'uMetaSpacing'),
      uMetaNode: gl.getUniformLocation(this.program, 'uMetaNode'),
      uMetaStrut: gl.getUniformLocation(this.program, 'uMetaStrut'),
      uMetaLayer: gl.getUniformLocation(this.program, 'uMetaLayer'),
      uMetaTwist: gl.getUniformLocation(this.program, 'uMetaTwist'),
      uGyroLevel: gl.getUniformLocation(this.program, 'uGyroLevel'),
      uGyroScale: gl.getUniformLocation(this.program, 'uGyroScale'),
      uGyroMod: gl.getUniformLocation(this.program, 'uGyroMod'),
      uTyEye: gl.getUniformLocation(this.program, 'uTyEye'),
      uTyPull: gl.getUniformLocation(this.program, 'uTyPull'),
      uTyWall: gl.getUniformLocation(this.program, 'uTyWall'),
      uTySpin: gl.getUniformLocation(this.program, 'uTySpin'),
      uTyBand: gl.getUniformLocation(this.program, 'uTyBand'),
      uTyNoise: gl.getUniformLocation(this.program, 'uTyNoise'),
      uQuatC: gl.getUniformLocation(this.program, 'uQuatC'),
      uQuatPower: gl.getUniformLocation(this.program, 'uQuatPower'),
      uQuatScale: gl.getUniformLocation(this.program, 'uQuatScale'),
      uCosRadius: gl.getUniformLocation(this.program, 'uCosRadius'),
      uCosExpansion: gl.getUniformLocation(this.program, 'uCosExpansion'),
      uCosRipple: gl.getUniformLocation(this.program, 'uCosRipple'),
      uCosSpiral: gl.getUniformLocation(this.program, 'uCosSpiral'),
      // Parametric Tower uniforms
      uTowerBaseRadius: gl.getUniformLocation(this.program, 'uTowerBaseRadius'),
      uTowerTopRadius: gl.getUniformLocation(this.program, 'uTowerTopRadius'),
      uTowerHeight: gl.getUniformLocation(this.program, 'uTowerHeight'),
      uTowerFloorCount: gl.getUniformLocation(this.program, 'uTowerFloorCount'),
      uTowerFloorHeight: gl.getUniformLocation(this.program, 'uTowerFloorHeight'),
      uTowerTwist: gl.getUniformLocation(this.program, 'uTowerTwist'),
      uTowerShapeType: gl.getUniformLocation(this.program, 'uTowerShapeType'),
      uTowerTaperingType: gl.getUniformLocation(this.program, 'uTowerTaperingType'),
      uTowerTwistingType: gl.getUniformLocation(this.program, 'uTowerTwistingType'),
      uTowerBalconyDepth: gl.getUniformLocation(this.program, 'uTowerBalconyDepth'),
      uTowerBalconyRatio: gl.getUniformLocation(this.program, 'uTowerBalconyRatio'),
      uTowerWindowSize: gl.getUniformLocation(this.program, 'uTowerWindowSize'),
      uTowerFacadeType: gl.getUniformLocation(this.program, 'uTowerFacadeType'),
      uTowerShapeComplexity: gl.getUniformLocation(this.program, 'uTowerShapeComplexity'),
      uTowerCornerRadius: gl.getUniformLocation(this.program, 'uTowerCornerRadius'),
      uTowerTwistLevels: gl.getUniformLocation(this.program, 'uTowerTwistLevels'),
      uTowerFloorVariation: gl.getUniformLocation(this.program, 'uTowerFloorVariation'),
      uTowerAsymmetry: gl.getUniformLocation(this.program, 'uTowerAsymmetry'),
      uTowerFacadeGridX: gl.getUniformLocation(this.program, 'uTowerFacadeGridX'),
      uTowerFacadeGridZ: gl.getUniformLocation(this.program, 'uTowerFacadeGridZ'),
      uTowerPanelDepth: gl.getUniformLocation(this.program, 'uTowerPanelDepth'),
      uTowerTaperingAmount: gl.getUniformLocation(this.program, 'uTowerTaperingAmount')
    };
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      console.error('Source:', source);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createProgram(vsSrc: string, fsSrc: string): WebGLProgram | null {
    const { gl } = this;
    const vs = this.createShader(gl.VERTEX_SHADER, vsSrc);
    const fs = this.createShader(gl.FRAGMENT_SHADER, fsSrc);

    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return program;
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', () => this.resize());

    // Mouse controls
    this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
      this.mouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });

    window.addEventListener('mousemove', (e: MouseEvent) => {
      if (!this.mouseDown) return;

      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;

      if (this.isArchitectureMode) {
        // Architecture mode: Horizontal rotation only (walk around building)
        this.archOrbitPhi -= deltaX * 0.005; // Horizontal rotation
        this.archOrbitTheta -= deltaY * 0.003; // Slight vertical angle adjustment

        // Clamp vertical angle to stay near eye level (ground-based viewing)
        this.archOrbitTheta = Math.max(Math.PI * 0.3, Math.min(Math.PI * 0.6, this.archOrbitTheta));
      } else {
        // Fractal mode: Full spherical rotation
        this.orbitPhi -= deltaX * 0.005; // Horizontal rotation
        this.orbitTheta -= deltaY * 0.005; // Vertical rotation

        // Clamp theta to prevent flipping
        this.orbitTheta = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbitTheta));
      }

      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      this.updateOrbitCamera();
    });

    // Mouse wheel for zoom - simple and stable
    this.canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();

      // Use deltaMode to normalize across different devices
      let delta = 0;

      if (e.deltaMode === 0) {
        // Pixel mode (most common) - normalize to reasonable range
        delta = e.deltaY / 100.0; // Divide by 100 for fine control
      } else if (e.deltaMode === 1) {
        // Line mode
        delta = e.deltaY / 3.0;
      } else {
        // Page mode
        delta = e.deltaY;
      }

      // Apply zoom with very small increment
      if (this.isArchitectureMode) {
        this.archOrbitDistance += delta * 0.05;
        this.archOrbitDistance = Math.max(3.0, Math.min(15, this.archOrbitDistance));
      } else {
        this.orbitDistance += delta * 0.05;
        this.orbitDistance = Math.max(1.5, Math.min(20, this.orbitDistance));
      }
      this.updateOrbitCamera();
    });
  }

  private updateOrbitCamera(): void {
    let targetPos: Float32Array;
    let distance: number;
    let theta: number;
    let phi: number;

    if (this.isArchitectureMode) {
      // Architecture mode: Camera orbits at eye level around building on ground
      targetPos = this.archOrbitTarget;
      distance = this.archOrbitDistance;
      theta = this.archOrbitTheta;
      phi = this.archOrbitPhi;
    } else {
      // Fractal mode: Standard orbit around center
      targetPos = this.orbitTarget;
      distance = this.orbitDistance;
      theta = this.orbitTheta;
      phi = this.orbitPhi;
    }

    // Calculate camera position in spherical coordinates around target
    const x = distance * Math.sin(theta) * Math.sin(phi);
    const y = distance * Math.cos(theta);
    const z = distance * Math.sin(theta) * Math.cos(phi);

    this.camPos[0] = targetPos[0] + x;
    this.camPos[1] = targetPos[1] + y;
    this.camPos[2] = targetPos[2] + z;

    // Debug logging (comment out for performance)
    // console.log('Camera update:', {
    //   distance: this.orbitDistance,
    //   theta: this.orbitTheta,
    //   phi: this.orbitPhi,
    //   position: [this.camPos[0], this.camPos[1], this.camPos[2]]
    // });

    // Calculate look-at rotation matrix
    // Forward vector (camera -> target)
    const forward = vec3.create();
    vec3.subtract(forward, targetPos, this.camPos);
    vec3.normalize(forward, forward);

    // Right vector (perpendicular to forward and world up)
    const worldUp = vec3.fromValues(0, 1, 0);
    const right = vec3.create();
    vec3.cross(right, forward, worldUp);

    // Handle gimbal lock at poles
    if (vec3.length(right) < 0.001) {
      // Use alternative up vector when looking straight up/down
      const altUp = vec3.fromValues(0, 0, 1);
      vec3.cross(right, forward, altUp);
    }
    vec3.normalize(right, right);

    // Up vector (perpendicular to right and forward)
    const up = vec3.create();
    vec3.cross(up, right, forward);
    vec3.normalize(up, up);

    // Build rotation matrix (camera space axes)
    this.camRot[0] = right[0];
    this.camRot[1] = up[0];
    this.camRot[2] = forward[0];
    this.camRot[3] = right[1];
    this.camRot[4] = up[1];
    this.camRot[5] = forward[1];
    this.camRot[6] = right[2];
    this.camRot[7] = up[2];
    this.camRot[8] = forward[2];
  }

  /**
   * Enable/disable architecture mode
   * In architecture mode, building sits on ground and camera orbits at eye level
   */
  public setArchitectureMode(enabled: boolean, towerHeight?: number): void {
    this.isArchitectureMode = enabled;

    if (enabled) {
      const height = towerHeight || 5.0;

      // Strategy: Use wide FOV and moderate distance
      // Target point: center of building
      const targetHeight = height * 0.5;
      this.archOrbitTarget = vec3.fromValues(0, targetHeight, 0);

      // Set moderate distance that works within raymarch limits (t < 20.0)
      // Distance should be less than 20 to ensure rays reach the building
      this.archOrbitDistance = Math.min(height * 3.0, 15.0);

      // Set camera angle for 3/4 view
      this.archOrbitTheta = Math.PI * 0.35; // ~63 degrees from vertical
      this.archOrbitPhi = 0; // Start facing front

      // Widen FOV for architecture mode to capture full building
      this.fov = 75; // Wide angle view (was 45)

      console.log(`🏗️ Architecture Mode: ON (height: ${height}, target: ${targetHeight}, distance: ${this.archOrbitDistance}, FOV: ${this.fov}°)`);
    } else {
      // Restore normal FOV for fractal mode
      this.fov = 45;
      console.log('🌀 Architecture Mode: OFF (Fractal mode)');
    }

    this.updateOrbitCamera();
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    const rw = Math.max(1, Math.round(w * dpr));
    const rh = Math.max(1, Math.round(h * dpr));

    if (this.canvas.width !== rw || this.canvas.height !== rh) {
      this.canvas.width = rw;
      this.canvas.height = rh;
      this.gl.viewport(0, 0, rw, rh);

      // Post-processor は使用していないため無効化
      // パフォーマンスとちらつき防止のため、直接レンダリングのみ使用
    }
  }

  private render = (): void => {
    const { gl, uniforms, params } = this;
    const time = (Date.now() - this.startTime) * 0.001;

    // DIRECT RENDERING (Post-Processor無効 - ちらつき防止のため)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // 背景色を黒に設定してクリア
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Auto Color - exactly same as original HTML
    // Uses Neon Rainbow mode (-1) with animated seed values
    if (this.autoColorCycle) {
      params.seed[0] = 0.5 + 0.5 * Math.sin(time * 0.27);
      params.seed[1] = 0.5 + 0.5 * Math.sin(time * 0.31 + 2.0);
      params.seed[2] = 0.5 + 0.5 * Math.sin(time * 0.23 + 4.0);
      // Use special Neon Rainbow mode (mode -1)
      params.colorMode = -1;
    }

    // Auto Morphing - cycle through presets
    if (this.autoMorphing) {
      // Check if it's time to change preset
      if (time - this.lastPresetChangeTime > this.presetChangeDuration) {
        this.currentPresetIndex = (this.currentPresetIndex + 1) % this.morphPresets.length;
        this.lastPresetChangeTime = time;
      }

      // Get current and next preset for smooth interpolation
      const currentPreset = this.morphPresets[this.currentPresetIndex];
      const nextPreset = this.morphPresets[(this.currentPresetIndex + 1) % this.morphPresets.length];

      // Calculate interpolation factor (0 to 1 over presetChangeDuration)
      const lerpFactor = Math.min((time - this.lastPresetChangeTime) / this.presetChangeDuration, 1.0);
      const smoothLerp = lerpFactor * lerpFactor * (3.0 - 2.0 * lerpFactor); // Smooth step

      // Interpolate between current and next preset
      params.powerBase = currentPreset.powerBase + (nextPreset.powerBase - currentPreset.powerBase) * smoothLerp;
      params.powerAmp = currentPreset.powerAmp + (nextPreset.powerAmp - currentPreset.powerAmp) * smoothLerp;
      params.twist = currentPreset.twist + (nextPreset.twist - currentPreset.twist) * smoothLerp;
      params.fold = currentPreset.fold + (nextPreset.fold - currentPreset.fold) * smoothLerp;
      params.juliaMix = currentPreset.juliaMix + (nextPreset.juliaMix - currentPreset.juliaMix) * smoothLerp;

      // Apply subtle organic movements on top
      const slowWave = Math.sin(time * 0.2) * 0.5 + 0.5;
      const fastWave = Math.sin(time * 0.8) * 0.5 + 0.5;
      const rotationWave = Math.sin(time * 0.15);

      // Apply dynamic modulations based on mode (only for non-Mandelbulb modes)
      if (params.mode === 0) {
        // Mandelbulb - use preset morphing (already applied above)
        params.morphOn = fastWave * 0.3;
      } else if (params.mode === 1) {
        // Flower of Life - spiral and harmonic modulation
        params.folSpiral = slowWave * 0.6;
        params.folHarmonic = fastWave * 0.4;
        params.folTwist = rotationWave * 1.5;
        params.folExtrude = slowWave * 0.5;
      } else if (params.mode === 2) {
        // Fibonacci Shell - vortex and spiral dance
        params.fibVortex = 0.3 + slowWave * 0.8;
        params.fibSpiral = 0.5 + fastWave * 0.7;
        params.fibInward = 0.4 + rotationWave * 0.3;
        params.fibBend = fastWave * 0.6;
      } else if (params.mode === 3) {
        // Mandelbox - scale pulsation
        const pulse = Math.sin(time * 0.25) * 0.3;
        params.mbScale = -1.5 + pulse;
        params.mbMinRadius = 0.5 + slowWave * 0.3;
      } else if (params.mode === 4) {
        // Metatron Cube - layer and twist rotation
        params.metaLayer = slowWave;
        params.metaTwist = time * 0.1; // Continuous slow rotation
        params.metaSpacing = 1.0 + rotationWave * 0.3;
      } else if (params.mode === 5) {
        // Gyroid Cathedral - level modulation
        params.gyroLevel = rotationWave * 0.8;
        params.gyroMod = slowWave * 1.2;
      }
    }

    // Auto-adjust camera and epsilon when mode changes
    if (params.mode !== this.lastMode) {
      this.lastMode = params.mode;
      if (params.mode === 1) {
        // Flower of Life mode - optimal viewing distance
        this.orbitDistance = 6;
        params.epsilon = 0.0008;
        params.folRadius = 2.0;
      } else if (params.mode === 2) {
        // Fibonacci Shell mode
        this.orbitDistance = 3.5;
        params.epsilon = 0.0005;
      } else if (params.mode === 3) {
        // Mandelbox mode
        this.orbitDistance = 6;
        params.epsilon = 0.0008;
      } else if (params.mode === 4) {
        // Metatron Cube mode
        this.orbitDistance = 5;
        params.epsilon = 0.0008;
      } else if (params.mode === 5) {
        // Gyroid Cathedral mode - adjusted for better visibility
        this.orbitDistance = 6;
        params.epsilon = 0.001;
        params.gyroScale = 2.5;
      } else {
        // Mandelbulb mode - reset
        this.orbitDistance = 3.5;
        params.epsilon = 0.0005;
      }
      this.updateOrbitCamera();
    }

    // Set uniforms
    gl.uniform2f(uniforms.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(uniforms.uTime, time);
    gl.uniform3fv(uniforms.uCamPos, this.camPos);
    gl.uniformMatrix3fv(uniforms.uCamRot, false, this.camRot);
    gl.uniform1f(uniforms.uFov, this.fov);

    gl.uniform1i(uniforms.uMode, params.mode);
    gl.uniform1i(uniforms.uColorMode, params.colorMode);
    gl.uniform1i(uniforms.uMaxIterations, params.maxIterations);
    gl.uniform1f(uniforms.uPowerBase, params.powerBase);
    gl.uniform1f(uniforms.uPowerAmp, params.powerAmp);
    gl.uniform1f(uniforms.uScale, params.scale);
    gl.uniform1f(uniforms.uEpsilon, params.epsilon);
    gl.uniform1i(uniforms.uMaxSteps, params.maxSteps);
    gl.uniform1f(uniforms.uAOInt, params.aoIntensity);
    gl.uniform1f(uniforms.uReflect, params.reflectivity);
    gl.uniform3fv(uniforms.uSeed, params.seed);
    gl.uniform1f(uniforms.uPalSpeed, params.palSpeed);
    gl.uniform1f(uniforms.uPalSpread, params.palSpread);
    gl.uniform1f(uniforms.uJuliaMix, params.juliaMix);
    gl.uniform1f(uniforms.uTwist, params.twist);
    gl.uniform1f(uniforms.uMorphOn, params.morphOn);
    gl.uniform1f(uniforms.uFold, params.fold);
    gl.uniform1f(uniforms.uBoxSize, params.boxSize);
    gl.uniform1i(uniforms.uMaterialMode, params.materialMode);
    gl.uniform1f(uniforms.uBumpStrength, params.bumpStrength);
    gl.uniform1f(uniforms.uIor, params.ior);
    gl.uniform1f(uniforms.uShadowSoft, params.shadowSoft);
    gl.uniform1f(uniforms.uSpecPow, params.specPow);

    // Light direction
    const lightDir = vec3.fromValues(
      Math.cos(time * 0.3),
      0.5,
      Math.sin(time * 0.3)
    );
    vec3.normalize(lightDir, lightDir);
    gl.uniform3fv(uniforms.uLightDir, lightDir);

    gl.uniform2f(uniforms.uJitter, 0, 0);

    // Flower of Life uniforms
    gl.uniform1f(uniforms.uFloRadius, params.folRadius);
    gl.uniform1f(uniforms.uFloSpacing, params.folSpacing);
    gl.uniform1f(uniforms.uFloThickness, params.folThickness);
    gl.uniform1f(uniforms.uFloExtrude, params.folExtrude);
    gl.uniform1f(uniforms.uFloTwist, params.folTwist);
    gl.uniform1f(uniforms.uFloSpiral, params.folSpiral);
    gl.uniform1f(uniforms.uFloHarmonic, params.folHarmonic);
    gl.uniform1f(uniforms.uFloHyper, params.folHyper);
    gl.uniform1f(uniforms.uFloComplexity, params.folComplexity);

    // Fibonacci Shell uniforms
    gl.uniform1f(uniforms.uFibSpiral, params.fibSpiral);
    gl.uniform1f(uniforms.uFibBend, params.fibBend);
    gl.uniform1f(uniforms.uFibWarp, params.fibWarp);
    gl.uniform1f(uniforms.uFibOffset, params.fibOffset);
    gl.uniform1f(uniforms.uFibLayer, params.fibLayer);
    gl.uniform1f(uniforms.uFibInward, params.fibInward);
    gl.uniform1f(uniforms.uFibBandGap, params.fibBandGap);
    gl.uniform1f(uniforms.uFibVortex, params.fibVortex);

    // Mandelbox uniforms
    gl.uniform1f(uniforms.uMbScale, params.mbScale);
    gl.uniform1f(uniforms.uMbMinRadius, params.mbMinRadius);
    gl.uniform1f(uniforms.uMbFixedRadius, params.mbFixedRadius);
    gl.uniform1i(uniforms.uMbIter, params.mbIter);

    // Metatron Cube uniforms
    gl.uniform1f(uniforms.uMetaRadius, params.metaRadius);
    gl.uniform1f(uniforms.uMetaSpacing, params.metaSpacing);
    gl.uniform1f(uniforms.uMetaNode, params.metaNode);
    gl.uniform1f(uniforms.uMetaStrut, params.metaStrut);
    gl.uniform1f(uniforms.uMetaLayer, params.metaLayer);
    gl.uniform1f(uniforms.uMetaTwist, params.metaTwist);

    // Gyroid Cathedral uniforms
    gl.uniform1f(uniforms.uGyroLevel, params.gyroLevel);
    gl.uniform1f(uniforms.uGyroScale, params.gyroScale);
    gl.uniform1f(uniforms.uGyroMod, params.gyroMod);

    // Typhoon uniforms
    gl.uniform1f(uniforms.uTyEye, params.tyEye);
    gl.uniform1f(uniforms.uTyPull, params.tyPull);
    gl.uniform1f(uniforms.uTyWall, params.tyWall);
    gl.uniform1f(uniforms.uTySpin, params.tySpin);
    gl.uniform1f(uniforms.uTyBand, params.tyBand);
    gl.uniform1f(uniforms.uTyNoise, params.tyNoise);

    // Quaternion Julia uniforms
    gl.uniform4fv(uniforms.uQuatC, params.quatC);
    gl.uniform1f(uniforms.uQuatPower, params.quatPower);
    gl.uniform1f(uniforms.uQuatScale, params.quatScale);

    // Cosmic Bloom uniforms
    gl.uniform1f(uniforms.uCosRadius, params.cosRadius);
    gl.uniform1f(uniforms.uCosExpansion, params.cosExpansion);
    gl.uniform1f(uniforms.uCosRipple, params.cosRipple);
    gl.uniform1f(uniforms.uCosSpiral, params.cosSpiral);

    // Parametric Tower uniforms
    const towerParams = (this as any).towerParams || {
      baseRadius: 0.8, topRadius: 0.6, height: 5.0, floorCount: 40,
      floorHeight: 0.125, twistAngle: 0, shapeType: 1,
      taperingType: 1, twistingType: 0,
      balconyDepth: 0.0, balconyRatio: 0.0, windowSize: 0.5, facadeType: 0,
      // Additional parameters with defaults
      shapeComplexity: 16, cornerRadius: 0.1, twistLevels: 10,
      floorVariation: 0, asymmetry: 0,
      facadeGridX: 0.2, facadeGridZ: 0.2, panelDepth: 0.05,
      taperingAmount: 0.3
    };

    // Log tower parameters when in tower mode for debugging
    if (params.mode === 9 && Math.random() < 0.02) { // Log 2% of frames
      console.log('🏗️ Renderer tower params:', {
        baseRadius: towerParams.baseRadius,
        topRadius: towerParams.topRadius,
        height: towerParams.height,
        shapeType: towerParams.shapeType,
        taperingType: towerParams.taperingType,
        twistingType: towerParams.twistingType,
        twistAngle: towerParams.twistAngle,
        shapeComplexity: towerParams.shapeComplexity,
        cornerRadius: towerParams.cornerRadius
      });
    }

    // Basic parameters
    if (uniforms.uTowerBaseRadius) gl.uniform1f(uniforms.uTowerBaseRadius, towerParams.baseRadius);
    if (uniforms.uTowerTopRadius) gl.uniform1f(uniforms.uTowerTopRadius, towerParams.topRadius);
    if (uniforms.uTowerHeight) gl.uniform1f(uniforms.uTowerHeight, towerParams.height);
    if (uniforms.uTowerFloorCount) gl.uniform1f(uniforms.uTowerFloorCount, towerParams.floorCount);
    if (uniforms.uTowerFloorHeight) gl.uniform1f(uniforms.uTowerFloorHeight, towerParams.floorHeight);
    if (uniforms.uTowerTwist) gl.uniform1f(uniforms.uTowerTwist, towerParams.twistAngle);
    if (uniforms.uTowerShapeType) gl.uniform1i(uniforms.uTowerShapeType, towerParams.shapeType);
    if (uniforms.uTowerTaperingType) gl.uniform1i(uniforms.uTowerTaperingType, towerParams.taperingType);
    if (uniforms.uTowerTwistingType) gl.uniform1i(uniforms.uTowerTwistingType, towerParams.twistingType);
    if (uniforms.uTowerBalconyDepth) gl.uniform1f(uniforms.uTowerBalconyDepth, towerParams.balconyDepth);
    if (uniforms.uTowerBalconyRatio) gl.uniform1f(uniforms.uTowerBalconyRatio, towerParams.balconyRatio);
    if (uniforms.uTowerWindowSize) gl.uniform1f(uniforms.uTowerWindowSize, towerParams.windowSize);
    if (uniforms.uTowerFacadeType) gl.uniform1i(uniforms.uTowerFacadeType, towerParams.facadeType);

    // Additional parameters
    if (uniforms.uTowerShapeComplexity) gl.uniform1f(uniforms.uTowerShapeComplexity, towerParams.shapeComplexity);
    if (uniforms.uTowerCornerRadius) gl.uniform1f(uniforms.uTowerCornerRadius, towerParams.cornerRadius);
    if (uniforms.uTowerTwistLevels) gl.uniform1f(uniforms.uTowerTwistLevels, towerParams.twistLevels);
    if (uniforms.uTowerFloorVariation) gl.uniform1f(uniforms.uTowerFloorVariation, towerParams.floorVariation);
    if (uniforms.uTowerAsymmetry) gl.uniform1f(uniforms.uTowerAsymmetry, towerParams.asymmetry);
    if (uniforms.uTowerFacadeGridX) gl.uniform1f(uniforms.uTowerFacadeGridX, towerParams.facadeGridX);
    if (uniforms.uTowerFacadeGridZ) gl.uniform1f(uniforms.uTowerFacadeGridZ, towerParams.facadeGridZ);
    if (uniforms.uTowerPanelDepth) gl.uniform1f(uniforms.uTowerPanelDepth, towerParams.panelDepth);
    if (uniforms.uTowerTaperingAmount) gl.uniform1f(uniforms.uTowerTaperingAmount, towerParams.taperingAmount);

    // Draw fullscreen triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // POST-PROCESSOR DISABLED - Direct rendering only

    requestAnimationFrame(this.render);
  };
}

// Initialize renderer when DOM is ready
let renderer: WebGLRenderer | null = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderer = new WebGLRenderer('gl');
    // Expose renderer globally for UI controls
    (window as typeof window & { renderer: WebGLRenderer }).renderer = renderer;
  });
} else {
  renderer = new WebGLRenderer('gl');
  (window as typeof window & { renderer: WebGLRenderer }).renderer = renderer;
}

export default WebGLRenderer;
