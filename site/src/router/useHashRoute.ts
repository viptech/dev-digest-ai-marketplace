import { useEffect, useState } from 'react';

/**
 * The six routes this SPA recognizes (architecture.md:512-517). `#/` and
 * `#/search` plus the two detail routes are implemented in Phase 3.2;
 * `whats-new` and `getting-started` render a placeholder page until
 * Phase 3.3 fills them in — the matcher recognizes all six from the start
 * so 3.3 never has to touch this router file.
 */
export type Route =
  | { name: 'home' }
  | { name: 'search' }
  | { name: 'plugin'; pluginName: string }
  | { name: 'artifact'; artifactId: string }
  | { name: 'whats-new' }
  | { name: 'getting-started' };

const DEFAULT_ROUTE: Route = { name: 'home' };

const HOME_RE = /^#\/?$/;
const SEARCH_RE = /^#\/search\/?$/;
const WHATS_NEW_RE = /^#\/whats-new\/?$/;
const GETTING_STARTED_RE = /^#\/getting-started\/?$/;
// Plugin names never contain '/' (== directory name under plugins/).
const PLUGIN_RE = /^#\/plugin\/([^/]+)\/?$/;
// Artifact ids DO contain '/' (`${pluginName}/skills/${skillDirName}` etc.),
// so this pattern must capture everything after the segment, not just one
// path component.
const ARTIFACT_RE = /^#\/artifact\/(.+?)\/?$/;

/**
 * Parses a `window.location.hash` string against the six known route
 * shapes. An unrecognized hash falls back to `#/` (home) — this is the
 * documented default for step 8's test coverage.
 */
export function parseHash(hash: string): Route {
  const normalized = hash.startsWith('#') ? hash : `#${hash}`;

  if (HOME_RE.test(normalized)) return { name: 'home' };
  if (SEARCH_RE.test(normalized)) return { name: 'search' };
  if (WHATS_NEW_RE.test(normalized)) return { name: 'whats-new' };
  if (GETTING_STARTED_RE.test(normalized)) return { name: 'getting-started' };

  const pluginMatch = PLUGIN_RE.exec(normalized);
  if (pluginMatch) {
    return { name: 'plugin', pluginName: decodeURIComponent(pluginMatch[1]) };
  }

  const artifactMatch = ARTIFACT_RE.exec(normalized);
  if (artifactMatch) {
    return { name: 'artifact', artifactId: decodeURIComponent(artifactMatch[1]) };
  }

  return DEFAULT_ROUTE;
}

/**
 * Hand-written hash router (architecture.md's resolved open question #8 —
 * no react-router dependency). Reads `window.location.hash`, subscribes to
 * `hashchange`, and re-renders with the newly matched route.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseHash(window.location.hash));
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return route;
}
