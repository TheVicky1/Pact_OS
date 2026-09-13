'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Trash2, AlertCircle, CheckCircle2, Inbox, Clock } from 'lucide-react';
import { OfflineQueueItem, dequeueItem } from '@/lib/offline/queue';
import { loadOfflineQueue, persistOfflineQueue } from '@/lib/offline/storage';

export interface OfflineQueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRetrySync: () => void;
}

export function OfflineQueueDrawer({
  isOpen,
  onClose,
  onRetrySync,
}: OfflineQueueDrawerProps) {
  const [items, setItems] = useState<OfflineQueueItem[]>(() => {
    if (typeof window !== 'undefined') {
      return loadOfflineQueue();
    }
    return [];
  });

  useEffect(() => {
    const handleStorage = () => {
      setItems(loadOfflineQueue());
    };
    if (isOpen) {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    const updated = dequeueItem(items, id);
    persistOfflineQueue(updated);
    setItems(updated);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md h-full bg-[#121217] border-l border-white/[0.08] p-6 text-zinc-100 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Inbox className="w-4 h-4" />
            </div>
            <div>
              <h2 id="offline-drawer-title" className="text-base font-bold text-zinc-100">
                Offline Sync Queue
              </h2>
              <p className="text-xs text-zinc-400">
                {items.length} item(s) stored locally on this device
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Items */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-3" />
              <p className="text-sm font-semibold text-zinc-300">All Changes Synced</p>
              <p className="text-xs text-zinc-500 mt-1">
                Your device has zero pending offline items.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const isFailed = item.status === 'failed';
              const taskPayload = item.type === 'quick_task' ? (item.payload as { title: string; priority?: string }) : null;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isFailed
                      ? 'bg-rose-500/5 border-rose-500/30 text-rose-200'
                      : 'bg-[#09090b] border-white/[0.08] text-zinc-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#d4af37]/10 text-[#d4af37]">
                          {item.type.replace('_', ' ')}
                        </span>
                        {taskPayload?.priority && (
                          <span className="text-[10px] text-zinc-400 capitalize">
                            • {taskPayload.priority}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500 ml-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(item.client_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-zinc-100 truncate">
                        {taskPayload?.title || JSON.stringify(item.payload)}
                      </p>
                      {item.last_error && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.last_error}</span>
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Discard offline item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer Actions */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                persistOfflineQueue([]);
                setItems([]);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={onRetrySync}
              className="px-4 py-2 rounded-xl bg-[#d4af37] text-[#09090b] font-semibold text-xs hover:bg-[#e2c056] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Sync Now</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
