import type { ReactNode } from 'react';
import { useT } from '../i18n/useT';

export interface LayoutProps {
  children: ReactNode;
}

/**
 * Base app shell: header (brand + search entry point) and primary nav
 * matching the six routes `useHashRoute` recognizes (`#/whats-new` and
 * `#/getting-started` render their real Phase 3.3 pages, `WhatsNew` and
 * `GettingStarted`).
 */
export function Layout({ children }: LayoutProps) {
  const t = useT();

  return (
    <div>
      <header>
        <a href="#/">
          <strong>{t('layout.brand')}</strong>
        </a>
        <nav aria-label={t('layout.navLabel')}>
          <a href="#/">{t('nav.home')}</a>
          <a href="#/search">{t('nav.search')}</a>
          <a href="#/whats-new">{t('nav.whatsNew')}</a>
          <a href="#/getting-started">{t('nav.gettingStarted')}</a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
