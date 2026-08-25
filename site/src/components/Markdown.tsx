import { useMemo } from 'react';
import { renderMarkdownToSafeHtml } from '../markdown/renderMarkdown';

export interface MarkdownProps {
  markdown: string;
  className?: string;
}

/**
 * Renders repository-sourced Markdown (README/SKILL.md/agent body/CHANGELOG
 * text). This is the ONLY component in the app that uses
 * `dangerouslySetInnerHTML` — every page that needs to show markdown content
 * (PluginPage, ArtifactPage, and any future 3.3 page) must render through
 * this component instead of re-implementing the marked -> DOMPurify
 * pipeline at its own call site. See `../markdown/renderMarkdown.ts` for the
 * security invariant this enforces.
 */
export function Markdown({ markdown, className }: MarkdownProps) {
  const safeHtml = useMemo(() => renderMarkdownToSafeHtml(markdown), [markdown]);
  // eslint-disable-next-line react/no-danger -- sanitized via DOMPurify above, the one sanctioned call site.
  return <div className={className} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
