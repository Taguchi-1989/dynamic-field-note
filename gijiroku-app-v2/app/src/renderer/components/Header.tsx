import React, { useState } from 'react';
import './Header.css';
import './Header.mobile.css';

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="header">
      <div className="header-content container">
        <div className="header-title-wrap">
          <h1 className="header-title">議事録修正支援アプリ</h1>
          <p className="header-subtitle">Microsoft Teams VTT → Markdown/PDF 自動変換</p>
        </div>

        <button
          className="menu-toggle tap-target"
          aria-label="メニュー"
          aria-controls="primary-nav"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">メニュー</span>
          <i className="fas fa-bars" aria-hidden></i>
        </button>

        <nav id="primary-nav" className={`header-nav ${open ? 'open' : ''}`}>
          <a href="#dictionary" className="nav-link tap-target">
            カスタム辞書設定
          </a>
          <a href="#help" className="nav-link tap-target">
            ヘルプ
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
