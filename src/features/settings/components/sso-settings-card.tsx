'use client';

import React, { useState } from 'react';
import { SsoProviderType, SsoWorkspaceRole } from '@/lib/auth/sso-engine';
import { saveSsoProviderAction } from '@/features/auth/sso-actions';
import { ShieldCheck, Lock, Globe, KeyRound, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function SsoSettingsCard() {
  const [domain, setDomain] = useState('');
  const [providerType, setProviderType] = useState<SsoProviderType>('OIDC');
  const [issuerUrl, setIssuerUrl] = useState('');
  const [clientId, setClientId] = useState('');
  const [samlMetadataUrl, setSamlMetadataUrl] = useState('');
  const [defaultRole, setDefaultRole] = useState<SsoWorkspaceRole>('member');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await saveSsoProviderAction({
        domain,
        providerType,
        issuerUrl,
        clientId,
        samlMetadataUrl: samlMetadataUrl || null,
        defaultRole,
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: `Enterprise SSO configured for @${domain}. Employees can now authenticate via corporate IdP.`,
        });
      } else {
        setMessage({ type: 'error', text: res.error || 'Failed to save SSO configuration' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network communication error saving SSO settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/[0.06] bg-[#121217]/80 space-y-6 shadow-xl shadow-black/40">
      <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.06]">
        <div className="p-3 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#e2c056] shadow-sm">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-100">Enterprise Single Sign-On (SSO)</h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Integrate Microsoft Entra ID, Okta, or Google Workspace via OIDC & SAML 2.0.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-start gap-3">
        <Lock className="w-5 h-5 text-[#e2c056] shrink-0 mt-0.5" />
        <p className="text-xs text-zinc-300 leading-relaxed">
          <strong className="text-zinc-100">Enterprise Security Invariant:</strong> Client secrets and certificate keys are server-authoritative and never exposed to client-side bundles. Domain verification and replay tokens protect against rogue takeovers.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center gap-3 text-xs ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Corporate Email Domain
          </label>
          <div className="relative">
            <Globe className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="e.g. acme-corp.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Protocol Type
            </label>
            <select
              value={providerType}
              onChange={(e) => setProviderType(e.target.value as SsoProviderType)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-zinc-100 focus:outline-none focus:border-[#d4af37]/50"
            >
              <option value="OIDC">OpenID Connect (OIDC)</option>
              <option value="SAML2">SAML 2.0 Metadata</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Default Workspace Role
            </label>
            <select
              value={defaultRole}
              onChange={(e) => setDefaultRole(e.target.value as SsoWorkspaceRole)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-zinc-100 focus:outline-none focus:border-[#d4af37]/50"
            >
              <option value="member">Member</option>
              <option value="observer">Observer (Read-Only)</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Identity Issuer URL / Discovery Endpoint
          </label>
          <input
            type="url"
            required
            placeholder="https://login.microsoftonline.com/{tenant_id}/v2.0"
            value={issuerUrl}
            onChange={(e) => setIssuerUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
            Client ID / Application ID
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 00000000-0000-0000-0000-000000000000"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/50"
          />
        </div>

        {providerType === 'SAML2' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              SAML Metadata URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://identity.provider.com/saml/metadata"
              value={samlMetadataUrl}
              onChange={(e) => setSamlMetadataUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e2c056] text-black font-semibold text-sm hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-[#d4af37]/20 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Configuring IdP...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save SSO Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
