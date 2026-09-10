/**
 * PACT Phase 5A: Autonomous Background Deadline Sweeper
 * Provides pure deterministic domain evaluation for offline testing and server-side RPC execution.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Clock, defaultClock, isDeadlineReached } from '@/lib/time';
import { TaskStatus, CommitmentStatus } from '@/types/domain';

export interface SweeperCandidateTask {
  id: string;
  user_id: string;
  status: TaskStatus;
  deadline_at: string;
  completed_at?: string | null;
  missed_at?: string | null;
  commitment?: {
    id: string;
    commitment_status: CommitmentStatus;
  } | null;
}

export interface EvaluatedSweepResult {
  transitionedTaskIds: string[];
  activatedCommitmentIds: string[];
  skippedTaskIds: string[];
  processedCount: number;
  activatedCount: number;
}

export interface SweeperExecutionResult {
  success: boolean;
  code: string;
  processed_count: number;
  activated_count: number;
  batch_size?: number;
  duration_ms?: number;
  executed_at?: string;
  error?: string;
}

/**
 * Pure deterministic evaluation of candidate tasks against an authoritative clock.
 * Implements the exact same rules as the database RPC `sweep_expired_tasks`.
 */
export function evaluateExpiredTasks(
  tasks: SweeperCandidateTask[],
  clock: Clock = defaultClock,
  batchSize: number = 50
): EvaluatedSweepResult {
  const boundedBatch = Math.min(Math.max(batchSize, 1), 500);
  const eligibleCandidates = tasks.filter(
    (t) => (t.status === 'pending' || t.status === 'in_progress') && isDeadlineReached(t.deadline_at, clock)
  );

  const selectedBatch = eligibleCandidates.slice(0, boundedBatch);
  const transitionedTaskIds: string[] = [];
  const activatedCommitmentIds: string[] = [];
  const skippedTaskIds: string[] = [];

  for (const t of tasks) {
    if (selectedBatch.some((b) => b.id === t.id)) {
      transitionedTaskIds.push(t.id);
      if (t.commitment && t.commitment.commitment_status === 'committed') {
        activatedCommitmentIds.push(t.commitment.id);
      }
    } else {
      skippedTaskIds.push(t.id);
    }
  }

  return {
    transitionedTaskIds,
    activatedCommitmentIds,
    skippedTaskIds,
    processedCount: transitionedTaskIds.length,
    activatedCount: activatedCommitmentIds.length,
  };
}

/**
 * Executes authoritative global deadline sweep via Supabase RPC (service_role only).
 */
export async function executeDeadlineSweep(
  supabase: SupabaseClient,
  batchSize: number = 50
): Promise<SweeperExecutionResult> {
  try {
    const { data, error } = await supabase.rpc('sweep_expired_tasks', {
      p_batch_size: batchSize,
    });

    if (error || !data) {
      return {
        success: false,
        code: 'SWEEP_FAILED',
        processed_count: 0,
        activated_count: 0,
        error: error?.message || 'Database error during deadline sweep.',
      };
    }

    return data as SweeperExecutionResult;
  } catch (err: unknown) {
    return {
      success: false,
      code: 'EXECUTION_ERROR',
      processed_count: 0,
      activated_count: 0,
      error: err instanceof Error ? err.message : 'Unexpected sweeper error.',
    };
  }
}

/**
 * Executes authoritative user-scoped deadline sweep via Supabase RPC for authenticated user session.
 */
export async function executeUserDeadlineSweep(
  supabase: SupabaseClient,
  batchSize: number = 50
): Promise<SweeperExecutionResult> {
  try {
    const { data, error } = await supabase.rpc('sweep_user_expired_tasks', {
      p_batch_size: batchSize,
    });

    if (error || !data) {
      return {
        success: false,
        code: 'USER_SWEEP_FAILED',
        processed_count: 0,
        activated_count: 0,
        error: error?.message || 'Database error during user deadline sweep.',
      };
    }

    return data as SweeperExecutionResult;
  } catch (err: unknown) {
    return {
      success: false,
      code: 'USER_EXECUTION_ERROR',
      processed_count: 0,
      activated_count: 0,
      error: err instanceof Error ? err.message : 'Unexpected user sweeper error.',
    };
  }
}
