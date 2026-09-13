/**
 * PACT Phase 9: WebAuthn / Passkey Zod Validation Schemas
 * Strict input validation for passwordless credential creation, authentication, and lifecycle management.
 */

import { z } from 'zod';

/**
 * Registration options challenge request schema
 */
export const passkeyRegistrationOptionsSchema = z.object({
  deviceName: z.string().trim().min(1, 'Device name is required').max(64, 'Device name must not exceed 64 characters'),
});

/**
 * Registration response verification schema
 */
export const passkeyRegistrationVerifySchema = z.object({
  challenge: z.string().min(16, 'Invalid challenge token'),
  credentialId: z.string().min(16, 'Invalid credential ID').max(512),
  publicKey: z.string().min(16, 'Invalid public key material'),
  deviceName: z.string().trim().min(1).max(64),
  transports: z.array(z.string()).default([]),
  aaguid: z.string().optional(),
  origin: z.string().url().optional(),
});

/**
 * Authentication options challenge request schema
 */
export const passkeyAuthenticationOptionsSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
});

/**
 * Authentication response verification schema
 */
export const passkeyAuthenticationVerifySchema = z.object({
  challenge: z.string().min(16, 'Invalid challenge token'),
  credentialId: z.string().min(16, 'Invalid credential ID'),
  authenticatorData: z.string().min(1, 'Missing authenticator data'),
  clientDataJSON: z.string().min(1, 'Missing client data'),
  signature: z.string().min(1, 'Missing signature'),
  userHandle: z.string().optional(),
});

/**
 * Passkey credential revocation schema
 */
export const passkeyRevokeSchema = z.object({
  credentialId: z.string().min(1, 'Credential ID is required'),
});

export type PasskeyRegistrationOptionsInput = z.infer<typeof passkeyRegistrationOptionsSchema>;
export type PasskeyRegistrationVerifyInput = z.infer<typeof passkeyRegistrationVerifySchema>;
export type PasskeyAuthenticationOptionsInput = z.infer<typeof passkeyAuthenticationOptionsSchema>;
export type PasskeyAuthenticationVerifyInput = z.infer<typeof passkeyAuthenticationVerifySchema>;
export type PasskeyRevokeInput = z.infer<typeof passkeyRevokeSchema>;
