'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseAuthRequest, toQueryString } from '@/lib/auth/request';
import type { AuthError, AuthRequest, ClientId } from '@/lib/auth/types';
import { clients } from '@/lib/auth/clients';
import { RouteLoading } from './form';
import { useLocationSearch } from './use-location-search';

export type RequestStatus = 'resolving' | 'ready' | 'invalid';

interface UseAuthRequestResult {
  status: RequestStatus;
  request: AuthRequest | null;
  error: AuthError | null;
  /** Phase 1 only — re-points the mocked request at a different application. */
  switchClient: (id: ClientId) => void;
}

/**
 * Reads the current URL as an authentication request.
 *
 * The request is derived from the query string during render, so what is on
 * screen always matches what was actually asked for. Until the URL is readable
 * — during prerendering — the status is `resolving` and callers hold their
 * render: showing "continue to Forge" before the request has been validated
 * would put an application's name on screen that the request may not have
 * authorised.
 */
export function useAuthRequest(options?: { allowSynthesized?: boolean }): UseAuthRequestResult {
  const allowSynthesized = options?.allowSynthesized ?? false;
  const router = useRouter();
  const search = useLocationSearch();

  /**
   * Phase 1 only. The preview switch rewrites the URL, but Next's client
   * navigation does not emit `popstate`, so the chosen client is held here as
   * well. It is only ever set from an event handler, never from an effect.
   */
  const [override, setOverride] = useState<AuthRequest | null>(null);

  const parsed = useMemo(
    () => (search === null ? null : parseAuthRequest(new URLSearchParams(search), { allowSynthesized })),
    [search, allowSynthesized],
  );

  const switchClient = useCallback(
    (id: ClientId) => {
      const client = clients[id];
      const current = override ?? (parsed?.ok ? parsed.data : null);
      const next: AuthRequest = {
        client,
        redirectUri: client.redirectUris[0],
        state: current?.state ?? null,
        method: current?.method ?? 'password',
        synthesized: false,
      };
      setOverride(next);
      router.replace(`${window.location.pathname}${toQueryString(next)}`, { scroll: false });
    },
    [override, parsed, router],
  );

  if (override) {
    return { status: 'ready', request: override, error: null, switchClient };
  }

  if (!parsed) {
    return { status: 'resolving', request: null, error: null, switchClient };
  }

  if (parsed.ok) {
    return { status: 'ready', request: parsed.data, error: null, switchClient };
  }

  return { status: 'invalid', request: null, error: parsed.error, switchClient };
}

interface RequestGateProps {
  /** Rendered once the request has been validated. */
  children: (request: AuthRequest, switchClient: (id: ClientId) => void) => React.ReactNode;
  /**
   * Phase 1: allows /login to render when opened directly with no `client_id`.
   * The resulting request is flagged `synthesized` and the UI says so.
   */
  allowSynthesized?: boolean;
  loadingLabel?: string;
}

/**
 * Wraps the pages that need a validated request. An invalid one is sent to
 * /error, which explains what was wrong without ever following the address the
 * request asked for.
 */
export function RequestGate({
  children,
  allowSynthesized = false,
  loadingLabel = 'Checking this sign-in request…',
}: RequestGateProps) {
  const { status, request, error, switchClient } = useAuthRequest({ allowSynthesized });
  const router = useRouter();

  useEffect(() => {
    if (status === 'invalid' && error) {
      router.replace(`/error?code=${encodeURIComponent(error.code)}`);
    }
  }, [status, error, router]);

  if (status !== 'ready' || !request) {
    return <RouteLoading label={loadingLabel} />;
  }

  return <>{children(request, switchClient)}</>;
}
