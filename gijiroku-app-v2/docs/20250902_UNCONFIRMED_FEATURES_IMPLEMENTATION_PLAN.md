# 20250902_未確認機能 実装計画書
## PDF生成・SQLiteテンプレート管理の成功プラクティス適用版

**作成日**: 2025-09-02  
**最終更新**: 2025-09-02

## 🎯 目的
現在MVP（基本機能）として動作している機能に対し、**未確認・開発中機能**の実装を成功事例（PDF生成・SQLiteテンプレート管理）のプラクティスを適用して体系的に進める。

## 📊 現状分析

### ✅ **成功した機能（実装完了・動作確認済み）**

#### **1. PDF生成機能 (Node.js + Electron統合)**
**実装状況**: 完全成功 ✅  
**成功要因**:
- **段階的実装**: 基本生成 → テンプレート変数 → ファイル名制御 → 保存場所選択
- **具体的問題解決**: `{{TITLE}}` 変数残留 → 正規表現全置換で解決
- **ファイルロック対策**: タイムスタンプ+ランダム文字列による一意命名
- **ユーザビリティ**: 保存場所選択機能による利便性向上
- **デバッグ透明化**: 詳細ログによる問題特定の高速化

#### **2. SQLiteテンプレート管理 (DB中心アーキテクチャ)**
**実装状況**: 完全成功 ✅  
**成功要因**:
- **CODEX_REVIEW.md準拠**: 単一ソース（DB）への統一
- **マイグレーション対応**: `DROP TABLE IF EXISTS` → 新スキーマ確実適用
- **IPC統一**: `template-handler.ts` による一貫したCRUD操作
- **初期シード**: JSON → DB移行を自動化
- **ポータブル対応**: ワークスペース全体移動可能

### ❓ **未確認・開発中機能（実装済みだが無効化中）**

#### **🔍 SearchService.ts - 検索・埋め込み機能**
**実装状況**: 基盤実装済み、UI無効化 🟡  
**機能内容**:
- SQLite FTS全文検索
- ベクトル検索（OpenAI embeddings API使用）
- ハイブリッド検索
- 検索インデックス管理

**無効化理由**: `feature-flags.ts:41` - MVP除外

#### **🔄 SyncService.ts - ローカルファースト同期**
**実装状況**: 基盤実装済み、UI無効化 🟡  
**機能内容**:
- UUID使用・LWW（最後の書き込み優先）
- change_log差分イベント蓄積  
- オンライン時バッチ同期
- soft delete（deleted_at）
- 添付ファイルのハッシュベース管理

**無効化理由**: `feature-flags.ts:44` - MVP除外

#### **📚 辞書機能 (DictionaryModal.tsx)**
**実装状況**: 実装済み、UI無効化 🟡  
**機能内容**:
- カスタム用語辞書管理
- 音声認識の精度向上
- 専門用語・略語の登録

**無効化理由**: `feature-flags.ts:42` - MVP除外

#### **📊 ログ機能 (LogService.ts)**
**実装状況**: 基盤のみ、UI未実装 🟡  
**機能内容**:
- システムログ管理
- エラー追跡
- パフォーマンス監視

**無効化理由**: `feature-flags.ts:43` - 基盤のみ、UI無効化

#### **📷 画像対応 (imageSupport)**
**実装状況**: 部分実装、PDF埋め込み未完成 🟡  
**機能内容**:
- 画像ファイルアップロード
- PDF内への画像埋め込み
- 画像プレビュー機能

**無効化理由**: `feature-flags.ts:47` - PDF埋め込み未完成

#### **📐 LaTeX対応 (latexSupport)**
**実装状況**: KaTeX基盤のみ、プレビュー未実装 🟡  
**機能内容**:
- 数式表示
- LaTeX記法サポート
- プレビュー機能

**無効化理由**: `feature-flags.ts:48` - プレビュー未実装

## 🧪 成功事例プラクティス分析

### **📋 PDF生成成功パターン**

#### **1. 段階的実装アプローチ**
```typescript
Phase 1: 基本機能 → Phase 2: 変数対応 → Phase 3: UX改善
// 例: PDF基本生成 → {{TITLE}}置換 → 保存場所選択
```

#### **2. 具体的問題の特定・解決**
```typescript
// 問題: {{TITLE}}が残留
// 原因: .replace()が最初の1つのみ置換
// 解決: .replace(/\{\{TITLE\}\}/g, title) 正規表現全置換
```

#### **3. ファイル操作の安全性確保**
```typescript
// 一意ファイル名生成でロック回避
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const randomString = Math.random().toString(36).substring(2, 8);
const uniqueFileName = `${timestamp}-${randomString}-${userTitle}.pdf`;
```

#### **4. デバッグの透明化**
```typescript
console.log('📝 PDF処理:', {
  inputLength: text.length,
  templateVariables: { title, date },
  outputPath: finalPath
});
```

### **🗄️ SQLiteテンプレート管理成功パターン**

#### **1. 単一ソース原則**
```typescript
// ❌ Before: JSONファイル + localStorage
// ✅ After: SQLiteデータベースのみ
const templates = dbService.getPromptTemplates(true);
```

#### **2. マイグレーション戦略**
```typescript
// 確実な新スキーマ適用
`DROP TABLE IF EXISTS prompt_templates`,
`CREATE TABLE prompt_templates (/* 新スキーマ */)`
```

#### **3. IPC統一設計**
```typescript
// template-handler.ts による一貫したCRUD
ipcMain.handle('templates:list', async () => { /* ... */ });
ipcMain.handle('templates:upsert', async (_, template) => { /* ... */ });
```

#### **4. 初期化自動化**
```typescript
// 空DB時の自動シード
if (templates.length === 0) {
  await seedInitialTemplates();
}
```

## 📋 実装計画

### **Phase 1: 高優先機能（2週間）**

#### **🔍 SearchService 本格有効化**
**対象**: 検索・埋め込み機能  
**適用プラクティス**: PDF段階的実装パターン

**実装ステップ**:
1. **基本検索UI作成** (3日)
   ```typescript
   // SearchModal.tsx の作成
   interface SearchModalProps {
     isOpen: boolean;
     onClose: () => void;
     onResultSelect: (result: SearchResult) => void;
   }
   ```

2. **SQLite FTS統合** (2日)
   ```typescript
   // FTSテーブル作成・データ投入
   CREATE VIRTUAL TABLE documents_fts USING fts5(
     content, title, metadata
   );
   ```

3. **ベクトル検索実装** (4日)
   ```typescript
   // OpenAI embeddings API統合
   const embedding = await openai.embeddings.create({
     model: "text-embedding-ada-002",
     input: searchQuery
   });
   ```

4. **UI統合・UX改善** (3日)
   ```typescript
   // 検索結果の表示・ハイライト機能
   ```

**成功基準**:
- [ ] 基本全文検索動作
- [ ] ベクトル検索動作（APIキー設定済み環境）
- [ ] 検索結果から文書選択・表示
- [ ] 検索履歴保存

#### **📚 辞書機能 本格有効化**
**対象**: カスタム用語辞書  
**適用プラクティス**: SQLiteテンプレート管理パターン

**実装ステップ**:
1. **辞書DB設計・マイグレーション** (2日)
   ```sql
   CREATE TABLE dictionary_entries (
     id TEXT PRIMARY KEY,
     term TEXT NOT NULL,
     reading TEXT,
     definition TEXT,
     category TEXT,
     is_active INTEGER DEFAULT 1,
     created_at TEXT DEFAULT (datetime('now'))
   );
   ```

2. **辞書CRUD IPC実装** (2日)
   ```typescript
   // dictionary-handler.ts 作成（template-handler.tsパターン）
   ipcMain.handle('dictionary:list', async () => { /* ... */ });
   ipcMain.handle('dictionary:upsert', async (_, entry) => { /* ... */ });
   ```

3. **UI統合・編集機能** (3日)
   ```typescript
   // DictionaryModal.tsx の有効化・機能拡張
   ```

4. **音声認識連携** (3日)
   ```typescript
   // VTT処理時の辞書適用
   ```

**成功基準**:
- [ ] 辞書エントリCRUD動作
- [ ] カテゴリ別管理
- [ ] 音声認識結果への適用
- [ ] インポート・エクスポート機能

### **Phase 2: 中優先機能（3週間）**

#### **🔄 SyncService 段階的有効化**
**適用プラクティス**: PDF段階的実装 + SQLiteマイグレーション

**実装ステップ**:
1. **ローカル同期基盤** (1週間)
   ```typescript
   // change_log テーブルによる変更追跡
   // デバイス間での差分計算
   ```

2. **クラウド連携** (1週間)
   ```typescript
   // Supabase/外部API統合
   // バッチアップロード・ダウンロード
   ```

3. **競合解決UI** (1週間)
   ```typescript
   // 競合検出・マージUI
   ```

#### **📊 ログ機能 UI実装**
**適用プラクティス**: PDF UX改善パターン

**実装ステップ**:
1. **ログ表示UI** (1週間)
2. **フィルタ・検索** (1週間)
3. **エクスポート機能** (1週間)

### **Phase 3: 拡張機能（4週間）**

#### **📷 画像対応完成**
**適用プラクティス**: PDF具体的問題解決パターン

**未完成問題**:
- PDF埋め込み処理
- 画像サイズ最適化
- プレビュー機能

**解決アプローチ**:
```typescript
// PDF画像埋め込み
import { jsPDF } from 'jspdf';
const pdf = new jsPDF();
pdf.addImage(imageBase64, 'JPEG', x, y, width, height);
```

#### **📐 LaTeX対応完成**
**適用プラクティス**: PDF段階的実装パターン

**未完成問題**:
- プレビュー機能
- 数式レンダリング
- エディタ統合

**解決アプローチ**:
```typescript
// KaTeX統合拡張
import katex from 'katex';
const rendered = katex.renderToString(latexString, {
  throwOnError: false,
  displayMode: true
});
```

## ⚡ 実装優先度・リスク評価

### **🚨 高優先（Phase 1）**
| 機能 | リスク | 成功確率 | 期間 |
|------|--------|----------|------|
| **🔍 SearchService** | 低 | 95% | 2週間 |
| **📚 辞書機能** | 低 | 90% | 2週間 |

**理由**: 
- 基盤実装済み
- SQLite・IPC パターン適用可能
- 明確な成功事例あり

### **📊 中優先（Phase 2）**
| 機能 | リスク | 成功確率 | 期間 |
|------|--------|----------|------|
| **🔄 SyncService** | 中 | 70% | 3週間 |
| **📊 ログ機能** | 低 | 85% | 3週間 |

**理由**:
- 複雑な同期ロジック
- 外部API依存
- 競合解決の難しさ

### **🔮 低優先（Phase 3）**
| 機能 | リスク | 成功確率 | 期間 |
|------|--------|----------|------|
| **📷 画像対応** | 中 | 75% | 4週間 |
| **📐 LaTeX対応** | 中 | 70% | 4週間 |

**理由**:
- PDF処理の複雑さ
- レンダリング最適化
- ブラウザ互換性

## 🎯 成功プラクティス適用指針

### **1. 段階的実装原則**
```
MVP機能 → 基本UI → 詳細機能 → UX改善
（PDF: 生成 → 変数 → ファイル名 → 保存場所）
```

### **2. 具体的問題解決**
```typescript
// 問題を具体的に特定
console.log('🔍 DEBUG:', { 問題状況詳細 });

// 原因を明確化
// 解決策を段階的適用
// 結果を検証
```

### **3. データベース中心設計**
```sql
-- 単一ソース原則
-- マイグレーション戦略
-- IPC統一設計
```

### **4. デバッグの透明化**
```typescript
// 処理の各段階でログ出力
// 問題特定を高速化
// ユーザーへの具体的エラーメッセージ
```

## 📊 実装チェックリスト

### **Phase 1 (SearchService + 辞書機能)**
- [ ] SearchModal.tsx UI作成
- [ ] SQLite FTS設定
- [ ] ベクトル検索API統合
- [ ] 辞書DB設計・マイグレーション
- [ ] dictionary-handler.ts IPC実装
- [ ] DictionaryModal.tsx有効化

### **Phase 2 (SyncService + ログ機能)**
- [ ] change_log テーブル実装
- [ ] 同期ロジック基盤
- [ ] クラウド連携
- [ ] ログ表示UI
- [ ] フィルタ・検索機能

### **Phase 3 (画像・LaTeX対応)**
- [ ] PDF画像埋め込み
- [ ] 画像最適化
- [ ] KaTeX プレビュー拡張
- [ ] エディタ統合

## 🏆 期待される成果

### **定量的効果**
- **機能完成率**: 40% → 85% (Phase 1-3完了時)
- **ユーザー満足度**: 搭載機能数の大幅増加
- **開発効率**: 成功パターン適用により50%高速化（推定）

### **定性的効果**
- **システム一貫性**: 統一されたDB・IPC設計
- **保守性**: 成功パターンの再利用
- **ユーザー体験**: 豊富な機能による生産性向上

---

**作成日**: 2025-09-01  
**作成者**: Claude (Anthropic)  
**対象**: 議事録アプリ v2.0.x  
**基準**: PDF生成・SQLiteテンプレート管理の成功プラクティス準拠