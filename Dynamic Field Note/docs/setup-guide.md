# 🛠️ Dynamic Field Note - 開発環境構築ガイド

このガイドでは、Dynamic Field Note の開発環境をセットアップする手順を説明します。

---

## 📋 前提条件

- Windows 10/11 または macOS 10.15以上
- インターネット接続

---

## 🔧 必須ソフトウェアのインストール

### 1. Node.js のインストール

**必須バージョン**: Node.js v20以上

#### Windows
1. [Node.js公式サイト](https://nodejs.org/)から LTS版をダウンロード
2. インストーラーを実行
3. コマンドプロンプトで確認:
   ```bash
   node --version  # v20.x.x 以上
   npm --version   # 10.x.x 以上
   ```

#### macOS
```bash
# Homebrewを使用
brew install node@20

# または公式サイトからダウンロード
```

### 2. Git のインストール

#### Windows
1. [Git公式サイト](https://git-scm.com/)からダウンロード
2. インストーラーを実行
3. 確認:
   ```bash
   git --version
   ```

#### macOS
```bash
# Xcodeコマンドラインツール
xcode-select --install
```

### 3. VS Code のインストール

1. [Visual Studio Code](https://code.visualstudio.com/)をダウンロード
2. インストール
3. 確認:
   ```bash
   code --version
   ```

---

## 🔌 VS Code 拡張機能

VS Codeを開き、以下の拡張機能をインストールしてください:

### 必須拡張機能
1. **ESLint** (`dbaeumer.vscode-eslint`)
   - JavaScriptとTypeScriptのリンター
2. **Prettier - Code formatter** (`esbenp.prettier-vscode`)
   - コードフォーマッター
3. **React Native Tools** (`msjsdiag.vscode-react-native`)
   - React Native開発サポート
4. **TypeScript Vue Plugin (Volar)** (`vue.volar`)
   - TypeScript言語サポート

### 推奨拡張機能
- **GitLens** (`eamodio.gitlens`) - Git統合強化
- **Path Intellisense** (`christian-kohler.path-intellisense`) - パス補完
- **Auto Rename Tag** (`formulahendry.auto-rename-tag`) - HTMLタグの自動リネーム

---

## 📦 プロジェクトのセットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/Taguchi-1989/dynamic-field-note.git
cd dynamic-field-note/DynamicFieldNote
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

プロジェクトルートに `.env.local` ファイルを作成:

```env
# Gemini API Key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# GPT API Key (Phase 5で使用)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Azure Functions URL (Phase 4で使用)
EXPO_PUBLIC_AZURE_FUNCTIONS_URL=https://your-functions.azurewebsites.net
```

⚠️ **注意**: `.env.local` はGitにコミットしないでください（`.gitignore`に含まれています）

---

## 🚀 開発サーバーの起動

### Expo Go（推奨: 開発初期）

```bash
npm start
```

- スマートフォンに[Expo Go](https://expo.dev/client)アプリをインストール
- QRコードをスキャンしてアプリを起動

### iOS Simulator（macOS のみ）

```bash
npm run ios
```

### Android Emulator

```bash
npm run android
```

---

## 🧪 コードの検証

### TypeScript型チェック

```bash
npx tsc --noEmit
```

### ESLint実行

```bash
npm run lint
```

---

## 📱 実機ビルド（Phase 0-3）

iPhone 12での実機ビルドについては、[build-guide.md](./build-guide.md)を参照してください。

---

## 🔑 API Keyの取得

### Gemini API（Phase 1で必要）

1. [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. 「Get API Key」をクリック
3. APIキーを`.env.local`に設定

### OpenAI API（Phase 5で必要）

1. [OpenAI Platform](https://platform.openai.com/api-keys)にアクセス
2. 「Create new secret key」をクリック
3. APIキーを`.env.local`に設定

---

## 🛠️ トラブルシューティング

### `npm install` が失敗する

```bash
# キャッシュをクリア
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Expo が起動しない

```bash
# Expoグローバルパッケージを再インストール
npm install -g expo-cli
```

### TypeScriptエラーが消えない

```bash
# TypeScriptサーバーを再起動
VS Codeで Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Metro Bundler エラー

```bash
# Metro キャッシュをクリア
npm start -- --clear
```

---

## 📚 参考リンク

- [React Native 公式ドキュメント](https://reactnative.dev/)
- [Expo ドキュメント](https://docs.expo.dev/)
- [TypeScript ハンドブック](https://www.typescriptlang.org/docs/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

---

## ✅ セットアップ完了チェックリスト

Phase 0の完了基準:

- [ ] Node.js v20以上がインストールされている
- [ ] Git が動作する
- [ ] VS Code がインストールされている
- [ ] 必須拡張機能がインストールされている
- [ ] プロジェクトの依存関係がインストールされている
- [ ] `npm start` でExpo開発サーバーが起動する
- [ ] TypeScript コンパイルエラーがない

全てチェックできたら、[Issue #1](https://github.com/Taguchi-1989/dynamic-field-note/issues/1)をCloseして、Phase 1（PoC）に進みましょう！

---

**次のステップ**: [Phase 1 - PoC](../ROADMAP.md#phase-1-poc2週間)
