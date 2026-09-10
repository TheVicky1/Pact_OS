'use client';

import React from 'react';
import { SessionTimerModal } from './session-timer-modal';
import { DeclarationModal } from './declaration-modal';
import { VerificationConfig } from '@/types/domain';

export interface CustomVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitmentId: string;
  taskTitle: string;
  actionStatement: string;
  verificationConfig?: VerificationConfig;
  onSuccess: () => void;
}

/**
 * PACT Custom Verification Safe Wrapper
 * Constrains custom verification to safe, supported paradigms (declaration or timed session)
 * strictly prohibiting arbitrary code, SQL execution, external webhooks, or third-party network calls.
 */
export function CustomVerificationModal({
  isOpen,
  onClose,
  commitmentId,
  taskTitle,
  actionStatement,
  verificationConfig = {},
  onSuccess,
}: CustomVerificationModalProps) {
  // If configuration specifies a timed duration, delegate to timed session; otherwise use declaration
  const requiredSeconds = typeof verificationConfig.required_duration_seconds === 'number'
    ? verificationConfig.required_duration_seconds
    : null;

  if (requiredSeconds && requiredSeconds > 0) {
    return (
      <SessionTimerModal
        isOpen={isOpen}
        onClose={onClose}
        commitmentId={commitmentId}
        taskTitle={taskTitle}
        actionStatement={actionStatement}
        requiredDurationSeconds={requiredSeconds}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <DeclarationModal
      isOpen={isOpen}
      onClose={onClose}
      commitmentId={commitmentId}
      taskTitle={taskTitle}
      actionStatement={actionStatement}
      onSuccess={onSuccess}
    />
  );
}
