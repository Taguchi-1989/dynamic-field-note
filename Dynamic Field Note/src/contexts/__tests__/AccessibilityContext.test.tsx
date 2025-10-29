/**
 * AccessibilityContext Unit Tests
 * カバレッジ目標: 21.95% → 80%以上
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AccessibilityProvider,
  useAccessibility,
  FONT_SCALE,
  type FontSize,
} from '../AccessibilityContext';

// AsyncStorageをモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const STORAGE_KEY = '@accessibility_settings';

describe('AccessibilityContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('FONT_SCALE 定数', () => {
    it('should have correct scale values', () => {
      expect(FONT_SCALE.small).toBe(0.85);
      expect(FONT_SCALE.medium).toBe(1.0);
      expect(FONT_SCALE.large).toBe(1.2);
    });
  });

  describe('AccessibilityProvider 初期化', () => {
    it('should initialize with default values', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
        expect(result.current.isDarkMode).toBe(false);
        expect(result.current.getFontScale()).toBe(1.0);
      });
    });

    it('should load settings from AsyncStorage', async () => {
      const mockSettings = {
        fontSize: 'large' as FontSize,
        isDarkMode: true,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockSettings));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('large');
        expect(result.current.isDarkMode).toBe(true);
        expect(result.current.getFontScale()).toBe(1.2);
      });

      expect(AsyncStorage.getItem).toHaveBeenCalledWith(STORAGE_KEY);
    });

    it('should handle AsyncStorage load error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('AsyncStorage read error')
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
        expect(result.current.isDarkMode).toBe(false);
      });

      // エラーは __DEV__ モードでのみログ出力される
      if (__DEV__) {
        expect(consoleError).toHaveBeenCalled();
      }

      consoleError.mockRestore();
    });

    it('should handle invalid JSON in AsyncStorage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid-json');

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
        expect(result.current.isDarkMode).toBe(false);
      });
    });
  });

  describe('setFontSize 関数', () => {
    it('should change font size to small', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
      });

      await act(async () => {
        await result.current.setFontSize('small');
      });

      expect(result.current.fontSize).toBe('small');
      expect(result.current.getFontScale()).toBe(0.85);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ fontSize: 'small', isDarkMode: false })
      );
    });

    it('should change font size to large', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
      });

      await act(async () => {
        await result.current.setFontSize('large');
      });

      expect(result.current.fontSize).toBe('large');
      expect(result.current.getFontScale()).toBe(1.2);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ fontSize: 'large', isDarkMode: false })
      );
    });

    it('should handle AsyncStorage save error', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('AsyncStorage write error')
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
      });

      await act(async () => {
        await result.current.setFontSize('large');
      });

      // State は更新されるべき（エラーは無視）
      expect(result.current.fontSize).toBe('large');

      if (__DEV__) {
        expect(consoleError).toHaveBeenCalled();
      }

      consoleError.mockRestore();
    });
  });

  describe('toggleDarkMode 関数', () => {
    it('should toggle dark mode from false to true', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(false);
      });

      await act(async () => {
        await result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ fontSize: 'medium', isDarkMode: true })
      );
    });

    it('should toggle dark mode from true to false', async () => {
      const mockSettings = {
        fontSize: 'medium' as FontSize,
        isDarkMode: true,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(mockSettings));

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      });

      await act(async () => {
        await result.current.toggleDarkMode();
      });

      expect(result.current.isDarkMode).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify({ fontSize: 'medium', isDarkMode: false })
      );
    });

    it('should handle AsyncStorage save error on toggle', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      (AsyncStorage.setItem as jest.Mock).mockRejectedValueOnce(
        new Error('AsyncStorage write error')
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(false);
      });

      await act(async () => {
        await result.current.toggleDarkMode();
      });

      // State は更新されるべき
      expect(result.current.isDarkMode).toBe(true);

      if (__DEV__) {
        expect(consoleError).toHaveBeenCalled();
      }

      consoleError.mockRestore();
    });
  });

  describe('getFontScale 関数', () => {
    it('should return correct scale for small font', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
      });

      await act(async () => {
        await result.current.setFontSize('small');
      });

      expect(result.current.getFontScale()).toBe(0.85);
    });

    it('should return correct scale for medium font', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
      });

      expect(result.current.getFontScale()).toBe(1.0);
    });

    it('should return correct scale for large font', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
      });

      await act(async () => {
        await result.current.setFontSize('large');
      });

      expect(result.current.getFontScale()).toBe(1.2);
    });
  });

  describe('useAccessibility hook エラーケース', () => {
    it('should throw error when used outside provider', () => {
      // エラーログを抑制
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useAccessibility());
      }).toThrow('useAccessibility must be used within AccessibilityProvider');

      consoleError.mockRestore();
    });
  });

  describe('複合的な状態変更', () => {
    it('should handle multiple state changes correctly', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AccessibilityProvider>{children}</AccessibilityProvider>
      );

      const { result } = renderHook(() => useAccessibility(), { wrapper });

      await waitFor(() => {
        expect(result.current.fontSize).toBe('medium');
      });

      // フォントサイズを変更
      await act(async () => {
        await result.current.setFontSize('large');
      });

      expect(result.current.fontSize).toBe('large');
      expect(result.current.isDarkMode).toBe(false);

      // ダークモードを有効化
      await act(async () => {
        await result.current.toggleDarkMode();
      });

      expect(result.current.fontSize).toBe('large');
      expect(result.current.isDarkMode).toBe(true);

      // フォントサイズを再度変更
      await act(async () => {
        await result.current.setFontSize('small');
      });

      expect(result.current.fontSize).toBe('small');
      expect(result.current.isDarkMode).toBe(true);
      expect(result.current.getFontScale()).toBe(0.85);

      // 最終的な保存を確認
      expect(AsyncStorage.setItem).toHaveBeenLastCalledWith(
        STORAGE_KEY,
        JSON.stringify({ fontSize: 'small', isDarkMode: true })
      );
    });
  });
});
