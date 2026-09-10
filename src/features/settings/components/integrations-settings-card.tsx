'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  IntegrationStatus,
  IntegrationProviderId,
  GoogleCalendarIntegrationStatus,
  ExternalProviderIntegration,
} from '@/types/domain';
import {
  Blocks,
  GitBranch,
  Code2,
  Terminal,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Layers,
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
import {
  getExternalIntegrationsStatusAction,
  linkExternalProviderAction,
  disconnectExternalProviderAction,
} from '@/features/integrations/actions';
import { createClient } from '@/lib/supabase/client';

export interface IntegrationsSettingsCardProps {
  integrations: IntegrationStatus[];
}

export function IntegrationsSettingsCard({
  integrations: initialIntegrations,
}: IntegrationsSettingsCardProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<IntegrationProviderId | null>(null);

  // External Developer Integrations State (GitHub, LeetCode, Codeforces)
  const [externalIntegrations, setExternalIntegrations] = useState<
    Record<string, ExternalProviderIntegration>
  >({});
  const [inputHandle, setInputHandle] = useState('');
  const [inputToken, setInputToken] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [modalFeedback, setModalFeedback] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

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

  const fetchStatuses = useCallback(async () => {
    try {
      const [googleRes, extRes] = await Promise.all([
        getGoogleCalendarStatusAction(),
        getExternalIntegrationsStatusAction(),
      ]);

      if (googleRes.success && googleRes.data) {
        setGoogleCalStatus(googleRes.data);
      }

      if (extRes.success && extRes.data) {
        const map: Record<string, ExternalProviderIntegration> = {};
        for (const item of extRes.data) {
          map[item.provider] = item;
        }
        setExternalIntegrations(map);
      }
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [googleRes, extRes] = await Promise.all([
          getGoogleCalendarStatusAction(),
          getExternalIntegrationsStatusAction(),
        ]);
        if (isMounted) {
          if (googleRes.success && googleRes.data) {
            setGoogleCalStatus(googleRes.data);
          }
          if (extRes.success && extRes.data) {
            const map: Record<string, ExternalProviderIntegration> = {};
            for (const item of extRes.data) {
              map[item.provider] = item;
            }
            setExternalIntegrations(map);
          }
        }
      } catch {
        // Ignored
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenProviderModal = (providerId: IntegrationProviderId) => {
    setSelectedProvider(providerId);
    setModalFeedback(null);
    const existing = externalIntegrations[providerId];
    setInputHandle(existing?.account_handle || '');
    setInputToken('');
  };

  const handleLinkProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    if (!inputHandle.trim()) {
      setModalFeedback({ message: 'Please enter a valid account handle or username.', type: 'error' });
      return;
    }

    setIsLinking(true);
    setModalFeedback(null);
    try {
      const res = await linkExternalProviderAction(
        selectedProvider as 'github' | 'leetcode' | 'codeforces',
        inputHandle.trim(),
        inputToken.trim() || undefined
      );

      if (res.success && res.data) {
        setModalFeedback({
          message: `Successfully connected @${res.data.account_handle} (${selectedProvider.toUpperCase()}).`,
          type: 'success',
        });
        await fetchStatuses();
        setTimeout(() => {
          setSelectedProvider(null);
        }, 1000);
      } else {
        setModalFeedback({
          message: res.error || 'Failed to verify external account handle.',
          type: 'error',
        });
      }
    } catch {
      setModalFeedback({ message: 'Network error connecting to provider.', type: 'error' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleDisconnectProvider = async () => {
    if (!selectedProvider) return;
    if (!confirm(`Are you sure you want to disconnect ${selectedProvider.toUpperCase()}?`)) return;

    setIsUnlinking(true);
    setModalFeedback(null);
    try {
      const res = await disconnectExternalProviderAction(
        selectedProvider as 'github' | 'leetcode' | 'codeforces'
      );
      if (res.success) {
        setModalFeedback({ message: 'Disconnected successfully.', type: 'success' });
        await fetchStatuses();
        setTimeout(() => {
          setSelectedProvider(null);
        }, 800);
      } else {
        setModalFeedback({ message: res.error || 'Failed to disconnect provider.', type: 'error' });
      }
    } catch {
      setModalFeedback({ message: 'Failed to disconnect provider.', type: 'error' });
    } finally {
      setIsUnlinking(false);
    }
  };

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
        await fetchStatuses();
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
        await fetchStatuses();
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
            Bi-directional calendar synchronization and verifiable proof-of-work connectors.
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
            PACT Proof-of-Work Architecture
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Connect your developer accounts to objectively fulfill accountability commitments via real GitHub commits, PRs, LeetCode problem solves, or Codeforces contest submissions. Tokens are never exposed to the client.
        </p>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 gap-4">
        {initialIntegrations.map((item) => {
          const liveIntegration = externalIntegrations[item.id];
          const isConnected = Boolean(liveIntegration?.account_handle);
          const handle = liveIntegration?.account_handle || item.accountHandle;
          const lastSynced = liveIntegration?.last_verified_at || item.lastSyncedAt;

          return (
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
                    {isConnected ? (
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
                  {isConnected && handle && (
                    <div className="text-xs text-zinc-400 pt-1">
                      Handle: <span className="font-mono text-zinc-200">@{handle}</span>
                      {lastSynced && ` · Verified: ${new Date(lastSynced).toLocaleTimeString()}`}
                    </div>
                  )}
                </div>
              </div>

              <div className="self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenProviderModal(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isConnected
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/[0.08]'
                      : 'bg-[#d4af37]/15 hover:bg-[#d4af37]/25 text-[#e2c056] border border-[#d4af37]/40'
                  }`}
                >
                  <span>{isConnected ? 'Configure' : 'Connect'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Connector Configuration Modal */}
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
                    {selectedProvider} Integration
                  </h3>
                  <span className="text-xs text-zinc-400">
                    External Proof-of-Work Connector
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

            <form onSubmit={handleLinkProvider} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  {selectedProvider === 'github'
                    ? 'GitHub Username'
                    : selectedProvider === 'leetcode'
                    ? 'LeetCode Username'
                    : 'Codeforces Handle'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-500 font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={inputHandle}
                    onChange={(e) => setInputHandle(e.target.value)}
                    placeholder={
                      selectedProvider === 'github'
                        ? 'torvalds'
                        : selectedProvider === 'leetcode'
                        ? 'username'
                        : 'tourist'
                    }
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#121217] border border-white/[0.1] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  {selectedProvider === 'github'
                    ? 'PACT will verify public commit and PR history for this username.'
                    : 'PACT will verify accepted problem submissions on your public profile.'}
                </p>
              </div>

              {selectedProvider === 'github' && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Personal Access Token (Optional)</span>
                    <span className="text-[10px] text-zinc-500 font-normal">For private repositories</span>
                  </label>
                  <input
                    type="password"
                    value={inputToken}
                    onChange={(e) => setInputToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                    className="w-full px-3 py-2 rounded-xl bg-[#121217] border border-white/[0.1] text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-[#d4af37] transition-all"
                  />
                </div>
              )}

              {modalFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    modalFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  )}
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between gap-3">
                {externalIntegrations[selectedProvider]?.account_handle ? (
                  <button
                    type="button"
                    onClick={handleDisconnectProvider}
                    disabled={isUnlinking}
                    className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-300 border border-white/[0.06] hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLinking}
                    className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e2c056] text-black text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLinking ? 'animate-spin' : ''}`} />
                    <span>{isLinking ? 'Verifying...' : 'Save & Link'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
