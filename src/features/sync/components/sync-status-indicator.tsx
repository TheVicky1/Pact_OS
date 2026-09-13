'use client';

/**
 * PACT Phase 13: Multi-Device Sync Status Indicator
 * Header widget showing live multi-device sync status, offline queue counts,
 * and manual sync trigger with latency feedback.
 */

import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { setupNetworkSyncListeners, getOrSetDeviceId, getOrSetDeviceName } from '@/lib/offline/background-sync';
import { replicateDeltasAction } from '@/features/sync/sync-actions';
import { loadOfflineQueue } from '@/lib/offline/storage';

export function SyncStatusIndicator() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [lastSyncText, setLastSyncText] = useState<string>('Just now');
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);

  const checkPending = React.useCallback(() => {
    if (typeof window !== 'undefined') {
      const q = loadOfflineQueue();
      setPendingCount(q.filter((i) => i.status === 'pending' || i.status === 'failed').length);
      setIsOnline(navigator.onLine);
    }
  }, []);

  const triggerSync = React.useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);

    try {
      const deviceId = getOrSetDeviceId();
      const deviceName = getOrSetDeviceName();

      await replicateDeltasAction({
        deviceId,
        deviceName,
        sinceCursor: new Date(lastSyncTime).toISOString(),
        deltas: [],
      });

      setLastSyncTime(Date.now());
      setLastSyncText('Just now');
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
      checkPending();
    }
  }, [isSyncing, lastSyncTime, checkPending]);

  useEffect(() => {
    const cleanup = setupNetworkSyncListeners(() => {
      triggerSync();
    });

    const interval = setInterval(() => {
      checkPending();
      const diffMinutes = Math.floor((Date.now() - lastSyncTime) / 60000);
      if (diffMinutes < 1) {
        setLastSyncText('Just now');
      } else if (diffMinutes === 1) {
        setLastSyncText('1m ago');
      } else {
        setLastSyncText(`${diffMinutes}m ago`);
      }
    }, 15000);

    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [triggerSync, checkPending, lastSyncTime]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={triggerSync}
        disabled={!isOnline || isSyncing}
        title={isOnline ? `Multi-device sync: ${lastSyncText}. Click to sync now.` : 'Offline: changes queued on this device'}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition-all cursor-pointer select-none ${
          !isOnline
            ? 'bg-amber-950/30 text-amber-400 border-amber-800/50'
            : isSyncing
            ? 'bg-sky-950/30 text-sky-400 border-sky-800/50'
            : pendingCount > 0
            ? 'bg-indigo-950/30 text-indigo-300 border-indigo-800/50'
            : 'bg-neutral-900/60 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-300'
        }`}
      >
        {!isOnline ? (
          <>
            <CloudOff className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Offline ({pendingCount})</span>
          </>
        ) : isSyncing ? (
          <>
            <RefreshCw className="w-3 h-3 animate-spin text-sky-400 shrink-0" />
            <span>Syncing...</span>
          </>
        ) : pendingCount > 0 ? (
          <>
            <Cloud className="w-3 h-3 text-indigo-400 shrink-0" />
            <span>{pendingCount} Queued</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Synced</span>
          </>
        )}
      </button>
    </div>
  );
}
