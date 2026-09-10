import { z } from 'zod';
import { isValidIanaTimezone } from '../time';

/**
 * Validation schema for updating user profile (Name & IANA Timezone)
 */
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters long.')
    .max(100, 'Full name must not exceed 100 characters.'),
  timezone: z
    .string()
    .trim()
    .min(1, 'Timezone is required.')
    .refine((val) => isValidIanaTimezone(val), {
      message: 'Invalid IANA timezone identifier (e.g., Asia/Kolkata, America/New_York, UTC).',
    }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Validation schema for updating user password
 */
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters long.')
      .max(100, 'Password must not exceed 100 characters.'),
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;

/**
 * Validation schema for accountability preferences
 */
export const updateAccountabilityPreferencesSchema = z.object({
  defaultConsequenceId: z.string().uuid().nullable().optional(),
  autoApplyDefault: z.boolean().default(false),
  isEnabled: z.boolean().default(true),
});

export type UpdateAccountabilityPreferencesInput = z.infer<
  typeof updateAccountabilityPreferencesSchema
>;

/**
 * Validation schema for notification preferences
 */
export const updateNotificationPreferencesSchema = z.object({
  dailyPlanReminder: z.boolean().default(true),
  deadlineAlerts: z.boolean().default(true),
  consequenceAlerts: z.boolean().default(true),
  weeklyReviewNotice: z.boolean().default(true),
});

export type UpdateNotificationPreferencesInput = z.infer<
  typeof updateNotificationPreferencesSchema
>;
