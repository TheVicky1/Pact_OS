'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { ExternalProofProvider, ExternalProviderIntegration } from '@/types/domain';
import {
  verifyGitHubUser,
  verifyLeetCodeUser,
  verifyCodeforcesUser,
} from '@/lib/integrations/proof-of-work';

export interface IntegrationActionResult<T = unknown> {
  success: boolean;
  code?: string;
  data?: T;
  error?: string;
}

const linkProviderSchema = z.object({
  provider: z.enum(['github', 'leetcode', 'codeforces']),
  account_handle: z.string().trim().min(1).max(100),
  access_token: z.string().trim().max(500).optional(),
});

/**
 * Server action to fetch sanitized external integrations status for the current user.
 */
export async function getExternalIntegrationsStatusAction(): Promise<
  IntegrationActionResult<ExternalProviderIntegration[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data, error } = await supabase.rpc('get_external_integrations_status', {
      p_user_id: user.id,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data as ExternalProviderIntegration[]) || [] };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve external integrations.',
    };
  }
}

/**
 * Server action to link an external provider handle with live verification.
 */
export async function linkExternalProviderAction(
  provider: ExternalProofProvider,
  accountHandle: string,
  accessToken?: string
): Promise<IntegrationActionResult<ExternalProviderIntegration>> {
  try {
    const validated = linkProviderSchema.parse({
      provider,
      account_handle: accountHandle,
      access_token: accessToken,
    });

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    // 1. Live provider handle validation
    let normalizedHandle = validated.account_handle.replace(/^@/, '');
    let providerUserId: string | null = null;
    let extraMeta: Record<string, unknown> = {};

    if (provider === 'github') {
      const verifyRes = await verifyGitHubUser(normalizedHandle, validated.access_token);
      if (!verifyRes.success) {
        return { success: false, error: verifyRes.error || 'Failed to verify GitHub account.' };
      }
      if (verifyRes.data) {
        normalizedHandle = verifyRes.data.username;
        providerUserId = String(verifyRes.data.id);
        extraMeta.name = verifyRes.data.name;
      }
    } else if (provider === 'leetcode') {
      const verifyRes = await verifyLeetCodeUser(normalizedHandle);
      if (!verifyRes.success) {
        return { success: false, error: verifyRes.error || 'Failed to verify LeetCode account.' };
      }
      if (verifyRes.data) {
        normalizedHandle = verifyRes.data.username;
        extraMeta.ranking = verifyRes.data.ranking;
        extraMeta.realName = verifyRes.data.realName;
      }
    } else if (provider === 'codeforces') {
      const verifyRes = await verifyCodeforcesUser(normalizedHandle);
      if (!verifyRes.success) {
        return { success: false, error: verifyRes.error || 'Failed to verify Codeforces handle.' };
      }
      if (verifyRes.data) {
        normalizedHandle = verifyRes.data.handle;
        extraMeta.rating = verifyRes.data.rating;
        extraMeta.rank = verifyRes.data.rank;
      }
    }

    // 2. Persist to PostgreSQL external_provider_integrations
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('external_provider_integrations')
      .upsert(
        {
          user_id: user.id,
          provider,
          account_handle: normalizedHandle,
          provider_user_id: providerUserId,
          access_token: validated.access_token || null,
          sync_status: 'connected',
          last_verified_at: now,
          last_error: null,
          metadata: extraMeta,
          updated_at: now,
        },
        { onConflict: 'user_id,provider' }
      )
      .select()
      .single();

    if (error) {
      return { success: false, error: `Database error linking provider: ${error.message}` };
    }

    revalidatePath('/app/settings');
    revalidatePath('/app/accountability');

    return {
      success: true,
      data: data as ExternalProviderIntegration,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to link external provider.',
    };
  }
}

/**
 * Server action to disconnect and delete an external provider integration.
 */
export async function disconnectExternalProviderAction(
  provider: ExternalProofProvider
): Promise<IntegrationActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error } = await supabase
      .from('external_provider_integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('provider', provider);

    if (error) {
      return { success: false, error: `Failed to disconnect provider: ${error.message}` };
    }

    revalidatePath('/app/settings');
    revalidatePath('/app/accountability');

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to disconnect external provider.',
    };
  }
}
