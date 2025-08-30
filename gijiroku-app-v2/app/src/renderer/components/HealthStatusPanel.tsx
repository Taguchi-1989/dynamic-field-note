import React, { useState } from 'react';
import { useServerHealth } from '../hooks/useServerHealth';
import './HealthStatusPanel.css';

const HealthStatusPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { nodeApiStatus, isChecking, lastCheck, checkServerHealth } = useServerHealth();

  const formatTimestamp = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString('ja-JP', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = () => {
    if (isChecking) return '🔄';
    if (nodeApiStatus.isHealthy) return '🟢';
    return '🔴';
  };

  const getStatusText = () => {
    if (isChecking) return 'チェック中...';
    if (nodeApiStatus.isHealthy) return 'オンライン';
    return 'オフライン';
  };

  return (
    <div className="health-status-panel">
      <div 
        className="health-status-indicator"
        onClick={() => setIsExpanded(!isExpanded)}
        title="サーバー状態を確認"
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className="health-status-details">
          <div className="status-header">
            <h4>🏥 システム健康状態</h4>
            <button 
              onClick={checkServerHealth}
              className="refresh-btn"
              disabled={isChecking}
              title="手動更新"
            >
              {isChecking ? '🔄' : '🔄'}
            </button>
          </div>

          <div className="status-section">
            <h5>📡 Node.js Backend</h5>
            <div className="status-row">
              <span>状態:</span>
              <span className={nodeApiStatus.isHealthy ? 'healthy' : 'unhealthy'}>
                {getStatusIcon()} {getStatusText()}
              </span>
            </div>
            
            {nodeApiStatus.responseTime && (
              <div className="status-row">
                <span>応答時間:</span>
                <span className={nodeApiStatus.responseTime < 100 ? 'fast' : 
                                nodeApiStatus.responseTime < 500 ? 'normal' : 'slow'}>
                  {nodeApiStatus.responseTime}ms
                </span>
              </div>
            )}

            {nodeApiStatus.version && (
              <div className="status-row">
                <span>バージョン:</span>
                <span>{nodeApiStatus.version}</span>
              </div>
            )}

            {nodeApiStatus.timestamp && (
              <div className="status-row">
                <span>サーバー時刻:</span>
                <span>{new Date(nodeApiStatus.timestamp).toLocaleString('ja-JP')}</span>
              </div>
            )}

            <div className="status-row">
              <span>最終チェック:</span>
              <span>{formatTimestamp(lastCheck)}</span>
            </div>

            {nodeApiStatus.error && (
              <div className="status-row error">
                <span>エラー:</span>
                <span>{nodeApiStatus.error}</span>
              </div>
            )}
          </div>

          <div className="status-info">
            <small>
              💡 10秒間隔で自動更新されます。問題がある場合は、バックエンドサーバーの起動状態を確認してください。
            </small>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthStatusPanel;