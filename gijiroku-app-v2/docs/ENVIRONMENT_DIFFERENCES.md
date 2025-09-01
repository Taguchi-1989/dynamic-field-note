# 開発環境 vs リリース環境の詳細比較

## 🔄 環境判定の基準

```typescript
// 各ファイルでの環境判定方法
const isDevelopment = !app.isPackaged;  // window-manager.ts:7
const isPackaged = app.isPackaged;      // file-handler.ts:185
```

## 📊 環境別の設定比較

| 項目 | 開発環境 | リリース環境 |
|------|----------|-------------|
| **起動コマンド** | `npm run dev` | `議事録アプリ v2.exe` |
| **Node環境** | `NODE_ENV=development` | `NODE_ENV=production` |
| **パッケージ判定** | `app.isPackaged = false` | `app.isPackaged = true` |
| **DevTools** | 自動起動 | 無効化 |
| **Hot Reload** | あり | なし |

## 🗂️ ファイルパスの違い

### 1. HTMLファイルの読み込み

#### 開発環境
```typescript
// window-manager.ts:105-115
private async loadDevelopment(): Promise<void> {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  await this.mainWindow.loadURL(devServerUrl);
  this.mainWindow.webContents.openDevTools({ mode: 'detach' }); // DevTools起動
}
```
- **URL**: `http://localhost:5173`
- **ソース**: Vite開発サーバー
- **メリット**: Hot Reload、リアルタイム更新
- **デメリット**: サーバー起動必須

#### リリース環境
```typescript
// window-manager.ts:118-141
private async loadProduction(): Promise<void> {
  const indexPath = app.isPackaged 
    ? path.join(__dirname, '../dist/index.html')  // asar内相対パス
    : path.join(__dirname, '../../dist/index.html');
    
  await this.mainWindow.loadFile(indexPath);
}
```
- **パス**: `app.asar/dist-electron/../dist/index.html`
- **ソース**: パッケージ内HTMLファイル
- **メリット**: 独立実行、高速起動
- **デメリット**: 静的ファイルのみ

### 2. プロンプトテンプレートの読み込み

#### 開発環境
```typescript
// file-handler.ts:204-206
promptsDir = path.join(app.getAppPath(), 'resources', 'prompts');
```
- **実際のパス**: `C:\project\gijiroku-app-v2\resources\prompts\`
- **ファイル形式**: 直接ファイルシステム
- **アクセス方法**: 標準的なNode.js fs API

#### リリース環境
```typescript
// file-handler.ts:190-202
const asarPath = path.join(process.resourcesPath, 'app.asar');
promptsDir = path.join(asarPath, 'resources', 'prompts');
```
- **実際のパス**: `C:\Program Files\App\resources\app.asar\resources\prompts\`
- **ファイル形式**: ASAR アーカイブ内
- **アクセス方法**: Electron の asar サポート

### 3. アイコンファイルのパス

#### 開発環境
```typescript
// window-manager.ts:38-39
return path.join(process.cwd(), 'resources', 'icons', 'favicon.ico');
```
- **パス**: `プロジェクトルート/resources/icons/favicon.ico`

#### リリース環境
```typescript
// window-manager.ts:42
return path.join(process.resourcesPath, 'resources', 'icons', 'favicon.ico');
```
- **パス**: `インストールディレクトリ/resources/resources/icons/favicon.ico`

## 🔐 セキュリティとAPIキーの扱い

### 開発環境
```typescript
// AIProcessingService.ts:285-288
if (!apiKey && !isProduction) {
  // 開発環境のみ：フォールバックとして環境変数からAPIキーを取得
  apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  console.log('🔑 [開発環境] Using API key from environment variables');
}
```
- **APIキーソース**: 
  1. SecureStorage (第一優先)
  2. 環境変数 (.env, process.env)
- **セキュリティ**: 環境変数フォールバック有効

### リリース環境
```typescript
// AIProcessingService.ts:283-296
const isProduction = process.env.NODE_ENV === 'production' || process.env.VITE_FORCE_USER_API_KEYS === 'true';

if (!apiKey) {
  const message = isProduction 
    ? 'API key not configured. Please set your API key in Settings.'
    : 'API key not found in SecureStorage or environment variables';
  throw new Error(message);
}
```
- **APIキーソース**: SecureStorage のみ
- **セキュリティ**: 環境変数フォールバック無効
- **メリット**: APIキー漏洩防止

## 🛠️ ビルドプロセスの違い

### 開発環境起動
```bash
npm run dev
```
```bash
# 実際に実行される内容
concurrently "npm:dev:*"
├── npm run dev:vite     # Vite開発サーバー起動
└── npm run dev:electron # Electron起動 (Viteサーバー待機)
```

### リリース環境ビルド
```bash
npm run dist
```
```bash
# 実際に実行される内容
npm run build && electron-builder
├── npm run build:vite     # React → dist/
├── npm run build:electron # TypeScript → dist-electron/
└── electron-builder      # パッケージング → release/
```

## 📁 ディレクトリ構造の比較

### 開発環境
```
gijiroku-app-v2/
├── app/src/                    # ソースコード
│   ├── main/                   # Electronメイン
│   └── renderer/               # React UI
├── resources/                  # 直接アクセス可能
│   ├── prompts/               # プロンプトファイル
│   └── icons/                 # アイコン
├── dist/                      # Viteビルド出力 (開発時は未生成)
└── node_modules/              # 依存関係
```

### リリース環境 (パッケージ後)
```
release/win-unpacked/
├── 議事録アプリ v2.exe          # 実行ファイル
├── resources/
│   ├── app.asar               # アプリケーションアーカイブ
│   │   ├── dist/             # React UI (内包)
│   │   ├── dist-electron/    # Electronメイン (内包)
│   │   └── resources/        # リソースファイル (内包)
│   │       ├── prompts/      # プロンプトテンプレート
│   │       └── icons/        # アイコン
│   └── elevate.exe           # 権限昇格用
└── [その他Electron実行時ファイル]
```

## 🔄 IPC通信の動作確認

### 開発環境でのデバッグ
```typescript
// DevTools Console (F12)
console.log('Environment check:');
console.log('- isPackaged:', await window.electronAPI?.app?.isPackaged());
console.log('- Prompts API:', await window.electronAPI?.file?.loadPrompts());
```

### リリース環境での動作確認
```typescript
// main.cjs (Electronメインプロセスログ)
console.log('🔄 [DEBUG] App is packaged:', app.isPackaged);
console.log('📁 [DEBUG] Loading prompts from:', promptsDir);
console.log('📋 Found prompt files:', jsonFiles);
```

## ⚡ パフォーマンス比較

### 起動時間
- **開発環境**: 5-10秒 (Viteサーバー起動 + Electron初期化)
- **リリース環境**: 2-3秒 (Electronのみ起動)

### ファイルアクセス速度
- **開発環境**: 普通 (ファイルシステム直接アクセス)
- **リリース環境**: 高速 (ASARアーカイブから読み込み)

### メモリ使用量
- **開発環境**: 高 (DevTools + 開発サーバー)
- **リリース環境**: 低 (本体のみ)

## 🚨 環境固有の問題

### 開発環境で起こりがちな問題
1. **Viteサーバー接続エラー**: ポート5173が使用中
2. **Hot Reloadの不具合**: ファイル変更が反映されない
3. **APIキーの設定忘れ**: .envファイル未作成

### リリース環境で起こりがちな問題
1. **ASARパスエラー**: ファイルパス解決の失敗
2. **権限エラー**: インストールディレクトリへの書き込み
3. **依存関係不足**: ネイティブモジュールの欠損

## 📋 環境切り替え時のチェックリスト

### 開発 → リリース
- [ ] `npm run dist` でエラーなくビルド完了
- [ ] パッケージ版でプロンプトテンプレート表示確認
- [ ] API設定画面での設定保存確認  
- [ ] オフライン処理の動作確認
- [ ] PDF生成機能の動作確認

### リリース → 開発
- [ ] `npm install` で依存関係更新
- [ ] `npm run dev` で開発サーバー起動確認
- [ ] DevToolsでのデバッグ情報確認
- [ ] Hot Reloadの動作確認

## 🔧 環境固有のトラブルシューティング

### 開発環境のトラブル
```bash
# Viteサーバーが起動しない
npm run clean
npm install
npm run dev

# 変更が反映されない
Ctrl + Shift + R (強制再読み込み)
```

### リリース環境のトラブル
```bash
# パッケージが起動しない
npm run clean
npm run dist

# ファイルが見つからない
# asar内容確認
npx asar list "./release/win-unpacked/resources/app.asar"
```

---

**最終更新**: 2025-09-01  
**対象バージョン**: v2.0.2+  
**重要**: 環境に応じたパス解決とセキュリティ設定が正常動作の鍵