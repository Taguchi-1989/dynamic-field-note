# Phase 4: 次のステップ - パフォーマンス監視 & 追加最適化 📈

**作成日**: 2025-10-19
**前提**: Phase 3 完了、Lighthouse初回最適化完了（78/100点達成）
**目標**: CI/CD統合 + Performance 90点達成

---

## 📊 現在の状況

### 完了した作業

✅ **Issue #6**: Lighthouse セットアップ（Expo Web）
✅ **Issue #7**: ベースライン測定
✅ **Issue #8**: Performance 改善（一部）

- SEO最適化: 83点→92点 ✅
- コード分割: React.lazy + Suspense
- 画像最適化: expo-image 導入
- Core Web Vitals: 全項目達成 ✅
- Performance: 67点→78点（目標90点、-12点）

### 未完了の作業

⚠️ **Issue #5**: Flashlight セットアップ（Android）- 未着手
⚠️ **Issue #8**: Performance 改善 - 部分的完了（78/100、目標90未達）
⚠️ **Issue #9**: CI/CD パイプライン統合 - 未着手
⚠️ **Issue #10**: 定期監視設定 - 未着手

---

## 🎯 次のフェーズの優先順位

### Phase 4.1: CI/CD統合 & 監視（高優先度）

**理由**: 現状のPerformance 78点は「良好」レベル。これ以上の最適化より、まずは**パフォーマンス退行を防ぐ仕組み**を構築すべき。

### Phase 4.2: Performance 90点達成（中優先度）

**理由**: ユーザー体験への影響は限定的。段階的に改善可能。

### Phase 5: Phase 3残タスク完了（低優先度）

**理由**: Phase 3の主要機能は完了済み。残タスクは補助的機能。

---

## 📋 Issue リスト

## 🎯 Issue #11: Lighthouse CI/CD統合

### 優先度

**P0** - 最優先（パフォーマンス退行防止）

### 目的

Lighthouse測定をCI/CDパイプラインに統合し、コミット/PR時に自動測定。パフォーマンス退行を検出する。

### 実装内容

#### 1. GitHub Actions ワークフロー作成

**`.github/workflows/lighthouse-ci.yml`**

```yaml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Expo Web
        run: npx expo export:web

      - name: Serve Expo Web
        run: |
          npx serve web-build -l 8080 &
          sleep 10

      - name: Run Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse Results
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: .lighthouseci/
```

#### 2. Lighthouse CI 設定更新

**`lighthouserc.js`** (既存ファイル更新)

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npx serve web-build -p 8080',
      url: ['http://localhost:8080'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['warn', { minScore: 0.75 }], // 現実的な閾値
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // GitHub Actionsで利用
    },
  },
};
```

#### 3. npm スクリプト更新

**`package.json`**

```json
{
  "scripts": {
    "perf:lighthouse": "lhci autorun",
    "perf:lighthouse:ci": "npm run build:web && lhci autorun",
    "build:web": "npx expo export:web"
  }
}
```

### 測定指標

| 指標               | 警告閾値 | エラー閾値 | 現在値 |
| ------------------ | -------- | ---------- | ------ |
| **Performance**    | <75      | -          | 78     |
| **Accessibility**  | -        | <90        | 94     |
| **Best Practices** | -        | <90        | 100    |
| **SEO**            | -        | <90        | 92     |
| **FCP**            | >2.0s    | -          | 0.29s  |
| **LCP**            | >2.5s    | -          | 2.35s  |

### 成功条件

- ✅ GitHub Actions でLighthouse測定が自動実行される
- ✅ PR時にLighthouseレポートがコメントされる
- ✅ パフォーマンス退行時にCI/CDが警告を出す
- ✅ Lighthouse結果がArtifactとして保存される

### 実装ファイル

- `.github/workflows/lighthouse-ci.yml` (新規)
- `lighthouserc.js` (更新)
- `package.json` (更新)

### 工数見積

- 実装: 2時間
- テスト: 1時間
- **合計**: 3時間

---

## 🎯 Issue #12: パフォーマンス監視ダッシュボード

### 優先度

**P1** - 高優先度（可視化）

### 目的

Lighthouse測定結果を可視化し、時系列でパフォーマンス推移を追跡する。

### 実装内容

#### 1. Lighthouse CI Server セットアップ（Optional）

**Alternative 1: Lighthouse CI Server**

```bash
# Dockerで起動
docker run -p 9001:9001 -v lhci-data:/data patrickhulce/lhci-server
```

**Alternative 2: GitHub Pages（簡易版）**

```yaml
# .github/workflows/lighthouse-report.yml
- name: Deploy Lighthouse Report to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./.lighthouseci
```

#### 2. パフォーマンスバッジ追加

**`README.md`** 更新

```markdown
# Dynamic Field Note

[![Lighthouse Performance](https://img.shields.io/badge/Performance-78-yellow)](https://github.com/your-repo/lighthouse-reports)
[![Lighthouse Accessibility](https://img.shields.io/badge/Accessibility-94-green)](https://github.com/your-repo/lighthouse-reports)
[![Lighthouse Best Practices](https://img.shields.io/badge/Best%20Practices-100-brightgreen)](https://github.com/your-repo/lighthouse-reports)
[![Lighthouse SEO](https://img.shields.io/badge/SEO-92-green)](https://github.com/your-repo/lighthouse-reports)
```

#### 3. スラック通知（Optional）

```yaml
# .github/workflows/lighthouse-ci.yml に追加
- name: Notify Slack
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Lighthouse CI failed - Performance regression detected!'
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 成功条件

- ✅ パフォーマンス推移がグラフで可視化される
- ✅ README にパフォーマンスバッジが表示される
- ✅ （Optional）Slack通知が動作する

### 実装ファイル

- `.github/workflows/lighthouse-report.yml` (新規)
- `README.md` (更新)
- `docker-compose.yml` (Optional)

### 工数見積

- 実装: 2時間
- テスト: 1時間
- **合計**: 3時間

---

## 🎯 Issue #13: Performance 90点達成のための追加最適化

### 優先度

**P2** - 中優先度（段階的改善）

### 目的

Performance スコアを 78点→90点 に引き上げる。

### 課題分析

**現在の減点要因**:

1. **Speed Index: 44点** (2.44秒)
   - 視覚的な表示速度が遅い
   - Progressive Rendering が最適化されていない

2. **Total Blocking Time: 169ms**
   - JavaScript実行によるメインスレッドブロック
   - 目標300ms以内だがやや高め

### 実装内容

#### Phase 1: 画像の事前最適化（優先度: 高）

**1. WebP形式への事前変換**

```bash
# 画像最適化スクリプト
# scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs').promises;

async function optimizeImages() {
  const images = await fs.readdir('./assets/images');

  for (const image of images) {
    await sharp(`./assets/images/${image}`)
      .webp({ quality: 80 })
      .resize(800, 600, { fit: 'inside' })
      .toFile(`./assets/optimized/${image.replace(/\.\w+$/, '.webp')}`);

    // サムネイル生成
    await sharp(`./assets/images/${image}`)
      .webp({ quality: 60 })
      .resize(200, 150, { fit: 'cover' })
      .toFile(`./assets/thumbnails/${image.replace(/\.\w+$/, '.webp')}`);
  }
}
```

**2. Placeholder画像の導入**

```typescript
// src/components/PhotoThumbnailGrid.tsx
import { Image } from 'expo-image';

<Image
  source={{ uri: photo.uri }}
  placeholder={{
    blurhash: 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4', // 事前生成
  }}
  transition={200}
  style={styles.thumbnail}
/>;
```

**工数**: 3時間

#### Phase 2: フォント最適化（優先度: 高）

**1. フォントプリロード**

```json
// app.json
{
  "expo": {
    "web": {
      "build": {
        "babel": {
          "include": ["@expo/vector-icons"]
        }
      }
    }
  }
}
```

**2. 未使用フォントの削除**

```typescript
// App.tsx
import { useFonts } from 'expo-font';

// 使用するフォントのみ読み込み
const [fontsLoaded] = useFonts({
  MaterialIcons: require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf'),
  // 未使用のフォントを削除
});
```

**工数**: 2時間

#### Phase 3: Critical CSS 抽出（優先度: 中）

**1. Above-the-fold CSS のインライン化**

```html
<!-- index.html に Critical CSS を埋め込み -->
<style>
  /* Above-the-fold の最小限のCSS */
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  #root {
    min-height: 100vh;
  }
</style>
```

**2. 残りのCSSを非同期ロード**

```javascript
// 非同期CSS読み込み
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = '/static/css/main.css';
link.media = 'print';
link.onload = function () {
  this.media = 'all';
};
document.head.appendChild(link);
```

**工数**: 3時間

#### Phase 4: バンドルサイズ最適化（優先度: 中）

**1. Bundle分析**

```bash
# バンドルサイズ分析
npx expo export:web
npx source-map-explorer web-build/static/js/*.js
```

**2. Tree Shaking 強化**

```typescript
// ❌ Before: 全体をimport
import _ from 'lodash';

// ✅ After: 個別import
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
```

**3. React Native Paper の最適化**

```typescript
// ❌ Before: 全コンポーネントimport
import { Button, Card, List, FAB } from 'react-native-paper';

// ✅ After: 個別import
import Button from 'react-native-paper/lib/module/components/Button';
import Card from 'react-native-paper/lib/module/components/Card';
```

**工数**: 4時間

#### Phase 5: Service Worker / PWA化（優先度: 低）

**1. Service Worker 設定**

```javascript
// service-worker.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

// 静的アセットのプリキャッシュ
precacheAndRoute(self.__WB_MANIFEST);

// 画像のキャッシュ戦略
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30日
      }),
    ],
  })
);

// APIのキャッシュ戦略
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
  })
);
```

**2. Manifest.json 設定**

```json
{
  "name": "Dynamic Field Note",
  "short_name": "DFN",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1976d2",
  "theme_color": "#1976d2",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

**工数**: 5時間

### 期待される改善効果

| 施策                     | 期待スコア改善 | 優先度 |
| ------------------------ | -------------- | ------ |
| 画像事前最適化           | +3~5点         | 高     |
| フォント最適化           | +2~3点         | 高     |
| Critical CSS             | +2~3点         | 中     |
| バンドルサイズ最適化     | +3~4点         | 中     |
| Service Worker / PWA化   | +2~3点         | 低     |
| **合計（全施策実施時）** | **+12~18点**   | -      |

### 成功条件

- ✅ Performance スコア ≥ 90点
- ✅ Speed Index ≥ 70点
- ✅ TBT ≤ 150ms
- ✅ バンドルサイズ削減（-20%以上）

### 実装ファイル

- `scripts/optimize-images.js` (新規)
- `service-worker.js` (新規)
- `app.json` (更新)
- `App.tsx` (更新)
- `src/components/*` (更新)

### 工数見積

- Phase 1: 3時間
- Phase 2: 2時間
- Phase 3: 3時間
- Phase 4: 4時間
- Phase 5: 5時間
- **合計**: 17時間（約2~3日）

---

## 🎯 Issue #14: Flashlight セットアップ（Android）

### 優先度

**P3** - 低優先度（React Native専用）

### 目的

React Native（Android）アプリのパフォーマンスを測定し、ネイティブアプリの品質を保証する。

### 前提条件

- Android実機またはエミュレータが利用可能
- ADB（Android Debug Bridge）がインストール済み

### 実装内容

#### 1. パッケージインストール

```bash
npm install --save-dev @perf-profiler/profiler
npm install --save-dev @perf-profiler/types
```

#### 2. 設定ファイル確認

**`flashlight.config.js`** (既に作成済み)

- 測定対象: Android
- テストシナリオ: App Launch, Case List, Voice Recording, AI Summary
- パフォーマンス閾値: Score ≥ 90, FPS ≥ 55

#### 3. 測定実行

```bash
# Android実機/エミュレータで測定
npm run perf:flashlight

# レポート確認
npm run perf:flashlight:report
```

### 測定指標

| 指標                     | 目標値  | 重要度 |
| ------------------------ | ------- | ------ |
| **パフォーマンススコア** | ≥ 90点  | P0     |
| **FPS (Frame Rate)**     | ≥ 55    | P0     |
| **CPU使用率**            | ≤ 30%   | P1     |
| **メモリ使用量**         | ≤ 150MB | P1     |
| **アプリ起動時間**       | ≤ 2.5秒 | P0     |

### 成功条件

- ✅ Flashlight が正常に動作
- ✅ Android でパフォーマンススコアが取得できる
- ✅ レポートが HTML 形式で出力される

### 実装ファイル

- `flashlight.config.js` (既存)
- `package.json` (既存)

### 工数見積

- セットアップ: 1時間
- 測定・分析: 2時間
- **合計**: 3時間

---

## 📊 総合工数見積

| Issue  | タイトル                | 優先度 | 工数  | 累積工数 |
| ------ | ----------------------- | ------ | ----- | -------- |
| #11    | CI/CD統合               | P0     | 3時間 | 3時間    |
| #12    | 監視ダッシュボード      | P1     | 3時間 | 6時間    |
| #13-P1 | 画像事前最適化          | P2     | 3時間 | 9時間    |
| #13-P2 | フォント最適化          | P2     | 2時間 | 11時間   |
| #13-P3 | Critical CSS            | P2     | 3時間 | 14時間   |
| #13-P4 | バンドルサイズ最適化    | P2     | 4時間 | 18時間   |
| #13-P5 | Service Worker / PWA化  | P2     | 5時間 | 23時間   |
| #14    | Flashlight セットアップ | P3     | 3時間 | 26時間   |

**合計**: 26時間（約3~4日）

---

## 🚀 実装順序の推奨

### Week 1: CI/CD統合 & 監視（必須）

1. **Day 1**: Issue #11 - CI/CD統合（3時間）
2. **Day 2**: Issue #12 - 監視ダッシュボード（3時間）

**マイルストーン**: パフォーマンス退行防止の仕組み完成

### Week 2: Performance 90点達成（段階的）

3. **Day 3**: Issue #13-P1 - 画像事前最適化（3時間）
4. **Day 4**: Issue #13-P2 - フォント最適化（2時間）
5. **Day 5**: 測定 & 効果検証（2時間）

**マイルストーン**: Performance 85点以上達成

### Week 3: 追加最適化（Optional）

6. **Day 6**: Issue #13-P3 - Critical CSS（3時間）
7. **Day 7**: Issue #13-P4 - バンドルサイズ最適化（4時間）
8. **Day 8**: 測定 & 効果検証（2時間）

**マイルストーン**: Performance 90点達成

### Week 4: ネイティブアプリ測定（Optional）

9. **Day 9**: Issue #14 - Flashlight セットアップ（3時間）

**マイルストーン**: React Native版パフォーマンス測定完了

---

## ✅ 最小構成（MVP: Minimum Viable Product）

**目標**: 1週間でパフォーマンス退行防止の仕組みを構築

### 必須実装

- ✅ Issue #11: CI/CD統合
- ✅ Issue #12: 監視ダッシュボード

### Optional（余裕があれば）

- Issue #13-P1: 画像事前最適化
- Issue #13-P2: フォント最適化

### 延期可能

- Issue #13-P3~P5: 追加最適化
- Issue #14: Flashlight

---

## 📝 次のアクション

### ステップ 1: ユーザー確認

以下の点について確認してください：

1. **優先順位は適切か？**
   - CI/CD統合を最優先で進める方針で良いか
   - Performance 90点達成は段階的で良いか

2. **実装範囲は適切か？**
   - Week 1のCI/CD統合のみ実装するか
   - Week 2のPerformance最適化まで進めるか

3. **工数見積は現実的か？**
   - 3~4日の工数で問題ないか

### ステップ 2: 実装開始

承認後、以下の順序で実装します：

```bash
# Issue #11: CI/CD統合
1. .github/workflows/lighthouse-ci.yml 作成
2. lighthouserc.js 更新
3. package.json にスクリプト追加
4. GitHub Actionsテスト実行

# Issue #12: 監視ダッシュボード
1. .github/workflows/lighthouse-report.yml 作成
2. README.md にバッジ追加
3. (Optional) Slack通知設定
```

---

**ユーザーの承認を待っています** 👍

次のフェーズの計画について、フィードバックをお願いします。
