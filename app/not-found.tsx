'use client';

import Link from 'next/link';
import { AuthShell } from '@/components/auth-shell';
import { BrandMark } from '@/components/brand';
import { ArrowLeftIcon } from '@/components/icons';

/**
 * Auth has a handful of routes and no content to browse, so a 404 here almost
 * always means a mistyped or stale link. The only useful action is to start the
 * sign-in flow again, so that is the only one offered.
 */
export default function NotFound() {
  return (
    <AuthShell>
      <div className="panel">
        <div className="handoff">
          <BrandMark />
        </div>

        <div className="panel__head">
          <h1 className="panel__title">Page not found</h1>
          <p className="panel__lead">
            There is no page at this address. HarithKavish Auth only handles signing in.
          </p>
        </div>

        <div className="form__actions">
          <Link className="button button--primary button--full" href="/login">
            <ArrowLeftIcon />
            Go to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
