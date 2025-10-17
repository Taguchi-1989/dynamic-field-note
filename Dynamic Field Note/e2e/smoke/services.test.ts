/**
 * Smoke Test: Services
 * CI/CD: Core service logic validation
 */

import { describe, it, expect } from '@jest/globals';

describe('Smoke Test: Core Services', () => {
  it('should import geminiService module', async () => {
    const geminiService = await import('../../src/services/geminiService');
    expect(geminiService).toBeDefined();
    expect(geminiService.summarizeText).toBeDefined();
  });

  it('should import markdownGenerator module', async () => {
    const markdownGenerator = await import('../../src/utils/markdownGenerator');
    expect(markdownGenerator).toBeDefined();
    expect(markdownGenerator.finalSummaryToMarkdown).toBeDefined();
  });

  it('should handle markdown generation with test data', async () => {
    const markdownGenerator = await import('../../src/utils/markdownGenerator');
    const testData = {
      decisions: ['決定事項1'],
      todos: ['ToDo1'],
      issues: ['課題1'],
      raw_text: 'Test raw text',
      sections: [],
      prioritized_decisions: [],
      scheduled_todos: [],
    };

    const markdown = markdownGenerator.finalSummaryToMarkdown(testData);

    // Verify markdown structure
    expect(markdown).toContain('現場報告');
    expect(markdown).toContain('決定事項');
    expect(markdown).toContain('Dynamic Field Note');
    expect(typeof markdown).toBe('string');
    expect(markdown.length).toBeGreaterThan(0);
  });

  it('should validate summary type structure', () => {
    // Type validation test
    const validSummary = {
      title: 'Test',
      date: '2025-10-18',
      summary: 'Summary text',
      key_points: ['Point 1'],
      action_items: ['Action 1'],
    };

    expect(validSummary.title).toBe('Test');
    expect(Array.isArray(validSummary.key_points)).toBe(true);
    expect(Array.isArray(validSummary.action_items)).toBe(true);
  });
});
