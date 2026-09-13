'use client';

import React from 'react';
import { User, ShieldAlert, Key, Blocks, Bell, Database, BookOpen } from 'lucide-react';

export type SettingsTab =
  | 'profile'
  | 'review'
  | 'accountability'
  | 'security'
  | 'integrations'
  | 'notifications'
  | 'data'
  | 'diagnostics'
  | 'governance';

export interface SettingsNavProps {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
}

interface TabItem {
  id: SettingsTab;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabItem[] = [
  {
    id: 'profile',
    label: 'Profile & Timezone',
    icon: User,
    description: 'Name, avatar & authoritative IANA timezone',
  },
  {
    id: 'review',
    label: 'Weekly Review Ritual',
    icon: BookOpen,
    description: 'Sunday review, outcome audit & next week plan',
  },
  {
    id: 'accountability',
    label: 'Accountability Rules',
    icon: ShieldAlert,
    description: 'Default consequence & auto-apply preferences',
  },
  {
    id: 'security',
    label: 'Account & Security',
    icon: Key,
    description: 'Email, authentication provider & password',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Blocks,
    description: 'GitHub, Codeforces & LeetCode connectors',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Daily planning & deadline alert preferences',
  },
  {
    id: 'data',
    label: 'Data & Privacy',
    icon: Database,
    description: 'Export structured JSON and CSV archives',
  },
  {
    id: 'diagnostics',
    label: 'System Diagnostics',
    icon: Blocks,
    description: 'Live latency, memory stats & rate limits',
  },
  {
    id: 'governance',
    label: 'Account Governance',
    icon: ShieldAlert,
    description: 'Audit trail, cache quota & account purge',
  },
];


export function SettingsNav({ activeTab, onSelectTab }: SettingsNavProps) {
  return (
    <div className="w-full">
      {/* Desktop / Tablet Vertical Navigation */}
      <nav aria-label="Settings Sections" className="space-y-1.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`w-full text-left px-4 py-3 rounded-2xl transition-all flex items-start gap-3.5 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37] ${
                isActive
                  ? 'bg-gradient-to-r from-[#181820] to-[#121217] border border-[#d4af37]/40 shadow-lg shadow-black/40 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <div
                className={`p-2 rounded-xl transition-colors shrink-0 ${
                  isActive
                    ? 'bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30'
                    : 'bg-zinc-900/60 text-zinc-400 group-hover:text-zinc-300 border border-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium leading-none ${
                      isActive ? 'text-zinc-100 font-semibold' : 'text-zinc-300'
                    }`}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-sm shadow-[#d4af37]" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 truncate">
                  {tab.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
