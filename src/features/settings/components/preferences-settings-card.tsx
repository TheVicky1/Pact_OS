'use client';

import React, { useState, useTransition } from 'react';
import { ALargeSmall, Accessibility } from 'lucide-react';
import { WorkspacePreferences } from '@/types/domain';
import { updateWorkspacePreferencesAction } from '@/features/settings/actions';
import { applyFontScale, FontScale } from '@/lib/ui/font-scale';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface PreferencesSettingsCardProps {
  preferences: WorkspacePreferences;
}

const FONT_SCALE_OPTIONS: { value: FontScale; label: string; sampleClassName: string }[] = [
  { value: '90%', label: 'Small', sampleClassName: 'text-base' },
  { value: '100%', label: 'Standard', sampleClassName: 'text-lg' },
  { value: '110%', label: 'Large', sampleClassName: 'text-xl' },
  { value: '125%', label: 'Extra Large', sampleClassName: 'text-2xl' },
];

export function PreferencesSettingsCard({ preferences }: PreferencesSettingsCardProps) {
  const [fontScale, setFontScale] = useState(preferences.fontScale);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      const res = await updateWorkspacePreferencesAction({ fontScale });

      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        applyFontScale(document.documentElement, fontScale);
        setFeedback({
          type: 'success',
          message: 'Workspace preferences updated successfully.',
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
            <ALargeSmall className="w-5 h-5 text-[#d4af37]" />
            Workspace Preferences
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Adjust the text scale across your entire PACT workspace for comfortable reading.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217] border border-white/[0.06] text-xs text-zinc-300 self-start sm:self-auto">
          <Accessibility className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Synced Across Devices</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {feedback && (
          <Alert variant={feedback.type === 'success' ? 'success' : 'danger'}>
            {feedback.message}
          </Alert>
        )}

        <fieldset className="space-y-4">
          <legend className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Font Size
          </legend>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {FONT_SCALE_OPTIONS.map((option) => {
              const isSelected = fontScale === option.value;

              return (
                <label
                  key={option.value}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#d4af37] ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#181820] to-[#121217] border-[#d4af37]/40 shadow-lg shadow-black/40'
                      : 'bg-zinc-900/60 border-white/[0.08] hover:border-white/[0.12]'
                  }`}
                >
                  <input
                    type="radio"
                    name="fontScale"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setFontScale(option.value)}
                    className="sr-only"
                  />
                  <div className="h-8 flex items-end justify-between">
                    <span
                      aria-hidden="true"
                      className={`${option.sampleClassName} font-semibold leading-none text-zinc-100`}
                    >
                      Aa
                    </span>
                    {isSelected && (
                      <span className="self-start w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-sm shadow-[#d4af37]" />
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold text-zinc-100 block">
                      {option.label}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">
                      {option.value}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* Submit Action */}
        <div className="pt-4 flex justify-end">
          <Button type="submit" size="lg" loading={isPending}>
            {isPending ? 'Saving Preferences...' : 'Save Workspace Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}
