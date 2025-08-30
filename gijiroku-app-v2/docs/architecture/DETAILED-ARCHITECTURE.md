# 議事録アプリ v2 詳細アーキテクチャ分析
## 移行完了版の詳細設計書

---

## 🏗️ 新アーキテクチャ概要

### 全体構造
```
gijiroku-app-v2/
├── src/
│   ├── main/           # Electronメインプロセス（Node.js環境）
│   │   ├── index.ts               # アプリケーションエントリーポイント
│   │   ├── preload.ts             # レンダラープロセス間橋渡し
│   │   ├── services/              # 統合されたバックエンドサービス
│   │   └── ipc/                   # プロセス間通信ハンドラー
│   ├── renderer/       # フロントエンド（Chromium環境）
│   │   ├── main.tsx               # Reactアプリケーションエントリー
│   │   ├── App.tsx                # メインアプリケーションコンポーネント
│   │   ├── components/            # UIコンポーネント群
│   │   ├── hooks/                 # カスタムReactフック
│   │   ├── services/              # フロントエンド専用サービス
│   │   └── styles/                # スタイル定義
│   └── shared/         # 共通コード
│       ├── types/                 # TypeScript型定義
│       └── utils/                 # 共通ユーティリティ関数
├── resources/          # アプリケーションリソース
├── dist/              # フロントエンドビルド成果物
├── dist-electron/     # Electronメインプロセスビルド成果物
└── release/           # 配布用パッケージ
```

---

## 📦 処理の移行詳細

### 1. **メインプロセス統合** (`src/main/`)

#### 🔄 **従来 → 新構造**

**従来のファイル配置:**
```
electron/
├── main.ts                    → src/main/index.ts
├── preload.ts                 → src/main/preload.ts
├── services/
│   ├── window-manager.ts      → src/main/services/window-manager.ts
│   └── backend-manager.ts     → src/main/services/backend-manager.ts
└── ipc/                       → src/main/ipc/
```

**backend-nodejs/ の統合:**
```
backend-nodejs/src/services/
├── LlmService.ts              → src/main/services/LlmService.ts
├── PdfService.ts              → src/main/services/PdfService.ts  
├── VttParser.ts               → src/main/services/VttParser.ts
├── TextProcessor.ts           → src/main/services/TextProcessor.ts
├── DictionaryService.ts       → src/main/services/DictionaryService.ts
└── PromptService.ts           → src/main/services/PromptService.ts
```

#### **処理責任:**
- **アプリケーションライフサイクル管理**
- **ウィンドウ制御** (作成、表示、サイズ調整)
- **IPC通信** (レンダラーとの橋渡し)
- **ファイルシステム操作** 
- **AI処理** (OpenAI、Gemini API呼び出し)
- **PDF生成処理**
- **データベース接続** (Supabase)

---

### 2. **レンダラープロセス統合** (`src/renderer/`)

#### 🔄 **従来 → 新構造**

**UIコンポーネント移行:**
```
frontend/src/components/
├── Dashboard.tsx              → src/renderer/components/Dashboard.tsx
├── FileUpload.tsx             → src/renderer/components/FileUpload.tsx
├── TextEditor.tsx             → src/renderer/components/TextEditor.tsx
├── ProcessingResult.tsx       → src/renderer/components/ProcessingResult.tsx
├── SettingsModal.tsx          → src/renderer/components/SettingsModal.tsx
├── AboutModal.tsx             → src/renderer/components/AboutModal.tsx
├── DictionaryModal.tsx        → src/renderer/components/DictionaryModal.tsx
├── MarkdownPdfTool.tsx        → src/renderer/components/MarkdownPdfTool.tsx
└── sections/                  → src/renderer/components/sections/
```

**サービス層移行:**
```
frontend/src/services/
├── localStorageManager.ts     → src/renderer/services/localStorageManager.ts
├── pdfApi.ts                  → src/renderer/services/pdfApi.ts
├── pdfService.ts              → src/renderer/services/pdfService.ts
└── storage/                   → src/renderer/services/storage/
```

**フック・ユーティリティ移行:**
```
frontend/src/hooks/
├── useDashboard.ts            → src/renderer/hooks/useDashboard.ts
├── useServerHealth.ts         → src/renderer/hooks/useServerHealth.ts
├── useLocalSettings.ts        → src/renderer/hooks/useLocalSettings.ts
└── usePerformance.ts          → src/renderer/hooks/usePerformance.ts

frontend/src/utils/
├── aiService.ts               → src/shared/utils/aiService.ts
├── vtt.ts                     → src/shared/utils/vtt.ts
├── errorHandler.ts            → src/shared/utils/errorHandler.ts
└── cssLoader.ts               → src/shared/utils/cssLoader.ts
```

#### **処理責任:**
- **UI表示・操作** (React コンポーネント)
- **ユーザー入力処理** (ファイルアップロード、テキスト編集)
- **状態管理** (React State、カスタムフック)
- **ローカルストレージ操作**
- **レンダラー専用API呼び出し**

---

### 3. **共通コード統合** (`src/shared/`)

#### 🔄 **従来 → 新構造**

**型定義統合:**
```
frontend/src/types/
├── api.ts                     → src/shared/types/api.ts
└── index.ts                   → src/shared/types/index.ts

backend-nodejs/src/types/
├── processing.ts              → src/shared/types/processing.ts
└── api.ts                     → src/shared/types/api.ts (マージ)
```

**共通ユーティリティ:**
```
frontend/src/utils/            → src/shared/utils/ 
backend-nodejs/src/utils/      → src/shared/utils/ (統合)
```

#### **処理責任:**
- **型定義** (TypeScript インターフェース)
- **共通定数** (API エンドポイント、設定値)
- **ヘルパー関数** (データ変換、バリデーション)

---

## 🔄 データフロー詳細

### **VTTファイル処理フロー**

```
[ユーザー: VTTファイル選択] 
    ↓
[FileUpload.tsx]
    ↓
[IPC: file:select]
    ↓
[main/ipc/file-handler.ts]
    ↓
[main/services/VttParser.ts]
    ↓
[main/services/TextProcessor.ts]
    ↓
[main/services/LlmService.ts]
    ↓
[OpenAI/Gemini API]
    ↓
[main/services/PdfService.ts]
    ↓
[PDF生成]
    ↓
[IPC応答]
    ↓
[ProcessingResult.tsx]
```

### **設定管理フロー**

```
[SettingsModal.tsx] 
    ↓
[useLocalSettings.ts]
    ↓
[IPC: storage:set]
    ↓
[main/ipc/storage-handler.ts]
    ↓
[Electron Store]
    ↓
[設定保存]
```

---

## 🏛️ レイヤード・アーキテクチャ

### **Layer 1: プレゼンテーション層**
```
src/renderer/components/
├── 📱 UI Components        # ユーザーインターフェース
├── 🎣 Custom Hooks        # 状態管理・副作用
└── 🎨 Styles              # スタイル定義
```

### **Layer 2: アプリケーション層**
```
src/renderer/services/
├── 🔄 API Clients         # 外部API通信
├── 💾 Storage Services    # データ永続化
└── 🧮 Business Logic      # ビジネスロジック
```

### **Layer 3: インフラストラクチャ層**
```
src/main/services/
├── 🤖 AI Services         # AI プロバイダー連携
├── 📄 PDF Services        # PDF生成処理
├── 🗄️ Database Services   # データベース操作
└── 📁 File Services       # ファイル操作
```

### **Layer 4: システム層**
```
src/main/
├── 🪟 Window Management   # ウィンドウ制御
├── 🔌 IPC Handlers       # プロセス間通信
└── 🚀 App Lifecycle      # アプリケーション制御
```

---

## 🔧 ビルドプロセス詳細

### **開発時 (`npm run dev`)**
```bash
concurrently
├── vite                    # レンダラープロセス開発サーバー (localhost:5173)
└── electron .              # Electronメインプロセス起動
```

### **本番ビルド (`npm run build`)**
```bash
# Step 1: フロントエンドビルド
vite build → dist/
├── index.html
├── assets/
│   ├── index-[hash].js     # React アプリケーション
│   └── index-[hash].css    # スタイル

# Step 2: メインプロセスビルド  
tsup → dist-electron/
├── main.js                 # バンドルされたメインプロセス
└── preload.js              # プリロードスクリプト

# Step 3: パッケージング
electron-builder → release/
└── 議事録アプリ v2-2.0.0-win-x64.exe
```

---

## 🎯 プロセス間通信（IPC）設計

### **API体系**

#### **ファイル操作**
```typescript
window.electronAPI.file
├── selectFile()            # ファイル選択ダイアログ
├── readFile()              # ファイル読み込み
├── writeFile()             # ファイル書き込み
└── saveDialog()            # 保存ダイアログ
```

#### **ストレージ操作**
```typescript
window.electronAPI.storage
├── get()                   # データ取得
├── set()                   # データ保存
├── delete()                # データ削除
└── clear()                 # 全データクリア
```

#### **バックエンド連携**
```typescript
window.electronAPI.backend
├── request()               #汎用API リクエスト
├── uploadFile()            # ファイルアップロード
├── getStatus()             # サーバー状態確認
└── getUrl()                # サーバーURL取得
```

---

## 🚀 パフォーマンス最適化

### **1. コード分割**
```typescript
// App.tsx - 遅延ローディング
const FileUpload = lazy(() => import('./components/FileUpload'));
const TextEditor = lazy(() => import('./components/TextEditor'));
const ProcessingResult = lazy(() => import('./components/ProcessingResult'));
```

### **2. バンドル最適化**
```typescript
// vite.config.ts - チャンク分割
rollupOptions: {
  output: {
    manualChunks: {
      vendor: ['react', 'react-dom'],
      markdown: ['marked', 'react-markdown'],
      utils: ['axios', 'dexie', 'react-dropzone']
    }
  }
}
```

### **3. 依存関係最適化**
```typescript
// tsup.config.ts - 外部化・バンドル化
external: ['electron'],
noExternal: [
  'axios', 'form-data', '@supabase/supabase-js',
  '@google/generative-ai', 'openai', 'markdown-it'
]
```

---

## 🔒 セキュリティ実装

### **Context Isolation**
```typescript
// preload.ts - 安全なAPI公開
contextBridge.exposeInMainWorld('electronAPI', {
  file: { /* 制限されたファイル操作 */ },
  storage: { /* サンドボックス化されたストレージ */ }
});
```

### **外部URL制限**
```typescript
// main/index.ts - セキュリティポリシー
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    console.warn('Blocked external navigation:', url);
    return { action: 'deny' };
  });
});
```

---

## 📊 メモリ・リソース管理

### **リソース配置**
```
resources/
├── icons/                  # アプリケーションアイコン
├── fonts/                  # 日本語フォント (Noto Sans JP)
└── templates/              # AI プロンプトテンプレート
    └── prompts/
        ├── formal_minutes.json
        ├── technical_meeting.json
        └── general_meeting.json
```

### **メモリ効率化**
- **Lazy Loading**: コンポーネントの遅延読み込み
- **Tree Shaking**: 未使用コードの除去
- **Asset Optimization**: 画像・フォントの最適化

---

## 🧪 テスト戦略

### **単体テスト**
- **services/**: ビジネスロジックのテスト
- **utils/**: 共通関数のテスト
- **hooks/**: カスタムフックのテスト

### **統合テスト**  
- **IPC通信**: メイン↔レンダラー間通信
- **ファイル処理**: VTT → PDF 変換フロー
- **AI連携**: OpenAI/Gemini API 統合

### **E2Eテスト**
- **ワークフロー**: ファイルアップロード → 処理 → ダウンロード
- **設定管理**: 各種設定の保存・復元

---

## 🎯 移行による改善点

### **技術的改善**
- **ビルド時間短縮**: 複雑な依存関係解決の簡素化
- **パッケージサイズ削減**: 重複コードの除去とTree Shaking
- **起動時間短縮**: 最適化されたバンドル構成

### **開発体験改善**
- **単一コマンドビルド**: `npm run build` で全体ビルド
- **統一デバッグ環境**: 一元化されたソースコード
- **明確なエラーメッセージ**: 改善されたエラーハンドリング

### **保守性向上**
- **コード重複削減**: 共通コードの統合
- **責任分離**: 明確なレイヤー構造
- **型安全性**: 統一されたTypeScript設定

---

## 📝 次期開発計画

### **Phase 1: 安定化**
- [ ] 残存インポートエラーの修正
- [ ] 全機能の動作確認
- [ ] パッケージング最適化

### **Phase 2: 機能拡張**
- [ ] リアルタイム同期機能
- [ ] プラグインシステム
- [ ] 多言語対応

### **Phase 3: 最適化**
- [ ] パフォーマンス向上
- [ ] メモリ使用量削減
- [ ] バッテリー効率化

---

この新しいアーキテクチャにより、従来の「開発では動くが本番で動かない」問題を解決し、保守性・拡張性・安定性を大幅に向上させています。統合されたモノリシック・ハイブリッド型設計により、シンプルで理解しやすい構造を実現しながら、Electronアプリケーションとしての堅牢性を確保しています。