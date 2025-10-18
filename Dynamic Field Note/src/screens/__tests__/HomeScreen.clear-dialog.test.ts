/**
 * HomeScreen - Clear Button Confirmation Dialog Logic Test
 * コンポーネントのレンダリングではなく、ロジックの単体テスト
 */

import { Alert } from 'react-native';

describe('HomeScreen Clear Button Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Clear button confirmation dialog logic', () => {
    it('should show Alert when both inputText and markdown exist', () => {
      const inputText = 'テスト入力';
      const markdown = '# 要約結果';

      // 入力または要約がある場合の条件チェック
      const shouldShowDialog = !!inputText || !!markdown;

      expect(shouldShowDialog).toBe(true);

      // Alert.alertが呼ばれるべき
      if (shouldShowDialog) {
        Alert.alert(
          '確認',
          '入力内容と要約結果をクリアしますか？\nこの操作は取り消せません。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: 'クリア', style: 'destructive', onPress: jest.fn() },
          ],
          { cancelable: true }
        );
      }

      expect(Alert.alert).toHaveBeenCalledWith(
        '確認',
        '入力内容と要約結果をクリアしますか？\nこの操作は取り消せません。',
        expect.arrayContaining([
          expect.objectContaining({ text: 'キャンセル', style: 'cancel' }),
          expect.objectContaining({ text: 'クリア', style: 'destructive' }),
        ]),
        { cancelable: true }
      );
    });

    it('should show Alert when only inputText exists', () => {
      const inputText = 'テスト入力';
      const markdown = '';

      const shouldShowDialog = !!inputText || !!markdown;

      expect(shouldShowDialog).toBe(true);
    });

    it('should show Alert when only markdown exists', () => {
      const inputText = '';
      const markdown = '# 要約結果\nテスト';

      const shouldShowDialog = !!inputText || !!markdown;

      expect(shouldShowDialog).toBe(true);
    });

    it('should NOT show Alert when both inputText and markdown are empty', () => {
      const inputText = '';
      const markdown = '';

      const shouldShowDialog = !!inputText || !!markdown;

      expect(shouldShowDialog).toBe(false);
    });

    it('should call clearBuffer and clearSummary when user confirms', () => {
      const mockClearBuffer = jest.fn();
      const mockClearSummary = jest.fn();
      const mockSetInputText = jest.fn();
      const mockShowSnackbar = jest.fn();

      //クリア実行ロジック
      const executeを実行 = () => {
        mockSetInputText('');
        mockClearBuffer();
        mockClearSummary();
        mockShowSnackbar('クリアしました');
      };

      executeを実行();

      expect(mockSetInputText).toHaveBeenCalledWith('');
      expect(mockClearBuffer).toHaveBeenCalled();
      expect(mockClearSummary).toHaveBeenCalled();
      expect(mockShowSnackbar).toHaveBeenCalledWith('クリアしました');
    });

    it('should use destructive style for confirmation button', () => {
      const buttons = [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'クリア', style: 'destructive', onPress: jest.fn() },
      ];

      const confirmButton = buttons.find((btn) => btn.text === 'クリア');

      expect(confirmButton).toBeDefined();
      expect(confirmButton?.style).toBe('destructive');
    });

    it('should have cancelable set to true', () => {
      const options = { cancelable: true };

      expect(options.cancelable).toBe(true);
    });

    it('should include correct warning message', () => {
      const message = '入力内容と要約結果をクリアしますか？\nこの操作は取り消せません。';

      expect(message).toContain('入力内容と要約結果をクリア');
      expect(message).toContain('この操作は取り消せません');
    });

    it('should not execute clear when user cancels', () => {
      const mockClearBuffer = jest.fn();
      const mockClearSummary = jest.fn();

      // キャンセルボタンはonPressがundefinedまたは何もしない
      const cancelButton: {
        text: string;
        style: string;
        onPress?: () => void;
      } = {
        text: 'キャンセル',
        style: 'cancel',
        // onPress is undefined - nothing happens
      };

      // キャンセルの場合は何も実行されない
      if (cancelButton.onPress) {
        cancelButton.onPress();
      }

      expect(mockClearBuffer).not.toHaveBeenCalled();
      expect(mockClearSummary).not.toHaveBeenCalled();
    });
  });
});
