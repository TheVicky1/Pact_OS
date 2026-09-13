/**
 * PACT Phase 8: Mobile Companion Shared Contracts & SDK
 * Re-exports domain types, offline queue primitives, Live Activity contracts,
 * and mobile device registration schemas for React Native / Expo companion apps.
 */

export * from '@/types/domain';
export * from '@/types/notifications';
export * from '@/lib/offline/queue';
export * from '@/lib/offline/sync-engine';
export * from '@/lib/offline/storage';
export * from '@/lib/focus/live-activity';
export * from '@/lib/focus/timer';
export * from '@/lib/validations/device';
export * from '@/lib/notifications/mobile-push';

export interface MobileCompanionConfig {
  apiUrl: string;
  appVersion: string;
  platform: 'ios' | 'android';
}

export interface MobileAuthSession {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userEmail?: string;
  expiresAtEpochMs: number;
}
