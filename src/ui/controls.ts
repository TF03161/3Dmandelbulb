/**
 * UI Controls for 3D Mandelbulb Parameters
 * Using lil-gui for interactive controls
 */

import GUI from 'lil-gui';

interface RendererWithParams {
  params: {
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
    // Fibonacci Shell
    fibSpiral: number;
    fibBend: number;
    fibWarp: number;
    fibOffset: number;
    fibLayer: number;
    fibInward: number;
    fibBandGap: number;
    fibVortex: number;
    // Mandelbox
    mbScale: number;
    mbMinRadius: number;
    mbFixedRadius: number;
    mbIter: number;
    // Metatron Cube
    metaRadius: number;
    metaSpacing: number;
    metaNode: number;
    metaStrut: number;
    metaLayer: number;
    metaTwist: number;
    // Gyroid Cathedral
    gyroLevel: number;
    gyroScale: number;
    gyroMod: number;
    // Typhoon
    tyEye: number;
    tyPull: number;
    tyWall: number;
    tySpin: number;
    tyBand: number;
    tyNoise: number;
    // Quaternion Julia
    quatC: Float32Array;
    quatPower: number;
    quatScale: number;
    // Cosmic Bloom
    cosRadius: number;
    cosExpansion: number;
    cosRipple: number;
    cosSpiral: number;
  };
}

function initControls(): void {
  // Wait for renderer to be available
  const checkRenderer = setInterval(() => {
    const renderer = (window as typeof window & { renderer?: RendererWithParams }).renderer;

    if (renderer) {
      clearInterval(checkRenderer);
      setupGUI(renderer);
      setupControlButtons(renderer);
    }
  }, 100);
}

// Setup HTML control buttons (Auto Color, Auto Morph, Screenshot, Record Video, Export GLB)
function setupControlButtons(renderer: RendererWithParams): void {
  const btnAutoColor = document.getElementById('btnAutoColor');
  const btnAutoMorph = document.getElementById('btnAutoMorph');
  const btnScreenshot = document.getElementById('btnScreenshot');
  const btnRecordVideo = document.getElementById('btnRecordVideo');
  const btnExportGLB = document.getElementById('btnExportGLB');

  if (btnAutoColor) {
    btnAutoColor.addEventListener('click', () => {
      const r = (window as typeof window & { renderer?: { autoColorCycle: boolean } }).renderer;
      if (r) {
        r.autoColorCycle = !r.autoColorCycle;
        btnAutoColor.textContent = `Auto Color: ${r.autoColorCycle ? 'On' : 'Off'}`;
        btnAutoColor.classList.toggle('active', r.autoColorCycle);

        // Sync with lil-gui controller
        const controller = (window as any).autoColorController;
        if (controller) {
          controller.setValue(r.autoColorCycle);
        }
      }
    });
  }

  if (btnAutoMorph) {
    btnAutoMorph.addEventListener('click', () => {
      const r = (window as typeof window & { renderer?: { autoMorphing: boolean } }).renderer;
      if (r) {
        r.autoMorphing = !r.autoMorphing;
        btnAutoMorph.textContent = `Auto Morph: ${r.autoMorphing ? 'On' : 'Off'}`;
        btnAutoMorph.classList.toggle('active', r.autoMorphing);

        // Sync with lil-gui controller
        const controller = (window as any).autoMorphController;
        if (controller) {
          controller.setValue(r.autoMorphing);
        }
      }
    });
  }

  if (btnScreenshot) {
    btnScreenshot.addEventListener('click', () => {
      const canvas = document.getElementById('gl') as HTMLCanvasElement;
      if (!canvas) {
        alert('Canvas not found. Please try again.');
        return;
      }

      // Get current mode for filename
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      const modeNames = [
        'Mandelbulb', 'FoLD', 'Fibonacci', 'Mandelbox',
        'Metatron', 'Gyroid', 'Typhoon', 'Quaternion', 'Cosmic'
      ];
      const modeName = r ? modeNames[r.params.mode] || 'Fractal' : 'Fractal';

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Failed to capture screenshot. Please try again.');
          return;
        }

        // Download the screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${modeName}-screenshot-${timestamp}.png`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();

        // Cleanup
        URL.revokeObjectURL(url);
      }, 'image/png');
    });
  }

  // Video Recording button
  if (btnRecordVideo) {
    let recorder: any = null;
    let isRecording = false;

    btnRecordVideo.addEventListener('click', async () => {
      if (!isRecording) {
        // 録画開始
        try {
          const canvas = document.getElementById('gl') as HTMLCanvasElement;
          if (!canvas) {
            alert('Canvas not found. Please try again.');
            return;
          }

          // 動的インポート
          const { VideoRecorder, downloadVideoBlob } = await import('../export/video-recorder');

          recorder = new VideoRecorder({
            canvas,
            fps: 60,
            videoBitsPerSecond: 8000000, // 8 Mbps
            onProgress: (seconds) => {
              btnRecordVideo.textContent = `⏹️ Stop (${seconds.toFixed(1)}s)`;
            }
          });

          await recorder.startRecording();
          isRecording = true;
          btnRecordVideo.textContent = '⏹️ Stop (0.0s)';
          btnRecordVideo.style.background = 'rgba(255, 77, 77, 0.3)';
          btnRecordVideo.style.borderColor = '#ff4d4d';

        } catch (error) {
          console.error('Failed to start recording:', error);
          alert('Failed to start video recording: ' + (error instanceof Error ? error.message : 'Unknown error'));
          isRecording = false;
        }

      } else {
        // 録画停止
        try {
          btnRecordVideo.textContent = '⏳ Processing...';
          btnRecordVideo.setAttribute('disabled', 'true');

          const blob = await recorder.stopRecording();

          // ファイル名を生成
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
          const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
          const modeNames = [
            'Mandelbulb', 'FoLD', 'Fibonacci', 'Mandelbox',
            'Metatron', 'Gyroid', 'Typhoon', 'Quaternion', 'Cosmic'
          ];
          const modeName = r ? modeNames[r.params.mode] || 'Fractal' : 'Fractal';

          // 拡張子を決定（MIMEタイプから）
          const extension = blob.type.includes('webm') ? 'webm' : 'mp4';
          const filename = `${modeName}-video-${timestamp}.${extension}`;

          // 動的インポート
          const { downloadVideoBlob } = await import('../export/video-recorder');
          downloadVideoBlob(blob, filename);

          // ボタンをリセット
          btnRecordVideo.textContent = '🎬 Record Video';
          btnRecordVideo.style.background = 'rgba(255, 77, 77, 0.1)';
          btnRecordVideo.style.borderColor = '#ff4d4d';
          btnRecordVideo.removeAttribute('disabled');
          isRecording = false;
          recorder = null;

        } catch (error) {
          console.error('Failed to stop recording:', error);
          alert('Failed to save video: ' + (error instanceof Error ? error.message : 'Unknown error'));
          btnRecordVideo.textContent = '🎬 Record Video';
          btnRecordVideo.removeAttribute('disabled');
          isRecording = false;
        }
      }
    });
  }

  if (btnExportGLB) {
    btnExportGLB.addEventListener('click', async () => {
      // Get current renderer params to detect which model is displayed
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) {
        alert('Renderer not ready. Please wait a moment and try again.');
        return;
      }

      // Get selected export resolution
      const exportResolutionSelect = document.getElementById('exportResolution') as HTMLSelectElement;
      const exportResolution = exportResolutionSelect ? parseInt(exportResolutionSelect.value, 10) : 192;

      // Dynamic import to avoid bundling issues
      const { exportModelInBrowser, downloadBlob } = await import('../export/browser-export');

      const originalText = btnExportGLB.textContent;
      btnExportGLB.textContent = '⏳ Exporting...';
      btnExportGLB.setAttribute('disabled', 'true');

      // Detect model name
      const modeNames = [
        'Mandelbulb', 'FoLD', 'Fibonacci', 'Mandelbox',
        'Metatron', 'Gyroid', 'Typhoon', 'Quaternion', 'Cosmic'
      ];
      const modelName = modeNames[r.params.mode] || 'Model';

      // Create progress overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        backdrop-filter: blur(10px);
      `;

      const progressBox = document.createElement('div');
      progressBox.style.cssText = `
        background: rgba(17, 17, 17, 0.95);
        border: 2px solid var(--accent);
        border-radius: 12px;
        padding: 32px;
        min-width: 400px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0, 255, 204, 0.3);
      `;

      const title = document.createElement('h3');
      title.textContent = `Exporting ${modelName} to GLB`;
      title.style.cssText = `
        margin: 0 0 20px 0;
        color: var(--accent);
        font-size: 18px;
      `;

      const progressText = document.createElement('div');
      progressText.style.cssText = `
        color: var(--text);
        font-size: 14px;
        margin-bottom: 16px;
      `;
      progressText.textContent = 'Initializing...';

      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: hidden;
      `;

      const progressFill = document.createElement('div');
      progressFill.style.cssText = `
        width: 0%;
        height: 100%;
        background: var(--accent);
        transition: width 0.3s;
      `;

      progressBar.appendChild(progressFill);
      progressBox.appendChild(title);
      progressBox.appendChild(progressText);
      progressBox.appendChild(progressBar);
      overlay.appendChild(progressBox);
      document.body.appendChild(overlay);

      try {
        const blob = await exportModelInBrowser({
          mode: r.params.mode,
          resolution: exportResolution,
          // Common params
          maxIterations: r.params.maxIterations,
          powerBase: r.params.powerBase,
          powerAmp: r.params.powerAmp,
          fold: r.params.fold,
          boxSize: r.params.boxSize,
          morphOn: r.params.morphOn,
          // FoLD params
          radius: 15.0,
          count: 0.5,
          width: 0.20,
          thickness: 0.12,
          smooth: 0.08,
          strength: 0.30,
          // Fibonacci params
          fibSpiral: r.params.fibSpiral,
          fibBend: r.params.fibBend,
          fibWarp: r.params.fibWarp,
          fibOffset: r.params.fibOffset,
          fibLayer: r.params.fibLayer,
          fibInward: r.params.fibInward,
          fibBandGap: r.params.fibBandGap,
          fibVortex: r.params.fibVortex,
          // Mandelbox params
          mbScale: r.params.mbScale,
          mbMinRadius: r.params.mbMinRadius,
          mbFixedRadius: r.params.mbFixedRadius,
          mbIter: r.params.mbIter,
          // Metatron params
          metaRadius: r.params.metaRadius,
          metaSpacing: r.params.metaSpacing,
          metaNode: r.params.metaNode,
          metaStrut: r.params.metaStrut,
          metaLayer: r.params.metaLayer,
          metaTwist: r.params.metaTwist,
          // Gyroid params
          gyroLevel: r.params.gyroLevel,
          gyroScale: r.params.gyroScale,
          gyroMod: r.params.gyroMod,
          // Typhoon params
          tyEye: r.params.tyEye,
          tyPull: r.params.tyPull,
          tyWall: r.params.tyWall,
          tySpin: r.params.tySpin,
          tyBand: r.params.tyBand,
          tyNoise: r.params.tyNoise,
          // Quaternion params
          quatC: r.params.quatC,
          quatPower: r.params.quatPower,
          quatScale: r.params.quatScale,
          // Cosmic params
          cosRadius: r.params.cosRadius,
          cosExpansion: r.params.cosExpansion,
          cosRipple: r.params.cosRipple,
          cosSpiral: r.params.cosSpiral,
          onProgress: (current, total, message) => {
            const percent = Math.round((current / total) * 100);
            progressFill.style.width = `${percent}%`;
            progressText.textContent = `${message} (${percent}%)`;
          }
        });

        // Download the blob
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        downloadBlob(blob, `${modelName}-${timestamp}.glb`);

        // Success message
        progressText.textContent = '✅ Export complete! Download started.';
        progressFill.style.width = '100%';

        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 2000);

      } catch (error) {
        console.error('Export failed:', error);
        progressText.textContent = `❌ Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        progressText.style.color = 'var(--danger)';

        setTimeout(() => {
          document.body.removeChild(overlay);
        }, 3000);
      } finally {
        btnExportGLB.textContent = originalText;
        btnExportGLB.removeAttribute('disabled');
      }
    });
  }
}

function updateFormula(mode: number): void {
  const formulaContent = document.getElementById('formula-content');
  if (!formulaContent) return;

  if (mode === 0) {
    // Mandelbulb formula
    formulaContent.innerHTML = `
      <div><span class="var">z</span><sub>n+1</sub> = <span class="var">z</span><sub>n</sub><sup class="param">p</sup> + <span class="var">c</span></div>
      <div style="margin-top:8px;">Spherical coordinates:</div>
      <div><span class="var">r</span> = |<span class="var">z</span>|, <span class="var">θ</span> = acos(<span class="var">z.z</span>/<span class="var">r</span>), <span class="var">φ</span> = atan(<span class="var">z.y</span>, <span class="var">z.x</span>)</div>
      <div><span class="var">z'</span> = <span class="var">r</span><sup class="param">p</sup>(sin(<span class="param">p</span><span class="var">θ</span>)cos(<span class="param">p</span><span class="var">φ</span>), sin(<span class="param">p</span><span class="var">θ</span>)sin(<span class="param">p</span><span class="var">φ</span>), cos(<span class="param">p</span><span class="var">θ</span>))</div>
      <div style="margin-top:4px;"><span class="param">p</span> = power (typically 8)</div>
    `;
  } else if (mode === 1) {
    // Flower of Life formula
    formulaContent.innerHTML = `
      <div>Distance to circle on sphere:</div>
      <div><span class="var">d</span> = ||<span class="var">arcDist</span> - <span class="param">R</span>| - <span class="param">t</span>|</div>
      <div style="margin-top:8px;">Arc distance:</div>
      <div><span class="var">arcDist</span> = <span class="param">R</span> · acos(dot(<span class="var">p̂</span>, <span class="var">ĉ</span>))</div>
      <div style="margin-top:4px;"><span class="param">R</span> = radius, <span class="param">t</span> = thickness</div>
      <div>Multiple circles: <span class="var">d</span> = min(<span class="var">d</span><sub>1</sub>, <span class="var">d</span><sub>2</sub>, ..., <span class="var">d</span><sub>n</sub>)</div>
    `;
  } else if (mode === 2) {
    // Fibonacci Shell formula
    formulaContent.innerHTML = `
      <div>Fibonacci Spiral with Golden Angle:</div>
      <div><span class="var">φ</span><sub>n+1</sub> = <span class="var">φ</span><sub>n</sub> + <span class="param">φ<sub>gold</sub></span> + <span class="param">spiral</span></div>
      <div style="margin-top:8px;">Golden Angle:</div>
      <div><span class="param">φ<sub>gold</sub></span> ≈ 2.3999... radians</div>
      <div style="margin-top:4px;">Power iteration with spherical coordinates</div>
    `;
  } else if (mode === 3) {
    // Mandelbox formula
    formulaContent.innerHTML = `
      <div>Box Folding + Sphere Folding:</div>
      <div><span class="var">z</span> = boxFold(<span class="var">z</span>) → sphereFold(<span class="var">z</span>)</div>
      <div style="margin-top:8px;">Box Fold:</div>
      <div><span class="var">z</span> = clamp(<span class="var">z</span>, -1, 1) · 2 - <span class="var">z</span></div>
      <div style="margin-top:4px;">Then scale and add offset</div>
    `;
  } else if (mode === 4) {
    // Metatron Cube formula
    formulaContent.innerHTML = `
      <div>Sacred Geometry - 13 Spheres:</div>
      <div><span class="var">d</span> = min(spheres) + strutsUnion</div>
      <div style="margin-top:8px;">3-Layer Structure:</div>
      <div>Layer 1: Center sphere</div>
      <div>Layer 2: 6 surrounding spheres</div>
      <div>Layer 3: 6 outer spheres</div>
    `;
  } else if (mode === 5) {
    // Gyroid Cathedral formula
    formulaContent.innerHTML = `
      <div>Gyroid Minimal Surface:</div>
      <div><span class="var">g</span> = sin(<span class="var">x</span>)cos(<span class="var">y</span>) + sin(<span class="var">y</span>)cos(<span class="var">z</span>) + sin(<span class="var">z</span>)cos(<span class="var">x</span>)</div>
      <div style="margin-top:8px;">Triply periodic surface</div>
      <div>Zero mean curvature everywhere</div>
    `;
  }
}

// Professional Color Design System based on color theory
interface ColorPalette {
  name: string;
  colors: string[]; // 5-6 harmonious colors
  mode: number;
  theory: 'complementary' | 'analogous' | 'triadic' | 'split-complementary' | 'monochromatic';
}

interface PaletteCategory {
  category: string;
  icon: string;
  palettes: ColorPalette[];
}

const COLOR_DESIGN_SYSTEM: PaletteCategory[] = [
  {
    category: 'Natural & Organic',
    icon: '🌿',
    palettes: [
      {
        name: 'Forest Canopy',
        colors: ['#1a4d2e', '#2e7d4e', '#4da86a', '#7bc47f', '#a8e6a3'],
        mode: 0,
        theory: 'analogous'
      },
      {
        name: 'Ocean Breeze',
        colors: ['#003d5c', '#0077be', '#00a8e8', '#48cae4', '#90e0ef'],
        mode: 1,
        theory: 'monochromatic'
      },
      {
        name: 'Desert Sunset',
        colors: ['#d4a574', '#e6b89c', '#f4d1ae', '#fae3c6', '#ffe5d4'],
        mode: 2,
        theory: 'analogous'
      },
      {
        name: 'Mountain Mist',
        colors: ['#4a5f6a', '#6b8189', '#8ba3a7', '#a8c5c5', '#c5e0e0'],
        mode: 3,
        theory: 'monochromatic'
      },
      {
        name: 'Cherry Blossom',
        colors: ['#ff9ebb', '#ffb3d1', '#ffc8e3', '#ffe0f0', '#fff5fa'],
        mode: 4,
        theory: 'monochromatic'
      }
    ]
  },
  {
    category: 'Vibrant & Energetic',
    icon: '⚡',
    palettes: [
      {
        name: 'Electric Neon',
        colors: ['#ff006e', '#8338ec', '#3a86ff', '#00f5ff', '#06ffa5'],
        mode: 5,
        theory: 'triadic'
      },
      {
        name: 'Cyberpunk',
        colors: ['#ff0080', '#bf00ff', '#8000ff', '#4000ff', '#0080ff'],
        mode: 6,
        theory: 'analogous'
      },
      {
        name: 'Tropical Paradise',
        colors: ['#ff006e', '#fb5607', '#ffbe0b', '#8ac926', '#00f5d4'],
        mode: 7,
        theory: 'complementary'
      },
      {
        name: 'Aurora Borealis',
        colors: ['#00ff87', '#00e5ff', '#00b8ff', '#7c3aed', '#c026d3'],
        mode: 8,
        theory: 'split-complementary'
      },
      {
        name: 'Sunset Blaze',
        colors: ['#ff4e50', '#fc913a', '#f9d62e', '#eae374', '#e2f4c7'],
        mode: 9,
        theory: 'analogous'
      }
    ]
  },
  {
    category: 'Cosmic & Mystical',
    icon: '🌌',
    palettes: [
      {
        name: 'Deep Space',
        colors: ['#0a0e27', '#1a1f4d', '#2d3561', '#4a5073', '#6b7089'],
        mode: 10,
        theory: 'monochromatic'
      },
      {
        name: 'Nebula Dream',
        colors: ['#5b0a91', '#8b3fce', '#b565d8', '#d98ce0', '#f3b4e6'],
        mode: 11,
        theory: 'analogous'
      },
      {
        name: 'Stardust',
        colors: ['#4c1d95', '#7c3aed', '#a78bfa', '#c4b5fd', '#e0e7ff'],
        mode: 12,
        theory: 'monochromatic'
      },
      {
        name: 'Galaxy Spiral',
        colors: ['#1e3a8a', '#3730a3', '#6366f1', '#a855f7', '#ec4899'],
        mode: 13,
        theory: 'triadic'
      },
      {
        name: 'Cosmic Dust',
        colors: ['#312e81', '#4c1d95', '#701a75', '#9f1239', '#be123c'],
        mode: 14,
        theory: 'analogous'
      }
    ]
  },
  {
    category: 'Monochrome & Minimal',
    icon: '◼️',
    palettes: [
      {
        name: 'Charcoal',
        colors: ['#0f0f0f', '#262626', '#3f3f3f', '#595959', '#737373'],
        mode: 15,
        theory: 'monochromatic'
      },
      {
        name: 'Pure Blue',
        colors: ['#001f3f', '#003d7a', '#0062cc', '#0084ff', '#4da6ff'],
        mode: 16,
        theory: 'monochromatic'
      },
      {
        name: 'Royal Purple',
        colors: ['#1a0033', '#330066', '#4d0099', '#6600cc', '#8000ff'],
        mode: 17,
        theory: 'monochromatic'
      },
      {
        name: 'Emerald',
        colors: ['#00331a', '#006633', '#00994d', '#00cc66', '#00ff80'],
        mode: 18,
        theory: 'monochromatic'
      },
      {
        name: 'Crimson',
        colors: ['#330000', '#660000', '#990000', '#cc0000', '#ff1a1a'],
        mode: 19,
        theory: 'monochromatic'
      }
    ]
  },
  {
    category: 'Pastel & Soft',
    icon: '🌸',
    palettes: [
      {
        name: 'Cotton Candy',
        colors: ['#ffc8dd', '#ffafcc', '#bde0fe', '#a2d2ff', '#cdb4db'],
        mode: 20,
        theory: 'analogous'
      },
      {
        name: 'Mint Cream',
        colors: ['#d8f3dc', '#b7e4c7', '#95d5b2', '#74c69d', '#52b788'],
        mode: 21,
        theory: 'monochromatic'
      },
      {
        name: 'Lavender Dreams',
        colors: ['#e0aaff', '#c77dff', '#9d4edd', '#7b2cbf', '#5a189a'],
        mode: 22,
        theory: 'monochromatic'
      },
      {
        name: 'Peach Sorbet',
        colors: ['#ffe5ec', '#ffc2d1', '#ffb3c6', '#ff8fab', '#fb6f92'],
        mode: 23,
        theory: 'monochromatic'
      },
      {
        name: 'Sky Blue',
        colors: ['#caf0f8', '#ade8f4', '#90e0ef', '#48cae4', '#00b4d8'],
        mode: 24,
        theory: 'monochromatic'
      }
    ]
  },
  {
    category: 'Warm & Cozy',
    icon: '🔥',
    palettes: [
      {
        name: 'Autumn Leaves',
        colors: ['#d62828', '#f77f00', '#fcbf49', '#eae2b7', '#003049'],
        mode: 25,
        theory: 'complementary'
      },
      {
        name: 'Golden Hour',
        colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'],
        mode: 26,
        theory: 'analogous'
      },
      {
        name: 'Campfire',
        colors: ['#ff4800', '#ff6b00', '#ff8500', '#ffa200', '#ffbd00'],
        mode: 27,
        theory: 'monochromatic'
      },
      {
        name: 'Terracotta',
        colors: ['#9b2226', '#ae2012', '#bb3e03', '#ca6702', '#ee9b00'],
        mode: 28,
        theory: 'analogous'
      },
      {
        name: 'Honey Amber',
        colors: ['#ffb703', '#fd9e02', '#fb8500', '#e85d04', '#dc2f02'],
        mode: 29,
        theory: 'monochromatic'
      }
    ]
  }
];

// Shape Preset System
interface ShapePreset {
  name: string;
  apply: () => void;
}

const SHAPE_PRESETS: ShapePreset[] = [
  // === MANDELBULB (Mode 0) - Classic fractals ===
  {
    name: 'Classic Bulb',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 0;
      r.params.powerBase = 8;
      r.params.powerAmp = 0;
      r.params.twist = 0;
      r.params.fold = 1.0;
      r.params.juliaMix = 0;
    }
  },
  {
    name: 'Twisted Dream',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 0;
      r.params.powerBase = 8;
      r.params.powerAmp = 2.0;
      r.params.twist = 3.14;
      r.params.fold = 1.5;
    }
  },
  {
    name: 'Crystal Spikes',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 0;
      r.params.powerBase = 12;
      r.params.powerAmp = 0;
      r.params.fold = 1.8;
      r.params.twist = 0;
    }
  },
  {
    name: 'Soft Organic',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 0;
      r.params.powerBase = 4;
      r.params.powerAmp = 1.5;
      r.params.twist = 0.5;
      r.params.morphOn = 0.6;
    }
  },

  // === FLOWER OF LIFE (Mode 1) - Sacred geometry ===
  {
    name: 'Sacred Flower',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 1;
      r.params.folComplexity = 0;
      r.params.folSpacing = 1.0;
      r.params.folThickness = 0.08;
      r.params.folTwist = 0;
      r.params.folSpiral = 0;
    }
  },
  {
    name: 'Spiral Petals',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 1;
      r.params.folComplexity = 0.6;
      r.params.folSpiral = 0.8;
      r.params.folTwist = 1.57;
      r.params.folHarmonic = 0.4;
    }
  },
  {
    name: 'Hyperdimensional',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 1;
      r.params.folComplexity = 1.0;
      r.params.folHyper = 0.8;
      r.params.folExtrude = 1.0;
      r.params.folHarmonic = 0.7;
    }
  },

  // === FIBONACCI SHELL (Mode 2) - Golden ratio spirals ===
  {
    name: 'Golden Shell',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 2;
      r.params.fibSpiral = 0.5;
      r.params.fibBend = 0;
      r.params.fibWarp = 0.3;
      r.params.fibInward = 0.4;
      r.params.fibVortex = 0.3;
    }
  },
  {
    name: 'Nautilus Vortex',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 2;
      r.params.fibSpiral = 1.2;
      r.params.fibVortex = 1.5;
      r.params.fibInward = 1.0;
      r.params.fibBend = 0.6;
    }
  },
  {
    name: 'Fractal Storm',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 2;
      r.params.fibVortex = 2.0;
      r.params.fibInward = 1.8;
      r.params.fibBandGap = 3.0;
      r.params.fibWarp = 1.5;
    }
  },

  // === MANDELBOX (Mode 3) - Box folding fractals ===
  {
    name: 'Box Cathedral',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 3;
      r.params.mbScale = -2.0;
      r.params.mbIter = 12;
      r.params.mbMinRadius = 0.5;
      r.params.mbFixedRadius = 1.0;
    }
  },
  {
    name: 'Cubic Labyrinth',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 3;
      r.params.mbScale = -1.5;
      r.params.mbIter = 8;
      r.params.mbFixedRadius = 1.5;
      r.params.mbMinRadius = 0.8;
    }
  },
  {
    name: 'Fractal Cube',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 3;
      r.params.mbScale = -2.5;
      r.params.mbIter = 15;
      r.params.mbMinRadius = 0.3;
      r.params.mbFixedRadius = 0.8;
    }
  },

  // === METATRON CUBE (Mode 4) - 13 spheres sacred geometry ===
  {
    name: 'Metatron Core',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 4;
      r.params.metaLayer = 0.5;
      r.params.metaTwist = 0;
      r.params.metaSpacing = 1.0;
      r.params.metaNode = 0.5;
    }
  },
  {
    name: 'Rotating Matrix',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 4;
      r.params.metaLayer = 0.8;
      r.params.metaTwist = 3.14;
      r.params.metaSpacing = 1.3;
      r.params.metaStrut = 0.3;
    }
  },

  // === GYROID CATHEDRAL (Mode 5) - Minimal surfaces ===
  {
    name: 'Gyroid Waves',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 5;
      r.params.gyroLevel = 0.5;
      r.params.gyroScale = 2.5;
      r.params.gyroMod = 0.8;
    }
  },
  {
    name: 'Infinite Surface',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 5;
      r.params.gyroLevel = 0;
      r.params.gyroScale = 3.5;
      r.params.gyroMod = 0.3;
    }
  },

  // === TYPHOON (Mode 6) - Vortex structures ===
  {
    name: 'Calm Eye',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 6;
      r.params.tyEye = 0.6;
      r.params.tyPull = 0.8;
      r.params.tySpin = 1.5;
      r.params.tyWall = 1.0;
      r.params.tyBand = 3.0;
    }
  },
  {
    name: 'Storm Fury',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 6;
      r.params.tyEye = 0.2;
      r.params.tyPull = 1.8;
      r.params.tySpin = 3.5;
      r.params.tyWall = 2.5;
      r.params.tyBand = 6.0;
      r.params.tyNoise = 0.6;
    }
  },

  // === QUATERNION JULIA (Mode 7) - 4D fractals ===
  {
    name: '4D Sphere',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 7;
      r.params.quatPower = 2.0;
      r.params.quatScale = 1.0;
      r.params.quatC[0] = -0.2;
      r.params.quatC[1] = 0.6;
      r.params.quatC[2] = 0.2;
      r.params.quatC[3] = 0.0;
    }
  },
  {
    name: '4D Explosion',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 7;
      r.params.quatPower = 6.0;
      r.params.quatScale = 1.5;
      r.params.quatC[0] = 0.3;
      r.params.quatC[1] = -0.5;
      r.params.quatC[2] = 0.4;
      r.params.quatC[3] = 0.2;
    }
  },

  // === COSMIC BLOOM (Mode 8) - Cosmic patterns ===
  {
    name: 'Starburst',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 8;
      r.params.cosRadius = 2.0;
      r.params.cosExpansion = 0.5;
      r.params.cosRipple = 0.8;
      r.params.cosSpiral = 0.4;
    }
  },
  {
    name: 'Galaxy Core',
    apply: () => {
      const r = (window as typeof window & { renderer?: RendererWithParams }).renderer;
      if (!r) return;
      r.params.mode = 8;
      r.params.cosRadius = 3.0;
      r.params.cosExpansion = 1.2;
      r.params.cosRipple = 1.5;
      r.params.cosSpiral = 1.0;
    }
  }
];

function setupShapePresetsInGUI(gui: GUI, renderer: RendererWithParams): void {
  const presetsFolder = gui.addFolder('Shape Presets');

  // Create preset actions object for lil-gui
  const presetActions: Record<string, () => void> = {};
  SHAPE_PRESETS.forEach(preset => {
    presetActions[preset.name] = preset.apply;
  });

  // Add each preset as a button
  Object.keys(presetActions).forEach(name => {
    presetsFolder.add(presetActions, name);
  });

  presetsFolder.open();
}

function setupColorPalette(renderer: RendererWithParams): void {
  const paletteGrid = document.getElementById('palette-grid');
  if (!paletteGrid) return;

  COLOR_DESIGN_SYSTEM.forEach((category) => {
    // Create category header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'palette-category-header';
    categoryHeader.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <span class="category-name">${category.category}</span>
    `;
    paletteGrid.appendChild(categoryHeader);

    // Create palettes container for this category
    const categoryPalettes = document.createElement('div');
    categoryPalettes.className = 'palette-category-items';

    category.palettes.forEach((palette) => {
      const item = document.createElement('div');
      item.className = 'palette-item';
      if (renderer.params.colorMode === palette.mode) {
        item.classList.add('active');
      }

      // Create swatches container
      const swatches = document.createElement('div');
      swatches.className = 'palette-swatches';

      // Add 5 color swatches
      palette.colors.forEach(color => {
        const swatch = document.createElement('div');
        swatch.className = 'palette-swatch';
        swatch.style.backgroundColor = color;
        swatches.appendChild(swatch);
      });

      // Add name and theory tag
      const infoContainer = document.createElement('div');
      infoContainer.className = 'palette-info';

      const name = document.createElement('div');
      name.className = 'palette-name';
      name.textContent = palette.name;

      const theory = document.createElement('div');
      theory.className = 'palette-theory';
      theory.textContent = palette.theory;

      infoContainer.appendChild(name);
      infoContainer.appendChild(theory);

      item.appendChild(swatches);
      item.appendChild(infoContainer);

      // Click handler
      item.addEventListener('click', () => {
        // Disable auto color cycle when manually selecting a palette
        const r = (window as typeof window & { renderer?: { autoColorCycle: boolean } }).renderer;
        if (r && r.autoColorCycle) {
          r.autoColorCycle = false;

          // Update the GUI toggle through the stored controller
          const controller = (window as any).autoColorController;
          if (controller) {
            controller.setValue(false);
          }
        }

        renderer.params.colorMode = palette.mode;
        updatePaletteActiveState();
      });

      categoryPalettes.appendChild(item);
    });

    paletteGrid.appendChild(categoryPalettes);
  });

  // Function to update active state (called by click and auto-cycle)
  function updatePaletteActiveState() {
    document.querySelectorAll('.palette-item').forEach(el => el.classList.remove('active'));
    const activeItems = document.querySelectorAll('.palette-item');
    activeItems.forEach((item, index) => {
      const paletteIndex = Math.floor(index / 5) * 5 + (index % 5);
      // Find the palette mode from COLOR_DESIGN_SYSTEM
      let currentIndex = 0;
      for (const category of COLOR_DESIGN_SYSTEM) {
        for (const palette of category.palettes) {
          if (currentIndex === index && palette.mode === renderer.params.colorMode) {
            item.classList.add('active');
          }
          currentIndex++;
        }
      }
    });
  }

  // Auto-update active state when colorMode changes (for auto-cycle)
  setInterval(() => {
    updatePaletteActiveState();
  }, 100);
}

function setupGUI(renderer: RendererWithParams): void {
  const gui = new GUI({ title: '3D Fractal Visualizer' });

  // Setup color palette (external HTML panel)
  setupColorPalette(renderer);

  // Add Auto Morphing toggle at the top
  const autoMorphControl = {
    'Auto Morphing': false
  };
  const autoMorphController = gui.add(autoMorphControl, 'Auto Morphing').onChange((value: boolean) => {
    const r = (window as typeof window & { renderer?: { autoMorphing: boolean } }).renderer;
    if (r) {
      r.autoMorphing = value;
    }
    // Sync with HTML button
    const btn = document.getElementById('btnAutoMorph');
    if (btn) {
      btn.textContent = `Auto Morph: ${value ? 'On' : 'Off'}`;
      btn.classList.toggle('active', value);
    }
  });

  // Add Auto Color Cycle toggle
  const autoColorControl = {
    'Auto Color Cycle': false
  };
  const autoColorController = gui.add(autoColorControl, 'Auto Color Cycle').onChange((value: boolean) => {
    const r = (window as typeof window & { renderer?: { autoColorCycle: boolean } }).renderer;
    if (r) {
      r.autoColorCycle = value;
    }
    // Sync with HTML button
    const btn = document.getElementById('btnAutoColor');
    if (btn) {
      btn.textContent = `Auto Color: ${value ? 'On' : 'Off'}`;
      btn.classList.toggle('active', value);
    }
  });

  // Store controllers globally for sync
  (window as any).autoColorController = autoColorController;
  (window as any).autoMorphController = autoMorphController;

  // Add shape presets to GUI
  setupShapePresetsInGUI(gui, renderer);

  // User Preset Management
  const userPresetFolder = gui.addFolder('💾 User Presets');
  const presetActions = {
    'Save Current': () => {
      const presetName = prompt('Enter preset name:');
      if (!presetName) return;

      try {
        // Save all parameters to localStorage
        const presetData = {
          params: JSON.parse(JSON.stringify(renderer.params)),
          seed: Array.from(renderer.params.seed),
          quatC: Array.from(renderer.params.quatC)
        };
        localStorage.setItem(`preset_${presetName}`, JSON.stringify(presetData));
        alert(`Preset "${presetName}" saved successfully!`);
      } catch (error) {
        alert('Failed to save preset. ' + (error instanceof Error ? error.message : ''));
      }
    },
    'Load Preset': () => {
      const presetName = prompt('Enter preset name to load:');
      if (!presetName) return;

      try {
        const presetData = localStorage.getItem(`preset_${presetName}`);
        if (!presetData) {
          alert(`Preset "${presetName}" not found.`);
          return;
        }

        const data = JSON.parse(presetData);
        // Restore all parameters
        Object.assign(renderer.params, data.params);
        if (data.seed) {
          data.seed.forEach((v: number, i: number) => renderer.params.seed[i] = v);
        }
        if (data.quatC) {
          data.quatC.forEach((v: number, i: number) => renderer.params.quatC[i] = v);
        }
        alert(`Preset "${presetName}" loaded successfully!`);

        // Update formula display
        updateFormula(renderer.params.mode);
      } catch (error) {
        alert('Failed to load preset. ' + (error instanceof Error ? error.message : ''));
      }
    },
    'List Presets': () => {
      const presets: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('preset_')) {
          presets.push(key.replace('preset_', ''));
        }
      }

      if (presets.length === 0) {
        alert('No saved presets found.');
      } else {
        alert('Saved presets:\n\n' + presets.join('\n'));
      }
    },
    'Delete Preset': () => {
      const presetName = prompt('Enter preset name to delete:');
      if (!presetName) return;

      const key = `preset_${presetName}`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        alert(`Preset "${presetName}" deleted successfully!`);
      } else {
        alert(`Preset "${presetName}" not found.`);
      }
    }
  };

  userPresetFolder.add(presetActions, 'Save Current');
  userPresetFolder.add(presetActions, 'Load Preset');
  userPresetFolder.add(presetActions, 'List Presets');
  userPresetFolder.add(presetActions, 'Delete Preset');

  // Initial formula display
  updateFormula(renderer.params.mode);

  // Mode selection
  const modeOptions = {
    'Mandelbulb': 0,
    'Flower of Life': 1,
    'Fibonacci Shell': 2,
    'Mandelbox': 3,
    'Metatron Cube': 4,
    'Gyroid Cathedral': 5,
    'Typhoon': 6,
    'Quaternion Julia': 7,
    'Cosmic Bloom': 8
  };
  gui.add(renderer.params, 'mode', modeOptions).name('Mode').onChange(() => {
    // Show/hide appropriate folders
    fractalFolder.show(renderer.params.mode === 0);
    folFolder.show(renderer.params.mode === 1);
    fibFolder.show(renderer.params.mode === 2);
    mbFolder.show(renderer.params.mode === 3);
    metaFolder.show(renderer.params.mode === 4);
    gyroFolder.show(renderer.params.mode === 5);
    typhoonFolder.show(renderer.params.mode === 6);
    quatFolder.show(renderer.params.mode === 7);
    cosmicFolder.show(renderer.params.mode === 8);
    // Update formula display
    updateFormula(renderer.params.mode);
  });

  // Fractal parameters folder (Mandelbulb)
  const fractalFolder = gui.addFolder('Fractal Parameters');
  fractalFolder.add(renderer.params, 'maxIterations', 4, 16, 1).name('Iterations');
  fractalFolder.add(renderer.params, 'powerBase', 2, 16, 0.1).name('Power Base');
  fractalFolder.add(renderer.params, 'powerAmp', 0, 4, 0.1).name('Power Amplitude');
  fractalFolder.add(renderer.params, 'scale', 0.5, 2, 0.1).name('Scale');
  fractalFolder.open();

  // Rendering folder
  const renderFolder = gui.addFolder('Rendering');
  renderFolder.add(renderer.params, 'maxSteps', 32, 256, 1).name('Max Steps');
  renderFolder.add(renderer.params, 'epsilon', 0.0001, 0.01, 0.0001).name('Epsilon');
  renderFolder.open();

  // Lighting folder
  const lightingFolder = gui.addFolder('Lighting & Material');
  lightingFolder.add(renderer.params, 'aoIntensity', 0, 3, 0.1).name('AO Intensity');
  lightingFolder.add(renderer.params, 'reflectivity', 0, 1, 0.01).name('Reflectivity');
  lightingFolder.add(renderer.params, 'specPow', 1, 128, 1).name('Spec Power');
  lightingFolder.add(renderer.params, 'bumpStrength', 0, 1, 0.01).name('Bump Strength');
  lightingFolder.add(renderer.params, 'ior', 1, 3, 0.1).name('IOR');
  lightingFolder.add(renderer.params, 'shadowSoft', 1, 16, 0.5).name('Shadow Softness');

  // Color folder (now just for fine-tuning, theme selection is visual)
  const colorFolder = gui.addFolder('Color Fine-Tuning');
  colorFolder.add(renderer.params, 'palSpeed', 0, 0.5, 0.01).name('Animation Speed').listen();
  colorFolder.add(renderer.params, 'palSpread', 0.5, 5, 0.1).name('Color Range');

  const seedProxy = {
    x: renderer.params.seed[0],
    y: renderer.params.seed[1],
    z: renderer.params.seed[2]
  };

  colorFolder.add(seedProxy, 'x', 0, 1, 0.01).name('Seed X').onChange((v: number) => {
    renderer.params.seed[0] = v;
  }).listen();
  colorFolder.add(seedProxy, 'y', 0, 1, 0.01).name('Seed Y').onChange((v: number) => {
    renderer.params.seed[1] = v;
  }).listen();
  colorFolder.add(seedProxy, 'z', 0, 1, 0.01).name('Seed Z').onChange((v: number) => {
    renderer.params.seed[2] = v;
  }).listen();

  // Update seed proxy values continuously for listen() to work
  setInterval(() => {
    seedProxy.x = renderer.params.seed[0];
    seedProxy.y = renderer.params.seed[1];
    seedProxy.z = renderer.params.seed[2];
  }, 50);

  // Deformation folder
  const deformFolder = gui.addFolder('Deformations');
  deformFolder.add(renderer.params, 'twist', 0, 6.28, 0.01).name('Twist').listen();
  deformFolder.add(renderer.params, 'fold', 0, 2, 0.1).name('Fold').listen();
  deformFolder.add(renderer.params, 'boxSize', 0.5, 4, 0.1).name('Box Size').listen();
  deformFolder.add(renderer.params, 'juliaMix', 0, 1, 0.01).name('Julia Mix').listen();
  deformFolder.add(renderer.params, 'morphOn', 0, 1, 0.01).name('Morph').listen();

  // Presets - Now integrated into Auto Morph feature
  // (Removed from GUI - Auto Morph cycles through presets automatically)

  // Flower of Life folder
  const folFolder = gui.addFolder('Flower of Life');
  folFolder.add(renderer.params, 'folRadius', 0.4, 2.5, 0.01).name('Radius');
  folFolder.add(renderer.params, 'folSpacing', 0.4, 2.5, 0.01).name('Spacing');
  folFolder.add(renderer.params, 'folThickness', 0.005, 0.5, 0.005).name('Thickness');
  folFolder.add(renderer.params, 'folComplexity', 0.0, 1.0, 0.01).name('Complexity');
  folFolder.add(renderer.params, 'folExtrude', 0.0, 1.5, 0.01).name('Extrude').listen();
  folFolder.add(renderer.params, 'folTwist', 0.0, 6.283, 0.001).name('Twist').listen();
  folFolder.add(renderer.params, 'folSpiral', 0.0, 1.0, 0.01).name('Spiral Weave').listen();
  folFolder.add(renderer.params, 'folHarmonic', 0.0, 1.0, 0.01).name('Harmonics').listen();
  folFolder.add(renderer.params, 'folHyper', 0.0, 1.0, 0.01).name('Hyper Warp');
  folFolder.hide(); // Hidden by default

  // Fibonacci Shell folder
  const fibFolder = gui.addFolder('Fibonacci Shell');
  fibFolder.add(renderer.params, 'fibSpiral', 0.0, 2.0, 0.01).name('Spiral').listen();
  fibFolder.add(renderer.params, 'fibBend', 0.0, 1.5, 0.01).name('Bend').listen();
  fibFolder.add(renderer.params, 'fibWarp', 0.0, 2.0, 0.01).name('Warp');
  fibFolder.add(renderer.params, 'fibOffset', 0.0, 1.0, 0.01).name('Offset');
  fibFolder.add(renderer.params, 'fibLayer', 0.0, 1.5, 0.01).name('Layer');
  fibFolder.add(renderer.params, 'fibInward', 0.0, 2.0, 0.01).name('Inward').listen();
  fibFolder.add(renderer.params, 'fibBandGap', 0.05, 5.0, 0.05).name('Band Gap');
  fibFolder.add(renderer.params, 'fibVortex', 0.0, 2.0, 0.01).name('Vortex').listen();
  fibFolder.hide(); // Hidden by default

  // Mandelbox folder
  const mbFolder = gui.addFolder('Mandelbox');
  mbFolder.add(renderer.params, 'mbScale', -4.0, 4.0, 0.01).name('Scale').listen();
  mbFolder.add(renderer.params, 'mbMinRadius', 0.0, 2.0, 0.01).name('Min Radius').listen();
  mbFolder.add(renderer.params, 'mbFixedRadius', 0.0, 4.0, 0.01).name('Fixed Radius');
  mbFolder.add(renderer.params, 'mbIter', 1, 20, 1).name('Iterations');
  mbFolder.hide(); // Hidden by default

  // Metatron Cube folder
  const metaFolder = gui.addFolder('Metatron Cube');
  metaFolder.add(renderer.params, 'metaRadius', 0.1, 2.0, 0.01).name('Radius');
  metaFolder.add(renderer.params, 'metaSpacing', 0.5, 4.0, 0.01).name('Spacing').listen();
  metaFolder.add(renderer.params, 'metaNode', 0.01, 0.5, 0.01).name('Node Size');
  metaFolder.add(renderer.params, 'metaStrut', 0.01, 0.3, 0.01).name('Strut Width');
  metaFolder.add(renderer.params, 'metaLayer', 0.0, 1.0, 0.01).name('Layer Blend').listen();
  metaFolder.add(renderer.params, 'metaTwist', 0.0, 6.283, 0.01).name('Twist').listen();
  metaFolder.hide(); // Hidden by default

  // Gyroid Cathedral folder
  const gyroFolder = gui.addFolder('Gyroid Cathedral');
  gyroFolder.add(renderer.params, 'gyroLevel', 0.0, 2.0, 0.01).name('Level').listen();
  gyroFolder.add(renderer.params, 'gyroScale', 0.5, 10.0, 0.1).name('Scale');
  gyroFolder.add(renderer.params, 'gyroMod', 0.0, 2.0, 0.01).name('Modulation').listen();
  gyroFolder.hide(); // Hidden by default

  // Typhoon folder
  const typhoonFolder = gui.addFolder('Typhoon 🌀');
  typhoonFolder.add(renderer.params, 'tyEye', 0.0, 1.0, 0.01).name('Eye Radius');
  typhoonFolder.add(renderer.params, 'tyPull', 0.0, 2.0, 0.01).name('Pull Strength').listen();
  typhoonFolder.add(renderer.params, 'tyWall', 0.0, 3.0, 0.01).name('Wall Height');
  typhoonFolder.add(renderer.params, 'tySpin', 0.0, 4.0, 0.01).name('Spin Amount').listen();
  typhoonFolder.add(renderer.params, 'tyBand', 1.0, 8.0, 0.1).name('Band Frequency');
  typhoonFolder.add(renderer.params, 'tyNoise', 0.0, 1.0, 0.01).name('Noise').listen();
  typhoonFolder.hide(); // Hidden by default

  // Quaternion Julia folder
  const quatFolder = gui.addFolder('Quaternion Julia 4D');
  const quatCProxy = {
    w: renderer.params.quatC[0],
    x: renderer.params.quatC[1],
    y: renderer.params.quatC[2],
    z: renderer.params.quatC[3]
  };
  quatFolder.add(quatCProxy, 'w', -1.0, 1.0, 0.01).name('C.w').onChange((v: number) => {
    renderer.params.quatC[0] = v;
  });
  quatFolder.add(quatCProxy, 'x', -1.0, 1.0, 0.01).name('C.x').onChange((v: number) => {
    renderer.params.quatC[1] = v;
  });
  quatFolder.add(quatCProxy, 'y', -1.0, 1.0, 0.01).name('C.y').onChange((v: number) => {
    renderer.params.quatC[2] = v;
  });
  quatFolder.add(quatCProxy, 'z', -1.0, 1.0, 0.01).name('C.z').onChange((v: number) => {
    renderer.params.quatC[3] = v;
  });
  quatFolder.add(renderer.params, 'quatPower', 1.0, 8.0, 0.1).name('Power');
  quatFolder.add(renderer.params, 'quatScale', 0.5, 2.0, 0.01).name('Scale').listen();
  quatFolder.hide(); // Hidden by default

  // Cosmic Bloom folder
  const cosmicFolder = gui.addFolder('Cosmic Bloom ✨');
  cosmicFolder.add(renderer.params, 'cosRadius', 0.5, 4.0, 0.01).name('Radius');
  cosmicFolder.add(renderer.params, 'cosExpansion', 0.0, 1.5, 0.01).name('Expansion').listen();
  cosmicFolder.add(renderer.params, 'cosRipple', 0.0, 2.0, 0.01).name('Ripple');
  cosmicFolder.add(renderer.params, 'cosSpiral', 0.0, 1.5, 0.01).name('Spiral').listen();
  cosmicFolder.hide(); // Hidden by default

  // Post-Processing folder (new!)
  const postFolder = gui.addFolder('Post-Processing ✨');

  // Access post-processor params from renderer
  const getPostParams = () => {
    const r = (window as typeof window & { renderer?: any }).renderer;
    return r?.postProcessParams;
  };

  // Bloom controls
  const bloomFolder = postFolder.addFolder('Bloom');
  bloomFolder.add({ value: 0.4 }, 'value', 0, 1, 0.01).name('Strength').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.bloomStrength = v;
  });
  bloomFolder.add({ value: 0.8 }, 'value', 0, 1, 0.01).name('Threshold').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.bloomThreshold = v;
  });
  bloomFolder.open();

  // TAA control
  postFolder.add({ value: true }, 'value').name('TAA (Anti-Aliasing)').onChange((v: boolean) => {
    const params = getPostParams();
    if (params) params.taaEnabled = v;
  });

  // Chromatic Aberration
  postFolder.add({ value: 0.0 }, 'value', 0, 0.01, 0.0001).name('Chromatic Aberration').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.chromatic = v;
  });

  // Vignette
  postFolder.add({ value: 0.3 }, 'value', 0, 1, 0.01).name('Vignette').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.vignette = v;
  });

  // HDR and Tone Mapping controls
  const hdrToneFolder = postFolder.addFolder('HDR & Tone Mapping');
  hdrToneFolder.add({ value: true }, 'value').name('HDR Enabled').onChange((v: boolean) => {
    const params = getPostParams();
    if (params) params.hdrEnabled = v;
  });

  const tonemapModes = {
    'None': 0,
    'Reinhard': 1,
    'ACES': 2,
    'Uncharted 2': 3
  };
  hdrToneFolder.add({ value: 2 }, 'value', tonemapModes).name('Tone Map Mode').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.tonemapMode = v;
  });

  hdrToneFolder.add({ value: 1.0 }, 'value', 0.1, 3, 0.1).name('Exposure').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.exposure = v;
  });
  hdrToneFolder.add({ value: 1.2 }, 'value', 0, 2, 0.1).name('Saturation').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.saturation = v;
  });
  hdrToneFolder.add({ value: 2.2 }, 'value', 1, 3, 0.1).name('Gamma').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.gamma = v;
  });
  hdrToneFolder.open();

  // Depth of Field controls
  const dofFolder = postFolder.addFolder('Depth of Field (DOF)');
  dofFolder.add({ value: false }, 'value').name('DOF Enabled').onChange((v: boolean) => {
    const params = getPostParams();
    if (params) params.dofEnabled = v;
  });
  dofFolder.add({ value: 4.0 }, 'value', 0.5, 10, 0.1).name('Focus Distance').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.dofFocusDistance = v;
  });
  dofFolder.add({ value: 0.3 }, 'value', 0, 1, 0.01).name('Aperture').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.dofAperture = v;
  });
  dofFolder.add({ value: 10.0 }, 'value', 1, 50, 1).name('Max Blur').onChange((v: number) => {
    const params = getPostParams();
    if (params) params.dofMaxBlur = v;
  });

  postFolder.open();

  console.log('🎨 UI Controls initialized with Advanced Post-Processing (HDR, Tone Mapping, DOF)');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initControls);
} else {
  initControls();
}

export { initControls };
