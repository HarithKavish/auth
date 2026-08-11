'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { RequestGate } from '@/components/auth-request';
import { Handoff, PreviewClientSwitch, RequestSummary } from '@/components/client-context';
import { Field, FormAlert, SubmitButton } from '@/components/form';
import { KeyIcon } from '@/components/icons';
import { getAuthBackend } from '@/lib/auth/backend';
import { withRequest } from '@/lib/auth/request';
import { ERROR_PARAM } from '@/lib/auth/errors';
import { PREVIEW_PARAM } from '@/lib/auth/preview';
import type { AuthRequest, ClientId } from '@/lib/auth/types';
import { hasErrors, validateSignIn, type FieldErrors } from '@/lib/auth/validation';
import { accountPlatform } from '@/lib/config/site';

function SignInPanel({ request, onSwitchClient }: { request: AuthRequest; onSwitchClient: (id: ClientId) => void }) {
  const backend = useMemo(() => getAuthBackend(), []);

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isPreview = backend.kind === 'mock';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const errors = validateSignIn({ userId, password });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setPending(true);
    /*
     * The password is handed to the backend and nothing else. It is not put in
     * a URL, not written to storage, and not logged. In Phase 1 the backend
     * refuses outright; in Phase 4 it travels over TLS to the Account Platform
     * and is discarded as soon as the verification returns.
     */
    const result = await backend.authenticateWithPassword({ request, userId, password });
    setPending(false);

    if (result.ok) {
      /*
       * Unreachable in Phase 1 — the mock backend never returns ok. Phase 4
       * replaces this with the server-issued redirect back to the application,
       * carrying the authorization code and the original `state`.
       */
      return;
    }

    if (result.error.field) {
      setFieldErrors({ [result.error.field]: result.error.message });
    } else {
      setFormError(result.error.message);
    }
  }

  return (
    <div className="stack">
      <div className="panel">
        <Handoff client={request.client} />

        <div className="panel__head">
          <h1 className="panel__title">Sign in to continue to {request.client.name}</h1>
          <p className="panel__lead">Use your HarithKavish Account</p>
        </div>

        <RequestSummary request={request} />

        {formError && <FormAlert tone={isPreview ? 'notice' : 'error'}>{formError}</FormAlert>}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <Field
            label="User ID"
            name="userId"
            value={userId}
            onChange={setUserId}
            autoComplete="username"
            placeholder="your-user-id"
            error={fieldErrors.userId}
            disabled={pending}
            autoFocus
          />

          <Field
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            error={fieldErrors.password}
            disabled={pending}
          />

          <div className="form__actions">
            <SubmitButton pending={pending} pendingLabel="Signing in…">
              Sign in
            </SubmitButton>
          </div>
        </form>

        <div className="divider">or</div>

        <div className="form__actions">
          <Link className="button button--secondary button--full" href={withRequest('/passkey', request)}>
            <KeyIcon className="button__icon" />
            Use a passkey
          </Link>

          {/*
            Cancelling is a first-class outcome, not a dead end. It routes to
            the error page as `access_denied`, which is where the offer to
            return to the application lives — and that return address comes
            from the registry, never from the URL that got the user here.
          */}
          <Link
            className="button button--quiet button--full"
            href={withRequest('/error', request, { [ERROR_PARAM]: 'access_denied' })}
          >
            Cancel
          </Link>
        </div>

        <p className="panel__footer">
          Don&rsquo;t have an account?{' '}
          <a href={accountPlatform.signUpUrl}>Create one</a>
        </p>
      </div>

      {isPreview && <PreviewClientSwitch request={request} onSwitch={onSwitchClient} />}

      {isPreview && (
        <p className="preview-note">
          <Link href={withRequest('/continue', request, { [PREVIEW_PARAM]: '1' })}>
            View the handoff screen
          </Link>{' '}
          — a preview of the step after a successful sign-in. Nothing is authenticated.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      {/*
        `allowSynthesized` keeps this page reachable when auth.harithkavish.com
        is opened directly, which Phase 1 needs for design review. The request is
        flagged and the UI says no application asked for it.
      */}
      <RequestGate allowSynthesized>
        {(request, switchClient) => <SignInPanel request={request} onSwitchClient={switchClient} />}
      </RequestGate>
    </AuthShell>
  );
}
