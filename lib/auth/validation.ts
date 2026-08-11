/**
 * Input validation for the sign-in form.
 *
 * Auth validates far less than the Account Platform does, and that is correct:
 * Account decides what a *valid new* user ID looks like, Auth only checks that
 * the person typed something at all. Enforcing Account's format rules at
 * sign-in would silently lock out any account created before those rules
 * changed, and would leak the current rules to anyone probing the form.
 *
 * As on Account, client-side validation is for fast feedback only. It is never
 * the security boundary — Phase 4 re-checks everything server-side, where the
 * check is authoritative.
 */

/** Matches the Account Platform's limit, so an over-long paste is caught early. */
export const USER_ID_MAX = 64;
export const PASSWORD_MAX = 128;

export type FieldErrors = Record<string, string>;

export interface SignInFormInput {
  userId: string;
  password: string;
}

/** User IDs are compared in a single canonical casing, as on Account. */
export function normalizeUserId(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateSignIn(input: SignInFormInput): FieldErrors {
  const errors: FieldErrors = {};

  const userId = input.userId.trim();
  if (!userId) {
    errors.userId = 'Enter your user ID.';
  } else if (userId.length > USER_ID_MAX) {
    errors.userId = `Use at most ${USER_ID_MAX} characters.`;
  }

  if (!input.password) {
    errors.password = 'Enter your password.';
  } else if (input.password.length > PASSWORD_MAX) {
    errors.password = `Use at most ${PASSWORD_MAX} characters.`;
  }

  return errors;
}

/** Only a user ID is needed to begin a passkey flow; the password is not. */
export function validatePasskeyStart(userId: string): FieldErrors {
  const errors: FieldErrors = {};
  const value = userId.trim();
  if (value.length > USER_ID_MAX) {
    errors.userId = `Use at most ${USER_ID_MAX} characters.`;
  }
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
