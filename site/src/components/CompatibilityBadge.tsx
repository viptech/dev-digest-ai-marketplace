import { useT } from '../i18n/useT';
import type { CompatibilityInfo } from '../types/catalog';

export interface CompatibilityBadgeProps {
  info: CompatibilityInfo;
}

/**
 * Version + `COMPATIBILITY.md` floor badge (architecture.md:373-376,
 * Phase 3.3 bonus feature #3). Shared component — rendered on both the
 * catalog landing page's plugin cards (`HomePage`) and the `#/plugin/<name>`
 * detail page (`PluginPage`), per the react-ui-architecture skill's
 * "used by 2+ places → shared from the start" guidance.
 *
 * `info.floor` comes from `index.json`'s `compatibilityFloor` field
 * (parsed at build time from the plugin's own `COMPATIBILITY.md` by
 * `scripts/build-index.mjs`) — never a literal version string here, so a
 * future plugin raising its own floor needs no component change.
 */
export function CompatibilityBadge({ info }: CompatibilityBadgeProps) {
  const t = useT();

  return (
    <p aria-label={t('badge.sectionLabel')}>
      <span>
        {t('badge.version')}: {info.version}
      </span>
      {' · '}
      <span>{info.floor ? `${t('badge.floor')} ${info.floor}` : t('badge.floorUnknown')}</span>
    </p>
  );
}
