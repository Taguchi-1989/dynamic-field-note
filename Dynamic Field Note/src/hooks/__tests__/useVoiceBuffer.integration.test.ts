/**
 * useVoiceBuffer 統合テスト（タイマー管理）
 *
 * 実行コマンド:
 * npm test -- useVoiceBuffer.integration.test.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVoiceBuffer } from '../useVoiceBuffer';

// Jest fake timers を使用
jest.useFakeTimers();

describe('useVoiceBuffer - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('基本動作', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useVoiceBuffer());

      expect(result.current.buffer).toEqual([]);
      expect(result.current.fullText).toBe('');
      expect(result.current.isReadyToSend).toBe(false);
      expect(result.current.sendReason).toBeNull();
      expect(result.current.timeSinceLastInput).toBe(0);
    });

    it('should accept custom configuration', () => {
      const { result } = renderHook(() =>
        useVoiceBuffer({
          bufferInterval: 10000,
          autoSendInterval: 60000,
          silenceThreshold: 5000,
        })
      );

      expect(result.current.buffer).toEqual([]);
      expect(result.current.fullText).toBe('');
    });
  });

  describe('テキスト追加機能', () => {
    it('should add text to current buffer', () => {
      const { result } = renderHook(() => useVoiceBuffer());

      act(() => {
        result.current.addText('こんにちは');
      });

      expect(result.current.fullText).toContain('こんにちは');
    });

    it('should ignore empty text', () => {
      const { result } = renderHook(() => useVoiceBuffer());

      act(() => {
        result.current.addText('');
      });

      expect(result.current.fullText).toBe('');
    });

    it('should ignore whitespace-only text', () => {
      const { result } = renderHook(() => useVoiceBuffer());

      act(() => {
        result.current.addText('   ');
      });

      expect(result.current.fullText).toBe('');
    });

    it('should handle multiple text additions', () => {
      const { result } = renderHook(() =>
        useVoiceBuffer({
          bufferInterval: 1000,
        })
      );

      act(() => {
        result.current.addText('最初のテキスト');
      });

      // Wait for buffer interval
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.addText('2番目のテキスト');
      });

      expect(result.current.fullText).toContain('最初のテキスト');
      expect(result.current.fullText).toContain('2番目のテキスト');
    });
  });

  describe('バッファ間隔機能', () => {
    it('should move text to buffer after interval', () => {
      const { result } = renderHook(() =>
        useVoiceBuffer({
          bufferInterval: 5000,
        })
      );

      act(() => {
        result.current.addText('テスト');
      });

      expect(result.current.fullText).toBe('テスト');
      expect(result.current.buffer.length).toBe(0);

      // Advance by buffer interval
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.buffer.length).toBe(1);
      expect(result.current.buffer[0]).toBe('テスト');
    });

    it('should accumulate multiple buffer entries', () => {
      const { result } = renderHook(() =>
        useVoiceBuffer({
          bufferInterval: 1000,
        })
      );

      act(() => {
        result.current.addText('1番目');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.addText('2番目');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.addText('3番目');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.buffer.length).toBe(3);
      expect(result.current.buffer).toEqual(['1番目', '2番目', '3番目']);
    });
  });

  describe('無音検知機能', () => {
    it('should trigger send after silence threshold', () => {
      const onSendReady = jest.fn();
      const { result } = renderHook(() =>
        useVoiceBuffer(
          {
            bufferInterval: 60000, // 1分（テスト中に発火しないように）
            silenceThreshold: 30000, // 30秒
          },
          onSendReady
        )
      );

      act(() => {
        result.current.addText('無音テスト');
      });

      expect(result.current.isReadyToSend).toBe(false);

      // Advance by silence threshold
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(result.current.isReadyToSend).toBe(true);
      expect(result.current.sendReason).toBe('silence');
      expect(onSendReady).toHaveBeenCalledWith('無音テスト', 'silence');
    });

    it('should reset silence timer on new input', () => {
      const onSendReady = jest.fn();
      const { result } = renderHook(() =>
        useVoiceBuffer(
          {
            silenceThreshold: 10000, // 10秒
          },
          onSendReady
        )
      );

      act(() => {
        result.current.addText('最初');
      });

      // Advance 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      // Add new text (resets silence timer)
      act(() => {
        result.current.addText('追加');
      });

      // Advance another 5 seconds (total 10, but timer was reset)
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.isReadyToSend).toBe(false);

      // Advance remaining 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.isReadyToSend).toBe(true);
      expect(result.current.sendReason).toBe('silence');
    });
  });

  describe('自動送信機能', () => {
    it('should trigger send after auto send interval', () => {
      const onSendReady = jest.fn();
      const { result } = renderHook(() =>
        useVoiceBuffer(
          {
            bufferInterval: 120000, // 2分（テスト中に発火しないように）
            autoSendInterval: 60000, // 1分
            silenceThreshold: 120000, // 2分 (auto send should trigger first)
          },
          onSendReady
        )
      );

      act(() => {
        result.current.addText('自動送信テスト');
      });

      // Advance by auto send interval
      act(() => {
        jest.advanceTimersByTime(60000);
      });

      expect(result.current.isReadyToSend).toBe(true);
      expect(result.current.sendReason).toBe('auto');
      expect(onSendReady).toHaveBeenCalledWith('自動送信テスト', 'auto');
    });

    it('should not trigger auto send if buffer is empty', () => {
      const onSendReady = jest.fn();
      renderHook(() =>
        useVoiceBuffer(
          {
            autoSendInterval: 10000,
          },
          onSendReady
        )
      );

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onSendReady).not.toHaveBeenCalled();
    });
  });

  describe('手動送信機能', () => {
    it('should trigger manual send', () => {
      const onSendReady = jest.fn();
      const { result } = renderHook(() => useVoiceBuffer({}, onSendReady));

      act(() => {
        result.current.addText('手動送信');
      });

      act(() => {
        result.current.triggerSend();
      });

      expect(result.current.isReadyToSend).toBe(true);
      expect(result.current.sendReason).toBe('manual');
      expect(onSendReady).toHaveBeenCalledWith('手動送信', 'manual');
    });

    it('should not trigger send if buffer is empty', () => {
      const { result } = renderHook(() => useVoiceBuffer());

      act(() => {
        result.current.triggerSend();
      });

      expect(result.current.isReadyToSend).toBe(false);
      expect(result.current.sendReason).toBeNull();
    });
  });

  describe('クリア機能', () => {
    it('should clear buffer and reset state', () => {
      const { result } = renderHook(() =>
        useVoiceBuffer({
          bufferInterval: 1000,
        })
      );

      act(() => {
        result.current.addText('テスト1');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.addText('テスト2');
      });

      expect(result.current.buffer.length).toBeGreaterThan(0);
      expect(result.current.fullText).not.toBe('');

      act(() => {
        result.current.clearBuffer();
      });

      expect(result.current.buffer).toEqual([]);
      expect(result.current.fullText).toBe('');
      expect(result.current.isReadyToSend).toBe(false);
      expect(result.current.sendReason).toBeNull();
      expect(result.current.timeSinceLastInput).toBe(0);
    });

    it('should clear all timers', () => {
      const onSendReady = jest.fn();
      const { result } = renderHook(() =>
        useVoiceBuffer(
          {
            silenceThreshold: 10000,
            autoSendInterval: 20000,
          },
          onSendReady
        )
      );

      act(() => {
        result.current.addText('テスト');
      });

      act(() => {
        result.current.clearBuffer();
      });

      // Advance time - no callbacks should be triggered
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(onSendReady).not.toHaveBeenCalled();
      expect(result.current.isReadyToSend).toBe(false);
    });
  });

  describe('経過時間トラッキング', () => {
    it('should track time since last input', () => {
      const { result } = renderHook(() => useVoiceBuffer());

      act(() => {
        result.current.addText('テスト');
      });

      expect(result.current.timeSinceLastInput).toBe(0);

      // Advance 5 seconds
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.timeSinceLastInput).toBeGreaterThanOrEqual(5);
    });

    it('should reset time on new input', () => {
      const { result } = renderHook(() => useVoiceBuffer());

      act(() => {
        result.current.addText('最初');
      });

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.timeSinceLastInput).toBeGreaterThanOrEqual(10);

      act(() => {
        result.current.addText('追加');
      });

      expect(result.current.timeSinceLastInput).toBe(0);
    });
  });

  describe('フルテキスト生成', () => {
    it('should generate full text from buffer and current text', () => {
      const { result } = renderHook(() =>
        useVoiceBuffer({
          bufferInterval: 1000,
        })
      );

      act(() => {
        result.current.addText('パート1');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.addText('パート2');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.addText('パート3');
      });

      const fullText = result.current.fullText;
      expect(fullText).toContain('パート1');
      expect(fullText).toContain('パート2');
      expect(fullText).toContain('パート3');
    });

    it('should filter out empty strings', () => {
      const { result } = renderHook(() =>
        useVoiceBuffer({
          bufferInterval: 1000,
        })
      );

      act(() => {
        result.current.addText('有効');
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      act(() => {
        result.current.addText('   '); // This should be ignored
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.fullText).toBe('有効');
    });
  });

  describe('コールバック統合', () => {
    it('should call onSendReady with correct parameters', () => {
      const onSendReady = jest.fn();
      const { result } = renderHook(() =>
        useVoiceBuffer(
          {
            bufferInterval: 10000, // 10秒（テスト中に発火しないように）
            silenceThreshold: 5000,
          },
          onSendReady
        )
      );

      act(() => {
        result.current.addText('コールバックテスト');
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onSendReady).toHaveBeenCalledTimes(1);
      expect(onSendReady).toHaveBeenCalledWith('コールバックテスト', 'silence');
    });

    it('should not call onSendReady if text is empty', () => {
      const onSendReady = jest.fn();
      const { result } = renderHook(() =>
        useVoiceBuffer(
          {
            silenceThreshold: 5000,
          },
          onSendReady
        )
      );

      // Don't add any text
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(onSendReady).not.toHaveBeenCalled();
    });
  });
});
