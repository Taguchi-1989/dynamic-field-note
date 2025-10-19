#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Git commit hash 取得
let commit = 'unknown';
try {
  commit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.warn('⚠️ Failed to get git commit hash');
}

// Lighthouse レポート読み込み
const reportPath = path.join(__dirname, '../lighthouse-report-final.report.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ Lighthouse report not found:', reportPath);
  console.error('Please run: npm run perf:lighthouse:desktop');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// 履歴ファイル読み込み
const historyPath = path.join(__dirname, '../docs/performance-history.json');
let history = { measurements: [] };
if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
}

// コマンドライン引数から phase と optimizations を取得
const phase = process.argv[2] || 'Manual measurement';
const optimizations = process.argv.slice(3);

// 新しい測定結果を追加
const newMeasurement = {
  date: new Date().toISOString().split('T')[0],
  commit: commit,
  phase: phase,
  scores: {
    performance: Math.round(report.categories.performance.score * 100),
    accessibility: Math.round(report.categories.accessibility.score * 100),
    bestPractices: Math.round(report.categories['best-practices'].score * 100),
    seo: Math.round(report.categories.seo.score * 100),
  },
  metrics: {
    fcp: parseFloat((report.audits['first-contentful-paint'].numericValue / 1000).toFixed(2)),
    lcp: parseFloat((report.audits['largest-contentful-paint'].numericValue / 1000).toFixed(2)),
    tbt: Math.round(report.audits['total-blocking-time'].numericValue),
    cls: parseFloat(report.audits['cumulative-layout-shift'].numericValue.toFixed(3)),
    speedIndex: parseFloat((report.audits['speed-index'].numericValue / 1000).toFixed(2)),
  },
  optimizations: optimizations,
};

// 先頭に追加（新しい順）
history.measurements.unshift(newMeasurement);

// 履歴ファイル更新
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

console.log('✅ Performance history updated\n');
console.log(`📅 Date: ${newMeasurement.date}`);
console.log(`📦 Commit: ${commit}`);
console.log(`🎯 Phase: ${phase}`);
console.log('\n📊 Scores:');
console.log(`  Performance: ${newMeasurement.scores.performance}/100`);
console.log(`  Accessibility: ${newMeasurement.scores.accessibility}/100`);
console.log(`  Best Practices: ${newMeasurement.scores.bestPractices}/100`);
console.log(`  SEO: ${newMeasurement.scores.seo}/100`);
console.log('\n🎯 Core Web Vitals:');
console.log(`  FCP: ${newMeasurement.metrics.fcp}s`);
console.log(`  LCP: ${newMeasurement.metrics.lcp}s`);
console.log(`  TBT: ${newMeasurement.metrics.tbt}ms`);
console.log(`  CLS: ${newMeasurement.metrics.cls}`);

if (optimizations.length > 0) {
  console.log('\n🔧 Optimizations:');
  optimizations.forEach((opt) => console.log(`  - ${opt}`));
}

console.log(`\n💾 Saved to: ${historyPath}`);
