import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

/**
 * SECURITY INVARIANT (architecture.md:327-332, Invariant at
 * architecture.md:571-575): every piece of repository-sourced Markdown
 * rendered on this site MUST go through `DOMPurify.sanitize()` after
 * `marked.parse()`, with NO exceptions, before it is ever inserted into the
 * DOM. This applies to README, SKILL.md, agent body, and CHANGELOG text
 * alike — all of it originates from repository content and is therefore
 * untrusted input.
 *
 * This is the single function in the whole app allowed to call
 * `marked.parse()`. Do not call `marked.parse()` anywhere else — route every
 * markdown-rendering call site through this function (or, in components,
 * through `<Markdown />` in `../components/Markdown.tsx`, which wraps it).
 */
export function renderMarkdownToSafeHtml(markdown: string): string {
  const rawHtml = marked.parse(markdown, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}
