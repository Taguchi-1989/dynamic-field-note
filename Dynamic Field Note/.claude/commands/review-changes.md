# Review Changes - 変更差分レビュー

現在の変更内容を包括的にレビューします。

## 実行内容

1. **Git Status** - 変更ファイル一覧
2. **Git Diff** - 詳細な差分表示
3. **統計情報** - 追加/削除行数

## コマンド

```bash
# ステージングされていない変更
git diff

# ステージング済みの変更
git diff --staged

# 統計情報付き
git diff --stat

# 全ての変更
git diff HEAD
```

## AIレビュー

変更内容を自動レビューする場合：

```bash
# コードレビューエージェント
claude review <file-path>

# セキュリティレビュー
claude security-review <file-path>
```

## 期待される使い方

コミット前に必ず実行し、意図しない変更がないか確認してください。
