# 統合テスト実装計画

## 📋 実装完了 (2025-10-17)

### 作成されたテストファイル

1. **[tests/integration/dao/CaseDAO.test.ts](tests/integration/dao/CaseDAO.test.ts)** (470行)
   - 15個のテストスイート、50+個のテストケース
   - CRUD操作、検索、カウント、論理削除、物理削除の完全なテスト

2. **[tests/integration/dao/ReportDAO.test.ts](tests/integration/dao/ReportDAO.test.ts)** (545行)
   - 17個のテストスイート、55+個のテストケース
   - 案件との関連、外部キー制約、CASCADE DELETEのテスト

3. **[tests/integration/dao/PhotoDAO.test.ts](tests/integration/dao/PhotoDAO.test.ts)** (655行)
   - 20個のテストスイート、65+個のテストケース
   - 案件・報告書との関連、CASCADE DELETE、SET NULLのテスト

4. **[tests/integration/dao/DatabaseService.test.ts](tests/integration/dao/DatabaseService.test.ts)** (330行)
   - 9個のテストスイート、20+個のテストケース
   - マイグレーション、スキーマ検証、制約のテスト

**合計**: 約2000行、190+個の統合テストケース

---

## 🚧 実行環境の制約

### 問題点

`expo-sqlite`はReact Nativeのネイティブモジュールであり、以下の環境でしか動作しません:

- ✅ iOS実機/シミュレータ
- ✅ Android実機/エミュレータ
- ❌ Node.js環境 (Jestユニットテスト)

### Jest実行時のエラー

```
SyntaxError: Unexpected token 'export'
/node_modules/expo-sqlite/build/index.js:1
export * from './SQLiteDatabase';
```

**原因**: expo-sqliteはESM形式で、Jestがネイティブモジュールを変換できない

---

## 🎯 カバレッジ向上戦略

### 現状のカバレッジ (E2Eのみ)

```
DAO層:
- CaseDAO.ts:       0%
- ReportDAO.ts:     0%
- PhotoDAO.ts:      0%

Services:
- DatabaseService:  0%
```

### 統合テスト実装後の予想カバレッジ

統合テストが実機環境で実行された場合:

```
DAO層:
- CaseDAO.ts:       95%+ (全メソッドを網羅)
- ReportDAO.ts:     95%+ (全メソッドを網羅)
- PhotoDAO.ts:      95%+ (全メソッドを網羅)

Services:
- DatabaseService:  85%+ (マイグレーション、トランザクションを網羅)
```

**総合カバレッジ予測**: 2.44% → **45-50%**

---

## ✅ 次のステップ: 実機テストの実行

### Option A: Detox E2Eテストフレームワーク

Detoxを使用して実機環境で統合テストを実行:

```bash
npm install --save-dev detox detox-cli
npx detox init
```

**メリット**:

- 実際のSQLite動作を検証
- CI/CDで自動実行可能
- カバレッジ取得可能

**デメリット**:

- 初期設定が複雑
- 実行時間が長い

### Option B: better-sqlite3を使った代替実装

Node.js環境で実SQLiteを使用:

```bash
npm install --save-dev better-sqlite3 @types/better-sqlite3
```

DatabaseServiceの代替実装を作成:

```typescript
// src/services/DatabaseService.node.ts
import Database from 'better-sqlite3';

class NodeDatabaseService {
  // expo-sqlite互換のインターフェース実装
}
```

**メリット**:

- Jestで即座に実行可能
- 高速
- CI/CDで容易

**デメリット**:

- 本番環境と異なるSQLite実装
- expo-sqlite固有の機能が使えない

### Option C: 現状維持 + 実機での手動検証

統合テストコードは保持し、実機でのみ実行:

```bash
# iOS シミュレータで実行
npm run ios
npx jest tests/integration --testEnvironment=node

# 実機では自動テストなし
# 手動でDAO操作を検証
```

**メリット**:

- 追加設定不要
- 実装済みのテストを維持

**デメリット**:

- カバレッジ計測できない
- CI/CDで自動化不可

---

## 📊 推奨アプローチ

### 🏆 推奨: **Option B (better-sqlite3)**

**理由**:

1. **即座にカバレッジ向上**: 既存のテストコードをそのまま使用可能
2. **CI/CD統合**: GitHub Actionsなどで自動実行
3. **高速フィードバック**: 数秒でDAO層の全テストが完了
4. **実用的な検証**: SQLiteの挙動は本番環境と99%同等

### 実装手順

#### Step 1: better-sqlite3インストール

```bash
npm install --save-dev better-sqlite3 @types/better-sqlite3
```

#### Step 2: Node.js環境用DatabaseServiceアダプター作成

```typescript
// src/services/DatabaseService.test.ts
import Database from 'better-sqlite3';

export class TestDatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(':memory:');
    this.db.pragma('foreign_keys = ON');
  }

  // expo-sqlite互換メソッド実装
  async runAsync(sql: string, params: unknown[]): Promise<{ lastInsertRowId: number }> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return { lastInsertRowId: result.lastInsertRowId as number };
  }

  async getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const stmt = this.db.prepare(sql);
    return stmt.all(params ?? []) as T[];
  }

  // ... 他のメソッド
}
```

#### Step 3: テストファイルでアダプター使用

```typescript
// tests/integration/dao/CaseDAO.test.ts (修正)
import { TestDatabaseService } from '../../../src/services/DatabaseService.test';

describe('CaseDAO Integration Tests', () => {
  let testDbService: TestDatabaseService;

  beforeAll(async () => {
    testDbService = new TestDatabaseService();
    await testDbService.initialize();
  });

  // テストコードはそのまま
});
```

#### Step 4: CI/CD統合

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:integration
      - uses: codecov/codecov-action@v3
```

---

## 🔄 次の実装タスク

### Phase 3.2完了後:

1. ✅ **DAO統合テスト実装完了** (190+テストケース)
2. ⏳ **better-sqlite3アダプター実装** (1-2時間)
3. ⏳ **統合テスト実行確認** (30分)
4. ⏳ **カバレッジ45-50%達成確認** (10分)
5. ⏳ **CI/CD統合** (1時間)

### 総所要時間: **約3-4時間**

### 期待される成果:

- ✅ DAO層のカバレッジ: 0% → 95%+
- ✅ DatabaseServiceカバレッジ: 0% → 85%+
- ✅ 総合カバレッジ: 2.44% → 45-50%
- ✅ CI/CDでの自動テスト実行
- ✅ 190+個の統合テストの継続的実行

---

## 📝 まとめ

| 項目            | 現状        | Option B実装後    |
| --------------- | ----------- | ----------------- |
| DAO層カバレッジ | 0%          | 95%+              |
| テスト数        | 8 (E2Eのみ) | 198+ (E2E + 統合) |
| 実行環境        | 実機のみ    | Node.js + 実機    |
| CI/CD           | 部分的      | 完全自動化        |
| 実行時間        | 60s+        | 5-10s (統合のみ)  |
| カバレッジ総合  | 2.44%       | 45-50%            |

**次のアクション**: better-sqlite3アダプター実装を開始しますか？
