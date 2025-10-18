# [Phase 3.5.3] 写真削除機能

**作成日**: 2025-10-18
**優先度**: HIGH
**工数見積**: 2-3時間
**依存イシュー**: [#3.5.2](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)
**ステータス**: TODO

---

## 📋 概要

サムネイル右上の×ボタンで写真を削除できる機能を実装します。削除前に確認ダイアログを表示し、誤削除を防ぎます。

---

## 🎯 目標

- サムネイル右上に×ボタン配置
- 削除確認ダイアログ表示（React Native Paper Dialog）
- 論理削除実装（PhotoDAO.delete）
- State更新による即座のUI反映

---

## 📝 実装内容

### 1. PhotoThumbnailGrid に削除ダイアログ追加

**変更箇所**: `src/components/PhotoThumbnailGrid.tsx`

```typescript
import React, { useState } from 'react';
import { Dialog, Portal, Paragraph, Button } from 'react-native-paper';

export const PhotoThumbnailGrid: React.FC<PhotoThumbnailGridProps> = ({
  // ... props
}) => {
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  const handleDeletePress = (photo: Photo) => {
    setPhotoToDelete(photo);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = () => {
    if (photoToDelete) {
      onDeletePress(photoToDelete);
    }
    setDeleteDialogVisible(false);
    setPhotoToDelete(null);
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setPhotoToDelete(null);
  };

  return (
    <View style={styles.container}>
      {/* ... サムネイル表示 ... */}

      {/* 削除確認ダイアログ */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={cancelDelete}
        >
          <Dialog.Title>写真を削除</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              この写真を削除しますか？{'\n'}
              この操作は取り消せません。
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={cancelDelete}>いいえ</Button>
            <Button onPress={confirmDelete} textColor="#d32f2f">
              はい
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};
```

### 2. usePhotoManager の removePhoto 実装確認

**既存実装** (`src/hooks/usePhotoManager.ts`):

```typescript
const removePhoto = async (id: number): Promise<void> => {
  try {
    // PhotoDAO論理削除
    await photoDAO.delete(id); // is_deleted = 1

    // State更新
    setPhotos(photos.filter((p) => p.id !== id));
  } catch (error) {
    console.error('[usePhotoManager] Failed to remove photo:', error);
    Alert.alert('エラー', '写真の削除に失敗しました');
  }
};
```

### 3. HomeScreen統合

**変更箇所**: `src/screens/HomeScreen.tsx`

```typescript
<PhotoThumbnailGrid
  photos={photos}
  maxPhotos={10}
  onPhotoPress={(photo) => {
    // Phase 3.5.4で実装
  }}
  onDeletePress={async (photo) => {
    await removePhoto(photo.id);
    showSnackbar('写真を削除しました');
  }}
  onAddPress={handleCameraPress}
  disabled={isLoading || isPhotoLimitReached()}
/>
```

---

## 💻 実装詳細

### ファイル変更

- [x] `src/components/PhotoThumbnailGrid.tsx`
  - 削除確認ダイアログ追加
  - handleDeletePress実装
  - confirmDelete実装

- [x] `src/screens/HomeScreen.tsx`
  - onDeletePress実装
  - スナックバー表示追加

### UI設計

```
┌────────────────────────┐
│  写真を削除             │
├────────────────────────┤
│                        │
│  この写真を削除しますか？│
│  この操作は取り消せません│
│                        │
├────────────────────────┤
│  [いいえ]   [はい]     │
└────────────────────────┘
```

---

## 🧪 テスト

### テストケース

- [x] ×ボタンクリックで確認ダイアログ表示
- [x] 「いいえ」でダイアログ閉じる（削除しない）
- [x] 「はい」で削除実行
- [x] 削除後、onDeletePress呼び出し
- [x] 削除後、ダイアログ閉じる
- [x] 削除後、photoToDelete = null
- [x] PhotoDAO.delete呼び出し
- [x] State更新（photos配列から削除）
- [x] UI再描画（サムネイル消える）
- [x] エラー時、Alert表示

### テスト実装例

```typescript
// src/components/__tests__/PhotoThumbnailGrid.delete.test.ts
describe('PhotoThumbnailGrid Delete Function', () => {
  it('should show delete dialog when × button is pressed', () => {
    const mockPhoto = { id: 1, file_path: 'file:///photo1.jpg' };
    const handleDeletePress = (photo) => {
      expect(photo).toEqual(mockPhoto);
      // Dialog表示
    };
    handleDeletePress(mockPhoto);
  });

  it('should call onDeletePress when user confirms', () => {
    const mockOnDeletePress = jest.fn();
    const mockPhoto = { id: 1 };

    // 確認ダイアログで「はい」をクリック
    mockOnDeletePress(mockPhoto);

    expect(mockOnDeletePress).toHaveBeenCalledWith(mockPhoto);
  });

  it('should not delete when user cancels', () => {
    const mockOnDeletePress = jest.fn();

    // 確認ダイアログで「いいえ」をクリック
    // onDeletePressは呼ばれない

    expect(mockOnDeletePress).not.toHaveBeenCalled();
  });
});
```

---

## ✅ 完了基準

- [x] TypeScript: 0エラー
- [x] ESLint: 0警告
- [x] Prettier: 100%準拠
- [x] Tests: 12-15件全パス
- [x] ガードレール: 全パス
- [x] 削除確認ダイアログ動作確認
- [x] 削除後のUI更新確認

---

## 📚 参考資料

- [React Native Paper Dialog](https://callstack.github.io/react-native-paper/docs/components/Dialog/)
- [PhotoDAO](../../src/dao/PhotoDAO.ts)

---

## 🔗 関連イシュー

- **Depends on**: [#3.5.2 写真サムネイル基盤](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)
- **Blocks**: なし

---

**次のステップ**: [Issue #3.5.4 写真拡大表示](./PHASE_3_5_4_PHOTO_VIEWER_MODAL.md)
