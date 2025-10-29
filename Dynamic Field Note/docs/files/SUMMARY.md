# 🎯 Claude Code - 既存プロジェクト導入パッケージ

## 📦 パッケージ内容

このパッケージは**既に開発中のプロジェクトに Claude Code を導入し、`--dangerously-skip-permissions` をフル活用しながら安全に運用する**ための完全な設定一式です。

---

## 🗂️ ファイル構成

```
claude-code-existing-project/
├── .devcontainer/
│   ├── devcontainer.json      # VS Code Dev Container設定
│   ├── Dockerfile              # Node.js 20 + Claude Code + 開発ツール
│   └── init-firewall.sh        # セキュリティファイアウォール設定
│
├── .claude/
│   ├── commands/               # カスタムコマンド
│   │   ├── fix-github-issue.md
│   │   ├── code-review.md
│   │   └── run-tests.md
│   └── backups/                # 自動バックアップ先（作成される）
│
├── .claude.json                # 🔥 メイン設定ファイル（詳細なガードレール）
├── CLAUDE.md                   # プロジェクトコンテキスト（要編集）
│
├── README.md                   # 完全版ガイド（ベストプラクティス全収録）
├── QUICKSTART.md               # 10分で導入完了ガイド
└── setup.sh                    # 自動セットアップスクリプト
```

---

## 🚀 3ステップ導入

### 1️⃣ 展開 & バックアップ（2分）

```bash
cd your-existing-project/
tar -xzf claude-code-existing-project.tar.gz

# バックアップタグを作成
git add -A
git commit -m "chore: Claude Code導入前のスナップショット"
git tag pre-claude-code
```

### 2️⃣ 自動セットアップ（1分）

```bash
bash setup.sh
# → 対話的にファイルをコピー
# → .gitignore を自動更新
```

### 3️⃣ 起動 & 認証（2分）

```bash
code .
# → "Reopen in Container"

# コンテナ内で
export ANTHROPIC_API_KEY="sk-ant-xxxxx"
cc "READMEのtypoを修正"
```

---

## 🛡️ 組み込み済みガードレール

### 3層防御システム

#### Layer 1: DevContainer隔離

- ✅ ホストシステムから完全分離
- ✅ ファイアウォールでネットワーク制限
- ✅ 非rootユーザー（node）で実行

#### Layer 2: allowedTools（.claude.json）

```json
{
  "allowedTools": [
    "Read(*)", // ✅ 全て許可
    "Edit(*)", // ⚠️ hooks で保護
    "Bash(git add*)", // ⚠️ 許可
    "Bash(git push*)", // ⚠️ コメントアウト（要検討）
    "Bash(rm *)", // ❌ 絶対NG（許可しない）
    "Bash(docker run*)" // ❌ 危険（コメントアウト）
  ]
}
```

#### Layer 3: Hooks + 自動バックアップ

```json
{
  "hooks": {
    "beforeEdit": [{ "name": "Backup", "command": "cp {file} {file}.backup-$(date +%s)" }],
    "afterEdit": [
      { "name": "Lint", "command": "npx eslint {file} --fix" },
      { "name": "Test", "command": "npm test -- --findRelatedTests {file}" }
    ],
    "beforeCommit": [{ "name": "FullTest", "command": "npm test" }]
  }
}
```

---

## ⚙️ バイパス運用の設計思想

### なぜバイパスを使うのか？

**生産性の最大化**：

- ❌ 毎回の承認待ち → 作業が分断される
- ✅ バイパスモード → フロー状態を維持

**ただし、安全性は妥協しない**：

1. **DevContainer で隔離** → ホストは絶対安全
2. **allowedTools で制限** → 危険コマンドは除外
3. **Hooks で検証** → 編集後に自動テスト

### コマンド使い分け

```bash
# バイパスモード（推奨・デフォルト）
cc "タスクを実行"
→ DevContainer内なら安全
→ ガードレールで保護済み

# 通常モード（慎重な操作時）
ccs "本番デプロイ"
→ permission確認あり
→ git push等の重要操作

# Plan Mode（大規模変更時）
# Shift+Tab x2
→ 計画確認 → 承認 → 実行
```

---

## 📊 段階的な権限設定

### Phase 1: 導入初期（1週間）

```json
{
  "allowedTools": [
    "Read(*)",
    "Grep(*)",
    "Search(*)", // 読み取りのみ
    "Bash(git status)",
    "Bash(git diff*)"
  ]
}
```

### Phase 2: 軽微な編集（2-3週間）

```json
{
  "allowedTools": [
    "// Phase 1 +",
    "Edit(*)", // 編集許可
    "Bash(eslint*)",
    "Bash(prettier*)", // リント
    "Bash(git add*)",
    "Bash(git commit*)"
  ]
}
```

### Phase 3: 本格運用（1ヶ月後）

```json
{
  "allowedTools": [
    "// Phase 2 +",
    "Bash(npm install*)",
    "Bash(npm test*)",
    "Bash(git push*)", // 慎重に
    "Bash(docker ps*)",
    "Bash(docker logs*)"
  ]
}
```

---

## 🔧 カスタマイズポイント

### 1. プロジェクトタイプに合わせる

**Node.js/TypeScript**:

```json
{
  "allowedTools": ["Bash(npm *)", "Bash(yarn *)", "Bash(pnpm *)", "Bash(node *)", "Bash(npx *)"]
}
```

**Python**:

```json
{
  "allowedTools": [
    "Bash(pip install*)",
    "Bash(poetry *)",
    "Bash(uv *)",
    "Bash(python *)",
    "Bash(pytest*)"
  ]
}
```

**Go**:

```json
{
  "allowedTools": ["Bash(go build*)", "Bash(go test*)", "Bash(go mod *)"]
}
```

### 2. Hooksをカスタマイズ

```json
{
  "hooks": {
    "beforeEdit": [
      // プロジェクト固有の準備処理
    ],
    "afterEdit": [
      // プロジェクト固有の検証
      { "name": "CustomTest", "command": "./scripts/custom-test.sh {file}" }
    ]
  }
}
```

### 3. MCPサーバーを追加

```json
{
  "mcp": {
    "servers": {
      "slack": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-slack"],
        "env": { "SLACK_TOKEN": "${env:SLACK_TOKEN}" }
      }
    }
  }
}
```

---

## 💡 ベストプラクティス

### ✅ 必ずやること

1. **作業前にバックアップ**

   ```bash
   checkpoint "機能A実装開始"
   ```

2. **3-5メッセージごとに/clear**

   ```bash
   cc "タスク1"
   cc "タスク2"
   /clear  # ← ここ！
   ```

3. **こまめに差分確認**

   ```bash
   git diff
   git status
   ```

4. **タスクを明確に**
   ```bash
   ✅ cc "Button.tsx のESLintエラーのみ修正。ロジックは変更しない"
   ❌ cc "コードを良くして"
   ```

### ❌ 避けること

1. バックアップなしで実行
2. 長時間の連続実行
3. 曖昧な指示
4. 差分確認なしでコミット

---

## 📈 効果測定

### 1週間後に確認

```bash
# コミット数
git log --since="1 week ago" --oneline | wc -l

# Claude関与率
git log --since="1 week ago" --grep="claude" --oneline | wc -l

# Revert率
git log --since="1 week ago" --grep="revert" --oneline | wc -l
```

**目標値**:

- Claude関与: 50%以上
- Revert率: 10%以下
- 開発速度: 1.5-2倍

---

## 🚨 緊急時の対応

### 全てをリセット

```bash
# 導入前に戻る
git reset --hard pre-claude-code

# または直前に戻る
git reset --hard HEAD^
```

### 特定ファイルのみ戻す

```bash
# Gitから復元
git checkout HEAD -- src/problem.ts

# バックアップから復元
cp .claude/backups/problem.ts.* src/problem.ts
```

---

## 📚 ドキュメント

- **QUICKSTART.md** - 10分で導入完了
- **README.md** - 完全版ガイド（50+ページ）
- **.claude.json** - 設定ファイル（コメント付き）
- **CLAUDE.md** - プロジェクトコンテキスト（要編集）

---

## 🎓 学習リソース

### 公式

- [Claude Code Docs](https://docs.claude.com/)
- [Anthropic Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)

### コミュニティ

- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [ClaudeLog](https://claudelog.com/)

---

## ✅ 導入チェックリスト

### 導入前

- [ ] プロジェクトをコミット
- [ ] タグ `pre-claude-code` を作成
- [ ] setup.sh を実行
- [ ] CLAUDE.md を編集（プロジェクト情報を記載）

### 初回実行前

- [ ] DevContainer で起動
- [ ] Claude認証完了
- [ ] 小さなタスクでテスト
- [ ] git diff で確認

### 1週間後

- [ ] allowedToolsを見直し
- [ ] hooksを最適化
- [ ] 効果を測定

### 1ヶ月後

- [ ] チームに展開
- [ ] メトリクスを共有

---

## 🎯 サポート

問題が発生した場合:

1. **README.md** のトラブルシューティングを確認
2. **QUICKSTART.md** のFAQを確認
3. `.claude/error.log` を確認
4. `git reset --hard pre-claude-code` でリセット

---

**準備完了！Claude Code で開発を加速させましょう！🚀**

_作成: 2025年10月_  
_ベース: Reddit、Anthropic公式、コミュニティのベストプラクティス_
