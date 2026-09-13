'use client';

import React, { useState, useTransition } from 'react';
import {
  Users,
  Shield,
  Plus,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Eye,
  Key,
  Copy,
  Check,
  HeartHandshake,
} from 'lucide-react';
import {
  type AccountabilityCircle,
  type CircleMember,
  type CircleSharedCommitment,
} from '@/lib/validations/circles';
import {
  createCircleAction,
  createCircleInvitationAction,
  recordPeerAttestationAction,
} from '@/features/accountability/circle-actions';

interface AccountabilityCirclesCardProps {
  initialCircles?: AccountabilityCircle[];
  initialMemberships?: (CircleMember & { circle?: AccountabilityCircle })[];
  sharedCommitments?: CircleSharedCommitment[];
  onOpenPledgeModal?: (commitmentId?: string) => void;
}

export function AccountabilityCirclesCard({
  initialCircles = [],
  sharedCommitments = [],
  onOpenPledgeModal,
}: AccountabilityCirclesCardProps) {
  const [circles, setCircles] = useState<AccountabilityCircle[]>(initialCircles);
  const [commitments, setCommitments] = useState(sharedCommitments);
  const [isPending, startTransition] = useTransition();

  // Dialog & form states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDesc, setNewCircleDesc] = useState('');
  const [requireUnanimous, setRequireUnanimous] = useState(false);

  // Invite states
  const [activeCircleForInvite, setActiveCircleForInvite] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'accountability_partner' | 'observer'>(
    'accountability_partner'
  );
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Attestation states
  const [attestationNotes, setAttestationNotes] = useState<Record<string, string>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleCreateCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    startTransition(async () => {
      const res = await createCircleAction({
        name: newCircleName.trim(),
        description: newCircleDesc.trim() || undefined,
        require_unanimous_verdict: requireUnanimous,
      });

      if (res.success && res.data) {
        setCircles((prev) => [res.data!, ...prev]);
        setNewCircleName('');
        setNewCircleDesc('');
        setIsCreateOpen(false);
        setFeedbackMsg({ type: 'success', text: `Circle "${res.data.name}" created!` });
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to create circle' });
      }
    });
  };

  const handleGenerateInvite = (circleId: string) => {
    startTransition(async () => {
      const res = await createCircleInvitationAction({
        circle_id: circleId,
        invitee_email: inviteEmail.trim() || undefined,
        role: inviteRole,
      });

      if (res.success && res.data) {
        setGeneratedInviteLink(res.data.invite_url);
        setFeedbackMsg({ type: 'success', text: 'Cryptographic invite generated!' });
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Failed to generate invitation' });
      }
    });
  };

  const handleAttest = (sharedCommitmentId: string, verdict: 'verified' | 'failed' | 'disputed') => {
    const note = attestationNotes[sharedCommitmentId] || '';
    startTransition(async () => {
      const res = await recordPeerAttestationAction({
        shared_commitment_id: sharedCommitmentId,
        verdict,
        attestation_notes: note,
      });

      if (res.success) {
        setFeedbackMsg({ type: 'success', text: `Attestation "${verdict}" submitted!` });
        setCommitments((prev) =>
          prev.map((c) =>
            c.id === sharedCommitmentId ? { ...c, verification_status: verdict } : c
          )
        );
      } else {
        setFeedbackMsg({ type: 'error', text: res.error || 'Attestation submission failed' });
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20 shadow-2xl">
      {/* Glow highlight */}
      <div className="absolute -left-20 -top-20 h-44 w-44 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              Multi-Party Accountability Circles
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase 10
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Private-by-default social accountability with zero consequence leakage
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenPledgeModal && (
            <button
              onClick={() => onOpenPledgeModal()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition-colors"
            >
              <HeartHandshake className="h-3.5 w-3.5" />
              Charity Pledge
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Circle
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Create Circle Form */}
      {isCreateOpen && (
        <form
          onSubmit={handleCreateCircle}
          className="mb-6 rounded-xl border border-white/10 bg-slate-800/40 p-4 backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Create New Accountability Circle
            </span>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Cancel
            </button>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Circle Name</label>
            <input
              type="text"
              required
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              placeholder="e.g. Deep Work Collective"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={newCircleDesc}
              onChange={(e) => setNewCircleDesc(e.target.value)}
              placeholder="Private verification group for Q4 engineering targets"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requireUnanimous"
              checked={requireUnanimous}
              onChange={(e) => setRequireUnanimous(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            <label htmlFor="requireUnanimous" className="text-xs text-slate-300">
              Require unanimous peer verdict for commitment verification
            </label>
          </div>
          <button
            type="submit"
            disabled={isPending || !newCircleName.trim()}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Creating...' : 'Confirm & Initialize Circle'}
          </button>
        </form>
      )}

      {/* Invite Modal / Box */}
      {activeCircleForInvite && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-slate-800/60 p-4 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5" /> Invite Member (SHA-256 Token)
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveCircleForInvite(null);
                setGeneratedInviteLink(null);
              }}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Invitee Email (Optional)
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'member' | 'accountability_partner' | 'observer')
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
              >
                <option value="accountability_partner">Accountability Partner (Attestation Rights)</option>
                <option value="member">Member (Participant)</option>
                <option value="observer">Observer (Read-Only Status)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerateInvite(activeCircleForInvite)}
            disabled={isPending}
            className="w-full rounded-lg bg-emerald-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            {isPending ? 'Generating...' : 'Generate Cryptographic Invite Token'}
          </button>

          {generatedInviteLink && (
            <div className="flex items-center gap-2 rounded-lg bg-slate-900/90 p-2 border border-slate-700">
              <input
                type="text"
                readOnly
                value={generatedInviteLink}
                className="flex-1 bg-transparent text-xs text-emerald-300 font-mono focus:outline-none select-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(generatedInviteLink)}
                className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title="Copy link"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Circles Grid */}
      <div className="space-y-4">
        {circles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/60 p-8 text-center">
            <Shield className="mx-auto h-8 w-8 text-slate-500 mb-2 opacity-60" />
            <p className="text-xs text-slate-400">No accountability circles created yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Create a circle to invite trusted partners and verify shared commitments.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {circles.map((circle) => (
              <div
                key={circle.id}
                className="group relative rounded-xl border border-white/5 bg-slate-800/30 p-4 transition-all duration-200 hover:border-emerald-500/30 hover:bg-slate-800/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {circle.name}
                    </h4>
                    {circle.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{circle.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveCircleForInvite(circle.id)}
                    className="p-1.5 rounded-lg bg-slate-700/40 text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                    title="Invite Partner"
                  >
                    <UserPlus className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-emerald-400/70" />
                    {circle.require_unanimous_verdict ? 'Unanimous required' : 'Majority consensus'}
                  </span>
                  <span>•</span>
                  <span>{new Date(circle.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shared Commitments & Attestation Section */}
        {commitments.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-blue-400" />
              Shared Circle Commitments
            </h4>

            <div className="space-y-3">
              {commitments.map((sc) => (
                <div
                  key={sc.id}
                  className="rounded-xl border border-white/5 bg-slate-800/20 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-medium text-slate-200">
                        Commitment #{sc.commitment_id.slice(0, 8)}
                      </span>
                      <p className="text-xs text-slate-400 italic mt-0.5">
                        {sc.masked_consequence || '[CONFIDENTIAL CONSEQUENCE: Masked for circle review]'}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                        sc.verification_status === 'verified'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : sc.verification_status === 'failed'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      {sc.verification_status.toUpperCase()}
                    </span>
                  </div>

                  {/* Attestation Actions */}
                  {sc.verification_status === 'pending' && (
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="Attestation rationale/evidence..."
                        value={attestationNotes[sc.id] || ''}
                        onChange={(e) =>
                          setAttestationNotes({ ...attestationNotes, [sc.id]: e.target.value })
                        }
                        className="w-full sm:flex-1 rounded-lg border border-slate-700 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAttest(sc.id, 'verified')}
                          disabled={isPending}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-medium hover:bg-emerald-600/50 transition-colors"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttest(sc.id, 'failed')}
                          disabled={isPending}
                          className="px-2.5 py-1 rounded-lg bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-medium hover:bg-rose-600/50 transition-colors"
                        >
                          Breach
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
