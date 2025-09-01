import React, { memo } from 'react';
import { UploadStatus } from '../../types';
import { extractTextOnly, extractFormatted } from '../../../shared/utils/vtt';
import SaveStatusIndicator from '../SaveStatusIndicator';
import './InputSection.css';

interface InputSectionProps {
  uploadedText: string;
  setUploadedText: (text: string) => void;
  directTextInput: string;
  setDirectTextInput: (text: string) => void;
  uploadStatus: UploadStatus;
  setUploadStatus: (status: UploadStatus) => void;
  dragOver: boolean;
  setDragOver: (dragOver: boolean) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  showFileHelp: boolean;
  setShowFileHelp: (show: boolean) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  totalCharacters?: number;
  setTotalCharacters?: (count: number) => void;
  lastSaved?: Date | null;
  hasUnsavedChanges?: boolean;
  onSave?: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({
  uploadedText,
  setUploadedText,
  directTextInput,
  setDirectTextInput,
  uploadStatus,
  setUploadStatus,
  dragOver,
  setDragOver,
  isUploading,
  setIsUploading,
  showFileHelp,
  setShowFileHelp,
  showToast,
  totalCharacters,
  setTotalCharacters,
  lastSaved,
  hasUnsavedChanges,
  onSave,
}) => {
  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('uploading');
    
    try {
      const fileName = file.name.toLowerCase();
      let uploadedText = '';
      let vttProcessingInfo = '';
      
      if (fileName.endsWith('.vtt')) {
        // クライアントでVTTを解析してテキストを適用
        const raw = await file.text();
        const formatted = extractFormatted(raw);
        const textOnly = extractTextOnly(raw);
        uploadedText = formatted || textOnly;
        
        // VTT処理情報を生成（冒頭3行の比較）
        const rawLines = raw.split('\n').filter(line => line.trim() && !line.includes('-->') && !line.startsWith('WEBVTT')).slice(0, 3);
        const processedLines = uploadedText.split('\n').filter(line => line.trim()).slice(0, 3);
        
        vttProcessingInfo = `【VTT処理結果】\n元データ（冒頭3行）:\n${rawLines.map(line => `  ${line.trim()}`).join('\n')}\n\n↓ 話者名クリーンアップ後 ↓\n${processedLines.map(line => `  ${line}`).join('\n')}`;
      } else {
        uploadedText = await file.text();
      }

      // VTT処理情報があれば追加
      const finalText = vttProcessingInfo ? `${vttProcessingInfo}\n\n${uploadedText}` : uploadedText;
      setUploadedText(finalText);
      setUploadStatus('completed');
      
      // 文字数計算（時刻除去済みテキストの文字数）
      const characterCount = uploadedText.trim().length;
      setTotalCharacters?.(characterCount);
      
      const fileType = fileName.endsWith('.vtt') ? 'VTT' : fileName.endsWith('.txt') ? 'テキスト' : 'Markdown';
      showToast(`${fileType}ファイルのアップロードが完了しました。「AI修正実行」ボタンをクリックしてください。`, 'success');
      
    } catch (err: unknown) {
      const error = err as {code?: string, response?: {data?: {detail?: string}}, message?: string};
      
      console.error('File processing error:', error);
      let errorMessage = 'ファイル処理中にエラーが発生しました';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'アップロードがタイムアウトしました。ファイルサイズを確認してください。';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadStatus('error');
      showToast(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.vtt') || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
        processFile(file);
      } else {
        showToast('VTT、TXT、MDファイルのみアップロード可能です', 'warning');
      }
    }
  };

  const applyDirectTextInput = () => {
    if (directTextInput.trim()) {
      setUploadedText(directTextInput.trim());
      setUploadStatus('completed');
      showToast('テキストが入力されました。「AI修正実行」ボタンをクリックしてください。', 'success');
    }
  };

  return (
    <div className="panel input-panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <h2>📤 1. 入力 (ファイル & テキスト)</h2>
          {(uploadedText || directTextInput) && (
            <SaveStatusIndicator
              lastSaved={lastSaved}
              hasUnsavedChanges={hasUnsavedChanges}
              onSave={onSave}
              className="input-save-status"
            />
          )}
        </div>
        <button 
          className="help-icon"
          onClick={() => setShowFileHelp(!showFileHelp)}
          title="ファイル形式とアップロード方法の説明"
        >
          <i className="fas fa-question-circle"></i>
        </button>
      </div>
      <div className="panel-content">
        <div className="input-layout">
          <div className="input-left">
            <div className="file-upload-section">
              {showFileHelp && (
                <div className="file-help-tooltip">
                  <p><strong>アップロード可能なファイル</strong></p>
                  <p>議事録の元となる文字起こしデータや、参考情報となる議事メモ、出席者リストなどをアップロードできます。</p>
                  <p><strong>対応ファイル形式:</strong> .vtt (Teams議事録), .txt (テキスト), .md (Markdown)</p>
                </div>
              )}
              <div 
                className={`drop-zone ${dragOver ? 'drag-over' : ''} ${uploadStatus !== 'idle' ? 'upload-status-' + uploadStatus : ''}`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onClick={() => !isUploading && document.getElementById('file-input')?.click()}
              >
                <i className={
                  uploadStatus === 'uploading' ? "fas fa-spinner fa-spin" :
                  uploadStatus === 'completed' ? "fas fa-check-circle" :
                  uploadStatus === 'error' ? "fas fa-exclamation-triangle" :
                  "fas fa-cloud-upload-alt"
                }></i>
                <p>
                  {uploadStatus === 'uploading' ? 'アップロード中...' :
                   uploadStatus === 'completed' ? 'アップロード完了！' :
                   uploadStatus === 'error' ? 'エラーが発生しました' :
                   'ファイルをドロップまたはクリック'}
                </p>
                {totalCharacters && totalCharacters > 0 && (
                  <p className="character-count-display">
                    総文字数: {totalCharacters.toLocaleString()}文字 (時刻除去済)
                  </p>
                )}
                <input 
                  id="file-input"
                  type="file" 
                  accept=".vtt,.txt,.md"
                  style={{ display: 'none' }}
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processFile(file);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="input-right">
            <div className="text-input-section">
              <textarea
                value={directTextInput}
                onChange={(e) => setDirectTextInput(e.target.value)}
                placeholder={`または議事録の内容を直接貼り付け...

例:
【2024年12月15日 プロジェクト会議】
参加者: 田中さん、佐藤さん、山田さん

会議内容:
・進捗状況の確認
・次回スケジュール決定`}
                className="direct-text-input"
                rows={8}
              />
              <button 
                onClick={applyDirectTextInput}
                className="apply-text-btn"
                disabled={!directTextInput.trim()}
              >
                <i className="fas fa-check"></i>
                テキスト適用
              </button>
            </div>
            
            {uploadedText && (
              <div className="uploaded-text-preview">
                <div className="preview-header">
                  <h4>適用済みテキスト:</h4>
                  <div className="text-status">
                    <span className="text-length">
                      {uploadedText.length.toLocaleString()}文字
                    </span>
                    {lastSaved && (
                      <span className="save-indicator" title={`PDF印刷で使用可能 - ${lastSaved.toLocaleString('ja-JP')}`}>
                        <i className="fas fa-link" style={{ color: '#27ae60' }}></i>
                        PDF連携済み
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-preview">
                  {uploadedText.slice(0, 400)}{uploadedText.length > 400 ? '...' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(InputSection);
