/**
 * PACT Phase 11: Multi-Channel Durable Notification Dispatcher & Queue Engine
 *
 * Implements priority queuing, retry management with exponential backoff & jitter,
 * dead-letter tracking, and zero consequence leakage across all notification channels.
 */

import { NotificationPayload, DeliveryResult } from './delivery';
import { logger } from '../observability/logger';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface QueuedNotification {
  id: string;
  payload: NotificationPayload;
  priority: NotificationPriority;
  channels: Array<'in_app' | 'email' | 'webhook' | 'mobile_push'>;
  options?: {
    recipientEmail?: string;
    webhookUrl?: string;
    deviceTokens?: string[];
  };
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: number; // Unix ms
  status: 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'FAILED' | 'DEAD_LETTER';
  lastError?: string;
  createdAt: number;
}

export interface DeadLetterRecord {
  notificationId: string;
  userId: string;
  type: string;
  priority: NotificationPriority;
  failedChannels: string[];
  attempts: number;
  finalError: string;
  failedAt: string;
}

class NotificationQueueDispatcher {
  private queue: Map<string, QueuedNotification> = new Map();
  private deadLetters: DeadLetterRecord[] = [];
  private maxDeadLetters = 1000;

  /**
   * Enqueues a notification for durable asynchronous delivery.
   */
  public enqueue(
    payload: NotificationPayload,
    priority: NotificationPriority = 'NORMAL',
    channels: Array<'in_app' | 'email' | 'webhook' | 'mobile_push'> = ['in_app'],
    options?: QueuedNotification['options']
  ): string {
    const id = `notif_q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const maxAttempts = priority === 'CRITICAL' ? 5 : priority === 'HIGH' ? 4 : 3;

    const queuedItem: QueuedNotification = {
      id,
      payload,
      priority,
      channels,
      options,
      attempts: 0,
      maxAttempts,
      nextAttemptAt: Date.now(),
      status: 'PENDING',
      createdAt: Date.now(),
    };

    this.queue.set(id, queuedItem);
    logger.info(`Enqueued notification [${id}] with priority ${priority}`, {
      userId: payload.userId,
      type: payload.type,
      priority,
    });

    return id;
  }

  /**
   * Processes all ready pending items in the queue.
   */
  public async processBatch(
    deliveryFn: (item: QueuedNotification) => Promise<DeliveryResult[]>
  ): Promise<{ processed: number; delivered: number; failed: number; deadLettered: number }> {
    const now = Date.now();
    let processed = 0;
    let delivered = 0;
    let failed = 0;
    let deadLettered = 0;

    // Sort by priority (CRITICAL > HIGH > NORMAL > LOW) then creation time
    const priorityWeights: Record<NotificationPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      NORMAL: 2,
      LOW: 1,
    };

    const readyItems = Array.from(this.queue.values())
      .filter((item) => item.status === 'PENDING' && now >= item.nextAttemptAt)
      .sort((a, b) => {
        const weightDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
        if (weightDiff !== 0) return weightDiff;
        return a.createdAt - b.createdAt;
      });

    for (const item of readyItems) {
      processed++;
      item.status = 'PROCESSING';
      item.attempts += 1;

      try {
        const results = await deliveryFn(item);
        const allSuccessful = results.every((r) => r.success);

        if (allSuccessful) {
          item.status = 'DELIVERED';
          delivered++;
          this.queue.delete(item.id);
        } else {
          const failureErrors = results
            .filter((r) => !r.success)
            .map((r) => `${r.channel}: ${r.error || 'unknown failure'}`)
            .join('; ');

          item.lastError = failureErrors;

          if (item.attempts >= item.maxAttempts) {
            item.status = 'DEAD_LETTER';
            deadLettered++;
            this.moveToDeadLetter(item, failureErrors);
            this.queue.delete(item.id);
          } else {
            item.status = 'PENDING';
            // Exponential backoff: 2^attempts * 1000ms + jitter
            const backoffMs = Math.pow(2, item.attempts) * 1000 + Math.floor(Math.random() * 500);
            item.nextAttemptAt = Date.now() + backoffMs;
            failed++;
          }
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown exception during delivery';
        item.lastError = errMsg;

        if (item.attempts >= item.maxAttempts) {
          item.status = 'DEAD_LETTER';
          deadLettered++;
          this.moveToDeadLetter(item, errMsg);
          this.queue.delete(item.id);
        } else {
          item.status = 'PENDING';
          const backoffMs = Math.pow(2, item.attempts) * 1000 + Math.floor(Math.random() * 500);
          item.nextAttemptAt = Date.now() + backoffMs;
          failed++;
        }
      }
    }

    return { processed, delivered, failed, deadLettered };
  }

  /**
   * Moves failed notification into dead letter storage.
   */
  private moveToDeadLetter(item: QueuedNotification, finalError: string): void {
    const record: DeadLetterRecord = {
      notificationId: item.id,
      userId: item.payload.userId,
      type: item.payload.type,
      priority: item.priority,
      failedChannels: item.channels,
      attempts: item.attempts,
      finalError,
      failedAt: new Date().toISOString(),
    };

    this.deadLetters.unshift(record);
    if (this.deadLetters.length > this.maxDeadLetters) {
      this.deadLetters.pop();
    }

    logger.error(`Notification moved to dead-letter queue [${item.id}]`, new Error(finalError), {
      userId: item.payload.userId,
      priority: item.priority,
    });
  }

  public getQueueStats(): { pending: number; deadLetters: number } {
    return {
      pending: this.queue.size,
      deadLetters: this.deadLetters.length,
    };
  }

  public getDeadLetters(): DeadLetterRecord[] {
    return [...this.deadLetters];
  }

  public clear(): void {
    this.queue.clear();
    this.deadLetters = [];
  }
}

export const notificationDispatcher = new NotificationQueueDispatcher();
