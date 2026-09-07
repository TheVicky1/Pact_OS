import { createClient } from '@/lib/supabase/server';
import {
  ConsequenceDefinition,
  UserAccountabilityPreferences,
  TaskAccountabilityCommitment,
  AccountabilityEvent,
  CreateConsequenceDefinitionInput,
  UpdateConsequenceDefinitionInput,
  UpdateUserAccountabilityPreferencesInput,
} from '@/types/domain';
import {
  createConsequenceDefinitionSchema,
  updateConsequenceDefinitionSchema,
  updateUserAccountabilityPreferencesSchema,
} from '@/lib/validations/accountability';

export async function getConsequenceDefinitions(): Promise<ConsequenceDefinition[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch consequence definitions: ${error.message}`);
  }

  return data as ConsequenceDefinition[];
}

export async function getConsequenceDefinitionById(id: string): Promise<ConsequenceDefinition | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to fetch consequence definition: ${error.message}`);
  }

  return data as ConsequenceDefinition;
}

export async function createConsequenceDefinition(
  input: CreateConsequenceDefinitionInput
): Promise<ConsequenceDefinition> {
  const validated = createConsequenceDefinitionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  // If this definition is marked default, unset existing default flags for this user
  if (validated.is_default) {
    await supabase
      .from('consequence_definitions')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .insert({
      user_id: user.id,
      title: validated.title,
      consequence_type: validated.consequence_type,
      action_statement: validated.action_statement,
      description: validated.description ?? null,
      is_enabled: validated.is_enabled ?? true,
      is_default: validated.is_default ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create consequence definition: ${error.message}`);
  }

  // If marked default, also update default_consequence_id in user_accountability_preferences
  if (validated.is_default) {
    await supabase
      .from('user_accountability_preferences')
      .upsert({
        user_id: user.id,
        default_consequence_id: data.id,
        updated_at: new Date().toISOString(),
      });
  }

  return data as ConsequenceDefinition;
}

export async function updateConsequenceDefinition(
  id: string,
  input: UpdateConsequenceDefinitionInput
): Promise<ConsequenceDefinition> {
  const validated = updateConsequenceDefinitionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  if (validated.is_default) {
    await supabase
      .from('consequence_definitions')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error } = await supabase
    .from('consequence_definitions')
    .update({
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update consequence definition: ${error.message}`);
  }

  if (validated.is_default) {
    await supabase
      .from('user_accountability_preferences')
      .upsert({
        user_id: user.id,
        default_consequence_id: data.id,
        updated_at: new Date().toISOString(),
      });
  }

  return data as ConsequenceDefinition;
}

export async function deleteConsequenceDefinition(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { error } = await supabase
    .from('consequence_definitions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw new Error(`Failed to delete consequence definition: ${error.message}`);
  }
}

export async function getUserAccountabilityPreferences(): Promise<UserAccountabilityPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('user_accountability_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No preferences record created yet
    throw new Error(`Failed to fetch user accountability preferences: ${error.message}`);
  }

  return data as UserAccountabilityPreferences;
}

export async function updateUserAccountabilityPreferences(
  input: UpdateUserAccountabilityPreferencesInput
): Promise<UserAccountabilityPreferences> {
  const validated = updateUserAccountabilityPreferencesSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('user_accountability_preferences')
    .upsert({
      user_id: user.id,
      ...validated,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user accountability preferences: ${error.message}`);
  }

  return data as UserAccountabilityPreferences;
}

/**
 * Resolves the active default consequence definition for task creation using deterministic priority ordering.
 * Order of resolution:
 * 1. Check if user accountability preferences exist and is_enabled is true.
 * 2. If default_consequence_id is explicitly set in preferences, verify it is enabled and owned by user.
 * 3. Otherwise, query consequence_definitions for enabled defaults (is_enabled = true, is_default = true),
 *    ordered deterministically by (priority DESC, created_at ASC, id ASC) limit 1.
 * 4. Return null if no valid default consequence exists.
 */
export async function resolveDefaultConsequence(): Promise<ConsequenceDefinition | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const prefs = await getUserAccountabilityPreferences();
  if (prefs && !prefs.is_enabled) {
    return null; // Master engine disabled for user
  }

  // 1. Try explicit default_consequence_id from preferences first
  if (prefs && prefs.default_consequence_id) {
    const consequence = await getConsequenceDefinitionById(prefs.default_consequence_id);
    if (consequence && consequence.is_enabled) {
      return consequence;
    }
  }

  // 2. Query enabled default consequence definitions ordered by priority DESC, created_at ASC, id ASC
  const { data, error } = await supabase
    .from('consequence_definitions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_enabled', true)
    .eq('is_default', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ConsequenceDefinition;
}

/**
 * Creates an immutable Task Accountability Commitment snapshot for a specific task.
 * Freezes title, consequence_type, action_statement, and description.
 */
export async function createTaskAccountabilityCommitment(
  taskId: string,
  consequence: ConsequenceDefinition
): Promise<TaskAccountabilityCommitment> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const snapshot = {
    title: consequence.title,
    consequence_type: consequence.consequence_type,
    action_statement: consequence.action_statement,
    description: consequence.description ?? null,
  };

  const { data, error } = await supabase
    .from('task_accountability_commitments')
    .insert({
      task_id: taskId,
      user_id: user.id,
      source_consequence_id: consequence.id,
      consequence_snapshot: snapshot,
      commitment_status: 'committed',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task accountability commitment: ${error.message}`);
  }

  return data as TaskAccountabilityCommitment;
}

/**
 * Confidential data-access boundary method to fetch a task's accountability commitment.
 * Isolated from basic getTasks() queries to protect consequence confidentiality until needed.
 */
export async function getTaskAccountabilityCommitment(
  taskId: string
): Promise<TaskAccountabilityCommitment | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('task_accountability_commitments')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch task accountability commitment: ${error.message}`);
  }

  return data as TaskAccountabilityCommitment | null;
}

/**
 * Fetches auditable accountability event history for a commitment.
 */
export async function getAccountabilityEvents(
  commitmentId: string
): Promise<AccountabilityEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('accountability_events')
    .select('*')
    .eq('commitment_id', commitmentId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch accountability events: ${error.message}`);
  }

  return data as AccountabilityEvent[];
}

/**
 * Fetches auditable accountability event history for a task.
 */
export async function getTaskAccountabilityEventHistory(
  taskId: string
): Promise<AccountabilityEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('accountability_events')
    .select('*')
    .eq('task_id', taskId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch task accountability event history: ${error.message}`);
  }

  return data as AccountabilityEvent[];
}


