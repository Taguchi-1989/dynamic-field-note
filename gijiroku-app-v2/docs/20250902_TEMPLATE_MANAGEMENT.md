# 20250902_テンプレート管理システム - 開発者ガイド

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

## 📋 概要

議事録アプリ v2 では、プロンプトテンプレートをデータベース中心で管理し、開発環境と配布環境で一貫した動作を実現しています。このドキュメントでは、テンプレートの置き場所と更新方法を説明します。

## 🎯 基本原則

- **データベースが唯一の正式なソース**: すべてのテンプレート操作はDBを通して行う
- **JSONファイルは初期化用**: 初回起動時のシード（種植え）にのみ使用
- **環境一致**: 開発・配布で同じテンプレート管理システム
- **ポータブル対応**: workspace フォルダごと移動可能

## 📁 テンプレート置き場所

### 🔄 **データベース（メイン保存場所）**

```
workspace/data/gijiroku.db
└── prompt_templates テーブル
    ├── id (TEXT PRIMARY KEY)
    ├── title (TEXT NOT NULL)
    ├── content (TEXT NOT NULL)
    ├── description (TEXT)
    ├── category (TEXT)
    ├── is_active (INTEGER DEFAULT 1)
    ├── created_at (TEXT)
    └── updated_at (TEXT)
```

**役割**:
- UI での編集・追加・削除はすべてここに反映
- アプリケーションは常にここから読み取り
- 唯一の正式なテンプレート保存場所

### 📂 **初期シード用ファイル**

#### 開発環境
```
project_root/
├── resources/
│   └── prompts/              ← 開発時の初期テンプレート
│       ├── general.json
│       ├── meeting.json
│       └── technical.json
└── workspace/                ← 実行時作成されるワークスペース
    ├── data/
    │   └── gijiroku.db       ← メインDB
    └── templates/            ← resources/prompts からコピー（初回のみ）
        ├── general_meeting.json
        └── technical_meeting.json
```

#### 配布環境（パッケージ版）
```
議事録アプリ v2.exe          ← メイン実行ファイル
├── resources/
│   └── app.asar              ← パッケージされたアプリケーション
│       └── resources/
│           └── prompts/      ← 初期テンプレート（ASAR内）
└── workspace/                ← ポータブルモード時のワークスペース
    ├── data/
    │   └── gijiroku.db       ← メインDB
    └── templates/            ← 初期シード後は使われない
```

### 🗂️ **ワークスペース構造（環境別）**

| 環境 | メインDB | 初期テンプレート元 | ワークスペース |
|------|-----------|-------------------|----------------|
| **開発** | `%APPDATA%\gijiroku-app-v2\workspace\data\gijiroku.db` | `./resources/prompts/` | `%APPDATA%\gijiroku-app-v2\workspace\` |
| **配布（インストール）** | `%APPDATA%\gijiroku-app-v2\workspace\data\gijiroku.db` | `app.asar/resources/prompts/` | `%APPDATA%\gijiroku-app-v2\workspace\` |
| **配布（ポータブル）** | `./workspace/data/gijiroku.db` | `app.asar/resources/prompts/` | `./workspace/` |

## 🔄 テンプレート読み込み・保存の仕組み

### **初回起動時の処理順序**
1. **DB確認** → `prompt_templates` テーブルが空かチェック
2. **workspace/templates** チェック → ファイルが存在するかチェック
3. **resources/prompts** から読み込み → JSONファイルを解析
4. **DBに投入** → `prompt_templates` テーブルに保存

### **通常動作時**
- **読み込み**: DB の `prompt_templates` テーブルから直接取得
- **保存**: UI での編集は即座にDBに反映  
- **ファイル**: `workspace/templates/` は参照されない（初回シード後）

## 🛠️ プロンプトテンプレート更新方法

### **方法1: 開発環境でJSONファイルを編集（推奨）**

#### ステップ 1: JSONファイル編集
```bash
# 開発環境でファイル編集
code resources/prompts/general.json
```

#### ステップ 2: データベースリセット
```bash
# ワークスペースを削除（DBも含む）
rm -rf "C:\Users\%USERNAME%\AppData\Roaming\gijiroku-app-v2\workspace"

# または特定のテンプレートのみクリア
sqlite3 "C:\Users\%USERNAME%\AppData\Roaming\gijiroku-app-v2\workspace\data\gijiroku.db" \
  "DELETE FROM prompt_templates;"
```

#### ステップ 3: アプリ再起動
```bash
# 開発環境で起動
npm run dev

# 初回起動時にJSONから自動的にDBにシードされる
```

### **方法2: UIで直接編集**

1. アプリケーションを起動
2. プロンプトセレクターで既存テンプレートを選択  
3. 「編集」ボタンクリック
4. テンプレート内容を修正
5. 「保存」ボタンクリック → DBに即座に反映

### **方法3: SQLで直接編集（上級者向け）**

```sql
-- SQLiteでDB直接編集
sqlite3 "workspace/data/gijiroku.db"

-- テンプレート一覧表示
SELECT id, title FROM prompt_templates;

-- 特定テンプレートの内容更新
UPDATE prompt_templates 
SET content = '新しいプロンプト内容...',
    updated_at = datetime('now')
WHERE id = 'general_meeting';

-- 新しいテンプレート追加
INSERT INTO prompt_templates (id, title, content, description, category, is_active)
VALUES ('custom_template', 'カスタムテンプレート', 'プロンプト内容...', '説明', 'custom', 1);
```

## 📦 配布用テンプレート更新

### **新しいデフォルトテンプレートを配布版に含める場合**

#### ステップ 1: resources/prompts/ を更新
```bash
# 新しいテンプレートファイル作成
echo '{"id": "new_template", "title": "新テンプレート", ...}' > resources/prompts/new_template.json
```

#### ステップ 2: ビルド実行
```bash
# 配布版ビルド
npm run dist
```

#### ステップ 3: 初回起動確認
- 新規ユーザーは自動的に新しいテンプレートが追加される
- 既存ユーザーはDB優先のため、手動更新が必要

## 🚀 テンプレート展開（既存ユーザー向け）

### **新しいテンプレートを既存ユーザーに配布**

既存ユーザーはDBにデータがあるため、新しいJSONファイルは自動読み込みされません。以下の方法で対応：

#### 方法A: アプリ内機能（推奨）
```typescript
// 将来実装予定：「デフォルトテンプレート復元」機能
// 設定画面で「初期テンプレートをリストア」ボタン
```

#### 方法B: 手動SQL実行
```sql
-- 特定の新しいテンプレートのみ追加
INSERT INTO prompt_templates (id, title, content, description, category, is_active)
VALUES ('new_template_id', 'テンプレート名', 'プロンプト内容...', '説明', 'カテゴリ', 1)
ON CONFLICT(id) DO UPDATE SET
  content = excluded.content,
  updated_at = datetime('now');
```

#### 方法C: 全リセット
```bash
# 完全リセット（全テンプレートが初期状態に戻る）
rm -rf workspace/data/gijiroku.db
# 次回起動時に自動的にresources/prompts/から再シード
```

## 🔍 トラブルシューティング

### **テンプレートが表示されない**
```bash
# DBの状態確認
sqlite3 workspace/data/gijiroku.db "SELECT id, title FROM prompt_templates;"

# 空の場合、初期シードが失敗している可能性
# ログで以下を確認:
# "プロンプトテンプレート初期投入: X件"
# "✅ デフォルトテンプレートをシード完了"
```

### **JSONファイルの変更が反映されない**
- DBが既に存在する場合、JSONファイルは読み込まれません
- 解決策: DBを削除してアプリを再起動

### **ポータブル版でテンプレートが消える**
- `workspace/` フォルダも一緒に移動してください
- 実行ファイル単体では初期状態になります

## 📚 関連ファイル

- `app/src/main/services/DbService.ts` - テンプレート DAO メソッド
- `app/src/main/ipc/template-handler.ts` - IPC ハンドラー実装
- `app/src/main/services/WorkspaceService.ts` - ワークスペース管理
- `app/src/renderer/components/PromptSelector.tsx` - UI コンポーネント
- `resources/prompts/` - 初期テンプレートファイル

---

**更新日**: 2025-09-02  
**作成者**: Claude (Anthropic)  
**バージョン**: 議事録アプリ v2.0.2