'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { UserProfileSettings } from '@/types/domain';
import { updateProfileAction } from '@/features/settings/actions';
import { POPULAR_TIMEZONES, formatTimezoneLiveTime } from '@/lib/timezones-data';
import { isValidIanaTimezone } from '@/lib/time';
import {
  User,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export interface ProfileSettingsCardProps {
  profile: UserProfileSettings;
}

export function ProfileSettingsCard({ profile }: ProfileSettingsCardProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSearchingTz, setIsSearchingTz] = useState(false);
  const [liveClock, setLiveClock] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

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

  const userInitial = fullName?.trim().charAt(0).toUpperCase() || 'U';

  const filteredTimezones = POPULAR_TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tz.value.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tz.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      tz.region.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFeedback({
        type: 'error',
        message: 'Full name must be at least 2 characters long.',
      });
      return;
    }

    if (!isValidIanaTimezone(timezone)) {
      setFeedback({
        type: 'error',
        message:
          'Invalid IANA timezone identifier. Please select a valid timezone.',
      });
      return;
    }

    startTransition(async () => {
      const res = await updateProfileAction({
        fullName: fullName.trim(),
        timezone: timezone.trim(),
      });

      if (res.error) {
        setFeedback({
          type: 'error',
          message: res.error,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Profile and timezone successfully updated.',
        });
      }
    });
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
            <User className="w-5 h-5 text-[#d4af37]" />
            Profile & Timezone
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your personal identity and authoritative temporal configuration.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217] border border-white/[0.06] text-xs text-zinc-300 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>RLS Protected</span>
        </div>
      </div>

      {/* Avatar Identity Card */}
      <div className="p-5 rounded-2xl bg-[#121217]/80 border border-white/[0.06] flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e1e28] to-[#0d0d12] border-2 border-[#d4af37]/60 shadow-xl shadow-black/60 flex items-center justify-center font-bold text-2xl text-[#e2c056]">
            {userInitial}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/60 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-100">
              {fullName || 'User'}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium self-center sm:self-auto">
              Active Member
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Account ID: <span className="font-mono text-zinc-300">{profile.id}</span>
          </p>
          <div className="pt-1 flex items-center justify-center sm:justify-start gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
              {liveClock || 'Loading clock...'}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              {timezone}
            </span>
          </div>
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

        <div className="space-y-5">
          {/* Full Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="settings-fullName"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Full Name
            </label>
            <input
              id="settings-fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all placeholder:text-zinc-500"
              placeholder="Your full name"
            />
          </div>

          {/* Timezone Configuration Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="settings-timezone"
                className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
              >
                Authoritative IANA Timezone
              </label>
              <span className="text-xs text-[#e2c056] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Live Temporal Truth
              </span>
            </div>

            <div className="space-y-3">
              {/* Active Timezone Banner & Search Trigger */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">
                        {timezone}
                      </div>
                      <div className="text-xs text-zinc-400">
                        Local Wall-Clock: <span className="font-mono text-zinc-300">{liveClock}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSearchingTz(!isSearchingTz)}
                    className="text-xs text-zinc-300 hover:text-zinc-100 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{isSearchingTz ? 'Hide Search' : 'Change Timezone'}</span>
                  </button>
                </div>

                {/* Timezone Search & Selector Drawer */}
                {isSearchingTz && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-3 animate-in fade-in duration-150">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search by city, country or region (e.g. Kolkata, New York, London)..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-white/[0.1] text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto rounded-xl bg-zinc-950/60 border border-white/[0.06] divide-y divide-white/[0.04]">
                      {filteredTimezones.length === 0 ? (
                        <div className="p-4 text-center text-xs text-zinc-400">
                          No matching curated timezone found. You can enter any valid IANA identifier below.
                        </div>
                      ) : (
                        filteredTimezones.map((tz) => {
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
                        })
                      )}
                    </div>

                    {/* Custom IANA Input fallback */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        placeholder="Or enter custom IANA timezone identifier"
                        className="flex-1 px-3 py-2 rounded-xl bg-zinc-950/60 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Informational Guidance */}
              <div className="p-3.5 rounded-xl bg-[#121217]/60 border border-white/[0.04] text-xs text-zinc-400 leading-relaxed">
                PACT relies on your configured IANA timezone as the authoritative calendar horizon for your Daily Plan, horizontal timeline, task deadlines, and analytics periods.
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
                <span>Saving Profile...</span>
              </>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
