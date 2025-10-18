/**
 * Browser-based Video Recorder
 * Records canvas animation to WebM/MP4 video using MediaRecorder API
 */

export interface VideoRecorderOptions {
  canvas: HTMLCanvasElement;
  fps?: number;
  videoBitsPerSecond?: number;
  mimeType?: string;
  onProgress?: (seconds: number) => void;
}

export class VideoRecorder {
  private canvas: HTMLCanvasElement;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private progressInterval: number | null = null;
  private options: VideoRecorderOptions;

  constructor(options: VideoRecorderOptions) {
    this.canvas = options.canvas;
    this.options = {
      fps: 60,
      videoBitsPerSecond: 8000000, // 8 Mbps (高品質)
      mimeType: 'video/webm;codecs=vp9', // VP9 codec (高品質)
      ...options
    };
  }

  /**
   * 録画を開始
   */
  public async startRecording(): Promise<void> {
    // キャンバスからストリームを取得
    this.stream = this.canvas.captureStream(this.options.fps);

    if (!this.stream) {
      throw new Error('Failed to capture canvas stream');
    }

    // サポートされているMIMEタイプを確認
    let mimeType = this.options.mimeType!;

    if (!MediaRecorder.isTypeSupported(mimeType)) {
      console.warn(`${mimeType} is not supported, trying alternatives...`);

      // フォールバック: VP9 → VP8 → H.264
      const alternatives = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4;codecs=h264',
        'video/mp4'
      ];

      mimeType = alternatives.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
      console.log(`Using MIME type: ${mimeType}`);
    }

    // MediaRecorderを初期化
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        videoBitsPerSecond: this.options.videoBitsPerSecond
      });
    } catch (error) {
      console.error('Failed to create MediaRecorder:', error);
      throw new Error('MediaRecorder not supported or failed to initialize');
    }

    // データチャンクを収集
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // 録画開始
    this.mediaRecorder.start(100); // 100msごとにデータを収集
    this.startTime = Date.now();

    // 進捗状況の更新
    if (this.options.onProgress) {
      this.progressInterval = window.setInterval(() => {
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.options.onProgress!(elapsed);
      }, 100);
    }

    console.log('Recording started');
  }

  /**
   * 録画を停止してBlobを返す
   */
  public async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      // 進捗状況の更新を停止
      if (this.progressInterval !== null) {
        clearInterval(this.progressInterval);
        this.progressInterval = null;
      }

      this.mediaRecorder.onstop = () => {
        // すべてのチャンクを結合してBlobを作成
        const mimeType = this.mediaRecorder!.mimeType || 'video/webm';
        const blob = new Blob(this.chunks, { type: mimeType });

        // ストリームのクリーンアップ
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }

        console.log(`Recording stopped. Video size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        resolve(blob);
      };

      this.mediaRecorder.onerror = (event: Event) => {
        reject(new Error('MediaRecorder error: ' + (event as ErrorEvent).message));
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * 録画中かどうか
   */
  public isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }

  /**
   * 録画時間を取得（秒）
   */
  public getRecordingDuration(): number {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }
}

/**
 * Blobをダウンロード
 */
export function downloadVideoBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * サポートされている動画フォーマットを取得
 */
export function getSupportedVideoFormats(): string[] {
  const formats = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm;codecs=h264',
    'video/webm',
    'video/mp4;codecs=h264',
    'video/mp4;codecs=avc1',
    'video/mp4'
  ];

  return formats.filter(format => MediaRecorder.isTypeSupported(format));
}
