'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  ActivatedCommitmentDetails,
  WeeklyWaiverUsage,
  AccountabilityHistoryItem,
} from '../data-access';
import { InterventionModal } from './intervention-modal';
import { AccountabilityHistoryView } from './accountability-history-view';
import { AccountabilityCirclesCard } from './accountability-circles-card';
import { CharityPledgeModal } from './charity-pledge-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/glass-card';
import { PageContainer } from '@/components/ui/page-container';
import { utcToLocal } from '@/lib/time';
import {
  ShieldAlert,
  ShieldCheck,
  History,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export interface AccountabilityViewProps {
  activatedCommitments: ActivatedCommitmentDetails[];
  waiverUsage: WeeklyWaiverUsage;
  historyEvents: AccountabilityHistoryItem[];
  timezone: string;
}

/**
 * PACT Master Accountability Cockpit View
 * Displays active interventions requiring immediate resolution, weekly waiver horizon,
 * and immutable historical audit trail.
 */
export function AccountabilityView({
  activatedCommitments,
  waiverUsage,
  historyEvents,
  timezone,
}: AccountabilityViewProps) {
  const router = useRouter();
  const [selectedCommitment, setSelectedCommitment] = useState<ActivatedCommitmentDetails | null>(null);
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [pledgeCommitmentId, setPledgeCommitmentId] = useState<string | undefined>(undefined);

  const handleResolved = () => {
    setSelectedCommitment(null);
    router.refresh();
  };

  const handleOpenPledge = (commitmentId?: string) => {
    setPledgeCommitmentId(commitmentId);
    setIsPledgeModalOpen(true);
  };

  return (
    <PageContainer>
      <div className="space-y-8 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
                Discipline Command
              </span>
              <span className="h-1 w-1 rounded-full bg-zinc-500" />
              <span className="text-xs text-zinc-400">Accountability & Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 tracking-tight mt-1">
              Accountability Cockpit
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Resolve active commitments through verified execution or disciplined weekly waivers.
            </p>
          </div>

          {/* Quick Quota Pill */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] self-start sm:self-auto">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="text-xs">
              <p className="font-semibold text-zinc-200">
                {waiverUsage.remaining} of {waiverUsage.max} Waivers Left
              </p>
              <p className="text-[11px] text-zinc-500">{waiverUsage.resetText}</p>
            </div>
          </div>
        </div>

        {/* Section 1: Multi-Party Accountability Circles & Social Verification */}
        <section className="space-y-4">
          <AccountabilityCirclesCard onOpenPledgeModal={handleOpenPledge} />
        </section>

        {/* Section 2: Active Interventions */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <h2 className="text-base sm:text-lg font-semibold text-zinc-100">
                Active Interventions
              </h2>
              {activatedCommitments.length > 0 && (
                <Badge variant="warning" size="sm">
                  {activatedCommitments.length} Outstanding
                </Badge>
              )}
            </div>
          </div>

          {activatedCommitments.length === 0 ? (
            <GlassCard className="p-8 text-center border-white/[0.08]">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-1">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200">All Commitments in Good Standing</h3>
                <p className="text-xs text-zinc-400 max-w-sm">
                  No active consequences are pending. When a task reaches its deadline without completion,
                  its sealed accountability commitment activates here.
                </p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activatedCommitments.map((commitment) => {
                const missedAtStr = commitment.task.missed_at || commitment.activated_at || commitment.task.deadline_at;
                const formattedMissed = utcToLocal(missedAtStr, timezone, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });

                return (
                  <GlassCard
                    key={commitment.commitment_id}
                    className="p-5 border-amber-500/30 bg-gradient-to-br from-[#16141a]/90 via-[#121217]/90 to-black/80 shadow-xl space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="danger" size="sm">
                            Missed
                          </Badge>
                          <span className="text-[11px] text-zinc-400">{formattedMissed}</span>
                        </div>
                        <h3 className="text-base font-semibold text-zinc-100 truncate">
                          {commitment.task.title}
                        </h3>
                      </div>
                    </div>

                    {/* Consequence Peek */}
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#d4af37]">
                          {commitment.consequence_snapshot.title}
                        </span>
                        <span className="text-[10px] text-zinc-400 uppercase font-mono">
                          {commitment.consequence_snapshot.verification_type}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-2">
                        {commitment.consequence_snapshot.action_statement}
                      </p>
                    </div>

                    <div className="pt-1 flex items-center justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setSelectedCommitment(commitment)}
                        className="shadow-lg shadow-[#d4af37]/15"
                      >
                        <span>Resolve Commitment</span>
                        <ArrowRight className="h-4 w-4 ml-1.5" />
                      </Button>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 3: Historical Audit Trail */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[#d4af37]" />
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100">
              Accountability Audit Trail
            </h2>
          </div>

          <GlassCard className="p-6 border-white/[0.08]">
            <AccountabilityHistoryView events={historyEvents} timezone={timezone} />
          </GlassCard>
        </section>
      </div>

      {/* Intervention Modal */}
      {selectedCommitment && (
        <InterventionModal
          isOpen={Boolean(selectedCommitment)}
          onClose={() => setSelectedCommitment(null)}
          commitment={selectedCommitment}
          waiverUsage={waiverUsage}
          timezone={timezone}
          onResolved={handleResolved}
        />
      )}

      {/* Charity Pledge Modal */}
      <CharityPledgeModal
        isOpen={isPledgeModalOpen}
        onClose={() => setIsPledgeModalOpen(false)}
        commitmentId={pledgeCommitmentId}
        onPledgeCreated={() => router.refresh()}
      />
    </PageContainer>
  );
}
