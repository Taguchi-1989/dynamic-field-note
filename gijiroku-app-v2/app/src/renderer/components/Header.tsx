/**
 * @fileoverview Application header component with navigation
 * @module components/Header
 */

import React, { useState, useCallback, memo } from 'react';
import './Header.css';
import './Header.mobile.css';

/**
 * Application title constant
 */
const APP_TITLE = '議事録修正支援アプリ';

/**
 * Application subtitle constant
 */
const APP_SUBTITLE = 'Microsoft Teams VTT → Markdown/PDF 自動変換';

/**
 * Navigation items configuration
 */
const NAV_ITEMS = [
  { href: '#dictionary', label: 'カスタム辞書設定' },
  { href: '#help', label: 'ヘルプ' },
] as const;

/**
 * Props for Header component
 */
interface HeaderProps {
  /** Optional refresh callback */
  onRefresh?: () => void;
}

/**
 * Application header component
 *
 * Displays the application title, refresh button, and navigation menu.
 * Includes responsive mobile menu toggle.
 *
 * @example
 * ```tsx
 * <Header onRefresh={() => handleRefresh()} />
 * ```
 */
const Header: React.FC<HeaderProps> = memo(({ onRefresh }) => {
  /**
   * Mobile menu open state
   */
  const [open, setOpen] = useState<boolean>(false);

  /**
   * Toggle mobile menu
   */
  const toggleMenu = useCallback((): void => {
    setOpen((prev) => !prev);
  }, []);

  /**
   * Handle refresh button click
   */
  const handleRefresh = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      onRefresh?.();
    },
    [onRefresh]
  );

  const navClassName = `header-nav ${open ? 'open' : ''}`;

  return (
    <header className="header" role="banner">
      <div className="header-content container">
        <div className="header-title-wrap">
          <h1 className="header-title">{APP_TITLE}</h1>
          <p className="header-subtitle">{APP_SUBTITLE}</p>
        </div>

        {onRefresh && (
          <button
            className="header-refresh-btn tap-target"
            onClick={handleRefresh}
            aria-label="リフレッシュ"
            title="入力内容をクリア"
            type="button"
          >
            <i className="fas fa-sync-alt" aria-hidden="true" />
            <span className="refresh-label">リフレッシュ</span>
          </button>
        )}

        <button
          className="menu-toggle tap-target"
          aria-label="メニュー"
          aria-controls="primary-nav"
          aria-expanded={open}
          onClick={toggleMenu}
          type="button"
        >
          <span className="sr-only">メニュー</span>
          <i className="fas fa-bars" aria-hidden="true" />
        </button>

        <nav id="primary-nav" className={navClassName} role="navigation">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-link tap-target"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

export default Header;
export type { HeaderProps };
