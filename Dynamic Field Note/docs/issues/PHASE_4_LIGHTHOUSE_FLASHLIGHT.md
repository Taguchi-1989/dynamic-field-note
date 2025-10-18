# Phase 4: Lighthouse & Flashlight パフォーマンス測定 Issues

**作成日**: 2025-10-19
**フェーズ**: Phase 4 - パフォーマンス最適化
**目標**: 全項目で90点以上のスコア達成

---

## 📋 Issue 概要

Lighthouse（Web版）とFlashlight（React Native版）を導入し、パフォーマンス・アクセシビリティ・SEOなどの品質を測定。全項目90点以上を達成し、CI/CDパイプラインに統合する。

---

## 🎯 Issue #5: Flashlight セットアップ（Android）

### 優先度

**P0** - 必須実装

### 目的

React Native（Android）アプリのパフォーマンスを測定し、Lighthouse相当のスコアを取得する。

### 実装内容

#### 1. パッケージインストール

```bash
npm install --save-dev @perf-profiler/profiler
npm install --save-dev @perf-profiler/types
```

#### 2. 設定ファイル作成

**`flashlight.config.js`**

- 測定対象: Android（iOS追加予定）
- テストシナリオ: 4つ（App Launch, Case List, Voice Recording, AI Summary）
- パフォーマンス閾値: Score ≥ 90, FPS ≥ 55, CPU ≤ 30%, RAM ≤ 150MB

#### 3. npm スクリプト追加

```json
{
  "scripts": {
    "perf:flashlight": "flashlight test --config flashlight.config.js",
    "perf:flashlight:report": "flashlight report --open",
    "perf:android": "flashlight measure android"
  }
}
```

### 測定指標

| 指標                         | 目標値  | 重要度 |
| ---------------------------- | ------- | ------ |
| **総合パフォーマンススコア** | ≥ 90点  | P0     |
| **FPS (Frame Rate)**         | ≥ 55    | P0     |
| **CPU使用率**                | ≤ 30%   | P1     |
| **メモリ使用量**             | ≤ 150MB | P1     |
| **アプリ起動時間**           | ≤ 2.5秒 | P0     |
| **バンドルサイズ**           | ≤ 10MB  | P1     |

### 成功条件

- ✅ Flashlight が正常に動作
- ✅ Android でパフォーマンススコアが取得できる
- ✅ レポートが HTML 形式で出力される
- ✅ ベースラインスコアが記録される

### 実装ファイル

- `flashlight.config.js` (新規)
- `package.json` (更新)
- `docs/LIGHTHOUSE_FLASHLIGHT_PLAN.md` (ドキュメント)
- `performance-reports/baseline.json` (測定結果)

---

## 🎯 Issue #6: Lighthouse セットアップ（Expo Web）

### 優先度

**P0** - 必須実装

### 目的

Expo Web版のパフォーマンス・アクセシビリティ・SEOを測定し、Lighthouseスコア90点以上を達成する。

### 実装内容

#### 1. パッケージインストール

```bash
npm install --save-dev lighthouse
npm install --save-dev lighthouse-ci
```

#### 2. 設定ファイル作成

**`lighthouserc.js`**

- 測定対象: Expo Web (http://localhost:8080)
- 実行回数: 3回（平均値算出）
- プリセット: Desktop & Mobile

#### 3. npm スクリプト追加

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

### 測定指標

| カテゴリ           | 目標スコア | 重要度 | 主要指標                          |
| ------------------ | ---------- | ------ | --------------------------------- |
| **Performance**    | ≥ 90点     | P0     | FCP, LCP, TBT, CLS, Speed Index   |
| **Accessibility**  | ≥ 90点     | P0     | ARIA, contrast, keyboard nav      |
| **Best Practices** | ≥ 90点     | P1     | HTTPS, console errors, deprecated |
| **SEO**            | ≥ 90点     | P1     | Meta tags, structured data        |
| **PWA**            | ≥ 80点     | P2     | Service worker, manifest          |

### Core Web Vitals 目標

| 指標                               | 目標値  |
| ---------------------------------- | ------- |
| **FCP** (First Contentful Paint)   | ≤ 2.0秒 |
| **LCP** (Largest Contentful Paint) | ≤ 2.5秒 |
| **CLS** (Cumulative Layout Shift)  | ≤ 0.1   |
| **TBT** (Total Blocking Time)      | ≤ 300ms |

### 成功条件

- ✅ Lighthouse が正常に動作
- ✅ Expo Web でスコアが取得できる
- ✅ Performance ≥ 90点
- ✅ Accessibility ≥ 90点
- ✅ Best Practices ≥ 90点
- ✅ SEO ≥ 90点

### 実装ファイル

- `lighthouserc.js` (新規)
- `package.json` (更新)
- `.lighthouseci/report.html` (測定結果)

---

## 🎯 Issue #7: ベースライン測定と改善計画作成

### 優先度

**P0** - 必須実装

### 目的

現状のパフォーマンスを測定し、90点未満の項目に対する改善計画を策定する。

### 実装内容

#### 1. Flashlight ベースライン測定

```bash
# Android パフォーマンス測定
npm run perf:android

# レポート生成
npm run perf:flashlight:report
```

**測定シナリオ**:

1. **App Launch** - アプリ起動時間（10回平均）
2. **Case List Navigation** - 案件一覧の描画性能
3. **Voice Recording** - 音声録音のCPU/メモリ使用量
4. **AI Summary Generation** - AI要約時のパフォーマンス

#### 2. Lighthouse ベースライン測定

```bash
# Expo Web ビルド
npm run web

# Lighthouse実行（Mobile & Desktop）
npm run perf:lighthouse:mobile
npm run perf:lighthouse:desktop
```

#### 3. ベースラインレポート作成

**`docs/PERFORMANCE_BASELINE_REPORT.md`**

- 各指標の現在値
- 目標値との差分
- 改善優先度リスト（P0 / P1 / P2）
- 改善施策の詳細計画

### 成功条件

- ✅ Flashlight で4つのシナリオを測定完了
- ✅ Lighthouse で Mobile/Desktop を測定完了
- ✅ ベースラインレポートを作成
- ✅ 90点未満の項目がリストアップされている
- ✅ 各項目に対する改善施策が定義されている

### 期待される改善項目

**共通（優先度 P0）**:

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

**Expo Web（優先度 P0）**:

3. **Accessibility 90点達成**
   - ARIA属性の追加（accessibilityLabel, accessibilityRole）
   - カラーコントラスト比の改善（WCAG AA準拠）
   - キーボードナビゲーション対応
   - スクリーンリーダー対応

4. **SEO 90点達成**
   - Meta description の追加
   - Title タグの最適化
   - Viewport 設定
   - 構造化データの追加

### 実装ファイル

- `docs/PERFORMANCE_BASELINE_REPORT.md` (新規)
- `performance-reports/baseline-flashlight.json` (測定結果)
- `.lighthouseci/baseline-mobile.json` (測定結果)
- `.lighthouseci/baseline-desktop.json` (測定結果)

---

## 🎯 Issue #8: パフォーマンス改善実装（P0項目）

### 優先度

**P0** - 必須実装

### 目的

ベースライン測定で90点未満だった項目を改善し、全項目90点以上を達成する。

### 実装内容

#### 1. バンドルサイズ最適化

**Before**:

```typescript
import { Button, Card, List, Menu } from 'react-native-paper';
```

**After**:

```typescript
import Button from 'react-native-paper/lib/module/components/Button';
import Card from 'react-native-paper/lib/module/components/Card';
```

**施策**:

- Tree-shaking 対応のインポート
- `expo-image` で画像最適化
- WebP フォーマット採用
- 画像の遅延ロード

#### 2. レンダリング最適化

**Before**:

```typescript
function CaseList({ cases }) {
  return cases.map(c => <CaseCard key={c.id} case={c} />);
}
```

**After**:

```typescript
const CaseCardMemo = React.memo(CaseCard);

function CaseList({ cases }) {
  return (
    <FlatList
      data={cases}
      renderItem={({ item }) => <CaseCardMemo case={item} />}
      keyExtractor={(item) => item.id.toString()}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}
```

#### 3. Accessibility 改善

**Before**:

```typescript
<TouchableOpacity onPress={handlePress}>
  <Image source={icon} />
</TouchableOpacity>
```

**After**:

```typescript
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

**施策**:

- 全ての `TouchableOpacity` / `Pressable` に `accessibilityLabel` 追加
- 画像に `alt` 属性追加
- カラーコントラスト比 4.5:1以上に改善
- フォーカス可能な要素の明示化

#### 4. SEO対応

**`app.json` 更新**:

```json
{
  "expo": {
    "web": {
      "favicon": "./assets/favicon.png",
      "meta": {
        "title": "Dynamic Field Note - 現場調査アプリ",
        "description": "音声メモをAIで自動要約する現場調査・点検アプリケーション。現場での作業効率を大幅に向上させます。",
        "keywords": "現場調査,点検,音声メモ,AI要約,React Native,Expo",
        "author": "Dynamic Field Note Team",
        "viewport": "width=device-width, initial-scale=1, shrink-to-fit=no"
      },
      "lang": "ja"
    }
  }
}
```

### 成功条件

- ✅ JSバンドルサイズ ≤ 10MB
- ✅ FPS ≥ 55（Android）
- ✅ Lighthouse Performance ≥ 90
- ✅ Lighthouse Accessibility ≥ 90
- ✅ Lighthouse Best Practices ≥ 90
- ✅ Lighthouse SEO ≥ 90

### 実装ファイル

- `src/components/**/*.tsx` (Accessibility改善)
- `src/screens/**/*.tsx` (レンダリング最適化)
- `app.json` (SEO設定)
- `package.json` (Tree-shaking最適化)

---

## 🎯 Issue #9: CI/CD パフォーマンステスト統合

### 優先度

**P1** - 推奨実装

### 目的

GitHub Actions にパフォーマンステストを統合し、PRごとに自動測定とレグレッション検出を行う。

### 実装内容

#### 1. GitHub Actions ワークフロー作成

**`.github/workflows/performance.yml`**

**トリガー**:

- Pull Request (main ブランチ)
- Push (main ブランチ)

**ジョブ**:

1. **flashlight-android** - Android パフォーマンステスト
2. **lighthouse-web** - Expo Web パフォーマンステスト

**自動チェック**:

- パフォーマンススコア < 90 → ❌ Fail
- パフォーマンススコア ≥ 90 → ✅ Pass

#### 2. パフォーマンスバジェット設定

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

#### 3. PR コメント自動投稿

Lighthouse CI が PR にパフォーマンスレポートを自動投稿:

```
🚀 Lighthouse Performance Report

Performance: 92 ✅
Accessibility: 95 ✅
Best Practices: 88 ⚠️
SEO: 91 ✅

View full report: https://...
```

### 成功条件

- ✅ GitHub Actions ワークフローが動作
- ✅ PR ごとにパフォーマンステストが実行される
- ✅ スコア < 90 でビルドが失敗する
- ✅ Lighthouse レポートが PR にコメントされる
- ✅ Artifacts にレポートが保存される

### 実装ファイル

- `.github/workflows/performance.yml` (新規)
- `performance-budget.json` (新規)
- `scripts/check-performance-thresholds.js` (新規)

---

## 🎯 Issue #10: 定期パフォーマンス監視

### 優先度

**P2** - 将来実装

### 目的

毎週自動でパフォーマンス測定を行い、長期的なトレンドを監視する。

### 実装内容

#### 1. 週次パフォーマンステスト

**`.github/workflows/performance-weekly.yml`**

```yaml
on:
  schedule:
    - cron: '0 0 * * 1' # 毎週月曜 9:00 JST (0:00 UTC)
```

#### 2. トレンド可視化

- パフォーマンススコアの推移グラフ
- バンドルサイズの変化
- Core Web Vitals のトレンド

#### 3. アラート設定

- スコアが85点以下に低下 → Slack通知
- バンドルサイズが15MB超過 → GitHub Issue自動作成

### 成功条件

- ✅ 毎週月曜に自動実行される
- ✅ トレンドレポートが生成される
- ✅ 閾値超過時にアラートが発火する

### 実装ファイル

- `.github/workflows/performance-weekly.yml` (新規)
- `scripts/generate-performance-trend.js` (新規)

---

## 📊 総合成功指標

### Phase 4 完了条件

| 指標                         | 目標値 | ステータス |
| ---------------------------- | ------ | ---------- |
| Flashlight Performance Score | ≥ 90   | ⏳ 測定中  |
| Lighthouse Performance       | ≥ 90   | ⏳ 測定中  |
| Lighthouse Accessibility     | ≥ 90   | ⏳ 測定中  |
| Lighthouse Best Practices    | ≥ 90   | ⏳ 測定中  |
| Lighthouse SEO               | ≥ 90   | ⏳ 測定中  |
| FPS (Android)                | ≥ 55   | ⏳ 測定中  |
| アプリ起動時間               | ≤ 2.5s | ⏳ 測定中  |
| JSバンドルサイズ             | ≤ 10MB | ⏳ 測定中  |
| CI/CD統合                    | 完了   | ⏳ 未着手  |

### ドキュメント成果物

- ✅ `docs/LIGHTHOUSE_FLASHLIGHT_PLAN.md` - 導入計画書
- ⏳ `docs/PERFORMANCE_BASELINE_REPORT.md` - ベースライン測定結果
- ⏳ `performance-reports/` - Flashlight レポート
- ⏳ `.lighthouseci/` - Lighthouse レポート

### コード成果物

- ⏳ `flashlight.config.js` - Flashlight設定
- ⏳ `lighthouserc.js` - Lighthouse設定
- ⏳ `performance-budget.json` - パフォーマンスバジェット
- ⏳ `.github/workflows/performance.yml` - CI/CDワークフロー

---

## 🚀 実装スケジュール

| Week | Phase        | Issue # | 内容                                 |
| ---- | ------------ | ------- | ------------------------------------ |
| 1    | セットアップ | #5, #6  | Flashlight & Lighthouse インストール |
| 2    | ベースライン | #7      | 測定 + 改善計画作成                  |
| 3-4  | 改善実装     | #8      | P0項目の改善                         |
| 5    | CI/CD統合    | #9      | GitHub Actions ワークフロー          |
| 継続 | 定期監視     | #10     | 週次測定 + トレンド分析              |

---

## 📚 関連ドキュメント

- [LIGHTHOUSE_FLASHLIGHT_PLAN.md](../LIGHTHOUSE_FLASHLIGHT_PLAN.md) - 詳細な導入計画
- [TESTING_GUIDE.md](../TESTING_GUIDE.md) - テスト実行ガイド
- [VISUAL_TESTING_PLAN.md](../VISUAL_TESTING_PLAN.md) - ビジュアルテスト計画
- [PERSONAS.md](../PERSONAS.md) - ペルソナ定義

---

**Phase 4完了により、パフォーマンス・アクセシビリティ・SEOの全項目で90点以上を達成します！** 🚀
