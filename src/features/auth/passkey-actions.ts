'use server';

import { createClient } from '@/lib/supabase/server';
import {
  generatePasskeyChallenge,
  consumePasskeyChallenge,
} from '@/lib/auth/passkeys';
import {
  passkeyRegistrationOptionsSchema,
  passkeyRegistrationVerifySchema,
  passkeyRevokeSchema,
} from '@/lib/validations/passkeys';

export interface PasskeyCredentialRecord {
  id: string;
  credential_id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

/**
 * Server action: Initiates passkey registration by generating a cryptographic challenge.
 */
export async function getPasskeyRegistrationOptionsAction(
  deviceName: string
): Promise<{
  error?: string;
  challenge?: string;
  userId?: string;
  userEmail?: string;
  rpId?: string;
}> {
  const validation = passkeyRegistrationOptionsSchema.safeParse({ deviceName });
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Invalid device name.' };
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: 'You must be signed in to register a passkey.' };
  }

  const challenge = generatePasskeyChallenge(user.id);

  return {
    challenge,
    userId: user.id,
    userEmail: user.email || '',
    rpId: process.env.NEXT_PUBLIC_RP_ID || 'localhost',
  };
}

/**
 * Server action: Verifies and registers a new passkey credential into the database.
 */
export async function verifyPasskeyRegistrationAction(
  payload: {
    challenge: string;
    credentialId: string;
    publicKey: string;
    deviceName: string;
    transports?: string[];
    aaguid?: string;
  }
): Promise<{ error?: string; success?: boolean }> {
  const validation = passkeyRegistrationVerifySchema.safeParse(payload);
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Invalid passkey credential payload.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Authentication session expired.' };
  }

  const challengeCheck = consumePasskeyChallenge(payload.challenge, user.id);
  if (!challengeCheck.valid) {
    return { error: challengeCheck.error || 'Challenge verification failed.' };
  }

  const { error: insertError } = await supabase
    .from('passkey_credentials')
    .insert({
      user_id: user.id,
      credential_id: payload.credentialId,
      public_key: payload.publicKey,
      device_name: payload.deviceName,
      transports: payload.transports || [],
      aaguid: payload.aaguid || null,
      counter: 0,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    return { error: 'Failed to save passkey credential. It may already be registered.' };
  }

  return { success: true };
}

/**
 * Server action: Lists all registered passkeys for the current user.
 */
export async function listUserPasskeysAction(): Promise<{
  error?: string;
  passkeys?: PasskeyCredentialRecord[];
}> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized.' };
  }

  const { data, error } = await supabase
    .from('passkey_credentials')
    .select('id, credential_id, device_name, created_at, last_used_at')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: 'Unable to retrieve registered passkeys.' };
  }

  return { passkeys: data || [] };
}

/**
 * Server action: Revokes / deletes a passkey credential.
 */
export async function revokePasskeyAction(
  credentialId: string
): Promise<{ error?: string; success?: boolean }> {
  const validation = passkeyRevokeSchema.safeParse({ credentialId });
  if (!validation.success) {
    return { error: validation.error.issues[0]?.message || 'Invalid credential ID.' };
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: 'Unauthorized.' };
  }

  const { error } = await supabase
    .from('passkey_credentials')
    .delete()
    .eq('credential_id', credentialId)
    .eq('user_id', user.id);

  if (error) {
    return { error: 'Failed to revoke passkey credential.' };
  }

  return { success: true };
}
