import React, { useEffect, useState } from 'react';
import './PromptDetailModal.css';

interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  description?: string;
  category: string;
  is_active: boolean;
}

interface PromptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: PromptTemplate | null;
  customPrompt?: string;
  isCustom?: boolean;
  onEdit?: (content: string) => void;
  onSave?: (content: string) => void;
}

const PromptDetailModal: React.FC<PromptDetailModalProps> = ({
  isOpen,
  onClose,
  template,
  customPrompt = '',
  isCustom = false,
  onEdit,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const [displayContent, setDisplayContent] = useState('');

  // モーダルが開かれた時の初期化
  useEffect(() => {
    if (isOpen) {
      if (isCustom) {
        setDisplayContent(customPrompt);
        setEditingContent(customPrompt);
      } else if (template) {
        setDisplayContent(template.content);
        setEditingContent(template.content);
      }
      setIsEditing(false);
      
      // ESCキーでモーダルを閉じる
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // 背景スクロール防止
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, template, customPrompt, isCustom, onClose]);

  // モーダルが閉じられる時のクリーンアップ
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setEditingContent('');
    }
  }, [isOpen]);

  const handleBackgroundClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (isCustom) {
      setEditingContent(customPrompt);
      setDisplayContent(customPrompt);
    } else if (template) {
      setEditingContent(template.content);
      setDisplayContent(template.content);
    }
    setIsEditing(false);
    
    // 元の内容で親に通知
    if (onEdit) {
      onEdit(displayContent);
    }
  };

  const handleSaveEdit = async () => {
    setDisplayContent(editingContent);
    
    // 親コンポーネントに編集内容を通知
    if (onEdit) {
      onEdit(editingContent);
    }
    
    // 保存処理
    if (onSave) {
      try {
        await onSave(editingContent);
        setIsEditing(false);
      } catch (error) {
        console.error('保存エラー:', error);
        alert('保存に失敗しました');
      }
    } else {
      setIsEditing(false);
    }
  };

  const handleTempEdit = (value: string) => {
    setEditingContent(value);
    // リアルタイムで親に編集内容を通知
    if (onEdit) {
      onEdit(value);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(displayContent);
      alert('クリップボードにコピーしました！');
    } catch (error) {
      console.error('コピーに失敗:', error);
      // フォールバック: テキストエリアを使用
      const textarea = document.createElement('textarea');
      textarea.value = displayContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('クリップボードにコピーしました！');
    }
  };

  if (!isOpen) {
    return null;
  }

  const modalTitle = isCustom ? 'カスタムプロンプト詳細' : template?.title || 'プロンプト詳細';

  return (
    <div className="modal-overlay" onClick={handleBackgroundClick}>
      <div className="modal-content">
        {/* ヘッダー */}
        <div className="modal-header">
          <div className="modal-title-section">
            <i className="fas fa-file-text"></i>
            <h3 className="modal-title">{modalTitle}</h3>
            {template?.description && (
              <span className="modal-description">{template.description}</span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* メインコンテンツ */}
        <div className="modal-body">
          {isEditing ? (
            <div className="editing-section">
              <div className="editor-header">
                <h4>
                  <i className="fas fa-edit"></i>
                  プロンプト編集
                </h4>
                <small>※編集内容は即座にプレビューに反映されます</small>
              </div>
              
              <textarea
                value={editingContent}
                onChange={(e) => handleTempEdit(e.target.value)}
                className="modal-editor-textarea"
                rows={15}
                placeholder="プロンプトを入力してください..."
              />
              
              <div className="editor-actions">
                <button 
                  className="modal-btn save-btn"
                  onClick={handleSaveEdit}
                >
                  <i className="fas fa-save"></i>
                  保存
                </button>
                <button 
                  className="modal-btn cancel-btn"
                  onClick={handleCancelEdit}
                >
                  <i className="fas fa-times"></i>
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="display-section">
              <div className="content-display">
                <pre className="modal-prompt-text">{displayContent}</pre>
              </div>
              
              <div className="display-actions">
                <button 
                  className="modal-btn edit-btn"
                  onClick={handleEdit}
                >
                  <i className="fas fa-edit"></i>
                  編集
                </button>
                <button 
                  className="modal-btn copy-btn"
                  onClick={copyToClipboard}
                >
                  <i className="fas fa-copy"></i>
                  コピー
                </button>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="modal-footer">
          <div className="modal-info">
            <small>
              {isCustom ? (
                '💡 カスタムプロンプト'
              ) : (
                `📁 カテゴリ: ${template?.category || 'その他'}`
              )}
            </small>
          </div>
          <button 
            className="modal-btn close-btn"
            onClick={onClose}
          >
            <i className="fas fa-times-circle"></i>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptDetailModal;