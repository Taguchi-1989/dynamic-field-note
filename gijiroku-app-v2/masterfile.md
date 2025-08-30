# 議事録アプリ v2｜マスターファイル（ローカルファースト＆リッチPDF対応）

> 本書は、**ローカルファースト**運用と **リッチMarkdown→PDF**（KaTeX/LaTeX/Mermaid）を前提にした統合仕様です。持ち運びやすさ（ポータブル）と将来のクラウド同期を両立します。

---

## 0. 全体方針（要点）

* **ワークスペース方式**で持ち運び前提（USB可）。`workspace/` ごとコピーで移行。
* データ正本は **SQLite**（`workspace/data/gijiroku.db`）。UIキャッシュは任意でDexie。
* PDF化は \*\*Chromium印刷（printToPDF）\*\*を標準、必要に応じて **Tectonic** に切替可能。
* Mermaid/数式は **事前描画＋キャッシュ**（SVG/フォント同梱）→再現性を担保。
* クラウド（Supabase等）は **必要最小の差分同期**（change\_log中心）。
* 機微情報は **keytar** 管理。IPCは **zod** で厳格化。長時間処理は **jobs** キュー。

---

## 1. リポジトリ＆ワークスペース構成

```
gijiroku-app-v2/
├── app/                        # アプリ本体（ソース）
│   └── src/
│       ├── main/               # Electron Main（Node）
│       │   ├── index.ts
│       │   ├── preload.ts
│       │   └── services/
│       │       ├── WorkspaceService.ts
│       │       ├── MarkdownCompilerService.ts
│       │       ├── MermaidRenderWorker.ts
│       │       ├── PdfJobService.ts
│       │       ├── DbService.ts               # SQLite接続/DAO
│       │       └── SyncService.ts             # 任意（後置き）
│       ├── renderer/            # React（UI）
│       └── shared/              # 型/ユーティリティ
├── resources/                   # 同梱資産（配布物に含める）
│   ├── templates/               # 既定Markdown/Minutesテンプレ
│   ├── themes/mermaid/mermaid-theme.css
│   ├── katex/                   # KaTeXフォント/CSS（オフライン）
│   └── bin/tectonic/            # 任意：LaTeXエンジン（OS別）
├── workspace/                   # ★ポータブルWS（持ち運び対象）
│   ├── config/
│   │   ├── workspace.json       # WSメタ
│   │   └── app.local.json       # 機微なし設定
│   ├── data/
│   │   ├── gijiroku.db          # ★SQLite正本
│   │   ├── change_log.jsonl     # Dexie運用時の補助/監査
│   │   └── search_index/        # 任意（全文/ベクトル）
│   ├── attachments/             # 音声/VTT/PDF/画像等
│   ├── templates/               # 初回起動時にresourcesからコピー
│   ├── cache/                   # Mermaid SVG/中間HTML/KaTeX等
│   ├── exports/                 # 最終PDF等の出力先
│   └── logs/                    # 実行ログ/audit
└── release/                     # パッケージ成果
```

**Workspace解決順**：

1. `GIJIROKU_WORKSPACE_DIR` → 2) 実行ファイル直下 `./workspace/`（ポータブル） → 3) `app.getPath('userData')/workspace`

---

## 2. 設定ファイル（例）

`workspace/config/workspace.json`

```json
{
  "name": "Default Workspace",
  "version": 2,
  "createdAt": "2025-08-29T09:00:00Z",
  "paths": {
    "attachments": "attachments",
    "exports": "exports",
    "cache": "cache",
    "db": "data/gijiroku.db"
  }
}
```

`workspace/config/app.local.json`（※機微なし）

```json
{
  "pdf": { "pageSize": "A4", "marginMm": 15 },
  "markdown": { "theme": "default", "toc": true, "latex": "katex" },
  "mermaid": { "themePath": "../../resources/themes/mermaid/mermaid-theme.css" }
}
```

> APIキー/トークンは**keytar**に保存。`app.local.json`に書かない。

---

## 3. SQLite スキーマ（正本）

> `app/src/main/services/DbService.ts` で `better-sqlite3` を使用。

```sql
-- users はSupabase連携を見据え外部IDも保持（ローカル単独時はnull可）
create table if not exists users (
  id text primary key,         -- uuid（ローカル生成可）
  external_id text,            -- supabase uid 等
  display_name text,
  email text,
  created_at text default (datetime('now')),
  updated_at text default (datetime('now'))
);

create table if not exists meetings (
  id text primary key,
  owner_id text references users(id),
  title text not null,
  started_at text,
  ended_at text,
  location text,
  status text check (status in ('draft','processing','done','archived')) default 'draft',
  created_at text default (datetime('now')),
  updated_at text default (datetime('now')),
  deleted_at text
);
create index if not exists idx_meetings_owner on meetings(owner_id);

create table if not exists participants (
  id text primary key,
  display_name text not null,
  email text,
  external_id text
);

create table if not exists meeting_participants (
  meeting_id text references meetings(id) on delete cascade,
  participant_id text references participants(id) on delete restrict,
  role text,
  primary key (meeting_id, participant_id)
);

create table if not exists transcript_segments (
  id integer primary key autoincrement,
  meeting_id text not null references meetings(id) on delete cascade,
  start_ms integer not null,
  end_ms integer not null,
  speaker_label text,
  text text not null,
  confidence real,
  created_at text default (datetime('now'))
);
create index if not exists idx_segments_meeting_time on transcript_segments(meeting_id, start_ms);

create table if not exists documents (
  id text primary key,
  meeting_id text references meetings(id) on delete cascade,
  type text check (type in ('minutes','summary','todo','markdown','pdf_meta')) not null,
  title text,
  current_version_id text,
  created_at text default (datetime('now')),
  updated_at text default (datetime('now'))
);

create table if not exists document_versions (
  id text primary key,
  document_id text references documents(id) on delete cascade,
  content_md text,
  content_hash text,
  created_by text references users(id),
  created_at text default (datetime('now'))
);
create index if not exists idx_doc_versions_doc on document_versions(document_id, created_at);

-- 最新版FK（SQLiteはdeferred FKで運用推奨）
-- アプリ側で documents.current_version_id の整合性を担保

create table if not exists tasks (
  id text primary key,
  meeting_id text references meetings(id) on delete cascade,
  title text not null,
  assignee text,
  due_date text,
  status text check (status in ('open','in_progress','blocked','done')) default 'open',
  source_segment_id integer references transcript_segments(id),
  created_at text default (datetime('now')),
  updated_at text default (datetime('now'))
);
create index if not exists idx_tasks_meeting on tasks(meeting_id, status, due_date);

create table if not exists attachments (
  id text primary key,
  meeting_id text references meetings(id) on delete cascade,
  type text check (type in ('source_vtt','audio','pdf','image','other')) not null,
  storage_path text not null,     -- WS相対パス（例：attachments/xxx.wav）
  content_hash text not null,
  mime text,
  bytes integer,
  created_at text default (datetime('now'))
);

create table if not exists dictionary_entries (
  id text primary key,
  owner_id text references users(id),
  term text not null,
  canonical text,
  kind text check (kind in ('person','org','tech','alias','stopword')) default 'alias',
  notes text,
  updated_at text default (datetime('now'))
);
create unique index if not exists idx_dict_unique on dictionary_entries(owner_id, term);

create table if not exists prompt_templates (
  id text primary key,
  owner_id text references users(id),
  name text not null,
  purpose text,
  version integer not null default 1,
  template_json text not null,
  is_active integer default 1,
  created_at text default (datetime('now'))
);
create unique index if not exists idx_prompt_version on prompt_templates(owner_id, name, version);

create table if not exists embeddings (
  id integer primary key autoincrement,
  entity_type text not null,
  entity_id text not null,
  model text not null,
  dim integer not null,
  -- ベクトルは別ファイル or json にもできるが、簡便のためblobに格納可
  vector blob not null,
  updated_at text default (datetime('now'))
);
create index if not exists idx_emb_entity on embeddings(entity_type, entity_id);

create table if not exists audit_log (
  id integer primary key autoincrement,
  actor_id text references users(id),
  action text not null,
  entity text not null,
  entity_id text not null,
  detail text,                        -- json文字列
  created_at text default (datetime('now'))
);

create table if not exists change_log (
  id integer primary key autoincrement,
  entity text not null,
  entity_id text not null,
  op text check (op in ('insert','update','delete')) not null,
  version integer not null,
  vector_clock text,                  -- json文字列
  patch text,                         -- jsonパッチ or after image
  actor_device_id text,
  created_at text default (datetime('now'))
);
create index if not exists idx_changelog_entity on change_log(entity, entity_id, version);

create table if not exists costs (
  id integer primary key autoincrement,
  provider text, model text,
  input_tokens integer, output_tokens integer,
  cost_jpy real,
  meta text,
  created_at text default (datetime('now'))
);

-- jobs：長時間処理の状態管理
create table if not exists jobs (
  id text primary key,
  type text not null,                 -- 'pdf'|'embedding'|'llm' など
  payload text not null,              -- json文字列
  status text check (status in ('queued','running','succeeded','failed','canceled')) default 'queued',
  progress real default 0,
  result text,                        -- json文字列
  error text,
  created_at text default (datetime('now')),
  updated_at text default (datetime('now'))
);
create index if not exists idx_jobs_status on jobs(status, created_at);
```

---

## 4. Markdown→PDF パイプライン（標準）

1. **入力**：Markdown（`.md`）/ FrontMatterオプション（toc, theme, pageSize 等）
2. **変換**：`remark-parse`→`remark-gfm`→`remark-math`→`rehype-katex`（オフラインフォント）
3. **Mermaid処理**：

   * ```mermaid フェンス検出
     ```
   * hidden BrowserWindow で `mermaidAPI.render()` 実行
   * 生成SVGを **data URL** でHTMLへ埋込＋ `workspace/cache/mermaid/<hash>.svg` 保存
4. **HTMLテンプレ合成**：`resources/templates/html/base.html` に流し込み
5. **PDF化**：hidden BrowserWindowで読込 → `webContents.printToPDF(options)`
6. **出力**：`workspace/exports/YYYYMMDD-title.pdf`、`audit_log`に記録

**切替可能オプション**：`latex: 'katex' | 'tectonic'`

* `tectonic` 選択時：Markdown→LaTeX（テンプレ）、`resources/bin/tectonic` 実行→PDF。

---

## 5. IPC API（型の骨子）

```ts
// preload.ts
export interface MarkdownAPI {
  compileToPdf(input: {
    mdPath?: string;        // 既存ファイル
    mdContent?: string;     // 文字列直渡し
    pdfPath?: string;       // 明示保存先（省略時はexportsに自動命名）
    options?: {
      latex?: 'katex'|'tectonic';
      theme?: 'default'|'corporate';
      toc?: boolean;
      pageSize?: 'A4'|'Letter';
      marginMm?: number;
    };
  }): Promise<{ pdfPath: string; pages: number; warnings?: string[] }>;
}

export interface JobsAPI {
  enqueue(job: { type: string; payload: any }): Promise<{ id: string }>;
  getStatus(id: string): Promise<{ status: string; progress: number; result?: any; error?: string }>;
  cancel(id: string): Promise<void>;
}

export interface WorkspaceAPI {
  resolve(): Promise<{ root: string; paths: Record<string,string> }>;
  initIfNeeded(): Promise<{ initialized: boolean }>; // templates初回コピー等
}

declare global { interface Window { electronAPI: { markdown: MarkdownAPI; jobs: JobsAPI; workspace: WorkspaceAPI; }; } }
```

> すべての入力/出力は **zod** で検証し、例外は `code/message/details` 付きで返却。

---

## 6. ジョブ＆監査

* **jobs** テーブルで長時間処理を可視化：`queued → running → succeeded/failed`。UIは再試行/中断/再開対応。
* **audit\_log**：生成・編集・エクスポート・同期など主要操作を必ず記録。

---

## 7. 同期ポリシー（ローカルファースト）

* すべてのIDは **UUID**。
* `updated_at` は **サーバ側**を最終真実に。ローカルは `local_updated_at` を持つ実装でも可。
* 基本は **LWW（最後の書き込み優先）**。文書本文は **3方差分マージUI** を提供。
* **change\_log** に差分イベントを蓄積→オンライン時にバッチ同期。成功時 `ack_version` を受領。
* 削除は基本 **soft delete**（`deleted_at`）。
* 添付はまずローカル保存→必要時のみクラウドへ。DBには **content\_hash** とメタだけ。

---

## 8. セキュリティ/キー管理

* APIキー/トークンは **keytar**（OSキーチェーン）に保存し、preload経由で限定公開。
* 外部URL（ナビゲーション）ブロック、`contextIsolation` 有効。
* 共有を見据えるなら、クラウド側は **RLS + access\_control** で段階導入。

---

## 9. ビルド＆配布

**開発**

```
npm run dev
# vite（renderer） + electron（main）
```

**本番**

```
# 1) renderer
vite build → dist/
# 2) main
tsup → dist-electron/
# 3) package
electron-builder → release/xxx.exe
```

> 配布物には `resources/` を必ず同梱。初回起動で `workspace/templates/` へコピー。

---

## 10. マイグレーション手順（初期）

1. `WorkspaceService.initIfNeeded()`：`resources/templates/` → `workspace/templates/` コピー
2. SQLite初期化（本章のDDL適用）
3. 旧データからの移行（必要に応じて importer を別途用意：VTT→segments、MD→documents）

---

## 11. チェックリスト（実装順）

* [ ] WorkspaceService：WS解決/初期化/テンプレコピー
* [ ] SQLite導入：DbService + DDL適用
* [ ] MarkdownCompilerService（KaTeX + Mermaid事前描画 → printToPDF）
* [ ] PdfJobService（jobs管理 + audit記録）
* [ ] keytar連携（機微値保護）
* [ ] IPCスキーマ（zod）＋エラーハンドリング統一
* [ ] （任意）Tectonic統合フラグ
* [ ] 単体/統合テスト（VTT→PDF、ジョブ再試行、WS持ち運び）

---

## 12. 付録：Mermaid/KaTeX運用Tips

* Mermaidテーマは `resources/themes/mermaid/mermaid-theme.css` を既定。Markdown側のtitleメタから図キャプション生成可。
* SVGは `workspace/cache/mermaid/<hash>.svg` に**キャッシュ**し、再出力時は再利用。
* KaTeXは `resources/katex/` のフォント/CSSを**ローカル参照**。
* 画像挿入はWS相対パスで解決：`![説明](./attachments/img/foo.png)` → PDFに埋め込み。

---

このファイルを"唯一の真実（Single Source of Truth）"として運用し、変更があれば本書を更新 → 実装へ反映してください。

---

## 📍 開発管理ファイル

**重要**: 開発セッション時は以下のファイルを最初に確認してください。

- **[SESSION_TRACKER.md](./SESSION_TRACKER.md)** - 開発セッション管理・クイックアクセス
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)** - 実装進捗・チェックリスト  

*最終更新: 2025-08-29*
