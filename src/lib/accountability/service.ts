import { createClient } from '@/lib/supabase/server';
import {
  ConsequenceDefinition,
  UserAccountabilityPreferences,
  TaskAccountabilityCommitment,
  AccountabilityEvent,
  AccountabilityVerificationSession,
  AccountabilityWaiver,
  CreateConsequenceDefinitionInput,
  UpdateConsequenceDefinitionInput,
  UpdateUserAccountabilityPreferencesInput,
} from '@/types/domain';
import {
  createConsequenceDefinitionSchema,
  updateConsequenceDefinitionSchema,
  updateUserAccountabilityPreferencesSchema,
  startSessionSchema,
  fulfillSessionSchema,
  cancelSessionSchema,
  waiveCommitmentSchema,
  fulfillWrittenReflectionSchema,
  declareFulfillmentSchema,
  fulfillTaskCompletionSchema,
} from '@/lib/validations/accountability';
import { AccountabilityResolutionResult, ExternalProofRuleResult } from '@/types/domain';

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
      priority: validated.priority ?? 0,
      verification_type: validated.verification_type ?? 'declaration',
      verification_config: validated.verification_config ?? {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create consequence definition: ${error.message}`);
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
    verification_type: consequence.verification_type ?? 'declaration',
    verification_config: consequence.verification_config ?? {},
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

/**
 * Starts a server-authoritative accountability verification session.
 * If an active session already exists, resumes and returns it.
 */
export async function startAccountabilitySession(
  commitmentId: string
): Promise<{ success: boolean; code: string; data?: AccountabilityVerificationSession; error?: string }> {
  const validated = startSessionSchema.parse({ commitment_id: commitmentId });
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('start_accountability_session', {
    p_commitment_id: validated.commitment_id,
  });

  if (error) {
    throw new Error(`Failed to start verification session: ${error.message}`);
  }

  return data;
}

/**
 * Fulfills an accountability verification session after server validates elapsed duration and required evidence.
 */
export async function fulfillAccountabilitySession(
  sessionId: string,
  evidenceNote?: string
): Promise<{ success: boolean; code: string; data?: AccountabilityVerificationSession; error?: string }> {
  const validated = fulfillSessionSchema.parse({
    session_id: sessionId,
    evidence_note: evidenceNote,
  });
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fulfill_accountability_session', {
    p_session_id: validated.session_id,
    p_evidence_note: validated.evidence_note ?? null,
  });

  if (error) {
    throw new Error(`Failed to fulfill verification session: ${error.message}`);
  }

  return data;
}

/**
 * Cancels an active accountability verification session without resolving the consequence.
 */
export async function cancelAccountabilitySession(
  sessionId: string
): Promise<{ success: boolean; code: string; data?: AccountabilityVerificationSession; error?: string }> {
  const validated = cancelSessionSchema.parse({ session_id: sessionId });
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('cancel_accountability_session', {
    p_session_id: validated.session_id,
  });

  if (error) {
    throw new Error(`Failed to cancel verification session: ${error.message}`);
  }

  return data;
}

/**
 * Waives an activated accountability commitment, enforcing the 3-waiver weekly limit in user timezone.
 */
export async function waiveAccountabilityCommitment(
  commitmentId: string,
  confirmationToken: string
): Promise<{ success: boolean; code: string; waiver_count_in_week?: number; data?: AccountabilityWaiver; error?: string }> {
  const validated = waiveCommitmentSchema.parse({
    commitment_id: commitmentId,
    confirmation_token: confirmationToken,
  });
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('waive_accountability_commitment', {
    p_commitment_id: validated.commitment_id,
    p_confirmation_token: validated.confirmation_token,
  });

  if (error) {
    throw new Error(`Failed to waive commitment: ${error.message}`);
  }

  return data;
}

/**
 * Gets the current active ('started') verification session for a commitment, if any.
 */
export async function getActiveVerificationSession(
  commitmentId: string
): Promise<AccountabilityVerificationSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('accountability_verification_sessions')
    .select('*')
    .eq('commitment_id', commitmentId)
    .eq('user_id', user.id)
    .eq('status', 'started')
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch active verification session: ${error.message}`);
  }

  return data as AccountabilityVerificationSession | null;
}

/**
 * Gets all verification sessions for a commitment.
 */
export async function getVerificationSessions(
  commitmentId: string
): Promise<AccountabilityVerificationSession[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('accountability_verification_sessions')
    .select('*')
    .eq('commitment_id', commitmentId)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch verification sessions: ${error.message}`);
  }

  return data as AccountabilityVerificationSession[];
}

/**
 * Gets the waiver audit record for a commitment, if waived.
 */
export async function getAccountabilityWaiver(
  commitmentId: string
): Promise<AccountabilityWaiver | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  const { data, error } = await supabase
    .from('accountability_waivers')
    .select('*')
    .eq('commitment_id', commitmentId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch accountability waiver: ${error.message}`);
  }

  return data as AccountabilityWaiver | null;
}

/**
 * Fulfills an accountability consequence requiring written reflection.
 * Enforces min 20 chars, max 5000 chars, non-empty, and writes reflection metadata.
 */
export async function fulfillWrittenReflection(
  commitmentId: string,
  reflectionText: string
): Promise<AccountabilityResolutionResult> {
  const validated = fulfillWrittenReflectionSchema.parse({
    commitment_id: commitmentId,
    reflection_text: reflectionText,
  });
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fulfill_written_reflection', {
    p_commitment_id: validated.commitment_id,
    p_reflection_text: validated.reflection_text,
  });

  if (error) {
    throw new Error(`Failed to fulfill written reflection: ${error.message}`);
  }

  return data as AccountabilityResolutionResult;
}

/**
 * Fulfills an accountability consequence requiring self-declaration.
 * Explicitly records as self-reported (not objectively verified) with audit trail.
 */
export async function declareAccountabilityFulfillment(
  commitmentId: string,
  declarationStatement: string
): Promise<AccountabilityResolutionResult> {
  const validated = declareFulfillmentSchema.parse({
    commitment_id: commitmentId,
    declaration_statement: declarationStatement,
  });
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('declare_accountability_fulfillment', {
    p_commitment_id: validated.commitment_id,
    p_declaration_statement: validated.declaration_statement,
  });

  if (error) {
    throw new Error(`Failed to declare fulfillment: ${error.message}`);
  }

  return data as AccountabilityResolutionResult;
}

/**
 * Fulfills an accountability consequence requiring another PACT task to be completed.
 * Verifies target task exists, belongs to user, is in completed status, and prevents circular reference.
 */
export async function fulfillTaskCompletion(
  commitmentId: string,
  targetTaskId: string
): Promise<AccountabilityResolutionResult> {
  const validated = fulfillTaskCompletionSchema.parse({
    commitment_id: commitmentId,
    target_task_id: targetTaskId,
  });
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('fulfill_task_completion_commitment', {
    p_commitment_id: validated.commitment_id,
    p_target_task_id: validated.target_task_id,
  });

  if (error) {
    throw new Error(`Failed to fulfill task completion consequence: ${error.message}`);
  }

  return data as AccountabilityResolutionResult;
}

/**
 * Evaluates external proof-of-work evidence and authoritatively fulfills commitment if rule is satisfied.
 * Enforces server trust boundary and isolates tokens.
 */
export async function verifyAndFulfillExternalProofCommitment(
  commitmentId: string,
  fetcherOverrides?: Record<string, unknown>
): Promise<{
  success: boolean;
  code: string;
  ruleResult?: ExternalProofRuleResult;
  data?: Record<string, unknown>;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Authentication required.');
  }

  // 1. Fetch commitment and task details
  const { data: commitment, error: commError } = await supabase
    .from('task_accountability_commitments')
    .select('*, tasks!inner(*)')
    .eq('id', commitmentId)
    .eq('user_id', user.id)
    .single();

  if (commError || !commitment) {
    return {
      success: false,
      code: 'NOT_FOUND',
      error: 'Accountability commitment not found or access denied.',
    };
  }

  const snapshot = commitment.consequence_snapshot || {};
  const verifType = snapshot.verification_type || 'declaration';
  const verifConfig = snapshot.verification_config || {};

  // 2. Map verification type to provider
  let provider: 'github' | 'leetcode' | 'codeforces' = 'github';
  if (verifType === 'github_commits' || verifType === 'github_pr') {
    provider = 'github';
  } else if (verifType === 'leetcode_solve') {
    provider = 'leetcode';
  } else if (verifType === 'codeforces_solve') {
    provider = 'codeforces';
  } else if (verifType === 'external_proof') {
    provider = (verifConfig.provider as 'github' | 'leetcode' | 'codeforces') || 'github';
  } else {
    return {
      success: false,
      code: 'INVALID_VERIFICATION_TYPE',
      error: `Commitment verification type "${verifType}" is not an external proof requirement.`,
    };
  }

  // 3. Fetch linked provider integration
  const { data: integrationRecord } = await supabase
    .from('external_provider_integrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .maybeSingle();

  if (!integrationRecord || !integrationRecord.account_handle) {
    return {
      success: false,
      code: 'NO_LINKED_ACCOUNT',
      error: `No linked ${provider.toUpperCase()} account found. Please connect your account in Settings.`,
    };
  }

  // 4. Derive authoritative time window
  const task = commitment.tasks;
  const windowStart = commitment.created_at || task.created_at || new Date().toISOString();
  const windowEnd = task.deadline_at || new Date().toISOString();

  // 5. Evaluate proof-of-work rule via deterministic engine
  const { evaluateProofOfWorkRule } = await import('@/lib/integrations/proof-of-work');
  const ruleResult = await evaluateProofOfWorkRule({
    provider,
    ruleType: verifType,
    config: verifConfig,
    windowStart,
    windowEnd,
    accountHandle: integrationRecord.account_handle,
    token: integrationRecord.access_token,
    fetcherOverrides,
  });

  if (!ruleResult.verified) {
    return {
      success: false,
      code: ruleResult.code,
      error: ruleResult.error || ruleResult.summary,
      ruleResult,
    };
  }

  // 6. Fulfill commitment via server-authoritative RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'fulfill_external_proof_commitment',
    {
      p_commitment_id: commitmentId,
      p_provider: provider,
      p_rule_summary: ruleResult.summary,
      p_evidence_items: ruleResult.evidence,
    }
  );

  if (rpcError) {
    return {
      success: false,
      code: 'RPC_ERROR',
      error: `Failed to record verified proof: ${rpcError.message}`,
      ruleResult,
    };
  }

  // 7. Deliver in-app notification
  try {
    const { deliverInApp } = await import('@/lib/notifications/delivery');
    await deliverInApp(supabase, {
      userId: user.id,
      type: 'verification_completed',
      title: 'Proof-of-Work Verified',
      body: ruleResult.summary,
      actionUrl: '/app/accountability',
      idempotencyKey: `pow_${commitmentId}_${Date.now()}`,
      metadata: {
        provider,
        evidence_count: ruleResult.evidence.length,
      },
    });
  } catch {
    // Non-fatal
  }

  return {
    success: true,
    code: 'FULFILLED',
    ruleResult,
    data: rpcData?.data,
  };
}



