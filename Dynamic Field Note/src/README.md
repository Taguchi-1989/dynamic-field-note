# src/ - ソースコードディレクトリ

このディレクトリには、Dynamic Field Note アプリケーションのすべてのソースコードが含まれます。

## 📁 ディレクトリ構造

```
src/
├── components/     # 再利用可能なUIコンポーネント
├── screens/        # 画面コンポーネント
├── services/       # ビジネスロジック・API通信
├── hooks/          # カスタムReact Hooks
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
└── constants/      # アプリケーション定数
```

## 📦 各ディレクトリの詳細

### components/
再利用可能なUIコンポーネントを格納します。

例:
- `MarkdownPreview.tsx` - Markdown プレビューコンポーネント
- `SummaryButtons.tsx` - 要約実行ボタン
- `AIStatusIndicator.tsx` - AI状態表示

### screens/
アプリケーションの画面コンポーネントを格納します。

例:
- `HomeScreen.tsx` - メイン画面
- `CameraScreen.tsx` - 写真撮影画面
- `CaseListScreen.tsx` - 案件一覧画面

### services/
ビジネスロジックとAPI通信を担当するサービスクラスを格納します。

例:
- `geminiService.ts` - Gemini API 通信
- `gpt5Service.ts` - GPT-5 API 通信
- `database/` - SQLite データベース操作

### hooks/
カスタムReact Hooksを格納します。

例:
- `useVoiceBuffer.ts` - 音声入力バッファ管理
- `useCase.ts` - 案件管理
- `useSync.ts` - 同期状態管理

### types/
TypeScript型定義を格納します。

例:
- `summary.ts` - 要約データの型
- `case.ts` - 案件データの型
- `api.ts` - API レスポンスの型

### utils/
汎用的なユーティリティ関数を格納します。

例:
- `markdownGenerator.ts` - Markdown 生成
- `dateFormatter.ts` - 日付フォーマット
- `validator.ts` - バリデーション

### constants/
アプリケーション全体で使用する定数を格納します。

例:
- `config.ts` - アプリケーション設定
- `colors.ts` - カラーパレット
- `endpoints.ts` - API エンドポイント
