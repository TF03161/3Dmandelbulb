/**
 * Error Filter - ブラウザ拡張機能のエラーをコンソールから除外
 *
 * このスクリプトは、ブラウザ拡張機能（Terra Wallet、MetaMaskなど）が
 * 発生させるエラーをフィルタリングして、開発者コンソールをクリーンに保ちます。
 */

// エラーメッセージのパターンリスト（拡張機能由来のエラー）
const EXTENSION_ERROR_PATTERNS = [
  'message channel closed',
  'asynchronous response',
  'listener indicated',
  'terra-money',
  'station-connector',
  '@terra-money',
  'protobufjs',
  'content.css.map',
  'sidebar.css.map',
  '.well-known',
  'chrome.devtools',
  'chrome-extension://',
  'moz-extension://'
];

// 元のコンソールメソッドを保存
const originalError = console.error;
const originalWarn = console.warn;

// カスタムエラーハンドラー
console.error = function(...args: any[]) {
  const message = args.join(' ');

  // 拡張機能由来のエラーをフィルタリング
  const isExtensionError = EXTENSION_ERROR_PATTERNS.some(pattern =>
    message.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!isExtensionError) {
    originalError.apply(console, args);
  }
};

// カスタムワーニングハンドラー
console.warn = function(...args: any[]) {
  const message = args.join(' ');

  // 拡張機能由来の警告をフィルタリング
  const isExtensionWarning = EXTENSION_ERROR_PATTERNS.some(pattern =>
    message.toLowerCase().includes(pattern.toLowerCase())
  );

  if (!isExtensionWarning) {
    originalWarn.apply(console, args);
  }
};

// Promise rejection エラーをキャッチ
window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  const message = event.reason?.message || event.reason?.toString() || '';

  // 拡張機能由来のエラーをフィルタリング
  const isExtensionError = EXTENSION_ERROR_PATTERNS.some(pattern =>
    message.toLowerCase().includes(pattern.toLowerCase())
  );

  if (isExtensionError) {
    // エラーを抑制（デフォルトの動作を防止）
    event.preventDefault();
  }
});

// グローバルエラーハンドラー
window.addEventListener('error', (event: ErrorEvent) => {
  const message = event.message || '';

  // 拡張機能由来のエラーをフィルタリング
  const isExtensionError = EXTENSION_ERROR_PATTERNS.some(pattern =>
    message.toLowerCase().includes(pattern.toLowerCase())
  );

  if (isExtensionError) {
    // エラーを抑制
    event.preventDefault();
    return true;
  }

  return false;
});

console.log('✨ Error filter initialized - Extension errors will be suppressed');
