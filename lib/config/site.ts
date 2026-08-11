/**
 * Static configuration for the Auth Platform shell.
 *
 * Auth is deliberately thin on "site content": it is not a marketing site and
 * not a dashboard. What lives here is the handful of constants the chrome and
 * metadata need, plus the outbound links to the platforms Auth defers to.
 */

/**
 * The canonical production origin. Overridable per environment (preview
 * deployments, local development) but always falls back to the real domain.
 *
 * From Phase 4 this doubles as the WebAuthn relying party origin, which is why
 * it is a single source of truth rather than a literal sprinkled through pages.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://auth.harithkavish.com';

/**
 * The Account Platform. Auth never creates accounts — every "I don't have an
 * account" path in this application terminates at this origin.
 */
const ACCOUNT_URL = process.env.NEXT_PUBLIC_ACCOUNT_URL || 'https://account.harithkavish.com';

export const site = {
  /** The product is branded simply "Auth" beside the HarithKavish mark. */
  name: 'Auth',
  fullName: 'HarithKavish Auth',
  domain: 'auth.harithkavish.com',
  url: SITE_URL,
  parentUrl: 'https://harithkavish.com',
  summary: 'Sign in to your HarithKavish Account to continue to a HarithKavish application.',
} as const;

export const accountPlatform = {
  name: 'HarithKavish Account',
  url: ACCOUNT_URL,
  /**
   * Where "Create one" points. The Account Platform owns account creation; Auth
   * only ever links out to it.
   */
  signUpUrl: `${ACCOUNT_URL}/signup`,
  /**
   * Account recovery is an Account Platform lifecycle feature (Phase 6). Auth
   * links to it rather than implementing any part of it.
   */
  recoveryUrl: `${ACCOUNT_URL}/security`,
  /** Passkeys are registered and managed on Account; Auth only consumes them. */
  passkeyUrl: `${ACCOUNT_URL}/passkey`,
} as const;
