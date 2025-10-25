/**
 * Screenshot Utility
 *
 * Captures high-quality screenshots of the WebGL canvas
 */

export interface ScreenshotOptions {
  filename?: string;
  format?: 'png' | 'jpg' | 'webp';
  quality?: number; // 0-1 for jpg/webp
  scale?: number; // Render at higher resolution (1, 2, 4, etc.)
  timestamp?: boolean;
}

export class ScreenshotCapture {
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Capture screenshot and download
   */
  capture(options: ScreenshotOptions = {}): void {
    const {
      filename = '3dmandelbulb',
      format = 'png',
      quality = 0.95,
      scale = 1,
      timestamp = true
    } = options;

    try {
      let dataUrl: string;

      if (scale > 1) {
        // Capture at higher resolution
        dataUrl = this.captureHighRes(scale, format, quality);
      } else {
        // Standard resolution capture
        dataUrl = this.captureStandard(format, quality);
      }

      // Generate filename
      const finalFilename = this.generateFilename(filename, format, timestamp);

      // Download
      this.download(dataUrl, finalFilename);

      console.log(`📸 Screenshot saved: ${finalFilename}`);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      alert('Screenshot failed. Please try again.');
    }
  }

  /**
   * Capture at standard resolution
   */
  private captureStandard(format: string, quality: number): string {
    const mimeType = this.getMimeType(format);
    return this.canvas.toDataURL(mimeType, quality);
  }

  /**
   * Capture at higher resolution
   */
  private captureHighRes(scale: number, format: string, quality: number): string {
    const originalWidth = this.canvas.width;
    const originalHeight = this.canvas.height;

    // Create temporary high-res canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = originalWidth * scale;
    tempCanvas.height = originalHeight * scale;

    const ctx = tempCanvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    // Draw scaled up
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    const mimeType = this.getMimeType(format);
    return tempCanvas.toDataURL(mimeType, quality);
  }

  /**
   * Get MIME type for format
   */
  private getMimeType(format: string): string {
    switch (format) {
      case 'jpg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'png':
      default:
        return 'image/png';
    }
  }

  /**
   * Generate filename with optional timestamp
   */
  private generateFilename(base: string, format: string, includeTimestamp: boolean): string {
    let filename = base;

    if (includeTimestamp) {
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_')
        .slice(0, -5); // Remove milliseconds and 'Z'
      filename = `${base}_${timestamp}`;
    }

    return `${filename}.${format}`;
  }

  /**
   * Download data URL as file
   */
  private download(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Copy screenshot to clipboard
   */
  async copyToClipboard(): Promise<void> {
    try {
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        this.canvas.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      });

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      console.log('📋 Screenshot copied to clipboard');
      alert('📋 Screenshot copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      alert('Clipboard copy failed. Please use Download instead.');
    }
  }

  /**
   * Capture multiple frames for animation
   */
  async captureSequence(
    count: number,
    interval: number,
    onFrame: (index: number) => void,
    options: ScreenshotOptions = {}
  ): Promise<void> {
    const {
      filename = '3dmandelbulb',
      format = 'png',
      quality = 0.95,
      scale = 1
    } = options;

    for (let i = 0; i < count; i++) {
      // Callback to update scene
      onFrame(i);

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 50));

      // Capture
      const dataUrl = scale > 1
        ? this.captureHighRes(scale, format, quality)
        : this.captureStandard(format, quality);

      // Download with frame number
      const frameFilename = `${filename}_frame_${String(i).padStart(4, '0')}.${format}`;
      this.download(dataUrl, frameFilename);

      // Wait interval
      if (i < count - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    console.log(`📸 Captured ${count} frames`);
  }
}

/**
 * Quick screenshot function
 */
export function captureScreenshot(
  canvas: HTMLCanvasElement,
  options?: ScreenshotOptions
): void {
  const capture = new ScreenshotCapture(canvas);
  capture.capture(options);
}

/**
 * Copy screenshot to clipboard
 */
export async function copyScreenshotToClipboard(canvas: HTMLCanvasElement): Promise<void> {
  const capture = new ScreenshotCapture(canvas);
  await capture.copyToClipboard();
}
