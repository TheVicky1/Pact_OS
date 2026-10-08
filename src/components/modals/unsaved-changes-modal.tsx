
'use client';

import React, { useEffect, useRef } from 'react';
import { createFocusTrap } from '@/lib/a11y/focus-trap';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirmDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onConfirmDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const cleanup = createFocusTrap(modalRef.current, onCancel);

    return () => {
      document.body.style.overflow = previousOverflow;
      cleanup();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-description"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-100 shadow-2xl"
      >
        <h2
          id="unsaved-changes-title"
          className="text-lg font-semibold"
        >
          Unsaved Changes
        </h2>

        <p
          id="unsaved-changes-description"
          className="mt-3 text-sm text-neutral-300"
        >
          You have unsaved changes. Are you sure you want to leave?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
          >
            Keep Editing
          </button>

          <button
            type="button"
            onClick={onConfirmDiscard}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Discard Changes
          </button>
        </div>
      </div>
    </div>
  );
}
