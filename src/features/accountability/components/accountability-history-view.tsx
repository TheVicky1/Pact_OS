'use client';

import React, { useState } from 'react';
import type { AccountabilityHistoryItem } from '../data-access';
import { Badge } from '@/components/ui/badge';
import { utcToLocal } from '@/lib/time';
import {
  ShieldAlert,
  CheckCircle2,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

export interface AccountabilityHistoryViewProps {
  events: AccountabilityHistoryItem[];
  timezone: string;
}

type FilterTab = 'all' | 'fulfilled' | 'waived' | 'activated';

/**
 * PACT Accountability History View
 * Chronological immutable audit trail distinguishing objectively verified,
 * rule-checked, self-declared, and waived outcomes.
 */
export function AccountabilityHistoryView({ events, timezone }: AccountabilityHistoryViewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    if (activeFilter === 'all') return true;
    return e.event_type === activeFilter;
  });

  const getSemanticLabel = (event: AccountabilityHistoryItem) => {
    if (event.event_type === 'waived') {
      const week = event.metadata?.waiver_week_number;
      return {
        label: week ? `Deliberately Waived (Week ${week})` : 'Deliberately Waived',
        variant: 'neutral' as const,
      };
    }

    if (event.event_type === 'activated') {
      return {
        label: 'Authoritative Miss Activation',
        variant: 'danger' as const,
      };
    }

    // Fulfilled
    const vType = event.verification_type || (event.metadata?.verification_type as string);
    switch (vType) {
      case 'external_proof':
      case 'github_commits':
      case 'github_pr':
      case 'leetcode_solve':
      case 'codeforces_solve': {
        const provider = (event.metadata?.provider as string) || 'Developer';
        return {
          label: `Objectively Verified (${provider.toUpperCase()} Proof)`,
          variant: 'success' as const,
        };
      }
      case 'timed_session': {
        const actualSec = event.metadata?.actual_duration_seconds;
        const mins = typeof actualSec === 'number' ? Math.round(actualSec / 60) : null;
        return {
          label: mins ? `Objectively Verified (${mins}m focus)` : 'Objectively Verified (Timed Session)',
          variant: 'success' as const,
        };
      }
      case 'task_completion':
        return {
          label: 'Objectively Verified (Task Link)',
          variant: 'success' as const,
        };
      case 'written_reflection': {
        const charLen = typeof event.metadata?.character_count === 'number' ? event.metadata.character_count : null;
        return {
          label: charLen ? `Rule-Checked Submission (${charLen} chars)` : 'Rule-Checked Submission',
          variant: 'gold' as const,
        };
      }
      case 'declaration':
        return {
          label: 'Self-Declared Attestation',
          variant: 'gold' as const,
        };
      default:
        return {
          label: 'Verified Resolution',
          variant: 'success' as const,
        };
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedEventId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          {(
            [
              { id: 'all', label: 'All Events' },
              { id: 'fulfilled', label: 'Fulfilled' },
              { id: 'waived', label: 'Waived' },
              { id: 'activated', label: 'Activated' },
            ] as const
          ).map((tab) => {
            const count = tab.id === 'all'
              ? events.length
              : events.filter((e) => e.event_type === tab.id).length;

            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-[#d4af37]/25 text-[#d4af37]' : 'bg-white/[0.06] text-zinc-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Filter className="h-3.5 w-3.5" />
          <span>Showing {filteredEvents.length} events</span>
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/[0.08] p-10 text-center text-zinc-400 space-y-1">
          <FileText className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-medium text-zinc-300">No events recorded</p>
          <p className="text-xs text-zinc-500">
            {activeFilter === 'all'
              ? 'When commitments are activated, resolved, or waived, immutable records appear here.'
              : `No ${activeFilter} accountability records found.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEvents.map((event) => {
            const semantic = getSemanticLabel(event);
            const isExpanded = expandedEventId === event.id;
            const formattedTime = utcToLocal(event.created_at, timezone, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });

            return (
              <div
                key={event.id}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] transition-colors p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        event.event_type === 'fulfilled'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : event.event_type === 'waived'
                          ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {event.event_type === 'fulfilled' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : event.event_type === 'waived' ? (
                        <Clock className="h-4 w-4" />
                      ) : (
                        <ShieldAlert className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-semibold text-zinc-100">
                        {event.task_title}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Consequence: {event.consequence_title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Badge variant={semantic.variant} size="sm">
                      {semantic.label}
                    </Badge>
                    <span className="text-[11px] text-zinc-500">{formattedTime}</span>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(event.id)}
                        className="rounded-lg p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
                        aria-label="Toggle event details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && event.metadata && (
                  <div className="rounded-xl border border-white/[0.06] bg-black/40 p-3.5 text-xs text-zinc-300 space-y-2 mt-2">
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Audit Metadata:
                    </p>

                    {typeof event.metadata.reflection_text === 'string' && (
                      <div className="space-y-1">
                        <span className="text-zinc-500">Submitted Reflection:</span>
                        <p className="italic text-zinc-200 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          &quot;{event.metadata.reflection_text}&quot;
                        </p>
                      </div>
                    )}

                    {typeof event.metadata.evidence_note === 'string' && (
                      <div className="space-y-1">
                        <span className="text-zinc-500">Session Evidence Note:</span>
                        <p className="italic text-zinc-200 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          &quot;{event.metadata.evidence_note}&quot;
                        </p>
                      </div>
                    )}

                    {typeof event.metadata.declaration_statement === 'string' && (
                      <div className="space-y-1">
                        <span className="text-zinc-500">Formal Attestation:</span>
                        <p className="italic text-zinc-200 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
                          &quot;{event.metadata.declaration_statement}&quot;
                        </p>
                      </div>
                    )}

                    {typeof event.metadata.target_task_id === 'string' && (
                      <p>
                        <span className="text-zinc-500">Linked Completed Task ID: </span>
                        <span className="font-mono text-zinc-300">{event.metadata.target_task_id}</span>
                      </p>
                    )}

                    {typeof event.metadata.waiver_count_in_week === 'number' && (
                      <p>
                        <span className="text-zinc-500">Waiver Quota Position: </span>
                        <span>{event.metadata.waiver_count_in_week} of 3 in calendar week</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
