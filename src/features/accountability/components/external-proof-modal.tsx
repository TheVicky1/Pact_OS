'use client';

import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ActivatedCommitmentDetails } from '../data-access';
import { verifyExternalProofAction } from '../actions';
import {
  GitBranch,
  Code2,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

export interface ExternalProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitment: ActivatedCommitmentDetails;
  onResolved: () => void;
}

export function ExternalProofModal({
  isOpen,
  onClose,
  commitment,
  onResolved,
}: ExternalProofModalProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    code?: string;
    summary?: string;
    error?: string;
    evidence?: Array<{
      external_event_id: string;
      summary: string;
      evidence_type: string;
    }>;
  } | null>(null);

  const snapshot = commitment.consequence_snapshot || {};
  const verifType = snapshot.verification_type || 'declaration';
  const verifConfig = snapshot.verification_config || {};

  const getProviderInfo = () => {
    if (verifType === 'github_commits' || verifType === 'github_pr') {
      return {
        name: 'GitHub',
        icon: GitBranch,
        label: verifType === 'github_pr' ? 'GitHub Pull Requests' : 'GitHub Commits',
        description: `Verify that required code changes were pushed to GitHub within the commitment window.`,
      };
    }
    if (verifType === 'leetcode_solve') {
      return {
        name: 'LeetCode',
        icon: Code2,
        label: 'LeetCode Problem Solves',
        description: `Verify that required LeetCode problem(s) were submitted and accepted.`,
      };
    }
    if (verifType === 'codeforces_solve') {
      return {
        name: 'Codeforces',
        icon: Terminal,
        label: 'Codeforces Submissions',
        description: `Verify that required Codeforces problem(s) received an 'OK' verdict.`,
      };
    }
    const p = (verifConfig.provider as string) || 'github';
    return {
      name: p.charAt(0).toUpperCase() + p.slice(1),
      icon: GitBranch,
      label: 'External Proof-of-Work',
      description: 'Verify activity from your linked developer account.',
    };
  };

  const providerInfo = getProviderInfo();
  const IconComponent = providerInfo.icon;

  const handleVerify = async () => {
    setIsVerifying(true);
    setResult(null);
    try {
      const res = await verifyExternalProofAction(commitment.id);
      if (res.success) {
        setResult({
          success: true,
          code: res.code,
          summary: (res.data as any)?.summary || 'Proof-of-work objectively verified.',
          evidence: (res.data as any)?.evidence || [],
        });
        setTimeout(() => {
          onResolved();
          onClose();
        }, 1200);
      } else {
        setResult({
          success: false,
          code: res.code,
          error: res.error || 'Verification criteria not met.',
          summary: (res as any).result?.summary,
        });
      }
    } catch {
      setResult({
        success: false,
        code: 'NETWORK_ERROR',
        error: 'Network error communicating with PACT server.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="External Proof-of-Work Verification"
      description={`Server-evaluated verification via ${providerInfo.name}.`}
      size="md"
    >
      <div className="space-y-5 text-sm text-zinc-300">
        {/* Requirement Banner */}
        <div className="p-4 rounded-2xl bg-[#121217] border border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-xs">
              <IconComponent className="w-4 h-4 text-[#d4af37]" />
              <span>{providerInfo.label}</span>
            </div>
            <Badge variant="gold" size="sm">
              Objectively Verified
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            {providerInfo.description}
          </p>
        </div>

        {/* Action Statement context */}
        <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Required Action
          </span>
          <p className="text-xs text-zinc-200 font-medium">
            {snapshot.action_statement || 'Satisfy external proof requirement.'}
          </p>
        </div>

        {/* Verification Result Feedback */}
        {result && (
          <div
            className={`p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in duration-150 ${
              result.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : result.code === 'PROVIDER_UNAVAILABLE' || result.code === 'RATE_LIMITED'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : result.code === 'NO_LINKED_ACCOUNT'
                ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : result.code === 'PROVIDER_UNAVAILABLE' || result.code === 'RATE_LIMITED' ? (
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              ) : result.code === 'NO_LINKED_ACCOUNT' ? (
                <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {result.success
                  ? 'Verification Succeeded'
                  : result.code === 'PROVIDER_UNAVAILABLE'
                  ? 'Provider Service Unavailable'
                  : result.code === 'RATE_LIMITED'
                  ? 'Provider Rate Limit Reached'
                  : result.code === 'NO_LINKED_ACCOUNT'
                  ? 'Account Not Connected'
                  : 'Criteria Not Yet Met'}
              </span>
            </div>

            <p className="leading-relaxed">
              {result.summary || result.error}
            </p>

            {result.code === 'PROVIDER_UNAVAILABLE' && (
              <p className="text-[11px] text-amber-400/90 italic">
                Note: External service downtime is NOT treated as a failure. You may retry safely.
              </p>
            )}

            {result.code === 'NO_LINKED_ACCOUNT' && (
              <div className="pt-1">
                <Link
                  href="/app/settings"
                  className="inline-flex items-center gap-1.5 font-semibold text-blue-300 hover:underline"
                >
                  <span>Go to Settings to Link Account</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            {result.evidence && result.evidence.length > 0 && (
              <div className="pt-2 border-t border-emerald-500/20 space-y-1">
                <span className="font-semibold text-[11px] text-emerald-200">
                  Verified Evidence ({result.evidence.length} item(s)):
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-emerald-300/90">
                  {result.evidence.map((ev, i) => (
                    <li key={i}>{ev.summary}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Security / Honesty Callout */}
        <div className="flex items-start gap-2 text-[11px] text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
          <span>
            PACT independently queries external APIs and confirms timestamps within your commitment window.
          </span>
        </div>
      </div>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose} disabled={isVerifying}>
          Cancel
        </Button>
        <Button
          variant="gold"
          onClick={handleVerify}
          isLoading={isVerifying}
          disabled={isVerifying || result?.success}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isVerifying ? 'animate-spin' : ''}`} />
          <span>Verify Proof Now</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
