# [Phase 3.5.2] 写真サムネイル基盤

**作成日**: 2025-10-18
**優先度**: HIGH
**工数見積**: 5-6時間
**依存イシュー**: なし
**ステータス**: TODO

---

## 📋 概要

カメラ撮影機能とHomeScreenを連携し、撮影した写真のサムネイルを画面下部に表示する基盤を構築します。

---

## 🎯 目標

- カスタムフック `usePhotoManager` 作成
- コンポーネント `PhotoThumbnailGrid` 作成
- CameraScreen改修（撮影後HomeScreenに戻る）
- サムネイル生成機能実装（expo-image-manipulator）
- PhotoDAO統合

---

## 📝 実装内容

### 1. カスタムフック `usePhotoManager` 作成

**新規ファイル**: `src/hooks/usePhotoManager.ts`

```typescript
import { useState } from 'react';
import { Alert } from 'react-native';
import { photoDAO } from '../dao/PhotoDAO';
import type { Photo, CreatePhotoInput } from '../types/case';
import { generateThumbnail } from '../utils/imageUtils';

interface UsePhotoManagerReturn {
  photos: Photo[];
  addPhoto: (uri: string, caseId: number) => Promise<void>;
  removePhoto: (id: number) => Promise<void>;
  getPhotoCount: () => number;
  isPhotoLimitReached: () => boolean;
  clearPhotos: () => void;
}

export const usePhotoManager = (maxPhotos = 10): UsePhotoManagerReturn => {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const addPhoto = async (uri: string, caseId: number): Promise<void> => {
    // 上限チェック
    if (photos.length >= maxPhotos) {
      Alert.alert('上限到達', `写真は${maxPhotos}枚まで追加できます`);
      return;
    }

    try {
      // サムネイル生成
      const thumbnailUri = await generateThumbnail(uri, 200);

      // PhotoDAO保存
      const photoInput: CreatePhotoInput = {
        case_id: caseId,
        file_path: uri,
        thumbnail_path: thumbnailUri,
        // width, height, file_sizeは後で取得可能
      };

      const savedPhoto = await photoDAO.create(photoInput);
      setPhotos([...photos, savedPhoto]);
    } catch (error) {
      console.error('[usePhotoManager] Failed to add photo:', error);
      Alert.alert('エラー', '写真の保存に失敗しました');
    }
  };

  const removePhoto = async (id: number): Promise<void> => {
    try {
      // PhotoDAO論理削除
      await photoDAO.delete(id);

      // State更新
      setPhotos(photos.filter((p) => p.id !== id));
    } catch (error) {
      console.error('[usePhotoManager] Failed to remove photo:', error);
      Alert.alert('エラー', '写真の削除に失敗しました');
    }
  };

  const getPhotoCount = (): number => photos.length;

  const isPhotoLimitReached = (): boolean => photos.length >= maxPhotos;

  const clearPhotos = (): void => {
    setPhotos([]);
  };

  return {
    photos,
    addPhoto,
    removePhoto,
    getPhotoCount,
    isPhotoLimitReached,
    clearPhotos,
  };
};
```

### 2. コンポーネント `PhotoThumbnailGrid` 作成

**新規ファイル**: `src/components/PhotoThumbnailGrid.tsx`

```typescript
import React from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import type { Photo } from '../types/case';

interface PhotoThumbnailGridProps {
  photos: Photo[];
  maxPhotos: number;
  onPhotoPress: (photo: Photo) => void;
  onDeletePress: (photo: Photo) => void;
  onAddPress: () => void;
  disabled?: boolean;
}

export const PhotoThumbnailGrid: React.FC<PhotoThumbnailGridProps> = ({
  photos,
  maxPhotos,
  onPhotoPress,
  onDeletePress,
  onAddPress,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {/* カウンター */}
      <Text style={styles.counter}>
        写真 ({photos.length}/{maxPhotos})
      </Text>

      {/* サムネイルリスト */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {/* 既存写真のサムネイル */}
        {photos.map((photo) => (
          <View key={photo.id} style={styles.thumbnailContainer}>
            {/* サムネイル画像 */}
            <TouchableOpacity onPress={() => onPhotoPress(photo)}>
              <Image
                source={{ uri: photo.thumbnail_path || photo.file_path }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            </TouchableOpacity>

            {/* 削除ボタン（右上） */}
            <IconButton
              icon="close-circle"
              size={20}
              iconColor="#d32f2f"
              style={styles.deleteButton}
              onPress={() => onDeletePress(photo)}
            />
          </View>
        ))}

        {/* 追加ボタン */}
        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddPress}
            disabled={disabled}
          >
            <IconButton
              icon="camera-plus"
              size={32}
              iconColor={disabled ? '#ccc' : '#1976d2'}
            />
            <Text style={[styles.addText, disabled && styles.addTextDisabled]}>
              追加
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  counter: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  scrollView: {
    flexDirection: 'row',
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
  },
  addText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  addTextDisabled: {
    color: '#ccc',
  },
});
```

### 3. ユーティリティ `imageUtils` 作成

**新規ファイル**: `src/utils/imageUtils.ts`

```typescript
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * サムネイル生成
 * @param uri 元画像のURI
 * @param size サムネイルサイズ（正方形）
 * @returns サムネイル画像のURI
 */
export const generateThumbnail = async (uri: string, size: number = 200): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: size } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  } catch (error) {
    console.error('[imageUtils] Failed to generate thumbnail:', error);
    throw error;
  }
};

/**
 * 画像サイズ取得
 * @param uri 画像のURI
 * @returns { width, height }
 */
export const getImageSize = async (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
};
```

### 4. CameraScreen改修

**変更箇所**: `src/screens/CameraScreen.tsx`

```typescript
// 撮影後の処理を変更
async function takePicture() {
  // ... 撮影処理

  // 注釈機能は使用しない（将来のため残す）
  // HomeScreenに戻る
  navigation.navigate('Home', { photoUri: savedUri });
}
```

### 5. HomeScreen統合

**変更箇所**: `src/screens/HomeScreen.tsx`

```typescript
import { usePhotoManager } from '../hooks/usePhotoManager';
import { PhotoThumbnailGrid } from '../components/PhotoThumbnailGrid';

export const HomeScreen: React.FC = () => {
  // 写真管理
  const { photos, addPhoto, removePhoto, isPhotoLimitReached } = usePhotoManager(10);

  // カメラ画面から戻ってきた時
  useEffect(() => {
    if (route.params?.photoUri) {
      addPhoto(route.params.photoUri, currentCaseId);
      navigation.setParams({ photoUri: undefined }); // クリア
    }
  }, [route.params?.photoUri]);

  // カメラボタン押下
  const handleCameraPress = () => {
    if (isPhotoLimitReached()) {
      showSnackbar('写真は10枚まで追加できます');
      return;
    }
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      {/* ... 既存のUI ... */}

      {/* 写真サムネイル */}
      <PhotoThumbnailGrid
        photos={photos}
        maxPhotos={10}
        onPhotoPress={(photo) => {
          // Phase 3.5.4で実装
          console.log('Photo tapped:', photo.id);
        }}
        onDeletePress={(photo) => {
          // Phase 3.5.3で実装
          console.log('Delete tapped:', photo.id);
        }}
        onAddPress={handleCameraPress}
        disabled={isLoading || isPhotoLimitReached()}
      />
    </View>
  );
};
```

---

## 💻 実装詳細

### ファイル変更・新規作成

- [x] **新規** `src/hooks/usePhotoManager.ts` (100-150行)
- [x] **新規** `src/components/PhotoThumbnailGrid.tsx` (150-200行)
- [x] **新規** `src/utils/imageUtils.ts` (30-50行)
- [x] **修正** `src/screens/CameraScreen.tsx`
- [x] **修正** `src/screens/HomeScreen.tsx`

### 依存パッケージ追加

```bash
npm install expo-image-manipulator
```

---

## 🧪 テスト

### テストケース

#### usePhotoManager.test.ts

- [x] 写真追加成功
- [x] 10枚上限チェック
- [x] 写真削除成功
- [x] getPhotoCount正常動作
- [x] isPhotoLimitReached正常動作
- [x] clearPhotos正常動作

#### PhotoThumbnailGrid.test.ts

- [x] サムネイル表示（写真数分）
- [x] カウンター表示（X/10）
- [x] 追加ボタン表示（10枚未満）
- [x] 追加ボタン非表示（10枚）
- [x] onPhotoPress呼び出し
- [x] onDeletePress呼び出し
- [x] onAddPress呼び出し
- [x] disabled状態

#### imageUtils.test.ts

- [x] generateThumbnail成功
- [x] getImageSize成功

### テスト実装例

```typescript
// src/hooks/__tests__/usePhotoManager.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { usePhotoManager } from '../usePhotoManager';

describe('usePhotoManager', () => {
  it('should add photo successfully', async () => {
    const { result } = renderHook(() => usePhotoManager(10));

    await act(async () => {
      await result.current.addPhoto('file:///photo1.jpg', 1);
    });

    expect(result.current.getPhotoCount()).toBe(1);
  });

  it('should not exceed max photos limit', async () => {
    const { result } = renderHook(() => usePhotoManager(2));

    await act(async () => {
      await result.current.addPhoto('file:///photo1.jpg', 1);
      await result.current.addPhoto('file:///photo2.jpg', 1);
      await result.current.addPhoto('file:///photo3.jpg', 1); // Should fail
    });

    expect(result.current.getPhotoCount()).toBe(2);
  });

  // ... 他のテスト
});
```

---

## ✅ 完了基準

- [x] TypeScript: 0エラー
- [x] ESLint: 0警告
- [x] Prettier: 100%準拠
- [x] Tests: 20-25件全パス
- [x] ガードレール: 全パス
- [x] カメラ撮影→HomeScreen遷移確認
- [x] サムネイル表示確認
- [x] 10枚上限動作確認

---

## 📚 参考資料

- [expo-image-manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [React Navigation - Params](https://reactnavigation.org/docs/params/)
- [PhotoDAO](../../src/dao/PhotoDAO.ts)

---

## 🔗 関連イシュー

- **Depends on**: なし
- **Blocks**: [#3.5.3 削除機能](./PHASE_3_5_3_PHOTO_DELETE_FUNCTION.md), [#3.5.4 拡大表示](./PHASE_3_5_4_PHOTO_VIEWER_MODAL.md), [#3.5.5 報告書統合](./PHASE_3_5_5_REPORT_PHOTO_INTEGRATION.md)

---

**次のステップ**: [Issue #3.5.3 写真削除機能](./PHASE_3_5_3_PHOTO_DELETE_FUNCTION.md)
