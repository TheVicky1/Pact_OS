'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { UserAccountInfo } from '@/types/domain';
import { updatePasswordAction } from '@/features/settings/actions';
import { signOutAction } from '@/features/auth/actions';
import {
  getPasskeyRegistrationOptionsAction,
  verifyPasskeyRegistrationAction,
  listUserPasskeysAction,
  revokePasskeyAction,
  PasskeyCredentialRecord,
} from '@/features/auth/passkey-actions';
import {
  isWebAuthnSupported,
  base64UrlToArrayBuffer,
  arrayBufferToBase64Url,
  stringToUint8Array,
} from '@/lib/auth/passkeys';
import {
  Key,
  Mail,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Calendar,
  Layers,
  Fingerprint,
  Plus,
  Trash2,
  Smartphone,
} from 'lucide-react';

export interface SecuritySettingsCardProps {
  account: UserAccountInfo;
  timezone: string;
}

export function SecuritySettingsCard({
  account,
  timezone,
}: SecuritySettingsCardProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Passkey State
  const [passkeys, setPasskeys] = useState<PasskeyCredentialRecord[]>([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(true);
  const [passkeyFeedback, setPasskeyFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [showAddPasskeyModal, setShowAddPasskeyModal] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Load passkeys on mount
  useEffect(() => {
    async function loadPasskeys() {
      setLoadingPasskeys(true);
      const res = await listUserPasskeysAction();
      if (res.passkeys) {
        setPasskeys(res.passkeys);
      }
      setLoadingPasskeys(false);
    }
    loadPasskeys();
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 8) {
      setFeedback({
        type: 'error',
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: 'New passwords do not match.',
      });
      return;
    }

    startTransition(async () => {
      const res = await updatePasswordAction({
        newPassword,
        confirmPassword,
      });

      if (res.error) {
        setFeedback({
          type: 'error',
          message: res.error,
        });
      } else {
        setFeedback({
          type: 'success',
          message: 'Password updated successfully.',
        });
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyFeedback(null);

    if (!newDeviceName.trim()) {
      setPasskeyFeedback({
        type: 'error',
        message: 'Please provide a device name (e.g. MacBook Touch ID).',
      });
      return;
    }

    if (!isWebAuthnSupported()) {
      setPasskeyFeedback({
        type: 'error',
        message: 'WebAuthn / Passkeys are not supported on this browser.',
      });
      return;
    }

    setIsRegisteringPasskey(true);

    try {
      // 1. Fetch challenge from server
      const optRes = await getPasskeyRegistrationOptionsAction(newDeviceName.trim());
      if (optRes.error || !optRes.challenge || !optRes.userId) {
        setPasskeyFeedback({
          type: 'error',
          message: optRes.error || 'Failed to initiate passkey registration.',
        });
        setIsRegisteringPasskey(false);
        return;
      }

      // 2. Call browser WebAuthn API
      const challengeBuffer = base64UrlToArrayBuffer(optRes.challenge);
      const userIdBuffer = stringToUint8Array(optRes.userId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challengeBuffer,
          rp: {
            name: 'PACT OS',
            id: optRes.rpId || window.location.hostname,
          },
          user: {
            id: userIdBuffer as unknown as BufferSource,
            name: optRes.userEmail || 'user@pact.local',
            displayName: optRes.userEmail?.split('@')[0] || 'PACT User',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 }, // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as PublicKeyCredential | null;

      if (!credential) {
        throw new Error('Credential creation was cancelled or returned empty.');
      }

      const response = credential.response as AuthenticatorAttestationResponse;
      const publicKeyBuffer = response.getPublicKey ? response.getPublicKey() : response.attestationObject;
      const publicKeyBase64 = publicKeyBuffer ? arrayBufferToBase64Url(publicKeyBuffer) : arrayBufferToBase64Url(response.attestationObject);
      const credentialId = credential.id;

      // 3. Verify and store on server
      const verifyRes = await verifyPasskeyRegistrationAction({
        challenge: optRes.challenge,
        credentialId,
        publicKey: publicKeyBase64,
        deviceName: newDeviceName.trim(),
        transports: credential.response ? (response.getTransports ? response.getTransports() : []) : [],
      });

      if (verifyRes.error) {
        setPasskeyFeedback({
          type: 'error',
          message: verifyRes.error,
        });
      } else {
        setPasskeyFeedback({
          type: 'success',
          message: `Passkey "${newDeviceName}" successfully registered.`,
        });
        setNewDeviceName('');
        setShowAddPasskeyModal(false);

        // Refresh list
        const refresh = await listUserPasskeysAction();
        if (refresh.passkeys) {
          setPasskeys(refresh.passkeys);
        }
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : 'Passkey registration cancelled or failed.';
      setPasskeyFeedback({
        type: 'error',
        message: errMessage,
      });
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleRevokePasskey = async (credentialId: string) => {
    setPasskeyFeedback(null);
    startTransition(async () => {
      const res = await revokePasskeyAction(credentialId);
      if (res.error) {
        setPasskeyFeedback({
          type: 'error',
          message: res.error,
        });
      } else {
        setPasskeyFeedback({
          type: 'success',
          message: 'Passkey credential revoked successfully.',
        });
        setPasskeys((prev) => prev.filter((p) => p.credential_id !== credentialId));
      }
    });
  };

  const formattedCreatedAt = account.createdAt
    ? new Date(account.createdAt).toLocaleDateString('en-US', {
        timeZone: timezone || 'UTC',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
            <Key className="w-5 h-5 text-[#d4af37]" />
            Account & Security
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Manage your credentials, passkeys, authentication provider, and session status.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217] border border-white/[0.06] text-xs text-zinc-300 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted Session</span>
        </div>
      </div>

      {/* Account Identity Card */}
      <div className="p-5 rounded-2xl bg-[#121217]/80 border border-white/[0.06] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-800 text-zinc-300 border border-white/[0.06]">
              <Mail className="w-4 h-4 text-[#d4af37]" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
                Primary Email
              </span>
              <span className="text-sm font-semibold text-zinc-100 font-mono">
                {account.email || 'No email attached'}
              </span>
            </div>
          </div>

          <div className="self-start sm:self-auto">
            {account.provider === 'google' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Google OAuth
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-white/[0.08] text-xs font-medium">
                <Lock className="w-3 h-3 text-[#d4af37]" />
                Email & Password
              </span>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Member Since: {formattedCreatedAt}</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Isolation: PostgreSQL Row-Level Security</span>
          </div>
        </div>
      </div>

      {/* Passkeys & Passwordless Security Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-[#d4af37]" />
              Passkeys & Biometric Access
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Authenticate securely using Touch ID, Face ID, Windows Hello, or platform authenticators.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPasskeyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] text-xs font-semibold text-zinc-200 flex items-center gap-2 self-start sm:self-auto cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Add Passkey</span>
          </button>
        </div>

        {passkeyFeedback && (
          <div
            role="alert"
            className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-in fade-in duration-200 ${
              passkeyFeedback.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {passkeyFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{passkeyFeedback.message}</span>
          </div>
        )}

        {/* Add Passkey Form/Modal */}
        {showAddPasskeyModal && (
          <form
            onSubmit={handleRegisterPasskey}
            className="p-5 rounded-2xl bg-zinc-900/80 border border-[#d4af37]/30 space-y-4 animate-in fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Register New Passkey
              </span>
              <button
                type="button"
                onClick={() => setShowAddPasskeyModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-2">
              <label htmlFor="passkey-device-name" className="block text-xs font-medium text-zinc-300">
                Device Name / Description
              </label>
              <input
                id="passkey-device-name"
                type="text"
                required
                value={newDeviceName}
                onChange={(e) => setNewDeviceName(e.target.value)}
                placeholder="e.g. MacBook Pro Touch ID, Pixel Fingerprint"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddPasskeyModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-zinc-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRegisteringPasskey}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-zinc-950 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRegisteringPasskey ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Prompting Biometrics...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>Register Passkey</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Passkeys List */}
        <div className="space-y-2">
          {loadingPasskeys ? (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-xs text-zinc-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
              <span>Loading registered passkeys...</span>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-white/[0.06] text-xs text-zinc-400">
              No passkeys registered yet. Click &quot;Add Passkey&quot; to enable passwordless biometric authentication.
            </div>
          ) : (
            passkeys.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-[#d4af37]">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      {p.device_name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Added on {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRevokePasskey(p.credential_id)}
                  disabled={isPending}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                  title="Revoke Passkey"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Password Management */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
          Password Credentials
        </h3>

        {account.provider === 'google' ? (
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-white/[0.06] text-xs text-zinc-400 leading-relaxed space-y-2">
            <p className="text-zinc-300 font-medium">
              Your account is authenticated via Google OAuth 2.0.
            </p>
            <p>
              Password changes and multi-factor credentials can also be supplemented with local passkeys above.
            </p>
          </div>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {feedback && (
              <div
                role="alert"
                className={`p-4 rounded-2xl border text-sm flex items-start gap-3 animate-in fade-in duration-200 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="settings-newPassword"
                  className="block text-xs font-medium text-zinc-300"
                >
                  New Password
                </label>
                <input
                  id="settings-newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="settings-confirmPassword"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Confirm New Password
                </label>
                <input
                  id="settings-confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/60 border border-white/[0.08] text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.1] text-zinc-100 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sign Out Section */}
      <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-sm font-semibold text-zinc-200">
            Active Session
          </span>
          <p className="text-xs text-zinc-400">
            Terminating your session clears local auth tokens and redirects to the login screen.
          </p>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of PACT</span>
          </button>
        </form>
      </div>
    </div>
  );
}
