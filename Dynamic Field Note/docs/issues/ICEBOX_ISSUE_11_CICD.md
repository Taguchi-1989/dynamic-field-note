# [ICEBOX] Issue #11: Lighthouse CI/CD統合

**ステータス**: 🧊 Icebox（後回し）
**理由**: プロジェクトがまだ完璧ではないため、CI/CDは後回しにする
**再検討タイミング**: Phase 5（本番デプロイ準備）または安定版リリース後

---

## 📋 Issue概要

**タイトル**: Lighthouse CI/CD統合
**優先度**: ~~P0~~ → Icebox
**工数見積**: 3時間
**担当者**: TBD
**ラベル**: `enhancement`, `ci-cd`, `performance`, `automation`, `icebox`

---

## 🎯 目的

Lighthouse測定をGitHub Actionsに統合し、コミット/PR時に自動測定。パフォーマンス退行を自動検出し、品質を維持する。

---

## 🧊 Icebox理由

### なぜ後回しにするのか

1. **プロジェクトが完璧ではない**
   - Performance 78/100（目標90点未達）
   - まだ最適化の余地がある
   - ベースラインが確定していない

2. **頻繁な変更が予想される**
   - Phase 4の最適化作業が続く
   - CI/CDで毎回測定すると開発速度が低下
   - 閾値の調整が頻繁に必要

3. **手動測定で十分**
   - 現段階では手動測定で品質管理可能
   - Issue #12（監視ダッシュボード）で可視化済み

### いつ実施すべきか

- ✅ Performance 90点以上達成後
- ✅ Phase 4の最適化完了後
- ✅ ベースラインが安定した後
- ✅ Phase 5（本番デプロイ準備）開始時

---

## 🔧 実装内容（後日実施）

### タスク1: GitHub Actions ワークフロー作成

**ファイル**: `.github/workflows/lighthouse-ci.yml` (将来実装)

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

      - name: Comment PR
        uses: actions/github-script@v7
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('.lighthouseci/manifest.json'));
            const comment = `
            ## 📊 Lighthouse Results

            - Performance: ${report.performance}
            - Accessibility: ${report.accessibility}
            - Best Practices: ${report.bestPractices}
            - SEO: ${report.seo}
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

---

### タスク2: Lighthouse CI 設定更新

**ファイル**: `lighthouserc.js` (既存ファイル、将来更新)

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
        // 現実的な閾値（Performance 90点達成後に厳格化）
        'categories:performance': ['warn', { minScore: 0.85 }], // 85点以上で警告
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // GitHub Actionsで利用
    },
  },
};
```

---

### タスク3: npm スクリプト更新

**ファイル**: `package.json` (将来更新)

```json
{
  "scripts": {
    "perf:lighthouse": "lhci autorun",
    "perf:lighthouse:ci": "npm run build:web && lhci autorun",
    "build:web": "npx expo export:web"
  }
}
```

---

## ✅ 成功条件（将来実装時）

- ✅ GitHub Actions でLighthouse測定が自動実行される
- ✅ PR時にLighthouseレポートがコメントされる
- ✅ パフォーマンス退行時にCI/CDが警告を出す
- ✅ Lighthouse結果がArtifactとして保存される
- ✅ Performance 85点未満でCI/CDが失敗する

---

## 📊 測定指標（将来実装時）

| 指標               | 警告閾値 | エラー閾値 | 現在値 |
| ------------------ | -------- | ---------- | ------ |
| **Performance**    | <85      | -          | 78     |
| **Accessibility**  | -        | <90        | 94     |
| **Best Practices** | -        | <90        | 100    |
| **SEO**            | -        | <90        | 92     |
| **FCP**            | >2.0s    | -          | 0.29s  |
| **LCP**            | >2.5s    | -          | 2.35s  |

---

## 🔄 実装手順（将来実施）

### Step 1: Performance 90点達成を待つ

```bash
# Issue #13 完了後
# Performance: 90/100以上
```

### Step 2: ベースライン確定

```bash
# 3回測定して平均を取る
npm run perf:lighthouse:desktop
npm run perf:lighthouse:desktop
npm run perf:lighthouse:desktop
```

### Step 3: GitHub Actions設定

```bash
# 1. ワークフローファイル作成
mkdir -p .github/workflows
touch .github/workflows/lighthouse-ci.yml

# 2. lighthouserc.js 更新（閾値を厳格化）
# Performance: 85点以上

# 3. GitHub Secretsに設定
# LHCI_GITHUB_APP_TOKEN
```

### Step 4: テスト実行

```bash
# 1. PRを作成してテスト
git checkout -b test/lighthouse-ci
git commit --allow-empty -m "test: Lighthouse CI"
git push origin test/lighthouse-ci

# 2. GitHub ActionsでLighthouse実行確認
# 3. PR コメントが投稿されることを確認
```

---

## 📝 Icebox解除条件

以下の条件を **すべて** 満たした時点でIceboxから復活：

1. ✅ **Performance 90点以上達成**
   - 現在: 78点
   - 目標: 90点以上

2. ✅ **Issue #13 完了**
   - Phase 1~4の最適化完了
   - ベースラインが安定

3. ✅ **手動測定で3回連続90点以上**
   - スコアの安定性確認
   - 閾値の妥当性確認

4. ✅ **Phase 5開始**
   - 本番デプロイ準備フェーズ
   - 品質保証の強化が必要

---

## 🎯 代替アプローチ（現時点）

CI/CD統合の代わりに、以下で品質管理：

### 1. 手動測定（Issue #12で実装済み）

```bash
# Lighthouse測定
npm run perf:lighthouse:desktop

# バッジ更新
npm run perf:update-badges

# 履歴記録
node scripts/update-performance-history.js "Phase X完了"
```

### 2. プルリクエストチェックリスト

PR作成時に手動チェック：

```markdown
## Performance チェックリスト

- [ ] Lighthouse測定実施（Desktop）
- [ ] Performance ≥ 85点
- [ ] Core Web Vitals 全項目達成
- [ ] バッジ更新済み
- [ ] 履歴記録済み
```

### 3. 定期測定（週次）

```bash
# 毎週金曜日に測定
npm run perf:lighthouse:desktop
npm run perf:update-badges
git commit -m "chore: Weekly performance measurement"
```

---

## 📚 参考リンク

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [GitHub Actions - Lighthouse CI Action](https://github.com/treosh/lighthouse-ci-action)
- [Lighthouse CI Server](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/server.md)

---

**作成日**: 2025-10-19
**Icebox移行日**: 2025-10-19
**再検討予定**: Phase 5開始時またはPerformance 90点達成後
