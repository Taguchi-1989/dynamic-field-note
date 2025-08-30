import React, { memo } from 'react';

interface SaveStatusIndicatorProps {
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  onSave?: () => void;
  className?: string;
}

const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  lastSaved,
  hasUnsavedChanges,
  onSave,
  className = ''
}) => {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '未保存';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'たった今保存';
    if (diffMinutes < 60) return `${diffMinutes}分前に保存`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}時間前に保存`;
    
    return date.toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric',
      hour: 'numeric', 
      minute: 'numeric' 
    }) + 'に保存';
  };

  const getStatusIcon = () => {
    if (hasUnsavedChanges) {
      return <i className="fas fa-circle" style={{ color: '#f39c12', fontSize: '8px' }}></i>;
    }
    if (lastSaved) {
      return <i className="fas fa-check-circle" style={{ color: '#27ae60', fontSize: '12px' }}></i>;
    }
    return <i className="fas fa-exclamation-triangle" style={{ color: '#e67e22', fontSize: '12px' }}></i>;
  };

  const getStatusText = () => {
    if (hasUnsavedChanges) return '自動保存中...';
    return formatLastSaved(lastSaved);
  };

  const getStatusStyle = () => {
    if (hasUnsavedChanges) {
      return {
        color: '#f39c12',
        fontWeight: '500'
      };
    }
    if (lastSaved) {
      return {
        color: '#27ae60',
        fontWeight: '400'
      };
    }
    return {
      color: '#e67e22',
      fontWeight: '500'
    };
  };

  return (
    <div 
      className={`save-status-indicator ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '12px',
        padding: '4px 8px',
        borderRadius: '12px',
        background: hasUnsavedChanges ? '#fef9e7' : '#f8f9fa',
        border: hasUnsavedChanges ? '1px solid #f39c12' : '1px solid #dee2e6',
        transition: 'all 0.3s ease'
      }}
      title={lastSaved ? `最終保存: ${lastSaved.toLocaleString('ja-JP')}` : '入力内容は自動保存されます'}
    >
      {getStatusIcon()}
      <span style={getStatusStyle()}>
        {getStatusText()}
      </span>
      {onSave && hasUnsavedChanges && (
        <button
          onClick={onSave}
          style={{
            background: 'none',
            border: 'none',
            color: '#3498db',
            cursor: 'pointer',
            fontSize: '11px',
            padding: '2px 4px',
            borderRadius: '4px',
            marginLeft: '4px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#ecf0f1';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none';
          }}
          title="今すぐ保存"
        >
          <i className="fas fa-save"></i>
        </button>
      )}
    </div>
  );
};

export default memo(SaveStatusIndicator);