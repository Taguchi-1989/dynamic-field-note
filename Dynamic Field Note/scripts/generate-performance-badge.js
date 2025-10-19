#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lighthouse レポートを読み込み
const reportPath = path.join(__dirname, '../lighthouse-report-final.report.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ Lighthouse report not found:', reportPath);
  console.error('Please run: npm run perf:lighthouse:desktop');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// スコアを抽出
const scores = {
  performance: Math.round(report.categories.performance.score * 100),
  accessibility: Math.round(report.categories.accessibility.score * 100),
  bestPractices: Math.round(report.categories['best-practices'].score * 100),
  seo: Math.round(report.categories.seo.score * 100),
};

// Core Web Vitals を抽出
const metrics = {
  fcp: (report.audits['first-contentful-paint'].numericValue / 1000).toFixed(2),
  lcp: (report.audits['largest-contentful-paint'].numericValue / 1000).toFixed(2),
  tbt: Math.round(report.audits['total-blocking-time'].numericValue),
  cls: report.audits['cumulative-layout-shift'].numericValue.toFixed(3),
};

// バッジ色を決定
const getColor = (score) => {
  if (score >= 90) return 'brightgreen';
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
};

const getMetricColor = (metric, value) => {
  switch (metric) {
    case 'fcp':
      return parseFloat(value) < 2.0 ? 'brightgreen' : 'yellow';
    case 'lcp':
      return parseFloat(value) < 2.5 ? 'green' : 'yellow';
    case 'tbt':
      return parseInt(value) < 300 ? 'green' : 'yellow';
    case 'cls':
      return parseFloat(value) < 0.1 ? 'brightgreen' : 'yellow';
    default:
      return 'blue';
  }
};

// Markdown 生成
const markdown = `## 📊 品質指標

### Lighthouse スコア（Expo Web）

![Performance](https://img.shields.io/badge/Performance-${scores.performance}-${getColor(scores.performance)})
![Accessibility](https://img.shields.io/badge/Accessibility-${scores.accessibility}-${getColor(scores.accessibility)})
![Best Practices](https://img.shields.io/badge/Best%20Practices-${scores.bestPractices}-${getColor(scores.bestPractices)})
![SEO](https://img.shields.io/badge/SEO-${scores.seo}-${getColor(scores.seo)})

### Core Web Vitals

![FCP](https://img.shields.io/badge/FCP-${metrics.fcp}s-${getMetricColor('fcp', metrics.fcp)})
![LCP](https://img.shields.io/badge/LCP-${metrics.lcp}s-${getMetricColor('lcp', metrics.lcp)})
![TBT](https://img.shields.io/badge/TBT-${metrics.tbt}ms-${getMetricColor('tbt', metrics.tbt)})
![CLS](https://img.shields.io/badge/CLS-${metrics.cls}-${getMetricColor('cls', metrics.cls)})

**最終測定日**: ${new Date().toISOString().split('T')[0]}

詳細レポート: [PERFORMANCE_FINAL_REPORT.md](docs/PERFORMANCE_FINAL_REPORT.md)
`;

// README の Performance セクションを更新
const readmePath = path.join(__dirname, '../README.md');
let readme = fs.readFileSync(readmePath, 'utf8');

// Performance セクションを置き換え
const perfSectionRegex = /## 📊 品質指標[\s\S]*?(?=\n## |$)/;
if (perfSectionRegex.test(readme)) {
  readme = readme.replace(perfSectionRegex, markdown.trim() + '\n\n');
} else {
  // セクションがない場合は追加
  const insertPosition = readme.indexOf('## 🚀');
  if (insertPosition > 0) {
    readme = readme.slice(0, insertPosition) + markdown + '\n' + readme.slice(insertPosition);
  } else {
    // 末尾に追加
    readme += '\n\n' + markdown;
  }
}

fs.writeFileSync(readmePath, readme, 'utf8');

console.log('✅ Performance badges updated in README.md\n');
console.log('📊 Scores:');
console.log(`  Performance: ${scores.performance}/100`);
console.log(`  Accessibility: ${scores.accessibility}/100`);
console.log(`  Best Practices: ${scores.bestPractices}/100`);
console.log(`  SEO: ${scores.seo}/100`);
console.log('\n🎯 Core Web Vitals:');
console.log(`  FCP: ${metrics.fcp}s`);
console.log(`  LCP: ${metrics.lcp}s`);
console.log(`  TBT: ${metrics.tbt}ms`);
console.log(`  CLS: ${metrics.cls}`);
