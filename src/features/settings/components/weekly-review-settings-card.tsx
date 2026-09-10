'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  History,
  ShieldCheck,
  Wallet,
  Clock,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface WeeklyReviewSettingsCardProps {
  userTimezone?: string;
}

export function WeeklyReviewSettingsCard({
  userTimezone,
}: WeeklyReviewSettingsCardProps) {
  const steps = [
    {
      num: 1,
      title: 'Look Back',
      icon: Clock,
      desc: 'Audit verified facts, task completion rates, and historical logs.',
    },
    {
      num: 2,
      title: 'Accountability',
      icon: ShieldCheck,
      desc: 'Evaluate pact integrity, waivers utilized, and root causes.',
    },
    {
      num: 3,
      title: 'Finance & Focus',
      icon: Wallet,
      desc: 'Review budget adherence, net cash flow, and deep work output.',
    },
    {
      num: 4,
      title: 'Clean Up',
      icon: CheckCircle2,
      desc: 'Triage open loops and carry forward essential tasks into next week.',
    },
    {
      num: 5,
      title: 'Plan & Commit',
      icon: Lock,
      desc: 'Establish top 5 strategic outcomes and certify next week’s plan.',
    },
  ];

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
              Cadence & Rituals
            </span>
            <span className="h-1 w-1 rounded-full bg-zinc-500" />
            <span className="text-xs text-zinc-400">Weekly Operating System</span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5 mt-1">
            <BookOpen className="w-5 h-5 text-[#d4af37]" />
            Weekly Review & Planning Ritual
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Conduct your weekly look-back, reconcile commitments, and lock in your upcoming operating plan.
          </p>
        </div>

        <Link
          href="/app/review"
          className="self-start sm:self-auto focus-visible:outline-none"
        >
          <Button variant="primary" size="sm" className="shadow-lg shadow-[#d4af37]/15">
            <span>Launch Weekly Review</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </Link>
      </div>

      {/* Ritual Overview Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#14141c] via-[#121217] to-[#0e0e14] border border-[#d4af37]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#d4af37]/15 text-[#e2c056] shrink-0 mt-0.5 border border-[#d4af37]/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs text-zinc-300">
            <span className="font-semibold text-zinc-100 text-sm block">
              Sunday Planning Cadence
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Every Sunday (or at the conclusion of your operating week), the ritual guides you through a 5-step deterministic workflow to reset open loops and lock your strategic priorities.
            </p>
            {userTimezone && (
              <p className="text-[11px] text-zinc-500 pt-0.5">
                Authoritative cycle calculated in timezone: <span className="text-zinc-400 font-mono">{userTimezone}</span>
              </p>
            )}
          </div>
        </div>

        <Link
          href="/app/review"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-zinc-100 transition-colors shrink-0 cursor-pointer"
        >
          <History className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Review History</span>
        </Link>
      </div>

      {/* 5-Step Process Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Deterministic 5-Step Workflow
          </span>
          <span className="text-xs text-zinc-500 font-mono">5 Phases</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-white/[0.06] hover:border-white/[0.12] transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30 text-[10px] font-mono font-bold flex items-center justify-center">
                      {step.num}
                    </span>
                    <span className="text-sm font-semibold text-zinc-200">
                      {step.title}
                    </span>
                  </div>
                  <Icon className="w-4 h-4 text-zinc-400" />
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operating Instructions & Guarantees */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] space-y-2">
        <span className="text-xs font-semibold text-zinc-300 block">
          Operating Invariants
        </span>
        <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-zinc-300">Immutable Snapshots:</strong> Once committed, the week&apos;s verified metrics snapshot is frozen and certified.
          </li>
          <li>
            <strong className="text-zinc-300">Identity Preservation:</strong> Carrying forward unfinished tasks preserves their original UUID and history.
          </li>
          <li>
            <strong className="text-zinc-300">Auto-Draft Saving:</strong> Reflections and cleanup decisions are continuously persisted as drafts until final lock.
          </li>
        </ul>
      </div>
    </div>
  );
}
