import { test, type Page } from '@playwright/test';

test('Check Storybook ReportCard component', async ({ page }: { page: Page }) => {
  // コンソールログとエラーを出力（最初に設定）
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));

  // Storybookページを開く
  await page.goto('http://localhost:6006');

  // ページが読み込まれるまで待つ
  await page.waitForTimeout(3000);

  // 最初のスクリーンショット - トップページ
  await page.screenshot({
    path: 'storybook-homepage.png',
    fullPage: true,
  });

  // ReportCardをクリック
  await page.click('text=ReportCard');
  await page.waitForTimeout(2000);

  // ReportCardのスクリーンショット
  await page.screenshot({
    path: 'storybook-reportcard.png',
    fullPage: true,
  });

  // PhotoThumbnailGridをクリック
  await page.click('text=PhotoThumbnailGrid');
  await page.waitForTimeout(2000);

  // PhotoThumbnailGridのスクリーンショット
  await page.screenshot({
    path: 'storybook-photothumbnail.png',
    fullPage: true,
  });
});
