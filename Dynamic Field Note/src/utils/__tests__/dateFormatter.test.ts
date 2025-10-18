/**
 * dateFormatter ユニットテスト
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
  });

  describe('formatDate', () => {
    it('should format ISO date string to Japanese date format', () => {
      const result = formatDate('2025-10-18T14:30:00.000Z');
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      expect(result).not.toMatch(/:/); // No time component
    });
  });

  describe('formatTime', () => {
    it('should format ISO date string to time only', () => {
      const result = formatTime('2025-10-18T14:30:00.000Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "たった今" for very recent times', () => {
      const now = new Date().toISOString();
      const result = formatRelativeTime(now);
      expect(result).toBe('たった今');
    });

    it('should return minutes ago for recent times', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = formatRelativeTime(fiveMinutesAgo);
      expect(result).toMatch(/\d+分前/);
    });

    it('should return hours ago for times within 24 hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(twoHoursAgo);
      expect(result).toMatch(/\d+時間前/);
    });

    it('should return days ago for times within 30 days', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(threeDaysAgo);
      expect(result).toMatch(/\d+日前/);
    });

    it('should return formatted date for times older than 30 days', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeTime(twoMonthsAgo);
      expect(result).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    });
  });
});
