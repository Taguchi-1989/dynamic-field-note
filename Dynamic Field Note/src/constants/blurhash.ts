/**
 * Blurhash Constants
 * 画像プレースホルダー用のblurhash定数
 */

/**
 * デフォルトのblurhash
 * グレーのグラデーション
 */
export const DEFAULT_BLURHASH = 'L6Pj0^jE.AyE_3t7t7R**0o#DgR4';

/**
 * Blurhash設定
 */
export const BLURHASH_CONFIG = {
  /**
   * トランジション時間（ms）
   */
  transitionDuration: 200,

  /**
   * キャッシュポリシー
   */
  cachePolicy: 'memory-disk' as const,
};
