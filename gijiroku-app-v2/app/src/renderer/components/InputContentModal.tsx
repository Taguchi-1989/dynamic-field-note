/**
 * @fileoverview Content editing modal component
 * @module components/InputContentModal
 */

import React, { useState, useCallback, memo, useEffect } from 'react';
import './InputContentModal.css';

/**
 * Default modal title
 */
const DEFAULT_TITLE = 'コンテンツ編集';

/**
 * Placeholder text for textarea
 */
const PLACEHOLDER_TEXT = 'コンテンツを入力してください...';

/**
 * Props for InputContentModal component
 */
interface InputContentModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback fired when modal should close */
  onClose: () => void;
  /** Initial content to edit */
  content: string;
  /** Callback fired when content is saved */
  onSave: (content: string) => void;
  /** Optional modal title (default: "コンテンツ編集") */
  title?: string;
}

/**
 * Content editing modal component
 *
 * Provides a modal dialog for editing text content with save/cancel actions.
 * Syncs internal state with the content prop when modal opens.
 *
 * @example
 * ```tsx
 * <InputContentModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   content={currentContent}
 *   onSave={(newContent) => handleSave(newContent)}
 *   title="テキスト編集"
 * />
 * ```
 */
const InputContentModal: React.FC<InputContentModalProps> = memo(({
  isOpen,
  onClose,
  content,
  onSave,
  title = DEFAULT_TITLE,
}) => {
  /**
   * Edited content state
   */
  const [editedContent, setEditedContent] = useState<string>(content);

  /**
   * Sync edited content with prop when modal opens
   */
  useEffect(() => {
    if (isOpen) {
      setEditedContent(content);
    }
  }, [isOpen, content]);

  /**
   * Handle textarea change
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
      setEditedContent(event.target.value);
    },
    []
  );

  /**
   * Handle save button click
   */
  const handleSave = useCallback((): void => {
    onSave(editedContent);
    onClose();
  }, [editedContent, onSave, onClose]);

  /**
   * Handle close button click
   */
  const handleClose = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content input-content-modal">
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="close-button"
            onClick={handleClose}
            aria-label="閉じる"
            type="button"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          <textarea
            value={editedContent}
            onChange={handleChange}
            className="content-textarea"
            placeholder={PLACEHOLDER_TEXT}
            aria-label="コンテンツ入力欄"
          />
        </div>
        <div className="modal-footer">
          <button
            className="cancel-button"
            onClick={handleClose}
            type="button"
          >
            キャンセル
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            type="button"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
});

InputContentModal.displayName = 'InputContentModal';

export default InputContentModal;
export type { InputContentModalProps };