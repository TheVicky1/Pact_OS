'use client';

import React, { useState, useTransition } from 'react';
import { NotificationPreferences, AlertTone  } from '@/types/domain';
import { updateNotificationPreferencesAction } from '@/features/settings/actions';
import { playNotificationPreview } from '@/lib/focus/sound';
import {
  Bell,
  Calendar,
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sliders,
  Volume2
} from 'lucide-react';

export interface NotificationSettingsCardProps {
  notifications: NotificationPreferences;
  isLoading?: boolean;
}

export function NotificationSettingsCard({
  notifications,
  isLoading = false,
}: NotificationSettingsCardProps) {
  const [dailyPlanReminder, setDailyPlanReminder] = useState(
    notifications.dailyPlanReminder
  );
  const [deadlineAlerts, setDeadlineAlerts] = useState(
    notifications.deadlineAlerts
  );
  const [consequenceAlerts, setConsequenceAlerts] = useState(
    notifications.consequenceAlerts
  );
  const [weeklyReviewNotice, setWeeklyReviewNotice] = useState(
    notifications.weeklyReviewNotice
  );
  const [alertTone , setAlertTone] = useState(
    notifications.alertTone
  );

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateNotificationPreferencesAction({
        dailyPlanReminder,
        deadlineAlerts,
        consequenceAlerts,
        weeklyReviewNotice,
        alertTone,
      });

      if (res.error) {
        setFeedback({
          type: 'error',
          message: res.error,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Notification preferences updated successfully.',
        });
      }
    });
  };

  const notificationOptions = [
    {
      id: 'dailyPlanReminder',
      title: 'Daily Plan Morning Briefing',
      description:
        'A calm morning notification prompting you to review your daily commitment horizon and structured time-blocks.',
      icon: Calendar,
      checked: dailyPlanReminder,
      onChange: setDailyPlanReminder,
    },
    {
      id: 'deadlineAlerts',
      title: 'Commitment Deadline Warnings',
      description:
        'Timely alerts 1 hour and 15 minutes before an authoritative commitment deadline expires.',
      icon: Clock,
      checked: deadlineAlerts,
      onChange: setDeadlineAlerts,
    },
    {
      id: 'consequenceAlerts',
      title: 'Accountability Consequence Alerts',
      description:
        'Immediate high-priority notification when a commitment misses its deadline and enters active verification.',
      icon: ShieldAlert,
      checked: consequenceAlerts,
      onChange: setConsequenceAlerts,
    },
    {
      id: 'weeklyReviewNotice',
      title: 'Weekly Review & Waiver Reset',
      description:
        'Monday morning notification confirming your weekly retrospective is available and your 3/3 waiver quota has reset.',
      icon: Sparkles,
      checked: weeklyReviewNotice,
      onChange: setWeeklyReviewNotice,
    },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8">
      {isLoading ? (
        <div
          role="status"
          aria-label="Loading notification preferences"
          className="space-y-8 animate-pulse"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div className="space-y-3 flex-1">
              <div className="h-6 w-56 rounded-lg bg-zinc-800" />
              <div className="h-4 w-full max-w-lg rounded bg-zinc-800" />
            </div>
            <div className="h-8 w-32 rounded-full bg-zinc-800 self-start" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="min-h-[112px] p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-3/5 max-w-64 rounded bg-zinc-800" />
                    <div className="h-3 w-full max-w-lg rounded bg-zinc-800" />
                    <div className="h-3 w-4/5 max-w-md rounded bg-zinc-800" />
                  </div>
                </div>
                <div className="w-11 h-6 rounded-full bg-zinc-800 shrink-0" />
              </div>
            ))}
          </div>

          <div className="min-h-[164px] p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="h-4 w-24 rounded bg-zinc-800" />
              <div className="h-3 w-full max-w-lg rounded bg-zinc-800" />
              <div className="h-10 w-full max-w-md rounded-xl bg-zinc-800" />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <div className="h-12 w-64 rounded-2xl bg-zinc-800" />
          </div>
        </div>
      ) : (
        <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-[#d4af37]" />
            Notification Preferences
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Calm, factual alerts for deadlines, morning planning, and accountability events.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217] border border-white/[0.06] text-xs text-zinc-300 self-start sm:self-auto">
          <Sliders className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Non-Intrusive</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {feedback && (
          <div
            role="alert"
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <div className="space-y-4">
          {notificationOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <div
                key={opt.id}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.12] transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-[#121217] border border-white/[0.06] text-zinc-300 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-[#d4af37]" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-semibold text-zinc-100 block">
                      {opt.title}
                    </span>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                      {opt.description}
                    </p>
                  </div>
                </div>
                        <label
                  className="relative inline-flex items-center cursor-pointer shrink-0"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      opt.onChange(!opt.checked);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={opt.checked}
                    onChange={(e) => opt.onChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-200 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]" />
                </label>
              </div>
            );
          })}
        </div>
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.12] transition-all">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-[#121217] border border-white/[0.06] text-zinc-300 shrink-0">
              <Volume2 className="w-4 h-4 text-[#d4af37]" />
            </div>

            <div className="flex-1 space-y-1">
              <span className="text-sm font-semibold text-zinc-100 block">
                Alert Tone
              </span>

              <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                Choose the sound used for notification alerts.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <label
                    htmlFor="alert-tone"
                    className="text-xs text-zinc-400 block mb-2"
                  >
                    Notification sound
                  </label>

                  <select
                    id="alert-tone"
                    value={alertTone}
                    onChange={(event) =>
                      setAlertTone(event.target.value as AlertTone)
                    }
                    className="w-full px-4 py-3 rounded-xl bg-[#121217] border border-white/[0.08] text-sm text-zinc-100 focus:outline-none focus:border-[#d4af37]/50 transition-all cursor-pointer"
                  >
                    <option value="chime">Chime</option>
                    <option value="bell">Bell</option>
                    <option value="digital-pulse">Digital Pulse</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => playNotificationPreview(alertTone)}
                  className="px-4 py-3 rounded-xl bg-[#121217] border border-white/[0.08] hover:border-[#d4af37]/40 text-zinc-200 text-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-[#d4af37]" />
                  Preview Tone
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Submit Action */}
        <div className="pt-4 flex justify-end">
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
              <span>Save Notification Preferences</span>
            )}
          </button>
        </div>
      </form>
      </>
     )}
    </div>
  );
}
