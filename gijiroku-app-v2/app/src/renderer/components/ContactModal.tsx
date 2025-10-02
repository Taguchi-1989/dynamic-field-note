/**
 * @fileoverview Contact modal component for user support
 * @module components/ContactModal
 */

import React, { useCallback, memo } from 'react';
import './ContactModal.css';

/**
 * Contact form URL
 */
const CONTACT_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSc1A7dJwE6FiL-AJBEHLCutMlNxb59gXYCYgXNdbFd428GF5A/viewform?usp=header';

/**
 * Information items to provide when contacting support
 */
const INFO_ITEMS = [
  'ご利用の環境（OS、ブラウザ）',
  '発生している問題の詳細',
  'エラーメッセージ（該当する場合）',
  'お困りの機能や操作手順',
] as const;

/**
 * Props for ContactModal component
 */
interface ContactModalProps {
  /** Controls modal visibility */
  isOpen: boolean;
  /** Callback fired when modal should close */
  onClose: () => void;
}

/**
 * Contact modal component
 *
 * Displays contact information and a link to the support form.
 * Provides guidelines for submitting inquiries.
 *
 * @example
 * ```tsx
 * <ContactModal
 *   isOpen={isContactOpen}
 *   onClose={() => setIsContactOpen(false)}
 * />
 * ```
 */
const ContactModal: React.FC<ContactModalProps> = memo(({ isOpen, onClose }) => {
  /**
   * Handle overlay click to close modal
   */
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      event.preventDefault();
      onClose();
    },
    [onClose]
  );

  /**
   * Prevent click event propagation from modal content
   */
  const handleContentClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      event.stopPropagation();
    },
    []
  );

  /**
   * Handle close button click
   */
  const handleClose = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      onClose();
    },
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      <div className="contact-modal-content" onClick={handleContentClick}>
        <div className="contact-modal-header">
          <h2 id="contact-modal-title">
            <i className="fas fa-envelope" aria-hidden="true" />
            お問い合わせ
          </h2>
          <button
            className="close-btn"
            onClick={handleClose}
            aria-label="閉じる"
            type="button"
          >
            <i className="fas fa-times" aria-hidden="true" />
          </button>
        </div>

        <div className="contact-modal-body">
          <div className="contact-info">
            <div className="contact-item">
              <i className="fas fa-clipboard-list" aria-hidden="true" />
              <div>
                <h3>お問い合わせフォーム</h3>
                <p>ご質問やご要望をお聞かせください</p>
                <a
                  href={CONTACT_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link"
                >
                  お問い合わせフォームを開く
                </a>
              </div>
            </div>
          </div>

          <div className="contact-form-info">
            <div className="info-card">
              <i className="fas fa-info-circle" aria-hidden="true" />
              <div>
                <h4>お問い合わせの際は以下をお知らせください</h4>
                <ul>
                  {INFO_ITEMS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="contact-modal-footer">
          <button
            className="close-footer-btn"
            onClick={handleClose}
            type="button"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
});

ContactModal.displayName = 'ContactModal';

export default ContactModal;
export type { ContactModalProps };