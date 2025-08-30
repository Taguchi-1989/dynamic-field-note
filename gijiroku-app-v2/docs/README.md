# 議事録アプリ v2 ドキュメント

## ドキュメント構成

### 📁 architecture/
アーキテクチャ設計・実装状況に関するドキュメント
- `DETAILED-ARCHITECTURE.md` - 詳細アーキテクチャ仕様
- `IMPLEMENTATION_STATUS.md` - 実装進捗状況
- `MASTERFILE_COMPLIANCE_CHECK.md` - マスターファイル準拠チェック

### 📁 development/
開発管理・セッション追跡
- `DEVELOPMENT_LOG.md` - 開発ログ
- `SESSION_TRACKER.md` - セッション追跡管理

### 📁 sessions/
日次開発セッション記録
- `SESSION_LOG_TEMPLATE.md` - セッション記録テンプレート
- 各日付のセッション記録（例: `2025-08-29_session.md`）

### 📄 その他
- `STANDALONE_SETUP.md` - スタンドアロンセットアップガイド

## マスターファイル
プロジェクトの真実の源（Single Source of Truth）は [masterfile.md](../masterfile.md) です。

## 開発記録の付け方

1. 新しいセッションを開始する際は、`sessions/SESSION_LOG_TEMPLATE.md` をコピーして日付付きファイルを作成
2. 作業内容を記録
3. 重要な変更は `development/DEVELOPMENT_LOG.md` に集約
4. アーキテクチャの変更は該当ドキュメントを更新

最終更新: 2025-08-30