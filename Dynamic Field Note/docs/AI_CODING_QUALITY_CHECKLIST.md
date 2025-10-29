# AIコーディング品質チェックリスト

**最終更新**: 2025-10-22
**対象プロジェクト**: Dynamic Field Note (React Native/Expo/TypeScript)

---

## 📋 概要

このチェックリストは、AIコーディングツール（Claude Code等）で生成されたコードの品質を検証するためのガイドです。
**研究結果**: AI生成コードの40%にセキュリティ脆弱性、30%が幻覚パッケージを含む可能性があります。

### 使用タイミング

- ✅ AIによるコード生成後
- ✅ Pull Request作成前
- ✅ コードレビュー時
- ✅ 本番リリース前

### 検証レベル

- **🔴 Critical**: 本番環境で重大な影響
- **🟡 Warning**: パフォーマンス・保守性に影響
- **🔵 Info**: ベストプラクティス推奨

---

## 1. セキュリティ & 依存関係チェック

### 1.1 脆弱性スキャン 🔴

**問題**: AI生成コードの40%に脆弱性が含まれる（研究データ）

**チェック項目**:

- [ ] `npm audit` で脆弱性0件
- [ ] 既知のCVEが含まれていない
- [ ] セキュリティアラートに対応済み

**検出方法**:

```bash
npm audit --production
npm audit fix
```

**NG例**:

```typescript
// ❌ SQL Injection のリスク
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**OK例**:

```typescript
// ✅ パラメータ化クエリ
const query = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

---

### 1.2 パッケージの実在性確認 🔴

**問題**: AI生成の30%が存在しないパッケージを含む

**チェック項目**:

- [ ] package.jsonの全パッケージがnpmに存在
- [ ] バージョン番号が実在する
- [ ] 最終更新日が古すぎない（5年以上放置は警告）

**検出方法**:

```bash
npm outdated
npm view <package-name> time
```

**NG例**:

```json
{
  "dependencies": {
    "react-native-super-storage": "^2.0.0" // 存在しないパッケージ
  }
}
```

**OK例**:

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.1.0"
  }
}
```

---

### 1.3 APIキーのハードコード確認 🔴

**問題**: 機密情報の漏洩リスク

**チェック項目**:

- [ ] コード内に`AIza...`等のAPIキーが無い
- [ ] `.env`ファイルが`.gitignore`に含まれる
- [ ] SecureStoreまたは環境変数を使用

**検出方法**:

```bash
# APIキーパターンを検索
grep -r "AIza[0-9A-Za-z-_]{35}" src/
grep -r "sk-[a-zA-Z0-9]{48}" src/
```

**NG例**:

```typescript
// ❌ ハードコード
const GEMINI_API_KEY = 'AIzaSyBxxxxxxxxxxxxxxxxxxx';
```

**OK例**:

```typescript
// ✅ 環境変数
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ✅ SecureStore
import * as SecureStore from 'expo-secure-store';
const apiKey = await SecureStore.getItemAsync('gemini_api_key');
```

---

### 1.4 環境変数の適切な使用 🟡

**チェック項目**:

- [ ] `EXPO_PUBLIC_` プレフィックスを正しく使用
- [ ] `.env.example` にサンプル値を記載
- [ ] 機密情報とそうでない情報を分離

**OK例**:

```typescript
// ✅ クライアント側で使用可能
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

// ✅ サーバー側専用（Expoでは使用しない）
const SECRET = process.env.SECRET_KEY;
```

---

## 2. React Native特有のアンチパターン検出

### 2.1 コンポーネント内コンポーネント定義 🔴

**問題**: 親の再レンダリングごとに子コンポーネントが再生成される

**チェック項目**:

- [ ] コンポーネント内で`function Component()`を定義していない
- [ ] コンポーネント内で`const Component = () => {}`を定義していない

**NG例**:

```typescript
// ❌ 親の再レンダリングごとにButtonが再生成
function ParentComponent() {
  const Button = () => <Pressable><Text>Click</Text></Pressable>;
  return <Button />;
}
```

**OK例**:

```typescript
// ✅ ファイルスコープで定義
const Button = () => <Pressable><Text>Click</Text></Pressable>;

function ParentComponent() {
  return <Button />;
}
```

---

### 2.2 配列インデックスをkey使用 🟡

**問題**: リストの順序変更時に不要な再レンダリング

**チェック項目**:

- [ ] `map()`内で`key={index}`を使用していない
- [ ] ユニークなIDをkeyに使用

**NG例**:

```typescript
// ❌ インデックスをkey使用
{items.map((item, index) => (
  <View key={index}>
    <Text>{item.name}</Text>
  </View>
))}
```

**OK例**:

```typescript
// ✅ ユニークIDをkey使用
{items.map((item) => (
  <View key={item.id}>
    <Text>{item.name}</Text>
  </View>
))}
```

---

### 2.3 レンダー内の重い計算処理 🟡

**問題**: フレームレート低下（React Native特有）

**チェック項目**:

- [ ] render内で`.filter()`, `.map()`, `.sort()`を使用していない
- [ ] `useMemo()`で計算結果をメモ化

**NG例**:

```typescript
// ❌ レンダリングごとに計算
function CaseList({ cases }: Props) {
  const sortedCases = cases.sort((a, b) => b.date - a.date);
  return <FlatList data={sortedCases} />;
}
```

**OK例**:

```typescript
// ✅ useMemoでメモ化
function CaseList({ cases }: Props) {
  const sortedCases = useMemo(
    () => cases.sort((a, b) => b.date - a.date),
    [cases]
  );
  return <FlatList data={sortedCases} />;
}
```

---

### 2.4 State直接変更 🔴

**問題**: 予期しない動作・再レンダリング失敗

**チェック項目**:

- [ ] `state.push()`, `state.property = value`を使用していない
- [ ] `setState()`または`set関数`を使用

**NG例**:

```typescript
// ❌ 直接変更
const [items, setItems] = useState([]);
items.push(newItem); // NGパターン
```

**OK例**:

```typescript
// ✅ 新しい配列を生成
const [items, setItems] = useState([]);
setItems([...items, newItem]);

// ✅ 関数型更新
setItems((prev) => [...prev, newItem]);
```

---

### 2.5 useEffect依存配列の不備 🔴

**問題**: 無限ループ・メモリリーク

**チェック項目**:

- [ ] ESLint `react-hooks/exhaustive-deps` 警告が0件
- [ ] 依存配列に必要な変数がすべて含まれる
- [ ] 不要な依存を含めていない

**NG例**:

```typescript
// ❌ 依存配列にcaseIdが無い
useEffect(() => {
  loadCase(caseId);
}, []); // caseId変更時に再実行されない
```

**OK例**:

```typescript
// ✅ 必要な依存をすべて含む
useEffect(() => {
  loadCase(caseId);
}, [caseId]);
```

---

### 2.6 クリーンアップ関数の欠如 🔴

**問題**: メモリリーク・アンマウント後の更新エラー

**チェック項目**:

- [ ] イベントリスナー登録時にクリーンアップ関数を実装
- [ ] タイマー使用時にクリーンアップ関数を実装
- [ ] 非同期処理にキャンセル機構を実装

**NG例**:

```typescript
// ❌ クリーンアップ無し
useEffect(() => {
  const subscription = eventEmitter.addListener('update', handleUpdate);
  // クリーンアップ関数が無い
}, []);
```

**OK例**:

```typescript
// ✅ クリーンアップ関数を実装
useEffect(() => {
  const subscription = eventEmitter.addListener('update', handleUpdate);

  return () => {
    subscription.remove();
  };
}, []);
```

---

### 2.7 大きくネストが深いコンポーネント 🟡

**問題**: 保守性低下・テスト困難

**チェック項目**:

- [ ] 1コンポーネントが300行以下
- [ ] ネスト深度が4階層以下
- [ ] 単一責任原則を守る

**NG例**:

```typescript
// ❌ 500行の巨大コンポーネント
function HomeScreen() {
  // 音声録音ロジック（100行）
  // AI要約ロジック（100行）
  // 案件管理ロジック（100行）
  // UI（200行）
}
```

**OK例**:

```typescript
// ✅ 責任を分割
function HomeScreen() {
  return (
    <View>
      <VoiceRecorder onComplete={handleRecording} />
      <AISummary text={transcription} />
      <CaseManager caseId={caseId} />
    </View>
  );
}
```

---

## 3. TypeScript型安全性チェック

### 3.1 `any`型の使用検出 🔴

**問題**: 型安全性の喪失

**チェック項目**:

- [ ] ESLint `@typescript-eslint/no-explicit-any` 警告が0件
- [ ] `unknown`または具体的な型を使用

**検出方法**:

```bash
npm run lint
grep -r ": any" src/
```

**NG例**:

```typescript
// ❌ any型
function processData(data: any) {
  return data.value;
}
```

**OK例**:

```typescript
// ✅ 具体的な型定義
interface Data {
  value: string;
}

function processData(data: Data) {
  return data.value;
}

// ✅ unknown型（型ガード使用）
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as Data).value;
  }
}
```

---

### 3.2 戻り値型の明示確認 🟡

**問題**: 推論ミス・意図しない型変更

**チェック項目**:

- [ ] 公開関数・メソッドの戻り値型を明示
- [ ] `Promise<T>` の型パラメータを明示

**NG例**:

```typescript
// ❌ 戻り値型が不明
async function loadCase(id: string) {
  const result = await db.get(id);
  return result; // 型推論に依存
}
```

**OK例**:

```typescript
// ✅ 戻り値型を明示
async function loadCase(id: string): Promise<Case | null> {
  const result = await db.get(id);
  return result;
}
```

---

### 3.3 strict mode コンプライアンス 🔴

**問題**: ランタイムエラー

**チェック項目**:

- [ ] `tsconfig.json` で `"strict": true`
- [ ] `tsc --noEmit` でエラー0件

**検出方法**:

```bash
npm run type-check
```

**必須設定**:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

---

### 3.4 null/undefined 安全性 🔴

**問題**: `Cannot read property of null` エラー

**チェック項目**:

- [ ] オプショナルチェーン `?.` を使用
- [ ] Null合体演算子 `??` を使用
- [ ] 型ガードで絞り込み

**NG例**:

```typescript
// ❌ null チェック無し
function displayCaseName(caseData: Case | null) {
  return caseData.name; // nullの場合エラー
}
```

**OK例**:

```typescript
// ✅ オプショナルチェーン
function displayCaseName(caseData: Case | null) {
  return caseData?.name ?? '未設定';
}

// ✅ 型ガード
function displayCaseName(caseData: Case | null) {
  if (!caseData) {
    return '未設定';
  }
  return caseData.name;
}
```

---

## 4. パフォーマンス問題検出

### 4.1 不要な再レンダリング 🟡

**問題**: UI遅延・バッテリー消費

**チェック項目**:

- [ ] `React.memo()` で純粋コンポーネントをメモ化
- [ ] `useCallback()` でコールバック関数をメモ化
- [ ] 状態管理を適切に分離

**NG例**:

```typescript
// ❌ 親の再レンダリングで子も再レンダリング
function CaseItem({ item }: Props) {
  return <Text>{item.name}</Text>;
}

function CaseList({ cases }: Props) {
  return cases.map(c => <CaseItem item={c} key={c.id} />);
}
```

**OK例**:

```typescript
// ✅ React.memoでメモ化
const CaseItem = React.memo(({ item }: Props) => {
  return <Text>{item.name}</Text>;
});

function CaseList({ cases }: Props) {
  return cases.map(c => <CaseItem item={c} key={c.id} />);
}
```

---

### 4.2 メモ化の欠如 🟡

**チェック項目**:

- [ ] 高コストな計算に `useMemo()` を使用
- [ ] イベントハンドラに `useCallback()` を使用

**NG例**:

```typescript
// ❌ レンダリングごとに関数再生成
function HomeScreen() {
  const handlePress = () => {
    console.log('Pressed');
  };

  return <Button onPress={handlePress} />;
}
```

**OK例**:

```typescript
// ✅ useCallbackでメモ化
function HomeScreen() {
  const handlePress = useCallback(() => {
    console.log('Pressed');
  }, []);

  return <Button onPress={handlePress} />;
}
```

---

### 4.3 画像最適化 🟡

**チェック項目**:

- [ ] 画像サイズが適切（モバイル: 1-2MB以下）
- [ ] `resizeMode` を適切に設定
- [ ] Blurhash等でプレースホルダー表示

**OK例**:

```typescript
// ✅ Blurhash + 最適化
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
/>
```

---

### 4.4 バンドルサイズ 🟡

**チェック項目**:

- [ ] 未使用のインポートが無い
- [ ] 動的インポートで遅延ロード
- [ ] Tree-shakingが有効

**検出方法**:

```bash
npx expo-bundle-analyzer
```

**OK例**:

```typescript
// ✅ 動的インポート
const CameraScreen = lazy(() => import('./screens/CameraScreen'));

function AppNavigator() {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <CameraScreen />
    </Suspense>
  );
}
```

---

## 5. Expo/React Native Web互換性

### 5.1 Platform.select適切使用 🔵

**チェック項目**:

- [ ] プラットフォーム別UIをPlatform.selectで実装
- [ ] Web版でサポートされないAPIを分岐

**OK例**:

```typescript
// ✅ プラットフォーム別スタイル
const styles = StyleSheet.create({
  shadow: {
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
      },
    }),
  },
});
```

---

### 5.2 Web版での非互換コンポーネント 🟡

**問題**: HTML仕様違反・アクセシビリティ問題

**チェック項目**:

- [ ] `FAB.Group` をWeb版で非表示
- [ ] ボタンネストが無い
- [ ] Web標準に準拠

**OK例**:

```typescript
// ✅ Web版では非表示
{Platform.OS !== 'web' && (
  <FAB.Group
    open={open}
    icon={open ? 'close' : 'plus'}
    actions={actions}
  />
)}
```

**参照**: [Web互換性分析](WEB_COMPATIBILITY_ANALYSIS.md)

---

### 5.3 スタイリングの分岐 🔵

**チェック項目**:

- [ ] Web版で`shadow*`プロパティを使用していない
- [ ] `boxShadow`を使用

**NG例**:

```typescript
// ❌ Web版で動作しない
const styles = StyleSheet.create({
  box: {
    shadowColor: '#000',
    shadowRadius: 4,
  },
});
```

**OK例**:

```typescript
// ✅ Platform.selectで分岐
const styles = StyleSheet.create({
  box: Platform.select({
    web: { boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
    default: {
      shadowColor: '#000',
      shadowRadius: 4,
    },
  }),
});
```

---

## 6. テスト & 検証

### 6.1 ユニットテスト存在確認 🟡

**チェック項目**:

- [ ] 新規関数・フックにテストファイルが存在
- [ ] カバレッジ80%以上（目標）

**検出方法**:

```bash
npm run test:coverage
```

**必須テスト対象**:

- ビジネスロジック（services/）
- カスタムフック（hooks/）
- ユーティリティ関数（utils/）

---

### 6.2 スモークテスト通過 🔴

**チェック項目**:

- [ ] `npm run test:smoke` が1分以内に完了
- [ ] 全テストがパス

**検出方法**:

```bash
npm run test:smoke
```

---

### 6.3 E2Eテストカバレッジ 🟡

**チェック項目**:

- [ ] クリティカルパスにE2Eテストが存在
- [ ] 主要機能の動作確認

**必須E2Eテスト**:

- アプリ起動
- 画面遷移
- データ保存・読み込み

---

### 6.4 静的解析エラー0 🔴

**チェック項目**:

- [ ] ESLint: 0エラー、0警告
- [ ] Prettier: 100%準拠
- [ ] TypeScript: 0エラー

**検出方法**:

```bash
npm run guardrails
```

---

## 7. コード品質 & 保守性

### 7.1 関数の複雑度 🟡

**問題**: 理解困難・バグ混入

**チェック項目**:

- [ ] 循環的複雑度が10以下（目標）
- [ ] 1関数が50行以下

**検出方法**:

```bash
# ESLintプラグイン: complexity
npx eslint --rule 'complexity: ["error", 10]' src/
```

**NG例**:

```typescript
// ❌ 複雑度が高い（if文が多すぎる）
function processCase(caseData: Case) {
  if (caseData.type === 'A') {
    if (caseData.status === 'active') {
      // 処理A
    } else if (caseData.status === 'pending') {
      // 処理B
    }
  } else if (caseData.type === 'B') {
    // ...（続く）
  }
}
```

**OK例**:

```typescript
// ✅ 戦略パターンで簡素化
const processors = {
  A: processTypeA,
  B: processTypeB,
};

function processCase(caseData: Case) {
  const processor = processors[caseData.type];
  return processor(caseData);
}
```

---

### 7.2 コンポーネントサイズ 🟡

**チェック項目**:

- [ ] 1コンポーネントが300行以下
- [ ] 関心の分離ができている

---

### 7.3 Props Drilling深度 🟡

**問題**: 保守性低下

**チェック項目**:

- [ ] Propsを3階層以上渡していない
- [ ] Context APIまたは状態管理ライブラリを使用

**NG例**:

```typescript
// ❌ 4階層のProps Drilling
<GrandParent theme={theme}>
  <Parent theme={theme}>
    <Child theme={theme}>
      <GrandChild theme={theme} />
    </Child>
  </Parent>
</GrandParent>
```

**OK例**:

```typescript
// ✅ Context API使用
const ThemeContext = createContext(defaultTheme);

function GrandParent() {
  return (
    <ThemeContext.Provider value={theme}>
      <Parent>
        <Child>
          <GrandChild />
        </Child>
      </Parent>
    </ThemeContext.Provider>
  );
}

function GrandChild() {
  const theme = useContext(ThemeContext);
  return <View style={{ backgroundColor: theme.bg }} />;
}
```

---

### 7.4 ドキュメンテーション 🔵

**チェック項目**:

- [ ] 公開APIにJSDocコメント
- [ ] 複雑なロジックに説明コメント
- [ ] READMEが最新

**OK例**:

```typescript
/**
 * 案件データをデータベースから取得します
 *
 * @param caseId - 案件ID（UUID形式）
 * @returns 案件データ、見つからない場合はnull
 * @throws {DatabaseError} データベース接続エラー時
 */
async function loadCase(caseId: string): Promise<Case | null> {
  // 実装
}
```

---

## 8. 本番環境対応

### 8.1 エラーハンドリング 🔴

**問題**: アプリクラッシュ・ユーザー体験悪化

**チェック項目**:

- [ ] 非同期処理にtry-catchを実装
- [ ] ネットワークエラーを想定
- [ ] ErrorBoundaryを実装

**NG例**:

```typescript
// ❌ エラーハンドリング無し
async function summarize(text: string) {
  const result = await geminiService.summarize(text);
  return result;
}
```

**OK例**:

```typescript
// ✅ エラーハンドリング実装
async function summarize(text: string): Promise<SummaryResult> {
  try {
    const result = await geminiService.summarize(text);
    return { success: true, data: result };
  } catch (error) {
    console.error('要約エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '不明なエラー',
    };
  }
}
```

---

### 8.2 ログ出力適切性 🟡

**チェック項目**:

- [ ] 本番環境で`console.log()`を削除
- [ ] 構造化ログを使用
- [ ] 機密情報をログに含めない

**NG例**:

```typescript
// ❌ 本番環境でのconsole.log
console.log('API Key:', apiKey); // セキュリティリスク
console.log(userData); // 個人情報漏洩リスク
```

**OK例**:

```typescript
// ✅ 開発環境のみログ出力
if (__DEV__) {
  console.log('Debug info:', sanitizedData);
}

// ✅ 構造化ログサービス使用
logger.info('User action', {
  action: 'case_created',
  caseId: case.id,
  // 機密情報を除外
});
```

---

### 8.3 オフライン対応 🟡

**チェック項目**:

- [ ] ネットワーク状態を監視
- [ ] オフライン時のUIフィードバック
- [ ] ローカルキャッシュを活用

**OK例**:

```typescript
// ✅ ネットワーク監視
import NetInfo from '@react-native-community/netinfo';

function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  return isConnected;
}
```

---

### 8.4 データ永続化 🔴

**チェック項目**:

- [ ] 重要データをSQLiteに保存
- [ ] AsyncStorageは一時データのみ
- [ ] バックアップ機構を実装

**NG例**:

```typescript
// ❌ 重要データをAsyncStorageに保存
await AsyncStorage.setItem('cases', JSON.stringify(allCases));
```

**OK例**:

```typescript
// ✅ SQLiteに永続化
await db.runAsync(
  'INSERT INTO cases (id, name, data) VALUES (?, ?, ?)',
  [case.id, case.name, JSON.stringify(case.data)]
);
```

---

## 9. 自動検証コマンド

### 9.1 Guardrails（ガードレール）

プロジェクトの品質基準を自動チェック:

```bash
# 基本チェック（2分以内）
npm run guardrails

# 完全チェック（5分程度）
npm run guardrails:full
```

**チェック内容**:

- TypeScript型チェック（`tsc --noEmit`）
- ESLint（`max-warnings: 0`）
- Prettier（100%準拠）
- スモークテスト

---

### 9.2 個別チェック

```bash
# 型チェック
npm run type-check

# Lint
npm run lint
npm run lint:fix

# フォーマット
npm run format
npm run format:check

# テスト
npm run test:smoke        # 1分以内
npm run test:comprehensive # 5分程度
npm run test:coverage     # カバレッジ付き
```

---

## 10. チェックリスト活用フロー

### コミット前

```bash
# 1. ガードレール実行
npm run guardrails

# 2. このチェックリストの該当セクションを確認
# - セキュリティ & 依存関係
# - TypeScript型安全性
# - テスト & 検証

# 3. コミット
git add .
git commit -m "feat: 新機能追加"
```

---

### Pull Request作成前

```bash
# 1. 完全チェック
npm run guardrails:full

# 2. このチェックリスト全体を確認
# - 全8カテゴリー
# - 特に「本番環境対応」を重点チェック

# 3. PR作成
gh pr create --title "..." --body "..."
```

---

### 本番リリース前

```bash
# 1. 脆弱性スキャン
npm audit --production

# 2. E2Eテスト
npm run test:comprehensive

# 3. このチェックリストの「🔴 Critical」項目をすべて確認

# 4. 本番ビルド
eas build --platform all
```

---

## 11. プロジェクト固有の注意点

### Dynamic Field Note特有の問題

#### 11.1 SQLite依存（Phase 3以降）

**チェック項目**:

- [ ] DatabaseService初期化を確認
- [ ] マイグレーションスクリプトが存在
- [ ] トランザクション管理が適切

#### 11.2 Gemini API制限

**チェック項目**:

- [ ] レート制限対策（リトライロジック）
- [ ] タイムアウト設定（30秒）
- [ ] エラーハンドリング

**OK例**:

```typescript
// ✅ タイムアウト + リトライ
async function summarizeWithRetry(text: string, maxRetries = 3): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const result = await geminiService.summarize(text, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### 11.3 Expo Camera統合（Phase 3予定）

**チェック項目**:

- [ ] パーミッション要求フロー実装
- [ ] カメラ非対応デバイスへの対応
- [ ] 写真サイズ制限（5MB以下推奨）

---

## 12. 参考リンク

### 研究データ

- [AI生成コードの脆弱性（40%）](https://www.slashgear.com/1970560/ai-coding-problems-security-risks/)
- [幻覚パッケージ（30%）](https://www.ivanturkovic.com/2025/03/30/best-practices-ai-assisted-coding/)
- [React Anti-patterns](https://dev.to/shameel/the-terrible-react-anti-pattern-you-must-avoid-4el8)

### プロジェクトドキュメント

- [CLAUDE.md](../CLAUDE.md) - プロジェクト概要
- [セキュリティ監視](security-monitoring.md)
- [静的解析レポート](static-analysis-report.md)
- [Web互換性分析](WEB_COMPATIBILITY_ANALYSIS.md)

---

## 13. 更新履歴

| 日付       | バージョン | 変更内容                |
| ---------- | ---------- | ----------------------- |
| 2025-10-22 | 1.0.0      | 初版作成（Web調査基準） |

---

**このチェックリストを活用して、高品質なコードを維持しましょう！**
