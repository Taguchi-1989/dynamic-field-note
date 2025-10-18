/**
 * reportValidator ユニットテスト
 */

import {
  validateReportTitle,
  validateReportContent,
  validateReport,
  type ValidationError,
} from '../reportValidator';

describe('reportValidator', () => {
  describe('validateReportTitle', () => {
    it('should return error for empty title', () => {
      const result = validateReportTitle('');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('title');
      expect(result?.message).toContain('タイトルを入力してください');
    });

    it('should return error for whitespace-only title', () => {
      const result = validateReportTitle('   ');
      expect(result).not.toBeNull();
      expect(result?.field).toBe('title');
      expect(result?.message).toContain('タイトルを入力してください');
    });

    it('should return error for title longer than 100 characters', () => {
      const longTitle = 'A'.repeat(101);
      const result = validateReportTitle(longTitle);
      expect(result).not.toBeNull();
      expect(result?.field).toBe('title');
      expect(result?.message).toContain('100文字以内');
    });

    it('should return null for valid title', () => {
      const result = validateReportTitle('有効な報告書タイトル');
      expect(result).toBeNull();
    });

    it('should return null for title with exactly 100 characters', () => {
      const title = 'A'.repeat(100);
      const result = validateReportTitle(title);
      expect(result).toBeNull();
    });

    it('should return null for title with leading/trailing whitespace (will be trimmed)', () => {
      const result = validateReportTitle('  有効なタイトル  ');
      expect(result).toBeNull();
    });
  });

  describe('validateReportContent', () => {
    it('should return null for empty content', () => {
      const result = validateReportContent('');
      expect(result).toBeNull();
    });

    it('should return null for undefined content', () => {
      const result = validateReportContent(undefined);
      expect(result).toBeNull();
    });

    it('should return null for valid content', () => {
      const result = validateReportContent('これは有効な報告書内容です');
      expect(result).toBeNull();
    });

    it('should return null for very long content', () => {
      const longContent = 'A'.repeat(100000);
      const result = validateReportContent(longContent);
      expect(result).toBeNull();
    });
  });

  describe('validateReport', () => {
    it('should return valid result for valid report', () => {
      const result = validateReport('有効なタイトル', '有効な内容');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid result with error for empty title', () => {
      const result = validateReport('', '有効な内容');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('title');
    });

    it('should return invalid result with error for title too long', () => {
      const longTitle = 'A'.repeat(101);
      const result = validateReport(longTitle, '有効な内容');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('title');
    });

    it('should return valid result for valid title with no content', () => {
      const result = validateReport('有効なタイトル');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid result for valid title with empty content', () => {
      const result = validateReport('有効なタイトル', '');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accumulate multiple errors if validation rules are added', () => {
      // Currently only title validation exists
      const result = validateReport('', '');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
