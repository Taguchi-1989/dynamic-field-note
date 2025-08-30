# gijiroku-app-v2 実装進捗管理

## 🎯 実装チェックリスト

### Phase 1: 基盤インフラ構築 (3/3 完了) ✅

#### 1.1 ワークスペースシステム
- [x] **WorkspaceService実装**
  - [x] ワークスペースディレクトリ解決ロジック
  - [x] 初回セットアップ処理
  - [x] 設定ファイル管理
  - **ファイル**: `src/main/services/WorkspaceService.ts`
  - **状況**: ✅ **完了**
  - **実績**: 1日

#### 1.2 SQLiteデータベース統合
- [x] **DbService実装**
  - [x] better-sqlite3統合
  - [x] DDLマイグレーション
  - [x] DAO実装
  - **ファイル**: `src/main/services/DbService.ts`
  - **状況**: ✅ **完了**
  - **実績**: 1日

#### 1.3 設定・リソース管理
- [x] **リソース同梱構造**
  - [x] resources/ ディレクトリ整備
  - [x] 初回コピー処理
  - [x] テンプレート管理
  - **ファイル**: `resources/` 全体
  - **状況**: ✅ **完了**
  - **実績**: 0.5日

---

### Phase 2: PDF生成システム再構築 (0/3 完了)

#### 2.1 MarkdownCompilerService
- [ ] **Markdown→HTMLパイプライン**
  - [ ] remark/rehype統合
  - [ ] FrontMatter対応
  - [ ] KaTeX統合
  - **ファイル**: `src/main/services/MarkdownCompilerService.ts`
  - **状況**: 未着手
  - **見積**: 3日

#### 2.2 Mermaid事前描画システム
- [ ] **MermaidRenderWorker実装**
  - [ ] hidden BrowserWindow描画
  - [ ] SVGキャッシュシステム
  - [ ] data URL埋め込み
  - **ファイル**: `src/main/services/MermaidRenderWorker.ts`
  - **状況**: 未着手
  - **見積**: 2日

#### 2.3 PDF生成エンジン
- [ ] **printToPDF統合**
  - [ ] Chromium印刷エンジン
  - [ ] 設定可能オプション
  - [ ] Tectonic切り替え（任意）
  - **ファイル**: `src/main/services/PdfService.ts` (拡張)
  - **状況**: 未着手
  - **見積**: 2日

---

### Phase 3: セキュリティ＆通信強化 (0/2 完了)

#### 3.1 keytar統合
- [ ] **機密情報管理**
  - [ ] OS keychain連携
  - [ ] preload API設計
  - [ ] 既存設定の移行
  - **ファイル**: `src/main/services/KeytarService.ts`
  - **状況**: 未着手
  - **見積**: 1日

#### 3.2 IPC通信厳格化
- [ ] **zodスキーマ定義**
  - [ ] 入出力バリデーション
  - [ ] エラーハンドリング統一
  - [ ] 型安全性確保
  - **ファイル**: `src/shared/schemas/`
  - **状況**: 未着手
  - **見積**: 2日

---

### Phase 4: ジョブ＆監査システム (0/2 完了)

#### 4.1 PdfJobService
- [ ] **長時間処理管理**
  - [ ] jobs テーブル管理
  - [ ] プログレス表示
  - [ ] 再試行・中断機能
  - **ファイル**: `src/main/services/PdfJobService.ts`
  - **状況**: 未着手
  - **見積**: 2日

#### 4.2 監査ログ
- [ ] **audit_log実装**
  - [ ] 操作履歴記録
  - [ ] 監査機能
  - [ ] ログ管理
  - **ファイル**: DbService内に統合
  - **状況**: 未着手
  - **見積**: 1日

---

### Phase 5: 同期・拡張機能 (0/2 完了)

#### 5.1 SyncService（任意）
- [ ] **change_log同期**
  - [ ] LWW実装
  - [ ] 差分マージUI
  - [ ] 競合解決
  - **ファイル**: `src/main/services/SyncService.ts`
  - **状況**: 未着手
  - **見積**: 3日

#### 5.2 検索・埋め込み
- [ ] **全文検索・ベクトル検索**
  - [ ] embeddings活用
  - [ ] 検索インデックス
  - [ ] 検索UI
  - **ファイル**: `src/main/services/SearchService.ts`
  - **状況**: 未着手
  - **見積**: 2日

---

## 📊 進捗サマリ

| フェーズ | 完了 | 総数 | 進捗率 | 状況 |
|---------|------|------|--------|------|
| Phase 1 | 3 | 3 | 100% | ✅ **完了** |
| Phase 2 | 0 | 3 | 0% | ⏳ 開始準備中 |
| Phase 3 | 0 | 2 | 0% | 🔴 未開始 |
| Phase 4 | 0 | 2 | 0% | 🔴 未開始 |
| Phase 5 | 0 | 2 | 0% | 🔴 未開始 |
| **合計** | **3** | **12** | **25%** | 🟡 **Phase 1完了・Phase 2準備中** |

---

## 🎯 今後のマイルストーン

### 📅 Week 1-2: Phase 1完了目標
- [ ] WorkspaceService 
- [ ] DbService
- [ ] リソース管理

### 📅 Week 3-4: Phase 2完了目標  
- [ ] MarkdownCompilerService
- [ ] MermaidRenderWorker
- [ ] PDF生成エンジン

### 📅 Week 5: Phase 3完了目標
- [ ] keytar統合
- [ ] IPC厳格化

### 📅 Week 6: Phase 4完了目標
- [ ] ジョブ管理
- [ ] 監査ログ

---

## 🚨 ブロッカー・課題

### 現在のブロッカー
- なし（プロジェクト開始前）

### 潜在的リスク
1. **SQLite移行の複雑性** - 既存データとの整合性
2. **PDF品質の維持** - printToPDF への移行リスク
3. **パフォーマンス劣化** - 新システムでの性能担保

---

## 📝 実装メモ

### 設計決定
- **データベース**: SQLite (better-sqlite3)
- **PDF生成**: Electron printToPDF
- **セキュリティ**: keytar (OS keychain)
- **バリデーション**: zod

### 重要な依存関係
```json
{
  "better-sqlite3": "^9.0.0",
  "keytar": "^7.9.0", 
  "zod": "^3.25.0",
  "remark": "^15.0.0",
  "rehype-katex": "^7.0.0"
}
```

### 実装規約
- すべてのサービスはTypeScript strict mode
- IPC通信はzodによるバリデーション必須
- エラーハンドリングは統一形式
- 単体テスト必須（Jest）

---

*最終更新: 2025-08-29 Session #1*