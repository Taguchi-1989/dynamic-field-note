# Checkpoint - バックアップ作成

現在の作業状態を安全にバックアップします。

## 使い方

```bash
# 引数にチェックポイント名を指定
checkpoint "Phase 3 SQLite統合開始前"
```

## 実行内容

1. 現在の変更をステージング
2. チェックポイント用のコミットを作成
3. タグを作成（オプション）

## エイリアス

Dockerfileで以下のエイリアスが設定されます：

```bash
alias checkpoint='git add -A && git commit -m "checkpoint: $1"'
```

## 戻し方

```bash
# 直前のチェックポイントに戻る
git reset --hard HEAD^

# 特定のチェックポイントに戻る
git log  # コミットハッシュ確認
git reset --hard <commit-hash>
```
