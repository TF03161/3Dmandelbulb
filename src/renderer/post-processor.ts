/**
 * Post-Processing Pipeline
 * Handles Bloom, FXAA, TAA, Chromatic Aberration, and final composition
 */

import postVertexSource from '../shaders/post-vertex.glsl?raw';
import postBlurSource from '../shaders/post-blur.glsl?raw';
import postBrightnessSource from '../shaders/post-brightness.glsl?raw';
import postComposeSource from '../shaders/post-compose.glsl?raw';
import postTAASource from '../shaders/post-taa.glsl?raw';
import postTonemapSource from '../shaders/post-tonemap.glsl?raw';
import postDOFSource from '../shaders/post-dof.glsl?raw';

export interface PostProcessParams {
  bloomStrength: number;
  bloomThreshold: number;
  chromatic: number;
  vignette: number;
  exposure: number;
  saturation: number;
  gamma: number;
  taaEnabled: boolean;
  taaBlend: number;
  hdrEnabled: boolean;
  tonemapMode: number; // 0=None, 1=Reinhard, 2=ACES, 3=Uncharted2
  dofEnabled: boolean;
  dofFocusDistance: number;
  dofAperture: number;
  dofMaxBlur: number;
}

export class PostProcessor {
  private gl: WebGL2RenderingContext;
  private width: number;
  private height: number;

  // Framebuffers
  private sceneFramebuffer: WebGLFramebuffer | null = null;
  private sceneTexture: WebGLTexture | null = null;

  private bloomFramebuffer: WebGLFramebuffer | null = null;
  private bloomTexture: WebGLTexture | null = null;

  private blurH_Framebuffer: WebGLFramebuffer | null = null;
  private blurH_Texture: WebGLTexture | null = null;

  private blurV_Framebuffer: WebGLFramebuffer | null = null;
  private blurV_Texture: WebGLTexture | null = null;

  private taaFramebuffer: WebGLFramebuffer | null = null;
  private taaTexture: WebGLTexture | null = null;
  private taaHistoryTexture: WebGLTexture | null = null;

  private dofFramebuffer: WebGLFramebuffer | null = null;
  private dofTexture: WebGLTexture | null = null;
  private depthTexture: WebGLTexture | null = null;

  // Programs
  private brightnessProgram: WebGLProgram | null = null;
  private blurProgram: WebGLProgram | null = null;
  private composeProgram: WebGLProgram | null = null;
  private taaProgram: WebGLProgram | null = null;
  private tonemapProgram: WebGLProgram | null = null;
  private dofProgram: WebGLProgram | null = null;

  // Quad VAO for fullscreen rendering
  private quadVAO: WebGLVertexArrayObject | null = null;

  // TAA state
  private taaResetAccumulation: boolean = true;

  public params: PostProcessParams = {
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

  constructor(gl: WebGL2RenderingContext, width: number, height: number) {
    this.gl = gl;
    this.width = width;
    this.height = height;

    this.init();
  }

  private init(): void {
    this.createPrograms();
    this.createQuadVAO();
    this.resize(this.width, this.height);
  }

  private createPrograms(): void {
    this.brightnessProgram = this.createProgram(postVertexSource, postBrightnessSource);
    this.blurProgram = this.createProgram(postVertexSource, postBlurSource);
    this.composeProgram = this.createProgram(postVertexSource, postComposeSource);
    this.taaProgram = this.createProgram(postVertexSource, postTAASource);
    this.tonemapProgram = this.createProgram(postVertexSource, postTonemapSource);
    this.dofProgram = this.createProgram(postVertexSource, postDOFSource);

    if (!this.brightnessProgram || !this.blurProgram || !this.composeProgram || !this.taaProgram || !this.tonemapProgram || !this.dofProgram) {
      throw new Error('Failed to create post-processing programs');
    }
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
      console.error('Post-processing program link error:', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    return program;
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const { gl } = this;
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Post-processing shader compile error:', gl.getShaderInfoLog(shader));
      console.error('Source:', source);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private createQuadVAO(): void {
    const { gl } = this;

    // Fullscreen quad vertices (triangle strip)
    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    this.quadVAO = gl.createVertexArray();
    gl.bindVertexArray(this.quadVAO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  }

  private createFramebuffer(width: number, height: number, useHDR: boolean = false): { fbo: WebGLFramebuffer; texture: WebGLTexture } | null {
    const { gl } = this;

    const fbo = gl.createFramebuffer();
    const texture = gl.createTexture();

    if (!fbo || !texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Use HDR format (RGBA16F) if requested and supported
    if (useHDR && this.params.hdrEnabled) {
      // Check for float texture support
      const ext = gl.getExtension('EXT_color_buffer_float');
      if (ext) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null);
      } else {
        // Fallback to RGBA8 if HDR not supported
        console.warn('HDR (RGBA16F) not supported, falling back to RGBA8');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
    } else {
      // Use standard LDR format
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer incomplete:', status);
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(texture);
      return null;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return { fbo, texture };
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    const { gl } = this;

    // Clean up old framebuffers
    this.cleanup();

    // Create scene framebuffer (HDR if enabled)
    const scene = this.createFramebuffer(width, height, true);
    if (!scene) {
      console.error('Failed to create scene framebuffer');
      return;
    }
    this.sceneFramebuffer = scene.fbo;
    this.sceneTexture = scene.texture;

    // Create bloom framebuffer (half resolution for performance)
    const bloomW = Math.max(1, Math.floor(width / 2));
    const bloomH = Math.max(1, Math.floor(height / 2));

    const bloom = this.createFramebuffer(bloomW, bloomH);
    if (bloom) {
      this.bloomFramebuffer = bloom.fbo;
      this.bloomTexture = bloom.texture;
    }

    const blurH = this.createFramebuffer(bloomW, bloomH);
    if (blurH) {
      this.blurH_Framebuffer = blurH.fbo;
      this.blurH_Texture = blurH.texture;
    }

    const blurV = this.createFramebuffer(bloomW, bloomH);
    if (blurV) {
      this.blurV_Framebuffer = blurV.fbo;
      this.blurV_Texture = blurV.texture;
    }

    // Create TAA framebuffers
    const taa = this.createFramebuffer(width, height);
    if (taa) {
      this.taaFramebuffer = taa.fbo;
      this.taaTexture = taa.texture;
    }

    // Create TAA history texture (no framebuffer needed, just texture)
    this.taaHistoryTexture = gl.createTexture();
    if (this.taaHistoryTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.taaHistoryTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // Create DOF framebuffer
    const dof = this.createFramebuffer(width, height);
    if (dof) {
      this.dofFramebuffer = dof.fbo;
      this.dofTexture = dof.texture;
    }

    // Create depth texture (for DOF)
    this.depthTexture = gl.createTexture();
    if (this.depthTexture) {
      gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    this.taaResetAccumulation = true;
  }

  private cleanup(): void {
    const { gl } = this;

    const deleteFramebuffer = (fbo: WebGLFramebuffer | null) => {
      if (fbo) gl.deleteFramebuffer(fbo);
    };

    const deleteTexture = (tex: WebGLTexture | null) => {
      if (tex) gl.deleteTexture(tex);
    };

    deleteFramebuffer(this.sceneFramebuffer);
    deleteTexture(this.sceneTexture);
    deleteFramebuffer(this.bloomFramebuffer);
    deleteTexture(this.bloomTexture);
    deleteFramebuffer(this.blurH_Framebuffer);
    deleteTexture(this.blurH_Texture);
    deleteFramebuffer(this.blurV_Framebuffer);
    deleteTexture(this.blurV_Texture);
    deleteFramebuffer(this.taaFramebuffer);
    deleteTexture(this.taaTexture);
    deleteTexture(this.taaHistoryTexture);
    deleteFramebuffer(this.dofFramebuffer);
    deleteTexture(this.dofTexture);
    deleteTexture(this.depthTexture);
  }

  public beginScene(): void {
    const { gl } = this;
    if (!this.sceneFramebuffer) {
      console.error('Scene framebuffer not initialized');
      return;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFramebuffer);
    gl.viewport(0, 0, this.width, this.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  public endSceneAndCompose(): void {
    const { gl } = this;

    // Safety check
    if (!this.sceneTexture || !this.bloomFramebuffer || !this.blurH_Framebuffer ||
        !this.blurV_Framebuffer || !this.blurV_Texture) {
      console.error('Post-processor not fully initialized, skipping post-processing');
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
    }

    gl.bindVertexArray(this.quadVAO);
    let currentTexture = this.sceneTexture;

    // 1. Extract bright areas (Bloom)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomFramebuffer);
    gl.viewport(0, 0, Math.floor(this.width / 2), Math.floor(this.height / 2));
    gl.useProgram(this.brightnessProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentTexture);
    gl.uniform1i(gl.getUniformLocation(this.brightnessProgram!, 'uTexture'), 0);
    gl.uniform1f(gl.getUniformLocation(this.brightnessProgram!, 'uThreshold'), this.params.bloomThreshold);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 2. Horizontal blur
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurH_Framebuffer);
    gl.useProgram(this.blurProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.bloomTexture);
    gl.uniform1i(gl.getUniformLocation(this.blurProgram!, 'uTexture'), 0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram!, 'uDirection'), 1.0, 0.0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram!, 'uResolution'), Math.floor(this.width / 2), Math.floor(this.height / 2));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 3. Vertical blur
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurV_Framebuffer);
    gl.useProgram(this.blurProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.blurH_Texture);
    gl.uniform1i(gl.getUniformLocation(this.blurProgram!, 'uTexture'), 0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram!, 'uDirection'), 0.0, 1.0);
    gl.uniform2f(gl.getUniformLocation(this.blurProgram!, 'uResolution'), Math.floor(this.width / 2), Math.floor(this.height / 2));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // 4. TAA (if enabled)
    if (this.params.taaEnabled && this.taaFramebuffer && this.taaTexture && this.taaHistoryTexture) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.taaFramebuffer);
      gl.viewport(0, 0, this.width, this.height);
      gl.useProgram(this.taaProgram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.uniform1i(gl.getUniformLocation(this.taaProgram!, 'uCurrent'), 0);

      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.taaHistoryTexture);
      gl.uniform1i(gl.getUniformLocation(this.taaProgram!, 'uHistory'), 1);

      gl.uniform1f(gl.getUniformLocation(this.taaProgram!, 'uBlend'), this.params.taaBlend);
      gl.uniform1i(gl.getUniformLocation(this.taaProgram!, 'uReset'), this.taaResetAccumulation ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Copy TAA result to history for next frame
      this.copyTexture(this.taaTexture, this.taaHistoryTexture);

      currentTexture = this.taaTexture;
      this.taaResetAccumulation = false;
    }

    // 5. DOF (if enabled)
    if (this.params.dofEnabled && this.dofFramebuffer && this.dofTexture) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.dofFramebuffer);
      gl.viewport(0, 0, this.width, this.height);
      gl.useProgram(this.dofProgram);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);
      gl.uniform1i(gl.getUniformLocation(this.dofProgram!, 'uScene'), 0);

      gl.uniform2f(gl.getUniformLocation(this.dofProgram!, 'uResolution'), this.width, this.height);
      gl.uniform1f(gl.getUniformLocation(this.dofProgram!, 'uFocusDistance'), this.params.dofFocusDistance);
      gl.uniform1f(gl.getUniformLocation(this.dofProgram!, 'uAperture'), this.params.dofAperture);
      gl.uniform1f(gl.getUniformLocation(this.dofProgram!, 'uMaxBlur'), this.params.dofMaxBlur);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      currentTexture = this.dofTexture;
    }

    // 6. Final composition (with Tone Mapping and Bloom)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.useProgram(this.composeProgram);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, currentTexture);
    gl.uniform1i(gl.getUniformLocation(this.composeProgram!, 'uScene'), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.blurV_Texture);
    gl.uniform1i(gl.getUniformLocation(this.composeProgram!, 'uBloom'), 1);

    gl.uniform2f(gl.getUniformLocation(this.composeProgram!, 'uResolution'), this.width, this.height);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uBloomStrength'), this.params.bloomStrength);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uChroma'), this.params.chromatic);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uVignette'), this.params.vignette);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uExposure'), this.params.exposure);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uSaturation'), this.params.saturation);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uGamma'), this.params.gamma);
    gl.uniform1i(gl.getUniformLocation(this.composeProgram!, 'uTonemapMode'), this.params.tonemapMode);
    gl.uniform1i(gl.getUniformLocation(this.composeProgram!, 'uHDREnabled'), this.params.hdrEnabled ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    gl.bindVertexArray(null);
  }

  private copyTexture(src: WebGLTexture, dst: WebGLTexture): void {
    const { gl } = this;

    // Create temporary framebuffer for rendering src to dst
    const tmpFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, tmpFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dst, 0);

    // Use simple copy shader (we'll just use the compose program for now)
    gl.useProgram(this.composeProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.uniform1i(gl.getUniformLocation(this.composeProgram!, 'uScene'), 0);

    // Set all post-processing effects to zero for pure copy
    gl.uniform2f(gl.getUniformLocation(this.composeProgram!, 'uResolution'), this.width, this.height);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uBloomStrength'), 0.0);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uChroma'), 0.0);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uVignette'), 0.0);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uExposure'), 1.0);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uSaturation'), 1.0);
    gl.uniform1f(gl.getUniformLocation(this.composeProgram!, 'uGamma'), 1.0);

    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(tmpFbo);
  }

  public resetTAA(): void {
    this.taaResetAccumulation = true;
  }

  public destroy(): void {
    this.cleanup();

    const { gl } = this;

    if (this.brightnessProgram) gl.deleteProgram(this.brightnessProgram);
    if (this.blurProgram) gl.deleteProgram(this.blurProgram);
    if (this.composeProgram) gl.deleteProgram(this.composeProgram);
    if (this.taaProgram) gl.deleteProgram(this.taaProgram);
    if (this.tonemapProgram) gl.deleteProgram(this.tonemapProgram);
    if (this.dofProgram) gl.deleteProgram(this.dofProgram);
    if (this.quadVAO) gl.deleteVertexArray(this.quadVAO);
  }
}
