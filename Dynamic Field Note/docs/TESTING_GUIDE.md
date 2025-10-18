# テスティングガイド

**最終更新**: 2025-10-18

---

## 📋 テスト戦略概要

Dynamic Field Noteは**3層のテスト戦略**を採用しています：

1. **品質チェック（Quality）** - 静的解析・フォーマット
2. **スモークテスト（Smoke）** - 高速な基本動作確認（17テスト, ~18秒）
3. **包括的テスト（Comprehensive）** - 完全な品質保証（53テスト, ~40秒）

---

## 🚀 クイックスタート

### 基本的なワークフロー

```bash
# 1. コーディング前の品質チェック
npm run quality

# 2. コード実装

# 3. スモークテスト（高速検証）
npm run test:smoke

# 4. 包括的テスト（完全検証）
npm run test:comprehensive

# 5. コミット前チェック
npm run guardrails
```

---

## 📊 テストコマンド一覧

### 品質チェック（Prettier + ESLint + TypeScript）

| コマンド               | 説明                                       | 実行時間 |
| ---------------------- | ------------------------------------------ | -------- |
| `npm run quality`      | 品質チェック（format + lint + type-check） | ~10秒    |
| `npm run quality:fix`  | 自動修正 + 品質チェック                    | ~15秒    |
| `npm run format:check` | Prettierフォーマット確認                   | ~5秒     |
| `npm run format`       | Prettierフォーマット自動修正               | ~10秒    |
| `npm run lint`         | ESLint静的解析                             | ~5秒     |
| `npm run lint:fix`     | ESLint自動修正                             | ~8秒     |
| `npm run type-check`   | TypeScript型チェック                       | ~5秒     |

### テスト実行

| コマンド                     | 説明                             | テスト数 | 実行時間 |
| ---------------------------- | -------------------------------- | -------- | -------- |
| `npm run test:smoke`         | スモークテスト（基本動作確認）   | 17       | ~18秒    |
| `npm run test:comprehensive` | 包括的テスト（完全検証）         | 53       | ~40秒    |
| `npm run test:e2e`           | E2E全体（smoke → comprehensive） | 70       | ~58秒    |
| `npm run test:all`           | 全テスト（E2E + ユニット）       | 143      | ~120秒   |
| `npm run test`               | Jestデフォルト（全テスト）       | 143      | ~120秒   |
| `npm run test:watch`         | ウォッチモード                   | -        | 常駐     |
| `npm run test:coverage`      | カバレッジレポート付き           | 143      | ~150秒   |

### ガードレール（CI/CD用）

| コマンド                  | 説明               | 内容              |
| ------------------------- | ------------------ | ----------------- |
| `npm run guardrails`      | 高速ガードレール   | quality + smoke   |
| `npm run guardrails:full` | 完全ガードレール   | quality + E2E全体 |
| `npm run precommit`       | コミット前チェック | quality + smoke   |

---

## 🧪 テストスイート詳細

### スモークテスト（17テスト, ~18秒）

**目的**: CI/CDパイプラインでの高速検証

**内容**:

- `e2e/smoke/dao-integration.test.ts` (13テスト)
  - DatabaseService初期化
  - CaseDAO CRUD
  - ReportDAO CRUD
  - PhotoDAO CRUD
  - 統合シナリオ
  - トランザクション
  - パフォーマンス

- `e2e/smoke/services.test.ts` (4テスト)
  - サービス層基本動作

**実行例**:

```bash
npm run test:smoke
```

**出力例**:

```
PASS e2e/smoke/dao-integration.test.ts (18s)
PASS e2e/smoke/services.test.ts (18s)

Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
Time:        18.024 s
```

---

### 包括的テスト（53テスト, ~40秒）

**目的**: 完全な品質保証・リリース前検証

**内容**:

- `e2e/comprehensive/dao-full-coverage.test.ts` (26テスト)
  - 完全ワークフロー（8ステップ）
  - エッジケース（長文、特殊文字、タイムスタンプ）
  - エラーハンドリング
  - トランザクション整合性
  - パフォーマンス（バルク処理、大量取得）
  - データ整合性

- `e2e/comprehensive/report-management.test.ts` (19テスト)
  - 報告書管理機能

- `e2e/comprehensive/contexts.test.ts` (4テスト)
  - React Context

- `e2e/comprehensive/hooks.test.ts` (4テスト)
  - カスタムフック

**実行例**:

```bash
npm run test:comprehensive
```

**出力例**:

```
PASS e2e/comprehensive/dao-full-coverage.test.ts (40s)
PASS e2e/comprehensive/report-management.test.ts (40s)
PASS e2e/comprehensive/contexts.test.ts (25s)
PASS e2e/comprehensive/hooks.test.ts (25s)

Test Suites: 4 passed, 4 total
Tests:       53 passed, 53 total
Time:        40.147 s
```

---

## 🔄 推奨ワークフロー

### 開発中（Feature開発）

```bash
# 1. コーディング前
npm run quality

# 2. 実装

# 3. 高速検証
npm run test:smoke

# 4. 問題なければコミット
git add .
git commit -m "feat: 新機能実装"
```

### コミット前（必須）

```bash
# コミット前ガードレール
npm run guardrails

# 全てパスしたらコミット
git commit
```

### リリース前（完全検証）

```bash
# 完全ガードレール
npm run guardrails:full

# または
npm run quality && npm run test:e2e

# 全てパスしたらリリース
```

---

## 📈 カバレッジ目標

| コンポーネント | 目標     | 現状       | ステータス |
| -------------- | -------- | ---------- | ---------- |
| DAO層          | > 90%    | **95-96%** | ✅ 達成    |
| サービス層     | > 80%    | **85%**    | ✅ 達成    |
| ユニットテスト | > 70%    | **73%**    | ✅ 達成    |
| E2Eテスト      | 100%パス | **100%**   | ✅ 達成    |

---

## 🛠️ 設定ファイル

### Prettier (`.prettierrc`)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "auto"
}
```

### ESLint

- **設定**: `package.json` の `eslintConfig`
- **無視**: `.eslintignore`

### TypeScript (`tsconfig.json`)

- **strictモード**: 有効
- **noEmit**: true（型チェックのみ）

### Jest (`jest.config.js`)

- **testEnvironment**: node
- **testMatch**: `**/__tests__/**/*.test.ts`, `**/e2e/**/*.test.ts`

---

## 🐛 トラブルシューティング

### 問題: テストが遅い

```bash
# 並列実行数を調整
npm test -- --maxWorkers=4

# スモークテストのみ実行
npm run test:smoke
```

### 問題: カバレッジレポートが必要

```bash
# カバレッジ付きで実行
npm run test:coverage

# レポート確認
open coverage/lcov-report/index.html
```

### 問題: 特定のテストのみ実行したい

```bash
# ファイル指定
npm test -- src/services/__tests__/CaseDAO.test.ts

# パターン指定
npm test -- --testNamePattern="CaseDAO"

# ウォッチモード
npm run test:watch
```

### 問題: TypeScriptエラーが消えない

```bash
# node_modules削除して再インストール
rm -rf node_modules
npm install

# TypeScriptキャッシュクリア
rm -rf node_modules/.cache
npm run type-check
```

---

## 📚 関連ドキュメント

- [E2E_TEST_GUIDE.md](./E2E_TEST_GUIDE.md) - E2Eテスト詳細ガイド
- [TDD_PLAN_UPDATED.md](./TDD_PLAN_UPDATED.md) - TDD計画書
- [PHASE_3_DAO_COMPLETION_REPORT.md](./PHASE_3_DAO_COMPLETION_REPORT.md) - DAO実装完了レポート

---

## ✅ チェックリスト

### コミット前

- [ ] `npm run quality` がパス
- [ ] `npm run test:smoke` がパス
- [ ] 変更内容をコミットメッセージに記載

### プルリクエスト作成時

- [ ] `npm run guardrails:full` がパス
- [ ] カバレッジが低下していない
- [ ] 新機能にテストを追加

### リリース前

- [ ] `npm run test:e2e` がパス
- [ ] `npm run test:coverage` で95%以上
- [ ] 全ドキュメントが最新

---

**テスト品質を維持して、安心してリリースしましょう！** 🚀
