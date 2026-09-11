'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { POPULAR_TIMEZONES, formatTimezoneLiveTime } from '@/lib/timezones-data';
import { isValidIanaTimezone } from '@/lib/time';
import {
  User,
  Globe,
  Clock,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Briefcase,
} from 'lucide-react';

export interface StepIdentityProps {
  initialFullName: string;
  initialTimezone: string;
  initialWorkStartTime?: string;
  initialWorkEndTime?: string;
  onNext: (data: {
    fullName: string;
    timezone: string;
    workStartTime: string;
    workEndTime: string;
  }) => Promise<void>;
}

export function StepIdentity({
  initialFullName,
  initialTimezone,
  initialWorkStartTime = '09:00',
  initialWorkEndTime = '18:00',
  onNext,
}: StepIdentityProps) {
  // Auto-detect browser timezone if initial is empty or UTC
  const detectedTz =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';

  const [fullName, setFullName] = useState(initialFullName || '');
  const [timezone, setTimezone] = useState(
    initialTimezone && isValidIanaTimezone(initialTimezone)
      ? initialTimezone
      : detectedTz && isValidIanaTimezone(detectedTz)
      ? detectedTz
      : 'UTC'
  );
  const [workStartTime, setWorkStartTime] = useState(initialWorkStartTime);
  const [workEndTime, setWorkEndTime] = useState(initialWorkEndTime);

  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchingTz, setIsSearchingTz] = useState(false);
  const [liveClock, setLiveClock] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Update live clock preview every second
  useEffect(() => {
    const update = () => {
      if (isValidIanaTimezone(timezone)) {
        setLiveClock(formatTimezoneLiveTime(timezone));
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  const filteredTimezones = POPULAR_TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tz.value.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tz.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tz.region.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Display name must be at least 2 characters long.');
      return;
    }

    if (!isValidIanaTimezone(timezone)) {
      setError('Please select a valid IANA timezone identifier.');
      return;
    }

    startTransition(async () => {
      try {
        await onNext({
          fullName: fullName.trim(),
          timezone: timezone.trim(),
          workStartTime,
          workEndTime,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to save step.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2.5">
          <User className="w-5 h-5 text-[#d4af37]" />
          Step 1: Identity & Time Horizon
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Set your display name and authoritative IANA timezone for precise task deadlines, daily planning, and accountability horizon.
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

      <div className="space-y-5">
        {/* Full Name Field */}
        <div className="space-y-2">
          <label
            htmlFor="onboarding-fullName"
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
          >
            Your Name / Display Handle <span className="text-[#e2c056]">*</span>
          </label>
          <input
            id="onboarding-fullName"
            type="text"
            required
            autoFocus
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] placeholder:text-zinc-500 transition-all"
            placeholder="e.g. Alex Mercer"
          />
        </div>

        {/* Timezone Configuration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="onboarding-timezone"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Authoritative Timezone <span className="text-[#e2c056]">*</span>
            </label>
            <span className="text-xs text-[#e2c056] font-medium flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3" />
              {liveClock}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-100">
                    {timezone}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Current local wall-clock time
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSearchingTz(!isSearchingTz)}
                className="text-xs text-zinc-300 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Search className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{isSearchingTz ? 'Done Selecting' : 'Change Timezone'}</span>
              </button>
            </div>

            {isSearchingTz && (
              <div className="pt-3 border-t border-white/[0.06] space-y-3 animate-in fade-in duration-150">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by city, region or country (e.g. Kolkata, New York, London)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-white/[0.1] text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl bg-zinc-950/60 border border-white/[0.06] divide-y divide-white/[0.04]">
                  {filteredTimezones.map((tz) => {
                    const isSelected = timezone === tz.value;
                    return (
                      <button
                        key={tz.value}
                        type="button"
                        onClick={() => {
                          setTimezone(tz.value);
                          setIsSearchingTz(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between text-xs sm:text-sm cursor-pointer ${
                          isSelected
                            ? 'bg-[#d4af37]/15 text-[#e2c056] font-semibold'
                            : 'text-zinc-300 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div>
                          <span className="font-medium">{tz.label}</span>
                          <span className="block text-[11px] text-zinc-400">
                            {tz.city} · {tz.region}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Working Hours Range */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-[#d4af37]" />
            Typical Working Horizon (Daily Timeline)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">Start Time</span>
              <input
                type="time"
                value={workStartTime}
                onChange={(e) => setWorkStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] text-zinc-400">End Time</span>
              <input
                type="time"
                value={workEndTime}
                onChange={(e) => setWorkEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b38f24] hover:from-[#e2c056] hover:to-[#c49e2e] text-zinc-950 font-semibold text-sm shadow-lg shadow-[#d4af37]/20 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Step 1...</span>
            </>
          ) : (
            <>
              <span>Continue to Operating Model</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
