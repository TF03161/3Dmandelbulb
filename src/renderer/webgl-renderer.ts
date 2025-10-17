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
      desynchronized: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
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
      taaEnabled: true,
      taaBlend: 0.9
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
      uCosSpiral: gl.getUniformLocation(this.program, 'uCosSpiral')
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

      // Update orbit angles (rotate camera around object)
      this.orbitPhi -= deltaX * 0.005; // Horizontal rotation
      this.orbitTheta -= deltaY * 0.005; // Vertical rotation

      // Clamp theta to prevent flipping
      this.orbitTheta = Math.max(0.1, Math.min(Math.PI - 0.1, this.orbitTheta));

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
      this.orbitDistance += delta * 0.05; // Very conservative multiplier
      this.orbitDistance = Math.max(1.5, Math.min(20, this.orbitDistance));
      this.updateOrbitCamera();
    });
  }

  private updateOrbitCamera(): void {
    // Calculate camera position in spherical coordinates around target
    const x = this.orbitDistance * Math.sin(this.orbitTheta) * Math.sin(this.orbitPhi);
    const y = this.orbitDistance * Math.cos(this.orbitTheta);
    const z = this.orbitDistance * Math.sin(this.orbitTheta) * Math.cos(this.orbitPhi);

    this.camPos[0] = this.orbitTarget[0] + x;
    this.camPos[1] = this.orbitTarget[1] + y;
    this.camPos[2] = this.orbitTarget[2] + z;

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
    vec3.subtract(forward, this.orbitTarget, this.camPos);
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

      // Temporarily disable post-processor for debugging
      // TODO: Re-enable after fixing
      /*
      if (this.postProcessor) {
        this.postProcessor.resize(rw, rh);
      } else {
        this.postProcessor = new PostProcessor(this.gl, rw, rh);
        this.postProcessor.params = this.postProcessParams;
      }
      */
      this.postProcessor = null; // Disabled for debugging
    }
  }

  private render = (): void => {
    const { gl, uniforms, params } = this;
    const time = (Date.now() - this.startTime) * 0.001;

    // Begin rendering to scene framebuffer (with fallback)
    if (this.postProcessor && this.postProcessor.beginScene) {
      try {
        this.postProcessor.beginScene();
      } catch (e) {
        console.error('Post-processor beginScene failed:', e);
        this.postProcessor = null; // Disable post-processor on error
      }
    }

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
        // Gyroid Cathedral mode - much larger structure
        this.orbitDistance = 12;
        params.epsilon = 0.002;
        params.gyroScale = 3.0;
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

    // Draw fullscreen triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Apply post-processing and composite to screen (with fallback)
    if (this.postProcessor && this.postProcessor.endSceneAndCompose) {
      try {
        this.postProcessor.endSceneAndCompose();
      } catch (e) {
        console.error('Post-processor endSceneAndCompose failed:', e);
        this.postProcessor = null; // Disable post-processor on error
        // Render directly to screen without post-processing
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
    } else {
      // No post-processor, render directly to screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

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
