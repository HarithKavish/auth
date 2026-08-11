/**
 * Outline icons, drawn in the same 24-unit, 1.6-weight style as the Account
 * Platform so the two products read as one family.
 *
 * Nothing here is a padlock or a shield. An authentication screen that
 * decorates itself with security imagery is asking to be trusted rather than
 * earning it, and those exact graphics are what phishing pages imitate.
 */

interface IconProps {
  className?: string;
}

function Icon({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/**
 * A key, used for the passkey surfaces. Chosen over a fingerprint or a face
 * because the credential is a key — the biometric only unlocks it locally, and
 * implying otherwise would misdescribe how WebAuthn works.
 */
export function KeyIcon({ className = 'passkey__glyph' }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="8" cy="8" r="4.2" />
      <path d="m11 11 8.2 8.2M16.5 16.5l2-2M19 19l1.5-1.5" />
    </Icon>
  );
}

/** Return/back arrow for cancel and "back to the application" actions. */
export function ArrowLeftIcon({ className = 'button__icon' }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </Icon>
  );
}

/** Forward arrow for the handoff action. */
export function ArrowRightIcon({ className = 'button__icon' }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

/** External-link marker for anything that leaves auth.harithkavish.com. */
export function ExternalIcon({ className = 'button__icon' }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M14 4h6v6M20 4l-8.5 8.5M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Icon>
  );
}
