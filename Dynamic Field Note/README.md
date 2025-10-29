# 📘 Dynamic Field Note

> **現場動的要約・安全同期 出張報告アプリ**

音声入力と写真をリアルタイム構造化し、Markdownレポートとして即時生成。
「現場で95%、オフィスで5%仕上げる報告書」を実現します。

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-Expo-000000.svg)](https://expo.dev/)

## 🎯 プロジェクト概要

| 項目                     | 内容                                                         |
| ------------------------ | ------------------------------------------------------------ |
| **プロジェクト名**       | Dynamic Field Note（動的現場ノート）                         |
| **開発目的**             | 現場での音声・写真・メモを動的に構造化し、報告書作成を自動化 |
| **主要プラットフォーム** | Azure (Functions / Blob Storage / Graph API)                 |
| **使用モデル**           | Gemini 2.5 Pro および GPT-5（Fast→Quality 二段要約）         |
| **開発方針**             | OSS優先（MIT／Apache 2.0）、商用利用可、再販可設計           |

## ✨ 主な機能

- 🎙 **音声入力**: 端末標準音声入力（5秒単位で蓄積、5分/無音30秒で送信）
- 🤖 **二段要約**: Gemini 2.5 Pro → GPT-5 連携で高精度要約
- 📸 **写真撮影**: 注釈機能（丸・矢印・テキスト描画）
- 🧠 **Markdown構造化**: 決定事項・ToDo・課題を自動整理
- ☁️ **クラウド同期**: Azure Blob / Graph API経由
- 🔐 **セキュリティ**: TLSピンニング＋署名ZIP＋ログ監査
- 📄 **出力**: Markdown / PDF / ZIP

## 📊 品質指標

### Lighthouse スコア（Expo Web）

![Performance](https://img.shields.io/badge/Performance-78-green)
![Accessibility](https://img.shields.io/badge/Accessibility-94-brightgreen)
![Best Practices](https://img.shields.io/badge/Best%20Practices-100-brightgreen)
![SEO](https://img.shields.io/badge/SEO-92-brightgreen)

### Core Web Vitals

![FCP](https://img.shields.io/badge/FCP-0.29s-brightgreen)
![LCP](https://img.shields.io/badge/LCP-2.35s-green)
![TBT](https://img.shields.io/badge/TBT-169ms-green)
![CLS](https://img.shields.io/badge/CLS-0.006-brightgreen)

**最終測定日**: 2025-10-20

詳細レポート: [PERFORMANCE_FINAL_REPORT.md](docs/PERFORMANCE_FINAL_REPORT.md)

## 🚀 クイックスタート

### 方法1: Docker Compose（推奨・ポート競合なし）

Traefik統合により、複数プロジェクトを同時開発可能。

```bash
# 1. リポジトリのクローン
git clone https://github.com/Taguchi-1989/dynamic-field-note.git
cd "dynamic-field-note"

# 2. サービス起動（Traefik + Expo + Storybook）
make up

# 3. アクセス
# - Expo (Metro): http://expo.localhost
# - Expo Dev Server: http://expo-dev.localhost
# - Storybook: http://storybook.localhost
```

**主な運用コマンド**:

```bash
make up         # 全サービス起動
make down       # 全サービス停止
make restart    # 全サービス再起動
make logs       # 全ログ表示（リアルタイム）
make logs-expo  # Expoログのみ表示
make logs-sb    # Storybookログのみ表示
make clean      # コンテナ・ボリューム削除（完全クリーンアップ）
make test       # 動作確認（URLアクセステスト）
make help       # ヘルプ表示
```

### 方法2: 通常の開発環境（npm直接実行）

```bash
# 1. リポジトリのクローン
git clone https://github.com/Taguchi-1989/dynamic-field-note.git
cd dynamic-field-note

# 2. 依存関係のインストール
npm install

# 3. 開発サーバー起動
npm start
```

### HTTPS対応（オプション）

開発環境でHTTPSを使用したい場合は、以下の手順で設定できます。

**1. mkcertのインストール**:

```bash
# macOS
brew install mkcert

# Linux (Debian/Ubuntu)
sudo apt install libnss3-tools
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# Windows (Chocolatey)
choco install mkcert
```

**2. ローカルCA作成と証明書生成**:

```bash
# ローカルCA作成
mkcert -install

# 証明書生成（プロジェクトルートで実行）
cd "Dynamic Field Note"
mkdir -p certs
mkcert -cert-file certs/localhost.crt -key-file certs/localhost.key \
  "expo.localhost" "*.expo.localhost" "storybook.localhost" "localhost"
```

**3. docker-compose.ymlのHTTPS設定を有効化**:

`docker-compose.yml` 内のHTTPS関連のコメントアウトを解除してください。

**4. サービス再起動**:

```bash
make down
make up

# HTTPSでアクセス
# https://expo.localhost
# https://storybook.localhost
```

**詳細ガイド**:

- [Traefik導入ガイド](docs/TRAEFIK_SETUP_GUIDE.md) - Traefik統合セットアップ
- [開発環境構築ガイド](docs/setup-guide.md) - 通常の開発環境セットアップ

### E2Eテスト（Playwright）

Traefik経由でPlaywrightテストを実行する場合の設定方法。

**playwright.config.ts の baseURL設定**:

```typescript
export default defineConfig({
  use: {
    // Traefik経由でアクセス
    baseURL: 'http://expo.localhost',
    // または直接アクセス
    // baseURL: 'http://localhost:8081',
  },
  webServer: {
    // Docker Composeで起動している場合は不要
    // command: 'npm start',
    // url: 'http://expo.localhost',
    // reuseExistingServer: true,
  },
});
```

**テスト実行**:

```bash
# 1. サービス起動
make up

# 2. E2Eテスト実行
npm run test:e2e

# 3. UIモードで実行
npx playwright test --ui
```

## 🔧 運用手順とトラブルシューティング

### 基本運用フロー

**開発開始時**:

```bash
# 1. サービス起動
make up

# 2. 状態確認
make ps

# 3. ログ監視（別ターミナル）
make logs
```

**開発終了時**:

```bash
# サービス停止（コンテナは保持）
make down

# 完全クリーンアップ（コンテナ・ボリューム削除）
make clean
```

**サービス再起動時**:

```bash
# 全サービス再起動
make restart

# 特定サービスのみ再起動
docker compose restart expo
docker compose restart storybook
```

### トラブルシューティング

#### 問題1: `http://expo.localhost` にアクセスできない

**原因**: Traefikコンテナが起動していない、またはポート80が使用中

**解決策**:

```bash
# Traefikコンテナの状態確認
docker ps | grep dfn-traefik

# コンテナが停止している場合
make up

# ポート80の使用状況確認
sudo lsof -i :80

# 他のサービスがポート80を使用している場合は停止
```

#### 問題2: `npm install` が実行されない・パッケージが見つからない

**原因**: node_modules ボリュームがマウントされているため、ホスト側の変更が反映されない

**解決策**:

```bash
# ボリュームを削除して再構築
make clean
make up

# または、コンテナ内で直接インストール
docker compose exec expo npm install
```

#### 問題3: HMR（Hot Module Replacement）が動作しない

**原因**: ファイル監視の設定が不足、またはTraefikのWebSocket設定

**解決策**:

```bash
# 1. docker-compose.ymlの環境変数を確認
# WATCHPACK_POLLING=true
# CHOKIDAR_USEPOLLING=1
# が設定されているか確認

# 2. サービス再起動
make restart

# 3. ログでエラー確認
make logs-expo
```

#### 問題4: Storybookが表示されない

**原因**: Storybookコンテナが起動失敗、またはポート6006が未公開

**解決策**:

```bash
# Storybookログ確認
make logs-sb

# Storybookコンテナ再起動
docker compose restart storybook

# Storybookを手動起動（デバッグ用）
docker compose exec storybook npx storybook dev -p 6006 --host 0.0.0.0 --ci
```

#### 問題5: `make test` で接続失敗

**原因**: サービスが完全に起動する前にテスト実行

**解決策**:

```bash
# サービス起動後、30秒程度待機してからテスト実行
make up
sleep 30
make test

# または、手動でURLアクセス確認
curl -I http://expo.localhost
curl -I http://storybook.localhost
```

#### 問題6: Docker Composeバージョンエラー

**原因**: 古いDocker Composeバージョン（v1系）を使用

**解決策**:

```bash
# Docker Composeバージョン確認
docker compose version

# v2.0以上が必要
# 古い場合はDocker Desktopを更新、またはDocker Compose v2をインストール
# https://docs.docker.com/compose/install/
```

#### 問題7: ログファイルが肥大化

**原因**: アクセスログの蓄積

**解決策**:

```bash
# ログローテーション設定を確認（docker-compose.yml）
# x-logging:
#   options:
#     max-size: "10m"
#     max-file: "3"

# コンテナ再作成でログリセット
make down
make up
```

### デバッグコマンド集

```bash
# サービス状態確認
make ps
docker compose ps

# docker-compose.yml構文検証
make config
docker compose config

# コンテナログ確認（全サービス）
make logs

# 特定サービスのログ（フォロー）
make logs-expo
make logs-sb
docker compose logs -f traefik

# コンテナ内でシェル起動
docker compose exec expo sh
docker compose exec storybook sh

# ネットワーク確認
docker network ls
docker network inspect dynamic-field-note_edge

# ボリューム確認
docker volume ls
docker volume inspect dynamic-field-note_expo_node_modules

# Traefik設定確認（API経由）
curl http://localhost:8080/api/http/routers
curl http://localhost:8080/api/http/services
```

### パフォーマンス最適化

**node_modules キャッシュ**:

```bash
# 初回ビルド時のみ時間がかかる
# 2回目以降はボリュームキャッシュにより高速化

# キャッシュクリア（トラブル時のみ）
docker volume rm dynamic-field-note_expo_node_modules
make up
```

**ファイル監視の軽量化**:

```bash
# WSL2やDockerで大量のファイルを監視する場合、
# .dockerignore に不要なディレクトリを追加
echo "node_modules" >> .dockerignore
echo ".git" >> .dockerignore
```

## 📂 プロジェクト構造

```
dynamic-field-note/
├── docs/                    # ドキュメント
│   ├── 企画書.md            # マスター企画書
│   ├── ROADMAP.md          # 開発ロードマップ
│   └── ...
├── src/                     # ソースコード（Phase 0で作成）
│   ├── components/         # UIコンポーネント
│   ├── screens/            # 画面
│   ├── services/           # ビジネスロジック・API
│   ├── hooks/              # カスタムフック
│   ├── types/              # 型定義
│   └── utils/              # ユーティリティ
├── azure-functions/         # Azure Functions（Phase 4で作成）
└── tests/                   # テスト（各フェーズで追加）
```

## 📋 開発ロードマップ

| フェーズ            | 期間 | 目的                 | 主タスク                      |
| ------------------- | ---- | -------------------- | ----------------------------- |
| **P0 環境構築**     | 1週  | 開発基盤整備         | Expo環境構築／iPhone 12ビルド |
| **P1 PoC**          | 2週  | 音声→要約→Markdown   | 標準音声入力／Gemini接続      |
| **P2 UI/UX整備**    | 2週  | プレビュー中心UI     | 中間/最終要約ボタン／メニュー |
| **P3 ローカル保存** | 3週  | 写真+注釈+ZIP        | SQLite/JSZip導入              |
| **P4 Azure連携**    | 3週  | Blob Storage連携     | HTTPS通信・TLSピンニング      |
| **P5 α版統合**      | 2週  | 総合統合／脆弱性試験 | GPT-5統合・PDF出力            |
| **P6 β・運用化**    | 継続 | 導入展開・MDM        | Intune登録／VPN化             |

詳細は [ROADMAP.md](docs/ROADMAP.md) を参照してください。

## 🏗️ アーキテクチャ

```mermaid
flowchart LR
  subgraph Device[iPhone / Android]
    MIC[音声入力]
    CAM[カメラ撮影]
    DB[(SQLite)]
    PREVIEW[Markdownプレビュー]
  end

  subgraph BFF[Azure Functions]
    AI1[Gemini 2.5 Pro]
    AI2[GPT-5]
    STRUCT[構造化/要約]
  end

  subgraph Storage[Azure Blob]
    FILES[MD/JSON/Photos/ZIP]
    LOGS[監査ログ]
  end

  MIC-->BFF
  CAM-->DB-->FILES
  BFF-->FILES
  BFF-->LOGS
```

## 🔧 技術スタック

### フロントエンド

- React Native (Expo)
- TypeScript
- React Native Paper
- SQLite
- JSZip

### バックエンド

- Azure Functions (TypeScript)
- Azure Blob Storage
- Azure Key Vault

### AI/ML

- Google Gemini 2.5 Pro
- OpenAI GPT-5

## 📊 開発状況

現在のフェーズ: **Phase 2 完了（改善版） - UI/UX整備 + アクセシビリティ対応 🎉**

| フェーズ            | ステータス | 完了日     | 品質スコア |
| ------------------- | ---------- | ---------- | ---------- |
| **P0 環境構築**     | ✅ 完了    | 2025-10-17 | 5/5        |
| **P1 PoC**          | ✅ 完了    | 2025-10-17 | 5/5        |
| **P2 UI/UX整備**    | ✅ 完了    | 2025-10-18 | **5.0/5**  |
| **P3 ローカル保存** | 🔲 未着手  | -          | -          |
| **P4 Azure連携**    | 🔲 未着手  | -          | -          |
| **P5 α版統合**      | 🔲 未着手  | -          | -          |
| **P6 β・運用化**    | 🔲 未着手  | -          | -          |

### Phase 2 実装済み機能 ✨

#### コア機能

- ✅ リッチ Markdown プレビュー（react-native-markdown-display）
- ✅ FAB 要約ボタン（中間・最終まとめ）
- ✅ Drawer ナビゲーション（ハンバーガーメニュー）
- ✅ AI 状態表示インジケーター

#### Phase 2 改善機能（2025-10-18）

- 🎉 **AI 処理の進捗バー表示**（0% → 10% → 30% → 70% → 100%）
- 🎉 **アクセシビリティ対応**（フォントサイズ調整: 小・中・大）
- 🎉 **ダークモード準備完了**（Phase 2.5 で有効化予定）
- 🎉 **設定の永続化**（AsyncStorage による保存）

#### 品質保証

- ✅ TypeScript strict mode（エラー: 0 件）
- ✅ ESLint（警告: 0 件）
- ✅ Prettier（100%準拠）
- ✅ コード品質スコア: **5.0/5**

詳細は [Phase 2 改善レポート](docs/phase2-improvements.md) を参照してください。

進捗状況は [GitHub Issues](https://github.com/Taguchi-1989/dynamic-field-note/issues) で確認できます。

## 🤝 コントリビューション

現在、このプロジェクトは開発初期段階（PoC）のため、外部からのコントリビューションは受け付けていません。
β版以降で公開予定です。

## 📝 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照してください。

商用利用・再販可能です。

## 📚 ドキュメント

- [企画書（マスター）](docs/企画書.md) - プロジェクト全体の設計書
- [開発ロードマップ](docs/ROADMAP.md) - 詳細な開発計画
- [イシュー管理ガイド](https://github.com/Taguchi-1989/dynamic-field-note/issues/1) - 開発フロー

## 📞 お問い合わせ

プロジェクトに関する質問は [GitHub Issues](https://github.com/Taguchi-1989/dynamic-field-note/issues) で受け付けています。

---

**© 2025 Dynamic Field Note Project**
