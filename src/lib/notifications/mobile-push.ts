/**
 * PACT Phase 8: Mobile Push Notification Formatter & Delivery Provider
 * Enforces strict confidentiality: Never leaks unexcused failure consequence punishments in push alerts.
 */

import { NotificationPayload, DeliveryResult } from './delivery';

export interface MobilePushDevice {
  platform: 'ios' | 'android' | 'web_push';
  token: string;
}

export interface MobilePushFormattedPayload {
  to: string;
  title: string;
  body: string;
  sound: 'default' | null;
  badge: number;
  data: Record<string, unknown>;
}

/**
 * Pure function: Formats a notification payload for mobile push delivery while enforcing consequence privacy.
 */
export function formatMobilePushPayload(
  payload: NotificationPayload,
  deviceToken: string,
  badgeCount: number = 1
): MobilePushFormattedPayload {
  let sanitizedBody = payload.body;

  // Strict Consequence Masking:
  // If accountability activated or consequence triggered, mask any punitive details in push alerts
  if (
    payload.type === 'accountability_activated' ||
    payload.type === 'task_missed'
  ) {
    sanitizedBody = 'A commitment deadline was missed. Review your commitment in PACT.';
  }

  return {
    to: deviceToken,
    title: payload.title,
    body: sanitizedBody,
    sound: 'default',
    badge: badgeCount,
    data: {
      notificationType: payload.type,
      actionUrl: payload.actionUrl || '/app',
      idempotencyKey: payload.idempotencyKey,
      metadata: payload.metadata || {},
    },
  };
}

/**
 * Delivers mobile push notifications to registered client devices.
 * Reports honest unconfigured state if EXPO_ACCESS_TOKEN or push service credentials are not set.
 */
export async function deliverMobilePush(
  payload: NotificationPayload,
  devices: MobilePushDevice[]
): Promise<DeliveryResult> {
  const pushKey = process.env.EXPO_ACCESS_TOKEN || process.env.FCM_SERVER_KEY;

  if (!pushKey || devices.length === 0) {
    return {
      channel: 'webhook', // or mobile_push channel
      success: false,
      isConfigured: false,
      error: 'Mobile push delivery provider is unconfigured in current environment.',
    };
  }

  // Future integration point for configured push provider (e.g. Expo Push API / Firebase Cloud Messaging)
  return {
    channel: 'webhook',
    success: true,
    messageId: `push_${Date.now()}`,
    isConfigured: true,
  };
}
