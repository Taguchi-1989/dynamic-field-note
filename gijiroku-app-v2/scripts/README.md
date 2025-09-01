# 開発用スクリプト集

議事録アプリ v2 のMVP開発をサポートする開発用スクリプトです。

## 📋 利用可能なスクリプト

### 1. 環境セットアップ (`dev-setup.js`)
開発環境の準備状況を確認し、不足項目を特定します。

```bash
# 環境チェック実行
npm run setup
# または
node scripts/dev-setup.js
```

**機能:**
- ✅ 基本ファイル確認 (package.json, tsconfig.json, etc.)
- ✅ 開発ツール確認 (Node.js, npm, TypeScript, Electron)
- ✅ VSCode設定確認 (.vscode/settings.json, etc.)
- ✅ MVP機能フォルダ確認 (app/src/main, app/src/renderer, etc.)
- ✅ 環境完成度スコア表示

**出力例:**
```
🎯 開発環境完成度: 100% (17/17)
✅ MVP開発環境の準備が完了しています！
```

### 2. Feature Flag管理 (`feature-toggle.js`)
MVP vs 拡張機能の切り替え・確認を行います。

```bash
# 現在の状態表示
npm run features
# または
node scripts/feature-toggle.js status

# MVP開発モードに切り替え
node scripts/feature-toggle.js mvp

# フル開発モードに切り替え
node scripts/feature-toggle.js full

# 個別機能の切り替え
node scripts/feature-toggle.js searchFunction true
```

**機能:**
- 🚀 MVP機能: apiKeys, pdfGeneration, customPrompts, chunkingProcessing, retryExecution
- 🔧 高度機能: searchFunction, dictionaryFunction, logFunction, syncFunction
- 📈 拡張機能: imageSupport, latexSupport, mermaidSupport

### 3. デバッグヘルパー (`debug-helper.js`)
開発時の問題特定・状態確認をサポートします。

```bash
# 全チェック実行
npm run debug
# または
node scripts/debug-helper.js

# 個別チェック
npm run debug:build       # ビルドファイル確認
npm run debug:features    # Feature Flags確認
npm run debug:logs        # ログファイル確認
npm run debug:processes   # Electronプロセス確認
```

**機能:**
- 🔍 Electronプロセス監視
- 📦 ビルドファイル状態確認
- 🎯 Feature Flags状態表示
- 📋 ログファイル確認
- 📚 依存関係確認

## 🚀 推奨ワークフロー

### 初回セットアップ
```bash
1. npm run setup          # 環境確認
2. npm run features       # Feature Flags確認
3. npm run debug         # デバッグ情報確認
4. npm run mvp           # MVP開発モード開始
```

### 日常開発
```bash
1. npm run debug:processes # プロセス確認
2. npm run dev            # 開発サーバー起動
3. F5                     # VSCodeでデバッグ開始
```

### トラブルシューティング
```bash
1. npm run debug:build    # ビルド状態確認
2. npm run debug:logs     # ログ確認
3. npm run clean          # クリーンビルド
4. npm run setup          # 環境再確認
```

## 📁 スクリプト構成

```
scripts/
├── README.md           # このファイル
├── dev-setup.js       # 環境セットアップ確認
├── feature-toggle.js  # Feature Flag管理
└── debug-helper.js    # デバッグ支援
```

## 🛠️ 開発者向け情報

### スクリプトの拡張
新しい開発支援機能を追加する場合:

1. `scripts/` フォルダに新しいスクリプトを作成
2. `package.json` の `scripts` セクションに追加
3. このREADMEに使用方法を記載

### コードスタイル
- ES Modules使用 (import/export)
- async/await推奨
- カラーコンソール出力対応
- エラーハンドリング必須

---

**最終更新**: 2025-09-01  
**対象バージョン**: 議事録アプリ v2.0.2+  
**作成者**: Claude (開発環境最適化)