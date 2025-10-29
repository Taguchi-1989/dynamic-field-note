# 🎯 Dynamic Field Note - PoC デモガイド

**最終更新**: 2025-10-18
**Phase 1**: PoC（Proof of Concept）実装完了

このガイドでは、Dynamic Field NoteのPoC機能を実際に動かして確認する方法を説明します。

---

## 📋 目次

1. [PoC機能概要](#poc機能概要)
2. [事前準備](#事前準備)
3. [起動手順](#起動手順)
4. [デモシナリオ](#デモシナリオ)
5. [トラブルシューティング](#トラブルシューティング)

---

## PoC機能概要

### ✅ 実装済み機能（Phase 1完了）

#### 1. 音声入力バッファ（P1-1）

- **ファイル**: `src/hooks/useVoiceBuffer.ts`
- **機能**:
  - 5秒間隔でテキストをバッファに蓄積
  - 5分経過で自動送信トリガー
  - 無音30秒で自動送信トリガー
  - 手動送信・クリア機能

#### 2. Gemini 2.5 Pro API 接続（P1-2）

- **ファイル**: `src/services/geminiService.ts`
- **機能**:
  - Google Generative AI（Gemini 2.5 Pro）との連携
  - 音声文字起こしからの要約生成
  - JSON形式での構造化出力

#### 3. JSON→Markdown 変換（P1-3）

- **ファイル**: `src/utils/markdownGenerator.ts`
- **機能**:
  - AI要約結果をMarkdown形式に変換
  - 日時、トピック、ToDo、次回議題の整形
  - エクスポート用フォーマット

#### 4. 基本要約フロー統合（P1-4）

- **ファイル**: `src/hooks/useSummarize.ts`
- **機能**:
  - 音声入力 → AI要約 → Markdown生成の完全フロー
  - エラーハンドリング
  - リトライ機能

#### 5. PoC デモUI（P1-5）

- **ファイル**: `src/screens/HomeScreen.tsx`
- **機能**:
  - テキスト入力フォーム
  - 中間まとめボタン（Gemini Fast）
  - 最終まとめボタン（Gemini Pro）
  - Markdownプレビュー
  - AI状態インジケーター

---

## 事前準備

### 1. Gemini API Keyの取得

**手順**:

1. **Google AI Studioにアクセス**
   - https://makersuite.google.com/app/apikey

2. **APIキーを作成**
   - 「Create API Key」をクリック
   - プロジェクトを選択（または新規作成）
   - APIキーをコピー

3. **環境変数に設定**

   ```bash
   # .env.local ファイルを作成
   cp .env.local.example .env.local

   # エディタで開く
   nano .env.local
   # または
   code .env.local
   ```

4. **APIキーを貼り付け**
   ```env
   # Gemini API Key（必須）
   EXPO_PUBLIC_GEMINI_API_KEY=your-actual-api-key-here
   ```

### 2. 依存関係の確認

```bash
# 依存関係がインストールされているか確認
npm list expo @google/generative-ai

# 未インストールの場合
npm install
```

---

## 起動手順

### オプション1: Web環境（推奨）

**最も簡単で高速な方法**

```bash
# 開発サーバー起動
npm run web

# ブラウザが自動的に開きます
# http://localhost:8081
```

**確認項目**:

- [ ] ホーム画面が表示される
- [ ] テキスト入力フォームが表示される
- [ ] 「中間まとめ」「最終まとめ」ボタンが表示される

---

### オプション2: Expo Go（スマートフォン）

**実機での動作確認**

```bash
# 開発サーバー起動
npm start

# QRコードが表示される
```

**スマートフォン側**:

1. Expo Goアプリをインストール
2. QRコードをスキャン
3. アプリが起動

---

### オプション3: iOS Simulator（macOSのみ）

```bash
npm run ios
```

---

## デモシナリオ

### シナリオ1: 基本フロー確認

**目的**: 音声入力 → AI要約 → Markdown生成の完全フローを確認

**手順**:

1. **アプリ起動**

   ```bash
   npm run web
   ```

2. **テスト用テキスト入力**

   ホーム画面のテキスト入力欄に以下を入力：

   ```
   今日は新規プロジェクトのキックオフミーティングを実施しました。
   参加者は山田部長、佐藤さん、鈴木さん、そして私の4名です。

   まず、プロジェクトの概要について山田部長から説明がありました。
   今回のプロジェクトは、顧客管理システムの刷新が目的です。
   現行システムの課題として、レスポンスの遅さとUIの使いづらさが挙げられました。

   次に、スケジュールについて確認しました。
   要件定義は2週間、設計フェーズは3週間、開発は2ヶ月を予定しています。
   佐藤さんから、テスト期間も十分に確保すべきとの意見があり、
   1ヶ月のテスト期間を追加することになりました。

   今後のToDoとして、次回までに要件定義書のドラフトを作成することが決まりました。
   また、現行システムのユーザーヒアリングも実施予定です。

   次回ミーティングは来週火曜日の14時からです。
   ```

3. **中間まとめ実行**
   - 「中間まとめ（速い）」ボタンをクリック
   - AI状態インジケーターが「処理中」になる
   - 5-10秒待機

4. **結果確認**
   - Markdownプレビューに要約が表示される
   - 以下の項目が含まれているか確認:
     - 📅 日時
     - 📝 概要
     - 👥 参加者
     - 💬 議論内容
     - ✅ 決定事項
     - 📋 ToDo
     - 🔜 次回議題

5. **処理時間確認**
   - スナックバーに処理時間が表示される
   - 例: "中間まとめ完了 (3456ms)"

**期待される結果**:

- ✅ AI要約が正常に生成される
- ✅ Markdown形式で表示される
- ✅ 構造化された情報（日時、参加者、ToDoなど）
- ✅ 処理時間が表示される

---

### シナリオ2: エラーハンドリング確認

**目的**: APIエラー時の動作を確認

**手順**:

1. **無効なAPIキーを設定**

   ```env
   EXPO_PUBLIC_GEMINI_API_KEY=invalid-key
   ```

2. **アプリ再起動**

   ```bash
   # Ctrl+C で停止
   npm run web
   ```

3. **要約実行**
   - テキストを入力
   - 「中間まとめ」をクリック

4. **エラー表示確認**
   - AI状態が「エラー」になる
   - エラーメッセージが表示される
   - リトライボタンが表示される

**期待される結果**:

- ✅ エラーが適切に表示される
- ✅ アプリがクラッシュしない
- ✅ リトライ機能が使える

---

### シナリオ3: 音声バッファ自動送信

**目的**: 5分経過または無音30秒での自動送信を確認

**手順**:

1. **テキスト入力**
   - 短いテキストを入力（例: "テスト入力1"）

2. **30秒待機**
   - 何もせず30秒待つ

3. **自動送信トリガー確認**
   - スナックバーに「無音検知で送信準備完了」が表示される

4. **手動送信**
   - 「中間まとめ」ボタンをクリック

**期待される結果**:

- ✅ 30秒経過でスナックバー表示
- ✅ バッファがクリアされない（手動送信まで保持）

---

### シナリオ4: 最終まとめ（Gemini Pro）

**目的**: より高精度なAI要約を確認

**手順**:

1. **長文テキスト入力**
   - 複雑な議事録を入力（500文字以上）

2. **最終まとめ実行**
   - 「最終まとめ（精度優先）」ボタンをクリック

3. **処理時間比較**
   - 中間まとめより時間がかかることを確認（10-20秒）

4. **要約品質確認**
   - より詳細な要約が生成されることを確認

**期待される結果**:

- ✅ 高精度な要約
- ✅ 処理時間は長い（品質優先）
- ✅ 構造化された詳細な出力

---

## 実装済み機能の詳細

### 🎤 音声入力バッファ（useVoiceBuffer）

**場所**: `src/hooks/useVoiceBuffer.ts`

```typescript
const {
  buffer, // バッファ配列
  fullText, // 全テキスト
  addText, // テキスト追加
  clearBuffer, // クリア
  isReadyToSend, // 送信準備完了フラグ
  sendReason, // 送信理由（auto/silence/manual）
} = useVoiceBuffer(config, callback);
```

**設定**:

- `bufferInterval: 5000` - 5秒間隔で更新
- `autoSendInterval: 300000` - 5分で自動送信
- `silenceThreshold: 30000` - 無音30秒で送信

---

### 🤖 AI要約（useSummarize）

**場所**: `src/hooks/useSummarize.ts`

```typescript
const {
  isLoading, // ローディング状態
  error, // エラー
  markdown, // Markdown結果
  processingTime, // 処理時間
  executeSummarize, // 実行
  clearSummary, // クリア
  retry, // リトライ
} = useSummarize({ onProgress });
```

**フロー**:

1. `executeSummarize(text)` 呼び出し
2. Gemini APIにリクエスト
3. JSON形式で要約取得
4. Markdownに変換
5. 結果を返却

---

### 📝 Markdown生成（markdownGenerator）

**場所**: `src/utils/markdownGenerator.ts`

```typescript
// JSON → Markdown変換
const markdown = jsonToMarkdown(summaryJSON);

// 最終まとめ → Markdown
const finalMarkdown = finalSummaryToMarkdown(finalSummary);

// Markdown → プレーンテキスト
const plainText = markdownToPlainText(markdown);

// エクスポート用フォーマット
const exportText = formatMarkdownForExport(markdown, metadata);
```

**出力形式**:

```markdown
# 📝 議事録

📅 **日時**: 2025-10-18 12:30

## 📋 概要

[AI生成の概要]

## 👥 参加者

- 山田部長
- 佐藤さん
- 鈴木さん

## 💬 議論内容

[トピックごとの議論]

## ✅ 決定事項

- [決定事項1]
- [決定事項2]

## 📋 ToDo

- [ ] 要件定義書ドラフト作成
- [ ] ユーザーヒアリング実施

## 🔜 次回議題

- [次回議題]
```

---

## トラブルシューティング

### 問題1: APIキーエラー

**症状**: "API key not valid" エラー

**解決策**:

```bash
# 1. APIキーを確認
cat .env.local | grep GEMINI_API_KEY

# 2. 正しいキーを設定
echo "EXPO_PUBLIC_GEMINI_API_KEY=your-key-here" >> .env.local

# 3. アプリ再起動
npm run web
```

---

### 問題2: 要約が生成されない

**症状**: ボタンを押しても何も起こらない

**確認項目**:

1. **コンソールエラー確認**
   - ブラウザのDevTools → Console
   - エラーメッセージを確認

2. **ネットワーク確認**
   - DevTools → Network
   - Gemini APIへのリクエストが送信されているか

3. **APIキー確認**
   ```bash
   # 環境変数が読み込まれているか
   npx expo config --type public
   ```

---

### 問題3: 処理が遅い

**症状**: 要約に30秒以上かかる

**原因と対策**:

1. **ネットワーク遅延**
   - Wi-Fi接続を確認
   - VPN使用時は無効化してテスト

2. **入力テキストが長すぎる**
   - 5000文字以下に制限
   - 分割して実行

3. **Gemini API制限**
   - レートリミット（1分に60リクエスト）
   - 連続実行を避ける

---

### 問題4: Markdownが表示されない

**症状**: 要約完了後、プレビューが空白

**確認項目**:

1. **markdown変数を確認**
   - React DevToolsでStateを確認
   - `markdown` が空でないか

2. **MarkdownPreviewコンポーネント**

   ```tsx
   <MarkdownPreview markdown={markdown} />
   ```

   - propsが正しく渡されているか

---

## 次のステップ

PoCが動作確認できたら：

1. ✅ **Phase 2**: UI/UX整備（既に完了）
2. ✅ **Phase 3**: ローカル保存（既に完了）
3. 🔜 **Phase 4**: Azure連携
4. 🔜 **Phase 5**: α版統合

詳細は [ROADMAP.md](./ROADMAP.md) を参照してください。

---

## 参考資料

- [開発環境セットアップ](./DEVELOPMENT_ENVIRONMENT_SETUP.md)
- [プロジェクトロードマップ](./ROADMAP.md)
- [イシュー管理ガイド](./ISSUE_MANAGEMENT_GUIDE.md)

---

**質問・問題がある場合は、新しいイシューを作成してください！**
