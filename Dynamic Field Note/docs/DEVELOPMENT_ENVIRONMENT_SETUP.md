# 🛠️ Dynamic Field Note - 開発環境セットアップガイド

**最終更新**: 2025-10-18
**対象環境**: WSL2 / Linux / macOS

このガイドでは、実機がない環境でもDynamic Field Noteの開発・テストができる環境の構築方法を説明します。

---

## 📋 目次

1. [環境要件](#環境要件)
2. [開発環境の種類](#開発環境の種類)
3. [セットアップ手順](#セットアップ手順)
4. [開発サーバーの起動](#開発サーバーの起動)
5. [テスト実行](#テスト実行)
6. [トラブルシューティング](#トラブルシューティング)

---

## 環境要件

### 必須
- **Node.js**: 20.x以上
- **npm**: 10.x以上
- **Git**: 2.x以上

### 推奨
- **VSCode**: 最新版
- **VSCode拡張機能**:
  - ESLint
  - Prettier
  - React Native Tools
  - TypeScript and JavaScript Language Features

---

## 開発環境の種類

### 🌐 Option 1: Web開発環境（最も簡単）

**推奨度**: ⭐⭐⭐⭐⭐
**メリット**:
- ✅ 追加ツール不要
- ✅ 高速な開発サイクル
- ✅ ChromeDevToolsでデバッグ可能

**デメリット**:
- ❌ ネイティブ機能（カメラ、SQLite）は制限あり

**用途**: UI開発、ロジック開発、基本動作確認

---

### 📱 Option 2: Expo Go（実機テスト）

**推奨度**: ⭐⭐⭐⭐
**メリット**:
- ✅ 実機で動作確認
- ✅ ネイティブ機能の一部が利用可能
- ✅ セットアップ簡単

**デメリット**:
- ❌ カスタムネイティブモジュールは不可
- ❌ スマートフォンが必要

**用途**: UI/UX確認、基本機能テスト

---

### 🍎 Option 3: iOS Simulator（macOSのみ）

**推奨度**: ⭐⭐⭐⭐⭐（macOS環境）
**メリット**:
- ✅ 完全なiOS環境
- ✅ ネイティブ機能全て利用可能
- ✅ 実機なしでテスト可能

**必須**:
- macOS
- Xcode（App Storeから無料）

**用途**: 本格的なiOS開発、実機前の最終確認

---

### 🤖 Option 4: Android Emulator（任意）

**推奨度**: ⭐⭐⭐
**メリット**:
- ✅ Android環境で動作確認
- ✅ WSL2でも利用可能

**必須**:
- Android Studio
- 仮想デバイス（AVD）

**用途**: Android開発、クロスプラットフォーム確認

---

## セットアップ手順

### 1. リポジトリクローン

```bash
git clone https://github.com/Taguchi-1989/dynamic-field-note.git
cd "Dynamic Field Note"
```

### 2. 依存関係インストール

```bash
npm install
```

**所要時間**: 約2-5分

### 3. 環境変数設定（オプション）

```bash
# .env.local ファイル作成（必要に応じて）
cp .env.example .env.local

# Gemini API Key設定（Phase 1以降）
# GEMINI_API_KEY=your-api-key-here
```

### 4. 開発環境選択

#### 🌐 Web開発環境（推奨）

```bash
npm run web
```

ブラウザが自動で開き、`http://localhost:8081` でアプリが表示されます。

**確認項目**:
- [ ] ホーム画面が表示される
- [ ] ナビゲーションが動作する
- [ ] コンソールにエラーがない

---

#### 📱 Expo Go（実機テスト）

**手順**:

1. **スマートフォンにExpo Goアプリをインストール**
   - iOS: App Store
   - Android: Google Play

2. **開発サーバー起動**
   ```bash
   npm start
   ```

3. **QRコードをスキャン**
   - iOS: カメラアプリでスキャン
   - Android: Expo Goアプリでスキャン

**確認項目**:
- [ ] アプリが起動する
- [ ] 基本的な画面遷移が動作する
- [ ] タッチ操作が正常

**注意**: WSL2の場合、トンネルモードが必要な場合があります：
```bash
npx expo start --tunnel
```

---

#### 🍎 iOS Simulator（macOSのみ）

**前提条件**:
```bash
# Xcodeインストール確認
xcode-select --version

# Xcodeインストールされていない場合
# App StoreからXcodeをインストール
```

**手順**:

1. **iOSシミュレータ起動**
   ```bash
   npm run ios
   ```

2. **初回ビルド**（5-10分かかります）
   - Expoが自動的にシミュレータにアプリをインストール
   - Metro Bundlerが起動

**確認項目**:
- [ ] シミュレータでアプリが起動
- [ ] カメラ権限のアラート（許可する）
- [ ] SQLiteデータベース動作確認

**トラブルシューティング**:
```bash
# キャッシュクリア
npx expo start --clear

# シミュレータリセット
xcrun simctl erase all
```

---

#### 🤖 Android Emulator（オプション）

**前提条件**:
```bash
# Android Studioインストール
# https://developer.android.com/studio

# AVD（仮想デバイス）作成
# Android Studio > Tools > AVD Manager
```

**手順**:

1. **AVD起動**（Android Studioから）

2. **アプリ起動**
   ```bash
   npm run android
   ```

**WSL2での注意**:
```bash
# WSL2からWindows側のADBを使用
export ANDROID_HOME=/mnt/c/Users/YOUR_USERNAME/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 開発サーバーの起動

### 基本コマンド

```bash
# 全プラットフォーム対応の開発サーバー起動
npm start

# Web専用
npm run web

# iOS Simulator（macOS）
npm run ios

# Android Emulator
npm run android
```

### 開発サーバーのオプション

```bash
# キャッシュクリア
npx expo start --clear

# トンネルモード（外部ネットワークから接続）
npx expo start --tunnel

# LAN経由（WSL2推奨）
npx expo start --lan

# オフラインモード
npx expo start --offline
```

---

## テスト実行

### Unit Tests（単体テスト）

```bash
# 全テスト実行
npm run test

# Watchモード（ファイル変更時に自動実行）
npm run test:watch

# カバレッジレポート付き
npm run test:coverage
```

### E2E Tests（統合テスト）

```bash
# Smokeテスト（基本動作確認）
npm run test:smoke

# Comprehensiveテスト（包括的テスト）
npm run test:comprehensive

# 全E2Eテスト
npm run test:local
```

### Lint & Format

```bash
# コード品質チェック
npm run lint

# 自動修正
npm run lint:fix

# フォーマット確認
npm run format:check

# 自動フォーマット
npm run format

# 型チェック
npm run type-check

# 全チェック（推奨）
npm run validate
```

---

## 開発ワークフロー

### 推奨手順

1. **開発サーバー起動**
   ```bash
   npm run web
   # または
   npm start
   ```

2. **コード編集**
   - `src/` 配下のファイルを編集
   - ホットリロードで即座に反映

3. **定期的なバリデーション**
   ```bash
   npm run validate  # Lint + 型チェック
   npm run test:smoke  # Smokeテスト
   ```

4. **コミット前チェック**
   ```bash
   npm run guardrails  # 全チェック + Smokeテスト
   ```

---

## トラブルシューティング

### 問題1: Metro Bundlerが起動しない

**症状**: `npm start` でエラー

**解決策**:
```bash
# キャッシュクリア
npx expo start --clear

# node_modules再インストール
rm -rf node_modules
npm install

# Watchmanキャッシュクリア（macOS/Linux）
watchman watch-del-all
```

---

### 問題2: Expo Goで接続できない（WSL2）

**症状**: QRコードスキャン後に接続エラー

**解決策**:
```bash
# トンネルモード使用
npx expo start --tunnel

# または、WSL2のIPアドレスを使用
# 1. WSL2のIPを確認
ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'

# 2. スマホが同じWi-Fiに接続されていることを確認
# 3. --lan オプションで起動
npx expo start --lan
```

---

### 問題3: TypeScriptエラーが消えない

**症状**: VSCodeでエラー表示が残る

**解決策**:
```bash
# TypeScriptサーバー再起動
# VSCode: Cmd/Ctrl + Shift + P
# > TypeScript: Restart TS Server

# または
npm run type-check
```

---

### 問題4: テストが失敗する

**症状**: `npm test` でエラー

**解決策**:
```bash
# Jestキャッシュクリア
npx jest --clearCache

# 特定のテストのみ実行
npm test -- path/to/test.test.ts

# Verboseモードで詳細確認
npm test -- --verbose
```

---

## 環境別推奨設定

### WSL2（Windows）

**推奨**: Web開発 + Expo Go（スマホ）

```bash
# WSL2のメモリ制限設定（.wslconfig）
# C:\Users\YOUR_USERNAME\.wslconfig
[wsl2]
memory=8GB
processors=4
```

**起動コマンド**:
```bash
# Web開発
npm run web

# Expo Go（トンネル経由）
npx expo start --tunnel
```

---

### macOS

**推奨**: Web開発 + iOS Simulator

```bash
# Xcodeインストール後
npm run ios
```

**追加設定**:
```bash
# Homebrew（パッケージマネージャ）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Watchman（ファイル監視）
brew install watchman
```

---

### Linux

**推奨**: Web開発 + Android Emulator（または Expo Go）

```bash
# Android Studio設定
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## 次のステップ

開発環境が整ったら：

1. ✅ **Phase 1**: PoC実装（音声入力、Gemini連携）
2. ✅ **Phase 2**: UI/UX整備
3. ✅ **Phase 3**: ローカル保存（SQLite実装済み）
4. 🔜 **Phase 4**: Azure連携

詳細は [ROADMAP.md](./ROADMAP.md) を参照してください。

---

## 関連ドキュメント

- [プロジェクト概要](../README.md)
- [開発ロードマップ](./ROADMAP.md)
- [イシュー管理ガイド](./ISSUE_MANAGEMENT_GUIDE.md)
- [テストガイド](./e2e-testing.md)

---

**質問・問題がある場合は、新しいイシューを作成してください！**
