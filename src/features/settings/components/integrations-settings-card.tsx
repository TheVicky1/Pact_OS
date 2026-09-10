'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IntegrationStatus, IntegrationProviderId, GoogleCalendarIntegrationStatus } from '@/types/domain';
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
  Calendar,
  RefreshCw,
  AlertCircle,
  Unlink,
} from 'lucide-react';
import {
  getGoogleCalendarStatusAction,
  triggerGoogleCalendarSyncAction,
  disconnectGoogleCalendarAction,
} from '@/features/calendar/google-actions';
import { createClient } from '@/lib/supabase/client';

export interface IntegrationsSettingsCardProps {
  integrations: IntegrationStatus[];
}

export function IntegrationsSettingsCard({
  integrations,
}: IntegrationsSettingsCardProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<IntegrationProviderId | null>(null);

  // Google Calendar Integration State
  const [googleCalStatus, setGoogleCalStatus] = useState<GoogleCalendarIntegrationStatus>({
    connected: false,
    sync_status: 'disconnected',
    calendar_id: null,
    last_synced_at: null,
    last_error: null,
    has_refresh_token: false,
    is_token_valid: false,
  });
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isDisconnectingGoogle, setIsDisconnectingGoogle] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchGoogleStatus = useCallback(async () => {
    try {
      const res = await getGoogleCalendarStatusAction();
      if (res.success && res.data) {
        setGoogleCalStatus(res.data);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const res = await getGoogleCalendarStatusAction();
        if (isMounted && res.success && res.data) {
          setGoogleCalStatus(res.data);
        }
      } catch {
        // Ignored
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleConnectGoogleCalendar = async () => {
    try {
      const supabase = createClient();
      const redirectToUrl = `${window.location.origin}/auth/callback?next=/app/settings`;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToUrl,
          scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    } catch {
      setSyncFeedback({ message: 'Failed to initiate Google authorization.', type: 'error' });
    }
  };

  const handleManualSync = async () => {
    setIsSyncingGoogle(true);
    setSyncFeedback(null);
    try {
      const res = await triggerGoogleCalendarSyncAction();
      if (res.success && res.data) {
        const { importedCount, updatedCount, exportedCount, pushedCount } = res.data;
        const total = importedCount + updatedCount + exportedCount + pushedCount;
        setSyncFeedback({
          message: total > 0 ? `Sync complete: ${total} change(s) synchronized.` : 'Sync complete: Calendar is up to date.',
          type: 'success',
        });
        await fetchGoogleStatus();
      } else {
        setSyncFeedback({
          message: res.error || 'Synchronization failed.',
          type: 'error',
        });
      }
    } catch {
      setSyncFeedback({ message: 'Failed to synchronize with Google Calendar.', type: 'error' });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect Google Calendar?')) return;
    setIsDisconnectingGoogle(true);
    setSyncFeedback(null);
    try {
      const res = await disconnectGoogleCalendarAction();
      if (res.success) {
        setSyncFeedback({ message: 'Google Calendar disconnected successfully.', type: 'success' });
        await fetchGoogleStatus();
      } else {
        setSyncFeedback({ message: res.error || 'Failed to disconnect.', type: 'error' });
      }
    } catch {
      setSyncFeedback({ message: 'Failed to disconnect Google Calendar.', type: 'error' });
    } finally {
      setIsDisconnectingGoogle(false);
    }
  };

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
            External Integrations & Sync
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Bi-directional calendar synchronization and developer progress connectors.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217] border border-white/[0.06] text-xs text-zinc-300 self-start sm:self-auto">
          <Layers className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>100% Optional</span>
        </div>
      </div>

      {/* Google Calendar Bi-directional Sync Section */}
      <div className="p-6 rounded-2xl bg-zinc-900/80 border border-white/[0.08] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-[#121217] border border-white/[0.08] shrink-0 text-[#d4af37]">
              <Calendar className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-semibold text-zinc-100">
                  Google Calendar
                </h3>
                {googleCalStatus.connected ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bi-directional Sync Active
                  </span>
                ) : googleCalStatus.sync_status === 'revoked' ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Access Revoked
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/[0.06] text-xs font-medium">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Bi-directionally sync your scheduled timeblocks with Google Calendar. PACT events export to your Google Calendar, and external meetings import into Day and Week Planner views.
              </p>
              {googleCalStatus.connected && googleCalStatus.last_synced_at && (
                <div className="text-xs text-zinc-400 pt-1 flex items-center gap-2">
                  <span>Last synced: <strong className="text-zinc-200">{new Date(googleCalStatus.last_synced_at).toLocaleTimeString()}</strong></span>
                  <span>·</span>
                  <span>Calendar: <strong className="text-zinc-200 font-mono">{googleCalStatus.calendar_id || 'primary'}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {googleCalStatus.connected ? (
              <>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncingGoogle}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#121217] hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] hover:border-white/[0.16] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  aria-label="Sync Google Calendar Now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#d4af37] ${isSyncingGoogle ? 'animate-spin' : ''}`} />
                  <span>{isSyncingGoogle ? 'Syncing...' : 'Sync Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  disabled={isDisconnectingGoogle}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-white/[0.06] hover:border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  aria-label="Disconnect Google Calendar"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogleCalendar}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#e2c056] border border-[#d4af37]/40 transition-all cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <span>Connect Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sync Feedback Alert */}
        {syncFeedback && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              syncFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
        )}
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
