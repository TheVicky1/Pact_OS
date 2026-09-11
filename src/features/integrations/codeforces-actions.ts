'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  fetchCodeforcesActivitySummary,
  CodeforcesActivitySummary,
} from '@/lib/integrations/proof-of-work/codeforces';

export interface CodeforcesActivityActionResult {
  success: boolean;
  isConnected: boolean;
  handle?: string;
  data?: CodeforcesActivitySummary | null;
  verifiedProofsCount?: number;
  error?: string;
}

/**
 * Server action to retrieve real Codeforces activity, rating progression history,
 * problem difficulty buckets, submission calendar heatmap, and contest statistics.
 */
export async function getCodeforcesActivitySummaryAction(
  forceRefresh: boolean = false
): Promise<CodeforcesActivityActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        isConnected: false,
        error: 'Authentication required.',
      };
    }

    // 1. Fetch user's linked Codeforces integration from PostgreSQL
    const { data: integration, error: intError } = await supabase
      .from('external_provider_integrations')
      .select('id, provider, account_handle, sync_status, metadata')
      .eq('user_id', user.id)
      .eq('provider', 'codeforces')
      .maybeSingle();

    if (intError) {
      return {
        success: false,
        isConnected: false,
        error: `Database error: ${intError.message}`,
      };
    }

    if (!integration || !integration.account_handle || integration.sync_status === 'disconnected') {
      return {
        success: true,
        isConnected: false,
        data: null,
      };
    }

    // 2. Query total verified proof evidence records for this user (Codeforces provider)
    const { count: proofCount } = await supabase
      .from('external_proof_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('provider', 'codeforces');

    // 3. Fetch live activity summary from Codeforces official REST API
    const activityRes = await fetchCodeforcesActivitySummary(integration.account_handle);

    if (!activityRes.success || !activityRes.data) {
      return {
        success: false,
        isConnected: true,
        handle: integration.account_handle,
        error: activityRes.error || 'Failed to retrieve Codeforces activity.',
      };
    }

    if (forceRefresh) {
      // Update authoritative last_verified_at in database
      await supabase
        .from('external_provider_integrations')
        .update({
          last_verified_at: new Date().toISOString(),
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', 'codeforces');

      revalidatePath('/app/analytics');
      revalidatePath('/app/settings');
    }

    return {
      success: true,
      isConnected: true,
      handle: integration.account_handle,
      data: activityRes.data,
      verifiedProofsCount: proofCount || 0,
    };
  } catch (err: unknown) {
    return {
      success: false,
      isConnected: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve Codeforces activity summary.',
    };
  }
}
