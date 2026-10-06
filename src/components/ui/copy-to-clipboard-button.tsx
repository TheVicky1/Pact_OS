'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './button';

export const COPY_FEEDBACK_MS = 2000;

/**
 * Writes `text` to the clipboard, flips `setCopied` to true, and schedules the
 * reset after COPY_FEEDBACK_MS. Repeat copies restart the timer.
 * Returns false (leaving state untouched) when the Clipboard API is missing or rejects.
 */
export async function copyWithFeedback(
  text: string,
  setCopied: (copied: boolean) => void,
  timer: { current?: ReturnType<typeof setTimeout> }
): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    return false;
  }
  clearTimeout(timer.current);
  setCopied(true);
  timer.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  return true;
}

export interface CopyToClipboardButtonProps {
  textToCopy: string;
  label?: string;
  successMessage?: string;
  className?: string;
}

export function CopyToClipboardButton({
  textToCopy,
  label,
  successMessage = 'Copied to clipboard',
  className = '',
}: CopyToClipboardButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const Icon = copied ? Check : Copy;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        variant={label ? 'secondary' : 'icon'}
        size="sm"
        aria-label={label ?? 'Copy to clipboard'}
        icon={<Icon className={`w-3.5 h-3.5 ${copied ? 'text-emerald-400' : ''}`} aria-hidden="true" />}
        onClick={() => copyWithFeedback(textToCopy, setCopied, timer)}
      >
        {label}
      </Button>
      <span role="status" aria-live="polite" className="text-xs text-emerald-400">
        {copied ? successMessage : ''}
      </span>
    </span>
  );
}
