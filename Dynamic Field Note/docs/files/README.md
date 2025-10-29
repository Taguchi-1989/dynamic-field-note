# Claude Code - 既存プロジェクト導入ガイド（バイパス運用版）

## 🎯 このガイドについて

**既に開発中のプロジェクトに Claude Code を導入し、`--dangerously-skip-permissions` をマストで使用しながら、安全に運用するための実践ガイドです。**

### 前提

- ✅ プロジェクトは既に進行中
- ✅ `--dangerously-skip-permissions` をフル活用する
- ✅ ただし、詳細なガードレールで安全性を確保
- ✅ DevContainer で隔離環境を構築

---

## 📋 目次

1. [導入フロー](#導入フロー)
2. [ガードレール設計](#ガードレール設計)
3. [バイパス運用のベストプラクティス](#バイパス運用のベストプラクティス)
4. [段階的な権限設定](#段階的な権限設定)
5. [リスク管理とバックアップ](#リスク管理とバックアップ)
6. [実践的な使用例](#実践的な使用例)

---

## 🚀 導入フロー

### ステップ1: バックアップ（必須！）

```bash
# 現在の状態をコミット
git add -A
git commit -m "chore: Claude Code導入前のスナップショット"

# タグを作成（ロールバック用）
git tag pre-claude-code

# リモートにプッシュ
git push origin main --tags
```

### ステップ2: 設定ファイルを配置

```bash
# プロジェクトルートで実行
cd your-project/

# DevContainer設定（推奨）
mkdir -p .devcontainer
cp /path/to/templates/.devcontainer/* .devcontainer/

# Claude設定
mkdir -p .claude/commands .claude/backups
cp /path/to/templates/.claude.json .claude/
cp /path/to/templates/CLAUDE.md ./

# バックアップディレクトリを.gitignoreに追加
echo ".claude/backups/" >> .gitignore
echo ".claude/error.log" >> .gitignore
```

### ステップ3: プロジェクト情報を記載

```bash
# CLAUDE.mdを編集
code CLAUDE.md
```

**最低限記載すべき情報**:

- 技術スタック（言語、フレームワーク）
- ビルドコマンド
- テストコマンド
- コーディング規約
- 絶対に触ってはいけないファイル/ディレクトリ

### ステップ4: DevContainerで起動

```bash
# VS Codeで開く
code .

# Command Palette: "Dev Containers: Reopen in Container"
```

### ステップ5: 初回テスト（小さく始める）

```bash
# コンテナ内で実行

# 認証
export ANTHROPIC_API_KEY="your-key"

# 小さなタスクでテスト
claude --dangerously-skip-permissions "READMEのtypoを修正して"

# 差分を確認
git diff

# 問題なければコミット
git add README.md
git commit -m "docs: fix typo"
```

---

## 🛡️ ガードレール設計

### 3層のガードレール

```
Layer 1: DevContainer隔離
  └─ ホストシステムから完全に分離
  └─ ファイアウォールでネットワーク制限

Layer 2: allowedTools設定
  └─ 実行可能なコマンドを明示的に列挙
  └─ 危険なコマンド（rm、docker run等）は除外

Layer 3: Hooks + バックアップ
  └─ 編集前に自動バックアップ
  └─ 編集後に自動テスト・リント
  └─ コミット前にフルテスト
```

### `.claude.json` の設計思想

```json
{
  "allowedTools": [
    "// === 原則 ===",
    "// 1. 読み取り操作は全て許可",
    "// 2. 書き込み操作は慎重に選択",
    "// 3. 破壊的操作は絶対に許可しない",
    "// 4. 必要になったら段階的に追加",

    "Read(*)", // ✅ 安全
    "Edit(*)", // ⚠️ 慎重に（hooksで保護）
    "Bash(rm *)" // ❌ 絶対NG
  ]
}
```

### プロジェクトタイプ別の推奨設定

<details>
<summary><strong>Node.js / TypeScript プロジェクト</strong></summary>

```json
{
  "allowedTools": [
    "Read(*)",
    "Grep(*)",
    "List(*)",
    "Search(*)",
    "View(*)",
    "Edit(*)",
    "Bash(npm install*)",
    "Bash(npm run*)",
    "Bash(npm test*)",
    "Bash(yarn *)",
    "Bash(pnpm *)",
    "Bash(node *)",
    "Bash(npx *)",
    "Bash(eslint*)",
    "Bash(prettier*)",
    "Bash(git status)",
    "Bash(git diff*)",
    "Bash(git add*)",
    "Bash(git commit*)"
  ],
  "hooks": {
    "beforeEdit": [{ "name": "Backup", "command": "cp {file} {file}.backup-$(date +%s)" }],
    "afterEdit": [
      { "name": "Format", "command": "npx prettier --write {file}" },
      { "name": "Lint", "command": "npx eslint {file} --fix" },
      { "name": "TypeCheck", "command": "npx tsc --noEmit" }
    ]
  }
}
```

</details>

<details>
<summary><strong>Python / FastAPI プロジェクト</strong></summary>

```json
{
  "allowedTools": [
    "Read(*)",
    "Grep(*)",
    "List(*)",
    "Search(*)",
    "View(*)",
    "Edit(*)",
    "Bash(pip install*)",
    "Bash(poetry *)",
    "Bash(uv *)",
    "Bash(python *)",
    "Bash(python3 *)",
    "Bash(pytest*)",
    "Bash(mypy *)",
    "Bash(black *)",
    "Bash(ruff *)",
    "Bash(isort *)",
    "Bash(git status)",
    "Bash(git diff*)",
    "Bash(git add*)",
    "Bash(git commit*)"
  ],
  "hooks": {
    "beforeEdit": [{ "name": "Backup", "command": "cp {file} {file}.backup-$(date +%s)" }],
    "afterEdit": [
      { "name": "Format", "command": "black {file}" },
      { "name": "Lint", "command": "ruff check {file} --fix" },
      { "name": "TypeCheck", "command": "mypy {file}" }
    ]
  }
}
```

</details>

<details>
<summary><strong>Go プロジェクト</strong></summary>

```json
{
  "allowedTools": [
    "Read(*)",
    "Grep(*)",
    "List(*)",
    "Search(*)",
    "View(*)",
    "Edit(*)",
    "Bash(go build*)",
    "Bash(go test*)",
    "Bash(go run*)",
    "Bash(go mod *)",
    "Bash(go get *)",
    "Bash(gofmt *)",
    "Bash(golangci-lint *)",
    "Bash(git status)",
    "Bash(git diff*)",
    "Bash(git add*)",
    "Bash(git commit*)"
  ],
  "hooks": {
    "beforeEdit": [{ "name": "Backup", "command": "cp {file} {file}.backup-$(date +%s)" }],
    "afterEdit": [
      { "name": "Format", "command": "gofmt -w {file}" },
      { "name": "Test", "command": "go test ./..." }
    ]
  }
}
```

</details>

---

## ⚡ バイパス運用のベストプラクティス

### ✅ DO: やるべきこと

#### 1. **作業前に必ずコミット**

```bash
# 作業開始前のルーティン
git status
git add -A
git commit -m "checkpoint: 作業開始前"
```

#### 2. **タスクを明確に定義**

❌ 悪い例:

```bash
cc "このプロジェクトを改善して"
```

✅ 良い例:

```bash
cc "src/components/Button.tsx のESLintエラーを修正して。
    ただし、既存のロジックは変更しないこと。"
```

#### 3. **段階的に実行**

```bash
# 小→中→大の順で
cc "まずリント修正のみ"
# 確認
git diff

cc "次にテストを追加"
# 確認
git diff

cc "最後にリファクタリング"
```

#### 4. **定期的な差分確認**

```bash
# エイリアス推奨
alias gdiff='git diff'
alias gstatus='git status'

# こまめに確認
gdiff
```

#### 5. **Plan Mode を併用**

```bash
# 大きな変更の前に
# Shift+Tab x2 で Plan Mode

claude "この機能を実装して"
# → 計画を確認 → 承認 → 実行
```

### ❌ DON'T: 避けるべきこと

#### 1. **曖昧な指示**

```bash
❌ cc "バグを直して"
✅ cc "UserController.tsのnull参照エラーを修正して"
```

#### 2. **長時間の連続実行**

```bash
❌ 1つのチャットで何時間も作業
✅ 30分〜1時間ごとに /clear して再起動
```

#### 3. **バックアップなしの実行**

```bash
❌ git status で変更があるまま実行
✅ 必ずクリーンな状態から開始
```

#### 4. **一度に大量のファイルを変更**

```bash
❌ cc "全ファイルをリファクタリング"
✅ cc "src/utils/ ディレクトリのみリファクタリング"
```

---

## 🎚️ 段階的な権限設定

### Phase 1: 導入初期（最小権限）

```json
{
  "allowedTools": [
    "Read(*)",
    "Grep(*)",
    "List(*)",
    "Search(*)",
    "View(*)",
    "Bash(git status)",
    "Bash(git diff*)",
    "Bash(git log*)"
  ]
}
```

**できること**: コードベースの理解、分析

### Phase 2: 軽微な編集（1週間後）

```json
{
  "allowedTools": [
    "// Phase 1 の内容 +",
    "Edit(*)",
    "Bash(eslint*)",
    "Bash(prettier*)",
    "Bash(git add*)",
    "Bash(git commit*)"
  ],
  "hooks": {
    "beforeEdit": [{ "name": "Backup", "command": "cp {file} .claude/backups/{file}.$(date +%s)" }]
  }
}
```

**できること**: リント修正、ドキュメント更新

### Phase 3: 本格運用（1ヶ月後）

```json
{
  "allowedTools": [
    "// Phase 2 の内容 +",
    "Bash(npm install*)",
    "Bash(npm test*)",
    "Bash(docker ps*)",
    "Bash(docker logs*)"
  ],
  "hooks": {
    "afterEdit": [{ "name": "Test", "command": "npm test -- --findRelatedTests {file}" }],
    "beforeCommit": [{ "name": "FullTest", "command": "npm test" }]
  }
}
```

**できること**: 機能実装、テスト作成、デバッグ

---

## 💾 リスク管理とバックアップ

### 自動バックアップ設定

```bash
# .claude/hooks/auto-backup.sh を作成
#!/bin/bash
BACKUP_DIR=".claude/backups"
mkdir -p "$BACKUP_DIR"

# 編集前にバックアップ
cp "$1" "$BACKUP_DIR/$(basename $1).$(date +%Y%m%d-%H%M%S)"

# 7日以上古いバックアップを削除
find "$BACKUP_DIR" -type f -mtime +7 -delete
```

### Git スナップショット戦略

```bash
# 作業開始時
git checkout -b claude-work-$(date +%Y%m%d)
git commit --allow-empty -m "start: Claude Code作業開始"

# 区切りごとに
git add -A
git commit -m "checkpoint: 機能A完了"

# 問題発生時
git reset --hard HEAD^  # 直前に戻る
git reset --hard pre-claude-code  # 導入前に戻る
```

### エラーログ

```bash
# .claude/hooks/log-error.sh
#!/bin/bash
echo "[$(date)] ERROR: $1" >> .claude/error.log
```

---

## 🎯 実践的な使用例

### ケース1: レガシーコードのリファクタリング

```bash
# Phase 1: まず理解
cc "src/legacy/UserService.js を分析して、
    主要な責務と依存関係を説明して"

# Phase 2: テストを追加
cc "UserService.js のテストを作成。
    既存のコードは変更しないこと"

# Phase 3: 段階的にリファクタリング
cc "UserService.js の getData メソッドのみを
    async/await に変更。他は触らないこと"

# 確認
npm test
git diff

# Phase 4: 次のメソッド
cc "次に setData メソッドを同様に変更"
```

### ケース2: 大量のリント修正

```bash
# 一気にやらない
cc "src/components/ ディレクトリ内のファイルで
    ESLintエラーがあるものをリストアップ"

# 1つずつ修正
cc "Button.tsx のESLintエラーのみ修正"
git diff && git add Button.tsx && git commit -m "lint: Button"

cc "次にInput.tsx を修正"
git diff && git add Input.tsx && git commit -m "lint: Input"
```

### ケース3: 新機能の実装

```bash
# Plan Mode で計画
# Shift+Tab x2
cc "ユーザー認証機能を実装したい。
    JWT使用、/api/auth エンドポイント作成"

# 計画を確認 → 承認

# 実装後
npm test
npm run build

# 問題なければ
git add -A
git commit -m "feat: ユーザー認証機能を追加"
```

### ケース4: 緊急バグ修正

```bash
# 現在の作業を退避
git stash

# 新しいブランチ
git checkout -b hotfix/critical-bug

# バグ修正
cc "UserController.ts の line 45 のnull参照エラーを修正。
    エラーハンドリングを追加すること"

# テスト
npm test

# デプロイ
git add -A
git commit -m "fix: null参照エラーを修正"
git push origin hotfix/critical-bug
```

---

## 🔧 トラブルシューティング

### 問題1: 予期しない変更が入った

**解決策**:

```bash
# 直前のコミットに戻る
git reset --hard HEAD^

# または特定のファイルだけ戻す
git checkout HEAD -- src/problem-file.ts

# バックアップから復元
cp .claude/backups/problem-file.ts.20251018-143000 src/problem-file.ts
```

### 問題2: allowedToolsでコマンドが実行できない

**解決策**:

```bash
# エラーメッセージを確認
cat .claude/error.log

# .claude.jsonに追加
code .claude.json
# allowedToolsに該当パターンを追加

# 再起動
/clear
```

### 問題3: hooks実行でエラー

**解決策**:

```json
{
  "hooks": {
    "afterEdit": [
      {
        "name": "Test",
        "command": "npm test",
        "ignoreErrors": true, // ← 追加
        "timeout": 30000 // ← タイムアウト設定
      }
    ]
  }
}
```

### 問題4: コンテキストが頻繁に溢れる

**解決策**:

```bash
# .claudeignore を作成
node_modules/
dist/
build/
.git/
*.log
coverage/
.next/

# こまめに /clear
# 3-5メッセージごとに実行
```

---

## 📊 運用メトリクス

### 計測すべき指標

```bash
# 成功率
成功したコミット数 / Claude実行回数

# 手戻り率
revertしたコミット数 / 総コミット数

# 生産性
Claude使用後の開発速度 / 使用前の開発速度
```

### ログ分析

```bash
# .claude/metrics.sh
#!/bin/bash
echo "=== Claude Code Metrics ==="
echo "Total commits: $(git log --grep='claude' --oneline | wc -l)"
echo "Total reverts: $(git log --grep='revert' --oneline | wc -l)"
echo "Error count: $(wc -l < .claude/error.log)"
```

---

## 🎓 チーム導入のポイント

### 1. パイロットチーム（1-2人）

- 1週間の試験運用
- 問題点の洗い出し
- allowedToolsの最適化

### 2. ドキュメント整備

```bash
# プロジェクト専用のCLAUDE.mdを充実させる
- アーキテクチャ図
- ディレクトリ構成の説明
- 重要な設計判断の記録
- よくあるタスクの手順
```

### 3. レビュープロセス

```bash
# Claude生成コードのレビュー観点
- ロジックの正確性
- セキュリティ
- パフォーマンス
- テストカバレッジ
- ドキュメント
```

### 4. チーム設定の共有

```bash
# .claude.json をリポジトリに含める
git add .claude.json CLAUDE.md
git commit -m "docs: Claude Code設定を追加"

# チーム全員が同じ設定で作業
```

---

## 📚 参考リソース

### 公式

- [Claude Code Docs](https://docs.claude.com/)
- [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### コミュニティ

- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [ClaudeLog](https://claudelog.com/)
- [Reddit r/ClaudeAI](https://www.reddit.com/r/ClaudeAI/)

---

## ✅ チェックリスト

導入前:

- [ ] プロジェクトをコミット & タグ作成
- [ ] .devcontainer設定を配置
- [ ] .claude.json を作成
- [ ] CLAUDE.md を記述
- [ ] .gitignore を更新

初回実行前:

- [ ] DevContainer で起動
- [ ] 認証完了
- [ ] 小さなタスクでテスト
- [ ] git diff で確認

定期的に:

- [ ] allowedToolsを見直し
- [ ] hooksを最適化
- [ ] バックアップを確認
- [ ] メトリクスを分析

---

**本番運用開始！Claude Code で開発を加速させましょう！🚀**
