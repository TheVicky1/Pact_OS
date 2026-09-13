/**
 * PACT Phase 14: Enterprise Single Sign-On (SSO) & OIDC/SAML2 Security Engine
 * Cryptographic state validation, replay attack prevention, domain-to-workspace discovery,
 * and secure identity token verification.
 * 
 * Invariants:
 * 1. Zero Plaintext Secret Leakage: Client secrets and private certificates never reach client code.
 * 2. Account Takeover Protection: Enforces strict email domain matching and single-use state tokens.
 * 3. Replay Protection: 10-minute state TTL with single-use consumption.
 */

export type SsoProviderType = 'OIDC' | 'SAML2';
export type SsoWorkspaceRole = 'owner' | 'admin' | 'member' | 'observer';

export interface SsoProviderConfig {
  id: string;
  workspaceId: string;
  domain: string; // e.g., "acme.corp"
  providerType: SsoProviderType;
  issuerUrl: string; // e.g., "https://login.microsoftonline.com/..."
  clientId: string;
  samlMetadataUrl?: string | null;
  defaultRole: SsoWorkspaceRole;
  isActive: boolean;
  createdAt: string;
}

export interface SsoStateChallenge {
  state: string;
  nonce: string;
  domain: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface SsoValidationResult {
  success: boolean;
  email?: string;
  name?: string;
  domain?: string;
  assignedRole?: SsoWorkspaceRole;
  error?: string;
}

// In-memory state store with 10-minute TTL
const ssoStateStore = new Map<string, SsoStateChallenge>();
const SSO_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates a cryptographically random SSO state and nonce.
 */
export function generateSsoState(domain: string): { state: string; nonce: string } {
  let stateBytes: Uint8Array;
  let nonceBytes: Uint8Array;

  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    stateBytes = new Uint8Array(32);
    nonceBytes = new Uint8Array(16);
    crypto.getRandomValues(stateBytes);
    crypto.getRandomValues(nonceBytes);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require('crypto');
    stateBytes = nodeCrypto.randomBytes(32);
    nonceBytes = nodeCrypto.randomBytes(16);
  }

  const state = Buffer.from(stateBytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const nonce = Buffer.from(nonceBytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const now = Date.now();
  ssoStateStore.set(state, {
    state,
    nonce,
    domain: domain.toLowerCase().trim(),
    createdAt: now,
    expiresAt: now + SSO_STATE_TTL_MS,
    used: false,
  });

  // Clean expired states
  for (const [key, item] of ssoStateStore.entries()) {
    if (item.expiresAt < now || item.used) {
      ssoStateStore.delete(key);
    }
  }

  return { state, nonce };
}

/**
 * Atomically consumes and validates an SSO state challenge to prevent replay attacks.
 */
export function consumeSsoState(state: string): SsoStateChallenge | null {
  const record = ssoStateStore.get(state);
  if (!record) return null;

  const now = Date.now();
  if (record.expiresAt < now || record.used) {
    ssoStateStore.delete(state);
    return null;
  }

  record.used = true;
  ssoStateStore.delete(state);
  return record;
}

/**
 * Extracts and validates the email domain against configured enterprise domain.
 */
export function validateSsoDomain(email: string, expectedDomain: string): boolean {
  if (!email || !expectedDomain || !email.includes('@')) {
    return false;
  }
  const domain = email.split('@')[1]?.toLowerCase().trim();
  return domain === expectedDomain.toLowerCase().trim();
}

/**
 * Maps IdP assertion roles to PACT workspace roles safely.
 */
export function mapIdpRole(
  idpClaimRole?: string | string[],
  defaultRole: SsoWorkspaceRole = 'member'
): SsoWorkspaceRole {
  if (!idpClaimRole) return defaultRole;

  const roles = Array.isArray(idpClaimRole) ? idpClaimRole : [idpClaimRole];
  const normalized = roles.map((r) => r.toLowerCase().trim());

  if (normalized.includes('admin') || normalized.includes('administrator')) {
    return 'admin';
  }
  if (normalized.includes('observer') || normalized.includes('auditor')) {
    return 'observer';
  }
  if (normalized.includes('member') || normalized.includes('user')) {
    return 'member';
  }

  return defaultRole;
}

/**
 * Safely parses and validates OIDC identity token payload.
 */
export function parseOidcTokenPayload(idTokenPayload: Record<string, unknown>): {
  email: string;
  name: string;
  sub: string;
  emailVerified: boolean;
} | null {
  const email = typeof idTokenPayload.email === 'string' ? idTokenPayload.email.trim() : null;
  const sub = typeof idTokenPayload.sub === 'string' ? idTokenPayload.sub : null;
  const name = typeof idTokenPayload.name === 'string' ? idTokenPayload.name : email || 'Enterprise User';
  const emailVerified = idTokenPayload.email_verified === true || idTokenPayload.email_verified === 'true';

  if (!email || !sub) {
    return null;
  }

  return {
    email,
    name,
    sub,
    emailVerified,
  };
}
