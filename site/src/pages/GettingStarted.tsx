import { useT } from '../i18n/useT';
import { CopyButton } from '../components/CopyButton';

/**
 * Exact commands from architecture.md's Data flow sequence diagram
 * (lines ~473-474) — do not change this format without updating the
 * architecture spec first.
 */
const ADD_MARKETPLACE_COMMAND =
  'claude plugin marketplace add viptech/dev-digest-ai-marketplace --scope project';
const INSTALL_PLUGIN_COMMAND = 'claude plugin install <name>@dev-digest-ai-marketplace --scope project';

export function GettingStarted() {
  const t = useT();

  return (
    <section>
      <h1>{t('gettingStarted.title')}</h1>
      <p>{t('gettingStarted.intro')}</p>

      <section>
        <h2>{t('gettingStarted.addMarketplaceTitle')}</h2>
        <p>{t('gettingStarted.addMarketplaceBody')}</p>
        <pre>
          <code>{ADD_MARKETPLACE_COMMAND}</code>
        </pre>
        <CopyButton text={ADD_MARKETPLACE_COMMAND} label={t('gettingStarted.copyCommand')} />
      </section>

      <section>
        <h2>{t('gettingStarted.installPluginTitle')}</h2>
        <p>{t('gettingStarted.installPluginBody')}</p>
        <pre>
          <code>{INSTALL_PLUGIN_COMMAND}</code>
        </pre>
        <CopyButton text={INSTALL_PLUGIN_COMMAND} label={t('gettingStarted.copyCommand')} />
      </section>
    </section>
  );
}
