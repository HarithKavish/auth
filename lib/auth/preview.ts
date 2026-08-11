/**
 * PHASE 1 ONLY — the UI preview escape hatch.
 *
 * The handoff screen (/continue) is a real part of the eventual flow and needs
 * to be designed, but it can only be reached by authenticating, and Phase 1
 * cannot authenticate anybody. This module is the narrow, clearly-labelled way
 * to view that screen anyway.
 *
 * The rules that keep this from becoming a fake sign-in:
 *
 *   - It is never reached by submitting credentials. The login form's failure
 *     path leads to an honest error, never to here.
 *   - The subject is a visible placeholder — "Example User" — not a name any
 *     real account could have supplied.
 *   - `authorizationCode` is a sentinel string that is obviously not a code,
 *     and no relying application is ever contacted with it.
 *   - Every screen rendered from it carries a preview notice, and the button
 *     that would return to the application is disabled.
 *
 * Phase 4 deletes this file.
 */

import type { AuthOutcome, AuthRequest } from './types';

/** Deliberately unmistakable if it ever appeared somewhere it should not. */
export const PREVIEW_AUTHORIZATION_CODE = 'not-a-real-authorization-code';

/** Query flag that puts the handoff screen into preview mode. */
export const PREVIEW_PARAM = 'preview';

export function isPreviewRequested(search: string): boolean {
  return new URLSearchParams(search).get(PREVIEW_PARAM) === '1';
}

/**
 * Builds the placeholder outcome the handoff screen renders in preview mode.
 * Nothing here came from a credential check, and the shape exists only so the
 * page is written against the same type Phase 4 will hand it.
 */
export function buildPreviewOutcome(request: AuthRequest): AuthOutcome {
  return {
    subject: {
      subjectId: '00000000-0000-0000-0000-000000000000',
      userId: 'example.user',
      displayName: 'Example User',
    },
    request,
    authorizationCode: PREVIEW_AUTHORIZATION_CODE,
    method: request.method,
    authenticatedAt: new Date().toISOString(),
  };
}
