# ポータブル SQLite 実装計画（実行手順）

## ゴール
- 開発/本番で同一テンプレート群を利用し、保存先は常に DB。
- フォルダごと移動（EXE と `workspace/` 同階層コピー）でそのまま動作。
- 既定は安全な API キー保存（keytar）。オプションで“ポータブル資格情報”に対応。

## フェーズ別タスク

### Phase 1: データモデル整備（DbService）
- DDL 追加（例）
  - `prompt_templates`
    - `id TEXT PRIMARY KEY`
    - `title TEXT NOT NULL`
    - `content TEXT NOT NULL`
    - `description TEXT`
    - `category TEXT DEFAULT 'general'`
    - `is_active INTEGER DEFAULT 1`
    - `updated_at TEXT DEFAULT (datetime('now'))`
- DAO 追加
  - `listTemplates()`, `getTemplate(id)`, `upsertTemplate(record)`, `deleteTemplate(id)`
- Seeder 追加
  - 初回起動時に `resources/templates/*.json` を読み込み、DB 未登録のものだけ投入。

### Phase 2: IPC の統一
- `app/src/main/preload.ts`
  - `templates: { list, get, upsert, delete }` を `contextBridge` で公開。
- `app/src/main/index.ts`
  - `ipcMain.handle('templates:list' ...)` などを登録（DbService 経由）。
- 互換: 旧 `file:load-prompts` は内部で `templates:list` に委譲 or 段階的に削除。

### Phase 3: Renderer 切替
- `app/src/renderer/components/PromptSelector.tsx`
  - 読み込み: `window.electronAPI.templates.list()` に統一。
  - 保存: 外部 API への PUT を削除し、`window.electronAPI.templates.upsert()` に切替。
  - フォールバック: IPC 失敗時のみモックを使用。

### Phase 4: パッケージング調整
- `electron-builder.yml/json`
  - `asar: true` のまま、`asarUnpack: ["**/*.node"]` を追加（`better-sqlite3` 対応）。
  - （任意）`extraResources` で初期 `workspace/` を同梱したい場合は明示。
- ビルド確認: `npm run dist` → ポータブル/インストーラ成果物で DB 起動と CRUD を確認。

### Phase 5: ポータブル資格情報（任意/オプトイン）
- 設定 UI に「ポータブル保存」トグル + パスフレーズ入力。
- `workspace/config/api.local.json.enc` に AES で保存/復号。
- 既定 OFF（keytar 優先、セキュリティ担保）。

## 参考コード位置
- DB: `app/src/main/services/DbService.ts`
- Workspace: `app/src/main/services/WorkspaceService.ts`
- IPC（既存）: `app/src/main/ipc/file-handler.ts`
- Renderer: `app/src/renderer/components/PromptSelector.tsx`

## 動作確認チェックリスト
- 開発
  - [ ] `npm run dev` で `templates:list` が動作し、画面に反映される
  - [ ] 編集→保存（`upsert`）→再読込で DB 値が反映
- 本番（インストール）
  - [ ] `userData/workspace` に DB 作成、テンプレート初回投入
  - [ ] 再起動後も編集が保持
- 本番（ポータブル）
  - [ ] EXE と同階層に `workspace/` を置くとそこを優先
  - [ ] 別 PC にフォルダ一式コピーで動作・編集保持
- ビルド
  - [ ] `better-sqlite3` の `.node` が ASAR 外出しされ起動

## 既知の注意点
- `resources/prompts` と `resources/templates` の名称揺れ
  - 統一は `templates` 側推奨。Seeder と IPC で最終的に DB 一元化。
- 外部 API のテンプレート更新コード
  - 完全撤廃し、すべて IPC → DB に統一する。

---

この計画に沿って実装すれば、テンプレート・DB の単一ソース化と可搬運用が実現し、開発/本番の差分由来の不具合を抑止できます。
