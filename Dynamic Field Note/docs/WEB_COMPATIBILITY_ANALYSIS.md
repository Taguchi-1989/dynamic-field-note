# Web互換性分析とベストプラクティス

**作成日**: 2025-10-18

## 問題の分析

### 1. FABボタンのネストエラー

**エラー内容**:

```
<button> cannot be a descendant of <button>
```

**原因**:

- React Native PaperのFAB.Groupは内部的に複数のボタン要素をネストしている
- HTMLでは`<button>`要素の中に別の`<button>`を配置することは仕様違反
- React Native (iOS/Android)では問題ないが、React Native Webでは無効なHTML構造となる

**調査結果**:

1. これは既知の問題 ([react-native-elements #3857](https://github.com/react-native-elements/react-native-elements/issues/3857))
2. Web版では根本的にFABのネスト構造が不適切
3. ネイティブアプリでは動作するが、Web版では避けるべき

### 2. その他の警告

#### a) shadow\* プロパティの非推奨化

- React Native Webでは`shadowColor`, `shadowOffset`等は非推奨
- Web版では`boxShadow`を使用すべき
- 現在の実装: `Platform.select`で分岐済み → **正しい**

#### b) pointerEvents の非推奨化

- `props.pointerEvents`は非推奨
- `style.pointerEvents`を使用すべき
- React Native Paperの内部実装の問題

#### c) useNativeDriver の警告

- Web版ではネイティブドライバーが存在しない
- JSベースのアニメーションにフォールバック
- パフォーマンスへの影響は限定的（開発時のみの警告）

## ベストプラクティスに基づく解決策

### 解決方針

**原則**:

1. **プラットフォーム別のUI実装** - Web版とネイティブ版で異なるUIパターンを採用
2. **無効なHTML構造の回避** - Web版では標準HTML仕様に準拠
3. **一貫したUX** - プラットフォームが違ってもユーザー体験は同等に保つ

### 実装戦略

#### オプション1: プラットフォーム別コンポーネント（推奨）

**Web版**:

- FABボタンを使用しない
- 通常のButtonコンポーネントのみ使用
- ホーム画面の3ボタンレイアウトで完結

**ネイティブ版**:

- FAB.Groupを使用（Material Designガイドライン準拠）
- 右下の浮動ボタンでアクセス性向上

**メリット**:

- 各プラットフォームのUIガイドラインに準拠
- Web版では無効なHTML構造を完全に回避
- メンテナンス性が高い（条件分岐が明確）

**デメリット**:

- プラットフォーム間でUIが異なる（ただし、これはベストプラクティス）

#### オプション2: FABを完全に廃止

**すべてのプラットフォーム**:

- 通常のButtonコンポーネントのみ使用
- 3ボタンレイアウトに統一

**メリット**:

- コード統一・シンプル化
- Web互換性の問題が完全に解消

**デメリット**:

- ネイティブアプリでMaterial Designガイドラインから逸脱
- FABの利便性（親指で届く位置）を失う

## 推奨実装

### 採用方針: オプション1（プラットフォーム別コンポーネント）

```typescript
// src/components/SummaryButtons.tsx

export const SummaryButtons: React.FC<SummaryButtonsProps> = ({
  isLoading,
  isEmpty,
  onQuickSummary,
  onFinalSummary,
}) => {
  // Web版では非表示（通常ボタンを使用）
  if (Platform.OS === 'web') {
    return null;
  }

  // ネイティブ版のみFAB.Groupを表示
  return (
    <Portal>
      <FAB.Group {...props} />
    </Portal>
  );
};
```

### 理由

1. **Web標準準拠**: 無効なHTML構造を完全に回避
2. **プラットフォーム最適化**: 各環境のベストプラクティスに従う
3. **メンテナンス性**: 条件分岐が明確で理解しやすい
4. **UX一貫性**: 機能は同じ（ボタンの配置が異なるだけ）

## 実装チェックリスト

- [x] Web版でFAB.Groupを非表示化
- [x] ホーム画面の3ボタンレイアウトで機能提供
  - [x] 要約実行ボタン
  - [x] 写真ボタン
  - [x] クリアボタン（確認ダイアログ付き）
- [ ] ネイティブ版でのFAB動作確認（今後）
- [ ] ドキュメント更新
- [ ] ユーザーガイド作成（プラットフォーム別）

## 参考リソース

### 公式ドキュメント

- [React Native Paper - FAB](https://callstack.github.io/react-native-paper/docs/components/FAB/)
- [React Native Web - Platform Specific Code](https://necolas.github.io/react-native-web/docs/platform/)

### 関連Issue

- [react-native-elements #3857](https://github.com/react-native-elements/react-native-elements/issues/3857) - FAB web nesting error
- [react-native-gesture-handler #2595](https://github.com/software-mansion/react-native-gesture-handler/issues/2595) - Nested button event bubbling

### ベストプラクティス記事

- [React Native in 2025: Advanced Patterns](https://medium.com/@theNewGenCoder/react-native-in-2025-advanced-patterns-best-practices-future-proof-development-93715540377e)
- [How to Prevent Nesting Button Error](https://javascript.plainenglish.io/prevent-validatedomnesting-button-descendant-error-21d9a34e5984)

## 結論

**採用するアプローチ**:

- Web版: FAB非表示 + 通常ボタンレイアウト
- ネイティブ版: FAB.Group使用

**理由**:

- Web標準に準拠（無効なHTML構造の回避）
- プラットフォーム別の最適化
- メンテナンス性の向上
- ユーザー体験の一貫性維持

このアプローチは、React Native開発における**プラットフォーム別UI実装のベストプラクティス**に沿っています。
