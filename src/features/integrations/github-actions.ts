'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  fetchGitHubActivitySummary,
  GitHubActivitySummary,
} from '@/lib/integrations/proof-of-work/github';

export interface GitHubActivityActionResult {
  success: boolean;
  isConnected: boolean;
  username?: string;
  data?: GitHubActivitySummary | null;
  verifiedProofsCount?: number;
  error?: string;
}

/**
 * Server action to retrieve real GitHub activity, contribution heatmap,
 * streaks, repository breakdowns, and recent activity for the authenticated user.
 */
export async function getGitHubActivitySummaryAction(
  forceRefresh: boolean = false
): Promise<GitHubActivityActionResult> {
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

    // 1. Fetch user's linked GitHub integration
    const { data: integration, error: intError } = await supabase
      .from('external_provider_integrations')
      .select('id, provider, account_handle, access_token, sync_status, metadata')
      .eq('user_id', user.id)
      .eq('provider', 'github')
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

    // 2. Query total verified proof evidence records for this user (GitHub provider)
    const { count: proofCount } = await supabase
      .from('external_proof_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('provider', 'github');

    // 3. Fetch live activity summary from GitHub REST API
    const activityRes = await fetchGitHubActivitySummary(
      integration.account_handle,
      integration.access_token || undefined
    );

    if (!activityRes.success || !activityRes.data) {
      return {
        success: false,
        isConnected: true,
        username: integration.account_handle,
        error: activityRes.error || 'Failed to retrieve GitHub activity.',
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
        .eq('provider', 'github');

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
      error: err instanceof Error ? err.message : 'Failed to retrieve GitHub activity summary.',
    };
  }
}
