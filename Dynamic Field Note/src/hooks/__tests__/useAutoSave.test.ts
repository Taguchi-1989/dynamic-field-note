/**
 * useAutoSave.ts のユニットテスト
 * 目標カバレッジ: 80%以上
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useAutoSave } from '../useAutoSave';

// タイマーのモック
jest.useFakeTimers();

describe('useAutoSave', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('基本動作', () => {
    it('should initialize with default values', () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
        })
      );

      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should call onSave after default delay (5000ms)', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const testData = { title: 'Test Report', content: 'Content' };

      const { result } = renderHook(() =>
        useAutoSave({
          data: testData,
          onSave: mockOnSave,
        })
      );

      expect(mockOnSave).not.toHaveBeenCalled();

      // 5秒進める
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(testData);
      });
    });

    it('should call onSave after custom delay', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const testData = { value: 'test' };

      renderHook(() =>
        useAutoSave({
          data: testData,
          onSave: mockOnSave,
          delay: 3000,
        })
      );

      // 2.9秒では呼ばれない
      act(() => {
        jest.advanceTimersByTime(2900);
      });
      expect(mockOnSave).not.toHaveBeenCalled();

      // 3秒で呼ばれる
      act(() => {
        jest.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(testData);
      });
    });

    it('should set isSaving to true during save', async () => {
      let resolveSave: () => void;
      const mockOnSave = jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveSave = resolve;
          })
      );

      const { result } = renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
          delay: 1000,
        })
      );

      expect(result.current.isSaving).toBe(false);

      // タイマー実行
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // 保存完了
      act(() => {
        resolveSave!();
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });

    it('should set lastSaved after successful save', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const beforeTest = new Date();

      const { result } = renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
          delay: 1000,
        })
      );

      expect(result.current.lastSaved).toBeNull();

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.lastSaved).not.toBeNull();
      });

      const afterTest = new Date();
      expect(result.current.lastSaved!.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
      expect(result.current.lastSaved!.getTime()).toBeLessThanOrEqual(afterTest.getTime());
    });
  });

  describe('enabled フラグ', () => {
    it('should not save when enabled is false', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
          delay: 1000,
          enabled: false,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // 少し待ってもonSaveが呼ばれないことを確認
      await act(async () => {
        await Promise.resolve();
      });

      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should resume saving when enabled changes from false to true', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const testData = { test: 'data' };

      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useAutoSave({
            data: testData,
            onSave: mockOnSave,
            delay: 1000,
            enabled,
          }),
        { initialProps: { enabled: false } }
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();

      // enabled を true に変更
      rerender({ enabled: true });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(testData);
      });
    });
  });

  describe('データ変更時の動作', () => {
    it('should reset timer when data changes', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data }: { data: { count: number } }) =>
          useAutoSave({
            data,
            onSave: mockOnSave,
            delay: 3000,
          }),
        { initialProps: { data: { count: 1 } } }
      );

      // 2秒進める
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();

      // データ変更（タイマーリセット）
      rerender({ data: { count: 2 } });

      // さらに2秒進める（合計4秒だが、リセットされたので保存されない）
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockOnSave).not.toHaveBeenCalled();

      // さらに1秒進める（リセット後3秒経過）
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({ count: 2 });
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onSave with latest data', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data }: { data: { version: number } }) =>
          useAutoSave({
            data,
            onSave: mockOnSave,
            delay: 1000,
          }),
        { initialProps: { data: { version: 1 } } }
      );

      // データを複数回変更
      rerender({ data: { version: 2 } });
      rerender({ data: { version: 3 } });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({ version: 3 });
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('should set error when onSave fails', async () => {
      const testError = new Error('Save failed');
      const mockOnSave = jest.fn().mockRejectedValue(testError);

      const { result } = renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
          delay: 1000,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Save failed');
      });

      expect(result.current.isSaving).toBe(false);
      expect(result.current.lastSaved).toBeNull();
    });

    it('should clear previous error on successful save', async () => {
      const testError = new Error('First save failed');
      const mockOnSave = jest
        .fn()
        .mockRejectedValueOnce(testError)
        .mockResolvedValueOnce(undefined);

      const { result, rerender } = renderHook(
        ({ data }: { data: { count: number } }) =>
          useAutoSave({
            data,
            onSave: mockOnSave,
            delay: 1000,
          }),
        { initialProps: { data: { count: 1 } } }
      );

      // 最初の保存（失敗）
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.error?.message).toBe('First save failed');
      });

      // データ変更して再試行（成功）
      rerender({ data: { count: 2 } });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.lastSaved).not.toBeNull();
      });
    });

    it('should not crash on error during save', async () => {
      const mockOnSave = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      const { result } = renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
          delay: 1000,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      // Hookは正常に動作している
      expect(result.current.isSaving).toBe(false);
    });
  });

  describe('クリーンアップ', () => {
    it('should clear timer on unmount', () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { unmount } = renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
          delay: 5000,
        })
      );

      // 2秒進める
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // アンマウント
      unmount();

      // さらに3秒進める（合計5秒）
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      // タイマーがクリアされたので、onSaveは呼ばれない
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should clear timer when enabled changes to false', () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) =>
          useAutoSave({
            data: { test: 'data' },
            onSave: mockOnSave,
            delay: 3000,
            enabled,
          }),
        { initialProps: { enabled: true } }
      );

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      // enabled を false に変更
      rerender({ enabled: false });

      // さらに1秒進める（合計3秒）
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // タイマーがクリアされたので、onSaveは呼ばれない
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('複雑なシナリオ', () => {
    it('should handle rapid data changes correctly', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data }: { data: { value: number } }) =>
          useAutoSave({
            data,
            onSave: mockOnSave,
            delay: 2000,
          }),
        { initialProps: { data: { value: 0 } } }
      );

      // 0.5秒ごとにデータ変更
      for (let i = 1; i <= 5; i++) {
        act(() => {
          jest.advanceTimersByTime(500);
        });
        rerender({ data: { value: i } });
      }

      // 最後の変更から2秒待つ
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({ value: 5 });
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle multiple successful saves in sequence', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data }: { data: { count: number } }) =>
          useAutoSave({
            data,
            onSave: mockOnSave,
            delay: 1000,
          }),
        { initialProps: { data: { count: 1 } } }
      );

      // 1回目の保存
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({ count: 1 });
      });

      // データ変更
      rerender({ data: { count: 2 } });

      // 2回目の保存
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith({ count: 2 });
        expect(mockOnSave).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle complex data types', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);
      const complexData = {
        id: 123,
        title: 'Test Report',
        items: [{ name: 'Item 1' }, { name: 'Item 2' }],
        metadata: { author: 'Test User', version: 1 },
        tags: ['tag1', 'tag2'],
      };

      renderHook(() =>
        useAutoSave({
          data: complexData,
          onSave: mockOnSave,
          delay: 1000,
        })
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(complexData);
      });
    });

    it('should work with custom delay of 0ms (immediate save)', async () => {
      const mockOnSave = jest.fn().mockResolvedValue(undefined);

      renderHook(() =>
        useAutoSave({
          data: { test: 'data' },
          onSave: mockOnSave,
          delay: 0,
        })
      );

      act(() => {
        jest.advanceTimersByTime(0);
      });

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });
    });
  });
});
