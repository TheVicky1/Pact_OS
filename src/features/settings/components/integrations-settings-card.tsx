'use client';

import React, { useState } from 'react';
import { IntegrationStatus, IntegrationProviderId } from '@/types/domain';
import {
  Blocks,
  GitBranch,
  Code2,
  Terminal,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface IntegrationsSettingsCardProps {
  integrations: IntegrationStatus[];
}

export function IntegrationsSettingsCard({
  integrations,
}: IntegrationsSettingsCardProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<IntegrationProviderId | null>(null);

  const getProviderIcon = (id: IntegrationProviderId) => {
    switch (id) {
      case 'github':
        return <GitBranch className="w-5 h-5 text-zinc-100" />;
      case 'codeforces':
        return <Terminal className="w-5 h-5 text-blue-400" />;
      case 'leetcode':
        return <Code2 className="w-5 h-5 text-amber-400" />;
      default:
        return <Blocks className="w-5 h-5 text-[#d4af37]" />;
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
            <Blocks className="w-5 h-5 text-[#d4af37]" />
            External Integrations
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Modular sync connectors for developer and competitive programming platforms.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217] border border-white/[0.06] text-xs text-zinc-300 self-start sm:self-auto">
          <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>100% Optional</span>
        </div>
      </div>

      {/* Architectural Guarantees Callout */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#14141c] to-[#0e0e14] border border-[#d4af37]/30 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-semibold text-zinc-100 uppercase tracking-wider">
            PACT Integration Architecture Principles
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Integrations are fully decoupled from core application state. The system operates with zero hard dependencies. When disconnected, no fake metrics or sample data are ever fabricated.
        </p>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 gap-4">
        {integrations.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] hover:border-white/[0.14] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-[#121217] border border-white/[0.08] shrink-0">
                {getProviderIcon(item.id)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {item.name}
                  </h3>
                  {item.isConnected ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.06] text-[11px] font-medium">
                      Not Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 max-w-lg leading-relaxed">
                  {item.description}
                </p>
                {item.isConnected && item.accountHandle && (
                  <div className="text-xs text-zinc-400 pt-1">
                    Handle: <span className="font-mono text-zinc-300">@{item.accountHandle}</span>
                    {item.lastSyncedAt && ` · Synced: ${new Date(item.lastSyncedAt).toLocaleTimeString()}`}
                  </div>
                )}
              </div>
            </div>

            <div className="self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setSelectedProvider(item.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  item.isConnected
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/[0.08]'
                    : 'bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#e2c056] border border-[#d4af37]/40'
                }`}
              >
                <span>{item.isConnected ? 'Configure' : 'Connect'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Connection Guidance Dialog / Modal */}
      {selectedProvider && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="connector-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-3xl bg-[#0e0e14] border border-white/[0.1] shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#121217] border border-white/[0.08]">
                  {getProviderIcon(selectedProvider)}
                </div>
                <div>
                  <h3 id="connector-modal-title" className="text-base font-semibold text-zinc-100 capitalize">
                    {selectedProvider} Integration Connector
                  </h3>
                  <span className="text-xs text-zinc-400">
                    Encrypted OAuth Sync Pipeline
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-[#121217] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-[#e2c056] font-semibold">
                  <Lock className="w-4 h-4" />
                  <span>Security & Token Safety</span>
                </div>
                <p>
                  Per PACT Integration Security architecture, third-party access tokens and webhook secrets are stored encrypted in dedicated PostgreSQL tables and never transmitted to the browser client.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#121217] border border-white/[0.06] space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Automated Activity Sync</span>
                </div>
                <p>
                  Once connected, your latest problem submissions, daily streaks, or repository commit volume will automatically sync every 6 hours and display on your Planner and Analytics workspaces.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
