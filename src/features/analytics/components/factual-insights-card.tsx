'use client';

import React from 'react';
import { Lightbulb, Info } from 'lucide-react';

interface FactualInsightsCardProps {
  observations: string[];
}

export function FactualInsightsCard({ observations }: FactualInsightsCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-zinc-950/40 border border-white/[0.08] backdrop-blur-md space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400">
          <Lightbulb className="w-4 h-4" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold text-white">Factual Observations</h2>
      </div>

      <div className="space-y-2.5">
        {observations.map((obs, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-zinc-900/50 border border-white/[0.04] text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5"
          >
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{obs}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
