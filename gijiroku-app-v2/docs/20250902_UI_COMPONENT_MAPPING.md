# 20250902_📋 UI部品構成マップ - 議事録アプリv2

## 🎯 概要
このドキュメントは議事録アプリのUI部品とそれに対応するCSSファイルをマッピングしたものです。各部品名をクリックすると該当するCSSファイルに直接ジャンプできます。

---

## 📄 メイン画面構成

### 🏠 Dashboard (メイン画面)
- **コンポーネント**: DashboardRefactored.tsx
- **CSS**: [Dashboard.css](../app/src/renderer/components/Dashboard.css)
- **説明**: アプリケーションのメイン画面、全体レイアウト管理

### 🔝 Header (ヘッダー)
- **コンポーネント**: Header.tsx
- **CSS**: [Header.css](../app/src/renderer/components/Header.css) / [Header.mobile.css](../app/src/renderer/components/Header.mobile.css)
- **説明**: アプリタイトル、バージョン情報、メニューボタン

---

## 📝 入力・編集セクション

### 📤 InputSection (ファイル入力エリア)
- **コンポーネント**: [InputSection.tsx](../app/src/renderer/components/sections/InputSection.tsx)
- **CSS**: [InputSection.css](../app/src/renderer/components/sections/InputSection.css)
- **説明**: VTTファイルアップロード、文字数表示

### 📄 FileUpload (ファイルアップロード)
- **コンポーネント**: [FileUpload.tsx](../app/src/renderer/components/FileUpload.tsx)
- **CSS**: [FileUpload.css](../app/src/renderer/components/FileUpload.css)
- **説明**: ドラッグ&ドロップエリア、進捗表示

### ✏️ EditorSection (テキスト編集エリア)
- **コンポーネント**: [EditorSection.tsx](../app/src/renderer/components/sections/EditorSection.tsx)
- **CSS**: [EditorSection.css](../app/src/renderer/components/sections/EditorSection.css)
- **説明**: 結果表示・編集、保存機能

### 📝 TextEditor (テキストエディタ)
- **コンポーネント**: [TextEditor.tsx](../app/src/renderer/components/TextEditor.tsx)
- **CSS**: [TextEditor.css](../app/src/renderer/components/TextEditor.css)
- **説明**: メインのテキスト編集機能

---

## 🎯 プロンプト・AI実行セクション

### 📋 PromptSelector (プロンプト選択) ⭐
- **コンポーネント**: [PromptSelector.tsx](../app/src/renderer/components/PromptSelector.tsx)
- **CSS**: [PromptSelector.css](../app/src/renderer/components/PromptSelector.css)
- **説明**: プロンプト選択、現在のテンプレート表示
- **主要クラス**:
  - `.prompt-selector` - セクション全体
  - `.prompt-section` - プロンプト操作ボタンエリア
  - `.current-prompt` - 現在のプロンプト表示エリア
  - `.prompt-preview` - プロンプト内容プレビュー

### 🚀 AIExecutionSection (AI実行エリア)
- **コンポーネント**: [AIExecutionSection.tsx](../app/src/renderer/components/sections/AIExecutionSection.tsx)
- **CSS**: [AIExecutionSection.css](../app/src/renderer/components/sections/AIExecutionSection.css)
- **説明**: AI修正実行、進捗表示、分割処理状況

### 📊 ProcessingResult (処理結果)
- **コンポーネント**: [ProcessingResult.tsx](../app/src/renderer/components/ProcessingResult.tsx)
- **CSS**: [ProcessingResult.css](../app/src/renderer/components/ProcessingResult.css)
- **説明**: AI処理後の結果表示、修正内容確認

---

## 🛠️ ユーティリティ・設定

### ⚙️ SettingsModal (設定画面)
- **コンポーネント**: [SettingsModal.tsx](../app/src/renderer/components/SettingsModal.tsx)
- **CSS**: [SettingsModal.css](../app/src/renderer/components/SettingsModal.css)
- **説明**: 分割設定、アプリケーション設定

### 📖 DictionaryModal (辞書設定)
- **コンポーネント**: [DictionaryModal.tsx](../app/src/renderer/components/DictionaryModal.tsx)
- **CSS**: [DictionaryModal.css](../app/src/renderer/components/DictionaryModal.css)
- **説明**: 用語辞書管理、追加・編集・削除

### 📁 WorkspaceManager (ワークスペース管理)
- **コンポーネント**: [WorkspaceManager.tsx](../app/src/renderer/components/WorkspaceManager.tsx)
- **CSS**: [WorkspaceManager.css](../app/src/renderer/components/WorkspaceManager.css)
- **説明**: プロジェクト・ワークスペース切り替え

### 💾 SaveStatusIndicator (保存状態)
- **コンポーネント**: [SaveStatusIndicator.tsx](../app/src/renderer/components/SaveStatusIndicator.tsx)
- **CSS**: 共通CSS使用
- **説明**: 自動保存状態表示

---

## 📄 PDF・エクスポート機能

### 📄 PdfDownloadButton (PDF生成)
- **コンポーネント**: [PdfDownloadButton.tsx](../app/src/renderer/components/PdfDownloadButton.tsx)
- **CSS**: 共通CSS使用
- **説明**: PDF生成・ダウンロード機能

### 📄 MarkdownPdfTool (Markdown→PDF)
- **コンポーネント**: [MarkdownPdfTool.tsx](../app/src/renderer/components/MarkdownPdfTool.tsx)
- **CSS**: 共通CSS使用
- **説明**: Markdownテキスト形式でのPDF出力

---

## 🔧 開発・デバッグ

### 📊 HealthStatusPanel (ステータスパネル)
- **コンポーネント**: [HealthStatusPanel.tsx](../app/src/renderer/components/HealthStatusPanel.tsx)
- **CSS**: [HealthStatusPanel.css](../app/src/renderer/components/HealthStatusPanel.css)
- **説明**: システム状態・接続状況表示

### 🧪 DataSyncTester (データ同期テスター)
- **コンポーネント**: [DataSyncTester.tsx](../app/src/renderer/components/DataSyncTester.tsx)
- **CSS**: JavaScript内インラインスタイル
- **説明**: データ同期機能のテスト・デバッグ

### 🔧 ElectronModeIndicator (モード表示)
- **コンポーネント**: [ElectronModeIndicator.tsx](../app/src/renderer/components/ElectronModeIndicator.tsx)
- **CSS**: インライン
- **説明**: 開発・本番モード表示

---

## 🎛️ モーダル・ダイアログ

### ℹ️ AboutModal (アプリ情報)
- **コンポーネント**: [AboutModal.tsx](../app/src/renderer/components/AboutModal.tsx)
- **CSS**: [AboutModal.css](../app/src/renderer/components/AboutModal.css)

### 📞 ContactModal (お問い合わせ)
- **コンポーネント**: [ContactModal.tsx](../app/src/renderer/components/ContactModal.tsx)
- **CSS**: [ContactModal.css](../app/src/renderer/components/ContactModal.css)

### 🗺️ RoadmapModal (ロードマップ)
- **コンポーネント**: [RoadmapModal.tsx](../app/src/renderer/components/RoadmapModal.tsx)
- **CSS**: [RoadmapModal.css](../app/src/renderer/components/RoadmapModal.css)

### 📝 InputContentModal (テキスト入力)
- **コンポーネント**: [InputContentModal.tsx](../app/src/renderer/components/InputContentModal.tsx)
- **CSS**: [InputContentModal.css](../app/src/renderer/components/InputContentModal.css)

---

## 🎨 共通スタイル

### 🚨 Toast (通知)
- **コンポーネント**: [Toast.tsx](../app/src/renderer/components/Toast.tsx)
- **CSS**: [Toast.css](../app/src/renderer/components/Toast.css)

### ❌ ErrorBoundary (エラー境界)
- **コンポーネント**: [ErrorBoundary.tsx](../app/src/renderer/components/ErrorBoundary.tsx)
- **CSS**: [ErrorBoundary.css](../app/src/renderer/components/ErrorBoundary.css)

### 📄 SampleVTT (サンプルファイル)
- **コンポーネント**: [SampleVTT.tsx](../app/src/renderer/components/SampleVTT.tsx)
- **CSS**: [SampleVTT.css](../app/src/renderer/components/SampleVTT.css)

### 🎨 共通スタイル
- **CSS**: [modal-close-style.css](../app/src/renderer/components/modal-close-style.css) - モーダル閉じるボタン共通
- **CSS**: [DevelopmentStyles.css](../app/src/renderer/components/DevelopmentStyles.css) - 開発用スタイル

---

## 🎯 よく使用する修正箇所

### プロンプト選択エリアの間隔調整
- **ファイル**: [PromptSelector.css](../app/src/renderer/components/PromptSelector.css)
- **主要クラス**: `.current-prompt`, `.prompt-preview`, `.template-preview`

### メイン画面レイアウト調整
- **ファイル**: [Dashboard.css](../app/src/renderer/components/Dashboard.css)
- **主要クラス**: `.dashboard-container`, `.panel`, `.prompt-selection-panel`

### AI実行エリア調整
- **ファイル**: [AIExecutionSection.css](../app/src/renderer/components/sections/AIExecutionSection.css)
- **主要クラス**: `.ai-execution-section`, `.execution-button-container`

---

## 🔍 修正手順

1. **部品の特定**: この表で目的の部品を探す
2. **CSSファイルを開く**: リンクをクリックしてCSSファイルに移動
3. **該当クラスを検索**: DevToolsまたはコード内で該当クラス名を検索
4. **修正・確認**: 変更後、ブラウザで確認

---

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02  
**作成者**: Claude (Anthropic)  
**目的**: UI修正効率化・開発者支援