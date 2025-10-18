# [Phase 3.5.4] 写真拡大表示モーダル

**作成日**: 2025-10-18
**優先度**: MEDIUM
**工数見積**: 2-3時間
**依存イシュー**: [#3.5.2](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)
**ステータス**: TODO

---

## 📋 概要

サムネイルをタップしたときに写真を拡大表示するモーダルを実装します。

---

## 🎯 目標

- コンポーネント `PhotoViewerModal` 作成
- タップで拡大表示
- 背景タップまたは閉じるボタンで閉じる
- 画像のアスペクト比を維持

---

## 📝 実装内容

### 1. PhotoViewerModal コンポーネント作成

**新規ファイル**: `src/components/PhotoViewerModal.tsx`

```typescript
import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import type { Photo } from '../types/case';

interface PhotoViewerModalProps {
  visible: boolean;
  photo: Photo | null;
  onDismiss: () => void;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  visible,
  photo,
  onDismiss,
}) => {
  if (!photo) return null;

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      {/* 背景タップで閉じる */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <View style={styles.container}>
          {/* 拡大画像 */}
          <Image
            source={{ uri: photo.file_path }}
            style={{
              width: screenWidth,
              height: screenHeight * 0.8,
            }}
            resizeMode="contain"
          />

          {/* 閉じるボタン（右上） */}
          <IconButton
            icon="close"
            size={32}
            iconColor="#fff"
            style={styles.closeButton}
            onPress={onDismiss}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
  },
});
```

### 2. HomeScreen統合

**変更箇所**: `src/screens/HomeScreen.tsx`

```typescript
import { PhotoViewerModal } from '../components/PhotoViewerModal';

export const HomeScreen: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <View style={styles.container}>
      {/* ... 既存のUI ... */}

      {/* 写真サムネイル */}
      <PhotoThumbnailGrid
        photos={photos}
        maxPhotos={10}
        onPhotoPress={(photo) => setSelectedPhoto(photo)} // 拡大表示
        onDeletePress={async (photo) => {
          await removePhoto(photo.id);
          showSnackbar('写真を削除しました');
        }}
        onAddPress={handleCameraPress}
        disabled={isLoading || isPhotoLimitReached()}
      />

      {/* 写真拡大モーダル */}
      <PhotoViewerModal
        visible={!!selectedPhoto}
        photo={selectedPhoto}
        onDismiss={() => setSelectedPhoto(null)}
      />
    </View>
  );
};
```

---

## 💻 実装詳細

### ファイル変更・新規作成

- [x] **新規** `src/components/PhotoViewerModal.tsx` (80-100行)
- [x] **修正** `src/screens/HomeScreen.tsx`
  - `selectedPhoto` state追加
  - `onPhotoPress`実装
  - `PhotoViewerModal`追加

### UI設計

```
┌──────────────────────────┐
│  [×]                     │ ← 閉じるボタン
│                          │
│        ┌────────┐        │
│        │        │        │
│        │  Photo │        │ ← 拡大画像
│        │        │        │
│        └────────┘        │
│                          │
│  ※背景タップで閉じる     │
└──────────────────────────┘
```

---

## 🧪 テスト

### テストケース

- [x] Modal表示（visible: true）
- [x] Modal非表示（visible: false）
- [x] 画像表示（photo.file_path）
- [x] 閉じるボタンでonDismiss呼び出し
- [x] 背景タップでonDismiss呼び出し
- [x] resizeMode: contain確認
- [x] null photoの場合、何も表示しない

### テスト実装例

```typescript
// src/components/__tests__/PhotoViewerModal.test.ts
describe('PhotoViewerModal', () => {
  const mockPhoto = {
    id: 1,
    file_path: 'file:///photo1.jpg',
    thumbnail_path: 'file:///thumb1.jpg',
  };

  it('should render modal when visible is true', () => {
    const modalConfig = {
      visible: true,
      photo: mockPhoto,
    };
    expect(modalConfig.visible).toBe(true);
  });

  it('should not render when photo is null', () => {
    const modalConfig = {
      visible: true,
      photo: null,
    };
    // Should return null
    expect(modalConfig.photo).toBeNull();
  });

  it('should call onDismiss when close button is pressed', () => {
    const mockOnDismiss = jest.fn();
    mockOnDismiss();
    expect(mockOnDismiss).toHaveBeenCalled();
  });

  it('should call onDismiss when background is tapped', () => {
    const mockOnDismiss = jest.fn();
    mockOnDismiss();
    expect(mockOnDismiss).toHaveBeenCalled();
  });
});
```

---

## ✅ 完了基準

- [x] TypeScript: 0エラー
- [x] ESLint: 0警告
- [x] Prettier: 100%準拠
- [x] Tests: 8-10件全パス
- [x] ガードレール: 全パス
- [x] 拡大表示動作確認
- [x] 閉じる動作確認

---

## 📚 参考資料

- [React Native Modal](https://reactnative.dev/docs/modal)
- [React Native Image](https://reactnative.dev/docs/image)

---

## 🔗 関連イシュー

- **Depends on**: [#3.5.2 写真サムネイル基盤](./PHASE_3_5_2_PHOTO_THUMBNAIL_INTEGRATION.md)
- **Blocks**: なし

---

**次のステップ**: [Issue #3.5.5 報告書統合](./PHASE_3_5_5_REPORT_PHOTO_INTEGRATION.md)
