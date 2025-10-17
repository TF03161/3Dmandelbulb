import * as THREE from 'three';
import vertexShader from '../shaders/mandelbulb.vert?raw';
import fragmentShader from '../shaders/mandelbulb.frag?raw';

export class FractalScene {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.params = {
      mode: 0,
      power: 8.0,
      iterations: 80,
      maxSteps: 120,
      folRadius: 1.0,
      folSpacing: 1.0,
      folThickness: 0.5,
      folExtrude: 0.5,
      folTwist: 0.0,
      folSpiral: 0.0,
      folHarmonic: 0.0,
      folHyper: 0.0,
      mbScale: 2.0,
      mbMinRadius: 0.5,
      mbFixedRadius: 1.0,
      mbIterations: 12,
      quatCx: 0.0,
      quatCy: 0.8,
      quatCz: 0.0,
      quatCw: 0.2,
      quatPower: 8.0,
      quatScale: 1.0,
      colorShift: 0.0,
      colorIntensity: 1.0
    };

    this.createRaymarchMaterial();
    this.createQuad();
  }

  createRaymarchMaterial() {
    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uCameraPos: { value: new THREE.Vector3() },
      uCameraMatrix: { value: new THREE.Matrix4() },
      uPower: { value: this.params.power },
      uIterations: { value: this.params.iterations },
      uMaxSteps: { value: this.params.maxSteps },
      uMode: { value: this.params.mode },
      uFolRadius: { value: this.params.folRadius },
      uFolSpacing: { value: this.params.folSpacing },
      uFolThickness: { value: this.params.folThickness },
      uFolExtrude: { value: this.params.folExtrude },
      uFolTwist: { value: this.params.folTwist },
      uFolSpiral: { value: this.params.folSpiral },
      uFolHarmonic: { value: this.params.folHarmonic },
      uFolHyper: { value: this.params.folHyper },
      uMbScale: { value: this.params.mbScale },
      uMbMinRadius: { value: this.params.mbMinRadius },
      uMbFixedRadius: { value: this.params.mbFixedRadius },
      uMbIterations: { value: this.params.mbIterations },
      uQuatC: { value: new THREE.Vector4(this.params.quatCx, this.params.quatCy, this.params.quatCz, this.params.quatCw) },
      uQuatPower: { value: this.params.quatPower },
      uQuatScale: { value: this.params.quatScale },
      uColorShift: { value: this.params.colorShift },
      uColorIntensity: { value: this.params.colorIntensity }
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: this.uniforms,
      side: THREE.DoubleSide
    });
  }

  createQuad() {
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  updateUniforms() {
    this.uniforms.uTime.value = performance.now() * 0.001;
    this.uniforms.uCameraPos.value.copy(this.camera.position);
    this.uniforms.uCameraMatrix.value.copy(this.camera.matrixWorld);
    this.uniforms.uPower.value = this.params.power;
    this.uniforms.uIterations.value = this.params.iterations;
    this.uniforms.uMaxSteps.value = this.params.maxSteps;
    this.uniforms.uMode.value = this.params.mode;
    this.uniforms.uFolRadius.value = this.params.folRadius;
    this.uniforms.uFolSpacing.value = this.params.folSpacing;
    this.uniforms.uFolThickness.value = this.params.folThickness;
    this.uniforms.uFolExtrude.value = this.params.folExtrude;
    this.uniforms.uFolTwist.value = this.params.folTwist;
    this.uniforms.uFolSpiral.value = this.params.folSpiral;
    this.uniforms.uFolHarmonic.value = this.params.folHarmonic;
    this.uniforms.uFolHyper.value = this.params.folHyper;
    this.uniforms.uMbScale.value = this.params.mbScale;
    this.uniforms.uMbMinRadius.value = this.params.mbMinRadius;
    this.uniforms.uMbFixedRadius.value = this.params.mbFixedRadius;
    this.uniforms.uMbIterations.value = this.params.mbIterations;
    this.uniforms.uQuatC.value.set(this.params.quatCx, this.params.quatCy, this.params.quatCz, this.params.quatCw);
    this.uniforms.uQuatPower.value = this.params.quatPower;
    this.uniforms.uQuatScale.value = this.params.quatScale;
    this.uniforms.uColorShift.value = this.params.colorShift;
    this.uniforms.uColorIntensity.value = this.params.colorIntensity;
  }

  update() {
    this.updateUniforms();
  }

  onResize(width, height) {
    this.uniforms.uResolution.value.set(width, height);
  }

  setMode(mode) {
    this.params.mode = mode;
  }

  setPower(power) {
    this.params.power = power;
  }

  setIterations(iterations) {
    this.params.iterations = iterations;
  }

  setMaxSteps(maxSteps) {
    this.params.maxSteps = maxSteps;
  }

  setFlowerParam(param, value) {
    const paramMap = {
      radius: 'folRadius',
      spacing: 'folSpacing',
      thickness: 'folThickness',
      extrude: 'folExtrude',
      twist: 'folTwist',
      spiral: 'folSpiral',
      harmonic: 'folHarmonic',
      hyper: 'folHyper'
    };

    const key = paramMap[param];
    if (key) {
      this.params[key] = value;
    }
  }

  setMandelboxParam(param, value) {
    const paramMap = {
      scale: 'mbScale',
      minRadius: 'mbMinRadius',
      fixedRadius: 'mbFixedRadius',
      iterations: 'mbIterations'
    };

    const key = paramMap[param];
    if (key) {
      this.params[key] = value;
    }
  }

  setQuatParam(param, value) {
    const key = 'quat' + param.charAt(0).toUpperCase() + param.slice(1);
    if (this.params.hasOwnProperty(key)) {
      this.params[key] = value;
    }
  }

  setColorParam(param, value) {
    if (param === 'shift') {
      this.params.colorShift = value;
    } else if (param === 'intensity') {
      this.params.colorIntensity = value;
    }
  }
}
