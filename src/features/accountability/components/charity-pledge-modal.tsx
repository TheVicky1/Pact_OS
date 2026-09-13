'use client';

import React, { useState, useTransition } from 'react';
import {
  HeartHandshake,
  DollarSign,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Lock,
  X,
  Building2,
} from 'lucide-react';
import {
  createCharityPledgeAction,
  authorizeCharityPledgeAction,
} from '@/features/finance/pledge-actions';

interface CharityPledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentId?: string;
  circleId?: string;
  onPledgeCreated?: () => void;
}

const APPROVED_CHARITIES = [
  {
    id: 'givewell-max-impact',
    name: 'GiveWell Top Charities Fund',
    ein: '26-1406830',
    description: 'Evidence-backed cost-effective global health and poverty alleviation.',
  },
  {
    id: 'against-malaria-foundation',
    name: 'Against Malaria Foundation (AMF)',
    ein: '20-5034283',
    description: 'Funding long-lasting insecticidal nets to protect vulnerable families.',
  },
  {
    id: 'electronic-frontier-foundation',
    name: 'Electronic Frontier Foundation (EFF)',
    ein: '04-3093849',
    description: 'Defending digital privacy, free expression, and user sovereignty.',
  },
  {
    id: 'khan-academy',
    name: 'Khan Academy',
    ein: '26-1544963',
    description: 'Free world-class education for anyone, anywhere.',
  },
];

export function CharityPledgeModal({
  isOpen,
  onClose,
  commitmentId,
  circleId,
  onPledgeCreated,
}: CharityPledgeModalProps) {
  const [selectedCharity, setSelectedCharity] = useState(APPROVED_CHARITIES[0]);
  const [dollarsInput, setDollarsInput] = useState('25.00');
  const [consequenceDesc, setConsequenceDesc] = useState('');
  const [explicitConsent, setExplicitConsent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePledgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const dollarNum = parseFloat(dollarsInput);
    if (isNaN(dollarNum) || dollarNum < 1 || dollarNum > 10000) {
      setErrorMsg('Pledge amount must be between $1.00 and $10,000.00 USD');
      return;
    }

    if (!explicitConsent) {
      setErrorMsg('You must provide explicit consent to arm this charity pledge.');
      return;
    }

    const amountCents = Math.round(dollarNum * 100);

    startTransition(async () => {
      // Step 1: Create draft pledge
      const createRes = await createCharityPledgeAction({
        commitment_id: commitmentId,
        circle_id: circleId,
        charity_id: selectedCharity.id,
        charity_name: selectedCharity.name,
        charity_ein: selectedCharity.ein,
        amount_cents: amountCents,
        currency: 'USD',
        explicit_consent: true,
        consequence_description:
          consequenceDesc.trim() ||
          `Forfeiture pledge to ${selectedCharity.name} upon unverified commitment`,
      });

      if (!createRes.success || !createRes.data) {
        setErrorMsg(createRes.error || 'Failed to create charity pledge');
        return;
      }

      // Step 2: Authorize & Arm
      const authRes = await authorizeCharityPledgeAction({
        pledge_id: createRes.data.id,
      });

      if (!authRes.success || !authRes.data) {
        setErrorMsg(authRes.error || 'Pledge created as draft but failed to arm.');
        return;
      }

      setSuccessMsg(`Pledge of $${dollarNum.toFixed(2)} to ${selectedCharity.name} armed!`);
      if (onPledgeCreated) onPledgeCreated();

      setTimeout(() => {
        onClose();
      }, 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-slate-100 shadow-2xl backdrop-blur-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">Arm Optional Charity Pledge</h3>
            <p className="text-xs text-slate-400">
              High-integrity financial commitment automation for self-accountability
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handlePledgeSubmit} className="space-y-4">
          {/* Charity Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Beneficiary Charity (501(c)(3) Verified)
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
              {APPROVED_CHARITIES.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCharity(c)}
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    selectedCharity.id === c.id
                      ? 'border-rose-500/60 bg-rose-500/10'
                      : 'border-white/5 bg-slate-800/30 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">EIN: {c.ein}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{c.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              Forfeiture Stake ($1.00 – $10,000.00 USD)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm font-semibold text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max="10000"
                required
                value={dollarsInput}
                onChange={(e) => setDollarsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/90 pl-7 pr-3 py-2 text-sm font-semibold text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Stored as integer cents ({Math.round(parseFloat(dollarsInput || '0') * 100)} cents)
            </p>
          </div>

          {/* Optional consequence description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Custom Trigger Note (Optional)
            </label>
            <input
              type="text"
              value={consequenceDesc}
              onChange={(e) => setConsequenceDesc(e.target.value)}
              placeholder="e.g. Forfeit if weekly exercise goal is unverified by Sunday midnight"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none"
            />
          </div>

          {/* Explicit Consent & Settlement Notice */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-relaxed">
                <strong>Zero Consequence Leakage Guarantee:</strong> Your financial pledge details
                remain strictly confidential. Peer accountability circles will only see that a
                verified pact exists without viewing monetary sums or payment details.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-amber-500/20">
              <input
                type="checkbox"
                id="explicitConsent"
                checked={explicitConsent}
                onChange={(e) => setExplicitConsent(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500"
              />
              <label htmlFor="explicitConsent" className="text-xs text-slate-200 font-medium">
                I explicitly authorize this pledge and understand forfeiture rules.
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !explicitConsent}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 transition-colors shadow-lg shadow-rose-900/30"
            >
              <Lock className="h-3.5 w-3.5" />
              {isPending ? 'Arming Pledge...' : 'Authorize & Arm Pledge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
