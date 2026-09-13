'use client';

import React, { useState } from 'react';
import { DisciplineInsight, DisciplineInsightSeverity } from '@/lib/discipline/insights-engine';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, Sparkles, X, ChevronRight } from 'lucide-react';

export interface DisciplineInsightsCardProps {
  initialInsights?: DisciplineInsight[];
  onDismiss?: (id: string) => void;
}

const SEVERITY_CONFIG: Record<
  DisciplineInsightSeverity,
  { border: string; bg: string; text: string; icon: React.ElementType }
> = {
  CRITICAL: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: AlertCircle,
  },
  HIGH: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: AlertTriangle,
  },
  MEDIUM: {
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: Info,
  },
  LOW: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: ShieldCheck,
  },
};

export function DisciplineInsightsCard({
  initialInsights = [],
  onDismiss,
}: DisciplineInsightsCardProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeInsights = initialInsights.filter((i) => !dismissedIds.has(i.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    if (onDismiss) {
      onDismiss(id);
    }
  };

  if (activeInsights.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-6 border border-white/[0.06] bg-[#121217]/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-100">Discipline Calibration Optimal</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Workload, focus duration, and habit consistency are aligned within healthy operational thresholds.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-3xl p-6 border border-white/[0.06] bg-[#121217]/80 space-y-4 shadow-xl shadow-black/40">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#e2c056]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
              Autonomous Discipline Intelligence
            </h3>
            <p className="text-xs text-zinc-400">
              Privacy-first deterministic heuristics & anti-burnout advisories
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
          {activeInsights.length} Advisory {activeInsights.length === 1 ? 'Signal' : 'Signals'}
        </span>
      </div>

      <div className="space-y-3">
        {activeInsights.map((insight) => {
          const cfg = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.LOW;
          const Icon = cfg.icon;
          const isExpanded = expandedId === insight.id;

          return (
            <div
              key={insight.id}
              className={`rounded-2xl p-4 border transition-all ${cfg.border} ${cfg.bg} backdrop-blur-md relative`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${cfg.text}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-100">{insight.title}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${cfg.border} ${cfg.text}`}>
                        {insight.severity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {insight.explanation}
                    </p>

                    <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/[0.04]">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-[#e2c056]">
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>Recommended Action:</span>
                      </div>
                      <p className="text-xs text-zinc-200 mt-0.5 pl-5">
                        {insight.recommendedAction}
                      </p>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-white/[0.06] text-[11px] text-zinc-400 space-y-1 font-mono">
                        <div>ID: {insight.id}</div>
                        <div>Confidence Score: {(insight.confidence * 100).toFixed(0)}%</div>
                        <div>
                          Evidence Signals:{' '}
                          {Object.entries(insight.metricsEvidence)
                            .map(([k, v]) => `${k}=${v}`)
                            .join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 p-1 transition-colors"
                    title="View Evidence & Logic"
                  >
                    {isExpanded ? 'Hide' : 'Logic'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDismiss(insight.id)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-colors"
                    title="Dismiss Advisory"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
