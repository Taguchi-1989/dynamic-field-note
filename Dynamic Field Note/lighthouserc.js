/**
 * Lighthouse CI Configuration
 * Expo Web版のパフォーマンス・アクセシビリティ・SEO測定設定
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */

module.exports = {
  ci: {
    // データ収集設定
    collect: {
      // Expo Web のビルドとサーバー起動
      startServerCommand: 'npx expo export:web && npx serve web-build -p 8080',
      startServerReadyPattern: 'Accepting connections',
      startServerReadyTimeout: 30000,

      // 測定対象URL
      url: ['http://localhost:8080'],

      // 測定回数（平均値算出のため3回実行）
      numberOfRuns: 3,

      // Lighthouse設定
      settings: {
        // プリセット: desktop / mobile
        preset: 'desktop',

        // スロットリング設定（実際のネットワーク環境をシミュレート）
        throttling: {
          rttMs: 40, // Round-trip time
          throughputKbps: 10 * 1024, // 10 Mbps
          cpuSlowdownMultiplier: 1, // CPU速度倍率
        },

        // デバイスエミュレーション
        emulatedFormFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          disabled: false,
        },

        // その他の設定
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      },
    },

    // アサーション設定（パフォーマンスバジェット）
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // ===== パフォーマンス =====
        'categories:performance': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }], // 2秒以内
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5秒以内
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1以下
        'total-blocking-time': ['error', { maxNumericValue: 300 }], // 300ms以内

        // その他のパフォーマンス指標
        'speed-index': ['warn', { maxNumericValue: 3500 }],
        interactive: ['warn', { maxNumericValue: 4000 }],

        // ===== アクセシビリティ =====
        'categories:accessibility': ['error', { minScore: 0.9 }],

        // ARIA属性
        'aria-valid-attr-value': 'error',
        'aria-valid-attr': 'error',
        'aria-required-attr': 'error',
        'aria-required-children': 'error',

        // カラーコントラスト
        'color-contrast': 'error',

        // ボタン・リンク
        'button-name': 'error',
        'link-name': 'error',

        // 画像
        'image-alt': 'error',

        // フォーム
        label: 'error',

        // ===== ベストプラクティス =====
        'categories:best-practices': ['error', { minScore: 0.9 }],

        // セキュリティ
        'uses-http2': 'warn',
        'is-on-https': 'warn', // 本番環境でHTTPS必須

        // エラー
        'errors-in-console': 'warn',
        'no-document-write': 'error',

        // 非推奨API
        deprecations: 'warn',

        // 画像最適化
        'image-aspect-ratio': 'warn',
        'image-size-responsive': 'warn',

        // ===== SEO =====
        'categories:seo': ['error', { minScore: 0.9 }],

        // メタ情報
        'meta-description': 'error',
        'document-title': 'error',

        // モバイル対応
        viewport: 'error',

        // クローラビリティ
        'crawlable-anchors': 'warn',
        'link-text': 'warn',

        // ===== PWA =====
        'categories:pwa': ['warn', { minScore: 0.8 }], // PWAは推奨レベル

        // Service Worker
        'service-worker': 'warn',

        // Manifest
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
      },
    },

    // アップロード設定
    upload: {
      // 一時的なパブリックストレージ（無料）
      target: 'temporary-public-storage',

      // または、Lighthouse Server にアップロード
      // target: 'lhci',
      // serverBaseUrl: 'https://your-lhci-server.com',
      // token: process.env.LHCI_TOKEN,
    },
  },
};
