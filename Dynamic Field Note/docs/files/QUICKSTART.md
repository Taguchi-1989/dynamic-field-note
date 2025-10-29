# 🚀 既存プロジェクトへのClaude Code導入 - クイックスタート

## 10分で本格運用開始！

このガイドは**既に開発中のプロジェクトに Claude Code を導入し、`--dangerously-skip-permissions` で運用を開始する**手順です。

---

## ⚡ 超高速セットアップ（3ステップ）

### 1️⃣ バックアップ & 設定配置（2分）

```bash
# === Step 1: 現状をバックアップ ===
cd your-project/
git add -A
git commit -m "chore: Claude Code導入前のスナップショット"
git tag pre-claude-code
git push origin main --tags

# === Step 2: 設定ファイルを展開 ===
tar -xzf claude-code-devcontainer-setup.tar.gz

# === Step 3: .gitignoreを更新 ===
cat >> .gitignore << 'EOF'
# Claude Code
.claude/backups/
.claude/error.log
*.backup-*
EOF
```

### 2️⃣ プロジェクト情報を記載（5分）

```bash
# CLAUDE.mdを編集
code CLAUDE.md
```

**必須項目（最低限これだけ書く）**:

```markdown
# プロジェクト概要

[このプロジェクトが何をするものか]

## 技術スタック

- 言語: [TypeScript/Python/Go など]
- フレームワーク: [React/FastAPI など]
- データベース: [PostgreSQL など]

## 重要なコマンド

- ビルド: `npm run build`
- テスト: `npm test`
- 開発: `npm run dev`

## 絶対に触らないでほしいファイル

- .env.production
- src/config/critical.ts
```

### 3️⃣ 起動 & テスト（3分）

```bash
# VS Codeで開く
code .

# → "Reopen in Container" をクリック
# または Ctrl+Shift+P → "Dev Containers: Reopen in Container"

# === コンテナ内で実行 ===

# 認証
export ANTHROPIC_API_KEY="sk-ant-xxxxx"
# または
claude login

# エイリアス確認（自動で設定済み）
alias cc
# → claude --dangerously-skip-permissions

# 小さなタスクでテスト
cc "README.mdのtypoを修正して"

# 差分確認
git diff

# OK なら
git add README.md
git commit -m "docs: fix typo via Claude Code"
```

**🎉 完了！これで本格運用可能です！**

---

## 🛡️ ガードレール設定（既に組み込み済み）

設定ファイルには以下のガードレールが既に組み込まれています：

### Layer 1: コンテナ隔離

- ✅ ホストシステムから完全に分離
- ✅ ファイアウォールでネットワーク制限
- ✅ 非rootユーザーで実行

### Layer 2: allowedTools

- ✅ 安全なコマンドのみ許可
- ⚠️ 危険なコマンド（rm、docker run等）は除外
- 📝 プロジェクトに応じてカスタマイズ可能

### Layer 3: Hooks + バックアップ

- ✅ 編集前に自動バックアップ
- ✅ 編集後にリント・テスト
- ✅ コミット前にフルテスト

---

## 💡 最初の1週間の使い方

### Day 1: 読み取りのみ

```bash
# プロジェクトを理解させる
cc "このプロジェクトの構成を説明して"
cc "src/components/ にどんなコンポーネントがある？"
cc "依存関係を整理して"
```

### Day 2-3: 軽微な修正

```bash
# リント修正
cc "ESLintエラーを全て修正して"

# ドキュメント更新
cc "各関数にJSDocコメントを追加して"

# こまめに確認
git diff
```

### Day 4-5: テスト追加

```bash
# テストカバレッジ向上
cc "UserService.ts のテストを作成して。
    既存コードは変更しないこと"

# 実行して確認
npm test
git diff
```

### Day 6-7: 機能実装

```bash
# 小さな機能から
cc "Buttonコンポーネントにloading状態を追加。
    既存のpropsは維持すること"

# Plan Modeを活用
# Shift+Tab x2 → 計画確認 → 実行
```

---

## 📝 頻出コマンド集

### 基本操作

```bash
# 通常モード（permission確認あり）
claude "何か聞きたいこと"

# バイパスモード（自動実行）
cc "タスクを実行"

# コンテキストクリア（こまめに実行！）
/clear

# 権限設定を確認・変更
/permissions
```

### Git操作

```bash
# 差分確認
git diff
git status

# ステージング
git add .
git add -p  # 対話的に選択

# コミット
git commit -m "type: description"

# 問題があれば戻す
git reset --hard HEAD^
```

### よく使うタスク

```bash
# リント修正
cc "ESLintエラーを修正"

# テスト実行
cc "テストを実行してレポートを作成"

# リファクタリング
cc "この関数を3つに分割して。ロジックは変えないこと"

# バグ修正
cc "line 42 のnull参照エラーを修正"

# ドキュメント生成
cc "このモジュールの使用方法をREADMEに追加"
```

---

## ⚠️ 絶対守るべき3つのルール

### 1. 作業前に必ずコミット

```bash
# 毎回これを実行
git status
git add -A
git commit -m "checkpoint: 〇〇開始前"
```

### 2. こまめに /clear

```bash
# 3-5メッセージごとに実行
cc "タスクA"
cc "タスクB"
cc "タスクC"
/clear  # ← ここで実行
```

### 3. 差分を必ず確認

```bash
# Claudeが何をしたか確認
git diff

# 疑問があれば
git diff src/file.ts
```

---

## 🚨 トラブルシューティング

### Q: 予期しない変更が入った

```bash
# A: すぐにリセット
git reset --hard HEAD

# または特定ファイルのみ
git checkout HEAD -- src/problem.ts
```

### Q: コマンドが実行できない

```bash
# A: allowedToolsに追加
code .claude.json
# 該当するBash(*)パターンを追加
```

### Q: コンテキストがすぐ埋まる

```bash
# A: .claudeignore を作成
cat > .claudeignore << 'EOF'
node_modules/
dist/
build/
.git/
*.log
coverage/
EOF
```

### Q: hooksでエラーが出る

```bash
# A: .claude.json で ignoreErrors: true を追加
{
  "hooks": {
    "afterEdit": [
      {
        "name": "Test",
        "command": "npm test",
        "ignoreErrors": true  // ← 追加
      }
    ]
  }
}
```

---

## 🎯 プロジェクトタイプ別チートシート

### Node.js / TypeScript

```bash
# リント
cc "ESLintエラーを修正"

# 型エラー
cc "TypeScriptの型エラーを全て修正"

# テスト
cc "このコンポーネントのテストを作成"

# リファクタリング
cc "このファイルをTypeScriptに変換"
```

### Python

```bash
# フォーマット
cc "black と isort で整形"

# 型ヒント
cc "全ての関数に型ヒントを追加"

# テスト
cc "この関数の pytest を作成"

# リファクタリング
cc "この関数を async/await に変換"
```

### Go

```bash
# フォーマット
cc "gofmt で整形"

# エラーハンドリング
cc "全てのエラーに適切なハンドリングを追加"

# テスト
cc "この関数のテストを作成"

# リファクタリング
cc "この構造体にメソッドを追加"
```

---

## 📈 段階的な権限追加

導入したばかりの`.claude.json`は最小権限に設定されています。  
プロジェクトに慣れたら、段階的に権限を追加してください。

### 1週間後: git push を追加

```json
{
  "allowedTools": [
    // 既存の設定 +
    "Bash(git push*)"
  ]
}
```

### 1ヶ月後: Docker操作を追加

```json
{
  "allowedTools": [
    // 既存の設定 +
    "Bash(docker run*)",
    "Bash(docker-compose up*)"
  ]
}
```

### プロジェクト固有のコマンドを追加

```json
{
  "allowedTools": [
    // 既存の設定 +
    "Bash(make build)",
    "Bash(./scripts/deploy.sh)"
  ]
}
```

---

## 🎓 ベストプラクティス（簡易版）

### ✅ DO

- 🟢 小さく始める（README修正など）
- 🟢 タスクを明確に定義
- 🟢 こまめに `git diff`
- 🟢 3-5メッセージごとに `/clear`
- 🟢 Plan Mode (Shift+Tab×2) を活用

### ❌ DON'T

- 🔴 いきなり大きな変更
- 🔴 曖昧な指示（「改善して」など）
- 🔴 長時間連続実行
- 🔴 差分確認なしでコミット
- 🔴 git push の自動化（慎重に）

---

## 📊 効果測定

### 1週間後に確認すべき指標

```bash
# コミット数
git log --since="1 week ago" --oneline | wc -l

# Claudeが関与したコミット
git log --since="1 week ago" --grep="claude" --oneline | wc -l

# revert した数
git log --since="1 week ago" --grep="revert" --oneline | wc -l
```

**目標**:

- Claude関与コミット: 50%以上
- Revert率: 10%以下
- 開発速度: 1.5-2倍

---

## 🚀 次のステップ

### 慣れてきたら

1. **カスタムコマンドを追加**

   ```bash
   # .claude/commands/my-task.md を作成
   # /project:my-task で実行可能に
   ```

2. **MCPサーバーを追加**

   ```bash
   # GitHub、Slack、Jiraなどと連携
   code .claude.json
   ```

3. **チームで共有**
   ```bash
   git add .claude.json CLAUDE.md
   git commit -m "docs: Claude Code設定を追加"
   git push
   ```

### 詳しく学ぶ

- 📚 [完全版ガイド](README.md)
- 🔗 [公式ドキュメント](https://docs.claude.com/)
- 💬 [コミュニティ](https://github.com/hesreallyhim/awesome-claude-code)

---

## ✅ 最終チェックリスト

導入完了前に確認:

- [ ] プロジェクトをコミット済み
- [ ] タグ `pre-claude-code` を作成済み
- [ ] CLAUDE.md に最低限の情報を記載
- [ ] .gitignore を更新済み
- [ ] DevContainer で起動成功
- [ ] 小さなタスクでテスト済み
- [ ] git diff で差分確認済み

本格運用OK:

- [ ] チーム内で使い方を共有
- [ ] 1週間後に効果を測定
- [ ] allowedTools を見直し

---

**準備OK！Claude Code で爆速開発を始めましょう！🚀**

_問題が発生したら: `git reset --hard pre-claude-code` でいつでも戻れます_
