import { useT } from '../i18n/useT';

export interface ComingSoonPageProps {
  title: string;
}

/**
 * Placeholder for the two routes Phase 3.3 implements (`#/whats-new`,
 * `#/getting-started`) — keeps the SPA from dead-ending on a nav link that
 * points at an unbuilt route.
 */
export function ComingSoonPage({ title }: ComingSoonPageProps) {
  const t = useT();
  return (
    <section>
      <h1>{title}</h1>
      <p>{t('comingSoon.body', 'This page is coming in a future phase.')}</p>
    </section>
  );
}
