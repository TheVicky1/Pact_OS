'use client';

import React, { useState } from 'react';
import { X, Plus, CheckCircle2, Zap, Calendar } from 'lucide-react';
import { createOfflineQueueItem, enqueueItem, QuickTaskPayload } from '@/lib/offline/queue';
import { loadOfflineQueue, persistOfflineQueue } from '@/lib/offline/storage';

export interface OfflineQuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaptured?: () => void;
  defaultTimezone?: string;
}

export function OfflineQuickCaptureModal({
  isOpen,
  onClose,
  onCaptured,
}: OfflineQuickCaptureModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [deadlineDays, setDeadlineDays] = useState<number>(0); // 0 = today, 1 = tomorrow, 7 = next week
  const [description, setDescription] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Calculate deadline timestamp
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + deadlineDays);
    targetDate.setHours(23, 59, 59, 999);
    const deadlineIso = targetDate.toISOString();

    const payload: QuickTaskPayload = {
      title: title.trim(),
      deadline_at: deadlineIso,
      priority,
      description: description.trim() || null,
    };

    const newItem = createOfflineQueueItem('quick_task', payload);
    const currentQueue = loadOfflineQueue();
    const updated = enqueueItem(currentQueue, newItem);
    persistOfflineQueue(updated);

    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setTitle('');
      setDescription('');
      onCaptured?.();
      onClose();
    }, 800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-capture-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-[#121217] border border-[#d4af37]/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-zinc-100 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 id="quick-capture-title" className="text-lg font-bold text-zinc-100">
                Quick Capture
              </h2>
              <p className="text-xs text-zinc-400">
                Instant task capture with zero latency & offline persistence.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="quick-capture-input" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Task or Commitment Title *
            </label>
            <input
              id="quick-capture-input"
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Ship Phase 8 mobile companion verification..."
              className="w-full px-4 py-3 bg-[#09090b] border border-white/[0.1] focus:border-[#d4af37] rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Quick Schedule Options */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Target Deadline
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDeadlineDays(0)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                  deadlineDays === 0
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37] font-semibold'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Today</span>
              </button>
              <button
                type="button"
                onClick={() => setDeadlineDays(1)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                  deadlineDays === 1
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37] font-semibold'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Tomorrow</span>
              </button>
              <button
                type="button"
                onClick={() => setDeadlineDays(7)}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                  deadlineDays === 7
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37] font-semibold'
                    : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Next Week</span>
              </button>
            </div>
          </div>

          {/* Priority Options */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium capitalize border transition-all ${
                    priority === p
                      ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37] font-semibold'
                      : 'bg-[#09090b] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label htmlFor="quick-capture-desc" className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              id="quick-capture-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key context or constraints..."
              className="w-full px-4 py-2.5 bg-[#09090b] border border-white/[0.1] focus:border-[#d4af37] rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaved || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#d4af37] text-[#09090b] font-semibold text-xs hover:bg-[#e2c056] transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-950" />
                  <span>Captured!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Save Commitment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
