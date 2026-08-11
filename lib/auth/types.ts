/**
 * Domain types for the HarithKavish Authentication Platform.
 *
 * The shapes here are deliberately close to an OAuth 2.0 / OpenID Connect
 * authorization request, because that is the standard Phase 4 will adopt rather
 * than inventing a bespoke protocol. Phase 1 does not implement any of it — but
 * naming the concepts correctly now means the eventual swap is an
 * implementation change, not a redesign.
 *
 * The single most important boundary in this file: Auth describes accounts, it
 * does not own them. There is no user record here, no password field, and no
 * credential of any kind. The Account Platform holds those; Auth only ever
 * receives the *outcome* of a verification it asked for.
 */

/* -------------------------------------------------------------- clients -- */

/** Identifiers of applications registered to use HarithKavish Auth. */
export type ClientId = 'forge' | 'nexus' | 'vr';

/**
 * A registered relying application.
 *
 * In Phase 4 this becomes a database table, and `redirectUris` becomes the
 * allow-list the authorization endpoint checks. The shape is the same either
 * way, which is why the UI is already written against it.
 */
export interface AuthClient {
  id: ClientId;
  /** Display name shown to the user: "Sign in to continue to Forge". */
  name: string;
  /** One line describing the app, so the user knows what they are approving. */
  description: string;
  /** The application's own origin, used for cancel/return links. */
  origin: string;
  /**
   * Exact redirect URIs this client has registered. Membership of this list is
   * the *only* thing that ever makes a redirect target acceptable. See
   * `resolveRedirectUri` in ./request.ts.
   */
  redirectUris: readonly string[];
  /** Two-letter monogram for the client badge. */
  monogram: string;
  /** Accent colour for the client badge, as a CSS colour. */
  accent: string;
  /** False while the client is described but not yet integrated (Phase 5). */
  integrated: boolean;
}

/* ------------------------------------------------------------- requests -- */

/**
 * Which credential the requesting application would like Auth to try first.
 * A hint only — the user can always switch method, and Phase 4 must never let
 * a client *downgrade* the requirement via this field.
 */
export type AuthMethod = 'password' | 'passkey';

/**
 * A validated authentication request.
 *
 * Constructing one of these is the *only* way a page learns which application
 * it is authenticating for. There is no path from a raw query string to a
 * rendered destination that skips validation — see ./request.ts.
 */
export interface AuthRequest {
  /** The resolved client. Never a bare id, so pages cannot render an unknown app. */
  client: AuthClient;
  /**
   * The redirect target, already checked against `client.redirectUris`.
   * Never taken verbatim from the query string.
   */
  redirectUri: string;
  /**
   * Opaque CSRF/continuity value round-tripped back to the client untouched.
   * Auth never interprets it.
   */
  state: string | null;
  /** The client's preferred first factor. */
  method: AuthMethod;
  /**
   * True when the request did not fully specify itself and safe defaults were
   * substituted. Phase 1 uses this to keep /login reachable when opened
   * directly; Phase 4 will reject such requests outright instead.
   */
  synthesized: boolean;
}

/* --------------------------------------------------------------- errors -- */

/**
 * Error codes. The subset that maps onto RFC 6749 §4.1.2.1 keeps those names so
 * Phase 4 can return them on the wire unchanged.
 */
export type AuthErrorCode =
  /** No `client_id`, or one that is not registered. */
  | 'unauthorized_client'
  /** `redirect_uri` is absent or not registered for this client. */
  | 'invalid_redirect_uri'
  /** The request was malformed in some other way. */
  | 'invalid_request'
  /** The user declined to authenticate. */
  | 'access_denied'
  /** Credentials did not verify. Deliberately never says which part failed. */
  | 'invalid_credentials'
  /** The capability exists in the design but no backend implements it yet. */
  | 'not_implemented'
  /** Auth could not reach the Account Platform to verify anything. */
  | 'identity_unavailable';

export interface AuthError {
  code: AuthErrorCode;
  /** Safe to render to the user. Never contains account internals. */
  message: string;
  /** Form field the message belongs against, when field-specific. */
  field?: string;
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: AuthError };

/* -------------------------------------------------------------- outcome -- */

/**
 * The minimum Auth is allowed to know about a person once the Account Platform
 * has verified them: enough to say "you are signed in as…" on the handoff
 * screen, and nothing more.
 *
 * Note what is absent: no email, no password state, no passkey list, no account
 * settings. Auth is not a profile service, and leaking account internals to
 * every relying application would be exactly the wrong default.
 */
export interface AuthenticatedSubject {
  /** The Account Platform's internal stable identifier (UUID in Phase 2). */
  subjectId: string;
  /** The public login identifier the user typed. */
  userId: string;
  displayName: string;
}

/**
 * A successful authentication, ready to be handed back to the requesting app.
 *
 * `authorizationCode` is a placeholder for the OAuth code that Phase 4 will
 * mint server-side and the client will exchange for tokens. It is deliberately
 * *not* a token: Auth must never put anything bearer-shaped in a URL.
 */
export interface AuthOutcome {
  subject: AuthenticatedSubject;
  request: AuthRequest;
  authorizationCode: string;
  /** Which factor actually satisfied the request. */
  method: AuthMethod;
  /** ISO-8601. */
  authenticatedAt: string;
}

/* ------------------------------------------------------------- backends -- */

/**
 * What the installed backend can actually do.
 *
 * The UI reads these flags instead of hardcoding "coming soon", so Phases 4–6
 * light up their surfaces by flipping a flag rather than by editing pages.
 */
export interface AuthCapabilities {
  /** Credentials are verified by a server against the real Account Platform. */
  passwordAuthentication: boolean;
  /** WebAuthn assertion is performed and verified for real. */
  passkeyAuthentication: boolean;
  /** Auth can issue an authorization code back to the requesting client. */
  authorizationCodes: boolean;
  /** A returning user can be recognised without re-entering credentials. */
  singleSignOn: boolean;
}

export interface PasswordAttempt {
  request: AuthRequest;
  userId: string;
  /**
   * Held only for the duration of the call and never persisted, logged, or
   * placed in a URL. Phase 4 sends it over TLS to the Account Platform's
   * verification endpoint and drops it immediately afterwards.
   */
  password: string;
}

export interface PasskeyAttempt {
  request: AuthRequest;
  /** Optional: a passkey flow can be initiated without the user typing an ID. */
  userId?: string;
}

/**
 * The contract every backend implements.
 *
 * Phase 1 ships `MockAuthBackend`, which refuses every method. Phase 4 replaces
 * it with a server-backed implementation of this same interface. Consumers
 * (context, pages, components) must depend only on this.
 */
export interface AuthBackend {
  /** Identifies the implementation. Drives the "not connected" notices. */
  readonly kind: 'mock' | 'server';
  readonly capabilities: AuthCapabilities;

  /** Verify a user ID and password via the Account Platform. */
  authenticateWithPassword(attempt: PasswordAttempt): Promise<Result<AuthOutcome>>;
  /** Perform and verify a WebAuthn assertion. */
  authenticateWithPasskey(attempt: PasskeyAttempt): Promise<Result<AuthOutcome>>;
  /**
   * Is there already an authenticated session Auth can reuse for this request?
   * Phase 6 turns this into real single sign-on across HarithKavish platforms.
   */
  resolveExistingSession(request: AuthRequest): Promise<AuthOutcome | null>;
}
