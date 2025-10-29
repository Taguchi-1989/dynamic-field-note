/**
 * useSummarize 統合テスト（実API使用）
 *
 * 実行前に .env.local に EXPO_PUBLIC_GEMINI_API_KEY を設定してください
 *
 * 実行コマンド:
 * npm test -- useSummarize.integration.test.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../../.env.local') });

import { useSummarize } from '../useSummarize';
import { isGeminiConfigured } from '../../services/geminiService';

describe('useSummarize - Integration Tests', () => {
  // Skip all tests if API key is not configured
  const API_KEY_CONFIGURED = isGeminiConfigured();

  beforeAll(() => {
    if (!API_KEY_CONFIGURED) {
      console.warn(
        '\n⚠️  Gemini API Key is not configured. Skipping integration tests.\n' +
          'Please set EXPO_PUBLIC_GEMINI_API_KEY in .env.local to run these tests.\n'
      );
    }
  });

  describe('Configuration Check', () => {
    it('should verify API key is configured', () => {
      expect(API_KEY_CONFIGURED).toBe(true);
    });
  });

  describe('API Integration Tests (Real API)', () => {
    const skipIfNoKey = API_KEY_CONFIGURED ? it : it.skip;

    skipIfNoKey(
      'should successfully summarize Japanese text',
      async () => {
        const { result } = renderHook(() => useSummarize());

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();

        await act(async () => {
          await result.current.executeSummarize(
            '本日の会議で、新機能の開発を決定しました。来週までに設計書を作成する必要があります。予算について懸念があります。'
          );
        });

        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 30000 }
        );

        // Verify results
        expect(result.current.error).toBeNull();
        expect(result.current.summary).toBeDefined();
        expect(result.current.markdown).toBeDefined();
        expect(result.current.markdown.length).toBeGreaterThan(0);
        expect(result.current.processingTime).toBeGreaterThan(0);

        console.log('\n📊 useSummarize Japanese Text Result:');
        console.log('Processing Time:', result.current.processingTime, 'ms');
        console.log('Summary:', result.current.summary);
        console.log('Markdown Preview:', result.current.markdown.substring(0, 200) + '...');
      },
      35000
    );

    skipIfNoKey(
      'should handle progress callback',
      async () => {
        const progressValues: number[] = [];
        const onProgress = jest.fn((progress: number) => {
          progressValues.push(progress);
        });

        const { result } = renderHook(() => useSummarize({ onProgress }));

        await act(async () => {
          await result.current.executeSummarize('テスト用のテキストです。');
        });

        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 30000 }
        );

        // Verify progress callback was called
        expect(onProgress).toHaveBeenCalled();
        expect(progressValues.length).toBeGreaterThan(0);

        // Verify progress values are in range [0, 1]
        progressValues.forEach((p) => {
          expect(p).toBeGreaterThanOrEqual(0);
          expect(p).toBeLessThanOrEqual(1);
        });

        // Verify progress increases monotonically
        for (let i = 1; i < progressValues.length; i++) {
          expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
        }

        console.log('\n📊 Progress Values:', progressValues);
        console.log('Progress Callback Called:', onProgress.mock.calls.length, 'times');
      },
      35000
    );

    skipIfNoKey(
      'should handle short text',
      async () => {
        const { result } = renderHook(() => useSummarize());

        await act(async () => {
          await result.current.executeSummarize('短いテスト。');
        });

        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 30000 }
        );

        expect(result.current.error).toBeNull();
        expect(result.current.summary).toBeDefined();
        expect(result.current.markdown).toBeDefined();

        console.log('\n📊 Short Text Result:');
        console.log('Summary:', result.current.summary);
      },
      35000
    );

    skipIfNoKey(
      'should handle long text',
      async () => {
        const longText =
          '会議の議題: ' +
          '新機能の開発について詳細に議論しました。'.repeat(30) +
          'いくつかの課題が見つかりました。'.repeat(20);

        const { result } = renderHook(() => useSummarize());

        await act(async () => {
          await result.current.executeSummarize(longText);
        });

        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 60000 }
        );

        expect(result.current.error).toBeNull();
        expect(result.current.summary).toBeDefined();
        expect(result.current.markdown).toBeDefined();

        console.log('\n📊 Long Text Result:');
        console.log('Input Length:', longText.length, 'characters');
        console.log('Processing Time:', result.current.processingTime, 'ms');
        console.log('Markdown Length:', result.current.markdown.length, 'characters');
      },
      65000
    );

    skipIfNoKey(
      'should handle clearSummary correctly',
      async () => {
        const { result } = renderHook(() => useSummarize());

        // Execute summarize
        await act(async () => {
          await result.current.executeSummarize('テスト');
        });

        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 30000 }
        );

        expect(result.current.summary).toBeDefined();
        expect(result.current.markdown).not.toBe('');

        // Clear summary
        act(() => {
          result.current.clearSummary();
        });

        expect(result.current.summary).toBeNull();
        expect(result.current.markdown).toBe('');
        expect(result.current.error).toBeNull();
        expect(result.current.processingTime).toBe(0);

        console.log('✅ Clear summary successful');
      },
      35000
    );

    skipIfNoKey(
      'should handle retry correctly',
      async () => {
        const { result } = renderHook(() => useSummarize());

        // First execution
        await act(async () => {
          await result.current.executeSummarize('最初のテスト');
        });

        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 30000 }
        );

        const firstSummary = result.current.summary;
        expect(firstSummary).toBeDefined();

        // Retry
        await act(async () => {
          await result.current.retry();
        });

        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 30000 }
        );

        // Should have a new summary
        expect(result.current.summary).toBeDefined();
        expect(result.current.error).toBeNull();

        console.log('✅ Retry successful');
        console.log('First Summary:', firstSummary);
        console.log('Retry Summary:', result.current.summary);
      },
      65000
    );
  });

  describe('Error Handling', () => {
    it('should handle empty text', async () => {
      const { result } = renderHook(() => useSummarize());

      await act(async () => {
        await result.current.executeSummarize('');
      });

      expect(result.current.error).toBe('テキストが空です');
      expect(result.current.summary).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle whitespace-only text', async () => {
      const { result } = renderHook(() => useSummarize());

      await act(async () => {
        await result.current.executeSummarize('   ');
      });

      expect(result.current.error).toBe('テキストが空です');
      expect(result.current.summary).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useSummarize());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.summary).toBeNull();
      expect(result.current.markdown).toBe('');
      expect(result.current.processingTime).toBe(0);
      expect(result.current.progress).toBe(0);
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress values', async () => {
      const { result } = renderHook(() => useSummarize());

      expect(result.current.progress).toBe(0);

      // Progress should be reset when starting
      // We can't easily test intermediate progress values without the real API
    });
  });
});
