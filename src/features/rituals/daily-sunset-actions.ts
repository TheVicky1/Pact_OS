'use server';

/**
 * PACT Phase 12: Daily Sunset Server Actions
 */

import { createClient } from '@/lib/supabase/server';
import { completeDailySunsetSchema, CompleteDailySunsetInput } from '@/lib/rituals/daily-sunset';
import { logger } from '@/lib/observability/logger';
import { revalidatePath } from 'next/cache';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function submitDailySunset(input: CompleteDailySunsetInput): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = completeDailySunsetSchema.parse(input);
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // 1. Process Task Triage Decisions
    for (const triage of validated.triageDecisions) {
      if (triage.decision === 'carry_forward_tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        await supabase
          .from('tasks')
          .update({
            scheduled_date: tomorrowStr,
            updated_at: new Date().toISOString(),
          })
          .eq('id', triage.taskId)
          .eq('user_id', user.id);
      } else if (triage.decision === 'move_to_backlog') {
        await supabase
          .from('tasks')
          .update({
            scheduled_date: null,
            status: 'todo',
            updated_at: new Date().toISOString(),
          })
          .eq('id', triage.taskId)
          .eq('user_id', user.id);
      } else if (triage.decision === 'discard') {
        await supabase
          .from('tasks')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', triage.taskId)
          .eq('user_id', user.id);
      }
    }

    // 2. Persist Daily Sunset Record
    const { data: record, error: insertError } = await supabase
      .from('daily_sunset_logs')
      .upsert(
        {
          user_id: user.id,
          date: validated.date,
          tasks_completed_count: validated.tasksCompletedCount,
          tasks_total_count: validated.tasksTotalCount,
          focus_minutes_total: validated.focusMinutesTotal,
          habits_completed_count: validated.habitsCompletedCount,
          habits_total_count: validated.habitsTotalCount,
          triage_decisions: validated.triageDecisions,
          tomorrow_top_priorities: validated.tomorrowTopPriorities,
          reflection_notes: validated.reflectionNotes || null,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,date' }
      )
      .select('id')
      .single();

    if (insertError) {
      logger.error('Failed to persist daily sunset record', insertError);
      return { success: false, error: 'Database persistence error' };
    }

    // 3. Record Audit Log Telemetry
    await supabase.rpc('record_audit_event', {
      p_event_type: 'RITUAL',
      p_action: 'DAILY_SUNSET_COMPLETED',
      p_resource_type: 'daily_sunset_logs',
      p_resource_id: record?.id,
      p_metadata: {
        date: validated.date,
        tasks_completed: validated.tasksCompletedCount,
        focus_minutes: validated.focusMinutesTotal,
      },
    });

    revalidatePath('/app');
    revalidatePath('/app/sunset');
    revalidatePath('/app/tasks');

    return { success: true, data: { id: record?.id || 'saved' } };
  } catch (err: unknown) {
    logger.error('Error submitting daily sunset', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
