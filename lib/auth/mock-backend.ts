/**
 * PHASE 1 ONLY — the backend that refuses.
 *
 * ============================ READ THIS FIRST ============================
 * This is NOT authentication, and unlike a typical demo it does not attempt to
 * imitate authentication either. Every method returns `not_implemented`.
 *
 * That is a deliberate design decision, not an unfinished one. Auth's entire
 * job is to answer "has this person proved who they are?" — a mock that ever
 * answered "yes" would be training everyone who reviews this site, including
 * its author, to trust a screen that verified nothing. So:
 *
 *   - No credential is stored. Not hashed, not encoded, not in localStorage.
 *   - No password is compared against anything.
 *   - No session is created, because there is nobody to create one for.
 *   - No authorization code is issued, so no relying application can be handed
 *     a result that did not come from a real verification.
 *
 * The UI still exercises every state — typing, validation, the pending
 * spinner, the failure message — because those are real UI concerns. What it
 * never does is claim success.
 *
 * Phase 4 deletes this file and drops in a `ServerAuthBackend` implementing the
 * same `AuthBackend` interface, which verifies credentials against the Account
 * Platform over TLS and mints a real authorization code server-side. No page or
 * component should need to change.
 * ========================================================================
 */

import type {
  AuthBackend,
  AuthCapabilities,
  AuthOutcome,
  AuthRequest,
  PasskeyAttempt,
  PasswordAttempt,
  Result,
} from './types';

/** Keeps the refusal feeling like a network call so loading states are real. */
function settle<T>(value: T, ms = 420): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

const NOT_CONNECTED: Result<AuthOutcome> = {
  ok: false,
  error: {
    code: 'not_implemented',
    message:
      'This is a preview of the sign-in experience. The authentication service is not connected yet, so no credentials can be checked and no sign-in can complete.',
  },
};

export class MockAuthBackend implements AuthBackend {
  readonly kind = 'mock' as const;

  /**
   * Phase 1 implements exactly one thing for real: navigating a designed UI.
   * Everything else reports false so the interface can say so honestly instead
   * of simulating a result.
   */
  readonly capabilities: AuthCapabilities = {
    passwordAuthentication: false,
    passkeyAuthentication: false,
    authorizationCodes: false,
    singleSignOn: false,
  };

  /**
   * Note the unused `attempt`: the password reaches this method and goes no
   * further. It is not read, not copied, not stored, and becomes unreachable
   * the moment the caller's handler returns.
   */
  async authenticateWithPassword(attempt: PasswordAttempt): Promise<Result<AuthOutcome>> {
    void attempt;
    return settle(NOT_CONNECTED);
  }

  /**
   * Phase 4 replaces this with a real `navigator.credentials.get()` call and
   * server-side assertion verification. Returning a refusal is the honest
   * placeholder: a fake passkey prompt would be indistinguishable from a
   * phishing pattern we are specifically trying to make impossible.
   */
  async authenticateWithPasskey(attempt: PasskeyAttempt): Promise<Result<AuthOutcome>> {
    void attempt;
    return settle(NOT_CONNECTED);
  }

  /** No sessions exist, so there is never one to resume. */
  async resolveExistingSession(request: AuthRequest): Promise<AuthOutcome | null> {
    void request;
    return null;
  }
}
