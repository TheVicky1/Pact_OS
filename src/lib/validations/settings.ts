import { z } from 'zod';
import { isValidIanaTimezone } from '../time';

export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

/**
 * Validation schema for 3-character and 6-character hex color codes.
 */
export const hexColorSchema = z
  .string()
  .trim()
  .regex(HEX_COLOR_REGEX, 'Invalid hex color code format (e.g. #FF5500)');

/**
 * Validation schema for updating user profile (Name, IANA Timezone, optional accent color)
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
  accentColor: hexColorSchema.optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Validation schema for profile theme customization settings
 */
export const updateThemeSettingsSchema = z.object({
  accentColor: hexColorSchema,
  colorMode: z.enum(['light', 'dark', 'system']).default('system').optional(),
});

export type UpdateThemeSettingsInput = z.infer<typeof updateThemeSettingsSchema>;

export const updateProfileThemeSchema = updateThemeSettingsSchema;
export const updateThemePreferencesSchema = updateThemeSettingsSchema;
export type UpdateProfileThemeInput = UpdateThemeSettingsInput;
export type UpdateThemePreferencesInput = UpdateThemeSettingsInput;

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
