/**
 * アクセシビリティ設定コンテキスト
 * Phase 2: フォントサイズ調整、ダークモード対応
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * フォントサイズ設定
 */
export type FontSize = 'small' | 'medium' | 'large';

/**
 * アクセシビリティ設定
 */
interface AccessibilitySettings {
  /** フォントサイズ */
  fontSize: FontSize;
  /** ダークモード */
  isDarkMode: boolean;
}

/**
 * フォントサイズのスケール
 */
export const FONT_SCALE: Record<FontSize, number> = {
  small: 0.85,
  medium: 1.0,
  large: 1.2,
};

/**
 * コンテキスト値
 */
interface AccessibilityContextValue extends AccessibilitySettings {
  /** フォントサイズを変更 */
  setFontSize: (size: FontSize) => Promise<void>;
  /** ダークモードを切り替え */
  toggleDarkMode: () => Promise<void>;
  /** フォントサイズのスケール値を取得 */
  getFontScale: () => number;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

const STORAGE_KEY = '@accessibility_settings';

/**
 * アクセシビリティプロバイダー
 */
export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>('medium');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  /**
   * 初期化: AsyncStorageから設定を読み込む
   */
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const settings: AccessibilitySettings = JSON.parse(stored);
          setFontSizeState(settings.fontSize);
          setIsDarkMode(settings.isDarkMode);
        }
      } catch (error) {
        console.error('アクセシビリティ設定の読み込みエラー:', error);
      }
    };
    loadSettings();
  }, []);

  /**
   * 設定を保存
   */
  const saveSettings = async (newSettings: AccessibilitySettings) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('アクセシビリティ設定の保存エラー:', error);
    }
  };

  /**
   * フォントサイズを変更
   */
  const setFontSize = async (size: FontSize) => {
    setFontSizeState(size);
    await saveSettings({ fontSize: size, isDarkMode });
  };

  /**
   * ダークモードを切り替え
   */
  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    await saveSettings({ fontSize, isDarkMode: newMode });
  };

  /**
   * フォントサイズのスケール値を取得
   */
  const getFontScale = () => FONT_SCALE[fontSize];

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        isDarkMode,
        setFontSize,
        toggleDarkMode,
        getFontScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * アクセシビリティフック
 */
export const useAccessibility = (): AccessibilityContextValue => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};
