# Issue #12: パフォーマンス監視ダッシュボード構築

## 📋 Issue概要

**タイトル**: パフォーマンス監視ダッシュボード構築
**優先度**: P1 (高優先度)
**工数見積**: 3時間
**担当者**: TBD
**ラベル**: `enhancement`, `performance`, `monitoring`

---

## 🎯 目的

Lighthouse測定結果を可視化し、時系列でパフォーマンス推移を追跡する。READMEにパフォーマンスバッジを追加し、プロジェクトの品質を一目で確認できるようにする。

---

## 📊 現在の状況

### 完了済み

- ✅ Lighthouse セットアップ
- ✅ ベースライン測定完了
- ✅ 初回最適化完了（Performance 78/100）

### 課題

- ❌ パフォーマンススコアの可視化がない
- ❌ 時系列での推移が追跡できない
- ❌ README にスコアが表示されていない

---

## 🔧 実装内容

### タスク1: READMEにパフォーマンスバッジ追加

**ファイル**: `README.md`

**追加内容**:

```markdown
## 📊 品質指標

### Lighthouse スコア（Expo Web）

![Performance](https://img.shields.io/badge/Performance-78-yellow)
![Accessibility](https://img.shields.io/badge/Accessibility-94-brightgreen)
![Best Practices](https://img.shields.io/badge/Best%20Practices-100-brightgreen)
![SEO](https://img.shields.io/badge/SEO-92-brightgreen)

### Core Web Vitals

![FCP](https://img.shields.io/badge/FCP-0.29s-brightgreen)
![LCP](https://img.shields.io/badge/LCP-2.35s-green)
![TBT](https://img.shields.io/badge/TBT-169ms-green)
![CLS](https://img.shields.io/badge/CLS-0.006-brightgreen)

**最終測定日**: 2025-10-19

詳細レポート: [PERFORMANCE_FINAL_REPORT.md](docs/PERFORMANCE_FINAL_REPORT.md)
```

**視覚的イメージ**:

```
📊 品質指標
Lighthouse スコア（Expo Web）
[Performance: 78] [Accessibility: 94] [Best Practices: 100] [SEO: 92]

Core Web Vitals
[FCP: 0.29s] [LCP: 2.35s] [TBT: 169ms] [CLS: 0.006]
```

---

### タスク2: パフォーマンス履歴の記録

**ファイル**: `docs/performance-history.json` (新規)

**内容**:

```json
{
  "measurements": [
    {
      "date": "2025-10-19",
      "commit": "23323f3",
      "phase": "Phase 4 - 初回最適化完了",
      "scores": {
        "performance": 78,
        "accessibility": 94,
        "bestPractices": 100,
        "seo": 92
      },
      "metrics": {
        "fcp": 286.99,
        "lcp": 2352.98,
        "tbt": 169.0,
        "cls": 0.006,
        "speedIndex": 2441.86
      },
      "optimizations": [
        "SEO最適化（Meta情報追加）",
        "React.lazy によるコード分割",
        "expo-image 導入",
        "expo-splash-screen 統合"
      ]
    },
    {
      "date": "2025-10-19",
      "commit": "prev",
      "phase": "Phase 4 - ベースライン測定",
      "scores": {
        "performance": 67,
        "accessibility": 94,
        "bestPractices": 100,
        "seo": 83
      },
      "metrics": {
        "fcp": 1630.0,
        "lcp": 4300.0,
        "tbt": null,
        "cls": 0.001,
        "speedIndex": null
      },
      "optimizations": []
    }
  ]
}
```

---

### タスク3: パフォーマンスレポート生成スクリプト

**ファイル**: `scripts/generate-performance-badge.js` (新規)

**目的**: Lighthouse結果からバッジ用のJSONを生成

**内容**:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Lighthouse レポートを読み込み
const reportPath = path.join(__dirname, '../lighthouse-report-final.report.json');
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

// Markdown 生成
const markdown = `## 📊 品質指標

### Lighthouse スコア（Expo Web）

![Performance](https://img.shields.io/badge/Performance-${scores.performance}-${getColor(scores.performance)})
![Accessibility](https://img.shields.io/badge/Accessibility-${scores.accessibility}-${getColor(scores.accessibility)})
![Best Practices](https://img.shields.io/badge/Best%20Practices-${scores.bestPractices}-${getColor(scores.bestPractices)})
![SEO](https://img.shields.io/badge/SEO-${scores.seo}-${getColor(scores.seo)})

### Core Web Vitals

![FCP](https://img.shields.io/badge/FCP-${metrics.fcp}s-${metrics.fcp < 2.0 ? 'brightgreen' : 'yellow'})
![LCP](https://img.shields.io/badge/LCP-${metrics.lcp}s-${metrics.lcp < 2.5 ? 'green' : 'yellow'})
![TBT](https://img.shields.io/badge/TBT-${metrics.tbt}ms-${metrics.tbt < 300 ? 'green' : 'yellow'})
![CLS](https://img.shields.io/badge/CLS-${metrics.cls}-${metrics.cls < 0.1 ? 'brightgreen' : 'yellow'})

**最終測定日**: ${new Date().toISOString().split('T')[0]}

詳細レポート: [PERFORMANCE_FINAL_REPORT.md](docs/PERFORMANCE_FINAL_REPORT.md)
`;

// README の Performance セクションを更新
const readmePath = path.join(__dirname, '../README.md');
let readme = fs.readFileSync(readmePath, 'utf8');

// Performance セクションを置き換え
const perfSectionRegex = /## 📊 品質指標[\s\S]*?(?=\n## [^📊]|$)/;
if (perfSectionRegex.test(readme)) {
  readme = readme.replace(perfSectionRegex, markdown);
} else {
  // セクションがない場合は追加
  const insertPosition = readme.indexOf('## 🚀 開発');
  if (insertPosition > 0) {
    readme = readme.slice(0, insertPosition) + markdown + '\n\n' + readme.slice(insertPosition);
  } else {
    readme += '\n\n' + markdown;
  }
}

fs.writeFileSync(readmePath, readme, 'utf8');

console.log('✅ Performance badges updated in README.md');
console.log('\nScores:');
console.log(`  Performance: ${scores.performance}/100`);
console.log(`  Accessibility: ${scores.accessibility}/100`);
console.log(`  Best Practices: ${scores.bestPractices}/100`);
console.log(`  SEO: ${scores.seo}/100`);
console.log('\nCore Web Vitals:');
console.log(`  FCP: ${metrics.fcp}s`);
console.log(`  LCP: ${metrics.lcp}s`);
console.log(`  TBT: ${metrics.tbt}ms`);
console.log(`  CLS: ${metrics.cls}`);
```

---

### タスク4: npmスクリプト追加

**ファイル**: `package.json`

**追加スクリプト**:

```json
{
  "scripts": {
    "perf:update-badges": "node scripts/generate-performance-badge.js",
    "perf:report": "npm run perf:lighthouse && npm run perf:update-badges"
  }
}
```

**使用方法**:

```bash
# Lighthouse測定 + バッジ更新
npm run perf:report

# バッジのみ更新
npm run perf:update-badges
```

---

### タスク5: パフォーマンス履歴更新スクリプト

**ファイル**: `scripts/update-performance-history.js` (新規)

**目的**: 測定結果を performance-history.json に追記

**内容**:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Git commit hash 取得
const commit = execSync('git rev-parse --short HEAD').toString().trim();

// Lighthouse レポート読み込み
const reportPath = path.join(__dirname, '../lighthouse-report-final.report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

// 履歴ファイル読み込み
const historyPath = path.join(__dirname, '../docs/performance-history.json');
let history = { measurements: [] };
if (fs.existsSync(historyPath)) {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
}

// 新しい測定結果を追加
const newMeasurement = {
  date: new Date().toISOString().split('T')[0],
  commit: commit,
  phase: process.argv[2] || 'Manual measurement',
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
  optimizations: process.argv.slice(3),
};

history.measurements.unshift(newMeasurement);

// 履歴ファイル更新
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');

console.log('✅ Performance history updated');
console.log(`\nCommit: ${commit}`);
console.log(`Phase: ${newMeasurement.phase}`);
console.log(`Performance: ${newMeasurement.scores.performance}/100`);
```

**使用方法**:

```bash
# 履歴に追加
node scripts/update-performance-history.js "Phase 4.2 - 画像最適化" "WebP変換" "サムネイル生成"
```

---

## ✅ 成功条件

- ✅ README にパフォーマンスバッジが表示される
- ✅ バッジの色が自動で更新される（90点以上=緑、75点以上=黄色、etc.）
- ✅ `docs/performance-history.json` に測定履歴が記録される
- ✅ `npm run perf:report` で自動更新できる
- ✅ Core Web Vitals が可視化される

---

## 📂 作成・更新ファイル

### 新規作成

- `scripts/generate-performance-badge.js`
- `scripts/update-performance-history.js`
- `docs/performance-history.json`

### 更新

- `README.md`（パフォーマンスセクション追加）
- `package.json`（スクリプト追加）

---

## 🔄 実装手順

### Step 1: スクリプト作成（1時間）

```bash
# 1. バッジ生成スクリプト
touch scripts/generate-performance-badge.js
# 内容を実装

# 2. 履歴更新スクリプト
touch scripts/update-performance-history.js
# 内容を実装

# 3. 実行権限付与
chmod +x scripts/*.js
```

### Step 2: 履歴ファイル初期化（30分）

```bash
# 1. 履歴ファイル作成
node scripts/update-performance-history.js "Phase 4 - 初回最適化完了" \
  "SEO最適化" "コード分割" "expo-image導入"

# 2. 確認
cat docs/performance-history.json
```

### Step 3: README更新（30分）

```bash
# 1. バッジ自動生成
npm run perf:update-badges

# 2. 確認
cat README.md
```

### Step 4: 動作確認（1時間）

```bash
# 1. Lighthouse再測定
npm run perf:lighthouse:desktop

# 2. バッジ更新
npm run perf:update-badges

# 3. 履歴追加
node scripts/update-performance-history.js "Phase 4.1 - 監視ダッシュボード完成"

# 4. コミット
git add .
git commit -m "feat: パフォーマンス監視ダッシュボード構築 📊"
```

---

## 📊 期待される効果

### Before（現在）

- パフォーマンススコアを確認するには Lighthouse レポートを開く必要がある
- 過去の測定結果が記録されていない
- 改善効果が可視化されていない

### After（実装後）

- ✅ README を開くだけでスコアが一目でわかる
- ✅ `docs/performance-history.json` で時系列推移を追跡できる
- ✅ バッジの色で品質レベルが直感的にわかる
- ✅ Core Web Vitals の状況が把握できる

---

## 🎯 次のステップ

このIssue完了後:

1. **Issue #13**: Performance 90点達成のための追加最適化
   - 画像事前最適化
   - フォント最適化
   - Critical CSS抽出

2. **Issue #14**: Flashlight セットアップ（Optional）

---

## 📝 補足

### バッジ色の基準

| スコア | 色            | 意味     |
| ------ | ------------- | -------- |
| 90-100 | `brightgreen` | 優秀     |
| 75-89  | `green`       | 良好     |
| 50-74  | `yellow`      | 改善推奨 |
| 0-49   | `red`         | 要改善   |

### Core Web Vitals の基準

| 指標 | 優秀（緑） | 改善推奨（黄） |
| ---- | ---------- | -------------- |
| FCP  | < 2.0秒    | 2.0-4.0秒      |
| LCP  | < 2.5秒    | 2.5-4.0秒      |
| TBT  | < 300ms    | 300-600ms      |
| CLS  | < 0.1      | 0.1-0.25       |

---

**作成日**: 2025-10-19
**最終更新**: 2025-10-19
