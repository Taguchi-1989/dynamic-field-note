# 議事録アプリ v2

AIを活用した議事録修正支援アプリケーション - MVP分割処理機能搭載版

## 🚀 特徴

### MVP機能（実装完了）
- **APIキー管理**: Gemini・OpenAI API対応、セキュア保存
- **PDF生成**: Markdown→PDF変換、カスタムタイトル対応
- **カスタムプロンプト**: テンプレート管理・適用機能
- **分割処理**: 大容量VTTファイルのチャンク処理対応
- **再実行機能**: エラー時の自動リトライ処理

### 高度機能（開発中・無効化）
- **検索機能**: SQLite FTS・ベクトル検索（実装済み・無効化）
- **辞書機能**: 用語管理・インポート/エクスポート（実装済み・無効化）
- **ログ機能**: 詳細ログ記録・閲覧（実装済み・無効化）
- **同期機能**: 設定・データ同期（実装済み・無効化）

### 拡張機能（部分実装）
- **画像サポート**: OCR・画像処理（部分実装）
- **LaTeXサポート**: 数式レンダリング（部分実装）
- **Mermaidサポート**: 図表生成（部分実装）

## 📋 必要要件

- Node.js 18+
- npm 9+
- Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)

## 🛠️ セットアップ

```bash
# リポジトリのクローン
git clone <your-repo-url>
cd gijiroku-app-v2

# 依存関係のインストール
npm install

# 開発環境確認
npm run setup

# MVP開発モード開始
npm run mvp
```

### 📋 開発用コマンド

| コマンド | 説明 |
|---------|------|
| `npm run setup` | 開発環境セットアップ確認 |
| `npm run features` | Feature Flags状態表示 |
| `npm run debug` | デバッグ情報確認 |
| `npm run mvp` | MVP開発モード開始 |

## 📦 ビルド

```bash
# プロダクションビルド
npm run build

# Electronアプリのパッケージング
npm run dist        # 自動検出
npm run dist:win    # Windows
npm run dist:mac    # macOS  
npm run dist:linux  # Linux
```

## 🗂️ プロジェクト構造

```
gijiroku-app-v2/
├── app/src/
│   ├── main/           # Electronメインプロセス
│   │   ├── services/   # ビジネスロジック
│   │   ├── ipc/        # IPC通信ハンドラー
│   │   └── utils/      # ユーティリティ
│   ├── renderer/       # React フロントエンド
│   │   ├── components/ # UIコンポーネント
│   │   ├── hooks/      # カスタムフック
│   │   └── utils/      # フロントエンド用ユーティリティ
│   └── shared/         # 共有モジュール
│       ├── types/      # 型定義
│       ├── utils/      # 共有ユーティリティ
│       └── feature-flags.ts # 機能フラグ管理
├── scripts/            # 開発スクリプト
│   ├── dev-setup.js    # 環境セットアップ確認
│   ├── feature-toggle.js # Feature Flag管理
│   └── debug-helper.js # デバッグ支援
├── docs/               # プロジェクトドキュメント
├── resources/          # アプリリソース
├── dist/              # Viteビルド出力
├── dist-electron/     # Electronビルド出力
└── release/           # パッケージング出力
```

## 🔧 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run typecheck` | TypeScript型チェック |
| `npm run lint` | ESLintコード品質チェック |
| `npm run format` | Prettierコード整形 |
| `npm run clean` | ビルド成果物削除 |
| `npm run test:mvp` | MVP機能テスト |

詳細な開発ガイドは [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) を参照してください。

## 🏗️ アーキテクチャ

### メインプロセス
- **WorkspaceService**: ワークスペース管理
- **DbService**: SQLiteデータベース管理
- **MarkdownCompilerService**: Markdown→PDF変換
- **SecureStorageService**: 資格情報管理
- **PdfJobService**: ジョブキュー管理
- **SyncService**: データ同期
- **SearchService**: 全文検索

### レンダラープロセス
- **React 19**: UIフレームワーク
- **TypeScript**: 型安全性
- **Vite**: 高速ビルドツール
- **IPC通信**: zodスキーマ検証

## 📝 ライセンス

MIT

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 📞 サポート

問題が発生した場合は、[Issues](https://github.com/your-username/gijiroku-app-v2/issues)で報告してください。