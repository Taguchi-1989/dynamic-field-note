# E2E Testing Guide

**プロジェクト**: Dynamic Field Note
**作成日**: 2025-10-18
**更新日**: 2025-10-18

---

## 📋 目次

1. [概要](#概要)
2. [テスト戦略](#テスト戦略)
3. [ローカルでのテスト実行](#ローカルでのテスト実行)
4. [CI/CD でのテスト実行](#cicd-でのテスト実行)
5. [テストの構成](#テストの構成)
6. [テストの書き方](#テストの書き方)
7. [トラブルシューティング](#トラブルシューティング)

---

## 概要

Dynamic Field Note では、E2E（End-to-End）テストを以下の 2 つのカテゴリに分けています：

1. **スモークテスト**: CI/CD で実行される最小限のテスト（実行時間: ~3 分）
2. **包括的テスト**: ローカル環境でデプロイ前に実行される完全なテスト（実行時間: ~10-15 分）

### テストフレームワーク

- **Jest**: テストランナー
- **React Native Testing Library**: コンポーネントテスト
- **TypeScript**: 型安全なテストコード

---

## テスト戦略

### スモークテスト（CI/CD 用）

**目的**: 重大な障害を早期に検出

**対象**:

- アプリの起動
- ホーム画面のレンダリング
- 基本的な UI 要素の存在確認

**実行タイミング**:

- PR 作成時
- main/develop ブランチへのプッシュ時
- 毎週月曜 9:00 JST（定期実行）

**実行時間**: ~3 分

### 包括的テスト（ローカル実行）

**目的**: デプロイ前の完全な動作保証

**対象**:

- 音声バッファフロー完全検証
- AI 状態インジケーター動作確認
- アクセシビリティ機能検証
- ナビゲーションフロー確認
- エラーハンドリング検証

**実行タイミング**:

- デプロイ前の最終チェック
- 大きな機能追加後
- リリース前

**実行時間**: ~10-15 分

---

## ローカルでのテスト実行

### 前提条件

```bash
# 依存関係のインストール
npm install --legacy-peer-deps
```

### 全テストの実行

```bash
# 全E2Eテストを実行（カバレッジ付き）
npm run test:local
```

### カテゴリ別実行

```bash
# スモークテストのみ実行
npm run test:smoke

# 包括的テストのみ実行
npm run test:comprehensive
```

### ウォッチモード

```bash
# 変更を監視して自動実行
npm run test:watch
```

### カバレッジレポート

```bash
# カバレッジレポートを生成
npm run test:coverage

# レポートを確認
# coverage/lcov-report/index.html をブラウザで開く
```

### デプロイ前チェックリスト

デプロイ前に以下を実行してください：

```bash
# 1. 静的解析
npm run validate

# 2. スモークテスト
npm run test:smoke

# 3. 包括的テスト（時間に余裕がある場合）
npm run test:comprehensive

# 4. すべて成功した場合のみデプロイ
```

---

## CI/CD でのテスト実行

### GitHub Actions ワークフロー

CI/CD では以下のジョブが自動実行されます：

```yaml
jobs:
  e2e-smoke-tests:
    runs-on: ubuntu-latest
    timeout: 15 分
    steps:
      - チェックアウト
      - Node.js セットアップ
      - 依存関係インストール
      - スモークテスト実行
      - テスト結果アップロード
```

### テスト結果の確認

1. GitHub の Pull Request ページを開く
2. "Checks" タブをクリック
3. "E2E Smoke Tests" ジョブを確認
4. 失敗した場合、ログを確認して原因を特定

### テスト結果アーティファクト

CI/CD で実行されたテスト結果は、以下からダウンロードできます：

- **保存期間**: 7 日間
- **内容**: カバレッジレポート、JUnit XML
- **ダウンロード方法**: GitHub Actions の "Artifacts" セクション

---

## テストの構成

### ディレクトリ構造

```
e2e/
├── smoke/                          # CI/CD用スモークテスト
│   ├── app-launch.test.tsx        # アプリ起動テスト
│   └── home-screen.test.tsx       # ホーム画面テスト
└── comprehensive/                  # ローカル用包括的テスト
    ├── voice-buffer-flow.test.tsx # 音声バッファフロー
    ├── ai-status-indicator.test.tsx # AI状態表示
    ├── accessibility.test.tsx     # アクセシビリティ
    └── navigation.test.tsx        # ナビゲーション
```

### Jest 設定

**jest.config.js**:

- `preset: 'react-native'`
- `testEnvironment: 'node'`
- TypeScript サポート（ts-jest）
- カバレッジ閾値: 70%

**jest.setup.js**:

- React Native Testing Library セットアップ
- Expo モジュールモック
- Gemini API モック
- Navigation モック

---

## テストの書き方

### スモークテストの例

```typescript
/**
 * Smoke Test: Home Screen
 * CI/CD: 重要なUI要素の存在確認
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';

describe('Smoke Test: Home Screen', () => {
  it('should render input field', () => {
    render(<HomeScreen />);
    const input = screen.getByPlaceholderText(/音声入力または手動でメモを入力してください/i);
    expect(input).toBeTruthy();
  });

  it('should render action buttons', () => {
    render(<HomeScreen />);
    const summarizeButton = screen.getByText('要約実行');
    const clearButton = screen.getByText('クリア');
    expect(summarizeButton).toBeTruthy();
    expect(clearButton).toBeTruthy();
  });
});
```

### 包括的テストの例

```typescript
/**
 * Comprehensive E2E Test: Voice Buffer Flow
 * Local execution only - 完全なユーザーワークフロー
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';

jest.setTimeout(30000); // 30秒タイムアウト

describe('Comprehensive E2E: Voice Buffer Flow', () => {
  it('should handle complete voice input workflow', async () => {
    render(<HomeScreen />);

    // Step 1: テキスト入力
    const input = screen.getByPlaceholderText(/音声入力または手動でメモを入力してください/i);
    fireEvent.changeText(input, '会議メモ: Phase 2完了しました。');

    // Step 2: バッファ情報の更新を確認
    await waitFor(() => {
      const bufferInfo = screen.getByText(/バッファ:/);
      expect(bufferInfo).toBeTruthy();
    });

    // Step 3: 要約ボタンをクリック
    const summarizeButton = screen.getByText('要約実行');
    fireEvent.press(summarizeButton);

    // Step 4: ローディング状態を確認
    await waitFor(() => {
      const loadingText = screen.getByText(/Gemini AIで要約中/i);
      expect(loadingText).toBeTruthy();
    });

    // Step 5: 完了を待機
    await waitFor(
      () => {
        const completionMessage = screen.queryByText(/完了しました/);
        expect(completionMessage).toBeTruthy();
      },
      { timeout: 15000 }
    );
  });
});
```

### ベストプラクティス

1. **テストは独立させる**
   - 各テストは他のテストに依存しない
   - `beforeEach` でモックをクリア

2. **適切なタイムアウトを設定**
   - スモークテスト: デフォルト（10 秒）
   - 包括的テスト: 30 秒

3. **ユーザーの視点でテスト**
   - `getByText`, `getByPlaceholderText` を使用
   - `data-testid` は最小限に

4. **非同期処理は `waitFor` を使用**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('完了')).toBeTruthy();
   });
   ```

---

## トラブルシューティング

### よくある問題

#### 1. "Cannot find module" エラー

```bash
# 依存関係を再インストール
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 2. "Timeout" エラー

```typescript
// タイムアウトを延長
jest.setTimeout(60000); // 60秒
```

#### 3. "Element not found" エラー

```typescript
// デバッグ用にDOMツリーを出力
const { debug } = render(<Component />);
debug();
```

#### 4. モックが効かない

```typescript
// jest.setup.js でモックが正しく設定されているか確認
jest.mock('./src/services/geminiService', () => ({
  summarizeText: jest.fn().mockResolvedValue({
    /* ... */
  }),
}));
```

### デバッグ方法

#### 1. 詳細ログを有効化

```bash
npm run test -- --verbose
```

#### 2. 特定のテストのみ実行

```bash
npm run test -- --testNamePattern="should render input field"
```

#### 3. ウォッチモードでデバッグ

```bash
npm run test:watch
# 'p' キーを押してファイル名でフィルタ
# 't' キーを押してテスト名でフィルタ
```

---

## テストカバレッジ目標

| カテゴリ           | 目標カバレッジ | 現在の状態 |
| ------------------ | -------------- | ---------- |
| 行カバレッジ       | 70%            | -          |
| 関数カバレッジ     | 70%            | -          |
| ブランチカバレッジ | 70%            | -          |
| 文カバレッジ       | 70%            | -          |

---

## 今後の改善

### Phase 3 での追加予定

1. **案件管理機能のテスト**
   - 案件の作成・編集・削除
   - 案件リストのフィルタリング
   - 案件詳細画面

2. **写真機能のテスト**
   - カメラ起動
   - 写真の撮影・保存
   - 注釈の追加

3. **エクスポート機能のテスト**
   - ZIP ファイル生成
   - ファイル共有

### Phase 4 での追加予定

1. **クラウド同期のテスト**
   - オフライン時の動作
   - 同期エラーハンドリング
   - 競合解決

---

## まとめ

✅ **CI/CD**: 最小限のスモークテストで高速フィードバック（~3 分）
✅ **ローカル**: デプロイ前に包括的テストで完全保証（~10-15 分）
✅ **カバレッジ**: 70%以上を目標に品質維持
✅ **自動化**: GitHub Actions で自動実行、手動介入不要

---

**次のステップ**: Phase 3 の実装を開始する前に、以下を確認してください：

1. `npm run test:local` が全てパス
2. `npm run validate` が全てパス
3. カバレッジが 70%以上

これらが確認できたら、Phase 3 に進んでください！ 🎉
