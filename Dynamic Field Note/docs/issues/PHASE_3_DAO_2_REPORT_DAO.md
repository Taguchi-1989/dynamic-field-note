# [Phase 3] ReportDAO実装 - 報告書CRUD操作（TDD）

**作成日**: 2025-10-18
**完了日**: 2025-10-18
**ステータス**: ✅ 完了
**優先度**: P0 (最優先)
**担当**: Claude Code
**関連Phase**: Phase 3 - データ永続化・案件管理
**依存**: PHASE_3_DAO_1_CASE_DAO

---

## 📋 概要

報告書（Report）エンティティのCRUD操作を行うData Access Object（DAO）を、テスト駆動開発（TDD）アプローチで実装する。

---

## 🎯 目的

- SQLiteデータベースへの報告書データの永続化
- 案件との紐付け管理
- 型安全なCRUD操作の提供
- Markdown content の保存・取得

---

## 📝 要件定義

### 機能要件

#### 1. create - 報告書作成

- 入力: `CreateReportInput`
- 出力: 作成された `Report`
- バリデーション:
  - `case_id`: 必須、存在する案件IDであること
  - `title`: 必須、最大100文字
  - `content`: 任意、Markdown形式
  - `voice_buffer`: 任意
  - `summary_json`: 任意、JSON形式

#### 2. findById - ID検索

- 入力: `id: number`
- 出力: `Report | null`
- 論理削除されたレコードは返さない

#### 3. findByCaseId - 案件別検索

- 入力: `caseId: number`
- 出力: `Report[]`
- 指定案件に紐付く全報告書を取得
- 論理削除されたレコードは除外
- 更新日時降順でソート

#### 4. update - 報告書更新

- 入力: `id: number`, `UpdateReportInput`
- 出力: `void`
- 更新日時を自動更新
- 存在しないIDの場合はエラー

#### 5. delete - 論理削除

- 入力: `id: number`
- 出力: `void`
- `is_deleted = 1` に設定

### 非機能要件

- **型安全性**: TypeScript strict mode準拠
- **テストカバレッジ**: 100%
- **外部キー制約**: case_id の妥当性確認

---

## 🧪 テストケース

### 正常系

```typescript
describe('ReportDAO - 正常系', () => {
  test('create: 報告書を作成できる', async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });

    const input: CreateReportInput = {
      case_id: testCase.id,
      title: '点検報告書',
      content: '# 点検結果\n\n異常なし',
      voice_buffer: '音声テキスト',
      summary_json: '{"result": "OK"}',
    };
    const result = await reportDAO.create(input);

    expect(result.id).toBeGreaterThan(0);
    expect(result.case_id).toBe(testCase.id);
    expect(result.title).toBe(input.title);
    expect(result.is_deleted).toBe(0);
  });

  test('findById: IDで報告書を取得できる', async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    const created = await reportDAO.create({
      case_id: testCase.id,
      title: 'テスト報告書',
    });

    const found = await reportDAO.findById(created.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.case_id).toBe(testCase.id);
  });

  test('findByCaseId: 案件別に報告書を取得できる', async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    await reportDAO.create({ case_id: testCase.id, title: '報告書1' });
    await reportDAO.create({ case_id: testCase.id, title: '報告書2' });

    const reports = await reportDAO.findByCaseId(testCase.id);

    expect(reports.length).toBe(2);
    expect(reports[0].case_id).toBe(testCase.id);
    expect(reports[1].case_id).toBe(testCase.id);
    // 更新日時降順
    expect(reports[0].updated_at >= reports[1].updated_at).toBe(true);
  });

  test('update: 報告書を更新できる', async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    const created = await reportDAO.create({
      case_id: testCase.id,
      title: '更新前',
    });

    await reportDAO.update(created.id, {
      title: '更新後',
      content: '# 更新されたコンテンツ',
    });

    const updated = await reportDAO.findById(created.id);
    expect(updated!.title).toBe('更新後');
    expect(updated!.content).toBe('# 更新されたコンテンツ');
  });

  test('delete: 報告書を論理削除できる', async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    const created = await reportDAO.create({
      case_id: testCase.id,
      title: '削除対象',
    });

    await reportDAO.delete(created.id);

    const deleted = await reportDAO.findById(created.id);
    expect(deleted).toBeNull();
  });
});
```

### 異常系

```typescript
describe('ReportDAO - 異常系', () => {
  test('create: 存在しないcase_idの場合はエラー', async () => {
    await expect(reportDAO.create({ case_id: 99999, title: 'テスト' })).rejects.toThrow(
      'Case not found'
    );
  });

  test('findByCaseId: 存在しないcase_idの場合は空配列', async () => {
    const reports = await reportDAO.findByCaseId(99999);
    expect(reports).toEqual([]);
  });

  test('update: 存在しないIDの場合はエラー', async () => {
    await expect(reportDAO.update(99999, { title: '存在しない' })).rejects.toThrow(
      'Report not found'
    );
  });
});
```

---

## ✅ 完了条件

- [ ] `src/services/__tests__/ReportDAO.test.ts` 作成
- [ ] 全テストケース実装
- [ ] `src/services/ReportDAO.ts` 実装
- [ ] 全テスト合格（100%カバレッジ）
- [ ] TypeScript strict mode: 0エラー
- [ ] ESLint: 0警告
- [ ] Prettier: 100%準拠

---

## 📂 ファイル構成

```
src/
├── services/
│   ├── ReportDAO.ts            (新規作成)
│   └── __tests__/
│       └── ReportDAO.test.ts   (新規作成)
```
