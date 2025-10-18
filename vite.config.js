import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
    host: true,
    // ミドルウェアで不要なリクエストとエラーログを抑制
    middlewareMode: false,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'esnext',
    minify: 'terser'
  },
  assetsInclude: ['**/*.glsl'],
  // HTMLにメタタグを追加してCSPエラーを抑制
  plugins: [
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        // Content Security Policy メタタグを追加
        // ブラウザ拡張機能のエラーを抑制
        return html.replace(
          '<head>',
          `<head>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* ws://localhost:* wss://localhost:*; connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*; img-src 'self' data: blob:; media-src 'self' blob:;">`
        );
      }
    }
  ]
});
