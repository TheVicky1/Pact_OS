'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  startSessionAction,
  fulfillSessionAction,
  cancelSessionAction,
} from '../actions';
import { Play, CheckCircle2, RotateCcw, Shield, Clock } from 'lucide-react';

export interface SessionTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentId: string;
  taskTitle: string;
  actionStatement: string;
  requiredDurationSeconds?: number;
  onSuccess: () => void;
}

export function SessionTimerModal({
  isOpen,
  onClose,
  commitmentId,
  taskTitle,
  actionStatement,
  requiredDurationSeconds = 1800,
  onSuccess,
}: SessionTimerModalProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceNote, setEvidenceNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate remaining seconds
  const remainingSeconds = Math.max(0, requiredDurationSeconds - elapsedSeconds);
  const isTargetReached = elapsedSeconds >= requiredDurationSeconds;

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  // Timer interval
  useEffect(() => {
    if (isActive && startedAtMs) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const diffSec = Math.floor((now - startedAtMs) / 1000);
        setElapsedSeconds(diffSec);
      }, 500);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, startedAtMs]);

  // Cleanup on close
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setIsActive(false);
    setSessionId(null);
    setStartedAtMs(null);
    setElapsedSeconds(0);
    setEvidenceNote('');
    setErrorMessage(null);
    onClose();
  }, [isSubmitting, onClose]);

  // Start or resume session
  const handleStartSession = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await startSessionAction(commitmentId);
      if (!res.success || !res.data) {
        setErrorMessage(res.error || 'Failed to initialize verification session.');
        setIsSubmitting(false);
        return;
      }

      const session = res.data as { id: string; started_at: string };
      setSessionId(session.id);
      const serverStartMs = new Date(session.started_at).getTime();
      setStartedAtMs(serverStartMs);

      const currentDiff = Math.max(0, Math.floor((Date.now() - serverStartMs) / 1000));
      setElapsedSeconds(currentDiff);
      setIsActive(true);
      setIsSubmitting(false);
    } catch {
      setErrorMessage('An unexpected error occurred while starting the session.');
      setIsSubmitting(false);
    }
  };

  // Cancel session
  const handleCancelSession = async () => {
    if (!sessionId) {
      handleClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelSessionAction(sessionId);
      handleClose();
    } catch {
      handleClose();
    }
  };

  // Submit fulfillment
  const handleFulfill = async () => {
    if (!sessionId || !isTargetReached) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fulfillSessionAction(sessionId, evidenceNote.trim() || undefined);
      if (!res.success) {
        setErrorMessage(res.error || 'Verification fulfillment was rejected by the server.');
        setIsSubmitting(false);
        return;
      }

      onSuccess();
      handleClose();
    } catch {
      setErrorMessage('An unexpected error occurred while verifying the session.');
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Timed Verification Session"
      description={`Task: "${taskTitle}"`}
      size="lg"
    >
      <div className="space-y-6 text-sm text-zinc-300">
        {/* Action Statement Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#d4af37]">
            Agreed Consequence
          </span>
          <p className="text-sm font-medium text-zinc-100 mt-1">
            {actionStatement || 'Complete the designated focus session without distraction.'}
          </p>
        </div>

        {/* Minimalist Countdown Display */}
        <div className="flex flex-col items-center justify-center py-6 px-4 rounded-3xl border border-white/[0.06] bg-black/40 text-center">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-2">
            <Clock className="h-4 w-4 text-[#d4af37]" />
            <span>
              {isTargetReached ? 'Required Duration Completed' : 'Session Countdown'}
            </span>
          </div>

          <div className="font-mono text-5xl sm:text-6xl font-light tracking-tight text-zinc-100 tabular-nums">
            {formatTime(isTargetReached ? elapsedSeconds : remainingSeconds)}
          </div>

          <p className="text-xs text-zinc-500 mt-2">
            Target Duration: {formatTime(requiredDurationSeconds)} (Server Authoritative)
          </p>

          {!isActive && !isTargetReached && (
            <div className="mt-5">
              <Button
                variant="primary"
                size="md"
                onClick={handleStartSession}
                loading={isSubmitting}
                className="shadow-lg shadow-[#d4af37]/15"
              >
                <Play className="h-4 w-4 mr-2" />
                <span>Begin Verification Session</span>
              </Button>
            </div>
          )}

          {isActive && !isTargetReached && (
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Session in progress</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelSession}
                disabled={isSubmitting}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                <span>Cancel Session</span>
              </Button>
            </div>
          )}
        </div>

        {/* Evidence Synthesis Note Form (Enabled once target reached) */}
        {isTargetReached && (
          <div className="space-y-2 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              <span>Target Duration Met. Record Synthesis Note:</span>
            </div>
            <textarea
              value={evidenceNote}
              onChange={(e) => setEvidenceNote(e.target.value)}
              placeholder="Summarize what you accomplished or studied during this session..."
              rows={3}
              maxLength={5000}
              className="w-full rounded-xl border border-white/[0.12] bg-black/50 p-3 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:border-emerald-500 focus:outline-none"
            />
          </div>
        )}

        {/* Honest Disclosure */}
        <div className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-zinc-400 leading-relaxed">
          <Shield className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <span>
            <strong>Honest Verification Notice:</strong> PACT measures elapsed server session duration.
            PACT does not monitor your screen, webcam, or physical activity.
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
          Close
        </Button>
        {isTargetReached && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleFulfill}
            loading={isSubmitting}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            <span>Submit Verification</span>
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
