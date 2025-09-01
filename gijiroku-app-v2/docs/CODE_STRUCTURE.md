# コード構造と該当ファイル詳細

## 📁 プロジェクト全体構造

```
gijiroku-app-v2/
├── app/
│   └── src/
│       ├── main/              # Electronメインプロセス
│       ├── renderer/          # React UIコンポーネント
│       ├── shared/            # 共通ユーティリティ
│       └── mocks/             # モックデータ
├── resources/                 # リソースファイル
│   ├── prompts/              # プロンプトテンプレート
│   ├── icons/                # アイコン
│   └── fonts/                # フォント
├── docs/                     # ドキュメント
├── dist/                     # フロントエンド配布物
├── dist-electron/            # Electron配布物
└── release/                  # 最終パッケージ
```

## 🎯 問題該当ファイルの詳細

### 1. プロンプトテンプレート関連

#### `app/src/renderer/components/PromptSelector.tsx`
**役割**: プロンプトテンプレート選択UI  
**問題**: 502エラー、テンプレート消失

**重要コード**:
```typescript
// Line: 41-136 - fetchTemplates関数
const fetchTemplates = useCallback(async () => {
  // キャッシュ確認
  if (promptCache && Date.now() - promptCache.timestamp < CACHE_DURATION) {
    setTemplates(promptCache.templates);
    return;
  }
  
  try {
    // IPCからプロンプト読み込み (修正済み)
    const ipcResult = await window.electronAPI?.file?.loadPrompts();
    if (ipcResult?.success && ipcResult.data?.prompts) {
      setTemplates(ipcResult.data.prompts);
      return;
    }
  } catch (ipcError) {
    // フォールバック: モックデータ使用 (修正済み)
    console.warn('⚠️ IPC prompts loading failed, falling back to mock data:', ipcError);
    const mockTemplatesFormatted = mockPromptTemplates.map(/* ... */);
    setTemplates(mockTemplatesFormatted);
    return;
  }
}, []);
```

**問題の変遷**:
- **修正前**: IPC失敗 → 外部API呼び出し → 502エラー
- **修正後**: IPC失敗 → モックデータ → 正常動作

#### `app/src/main/ipc/file-handler.ts`
**役割**: プロンプトファイル読み込みIPCハンドラー  
**問題**: リリース版でのパス解決

**重要コード**:
```typescript
// Line: 182-225 - file:load-prompts IPCハンドラー
ipcMain.handle('file:load-prompts', async () => {
  try {
    const isPackaged = app.isPackaged;
    
    let promptsDir: string;
    if (isPackaged) {
      // リリース版: app.asar内のresources/promptsを読み込み
      const asarPath = path.join(process.resourcesPath, 'app.asar');
      promptsDir = path.join(asarPath, 'resources', 'prompts');
      
      // フォールバック処理
      try {
        await fs.access(promptsDir);
      } catch {
        promptsDir = path.join(__dirname, '..', '..', '..', 'resources', 'prompts');
      }
    } else {
      // 開発モード: プロジェクトルートのresources/prompts
      promptsDir = path.join(app.getAppPath(), 'resources', 'prompts');
    }
    
    const files = await fs.readdir(promptsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const prompts = [];
    for (const file of jsonFiles) {
      const filePath = path.join(promptsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const templateData = JSON.parse(content);
      
      prompts.push({
        id: templateData.id || file.replace('.json', ''),
        title: templateData.name || templateData.title || file.replace('.json', ''),
        content: templateData.prompt || templateData.content || '',
        description: templateData.description || '',
        category: templateData.category || 'general',
        is_active: true
      });
    }
    
    return { success: true, data: { prompts } };
  } catch (error) {
    console.error('❌ Failed to load prompt templates:', error);
    return { success: false, error: error.message };
  }
});
```

### 2. 文字入力関連

#### `app/src/renderer/components/sections/InputSection.tsx`
**役割**: テキスト入力フィールド  
**問題**: 再起動時にフォーカスできない

**重要コード**:
```typescript
// Line: 204-218 - テキスト入力フィールド
<textarea
  value={directTextInput}
  onChange={(e) => setDirectTextInput(e.target.value)}
  placeholder={`または議事録の内容を直接貼り付け...`}
  className="direct-text-input"
  rows={8}
/>
```

**推定問題**:
- Reactコンポーネントの初期化タイミング
- Electronウィンドウのフォーカス状態
- イベントハンドラーの正常登録

#### `app/src/main/services/window-manager.ts`
**役割**: Electronウィンドウ作成・管理  
**問題**: フォーカス管理

**重要コード**:
```typescript
// Line: 78-86 - ready-to-show時の処理
this.mainWindow.once('ready-to-show', () => {
  console.log('✅ Window ready-to-show event fired');
  if (this.mainWindow) {
    this.mainWindow.show();
    this.mainWindow.focus(); // ここでフォーカス設定
    console.log('✅ Window shown and focused');
  }
});

// Line: 259-266 - フォーカス処理メソッド
focusMainWindow(): void {
  if (this.mainWindow && !this.mainWindow.isDestroyed()) {
    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }
    this.mainWindow.focus();
  }
}
```

### 3. AI処理・プロバイダー選択

#### `app/src/main/services/AIProcessingService.ts`
**役割**: AI処理とプロバイダー自動選択  
**問題**: (解決済み) APIキー漏洩、プロバイダー固定

**重要コード**:
```typescript
// Line: 92-95 - 自動プロバイダー判定
if (processingOptions.provider === 'offline' && !options?.provider) {
  processingOptions.provider = await this.determineProvider();
  console.log(`🎯 Provider auto-selected: ${processingOptions.provider}`);
}

// Line: 600-622 - プロバイダー判定ロジック
private async determineProvider(): Promise<'gemini' | 'openai' | 'offline'> {
  try {
    // Gemini APIキーの確認
    const geminiKey = await this.secureStorage.getCredential('gemini_api_key');
    if (geminiKey) {
      console.log('🔑 Gemini API key found, selecting gemini provider');
      return 'gemini';
    }
    
    // OpenAI APIキーの確認
    const openaiKey = await this.secureStorage.getCredential('openai_api_key');
    if (openaiKey) {
      console.log('🔑 OpenAI API key found, selecting openai provider');
      return 'openai';
    }
  } catch (error) {
    console.warn('⚠️ API key check failed:', error);
  }
  
  // APIキーがない場合はオフライン処理
  console.log('📴 No API keys found, using offline processing');
  return 'offline';
}

// Line: 283-296 - セキュアなAPIキー処理 (Gemini)
private async processWithGemini(text: string, prompt: string, options: AIProcessingOptions) {
  let apiKey = await this.secureStorage.getCredential('gemini_api_key');
  
  // 本番環境では環境変数からのAPIキー取得を無効化 (セキュリティ)
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VITE_FORCE_USER_API_KEYS === 'true';
  
  if (!apiKey && !isProduction) {
    // 開発環境のみ：フォールバックとして環境変数からAPIキーを取得
    apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    console.log('🔑 [開発環境] Using Gemini API key from environment variables');
  }
  
  if (!apiKey) {
    const message = isProduction 
      ? 'Gemini API key not configured. Please set your API key in Settings > API Configuration.'
      : 'Gemini API key not found in SecureStorage or environment variables';
    throw new Error(message);
  }
  
  // ... API呼び出し処理
}
```

## 🔄 データフロー図

### プロンプトテンプレート読み込み
```
┌─────────────────┐    IPC Call    ┌─────────────────┐
│ PromptSelector  │ ──────────────► │ file-handler.ts │
│ .tsx            │                 │                 │
└─────────────────┘                 └─────────────────┘
        │                                    │
        │ Fallback                          │ File Read
        ▼                                    ▼
┌─────────────────┐                 ┌─────────────────┐
│ mockPromptTem-  │                 │ resources/      │
│ plates          │                 │ prompts/*.json  │
└─────────────────┘                 └─────────────────┘
```

### AI処理フロー
```
┌─────────────────┐   determineProvider   ┌─────────────────┐
│ UI Component    │ ────────────────────► │ AIProcessing    │
│                 │                       │ Service         │
└─────────────────┘                       └─────────────────┘
                                                   │
                                          ┌────────┼────────┐
                                          ▼        ▼        ▼
                                    ┌─────────┐ ┌─────┐ ┌──────────┐
                                    │ Gemini  │ │ GPT │ │ Offline  │
                                    │ API     │ │ API │ │ Process  │
                                    └─────────┘ └─────┘ └──────────┘
```

## 🛠️ 開発時の重要なパス

### 開発環境
```typescript
// プロンプトファイル
path.join(app.getAppPath(), 'resources', 'prompts')
// 例: C:\project\gijiroku-app-v2\resources\prompts\

// HTMLファイル
'http://localhost:5173' // Vite devサーバー
```

### リリース環境
```typescript
// プロンプトファイル
path.join(process.resourcesPath, 'app.asar', 'resources', 'prompts')
// 例: C:\Program Files\App\resources\app.asar\resources\prompts\

// HTMLファイル
path.join(__dirname, '../dist/index.html')
// 例: app.asar\dist-electron\..\dist\index.html
```

## 📋 トラブルシューティング用コード

### プロンプト読み込み状況確認
```typescript
// PromptSelector.tsx内でデバッグ
console.log('🔄 [DEBUG] IPC Result:', ipcResult);
console.log('📋 Template count:', fetchedTemplates.length);
console.log('📁 Templates:', fetchedTemplates.map(t => ({ id: t.id, title: t.title })));
```

### ファイルアクセス確認
```typescript
// file-handler.ts内でデバッグ
console.log(`📁 [DEBUG] App is packaged: ${isPackaged}`);
console.log(`📁 [DEBUG] Final prompts directory: ${promptsDir}`);
console.log(`📋 Found ${jsonFiles.length} prompt files:`, jsonFiles);
```

### フォーカス状態確認
```javascript
// DevTools Consoleで実行
console.log('Active element:', document.activeElement);
console.log('Can focus?:', document.querySelector('.direct-text-input')?.focus());
```

---

**最終更新**: 2025-09-01  
**該当ファイル**: 主要7ファイル分析済み