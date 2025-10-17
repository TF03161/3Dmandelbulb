import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FractalScene } from './scenes/FractalScene.js';
import { FractalGUI } from './utils/GUI.js';
import { Stats } from './utils/Stats.js';

class App {
  constructor() {
    this.canvas = document.getElementById('gl');
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.setupRenderer();
    this.setupScene();
    this.setupCamera();
    this.setupControls();
    this.setupEventListeners();

    this.fractalScene = new FractalScene(this.scene, this.camera, this.renderer);
    this.gui = new FractalGUI(this.fractalScene);
    this.stats = new Stats();

    this.animate();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.width / this.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 3);
  }

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10;
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.fractalScene.onResize(this.width, this.height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.stats.update();
    this.controls.update();
    this.fractalScene.update();

    this.renderer.render(this.scene, this.camera);
  }
}

// Start the application
new App();
