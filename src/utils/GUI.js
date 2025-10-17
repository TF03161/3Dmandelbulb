import GUI from 'lil-gui';

export class FractalGUI {
  constructor(fractalScene) {
    this.fractalScene = fractalScene;
    this.gui = new GUI({ title: '3D Fractal Controls' });

    this.params = {
      mode: 'Mandelbulb',
      power: 8.0,
      iterations: 80,
      maxSteps: 120,
      // Flower of Life
      folRadius: 1.0,
      folSpacing: 1.0,
      folThickness: 0.5,
      folExtrude: 0.5,
      folTwist: 0.0,
      folSpiral: 0.0,
      folHarmonic: 0.0,
      folHyper: 0.0,
      // Mandelbox
      mbScale: 2.0,
      mbMinRadius: 0.5,
      mbFixedRadius: 1.0,
      mbIterations: 12,
      // Quaternion Julia
      quatCx: 0.0,
      quatCy: 0.8,
      quatCz: 0.0,
      quatCw: 0.2,
      quatPower: 8.0,
      quatScale: 1.0,
      // Color
      colorShift: 0.0,
      colorIntensity: 1.0
    };

    this.setupGUI();
  }

  setupGUI() {
    // Fractal Mode
    const modes = {
      'Mandelbulb': 0,
      'Flower of Life': 1,
      'Mandelbox': 2,
      'Quaternion Julia': 3
    };

    this.gui.add(this.params, 'mode', Object.keys(modes)).name('Fractal Mode').onChange((value) => {
      this.fractalScene.setMode(modes[value]);
      this.updateVisibility(modes[value]);
    });

    // Common parameters
    const commonFolder = this.gui.addFolder('Common Parameters');
    commonFolder.add(this.params, 'power', 2, 16, 0.1).name('Power').onChange((v) => {
      this.fractalScene.setPower(v);
    });
    commonFolder.add(this.params, 'iterations', 20, 250, 1).name('Iterations').onChange((v) => {
      this.fractalScene.setIterations(v);
    });
    commonFolder.add(this.params, 'maxSteps', 64, 400, 1).name('Max Steps').onChange((v) => {
      this.fractalScene.setMaxSteps(v);
    });
    commonFolder.open();

    // Flower of Life parameters
    this.folFolder = this.gui.addFolder('Flower of Life');
    this.folFolder.add(this.params, 'folRadius', 0.4, 2.5, 0.01).name('Radius').onChange((v) => {
      this.fractalScene.setFlowerParam('radius', v);
    });
    this.folFolder.add(this.params, 'folSpacing', 0.4, 2.5, 0.01).name('Spacing').onChange((v) => {
      this.fractalScene.setFlowerParam('spacing', v);
    });
    this.folFolder.add(this.params, 'folThickness', 0.0, 1.0, 0.01).name('Thickness').onChange((v) => {
      this.fractalScene.setFlowerParam('thickness', v);
    });
    this.folFolder.add(this.params, 'folExtrude', 0.0, 1.0, 0.01).name('Extrude').onChange((v) => {
      this.fractalScene.setFlowerParam('extrude', v);
    });
    this.folFolder.add(this.params, 'folTwist', -3.14, 3.14, 0.01).name('Twist').onChange((v) => {
      this.fractalScene.setFlowerParam('twist', v);
    });
    this.folFolder.add(this.params, 'folSpiral', 0.0, 1.0, 0.01).name('Spiral').onChange((v) => {
      this.fractalScene.setFlowerParam('spiral', v);
    });
    this.folFolder.add(this.params, 'folHarmonic', 0.0, 1.0, 0.01).name('Harmonic').onChange((v) => {
      this.fractalScene.setFlowerParam('harmonic', v);
    });
    this.folFolder.add(this.params, 'folHyper', 0.0, 1.0, 0.01).name('Hyper').onChange((v) => {
      this.fractalScene.setFlowerParam('hyper', v);
    });
    this.folFolder.close();
    this.folFolder.hide();

    // Mandelbox parameters
    this.mbFolder = this.gui.addFolder('Mandelbox');
    this.mbFolder.add(this.params, 'mbScale', 1.5, 2.8, 0.01).name('Scale').onChange((v) => {
      this.fractalScene.setMandelboxParam('scale', v);
    });
    this.mbFolder.add(this.params, 'mbMinRadius', 0.05, 1.0, 0.01).name('Min Radius').onChange((v) => {
      this.fractalScene.setMandelboxParam('minRadius', v);
    });
    this.mbFolder.add(this.params, 'mbFixedRadius', 0.5, 2.5, 0.01).name('Fixed Radius').onChange((v) => {
      this.fractalScene.setMandelboxParam('fixedRadius', v);
    });
    this.mbFolder.add(this.params, 'mbIterations', 4, 30, 1).name('Iterations').onChange((v) => {
      this.fractalScene.setMandelboxParam('iterations', v);
    });
    this.mbFolder.close();
    this.mbFolder.hide();

    // Quaternion Julia parameters
    this.quatFolder = this.gui.addFolder('Quaternion Julia');
    this.quatFolder.add(this.params, 'quatCx', -1.5, 1.5, 0.01).name('C.x').onChange((v) => {
      this.fractalScene.setQuatParam('cx', v);
    });
    this.quatFolder.add(this.params, 'quatCy', -1.5, 1.5, 0.01).name('C.y').onChange((v) => {
      this.fractalScene.setQuatParam('cy', v);
    });
    this.quatFolder.add(this.params, 'quatCz', -1.5, 1.5, 0.01).name('C.z').onChange((v) => {
      this.fractalScene.setQuatParam('cz', v);
    });
    this.quatFolder.add(this.params, 'quatCw', -1.5, 1.5, 0.01).name('C.w').onChange((v) => {
      this.fractalScene.setQuatParam('cw', v);
    });
    this.quatFolder.add(this.params, 'quatPower', 2.0, 12.0, 0.1).name('Power').onChange((v) => {
      this.fractalScene.setQuatParam('power', v);
    });
    this.quatFolder.add(this.params, 'quatScale', 0.5, 1.5, 0.01).name('Scale').onChange((v) => {
      this.fractalScene.setQuatParam('scale', v);
    });
    this.quatFolder.close();
    this.quatFolder.hide();

    // Color parameters
    const colorFolder = this.gui.addFolder('Color');
    colorFolder.add(this.params, 'colorShift', 0.0, 1.0, 0.01).name('Hue Shift').onChange((v) => {
      this.fractalScene.setColorParam('shift', v);
    });
    colorFolder.add(this.params, 'colorIntensity', 0.0, 2.0, 0.01).name('Intensity').onChange((v) => {
      this.fractalScene.setColorParam('intensity', v);
    });
    colorFolder.open();
  }

  updateVisibility(mode) {
    // Hide all mode-specific folders
    this.folFolder.hide();
    this.mbFolder.hide();
    this.quatFolder.hide();

    // Show relevant folder
    if (mode === 1) {
      this.folFolder.show();
    } else if (mode === 2) {
      this.mbFolder.show();
    } else if (mode === 3) {
      this.quatFolder.show();
    }
  }

  destroy() {
    this.gui.destroy();
  }
}
