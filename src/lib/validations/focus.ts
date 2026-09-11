import { z } from 'zod';
import { FocusSession } from '../focus/timer';

export type FocusSessionRecord = FocusSession;

export const startFocusSessionSchema = z
  .object({
    taskId: z.string().uuid().nullable().optional(),
    task_id: z.string().uuid().nullable().optional(),
    mode: z.enum(['countdown', 'stopwatch']).default('countdown'),
    plannedDurationSeconds: z
      .number()
      .int()
      .min(60, 'Minimum session duration is 1 minute')
      .max(43200, 'Maximum session duration is 12 hours')
      .optional(),
    planned_duration_seconds: z
      .number()
      .int()
      .min(60, 'Minimum session duration is 1 minute')
      .max(43200, 'Maximum session duration is 12 hours')
      .optional(),
    notes: z.string().max(1000).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.mode === 'countdown') {
        const dur = data.planned_duration_seconds ?? data.plannedDurationSeconds;
        return typeof dur === 'number' && dur >= 60 && dur <= 43200;
      }
      return true;
    },
    {
      message: 'Countdown mode requires planned duration between 60 and 43200 seconds',
      path: ['planned_duration_seconds'],
    }
  );

export const completeFocusSessionSchema = z.object({
  sessionId: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  reason: z
    .enum([
      'timer_expired',
      'natural_expiration',
      'manual_complete',
      'manual_completed',
      'manual_stopwatch',
      'user_abandoned',
      'auto_reconciled',
    ])
    .default('manual_complete'),
  completion_reason: z
    .enum([
      'timer_expired',
      'natural_expiration',
      'manual_complete',
      'manual_completed',
      'manual_stopwatch',
      'user_abandoned',
      'auto_reconciled',
    ])
    .optional(),
  notes: z.string().max(1000).nullable().optional(),
}).refine(
  (data) => Boolean(data.sessionId || data.session_id),
  {
    message: 'sessionId or session_id is required and must be a valid UUID',
    path: ['session_id'],
  }
);

export const abandonFocusSessionSchema = z.object({
  sessionId: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  notes: z.string().max(1000).nullable().optional(),
}).refine(
  (data) => Boolean(data.sessionId || data.session_id),
  {
    message: 'sessionId or session_id is required and must be a valid UUID',
    path: ['session_id'],
  }
);

export const sessionActionSchema = z.object({
  sessionId: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
}).refine(
  (data) => Boolean(data.sessionId || data.session_id),
  {
    message: 'sessionId or session_id is required and must be a valid UUID',
    path: ['session_id'],
  }
);

export type StartFocusSessionInput = z.infer<typeof startFocusSessionSchema>;
export type CompleteFocusSessionInput = z.infer<typeof completeFocusSessionSchema>;
