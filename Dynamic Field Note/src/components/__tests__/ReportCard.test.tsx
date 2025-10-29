/**
 * ReportCard コンポーネントのテスト
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ReportCard } from '../ReportCard';
import type { Report } from '../../types/case';

// モックレポートデータ
const mockReport: Report = {
  id: 1,
  case_id: 1,
  title: 'テスト報告書',
  content: 'これはテスト報告書の内容です。',
  voice_buffer: null,
  summary_json: null,
  processing_time: null,
  is_deleted: 0,
  created_at: '2025-10-28T10:00:00.000Z',
  updated_at: '2025-10-28T12:00:00.000Z',
};

const mockLongContentReport: Report = {
  ...mockReport,
  id: 2,
  content:
    'これは非常に長いテキストです。100文字を超える場合は省略記号が表示されるはずです。これは非常に長いテキストです。100文字を超える場合は省略記号が表示されるはずです。これは非常に長いテキストです。さらに追加のテキストを入れて確実に100文字を超えるようにします。',
};

const mockNoContentReport: Report = {
  ...mockReport,
  id: 3,
  content: null,
};

describe('ReportCard', () => {
  const mockOnPress = jest.fn();
  const mockOnLongPress = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render report title', () => {
    render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('テスト報告書')).toBeTruthy();
  });

  it('should render creation and update dates', () => {
    render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // 日付表示を確認（formatDateTimeの結果を含む）
    expect(screen.getByText(/作成:/)).toBeTruthy();
    expect(screen.getByText(/更新:/)).toBeTruthy();
  });

  it('should render content preview when content exists', () => {
    render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('これはテスト報告書の内容です。')).toBeTruthy();
  });

  it('should truncate long content with ellipsis', () => {
    render(
      <ReportCard
        report={mockLongContentReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // 最初の100文字 + "..." が表示される
    const contentElement = screen.getByText(/これは非常に長いテキストです/);
    expect(contentElement).toBeTruthy();

    // children is an array with [substring(0, 100), '...']
    const children = contentElement.props.children;
    expect(Array.isArray(children)).toBe(true);
    // Check if the second element is the ellipsis
    expect(children.length).toBe(2);
    expect(children[1]).toBe('...');
  });

  it('should not render content preview when content is null', () => {
    render(
      <ReportCard
        report={mockNoContentReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // タイトルは表示されるが、contentは表示されない
    expect(screen.getByText('テスト報告書')).toBeTruthy();
    expect(screen.queryByText(/これはテスト報告書の内容です/)).toBeNull();
  });

  it('should call onPress when card is pressed', () => {
    render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const card = screen.getByText('テスト報告書').parent?.parent?.parent;
    fireEvent.press(card!);

    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should call onLongPress when card is long pressed', () => {
    render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const card = screen.getByText('テスト報告書').parent?.parent?.parent;
    fireEvent(card!, 'longPress');

    expect(mockOnLongPress).toHaveBeenCalledTimes(1);
  });

  it('should open menu when dots-vertical icon is pressed', () => {
    const { getByLabelText } = render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // メニューボタンを押す
    const menuButton = getByLabelText('dots-vertical');
    fireEvent.press(menuButton);

    // メニューアイテムが表示されることを確認
    expect(screen.getByText('編集')).toBeTruthy();
    expect(screen.getByText('削除')).toBeTruthy();
  });

  it('should call onEdit when edit menu item is pressed', () => {
    const { getByLabelText } = render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // メニューを開く
    const menuButton = getByLabelText('dots-vertical');
    fireEvent.press(menuButton);

    // 編集メニューアイテムを押す
    const editMenuItem = screen.getByText('編集');
    fireEvent.press(editMenuItem);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete menu item is pressed', () => {
    const { getByLabelText } = render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // メニューを開く
    const menuButton = getByLabelText('dots-vertical');
    fireEvent.press(menuButton);

    // 削除メニューアイテムを押す
    const deleteMenuItem = screen.getByText('削除');
    fireEvent.press(deleteMenuItem);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should not throw error when rendered', () => {
    expect(() =>
      render(
        <ReportCard
          report={mockReport}
          onPress={mockOnPress}
          onLongPress={mockOnLongPress}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )
    ).not.toThrow();
  });

  it('should render with all required props', () => {
    render(
      <ReportCard
        report={mockReport}
        onPress={mockOnPress}
        onLongPress={mockOnLongPress}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // タイトルが正しく表示されることを確認
    expect(screen.getByText('テスト報告書')).toBeTruthy();
  });
});
