'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type QuickActionType = 'create_task' | 'create_goal' | 'create_project' | 'log_expense' | 'log_income';

interface CommandCenterContextValue {
  isOpen: boolean;
  openCommandCenter: () => void;
  closeCommandCenter: () => void;
  toggleCommandCenter: () => void;
  activeQuickAction: QuickActionType | null;
  triggerQuickAction: (action: QuickActionType) => void;
  closeQuickAction: () => void;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

export function CommandCenterProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<QuickActionType | null>(null);

  const openCommandCenter = useCallback(() => {
    setActiveQuickAction(null);
    setIsOpen(true);
  }, []);

  const closeCommandCenter = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleCommandCenter = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const triggerQuickAction = useCallback((action: QuickActionType) => {
    setIsOpen(false);
    setActiveQuickAction(action);
  }, []);

  const closeQuickAction = useCallback(() => {
    setActiveQuickAction(null);
  }, []);

  // Global keyboard shortcut: Cmd+K (macOS) or Ctrl+K (Windows/Linux)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable element unless holding Cmd/Ctrl
      const isMetaK = (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K');

      if (isMetaK) {
        e.preventDefault();
        toggleCommandCenter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandCenter]);

  return (
    <CommandCenterContext.Provider
      value={{
        isOpen,
        openCommandCenter,
        closeCommandCenter,
        toggleCommandCenter,
        activeQuickAction,
        triggerQuickAction,
        closeQuickAction,
      }}
    >
      {children}
    </CommandCenterContext.Provider>
  );
}

export function useCommandCenter() {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error('useCommandCenter must be used within a CommandCenterProvider');
  }
  return context;
}
