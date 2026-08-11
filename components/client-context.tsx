'use client';

import type { CSSProperties } from 'react';
import { clientList } from '@/lib/auth/clients';
import type { AuthClient, AuthRequest, ClientId } from '@/lib/auth/types';
import { BrandMark } from './brand';

/**
 * The requesting application's badge. The accent comes from the registry, so a
 * new platform gets its own colour by being registered, not by editing CSS.
 */
export function ClientBadge({ client, small = false }: { client: AuthClient; small?: boolean }) {
  return (
    <span
      className={`client-badge${small ? ' client-badge--sm' : ''}`}
      style={{ '--client-accent': client.accent } as CSSProperties}
      aria-hidden="true"
    >
      {client.monogram}
    </span>
  );
}

/**
 * HarithKavish → requesting application.
 *
 * Auth's signature element. It answers "who is asking?" before the user reads
 * anything else, which is the question that decides whether they should be
 * typing a password on this page at all.
 */
export function Handoff({ client }: { client: AuthClient }) {
  return (
    <div className="handoff">
      <BrandMark />
      <span className="handoff__link" aria-hidden="true" />
      <ClientBadge client={client} />
      <span className="visually-hidden">HarithKavish Auth, signing you in to {client.name}</span>
    </div>
  );
}

/**
 * The plain-language summary of what is being requested.
 *
 * The return address is shown deliberately. It has already been validated
 * against the registry, so displaying it is not a security control — it is so
 * the user can see exactly where a successful sign-in would send them, which is
 * the one detail a phishing page cannot honestly reproduce.
 */
export function RequestSummary({ request }: { request: AuthRequest }) {
  return (
    <div className="request-summary">
      <ClientBadge client={request.client} small />
      <span className="request-summary__text">
        <span className="request-summary__name">{request.client.name}</span>
        <span className="request-summary__detail">{request.client.description}</span>
        <span className="request-summary__return">Returns you to {request.redirectUri}</span>
      </span>
    </div>
  );
}

/**
 * PHASE 1 ONLY — switches which application the mocked request comes from.
 *
 * It exists to prove the point that no application is hardcoded: the whole
 * screen re-renders from the registry entry. Styled as a dashed, explicitly
 * labelled developer control so it cannot be mistaken for part of the sign-in
 * experience, and removed in Phase 4 along with the mock backend.
 */
export function PreviewClientSwitch({
  request,
  onSwitch,
}: {
  request: AuthRequest;
  onSwitch: (id: ClientId) => void;
}) {
  return (
    <div className="preview-switch">
      <span className="preview-switch__label" id="preview-switch-label">
        Preview: requesting application
      </span>

      <div className="preview-switch__row" role="group" aria-labelledby="preview-switch-label">
        {clientList.map((client) => (
          <button
            key={client.id}
            type="button"
            className={`preview-switch__option${
              !request.synthesized && client.id === request.client.id ? ' is-active' : ''
            }`}
            onClick={() => onSwitch(client.id)}
            aria-pressed={!request.synthesized && client.id === request.client.id}
          >
            {client.name}
          </button>
        ))}
      </div>

      <p className="preview-switch__note">
        {request.synthesized
          ? 'No application requested this sign-in — you opened Auth directly, so Forge is shown as an example. Pick one to see a real request.'
          : 'This control is part of the Phase 1 preview and will not exist once applications are integrated.'}
      </p>
    </div>
  );
}
