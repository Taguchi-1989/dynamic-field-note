# Traefik導入ガイド - Dynamic Field Note

**最終更新**: 2025-10-30

---

## 📋 概要

このガイドでは、Dynamic Field NoteプロジェクトにTraefik Reverse Proxyを導入し、複数のDev Container環境でポート競合を回避する方法を説明します。

### Traefikとは？

- **リバースプロキシ**: 複数のサービスを単一のエントリーポイントで管理
- **ポート競合解決**: 各サービスに独自のサブドメイン（`*.localhost`）を割り当て
- **HMR/WebSocket対応**: React Native/ExpoのHot Module Replacementに対応
- **ダッシュボード**: http://traefik.localhost:8080 でサービス状態を可視化

---

## 🚀 セットアップ手順

### ステップ1: 共通Traefikの起動（初回のみ）

全プロジェクト共通のTraefikコンテナを起動します。**既に起動済みの場合はスキップしてください。**

```bash
# ZBC-migration-kitルートに移動
cd /workspaces/ZBC-migration-kit

# gijiroku-app-v2のTraefik設定を利用（既に存在する場合）
cd gijiroku-app-v2/traefik

# Traefik起動
docker-compose up -d

# 起動確認
docker ps | grep traefik

# ダッシュボードアクセス
# http://traefik.localhost:8080
```

**または、新規にTraefik設定を作成する場合**:

```bash
# ルートにTraefik専用ディレクトリを作成
mkdir -p /workspaces/ZBC-migration-kit/traefik/config
cd /workspaces/ZBC-migration-kit/traefik

# docker-compose.ymlをコピー
cp ../gijiroku-app-v2/traefik/docker-compose.yml .

# 動的設定をコピー
cp ../gijiroku-app-v2/traefik/config/dynamic.yml config/

# 起動
docker-compose up -d
```

### ステップ2: Dev Containerの再起動

Dynamic Field NoteのDev Containerを再構築します。

**VSCodeの場合**:

1. `Ctrl+Shift+P` → `Dev Containers: Rebuild Container`
2. 再起動完了まで待機（約2-3分）

**コマンドラインの場合**:

```bash
cd "Dynamic Field Note"

# コンテナ停止
docker-compose -f .devcontainer/docker-compose.yml down

# 再構築
docker-compose -f .devcontainer/docker-compose.yml up -d --build
```

### ステップ3: アクセス確認

Dev Container起動後、以下のURLにアクセスできることを確認します。

```bash
# Metro Bundler（React Native開発サーバー）
http://dynamic-field-note.localhost

# Expo DevTools
http://dynamic-field-note-expo.localhost

# Storybook（UIコンポーネントカタログ）
http://dynamic-field-note-storybook.localhost

# Traefikダッシュボード
http://traefik.localhost:8080
```

---

## 🔧 設定詳細

### サービスマッピング

| サービス          | URL                                           | 内部ポート |
| ----------------- | --------------------------------------------- | ---------- |
| Metro Bundler     | http://dynamic-field-note.localhost           | 8081       |
| Expo Dev Server   | http://dynamic-field-note-expo.localhost      | 19000      |
| Expo DevTools     | http://dynamic-field-note-devtools.localhost  | 19002      |
| Storybook         | http://dynamic-field-note-storybook.localhost | 6006       |
| Traefik Dashboard | http://traefik.localhost:8080                 | 8080       |

### Traefikラベル（docker-compose.yml）

```yaml
labels:
  # Traefik有効化
  - 'traefik.enable=true'

  # Metro Bundler
  - 'traefik.http.routers.dynamic-field-note.rule=Host(`dynamic-field-note.localhost`)'
  - 'traefik.http.routers.dynamic-field-note.service=dynamic-field-note'
  - 'traefik.http.services.dynamic-field-note.loadbalancer.server.port=8081'

  # HMR/WebSocket対応ミドルウェア
  - 'traefik.http.routers.dynamic-field-note.middlewares=hmr-headers@file,dev-cors@file'
```

---

## 🎯 開発ワークフロー

### 1. 通常の開発

```bash
# Dev Container内でExpo起動
npm start

# ブラウザでアクセス
open http://dynamic-field-note.localhost

# Storybookを起動
npm run storybook
open http://dynamic-field-note-storybook.localhost
```

### 2. 複数プロジェクトの同時開発

```bash
# Dynamic Field Note
http://dynamic-field-note.localhost:8081

# gijiroku-app-v2
http://gijiroku.localhost:3012

# 他のプロジェクト
http://<project-name>.localhost:<port>
```

**ポート競合なし！各プロジェクトが独自のサブドメインで動作します。**

### 3. Traefikダッシュボードで状態確認

http://traefik.localhost:8080 にアクセスして：

- 起動中のサービス一覧
- ルーティングルール
- ヘルスチェック状態
- リクエスト統計

---

## 🐛 トラブルシューティング

### 問題1: `*.localhost`にアクセスできない

**原因**: Traefikコンテナが起動していない

**解決策**:

```bash
cd /workspaces/ZBC-migration-kit/gijiroku-app-v2/traefik
docker-compose up -d

# 確認
docker ps | grep traefik
```

### 問題2: `network traefik-network not found`

**原因**: Traefikネットワークが作成されていない

**解決策**:

```bash
# Traefik起動時に自動作成されるが、手動作成も可能
docker network create traefik-network
```

### 問題3: HMR/WebSocketが動作しない

**原因**: Traefikのミドルウェア設定が不足

**解決策**:

```bash
# dynamic.ymlが存在することを確認
ls /workspaces/ZBC-migration-kit/gijiroku-app-v2/traefik/config/dynamic.yml

# Traefik再起動
cd /workspaces/ZBC-migration-kit/gijiroku-app-v2/traefik
docker-compose restart
```

### 問題4: Dev Container起動時にエラー

**原因**: docker-compose.ymlのパスや設定が不正

**解決策**:

```bash
# devcontainer.jsonの設定確認
cat .devcontainer/devcontainer.json

# docker-compose.ymlの構文確認
docker-compose -f .devcontainer/docker-compose.yml config

# ログ確認
docker-compose -f .devcontainer/docker-compose.yml logs
```

---

## 📚 関連リンク

### 公式ドキュメント

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Expo Development Server](https://docs.expo.dev/workflow/development-mode/)
- [React Native Metro](https://facebook.github.io/metro/)
- [Docker Compose](https://docs.docker.com/compose/)

### プロジェクトドキュメント

- [CLAUDE.md](../CLAUDE.md) - プロジェクト概要
- [DEVELOPMENT_ENVIRONMENT_SETUP.md](./DEVELOPMENT_ENVIRONMENT_SETUP.md) - 開発環境セットアップ
- [README.md](../README.md) - プロジェクトREADME

---

## ✅ チェックリスト

- [ ] Traefikコンテナが起動している（`docker ps | grep traefik`）
- [ ] traefik-networkが存在する（`docker network ls | grep traefik`）
- [ ] Dev Containerが再構築済み
- [ ] http://dynamic-field-note.localhost にアクセス可能
- [ ] http://traefik.localhost:8080 でダッシュボード確認
- [ ] HMR/WebSocketが正常動作（コード変更が即反映）

---

## 🚨 注意事項

### セキュリティ

- **開発環境専用**: この設定は開発環境専用です。本番環境では使用しないでください。
- **CORS設定**: `dev-cors` ミドルウェアは全オリジン許可（`*`）です。本番では厳密に設定してください。
- **ダッシュボード**: Traefikダッシュボードは認証なしでアクセス可能です。本番では必ず認証を設定してください。

### パフォーマンス

- **リソース**: Traefikは軽量ですが、多数のサービスを管理する場合はメモリ使用量に注意してください。
- **ログ**: アクセスログは`./logs`に保存されます。定期的にクリーンアップしてください。

---

**このガイドに従って設定すれば、ポート競合なしで複数プロジェクトを同時開発できます！** 🎉
