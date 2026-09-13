'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { FocusSession, calculateSessionProgress } from '@/lib/focus/timer';
import {
  pauseFocusSessionAction,
  resumeFocusSessionAction,
  completeFocusSessionAction,
  abandonFocusSessionAction,
} from '../actions';
import { focusSound } from '@/lib/focus/sound';
import {
  ScreenWakeLockSentinel,
  requestScreenWakeLock,
  releaseScreenWakeLock,
  requestTimerNotificationPermission,
  sendTimerCompletionNotification,
} from '@/lib/focus/live-activity';
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Volume2,
  VolumeX,
  Target,
  Loader2,
  AlertCircle,
  Sun,
  SunDim,
} from 'lucide-react';

export interface FocusTimerDisplayProps {
  session: FocusSession;
  onSessionUpdated: () => void;
}

function subscribeClock(callback: () => void) {
  const timer = setInterval(callback, 500);
  return () => clearInterval(timer);
}

function getClockSnapshot(): number {
  return Math.floor(Date.now() / 500);
}

function getServerClockSnapshot(): number {
  return 0;
}

export function FocusTimerDisplay({ session, onSessionUpdated }: FocusTimerDisplayProps) {
  const clockTick = useSyncExternalStore(subscribeClock, getClockSnapshot, getServerClockSnapshot);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [wakeLockSentinel, setWakeLockSentinel] = useState<ScreenWakeLockSentinel | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const hasTriggeredCompletionRef = useRef(false);

  const effectiveEpoch = clockTick > 0 ? clockTick * 500 : Date.parse(session.started_at);
  const progress = calculateSessionProgress(session, effectiveEpoch);

  // Handle natural countdown completion
  useEffect(() => {
    if (
      session.status === 'active' &&
      session.mode === 'countdown' &&
      progress.isExpired &&
      !hasTriggeredCompletionRef.current
    ) {
      hasTriggeredCompletionRef.current = true;
      focusSound.playCompletionChime();
      sendTimerCompletionNotification(session.tasks?.title);

      completeFocusSessionAction({
        sessionId: session.id,
        reason: 'timer_expired',
      }).then((res) => {
        if (res.success) {
          onSessionUpdated();
        }
      });
    }
  }, [session, progress.isExpired, onSessionUpdated]);

  // Request notifications permission on active session mount
  useEffect(() => {
    if (session.status === 'active') {
      requestTimerNotificationPermission();
    }
  }, [session.status]);

  // Auto-acquire wake lock if active and requested
  const toggleWakeLock = async () => {
    if (isWakeLockActive) {
      await releaseScreenWakeLock(wakeLockSentinel);
      setWakeLockSentinel(null);
      setIsWakeLockActive(false);
    } else {
      const sentinel = await requestScreenWakeLock();
      if (sentinel) {
        setWakeLockSentinel(sentinel);
        setIsWakeLockActive(true);
      }
    }
  };

  // Clean up wake lock on unmount or session completion
  useEffect(() => {
    return () => {
      if (wakeLockSentinel) {
        releaseScreenWakeLock(wakeLockSentinel);
      }
    };
  }, [wakeLockSentinel]);

  const handlePause = async () => {
    setIsLoadingAction(true);
    setActionError(null);
    focusSound.playPauseChime();
    const res = await pauseFocusSessionAction({ sessionId: session.id });
    setIsLoadingAction(false);
    if (res.success) {
      onSessionUpdated();
    } else {
      setActionError(res.error || 'Failed to pause session.');
    }
  };

  const handleResume = async () => {
    setIsLoadingAction(true);
    setActionError(null);
    focusSound.playStartChime();
    const res = await resumeFocusSessionAction({ sessionId: session.id });
    setIsLoadingAction(false);
    if (res.success) {
      onSessionUpdated();
    } else {
      setActionError(res.error || 'Failed to resume session.');
    }
  };

  const handleManualComplete = async () => {
    setIsLoadingAction(true);
    setActionError(null);
    focusSound.playCompletionChime();
    sendTimerCompletionNotification(session.tasks?.title);
    const res = await completeFocusSessionAction({
      sessionId: session.id,
      reason: 'manual_complete',
    });
    setIsLoadingAction(false);
    if (res.success) {
      onSessionUpdated();
    } else {
      setActionError(res.error || 'Failed to complete session.');
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('Are you sure you want to abandon this focus session?')) {
      return;
    }
    setIsLoadingAction(true);
    setActionError(null);
    const res = await abandonFocusSessionAction({ sessionId: session.id });
    setIsLoadingAction(false);
    if (res.success) {
      onSessionUpdated();
    } else {
      setActionError(res.error || 'Failed to abandon session.');
    }
  };

  const toggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    focusSound.setEnabled(next);
  };

  const isPaused = session.status === 'paused';

  return (
    <div className="w-full bg-gradient-to-b from-[#121217] to-[#09090b] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
      {/* Subtle Background Radial Ambient Glow */}
      <div className="absolute inset-0 bg-radial from-[#d4af37]/10 via-transparent to-transparent pointer-events-none" />

      {/* Top Bar: Mode Badge, Screen Wake Lock & Sound Toggle */}
      <div className="w-full flex items-center justify-between z-10 mb-6 gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${
              isPaused
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPaused ? 'bg-amber-400' : 'bg-[#d4af37] animate-ping'
              }`}
            />
            {isPaused ? 'Session Paused' : session.mode === 'stopwatch' ? 'Stopwatch Focus' : 'Deep Work Focus'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Wake Lock Keep Screen On Toggle */}
          <button
            type="button"
            onClick={toggleWakeLock}
            className={`p-2 rounded-xl border transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
              isWakeLockActive
                ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#d4af37]'
                : 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.08] text-zinc-400 hover:text-zinc-200'
            }`}
            title={isWakeLockActive ? 'Screen will stay awake' : 'Enable Keep Screen Awake'}
            aria-label={isWakeLockActive ? 'Disable Keep Screen Awake' : 'Enable Keep Screen Awake'}
          >
            {isWakeLockActive ? <Sun className="w-4 h-4 text-[#d4af37]" /> : <SunDim className="w-4 h-4" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label={isSoundEnabled ? 'Mute audio chimes' : 'Enable audio chimes'}
          >
            {isSoundEnabled ? <Volume2 className="w-4 h-4 text-[#d4af37]" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Active Task Linkage Context */}
      {session.tasks && (
        <div className="z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-white/[0.1] text-xs sm:text-sm text-zinc-300 mb-8 max-w-full truncate shadow-sm">
          <Target className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span className="text-zinc-500 font-medium">Task:</span>
          <span className="font-semibold text-zinc-100 truncate">{session.tasks.title}</span>
        </div>
      )}

      {/* Main Timer Display */}
      <div className="z-10 my-4 sm:my-8 flex flex-col items-center">
        <div
          role="timer"
          aria-live="polite"
          aria-label={`Time remaining: ${progress.displayTime}`}
          className={`text-6xl sm:text-8xl md:text-9xl font-mono font-bold tracking-tight select-none transition-colors ${
            isPaused
              ? 'text-zinc-500'
              : 'text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400'
          }`}
        >
          {progress.displayTime}
        </div>

        {/* Linear Progress Bar for Countdowns */}
        {session.mode === 'countdown' && (
          <div className="w-64 sm:w-80 h-2 bg-zinc-800/80 rounded-full overflow-hidden mt-6 border border-white/[0.06]">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isPaused
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-[#d4af37] to-[#e2c056] shadow-sm shadow-[#d4af37]/50'
              }`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        )}
      </div>

      {/* Action Error Banner */}
      {actionError && (
        <div className="z-10 mt-4 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Control Buttons with mobile >= 44px touch targets */}
      <div className="z-10 mt-8 flex items-center gap-3 sm:gap-4 flex-wrap justify-center w-full max-w-md">
        {/* Pause / Resume Button */}
        {isPaused ? (
          <button
            type="button"
            disabled={isLoadingAction}
            onClick={handleResume}
            className="flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b39226] text-black font-semibold text-sm shadow-lg shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Resume Focus</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isLoadingAction}
            onClick={handlePause}
            className="flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium text-sm border border-white/[0.1] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoadingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4 fill-current" />}
            <span>Pause</span>
          </button>
        )}

        {/* Complete Session Button */}
        <button
          type="button"
          disabled={isLoadingAction}
          onClick={handleManualComplete}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-sm font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Complete</span>
        </button>

        {/* Abandon Session Button */}
        <button
          type="button"
          disabled={isLoadingAction}
          onClick={handleAbandon}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 text-sm font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          <span>Abandon</span>
        </button>
      </div>
    </div>
  );
}

