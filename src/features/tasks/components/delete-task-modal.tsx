'use client';

import React from 'react';
import { Modal, ModalFooter, Button } from '@/components/ui';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  taskTitle: string;
  isDeleting: boolean;
}

/**
 * PACT Commitment Deletion Modal
 * Compliant with Phase 4B/4F accessible modal and design system tokens.
 */
export function DeleteTaskModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  isDeleting,
}: DeleteTaskModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Commitment"
      description="This action removes the commitment from your operating system."
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl border border-red-500/20 bg-red-500/[0.06] text-red-300 text-xs leading-relaxed">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
          <div>
            <p className="font-semibold text-red-200">
              Are you sure you want to permanently delete this commitment?
            </p>
            <p className="mt-1 text-zinc-400">
              Any attached accountability records or historical log entries tied to this commitment will be removed.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-white/[0.08] bg-zinc-950/80">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">
            Commitment Title
          </span>
          <p className="text-sm font-semibold text-zinc-100 line-clamp-2">
            &ldquo;{taskTitle}&rdquo;
          </p>
        </div>

        <ModalFooter className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            size="md"
            type="button"
            onClick={onConfirm}
            loading={isDeleting}
            icon={<Trash2 className="w-4 h-4 text-white" />}
          >
            Delete Commitment
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}
