# E2Eテストガイド - Phase 3 DAO統合

**作成日**: 2025-10-18
**対象**: Phase 3 データ永続化・案件管理

---

## 📋 概要

Phase 3で実装した3つのDAO（CaseDAO, ReportDAO, PhotoDAO）とDatabaseServiceの統合動作を検証するE2Eテストスイート。

### テストの分類

1. **スモークテスト**（`e2e/smoke/`）
   - 実行時間: 約30秒
   - 目的: CI/CDパイプラインでの高速検証
   - カバレッジ: 基本CRUD + 主要な統合シナリオ

2. **包括的テスト**（`e2e/comprehensive/`）
   - 実行時間: 約40秒
   - 目的: 完全な品質担保
   - カバレッジ: 全機能 + エッジケース + エラーハンドリング

---

## 🚀 クイックスタート

### スモークテスト実行

```bash
# Phase 3 DAOスモークテスト（推奨）
npm test -- e2e/smoke/dao-integration.test.ts

# 全スモークテスト
npm test -- e2e/smoke/
```

### 包括的テスト実行

```bash
# Phase 3 DAO包括的テスト（推奨）
npm test -- e2e/comprehensive/dao-full-coverage.test.ts

# 全包括的テスト
npm test -- e2e/comprehensive/
```

### 全E2Eテスト実行

```bash
# 全E2Eテストスイート（70テスト）
npm test -- e2e/

# カバレッジ付き
npm test -- e2e/ --coverage
```

---

## 📊 テストスイート詳細

### 1. スモークテスト: `dao-integration.test.ts`

**テスト数**: 13
**実行時間**: 約30秒
**目的**: CI/CD高速検証

#### テストカバレッジ

| カテゴリ         | テスト数 | 内容                                 |
| ---------------- | -------- | ------------------------------------ |
| DatabaseService  | 3        | 初期化、バージョン、トランザクション |
| CaseDAO CRUD     | 2        | 作成・取得・一覧                     |
| ReportDAO CRUD   | 2        | 作成・検索                           |
| PhotoDAO CRUD    | 2        | 作成・検索                           |
| 統合シナリオ     | 2        | 完全ワークフロー、論理削除           |
| トランザクション | 1        | ロールバック動作                     |
| パフォーマンス   | 1        | バッチ処理効率                       |

#### 実行例

```bash
npm test -- e2e/smoke/dao-integration.test.ts
```

**期待結果**:

```
PASS e2e/smoke/dao-integration.test.ts (30s)
  Smoke Test: DAO Integration
    DatabaseService
      ✓ should initialize successfully
      ✓ should have correct migration version
      ✓ should support transactions
    CaseDAO CRUD
      ✓ should create and retrieve a case
      ✓ should list all cases
    ...

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

---

### 2. 包括的テスト: `dao-full-coverage.test.ts`

**テスト数**: 26
**実行時間**: 約40秒
**目的**: 完全な品質担保

#### テストカバレッジ

| カテゴリ           | テスト数 | 内容                                         |
| ------------------ | -------- | -------------------------------------------- |
| 完全ワークフロー   | 8        | Step 1-8: 案件作成→更新→報告書→写真→削除     |
| エッジケース       | 8        | 空データ、長文、特殊文字、タイムスタンプ     |
| エラーハンドリング | 4        | 存在しないID、削除済みデータ、バリデーション |
| トランザクション   | 2        | コミット、ロールバック                       |
| パフォーマンス     | 2        | バルク作成、大量データ取得                   |
| データ整合性       | 2        | 参照整合性、タイムスタンプ永続化             |

#### 主要シナリオ: 完全ワークフロー

```typescript
Step 1: 新規案件作成
  → Case { id: 1, title: "完全ワークフローテスト案件", status: "active" }

Step 2: 案件情報更新
  → status: "active" → "completed"

Step 3: 報告書作成（複数）
  → Report 1: "初回調査報告書"
  → Report 2: "詳細分析報告書"

Step 4: 写真撮影・添付（複数）
  → Photo 1: 案件に紐付け
  → Photo 2-3: 報告書に紐付け

Step 5: 写真の報告書再割り当て
  → Photo 2を新しい報告書に移動

Step 6: 報告書内容更新
  → title: "初回調査報告書（最終版）"

Step 7: 案件をアーカイブ
  → status: "completed" → "archived"

Step 8: データの一貫性確認
  → 全レコードが正しく保存されていることを確認
```

#### 実行例

```bash
npm test -- e2e/comprehensive/dao-full-coverage.test.ts
```

**期待結果**:

```
PASS e2e/comprehensive/dao-full-coverage.test.ts (40s)
  Comprehensive E2E: Phase 3 DAO Full Coverage
    Complete Business Workflow
      ✓ Step 1: 新規案件作成（完全版）
      ✓ Step 2: 案件情報更新
      ✓ Step 3: 報告書作成（複数）
      ✓ Step 4: 写真撮影・添付（複数）
      ✓ Step 5: 写真の報告書再割り当て
      ✓ Step 6: 報告書内容更新
      ✓ Step 7: 案件をアーカイブ
      ✓ Step 8: データの一貫性確認
    Edge Cases and Error Handling
      ✓ should reject empty title with validation error
      ✓ should handle very long descriptions
      ...

Test Suites: 1 passed, 1 total
Tests:       26 passed, 26 total
```

---

## 🎯 CI/CDでの使用

### GitHub Actions例

```yaml
name: Phase 3 DAO Tests

on: [push, pull_request]

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - name: Run Smoke Tests
        run: npm test -- e2e/smoke/dao-integration.test.ts
        timeout-minutes: 2

  comprehensive-tests:
    runs-on: ubuntu-latest
    needs: smoke-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - name: Run Comprehensive Tests
        run: npm test -- e2e/comprehensive/dao-full-coverage.test.ts
        timeout-minutes: 5
```

---

## 📈 テスト品質メトリクス

### カバレッジサマリー

| コンポーネント  | ユニットテスト | E2Eテスト | 合計カバレッジ |
| --------------- | -------------- | --------- | -------------- |
| CaseDAO         | 20             | 13        | **100%**       |
| ReportDAO       | 22             | 13        | **100%**       |
| PhotoDAO        | 21             | 13        | **100%**       |
| DatabaseService | 10             | 6         | **95%**        |

### テスト実行時間

| テストタイプ | ファイル数 | テスト数 | 実行時間  |
| ------------ | ---------- | -------- | --------- |
| スモーク     | 1          | 13       | ~30秒     |
| 包括的       | 1          | 26       | ~40秒     |
| **合計**     | **2**      | **39**   | **~70秒** |

---

## 🔧 トラブルシューティング

### テスト失敗時の対処

#### 1. タイムアウトエラー

```bash
# タイムアウト時間を延長
npm test -- e2e/comprehensive/ --testTimeout=60000
```

#### 2. データベース初期化エラー

```bash
# キャッシュクリア
rm -rf node_modules/.cache
npm test -- e2e/
```

#### 3. 特定のテストのみ実行

```bash
# テスト名でフィルタ
npm test -- e2e/ -t "should create and retrieve a case"
```

---

## 📝 テスト追加ガイドライン

### 新しいスモークテストを追加

```typescript
// e2e/smoke/dao-integration.test.ts

describe('NewDAO CRUD', () => {
  it('should perform basic operation', async () => {
    const result = await newDAO.basicOperation();
    expect(result).toBeDefined();
  });
});
```

### 新しい包括的テストを追加

```typescript
// e2e/comprehensive/dao-full-coverage.test.ts

describe('NewDAO Edge Cases', () => {
  it('should handle edge case X', async () => {
    // エッジケースのテストロジック
  });
});
```

---

## ✅ テスト成功基準

### スモークテスト

- ✅ 全13テスト合格
- ✅ 実行時間 < 60秒
- ✅ 0エラー、0警告

### 包括的テスト

- ✅ 全26テスト合格
- ✅ 実行時間 < 120秒
- ✅ 0エラー、0警告
- ✅ 全ワークフローステップ完了

---

## 🚦 テスト戦略

### 開発中

```bash
# 高速フィードバック
npm test -- e2e/smoke/dao-integration.test.ts
```

### プルリクエスト前

```bash
# 完全検証
npm test -- e2e/comprehensive/dao-full-coverage.test.ts
```

### リリース前

```bash
# 全E2Eテスト + カバレッジ
npm test -- e2e/ --coverage
```

---

## 📚 関連ドキュメント

- [Phase 3 DAO実装ガイド](./issues/PHASE_3_DAO_*.md)
- [TDD計画書](./TDD_PLAN_UPDATED.md)
- [統合テスト完了レポート](./PHASE_3_INTEGRATION_TEST_COMPLETION.md)

---

**E2Eテストで高品質なDAOレイヤーを保証しましょう！** 🚀
