# 現状の問題と解決済み項目

## 📊 問題の全体像

### ✅ 解決済みの問題

#### 1. APIキー漏洩問題
- **問題**: リリース版にAPIキーが含まれるセキュリティリスク
- **解決**: 本番環境から開発用APIキーを完全除外
- **関連ファイル**: `AIProcessingService.ts:283-296, 340-353`
- **検証**: リリース版でAPIキーが存在しないことを確認済み

#### 2. プロンプトテンプレート502エラー
- **問題**: 外部API呼び出しによる502エラー
- **原因**: `PromptSelector.tsx:123-134`で古いAPI呼び出し
- **解決**: 外部API呼び出しを削除、モックデータに完全移行
- **修正内容**: IPC失敗時のフォールバック処理を簡素化

#### 3. プロンプトテンプレート読み込み機能
- **問題**: リリース版でapp.asar内のファイルにアクセスできない
- **解決**: `file-handler.ts:189-209`でパス解決を改善
- **実装**: 開発/リリース環境の自動判定とパス切り替え

#### 4. 自動プロバイダー選択機能
- **実装済み**: `AIProcessingService.ts:600-622`
- **動作**: APIキー存在時の自動プロバイダー切り替え
- **フォールバック**: APIキーなし → オフライン処理

### ⚠️ 継続調査が必要な問題

#### 1. 再起動時の文字入力問題
- **現象**: アプリ再起動後にテキスト入力フィールドにフォーカスできない
- **推定原因**: Electronのフォーカス管理またはレンダリング問題
- **影響範囲**: 
  - `InputSection.tsx:204-218` (直接テキスト入力フィールド)
  - `window-manager.ts:78-86` (ready-to-show時のフォーカス処理)
- **調査ポイント**:
  - Electronのフォーカス管理メソッド
  - レンダラープロセスのイベントハンドリング
  - 初期化タイミングの問題

#### 2. テンプレート消失問題
- **現象**: 再起動後にプロンプトテンプレート選択肢が表示されない
- **推定原因**: IPC通信またはコンポーネント初期化のタイミング問題
- **影響範囲**:
  - `PromptSelector.tsx:41-136` (fetchTemplates関数)
  - `file-handler.ts:182-225` (IPCハンドラー)
- **調査ポイント**:
  - IPCの初期化順序
  - コンポーネントのマウントタイミング
  - キャッシュの有効性

## 🏗️ ファイル構造と責任範囲

### メインプロセス (Electron)
```
app/src/main/
├── index.ts                    # アプリケーションエントリーポイント
├── services/
│   ├── window-manager.ts       # ウィンドウ作成・管理
│   ├── AIProcessingService.ts  # AI処理・プロバイダー選択
│   └── SecureStorageService.ts # APIキー保存
└── ipc/
    └── file-handler.ts         # プロンプト読み込み
```

### レンダラープロセス (React)
```
app/src/renderer/
├── components/
│   ├── PromptSelector.tsx      # プロンプト選択UI
│   └── sections/
│       └── InputSection.tsx   # テキスト入力UI
└── config/
    └── api.ts                  # API設定
```

### 共有ユーティリティ
```
app/src/shared/
├── ipc-schemas.ts             # IPC通信の型定義
└── utils/
    └── vtt.ts                 # VTTファイル処理
```

## 🔄 開発環境 vs リリース環境

### 開発環境 (`npm run dev`)
- **プロンプト読み込み**: `プロジェクトルート/resources/prompts/`
- **HTMLファイル**: Vite devサーバー (`http://localhost:5173`)
- **デバッグ**: DevTools自動起動
- **パス解決**: `app.getAppPath() + '/resources'`

### リリース環境 (パッケージ版)
- **プロンプト読み込み**: `app.asar/resources/prompts/`
- **HTMLファイル**: `dist-electron/../dist/index.html`
- **デバッグ**: 無効化
- **パス解決**: `process.resourcesPath + '/app.asar'`

### 環境判定コード
```typescript
// window-manager.ts:7
const isDevelopment = !app.isPackaged;

// file-handler.ts:185-209
const isPackaged = app.isPackaged;
const promptsDir = isPackaged 
  ? path.join(asarPath, 'resources', 'prompts')  // リリース版
  : path.join(app.getAppPath(), 'resources', 'prompts');  // 開発版
```

## ⚡ Electron環境の使い方

### 基本コマンド
```bash
# 開発環境起動
npm run dev

# リリースビルド
npm run dist

# クリーンビルド
npm run clean && npm run dist
```

### プロセス構造
- **メインプロセス**: Node.js環境、システムAPI、ウィンドウ管理
- **レンダラープロセス**: Chromium環境、React UI、セキュリティサンドボックス
- **IPC通信**: プロセス間のデータ交換

### セキュリティ設定
```typescript
// window-manager.ts:58-67
webPreferences: {
  nodeIntegration: false,     // セキュリティ
  contextIsolation: true,     // プロセス分離
  enableRemoteModule: false,  // リモートモジュール無効
  sandbox: true,              // サンドボックス
  webSecurity: true,          // ウェブセキュリティ
  preload: path.join(__dirname, 'preload.cjs')
}
```

### IPCハンドラー実装パターン
```typescript
// メインプロセス (file-handler.ts)
ipcMain.handle('file:load-prompts', async () => {
  // 処理...
  return { success: true, data: result };
});

// プリロードスクリプト (preload.ts)
file: {
  loadPrompts: () => ipcRenderer.invoke('file:load-prompts')
}

// レンダラープロセス (PromptSelector.tsx)
const result = await window.electronAPI?.file?.loadPrompts();
```

## 🔧 デバッグとトラブルシューティング

### 文字入力問題のデバッグ
1. **フォーカス確認**:
   ```typescript
   // DevTools Console
   document.activeElement
   ```

2. **イベントリスナー確認**:
   ```typescript
   // InputSection.tsx内
   console.log('Input field focus state:', document.activeElement);
   ```

3. **Electronフォーカス状態**:
   ```typescript
   // window-manager.ts
   this.mainWindow.isFocused()
   this.mainWindow.focus()
   ```

### テンプレート読み込み問題のデバッグ
1. **IPC通信確認**:
   ```typescript
   // PromptSelector.tsx:56
   console.log('📡 IPC Result:', ipcResult);
   ```

2. **ファイルアクセス確認**:
   ```typescript
   // file-handler.ts:198
   const files = await fs.readdir(promptsDir);
   console.log(`📋 Found ${jsonFiles.length} prompt files:`, jsonFiles);
   ```

3. **パス確認**:
   ```typescript
   // file-handler.ts:209
   console.log(`📁 Final prompts directory: ${promptsDir}`);
   ```

## 📝 次のアクションアイテム

### 優先度: 高
1. **再起動時の文字入力問題**: 
   - フォーカス管理の詳細調査
   - ready-to-show事象のタイミング検証
   - テキストエリアの初期化順序確認

2. **テンプレート消失問題**:
   - IPCハンドラーの初期化タイミング検証
   - コンポーネントマウント順序の確認
   - エラーハンドリング強化

### 優先度: 中
1. **ユーザビリティテスト**: 実環境での動作検証
2. **エラーメッセージ改善**: ユーザーフレンドリーな表示
3. **パフォーマンス最適化**: 起動時間短縮

---

**最終更新**: 2025-09-01  
**状態**: 主要機能動作、継続調査が必要な項目あり