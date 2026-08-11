/**
 * The registry of applications allowed to request authentication.
 *
 * This is the Phase 1 stand-in for what becomes a `clients` table in Phase 4.
 * It is written as data, not as branching logic, for one reason: the set of
 * relying applications must be a closed list that Auth controls. Nothing in
 * this codebase constructs an `AuthClient` from user input, so an application
 * that is not written here simply cannot be authenticated for.
 *
 * Adding a platform to the ecosystem is an edit to this file (later, a row) —
 * never a query parameter.
 */

import type { AuthClient, ClientId } from './types';

/**
 * Redirect URIs are listed exhaustively and compared exactly. They are not
 * patterns, not prefixes, and not "any path on this host": open-redirect bugs
 * in identity providers almost always come from someone relaxing precisely this
 * rule. Adding a new landing path means adding a line here.
 */
export const clients: Readonly<Record<ClientId, AuthClient>> = {
  forge: {
    id: 'forge',
    name: 'Forge',
    description: 'Project resource intelligence',
    origin: 'https://forge.harithkavish.com',
    redirectUris: ['https://forge.harithkavish.com/home'],
    monogram: 'Fo',
    accent: '#2c6285',
    integrated: false,
  },
  nexus: {
    id: 'nexus',
    name: 'Nexus',
    description: 'Connected workspace for the HarithKavish ecosystem',
    origin: 'https://nexus.harithkavish.com',
    redirectUris: ['https://nexus.harithkavish.com/home'],
    monogram: 'Nx',
    accent: '#4b5bb5',
    integrated: false,
  },
  vr: {
    id: 'vr',
    name: 'VR',
    description: 'Immersive HarithKavish experiences',
    origin: 'https://vr.harithkavish.com',
    redirectUris: ['https://vr.harithkavish.com/home'],
    monogram: 'VR',
    accent: '#7a4f8f',
    integrated: false,
  },
} as const;

/** Display order wherever the full set is listed. */
export const clientList: readonly AuthClient[] = [clients.forge, clients.nexus, clients.vr];

export function isClientId(value: string | null | undefined): value is ClientId {
  return value === 'forge' || value === 'nexus' || value === 'vr';
}

/** The registry lookup. Returns null for anything unregistered. */
export function findClient(id: string | null | undefined): AuthClient | null {
  return isClientId(id) ? clients[id] : null;
}

/**
 * The client assumed when auth.harithkavish.com is opened directly rather than
 * arrived at from an application.
 *
 * Phase 4 deletes this: a real authorization endpoint rejects a request with no
 * `client_id` instead of guessing one. It exists now only so the login screen
 * is reachable for design review, and every request that relies on it is
 * flagged `synthesized` so the UI can say so out loud.
 */
const DEFAULT_CLIENT_ID = process.env.NEXT_PUBLIC_DEFAULT_CLIENT_ID;

export function defaultClient(): AuthClient {
  return findClient(DEFAULT_CLIENT_ID) ?? clients.forge;
}
