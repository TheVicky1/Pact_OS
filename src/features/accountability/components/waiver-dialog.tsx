'use client';

import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import type { WeeklyWaiverUsage } from '../data-access';
import { waiveCommitmentAction } from '../actions';
import { ShieldCheck, AlertCircle, Lock } from 'lucide-react';

export interface WaiverDialogProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentId: string;
  taskTitle: string;
  waiverUsage: WeeklyWaiverUsage;
  onSuccess: () => void;
}

/**
 * PACT Deliberate Waiver Dialog
 * Enforces deliberate, non-coercive confirmation for quota-controlled commitment waivers.
 * The server authoritatively enforces the 3-waiver limit in the user's timezone.
 */
export function WaiverDialog({
  isOpen,
  onClose,
  commitmentId,
  taskTitle,
  waiverUsage,
  onSuccess,
}: WaiverDialogProps) {
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isQuotaExhausted = waiverUsage.remaining <= 0;
  const isPhraseValid = confirmationPhrase.trim().toLowerCase() === 'i accept this waiver';

  const handleConfirm = async () => {
    if (isQuotaExhausted || !isPhraseValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await waiveCommitmentAction(commitmentId, confirmationPhrase);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to apply waiver.');
        setIsSubmitting(false);
        return;
      }

      setConfirmationPhrase('');
      onSuccess();
      onClose();
    } catch {
      setErrorMessage('An unexpected error occurred while applying the waiver.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setConfirmationPhrase('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Weekly Waiver"
      description={`Task: "${taskTitle}"`}
      size="md"
    >
      <div className="space-y-4 text-sm text-zinc-300">
        {/* Quota Horizon Banner */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#d4af37]" />
              Weekly Quota
            </span>
            <span className="font-mono text-[#d4af37]">
              {waiverUsage.remaining} of {waiverUsage.max} left
            </span>
          </div>

          <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isQuotaExhausted ? 'bg-rose-500' : 'bg-[#d4af37]'
              }`}
              style={{ width: `${(waiverUsage.used / waiverUsage.max) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
            <span>Week {waiverUsage.weekNumber}, {waiverUsage.weekYear}</span>
            <span>{waiverUsage.resetText}</span>
          </div>
        </div>

        {/* Informational Guidance */}
        <p className="text-xs text-zinc-400 leading-relaxed">
          Waivers exist for genuine emergencies and unavoidable scheduling conflicts. Waived
          commitments are recorded in your permanent historical follow-through record.
        </p>

        {isQuotaExhausted ? (
          <Alert variant="danger" title="Quota Exhausted">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                You have used all {waiverUsage.max} waivers for this calendar week. This commitment
                must be resolved through verification.
              </span>
            </div>
          </Alert>
        ) : (
          <div className="space-y-2 pt-1">
            <label
              htmlFor="waiver-confirmation-input"
              className="block text-xs font-medium text-zinc-300"
            >
              To confirm this waiver, please type <span className="font-semibold text-zinc-100">&quot;I accept this waiver&quot;</span>:
            </label>
            <input
              id="waiver-confirmation-input"
              type="text"
              value={confirmationPhrase}
              onChange={(e) => setConfirmationPhrase(e.target.value)}
              placeholder="I accept this waiver"
              disabled={isSubmitting}
              className="w-full rounded-xl border border-white/[0.12] bg-black/40 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-[#d4af37] focus:outline-none"
              autoComplete="off"
            />
          </div>
        )}

        {errorMessage && (
          <Alert variant="danger">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          </Alert>
        )}
      </div>

      <ModalFooter>
        <Button variant="ghost" size="sm" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleConfirm}
          disabled={isQuotaExhausted || !isPhraseValid || isSubmitting}
          loading={isSubmitting}
        >
          <span>Apply Waiver ({waiverUsage.used + 1}/{waiverUsage.max})</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
