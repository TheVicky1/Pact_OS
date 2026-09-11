import { z } from 'zod';
import { isValidIanaTimezone } from '../time';

/**
 * Step 1 — Identity & Working Schedule
 */
export const onboardingStep1Schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters long.')
    .max(100, 'Display name must not exceed 100 characters.'),
  timezone: z
    .string()
    .trim()
    .min(1, 'Timezone is required.')
    .refine((val) => isValidIanaTimezone(val), {
      message: 'Invalid IANA timezone identifier (e.g., Asia/Kolkata, America/New_York, UTC).',
    }),
  workStartTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
    .default('09:00'),
  workEndTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)')
    .default('18:00'),
});

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;

/**
 * Step 2 — Operating Preferences & Notifications
 */
export const onboardingStep2Schema = z.object({
  dailyTaskTarget: z
    .number()
    .int('Target must be an integer')
    .min(1, 'Daily target must be at least 1 task')
    .max(20, 'Daily target cannot exceed 20 tasks')
    .default(5),
  notificationPreferences: z
    .object({
      dailyPlanReminder: z.boolean().default(true),
      deadlineAlerts: z.boolean().default(true),
      consequenceAlerts: z.boolean().default(true),
      weeklyReviewNotice: z.boolean().default(true),
    })
    .default({
      dailyPlanReminder: true,
      deadlineAlerts: true,
      consequenceAlerts: true,
      weeklyReviewNotice: true,
    }),
  initialGoalTitle: z
    .string()
    .trim()
    .max(120, 'Goal title must not exceed 120 characters')
    .optional()
    .or(z.literal('')),
  initialProjectTitle: z
    .string()
    .trim()
    .max(120, 'Project title must not exceed 120 characters')
    .optional()
    .or(z.literal('')),
});

export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>;

/**
 * Complete Onboarding Payload
 */
export const completeOnboardingSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  timezone: z
    .string()
    .trim()
    .refine((val) => isValidIanaTimezone(val), {
      message: 'Invalid IANA timezone',
    })
    .optional(),
  workStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  workEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  dailyTaskTarget: z.number().int().min(1).max(20).optional(),
  notificationPreferences: z
    .object({
      dailyPlanReminder: z.boolean(),
      deadlineAlerts: z.boolean(),
      consequenceAlerts: z.boolean(),
      weeklyReviewNotice: z.boolean(),
    })
    .optional(),
  initialGoalTitle: z.string().trim().max(120).optional(),
  initialProjectTitle: z.string().trim().max(120).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
