'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { RequestGate } from '@/components/auth-request';
import { Handoff } from '@/components/client-context';
import { FormAlert, RouteLoading } from '@/components/form';
import { ArrowRightIcon } from '@/components/icons';
import { useLocationSearch } from '@/components/use-location-search';
import { withRequest } from '@/lib/auth/request';
import { buildPreviewOutcome, isPreviewRequested } from '@/lib/auth/preview';
import type { AuthOutcome, AuthRequest } from '@/lib/auth/types';

/** Initials for the subject chip, derived rather than stored. */
function initials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * The handoff screen: the moment between a successful sign-in and the return to
 * the requesting application.
 *
 * It exists as its own step rather than as an instant redirect because this is
 * the last point at which the user can see, in plain language, which account is
 * about to be shared and with whom.
 */
function HandoffPanel({ request, outcome }: { request: AuthRequest; outcome: AuthOutcome }) {
  return (
    <div className="stack">
      <div className="panel">
        <Handoff client={request.client} />

        <div className="panel__head">
          <h1 className="panel__title">Continue to {request.client.name}</h1>
          <p className="panel__lead">You are signed in to your HarithKavish Account</p>
        </div>

        <div className="outcome">
          <span className="outcome__subject">
            <span className="avatar" aria-hidden="true">
              {initials(outcome.subject.displayName)}
            </span>
            <span>
              <span className="outcome__name">{outcome.subject.displayName}</span>{' '}
              <span className="outcome__id">({outcome.subject.userId})</span>
            </span>
          </span>
        </div>

        <FormAlert tone="notice">
          <strong>Preview only.</strong> Nobody has been authenticated. This screen shows the design
          of the handoff step using placeholder details, and the button below is disabled because
          there is no sign-in to hand over.
        </FormAlert>

        <dl className="detail-list">
          <div className="detail-list__row">
            <dt className="detail-list__term">Application</dt>
            <dd className="detail-list__value">{request.client.name}</dd>
          </div>
          <div className="detail-list__row">
            <dt className="detail-list__term">Returns to</dt>
            <dd className="detail-list__value">{request.redirectUri}</dd>
          </div>
          <div className="detail-list__row">
            <dt className="detail-list__term">Method</dt>
            <dd className="detail-list__value">
              {outcome.method === 'passkey' ? 'Passkey' : 'Password'}
            </dd>
          </div>
          <div className="detail-list__row">
            <dt className="detail-list__term">Shared</dt>
            {/*
              Naming exactly what crosses the boundary. Auth hands over an
              identifier and a display name — not the account, and nothing the
              Account Platform holds beyond this.
            */}
            <dd className="detail-list__value">Your user ID and display name</dd>
          </div>
        </dl>

        <div className="form__actions">
          <button type="button" className="button button--primary button--full" disabled>
            Continue to {request.client.name}
            <ArrowRightIcon />
          </button>

          <Link className="button button--quiet button--full" href={withRequest('/login', request)}>
            Back to sign in
          </Link>
        </div>
      </div>

      <p className="preview-note">
        In Phase 4 this step completes automatically: Auth issues an authorization code to{' '}
        {request.client.name} and returns you to the application.
      </p>
    </div>
  );
}

function ContinueRoute({ request }: { request: AuthRequest }) {
  const router = useRouter();
  const search = useLocationSearch();
  const preview = search !== null && isPreviewRequested(search);

  /*
   * Reaching this route without a preview flag means there is no authentication
   * to hand over — Phase 1 cannot produce one. Rather than inventing a session,
   * the user goes back to the start of the flow with their request intact.
   */
  useEffect(() => {
    if (!preview) {
      router.replace(withRequest('/login', request));
    }
  }, [preview, request, router]);

  if (!preview) {
    return <RouteLoading label="Returning to sign-in…" />;
  }

  return <HandoffPanel request={request} outcome={buildPreviewOutcome(request)} />;
}

export default function ContinuePage() {
  return (
    // Wider than the sign-in column: this screen summarises the request rather
    // than asking for input, and the return address has to be readable in one
    // piece for the user to check it.
    <AuthShell wide>
      <RequestGate allowSynthesized>{(request) => <ContinueRoute request={request} />}</RequestGate>
    </AuthShell>
  );
}
