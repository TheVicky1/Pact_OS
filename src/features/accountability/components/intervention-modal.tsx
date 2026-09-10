'use client';

import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ActivatedCommitmentDetails, WeeklyWaiverUsage } from '../data-access';
import { utcToLocal } from '@/lib/time';
import { SessionTimerModal } from './session-timer-modal';
import { ReflectionFormModal } from './reflection-form-modal';
import { DeclarationModal } from './declaration-modal';
import { TaskCompletionModal } from './task-completion-modal';
import { CustomVerificationModal } from './custom-verification-modal';
import { WaiverDialog } from './waiver-dialog';
import { ExternalProofModal } from './external-proof-modal';
import {
  ShieldAlert,
  Clock,
  BookOpen,
  CheckSquare,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Shield,
  GitBranch,
  Code2,
  Terminal,
} from 'lucide-react';

export interface InterventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: ActivatedCommitmentDetails;
  waiverUsage: WeeklyWaiverUsage;
  timezone: string;
  onResolved: () => void;
}

/**
 * PACT Accountability Intervention Modal
 * The central dignified intervention presented when a commitment is missed.
 * Displays the immutable snapshotted consequence and routes to the appropriate verification or waiver flow.
 */
export function InterventionModal({
  isOpen,
  onClose,
  commitment,
  waiverUsage,
  timezone,
  onResolved,
}: InterventionModalProps) {
  const [activeSubFlow, setActiveSubFlow] = useState<'verification' | 'waiver' | null>(null);

  const missedAtStr = commitment.task.missed_at || commitment.activated_at || commitment.task.deadline_at;
  const formattedMissedTime = utcToLocal(missedAtStr, timezone, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const verificationType = commitment.consequence_snapshot.verification_type || 'declaration';
  const verificationConfig = commitment.consequence_snapshot.verification_config || {};

  const isExternalProof =
    verificationType === 'github_commits' ||
    verificationType === 'github_pr' ||
    verificationType === 'leetcode_solve' ||
    verificationType === 'codeforces_solve' ||
    verificationType === 'external_proof';

  const getVerificationMetadata = () => {
    switch (verificationType) {
      case 'github_commits': {
        const count = typeof verificationConfig.min_commits === 'number' ? verificationConfig.min_commits : 1;
        return {
          label: `GitHub Commits (${count})`,
          icon: GitBranch,
          summary: `Verify at least ${count} code commit(s) pushed to GitHub within the commitment window.`,
        };
      }
      case 'github_pr': {
        const count = typeof verificationConfig.min_prs === 'number' ? verificationConfig.min_prs : 1;
        return {
          label: `GitHub PRs (${count})`,
          icon: GitBranch,
          summary: `Verify at least ${count} pull request(s) created on GitHub within the commitment window.`,
        };
      }
      case 'leetcode_solve': {
        const count = typeof verificationConfig.min_problems === 'number' ? verificationConfig.min_problems : 1;
        return {
          label: `LeetCode Solves (${count})`,
          icon: Code2,
          summary: `Verify at least ${count} accepted LeetCode problem submission(s) within the commitment window.`,
        };
      }
      case 'codeforces_solve': {
        const count = typeof verificationConfig.min_problems === 'number' ? verificationConfig.min_problems : 1;
        return {
          label: `Codeforces Solves (${count})`,
          icon: Terminal,
          summary: `Verify at least ${count} accepted Codeforces problem(s) within the commitment window.`,
        };
      }
      case 'external_proof': {
        const p = (verificationConfig.provider as string) || 'developer';
        return {
          label: `${p.toUpperCase()} Proof`,
          icon: GitBranch,
          summary: 'Verify developer activity from linked external service.',
        };
      }
      case 'timed_session': {
        const sec = typeof verificationConfig.required_duration_seconds === 'number'
          ? verificationConfig.required_duration_seconds
          : 1800;
        const mins = Math.round(sec / 60);
        return {
          label: `Timed Session (${mins}m)`,
          icon: Clock,
          summary: `Complete a ${mins}-minute focused session with an evidence synthesis note.`,
        };
      }
      case 'written_reflection':
        return {
          label: 'Written Reflection',
          icon: BookOpen,
          summary: 'Submit an honest reflection (min 20 characters) explaining prevention adjustments.',
        };
      case 'task_completion':
        return {
          label: 'Task Completion',
          icon: CheckCircle,
          summary: 'Link another verified, completed PACT commitment to resolve this consequence.',
        };
      case 'custom':
        return {
          label: 'Custom Requirement',
          icon: HelpCircle,
          summary: 'Perform the agreed custom accountability action.',
        };
      case 'declaration':
      default:
        return {
          label: 'Self-Declaration',
          icon: CheckSquare,
          summary: 'Formally attest that you have executed the agreed action in full.',
        };
    }
  };

  const verificationMeta = getVerificationMetadata();
  const IconComponent = verificationMeta.icon;

  const handleSubFlowSuccess = () => {
    setActiveSubFlow(null);
    onResolved();
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !activeSubFlow}
        onClose={onClose}
        title="Accountability Intervention"
        description="A commitment has reached its deadline and requires resolution."
        size="lg"
      >
        <div className="space-y-5 text-sm text-zinc-300">
          {/* Missed Task Summary Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                Commitment Missed
              </span>
              <span className="text-[11px] text-zinc-400">{formattedMissedTime}</span>
            </div>
            <h4 className="text-base font-semibold text-zinc-100 mt-1">
              &quot;{commitment.task.title}&quot;
            </h4>
          </div>

          {/* Sealed Consequence Revealed Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37]">
                Agreed Consequence (Now Active)
              </span>
              <Badge variant="gold" size="sm">
                {commitment.consequence_snapshot.title}
              </Badge>
            </div>

            <div className="border-l-2 border-[#d4af37]/60 pl-3.5 py-0.5">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">
                Required Action:
              </p>
              <p className="text-sm font-medium text-zinc-100 leading-relaxed">
                {commitment.consequence_snapshot.action_statement ||
                  'Complete the agreed disciplinary resolution.'}
              </p>
            </div>

            {commitment.consequence_snapshot.description && (
              <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                {commitment.consequence_snapshot.description}
              </p>
            )}
          </div>

          {/* Verification Method Details */}
          <div className="rounded-2xl border border-white/[0.06] bg-black/40 p-4 flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-[#d4af37]">
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200">
                  {verificationMeta.label}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase font-mono">
                  Method
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {verificationMeta.summary}
              </p>
            </div>
          </div>

          {/* Dignified Guidance Notice */}
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 px-1">
            <Shield className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span>
              PACT preserves accountability without humiliation. Choose how you wish to resolve this commitment.
            </span>
          </div>
        </div>

        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveSubFlow('waiver')}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <span>Request Waiver ({waiverUsage.remaining}/{waiverUsage.max} left)</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveSubFlow('verification')}
            className="shadow-lg shadow-[#d4af37]/15"
          >
            <span>Begin Verification</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </ModalFooter>
      </Modal>

      {/* Sub-Modal: Timed Session */}
      {verificationType === 'timed_session' && (
        <SessionTimerModal
          isOpen={activeSubFlow === 'verification'}
          onClose={() => setActiveSubFlow(null)}
          commitmentId={commitment.commitment_id}
          taskTitle={commitment.task.title}
          actionStatement={commitment.consequence_snapshot.action_statement}
          requiredDurationSeconds={
            typeof verificationConfig.required_duration_seconds === 'number'
              ? verificationConfig.required_duration_seconds
              : 1800
          }
          onSuccess={handleSubFlowSuccess}
        />
      )}

      {/* Sub-Modal: Written Reflection */}
      {verificationType === 'written_reflection' && (
        <ReflectionFormModal
          isOpen={activeSubFlow === 'verification'}
          onClose={() => setActiveSubFlow(null)}
          commitmentId={commitment.commitment_id}
          taskTitle={commitment.task.title}
          actionStatement={commitment.consequence_snapshot.action_statement}
          onSuccess={handleSubFlowSuccess}
        />
      )}

      {/* Sub-Modal: Declaration */}
      {verificationType === 'declaration' && (
        <DeclarationModal
          isOpen={activeSubFlow === 'verification'}
          onClose={() => setActiveSubFlow(null)}
          commitmentId={commitment.commitment_id}
          taskTitle={commitment.task.title}
          actionStatement={commitment.consequence_snapshot.action_statement}
          onSuccess={handleSubFlowSuccess}
        />
      )}

      {/* Sub-Modal: Task Completion */}
      {verificationType === 'task_completion' && (
        <TaskCompletionModal
          isOpen={activeSubFlow === 'verification'}
          onClose={() => setActiveSubFlow(null)}
          commitmentId={commitment.commitment_id}
          missedTaskId={commitment.task_id}
          taskTitle={commitment.task.title}
          actionStatement={commitment.consequence_snapshot.action_statement}
          timezone={timezone}
          onSuccess={handleSubFlowSuccess}
        />
      )}

      {/* Sub-Modal: External Proof of Work */}
      {isExternalProof && (
        <ExternalProofModal
          isOpen={activeSubFlow === 'verification'}
          onClose={() => setActiveSubFlow(null)}
          commitment={commitment}
          onResolved={handleSubFlowSuccess}
        />
      )}

      {/* Sub-Modal: Custom */}
      {verificationType === 'custom' && (
        <CustomVerificationModal
          isOpen={activeSubFlow === 'verification'}
          onClose={() => setActiveSubFlow(null)}
          commitmentId={commitment.commitment_id}
          taskTitle={commitment.task.title}
          actionStatement={commitment.consequence_snapshot.action_statement}
          verificationConfig={verificationConfig}
          onSuccess={handleSubFlowSuccess}
        />
      )}

      {/* Sub-Modal: Waiver Dialog */}
      <WaiverDialog
        isOpen={activeSubFlow === 'waiver'}
        onClose={() => setActiveSubFlow(null)}
        commitmentId={commitment.commitment_id}
        taskTitle={commitment.task.title}
        waiverUsage={waiverUsage}
        onSuccess={handleSubFlowSuccess}
      />
    </>
  );
}
