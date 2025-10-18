/**
 * Lighthouse Performance Measurement Script
 * Playwrightを使用してChromiumでLighthouseを実行
 */

const lighthouse = require('lighthouse');
const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

async function runLighthouse() {
  console.log('🚀 Starting Lighthouse measurement...\n');

  // Playwrightでchromiumを起動
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // CDP (Chrome DevTools Protocol) エンドポイントを取得
  const cdpSession = await page.context().newCDPSession(page);
  const { webSocketDebuggerUrl } = await cdpSession.send('Target.getTargets');

  try {
    const url = 'http://localhost:8081';

    console.log(`📊 Measuring: ${url}\n`);

    // Lighthouse実行（Desktop設定）
    const desktopResult = await lighthouse(url, {
      port: new URL(webSocketDebuggerUrl).port,
      output: 'html',
      logLevel: 'info',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      formFactor: 'desktop',
      screenEmulation: {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      },
    });

    // スコア抽出
    const categories = desktopResult.lhr.categories;
    const scores = {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100),
      pwa: Math.round(categories.pwa.score * 100),
    };

    // 結果表示
    console.log('\n📈 Lighthouse Scores (Desktop):');
    console.log('================================');
    console.log(`Performance:     ${scores.performance}/100 ${getEmoji(scores.performance)}`);
    console.log(`Accessibility:   ${scores.accessibility}/100 ${getEmoji(scores.accessibility)}`);
    console.log(`Best Practices:  ${scores.bestPractices}/100 ${getEmoji(scores.bestPractices)}`);
    console.log(`SEO:             ${scores.seo}/100 ${getEmoji(scores.seo)}`);
    console.log(`PWA:             ${scores.pwa}/100 ${getEmoji(scores.pwa)}`);
    console.log('================================\n');

    // 90点未満の項目をリストアップ
    const needsImprovement = Object.entries(scores).filter(([_, score]) => score < 90);

    if (needsImprovement.length > 0) {
      console.log('⚠️  Items needing improvement (< 90 points):');
      needsImprovement.forEach(([category, score]) => {
        console.log(`   - ${category}: ${score}/100`);
      });
      console.log('');
    } else {
      console.log('✅ All categories scored 90+ points!\n');
    }

    // Core Web Vitals
    const audits = desktopResult.lhr.audits;
    console.log('🌐 Core Web Vitals:');
    console.log('================================');
    console.log(
      `FCP (First Contentful Paint):    ${(audits['first-contentful-paint'].numericValue / 1000).toFixed(2)}s`
    );
    console.log(
      `LCP (Largest Contentful Paint):  ${(audits['largest-contentful-paint'].numericValue / 1000).toFixed(2)}s`
    );
    console.log(
      `TBT (Total Blocking Time):       ${audits['total-blocking-time'].numericValue.toFixed(0)}ms`
    );
    console.log(
      `CLS (Cumulative Layout Shift):   ${audits['cumulative-layout-shift'].numericValue.toFixed(3)}`
    );
    console.log(
      `Speed Index:                     ${(audits['speed-index'].numericValue / 1000).toFixed(2)}s`
    );
    console.log('================================\n');

    // レポート保存
    const reportDir = path.join(process.cwd(), 'lighthouse-reports');
    await fs.mkdir(reportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const htmlPath = path.join(reportDir, `lighthouse-${timestamp}.html`);
    const jsonPath = path.join(reportDir, `lighthouse-${timestamp}.json`);

    await fs.writeFile(htmlPath, desktopResult.report);
    await fs.writeFile(jsonPath, JSON.stringify(desktopResult.lhr, null, 2));

    console.log(`💾 Reports saved:`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   JSON: ${jsonPath}\n`);

    // 判定
    const allPassed = needsImprovement.length === 0;
    if (allPassed) {
      console.log('🎉 SUCCESS: All categories scored 90+ points!');
      process.exit(0);
    } else {
      console.log(`❌ FAIL: ${needsImprovement.length} categories scored below 90 points`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running Lighthouse:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

function getEmoji(score) {
  if (score >= 90) return '✅';
  if (score >= 50) return '⚠️';
  return '❌';
}

// 実行
runLighthouse().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
