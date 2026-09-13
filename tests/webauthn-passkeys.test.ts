/**
 * PACT Phase 9: WebAuthn / Passkey Security & Challenge Lifecycle Tests
 * Authoritative verification of cryptographic challenge generation, replay attack prevention,
 * credential validation schemas, origin verification, and passkey revocation.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePasskeyChallenge,
  consumePasskeyChallenge,
  verifyRelyingPartyOrigin,
  stringToUint8Array,
  base64UrlToArrayBuffer,
  arrayBufferToBase64Url,
} from '../src/lib/auth/passkeys';
import {
  passkeyRegistrationOptionsSchema,
  passkeyRegistrationVerifySchema,
  passkeyAuthenticationOptionsSchema,
  passkeyAuthenticationVerifySchema,
  passkeyRevokeSchema,
} from '../src/lib/validations/passkeys';

describe('PACT Phase 9: WebAuthn / Passkey Security Engine', () => {
  describe('Cryptographic Challenge Lifecycle & Replay Protection', () => {
    it('generates a 32-byte base64url encoded challenge string', () => {
      const challenge = generatePasskeyChallenge('user-test-101');
      assert.ok(typeof challenge === 'string');
      assert.ok(challenge.length >= 32);
      // Ensure no base64 standard '+' or '/' or '=' padding
      assert.equal(challenge.includes('+'), false);
      assert.equal(challenge.includes('/'), false);
      assert.equal(challenge.includes('='), false);
    });

    it('successfully consumes a valid challenge for matching user', () => {
      const challenge = generatePasskeyChallenge('user-alice-123');
      const result = consumePasskeyChallenge(challenge, 'user-alice-123');
      assert.equal(result.valid, true);
    });

    it('rejects replay attempts on already consumed challenge', () => {
      const challenge = generatePasskeyChallenge('user-bob-456');
      
      // First consumption -> valid
      const first = consumePasskeyChallenge(challenge, 'user-bob-456');
      assert.equal(first.valid, true);

      // Second consumption -> replay detected & rejected
      const second = consumePasskeyChallenge(challenge, 'user-bob-456');
      assert.equal(second.valid, false);
      assert.ok(second.error?.includes('Challenge expired or invalid') || second.error?.includes('replay'));
    });

    it('rejects challenges claimed by a different user ID', () => {
      const challenge = generatePasskeyChallenge('user-owner-1');
      const result = consumePasskeyChallenge(challenge, 'user-attacker-2');
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes('authenticated user'));
    });

    it('rejects invalid or non-existent challenge tokens', () => {
      const result = consumePasskeyChallenge('non-existent-challenge-token-xyz');
      assert.equal(result.valid, false);
      assert.ok(result.error?.includes('expired or invalid'));
    });
  });

  describe('Relying Party (RP) & Origin Verification', () => {
    it('validates standard localhost and 127.0.0.1 development origins', () => {
      assert.equal(verifyRelyingPartyOrigin('http://localhost:3000'), true);
      assert.equal(verifyRelyingPartyOrigin('http://127.0.0.1:3000'), true);
      assert.equal(verifyRelyingPartyOrigin('https://app.pact.os'), true);
    });

    it('validates explicit expected hostname matching', () => {
      assert.equal(verifyRelyingPartyOrigin('https://pact.app', 'pact.app'), true);
      assert.equal(verifyRelyingPartyOrigin('https://evil-phishing.com', 'pact.app'), false);
    });

    it('rejects malformed origin URLs safely without throwing', () => {
      assert.equal(verifyRelyingPartyOrigin('not-a-valid-url'), false);
      assert.equal(verifyRelyingPartyOrigin(''), false);
    });
  });

  describe('Buffer & Base64url Conversions', () => {
    it('losslessly roundtrips text strings to Uint8Array and back', () => {
      const text = 'pact-discipline-passkey-test';
      const u8 = stringToUint8Array(text);
      assert.equal(u8 instanceof Uint8Array, true);
      assert.equal(new TextDecoder().decode(u8), text);
    });

    it('losslessly roundtrips ArrayBuffer to base64url and back', () => {
      const originalText = 'PACT_OS_SECURE_AUTH_CHALLENGE';
      const u8 = stringToUint8Array(originalText);
      const base64url = arrayBufferToBase64Url(u8.buffer as ArrayBuffer);
      assert.ok(typeof base64url === 'string');

      const bufferBack = base64UrlToArrayBuffer(base64url);
      const textBack = new TextDecoder().decode(new Uint8Array(bufferBack));
      assert.equal(textBack, originalText);
    });
  });

  describe('Zod Validation Schemas for Passkeys', () => {
    it('validates passkeyRegistrationOptionsSchema', () => {
      const valid = passkeyRegistrationOptionsSchema.safeParse({ deviceName: 'MacBook Touch ID' });
      assert.equal(valid.success, true);

      const empty = passkeyRegistrationOptionsSchema.safeParse({ deviceName: '   ' });
      assert.equal(empty.success, false);

      const tooLong = passkeyRegistrationOptionsSchema.safeParse({ deviceName: 'a'.repeat(70) });
      assert.equal(tooLong.success, false);
    });

    it('validates passkeyRegistrationVerifySchema', () => {
      const valid = passkeyRegistrationVerifySchema.safeParse({
        challenge: 'A1B2C3D4E5F6G7H8I9J0',
        credentialId: 'cred_test_1234567890abcdef',
        publicKey: 'pubkey_material_sample_string_12345',
        deviceName: 'Windows Hello PIN',
        transports: ['internal'],
      });
      assert.equal(valid.success, true);

      const invalid = passkeyRegistrationVerifySchema.safeParse({
        challenge: 'short',
        credentialId: '',
        publicKey: 'pub',
        deviceName: '',
      });
      assert.equal(invalid.success, false);
    });

    it('validates passkeyAuthenticationOptionsSchema and VerifySchema', () => {
      const optValid = passkeyAuthenticationOptionsSchema.safeParse({ email: 'user@pact.local' });
      assert.equal(optValid.success, true);

      const verifyValid = passkeyAuthenticationVerifySchema.safeParse({
        challenge: 'A1B2C3D4E5F6G7H8I9J0',
        credentialId: 'cred_test_1234567890abcdef',
        authenticatorData: 'authdata_base64',
        clientDataJSON: 'clientdata_base64',
        signature: 'signature_base64',
      });
      assert.equal(verifyValid.success, true);
    });

    it('validates passkeyRevokeSchema', () => {
      const valid = passkeyRevokeSchema.safeParse({ credentialId: 'cred_test_12345' });
      assert.equal(valid.success, true);

      const invalid = passkeyRevokeSchema.safeParse({ credentialId: '' });
      assert.equal(invalid.success, false);
    });
  });
});
