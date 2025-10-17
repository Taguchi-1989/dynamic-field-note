# Phase 3 Start - データ永続化・案件管理機能開始

Phase 3の開発を安全に開始します。

## 事前準備チェックリスト

- [ ] Phase 2が完了している
- [ ] 全ての変更がコミット済み
- [ ] ガードレールが全てパス
- [ ] バックアップ作成済み

## 実行手順

### 1. バックアップ作成

```bash
git add -A
git commit -m "chore: Phase 2 完了 - Phase 3 開始前のスナップショット"
git tag phase2-complete
```

### 2. Phase 3 ブランチ作成

```bash
git checkout -b feature/phase3-data-persistence
```

### 3. チェックポイント作成

```bash
checkpoint "Phase 3 開発開始"
```

### 4. 開発開始

```bash
# SQLite統合から開始
claude "SQLiteデータベースサービスを実装して。
  - src/services/DatabaseService.ts を作成
  - initDatabase, executeQuery, migrate メソッドを実装
  - docs/sqlite-schema.md のスキーマに従う"
```

## Phase 3 実装項目

1. ✅ SQLite統合（DatabaseService.ts）
2. ✅ 案件DAO（CaseDAO.ts）
3. ✅ レポートDAO（ReportDAO.ts）
4. ✅ 案件管理画面（CaseListScreen.tsx）
5. ✅ 案件作成・編集フォーム（CaseFormModal.tsx）
6. ✅ 写真撮影機能（expo-camera統合）
7. ✅ ファイルエクスポート（expo-file-system + jszip）

## 注意事項

- 1項目ずつ実装 → テスト → コミット
- こまめに `npm run guardrails` を実行
- 大きな変更前は Plan Mode を使用
