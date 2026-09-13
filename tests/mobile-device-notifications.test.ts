import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerDeviceTokenSchema,
  unregisterDeviceTokenSchema,
} from '../src/lib/validations/device';
import {
  formatMobilePushPayload,
  deliverMobilePush,
} from '../src/lib/notifications/mobile-push';
import { NotificationPayload } from '../src/lib/notifications/delivery';

describe('Phase 8: Mobile Device Tokens & Push Notifications', () => {
  it('validates device token registration payloads', () => {
    const validIos = registerDeviceTokenSchema.safeParse({
      platform: 'ios',
      token: 'apns-device-token-1234567890abcdef',
      device_name: "User's iPhone 15 Pro",
      app_version: '0.1.0',
    });
    assert.equal(validIos.success, true);

    const validAndroid = registerDeviceTokenSchema.safeParse({
      platform: 'android',
      token: 'fcm-registration-token-abcdef123456',
    });
    assert.equal(validAndroid.success, true);

    const invalidPlatform = registerDeviceTokenSchema.safeParse({
      platform: 'blackberry',
      token: 'some-token',
    });
    assert.equal(invalidPlatform.success, false);

    const emptyToken = registerDeviceTokenSchema.safeParse({
      platform: 'ios',
      token: '   ',
    });
    assert.equal(emptyToken.success, false);
  });

  it('strictly enforces consequence masking in mobile push alerts', () => {
    // Punitive consequence notification
    const punitivePayload: NotificationPayload = {
      userId: 'u1000000-0000-4000-a000-000000000001',
      type: 'accountability_activated',
      title: 'Consequence Triggered',
      body: 'You failed your daily run commitment. Forfeiting $50 pledge to charity.',
    };

    const pushPayload = formatMobilePushPayload(
      punitivePayload,
      'device-token-xyz',
      3
    );

    assert.equal(pushPayload.to, 'device-token-xyz');
    assert.equal(pushPayload.title, 'Consequence Triggered');
    assert.equal(pushPayload.badge, 3);

    // Consequence Privacy Invariant: Must NOT contain dollar amounts or punitive statements in push alert
    assert.ok(!pushPayload.body.includes('$50'), 'Push alert must never leak dollar consequence amounts');
    assert.ok(!pushPayload.body.includes('Forfeiting'), 'Push alert must never leak punishment terms');
    assert.equal(
      pushPayload.body,
      'A commitment deadline was missed. Review your commitment in PACT.'
    );
  });

  it('formats non-punitive notifications with standard body', () => {
    const standardPayload: NotificationPayload = {
      userId: 'u1000000-0000-4000-a000-000000000001',
      type: 'weekly_review',
      title: 'Sunday Ritual Available',
      body: 'Time to conduct your weekly review and plan the upcoming week.',
    };

    const pushPayload = formatMobilePushPayload(
      standardPayload,
      'device-token-abc',
      1
    );

    assert.equal(pushPayload.title, 'Sunday Ritual Available');
    assert.equal(
      pushPayload.body,
      'Time to conduct your weekly review and plan the upcoming week.'
    );
  });

  it('reports honest unconfigured state when push provider environment keys are absent', async () => {
    const payload: NotificationPayload = {
      userId: 'u1000000-0000-4000-a000-000000000001',
      type: 'system',
      title: 'System Notification',
      body: 'Test push notification',
    };

    const result = await deliverMobilePush(payload, []);
    assert.equal(result.success, false);
    assert.equal(result.isConfigured, false);
    assert.ok(result.error?.includes('unconfigured'));
  });
});
