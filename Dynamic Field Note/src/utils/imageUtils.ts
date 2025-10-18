/**
 * Image Utility Functions
 * 画像処理ユーティリティ
 * Phase 3.5.2: 写真サムネイル基盤
 */

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * サムネイル生成
 * @param uri 元画像URI
 * @param size サムネイルサイズ（正方形）
 * @returns サムネイルURI
 */
export const generateThumbnail = async (uri: string, size: number): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [
        {
          resize: {
            width: size,
            height: size,
          },
        },
      ],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.error('[imageUtils] Failed to generate thumbnail:', error);
    throw new Error('サムネイル生成に失敗しました');
  }
};
