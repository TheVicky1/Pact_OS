'use client';

import React, { useState, useTransition } from 'react';
import {
  Sliders,
  Bell,
  Target,
  FolderPlus,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';


export interface StepOperatingPreferencesProps {
  initialDailyTaskTarget?: number;
  initialNotificationPreferences?: {
    dailyPlanReminder: boolean;
    deadlineAlerts: boolean;
    consequenceAlerts: boolean;
    weeklyReviewNotice: boolean;
  };
  initialGoalTitle?: string;
  initialProjectTitle?: string;
  onBack: () => void;
  onNext: (data: {
    dailyTaskTarget: number;
    notificationPreferences: {
      dailyPlanReminder: boolean;
      deadlineAlerts: boolean;
      consequenceAlerts: boolean;
      weeklyReviewNotice: boolean;
    };
    initialGoalTitle?: string;
    initialProjectTitle?: string;
  }) => Promise<void>;
  onSkip?: () => Promise<void>;
}

export function StepOperatingPreferences({
  initialDailyTaskTarget = 5,
  initialNotificationPreferences = {
    dailyPlanReminder: true,
    deadlineAlerts: true,
    consequenceAlerts: true,
    weeklyReviewNotice: true,
  },
  initialGoalTitle = '',
  initialProjectTitle = '',
  onBack,
  onNext,
  onSkip,
}: StepOperatingPreferencesProps) {
  const [dailyTarget, setDailyTarget] = useState(initialDailyTaskTarget);
  const [notifications, setNotifications] = useState({
    dailyPlanReminder: initialNotificationPreferences?.dailyPlanReminder ?? true,
    deadlineAlerts: initialNotificationPreferences?.deadlineAlerts ?? true,
    consequenceAlerts: initialNotificationPreferences?.consequenceAlerts ?? true,
    weeklyReviewNotice: initialNotificationPreferences?.weeklyReviewNotice ?? true,
  });

  const [goalTitle, setGoalTitle] = useState(initialGoalTitle);
  const [projectTitle, setProjectTitle] = useState(initialProjectTitle);

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (dailyTarget < 1 || dailyTarget > 20) {
      setError('Daily task target must be between 1 and 20.');
      return;
    }

    startTransition(async () => {
      try {
        await onNext({
          dailyTaskTarget: dailyTarget,
          notificationPreferences: notifications,
          initialGoalTitle: goalTitle.trim() || undefined,
          initialProjectTitle: projectTitle.trim() || undefined,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to save preferences.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
          <Sliders className="w-5 h-5 text-[#d4af37]" />
          Step 2: Operating Preferences & Cadence
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Configure your daily commitment target and alert sensitivities to tailor your accountability rhythm.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Daily Task Target */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label
                htmlFor="daily-task-target"
                className="text-sm font-semibold text-zinc-100 flex items-center gap-2"
              >
                <Target className="w-4 h-4 text-[#d4af37]" />
                Daily Task Target
              </label>
              <p className="text-xs text-zinc-400">
                How many high-leverage tasks do you plan to complete each day?
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-[#d4af37]/15 text-[#e2c056] font-mono font-bold text-sm border border-[#d4af37]/30">
              {dailyTarget} tasks / day
            </span>
          </div>

          <input
            id="daily-task-target"
            type="range"
            min={1}
            max={15}
            step={1}
            value={dailyTarget}
            onChange={(e) => setDailyTarget(parseInt(e.target.value, 10))}
            className="w-full accent-[#d4af37] cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
            <span>1 task (Light)</span>
            <span>5 tasks (Standard)</span>
            <span>15 tasks (Hyper-focused)</span>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#d4af37]" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Accountability & Alert Sensitivities
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                key: 'dailyPlanReminder' as const,
                title: 'Morning Daily Plan Reminder',
                description: 'Get prompt at start of work day to select commitments.',
              },
              {
                key: 'deadlineAlerts' as const,
                title: 'Approaching Deadline Alerts',
                description: 'Notify when commitments are nearing execution window.',
              },
              {
                key: 'consequenceAlerts' as const,
                title: 'Consequence Activation Alerts',
                description: 'Instant notification when an expired commitment activates.',
              },
              {
                key: 'weeklyReviewNotice' as const,
                title: 'Sunday Weekly Review Digest',
                description: 'Comprehensive weekly performance and accountability digest.',
              },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer"
              >
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-medium text-zinc-200">{item.title}</div>
                  <div className="text-[11px] text-zinc-400">{item.description}</div>
                </div>

                <input
                  type="checkbox"
                  checked={notifications[item.key]}
                  onChange={() => handleToggleNotification(item.key)}
                  className="w-4 h-4 rounded accent-[#d4af37] cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Optional Starter Goal & Project */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-[#d4af37]" />
              Starter Focus Area (Optional)
            </h3>
            <p className="text-xs text-zinc-400">
              Prime your dashboard with an initial objective or milestone. You can modify these anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300">Quarterly Goal</label>
              <input
                type="text"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="e.g. Master Distributed Systems"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.08] text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-300">Active Project</label>
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Build Raft Consensus Node"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.08] text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          {onSkip && (
            <button
              type="button"
              onClick={onSkip}
              disabled={isPending}
              className="px-3.5 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Skip Optional
            </button>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b38f24] hover:from-[#e2c056] hover:to-[#c49e2e] text-zinc-950 font-semibold text-sm shadow-lg shadow-[#d4af37]/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <span>Review & Launch</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
