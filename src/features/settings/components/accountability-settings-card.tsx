'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  UserAccountabilityPreferences,
  ConsequenceDefinition,
} from '@/types/domain';
import { updateAccountabilityPreferencesAction } from '@/features/settings/actions';
import {
  ShieldAlert,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export interface AccountabilitySettingsCardProps {
  preferences: UserAccountabilityPreferences | null;
  consequences: ConsequenceDefinition[];
}

export function AccountabilitySettingsCard({
  preferences,
  consequences,
}: AccountabilitySettingsCardProps) {
  const [isEnabled, setIsEnabled] = useState(preferences?.is_enabled ?? true);
  const [autoApplyDefault, setAutoApplyDefault] = useState(
    preferences?.auto_apply_default ?? false
  );
  const [defaultConsequenceId, setDefaultConsequenceId] = useState<string>(
    preferences?.default_consequence_id || ''
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
      const res = await updateAccountabilityPreferencesAction({
        isEnabled,
        autoApplyDefault,
        defaultConsequenceId: defaultConsequenceId || null,
      });

      if (res.error) {
        setFeedback({
          type: 'error',
          message: res.error,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Accountability preferences successfully updated.',
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
            <ShieldAlert className="w-5 h-5 text-[#d4af37]" />
            Accountability Rules & Preferences
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Configure default consequence assignment and system-level discipline policies.
          </p>
        </div>

        <Link
          href="/app/accountability"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#121217] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>Manage Rule Definitions</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#d4af37]" />
        </Link>
      </div>

      {/* Confidentiality Callout */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#14141c] to-[#0e0e14] border border-[#d4af37]/30 flex items-start gap-3.5 shadow-sm">
        <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#e2c056] shrink-0 mt-0.5 border border-[#d4af37]/30">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-xs text-zinc-300 leading-relaxed">
          <span className="font-semibold text-zinc-100 block">
            Strict Accountability Confidentiality Guarantee
          </span>
          Consequence payloads, referee notes, and waiver tokens are strictly immutable once committed and remain completely masked during normal task execution.
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

        <div className="space-y-6">
          {/* Global Engine Switch */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                <span className="text-sm font-semibold text-zinc-100">
                  Accountability Engine Active
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Enables consequence snapshot immutability, automated activation on missed deadlines, and verification sessions.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => setIsEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-200 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]" />
            </label>
          </div>

          {/* Auto-apply Default Rule */}
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#d4af37]" />
                <span className="text-sm font-semibold text-zinc-100">
                  Auto-Apply Default Consequence
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Automatically attaches your chosen default consequence rule when creating a new task or commitment.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={autoApplyDefault}
                onChange={(e) => setAutoApplyDefault(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-200 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37]" />
            </label>
          </div>

          {/* Default Consequence Rule Selector */}
          <div className="space-y-2.5">
            <label
              htmlFor="settings-defaultConsequence"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-300"
            >
              Default Consequence Rule
            </label>

            {consequences.length === 0 ? (
              <div className="p-5 rounded-2xl bg-[#121217] border border-white/[0.06] text-center space-y-3">
                <p className="text-xs text-zinc-400">
                  You haven’t configured any custom consequence definitions yet.
                </p>
                <Link
                  href="/app/accountability"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#e2c056] border border-[#d4af37]/40 text-xs font-semibold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Your First Rule</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  id="settings-defaultConsequence"
                  value={defaultConsequenceId}
                  onChange={(e) => setDefaultConsequenceId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all cursor-pointer"
                >
                  <option value="" className="bg-zinc-950 text-zinc-400">
                    -- No Default Consequence Selected --
                  </option>
                  {consequences.map((rule) => (
                    <option
                      key={rule.id}
                      value={rule.id}
                      className="bg-zinc-950 text-zinc-100"
                    >
                      {rule.title} ({rule.consequence_type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-400">
                  This rule will be selected by default in the rapid task creation dialog when accountability is enabled.
                </p>
              </div>
            )}
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
              <span>Save Accountability Settings</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
