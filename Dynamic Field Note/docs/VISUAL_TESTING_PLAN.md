# ビジュアルテスティング計画 - Percy/Chromatic導入

**最終更新**: 2025-10-18

---

## 📋 概要

Dynamic Field Noteのビジュアルリグレッションテストとスクリーンショット管理のため、**Percy（Chromatic）**を導入します。

### 目的

1. **ビジュアルリグレッション検出** - UI変更の自動検出
2. **レビュー効率化** - PRでのビジュアルレビュー
3. **スクリーンショット管理** - 重要画面の記録
4. **ペルソナベーステスト** - 実際のユーザーシナリオ検証

---

## 👥 ペルソナ定義

### ペルソナ1: 現場調査員（田中さん、35歳）

**背景**:

- 建設会社の現場調査担当
- スマートフォン操作は得意
- 1日に5-10件の現場を訪問

**利用シーン**:

- 現場で音声メモを録音
- 写真を撮影して案件に添付
- 移動中に報告書を確認・編集

**重要な画面**:

- ✅ ホーム画面（音声録音）
- ✅ カメラ画面（写真撮影）
- ✅ 案件一覧画面
- ✅ 報告書作成画面

**期待する動作**:

- 片手で操作できる大きなボタン
- オフラインでも使える
- 素早く写真を撮影できる

---

### ペルソナ2: プロジェクトマネージャー（佐藤さん、45歳）

**背景**:

- 複数プロジェクトを管理
- PCとタブレットを併用
- 詳細な報告書レビューが必要

**利用シーン**:

- タブレットで案件一覧を確認
- 報告書の詳細レビュー
- AI要約機能で効率化

**重要な画面**:

- ✅ 案件一覧画面（ソート・フィルター）
- ✅ 報告書詳細画面（Markdown表示）
- ✅ 報告書一覧画面

**期待する動作**:

- 一覧性の高いリスト表示
- 検索・フィルター機能
- PDF/Markdownエクスポート

---

### ペルソナ3: 事務担当者（鈴木さん、28歳）

**背景**:

- オフィスでデータ管理
- PCで報告書を整理
- Web版を主に使用

**利用シーン**:

- 報告書をまとめてエクスポート
- データのバックアップ
- 月次レポート作成

**重要な画面**:

- ✅ 設定画面（データ管理）
- ✅ エクスポート画面
- ✅ 同期履歴画面（Phase 4）

**期待する動作**:

- データの一括操作
- エクスポート形式の選択
- 安全なデータ管理

---

## 🎨 Chromatic導入計画

### Phase 1: 基本セットアップ

#### インストール

```bash
npm install --save-dev chromatic @chromaui/test
```

#### 設定ファイル

```javascript
// chromatic.config.js
module.exports = {
  projectId: process.env.CHROMATIC_PROJECT_ID,
  buildScriptName: 'build-storybook',
  exitZeroOnChanges: true,
  exitOnceUploaded: true,
};
```

#### package.json追加

```json
{
  "scripts": {
    "chromatic": "chromatic --exit-zero-on-changes",
    "chromatic:ci": "chromatic --exit-once-uploaded"
  }
}
```

---

### Phase 2: Storybook統合

#### 重要コンポーネントのStory作成

```typescript
// src/screens/HomeScreen.stories.tsx
import { HomeScreen } from './HomeScreen';

export default {
  title: 'Screens/HomeScreen',
  component: HomeScreen,
  parameters: {
    chromatic: { viewports: [320, 768, 1200] },
  },
};

// ペルソナ1: 現場調査員（モバイル）
export const MobileView = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    chromatic: { viewports: [320] },
  },
};

// ペルソナ2: プロジェクトマネージャー（タブレット）
export const TabletView = {
  parameters: {
    viewport: { defaultViewport: 'tablet' },
    chromatic: { viewports: [768] },
  },
};

// ペルソナ3: 事務担当者（デスクトップ）
export const DesktopView = {
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    chromatic: { viewports: [1200] },
  },
};
```

---

### Phase 3: スクリーンショット戦略

#### 優先度の高い画面（必須）

| 画面名     | ペルソナ | ビューポート | 優先度 |
| ---------- | -------- | ------------ | ------ |
| ホーム画面 | 田中さん | 320px        | P0     |
| カメラ画面 | 田中さん | 320px        | P0     |
| 案件一覧   | 佐藤さん | 768px        | P0     |
| 報告書作成 | 田中さん | 320px        | P0     |
| 報告書詳細 | 佐藤さん | 768px        | P1     |
| 設定画面   | 鈴木さん | 1200px       | P1     |

#### 中程度の優先度（推奨）

| 画面名              | ペルソナ | ビューポート | 優先度 |
| ------------------- | -------- | ------------ | ------ |
| 報告書一覧          | 佐藤さん | 768px        | P2     |
| 案件作成モーダル    | 田中さん | 320px        | P2     |
| 同期履歴（Phase 4） | 鈴木さん | 1200px       | P2     |

---

### Phase 4: CI/CD統合

#### GitHub Actions設定例

```yaml
name: Chromatic

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: 'build-storybook'
          exitZeroOnChanges: true
```

---

## 📸 スクリーンショットテスト実装例

### HomeScreen.chromatic.test.ts

```typescript
import { test, expect } from '@chromaui/test';

test.describe('HomeScreen - ペルソナベーステスト', () => {
  test('ペルソナ1: 現場調査員 - モバイルビュー', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=screens-homescreen--mobile-view');

    // 音声録音ボタンが大きく表示されている
    const recordButton = page.locator('[data-testid="record-button"]');
    await expect(recordButton).toBeVisible();
    await expect(recordButton).toHaveCSS('min-height', '60px');

    // スクリーンショット取得
    await page.screenshot({
      path: 'screenshots/persona1-home-mobile.png',
    });
  });

  test('ペルソナ2: プロジェクトマネージャー - タブレットビュー', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=screens-homescreen--tablet-view');

    // 2カラムレイアウトになっている
    const mainContent = page.locator('[data-testid="main-content"]');
    await expect(mainContent).toHaveCSS('display', 'flex');

    // スクリーンショット取得
    await page.screenshot({
      path: 'screenshots/persona2-home-tablet.png',
    });
  });

  test('ペルソナ3: 事務担当者 - デスクトップビュー', async ({ page }) => {
    await page.goto('http://localhost:6006/iframe.html?id=screens-homescreen--desktop-view');

    // サイドバーが常に表示されている
    const sidebar = page.locator('[data-testid="sidebar"]');
    await expect(sidebar).toBeVisible();

    // スクリーンショット取得
    await page.screenshot({
      path: 'screenshots/persona3-home-desktop.png',
    });
  });
});
```

---

## 🎯 実装ロードマップ

### Week 1: セットアップ（Phase 1-2）

- [ ] Chromaticアカウント作成
- [ ] プロジェクト初期設定
- [ ] Storybook既存統合確認
- [ ] 主要画面のStory作成（3画面）

### Week 2: スクリーンショット戦略（Phase 3）

- [ ] P0画面のスクリーンショットテスト作成（4画面）
- [ ] ペルソナ別ビューポート設定
- [ ] スクリーンショット自動保存設定

### Week 3: CI/CD統合（Phase 4）

- [ ] GitHub Actions設定
- [ ] PR時の自動ビジュアルレビュー
- [ ] ベースライン設定
- [ ] チーム運用ルール策定

---

## 📊 成功指標

| 指標                           | 目標           | 測定方法            |
| ------------------------------ | -------------- | ------------------- |
| スクリーンショットカバレッジ   | P0画面 100%    | Chromatic Dashboard |
| ビジュアルリグレッション検出率 | > 95%          | PR承認前の検出数    |
| レビュー時間短縮               | -30%           | PR平均レビュー時間  |
| ペルソナカバレッジ             | 全ペルソナ対応 | テストケース数      |

---

## 🛠️ 技術スタック

### Chromatic関連

- **Chromatic** - ビジュアルリグレッションテスト
- **@chromaui/test** - Playwright統合
- **Storybook** - コンポーネントカタログ（既存）

### スクリーンショット保存

- **ローカル**: `screenshots/` ディレクトリ
- **Chromatic**: クラウドストレージ
- **Git LFS**: 大容量画像管理（検討中）

---

## 📝 運用ルール

### スクリーンショット更新時

1. ビジュアル変更の意図を明記
2. Before/After比較をPRに添付
3. 全ペルソナでの動作確認

### ベースライン承認

- メインブランチマージ時に自動更新
- 承認者: プロジェクトマネージャー以上

### レビュープロセス

1. Chromatic自動チェック
2. ビジュアル差分レビュー
3. ペルソナ別動作確認
4. 承認後マージ

---

## 📚 参考リンク

- [Chromatic公式ドキュメント](https://www.chromatic.com/docs/)
- [Storybook for React Native](https://storybook.js.org/docs/react-native/get-started/introduction)
- [Percy (別選択肢)](https://percy.io/)

---

## ✅ チェックリスト

### 導入前

- [ ] Chromaticアカウント作成
- [ ] プロジェクトトークン取得
- [ ] チーム体制確認

### 導入時

- [ ] パッケージインストール
- [ ] 設定ファイル作成
- [ ] 主要画面のStory作成
- [ ] スクリーンショットテスト実装

### 導入後

- [ ] CI/CD統合
- [ ] チームトレーニング
- [ ] 運用ルール共有
- [ ] ベースライン初期設定

---

**ビジュアル品質を自動化して、開発効率を向上させましょう！** 🎨
