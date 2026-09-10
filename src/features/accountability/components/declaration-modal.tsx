'use client';

import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { declareFulfillmentAction } from '../actions';
import { CheckSquare, Shield, Check } from 'lucide-react';

export interface DeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentId: string;
  taskTitle: string;
  actionStatement: string;
  onSuccess: () => void;
}

/**
 * PACT Declaration Resolution Modal
 * Formal self-attestation flow for commitments verified via declaration.
 * Honestly records resolution as "Self-Declared" in the audit log.
 */
export function DeclarationModal({
  isOpen,
  onClose,
  commitmentId,
  taskTitle,
  actionStatement,
  onSuccess,
}: DeclarationModalProps) {
  const [isAffirmed, setIsAffirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const declarationCopy =
    'I hereby affirm that I have executed the agreed action statement in full.';

  const handleSubmit = async () => {
    if (!isAffirmed) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await declareFulfillmentAction(commitmentId, declarationCopy);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record declaration.');
        setIsSubmitting(false);
        return;
      }

      setIsAffirmed(false);
      onSuccess();
      onClose();
    } catch {
      setErrorMessage('An unexpected error occurred while recording your declaration.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsAffirmed(false);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Declaration Attestation"
      description={`Task: "${taskTitle}"`}
      size="md"
    >
      <div className="space-y-4 text-sm text-zinc-300">
        {/* Consequence Action Statement */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37]">
            Agreed Action Statement
          </span>
          <p className="text-sm font-medium text-zinc-100 mt-1">
            {actionStatement || 'Perform the agreed real-world accountability action.'}
          </p>
        </div>

        {/* Deliberate Affirmation Checkbox */}
        <label
          htmlFor="declaration-checkbox"
          className="flex items-start gap-3 p-4 rounded-2xl border border-white/[0.12] bg-black/40 hover:bg-black/60 transition-colors cursor-pointer"
        >
          <div className="relative flex items-center justify-center shrink-0 mt-0.5">
            <input
              id="declaration-checkbox"
              type="checkbox"
              checked={isAffirmed}
              onChange={(e) => setIsAffirmed(e.target.checked)}
              disabled={isSubmitting}
              className="sr-only"
            />
            <div
              className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-colors ${
                isAffirmed
                  ? 'border-[#d4af37] bg-[#d4af37] text-black'
                  : 'border-white/30 bg-white/5'
              }`}
            >
              {isAffirmed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
            </div>
          </div>
          <div className="text-xs text-zinc-200 leading-relaxed select-none">
            <p className="font-semibold text-zinc-100 mb-0.5">Formal Affirmation</p>
            <span>{declarationCopy}</span>
          </div>
        </label>

        {/* Honest Disclosure */}
        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-zinc-400 leading-relaxed">
          <Shield className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <span>
            <strong>Transparency Notice:</strong> This resolution is recorded as a{' '}
            <strong>Self-Declaration</strong> in your permanent accountability audit log. PACT does
            not independently verify real-world actions.
          </span>
        </div>

        {errorMessage && (
          <Alert variant="danger">
            <span>{errorMessage}</span>
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
          onClick={handleSubmit}
          disabled={!isAffirmed || isSubmitting}
          loading={isSubmitting}
        >
          <CheckSquare className="h-3.5 w-3.5 mr-1.5" />
          <span>Record Declaration</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
