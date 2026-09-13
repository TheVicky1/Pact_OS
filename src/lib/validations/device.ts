import { z } from 'zod';

export const devicePlatformSchema = z.enum(['ios', 'android', 'web_push']);

export const registerDeviceTokenSchema = z.object({
  platform: devicePlatformSchema,
  token: z
    .string()
    .trim()
    .min(1, 'Device push token is required.')
    .max(1024, 'Device token exceeds maximum length of 1024 characters.'),
  device_name: z
    .string()
    .trim()
    .min(1, 'Device name is required.')
    .max(128, 'Device name must not exceed 128 characters.')
    .optional(),
  app_version: z
    .string()
    .trim()
    .max(32, 'App version string must not exceed 32 characters.')
    .optional(),
});

export const unregisterDeviceTokenSchema = z.object({
  token: z.string().trim().min(1, 'Device push token is required.'),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>;
export type UnregisterDeviceTokenInput = z.infer<typeof unregisterDeviceTokenSchema>;
