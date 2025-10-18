# 📋 Dynamic Field Note - イシュー管理ガイド

**最終更新**: 2025-10-18

このガイドでは、Dynamic Field Noteプロジェクトにおけるイシュー管理のベストプラクティス、ラベル体系、開発フローを記載しています。

---

## 🎯 目次

1. [イシューの種類](#イシューの種類)
2. [ラベル体系](#ラベル体系)
3. [イシュー作成ガイドライン](#イシュー作成ガイドライン)
4. [開発フロー](#開発フロー)
5. [週次レビュー](#週次レビュー)
6. [イシューテンプレート](#イシューテンプレート)

---

## イシューの種類

### 🐛 Bug（バグ報告）
- 予期しない動作や不具合
- ラベル: `bug`
- 優先度: `priority-high` または `priority-critical`

### ✨ Feature（新機能）
- 新しい機能の提案・実装
- ラベル: `enhancement`
- フェーズラベル: `phase-0`, `phase-1`, etc.

### 📚 Documentation（ドキュメント）
- ドキュメントの追加・更新
- ラベル: `documentation`

### 🔧 Refactoring（リファクタリング）
- コード品質改善、構造改善
- ラベル: `refactor`

### 🧪 Testing（テスト）
- テストの追加・改善
- ラベル: `testing`

---

## ラベル体系

### 優先度ラベル

| ラベル | 意味 | 対応期限 |
|--------|------|----------|
| `priority-critical` 🔴 | 緊急対応必須 | 24時間以内 |
| `priority-high` 🟡 | 高優先度 | 1週間以内 |
| `priority-medium` 🟢 | 中優先度 | 2週間以内 |
| `priority-low` 🔵 | 低優先度 | 適宜対応 |

### フェーズラベル

プロジェクトのフェーズを示すラベル（[ROADMAP.md](./ROADMAP.md)参照）：

- `phase-0`: 環境構築
- `phase-1`: PoC
- `phase-2`: UI/UX整備
- `phase-3`: ローカル保存
- `phase-4`: Azure連携
- `phase-5`: α版統合
- `phase-6`: β・運用化

### カテゴリラベル

- `bug`: バグ
- `enhancement`: 機能追加・改善
- `documentation`: ドキュメント
- `refactor`: リファクタリング
- `testing`: テスト関連
- `setup`: 環境構築
- `security`: セキュリティ
- `performance`: パフォーマンス

### プラットフォームラベル

- `ios`: iOS固有の問題
- `android`: Android固有の問題
- `cross-platform`: クロスプラットフォーム

---

## イシュー作成ガイドライン

### タイトルの書き方

**形式**: `[優先度] カテゴリ: 簡潔な説明`

**例**:
- `🔴 [CRITICAL] 案件削除時にアプリがクラッシュ`
- `🟢 [MEDIUM] 未使用変数削除 - 約10箇所`
- `🔵 [LOW] E2Eテスト整備（Playwright）`
- `📋 イシュー管理ガイド`

### 説明の書き方

以下の構造を推奨：

```markdown
## 📝 Description
[問題・要望の詳細説明]

## ✅ Acceptance Criteria
- [ ] 基準1
- [ ] 基準2
- [ ] 基準3

## 🔍 Additional Context
[スクリーンショット、エラーログ、関連情報など]

## ⏱️ Estimated Effort
[見積もり工数: 例: 2-4 hours]
```

### 例：バグ報告

```markdown
## 📝 Description
案件一覧画面で案件を削除すると、アプリがクラッシュします。

**再現手順**:
1. 案件一覧画面を開く
2. 案件を長押しして削除オプションを選択
3. 削除を確認
4. → アプリがクラッシュ

**期待される動作**: 案件が削除され、一覧が更新される

## ✅ Acceptance Criteria
- [ ] 案件削除時にクラッシュしない
- [ ] 削除後に一覧が正しく更新される
- [ ] 削除確認ダイアログが表示される

## 🔍 Additional Context
エラーログ:
```
Error: Cannot read property 'id' of undefined
  at CaseDAO.delete (CaseDAO.ts:170)
```

## ⏱️ Estimated Effort
2-3 hours
```

---

## 開発フロー

### 1. イシューの作成

1. 新しいイシューを作成
2. 適切なラベルを付与
3. マイルストーン（該当する場合）を設定

### 2. 作業開始

1. イシューを自分にアサイン
2. ブランチを作成（推奨）
   ```bash
   git checkout -b issue-{number}-{short-description}
   # 例: git checkout -b issue-17-remove-unused-vars
   ```

### 3. 実装・テスト

1. コードを実装
2. テストを追加・実行
   ```bash
   npm run test
   npm run lint
   npm run type-check
   ```
3. コミットメッセージに `#` でイシュー番号を参照
   ```bash
   git commit -m "fix: 案件削除時のクラッシュ修正 #25"
   ```

### 4. 完了・クローズ

1. 変更をプッシュ
2. イシューにコメントで完了報告
3. イシューをクローズ
   - コミットメッセージに `Fixes #25` または `Closes #25` を含める
   - GitHub CLIを使用: `gh issue close 25 --comment "完了しました"`

---

## 週次レビュー

毎週、以下の項目をレビューします：

### チェックリスト

- [ ] **OPENイシューの確認**
  - 新しいイシューにラベル付与
  - 優先度の見直し
  - 古いイシューのクローズ検討

- [ ] **進行中イシューの確認**
  - ブロッカーの有無
  - 期限の確認
  - 必要に応じてアサイン変更

- [ ] **完了イシューの確認**
  - クローズ済みイシューのレビュー
  - リリースノート作成の準備

- [ ] **マイルストーンの進捗確認**
  - 各フェーズの進捗率
  - 遅延しているタスクの特定

---

## イシューテンプレート

### バグ報告テンプレート

```markdown
## 📝 Description
[バグの詳細説明]

## 🔄 Steps to Reproduce
1.
2.
3.

## ✅ Expected Behavior
[期待される動作]

## ❌ Actual Behavior
[実際の動作]

## 🔍 Environment
- OS: [例: iOS 17.0]
- Device: [例: iPhone 12]
- App Version: [例: 1.0.0]

## 📸 Screenshots/Logs
[スクリーンショットやログ]

## ⏱️ Estimated Effort
[見積もり工数]
```

### 機能追加テンプレート

```markdown
## 📝 Description
[機能の詳細説明]

## 🎯 Purpose
[なぜこの機能が必要か]

## ✅ Acceptance Criteria
- [ ]
- [ ]
- [ ]

## 🎨 Design/Mockup
[デザインやモックアップ]

## 🔍 Technical Considerations
[技術的な考慮事項]

## ⏱️ Estimated Effort
[見積もり工数]
```

---

## ベストプラクティス

### ✅ DO（推奨）

- ✅ 明確で簡潔なタイトルを使う
- ✅ Acceptance Criteriaを明確に定義
- ✅ 適切なラベルを付与
- ✅ イシュー番号をコミットメッセージに含める
- ✅ 完了時にはコメントで詳細報告
- ✅ スクリーンショットやログを添付

### ❌ DON'T（非推奨）

- ❌ 曖昧なタイトル（例: "バグ修正"）
- ❌ 複数の問題を1つのイシューにまとめる
- ❌ ラベルなしでイシューを作成
- ❌ イシューを放置する
- ❌ 完了報告なしでクローズ

---

## GitHub CLIの活用

### イシュー一覧表示
```bash
gh issue list
gh issue list --label "bug"
gh issue list --assignee @me
```

### イシュー作成
```bash
gh issue create --title "バグ: ..." --label "bug,priority-high"
```

### イシュー詳細表示
```bash
gh issue view 25
```

### イシュークローズ
```bash
gh issue close 25 --comment "修正完了しました"
```

---

## 関連ドキュメント

- [開発ロードマップ](./ROADMAP.md) - プロジェクト全体のタイムライン
- [セットアップガイド](./setup-guide.md) - 開発環境構築
- [テストガイド](./e2e-testing.md) - テスト実施方法

---

**質問・提案がある場合は、新しいイシューを作成してください！**
