/**
 * The user-facing error catalogue.
 *
 * /error renders from a code rather than from a message passed through the URL.
 * That is on purpose: a page that prints arbitrary attacker-supplied text on
 * auth.harithkavish.com, under the HarithKavish mark, is a ready-made phishing
 * surface ("Your session expired — call this number"). Codes are a closed set,
 * and an unrecognised one falls back to a generic entry.
 */

import type { AuthErrorCode } from './types';

export const ERROR_PARAM = 'code';

export interface ErrorPresentation {
  title: string;
  /** What happened, in the user's terms. */
  detail: string;
  /** What they can do about it. */
  guidance: string;
  /**
   * Whether offering "return to the application" makes sense. It does not when
   * the request itself named an untrustworthy destination.
   */
  allowReturn: boolean;
}

const catalogue: Record<AuthErrorCode, ErrorPresentation> = {
  unauthorized_client: {
    title: 'This application cannot sign you in',
    detail:
      'The sign-in request either did not identify an application, or named one that is not registered to use your HarithKavish Account.',
    guidance:
      'Start again from the application you were using. If you reached this page from a link someone sent you, do not enter your details.',
    allowReturn: false,
  },
  invalid_redirect_uri: {
    title: 'This sign-in request was stopped',
    detail:
      'The request asked to send you somewhere the application has not registered as a return address. Continuing could have handed your sign-in to the wrong place.',
    guidance:
      'Nothing was sent anywhere and no details were entered. Go back to the application and start sign-in from there.',
    allowReturn: false,
  },
  invalid_request: {
    title: 'This sign-in request could not be read',
    detail: 'Part of the request was missing or malformed, so it could not be processed safely.',
    guidance: 'Return to the application and start sign-in again.',
    allowReturn: true,
  },
  access_denied: {
    title: 'Sign-in cancelled',
    detail: 'You chose not to sign in, so nothing was shared with the application.',
    guidance: 'You can head back and try again whenever you like.',
    allowReturn: true,
  },
  invalid_credentials: {
    title: 'Those details did not match',
    detail: 'The user ID and password combination was not recognised.',
    guidance: 'Check them and try again, or recover your account on the Account Platform.',
    allowReturn: true,
  },
  not_implemented: {
    title: 'Not connected yet',
    detail:
      'This part of the authentication service has not been built. The site is currently a preview of the sign-in experience.',
    guidance: 'Nothing was checked and nothing was stored. There is nothing to fix on your side.',
    allowReturn: true,
  },
  identity_unavailable: {
    title: 'Sign-in is temporarily unavailable',
    detail: 'Your HarithKavish Account could not be reached, so your details could not be checked.',
    guidance: 'This is a problem on our side. Please try again shortly.',
    allowReturn: true,
  },
};

const FALLBACK: ErrorPresentation = {
  title: 'Something went wrong',
  detail: 'This sign-in could not be completed.',
  guidance: 'Return to the application and start sign-in again.',
  allowReturn: true,
};

function isAuthErrorCode(value: string | null): value is AuthErrorCode {
  return value !== null && Object.prototype.hasOwnProperty.call(catalogue, value);
}

/** Maps a code to its presentation, falling back for anything unrecognised. */
export function presentError(code: string | null): ErrorPresentation {
  return isAuthErrorCode(code) ? catalogue[code] : FALLBACK;
}

/** Reads the error code from a query string. */
export function readErrorCode(search: string): string | null {
  return new URLSearchParams(search).get(ERROR_PARAM);
}
