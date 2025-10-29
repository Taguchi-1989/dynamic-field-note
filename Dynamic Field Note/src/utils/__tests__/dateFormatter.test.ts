/**
 * dateFormatter ユニットテスト
 * 目標カバレッジ: 80%以上
 */

import { formatDateTime, formatDate, formatTime, formatRelativeTime } from '../dateFormatter';

describe('dateFormatter', () => {
  describe('formatDateTime', () => {
    it('should format ISO date string to Japanese datetime format', () => {
      const result = formatDateTime('2025-10-18T14:30:00.000Z');
      // Note: Result depends on timezone, so we just check format structure
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle different ISO formats', () => {
      const result = formatDateTime('2025-01-01T00:00:00Z');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should handle ISO format without milliseconds', () => {
      const result = formatDateTime('2025-12-31T23:59:59Z');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle ISO format with timezone offset', () => {
      const result = formatDateTime('2025-06-15T10:30:00+09:00');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should include both date and time components', () => {
      const result = formatDateTime('2025-03-20T08:15:00Z');
      // 日付部分
      expect(result).toContain('2025');
      // 時刻部分（最低限フォーマットが含まれること）
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string to Japanese date format', () => {
      const result = formatDate('2025-10-18T14:30:00.000Z');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect(result).not.toMatch(/:/); // No time component
    });

    it('should only include date without time', () => {
      const result = formatDate('2025-12-25T23:59:59Z');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      // 時刻部分が含まれていないことを確認
      expect(result).not.toMatch(/\d{2}:\d{2}/);
    });

    it('should handle beginning of year', () => {
      const result = formatDate('2025-01-01T00:00:00Z');
      expect(result).toContain('2025');
      expect(result).toMatch(/01/);
    });

    it('should handle end of year', () => {
      const result = formatDate('2025-12-31T12:00:00Z');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      // Check it's a valid date format (timezone-independent)
      expect(result).toMatch(/\/(12|01)\//); // Month 12 or 01 depending on timezone
    });

    it('should handle leap year date', () => {
      const result = formatDate('2024-02-29T12:00:00Z');
      expect(result).toContain('2024');
      expect(result).toMatch(/02/);
      expect(result).toMatch(/29/);
    });
  });

  describe('formatTime', () => {
    it('should format ISO date string to time only', () => {
      const result = formatTime('2025-10-18T14:30:00.000Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should only include time without date', () => {
      const result = formatTime('2025-12-25T15:45:30Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
      // 日付部分が含まれていないことを確認（年が含まれない）
      expect(result).not.toMatch(/2025/);
      expect(result).not.toMatch(/\d{4}/);
    });

    it('should handle midnight', () => {
      const result = formatTime('2025-01-01T00:00:00Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle end of day', () => {
      const result = formatTime('2025-01-01T23:59:59Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle noon', () => {
      const result = formatTime('2025-06-15T12:00:00Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "たった今" for very recent times', () => {
      const now = new Date().toISOString();
      const result = formatRelativeTime(now);
      expect(result).toBe('たった今');
    });

    it('should return "たった今" for times less than 1 minute ago', () => {
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();
      const result = formatRelativeTime(thirtySecondsAgo);
      expect(result).toBe('たった今');
    });

    it('should return minutes ago for 1 minute (boundary test)', () => {
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000).toISOString();
      const result = formatRelativeTime(oneMinuteAgo);
      expect(result).toBe('1分前');
    });

    it('should return minutes ago for recent times', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toBe('5分前');
    });

    it('should return minutes ago for 59 minutes (boundary test)', () => {
      const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000).toISOString();
      const result = formatRelativeTime(fiftyNineMinutesAgo);
      expect(result).toBe('59分前');
    });

    it('should return hours ago for 1 hour (boundary test)', () => {
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(oneHourAgo);
      expect(result).toBe('1時間前');
    });

    it('should return hours ago for times within 24 hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toBe('2時間前');
    });

    it('should return hours ago for 23 hours (boundary test)', () => {
      const twentyThreeHoursAgo = new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(twentyThreeHoursAgo);
      expect(result).toBe('23時間前');
    });

    it('should return days ago for 1 day (boundary test)', () => {
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(oneDayAgo);
      expect(result).toBe('1日前');
    });

    it('should return days ago for times within 30 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(threeDaysAgo);
      expect(result).toBe('3日前');
    });

    it('should return days ago for 29 days (boundary test)', () => {
      const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(twentyNineDaysAgo);
      expect(result).toBe('29日前');
    });

    it('should return formatted date for exactly 30 days (boundary test)', () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(thirtyDaysAgo);
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    });

    it('should return formatted date for times older than 30 days', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(twoMonthsAgo);
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    });

    it('should return formatted date for very old dates', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(oneYearAgo);
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect(result).not.toMatch(/前$/); // Should not end with "前"
    });
  });
});
