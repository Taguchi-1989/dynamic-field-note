/**
 * usePhotoManager Hook
 * 写真管理カスタムフック
 * Phase 3.5.2: 写真サムネイル基盤
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Photo, CreatePhotoInput } from '../types/case';
import { photoDAO } from '../dao/PhotoDAO';
import { generateThumbnail } from '../utils/imageUtils';

/**
 * usePhotoManagerの戻り値型
 */
export interface UsePhotoManagerReturn {
  photos: Photo[];
  addPhoto: (uri: string, caseId: number, caption?: string) => Promise<void>;
  removePhoto: (photoId: number) => Promise<void>;
  getPhotoCount: () => number;
  isPhotoLimitReached: () => boolean;
  clearPhotos: () => void;
  isLoading: boolean;
}

/**
 * 写真管理フック
 * @param maxPhotos 最大写真数（デフォルト: 10）
 */
export const usePhotoManager = (maxPhotos = 10): UsePhotoManagerReturn => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * 写真追加
   */
  const addPhoto = useCallback(
    async (uri: string, caseId: number, caption?: string): Promise<void> => {
      // 上限チェック
      if (photos.length >= maxPhotos) {
        Alert.alert('上限到達', `写真は${maxPhotos}枚まで追加できます`);
        return;
      }

      setIsLoading(true);

      try {
        // サムネイル生成
        const thumbnailUri = await generateThumbnail(uri, 200);

        // PhotoDAO に保存
        const photoInput: CreatePhotoInput = {
          case_id: caseId,
          file_path: uri,
          thumbnail_path: thumbnailUri,
          caption,
        };

        const savedPhoto = await photoDAO.create(photoInput);

        // State 更新
        setPhotos((prev) => [...prev, savedPhoto]);

        console.log('[usePhotoManager] Photo added:', savedPhoto.id);
      } catch (error) {
        console.error('[usePhotoManager] Failed to add photo:', error);
        Alert.alert('エラー', '写真の追加に失敗しました');
      } finally {
        setIsLoading(false);
      }
    },
    [photos, maxPhotos]
  );

  /**
   * 写真削除（論理削除）
   */
  const removePhoto = useCallback(async (photoId: number): Promise<void> => {
    setIsLoading(true);

    try {
      // photoDAO で論理削除
      await photoDAO.delete(photoId);

      // State から削除
      setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));

      console.log('[usePhotoManager] Photo removed:', photoId);
    } catch (error) {
      console.error('[usePhotoManager] Failed to remove photo:', error);
      Alert.alert('エラー', '写真の削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 写真枚数取得
   */
  const getPhotoCount = useCallback((): number => {
    return photos.length;
  }, [photos]);

  /**
   * 写真上限チェック
   */
  const isPhotoLimitReached = useCallback((): boolean => {
    return photos.length >= maxPhotos;
  }, [photos, maxPhotos]);

  /**
   * 写真クリア（State のみ）
   */
  const clearPhotos = useCallback((): void => {
    setPhotos([]);
  }, []);

  return {
    photos,
    addPhoto,
    removePhoto,
    getPhotoCount,
    isPhotoLimitReached,
    clearPhotos,
    isLoading,
  };
};
