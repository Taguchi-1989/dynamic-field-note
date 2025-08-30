import React from 'react';
import './ContactModal.css';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="contact-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="contact-modal-header">
          <h2>
            <i className="fas fa-envelope"></i>
            お問い合わせ
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="contact-modal-body">
          <div className="contact-info">
            <div className="contact-item">
              <i className="fas fa-clipboard-list"></i>
              <div>
                <h3>お問い合わせフォーム</h3>
                <p>ご質問やご要望をお聞かせください</p>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSc1A7dJwE6FiL-AJBEHLCutMlNxb59gXYCYgXNdbFd428GF5A/viewform?usp=header" target="_blank" rel="noopener noreferrer" className="contact-link">
                  お問い合わせフォームを開く
                </a>
              </div>
            </div>
          </div>

          <div className="contact-form-info">
            <div className="info-card">
              <i className="fas fa-info-circle"></i>
              <div>
                <h4>お問い合わせの際は以下をお知らせください</h4>
                <ul>
                  <li>ご利用の環境（OS、ブラウザ）</li>
                  <li>発生している問題の詳細</li>
                  <li>エラーメッセージ（該当する場合）</li>
                  <li>お困りの機能や操作手順</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-modal-footer">
          <button className="close-footer-btn" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;