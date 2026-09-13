'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createCharityPledgeSchema,
  type CreateCharityPledgeInput,
  authorizePledgeSchema,
  cancelPledgeSchema,
  type CharityPledge,
} from '@/lib/validations/pledges';
import {
  generatePledgeIdempotencyKey,
  transitionPledgeStatus,
} from '@/lib/finance/pledge-engine';

export interface PledgeActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to create a new Charity Pledge in DRAFT status.
 * Zero-risk, server-authoritative, requires authenticated session.
 */
export async function createCharityPledgeAction(
  rawInput: CreateCharityPledgeInput
): Promise<PledgeActionResult<CharityPledge>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required to create a charity pledge' };
    }

    const parseResult = createCharityPledgeSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: `Validation error: ${parseResult.error.issues.map((i) => i.message).join(', ')}`,
      };
    }

    const input = parseResult.data;
    const idempotencyKey = generatePledgeIdempotencyKey(user.id);

    // Verify commitment ownership if linked
    if (input.commitment_id) {
      const { data: commitment, error: commitmentError } = await supabase
        .from('commitments')
        .select('id, user_id')
        .eq('id', input.commitment_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (commitmentError || !commitment) {
        return { success: false, error: 'Commitment not found or unauthorized' };
      }
    }

    const { data: pledge, error: insertError } = await supabase
      .from('charity_pledges')
      .insert({
        user_id: user.id,
        commitment_id: input.commitment_id || null,
        circle_id: input.circle_id || null,
        charity_id: input.charity_id,
        charity_name: input.charity_name,
        charity_ein: input.charity_ein || null,
        amount_cents: input.amount_cents,
        currency: input.currency || 'USD',
        status: 'draft',
        explicit_consent: input.explicit_consent,
        consent_timestamp: new Date().toISOString(),
        idempotency_key: idempotencyKey,
        consequence_description: input.consequence_description || null,
        payment_gateway_ref: null,
        settlement_metadata: {},
      })
      .select('*')
      .single();

    if (insertError || !pledge) {
      return { success: false, error: insertError?.message || 'Failed to create charity pledge' };
    }

    return { success: true, data: pledge as CharityPledge };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Failed to create charity pledge: ${message}` };
  }
}

/**
 * Server action to Authorize and Arm a Charity Pledge.
 * Transitions status: draft -> authorized -> armed.
 */
export async function authorizeCharityPledgeAction(
  rawInput: { pledge_id: string }
): Promise<PledgeActionResult<CharityPledge>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const parseResult = authorizePledgeSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid pledge ID format' };
    }

    const { pledge_id } = parseResult.data;

    // Fetch existing pledge
    const { data: existingPledge, error: fetchError } = await supabase
      .from('charity_pledges')
      .select('*')
      .eq('id', pledge_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingPledge) {
      return { success: false, error: 'Pledge not found or unauthorized' };
    }

    // State transition verification
    const currentStatus = existingPledge.status;
    let nextStatus: 'authorized' | 'armed';

    if (currentStatus === 'draft') {
      const authorizedStatus = transitionPledgeStatus(currentStatus, 'authorized');
      nextStatus = transitionPledgeStatus(authorizedStatus, 'armed') as 'armed';
    } else if (currentStatus === 'authorized') {
      nextStatus = transitionPledgeStatus(currentStatus, 'armed') as 'armed';
    } else {
      return { success: false, error: `Cannot arm pledge in status "${currentStatus}"` };
    }

    const { data: updatedPledge, error: updateError } = await supabase
      .from('charity_pledges')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pledge_id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updatedPledge) {
      return { success: false, error: updateError?.message || 'Failed to arm pledge' };
    }

    return { success: true, data: updatedPledge as CharityPledge };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Failed to authorize pledge: ${message}` };
  }
}

/**
 * Server action to Cancel a Charity Pledge (only allowed in draft, authorized, or armed status).
 */
export async function cancelCharityPledgeAction(
  rawInput: { pledge_id: string; reason?: string }
): Promise<PledgeActionResult<CharityPledge>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const parseResult = cancelPledgeSchema.safeParse(rawInput);
    if (!parseResult.success) {
      return { success: false, error: 'Invalid cancellation input' };
    }

    const { pledge_id, reason } = parseResult.data;

    const { data: existingPledge, error: fetchError } = await supabase
      .from('charity_pledges')
      .select('*')
      .eq('id', pledge_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingPledge) {
      return { success: false, error: 'Pledge not found or unauthorized' };
    }

    const nextStatus = transitionPledgeStatus(existingPledge.status, 'cancelled');

    const { data: updatedPledge, error: updateError } = await supabase
      .from('charity_pledges')
      .update({
        status: nextStatus,
        settlement_metadata: {
          ...((existingPledge.settlement_metadata as Record<string, unknown>) || {}),
          cancellation_reason: reason || 'Cancelled by user',
          cancelled_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', pledge_id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (updateError || !updatedPledge) {
      return { success: false, error: updateError?.message || 'Failed to cancel pledge' };
    }

    return { success: true, data: updatedPledge as CharityPledge };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Failed to cancel pledge: ${message}` };
  }
}

/**
 * Server action to list all charity pledges for the authenticated user.
 */
export async function listUserPledgesAction(): Promise<PledgeActionResult<CharityPledge[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    const { data: pledges, error: fetchError } = await supabase
      .from('charity_pledges')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    return { success: true, data: (pledges || []) as CharityPledge[] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: `Failed to list pledges: ${message}` };
  }
}
