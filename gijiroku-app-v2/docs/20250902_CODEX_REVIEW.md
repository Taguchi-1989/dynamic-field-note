# 20250902_Codex Review — 現状診断と提案

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

## 要約（結論）
- 目的（開発/本番どちらでも同一テンプレートを使え、フォルダごと移動で動くポータブル運用）は、既存の設計でほぼ実現可能です。
- 既に `better-sqlite3` と `WorkspaceService` により、SQLite 同梱と「実行ファイル直下の `workspace` 優先」ポータブル設計が入っています。
- 一方で「テンプレートの実体参照先」と「保存経路」が混在しています（`resources/prompts` 読み出し vs DB 保存 or モック/外部API）。ここを「ワークスペース/DB を唯一の正」に統一すれば、安定して目的を達成できます。
- パッケージング上は `better-sqlite3` のネイティブ `.node` を ASAR 外出しする設定（asarUnpack）が必要です。ドキュメント・設定を明確化しましょう。

## 主要ファインディング
- ポータブル対応:
  - `WorkspaceService` が `GIJIROKU_WORKSPACE_DIR` → 実行ファイル直下 `workspace` → `userData/workspace` の順で解決。初回起動で `resources/templates` を `workspace/templates` へコピーする実装がすでにあります。
  - `DbService` は `WorkspaceService.resolve().paths.db`（例: `workspace/data/gijiroku.db`）を使い SQLite を初期化。これは移動に強い構成です。
- テンプレートの読み出し経路:
  - `app/src/main/ipc/file-handler.ts` は `resources/prompts` を直接読む実装が残存。
  - Renderer 側 `PromptSelector.tsx` は IPC で読み込めなかった場合、モックにフォールバック。さらに一部で外部 API（`API_ENDPOINTS.prompts`）に更新 PUT を試みるコードが残っており、保存先が不統一。
- API キーの扱い:
  - 本番は `SecureStorageService`（keytar）による保存で安全。完全ポータブル（フォルダ移動で資格情報も一緒に移る）を最優先にするなら、ワークスペース側に暗号化保存のオプションを追加する設計判断が必要（セキュリティ vs 可搬性）。
- ビルド/配布:
  - `electron-builder` 設定に `asar: true`。`better-sqlite3` を使用するため、ネイティブ `.node` は ASAR 外出し（`asarUnpack: ["**/*.node"]` など）推奨。

## 推奨アーキテクチャ（統一案）
- テンプレートの単一ソース:
  - 読み出しは「1) DB → 2) なければ workspace/templates → 3) なければ resources/templates（初回シードのみ）」の順で解決。
  - 保存は常に「DB」へ。初回のみ `resources/templates` を DB にインポートする Seeder を用意。
- IPC を明確化:
  - `ipcMain.handle('templates:list' | 'templates:get' | 'templates:upsert' | 'templates:delete')` を追加し、Renderer は全て IPC 経由で CRUD。
  - 既存の `file:load-prompts` は段階的に廃止/内部で DB 参照に切替。
- Renderer 側の変更:
  - `PromptSelector.tsx` の外部 API への PUT を撤廃し、上記 IPC の `upsert` を使用。
  - フォールバックのモック使用は「IPC/DB 不可時のみ」。
- API キー（可搬性オプション）:
  - 既定は現状通り `keytar`（安全）。
  - ポータブルモード選択時のみ `workspace/config/api.local.json` に暗号化保存（ユーザー提供パスフレーズで AES など）。実装は別途段階導入。
- パッケージング:
  - `electron-builder.(yml|json)` に `asarUnpack: ["**/*.node"]` を追加（`better-sqlite3` 動作安定のため）。
  - 既定では `workspace` は同梱不要。初回起動で自動作成/コピー。配布物としてポータブルテンプレートを同梱したい場合のみ `extraResources` で `workspace/` を含める運用も可。

## この方針が目的に適う理由
- フォルダごと移動対応: DB・テンプレート実体を `workspace` 配下に集約し、`WorkspaceService` の解決規約に従うことで、フォルダ移動で完結。
- 開発/本番の一致: 開発/本番どちらも IPC → DB を通るため、挙動が一致。
- 保守性: テンプレートの単一ソース（DB）に統一し、ファイル直読みは初期投入/バックアップ用途に限定。

## 変更が必要な箇所（抜粋）
- Main（Electron）
  - `app/src/main/ipc/file-handler.ts`: `file:load-prompts` を `workspace/templates` → DB 優先に変更、もしくは新設の `templates:*` IPC にリダイレクト。
  - `app/src/main/services/DbService.ts`: `prompt_templates`（id, title, content, description, category, is_active, updated_at）テーブルの DDL 追加、DAO メソッド追加。
- Renderer（React）
  - `app/src/renderer/components/PromptSelector.tsx`: 外部 API への PUT を撤廃し、`window.electronAPI.templates.upsert(...)`（新設）に置換。ロードも `templates:list` を利用。
- Build
  - `electron-builder.yml/json`: `asarUnpack: ["**/*.node"]` を明記。必要なら `extraResources` 設定例を README/Docs に追記。

## リスクと対策
- セキュリティ vs 可搬性（API キー）
  - 既定は `keytar`（安全）。完全可搬を望むユーザー向けに“ポータブル資格情報”を明示的にオンにする UI と暗号化保存を用意。
- 互換性
  - 既存ユーザーの `resources/prompts` 依存から DB 移行時は、初回起動でシード + 重複回避ロジック（ファイル名 or id をキー）を実施。

## 検証チェックリスト
- ポータブルモード（実行 EXE と同階層に `workspace/`）で:
  - [ ] 初回起動時に DB とテンプレートが自動投入される
  - [ ] テンプレート編集→再起動で編集が反映されている
  - [ ] EXE+workspace フォルダを別 PC にコピーしても上記が維持
- インストールモード（`userData/workspace`）で:
  - [ ] DB 初期化/テンプレート投入が正常
  - [ ] API キーは `keytar` から参照できる
- ビルド
  - [ ] `asarUnpack` 設定で `better-sqlite3` が起動する
  - [ ] `npm run dist` の成果物で上記一連が成立

---

最終判断: 現在の方向性は妥当です。上記の“テンプレート単一ソース（DB）化 + IPC 統一 + asarUnpack 明示”を適用すれば、安定して「テンプレート可搬・環境一致」を実現できます。
