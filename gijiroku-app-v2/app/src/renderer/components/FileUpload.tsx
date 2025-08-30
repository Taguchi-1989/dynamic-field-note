import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { ProcessedText } from '../App';
import SampleVTT from './SampleVTT';
import API_ENDPOINTS from '../config/api';
import './FileUpload.css';

interface FileUploadProps {
  onFileProcessed: (result: ProcessedText) => void;
  onProcessingChange: (processing: boolean) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileProcessed,
  onProcessingChange,
  isProcessing
}) => {
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const processFile = async (file: File) => {
    setError(null);
    onProcessingChange(true);
    setUploadProgress(0);

    try {
      // Step 1: VTTファイルのアップロードと解析
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await axios.post(API_ENDPOINTS.uploadVtt, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });

      if (uploadResponse.data.status !== 'success') {
        throw new Error('VTTファイルのアップロードに失敗しました');
      }

      setUploadProgress(60);

      // Step 2: テキストの自動修正処理
      const processResponse = await axios.post(API_ENDPOINTS.processText, {
        text: uploadResponse.data.data.formatted_text,
        user_id: null // 認証実装後に設定
      });

      setUploadProgress(100);

      const result: ProcessedText = {
        original: processResponse.data.original_text,
        corrected: processResponse.data.corrected_text,
        corrections: processResponse.data.corrections || []
      };

      onFileProcessed(result);

    } catch (err: any) {
      console.error('File processing error:', err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('ファイル処理中にエラーが発生しました');
      }
    } finally {
      onProcessingChange(false);
      setUploadProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // ファイル形式の検証
    if (!file.name.toLowerCase().endsWith('.vtt')) {
      setError('VTTファイルのみアップロード可能です');
      return;
    }

    // ファイルサイズの検証 (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      setError('ファイルサイズは5MB以下にしてください');
      return;
    }

    processFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/vtt': ['.vtt']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="dropzone-content">
          {isProcessing ? (
            <div className="upload-progress">
              <div className="progress-circle">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="#e5e7eb"
                    strokeWidth="6"
                    fill="none"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="#667eea"
                    strokeWidth="6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 35}
                    strokeDashoffset={2 * Math.PI * 35 * (1 - uploadProgress / 100)}
                    className="progress-ring"
                  />
                </svg>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
              <p>処理中...</p>
            </div>
          ) : (
            <>
              <div className="upload-icon">
                <svg
                  width="48"
                  height="48"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              
              <h3>VTTファイルをアップロード</h3>
              <p>
                {isDragActive
                  ? 'ファイルをここにドロップしてください'
                  : 'ファイルをドラッグ&ドロップするか、クリックして選択'}
              </p>
              
              <div className="file-requirements">
                <ul>
                  <li>✓ Microsoft Teams の VTT ファイル</li>
                  <li>✓ ファイルサイズ: 5MB以下</li>
                  <li>✓ 形式: .vtt のみ</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-close">
            ×
          </button>
        </div>
      )}

      <div className="upload-help">
        <h4>Microsoft Teams でVTTファイルを取得する方法</h4>
        <ol>
          <li>Teams会議の記録を開く</li>
          <li>「トランスクリプト」タブを選択</li>
          <li>「ダウンロード」をクリック</li>
          <li>VTT形式を選択してダウンロード</li>
        </ol>
      </div>

      <SampleVTT />
    </div>
  );
};

export default FileUpload;