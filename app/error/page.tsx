'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { Handoff } from '@/components/client-context';
import { BrandMark } from '@/components/brand';
import { RouteLoading } from '@/components/form';
import { ArrowLeftIcon, ExternalIcon } from '@/components/icons';
import { useLocationSearch } from '@/components/use-location-search';
import { presentError, readErrorCode } from '@/lib/auth/errors';
import { parseAuthRequest, withRequest } from '@/lib/auth/request';
import type { AuthClient } from '@/lib/auth/types';

/**
 * The error page.
 *
 * Two rules shape it.
 *
 * First, it renders from a code in a closed catalogue, never from a message in
 * the URL. A page under the HarithKavish mark that prints whatever text a link
 * hands it is a phishing kit, not an error page.
 *
 * Second, it does not use `RequestGate`. The gate sends invalid requests here,
 * so depending on it would mean an invalid request bounced between the two
 * forever. This page validates the request itself and simply does without the
 * application context when there isn't any.
 */
export default function ErrorPage() {
  const search = useLocationSearch();

  const resolved = useMemo(() => {
    if (search === null) return null;

    // A failed parse is expected here — that is often why the user arrived.
    const parsed = parseAuthRequest(new URLSearchParams(search), { allowSynthesized: false });

    return {
      presentation: presentError(readErrorCode(search)),
      request: parsed.ok ? parsed.data : null,
    };
  }, [search]);

  if (!resolved) {
    return (
      <AuthShell>
        <RouteLoading label="Loading…" />
      </AuthShell>
    );
  }

  const { presentation, request } = resolved;

  /*
   * The return link uses the client's registered origin from the registry — not
   * the `redirect_uri` from the URL. When the error *is* a bad redirect URI,
   * `allowReturn` is false and no outbound link is offered at all, so a crafted
   * request can never get its destination rendered as a button on this page.
   */
  const returnTo: AuthClient | null = presentation.allowReturn ? (request?.client ?? null) : null;

  return (
    <AuthShell>
      <div className="stack">
        <div className="panel">
          {request && presentation.allowReturn ? (
            <Handoff client={request.client} />
          ) : (
            <div className="handoff">
              <BrandMark />
            </div>
          )}

          <div className="panel__head">
            <h1 className="panel__title">{presentation.title}</h1>
            <p className="panel__lead">{presentation.detail}</p>
          </div>

          <p className="panel__lead" style={{ textAlign: 'center' }}>
            {presentation.guidance}
          </p>

          <div className="form__actions">
            {returnTo && (
              <a className="button button--primary button--full" href={returnTo.origin}>
                Return to {returnTo.name}
                <ExternalIcon />
              </a>
            )}

            <Link
              className={`button button--full ${returnTo ? 'button--quiet' : 'button--primary'}`}
              href={withRequest('/login', request)}
            >
              <ArrowLeftIcon />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
