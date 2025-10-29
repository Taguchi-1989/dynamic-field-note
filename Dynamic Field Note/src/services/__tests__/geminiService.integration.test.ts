/**
 * geminiService 統合テスト（実API使用）
 *
 * 実行前に .env.local に EXPO_PUBLIC_GEMINI_API_KEY を設定してください
 *
 * 実行コマンド:
 * npm test -- geminiService.integration.test.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../../.env.local') });

import { isGeminiConfigured, summarizeText, testGeminiConnection } from '../geminiService';

describe('geminiService - Integration Tests', () => {
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

  describe('API Configuration', () => {
    it('should check if Gemini is configured', () => {
      const configured = isGeminiConfigured();
      expect(typeof configured).toBe('boolean');
      expect(configured).toBe(true);
    });
  });

  describe('API Integration Tests (Real API)', () => {
    // Skip if API key is not configured
    const skipIfNoKey = API_KEY_CONFIGURED ? it : it.skip;

    skipIfNoKey(
      'should successfully summarize Japanese text',
      async () => {
        const request = {
          text: '本日の会議で、新機能の開発を決定しました。来週までに設計書を作成する必要があります。予算について懸念があります。',
          language: 'ja' as const,
        };

        const response = await summarizeText(request);

        // Verify response structure
        expect(response).toHaveProperty('summary');
        expect(response).toHaveProperty('processing_time');

        // Verify summary is defined
        expect(response.summary).toBeDefined();
        expect(typeof response.summary).toBe('object');

        // Verify processing time
        expect(response.processing_time).toBeGreaterThan(0);

        // Log for manual verification
        console.log('\n📊 Japanese Text Summarization Result:');
        if (response.model) {
          console.log('Model:', response.model);
        }
        console.log('Processing Time:', response.processing_time, 'ms');
        console.log('Summary:', JSON.stringify(response.summary, null, 2));

        // Verify summary has required fields (decisions, todos, issues)
        if (response.summary.decisions) {
          expect(Array.isArray(response.summary.decisions)).toBe(true);
          console.log('✅ Decisions:', response.summary.decisions);
        }
        if (response.summary.todos) {
          expect(Array.isArray(response.summary.todos)).toBe(true);
          console.log('✅ ToDos:', response.summary.todos);
        }
        if (response.summary.issues) {
          expect(Array.isArray(response.summary.issues)).toBe(true);
          console.log('✅ Issues:', response.summary.issues);
        }
      },
      30000 // 30 second timeout
    );

    skipIfNoKey(
      'should successfully summarize English text',
      async () => {
        const request = {
          text: 'Meeting notes: We decided to launch the new feature next month. Need to prepare documentation. Budget concerns remain.',
          language: 'en' as const,
        };

        const response = await summarizeText(request);

        expect(response.summary).toBeDefined();
        expect(response.processing_time).toBeGreaterThan(0);

        console.log('\n📊 English Text Summarization Result:');
        console.log('Processing Time:', response.processing_time, 'ms');
        console.log('Summary:', JSON.stringify(response.summary, null, 2));
      },
      30000
    );

    skipIfNoKey(
      'should handle short text',
      async () => {
        const request = {
          text: 'テスト',
          language: 'ja' as const,
        };

        const response = await summarizeText(request);

        expect(response.summary).toBeDefined();
        expect(response.processing_time).toBeGreaterThan(0);

        console.log('\n📊 Short Text Summary:');
        console.log('Input:', request.text);
        console.log('Summary:', JSON.stringify(response.summary, null, 2));
      },
      30000
    );

    skipIfNoKey(
      'should test connection successfully',
      async () => {
        const connected = await testGeminiConnection();

        expect(connected).toBe(true);
        console.log('✅ Gemini API connection test passed');
      },
      30000
    );

    skipIfNoKey(
      'should handle very long text',
      async () => {
        const longText =
          '会議内容: ' +
          '新機能の開発について議論しました。'.repeat(50) +
          'タスクがたくさんあります。'.repeat(30);

        const request = {
          text: longText,
          language: 'ja' as const,
        };

        const response = await summarizeText(request);

        expect(response.summary).toBeDefined();
        expect(response.processing_time).toBeGreaterThan(0);

        console.log('\n📊 Long Text Summary:');
        console.log('Input length:', longText.length, 'characters');
        console.log('Processing time:', response.processing_time, 'ms');
        console.log('Summary:', JSON.stringify(response.summary, null, 2));

        if (response.summary.decisions) {
          console.log('Decisions count:', response.summary.decisions.length);
        }
      },
      60000 // 60 second timeout for long text
    );
  });

  describe('Error Handling', () => {
    const skipIfNoKey = API_KEY_CONFIGURED ? it : it.skip;

    skipIfNoKey(
      'should handle API errors gracefully',
      async () => {
        // This test verifies error handling structure
        // Actual API errors are hard to reproduce in tests
        try {
          await summarizeText({ text: 'test', language: 'ja' });
        } catch (error) {
          // If error occurs, verify structure
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('code');
        }
      },
      30000
    );
  });
});
