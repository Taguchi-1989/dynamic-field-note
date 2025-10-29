# Dynamic Field Note - プロジェクトコンテキスト

**最終更新**: 2025-10-18

---

## 📋 プロジェクト概要

**Dynamic Field Note**は、現場調査・点検作業を効率化する**React Native/Expo**製のモバイルアプリケーションです。

### 主な機能

1. **音声メモの文字起こし** - 現場での音声録音をテキスト化
2. **AI要約機能** - Google Gemini APIによる自動要約
3. **案件管理** - SQLiteによるローカルデータ管理
4. **写真撮影・添付** - 現場写真の記録
5. **Markdown/PDFエクスポート** - 報告書の生成

### プロジェクトフェーズ

- ✅ **Phase 1**: 基本機能実装完了
- ✅ **Phase 2**: 静的解析・品質管理完了（A+ 98/100）
- 🚧 **Phase 3**: データ永続化・案件管理機能（実装予定）
- 📅 **Phase 4**: クラウド同期・セキュリティ強化
- 📅 **Phase 5**: 本番デプロイ

---

## 🛠️ 技術スタック

### 言語・フレームワーク

- **言語**: TypeScript 5.9.2（strict mode）
- **フレームワーク**: React Native 0.81.4
- **UI**: React Native Paper 5.14.5
- **ナビゲーション**: React Navigation（Drawer）
- **ランタイム**: Expo ~54.0.13

### データ管理

- **ローカルDB**: expo-sqlite 16.0.8（Phase 3で本格活用）
- **ストレージ**: AsyncStorage（一時データ）
- **セキュアストレージ**: expo-secure-store 15.0.7（APIキー保存）

### AI/API

- **AI要約**: Google Gemini API (@google/generative-ai 0.24.1)
- **Markdown**: react-native-markdown-display 7.0.2

### 開発ツール

- **リント**: ESLint 9.37.0（flat config）
- **フォーマット**: Prettier 3.6.2
- **テスト**: Jest 30.2.0 + Vitest（Storybook統合）
- **型チェック**: TypeScript（noEmit mode）
- **Storybook**: @storybook/react-native-web-vite 9.1.13（UIコンポーネントカタログ）

---

## 📂 ディレクトリ構成

```
Dynamic Field Note/
├── src/
│   ├── components/       # UIコンポーネント
│   │   ├── AIStatusIndicator.tsx
│   │   ├── LoadingIndicator.tsx
│   │   ├── MarkdownPreview.tsx
│   │   └── SummaryButtons.tsx
│   ├── contexts/         # React Context
│   │   └── AccessibilityContext.tsx
│   ├── hooks/            # カスタムフック
│   │   ├── useSummarize.ts
│   │   └── useVoiceBuffer.ts
│   ├── navigation/       # ナビゲーション設定
│   │   └── DrawerNavigator.tsx
│   ├── screens/          # 画面コンポーネント
│   │   ├── HomeScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   ├── CaseListScreen.tsx（Phase 3）
│   │   └── SyncHistoryScreen.tsx（Phase 4）
│   ├── services/         # ビジネスロジック
│   │   ├── geminiService.ts
│   │   ├── DatabaseService.ts（Phase 3）
│   │   ├── CaseDAO.ts（Phase 3）
│   │   └── ReportDAO.ts（Phase 3）
│   ├── types/            # 型定義
│   │   ├── summary.ts
│   │   └── case.ts（Phase 3）
│   └── utils/            # ユーティリティ
│       └── markdownGenerator.ts
├── e2e/                  # E2Eテスト
│   ├── smoke/            # スモークテスト
│   └── comprehensive/    # 包括的テスト
├── docs/                 # ドキュメント
├── .devcontainer/        # Dev Container設定
├── .claude/              # Claude Code設定
│   ├── agents/
│   └── commands/
└── App.tsx               # エントリーポイント
```

---

## 🚀 重要なコマンド

### 開発

```bash
# Expo開発サーバー起動
npm start

# Android実機/エミュレータ
npm run android

# iOS実機/シミュレータ
npm run ios

# Web版
npm run web

# Storybook (UIコンポーネントカタログ)
npm run storybook  # http://localhost:6006 で起動
```

### 品質チェック

```bash
# ガードレール（pre-commit と同じ）
npm run guardrails

# 完全チェック
npm run guardrails:full

# 型チェック
npm run type-check

# Lint
npm run lint
npm run lint:fix

# フォーマット
npm run format
npm run format:check
```

### テスト

```bash
# スモークテスト（軽量）
npm run test:smoke

# 包括的テスト
npm run test:comprehensive

# カバレッジ付き
npm run test:coverage
```

---

## 🎯 コーディング規約

### TypeScript

- **strict mode**: 必須
- **any型**: 使用禁止（`@typescript-eslint/no-explicit-any`）
- **未使用変数**: アンダースコアプレフィックス（`_`）で許可
- **戻り値型**: 明示推奨

### React Native

- **関数コンポーネント**: 必須（Hooks使用）
- **Props型定義**: interfaceで明示
- **useEffect依存配列**: 厳密に管理（`react-hooks/exhaustive-deps`）
- **React import**: 不要（React 19.1.0）

### ファイル命名

- **コンポーネント**: PascalCase（`Button.tsx`）
- **フック**: camelCase with `use` prefix（`useVoiceBuffer.ts`）
- **サービス**: camelCase（`geminiService.ts`）
- **型定義**: camelCase（`summary.ts`）

### コミットメッセージ

```bash
# フォーマット
<type>: <description>

# 例
feat: SQLite統合実装
fix: null参照エラー修正
docs: README更新
test: E2Eテスト追加
chore: 依存関係更新
```

---

## 🔒 セキュリティ

### 絶対に触らないファイル

- `.env`（存在しない場合もある）
- `.env.local`（APIキー保存）
- `*.pem`
- `*.key`
- `.git/`
- `node_modules/`

### APIキー管理

```typescript
// ❌ NG: ハードコード
const API_KEY = 'AIzaSyBxxx...';

// ✅ OK: 環境変数
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
```

### ストレージ使い分け

```typescript
// 一般データ → AsyncStorage
await AsyncStorage.setItem('settings', JSON.stringify(data));

// 機密情報 → SecureStore
await SecureStore.setItemAsync('apiKey', key);
```

---

## 🌐 Web互換性とベストプラクティス

### プラットフォーム別UI実装

**React Native Webの基本原則**:

- Web版とネイティブ版で異なるUIパターンを採用することはベストプラクティス
- 各プラットフォームのガイドラインに準拠することが重要

### FABボタンの取り扱い

**現在の実装** ([SummaryButtons.tsx](src/components/SummaryButtons.tsx)):

- **ネイティブ版 (iOS/Android)**: FAB.Group使用（Material Design準拠）
- **Web版**: 非表示（通常ボタンレイアウトで代替）

**理由**:

- FAB.GroupはHTML仕様違反のボタンネスト構造を生成
- Web標準準拠のため、プラットフォーム別実装を採用
- 詳細: [Web互換性分析](docs/WEB_COMPATIBILITY_ANALYSIS.md)

### スタイリングのベストプラクティス

```typescript
// ✅ 正しい: Platform.selectで分岐
const styles = StyleSheet.create({
  box: {
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
});

// ❌ 非推奨: Web版でshadow*プロパティ使用
const styles = StyleSheet.create({
  box: {
    shadowColor: '#000', // Web版では動作しない
  },
});
```

---

## 🐛 既知の問題

### 1. markdown-it 脆弱性（Moderate）

- **CVE**: GHSA-6vfc-qv3f-vr6c
- **影響**: react-native-markdown-display の依存パッケージ
- **リスク**: 低（信頼できるソースのみ使用）
- **対応**: 依存パッケージの更新待ち

### 2. 未使用エクスポート（10件）

- **理由**: Phase 3以降で使用予定
- **対応**: 不要

### 3. 未使用依存パッケージ（7件）

- **expo-camera, expo-file-system, expo-sqlite, jszip**
- **理由**: Phase 3で本格活用
- **対応**: 削除しない

---

## 📝 開発時の注意事項

### AIコーディング品質チェックリスト

**重要**: AIツール（Claude Code等）でコードを生成した場合、必ず以下のチェックリストで検証してください。

研究データによると：

- **40%** のAI生成コードにセキュリティ脆弱性
- **30%** が存在しないパッケージを含む可能性

**チェックリスト**: [AI_CODING_QUALITY_CHECKLIST.md](docs/AI_CODING_QUALITY_CHECKLIST.md)

**主要チェック項目**:

- 🔴 セキュリティ & 依存関係（脆弱性スキャン、APIキー管理）
- 🔴 React Native アンチパターン（コンポーネント内定義、useEffect依存配列）
- 🔴 TypeScript 型安全性（`any`型禁止、null安全性）
- 🟡 パフォーマンス問題（不要な再レンダリング、メモ化）
- 🔵 Web互換性（Platform.select、FAB問題）

### DO（やるべきこと）

1. **AIコーディング品質チェックリストで検証**

   ```bash
   # チェックリストを参照しながら検証
   cat docs/AI_CODING_QUALITY_CHECKLIST.md
   ```

2. **コミット前にガードレール実行**

   ```bash
   npm run guardrails
   ```

3. **型チェックを常に通す**

   ```bash
   npm run type-check
   ```

4. **小さく段階的に実装**
   - 1機能ずつ実装 → テスト → コミット

5. **明確なタスク定義**
   ```bash
   ✅ "Button.tsx のESLintエラーを修正。ロジック変更なし"
   ❌ "コードを改善"
   ```

### DON'T（避けるべきこと）

1. **ガードレールのスキップ**

   ```bash
   # ❌ 絶対にやらない
   git commit --no-verify
   ```

2. **大規模な一括変更**

   ```bash
   # ❌ 危険
   "全ファイルをリファクタリング"

   # ✅ 安全
   "src/components/ のみリファクタリング"
   ```

3. **曖昧な指示**
4. **テストなしの実装**
5. **型エラーの放置**

---

## 🎨 UIガイドライン

### テーマ

- **ライトモード**: デフォルト
- **ダークモード**: AccessibilityContext で切り替え可能
- **フォントサイズ**: small / medium / large（AccessibilityContext）

### レイアウト

- **ナビゲーション**: Drawer Navigator（左スワイプで開く）
- **カラースキーム**: React Native Paper のデフォルトテーマ
- **SafeArea**: react-native-safe-area-context で保護

---

## 🔄 Phase 3 実装予定（次のステップ）

### 1. SQLite統合

```typescript
// src/services/DatabaseService.ts
- initDatabase(): データベース初期化
- executeQuery(): SQL実行
- migrate(): マイグレーション
```

### 2. 案件管理機能

```typescript
// src/services/CaseDAO.ts
- createCase(): 案件作成
- updateCase(): 案件更新
- deleteCase(): 案件削除
- listCases(): 案件一覧取得
```

### 3. 写真撮影機能

```typescript
// expo-camera 統合
-現場写真の撮影 - 案件への添付 - サムネイル生成;
```

### 4. ファイルエクスポート

```typescript
// expo-file-system + jszip
- Markdownエクスポート
- PDFエクスポート（計画中）
- ZIPアーカイブ生成
```

---

## 📚 参考リンク

### 公式ドキュメント

- [Expo Docs](https://docs.expo.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)
- [Google Gemini API](https://ai.google.dev/)

### プロジェクトドキュメント

- [AIコーディング品質チェックリスト](docs/AI_CODING_QUALITY_CHECKLIST.md) ⭐ **重要**
- [セキュリティ監視](docs/security-monitoring.md)
- [静的解析レポート](docs/static-analysis-report.md)
- [バイパス実行ガイド](docs/bypass-execution-guide.md)

---

## 🚨 緊急時の対応

### 問題が発生した場合

```bash
# 直前のコミットに戻る
git reset --hard HEAD^

# 特定ファイルのみ戻す
git checkout HEAD -- src/problem-file.ts

# バックアップから復元
cp .claude/backups/problem-file.ts.backup-* src/problem-file.ts
```

### 開発環境のリセット

```bash
# node_modules を削除して再インストール
rm -rf node_modules
npm install

# Expo キャッシュクリア
expo start -c

# TypeScript キャッシュクリア
rm -rf node_modules/.cache
```

---

## ✅ 品質基準

### 必須項目（全て合格必須）

- ✅ TypeScript: 0エラー（strict mode）
- ✅ ESLint: 0警告（max-warnings: 0）
- ✅ Prettier: 100%準拠
- ✅ Tests: 全テストパス
- ✅ Smoke Tests: 実行時間 < 1分

### 目標品質スコア

- **TypeScript**: 100/100
- **ESLint**: 100/100
- **Prettier**: 100/100
- **循環依存**: 0件
- **セキュリティ**: 95/100以上
- **総合**: 98/100以上（A+）

---

**このドキュメントは開発の進捗に合わせて更新してください。**

**Claude Code で効率的に開発を進めましょう！** 🚀
