import React, { useState } from 'react';
import './InputContentModal.css';

interface InputContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave: (content: string) => void;
  title?: string;
}

const InputContentModal: React.FC<InputContentModalProps> = ({
  isOpen,
  onClose,
  content,
  onSave,
  title = "コンテンツ編集"
}) => {
  const [editedContent, setEditedContent] = useState(content);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(editedContent);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content input-content-modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="content-textarea"
            placeholder="コンテンツを入力してください..."
          />
        </div>
        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            キャンセル
          </button>
          <button className="save-button" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputContentModal;