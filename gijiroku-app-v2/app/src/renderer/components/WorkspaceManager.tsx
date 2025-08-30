import React, { useState, useEffect } from 'react';
import Toast from './Toast';
import './WorkspaceManager.css';

interface WorkspaceInfo {
  currentPath: string;
  isPortable: boolean;
  canWrite: boolean;
  diskUsage: {
    used: number;
    available: number;
  };
  version: string;
  lastModified: string;
}

interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: (() => void) | null;
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({ isOpen, onClose }) => {
  const [workspaceInfo, setWorkspaceInfo] = useState<WorkspaceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [selectedPath, setSelectedPath] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadWorkspaceInfo();
    }
  }, [isOpen]);

  const loadWorkspaceInfo = async () => {
    setIsLoading(true);
    try {
      const info = await window.electronAPI.workspace.getInfo();
      setWorkspaceInfo(info);
    } catch (error) {
      showToast('ワークスペース情報の取得に失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkspace = async () => {
    try {
      const result = await window.electronAPI.workspace.selectDirectory();
      if (result.success && result.path) {
        setSelectedPath(result.path);
        showToast('ワークスペースを選択しました', 'success');
      }
    } catch (error) {
      showToast('ワークスペースの選択に失敗しました', 'error');
    }
  };

  const handleChangeWorkspace = async () => {
    if (!selectedPath) {
      showToast('ワークスペースが選択されていません', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.workspace.switchTo(selectedPath);
      if (result.success) {
        showToast('ワークスペースを切り替えました。アプリを再起動してください。', 'success');
        await loadWorkspaceInfo();
      } else {
        showToast(result.error || 'ワークスペースの切り替えに失敗しました', 'error');
      }
    } catch (error) {
      showToast('ワークスペースの切り替えに失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitializeWorkspace = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.workspace.initialize();
      if (result.success) {
        showToast('ワークスペースを初期化しました', 'success');
        await loadWorkspaceInfo();
      } else {
        showToast(result.error || 'ワークスペースの初期化に失敗しました', 'error');
      }
    } catch (error) {
      showToast('ワークスペースの初期化に失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackup = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.workspace.backup();
      if (result.success) {
        showToast(`バックアップを作成しました: ${result.backupPath}`, 'success');
      } else {
        showToast(result.error || 'バックアップの作成に失敗しました', 'error');
      }
    } catch (error) {
      showToast('バックアップの作成に失敗しました', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  const isEmbedded = onClose === null;

  return (
    <div className={isEmbedded ? "workspace-manager-embedded" : "workspace-manager-overlay"}>
      <div className={isEmbedded ? "workspace-manager-content-only" : "workspace-manager-modal"}>
        {!isEmbedded && (
          <div className="workspace-manager-header">
            <h2>🗂️ ワークスペース管理</h2>
            <button 
              className="workspace-manager-close" 
              onClick={onClose || (() => {})}
              disabled={isLoading}
            >
              ✕
            </button>
          </div>
        )}

        <div className="workspace-manager-content">
          {isLoading && (
            <div className="workspace-manager-loading">
              <div className="loading-spinner"></div>
              <p>処理中...</p>
            </div>
          )}

          {workspaceInfo && (
            <div className="workspace-info-section">
              <h3>現在のワークスペース</h3>
              <div className="workspace-info-card">
                <div className="workspace-info-row">
                  <span className="label">場所:</span>
                  <span className="value" title={workspaceInfo.currentPath}>
                    {workspaceInfo.currentPath}
                  </span>
                  <span className={`badge ${workspaceInfo.isPortable ? 'portable' : 'local'}`}>
                    {workspaceInfo.isPortable ? 'ポータブル' : 'ローカル'}
                  </span>
                </div>
                <div className="workspace-info-row">
                  <span className="label">書き込み権限:</span>
                  <span className={`value ${workspaceInfo.canWrite ? 'success' : 'error'}`}>
                    {workspaceInfo.canWrite ? '✓ 可能' : '✗ 不可'}
                  </span>
                </div>
                <div className="workspace-info-row">
                  <span className="label">ディスク使用量:</span>
                  <span className="value">
                    {formatBytes(workspaceInfo.diskUsage.used)} / 
                    {formatBytes(workspaceInfo.diskUsage.available)} 利用可能
                  </span>
                </div>
                <div className="workspace-info-row">
                  <span className="label">最終更新:</span>
                  <span className="value">{workspaceInfo.lastModified}</span>
                </div>
                <div className="workspace-info-row">
                  <span className="label">バージョン:</span>
                  <span className="value">{workspaceInfo.version}</span>
                </div>
              </div>
            </div>
          )}

          <div className="workspace-actions-section">
            <h3>ワークスペース操作</h3>
            
            <div className="action-group">
              <h4>新しいワークスペース</h4>
              <div className="action-row">
                <input
                  type="text"
                  placeholder="選択されたパス"
                  value={selectedPath}
                  readOnly
                  className="workspace-path-input"
                />
                <button 
                  onClick={handleSelectWorkspace}
                  disabled={isLoading}
                  className="btn-secondary"
                >
                  📁 選択
                </button>
              </div>
              {selectedPath && (
                <button 
                  onClick={handleChangeWorkspace}
                  disabled={isLoading}
                  className="btn-primary"
                >
                  🔄 ワークスペース切り替え
                </button>
              )}
            </div>

            <div className="action-group">
              <h4>メンテナンス</h4>
              <div className="action-buttons">
                <button 
                  onClick={handleInitializeWorkspace}
                  disabled={isLoading}
                  className="btn-secondary"
                >
                  🔧 再初期化
                </button>
                <button 
                  onClick={handleBackup}
                  disabled={isLoading}
                  className="btn-secondary"
                >
                  💾 バックアップ作成
                </button>
              </div>
            </div>
          </div>

          <div className="workspace-help-section">
            <h3>💡 ヘルプ</h3>
            <div className="help-content">
              <p><strong>ポータブルモード:</strong> USBメモリなどでアプリごと持ち運び可能</p>
              <p><strong>ローカルモード:</strong> ユーザーデータフォルダにワークスペースを作成</p>
              <p><strong>切り替え:</strong> 既存データを新しい場所に移行（バックアップ推奨）</p>
            </div>
          </div>
        </div>

        {!isEmbedded && (
          <div className="workspace-manager-footer">
            <button 
              onClick={onClose || (() => {})}
              disabled={isLoading}
              className="btn-secondary"
            >
              閉じる
            </button>
          </div>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default WorkspaceManager;