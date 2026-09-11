'use client';

import React, { useState } from 'react';
import { FocusMode } from '@/lib/focus/timer';
import { startFocusSessionAction } from '../actions';
import { focusSound } from '@/lib/focus/sound';
import {
  Timer,
  Play,
  Target,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export interface TaskOption {
  id: string;
  title: string;
  priority: string;
}

export interface FocusSetupCardProps {
  availableTasks: TaskOption[];
  onSessionStarted: () => void;
  preselectedTaskId?: string | null;
}

const PRESET_DURATIONS = [
  { label: '15 min', seconds: 900, desc: 'Quick Sprint' },
  { label: '25 min', seconds: 1500, desc: 'Pomodoro' },
  { label: '45 min', seconds: 2700, desc: 'Deep Block' },
  { label: '60 min', seconds: 3600, desc: 'Flow State' },
];

export function FocusSetupCard({
  availableTasks,
  onSessionStarted,
  preselectedTaskId,
}: FocusSetupCardProps) {
  const [mode, setMode] = useState<FocusMode>('countdown');
  const [selectedDurationSeconds, setSelectedDurationSeconds] = useState<number>(1500);
  const [customMinutes, setCustomMinutes] = useState<string>('30');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(preselectedTaskId || '');
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStart = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    let duration = selectedDurationSeconds;
    if (mode === 'countdown' && isCustom) {
      const parsed = parseInt(customMinutes, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 480) {
        setErrorMsg('Custom duration must be between 1 and 480 minutes.');
        setIsLoading(false);
        return;
      }
      duration = parsed * 60;
    }

    focusSound.playStartChime();

    const res = await startFocusSessionAction({
      mode,
      plannedDurationSeconds: mode === 'countdown' ? duration : 0,
      taskId: selectedTaskId || null,
      notes: notes.trim() || null,
    });

    setIsLoading(false);

    if (res.success) {
      onSessionStarted();
    } else {
      setErrorMsg(res.error || 'Failed to start session.');
    }
  };

  return (
    <div className="w-full bg-[#121217]/80 border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-2xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30 shadow-sm">
          <Timer className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-zinc-100">Initialize Focus Session</h2>
          <p className="text-xs text-zinc-400">Configure your target deep work interval</p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Session Mode
        </label>
        <div className="grid grid-cols-2 gap-3 p-1 rounded-2xl bg-zinc-900/60 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setMode('countdown');
              setIsCustom(false);
            }}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              mode === 'countdown'
                ? 'bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/40 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Timed Countdown
          </button>
          <button
            type="button"
            onClick={() => setMode('stopwatch')}
            className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              mode === 'stopwatch'
                ? 'bg-[#d4af37]/20 text-[#e2c056] border border-[#d4af37]/40 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Open Stopwatch
          </button>
        </div>
      </div>

      {/* Countdown Presets */}
      {mode === 'countdown' && (
        <div className="mb-6">
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Target Duration
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {PRESET_DURATIONS.map((preset) => {
              const isSelected = !isCustom && selectedDurationSeconds === preset.seconds;
              return (
                <button
                  key={preset.seconds}
                  type="button"
                  onClick={() => {
                    setSelectedDurationSeconds(preset.seconds);
                    setIsCustom(false);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#121217] border-[#d4af37] text-zinc-100 shadow-md ring-1 ring-[#d4af37]/30'
                      : 'bg-zinc-900/40 border-white/[0.06] text-zinc-400 hover:border-white/[0.12] hover:text-zinc-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-zinc-100">{preset.label}</p>
                  <p className="text-[11px] text-zinc-500">{preset.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Custom Duration Option */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isCustom
                  ? 'bg-[#d4af37]/20 text-[#e2c056] border-[#d4af37]/40'
                  : 'bg-zinc-900/40 text-zinc-400 border-white/[0.06] hover:text-zinc-200'
              }`}
            >
              Custom Minutes:
            </button>
            {isCustom && (
              <input
                type="number"
                min="1"
                max="480"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="w-24 px-3 py-1.5 bg-zinc-900 border border-white/[0.1] rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-[#d4af37]"
                placeholder="Minutes"
              />
            )}
          </div>
        </div>
      )}

      {/* Task Attachment Selector */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Associated Task (Optional)
        </label>
        <div className="relative">
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-900/80 border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-zinc-200 focus:outline-none focus:border-[#d4af37] appearance-none cursor-pointer"
          >
            <option value="">No task linked (Independent Focus)</option>
            {availableTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.priority.toUpperCase()})
              </option>
            ))}
          </select>
          <Target className="w-4 h-4 text-zinc-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Session Notes */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Session Goal / Intent
        </label>
        <div className="relative">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Write 500 words of design document, solve graph problem..."
            className="w-full px-4 py-3 bg-zinc-900/80 border border-white/[0.08] rounded-2xl text-xs sm:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
          />
          <FileText className="w-4 h-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Start Button */}
      <button
        type="button"
        disabled={isLoading}
        onClick={handleStart}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#e2c056] to-[#b39226] text-black font-semibold text-sm sm:text-base shadow-lg shadow-[#d4af37]/25 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Begin Focus Session</span>
          </>
        )}
      </button>
    </div>
  );
}
