'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { RequestGate } from '@/components/auth-request';
import { Handoff, RequestSummary } from '@/components/client-context';
import { Field, FormAlert } from '@/components/form';
import { ArrowLeftIcon, ExternalIcon, KeyIcon } from '@/components/icons';
import { getAuthBackend } from '@/lib/auth/backend';
import { withRequest } from '@/lib/auth/request';
import type { AuthRequest } from '@/lib/auth/types';
import { hasErrors, validatePasskeyStart, type FieldErrors } from '@/lib/auth/validation';
import { accountPlatform } from '@/lib/config/site';

/**
 * The states a passkey sign-in moves through.
 *
 * These are the real states Phase 4 will drive from `navigator.credentials.get()`
 * — idle before the call, `waiting` while the browser's own prompt is open, and
 * then either a failure or a completed assertion. Building them now means the
 * WebAuthn work is a matter of replacing what triggers each transition, not of
 * designing the screen again.
 */
type PasskeyState = 'idle' | 'waiting' | 'failed';

function PasskeyPanel({ request }: { request: AuthRequest }) {
  const backend = useMemo(() => getAuthBackend(), []);

  const [userId, setUserId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<PasskeyState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const isPreview = backend.kind === 'mock';
  const supported = backend.capabilities.passkeyAuthentication;

  async function handleStart() {
    const errors = validatePasskeyStart(userId);
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setMessage(null);
    setState('waiting');

    /*
     * Phase 4 calls navigator.credentials.get() here and hands the resulting
     * assertion to the backend for verification. Phase 1 asks the backend
     * directly, which refuses — and deliberately never opens a credential
     * prompt, because a prompt that leads nowhere teaches people to approve
     * them without reading.
     */
    const result = await backend.authenticateWithPasskey({
      request,
      userId: userId.trim() || undefined,
    });

    if (result.ok) {
      // Unreachable in Phase 1; Phase 4 redirects back to the application here.
      return;
    }

    setState('failed');
    setMessage(result.error.message);
  }

  const statusText =
    state === 'waiting'
      ? 'Waiting for your device…'
      : supported
        ? 'Your device will ask you to confirm with your fingerprint, face, or screen lock.'
        : 'Passkey sign-in is part of the authentication service and is not connected yet.';

  return (
    <div className="stack">
      <div className="panel">
        <Handoff client={request.client} />

        <div className="panel__head">
          <h1 className="panel__title">Use a passkey for {request.client.name}</h1>
          <p className="panel__lead">Sign in with the passkey on this device</p>
        </div>

        <RequestSummary request={request} />

        <div className={`passkey${state === 'waiting' ? ' passkey--waiting' : ''}`}>
          <KeyIcon />
          <p className="passkey__status" role="status" aria-live="polite">
            {statusText}
          </p>
        </div>

        {message && <FormAlert tone={isPreview ? 'notice' : 'error'}>{message}</FormAlert>}

        <Field
          label="User ID"
          name="userId"
          value={userId}
          onChange={setUserId}
          autoComplete="username webauthn"
          placeholder="your-user-id"
          hint="Optional — leave blank if your device can offer the right passkey on its own."
          error={fieldErrors.userId}
          required={false}
          disabled={state === 'waiting'}
        />

        <div className="form__actions">
          <button
            type="button"
            className="button button--primary button--full"
            onClick={handleStart}
            disabled={state === 'waiting'}
          >
            {state === 'waiting' ? (
              <>
                <span className="button__spinner" aria-hidden="true" />
                Waiting for your device…
              </>
            ) : (
              <>
                <KeyIcon className="button__icon" />
                Continue with a passkey
              </>
            )}
          </button>

          <Link className="button button--secondary button--full" href={withRequest('/login', request)}>
            <ArrowLeftIcon />
            Use a password instead
          </Link>
        </div>

        <ol className="steps">
          <li className="steps__item">
            <span className="steps__number" aria-hidden="true">
              1
            </span>
            <span>You register a passkey once, on your HarithKavish Account.</span>
          </li>
          <li className="steps__item">
            <span className="steps__number" aria-hidden="true">
              2
            </span>
            <span>Your device keeps the private key. It never leaves the device, and Auth never sees it.</span>
          </li>
          <li className="steps__item">
            <span className="steps__number" aria-hidden="true">
              3
            </span>
            <span>
              Signing in proves you hold that key, without a password being typed or sent anywhere.
            </span>
          </li>
        </ol>

        <p className="panel__footer">
          <a href={accountPlatform.passkeyUrl}>
            Manage passkeys on your Account
            <ExternalIcon className="panel__footer-icon" />
          </a>
        </p>
      </div>

      {isPreview && (
        <p className="preview-note">
          This screen shows the passkey interface only. No WebAuthn call is made and no credential
          prompt is opened.
        </p>
      )}
    </div>
  );
}

export default function PasskeyPage() {
  return (
    <AuthShell>
      <RequestGate allowSynthesized>{(request) => <PasskeyPanel request={request} />}</RequestGate>
    </AuthShell>
  );
}
