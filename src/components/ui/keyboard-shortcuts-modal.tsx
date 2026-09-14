'use client';

/**
 * PACT Phase 12: Global Keyboard Shortcuts Cheat Sheet Modal
 *
 * Triggered via '?' key or Help menu. Displays all active PACT hotkeys.
 */

import React, { useEffect, useState, useRef } from 'react';
import { Command, X, Keyboard } from 'lucide-react';
import { createFocusTrap } from '@/lib/a11y/focus-trap';

interface ShortcutGroup {
  category: string;
  items: Array<{ key: string; description: string }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    category: 'Universal Navigation',
    items: [
      { key: 'Cmd / Ctrl + K', description: 'Open Universal Command Palette' },
      { key: '?', description: 'Open Keyboard Shortcuts Guide' },
      { key: 'Esc', description: 'Close active modal / dialog' },
    ],
  },
  {
    category: 'Workspaces',
    items: [
      { key: 'G then T', description: 'Navigate to Tasks Backlog' },
      { key: 'G then P', description: 'Navigate to Planner' },
      { key: 'G then F', description: 'Navigate to Focus Timer' },
      { key: 'G then H', description: 'Navigate to Habits & Routines' },
      { key: 'G then S', description: 'Navigate to Daily Sunset Ritual' },
    ],
  },
  {
    category: 'Action Hotkeys',
    items: [
      { key: 'C', description: 'Quick-capture new task or commitment' },
      { key: 'Space', description: 'Start / Pause active Focus Timer' },
    ],
  },
];

export function KeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const cleanup = createFocusTrap(modalRef.current, () => setIsOpen(false));
    return cleanup;
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="keyboard-shortcuts-title"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 font-sans select-none animate-in fade-in duration-150"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-6 text-neutral-100"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5 text-amber-400">
            <Keyboard className="w-5 h-5" />
            <h2 id="keyboard-shortcuts-title" className="text-base font-semibold text-neutral-100">
              Keyboard Shortcuts Guide
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close shortcuts guide"
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:ring-offset-1 focus:ring-offset-neutral-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="space-y-2.5">
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
                {group.category}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-xs"
                  >
                    <span className="text-neutral-300">{item.description}</span>
                    <kbd className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 font-mono text-[11px] text-amber-300">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span>Press <kbd className="text-neutral-300">Esc</kbd> to close</span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> PACT OS Core
          </span>
        </div>
      </div>
    </div>
  );
}
