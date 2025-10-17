export class Stats {
  constructor() {
    this.fps = 0;
    this.frameTime = 0;
    this.lastTime = performance.now();
    this.frames = 0;
    this.fpsUpdateInterval = 500; // Update FPS every 500ms
    this.lastFpsUpdate = this.lastTime;

    this.createStatsPanel();
  }

  createStatsPanel() {
    this.panel = document.createElement('div');
    this.panel.style.cssText = `
      position: absolute;
      left: 14px;
      top: 14px;
      background: rgba(17, 17, 17, 0.9);
      border: 1px solid #222;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 11px;
      font-family: monospace;
      color: #e5e5e5;
      z-index: 100;
    `;

    this.fpsDiv = document.createElement('div');
    this.fpsDiv.style.margin = '2px 0';
    this.fpsDiv.style.opacity = '0.8';

    this.frameTimeDiv = document.createElement('div');
    this.frameTimeDiv.style.margin = '2px 0';
    this.frameTimeDiv.style.opacity = '0.8';

    this.panel.appendChild(this.fpsDiv);
    this.panel.appendChild(this.frameTimeDiv);

    document.body.appendChild(this.panel);

    this.updateDisplay();
  }

  update() {
    const now = performance.now();
    this.frameTime = now - this.lastTime;
    this.lastTime = now;
    this.frames++;

    // Update FPS every interval
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.fps = Math.round((this.frames * 1000) / (now - this.lastFpsUpdate));
      this.frames = 0;
      this.lastFpsUpdate = now;
      this.updateDisplay();
    }
  }

  updateDisplay() {
    this.fpsDiv.textContent = `FPS: ${this.fps}`;
    this.frameTimeDiv.textContent = `Frame: ${this.frameTime.toFixed(1)} ms`;
  }

  destroy() {
    if (this.panel && this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}
