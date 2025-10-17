/**
 * Comprehensive E2E Test: Voice Buffer Flow
 * Local execution only - complete user workflow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';

jest.setTimeout(30000); // 30 seconds for comprehensive tests

describe('Comprehensive E2E: Voice Buffer Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle complete voice input workflow', async () => {
    render(<HomeScreen />);

    // Step 1: Input text
    const input = screen.getByPlaceholderText(/音声入力または手動でメモを入力してください/i);
    fireEvent.changeText(input, '会議メモ: Phase 2完了しました。次はPhase 3の実装を開始します。');

    // Step 2: Verify buffer info updates
    await waitFor(() => {
      const bufferInfo = screen.getByText(/バッファ:/);
      expect(bufferInfo).toBeTruthy();
    });

    // Step 3: Click summarize button
    const summarizeButton = screen.getByText('要約実行');
    expect(summarizeButton).toBeTruthy();
    expect(summarizeButton).not.toBeDisabled();

    fireEvent.press(summarizeButton);

    // Step 4: Verify loading state
    await waitFor(() => {
      const loadingText = screen.getByText(/Gemini AIで要約中/i);
      expect(loadingText).toBeTruthy();
    });

    // Step 5: Wait for summary completion
    await waitFor(
      () => {
        const completionMessage = screen.queryByText(/完了しました/);
        expect(completionMessage).toBeTruthy();
      },
      { timeout: 15000 }
    );
  });

  it('should handle buffer state management', async () => {
    render(<HomeScreen />);

    const input = screen.getByPlaceholderText(/音声入力または手動でメモを入力してください/i);

    // Add multiple text inputs
    fireEvent.changeText(input, 'First input');
    await waitFor(() => {
      expect(screen.getByText(/バッファ:/)).toBeTruthy();
    });

    fireEvent.changeText(input, 'First input\nSecond input');
    await waitFor(() => {
      expect(screen.getByText(/バッファ:/)).toBeTruthy();
    });

    // Clear buffer
    const clearButton = screen.getByText('クリア');
    fireEvent.press(clearButton);

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });
  });

  it('should show error handling for empty input', async () => {
    render(<HomeScreen />);

    const summarizeButton = screen.getByText('要約実行');

    // Attempt to summarize without input
    fireEvent.press(summarizeButton);

    await waitFor(() => {
      const errorMessage = screen.getByText(/テキストを入力してください/i);
      expect(errorMessage).toBeTruthy();
    });
  });
});
