/**
 * ローカルストレージマネージャー
 * ローカルファイルシステムとの連携を管理
 */

import { z } from 'zod';

// ================== スキーマ定義 ==================

// アプリケーション設定スキーマ
const AppSettingsSchema = z.object({
  version: z.string(),
  lastUpdated: z.string(),
  features: z.object({
    enableAutoSave: z.boolean(),
    autoSaveInterval: z.number(),
    enableOfflineMode: z.boolean(),
    maxHistoryItems: z.number(),
  }),
  paths: z.object({
    dataDirectory: z.string(),
    backupDirectory: z.string(),
  }),
});

// ユーザー設定スキーマ
const UserPreferencesSchema = z.object({
  ui: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    language: z.string(),
    fontSize: z.enum(['small', 'medium', 'large']),
    showLineNumbers: z.boolean(),
  }),
  editor: z.object({
    autoComplete: z.boolean(),
    wordWrap: z.boolean(),
    tabSize: z.number(),
  }),
  ai: z.object({
    defaultModel: z.string(),
    useCustomDictionary: z.boolean(),
    promptTemplate: z.string(),
  }),
});

// APIキー設定スキーマ
const APIKeysSchema = z.object({
  encrypted: z.boolean(),
  keys: z.record(z.string(), z.object({
    value: z.string(),
    lastUpdated: z.string(),
    isActive: z.boolean(),
  })),
});

// プロンプトテンプレートスキーマ
const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  template: z.string(),
  isDefault: z.boolean(),
  tags: z.array(z.string()),
  createdAt: z.string(),
});

// 辞書エントリスキーマ
const DictionaryEntrySchema = z.object({
  id: z.string(),
  original: z.string(),
  corrected: z.string(),
  category: z.string().optional(),
  priority: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

// ================== 型定義 ==================

export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type APIKeys = z.infer<typeof APIKeysSchema>;
export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;
export type DictionaryEntry = z.infer<typeof DictionaryEntrySchema>;

// ================== ローカルストレージマネージャー ==================

export class LocalStorageManager {
  private static instance: LocalStorageManager;
  private readonly STORAGE_PREFIX = 'gijiroku_';
  
  // デフォルト設定
  private readonly DEFAULT_APP_SETTINGS: AppSettings = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    features: {
      enableAutoSave: true,
      autoSaveInterval: 300,
      enableOfflineMode: true,
      maxHistoryItems: 100,
    },
    paths: {
      dataDirectory: './user-data',
      backupDirectory: './backups',
    },
  };

  private readonly DEFAULT_USER_PREFERENCES: UserPreferences = {
    ui: {
      theme: 'light',
      language: 'ja',
      fontSize: 'medium',
      showLineNumbers: true,
    },
    editor: {
      autoComplete: true,
      wordWrap: true,
      tabSize: 2,
    },
    ai: {
      defaultModel: 'gemini-pro',
      useCustomDictionary: true,
      promptTemplate: 'general_meeting',
    },
  };

  private constructor() {}

  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // ================== アプリケーション設定 ==================

  public getAppSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + 'app_settings');
      if (!stored) {
        return this.DEFAULT_APP_SETTINGS;
      }
      const parsed = JSON.parse(stored);
      return AppSettingsSchema.parse(parsed);
    } catch (error) {
      console.error('アプリケーション設定の読み込みエラー:', error);
      return this.DEFAULT_APP_SETTINGS;
    }
  }

  public saveAppSettings(settings: Partial<AppSettings>): void {
    try {
      const current = this.getAppSettings();
      const updated = {
        ...current,
        ...settings,
        lastUpdated: new Date().toISOString(),
      };
      const validated = AppSettingsSchema.parse(updated);
      localStorage.setItem(
        this.STORAGE_PREFIX + 'app_settings',
        JSON.stringify(validated)
      );
    } catch (error) {
      console.error('アプリケーション設定の保存エラー:', error);
      throw error;
    }
  }

  // ================== ユーザー設定 ==================

  public getUserPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + 'user_preferences');
      if (!stored) {
        return this.DEFAULT_USER_PREFERENCES;
      }
      const parsed = JSON.parse(stored);
      return UserPreferencesSchema.parse(parsed);
    } catch (error) {
      console.error('ユーザー設定の読み込みエラー:', error);
      return this.DEFAULT_USER_PREFERENCES;
    }
  }

  public saveUserPreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getUserPreferences();
      const updated = this.deepMerge(current, preferences);
      const validated = UserPreferencesSchema.parse(updated);
      localStorage.setItem(
        this.STORAGE_PREFIX + 'user_preferences',
        JSON.stringify(validated)
      );
    } catch (error) {
      console.error('ユーザー設定の保存エラー:', error);
      throw error;
    }
  }

  // ================== APIキー管理 ==================

  public getAPIKeys(): APIKeys | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + 'api_keys');
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored);
      return APIKeysSchema.parse(parsed);
    } catch (error) {
      console.error('APIキーの読み込みエラー:', error);
      return null;
    }
  }

  public saveAPIKey(provider: string, key: string): void {
    try {
      const current = this.getAPIKeys() || { encrypted: false, keys: {} };
      const updated = {
        ...current,
        keys: {
          ...current.keys,
          [provider]: {
            value: this.encryptKey(key),
            lastUpdated: new Date().toISOString(),
            isActive: true,
          },
        },
      };
      const validated = APIKeysSchema.parse(updated);
      localStorage.setItem(
        this.STORAGE_PREFIX + 'api_keys',
        JSON.stringify(validated)
      );
    } catch (error) {
      console.error('APIキーの保存エラー:', error);
      throw error;
    }
  }

  public getAPIKey(provider: string): string | null {
    const keys = this.getAPIKeys();
    if (!keys || !keys.keys[provider]) {
      return null;
    }
    return this.decryptKey(keys.keys[provider].value);
  }

  // ================== プロンプトテンプレート管理 ==================

  public getPromptTemplates(): PromptTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + 'prompt_templates');
      if (!stored) {
        return this.getDefaultPromptTemplates();
      }
      const parsed = JSON.parse(stored);
      return parsed.map((p: any) => PromptTemplateSchema.parse(p));
    } catch (error) {
      console.error('プロンプトテンプレートの読み込みエラー:', error);
      return this.getDefaultPromptTemplates();
    }
  }

  public savePromptTemplate(template: PromptTemplate): void {
    try {
      const templates = this.getPromptTemplates();
      const index = templates.findIndex(t => t.id === template.id);
      
      if (index >= 0) {
        templates[index] = template;
      } else {
        templates.push(template);
      }

      localStorage.setItem(
        this.STORAGE_PREFIX + 'prompt_templates',
        JSON.stringify(templates)
      );
    } catch (error) {
      console.error('プロンプトテンプレートの保存エラー:', error);
      throw error;
    }
  }

  public deletePromptTemplate(id: string): void {
    try {
      const templates = this.getPromptTemplates();
      const filtered = templates.filter(t => t.id !== id);
      localStorage.setItem(
        this.STORAGE_PREFIX + 'prompt_templates',
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('プロンプトテンプレートの削除エラー:', error);
      throw error;
    }
  }

  // ================== 辞書管理 ==================

  public getDictionaryEntries(): DictionaryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_PREFIX + 'dictionary_entries');
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      return parsed.map((e: any) => DictionaryEntrySchema.parse(e));
    } catch (error) {
      console.error('辞書エントリの読み込みエラー:', error);
      return [];
    }
  }

  public saveDictionaryEntry(entry: DictionaryEntry): void {
    try {
      const entries = this.getDictionaryEntries();
      const index = entries.findIndex(e => e.id === entry.id);
      
      if (index >= 0) {
        entries[index] = entry;
      } else {
        entries.push(entry);
      }

      localStorage.setItem(
        this.STORAGE_PREFIX + 'dictionary_entries',
        JSON.stringify(entries)
      );
    } catch (error) {
      console.error('辞書エントリの保存エラー:', error);
      throw error;
    }
  }

  public deleteDictionaryEntry(id: string): void {
    try {
      const entries = this.getDictionaryEntries();
      const filtered = entries.filter(e => e.id !== id);
      localStorage.setItem(
        this.STORAGE_PREFIX + 'dictionary_entries',
        JSON.stringify(filtered)
      );
    } catch (error) {
      console.error('辞書エントリの削除エラー:', error);
      throw error;
    }
  }

  // ================== ユーティリティ ==================

  private deepMerge(target: any, source: any): any {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // 簡易暗号化（本番環境では適切な暗号化ライブラリを使用）
  private encryptKey(key: string): string {
    // TODO: 実際の暗号化実装
    return btoa(key);
  }

  private decryptKey(encrypted: string): string {
    // TODO: 実際の復号化実装
    return atob(encrypted);
  }

  private getDefaultPromptTemplates(): PromptTemplate[] {
    return [
      {
        id: 'general_meeting',
        name: '一般会議',
        description: '通常の会議議事録用テンプレート',
        template: `あなたは議事録の修正専門家です。
以下のテキストをMarkdown形式で見やすく整理してください。

【修正方針】
- 誤字脱字を修正
- 読みやすい文章構造に整形
- 重要なポイントを箇条書きで整理
- 日付や時刻を統一フォーマットに

【修正対象テキスト】
{text}`,
        isDefault: true,
        tags: ['会議', '議事録', '一般'],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'technical_meeting',
        name: '技術会議',
        description: '技術的な内容を含む会議用テンプレート',
        template: `技術会議の議事録を整形してください。

【特別な注意事項】
- 技術用語は正確に記載
- コード例はコードブロックで整形
- バージョン情報や数値は正確に

【修正対象テキスト】
{text}`,
        isDefault: false,
        tags: ['技術', '開発', 'IT'],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // ================== エクスポート/インポート ==================

  public exportAllData(): string {
    const data = {
      appSettings: this.getAppSettings(),
      userPreferences: this.getUserPreferences(),
      apiKeys: this.getAPIKeys(),
      promptTemplates: this.getPromptTemplates(),
      dictionaryEntries: this.getDictionaryEntries(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importData(jsonString: string): void {
    try {
      const data = JSON.parse(jsonString);
      
      if (data.appSettings) {
        this.saveAppSettings(data.appSettings);
      }
      if (data.userPreferences) {
        this.saveUserPreferences(data.userPreferences);
      }
      if (data.apiKeys) {
        localStorage.setItem(
          this.STORAGE_PREFIX + 'api_keys',
          JSON.stringify(data.apiKeys)
        );
      }
      if (data.promptTemplates) {
        localStorage.setItem(
          this.STORAGE_PREFIX + 'prompt_templates',
          JSON.stringify(data.promptTemplates)
        );
      }
      if (data.dictionaryEntries) {
        localStorage.setItem(
          this.STORAGE_PREFIX + 'dictionary_entries',
          JSON.stringify(data.dictionaryEntries)
        );
      }
    } catch (error) {
      console.error('データインポートエラー:', error);
      throw error;
    }
  }

  public clearAllData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// シングルトンインスタンスのエクスポート
export const localStorageManager = LocalStorageManager.getInstance();