// API型定義をインポート（api.tsから統一管理）
export * from './api';

// ============== UI・コンポーネント関連型 ==============

export interface ProcessedText {
  id: string;
  original_text: string;
  corrected_text: string;
  corrections: string;
  timestamp: string;
}

export interface DashboardProps {
  onReset: () => void;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
}

export type UploadStatus = 'idle' | 'uploading' | 'completed' | 'error';
export type StepStatus = 'pending' | 'active' | 'completed';

export interface ModelInfo {
  value: string;
  label: string;
  provider: 'OpenAI' | 'Google';
  description: string;
  available: boolean;
}

// ============== フォーム・入力関連型 ==============

export interface FileUploadOptions {
  accept: string;
  maxSize?: number;
  multiple?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============== 設定・環境関連型 ==============

export interface AppConfig {
  apiBaseUrl: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
  enableFallback: boolean;
  darkMode: boolean;
  useCustomDictionary: boolean;
}

export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  VITE_API_BASE_URL: string;
  VITE_GEMINI_API_KEY?: string;
  VITE_OPENAI_API_KEY?: string;
  VITE_ENABLE_FALLBACK?: string;
}