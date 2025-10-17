# Dev Container 設定

このディレクトリには、Dynamic Field Note プロジェクトの開発環境をコンテナ化するための設定が含まれています。

## 概要

この Dev Container は以下を提供します：

- **Node.js 20** - React Native/Expo に最適なバージョン
- **TypeScript** - 型安全な開発環境
- **VS Code 拡張機能**:
  - Claude Code（AI アシスタント）
  - ESLint（静的解析）
  - Prettier（コードフォーマット）
  - GitLens（Git 拡張）
  - Expo Tools（React Native 開発）

## 使い方

### 初回セットアップ

1. **VS Code で Dev Container を開く**:

   ```
   Command Palette (Ctrl+Shift+P / Cmd+Shift+P)
   → "Dev Containers: Reopen in Container"
   ```

2. **コンテナのビルドを待つ**（初回は数分かかります）

3. **依存関係のインストール**（自動実行されます）:
   ```bash
   npm install
   ```

### 開発開始

コンテナが起動したら、以下のコマンドで開発を開始できます：

```bash
# Expo 開発サーバーを起動
npm start

# 型チェック
npm run type-check

# Lint チェック
npm run lint

# テスト実行
npm test
```

## ポート転送

以下のポートが自動的に転送されます：

- **19000**: Expo Dev Server
- **19001**: Expo Metro Bundler
- **19002**: Expo DevTools

## トラブルシューティング

### コンテナが起動しない場合

1. Docker Desktop が起動していることを確認
2. VS Code の Dev Containers 拡張機能がインストールされていることを確認
3. `Command Palette → Dev Containers: Rebuild Container` を実行

### npm install が失敗する場合

コンテナ内で手動実行：

```bash
npm install --legacy-peer-deps
```

### Expo が起動しない場合

環境変数を確認：

```bash
echo $EXPO_DEVTOOLS_LISTEN_ADDRESS
# → 0.0.0.0 と表示されるべき
```

## カスタマイズ

プロジェクト固有の設定は `devcontainer.json` で変更できます：

- **拡張機能の追加**: `customizations.vscode.extensions`
- **VS Code 設定**: `customizations.vscode.settings`
- **ポート転送**: `forwardPorts`
- **起動後コマンド**: `postCreateCommand`, `postStartCommand`

## 参考リンク

- [Dev Containers ドキュメント](https://code.visualstudio.com/docs/devcontainers/containers)
- [Expo ドキュメント](https://docs.expo.dev/)
- [Claude Code ドキュメント](https://docs.claude.com/claude-code)
