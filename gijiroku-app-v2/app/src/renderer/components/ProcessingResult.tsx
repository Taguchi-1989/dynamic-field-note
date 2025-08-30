import React, { useState } from 'react';
import { ProcessedText } from '../App';
import './ProcessingResult.css';

interface ProcessingResultProps {
  processedText: ProcessedText;
  onEdit: () => void;
  onReset: () => void;
}

const ProcessingResult: React.FC<ProcessingResultProps> = ({ 
  processedText, 
  onEdit, 
  onReset 
}) => {
  // const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'corrections' | 'comparison'>('overview');

  const originalLength = processedText.original.length;
  const correctedLength = processedText.corrected.length;
  const correctionCount = processedText.corrections.length;
  const lengthChange = correctedLength - originalLength;

  return (
    <div className="processing-result">
      <div className="result-header">
        <div className="result-title">
          <h2>🎯 処理完了</h2>
          <p>AIによるテキスト修正が完了しました</p>
        </div>
        
        <div className="result-actions">
          <button className="edit-btn" onClick={onEdit}>
            ✏️ エディタで編集
          </button>
          <button className="reset-btn" onClick={onReset}>
            🔄 新しいファイル
          </button>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="result-summary">
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <h3>処理サマリー</h3>
            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-label">修正箇所</span>
                <span className="stat-value">{correctionCount}件</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">文字数</span>
                <span className="stat-value">
                  {originalLength} → {correctedLength} 
                  <span className={`change ${lengthChange >= 0 ? 'increase' : 'decrease'}`}>
                    ({lengthChange >= 0 ? '+' : ''}{lengthChange})
                  </span>
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">処理時間</span>
                <span className="stat-value">約2秒</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="result-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 概要
        </button>
        <button 
          className={`tab-btn ${activeTab === 'corrections' ? 'active' : ''}`}
          onClick={() => setActiveTab('corrections')}
        >
          🔧 修正内容 ({correctionCount})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          🔍 比較表示
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="text-preview">
              <h4>修正後のテキスト（プレビュー）</h4>
              <div className="preview-box">
                <pre>{processedText.corrected.slice(0, 300)}
                  {processedText.corrected.length > 300 && '...'}
                </pre>
              </div>
            </div>
            
            <div className="quick-actions">
              <h4>次のステップ</h4>
              <div className="action-grid">
                <button className="quick-action" onClick={onEdit}>
                  <span className="action-icon">✏️</span>
                  <span className="action-label">エディタで詳細編集</span>
                  <span className="action-desc">Side-by-Sideで比較しながら編集</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'corrections' && (
          <div className="corrections-tab">
            <div className="corrections-list">
              {processedText.corrections.length > 0 ? (
                <>
                  <div className="corrections-header">
                    <h4>検出された修正内容</h4>
                    <p>AIが自動的に修正した項目の一覧です</p>
                  </div>
                  
                  {processedText.corrections.map((correction, index) => (
                    <div key={index} className="correction-detail">
                      <div className="correction-number">{index + 1}</div>
                      <div className="correction-content">
                        <div className="correction-change">
                          <span className="before">「{correction.original}」</span>
                          <span className="arrow">→</span>
                          <span className="after">「{correction.corrected}」</span>
                        </div>
                        <div className="correction-meta">
                          <span className="correction-step">{correction.step}</span>
                          <span className="correction-reason">{correction.reason}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="no-corrections">
                  <div className="no-corrections-icon">✅</div>
                  <h4>修正不要</h4>
                  <p>テキストに修正すべき箇所は見つかりませんでした。</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="comparison-tab">
            <div className="comparison-view">
              <div className="comparison-pane">
                <h4>修正前</h4>
                <div className="comparison-text original">
                  <pre>{processedText.original}</pre>
                </div>
              </div>
              <div className="comparison-divider">
                <div className="divider-line"></div>
                <div className="divider-arrow">→</div>
              </div>
              <div className="comparison-pane">
                <h4>修正後</h4>
                <div className="comparison-text corrected">
                  <pre>{processedText.corrected}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingResult;