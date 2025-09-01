# Electron環境完全ガイド

## 📋 目次
1. [Electron基礎概念](#electron基礎概念)
2. [プロセス構造](#プロセス構造)
3. [開発環境セットアップ](#開発環境セットアップ)
4. [IPC通信パターン](#ipc通信パターン)
5. [セキュリティ設定](#セキュリティ設定)
6. [ビルド・パッケージング](#ビルドパッケージング)
7. [デバッグ・トラブルシューティング](#デバッグトラブルシューティング)

## ⚡ Electron基礎概念

### Electronとは
- **定義**: ChromiumとNode.jsを組み合わせたデスクトップアプリフレームワーク
- **利点**: Web技術でネイティブアプリを開発、OSのAPIにアクセス可能
- **アーキテクチャ**: マルチプロセス構造（メインプロセス + レンダラープロセス）

### 本プロジェクトでの使用バージョン
```json
{
  "devDependencies": {
    "electron": "^37.4.0",
    "electron-builder": "^26.0.12"
  }
}
```

## 🏗️ プロセス構造

### 1. メインプロセス (Main Process)
**役割**: アプリケーションの制御、ウィンドウ管理、システムAPI

**主要ファイル**:
```
app/src/main/
├── index.ts                    # エントリーポイント
├── services/
│   ├── window-manager.ts       # ウィンドウ作成・管理
│   ├── AIProcessingService.ts  # ビジネスロジック
│   └── SecureStorageService.ts # データ保存
└── ipc/
    └── file-handler.ts         # IPCハンドラー
```

**主要責任**:
```typescript
// index.ts - アプリケーション初期化
app.whenReady().then(async () => {
  await securityPolicy.initialize();     // セキュリティ
  await workspaceService.initIfNeeded(); // ワークスペース
  await dbService.initialize();          // データベース
  setupIPCHandlers();                    // IPC設定
  await windowManager.createMainWindow(); // ウィンドウ作成
});
```

### 2. レンダラープロセス (Renderer Process)
**役割**: UI表示、ユーザーインタラクション

**主要ファイル**:
```
app/src/renderer/
├── components/
│   ├── PromptSelector.tsx      # プロンプト選択
│   └── sections/
│       └── InputSection.tsx   # テキスト入力
├── config/
│   └── api.ts                  # API設定
└── index.tsx                   # Reactエントリーポイント
```

### 3. プリロードスクリプト (Preload Script)
**役割**: セキュアなIPC通信のブリッジ

**ファイル**: `app/src/main/preload.ts`
```typescript
// contextBridge経由でAPIを安全に公開
contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    loadPrompts: () => ipcRenderer.invoke('file:load-prompts'),
    readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    // ...
  },
  // ...
});
```

## 🛠️ 開発環境セットアップ

### 必要な環境
- **Node.js**: v18以上
- **npm**: 最新版推奨
- **Windows**: 10/11 (主開発環境)

### 初期セットアップ
```bash
# プロジェクトクローン
git clone <repository>
cd gijiroku-app-v2

# 依存関係インストール
npm install

# 開発環境起動
npm run dev
```

### 開発用コマンド一覧
```bash
# 開発サーバー起動 (Hot Reload)
npm run dev

# フロントエンドのみビルド
npm run build:vite

# Electronのみビルド  
npm run build:electron

# 全体ビルド
npm run build

# リリース用パッケージング
npm run dist

# クリーンビルド
npm run clean && npm run dist
```

### ディレクトリ構造
```
gijiroku-app-v2/
├── app/src/                    # アプリケーションソース
├── resources/                  # 静的リソース
├── dist/                      # フロントエンドビルド出力
├── dist-electron/             # Electronビルド出力
├── release/                   # パッケージ出力
├── docs/                      # ドキュメント
├── package.json               # プロジェクト設定
├── tsconfig.json             # TypeScript設定
├── electron-builder.yml      # パッケージング設定
└── tsup.config.ts           # ビルド設定
```

## 🔄 IPC通信パターン

### IPC (Inter-Process Communication)
レンダラープロセスとメインプロセス間の安全な通信手段

### 1. 基本的なIPC実装パターン

#### Step 1: メインプロセスでハンドラー作成
```typescript
// app/src/main/ipc/file-handler.ts
import { ipcMain } from 'electron';

ipcMain.handle('file:load-prompts', async () => {
  try {
    // ファイル読み込み処理
    const prompts = await loadPromptsFromDisk();
    return { success: true, data: { prompts } };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
```

#### Step 2: プリロードでAPI公開
```typescript
// app/src/main/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  file: {
    loadPrompts: () => ipcRenderer.invoke('file:load-prompts')
  }
});
```

#### Step 3: レンダラーから呼び出し
```typescript
// app/src/renderer/components/PromptSelector.tsx
const loadPrompts = async () => {
  const result = await window.electronAPI?.file?.loadPrompts();
  if (result?.success) {
    setTemplates(result.data.prompts);
  }
};
```

### 2. 型安全なIPC実装

#### 共有型定義
```typescript
// app/src/shared/ipc-schemas.ts
export interface IPCResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  content: string;
}
```

#### 型安全なAPI定義
```typescript
// app/src/main/preload.ts
interface ElectronAPI {
  file: {
    loadPrompts: () => Promise<IPCResponse<{ prompts: PromptTemplate[] }>>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

### 3. エラーハンドリングパターン
```typescript
// 統一エラーハンドリング
const safeIPCCall = async <T>(operation: () => Promise<T>): Promise<IPCResponse<T>> => {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    console.error('IPC Error:', error);
    return { success: false, error: error.message };
  }
};
```

## 🔐 セキュリティ設定

### 1. ウィンドウセキュリティ設定
```typescript
// app/src/main/services/window-manager.ts
webPreferences: {
  nodeIntegration: false,        // Nodeアクセス無効
  contextIsolation: true,        // コンテキスト分離
  enableRemoteModule: false,     // リモートモジュール無効
  sandbox: true,                 // サンドボックス有効
  webSecurity: true,             // ウェブセキュリティ有効
  preload: path.join(__dirname, 'preload.cjs')
}
```

### 2. セキュリティポリシー
```typescript
// app/src/main/security/security-policy.ts
export class SecurityPolicy {
  async initialize() {
    // CSP設定
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ['default-src \'self\' \'unsafe-inline\'']
        }
      });
    });
  }
}
```

### 3. 外部ナビゲーション制限
```typescript
// window-manager.ts
this.mainWindow.webContents.on('will-navigate', (event, url) => {
  if (!this.isDevelopment && !url.startsWith('file://')) {
    event.preventDefault();
    console.warn('🚫 Blocked navigation to:', url);
  }
});
```

## 📦 ビルド・パッケージング

### 1. electron-builder設定
```yaml
# electron-builder.yml
appId: com.gijiroku.app.v2
productName: 議事録アプリ v2
directories:
  buildResources: ./resources
  output: ./release
files:
  - dist/**/*
  - dist-electron/**/*
  - resources/**/*
  - package.json
asar: true                    # ASARアーカイブ使用
compression: normal
```

### 2. ビルドプロセス詳細
```bash
npm run dist
├── npm run build:vite     # React → dist/
├── npm run build:electron # TypeScript → dist-electron/  
└── electron-builder      # パッケージング → release/
```

### 3. ASAR (Electron Archive)
```bash
# ASAR内容確認
npx asar list "./release/win-unpacked/resources/app.asar"

# ASAR展開（デバッグ用）
npx asar extract "./release/win-unpacked/resources/app.asar" "./temp_extract/"
```

### 4. パッケージ構造
```
release/win-unpacked/
├── 議事録アプリ v2.exe          # メイン実行ファイル
├── resources/
│   ├── app.asar               # アプリアーカイブ
│   │   ├── dist/             # React UI
│   │   ├── dist-electron/    # Electronメイン
│   │   └── resources/        # リソース
│   └── elevate.exe           # 権限昇格用
├── locales/                  # 言語ファイル
├── chrome_*.pak             # Chromium関連
└── [その他Electron実行ファイル]
```

## 🔧 デバッグ・トラブルシューティング

### 1. 開発時のデバッグ

#### DevToolsでのデバッグ
```typescript
// 開発環境では自動でDevTools起動
// window-manager.ts:110
this.mainWindow.webContents.openDevTools({ mode: 'detach' });
```

#### コンソールログ
```typescript
// レンダラープロセス (DevTools Console)
console.log('レンダラーからのログ');

// メインプロセス (Terminal)
console.log('メインプロセスからのログ');
```

### 2. IPC通信のデバッグ
```typescript
// プロンプト読み込み状況確認
console.log('🔄 IPC Call result:', await window.electronAPI?.file?.loadPrompts());

// ファイルアクセス確認
console.log('📁 App paths:', {
  appPath: await window.electronAPI?.app?.getPath('userData'),
  isPackaged: await window.electronAPI?.app?.isPackaged()
});
```

### 3. よくある問題と解決法

#### 問題1: 白画面が表示される
```typescript
// 原因確認
this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc) => {
  console.error('❌ Load failed:', { errorCode, errorDesc });
});

// 解決法
// 1. HTMLファイルパス確認
// 2. プリロードスクリプトパス確認
// 3. セキュリティ設定確認
```

#### 問題2: IPCが動作しない
```typescript
// デバッグ用確認コード
console.log('ElectronAPI available:', !!window.electronAPI);
console.log('File API available:', !!window.electronAPI?.file);
```

#### 問題3: ファイルが見つからない
```typescript
// パス確認用
console.log('Current working directory:', process.cwd());
console.log('App path:', app.getAppPath());
console.log('User data path:', app.getPath('userData'));
```

### 4. パフォーマンス最適化

#### メモリ使用量確認
```typescript
// メインプロセス
console.log('Memory usage:', process.memoryUsage());

// レンダラープロセス (DevTools Performance tab)
performance.mark('start');
// 処理...
performance.mark('end');
performance.measure('operation', 'start', 'end');
```

#### 起動時間短縮
```typescript
// 非同期初期化
await Promise.all([
  secureStorageService.initialize(),
  dbService.initialize(),
  // ... 並列実行可能な初期化処理
]);
```

## 📚 参考資料とベストプラクティス

### 公式ドキュメント
- [Electron公式サイト](https://www.electronjs.org/)
- [electron-builderドキュメント](https://www.electron.build/)

### セキュリティベストプラクティス
1. **contextIsolation**: 必須有効化
2. **nodeIntegration**: 必須無効化  
3. **sandbox**: 推奨有効化
4. **プリロードスクリプト**: IPC通信の唯一の窓口

### パフォーマンスベストプラクティス
1. **ASAR**: ファイルアクセス高速化
2. **コード分割**: 必要な機能のみロード
3. **メモリ管理**: 不要なオブジェクトのcleanup

---

**最終更新**: 2025-09-01  
**対象**: Electron 37.4.0  
**重要**: セキュリティ設定とIPC通信が正常動作の核心