# 20250902_APIキー・AI実行 関連ファイル構成リファレンス

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

## 📁 ディレクトリ構造

### **🎯 コアサービス（メインプロセス）**
```
app/src/main/services/
├── AIProcessingService.ts      🤖 AI処理統合サービス（分割処理・API統合）
├── SecureStorageService.ts     🔐 APIキー安全管理（keytar + フォールバック）
├── ChunkingService.ts          ✂️  テキスト分割処理サービス  
├── DbService.ts               🗄️  SQLite管理（テンプレート・監査ログ）
├── WorkspaceService.ts        📁 ワークスペース管理（ポータブル対応）
└── SearchService.ts           🔍 検索機能
```

### **🔗 IPC通信ハンドラー**
```
app/src/main/ipc/
├── template-handler.ts        📋 テンプレート CRUD IPC
├── file-handler.ts           📄 ファイル操作 IPC
└── (AIProcessingServiceはmain/index.ts経由で直接)
```

### **🖥️ フロントエンド UI**
```
app/src/renderer/components/sections/
├── AIExecutionSection.tsx     🤖 AI実行・進捗表示
├── InputSection.tsx           📝 テキスト入力
└── EditorSection.tsx          ✏️  結果編集

app/src/renderer/components/
├── SettingsModal.tsx          ⚙️  設定画面（APIキー設定）
├── PromptSelector.tsx         📋 プロンプトテンプレート選択
└── WorkspaceManager.tsx       📁 ワークスペース管理UI
```

### **🔧 設定・型定義**
```
app/src/shared/
├── types/index.ts             📘 型定義
├── types/api.ts               🌐 API関連型
└── utils/aiService.ts         🛠️  AI処理ユーティリティ

app/src/vite-env.d.ts          📘 環境変数型定義
app/src/main/preload.ts        🌉 ElectronAPI公開
```

## 🔄 データフロー・依存関係

### **📊 APIキー設定フロー**
```
[SettingsModal.tsx]
    ↓ 💾 APIキー保存
[electronAPI.security.setCredential]
    ↓ 🔗 IPC呼び出し
[SecureStorageService.setCredential]
    ↓ 🔐 安全保存
[keytar（OS Keychain）/ workspace/cache/credentials.json]
```

### **🤖 AI処理実行フロー**  
```
[AIExecutionSection.tsx]
    ↓ 🚀 AI実行ボタン
[electronAPI.ai.processText]
    ↓ 🔗 IPC呼び出し
[AIProcessingService.processText]
    ↓ 🔍 プロバイダー判定
[AIProcessingService.determineProvider]
    ↓ 🔑 APIキー取得
[SecureStorageService.getCredential]
    ↓ 🌐 API呼び出し
[Gemini/OpenAI API または オフライン処理]
```

### **📋 テンプレート管理フロー**
```
[PromptSelector.tsx]
    ↓ 📥 テンプレート読み込み
[electronAPI.templates.list]
    ↓ 🔗 IPC呼び出し
[template-handler.ts]
    ↓ 🗄️  データベースアクセス
[DbService.getPromptTemplates]
    ↓ 💾 SQLite読み取り
[workspace/data/gijiroku.db]
```

## 📋 重要クラス・メソッド詳細

### **🤖 AIProcessingService.ts**
| メソッド | 説明 | 重要度 |
|---------|------|--------|
| `processText()` | メインAI処理API（分割対応） | ⭐⭐⭐ |
| `determineProvider()` | APIキー有無による自動判定 | ⭐⭐⭐ |
| `processWithChunking()` | 分割処理実行 | ⭐⭐ |
| `processWithGemini()` | Gemini API呼び出し | ⭐⭐⭐ |
| `processWithOpenAI()` | OpenAI API呼び出し | ⭐⭐⭐ |
| `processOffline()` | オフライン処理（フォールバック） | ⭐⭐ |

### **🔐 SecureStorageService.ts**
| メソッド | 説明 | 重要度 |
|---------|------|--------|
| `setCredential()` | APIキー安全保存 | ⭐⭐⭐ |
| `getCredential()` | APIキー取得 | ⭐⭐⭐ |
| `setApiConfig()` | 一括API設定 | ⭐⭐ |
| `getApiConfigStatus()` | 設定状況確認（値なし） | ⭐⭐⭐ |
| `healthCheck()` | ストレージ動作確認 | ⭐ |

### **🖥️ AIExecutionSection.tsx**
| 関数・状態 | 説明 | 重要度 |
|---------|------|--------|
| `executeAI()` | AI実行メイン処理 | ⭐⭐⭐ |
| `getProgressString()` | 進捗表示文字列生成 | ⭐⭐ |
| `generateMockProcessedText()` | フォールバックモック処理 | ⭐ |
| `chunkingProgress` | 分割処理進捗状態 | ⭐⭐ |

## 🔧 環境別設定・環境変数

### **開発環境設定**
```bash
# .env ファイル（開発環境のみ）
NODE_ENV=development
GEMINI_API_KEY=your-gemini-key-here
OPENAI_API_KEY=your-openai-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
VITE_OPENAI_API_KEY=your-openai-key-here
```

### **配布環境設定**
```bash
# Electron パッケージ時の自動設定
NODE_ENV=production
VITE_FORCE_USER_API_KEYS=true  # 環境変数フォールバック無効化
```

### **重要な環境分岐**
```typescript
// AIProcessingService.ts:283
const isProduction = process.env.NODE_ENV === 'production' || process.env.VITE_FORCE_USER_API_KEYS === 'true';
```

## 🗄️ データベース・ストレージ構造

### **SQLite (workspace/data/gijiroku.db)**
```sql
-- テンプレート管理
CREATE TABLE prompt_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 監査ログ（SecureStorage操作記録）
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  detail TEXT,
  timestamp TEXT DEFAULT (datetime('now'))
);
```

### **APIキー保存場所**
```
[Primary Storage - OS Keychain]
Windows: Credential Manager
macOS: Keychain Access  
Linux: Secret Service

[Fallback Storage - Workspace]
workspace/cache/credentials.json (Base64暗号化)
{
  "gemini_api_key": {
    "id": "gemini_api_key",
    "type": "api_token", 
    "service": "gemini",
    "account": "main",
    "value": "base64-encoded-key",
    "encrypted": true,
    "storage": "fallback"
  }
}
```

### **設定保存場所**
```
[フロントエンド設定]
localStorage:
- 'apiKeys': {"gemini": "", "openai": ""}
- 'selectedModels': {"gemini": "gemini-2.0-flash"}
- 'chunkingSettings': {"maxChunkSize": 5000, "overlapSize": 100}

[ワークスペース設定]
workspace/config/ → CODEX_REVIEW.mdによりDB統合済み
```

## 🚨 已知問題・注意点

### **1. APIキー設定→実行の連携問題**
- **症状**: 設定画面テストは成功するが実際のAI実行で失敗
- **関連ファイル**: `SecureStorageService.ts`, `AIProcessingService.ts`
- **推定原因**: アカウント名不一致または初期化タイミング

### **2. 開発・配布環境での差異**
- **開発**: 環境変数フォールバック有効
- **配布**: SecureStorageのみ、環境変数無効
- **影響**: テスト→本番移行時の動作変化

### **3. keytar依存**  
- **問題**: ネイティブモジュール、環境依存
- **対策**: workspace fallback実装済み
- **確認**: `SecureStorageService.healthCheck()`で動作確認

---

**作成日**: 2025-09-01  
**更新者**: Claude (Anthropic)  
**対象**: 議事録アプリ v2.0.x