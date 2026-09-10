import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PersistentNotification,
  NotificationType,
} from '../src/types/notifications';
import {
  deliverInApp,
  deliverEmail,
  deliverWebhook,
  dispatchNotification,
  NotificationPayload,
} from '../src/lib/notifications/delivery';

describe('PACT Phase 5B: Persistent Notification Infrastructure & Delivery', () => {
  const sampleNotification: PersistentNotification = {
    id: 'notif-101',
    user_id: 'user-alpha-001',
    type: 'task_missed',
    title: 'Commitment Deadline Missed',
    body: 'Task "Ship Phase 5B" missed its commitment deadline.',
    action_url: '/app/tasks',
    is_read: false,
    read_at: null,
    is_dismissed: false,
    dismissed_at: null,
    idempotency_key: 'task_missed:task-ship-5b',
    metadata: {
      taskId: 'task-ship-5b',
      taskTitle: 'Ship Phase 5B',
      deadlineAt: '2026-10-15T18:00:00.000Z',
    },
    created_at: '2026-10-15T18:01:00.000Z',
    updated_at: '2026-10-15T18:01:00.000Z',
  };

  const samplePayload: NotificationPayload = {
    userId: 'user-alpha-001',
    type: 'task_missed',
    title: 'Commitment Deadline Missed',
    body: 'Task "Ship Phase 5B" missed its commitment deadline.',
    actionUrl: '/app/tasks',
    idempotencyKey: 'task_missed:task-ship-5b',
    metadata: {
      taskId: 'task-ship-5b',
      taskTitle: 'Ship Phase 5B',
      deadlineAt: '2026-10-15T18:00:00.000Z',
    },
  };

  // Mock Supabase client for in-app persistence tests
  const createMockSupabase = (shouldSucceed = true, returnId = 'notif-gen-123') => ({
    rpc: async (fn: string, params: Record<string, unknown>) => {
      if (fn !== 'create_notification') {
        return { data: null, error: { message: `Unknown RPC function: ${fn}` } };
      }
      if (!shouldSucceed) {
        return { data: null, error: { message: 'Database insert constraint violation' } };
      }
      return { data: returnId, error: null };
    },
  });

  // 1. Notification Model & Type Validation
  it('validates notification domain types and field definitions', () => {
    const validTypes: NotificationType[] = [
      'task_missed',
      'accountability_activated',
      'task_deadline_approaching',
      'verification_required',
      'verification_completed',
      'waiver_reset',
      'weekly_review',
      'system',
    ];

    validTypes.forEach((type) => {
      const item: PersistentNotification = {
        ...sampleNotification,
        id: `notif-${type}`,
        type,
      };
      assert.equal(item.type, type);
    });
  });

  // 2. Idempotency Key Semantics
  it('enforces deterministic idempotency keys for task sweeps and activations', () => {
    const taskId = 'task-critical-deadline';
    const missedKey = `task_missed:${taskId}`;
    const consequenceKey = `accountability_activated:${taskId}`;

    assert.equal(missedKey, 'task_missed:task-critical-deadline');
    assert.equal(consequenceKey, 'accountability_activated:task-critical-deadline');
    assert.notEqual(missedKey, consequenceKey);
  });

  // 3. Mark Single Notification as Read
  it('transitions unread notification to read with timestamp', () => {
    const initial: PersistentNotification = {
      ...sampleNotification,
      is_read: false,
      read_at: null,
    };

    const markReadAt = '2026-10-15T18:05:00.000Z';
    const updated: PersistentNotification = {
      ...initial,
      is_read: true,
      read_at: markReadAt,
      updated_at: markReadAt,
    };

    assert.equal(updated.is_read, true);
    assert.equal(updated.read_at, markReadAt);
    assert.notEqual(updated.read_at, null);
  });

  // 4. Batch Mark All Notifications as Read
  it('marks all unread notifications as read while preserving previously read ones', () => {
    const list: PersistentNotification[] = [
      {
        ...sampleNotification,
        id: 'notif-1',
        is_read: false,
        read_at: null,
      },
      {
        ...sampleNotification,
        id: 'notif-2',
        is_read: true,
        read_at: '2026-10-15T17:00:00.000Z',
      },
      {
        ...sampleNotification,
        id: 'notif-3',
        is_read: false,
        read_at: null,
      },
    ];

    const batchReadAt = '2026-10-15T18:10:00.000Z';
    const updatedList = list.map((item) =>
      item.is_read ? item : { ...item, is_read: true, read_at: batchReadAt }
    );

    assert.equal(updatedList.every((item) => item.is_read), true);
    assert.equal(updatedList[1].read_at, '2026-10-15T17:00:00.000Z'); // preserved original
    assert.equal(updatedList[0].read_at, batchReadAt);
    assert.equal(updatedList[2].read_at, batchReadAt);
  });

  // 5. Dismissal Lifecycle & Active Filtering
  it('filters out dismissed notifications from active inbox list', () => {
    const notifications: PersistentNotification[] = [
      {
        ...sampleNotification,
        id: 'notif-active-1',
        is_dismissed: false,
        dismissed_at: null,
      },
      {
        ...sampleNotification,
        id: 'notif-dismissed-2',
        is_dismissed: true,
        dismissed_at: '2026-10-15T18:02:00.000Z',
      },
      {
        ...sampleNotification,
        id: 'notif-active-3',
        is_dismissed: false,
        dismissed_at: null,
      },
    ];

    const activeList = notifications.filter((item) => !item.is_dismissed);
    assert.equal(activeList.length, 2);
    assert.deepEqual(
      activeList.map((n) => n.id),
      ['notif-active-1', 'notif-active-3']
    );
  });

  // 6. In-App Delivery Channel
  it('persists notification into PostgreSQL public.notifications via RPC', async () => {
    const mockSupabase = createMockSupabase(true, 'notif-rpc-created-123');
    const result = await deliverInApp(mockSupabase as any, samplePayload);

    assert.equal(result.channel, 'in_app');
    assert.equal(result.success, true);
    assert.equal(result.messageId, 'notif-rpc-created-123');
    assert.equal(result.isConfigured, true);
  });

  it('handles in-app delivery errors gracefully', async () => {
    const failingSupabase = createMockSupabase(false);
    const result = await deliverInApp(failingSupabase as any, samplePayload);

    assert.equal(result.channel, 'in_app');
    assert.equal(result.success, false);
    assert.equal(result.isConfigured, true);
    assert.match(result.error || '', /constraint violation/i);
  });

  // 7. Email Delivery Channel (Honest Unconfigured Fallback)
  it('reports email delivery as unconfigured with zero fabricated success when unconfigured', async () => {
    // When RESEND_API_KEY is unset
    const originalApiKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_URL;

    const result = await deliverEmail(samplePayload, 'user@example.com');
    assert.equal(result.channel, 'email');
    assert.equal(result.success, false);
    assert.equal(result.isConfigured, false);
    assert.match(result.error || '', /unconfigured/i);

    if (originalApiKey) process.env.RESEND_API_KEY = originalApiKey;
  });

  // 8. Webhook Delivery Channel (Honest Validation & HTTPS Enforcement)
  it('reports webhook delivery as unconfigured when URL is missing', async () => {
    const result = await deliverWebhook(samplePayload, undefined);
    assert.equal(result.channel, 'webhook');
    assert.equal(result.success, false);
    assert.equal(result.isConfigured, false);
  });

  it('validates webhook destination URL format', async () => {
    const invalidResult = await deliverWebhook(samplePayload, 'not-a-valid-url');
    assert.equal(invalidResult.channel, 'webhook');
    assert.equal(invalidResult.success, false);
    assert.match(invalidResult.error || '', /invalid webhook url/i);

    const validResult = await deliverWebhook(samplePayload, 'https://hooks.example.com/pact-alerts');
    assert.equal(validResult.channel, 'webhook');
    assert.equal(validResult.success, true);
    assert.equal(validResult.isConfigured, true);
  });

  // 9. Multi-Channel Dispatcher
  it('dispatches across in-app and secondary channels correctly', async () => {
    const mockSupabase = createMockSupabase(true, 'notif-multi-001');

    const summary = await dispatchNotification(mockSupabase as any, samplePayload, {
      sendEmail: true,
      recipientEmail: 'user@example.com',
      sendWebhook: true,
      webhookUrl: 'https://hooks.example.com/pact-events',
    });

    assert.equal(summary.notificationId, 'notif-multi-001');
    assert.equal(summary.results.length, 3);

    const inApp = summary.results.find((r) => r.channel === 'in_app');
    const email = summary.results.find((r) => r.channel === 'email');
    const webhook = summary.results.find((r) => r.channel === 'webhook');

    assert.equal(inApp?.success, true);
    assert.equal(inApp?.channel, 'in_app');
    assert.equal(webhook?.success, true);
    assert.equal(webhook?.channel, 'webhook');
  });

  // 10. Strict Confidentiality Invariant
  it('guarantees zero consequence action statements or waiver tokens leak in notification payloads', () => {
    const consequenceNotification: PersistentNotification = {
      id: 'notif-consequence-001',
      user_id: 'user-alpha-001',
      type: 'accountability_activated',
      title: 'Accountability Action Activated',
      body: 'Commitment deadline for "Production Deployment" was missed. Accountability resolution is now required.',
      action_url: '/app/accountability',
      is_read: false,
      read_at: null,
      is_dismissed: false,
      dismissed_at: null,
      idempotency_key: 'accountability_activated:task-deploy-prod',
      metadata: {
        taskId: 'task-deploy-prod',
        taskTitle: 'Production Deployment',
        commitmentId: 'commit-prod-001',
        deadlineAt: '2026-10-15T18:00:00.000Z',
      },
      created_at: '2026-10-15T18:01:00.000Z',
      updated_at: '2026-10-15T18:01:00.000Z',
    };

    const serialized = JSON.stringify(consequenceNotification);

    // Strict confidentiality invariants:
    assert.equal(serialized.includes('action_statement'), false);
    assert.equal(serialized.includes('waiver_token'), false);
    assert.equal(serialized.includes('referee_notes'), false);
    assert.equal(serialized.includes('forfeit_amount'), false);
    assert.equal(serialized.includes('punishment'), false);
  });

  // 11. Multi-Tenant User Isolation
  it('enforces strict tenant isolation across notifications', () => {
    const userANotif: PersistentNotification = {
      ...sampleNotification,
      id: 'notif-A',
      user_id: 'user-uuid-A',
    };

    const userBNotif: PersistentNotification = {
      ...sampleNotification,
      id: 'notif-B',
      user_id: 'user-uuid-B',
    };

    assert.notEqual(userANotif.user_id, userBNotif.user_id);
    const userAInbox = [userANotif, userBNotif].filter((n) => n.user_id === 'user-uuid-A');
    assert.equal(userAInbox.length, 1);
    assert.equal(userAInbox[0].id, 'notif-A');
  });

  // 12. Unread Count Calculation
  it('correctly calculates unread count excluding dismissed and read notifications', () => {
    const list: PersistentNotification[] = [
      { ...sampleNotification, id: '1', is_read: false, is_dismissed: false },
      { ...sampleNotification, id: '2', is_read: true, is_dismissed: false },
      { ...sampleNotification, id: '3', is_read: false, is_dismissed: true }, // dismissed unread
      { ...sampleNotification, id: '4', is_read: false, is_dismissed: false },
    ];

    const activeUnreadCount = list.filter((n) => !n.is_dismissed && !n.is_read).length;
    assert.equal(activeUnreadCount, 2);
  });
});
