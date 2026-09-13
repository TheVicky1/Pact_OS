'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, Inbox } from 'lucide-react';
import { loadOfflineQueue, persistOfflineQueue } from '@/lib/offline/storage';
import { processQueueSync } from '@/lib/offline/sync-engine';
import { OfflineQueueItem } from '@/lib/offline/queue';
import { createTaskAction } from '@/features/tasks/actions';
import { createTransactionAction } from '@/features/finance/actions';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });
  const [queue, setQueue] = useState<OfflineQueueItem[]>(() => {
    if (typeof window !== 'undefined') {
      return loadOfflineQueue();
    }
    return [];
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const triggerSync = useCallback(async () => {
    const current = loadOfflineQueue();
    const pending = current.filter((item) => item.status === 'pending' || item.status === 'failed');
    if (pending.length === 0) {
      return;
    }

    setIsSyncing(true);
    setSyncFeedback('Syncing offline items...');

    const summary = await processQueueSync(current, async (item) => {
      if (item.type === 'quick_task') {
        const payload = item.payload as { title: string; deadline_at: string; priority?: 'low' | 'medium' | 'high' | 'urgent' };
        const res = await createTaskAction({
          title: payload.title,
          deadline_at: payload.deadline_at,
          priority: payload.priority || 'medium',
        });
        return { success: res.success, error: res.error };
      }

      if (item.type === 'quick_expense') {
        const payload = item.payload as { amount_cents: number; category_id?: string | null; note?: string | null; date_str: string };
        const res = await createTransactionAction({
          amount_cents: payload.amount_cents,
          type: 'expense',
          category_id: payload.category_id || null,
          note: payload.note || null,
          date: payload.date_str,
        });
        return { success: res.success, error: res.error };
      }

      return { success: true };
    });

    // Remove synced items from storage
    const remaining = summary.updatedQueue.filter((item) => item.status !== 'synced');
    persistOfflineQueue(remaining);
    setQueue(remaining);
    setIsSyncing(false);

    if (summary.succeededCount > 0) {
      setSyncFeedback(`Successfully synced ${summary.succeededCount} offline item(s)`);
      setTimeout(() => setSyncFeedback(null), 3000);
    } else if (summary.failedCount > 0) {
      setSyncFeedback(`Failed to sync ${summary.failedCount} item(s). Will retry automatically.`);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  }, []);

  // Listen to network transitions and storage events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        setIsOnline(true);
        triggerSync();
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      const handleStorageChange = () => {
        setQueue(loadOfflineQueue());
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('storage', handleStorageChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('storage', handleStorageChange);
      };
    }
  }, [triggerSync]);

  const pendingCount = queue.filter((i) => i.status === 'pending' || i.status === 'failed').length;

  if (isOnline && pendingCount === 0 && !syncFeedback) {
    return null;
  }

  return (
    <div
      data-testid="pwa-offline-indicator"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 max-w-sm w-full bg-[#121217]/95 border border-[#d4af37]/40 backdrop-blur-xl shadow-2xl rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-zinc-200 animate-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {!isOnline ? (
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <WifiOff className="w-3.5 h-3.5" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center shrink-0 text-[#d4af37]">
            <Inbox className="w-3.5 h-3.5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-zinc-100 truncate">
            {!isOnline ? 'Offline Mode Active' : syncFeedback || 'Syncing Offline Changes'}
          </p>
          <p className="text-[11px] text-zinc-400 truncate">
            {pendingCount > 0
              ? `${pendingCount} item(s) queued for sync`
              : 'App shell cached; ready for offline capture'}
          </p>
        </div>
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          type="button"
          onClick={triggerSync}
          disabled={isSyncing}
          className="px-2.5 py-1.5 rounded-lg bg-[#d4af37] text-[#09090b] font-medium text-xs hover:bg-[#e2c056] transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
        </button>
      )}
    </div>
  );
}
