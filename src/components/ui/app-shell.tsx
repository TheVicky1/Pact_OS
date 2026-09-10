import React from 'react';
import { AppHeader } from './app-header';
import { CanvasAmbientLight } from './ambient-glow';
import { CommandCenterWrapper } from '@/features/command-center';

export interface AppShellProps {
  userName?: string;
  timezone?: string;
  children: React.ReactNode;
}

/**
 * PACT AppShell Primitive
 * Authoritative shell establishing the visual atmosphere, sticky navigation header,
 * ambient background depth, global Command Center, and consistent page boundaries.
 */
export function AppShell({
  userName,
  timezone,
  children,
}: AppShellProps) {
  return (
    <CommandCenterWrapper timezone={timezone}>
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-[#d4af37]/30 selection:text-zinc-100 relative overflow-x-hidden">
        {/* Cinematic Top Ambient Glow */}
        <CanvasAmbientLight />

        {/* Global Application Header */}
        <AppHeader userName={userName} timezone={timezone} />

        {/* Main Content Area */}
        <div className="flex-1 w-full relative z-10 flex flex-col">
          {children}
        </div>
      </div>
    </CommandCenterWrapper>
  );
}
