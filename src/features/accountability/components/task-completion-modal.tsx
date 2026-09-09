'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { fulfillTaskCompletionAction, getCompletedTasksAction } from '../actions';
import { CheckCircle, Shield, Check } from 'lucide-react';
import { utcToLocal } from '@/lib/time';

export interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentId: string;
  missedTaskId: string;
  taskTitle: string;
  actionStatement: string;
  timezone: string;
  onSuccess: () => void;
}

interface CompletedTaskItem {
  id: string;
  title: string;
  completed_at: string | null;
}

/**
 * PACT Task Completion Resolution Modal
 * Links a previously completed PACT task as objective proof of resolution.
 */
export function TaskCompletionModal({
  isOpen,
  onClose,
  commitmentId,
  missedTaskId,
  taskTitle,
  actionStatement,
  timezone,
  onSuccess,
}: TaskCompletionModalProps) {
  const [completedTasks, setCompletedTasks] = useState<CompletedTaskItem[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    getCompletedTasksAction(missedTaskId)
      .then((res) => {
        if (!isCancelled) {
          if (res.success) {
            setCompletedTasks(res.data);
          } else {
            setErrorMessage(res.error || 'Failed to load completed tasks.');
          }
          setHasLoaded(true);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setErrorMessage('Failed to load completed tasks.');
          setHasLoaded(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, missedTaskId]);

  const handleSubmit = async () => {
    if (!selectedTaskId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fulfillTaskCompletionAction(commitmentId, selectedTaskId);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to verify task completion.');
        setIsSubmitting(false);
        return;
      }

      setSelectedTaskId(null);
      onSuccess();
      onClose();
    } catch {
      setErrorMessage('An unexpected error occurred while linking completed task.');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedTaskId(null);
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Verify via Completed Task"
      description={`Missed: "${taskTitle}"`}
      size="md"
    >
      <div className="space-y-4 text-sm text-zinc-300">
        {/* Action Statement */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37]">
            Agreed Requirement
          </span>
          <p className="text-sm font-medium text-zinc-100 mt-1">
            {actionStatement || 'Complete an alternate verified PACT commitment to resolve.'}
          </p>
        </div>

        {/* Task Selection Area */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-400">
            Select a verified completed task:
          </label>

          {!hasLoaded ? (
            <div className="flex items-center justify-center p-6 text-xs text-zinc-500">
              Loading completed commitments...
            </div>
          ) : completedTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.12] p-6 text-center text-xs text-zinc-400">
              No eligible completed tasks found. Please complete another task first or choose another resolution path.
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
              {completedTasks.map((t) => {
                const isSelected = selectedTaskId === t.id;
                const completedFormatted = t.completed_at
                  ? utcToLocal(t.completed_at, timezone, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : '';

                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#d4af37] bg-[#d4af37]/10 text-zinc-100'
                        : 'border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className="text-xs font-medium truncate">{t.title}</p>
                      {completedFormatted && (
                        <p className="text-[10px] text-zinc-500">Completed {completedFormatted}</p>
                      )}
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-[#d4af37] bg-[#d4af37] text-black'
                          : 'border-white/20'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Honest Disclosure */}
        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-zinc-400 leading-relaxed">
          <Shield className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Objective Verification:</strong> This resolution is validated directly against
            PACT&apos;s authoritative database task completion records.
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
          disabled={!selectedTaskId || isSubmitting}
          loading={isSubmitting}
        >
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          <span>Verify Task Link</span>
        </Button>
      </ModalFooter>
    </Modal>
  );
}
