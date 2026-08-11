/**
 * Turning an incoming URL into a validated `AuthRequest`.
 *
 * This module is the trust boundary of the front end. Everything it receives is
 * attacker-controllable, so the rules are strict and deliberately boring:
 *
 *   1. `client_id` must name a client in the registry. No fallback, no guessing
 *      from the Referer header, no "unknown application" placeholder rendered
 *      as though it were legitimate.
 *   2. `redirect_uri` must appear *verbatim* in that client's registered list.
 *      An unregistered value is an error the user sees on auth.harithkavish.com
 *      — it is never followed, and never echoed back as a link.
 *   3. `state` is opaque. Auth round-trips it and never parses it.
 *
 * Rule 2 is the one that matters most. An identity provider that redirects to
 * an attacker-supplied URL hands over whatever it appended to that URL, which
 * is the whole point of the redirect. So the check is exact-match against a
 * closed list, applied here, with no way for a page to reach a destination
 * except through `resolveRedirectUri`.
 *
 * Parameters are read from `window.location` rather than `useSearchParams` so
 * the pages stay statically prerenderable, matching the Account Platform.
 */

import { defaultClient, findClient } from './clients';
import type { AuthClient, AuthError, AuthMethod, AuthRequest, Result } from './types';

/** Query parameter names, aligned with OAuth 2.0 so Phase 4 keeps them. */
export const PARAMS = {
  clientId: 'client_id',
  redirectUri: 'redirect_uri',
  state: 'state',
  method: 'method',
} as const;

/**
 * An upper bound on the opaque `state` value. Long enough for any legitimate
 * signed value, short enough that the parameter cannot be used to stuff the
 * page with megabytes of attacker-chosen text.
 */
const STATE_MAX_LENGTH = 512;

function isAuthMethod(value: string | null): value is AuthMethod {
  return value === 'password' || value === 'passkey';
}

/**
 * Resolves the redirect target for a client.
 *
 * The requested value is honoured only on an exact match against the client's
 * registered URIs. Anything else — a different host, a different path, a
 * lookalike, a `javascript:` URL, a protocol-relative `//evil.example` — falls
 * through to `null`, and the caller turns that into a visible error rather than
 * a redirect.
 *
 * When no `redirect_uri` is supplied at all, the client's first registered URI
 * is used. That is safe because it comes from the registry, not the request.
 */
export function resolveRedirectUri(client: AuthClient, requested: string | null): string | null {
  if (!requested) return client.redirectUris[0] ?? null;
  return client.redirectUris.includes(requested) ? requested : null;
}

function error(code: AuthError['code'], message: string): Result<AuthRequest> {
  return { ok: false, error: { code, message } };
}

/**
 * Validates a set of authorization parameters into an `AuthRequest`.
 *
 * `allowSynthesized` exists only for Phase 1: opening auth.harithkavish.com
 * directly has no `client_id`, and the login screen still needs to render for
 * design review. The resulting request is marked `synthesized: true` so the UI
 * can state plainly that no application actually requested this sign-in.
 * Phase 4 calls this with `false` and rejects the request instead.
 */
export function parseAuthRequest(
  params: URLSearchParams,
  { allowSynthesized = false }: { allowSynthesized?: boolean } = {},
): Result<AuthRequest> {
  const rawClientId = params.get(PARAMS.clientId);
  const rawRedirectUri = params.get(PARAMS.redirectUri);
  const rawState = params.get(PARAMS.state);
  const rawMethod = params.get(PARAMS.method);

  if (rawState !== null && rawState.length > STATE_MAX_LENGTH) {
    return error('invalid_request', 'The sign-in request was malformed and could not be read.');
  }

  if (rawMethod !== null && !isAuthMethod(rawMethod)) {
    return error('invalid_request', 'The sign-in request asked for an authentication method that does not exist.');
  }

  const synthesized = rawClientId === null;

  if (synthesized && !allowSynthesized) {
    return error(
      'unauthorized_client',
      'This sign-in request did not say which application it came from, so it cannot be completed.',
    );
  }

  const client = synthesized ? defaultClient() : findClient(rawClientId);

  if (!client) {
    // Naming the rejected id back to the user is safe (they supplied it) and
    // makes a typo in an integration obvious.
    return error(
      'unauthorized_client',
      'That application is not registered to sign people in with their HarithKavish Account.',
    );
  }

  const redirectUri = resolveRedirectUri(client, synthesized ? null : rawRedirectUri);

  if (!redirectUri) {
    return error(
      'invalid_redirect_uri',
      `The return address in this request is not one that ${client.name} has registered, so signing in here was stopped.`,
    );
  }

  return {
    ok: true,
    data: {
      client,
      redirectUri,
      state: synthesized ? null : rawState,
      method: isAuthMethod(rawMethod) ? rawMethod : 'password',
      synthesized,
    },
  };
}

/**
 * Reads the current browser URL as an authentication request.
 *
 * Returns `null` on the server, where there is no URL to read; callers hold
 * their render until hydration rather than guessing.
 */
export function readAuthRequest(options?: { allowSynthesized?: boolean }): Result<AuthRequest> | null {
  if (typeof window === 'undefined') return null;
  return parseAuthRequest(new URLSearchParams(window.location.search), options);
}

/**
 * Serialises a request into query parameters, so the user can move between
 * /login, /passkey and /error without losing the application context.
 *
 * A synthesized request serialises to nothing: it was never a real request, and
 * writing an invented `client_id` into the URL would make it look like one.
 */
export function toSearchParams(request: AuthRequest | null): URLSearchParams {
  const params = new URLSearchParams();
  if (!request || request.synthesized) return params;

  params.set(PARAMS.clientId, request.client.id);
  params.set(PARAMS.redirectUri, request.redirectUri);
  if (request.state) params.set(PARAMS.state, request.state);
  if (request.method !== 'password') params.set(PARAMS.method, request.method);

  return params;
}

/** The query string for a request, including the leading `?`, or '' if empty. */
export function toQueryString(request: AuthRequest): string {
  const query = toSearchParams(request).toString();
  return query ? `?${query}` : '';
}

/**
 * Builds an internal href that carries the application context along, plus any
 * extra parameters the destination needs (an error code, a preview flag).
 *
 * Every internal link in the app goes through here rather than concatenating
 * query strings by hand, so there is exactly one place where these URLs are
 * assembled and encoding is never anyone's problem.
 */
export function withRequest(
  path: string,
  request: AuthRequest | null,
  extra?: Record<string, string>,
): string {
  const params = toSearchParams(request);
  for (const [key, value] of Object.entries(extra ?? {})) {
    params.set(key, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
