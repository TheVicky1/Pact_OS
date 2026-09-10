import { createClient } from '@/lib/supabase/server';
import { VerificationType, VerificationConfig, Task } from '@/types/domain';
import { isValidIanaTimezone, utcToLocal, getIsoWeekAndYear } from '@/lib/time';

export { getIsoWeekAndYear };

export interface ActivatedCommitmentDetails {
  commitment_id: string;
  task_id: string;
  user_id: string;
  commitment_status: 'activated';
  activated_at: string | null;
  consequence_snapshot: {
    title: string;
    consequence_type: string;
    action_statement: string;
    description: string | null;
    verification_type: VerificationType;
    verification_config: VerificationConfig;
  };
  task: {
    id: string;
    title: string;
    status: string;
    deadline_at: string;
    missed_at: string | null;
  };
}

export interface WeeklyWaiverUsage {
  used: number;
  max: number;
  remaining: number;
  weekYear: number;
  weekNumber: number;
  resetText: string;
}

export interface AccountabilityHistoryItem {
  id: string;
  event_type: 'activated' | 'fulfilled' | 'waived' | 'resolved';
  created_at: string;
  task_id: string;
  task_title: string;
  commitment_id: string;
  consequence_title: string;
  verification_type?: VerificationType;
  metadata: Record<string, unknown> | null;
}

interface ActivatedCommitmentRow {
  id: string;
  task_id: string;
  user_id: string;
  commitment_status: 'activated';
  activated_at: string | null;
  consequence_snapshot: {
    title?: string;
    consequence_type?: string;
    action_statement?: string;
    description?: string | null;
    verification_type?: VerificationType;
    verification_config?: VerificationConfig;
  } | null;
  tasks: {
    id: string;
    title: string;
    status: string;
    deadline_at: string;
    missed_at: string | null;
  };
}

/**
 * Dedicated authorized query to fetch activated commitments for the authenticated user.
 * STRICT CONFIDENTIALITY BOUNDARY:
 * Consequence snapshot is retrieved ONLY when commitment_status = 'activated' AND task status = 'missed'.
 */
export async function getActivatedCommitments(): Promise<ActivatedCommitmentDetails[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  // Join task_accountability_commitments with tasks where commitment is activated and task is missed
  const { data, error } = await supabase
    .from('task_accountability_commitments')
    .select(`
      id,
      task_id,
      user_id,
      commitment_status,
      activated_at,
      consequence_snapshot,
      tasks!inner (
        id,
        title,
        status,
        deadline_at,
        missed_at
      )
    `)
    .eq('user_id', user.id)
    .eq('commitment_status', 'activated')
    .eq('tasks.status', 'missed')
    .order('activated_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as unknown as ActivatedCommitmentRow[]).map((row) => ({
    commitment_id: row.id,
    task_id: row.task_id,
    user_id: row.user_id,
    commitment_status: 'activated' as const,
    activated_at: row.activated_at,
    consequence_snapshot: {
      title: row.consequence_snapshot?.title || 'Accountability Action',
      consequence_type: row.consequence_snapshot?.consequence_type || 'self_improvement',
      action_statement: row.consequence_snapshot?.action_statement || '',
      description: row.consequence_snapshot?.description || null,
      verification_type: (row.consequence_snapshot?.verification_type as VerificationType) || 'declaration',
      verification_config: (row.consequence_snapshot?.verification_config as VerificationConfig) || {},
    },
    task: {
      id: row.tasks.id,
      title: row.tasks.title,
      status: row.tasks.status,
      deadline_at: row.tasks.deadline_at,
      missed_at: row.tasks.missed_at,
    },
  }));
}

/**
 * Calculates current calendar-week waiver usage for the authenticated user in their IANA timezone.
 */
export async function getWeeklyWaiverUsage(timezone: string): Promise<WeeklyWaiverUsage> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const safeTz = isValidIanaTimezone(timezone) ? timezone : 'UTC';
  const now = new Date();
  const { weekYear, weekNumber } = getIsoWeekAndYear(now, safeTz);

  // Compute next Monday 00:00 in user's timezone for reset presentation
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const getPart = (t: string) => parseInt(parts.find((p) => p.type === t)?.value || '0', 10);
  const localYear = getPart('year');
  const localMonth = getPart('month') - 1;
  const localDay = getPart('day');

  const localDateUtc = new Date(Date.UTC(localYear, localMonth, localDay));
  const currentDayOfWeek = (localDateUtc.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6
  const daysUntilNextMonday = 7 - currentDayOfWeek;
  const nextMondayDate = new Date(Date.UTC(localYear, localMonth, localDay + daysUntilNextMonday));
  const resetFormatted = utcToLocal(nextMondayDate.toISOString(), safeTz, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (!user) {
    return {
      used: 0,
      max: 3,
      remaining: 3,
      weekYear,
      weekNumber,
      resetText: `Resets ${resetFormatted} at 12:00 AM`,
    };
  }

  const { count, error } = await supabase
    .from('accountability_waivers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('waiver_week_year', weekYear)
    .eq('waiver_week_number', weekNumber);

  const used = (!error && typeof count === 'number') ? count : 0;
  const remaining = Math.max(0, 3 - used);

  return {
    used,
    max: 3,
    remaining,
    weekYear,
    weekNumber,
    resetText: `Resets ${resetFormatted} at 12:00 AM`,
  };
}

/**
 * Retrieves the user's completed tasks for task-completion verification linkage.
 * Prevents circular reference by disallowing selection of the missed task itself.
 */
export async function getCompletedTasksForVerification(excludeTaskId: string): Promise<Pick<Task, 'id' | 'title' | 'completed_at'>[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, completed_at')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .neq('id', excludeTaskId)
    .order('completed_at', { ascending: false })
    .limit(30);

  if (error || !data) {
    return [];
  }

  return data as Pick<Task, 'id' | 'title' | 'completed_at'>[];
}

/**
 * Retrieves the full chronological accountability event history for the user.
 */
export async function getAccountabilityHistory(): Promise<AccountabilityHistoryItem[]> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from('accountability_events')
    .select(`
      id,
      event_type,
      metadata,
      created_at,
      task_id,
      commitment_id,
      tasks (
        title
      ),
      task_accountability_commitments (
        consequence_snapshot
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

interface AccountabilityEventRow {
  id: string;
  event_type: 'activated' | 'fulfilled' | 'waived' | 'resolved';
  metadata: Record<string, unknown> | null;
  created_at: string;
  task_id: string;
  commitment_id: string;
  tasks: {
    title: string;
  } | null;
  task_accountability_commitments: {
    consequence_snapshot: {
      title?: string;
      verification_type?: VerificationType;
    } | null;
  } | null;
}

  if (error || !data) {
    return [];
  }

  return (data as unknown as AccountabilityEventRow[]).map((row) => {
    const snapshot = row.task_accountability_commitments?.consequence_snapshot;
    return {
      id: row.id,
      event_type: row.event_type,
      created_at: row.created_at,
      task_id: row.task_id,
      task_title: row.tasks?.title || 'Untitled Task',
      commitment_id: row.commitment_id,
      consequence_title: snapshot?.title || 'Accountability Consequence',
      verification_type: snapshot?.verification_type as VerificationType | undefined,
      metadata: row.metadata || null,
    };
  });
}
