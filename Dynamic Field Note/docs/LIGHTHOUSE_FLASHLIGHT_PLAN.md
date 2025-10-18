# Lighthouse & Flashlight 導入計画

**作成日**: 2025-10-19
**目標**: 全項目で90点以上のスコア達成
**対象**: React Native (Android/iOS) + Expo Web

---

## 📊 測定対象と目標スコア

### Flashlight (React Native Mobile)

| カテゴリ               | 目標スコア | 重要度 | 測定指標                  |
| ---------------------- | ---------- | ------ | ------------------------- |
| **総合パフォーマンス** | ≥ 90点     | P0     | 総合スコア                |
| **FPS (Frame Rate)**   | ≥ 55 FPS   | P0     | UI smoothness             |
| **CPU使用率**          | ≤ 30%      | P1     | バッテリー寿命への影響    |
| **メモリ使用量**       | ≤ 150MB    | P1     | RAM usage                 |
| **アプリ起動時間**     | ≤ 2.5秒    | P0     | Time to Interactive (TTI) |
| **バンドルサイズ**     | ≤ 10MB     | P1     | JS bundle size            |

### Lighthouse (Expo Web)

| カテゴリ           | 目標スコア | 重要度 | 測定指標                          |
| ------------------ | ---------- | ------ | --------------------------------- |
| **Performance**    | ≥ 90点     | P0     | FCP, LCP, TBT, CLS, Speed Index   |
| **Accessibility**  | ≥ 90点     | P0     | ARIA, contrast, keyboard nav      |
| **Best Practices** | ≥ 90点     | P1     | HTTPS, console errors, deprecated |
| **SEO**            | ≥ 90点     | P1     | Meta tags, structured data        |
| **PWA**            | ≥ 80点     | P2     | Service worker, manifest          |

---

## 🎯 Phase 1: 環境構築（Week 1）

### 1.1 Flashlight セットアップ (React Native)

#### パッケージインストール

```bash
npm install --save-dev @perf-profiler/profiler
npm install --save-dev @perf-profiler/types
```

#### 設定ファイル作成

**`flashlight.config.js`**

```javascript
module.exports = {
  // 測定対象のプラットフォーム
  platforms: ['android'], // iOS追加予定

  // パフォーマンス閾値
  thresholds: {
    performanceScore: 90,
    fps: 55,
    cpu: 30, // %
    ram: 150, // MB
    bundleSize: 10, // MB
  },

  // テストシナリオ
  scenarios: [
    {
      name: 'App Launch',
      iterations: 10,
      commands: ['expo start --no-dev --minify'],
    },
    {
      name: 'Case List Navigation',
      iterations: 10,
      commands: ['maestro test e2e/performance/case-list.yaml'],
    },
    {
      name: 'Voice Recording',
      iterations: 10,
      commands: ['maestro test e2e/performance/voice-recording.yaml'],
    },
    {
      name: 'AI Summary Generation',
      iterations: 10,
      commands: ['maestro test e2e/performance/ai-summary.yaml'],
    },
  ],

  // レポート出力先
  output: {
    directory: './performance-reports',
    format: ['json', 'html', 'markdown'],
  },
};
```

### 1.2 Lighthouse セットアップ (Expo Web)

#### パッケージインストール

```bash
npm install --save-dev lighthouse
npm install --save-dev lighthouse-ci
```

#### 設定ファイル作成

**`lighthouserc.js`**

```javascript
module.exports = {
  ci: {
    collect: {
      // Expo Web のビルド
      startServerCommand: 'npx expo export:web && npx serve web-build -p 8080',
      url: ['http://localhost:8080'],
      numberOfRuns: 3, // 平均値算出のため3回実行
      settings: {
        preset: 'desktop', // mobile/desktop
        throttling: {
          rttMs: 40,
          throughputKbps: 10 * 1024,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // パフォーマンス
        'categories:performance': ['error', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],

        // アクセシビリティ
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'color-contrast': 'error',
        'aria-valid-attr-value': 'error',
        'button-name': 'error',
        'image-alt': 'error',

        // ベストプラクティス
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'errors-in-console': 'warn',
        'uses-http2': 'warn',

        // SEO
        'categories:seo': ['error', { minScore: 0.9 }],
        'meta-description': 'error',
        'document-title': 'error',
        viewport: 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

---

## 🎯 Phase 2: ベースライン測定（Week 1-2）

### 2.1 Flashlight ベースライン測定

#### npm スクリプト追加

**`package.json`**

```json
{
  "scripts": {
    "perf:flashlight": "flashlight test --config flashlight.config.js",
    "perf:flashlight:report": "flashlight report --open",
    "perf:android": "flashlight measure android",
    "perf:ios": "flashlight measure ios"
  }
}
```

#### 測定実行

```bash
# Android パフォーマンス測定
npm run perf:android

# レポート生成
npm run perf:flashlight:report
```

### 2.2 Lighthouse ベースライン測定

#### npm スクリプト追加

**`package.json`**

```json
{
  "scripts": {
    "perf:lighthouse": "lhci autorun",
    "perf:lighthouse:mobile": "lighthouse http://localhost:8080 --preset=mobile --view",
    "perf:lighthouse:desktop": "lighthouse http://localhost:8080 --preset=desktop --view",
    "perf:web": "npm run web && npm run perf:lighthouse"
  }
}
```

#### 測定実行

```bash
# Expo Web ビルド
npm run web

# 別ターミナルで Lighthouse 実行
npm run perf:lighthouse:mobile
npm run perf:lighthouse:desktop
```

---

## 🎯 Phase 3: パフォーマンス改善（Week 2-4）

### 3.1 共通改善項目（全プラットフォーム）

#### 優先度 P0: 必須改善項目

1. **バンドルサイズ最適化**
   - Tree-shaking の徹底
   - 未使用コードの削除
   - コード分割（React.lazy + Suspense）
   - 画像最適化（WebP化、圧縮）

2. **レンダリング最適化**
   - React.memo の活用
   - useMemo / useCallback の適切な使用
   - FlatList の最適化（initialNumToRender, maxToRenderPerBatch）
   - 不要な再レンダリング防止

3. **ネットワーク最適化**
   - API レスポンスのキャッシング
   - Gemini API のレート制限対策
   - オフライン対応強化

#### 優先度 P1: 推奨改善項目

4. **起動時間の改善**
   - Hermes エンジンの有効化（Android）
   - Lazy loading の導入
   - 初期データの最小化

5. **メモリ管理**
   - 画像キャッシュの最適化
   - 大量データの仮想化（VirtualizedList）
   - メモリリーク防止

### 3.2 Expo Web 特有の改善

#### Accessibility 90点達成

```typescript
// ❌ Before
<TouchableOpacity onPress={handlePress}>
  <Image source={icon} />
</TouchableOpacity>

// ✅ After
<TouchableOpacity
  onPress={handlePress}
  accessible={true}
  accessibilityLabel="案件を作成"
  accessibilityRole="button"
  accessibilityHint="新しい案件を作成します"
>
  <Image source={icon} alt="作成アイコン" />
</TouchableOpacity>
```

#### SEO 90点達成

**`app.json` 更新**

```json
{
  "expo": {
    "web": {
      "favicon": "./assets/favicon.png",
      "meta": {
        "title": "Dynamic Field Note - 現場調査アプリ",
        "description": "音声メモをAIで自動要約する現場調査・点検アプリ",
        "keywords": "現場調査,点検,音声メモ,AI要約,React Native"
      }
    }
  }
}
```

#### Best Practices 90点達成

- HTTPS 対応（本番環境）
- console.log の削除（production build）
- セキュリティヘッダーの設定
- 廃止予定 API の置き換え

---

## 🎯 Phase 4: CI/CD 統合（Week 4-5）

### 4.1 GitHub Actions ワークフロー

**`.github/workflows/performance.yml`**

```yaml
name: Performance Testing

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  flashlight-android:
    name: Flashlight (Android)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Run Flashlight
        run: npm run perf:flashlight

      - name: Upload Flashlight Report
        uses: actions/upload-artifact@v4
        with:
          name: flashlight-report
          path: performance-reports/

      - name: Performance Regression Check
        run: |
          SCORE=$(cat performance-reports/latest.json | jq '.performanceScore')
          if (( $(echo "$SCORE < 90" | bc -l) )); then
            echo "❌ Performance score $SCORE is below 90"
            exit 1
          fi
          echo "✅ Performance score: $SCORE"

  lighthouse-web:
    name: Lighthouse (Web)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Expo Web
        run: npx expo export:web

      - name: Run Lighthouse CI
        run: npm run perf:lighthouse
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse Report
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-report
          path: .lighthouseci/

      - name: Comment PR with Results
        uses: treosh/lighthouse-ci-action@v10
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### 4.2 npm スクリプト統合

**`package.json`**

```json
{
  "scripts": {
    "perf:all": "npm run perf:flashlight && npm run perf:lighthouse",
    "perf:check": "npm run perf:all && node scripts/check-performance-thresholds.js",
    "guardrails:perf": "npm run guardrails && npm run perf:check"
  }
}
```

---

## 🎯 Phase 5: 継続的モニタリング（Week 5-）

### 5.1 パフォーマンスバジェット設定

**`performance-budget.json`**

```json
{
  "mobile": {
    "flashlight": {
      "performanceScore": 90,
      "fps": 55,
      "cpu": 30,
      "ram": 150,
      "bundleSize": 10240
    }
  },
  "web": {
    "lighthouse": {
      "performance": 90,
      "accessibility": 90,
      "bestPractices": 90,
      "seo": 90,
      "pwa": 80
    },
    "metrics": {
      "fcp": 2000,
      "lcp": 2500,
      "cls": 0.1,
      "tbt": 300
    }
  }
}
```

### 5.2 定期実行スケジュール

```yaml
# .github/workflows/performance-weekly.yml
on:
  schedule:
    - cron: '0 9 * * 1' # 毎週月曜 9:00 JST (0:00 UTC)
```

### 5.3 レポートダッシュボード

- **Flashlight**: `performance-reports/index.html`
- **Lighthouse**: `.lighthouseci/report.html`
- **GitHub Actions**: Artifacts タブから閲覧

---

## 📊 成功指標 (KPI)

### 短期目標（1ヶ月）

| 指標                         | 現在値 | 目標値 | ステータス |
| ---------------------------- | ------ | ------ | ---------- |
| Flashlight Performance Score | -      | ≥ 90   | ⏳ 測定中  |
| Lighthouse Performance       | -      | ≥ 90   | ⏳ 測定中  |
| Lighthouse Accessibility     | -      | ≥ 90   | ⏳ 測定中  |
| Lighthouse Best Practices    | -      | ≥ 90   | ⏳ 測定中  |
| Lighthouse SEO               | -      | ≥ 90   | ⏳ 測定中  |
| FPS (Android)                | -      | ≥ 55   | ⏳ 測定中  |
| アプリ起動時間               | -      | ≤ 2.5s | ⏳ 測定中  |
| JSバンドルサイズ             | -      | ≤ 10MB | ⏳ 測定中  |

### 長期目標（3ヶ月）

- **全項目90点以上達成**: 100%
- **パフォーマンス回帰ゼロ**: CI/CDで自動検出
- **ユーザー体感速度向上**: アプリ起動2秒以内
- **アクセシビリティ準拠**: WCAG 2.1 AA達成

---

## 🚀 実装ロードマップ

### Week 1: 環境構築 ✅

- [x] Flashlight インストール
- [x] Lighthouse インストール
- [x] 設定ファイル作成
- [x] npm スクリプト追加

### Week 2: ベースライン測定 🔄

- [ ] Android パフォーマンス測定
- [ ] Expo Web パフォーマンス測定
- [ ] ベースラインレポート作成
- [ ] 改善優先度リスト作成

### Week 3-4: 改善実装 📅

- [ ] バンドルサイズ最適化
- [ ] レンダリング最適化
- [ ] アクセシビリティ改善
- [ ] SEO対応

### Week 5: CI/CD統合 📅

- [ ] GitHub Actions ワークフロー作成
- [ ] パフォーマンスバジェット設定
- [ ] 自動レグレッション検出

---

## 📚 参考リソース

### Flashlight

- [GitHub - bamlab/flashlight](https://github.com/bamlab/flashlight)
- [Flashlight Documentation](https://docs.flashlight.dev/)
- [React Native Performance Guide](https://reactnative.dev/docs/performance)

### Lighthouse

- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)

### Expo Performance

- [Expo Performance Optimization](https://docs.expo.dev/guides/analyzing-bundles/)
- [Expo Atlas](https://docs.expo.dev/guides/analyzing-bundles/)

---

**このドキュメントは実装の進捗に合わせて更新してください。**
