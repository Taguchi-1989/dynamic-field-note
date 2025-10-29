# コードベース全体TDD改善・リファクタリング計画

**作成日**: 2025-10-18
**目的**: 全コードのTDD準拠・テスタビリティ向上・コード品質改善

## 現状分析

### ファイル統計

| カテゴリ       | ファイル数 | TDD実施 | 未実施 | カバレッジ  |
| -------------- | ---------- | ------- | ------ | ----------- |
| **Components** | 6          | 0       | 6      | 0%          |
| **Contexts**   | 1          | 0       | 1      | 0%          |
| **DAO**        | 3          | 3       | 0      | 100% (統合) |
| **Hooks**      | 4          | 0       | 4      | 0%          |
| **Navigation** | 2          | 0       | 2      | 0%          |
| **Screens**    | 8          | 0       | 8      | 0%          |
| **Services**   | 5          | 1       | 4      | 20%         |
| **Utils**      | 3          | 2       | 1      | 67%         |
| **Types**      | 2          | -       | -      | N/A         |
| **合計**       | 34         | 6       | 26     | 18%         |

### テスト状況

#### ✅ テスト済み (6ファイル)

1. **DAO層** (統合テスト)
   - src/dao/CaseDAO.ts → tests/integration/dao/CaseDAO.test.ts
   - src/dao/PhotoDAO.ts → tests/integration/dao/PhotoDAO.test.ts
   - src/dao/ReportDAO.ts → tests/integration/dao/ReportDAO.test.ts

2. **Services**
   - src/services/DatabaseService.node.ts → tests/integration/dao/DatabaseService.test.ts

3. **Utils** (ユニットテスト)
   - src/utils/dateFormatter.ts → src/utils/**tests**/dateFormatter.test.ts
   - src/utils/validators/reportValidator.ts → src/utils/validators/**tests**/reportValidator.test.ts

#### ❌ テスト未実施 (26ファイル)

- Components: 6ファイル
- Contexts: 1ファイル
- Hooks: 4ファイル
- Navigation: 2ファイル
- Screens: 8ファイル
- Services: 4ファイル
- Utils: 1ファイル

---

## リファクタリング計画

### 戦略

1. **優先度付け**: ビジネスロジック > Utils > UI層
2. **段階的実施**: 1日1-2ファイル、テスト作成 → リファクタリング
3. **品質保証**: 各ステップでテスト実行、型チェック、Lint

### Phase A: Utils層 (最優先)

**理由**: ビジネスロジック、再利用性高い、テスト容易

| #   | ファイル                       | 行数 | 優先度 | 工数 | 内容                       |
| --- | ------------------------------ | ---- | ------ | ---- | -------------------------- |
| A1  | src/utils/markdownGenerator.ts | ~100 | 🔴高   | 2h   | Markdown生成ユーティリティ |

**A1: markdownGenerator.ts リファクタリング**

現状分析:

- Markdown生成ロジック
- テスト未実施
- ビジネスロジック含む

実施内容:

1. ユニットテスト作成 (src/utils/**tests**/markdownGenerator.test.ts)
2. 関数分割・純粋関数化
3. エラーハンドリング強化
4. テスト実行・カバレッジ確認

期待効果:

- テストカバレッジ: 0% → 90%+
- 再利用性向上
- バグ検出・修正

---

### Phase B: Hooks層

**理由**: ビジネスロジック分離、React依存、テスト重要

| #   | ファイル                    | 行数 | 優先度 | 工数 | 内容                              |
| --- | --------------------------- | ---- | ------ | ---- | --------------------------------- |
| B1  | src/hooks/useSummarize.ts   | ~80  | 🔴高   | 3h   | AI要約フック                      |
| B2  | src/hooks/useVoiceBuffer.ts | ~120 | 🟡中   | 3h   | 音声バッファ管理                  |
| B3  | src/hooks/useAutoSave.ts    | 90   | ✅完了 | -    | 自動保存 (リファクタリング済)     |
| B4  | src/hooks/useReportForm.ts  | 145  | ✅完了 | -    | フォーム管理 (リファクタリング済) |

**B1: useSummarize.ts リファクタリング**

現状分析:

- AI要約処理のビジネスロジック
- Gemini API統合
- エラーハンドリング必要

実施内容:

1. React Testing Library使用
2. API呼び出しモック
3. エラーケーステスト
4. ローディング状態テスト
5. リトライロジック分離

期待効果:

- API呼び出し失敗時の挙動保証
- ローディング状態管理改善
- エラーハンドリング強化

**B2: useVoiceBuffer.ts リファクタリング**

現状分析:

- 音声録音バッファ管理
- 複雑な状態管理

実施内容:

1. React Testing Library使用
2. バッファロジックの純粋関数化
3. 状態遷移テスト
4. メモリリーク対策

期待効果:

- バッファ管理の信頼性向上
- メモリリーク防止
- 状態遷移の明確化

---

### Phase C: Services層

**理由**: ビジネスロジック、外部依存、テスト重要

| #   | ファイル                             | 行数 | 優先度 | 工数 | 内容                      |
| --- | ------------------------------------ | ---- | ------ | ---- | ------------------------- |
| C1  | src/services/geminiService.ts        | ~150 | 🔴高   | 4h   | Gemini API統合            |
| C2  | src/services/CaseDAO.ts              | ~100 | 🟡中   | 2h   | 重複DAO (削除候補)        |
| C3  | src/services/ReportDAO.ts            | ~100 | 🟡中   | 2h   | 重複DAO (削除候補)        |
| C4  | src/services/DatabaseService.ts      | ~80  | ✅完了 | -    | DB Service (統合テスト済) |
| C5  | src/services/DatabaseService.node.ts | ~300 | ✅完了 | -    | Node DB (統合テスト済)    |

**C1: geminiService.ts リファクタリング**

現状分析:

- Gemini API統合
- API呼び出し、レスポンス処理
- エラーハンドリング

実施内容:

1. API呼び出しモック
2. レスポンスパース処理ユニットテスト
3. エラーハンドリングテスト
4. リトライロジック分離
5. 設定バリデーション

期待効果:

- API統合の信頼性向上
- エラー時の挙動保証
- リトライロジック改善

**C2, C3: CaseDAO.ts, ReportDAO.ts (重複ファイル)**

現状分析:

- src/dao/CaseDAO.ts と src/services/CaseDAO.ts が重複
- src/dao/ReportDAO.ts と src/services/ReportDAO.ts が重複

実施内容:

1. 重複確認
2. src/services/配下を削除
3. インポート修正
4. テスト実行

期待効果:

- コード重複削除
- 保守性向上
- 混乱防止

---

### Phase D: Components層

**理由**: UI層、テスト容易度中、視覚的テスト必要

| #   | ファイル                             | 行数 | 優先度 | 工数 | 内容                              |
| --- | ------------------------------------ | ---- | ------ | ---- | --------------------------------- |
| D1  | src/components/MarkdownPreview.tsx   | ~80  | 🟡中   | 3h   | Markdownプレビュー                |
| D2  | src/components/PhotoAnnotator.tsx    | ~200 | 🟡中   | 4h   | 写真注釈機能                      |
| D3  | src/components/ReportCard.tsx        | 105  | ✅完了 | -    | 報告書カード (リファクタリング済) |
| D4  | src/components/AIStatusIndicator.tsx | ~50  | 🟢低   | 1h   | ステータス表示                    |
| D5  | src/components/LoadingIndicator.tsx  | ~30  | 🟢低   | 1h   | ローディング表示                  |
| D6  | src/components/SummaryButtons.tsx    | ~60  | 🟢低   | 2h   | 要約ボタン群                      |

**D1: MarkdownPreview.tsx リファクタリング**

現状分析:

- Markdownレンダリング
- react-native-markdown-display使用

実施内容:

1. React Testing Library使用
2. レンダリングテスト
3. スタイル適用テスト
4. エッジケーステスト (空文字列、特殊文字)

期待効果:

- Markdownレンダリングの信頼性
- エッジケース対応

**D2: PhotoAnnotator.tsx リファクタリング**

現状分析:

- 写真注釈機能
- 複雑なUIロジック

実施内容:

1. ビジネスロジック抽出 (usePhotoAnnotation hook)
2. React Testing Library使用
3. 注釈追加・編集・削除テスト
4. 状態管理テスト

期待効果:

- UIとロジック分離
- テスタビリティ向上
- バグ検出

---

### Phase E: Screens層

**理由**: UI層、複雑、E2Eテストでカバー可能

| #   | ファイル                          | 行数 | 優先度 | 工数 | 内容                                |
| --- | --------------------------------- | ---- | ------ | ---- | ----------------------------------- |
| E1  | src/screens/CaseFormModal.tsx     | ~150 | 🟡中   | 4h   | 案件フォーム                        |
| E2  | src/screens/CaseListScreen.tsx    | ~200 | 🟡中   | 4h   | 案件一覧                            |
| E3  | src/screens/HomeScreen.tsx        | ~100 | 🟢低   | 2h   | ホーム画面                          |
| E4  | src/screens/CameraScreen.tsx      | ~180 | 🟢低   | 4h   | カメラ画面                          |
| E5  | src/screens/SettingsScreen.tsx    | ~120 | 🟢低   | 3h   | 設定画面                            |
| E6  | src/screens/SyncHistoryScreen.tsx | ~80  | 🟢低   | 2h   | 同期履歴                            |
| E7  | src/screens/ReportFormScreen.tsx  | 153  | ✅完了 | -    | 報告書フォーム (リファクタリング済) |
| E8  | src/screens/ReportListScreen.tsx  | 186  | ✅完了 | -    | 報告書一覧 (リファクタリング済)     |

**E1: CaseFormModal.tsx リファクタリング**

現状分析:

- 案件作成・編集フォーム
- バリデーション含む

実施内容:

1. useCaseForm hook作成
2. バリデーションロジック抽出 (caseValidator.ts)
3. React Testing Library使用
4. フォーム送信テスト
5. バリデーションテスト

期待効果:

- UIとロジック分離
- バリデーション再利用
- テスタビリティ向上

**E2: CaseListScreen.tsx リファクタリング**

現状分析:

- 案件一覧表示
- CRUD操作

実施内容:

1. useCases hook作成
2. CaseCard component抽出
3. React Testing Library使用
4. 一覧表示テスト
5. CRUD操作テスト

期待効果:

- コンポーネント再利用
- ビジネスロジック分離
- テスタビリティ向上

---

### Phase F: その他

| #   | ファイル                              | 行数 | 優先度 | 工数 | 内容                                 |
| --- | ------------------------------------- | ---- | ------ | ---- | ------------------------------------ |
| F1  | src/contexts/AccessibilityContext.tsx | ~60  | 🟢低   | 2h   | アクセシビリティ                     |
| F2  | src/navigation/DrawerNavigator.tsx    | ~80  | 🟢低   | 1h   | Drawer Navigation                    |
| F3  | src/navigation/RootNavigator.tsx      | 61   | ✅完了 | -    | Root Navigation (リファクタリング済) |

---

## 実施スケジュール

### Week 1: Utils + 重要Hooks (Phase A + B)

| 日    | タスク                   | 工数 | 累計 |
| ----- | ------------------------ | ---- | ---- |
| Day 1 | A1: markdownGenerator.ts | 2h   | 2h   |
| Day 2 | B1: useSummarize.ts      | 3h   | 5h   |
| Day 3 | B2: useVoiceBuffer.ts    | 3h   | 8h   |

**Week 1 目標**: Utils・Hooks層のTDDカバレッジ 100%

### Week 2: Services層 (Phase C)

| 日    | タスク               | 工数 | 累計 |
| ----- | -------------------- | ---- | ---- |
| Day 4 | C1: geminiService.ts | 4h   | 12h  |
| Day 5 | C2-C3: 重複DAO削除   | 2h   | 14h  |

**Week 2 目標**: Services層のTDDカバレッジ 100%

### Week 3: Components層 (Phase D)

| 日    | タスク                  | 工数 | 累計 |
| ----- | ----------------------- | ---- | ---- |
| Day 6 | D1: MarkdownPreview.tsx | 3h   | 17h  |
| Day 7 | D2: PhotoAnnotator.tsx  | 4h   | 21h  |
| Day 8 | D4-D6: 残りComponents   | 4h   | 25h  |

**Week 3 目標**: Components層のテストカバレッジ 80%+

### Week 4: Screens層 (Phase E)

| 日        | タスク                 | 工数 | 累計 |
| --------- | ---------------------- | ---- | ---- |
| Day 9     | E1: CaseFormModal.tsx  | 4h   | 29h  |
| Day 10    | E2: CaseListScreen.tsx | 4h   | 33h  |
| Day 11-12 | E3-E6: 残りScreens     | 11h  | 44h  |

**Week 4 目標**: Screens層のテストカバレッジ 60%+

### Week 5: 仕上げ (Phase F)

| 日     | タスク                   | 工数 | 累計 |
| ------ | ------------------------ | ---- | ---- |
| Day 13 | F1-F2: その他            | 3h   | 47h  |
| Day 14 | 総合テスト・ドキュメント | 3h   | 50h  |

**Week 5 目標**: 全体のテストカバレッジ 75%+

---

## 優先順位付けロジック

### 🔴 高優先度

- ビジネスロジック含む
- 再利用性高い
- バグの影響大

### 🟡 中優先度

- UIロジック含む
- 複雑な状態管理
- テスト容易

### 🟢 低優先度

- シンプルなUI
- 設定ファイル的
- E2Eでカバー可能

---

## 目標メトリクス

### 現状

- **ユニットテスト**: 2ファイル (6%)
- **統合テスト**: 4ファイル (12%)
- **E2Eテスト**: 報告書管理のみ
- **総合カバレッジ**: 約18%

### 目標 (Week 5完了時)

- **ユニットテスト**: 15+ ファイル (45%+)
- **統合テスト**: 4ファイル (維持)
- **E2Eテスト**: 主要フロー全て
- **総合カバレッジ**: **75%+**

### 品質目標

- **コード品質スコア**: 8.5/10 → **9.0/10**
- **テスタビリティ**: 9/10 (維持)
- **保守性**: 9/10 (維持)
- **再利用性**: 9/10 (維持)

---

## 実施ルール

### Before リファクタリング

1. ✅ 既存テスト全実行 (baseline)
2. ✅ 対象ファイル分析
3. ✅ テスト戦略策定

### During リファクタリング

1. ✅ テストファースト (ユニットテスト作成)
2. ✅ リファクタリング実施
3. ✅ テスト実行 (Green)
4. ✅ 型チェック、Lint、Format

### After リファクタリング

1. ✅ 全テスト実行
2. ✅ カバレッジ確認
3. ✅ コミット
4. ✅ ドキュメント更新

---

## 次のアクション

### 即座に実施

1. ✅ **Phase A1: markdownGenerator.ts リファクタリング**
   - ユニットテスト作成
   - 関数分割
   - テスト実行

2. ✅ **進捗追跡シート作成**
   - 各ファイルの状態管理
   - カバレッジ可視化

3. ✅ **Week 1 開始**
   - A1 → B1 → B2 の順で実施

---

**作成者**: Claude Code
**最終更新**: 2025-10-18
**ステータス**: 📋 計画策定完了 → 🚀 実施準備完了
