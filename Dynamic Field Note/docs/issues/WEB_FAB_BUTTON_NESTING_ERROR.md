# Issue: Web版FABボタンネストエラーが解消されない

**作成日**: 2025-10-18
**優先度**: HIGH
**ステータス**: INVESTIGATING

---

## 📋 概要

Web版でReact Native PaperのFAB.Groupコンポーネントが以下のエラーを発生させる：

```
In HTML, <button> cannot be a descendant of <button>.
SummaryButtons.tsx:46 <button> cannot contain a nested <button>.
```

`Platform.OS === 'web'`チェックによる非表示化を実装したが、ブラウザのハードリフレッシュ後もエラーが継続。

---

## 🔍 症状

### ブラウザコンソールエラー

```javascript
react-dom-client.development.js:2613 In HTML, <button> cannot be a descendant of <button>.
This will cause a hydration error.

  <FAB.Group open={false} visible={false} icon="file-docum..." actions={[...]} ...>
    <View pointerEvents="box-none" style={[...]}>
      <Pressable>
        <View pointerEvents="box-none" style={{...}}>
          <View pointerEvents="none" style={{display:"flex"}}>
            <View style={[...]} pointerEvents="none" accessibilityRole="button" ...>
              <button>  <!-- 親ボタン -->
                <View>
                  <Pressable onPress={...}>
                    <button>  <!-- 子ボタン - HTML仕様違反 -->
                    ...
```

### 重要な観察

- **visible={false}でもエラー発生**: FAB.Groupがvisible falseでもDOM要素を生成している
- **ハードリフレッシュ無効**: `Ctrl + Shift + R`でもエラー継続
- **キャッシュクリア無効**: 開発者ツールの"Disable cache"でもエラー継続
- **サーバー再起動必要**: Metro Bundlerの完全再起動とキャッシュクリアが必要

---

## 🛠️ 実装済みの対策

### 1. Platform.OSチェック (SummaryButtons.tsx:63-65)

```typescript
/**
 * Web版ではFABを非表示
 *
 * 理由:
 * - FAB.Groupは内部的にボタンをネストする構造
 * - HTMLでは<button>内に<button>を配置できない（仕様違反）
 * - Web版ではホーム画面の通常ボタンレイアウトを使用
 */
if (Platform.OS === 'web') {
  return null;
}
```

**問題点**: このチェックは正しく実装されているが、Metro Bundlerが古いバンドルをキャッシュしている可能性がある。

### 2. HomeScreen.tsxの通常ボタンレイアウト

Web版では以下の3ボタンレイアウトを使用：

```typescript
<Button mode="contained" onPress={handleQuickSummary}>
  中間まとめ
</Button>
<Button mode="contained-tonal" onPress={() => navigation.navigate('Camera')}>
  写真
</Button>
<Button mode="outlined" onPress={handleClear}>
  クリア
</Button>
```

---

## 🔬 真因分析

### 仮説1: Metro Bundlerキャッシュ問題

**可能性**: HIGH

**根拠**:

- コード上は`Platform.OS === 'web'`で正しく非表示化されている
- ブラウザキャッシュクリアでは解決しない
- サーバー側のバンドルキャッシュが問題の可能性

**対策**:

```bash
# 実施済み
lsof -ti:8081 | xargs kill -9
npx expo start --web --clear --reset-cache
```

### 仮説2: React Native Paper FAB.Group内部実装の問題

**可能性**: MEDIUM

**根拠**:

- コンソールエラーに`visible={false}`と表示されている
- `visible={false}`でもDOMに要素が残っている
- React Native PaperのバージョンによってはWeb対応が不完全

**検証方法**:

```bash
npm list react-native-paper
# react-native-paper@5.14.5
```

### 仮説3: ホットリロードの不完全性

**可能性**: MEDIUM

**根拠**:

- Metro Bundlerのホットリロードが`Platform.OS`チェックを反映しない
- 条件分岐の変更は完全なバンドル再構築が必要

**対策**: 完全なサーバー再起動とキャッシュクリア（実施済み）

---

## 📊 検証結果

### 実施済み対策

| 対策                       | 実施日時         | 結果        |
| -------------------------- | ---------------- | ----------- |
| ブラウザハードリフレッシュ | 2025-10-18 09:30 | ❌ 効果なし |
| 開発者ツールDisable cache  | 2025-10-18 09:32 | ❌ 効果なし |
| Metro Bundler再起動        | 2025-10-18 09:43 | ⏳ 検証待ち |
| --clear --reset-cache      | 2025-10-18 09:43 | ⏳ 検証待ち |

### 次のステップ

**即座に実施**:

1. **ブラウザで http://localhost:8081 にアクセス**
   - 新しいバンドルが読み込まれることを確認
   - コンソールエラーが解消されているか確認

2. **FABボタンの表示確認**:
   - Web版: FABボタンが**非表示**であること
   - 通常ボタン（要約実行・写真・クリア）のみ表示されること

3. **エラー継続の場合**:
   - React Native Paperのバージョンアップ検討
   - または完全にFAB.Groupを使用しない実装に変更

---

## 🔧 代替案

### オプション1: HomeScreen側でプラットフォームチェック（推奨）

```typescript
// HomeScreen.tsx
{Platform.OS !== 'web' && (
  <SummaryButtons
    isLoading={isLoading}
    isEmpty={!fullText || fullText.trim() === ''}
    onQuickSummary={handleQuickSummary}
    onFinalSummary={handleFinalSummary}
  />
)}
```

**メリット**:

- SummaryButtonsコンポーネント自体がインポートされない
- より明示的な制御
- バンドルサイズの削減（Web版でFABコードが含まれない）

### オプション2: 完全に別のWeb専用コンポーネント

```typescript
// src/components/SummaryButtons.web.tsx
export const SummaryButtons: React.FC<SummaryButtonsProps> = () => {
  return null; // Web版は常にnull
};

// src/components/SummaryButtons.native.tsx
export const SummaryButtons: React.FC<SummaryButtonsProps> = ({...}) => {
  return <Portal><FAB.Group ... /></Portal>;
};
```

**メリット**:

- プラットフォーム別ファイルでメトロバンドラーが自動選択
- `.web.tsx`と`.native.tsx`の拡張子で管理

### オプション3: React Native Paper のバージョンアップ

```bash
npm install react-native-paper@latest
```

**リスク**: 破壊的変更の可能性

---

## 📝 関連ドキュメント

- [Web互換性分析](../WEB_COMPATIBILITY_ANALYSIS.md)
- [CLAUDE.md - Web互換性セクション](../../CLAUDE.md#🌐-web互換性とベストプラクティス)
- [React Native Paper - FAB](https://callstack.github.io/react-native-paper/docs/components/FAB/)
- [React Native - Platform Specific Code](https://reactnative.dev/docs/platform-specific-code)

---

## ✅ アクションアイテム

- [ ] 新しいバンドルでブラウザアクセスし、エラー確認（**すぐに実施**）
- [ ] エラー継続の場合、オプション1（HomeScreen側チェック）を実装
- [ ] 解決後、issue closed & 報告書作成
- [ ] 本イシューをCLAUDE.mdの既知の問題セクションに追記

---

**最終更新**: 2025-10-18 09:45 (Metro Bundler完全再起動・キャッシュクリア完了)
