import React, { useState } from 'react';
import './AboutModal.css';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'roadmap'>('about');
  
  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      tabIndex={-1}
      role="dialog" 
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="about-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="about-modal-title">ℹ️ アプリケーション情報</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="アプリケーション情報を閉じる"
            title="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <i className="fas fa-info-circle"></i>
            アプリケーション情報
          </button>
          <button 
            className={`tab-btn ${activeTab === 'roadmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('roadmap')}
          >
            <i className="fas fa-rocket"></i>
            今後の実装予定
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'about' ? (
            <>
              <div className="about-section">
            <h3>このアプリケーションについて</h3>
            <p>このアプリケーションは、<strong>ZEAL-BOOT-CAMP</strong>によって開発されたものです。</p>
            <p>主な目的は教育および<strong>PoC（Proof of Concept / 概念実証）</strong>であり、AIを活用した文字起こしデータの修正プロセスを検証するために作成されました。</p>
          </div>

          <div className="about-section warning-section">
            <h3><i className="fas fa-exclamation-triangle"></i> 重要な注意事項</h3>
            <div className="warning-content">
              <div className="warning-box">
                <div className="warning-header">
                  <i className="fas fa-shield-alt"></i>
                  <strong>機密情報・個人情報について</strong>
                </div>
                <p>
                  本アプリケーションは安価なAI APIを使用しており、学習オフの設定をしていないため、送信されたデータがAIの学習に使われる可能性があります。
                  サーバーでの保存は行いませんが、<strong>機密情報や個人情報は入力しないでください</strong>。
                </p>
                <ul className="warning-list">
                  <li><i className="fas fa-times-circle"></i> 氏名、住所、電話番号などの個人情報</li>
                  <li><i className="fas fa-times-circle"></i> 社内機密情報、非公開の技術情報</li>
                  <li><i className="fas fa-times-circle"></i> 個人を特定できる発言内容</li>
                  <li><i className="fas fa-times-circle"></i> 機密性の高い業務内容や数値</li>
                </ul>
                <p className="warning-note">
                  <i className="fas fa-lightbulb"></i>
                  <strong>推奨：</strong> 実名を仮名に置き換える、具体的な数値を「XX」に置き換えるなど、
                  情報を匿名化してからご利用ください。
                </p>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h3>システムの処理フロー</h3>
            <p>本アプリケーションは、以下の順序で処理を行います。</p>
            <div className="system-overview">
              <div className="system-flow">
                <div className="flow-step">
                  <i className="fas fa-upload"></i>
                  <span><strong>1. VTTファイルの<br/>アップロード</strong><br/>時刻データを除去し、文字数を表示。長い場合は自動分割されます。</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <i className="fas fa-magic"></i>
                  <span><strong>2. プロンプトの<br/>選択</strong><br/>目的に合った修正指示（プロンプト）を選択します。</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <i className="fas fa-robot"></i>
                  <span><strong>3. AIによる<br/>分割処理</strong><br/>分割されたチャンクごとにAIが処理し、結果を統合します。</span>
                </div>
              </div>
              <div className="system-flow">
                <div className="flow-step">
                  <i className="fas fa-book"></i>
                  <span><strong>4. カスタム辞書による<br/>自動修正</strong><br/>登録されたカスタム辞書を用いて、専門用語などを自動で置換・修正します。</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <i className="fas fa-edit"></i>
                  <span><strong>5. 手動編集</strong><br/>自動修正された結果を、ユーザーが手動で最終調整します。</span>
                </div>
                <div className="flow-arrow">→</div>
                <div className="flow-step">
                  <i className="fas fa-download"></i>
                  <span><strong>（修正完了・出力）</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h3>データとAPIについて</h3>
            
            <div className="subsection">
              <h4>分割処理機能について</h4>
              <p>大量のテキストを効率的に処理するため、<strong>分割処理機能</strong>を搭載しています：</p>
              <ul>
                <li><strong>自動分割</strong>: 長いテキストを設定可能なサイズで自動分割</li>
                <li><strong>重複防止</strong>: オーバーラップ機能で内容欠落を防止</li>
                <li><strong>話者情報保持</strong>: 分割後も話者情報を適切に維持</li>
                <li><strong>進捗表示</strong>: リアルタイムで処理進捗を可視化</li>
                <li><strong>エラー回復</strong>: API障害時の自動フォールバック機能</li>
              </ul>
              <p className="tech-note">
                <i className="fas fa-info-circle"></i>
                この機能により「lost in the middle」問題を解決し、安定した大容量処理を実現します。
              </p>
            </div>

            <div className="subsection">
              <h4>APIキー設定について</h4>
              <p>本デスクトップアプリケーションはユーザー自身のAPIキーを使用する仕様です：</p>
              <ul>
                <li><strong>Google Gemini API</strong>: 推奨プロバイダー（Gemini 2.0 Flash対応）</li>
                <li>設定画面から各APIキーの設定状況を確認可能</li>
                <li>APIキーは暗号化されてローカルに安全に保存</li>
                <li>オフライン時は基本的なテキスト処理機能のみ利用可能</li>
              </ul>
            </div>

            <div className="subsection">
              <h4>データの取り扱い</h4>
              <p>アップロードされたVTTファイルや編集内容は完全にローカル環境で管理されます：</p>
              <ul>
                <li>SQLiteローカルデータベースで履歴・設定を保存</li>
                <li>入力内容の自動保存機能（2秒間隔）</li>
                <li>PDF印刷機能との連携で編集内容を引き継ぎ</li>
                <li>データはご使用の端末から外部に送信されません</li>
              </ul>
            </div>
          </div>

          <div className="about-section">
            <h3>技術スタック</h3>
            <div className="tech-stack">
              <div className="tech-category">
                <h4>デスクトップアプリケーション</h4>
                <ul>
                  <li>Electron（クロスプラットフォーム）</li>
                  <li>React.js 18 + TypeScript</li>
                  <li>Vite（ビルドツール）</li>
                  <li>Node.js 18+</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>データ管理</h4>
                <ul>
                  <li>SQLite（ローカルデータベース）</li>
                  <li>完全オフライン対応</li>
                  <li>設定・辞書・履歴管理</li>
                  <li>暗号化セキュアストレージ</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>PDF生成・処理</h4>
                <ul>
                  <li>Chromium printToPDF エンジン</li>
                  <li>Markdown → HTML → PDF</li>
                  <li>カスタムテンプレート対応</li>
                  <li>高品質レンダリング</li>
                </ul>
              </div>
              <div className="tech-category">
                <h4>AI統合</h4>
                <ul>
                  <li>Google Gemini 2.0 Flash（推奨）</li>
                  <li>分割処理・チャンキング機能</li>
                  <li>エラー回復・リトライ機能</li>
                  <li>オフライン時フォールバック</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h3>ライセンス</h3>
            <p>このアプリケーションのソースコードは <strong>MITライセンス</strong> の下で公開されています。</p>
            <p>
              <a href="https://opensource.org/licenses/MIT" target="_blank" rel="noopener noreferrer" className="license-link">
                <i className="fas fa-external-link-alt"></i>
                MITライセンス詳細を確認
              </a>
            </p>
          </div>

          <div className="about-section">
            <h3>セキュリティポリシー</h3>
            <ul>
              <li>APIキーは暗号化されてローカルセキュアストレージに保存</li>
              <li>Electronアプリはsandbox化されたレンダラープロセスで実行</li>
              <li>contextIsolation有効でセキュアなIPC通信を実装</li>
              <li>アップロードされたファイルは端末内でのみ処理（外部送信なし）</li>
              <li>SQLiteデータベースによるローカル履歴・設定管理</li>
              <li>ネットワーク通信はAI API呼び出し時のみ（任意）</li>
              <li>完全オフライン環境での利用も可能</li>
              <li>第三者に情報を共有することはありません</li>
            </ul>
          </div>

          <div className="about-section">
            <h3>利用規約</h3>
            <p>本アプリケーションの利用により生じた損害については、開発者は一切の責任を負いません。ご自身の責任でご利用ください。</p>
          </div>


          <div className="about-section developer-info">
            <h3><i className="fas fa-building"></i> 開発者情報</h3>
            <div className="developer-content">
              <div className="logo-section">
                <img src="/zeal-logo.png" alt="ZEAL BOOT CAMP Logo" className="developer-logo" />
              </div>
              <div className="developer-details">
                <p><i className="fas fa-users"></i> <strong>制作者：</strong> ZEAL-BOOT-CAMP</p>
                <p><i className="fas fa-graduation-cap"></i> <strong>目的：</strong> 教育・PoC（概念実証）</p>
                <p><i className="fas fa-code-branch"></i> <strong>バージョン：</strong> 2.0.0 (分割処理機能搭載版)</p>
                <p><i className="fas fa-calendar-alt"></i> <strong>リリース日：</strong> {new Date().toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          </div>

            </>
          ) : (
            <>
              <div className="roadmap-intro">
                <p>以下の機能は今後実装を予定している将来的な拡張機能です。</p>
                <p><strong>実装を急いでご希望の機能がございましたら、お問い合わせからご連絡ください。</strong></p>
              </div>

              <div className="roadmap-section">
                <h3>📱 Phase 1: 完成度向上（1-2ヶ月）</h3>
                <div className="feature-list">
                  <div className="feature-item">
                    <h4>🎨 UI/UX改善</h4>
                    <p>ダークモード完全対応、アニメーション強化、アクセシビリティ向上</p>
                  </div>
                  <div className="feature-item">
                    <h4>📦 配布・インストール改善</h4>
                    <p>Windows/Mac/Linux向けインストーラー、自動更新機能</p>
                  </div>
                  <div className="feature-item">
                    <h4>🔍 高度な検索・フィルタ</h4>
                    <p>履歴検索、タグ機能、カテゴリ分類</p>
                  </div>
                  <div className="feature-item">
                    <h4>🤖 AI精度向上</h4>
                    <p>カスタムプロンプト強化、業界特化モデル対応</p>
                  </div>
                </div>
              </div>

              <div className="roadmap-section">
                <h3>🎯 Phase 2: 機能拡張（2-3ヶ月）</h3>
                <div className="feature-list">
                  <div className="feature-item">
                    <h4>🎵 音声ファイル直接処理</h4>
                    <p>MP3/WAVファイルから直接テキスト変換（OpenAI Whisper活用）</p>
                  </div>
                  <div className="feature-item">
                    <h4>👥 リアルタイム文字起こし</h4>
                    <p>Teams会議中のリアルタイム文字起こし・話者分離</p>
                  </div>
                  <div className="feature-item">
                    <h4>📊 周期的サマリー</h4>
                    <p>10分ごとの自動要約、論点整理、決定事項の明示</p>
                  </div>
                  <div className="feature-item">
                    <h4>🔗 外部サービス連携</h4>
                    <p>Slack、Microsoft Teams、Google Drive連携</p>
                  </div>
                </div>
              </div>

              <div className="roadmap-section">
                <h3>⚡ Phase 3: 高度な統合（3-6ヶ月）</h3>
                <div className="feature-list">
                  <div className="feature-item">
                    <h4>🌐 多言語・翻訳対応</h4>
                    <p>自動翻訳機能、多言語議事録作成、UI多言語化</p>
                  </div>
                  <div className="feature-item">
                    <h4>📝 高機能エディタ</h4>
                    <p>VS Code風の分割表示、LaTeX数式対応、Mermaid.js図表作成</p>
                  </div>
                  <div className="feature-item">
                    <h4>☁️ クラウド連携</h4>
                    <p>Google Drive、OneDrive、Dropbox同期機能</p>
                  </div>
                  <div className="feature-item">
                    <h4>📊 高度な分析機能</h4>
                    <p>会議効率分析、発言時間統計、トピック分析</p>
                  </div>
                </div>
              </div>

              <div className="roadmap-section">
                <h3>🎨 Phase 4: イノベーション（6-12ヶ月）</h3>
                <div className="feature-list">
                  <div className="feature-item">
                    <h4>😊 AI感情分析</h4>
                    <p>会議の雰囲気分析、参加者の感情状態の可視化</p>
                  </div>
                  <div className="feature-item">
                    <h4>🔮 予測・提案AI</h4>
                    <p>過去データから次回議題提案、意思決定サポート</p>
                  </div>
                  <div className="feature-item">
                    <h4>🗣️ 音声コマンド</h4>
                    <p>ハンズフリー操作、音声による編集指示</p>
                  </div>
                  <div className="feature-item">
                    <h4>🏢 エンタープライズ機能</h4>
                    <p>組織向け管理画面、使用統計、監査ログ</p>
                  </div>
                </div>
              </div>

              <div className="roadmap-footer">
                <div className="feedback-section">
                  <h3>💡 ご要望・フィードバックについて</h3>
                  <p>上記の機能で<strong>「これを優先的に実装してほしい！」</strong>というご要望がございましたら、ぜひお問い合わせからお聞かせください。</p>
                  <p>ユーザーの皆様のフィードバックを基に、実装優先度を調整いたします。</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="close-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;