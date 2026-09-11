'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  fetchLeetCodeActivitySummary,
  LeetCodeActivitySummary,
} from '@/lib/integrations/proof-of-work/leetcode';

export interface LeetCodeActivityActionResult {
  success: boolean;
  isConnected: boolean;
  username?: string;
  data?: LeetCodeActivitySummary | null;
  verifiedProofsCount?: number;
  error?: string;
}

/**
 * Server action to retrieve real LeetCode activity, problem difficulty stats,
 * submission calendar heatmap, streaks, contest metrics, and recent accepted submissions.
 */
export async function getLeetCodeActivitySummaryAction(
  forceRefresh: boolean = false
): Promise<LeetCodeActivityActionResult> {
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

    // 1. Fetch user's linked LeetCode integration from PostgreSQL
    const { data: integration, error: intError } = await supabase
      .from('external_provider_integrations')
      .select('id, provider, account_handle, sync_status, metadata')
      .eq('user_id', user.id)
      .eq('provider', 'leetcode')
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

    // 2. Query total verified proof evidence records for this user (LeetCode provider)
    const { count: proofCount } = await supabase
      .from('external_proof_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('provider', 'leetcode');

    // 3. Fetch live activity summary from LeetCode public GraphQL API
    const activityRes = await fetchLeetCodeActivitySummary(integration.account_handle);

    if (!activityRes.success || !activityRes.data) {
      return {
        success: false,
        isConnected: true,
        username: integration.account_handle,
        error: activityRes.error || 'Failed to retrieve LeetCode activity.',
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
        .eq('provider', 'leetcode');

      revalidatePath('/app/analytics');
      revalidatePath('/app/settings');
    }

    return {
      success: true,
      isConnected: true,
      username: integration.account_handle,
      data: activityRes.data,
      verifiedProofsCount: proofCount || 0,
    };
  } catch (err: unknown) {
    return {
      success: false,
      isConnected: false,
      error: err instanceof Error ? err.message : 'Failed to retrieve LeetCode activity summary.',
    };
  }
}
