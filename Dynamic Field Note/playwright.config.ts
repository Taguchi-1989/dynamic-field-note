import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for UI E2E Tests
 *
 * テスト対象:
 * - Storybookコンポーネント（e2e/ui/*.e2e.spec.ts）
 * - レガシーチェック（check-storybook.spec.ts）
 */
export default defineConfig({
  testDir: './',
  testMatch: ['**/check-storybook.spec.ts', '**/e2e/ui/**/*.e2e.spec.ts'],
  fullyParallel: false, // E2Eテストは順次実行推奨
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // ローカル環境でも1回リトライ
  workers: 1, // E2Eテストは1ワーカーで安定実行
  reporter: [['html'], ['list']],
  timeout: 60 * 1000, // テストタイムアウト: 60秒
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 個別アクションのタイムアウト
  },
  projects: [
    {
      name: 'storybook-ui-e2e',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  webServer: {
    command: 'npm run storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  outputDir: 'test-results',
});
