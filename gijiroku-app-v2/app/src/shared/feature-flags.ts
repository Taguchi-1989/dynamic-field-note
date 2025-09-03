/**
 * Feature Flags - MVP vs 高度機能の制御
 * 
 * MVP: 基本機能のみ有効
 * 高度機能: 開発中フラグで無効化・開発中表示
 */

export interface FeatureFlags {
  // === MVP機能（常に有効） ===
  apiKeys: boolean;
  pdfGeneration: boolean;
  customPrompts: boolean;
  chunkingProcessing: boolean;
  retryExecution: boolean;

  // === 高度機能（開発中・無効化対象） ===
  searchFunction: boolean;
  dictionaryFunction: boolean;
  logFunction: boolean;
  syncFunction: boolean;
  
  // === 拡張機能（部分実装・開発中） ===
  imageSupport: boolean;
  latexSupport: boolean;
  mermaidSupport: boolean;
  
  // === UI制御 ===
  showDevelopmentFeatures: boolean;
  showDevelopmentTags: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  // === MVP機能（常に有効） ===
  apiKeys: true,
  pdfGeneration: true,
  customPrompts: true,
  chunkingProcessing: true,
  retryExecution: true,

  // === 高度機能（開発中・無効化） ===
  searchFunction: false, // SearchService.ts は実装済みだが無効化
  dictionaryFunction: true, // ✅ Phase 1: 辞書機能有効化 - DB・IPC実装完了後
  logFunction: false, // LogService.ts は基盤のみ、UI無効化
  syncFunction: false, // SyncService.ts は実装済みだが無効化

  // === 拡張機能（部分実装・開発中） ===
  imageSupport: false, // 部分実装、PDF埋め込み未完成
  latexSupport: false, // KaTeX基盤のみ、プレビュー未実装
  mermaidSupport: true, // ✅ GPT-5レビュー準拠実装完了・有効化

  // === UI制御 ===
  showDevelopmentFeatures: process.env.NODE_ENV === 'development', // 開発環境でのみ表示
  showDevelopmentTags: true, // 開発中タグを表示
};

/**
 * 機能が有効かチェック
 */
export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  return FEATURE_FLAGS[feature];
};

/**
 * 開発中機能の表示制御
 */
export const shouldShowDevelopmentFeature = (feature: keyof FeatureFlags): boolean => {
  // 機能が有効、または開発環境で開発中機能表示が有効
  return FEATURE_FLAGS[feature] || FEATURE_FLAGS.showDevelopmentFeatures;
};

/**
 * 開発中タグの表示判定
 */
export const shouldShowDevelopmentTag = (feature: keyof FeatureFlags): boolean => {
  return !FEATURE_FLAGS[feature] && FEATURE_FLAGS.showDevelopmentTags;
};

/**
 * 機能のステータス取得
 */
export const getFeatureStatus = (feature: keyof FeatureFlags): 'enabled' | 'development' | 'disabled' => {
  if (FEATURE_FLAGS[feature]) {
    return 'enabled';
  }
  
  if (FEATURE_FLAGS.showDevelopmentFeatures) {
    return 'development';
  }
  
  return 'disabled';
};

/**
 * 開発中機能の表示用ラベル
 */
export const DEVELOPMENT_LABELS = {
  searchFunction: '🔍 検索機能 [開発中]',
  dictionaryFunction: '📚 辞書機能 [開発中]',
  logFunction: '📊 ログ機能 [開発中]',
  syncFunction: '🔄 同期機能 [開発中]',
  imageSupport: '📷 画像対応 [開発中]',
  latexSupport: '📐 LaTeX [開発中]',
  mermaidSupport: '📊 Mermaid [開発中]',
} as const;

/**
 * MVP機能の確認
 */
export const getMVPFeatureStatus = () => {
  const mvpFeatures: (keyof FeatureFlags)[] = [
    'apiKeys',
    'pdfGeneration', 
    'customPrompts',
    'chunkingProcessing',
    'retryExecution'
  ];

  const enabledCount = mvpFeatures.filter(feature => FEATURE_FLAGS[feature]).length;
  
  return {
    total: mvpFeatures.length,
    enabled: enabledCount,
    isComplete: enabledCount === mvpFeatures.length,
    completionRate: Math.round((enabledCount / mvpFeatures.length) * 100)
  };
};