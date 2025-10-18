/**
 * Flashlight Performance Testing Configuration
 * React Native/Expo アプリのパフォーマンス測定設定
 *
 * @see https://github.com/bamlab/flashlight
 */

module.exports = {
  // 測定対象のプラットフォーム
  platforms: ['android'], // iOS追加予定

  // パフォーマンス閾値
  thresholds: {
    performanceScore: 90, // 総合スコア
    fps: 55, // フレームレート
    cpu: 30, // CPU使用率（%）
    ram: 150, // メモリ使用量（MB）
    bundleSize: 10, // JSバンドルサイズ（MB）
  },

  // テストシナリオ
  scenarios: [
    {
      name: 'App Launch',
      description: 'アプリ起動時間とTTI（Time to Interactive）を測定',
      iterations: 10,
      commands: ['expo start --no-dev --minify'],
    },
    {
      name: 'Case List Navigation',
      description: '案件一覧画面の描画パフォーマンスを測定',
      iterations: 10,
      commands: ['maestro test e2e/performance/case-list.yaml'],
    },
    {
      name: 'Voice Recording',
      description: '音声録音中のCPU/メモリ使用量を測定',
      iterations: 10,
      commands: ['maestro test e2e/performance/voice-recording.yaml'],
    },
    {
      name: 'AI Summary Generation',
      description: 'AI要約生成時のパフォーマンスを測定',
      iterations: 10,
      commands: ['maestro test e2e/performance/ai-summary.yaml'],
    },
  ],

  // レポート出力設定
  output: {
    directory: './performance-reports',
    format: ['json', 'html', 'markdown'],
    baseline: './performance-reports/baseline.json',
  },

  // デバイス設定
  device: {
    platform: 'android',
    // 実機またはエミュレータのデバイスID
    // adb devices で取得
    id: process.env.ANDROID_DEVICE_ID || 'emulator-5554',
  },

  // ビルド設定
  build: {
    // Production ビルド使用
    variant: 'release',
    minify: true,
    sourceMaps: false,
  },

  // 測定設定
  measure: {
    // ウォームアップ実行（キャッシュを温める）
    warmupRuns: 2,
    // 実測定回数
    runs: 10,
    // 測定間の待機時間（ms）
    cooldown: 3000,
  },
};
