# プロジェクト構造 - 議事録アプリ v2

## 📁 整理後のフォルダ構造

### 🔧 **アプリケーションコア**
```
app/
├── src/
│   ├── main/          # Electronメインプロセス
│   │   ├── services/  # ビジネスロジック・サービス層
│   │   └── ipc/       # IPC通信ハンドラー
│   ├── renderer/      # React UI (レンダラープロセス)
│   │   ├── components/
│   │   └── services/
│   └── shared/        # 共有ユーティリティ・型定義
```

### 📦 **ビルド・設定**
```
dist/              # Viteビルド出力 (React)
dist-electron/     # Electronビルド出力
release/           # 配布用パッケージ
public/            # 静的ファイル
resources/         # アプリケーションリソース
```

### 📚 **ドキュメント**
```
docs/              # 技術ドキュメント (新)
├── CURRENT_ISSUES.md
├── FEATURE_STATUS.md
├── ENVIRONMENT_DIFFERENCES.md
└── ELECTRON_GUIDE.md

project-docs/      # プロジェクトドキュメント (整理済み)
└── legacy/        # レガシードキュメント
```

### 🧪 **テスト・開発**
```
testing/           # テスト関連 (整理済み)
├── legacy-tests/  # 過去のテストファイル
└── sample-data/   # テスト用データ

tests/             # 現行テストスイート
temp-files/        # 一時ファイル (整理済み)
```

### 📋 **プロジェクト管理**
```
.github/           # GitHub Actions・ワークフロー
archive/           # アーカイブ機能
scripts/           # ビルド・開発用スクリプト
```

## 🗑️ **削除されたファイル・フォルダ**

### 削除済み
- `electron_log*.txt` - デバッグログ
- `main.cjs` - 古いビルドファイル
- `nul` - 無効ファイル
- `.serena/` - 不要なキャッシュ
- `workspace/` - 古いワークスペース
- `playwright-report/` - テスト結果
- `test-results/` - テスト結果
- `screenshots/` - スクリーンショット

### 整理・移動済み
- `test-*.js`, `test-*.vtt` → `testing/legacy-tests/`
- `FEATURE_REQUIREMENTS.md`, `masterfile.md` → `project-docs/legacy/`
- `temp_extract/`, `temp-check/` → `temp-files/`

## 📄 **残存ファイル (15個)**

### 設定・ビルド
- `package.json`, `package-lock.json`
- `tsconfig.json`, `vite.config.ts`, `tsup.config.ts`
- `electron-builder.json`, `electron-builder.yml`
- `playwright.config.ts`

### プロジェクト
- `README.md`, `CLAUDE.md`, `.claude.md`
- `index.html`

### 環境
- `.env`, `.env.production`, `.gitignore`

## 🎯 **MVPフォーカス**

### **有効フォルダ (MVP開発)**
- `app/src/` - メインアプリケーション
- `docs/` - 技術仕様書
- 設定ファイル群

### **無効化フォルダ (整理済み)**
- `testing/legacy-tests/` - 過去のテスト
- `project-docs/legacy/` - 古いドキュメント
- `temp-files/` - 一時ファイル置き場

### **自動除外 (.gitignore)**
- ビルド出力・キャッシュ
- 一時ファイル・ログ
- 開発環境固有ファイル

## 📊 **整理の成果**

### **削減実績**
- **ルートファイル数**: 40+ → 15 (62%削減)
- **不要フォルダ**: 5個削除
- **整理フォルダ**: 3個新設

### **メリット**
- ✅ プロジェクト構造の明確化
- ✅ MVP開発への集中
- ✅ ビルド・デプロイの高速化
- ✅ 新規開発者のオンボーディング改善

---

**最終更新**: 2025-09-01  
**整理完了**: プロジェクトフォルダ構造最適化 ✅