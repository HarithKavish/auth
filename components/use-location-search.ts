'use client';

import { useSyncExternalStore } from 'react';

/*
 * The browser URL is an external system, so it is read as one rather than being
 * copied into component state inside an effect. That keeps the query string the
 * single source of truth for what was requested — there is no second copy that
 * can drift from it — and it means a page derives its content during render
 * instead of rendering once and then correcting itself.
 *
 * `useSearchParams` would do the same job, but it opts the route into dynamic
 * rendering, and these pages must stay statically prerenderable for the
 * GitHub Pages deployment.
 */

function subscribe(onStoreChange: () => void): () => void {
  // Covers back/forward navigation. In-app URL rewrites are handled by the
  // caller, which already knows the new value at the moment it triggers them.
  window.addEventListener('popstate', onStoreChange);
  return () => window.removeEventListener('popstate', onStoreChange);
}

function getSnapshot(): string {
  return window.location.search;
}

/** No URL exists during prerendering; `null` means "not resolved yet". */
function getServerSnapshot(): null {
  return null;
}

export function useLocationSearch(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
