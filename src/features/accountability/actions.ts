'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import {
  startAccountabilitySession,
  fulfillAccountabilitySession,
  cancelAccountabilitySession,
  fulfillWrittenReflection,
  declareAccountabilityFulfillment,
  fulfillTaskCompletion,
  waiveAccountabilityCommitment,
} from '@/lib/accountability/service';

export interface AccountabilityActionResult<T = unknown> {
  success: boolean;
  code?: string;
  data?: T;
  error?: string;
  weekly_waiver_count?: number;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

/**
 * Server action to start or resume a server-authoritative timed verification session.
 */
export async function startSessionAction(
  commitmentId: string
): Promise<AccountabilityActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(commitmentId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid commitment identifier.' };
    }

    const res = await startAccountabilitySession(commitmentId);

    revalidatePath('/app');
    revalidatePath('/app/tasks');
    revalidatePath('/app/accountability');

    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to start verification session.'),
    };
  }
}

/**
 * Server action to fulfill a timed verification session.
 * Server verifies elapsed duration and enforces synthesis note requirement.
 */
export async function fulfillSessionAction(
  sessionId: string,
  evidenceNote?: string
): Promise<AccountabilityActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(sessionId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid session identifier.' };
    }

    const res = await fulfillAccountabilitySession(sessionId, evidenceNote);

    revalidatePath('/app');
    revalidatePath('/app/tasks');
    revalidatePath('/app/accountability');

    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to fulfill verification session.'),
    };
  }
}

/**
 * Server action to safely cancel an active verification session without resolving commitment.
 */
export async function cancelSessionAction(
  sessionId: string
): Promise<AccountabilityActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(sessionId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid session identifier.' };
    }

    const res = await cancelAccountabilitySession(sessionId);

    revalidatePath('/app');
    revalidatePath('/app/tasks');
    revalidatePath('/app/accountability');

    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to cancel verification session.'),
    };
  }
}

/**
 * Server action to fulfill an accountability commitment via written reflection.
 * Enforces minimum 20 chars and maximum 5,000 chars.
 */
export async function fulfillWrittenReflectionAction(
  commitmentId: string,
  reflectionText: string
): Promise<AccountabilityActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(commitmentId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid commitment identifier.' };
    }

    const trimmed = (reflectionText || '').trim();
    if (trimmed.length < 20) {
      return { success: false, error: 'Reflection must be at least 20 characters.' };
    }
    if (trimmed.length > 5000) {
      return { success: false, error: 'Reflection cannot exceed 5,000 characters.' };
    }

    const res = await fulfillWrittenReflection(commitmentId, trimmed);

    revalidatePath('/app');
    revalidatePath('/app/tasks');
    revalidatePath('/app/accountability');

    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to submit written reflection.'),
    };
  }
}

/**
 * Server action to declare accountability fulfillment (self-declaration).
 */
export async function declareFulfillmentAction(
  commitmentId: string,
  declarationStatement: string
): Promise<AccountabilityActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(commitmentId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid commitment identifier.' };
    }

    const trimmed = (declarationStatement || '').trim();
    if (!trimmed) {
      return { success: false, error: 'A formal declaration statement is required.' };
    }

    const res = await declareAccountabilityFulfillment(commitmentId, trimmed);

    revalidatePath('/app');
    revalidatePath('/app/tasks');
    revalidatePath('/app/accountability');

    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to record self-declaration.'),
    };
  }
}

/**
 * Server action to fulfill an accountability commitment by linking a completed PACT task.
 */
export async function fulfillTaskCompletionAction(
  commitmentId: string,
  targetTaskId: string
): Promise<AccountabilityActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(commitmentId);
    const targetValidation = z.string().uuid().safeParse(targetTaskId);

    if (!uuidValidation.success || !targetValidation.success) {
      return { success: false, error: 'Invalid identifier provided.' };
    }

    const res = await fulfillTaskCompletion(commitmentId, targetTaskId);

    revalidatePath('/app');
    revalidatePath('/app/tasks');
    revalidatePath('/app/accountability');

    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to link completed task for verification.'),
    };
  }
}

/**
 * Server action to deliberately request a weekly waiver.
 * Validates user-facing deliberate confirmation phrase and supplies internal domain token.
 */
export async function waiveCommitmentAction(
  commitmentId: string,
  confirmationPhrase: string
): Promise<AccountabilityActionResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const uuidValidation = z.string().uuid().safeParse(commitmentId);
    if (!uuidValidation.success) {
      return { success: false, error: 'Invalid commitment identifier.' };
    }

    // Enforce deliberate confirmation phrase typing
    const trimmedPhrase = (confirmationPhrase || '').trim().toLowerCase();
    if (trimmedPhrase !== 'i accept this waiver') {
      return {
        success: false,
        error: 'Please type the exact confirmation phrase: "I accept this waiver".',
      };
    }

    // Supply the required internal domain token CONFIRM_WAIVER_V1
    const res = await waiveAccountabilityCommitment(commitmentId, 'CONFIRM_WAIVER_V1');

    revalidatePath('/app');
    revalidatePath('/app/tasks');
    revalidatePath('/app/accountability');

    return res;
  } catch (err: unknown) {
    return {
      success: false,
      error: getErrorMessage(err, 'Failed to process waiver request.'),
    };
  }
}

/**
 * Server action to fetch eligible completed tasks for task-completion verification.
 */
export async function getCompletedTasksAction(
  excludeTaskId: string
): Promise<{ success: boolean; data: Array<{ id: string; title: string; completed_at: string | null }>; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, data: [], error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .neq('id', excludeTaskId)
      .order('completed_at', { ascending: false })
      .limit(30);

    if (error) {
      return { success: false, data: [], error: 'Failed to load completed tasks.' };
    }

    return {
      success: true,
      data: (data || []) as Array<{ id: string; title: string; completed_at: string | null }>,
    };
  } catch (err: unknown) {
    return {
      success: false,
      data: [],
      error: getErrorMessage(err, 'Failed to retrieve completed tasks.'),
    };
  }
}
