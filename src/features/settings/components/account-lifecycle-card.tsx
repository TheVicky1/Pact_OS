'use client';

/**
 * PACT Phase 12: Account Lifecycle, Storage Management & Danger Zone
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Trash2,
  HardDrive,
  RefreshCcw,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { purgeAccountDataAction } from '../actions';

export function AccountLifecycleCard() {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleClearLocalCache = async () => {
    setIsClearingCache(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pact_offline_queue_v1');
        localStorage.removeItem('pact_local_cache_v1');
        if ('indexedDB' in window) {
          try {
            window.indexedDB.deleteDatabase('pact_local_store');
          } catch {
            // ignore if not present
          }
        }
      }
      setFeedback({ type: 'success', message: 'Local-first offline cache and queue successfully purged.' });
    } catch {
      setFeedback({ type: 'error', message: 'Failed to clear local client storage.' });
    } finally {
      setIsClearingCache(false);
    }
  };

  const handlePurgeAccount = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT AND ALL DATA') {
      setFeedback({ type: 'error', message: 'Confirmation phrase does not match.' });
      return;
    }

    setIsPurging(true);
    setFeedback(null);

    const res = await purgeAccountDataAction(confirmText);
    setIsPurging(false);

    if (!res.success) {
      setFeedback({ type: 'error', message: res.error || 'Account purge failed.' });
    } else {
      setFeedback({ type: 'success', message: 'Account and all data successfully deleted.' });
      router.push('/');
    }
  };

  return (
    <div className="space-y-6 select-none font-sans">
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {feedback.message}
        </div>
      )}

      {/* Storage & Local Cache Management */}
      <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Local-First Storage & Cache Quota</h3>
            <p className="text-xs text-neutral-400">
              Manage client-side offline queues and cached IndexedDB state stored in this browser.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs text-neutral-400">
            Storage Engine: <span className="font-mono text-neutral-200">IndexedDB + localStorage LWW</span>
          </div>
          <button
            onClick={handleClearLocalCache}
            disabled={isClearingCache}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer"
          >
            {isClearingCache ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
            Purge Client Offline Cache
          </button>
        </div>
      </div>

      {/* Danger Zone: Hard Purge */}
      <div className="bg-rose-950/10 border border-rose-500/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-rose-400">Danger Zone: Account Purge</h3>
            <p className="text-xs text-neutral-400">
              Permanently delete all your tasks, goals, habits, financial ledgers, and accountability records.
            </p>
          </div>
        </div>

        <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-3">
          <p className="text-xs text-neutral-300">
            To confirm irreversible deletion, type <span className="font-mono font-bold text-rose-400 select-text">DELETE MY ACCOUNT AND ALL DATA</span> below:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type confirmation phrase..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-rose-500/50"
          />
          <div className="flex justify-end pt-1">
            <button
              onClick={handlePurgeAccount}
              disabled={confirmText !== 'DELETE MY ACCOUNT AND ALL DATA' || isPurging}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              {isPurging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Permanently Purge Everything
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
