# 📍 Dynamic Field Note - 開発ロードマップ

> **企画書をベースにした実践的な開発計画**
> 最終更新: 2025-10-17

---

## 📊 ロードマップ概要

```mermaid
gantt
    title Dynamic Field Note 開発タイムライン
    dateFormat YYYY-MM-DD
    axisFormat %m/%d

    section P0: 環境構築
    開発環境セットアップ           :p0-1, 2025-10-17, 3d
    Expo + React Native 初期化    :p0-2, after p0-1, 2d
    iPhone 12 ビルド・実機確認       :p0-3, after p0-2, 2d

    section P1: PoC
    音声入力バッファ実装            :p1-1, after p0-3, 3d
    Gemini 2.5 Pro 接続           :p1-2, after p0-3, 3d
    JSON→Markdown 変換            :p1-3, after p1-1, 2d
    基本要約フロー統合              :p1-4, after p1-2, 2d
    PoC デモ・検証                :p1-5, after p1-4, 2d

    section P2: UI/UX整備
    Markdownプレビューコンポーネント  :p2-1, after p1-5, 3d
    中間・最終まとめボタン            :p2-2, after p2-1, 2d
    ハンバーガーメニュー             :p2-3, after p2-2, 2d
    AI状態表示UI                  :p2-4, after p2-3, 2d
    UXテスト・改善                 :p2-5, after p2-4, 3d

    section P3: ローカル保存
    SQLite スキーマ設計            :p3-1, after p2-5, 2d
    写真撮影・注釈機能              :p3-2, after p3-1, 4d
    案件管理システム               :p3-3, after p3-2, 3d
    ZIP生成・署名                 :p3-4, after p3-3, 3d
    保存整合性テスト               :p3-5, after p3-4, 2d

    section P4: Azure連携
    Azure Functions BFF構築       :p4-1, after p3-5, 4d
    Blob Storage 連携            :p4-2, after p4-1, 3d
    TLSピンニング実装              :p4-3, after p4-2, 2d
    同期キュー・再送制御             :p4-4, after p4-3, 3d
    通信安全テスト                 :p4-5, after p4-4, 2d

    section P5: α版統合
    GPT-5 二段要約統合             :p5-1, after p4-5, 3d
    監査ログ・WORM                :p5-2, after p5-1, 2d
    PDF出力機能                   :p5-3, after p5-2, 3d
    脆弱性・負荷試験               :p5-4, after p5-3, 3d
    α版リリース                   :p5-5, after p5-4, 2d

    section P6: β・運用化
    Intune MDM連携               :p6-1, after p5-5, 5d
    現場導入試験                   :p6-2, after p6-1, 7d
    運用マニュアル整備              :p6-3, after p6-1, 5d
```

---

## 🎯 Phase 0: 環境構築（1週間）

### 目的
開発基盤を整備し、iPhone 12でExpoアプリが動作する環境を構築

### タスク一覧

#### T0-1: 開発環境セットアップ（3日）
- [ ] Node.js 20+ / npm / yarn インストール
- [ ] VS Code + 必須拡張機能（ESLint, Prettier, React Native Tools）
- [ ] Git リポジトリ初期化
- [ ] `.gitignore` 設定（`node_modules/`, `.env`, `ios/build/` など）
- [ ] 環境変数管理方針決定（`.env.local`, SecureStore）

**成果物:**
- 開発環境構築手順書（`docs/setup-guide.md`）
- リポジトリ初期化完了

#### T0-2: Expo + React Native プロジェクト初期化（2日）
```bash
npx create-expo-app@latest DynamicFieldNote --template blank-typescript
cd DynamicFieldNote
expo install expo-dev-client
```

- [ ] TypeScript 設定（strict モード）
- [ ] フォルダ構成設計
  ```
  src/
  ├── components/     # UIコンポーネント
  ├── screens/        # 画面
  ├── services/       # ビジネスロジック・API
  ├── hooks/          # カスタムフック
  ├── types/          # 型定義
  ├── utils/          # ユーティリティ
  └── constants/      # 定数
  ```
- [ ] ESLint + Prettier 設定
- [ ] 必須ライブラリインストール
  ```bash
  npm install react-native-paper
  npm install expo-file-system expo-sqlite expo-camera
  npm install jszip
  ```

**成果物:**
- Expo プロジェクト初期化完了
- コーディング規約（`docs/coding-standards.md`）

#### T0-3: iPhone 12 実機ビルド・動作確認（2日）
- [ ] Apple Developer アカウント設定
- [ ] 証明書・プロビジョニングプロファイル作成
- [ ] Expo Development Build 生成
  ```bash
  eas build --profile development --platform ios
  ```
- [ ] iPhone 12 にインストール・Hello World 動作確認
- [ ] Hot Reload 動作確認

**成果物:**
- 実機動作確認済みビルド
- ビルド手順書（`docs/build-guide.md`）

**検証基準:**
- ✅ iPhone 12 で Expo アプリが起動する
- ✅ TypeScript でコンパイルエラーがない
- ✅ Hot Reload が機能する

---

## 🚀 Phase 1: PoC（2週間）

### 目的
音声入力 → Gemini要約 → Markdown生成の基本フローを実証

### タスク一覧

#### T1-1: 音声入力バッファ実装（3日）
- [ ] iOS標準音声入力をTextInputで受け取る
- [ ] 5秒間隔でバッファに蓄積するhook作成
  ```typescript
  // hooks/useVoiceBuffer.ts
  export const useVoiceBuffer = (intervalMs = 5000) => {
    // 5秒ごとにテキストを配列に追加
    // 5分または無音30秒で送信トリガー
  }
  ```
- [ ] 無音検知ロジック（文字入力なし30秒→送信）
- [ ] バッファ可視化UI（デバッグ用）

**成果物:**
- `hooks/useVoiceBuffer.ts`
- バッファ動作テストケース

#### T1-2: Gemini 2.5 Pro API 接続（3日）
- [ ] `@google/generative-ai` SDKセットアップ
- [ ] API Key 安全管理（expo-secure-store）
- [ ] プロンプト設計
  ```typescript
  const GEMINI_PROMPT = `
  以下の現場メモを要約してください。
  - 決定事項
  - ToDo
  - 課題
  をJSON形式で返してください。
  `;
  ```
- [ ] 要約API呼び出しサービス作成
  ```typescript
  // services/geminiService.ts
  export async function summarizeText(text: string): Promise<SummaryJSON>
  ```
- [ ] エラーハンドリング（ネットワークエラー、レート制限）

**成果物:**
- `services/geminiService.ts`
- API接続テスト結果

#### T1-3: JSON→Markdown 変換（2日）
- [ ] LLM出力JSONスキーマ定義
  ```typescript
  interface SummaryJSON {
    decisions: string[];
    todos: string[];
    issues: string[];
    raw_text: string;
  }
  ```
- [ ] Markdown生成関数
  ```typescript
  // utils/markdownGenerator.ts
  export function jsonToMarkdown(summary: SummaryJSON): string
  ```
- [ ] 章立て・見出し自動生成
- [ ] 単体テスト作成

**成果物:**
- `utils/markdownGenerator.ts`
- 変換ロジックのテストケース

#### T1-4: 基本要約フロー統合（2日）
- [ ] 音声バッファ → Gemini → Markdown の一連フロー実装
- [ ] ローディング状態管理
- [ ] エラー表示UI
- [ ] 簡易プレビュー表示

**成果物:**
- 統合フロー実装完了
- E2Eテストシナリオ

#### T1-5: PoC デモ・検証（2日）
- [ ] 実際の音声入力でテスト（5分間喋り続ける）
- [ ] 要約精度評価（決定事項の抽出率）
- [ ] API安定性確認（タイムアウト、失敗時の挙動）
- [ ] ステークホルダーデモ

**検証基準:**
- ✅ 5分間の音声入力がGeminiで要約される
- ✅ Markdownが正しく生成される
- ✅ API失敗時にエラーメッセージが表示される

---

## 🎨 Phase 2: UI/UX整備（2週間）

### 目的
Markdownプレビュー中心の使いやすいUIを構築

### タスク一覧

#### T2-1: Markdownプレビューコンポーネント（3日）
- [ ] `react-native-markdown-display` 導入
- [ ] プレビューコンポーネント作成
  ```typescript
  // components/MarkdownPreview.tsx
  export const MarkdownPreview: React.FC<{content: string}>
  ```
- [ ] スタイリング（フォント、見出し、リスト）
- [ ] スクロール同期（入力 ⇄ プレビュー）

**成果物:**
- `components/MarkdownPreview.tsx`
- プレビューのスクリーンショット

#### T2-2: 中間・最終まとめボタン（2日）
- [ ] 右下FABボタン配置
  - 🔄 中間まとめ（Gemini Fast）
  - ✨ 最終まとめ（GPT-5 準備）
- [ ] ボタン押下→API呼び出し→プレビュー更新
- [ ] ローディングアニメーション

**成果物:**
- `components/SummaryButtons.tsx`

#### T2-3: ハンバーガーメニュー（2日）
- [ ] React Navigation Drawer 導入
- [ ] メニュー項目実装
  - 📂 案件一覧
  - ⚙️ AI設定
  - 🔄 同期履歴
  - 🔐 匿名化トグル
- [ ] 各画面への遷移

**成果物:**
- `navigation/DrawerNavigator.tsx`
- メニュー画面UI

#### T2-4: AI状態表示UI（2日）
- [ ] ステータスインジケーター
  - 🟢 AI実行中
  - 🟡 待機中
  - 🔴 エラー
- [ ] トースト通知（要約完了時）
- [ ] プログレスバー（API呼び出し中）

**成果物:**
- `components/AIStatusIndicator.tsx`

#### T2-5: UXテスト・改善（3日）
- [ ] ユーザビリティテスト（社内5名）
- [ ] フィードバック収集
- [ ] UI改善実施
- [ ] アクセシビリティ対応（フォントサイズ調整）

**検証基準:**
- ✅ プレビューが画面の70%以上を占める
- ✅ ボタンタップから要約完了まで10秒以内
- ✅ メニューから各機能にアクセスできる

---

## 💾 Phase 3: ローカル保存（3週間）

### 目的
写真+注釈+案件管理+ZIP生成をローカルで完結

### タスク一覧

#### T3-1: SQLite スキーマ設計（2日）
- [ ] データベース設計
  ```sql
  CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    title TEXT,
    created_at INTEGER,
    updated_at INTEGER,
    status TEXT
  );

  CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    file_path TEXT,
    annotated_path TEXT,
    timestamp INTEGER,
    FOREIGN KEY(case_id) REFERENCES cases(id)
  );

  CREATE TABLE sync_queue (
    id TEXT PRIMARY KEY,
    case_id TEXT,
    action TEXT,
    status TEXT,
    retry_count INTEGER
  );
  ```
- [ ] `expo-sqlite` マイグレーション実装
- [ ] DAO層実装（`services/database/`)

**成果物:**
- `services/database/schema.sql`
- `services/database/caseDAO.ts`

#### T3-2: 写真撮影・注釈機能（4日）
- [ ] `expo-camera` セットアップ
- [ ] カメラ撮影UI
- [ ] 注釈エディタ実装
  - 丸・矢印・テキスト描画
  - `react-native-canvas` または `expo-gl`
- [ ] EXIF情報付与（撮影日時）
- [ ] 元画像 + 注釈画像の保存

**成果物:**
- `screens/CameraScreen.tsx`
- `components/PhotoAnnotator.tsx`

#### T3-3: 案件管理システム（3日）
- [ ] 案件作成・編集・削除
- [ ] 案件一覧画面
- [ ] 案件切り替え機能
- [ ] Markdown・写真の案件別管理

**成果物:**
- `screens/CaseListScreen.tsx`
- `services/caseService.ts`

#### T3-4: ZIP生成・署名（3日）
- [ ] `jszip` でZIPアーカイブ生成
  ```
  case_20251017.zip
  ├── case.md
  ├── case.json
  ├── photos/
  │   ├── P001.jpg
  │   └── P001_annotated.jpg
  └── signature.txt
  ```
- [ ] デジタル署名（HMAC-SHA256）
- [ ] エクスポート機能UI

**成果物:**
- `services/exportService.ts`
- ZIP署名検証ユーティリティ

#### T3-5: 保存整合性テスト（2日）
- [ ] 写真保存→再読み込みテスト
- [ ] ZIP生成→解凍→検証テスト
- [ ] データ破損シミュレーション
- [ ] 大量データ（100枚写真）テスト

**検証基準:**
- ✅ 写真が正しく保存・読み込みできる
- ✅ ZIPファイルが署名検証を通過する
- ✅ 100枚の写真を含む案件が正常動作する

---

## ☁️ Phase 4: Azure連携（3週間）

### 目的
Azure Functions (BFF) + Blob Storage との安全な通信

### タスク一覧

#### T4-1: Azure Functions BFF 構築（4日）
- [ ] Azure Functions プロジェクト作成（TypeScript）
- [ ] エンドポイント設計
  ```
  POST /api/summarize     # テキスト要約
  POST /api/upload        # ZIP/写真アップロード
  GET  /api/sync          # 同期状態取得
  ```
- [ ] Gemini/GPT API呼び出しロジック
- [ ] リクエスト検証（JSON Schema / Ajv）
- [ ] レート制限・タイムアウト設定

**成果物:**
- `azure-functions/` フォルダ
- API仕様書（OpenAPI形式）

#### T4-2: Blob Storage 連携（3日）
- [ ] Azure Storage Account 作成
- [ ] コンテナ設計（`cases/`, `logs/`）
- [ ] SAS Token 生成ロジック（短命・読み取り専用）
- [ ] BFF経由でのアップロード実装
- [ ] ダウンロード機能（同期時）

**成果物:**
- Blob Storage アクセス実装
- アップロード・ダウンロードテスト

#### T4-3: TLSピンニング実装（2日）
- [ ] Azure Functions の証明書取得
- [ ] `expo-ssl-pinning` または Native Module 実装
- [ ] 証明書検証失敗時のエラーハンドリング
- [ ] 証明書更新手順書作成

**成果物:**
- TLSピンニング実装
- 証明書管理手順書

#### T4-4: 同期キュー・再送制御（3日）
- [ ] 同期キューテーブル実装（SQLite）
- [ ] ネットワークエラー時の再送ロジック
- [ ] 指数バックオフ（1秒→2秒→4秒...）
- [ ] 同期履歴画面

**成果物:**
- `services/syncService.ts`
- 同期状態管理UI

#### T4-5: 通信安全テスト（2日）
- [ ] 中間者攻撃シミュレーション（mitmproxy）
- [ ] 証明書不一致テスト
- [ ] ネットワーク断絶時の挙動確認
- [ ] 再送制御の動作確認

**検証基準:**
- ✅ TLSピンニングが機能する（不正証明書を拒否）
- ✅ ネットワークエラー時に再送が動作する
- ✅ Blob Storageにファイルがアップロードされる

---

## 🔧 Phase 5: α版統合（2週間）

### 目的
全機能統合・GPT-5二段要約・監査ログ・PDF出力

### タスク一覧

#### T5-1: GPT-5 二段要約統合（3日）
- [ ] OpenAI SDK セットアップ
- [ ] プロンプト設計（構造化出力）
  ```typescript
  const GPT5_PROMPT = `
  以下のGemini中間要約を最終整形してください。
  - 章立て構成
  - 決定事項の優先順位付け
  - ToDoの期限推定
  JSON形式で返してください。
  `;
  ```
- [ ] Gemini → GPT-5 パイプライン実装
- [ ] コスト最適化（必要時のみGPT-5を使用）

**成果物:**
- `services/gpt5Service.ts`
- 二段要約のA/Bテスト結果

#### T5-2: 監査ログ・WORM（2日）
- [ ] 操作ログ記録（JSONL形式）
  ```jsonl
  {"timestamp": 1697500000, "action": "create_case", "user": "user@example.com"}
  {"timestamp": 1697500060, "action": "upload_photo", "case_id": "C001"}
  ```
- [ ] Blob Storage への WORM ログアップロード
- [ ] ログ可視化（Power BI 準備）

**成果物:**
- `services/auditLogger.ts`
- ログサンプルデータ

#### T5-3: PDF出力機能（3日）
- [ ] `react-native-html-to-pdf` または Puppeteer (BFF側) 実装
- [ ] Markdown → HTML → PDF 変換
- [ ] 表紙・ヘッダー・フッター追加
- [ ] 写真埋め込み

**成果物:**
- PDF出力機能実装
- サンプルPDF

#### T5-4: 脆弱性・負荷試験（3日）
- [ ] OWASP ZAP によるセキュリティスキャン
- [ ] npm audit / Dependabot 確認
- [ ] 負荷試験（同時10件アップロード）
- [ ] メモリリーク検証

**成果物:**
- セキュリティスキャンレポート
- 負荷試験結果

#### T5-5: α版リリース（2日）
- [ ] TestFlight ビルド作成
- [ ] リリースノート作成
- [ ] 社内展開（5名）
- [ ] フィードバック収集

**検証基準:**
- ✅ GPT-5要約の精度がGemini単体より高い
- ✅ 監査ログがBlobに保存される
- ✅ PDFが正しく生成される
- ✅ セキュリティスキャンでクリティカル問題ゼロ

---

## 🚢 Phase 6: β・運用化（継続）

### 目的
現場導入準備・MDM連携・運用マニュアル整備

### タスク一覧

#### T6-1: Intune MDM連携（5日）
- [ ] Microsoft Intune アカウント設定
- [ ] アプリ登録・配布設定
- [ ] デバイスポリシー設定（VPN必須、SIMなし）
- [ ] リモートワイプ設定

**成果物:**
- Intune連携手順書

#### T6-2: 現場導入試験（7日）
- [ ] 実際の現場（2-3箇所）でパイロット運用
- [ ] 騒音下での音声認識精度確認
- [ ] 外付けマイク（Shure MV88+）検証
- [ ] フィードバック収集・改善

**成果物:**
- 現場試験レポート
- 改善要望リスト

#### T6-3: 運用マニュアル整備（5日）
- [ ] ユーザーマニュアル作成（PDF）
- [ ] トラブルシューティングガイド
- [ ] よくある質問（FAQ）
- [ ] 管理者向け運用手順書

**成果物:**
- `docs/user-manual.pdf`
- `docs/admin-guide.pdf`
- `docs/troubleshooting.md`

---

## 📋 マイルストーン一覧

| マイルストーン | 期限目安 | 主要成果物 | 判定基準 |
|---------|------|--------|------|
| **M0: 環境構築完了** | +1週 | 実機ビルド成功 | iPhone 12でアプリ起動 |
| **M1: PoC完了** | +3週 | 音声→要約→MD生成 | 5分要約成功率 > 80% |
| **M2: UI完成** | +5週 | プレビュー中心UI | ユーザビリティスコア > 4/5 |
| **M3: ローカル完結** | +8週 | 写真・ZIP管理 | 100枚写真を含む案件動作 |
| **M4: クラウド連携** | +11週 | Azure統合 | TLS通信成功率 > 99% |
| **M5: α版** | +13週 | 全機能統合 | セキュリティスキャン合格 |
| **M6: β版** | +18週 | 現場導入 | 実地試験3箇所完了 |

---

## 🎯 優先順位マトリクス

| 機能 | P0 | P1 | P2 | P3 | P4 | P5 | P6 |
|-----|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 音声入力 | ― | ✅ | ― | ― | ― | ― | ― |
| Gemini要約 | ― | ✅ | ― | ― | ✅ | ― | ― |
| GPT-5要約 | ― | ― | ― | ― | ― | ✅ | ― |
| MDプレビュー | ― | ― | ✅ | ― | ― | ― | ― |
| 写真撮影 | ― | ― | ― | ✅ | ― | ― | ― |
| 注釈機能 | ― | ― | ― | ✅ | ― | ― | ― |
| ZIP生成 | ― | ― | ― | ✅ | ― | ― | ― |
| Blob連携 | ― | ― | ― | ― | ✅ | ― | ― |
| TLSピン | ― | ― | ― | ― | ✅ | ― | ― |
| 監査ログ | ― | ― | ― | ― | ― | ✅ | ― |
| PDF出力 | ― | ― | ― | ― | ― | ✅ | ― |
| MDM | ― | ― | ― | ― | ― | ― | ✅ |

---

## 🚨 リスク管理

| リスク | 影響度 | 発生確率 | 対応フェーズ | 軽減策 |
|------|:----:|:----:|:------:|-----|
| Gemini API制限 | 高 | 中 | P1 | レート制限実装・リトライ |
| 証明書期限切れ | 高 | 低 | P4 | 自動更新スクリプト |
| 騒音下誤認識 | 中 | 高 | P1-P2 | 外付けマイク導入 |
| データ破損 | 高 | 低 | P3 | ZIP署名・チェックサム |
| セキュリティ脆弱性 | 高 | 中 | P5 | 継続的スキャン |
| 現場Wi-Fi不安定 | 中 | 高 | P4 | オフライン優先設計 |

---

## 📊 KPI・計測指標

### 技術指標
- **ビルド成功率**: > 95%
- **API応答時間**: < 3秒（Gemini）、< 5秒（GPT-5）
- **アプリクラッシュ率**: < 0.1%
- **同期成功率**: > 99%

### ユーザビリティ指標
- **要約精度（決定事項抽出率）**: > 85%
- **ユーザー満足度**: > 4/5
- **報告書作成時間削減率**: > 70%

### セキュリティ指標
- **脆弱性（Critical/High）**: 0件
- **TLS通信失敗率**: < 0.01%
- **監査ログ完全性**: 100%

---

## 🔄 週次レビュー項目

毎週金曜17:00にチーム内で以下を確認:

1. ✅ 今週完了タスク
2. 🚧 進行中タスク・ブロッカー
3. 📅 次週計画
4. 🐛 バグ・課題一覧
5. 📈 KPI推移
6. 🔐 セキュリティアラート確認

---

## 📝 次のアクション

**今週（Phase 0）の最優先タスク:**

1. ✅ Node.js環境セットアップ
2. ✅ Expoプロジェクト初期化
3. ✅ iPhone 12 に Hello World デプロイ
4. ✅ Git リポジトリ・ブランチ戦略決定
5. ✅ タスク管理ツール設定（GitHub Projects）

**最初のコミット内容:**
```bash
git add .
git commit -m "feat: P0 環境構築完了 - Expo + TypeScript初期化"
```

---

## 📚 関連ドキュメント

- [企画書（マスター）](./企画書.md)
- [アーキテクチャ設計](./architecture.md) ※作成予定
- [API仕様書](./api-spec.md) ※作成予定
- [セキュリティ設計](./security-design.md) ※作成予定
- [コーディング規約](./coding-standards.md) ※作成予定

---

**このロードマップは企画書のSSOT（唯一の情報源）を元に作成されています。**
**変更時は企画書と同期してください。**
