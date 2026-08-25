import { useState } from 'react';

export interface CopyButtonProps {
  text: string;
  label: string;
}

/**
 * Copy-to-clipboard affordance used by the plugin install-command block.
 * If the Clipboard API is unavailable (e.g. insecure context, denied
 * permission), it fails silently — the command text itself is already
 * visible and selectable, so nothing is lost.
 */
export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable or denied — command text stays visible for manual copy.
    }
  }

  return (
    <button type="button" onClick={() => void handleClick()} aria-label={label}>
      {copied ? 'Copied!' : label}
    </button>
  );
}
