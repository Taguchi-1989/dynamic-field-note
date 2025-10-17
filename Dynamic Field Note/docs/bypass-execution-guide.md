# バイパス実行ガイド 🚀

**Claude Code** のバイパス実行モード（`--dangerously-skip-permissions`）を安全に活用するためのガイドです。

---

## 📋 目次

1. [バイパス実行とは](#バイパス実行とは)
2. [セットアップ](#セットアップ)
3. [ガードレール](#ガードレール)
4. [使い方](#使い方)
5. [ベストプラクティス](#ベストプラクティス)
6. [トラブルシューティング](#トラブルシューティング)

---

## バイパス実行とは

### 概要

通常、Claude Codeはコマンド実行前にユーザーの承認を求めますが、**バイパスモード**ではこの承認をスキップし、AIが自動的にコマンドを実行します。

### メリット ✅

- **開発効率の大幅向上**: 承認待ちが不要
- **連続タスクの自動化**: 複数ステップを一気に実行
- **高速イテレーション**: アイデアを即座に実装・検証

### リスク ⚠️

- **意図しないコマンド実行**: AIの判断ミス
- **ファイルの破壊的変更**: 誤った編集・削除
- **セキュリティリスク**: 機密情報の漏洩

### 対策 🛡️

このプロジェクトでは、**多層ガードレール**で安全性を確保しています：

1. **Dev Container分離** - ホストマシンを保護
2. **自動静的解析** - コード品質を担保
3. **自動テスト** - 機能の健全性を確認
4. **AIコードレビュー** - セキュリティ・品質チェック
5. **Pre-commit Hook** - コミット前の最終チェック

---

## セットアップ

### 前提条件

- ✅ Docker Desktop がインストール済み
- ✅ VS Code がインストール済み
- ✅ VS Code の Dev Containers 拡張機能がインストール済み

### 初回セットアップ

#### 1. Dev Container を開く

```bash
# VS Code でプロジェクトを開く
code "Dynamic Field Note"

# Command Palette を開く（Ctrl+Shift+P / Cmd+Shift+P）
# → "Dev Containers: Reopen in Container" を選択
```

#### 2. コンテナビルド完了を待つ

初回は **5〜10分** かかります。以下のメッセージが表示されれば完了です：

```
🚀 Dev Container Ready! Claude Code bypass mode ENABLED. Run: npm start
```

#### 3. バイパスモードの確認

```bash
# エイリアスが設定されているか確認
alias claude
# 出力: alias claude='claude --dangerously-skip-permissions'
```

#### 4. Husky（pre-commit hook）のセットアップ

```bash
npm run prepare
```

---

## ガードレール

### 1. 静的解析（自動実行）

#### TypeScript 型チェック

```bash
npm run type-check
```

- **目的**: 型エラーの検出
- **実行タイミング**: pre-commit、CI/CD

#### ESLint

```bash
npm run lint
```

- **目的**: コードスタイル、ベストプラクティス違反の検出
- **実行タイミング**: pre-commit、CI/CD

#### Prettier

```bash
npm run format:check
```

- **目的**: コードフォーマットの統一
- **実行タイミング**: pre-commit、CI/CD

### 2. 自動テスト

#### Smoke Tests（軽量）

```bash
npm run test:smoke
```

- **目的**: 基本機能の動作確認
- **実行時間**: 〜30秒
- **実行タイミング**: pre-commit

#### Comprehensive Tests（網羅的）

```bash
npm run test:comprehensive
```

- **目的**: 全機能の包括的テスト
- **実行時間**: 〜2分
- **実行タイミング**: CI/CD

### 3. AIコードレビュー

#### Code Reviewer

```bash
claude review src/components/NewComponent.tsx
```

- **レビュー項目**:
  - コード品質
  - パフォーマンス
  - ベストプラクティス
  - アーキテクチャ

#### Security Reviewer

```bash
claude security-review src/services/apiService.ts
```

- **レビュー項目**:
  - 認証・認可
  - データ保護
  - 入力検証
  - API セキュリティ
  - 依存関係の脆弱性

### 4. Pre-commit Hook

**自動実行される内容**:

```bash
# .husky/pre-commit
1. npm run type-check      # TypeScript
2. npm run lint            # ESLint
3. npm run format:check    # Prettier
4. npm run test:smoke      # Smoke Tests
```

**エラー時の動作**:

```
❌ TypeScript errors detected!
# → コミットは中断されます
```

---

## 使い方

### 基本的なワークフロー

#### 1. 機能開発開始

```bash
# 新しいブランチを作成
git checkout -b feature/new-feature

# Claude Codeで開発開始
claude "SQLite統合を実装して"
```

#### 2. 開発中の品質チェック

```bash
# いつでも手動で実行可能
npm run guardrails

# 詳細チェック
npm run guardrails:full
```

#### 3. コミット前の確認

```bash
# Pre-commit hookが自動実行される
git commit -m "feat: SQLite統合実装"

# ガードレールが通れば自動コミット
```

#### 4. プッシュ

```bash
git push origin feature/new-feature
```

### エイリアス一覧

Dev Container内では便利なエイリアスが使えます：

```bash
# バイパス実行（自動設定済み）
claude "タスクを実行"
# = claude --dangerously-skip-permissions "タスクを実行"

# 品質チェック
validate
# = npm run type-check && npm run lint && npm run format:check

# クイックテスト
quicktest
# = npm run test:smoke

# フルチェック
fulltest
# = npm run validate && npm run test
```

---

## ベストプラクティス

### ✅ DO（推奨）

1. **こまめにコミット**
   - 小さな変更単位でコミット
   - Pre-commit hookで品質を保証

2. **ガードレールを信頼**
   - 静的解析・テストが通れば基本的に安全
   - エラーは無視せず必ず修正

3. **AIレビューを活用**
   - 大きな変更前にレビュー実行
   - セキュリティ重視の箇所は必ずチェック

4. **ドキュメント更新**
   - 設計変更時はドキュメントも更新
   - AIに指示する際も明確に

5. **定期的なバックアップ**
   - リモートリポジトリへの定期プッシュ
   - 重要な変更前にブランチ作成

### ❌ DON'T（非推奨）

1. **ガードレールのスキップ**
   - `git commit --no-verify` は使わない
   - エラーを無視しない

2. **大規模な一括変更**
   - 複数ファイルの同時大規模変更は避ける
   - 段階的に実装・検証

3. **テストなしの実装**
   - 新機能は必ずテストを追加
   - 既存テストの削除は慎重に

4. **曖昧な指示**
   - AIへの指示は具体的に
   - 期待する動作を明確に伝える

5. **セキュリティの軽視**
   - APIキーのハードコード厳禁
   - 機密情報のログ出力禁止

---

## トラブルシューティング

### Pre-commit hookが失敗する

#### TypeScript エラー

```bash
# エラー詳細を確認
npm run type-check

# 自動修正を試みる
npm run lint:fix

# 手動で修正
# → エラー箇所を確認して修正
```

#### Prettier エラー

```bash
# 自動フォーマット
npm run format

# 再度チェック
npm run format:check
```

#### テストエラー

```bash
# 失敗したテストを確認
npm run test:smoke

# 詳細ログで原因特定
npm run test:smoke -- --verbose

# テストを修正または実装を修正
```

### Dev Container が起動しない

```bash
# Docker Desktop が起動しているか確認
docker ps

# コンテナを再ビルド
# Command Palette → "Dev Containers: Rebuild Container"

# キャッシュをクリアして再ビルド
# Command Palette → "Dev Containers: Rebuild Container Without Cache"
```

### バイパスモードが動作しない

```bash
# エイリアスの確認
alias claude

# 出力がない場合はシェルを再起動
source ~/.bashrc

# それでもダメなら手動設定
alias claude="claude --dangerously-skip-permissions"
```

### Git safe.directory エラー

```bash
# Dev Container内で実行
git config --global --add safe.directory /workspaces/ZBC-migration-kit
```

---

## セキュリティガイドライン

### 機密情報の扱い

#### ❌ NG例

```typescript
// APIキーのハードコード
const API_KEY = 'sk-1234567890abcdef';

// パスワードのログ出力
console.log('Password:', password);

// 機密情報を平文で保存
await AsyncStorage.setItem('token', authToken);
```

#### ✅ OK例

```typescript
// 環境変数から読み込み
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ログには出力しない
console.log('Authentication successful');

// SecureStoreで暗号化保存
await SecureStore.setItemAsync('token', authToken);
```

### 環境変数の設定

```bash
# .env.local（Gitにコミットしない）
EXPO_PUBLIC_GEMINI_API_KEY=your-api-key-here
```

```javascript
// .gitignore（必須）
.env
.env.local
.env.*.local
```

---

## 参考リンク

### 公式ドキュメント

- [Claude Code Documentation](https://docs.claude.com/claude-code)
- [Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [Husky](https://typicode.github.io/husky/)

### セキュリティ

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security-testing-guide/)
- [React Native Security](https://reactnative.dev/docs/security)
- [Expo Security Best Practices](https://docs.expo.dev/guides/security/)

### 記事

- [Claude Codeとバイパス実行の実践](https://zenn.dev/team_zenn/articles/claudecode-ai-coding-vs-human-engineer)

---

## まとめ

### ✅ バイパス実行で実現できること

- 🚀 **超高速開発**: 承認待ちゼロで連続実行
- 🤖 **AIフル活用**: 複雑なタスクも自動化
- 🛡️ **安全性確保**: 多層ガードレールで保護

### ⚠️ 注意点

- **Dev Container内でのみ使用**（ホストマシンでは通常モード）
- **ガードレールは絶対にスキップしない**
- **機密情報の扱いは慎重に**

### 🎯 次のステップ

1. Dev Containerで開発開始
2. バイパスモードでPhase 3実装
3. ガードレールで品質担保
4. 継続的に改善

**Dynamic Field Note をバイパス実行モードで加速させましょう！** 🎉

---

**作成日**: 2025-10-18
**作成者**: AI Assistant
**最終更新**: 2025-10-18
