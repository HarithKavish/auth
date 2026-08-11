import type { NextConfig } from 'next';

/**
 * Two build modes, mirroring the Account Platform.
 *
 * - Default: a normal Next.js server build. This is the mode Phase 4 needs,
 *   because real authentication requires server routes, sessions, and a
 *   credential-verification call into the Account Platform.
 * - STATIC_EXPORT=1: a fully static export for GitHub Pages, which is how
 *   auth.harithkavish.com is served during Phase 1.
 *
 * Keeping both real means moving to a server host later is a flag, not a
 * rewrite.
 */
const isStaticExport = process.env.STATIC_EXPORT === '1';

/**
 * Security headers for the server build.
 *
 * IMPORTANT: GitHub Pages cannot set custom response headers, so none of these
 * apply to the static deployment — notably X-Frame-Options. That is acceptable
 * while the site performs no authentication and holds no session cookie, and it
 * is a further reason the platform moves to a server host before Phase 4.
 *
 * X-Frame-Options is DENY rather than SAMEORIGIN and matters more here than on
 * most sites: an authentication screen inside an attacker's iframe is the
 * classic login-clickjacking setup, and a real identity provider must never be
 * embeddable. A Content-Security-Policy with frame-ancestors 'none' belongs
 * here too, but it needs a nonce for the inline theme script, which is best
 * introduced alongside server rendering.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // publickey-credentials-get stays enabled for same-origin WebAuthn in Phase 4.
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  ...(isStaticExport
    ? {
        output: 'export' as const,
        // Emits every route as <route>/index.html, which is the shape GitHub
        // Pages resolves most reliably for deep links typed directly.
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        async headers() {
          return [{ source: '/:path*', headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
