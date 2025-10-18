# [Phase 3] PhotoDAO改善 - 報告書紐付け機能（TDD）

**作成日**: 2025-10-18
**ステータス**: 📅 未着手
**優先度**: P1
**担当**: Claude Code
**関連Phase**: Phase 3 - データ永続化・案件管理
**依存**: PHASE_3_DAO_2_REPORT_DAO

---

## 📋 概要

既存のPhotoDAOを拡張し、報告書への紐付け機能とCRUD操作の完全実装を行う。

---

## 🎯 目的

- 写真の案件・報告書両方への紐付け対応
- `findByReportId` メソッド追加
- テストカバレッジ100%達成

---

## 📝 要件定義

### 新規機能

#### findByReportId - 報告書別検索

- 入力: `reportId: number`
- 出力: `Photo[]`
- 指定報告書に紐付く全写真を取得
- 論理削除されたレコードは除外

### 改善機能

#### update - 写真情報更新

- キャプション変更
- アノテーションデータ更新
- 報告書への紐付け変更

---

## 🧪 テストケース

```typescript
describe('PhotoDAO - 新機能', () => {
  test('findByReportId: 報告書別に写真を取得できる', async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    const report = await reportDAO.create({
      case_id: testCase.id,
      title: 'テスト報告書',
    });

    await photoDAO.create({
      case_id: testCase.id,
      report_id: report.id,
      file_path: '/path/to/photo1.jpg',
    });

    const photos = await photoDAO.findByReportId(report.id);

    expect(photos.length).toBe(1);
    expect(photos[0].report_id).toBe(report.id);
  });

  test('update: 報告書への紐付けを変更できる', async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    const report1 = await reportDAO.create({
      case_id: testCase.id,
      title: '報告書1',
    });
    const report2 = await reportDAO.create({
      case_id: testCase.id,
      title: '報告書2',
    });

    const photo = await photoDAO.create({
      case_id: testCase.id,
      report_id: report1.id,
      file_path: '/path/to/photo.jpg',
    });

    await photoDAO.update(photo.id, { report_id: report2.id });

    const updated = await photoDAO.findById(photo.id);
    expect(updated!.report_id).toBe(report2.id);
  });
});
```

---

## ✅ 完了条件

- [ ] `src/services/__tests__/PhotoDAO.test.ts` 作成
- [ ] `src/services/PhotoDAO.ts` 改善
- [ ] `findByReportId` 実装
- [ ] 全テスト合格（100%カバレッジ）
