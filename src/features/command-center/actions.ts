'use server';

import { createClient } from '@/lib/supabase/server';
import { EntitySearchPayload } from '@/lib/command-center/types';

export interface SearchEntitiesResult {
  success: boolean;
  data?: EntitySearchPayload;
  error?: string;
}

export interface CommandCenterBootstrapData {
  goals: Array<{ id: string; title: string }>;
  projects: Array<{ id: string; title: string }>;
  categories: Array<{ id: string; name: string; color_tag: string }>;
}

/**
 * Server action to search across all core PACT domains for the authenticated user.
 * STRICT SECURITY: Enforces authenticated user_id via Supabase RLS.
 */
export async function searchPactEntitiesAction(query: string): Promise<SearchEntitiesResult> {
  const cleanQuery = query.trim().slice(0, 100);
  if (!cleanQuery) {
    return {
      success: true,
      data: {
        tasks: [],
        goals: [],
        projects: [],
        transactions: [],
      },
    };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const pattern = `%${cleanQuery}%`;

    // Perform bounded parallel queries against user-owned tables
    const [tasksRes, goalsRes, projectsRes, txRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, status, priority, deadline_at')
        .ilike('title', pattern)
        .limit(6),
      supabase
        .from('goals')
        .select('id, title, status, target_date')
        .ilike('title', pattern)
        .limit(6),
      supabase
        .from('projects')
        .select('id, title, status, color_accent')
        .ilike('title', pattern)
        .limit(6),
      supabase
        .from('finance_transactions')
        .select('id, description, type, amount_cents, transaction_date')
        .ilike('description', pattern)
        .limit(6),
    ]);

    return {
      success: true,
      data: {
        tasks: tasksRes.data || [],
        goals: goalsRes.data || [],
        projects: projectsRes.data || [],
        transactions: (txRes.data as EntitySearchPayload['transactions']) || [],
      },
    };
  } catch {
    return {
      success: false,
      error: 'Failed to search application entities.',
    };
  }
}

/**
 * Retrieves bootstrap goals, projects, and finance categories for the Command Center modals.
 */
export async function getCommandCenterBootstrapAction(): Promise<{
  success: boolean;
  data?: CommandCenterBootstrapData;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const [goalsRes, projectsRes, categoriesRes] = await Promise.all([
      supabase.from('goals').select('id, title').order('created_at', { ascending: false }),
      supabase.from('projects').select('id, title').order('created_at', { ascending: false }),
      supabase.from('finance_categories').select('id, name, color_tag').order('name', { ascending: true }),
    ]);

    return {
      success: true,
      data: {
        goals: goalsRes.data || [],
        projects: projectsRes.data || [],
        categories: (categoriesRes.data as CommandCenterBootstrapData['categories']) || [],
      },
    };
  } catch {
    return {
      success: false,
      error: 'Failed to load command center bootstrap context.',
    };
  }
}
