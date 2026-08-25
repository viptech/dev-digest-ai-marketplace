import type { ReactNode } from 'react';
import { useT } from '../i18n/useT';

export interface LayoutProps {
  children: ReactNode;
}

/**
 * Base app shell: header (brand + search entry point) and primary nav
 * matching the six routes `useHashRoute` recognizes. `#/whats-new` and
 * `#/getting-started` link here even though they render a placeholder page
 * until Phase 3.3 — the SPA should never dead-end on an unimplemented nav
 * link.
 */
export function Layout({ children }: LayoutProps) {
  const t = useT();

  return (
    <div>
      <header>
        <a href="#/">
          <strong>{t('layout.brand', 'Dev Digest AI Marketplace')}</strong>
        </a>
        <nav aria-label={t('layout.navLabel', 'Primary')}>
          <a href="#/">{t('nav.home', 'Home')}</a>
          <a href="#/search">{t('nav.search', 'Search')}</a>
          <a href="#/whats-new">{t('nav.whatsNew', "What's new")}</a>
          <a href="#/getting-started">{t('nav.gettingStarted', 'Getting started')}</a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
