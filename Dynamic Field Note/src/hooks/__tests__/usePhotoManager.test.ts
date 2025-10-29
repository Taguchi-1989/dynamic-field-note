/**
 * Unit Test: usePhotoManager Hook
 * 写真管理カスタムフックのユニットテスト
 */

// モック設定は最初に行う必要がある
jest.mock('../../dao/PhotoDAO', () => ({
  photoDAO: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
  },
}));

jest.mock('../../utils/imageUtils', () => ({
  generateThumbnail: jest.fn(),
}));

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { usePhotoManager } from '../usePhotoManager';
import { photoDAO } from '../../dao/PhotoDAO';
import { generateThumbnail } from '../../utils/imageUtils';
import type { Photo } from '../../types/case';

describe('usePhotoManager', () => {
  // モックデータ
  const mockPhoto: Photo = {
    id: 1,
    case_id: 100,
    report_id: null,
    file_path: '/path/to/photo.jpg',
    thumbnail_path: '/path/to/thumbnail.jpg',
    caption: 'テスト写真',
    exif_data: null,
    annotation_data: null,
    width: 1920,
    height: 1080,
    file_size: 2048000,
    created_at: '2025-10-25T10:00:00Z',
    is_deleted: 0,
  };

  const mockPhotoDAO = photoDAO as jest.Mocked<typeof photoDAO>;
  const mockGenerateThumbnail = generateThumbnail as jest.MockedFunction<typeof generateThumbnail>;
  const mockAlert = Alert.alert as jest.MockedFunction<typeof Alert.alert>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateThumbnail.mockResolvedValue('/path/to/thumbnail.jpg');
    mockPhotoDAO.create.mockResolvedValue(mockPhoto);
    mockPhotoDAO.delete.mockResolvedValue();
    mockPhotoDAO.update.mockResolvedValue({
      ...mockPhoto,
      report_id: 200,
    });
  });

  describe('初期状態', () => {
    it('should initialize with empty photos array', () => {
      const { result } = renderHook(() => usePhotoManager());

      expect(result.current.photos).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.getPhotoCount()).toBe(0);
      expect(result.current.isPhotoLimitReached()).toBe(false);
    });

    it('should accept custom maxPhotos parameter', () => {
      const { result } = renderHook(() => usePhotoManager(5));

      expect(result.current.photos).toEqual([]);
      expect(result.current.isPhotoLimitReached()).toBe(false);
    });
  });

  describe('addPhoto', () => {
    it('should add photo successfully', async () => {
      const { result } = renderHook(() => usePhotoManager());

      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100, 'テスト写真');
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });

      expect(mockGenerateThumbnail).toHaveBeenCalledWith('/path/to/photo.jpg', 200);
      expect(mockPhotoDAO.create).toHaveBeenCalledWith({
        case_id: 100,
        file_path: '/path/to/photo.jpg',
        thumbnail_path: '/path/to/thumbnail.jpg',
        caption: 'テスト写真',
      });
      expect(result.current.photos[0]).toEqual(mockPhoto);
      expect(result.current.getPhotoCount()).toBe(1);
    });

    it('should add photo without caption', async () => {
      const { result } = renderHook(() => usePhotoManager());

      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });

      expect(mockPhotoDAO.create).toHaveBeenCalledWith({
        case_id: 100,
        file_path: '/path/to/photo.jpg',
        thumbnail_path: '/path/to/thumbnail.jpg',
        caption: undefined,
      });
    });

    it('should reset isLoading to false after photo addition', async () => {
      const { result } = renderHook(() => usePhotoManager());

      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should show alert when photo limit is reached', async () => {
      const { result } = renderHook(() => usePhotoManager(2));

      // 2枚追加
      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 1 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo1.jpg', 100);
      });

      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 2 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo2.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(2);
      });

      expect(result.current.isPhotoLimitReached()).toBe(true);

      // 3枚目を追加しようとする
      await act(async () => {
        await result.current.addPhoto('/path/to/photo3.jpg', 100);
      });

      expect(mockAlert).toHaveBeenCalledWith('上限到達', '写真は2枚まで追加できます');
      expect(result.current.photos).toHaveLength(2);
    });

    it('should handle error when adding photo fails', async () => {
      const { result } = renderHook(() => usePhotoManager());

      mockPhotoDAO.create.mockRejectedValueOnce(new Error('Database error'));

      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      expect(mockAlert).toHaveBeenCalledWith('エラー', '写真の追加に失敗しました');
      expect(result.current.photos).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error when thumbnail generation fails', async () => {
      const { result } = renderHook(() => usePhotoManager());

      mockGenerateThumbnail.mockRejectedValueOnce(new Error('Thumbnail error'));

      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      expect(mockAlert).toHaveBeenCalledWith('エラー', '写真の追加に失敗しました');
      expect(result.current.photos).toHaveLength(0);
    });
  });

  describe('removePhoto', () => {
    it('should remove photo successfully', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // まず写真を追加
      mockPhotoDAO.create.mockResolvedValueOnce(mockPhoto);
      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });

      // 写真を削除
      await act(async () => {
        await result.current.removePhoto(1);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(0);
      });

      expect(mockPhotoDAO.delete).toHaveBeenCalledWith(1);
      expect(result.current.getPhotoCount()).toBe(0);
    });

    it('should reset isLoading to false after photo removal', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // 写真を追加
      mockPhotoDAO.create.mockResolvedValueOnce(mockPhoto);
      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      await act(async () => {
        await result.current.removePhoto(1);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should handle error when removing photo fails', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // 写真を追加
      mockPhotoDAO.create.mockResolvedValueOnce(mockPhoto);
      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });

      // 削除エラー
      mockPhotoDAO.delete.mockRejectedValueOnce(new Error('Delete error'));

      await act(async () => {
        await result.current.removePhoto(1);
      });

      expect(mockAlert).toHaveBeenCalledWith('エラー', '写真の削除に失敗しました');
      expect(result.current.photos).toHaveLength(1); // 削除されていない
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('attachPhotosToReport', () => {
    it('should attach photos to report successfully', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // 2枚の写真を追加
      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 1 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo1.jpg', 100);
      });

      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 2 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo2.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(2);
      });

      // 報告書に紐付け
      mockPhotoDAO.update.mockResolvedValueOnce({ ...mockPhoto, id: 1, report_id: 200 });
      mockPhotoDAO.update.mockResolvedValueOnce({ ...mockPhoto, id: 2, report_id: 200 });

      await act(async () => {
        await result.current.attachPhotosToReport(200);
      });

      await waitFor(() => {
        expect(result.current.photos[0].report_id).toBe(200);
      });

      expect(mockPhotoDAO.update).toHaveBeenCalledTimes(2);
      expect(mockPhotoDAO.update).toHaveBeenCalledWith(1, { report_id: 200 });
      expect(mockPhotoDAO.update).toHaveBeenCalledWith(2, { report_id: 200 });
      expect(result.current.photos[0].report_id).toBe(200);
      expect(result.current.photos[1].report_id).toBe(200);
    });

    it('should handle error when attaching photos fails', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // 写真を追加
      mockPhotoDAO.create.mockResolvedValueOnce(mockPhoto);
      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });

      // 紐付けエラー
      mockPhotoDAO.update.mockRejectedValueOnce(new Error('Update error'));

      await act(async () => {
        await result.current.attachPhotosToReport(200);
      });

      expect(mockAlert).toHaveBeenCalledWith('エラー', '写真の報告書への紐付けに失敗しました');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('getPhotoCount', () => {
    it('should return correct photo count', async () => {
      const { result } = renderHook(() => usePhotoManager());

      expect(result.current.getPhotoCount()).toBe(0);

      // 写真を追加
      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 1 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo1.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.getPhotoCount()).toBe(1);
      });

      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 2 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo2.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.getPhotoCount()).toBe(2);
      });
    });
  });

  describe('isPhotoLimitReached', () => {
    it('should return false when under limit', () => {
      const { result } = renderHook(() => usePhotoManager(5));

      expect(result.current.isPhotoLimitReached()).toBe(false);
    });

    it('should return true when limit is reached', async () => {
      const { result } = renderHook(() => usePhotoManager(2));

      // 2枚追加
      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 1 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo1.jpg', 100);
      });

      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 2 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo2.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.isPhotoLimitReached()).toBe(true);
      });
    });
  });

  describe('clearPhotos', () => {
    it('should clear all photos from state', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // 写真を追加
      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 1 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo1.jpg', 100);
      });

      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 2 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo2.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(2);
      });

      // クリア
      act(() => {
        result.current.clearPhotos();
      });

      expect(result.current.photos).toHaveLength(0);
      expect(result.current.getPhotoCount()).toBe(0);
      expect(result.current.isPhotoLimitReached()).toBe(false);
    });
  });

  describe('複合シナリオ', () => {
    it('should handle complete workflow: add → attach → remove', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // 1. 写真追加
      mockPhotoDAO.create.mockResolvedValueOnce(mockPhoto);
      await act(async () => {
        await result.current.addPhoto('/path/to/photo.jpg', 100, 'テスト');
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(1);
      });

      // 2. 報告書に紐付け
      mockPhotoDAO.update.mockResolvedValueOnce({ ...mockPhoto, report_id: 200 });
      await act(async () => {
        await result.current.attachPhotosToReport(200);
      });

      await waitFor(() => {
        expect(result.current.photos[0].report_id).toBe(200);
      });

      // 3. 削除
      await act(async () => {
        await result.current.removePhoto(1);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(0);
      });
    });

    it('should handle multiple photos with different operations', async () => {
      const { result } = renderHook(() => usePhotoManager());

      // 3枚追加
      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 1 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo1.jpg', 100);
      });

      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 2 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo2.jpg', 100);
      });

      mockPhotoDAO.create.mockResolvedValueOnce({ ...mockPhoto, id: 3 });
      await act(async () => {
        await result.current.addPhoto('/path/to/photo3.jpg', 100);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(3);
      });

      // 1枚削除
      await act(async () => {
        await result.current.removePhoto(2);
      });

      await waitFor(() => {
        expect(result.current.photos).toHaveLength(2);
      });

      // 残りを報告書に紐付け
      mockPhotoDAO.update.mockResolvedValue({ ...mockPhoto, report_id: 200 });
      await act(async () => {
        await result.current.attachPhotosToReport(200);
      });

      await waitFor(() => {
        expect(mockPhotoDAO.update).toHaveBeenCalledTimes(2);
      });
    });
  });
});
