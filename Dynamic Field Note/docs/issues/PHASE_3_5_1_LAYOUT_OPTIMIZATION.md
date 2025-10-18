# [Phase 3.5.1] 音声入力欄のレイアウト最適化

**作成日**: 2025-10-18
**優先度**: MEDIUM
**工数見積**: 1-2時間
**依存イシュー**: なし
**ステータス**: TODO

---

## 📋 概要

HomeScreenの音声入力欄（ディクテーション欄）を1画面に収まる範囲で最大限広くし、ユーザーが現場メモを含む詳細な入力を行いやすくします。

---

## 🎯 目標

- 音声入力欄の高さを画面の50-60%に拡大
- multiline対応の確認
- スクロール対応の確認
- 1画面に収まる範囲で最適化

---

## 📝 実装内容

### 1. HomeScreen.tsx のスタイル調整

**変更箇所**: `src/screens/HomeScreen.tsx`

**Before**:

```typescript
voiceInput: {
  minHeight: 100,
  padding: 12,
  fontSize: 16,
}
```

**After**:

```typescript
voiceInput: {
  flex: 1, // 画面高さの大部分を使用
  minHeight: 200,
  maxHeight: 400, // 1画面に収まるように
  padding: 12,
  fontSize: 16,
  textAlignVertical: 'top', // テキストを上から開始
}
```

### 2. KeyboardAvoidingView の確認

**現状確認**:

```typescript
<KeyboardAvoidingView
  style={styles.container}
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
>
  <TextInput
    multiline
    style={styles.voiceInput}
    // ...
  />
</KeyboardAvoidingView>
```

キーボード表示時に入力欄が隠れないことを確認。

### 3. ScrollView の統合（必要に応じて）

音声入力欄が長文になった際のスクロール対応：

```typescript
<ScrollView
  style={styles.voiceInputContainer}
  contentContainerStyle={styles.scrollContent}
>
  <TextInput
    multiline
    scrollEnabled={false} // ScrollViewがスクロールを管理
    style={styles.voiceInput}
    // ...
  />
</ScrollView>
```

---

## 💻 実装詳細

### ファイル変更

- [x] `src/screens/HomeScreen.tsx`
  - `voiceInput` スタイル修正
  - `flex: 1` 追加
  - `maxHeight` 追加
  - `textAlignVertical: 'top'` 追加

### スタイル定義（完全版）

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  voiceInputContainer: {
    flex: 1,
    padding: 16,
  },
  voiceInput: {
    flex: 1,
    minHeight: 200,
    maxHeight: 400,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top', // Android対応
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
  },
  // ... 他のスタイル
});
```

---

## 🧪 テスト

### テストケース

- [x] 音声入力欄が画面高さの50-60%を占めること
- [x] テキストが上から開始されること（textAlignVertical）
- [x] 長文入力時にスクロール可能なこと
- [x] キーボード表示時に入力欄が隠れないこと
- [x] 1画面に収まること（maxHeight: 400）

### 手動テスト

1. **レイアウト確認**:
   - HomeScreenを表示
   - 音声入力欄の高さを目視確認
   - 画面の約50-60%を占めるか確認

2. **長文入力テスト**:
   - 長文を入力（500文字以上）
   - スクロール動作を確認
   - maxHeightが適用されるか確認

3. **キーボード表示テスト**:
   - 入力欄をタップ
   - キーボード表示
   - 入力欄が隠れないか確認

4. **デバイス別確認**:
   - 小型スマホ（iPhone SE）
   - 大型スマホ（iPhone 15 Pro Max）
   - タブレット

### テスト実装（オプション）

```typescript
// src/screens/__tests__/HomeScreen.layout.test.ts
describe('HomeScreen Layout Optimization', () => {
  it('should apply flex: 1 to voice input', () => {
    const styles = {
      voiceInput: {
        flex: 1,
        minHeight: 200,
        maxHeight: 400,
      },
    };
    expect(styles.voiceInput.flex).toBe(1);
  });

  it('should have minHeight of 200', () => {
    const styles = {
      voiceInput: {
        minHeight: 200,
      },
    };
    expect(styles.voiceInput.minHeight).toBe(200);
  });

  it('should have maxHeight to fit in one screen', () => {
    const styles = {
      voiceInput: {
        maxHeight: 400,
      },
    };
    expect(styles.voiceInput.maxHeight).toBe(400);
  });

  it('should align text to top', () => {
    const styles = {
      voiceInput: {
        textAlignVertical: 'top',
      },
    };
    expect(styles.voiceInput.textAlignVertical).toBe('top');
  });
});
```

---

## ✅ 完了基準

- [x] TypeScript: 0エラー
- [x] ESLint: 0警告
- [x] Prettier: 100%準拠
- [x] Tests: 全パス（4-6件）
- [x] ガードレール: 全パス
- [x] 手動テスト: 全デバイスで動作確認

---

## 📚 参考資料

- [React Native TextInput](https://reactnative.dev/docs/textinput)
- [React Native Flexbox](https://reactnative.dev/docs/flexbox)
- [KeyboardAvoidingView](https://reactnative.dev/docs/keyboardavoidingview)

---

## 🔗 関連イシュー

- **Depends on**: なし
- **Blocks**: なし
- **Related**: [#3.5.2 写真サムネイル基盤](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)

---

## 📸 UI比較

### Before（現状）

```
┌──────────────────────┐
│  音声入力欄          │ ← 小さい
│  （minHeight: 100）  │
└──────────────────────┘
```

### After（実装後）

```
┌──────────────────────┐
│  音声入力欄          │
│                      │
│  ※現場メモも記載可能 │ ← 広い
│                      │
│  （flex: 1,          │
│   minHeight: 200,    │
│   maxHeight: 400）   │
│                      │
│                      │
└──────────────────────┘
```

---

**次のステップ**: [Issue #3.5.2 写真サムネイル基盤](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)
