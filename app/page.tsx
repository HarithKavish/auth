'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth-shell';
import { RouteLoading } from '@/components/form';

/**
 * The authorization entry point.
 *
 * In Phase 4 this becomes the real authorization endpoint: it validates the
 * request, checks for an existing session, and either completes the sign-in
 * silently or hands off to /login. Phase 1 keeps the same shape — everything
 * enters through here — but has no session to find, so it always forwards.
 *
 * The query string is carried across verbatim. /login re-validates it from
 * scratch rather than trusting anything this page decided, so there is no
 * "already checked" state a crafted link could ride in on.
 */
export default function AuthorizePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/login${window.location.search}`);
  }, [router]);

  return (
    <AuthShell>
      <RouteLoading label="Starting sign-in…" />
    </AuthShell>
  );
}
