// API Configuration - Environment-aware routing
// ローカル開発ではNode.jsバックエンド、本番ではRenderバックエンドを使用
const isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development';
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// 開発環境またはローカルホストからアクセスしている場合はローカルAPI
// それ以外（本番環境）はRender バックエンド
const RAW = (isDevelopment || isLocalhost)
  ? 'http://localhost:3002'  // ローカルNode.jsバックエンド
  : 'https://gijiroku-backend-nodejs.onrender.com';  // Render バックエンド

export const API_BASE = RAW.replace(/\/+$/, ''); // 末尾スラッシュ除去

export const API_ENDPOINTS = {
  // Node 側の正式エンドポイントだけを参照（simple系は使わない）
  health: `${API_BASE}/health`,
  version: `${API_BASE}/version`,
  
  // Core functionality - VercelプロキシAPI（APIキーが設定されている）
  uploadVtt: `/api/upload-vtt-simple`,
  processText: `/api/proxy-process-text`, 
  
  // PDF generation  
  generatePdf: `${API_BASE}/generate-pdf`,
  generatePdfPreview: `${API_BASE}/generate-pdf-preview`,
  
  // Legacy endpoints (for compatibility)
  reviseText: `/api/proxy-revise-text`,
  
  // Prompt management (Node.js with Supabase) - フォールバック対応
  prompts: `${API_BASE}/api/prompts`,
  promptsById: (id: string) => `${API_BASE}/api/prompts/${id}`,
  promptsExportAll: `${API_BASE}/api/prompts/export/all`,
  promptsImport: `${API_BASE}/api/prompts/import`,
  customTemplates: `${API_BASE}/api/prompts`,
  
  // フォールバック用のプロンプトAPI (Vercel simple版)
  promptsFallback: '/api/prompts-simple',
  
  // Dictionary management (Node.js)
  dictionary: `${API_BASE}/api/dictionary`,
  dictionaryById: (id: string) => `${API_BASE}/api/dictionary/${id}`,
  dictionaryCount: `${API_BASE}/api/dictionary/count`,
  dictionaryExport: `${API_BASE}/api/dictionary/export/all`,
  dictionaryImport: `${API_BASE}/api/dictionary/import`,

  // API Key validation (Node.js)
  apiKeyValidation: `${API_BASE}/api-validation/test`,
  apiKeyModels: `${API_BASE}/api-validation/models`,
} as const;

export default API_ENDPOINTS;