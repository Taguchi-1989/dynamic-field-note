# 20250902_開発者ガイド - 議事録アプリ v2

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

MVP開発に特化した開発者向け総合ドキュメントです。

## 🚀 クイックスタート

### 初回セットアップ
```bash
# 1. 依存関係インストール
npm install

# 2. 環境確認
npm run setup

# 3. Feature Flags確認
npm run features

# 4. 開発モード開始
npm run dev
```

### デバッグ実行
```bash
# VSCodeでF5キーを押すか
npm run dev:debug
```

## 📋 開発用コマンド一覧

### 🛠️ 環境・セットアップ
| コマンド | 説明 |
|---------|------|
| `npm run setup` | 開発環境確認・セットアップ状況表示 |
| `npm run info` | システム情報表示 |
| `npm run check:deps` | 依存関係の監査・更新確認 |

### 🔧 開発・ビルド
| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run dev:debug` | デバッグモードで開発サーバー起動 |
| `npm run dev:features` | 開発機能を有効化して起動 |
| `npm run build` | プロダクションビルド |
| `npm run clean` | ビルド成果物クリア |

### 🎯 Feature Flag管理
| コマンド | 説明 |
|---------|------|
| `npm run features` | Feature Flags状態表示 |
| `node scripts/feature-toggle.js mvp` | MVP開発モードに切り替え |
| `node scripts/feature-toggle.js full` | フル開発モードに切り替え |

### 🐛 デバッグ・トラブルシューティング
| コマンド | 説明 |
|---------|------|
| `npm run debug` | 全デバッグ情報表示 |
| `npm run debug:build` | ビルドファイル状態確認 |
| `npm run debug:processes` | Electronプロセス確認 |
| `npm run debug:logs` | ログファイル確認 |

### 🧪 テスト・品質
| コマンド | 説明 |
|---------|------|
| `npm run test:mvp` | MVP機能のテスト実行 |
| `npm run typecheck` | TypeScript型チェック |
| `npm run lint` | ESLintによるコード品質チェック |
| `npm run format` | Prettierによるコード整形 |

### 📦 リリース
| コマンド | 説明 |
|---------|------|
| `npm run dist` | 配布用パッケージ作成 |
| `npm run dist:win` | Windows向けパッケージ作成 |
| `npm run pack` | パッケージ化テスト（配布なし） |

## 🎯 MVP機能スコープ

### ✅ 実装完了機能
- **APIキー管理**: Gemini・OpenAI対応
- **PDF生成**: Markdown → PDF変換
- **カスタムプロンプト**: テンプレート管理・適用
- **分割処理**: 大容量VTTファイル対応
- **再実行機能**: エラー時のリトライ処理

### 🚧 開発中機能（無効化済み）
- **検索機能**: SQLite FTS・ベクトル検索
- **辞書機能**: 用語管理・インポート/エクスポート
- **ログ機能**: 詳細ログ記録・閲覧
- **同期機能**: 設定・データ同期

### 📈 拡張機能（部分実装）
- **画像サポート**: OCR・画像処理
- **LaTeXサポート**: 数式レンダリング
- **Mermaidサポート**: 図表生成

## 🏗️ アーキテクチャ概要

```
app/
├── src/
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
```

## 🔧 開発環境設定

### 必要ツール
- **Node.js**: v18+ (推奨: v22+)
- **npm**: 最新版
- **VSCode**: 推奨エディタ
- **Git**: バージョン管理

### 推奨VSCode拡張機能
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Electron Debug

## 🐛 トラブルシューティング

### よくある問題

#### 1. Electronが起動しない
```bash
# プロセス確認
npm run debug:processes

# クリーンビルド
npm run clean && npm run build
```

#### 2. Feature Flagが反映されない
```bash
# 状態確認
npm run features

# MVP モードに切り替え
node scripts/feature-toggle.js mvp
```

#### 3. TypeScript エラー
```bash
# 型チェック実行
npm run typecheck

# ビルドファイル確認
npm run debug:build
```

#### 4. モジュールが見つからない
```bash
# 依存関係確認
npm run debug

# 再インストール
npm run clean:all && npm install
```

## 📚 参考ドキュメント

### プロジェクト固有
- [`docs/CURRENT_ISSUES.md`](./CURRENT_ISSUES.md) - 既知の問題・制限事項
- [`docs/FEATURE_STATUS.md`](./FEATURE_STATUS.md) - 機能実装状況
- [`docs/ENVIRONMENT_DIFFERENCES.md`](./ENVIRONMENT_DIFFERENCES.md) - 開発/本番環境の違い
- [`docs/ELECTRON_GUIDE.md`](./ELECTRON_GUIDE.md) - Electron開発ガイド
- [`scripts/README.md`](../scripts/README.md) - 開発スクリプト説明

### 外部リファレンス
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Vite Guide](https://vitejs.dev/guide/)

## 🚀 開発フロー

### 日常開発
1. `npm run setup` - 環境確認
2. `npm run features` - 機能状態確認
3. `npm run dev` - 開発開始
4. VSCode F5 - デバッグ実行

### 機能追加
1. `docs/FEATURE_STATUS.md` - 仕様確認
2. Feature Flag設定 - 機能有効化
3. 実装・テスト
4. `npm run test:mvp` - MVP テスト

### リリース準備
1. `npm run typecheck` - 型チェック
2. `npm run lint` - コード品質確認
3. `npm run test:mvp` - 統合テスト
4. `npm run dist` - パッケージ作成

---

**最終更新**: 2025-09-01  
**対象バージョン**: 議事録アプリ v2.0.2+  
**メンテナ**: 開発環境最適化チーム