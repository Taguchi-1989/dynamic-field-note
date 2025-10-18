# [Phase 3] CaseDAO実装 - 案件CRUD操作（TDD）

**作成日**: 2025-10-18
**完了日**: 2025-10-18
**ステータス**: ✅ 完了
**優先度**: P0 (最優先)
**担当**: Claude Code
**関連Phase**: Phase 3 - データ永続化・案件管理

---

## 📋 概要

案件（Case）エンティティのCRUD操作を行うData Access Object（DAO）を、テスト駆動開発（TDD）アプローチで実装する。

---

## 🎯 目的

- SQLiteデータベースへの案件データの永続化
- 型安全なCRUD操作の提供
- トランザクション対応
- エラーハンドリングの統一

---

## 📝 要件定義

### 機能要件

#### 1. create - 案件作成

- 入力: `CreateCaseInput`
- 出力: 作成された `Case`
- バリデーション:
  - `title`: 必須、最大100文字
  - `client_name`: 任意、最大100文字
  - `location`: 任意、最大200文字
  - `description`: 任意、最大1000文字
  - `status`: デフォルト 'active'

#### 2. findById - ID検索

- 入力: `id: number`
- 出力: `Case | null`
- 論理削除されたレコードは返さない

#### 3. findAll - 全件取得

- 入力: なし
- 出力: `Case[]`
- 論理削除されたレコードは除外
- 作成日時降順でソート

#### 4. update - 案件更新

- 入力: `id: number`, `UpdateCaseInput`
- 出力: `void`
- 更新日時を自動更新
- 存在しないIDの場合はエラー

#### 5. delete - 論理削除

- 入力: `id: number`
- 出力: `void`
- `is_deleted = 1` に設定
- 更新日時を自動更新

### 非機能要件

- **型安全性**: TypeScript strict mode準拠
- **テストカバレッジ**: 100%
- **パフォーマンス**: 単一クエリで完結
- **エラーハンドリング**: 全エラーをキャッチして適切に処理

---

## 🧪 テストケース

### 正常系

```typescript
describe('CaseDAO - 正常系', () => {
  test('create: 案件を作成できる', async () => {
    const input: CreateCaseInput = {
      title: '現場調査A',
      client_name: '株式会社テスト',
      location: '東京都渋谷区',
      description: '設備点検',
      status: 'active',
    };
    const result = await caseDAO.create(input);

    expect(result.id).toBeGreaterThan(0);
    expect(result.title).toBe(input.title);
    expect(result.status).toBe('active');
    expect(result.is_deleted).toBe(0);
  });

  test('findById: IDで案件を取得できる', async () => {
    const created = await caseDAO.create({ title: 'テスト案件' });
    const found = await caseDAO.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.title).toBe('テスト案件');
  });

  test('findAll: 全案件を取得できる', async () => {
    await caseDAO.create({ title: '案件1' });
    await caseDAO.create({ title: '案件2' });

    const cases = await caseDAO.findAll();

    expect(cases.length).toBeGreaterThanOrEqual(2);
    expect(cases[0].created_at >= cases[1].created_at).toBe(true); // 降順
  });

  test('update: 案件を更新できる', async () => {
    const created = await caseDAO.create({ title: '更新前' });

    await caseDAO.update(created.id, {
      title: '更新後',
      status: 'completed',
    });

    const updated = await caseDAO.findById(created.id);
    expect(updated!.title).toBe('更新後');
    expect(updated!.status).toBe('completed');
    expect(updated!.updated_at > created.updated_at).toBe(true);
  });

  test('delete: 案件を論理削除できる', async () => {
    const created = await caseDAO.create({ title: '削除対象' });

    await caseDAO.delete(created.id);

    const deleted = await caseDAO.findById(created.id);
    expect(deleted).toBeNull(); // 論理削除されたので取得不可
  });
});
```

### 異常系

```typescript
describe('CaseDAO - 異常系', () => {
  test('create: タイトルが空の場合はエラー', async () => {
    await expect(caseDAO.create({ title: '' })).rejects.toThrow('Title is required');
  });

  test('findById: 存在しないIDの場合はnull', async () => {
    const result = await caseDAO.findById(99999);
    expect(result).toBeNull();
  });

  test('update: 存在しないIDの場合はエラー', async () => {
    await expect(caseDAO.update(99999, { title: '存在しない' })).rejects.toThrow('Case not found');
  });

  test('delete: 存在しないIDの場合はエラー', async () => {
    await expect(caseDAO.delete(99999)).rejects.toThrow('Case not found');
  });
});
```

### エッジケース

```typescript
describe('CaseDAO - エッジケース', () => {
  test('create: 最大長のタイトル', async () => {
    const longTitle = 'あ'.repeat(100);
    const result = await caseDAO.create({ title: longTitle });
    expect(result.title).toBe(longTitle);
  });

  test('create: NULL許容フィールドがnull', async () => {
    const result = await caseDAO.create({
      title: 'テスト',
      client_name: undefined,
      location: undefined,
    });
    expect(result.client_name).toBeNull();
    expect(result.location).toBeNull();
  });

  test('findAll: データが0件の場合は空配列', async () => {
    // 全削除
    const all = await caseDAO.findAll();
    for (const c of all) {
      await caseDAO.delete(c.id);
    }

    const result = await caseDAO.findAll();
    expect(result).toEqual([]);
  });
});
```

---

## 📂 ファイル構成

```
src/
├── services/
│   ├── CaseDAO.ts              (新規作成)
│   └── __tests__/
│       └── CaseDAO.test.ts     (新規作成)
└── types/
    └── case.ts                 (既存利用)
```

---

## ✅ 完了条件

- [x] `src/services/__tests__/CaseDAO.test.ts` 作成
- [ ] 全テストケース実装（正常系・異常系・エッジケース）
- [ ] `src/services/CaseDAO.ts` 実装
- [ ] 全テスト合格（100%カバレッジ）
- [ ] TypeScript strict mode: 0エラー
- [ ] ESLint: 0警告
- [ ] Prettier: 100%準拠
- [ ] `npm run guardrails` 合格

---

## 🚀 実装手順（TDD）

1. **Red**: CaseDAO.test.ts に最初のテストケース作成（失敗する）
2. **Green**: CaseDAO.ts に最小限の実装（テストが通る）
3. **Refactor**: コードを改善・整理
4. **Repeat**: 次のテストケースへ
5. **Final**: 全ガードレール確認

---

## 📖 参考

- [DatabaseService.ts](../../src/services/DatabaseService.ts)
- [case.ts型定義](../../src/types/case.ts)
- [Phase 3計画](../PHASE_3_4_REPORT_MANAGEMENT_PLAN.md)
