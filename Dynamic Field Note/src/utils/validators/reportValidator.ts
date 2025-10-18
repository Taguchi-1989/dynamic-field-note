/**
 * 報告書バリデーター
 * Phase 3.4 Refactoring: UIから独立したバリデーションロジック
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ReportValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * タイトルのバリデーション
 */
export const validateReportTitle = (title: string): ValidationError | null => {
  if (!title.trim()) {
    return {
      field: 'title',
      message: 'タイトルを入力してください',
    };
  }

  if (title.length > 100) {
    return {
      field: 'title',
      message: 'タイトルは100文字以内で入力してください',
    };
  }

  return null;
};

/**
 * 内容のバリデーション (オプション)
 */
export const validateReportContent = (_content?: string): ValidationError | null => {
  // 現時点では内容に制限なし
  // 将来的に最大文字数制限などを追加可能
  return null;
};

/**
 * 報告書全体のバリデーション
 */
export const validateReport = (title: string, content?: string): ReportValidationResult => {
  const errors: ValidationError[] = [];

  const titleError = validateReportTitle(title);
  if (titleError) {
    errors.push(titleError);
  }

  const contentError = validateReportContent(content);
  if (contentError) {
    errors.push(contentError);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
