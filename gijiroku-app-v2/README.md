# 議事録アプリ v2

AIを活用した議事録修正支援アプリケーション - 完全統合版

## 🚀 特徴

- **ローカルファースト設計**: SQLiteによる高速データ管理
- **高品質PDF生成**: Markdown→PDF変換パイプライン
- **AI統合**: OpenAI/Gemini APIによる議事録修正支援
- **セキュアストレージ**: keytar統合による安全な資格情報管理
- **オフライン対応**: 完全なオフライン動作サポート

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

# 開発サーバーの起動
npm run dev
```

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
├── src/
│   ├── main/           # Electronメインプロセス
│   │   ├── services/   # バックエンドサービス
│   │   ├── security/   # セキュリティ設定
│   │   └── preload.ts  # Preloadスクリプト
│   └── renderer/       # Reactフロントエンド
│       ├── components/ # UIコンポーネント
│       └── services/   # フロントエンドサービス
├── resources/          # アプリリソース
│   ├── icons/         # アプリアイコン
│   ├── fonts/         # フォントファイル
│   └── templates/     # テンプレート
├── dist/              # Viteビルド出力
├── dist-electron/     # Electronビルド出力
└── release/           # パッケージング出力
```

## 🔧 開発コマンド

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run preview` | ビルドプレビュー |
| `npm run typecheck` | 型チェック |
| `npm run lint` | ESLintチェック |
| `npm run clean` | ビルド成果物削除 |

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