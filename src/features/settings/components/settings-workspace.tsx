'use client';

import React, { useState } from 'react';
import { SettingsOverviewData } from '@/types/domain';
import { SettingsNav, SettingsTab } from './settings-nav';
import { ProfileSettingsCard } from './profile-settings-card';
import { AccountabilitySettingsCard } from './accountability-settings-card';
import { SecuritySettingsCard } from './security-settings-card';
import { IntegrationsSettingsCard } from './integrations-settings-card';
import { NotificationSettingsCard } from './notification-settings-card';
import { Settings } from 'lucide-react';

export interface SettingsWorkspaceProps {
  initialData: SettingsOverviewData;
}

export function SettingsWorkspace({ initialData }: SettingsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#e2c056] shadow-sm">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
                Settings & Preferences
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Manage your profile, authoritative IANA timezone, accountability rules, and integrations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Navigation Tabs (4 cols on lg) */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="glass-card rounded-3xl p-4 sm:p-5 shadow-xl shadow-black/40">
            <SettingsNav
              activeTab={activeTab}
              onSelectTab={(tab) => setActiveTab(tab)}
            />
          </div>
        </div>

        {/* Right Column: Active Setting Panel (8 cols on lg) */}
        <div className="lg:col-span-8 min-w-0">
          {activeTab === 'profile' && (
            <ProfileSettingsCard profile={initialData.profile} />
          )}

          {activeTab === 'accountability' && (
            <AccountabilitySettingsCard
              preferences={initialData.accountabilityPreferences}
              consequences={initialData.consequenceDefinitions}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySettingsCard
              account={initialData.account}
              timezone={initialData.profile.timezone}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsSettingsCard integrations={initialData.integrations} />
          )}

          {activeTab === 'notifications' && (
            <NotificationSettingsCard
              notifications={initialData.notifications}
            />
          )}
        </div>
      </div>
    </div>
  );
}
