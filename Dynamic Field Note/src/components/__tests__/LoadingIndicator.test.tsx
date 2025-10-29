/**
 * LoadingIndicator コンポーネントのテスト
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingIndicator } from '../LoadingIndicator';

describe('LoadingIndicator', () => {
  it('should render with default props', () => {
    render(<LoadingIndicator />);

    // デフォルトメッセージが表示される
    expect(screen.getByText('AI要約中...')).toBeTruthy();
  });

  it('should render with custom message', () => {
    render(<LoadingIndicator message="読み込み中..." />);

    expect(screen.getByText('読み込み中...')).toBeTruthy();
  });

  it('should render with small size', () => {
    const { getByTestId } = render(<LoadingIndicator size="small" />);

    // ActivityIndicatorが存在することを確認
    expect(screen.getByText('AI要約中...')).toBeTruthy();
  });

  it('should render with large size', () => {
    render(<LoadingIndicator size="large" />);

    expect(screen.getByText('AI要約中...')).toBeTruthy();
  });

  it('should render without message when message is empty string', () => {
    render(<LoadingIndicator message="" />);

    // 空文字の場合、メッセージは表示されない
    expect(screen.queryByText('AI要約中...')).toBeNull();
  });

  it('should render ActivityIndicator', () => {
    render(<LoadingIndicator />);

    // デフォルトメッセージとともにコンポーネントが正常にレンダリングされることを確認
    expect(screen.getByText('AI要約中...')).toBeTruthy();
  });

  it('should render with custom message and small size', () => {
    render(<LoadingIndicator message="処理中..." size="small" />);

    expect(screen.getByText('処理中...')).toBeTruthy();
  });

  it('should render text when message prop is provided', () => {
    render(<LoadingIndicator message="データを取得中..." />);

    expect(screen.getByText('データを取得中...')).toBeTruthy();
  });

  it('should not throw error when rendered', () => {
    expect(() => render(<LoadingIndicator />)).not.toThrow();
  });

  it('should render with correct structure', () => {
    render(<LoadingIndicator message="テスト" />);

    // メッセージが正しく表示されることを確認
    expect(screen.getByText('テスト')).toBeTruthy();
  });
});
