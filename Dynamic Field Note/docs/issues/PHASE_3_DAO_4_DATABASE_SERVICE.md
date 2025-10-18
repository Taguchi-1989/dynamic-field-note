# [Phase 3] DatabaseService強化 - トランザクション・マイグレーション

**作成日**: 2025-10-18
**ステータス**: 📅 未着手
**優先度**: P1
**担当**: Claude Code
**関連Phase**: Phase 3 - データ永続化・案件管理

---

## 📋 概要

DatabaseServiceにトランザクション管理機能とマイグレーション履歴管理を追加する。

---

## 🎯 目的

- トランザクション一貫性の保証
- マイグレーション履歴の管理
- エラーハンドリングの強化

---

## 📝 要件定義

### 新規機能

#### 1. transaction - トランザクション管理

```typescript
async transaction<T>(
  callback: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T>
```

#### 2. getMigrationVersion - バージョン取得

```typescript
async getMigrationVersion(): Promise<number>
```

#### 3. rollback - ロールバック機能

```typescript
async rollback(): Promise<void>
```

---

## 🧪 テストケース

```typescript
describe('DatabaseService - トランザクション', () => {
  test('transaction: 成功時はコミット', async () => {
    const result = await databaseService.transaction(async (db) => {
      // 複数の操作
      return 'success';
    });
    expect(result).toBe('success');
  });

  test('transaction: エラー時はロールバック', async () => {
    await expect(
      databaseService.transaction(async (db) => {
        // 操作1: 成功
        // 操作2: 失敗
        throw new Error('Test error');
      })
    ).rejects.toThrow('Test error');

    // 操作1もロールバックされていることを確認
  });
});
```

---

## ✅ 完了条件

- [ ] `src/services/__tests__/DatabaseService.test.ts` 作成
- [ ] `src/services/DatabaseService.ts` 強化
- [ ] トランザクション機能実装
- [ ] 全テスト合格
