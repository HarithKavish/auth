'use client';

import { useMemo } from 'react';
import { getAuthBackend } from '@/lib/auth/backend';
import { accountPlatform, site } from '@/lib/config/site';
import { ThemeToggle } from './theme-toggle';

/**
 * Permanent, honest notice while the Phase 1 mock backend is installed. It
 * disappears on its own once a backend reports `kind === 'server'`, so nobody
 * has to remember to remove it.
 */
function PreviewBanner() {
  return (
    <div className="preview-banner">
      <p className="preview-banner__inner">
        <strong>Preview.</strong> This is the sign-in interface only — the authentication service is
        not connected. Nothing you type is checked, sent, or stored. Do not enter a real password.
      </p>
    </div>
  );
}

interface AuthShellProps {
  children: React.ReactNode;
  /** Widens the column for pages that show more than a single form. */
  wide?: boolean;
}

/**
 * The frame every page sits in.
 *
 * Note what is missing compared with the Account Platform's shell: no header,
 * no navigation, no user menu, no links into a product. An authentication page
 * should offer exactly one way forward and one way back, and anything else on
 * screen is a distraction from a decision the user is being asked to make about
 * their credentials.
 */
export function AuthShell({ children, wide = false }: AuthShellProps) {
  const backend = useMemo(() => getAuthBackend(), []);
  const isPreview = backend.kind === 'mock';

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {isPreview && <PreviewBanner />}

      <div className="auth-shell">
        <div className="auth-shell__corner">
          <ThemeToggle />
        </div>

        <main id="main" className={`auth-shell__main${wide ? ' auth-shell__main--wide' : ''}`}>
          {children}
        </main>

        <footer className="auth-shell__footer">
          <div className="auth-shell__footer-inner">
            <span>{site.domain}</span>
            <span className="auth-shell__footer-links">
              <a href={accountPlatform.url}>Account</a>
              <a href={site.parentUrl}>HarithKavish</a>
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
