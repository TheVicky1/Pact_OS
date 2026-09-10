'use client';

import React, { useState } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { fulfillWrittenReflectionAction } from '../actions';
import { BookOpen, Shield, Send } from 'lucide-react';

export interface ReflectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentId: string;
  taskTitle: string;
  actionStatement: string;
  onSuccess: () => void;
}

/**
 * PACT Written Reflection Resolution Modal
 * Clean, editorial space for recording honest self-reflection when a commitment is missed.
 * Enforces 20-5,000 character criteria.
 */
export function ReflectionFormModal({
  isOpen,
  onClose,
  commitmentId,
  taskTitle,
  actionStatement,
  onSuccess,
}: ReflectionFormModalProps) {
  const [reflectionText, setReflectionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trimmed = reflectionText.trim();
  const charCount = trimmed.length;
  const isLengthValid = charCount >= 20 && charCount <= 5000;

  const handleSubmit = async () => {
    if (!isLengthValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fulfillWrittenReflectionAction(commitmentId, trimmed);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit reflection.');
        setIsSubmitting(false);
        return;
      }

      setReflectionText('');
      onSuccess();
      onClose();
    } catch {
      setErrorMessage('An unexpected error occurred while submitting your reflection.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setReflectionText('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Written Reflection"
      description={`Task: "${taskTitle}"`}
      size="lg"
    >
      <div className="space-y-4 text-sm text-zinc-300">
        {/* Consequence Prompt Banner */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#d4af37] mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Reflection Prompt</span>
          </div>
          <p className="text-sm font-medium text-zinc-100">
            {actionStatement || 'Reflect on why this commitment was missed and what specific adjustment will prevent recurrence.'}
          </p>
        </div>

        {/* Textarea writing area */}
        <div className="space-y-1.5">
          <label htmlFor="reflection-textarea" className="block text-xs font-medium text-zinc-400">
            Your Reflection (Minimum 20 characters):
          </label>
          <textarea
            id="reflection-textarea"
            value={reflectionText}
            onChange={(e) => setReflectionText(e.target.value)}
            placeholder="Write your honest reflection here. Describe the obstacle encountered and the concrete system adjustment you are making..."
            rows={6}
            maxLength={5000}
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-white/[0.12] bg-black/40 p-4 text-sm text-zinc-100 placeholder-zinc-500 transition-colors focus:border-[#d4af37] focus:outline-none leading-relaxed"
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
            <span>
              {charCount < 20 ? (
                <span className="text-amber-400/90">{20 - charCount} more characters needed</span>
              ) : (
                <span className="text-emerald-400">Criteria met ({charCount} chars)</span>
              )}
            </span>
            <span>{charCount} / 5,000</span>
          </div>
        </div>

        {/* Honest Disclosure */}
        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-zinc-400 leading-relaxed">
          <Shield className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <span>
            <strong>Audit Record Notice:</strong> Reflections are preserved as immutable evidence in your
            accountability audit log. PACT validates submission length and completion, not psychological sincerity.
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
          disabled={!isLengthValid || isSubmitting}
          loading={isSubmitting}
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          <span>Record Reflection</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
