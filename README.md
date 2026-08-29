# HarithKavish Auth

The authentication platform for the HarithKavish ecosystem — [auth.harithkavish.com](https://auth.harithkavish.com).

Auth answers one question: **has this person successfully authenticated for this application?**

It does not create accounts, and it is not an account dashboard. That is the
[Account Platform](https://account.harithkavish.com)'s job.

| | Account | Auth |
| --- | --- | --- |
| Domain | `account.harithkavish.com` | `auth.harithkavish.com` |
| Owns | The user's account: user ID, password hash, names, passkeys | Nothing about the user |
| Answers | "Who is this user and what is their account?" | "Has this user authenticated for this application?" |
| User creates an account | Yes | **Never itself** — links out to Account, or asks Account to create one on a first federated sign-in |

```
                    HarithKavish Account
                  account.harithkavish.com
                            │  identity + credential verification
                            ▼
                    auth.harithkavish.com
                    Authentication Service
                            │  authentication result
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
          Forge           Nexus             VR
```

## Where this is going

Auth and Account are **one deployable** at `account.harithkavish.com`, with the
ownership boundary kept in code (contract §0.5, §15). This origin remains as an
alias, and the split stays available.

What is written below about *what Auth is responsible for* is unchanged — it
describes the authentication half, wherever it runs.

## The contract

Auth and Account are specified by one reconciled document, held in the Account
repository. See [docs/CONTRACT.md](docs/CONTRACT.md) — it is referenced, not
copied.

As of Canonical v1.3 that document covers **federated sign-in**: Auth runs the
provider flow and verifies the assertion, Account owns the resulting link and the
account it belongs to. A HarithKavish account remains the identity; Google is a
way to prove it. Auth is the only thing in the ecosystem that talks to an
external provider.

## Status: Phase 1 — website only

**This site performs no authentication.** The installed backend refuses every
sign-in attempt, and the interface says so on every screen.

That refusal is deliberate. A mock that answered "yes" would train everyone who
reviews this site to trust a screen that verified nothing — the exact habit an
authentication platform must not build. So in this phase:

- No credential is stored. Not hashed, not encoded, not in `localStorage`.
- No password is compared against anything.
- No session is created and no authorization code is issued.
- No WebAuthn call is made and no credential prompt is opened.

The UI still exercises every real state — validation, pending, failure — because
those are genuine UI concerns. What it never does is claim success.

### Phases

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Auth website and application structure | **This repository, now** |
| 2 | Account Platform backend + database | Account repo |
| 3 | Account Platform completion | Account repo |
| 4 | Auth backend — real credential verification, sessions, authorization codes | Not started |
| 5 | Integrating Forge, Nexus, VR | Not started |
| 6 | Advanced identity/security features (SSO, recovery) | Not started |

Phase 4 begins only once Account has a real account database, working account
creation, established user identity, and secure password/passkey storage.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Authorization entry point. Validates the request and forwards to `/login`. In Phase 4 this resolves an existing session first. |
| `/login` | The primary screen. User ID + password, passkey alternative, link out to Account for sign-up. |
| `/passkey` | Passkey authentication UI and its states. No WebAuthn yet. |
| `/continue` | The handoff screen shown between a successful sign-in and the return to the application. Phase 1 renders it only as an explicitly labelled preview. |
| `/error` | Meaningful errors, rendered from a closed catalogue of codes. |
| `*` | Not found. |

There are deliberately **no** `/signup`, `/profile`, `/account` or
`/change-password` routes. Those belong to the Account Platform.

## Architecture

```
lib/auth/
  types.ts         Domain types + the AuthBackend contract
  clients.ts       Registry of applications allowed to request authentication
  request.ts       URL → validated AuthRequest. The front-end trust boundary.
  errors.ts        Closed catalogue of user-facing errors
  validation.ts    Sign-in input validation
  backend.ts       Selects the installed backend — the single Phase 4 edit
  mock-backend.ts  Phase 1: refuses everything
  preview.ts       Phase 1: the labelled escape hatch for viewing /continue
```

### The authentication request

Auth is designed around an authorization request, shaped like OAuth 2.0 /
OpenID Connect so Phase 4 can adopt the standard rather than invent a protocol:

| Parameter | Meaning |
| --- | --- |
| `client_id` | Which registered application is asking |
| `redirect_uri` | Where to return afterwards |
| `state` | Opaque value round-tripped back to the client, never interpreted |
| `method` | Preferred first factor (`password` \| `passkey`) — a hint only |

Try it: `/login?client_id=nexus&redirect_uri=https://nexus.harithkavish.com/home`

### Redirect safety

The rules in `request.ts` are strict and deliberately boring:

1. `client_id` must name a client in the registry. There is no fallback and no
   "unknown application" placeholder rendered as if it were legitimate.
2. `redirect_uri` must appear **verbatim** in that client's registered list.
   Not a prefix, not a pattern, not "any path on this host" — open-redirect bugs
   in identity providers almost always come from relaxing exactly this rule.
   An unregistered value produces a visible error on `auth.harithkavish.com`
   and is never followed, and never rendered as a link.
3. `state` is opaque and length-capped.

`/error` renders from a **code**, never from a message in the URL: a page that
prints attacker-supplied text under the HarithKavish mark is a phishing kit.

### Swapping in the real backend

Everything depends on the `AuthBackend` interface. Phase 4 implements
`ServerAuthBackend` and changes one line in `backend.ts`. No page or component
should need to change.

Capability flags (`passwordAuthentication`, `passkeyAuthentication`,
`authorizationCodes`, `singleSignOn`) drive what the UI offers, so later phases
light up their surfaces by flipping a flag rather than by editing pages. The
preview banner disappears on its own once a backend reports `kind === 'server'`.

## Development

```bash
npm install
npm run dev        # http://localhost:3000

npm run typecheck
npm run lint
npm run build                # server build
STATIC_EXPORT=1 npm run build  # static export → out/
```

Copy `.env.example` to `.env.local` to override configuration. No secrets are
required in Phase 1, and none are committed.

## Deployment

Two build modes:

- **Default** — a normal Next.js server build. This is what Phase 4 needs, since
  real authentication requires server routes, sessions, and a server-to-server
  call into Account.
- **`STATIC_EXPORT=1`** — a static export for GitHub Pages, which is how
  `auth.harithkavish.com` is served during Phase 1. `public/CNAME` carries the
  domain; `.github/workflows/deploy.yml` typechecks, lints and builds before
  publishing, so a broken build cannot reach the live domain.

Keeping both modes real means moving to a server host later is a flag, not a
rewrite.

> **Note:** GitHub Pages cannot set response headers, so the security headers in
> `next.config.ts` — including `X-Frame-Options: DENY`, which stops an
> authentication screen being framed for clickjacking — apply only to the server
> build. That is acceptable while the site performs no authentication and holds
> no session cookie, and it is a further reason the platform moves to a server
> host before Phase 4.
