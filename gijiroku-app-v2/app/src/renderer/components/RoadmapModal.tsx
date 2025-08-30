import React from 'react';
import './RoadmapModal.css';

interface RoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RoadmapModal: React.FC<RoadmapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content roadmap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🚀 今後の実装予定</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="roadmap-intro">
            <p>以下の機能は今後実装を予定している将来的な拡張機能です。</p>
            <p><strong>実装を急いでご希望の機能がございましたら、お問い合わせからご連絡ください。</strong></p>
          </div>

          <div className="roadmap-section">
            <h3>📱 Phase 1: 基本機能の拡充</h3>
            <div className="feature-list">
              <div className="feature-item priority-high">
                <h4>🖥️ デスクトップ版対応 <span className="priority-badge">優先度: 高</span></h4>
                <p>Electron対応によるデスクトップアプリ化、オフライン動作対応、ローカルファイル管理機能</p>
              </div>
              <div className="feature-item">
                <h4>🎵 音声ファイル対応の拡張</h4>
                <p>MP3、WAV等の音声形式サポート、リアルタイム音声認識機能、話者分離・識別機能の強化</p>
              </div>
              <div className="feature-item">
                <h4>🔐 ユーザー認証システム</h4>
                <p>Google OAuth、JWT認証によるセキュアなログイン機能</p>
              </div>
              <div className="feature-item">
                <h4>🛡️ セキュリティ基盤</h4>
                <p>HTTPS強制、XSS対策、入力検証の徹底</p>
              </div>
            </div>
          </div>

          <div className="roadmap-section">
            <h3>🎯 Phase 2: データ管理・分析機能</h3>
            <div className="feature-list">
              <div className="feature-item">
                <h4>📚 議事録管理システム</h4>
                <p>タグ・カテゴリによる分類、全文検索機能、議事録テンプレート管理</p>
              </div>
              <div className="feature-item">
                <h4>📊 データ分析・レポート機能</h4>
                <p>会議統計ダッシュボード、議事録トレンド分析、アクションアイテムのトラッキング</p>
              </div>
              <div className="feature-item">
                <h4>🔍 高度な検索機能</h4>
                <p>過去の議事録の横断検索、関連議事録の自動提案</p>
              </div>
              <div className="feature-item">
                <h4>📈 可視化機能</h4>
                <p>会議の頻度・時間分析、決定事項の進捗管理</p>
              </div>
            </div>
          </div>

          <div className="roadmap-section">
            <h3>⚡ Phase 3: コラボレーション機能</h3>
            <div className="feature-list">
              <div className="feature-item">
                <h4>🔄 共同編集機能</h4>
                <p>リアルタイム同時編集、コメント・レビュー機能、変更履歴管理</p>
              </div>
              <div className="feature-item">
                <h4>✅ 承認フロー機能</h4>
                <p>議事録承認ワークフロー、通知・リマインダー機能、電子署名対応</p>
              </div>
              <div className="feature-item">
                <h4>👥 チーム機能</h4>
                <p>メンバー管理、権限設定、チーム別ワークスペース</p>
              </div>
              <div className="feature-item">
                <h4>📝 高機能エディタ</h4>
                <p>VS Code風の分割表示、LaTeX数式対応、Mermaid.js図表作成</p>
              </div>
            </div>
          </div>

          <div className="roadmap-section">
            <h3>🏢 Phase 4: エンタープライズ機能</h3>
            <div className="feature-list">
              <div className="feature-item">
                <h4>🔐 セキュリティ強化</h4>
                <p>SSO（シングルサインオン）対応、暗号化・データ保護、監査ログ機能</p>
              </div>
              <div className="feature-item">
                <h4>🔗 システム連携</h4>
                <p>カレンダー連携（Google Calendar、Outlook）、プロジェクト管理ツール連携、Slack/Teams通知連携</p>
              </div>
              <div className="feature-item">
                <h4>⚙️ カスタマイズ機能</h4>
                <p>組織別カスタム設定、APIエンドポイント提供、プラグインアーキテクチャ</p>
              </div>
              <div className="feature-item">
                <h4>📊 管理者ダッシュボード</h4>
                <p>組織全体の利用統計、ユーザー管理、ライセンス管理</p>
              </div>
            </div>
          </div>

          <div className="roadmap-footer">
            <div className="feedback-section">
              <h3>💡 ご要望・フィードバックについて</h3>
              <p>上記の機能で<strong>「これを優先的に実装してほしい！」</strong>というご要望がございましたら、ぜひお問い合わせからお聞かせください。</p>
              <p>ユーザーの皆様のフィードバックを基に、実装優先度を調整いたします。</p>
              <div className="contact-button-container">
                <button 
                  className="contact-button"
                  onClick={() => {
                    onClose();
                    // お問い合わせモーダルを開く処理は親コンポーネントで実装
                    const contactBtn = document.querySelector('[data-modal="contact"]') as HTMLButtonElement;
                    if (contactBtn) contactBtn.click();
                  }}
                >
                  📧 お問い合わせはこちら
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapModal;