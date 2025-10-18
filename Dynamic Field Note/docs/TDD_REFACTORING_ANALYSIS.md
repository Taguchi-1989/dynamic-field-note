# TDD品質・リファクタリング分析レポート

**分析日**: 2025-10-18
**対象**: Phase 3.4 新規実装コード (報告書管理機能)

## 分析概要

Phase 3.4で新規実装した3つのファイルについて、TDD原則への準拠状況とリファクタリングの必要性を分析しました。

## 分析対象ファイル

1. [src/screens/ReportListScreen.tsx](../src/screens/ReportListScreen.tsx) (274行)
2. [src/screens/ReportFormScreen.tsx](../src/screens/ReportFormScreen.tsx) (342行)
3. [src/navigation/RootNavigator.tsx](../src/navigation/RootNavigator.tsx) (61行)

---

## 1. ReportListScreen.tsx - 詳細分析

### TDD観点の評価

#### ✅ 良い点

1. **単一責任の原則 (SRP)**
   - 報告書一覧表示に特化
   - 各関数が明確な単一の責任を持つ

2. **依存性注入**
   - `reportDAO`を外部から注入
   - テスト時にモック可能

3. **useCallbackによるメモ化**
   - 適切に依存配列を管理
   - 不要な再レンダリングを防止

4. **エラーハンドリング**
   - try-catch でエラーを適切に捕捉
   - ユーザーフレンドリーなエラーメッセージ

#### ⚠️ リファクタリング推奨箇所

##### 1. **formatDate関数の抽出** (重要度: 中)

**現状**:

```typescript
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

**問題点**:

- コンポーネント内で定義されており、再利用不可
- 他の画面でも同様のフォーマットが必要になる可能性
- テストしにくい (コンポーネント全体をマウントする必要)

**推奨改善**:

```typescript
// src/utils/dateFormatter.ts (新規作成)
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

**効果**:

- ✅ 単体テスト可能
- ✅ 再利用性向上
- ✅ 一貫性のある日時フォーマット

##### 2. **ReportCardコンポーネントの抽出** (重要度: 高)

**現状**:

```typescript
reports.map((report) => (
  <Card
    key={report.id}
    style={styles.card}
    onPress={() => handleEdit(report)}
    onLongPress={() => handleDelete(report)}
  >
    <Card.Content>
      {/* 20行以上のJSX */}
    </Card.Content>
  </Card>
))
```

**問題点**:

- JSXが長すぎる (可読性低下)
- 報告書カードの再利用不可
- テストしにくい

**推奨改善**:

```typescript
// src/components/ReportCard.tsx (新規作成)
interface ReportCardProps {
  report: Report;
  onPress: () => void;
  onLongPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Card
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{report.title}</Text>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item
              leadingIcon="pencil"
              onPress={onEdit}
              title="編集"
            />
            <Divider />
            <Menu.Item
              leadingIcon="delete"
              onPress={onDelete}
              title="削除"
            />
          </Menu>
        </View>
        <Text style={styles.dateText}>
          作成: {formatDateTime(report.created_at)}
        </Text>
        <Text style={styles.dateText}>
          更新: {formatDateTime(report.updated_at)}
        </Text>
        {report.content && (
          <Text style={styles.contentPreview} numberOfLines={2}>
            {report.content.substring(0, 100)}
            {report.content.length > 100 ? '...' : ''}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};
```

**効果**:

- ✅ 単体テスト可能
- ✅ 可読性向上
- ✅ 再利用性向上
- ✅ 関心の分離 (SRP準拠)

##### 3. **カスタムフックの抽出** (重要度: 中)

**現状**:

```typescript
const [reports, setReports] = useState<Report[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

const loadReports = useCallback(async () => {
  try {
    setLoading(true);
    const data = await reportDAO.findByCaseId(caseId);
    setReports(data);
  } catch (error) {
    console.error('[ReportListScreen] Failed to load reports:', error);
    Alert.alert('エラー', '報告書の読み込みに失敗しました');
  } finally {
    setLoading(false);
  }
}, [caseId]);
```

**推奨改善**:

```typescript
// src/hooks/useReports.ts (新規作成)
export const useReports = (caseId: number) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportDAO.findByCaseId(caseId);
      setReports(data);
    } catch (err) {
      const error = err as Error;
      console.error('[useReports] Failed to load reports:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const deleteReport = useCallback(
    async (reportId: number) => {
      try {
        await reportDAO.delete(reportId);
        await loadReports();
      } catch (err) {
        const error = err as Error;
        console.error('[useReports] Failed to delete report:', error);
        throw error;
      }
    },
    [loadReports]
  );

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  return {
    reports,
    loading,
    error,
    loadReports,
    deleteReport,
  };
};
```

**効果**:

- ✅ ビジネスロジックとUIの分離
- ✅ 単体テスト可能
- ✅ 再利用性向上
- ✅ エラー状態の管理改善

---

## 2. ReportFormScreen.tsx - 詳細分析

### TDD観点の評価

#### ✅ 良い点

1. **バリデーション関数の分離**
   - `validate()`が独立した関数
   - テスト可能な構造

2. **状態管理の明確性**
   - 各状態が明確な目的を持つ
   - 自動保存とマニュアル保存の区別

3. **エラーハンドリング**
   - 読み込み・保存時のエラーを適切に処理

#### ⚠️ リファクタリング推奨箇所

##### 1. **自動保存ロジックのカスタムフック化** (重要度: 高)

**現状**:

```typescript
const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

useEffect(() => {
  if (!isModified || (!title && !content)) {
    return;
  }

  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  const timer = setTimeout(() => {
    handleSave(true);
  }, 5000);

  setAutoSaveTimer(timer);

  return () => {
    if (timer) {
      clearTimeout(timer);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [title, content, isModified]);
```

**問題点**:

- コンポーネント内に自動保存ロジックが混在
- `eslint-disable`が必要 (依存配列の複雑さ)
- テストしにくい
- 再利用不可

**推奨改善**:

```typescript
// src/hooks/useAutoSave.ts (新規作成)
interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useAutoSave = <T>({
  data,
  onSave,
  delay = 5000,
  enabled = true,
}: UseAutoSaveOptions<T>) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 既存のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 新しいタイマーをセット
    timerRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onSave(data);
        setLastSaved(new Date());
      } catch (error) {
        console.error('[useAutoSave] Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);

  return { isSaving, lastSaved };
};

// 使用例
const { isSaving: autoSaving } = useAutoSave({
  data: { title, content },
  onSave: async (data) => {
    await handleSave(true); // isDraft
  },
  enabled: isModified && (!!title || !!content),
});
```

**効果**:

- ✅ 単体テスト可能
- ✅ 再利用性向上
- ✅ `eslint-disable`不要
- ✅ 最終保存時刻の追跡

##### 2. **バリデーションロジックの抽出** (重要度: 中)

**現状**:

```typescript
const validate = (): boolean => {
  if (!title.trim()) {
    Alert.alert('入力エラー', 'タイトルを入力してください');
    return false;
  }

  if (title.length > 100) {
    Alert.alert('入力エラー', 'タイトルは100文字以内で入力してください');
    return false;
  }

  return true;
};
```

**問題点**:

- UIとバリデーションロジックが密結合
- Alert.alertのモックが必要 (テスト困難)
- バリデーションルールの再利用不可

**推奨改善**:

```typescript
// src/utils/validators/reportValidator.ts (新規作成)
export interface ValidationError {
  field: string;
  message: string;
}

export interface ReportValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateReportTitle = (title: string): ValidationError | null => {
  if (!title.trim()) {
    return { field: 'title', message: 'タイトルを入力してください' };
  }

  if (title.length > 100) {
    return { field: 'title', message: 'タイトルは100文字以内で入力してください' };
  }

  return null;
};

export const validateReport = (title: string, content?: string): ReportValidationResult => {
  const errors: ValidationError[] = [];

  const titleError = validateReportTitle(title);
  if (titleError) {
    errors.push(titleError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// 使用例 (ReportFormScreen内)
const validate = (): boolean => {
  const result = validateReport(title, content);

  if (!result.isValid) {
    const firstError = result.errors[0];
    Alert.alert('入力エラー', firstError.message);
    return false;
  }

  return true;
};
```

**効果**:

- ✅ 単体テスト可能 (Alertのモック不要)
- ✅ 再利用性向上
- ✅ 複数のエラーを一度に検出可能
- ✅ バリデーションルールの一元管理

##### 3. **フォーム状態管理のカスタムフック化** (重要度: 高)

**現状**:

```typescript
const [title, setTitle] = useState('');
const [content, setContent] = useState('');
const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [isModified, setIsModified] = useState(false);
```

**推奨改善**:

```typescript
// src/hooks/useReportForm.ts (新規作成)
interface UseReportFormOptions {
  caseId: number;
  reportId?: number;
}

export const useReportForm = ({ caseId, reportId }: UseReportFormOptions) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 報告書読み込み
  const loadReport = useCallback(async () => {
    if (!reportId) return;

    try {
      setLoading(true);
      setError(null);
      const report = await reportDAO.findById(reportId);

      if (!report) {
        throw new Error('Report not found');
      }

      setTitle(report.title);
      setContent(report.content || '');
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  // 保存
  const save = useCallback(async () => {
    const validationResult = validateReport(title, content);
    if (!validationResult.isValid) {
      throw new Error(validationResult.errors[0].message);
    }

    try {
      setSaving(true);
      setError(null);

      if (reportId) {
        await reportDAO.update(reportId, {
          title: title.trim(),
          content: content.trim() || undefined,
        });
      } else {
        await reportDAO.create({
          case_id: caseId,
          title: title.trim(),
          content: content.trim() || undefined,
        });
      }

      setIsModified(false);
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [caseId, reportId, title, content]);

  // 初期ロード
  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId, loadReport]);

  // 変更検知
  useEffect(() => {
    setIsModified(true);
  }, [title, content]);

  return {
    title,
    setTitle,
    content,
    setContent,
    loading,
    saving,
    isModified,
    error,
    save,
    loadReport,
  };
};
```

**効果**:

- ✅ ビジネスロジックとUIの完全分離
- ✅ 単体テスト可能
- ✅ エラー状態の一元管理
- ✅ 再利用性向上

---

## 3. RootNavigator.tsx - 詳細分析

### TDD観点の評価

#### ✅ 良い点

1. **シンプルで明確**
   - ナビゲーション定義に特化
   - 過度に複雑ではない

2. **型安全性**
   - `RootStackParamList`で型定義
   - TypeScriptの恩恵を最大限享受

3. **適切なコメント**
   - 構造が明確に説明されている

#### ✅ リファクタリング不要

このファイルは以下の理由から**リファクタリング不要**と判断:

- 単一責任の原則に準拠
- テスト不要な設定ファイル的性質
- 適切なサイズ (61行)
- 明確な構造

---

## 4. E2Eテストの評価

### ✅ 良い点

1. **包括的なカバレッジ**
   - 19テストケースで全フローカバー
   - CRUD操作完全テスト

2. **適切なテスト構造**
   - describe/itによるグルーピング
   - Arrange-Act-Assert パターン準拠

3. **データベース初期化**
   - beforeAll/afterAllで適切に管理

#### ⚠️ 改善推奨箇所

##### 1. **テストヘルパーの作成** (重要度: 低)

**推奨改善**:

```typescript
// e2e/helpers/reportTestHelpers.ts (新規作成)
export const createTestCase = async (overrides = {}) => {
  return await caseDAO.create({
    title: 'テスト案件',
    status: 'active',
    description: 'テスト用',
    ...overrides,
  });
};

export const createTestReport = async (caseId: number, overrides = {}) => {
  return await reportDAO.create({
    case_id: caseId,
    title: 'テスト報告書',
    ...overrides,
  });
};
```

---

## 5. 総合評価

### TDD原則への準拠度

| 項目                 | 評価 | 詳細                         |
| -------------------- | ---- | ---------------------------- |
| テストファースト     | ⚠️   | E2E後付け (TDD理想ではない)  |
| 単一責任の原則 (SRP) | ✅   | 各コンポーネントが明確な責任 |
| 依存性注入 (DI)      | ✅   | DAOを外部から注入            |
| テスタビリティ       | ⚠️   | カスタムフック化で改善可能   |
| リファクタリング     | ⚠️   | いくつか改善の余地あり       |

### コード品質スコア

| カテゴリ           | スコア | 詳細                            |
| ------------------ | ------ | ------------------------------- |
| 可読性             | 7/10   | 長いJSX、コンポーネント抽出推奨 |
| 保守性             | 7/10   | カスタムフック化で改善可能      |
| テスタビリティ     | 6/10   | UIロジック分離で大幅改善可能    |
| 再利用性           | 6/10   | utils/hooks抽出で改善可能       |
| パフォーマンス     | 9/10   | useCallback適切に使用           |
| TypeScript型安全性 | 10/10  | 完璧                            |

**総合スコア**: **7.5/10** (Good - リファクタリングで8.5+に改善可能)

---

## 6. リファクタリング優先度

### 🔴 高優先度 (今すぐ実施推奨)

1. **ReportCardコンポーネント抽出** (ReportListScreen)
   - 影響: 可読性、テスタビリティ大幅向上
   - 工数: 1-2時間
   - リスク: 低

2. **useAutoSaveフック作成** (ReportFormScreen)
   - 影響: テスタビリティ、再利用性向上
   - 工数: 2-3時間
   - リスク: 低

3. **useReportFormフック作成** (ReportFormScreen)
   - 影響: ビジネスロジックとUIの分離
   - 工数: 3-4時間
   - リスク: 中

### 🟡 中優先度 (次のイテレーションで実施)

4. **formatDate utilities抽出** (ReportListScreen)
   - 影響: 再利用性向上
   - 工数: 30分
   - リスク: 低

5. **バリデーションロジック抽出** (ReportFormScreen)
   - 影響: テスタビリティ向上
   - 工数: 1-2時間
   - リスク: 低

6. **useReportsフック作成** (ReportListScreen)
   - 影響: ビジネスロジックとUIの分離
   - 工数: 2-3時間
   - リスク: 中

### 🟢 低優先度 (余裕があれば実施)

7. **テストヘルパー作成** (E2Eテスト)
   - 影響: テスト可読性向上
   - 工数: 30分
   - リスク: 低

---

## 7. リファクタリング実施計画

### Phase 1: 基盤整備 (2-3時間)

```
1. src/utils/dateFormatter.ts作成
2. src/utils/validators/reportValidator.ts作成
3. 既存コードの修正 (formatDate, validate)
4. 単体テスト作成
```

### Phase 2: コンポーネント分離 (3-4時間)

```
1. src/components/ReportCard.tsx作成
2. ReportListScreen修正
3. 単体テスト作成
```

### Phase 3: カスタムフック化 (6-8時間)

```
1. src/hooks/useAutoSave.ts作成
2. src/hooks/useReportForm.ts作成
3. src/hooks/useReports.ts作成
4. 既存画面の修正
5. 単体テスト作成
```

### 総工数見積もり

- **最小**: 11時間
- **最大**: 15時間
- **推奨**: 2日間 (余裕を持って)

---

## 8. 結論

### 現状評価

Phase 3.4の実装は**機能的には完璧**ですが、**TDD理想からは乖離**しています:

- ✅ **動作**: 完璧 (19 E2Eテスト全合格)
- ✅ **型安全性**: 完璧 (TypeScript 100%準拠)
- ⚠️ **テスタビリティ**: 改善の余地あり
- ⚠️ **再利用性**: 改善の余地あり
- ⚠️ **保守性**: 改善の余地あり

### 推奨アクション

#### Option A: 今すぐリファクタリング (推奨)

**メリット**:

- 技術的負債の早期解消
- 今後の開発効率向上
- テスト容易性の向上

**デメリット**:

- Phase 3.5の開始が1-2日遅れる

#### Option B: Phase 3完了後にリファクタリング

**メリット**:

- Phase 3を予定通り完了
- まとめてリファクタリング

**デメリット**:

- 技術的負債の蓄積
- 後回しにすると忘れる可能性

### 最終推奨

**🎯 Option A (今すぐリファクタリング)** を推奨します。

理由:

1. コード量がまだ少ない (リファクタリング容易)
2. 今後の機能追加でパターンを確立
3. テストファーストの文化醸成
4. 長期的な開発効率向上

---

## 9. 次のステップ

### 即座に実施すべきこと

1. ✅ **このレポートをレビュー**
2. 🔄 **リファクタリング優先度の合意**
3. 🔄 **Phase 3.4リファクタリング実施** (推奨)
   - Phase 1: 基盤整備
   - Phase 2: コンポーネント分離
   - Phase 3: カスタムフック化
4. ⏭️ **Phase 3.5へ進む**

---

**作成者**: Claude Code
**レビュー推奨**: あり
**更新頻度**: リファクタリング完了時に更新
