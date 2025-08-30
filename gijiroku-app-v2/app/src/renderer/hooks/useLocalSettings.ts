/**
 * ローカル設定管理フック
 * LocalStorageManagerを使用した設定の読み書き
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  localStorageManager, 
  UserPreferences, 
  AppSettings,
  PromptTemplate,
  DictionaryEntry 
} from '../services/localStorageManager';

interface UseLocalSettingsReturn {
  // ユーザー設定
  userPreferences: UserPreferences;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // アプリケーション設定
  appSettings: AppSettings;
  updateAppSettings: (settings: Partial<AppSettings>) => void;
  
  // APIキー管理
  saveAPIKey: (provider: string, key: string) => void;
  getAPIKey: (provider: string) => string | null;
  
  // プロンプトテンプレート
  promptTemplates: PromptTemplate[];
  savePromptTemplate: (template: PromptTemplate) => void;
  deletePromptTemplate: (id: string) => void;
  
  // 辞書管理
  dictionaryEntries: DictionaryEntry[];
  saveDictionaryEntry: (entry: DictionaryEntry) => void;
  deleteDictionaryEntry: (id: string) => void;
  
  // データ管理
  exportSettings: () => string;
  importSettings: (data: string) => void;
  resetToDefaults: () => void;
  
  // 状態
  isLoading: boolean;
  error: string | null;
}

export const useLocalSettings = (): UseLocalSettingsReturn => {
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(
    localStorageManager.getUserPreferences()
  );
  const [appSettings, setAppSettings] = useState<AppSettings>(
    localStorageManager.getAppSettings()
  );
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>(
    localStorageManager.getPromptTemplates()
  );
  const [dictionaryEntries, setDictionaryEntries] = useState<DictionaryEntry[]>(
    localStorageManager.getDictionaryEntries()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザー設定の更新
  const updateUserPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    try {
      setError(null);
      localStorageManager.saveUserPreferences(preferences);
      const updated = localStorageManager.getUserPreferences();
      setUserPreferences(updated);
      
      // ダークモードの即座適用
      if (preferences.ui?.theme) {
        applyTheme(preferences.ui.theme);
      }
    } catch (err) {
      setError('ユーザー設定の更新に失敗しました');
      console.error(err);
    }
  }, []);

  // アプリケーション設定の更新
  const updateAppSettings = useCallback((settings: Partial<AppSettings>) => {
    try {
      setError(null);
      localStorageManager.saveAppSettings(settings);
      const updated = localStorageManager.getAppSettings();
      setAppSettings(updated);
    } catch (err) {
      setError('アプリケーション設定の更新に失敗しました');
      console.error(err);
    }
  }, []);

  // APIキーの保存
  const saveAPIKey = useCallback((provider: string, key: string) => {
    try {
      setError(null);
      localStorageManager.saveAPIKey(provider, key);
    } catch (err) {
      setError('APIキーの保存に失敗しました');
      console.error(err);
    }
  }, []);

  // APIキーの取得
  const getAPIKey = useCallback((provider: string): string | null => {
    try {
      return localStorageManager.getAPIKey(provider);
    } catch (err) {
      console.error('APIキーの取得エラー:', err);
      return null;
    }
  }, []);

  // プロンプトテンプレートの保存
  const savePromptTemplate = useCallback((template: PromptTemplate) => {
    try {
      setError(null);
      localStorageManager.savePromptTemplate(template);
      setPromptTemplates(localStorageManager.getPromptTemplates());
    } catch (err) {
      setError('プロンプトテンプレートの保存に失敗しました');
      console.error(err);
    }
  }, []);

  // プロンプトテンプレートの削除
  const deletePromptTemplate = useCallback((id: string) => {
    try {
      setError(null);
      localStorageManager.deletePromptTemplate(id);
      setPromptTemplates(localStorageManager.getPromptTemplates());
    } catch (err) {
      setError('プロンプトテンプレートの削除に失敗しました');
      console.error(err);
    }
  }, []);

  // 辞書エントリの保存
  const saveDictionaryEntry = useCallback((entry: DictionaryEntry) => {
    try {
      setError(null);
      localStorageManager.saveDictionaryEntry(entry);
      setDictionaryEntries(localStorageManager.getDictionaryEntries());
    } catch (err) {
      setError('辞書エントリの保存に失敗しました');
      console.error(err);
    }
  }, []);

  // 辞書エントリの削除
  const deleteDictionaryEntry = useCallback((id: string) => {
    try {
      setError(null);
      localStorageManager.deleteDictionaryEntry(id);
      setDictionaryEntries(localStorageManager.getDictionaryEntries());
    } catch (err) {
      setError('辞書エントリの削除に失敗しました');
      console.error(err);
    }
  }, []);

  // 設定のエクスポート
  const exportSettings = useCallback((): string => {
    try {
      setError(null);
      return localStorageManager.exportAllData();
    } catch (err) {
      setError('設定のエクスポートに失敗しました');
      console.error(err);
      return '';
    }
  }, []);

  // 設定のインポート
  const importSettings = useCallback((data: string) => {
    try {
      setError(null);
      setIsLoading(true);
      localStorageManager.importData(data);
      
      // 状態を更新
      setUserPreferences(localStorageManager.getUserPreferences());
      setAppSettings(localStorageManager.getAppSettings());
      setPromptTemplates(localStorageManager.getPromptTemplates());
      setDictionaryEntries(localStorageManager.getDictionaryEntries());
      
      // テーマを適用
      const prefs = localStorageManager.getUserPreferences();
      applyTheme(prefs.ui.theme);
    } catch (err) {
      setError('設定のインポートに失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // デフォルト設定にリセット
  const resetToDefaults = useCallback(() => {
    try {
      setError(null);
      setIsLoading(true);
      localStorageManager.clearAllData();
      
      // 状態を更新
      setUserPreferences(localStorageManager.getUserPreferences());
      setAppSettings(localStorageManager.getAppSettings());
      setPromptTemplates(localStorageManager.getPromptTemplates());
      setDictionaryEntries(localStorageManager.getDictionaryEntries());
      
      // デフォルトテーマを適用
      applyTheme('light');
    } catch (err) {
      setError('設定のリセットに失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // テーマの適用
  const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme = prefersDark ? 'dark' : 'light';
    }
    
    if (theme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
  };

  // 初期化時にテーマを適用
  useEffect(() => {
    applyTheme(userPreferences.ui.theme);
  }, []);

  // localStorageの変更を監視（他のタブやウィンドウでの変更を検知）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('gijiroku_')) {
        // 設定を再読み込み
        setUserPreferences(localStorageManager.getUserPreferences());
        setAppSettings(localStorageManager.getAppSettings());
        setPromptTemplates(localStorageManager.getPromptTemplates());
        setDictionaryEntries(localStorageManager.getDictionaryEntries());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    userPreferences,
    updateUserPreferences,
    appSettings,
    updateAppSettings,
    saveAPIKey,
    getAPIKey,
    promptTemplates,
    savePromptTemplate,
    deletePromptTemplate,
    dictionaryEntries,
    saveDictionaryEntry,
    deleteDictionaryEntry,
    exportSettings,
    importSettings,
    resetToDefaults,
    isLoading,
    error,
  };
};

// ダークモード専用フック
export const useDarkMode = () => {
  const { userPreferences, updateUserPreferences } = useLocalSettings();
  
  const toggleDarkMode = useCallback(() => {
    const newTheme = userPreferences.ui.theme === 'dark' ? 'light' : 'dark';
    updateUserPreferences({
      ui: {
        ...userPreferences.ui,
        theme: newTheme,
      },
    });
  }, [userPreferences, updateUserPreferences]);
  
  return {
    isDarkMode: userPreferences.ui.theme === 'dark',
    theme: userPreferences.ui.theme,
    toggleDarkMode,
    setTheme: (theme: 'light' | 'dark' | 'auto') => {
      updateUserPreferences({
        ui: {
          ...userPreferences.ui,
          theme,
        },
      });
    },
  };
};

// APIキー専用フック
export const useAPIKeys = () => {
  const { saveAPIKey, getAPIKey } = useLocalSettings();
  
  return {
    geminiKey: getAPIKey('gemini'),
    openaiKey: getAPIKey('openai'),
    setGeminiKey: (key: string) => saveAPIKey('gemini', key),
    setOpenAIKey: (key: string) => saveAPIKey('openai', key),
    hasGeminiKey: !!getAPIKey('gemini'),
    hasOpenAIKey: !!getAPIKey('openai'),
  };
};