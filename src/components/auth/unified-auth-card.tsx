'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Mail, User, Globe, AlertCircle, CheckCircle2, Loader2, Eye, EyeOff, ArrowRight, ArrowLeft, KeyRound, ChevronDown } from 'lucide-react';
import { signInAction, signUpAction } from '@/features/auth/actions';
import { SocialAuthButtons } from '@/components/auth/social-auth-buttons';
import { createClient } from '@/lib/supabase/client';

export type AuthMode = 'signin' | 'signup' | 'forgot';

interface UnifiedAuthCardProps {
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
  className?: string;
}

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America / New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America / Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'America / Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'America / Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe / London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe / Paris (CET/CEST)' },
  { value: 'Asia/Dubai', label: 'Asia / Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'Asia / Kolkata (IST)' },
  { value: 'Asia/Singapore', label: 'Asia / Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: 'Asia / Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Australia / Sydney (AEST/AEDT)' },
];

export function UnifiedAuthCard({
  initialMode = 'signin',
  onModeChange,
  className = '',
}: UnifiedAuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [detectedTz, setDetectedTz] = useState('UTC');

  // Detect user's local timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setDetectedTz(tz);
      }
    } catch {
      // Fallback to UTC
    }
  }, []);

  // Listen for initialMode prop updates
  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
  }, [initialMode]);

  // Check URL query parameters for error flags on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'oauth_failed') {
        setError('Authentication was canceled or encountered an error. Please try again.');
      }
      const authParam = params.get('auth');
      if (authParam === 'signup') {
        switchMode('signup');
      } else if (authParam === 'signin') {
        switchMode('signin');
      }
    }
  }, []);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  // Sign In Handler
  const handleSignIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  // Sign Up Handler
  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccessMessage('Account created successfully! Check your email to confirm registration or sign in directly.');
      }
    });
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    startTransition(async () => {
      try {
        const supabase = createClient();
        const redirectToUrl = `${window.location.origin}/auth/callback?next=/app/settings`;
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: redirectToUrl,
        });

        if (resetError) {
          setError(resetError.message || 'Unable to send password reset link. Please try again.');
        } else {
          setSuccessMessage(`Password reset link sent to ${email}. Please check your inbox.`);
        }
      } catch {
        setError('An unexpected error occurred. Please try again later.');
      }
    });
  };

  return (
    <div
      className={`w-full max-w-[400px] sm:max-w-[420px] rounded-3xl bg-zinc-950/75 backdrop-blur-2xl border border-white/[0.09] p-5 sm:p-6 shadow-[0_16px_50px_rgba(0,0,0,0.65),0_0_40px_rgba(212,175,55,0.06)] relative overflow-hidden text-zinc-100 ${className}`}
    >
      {/* Subtle Ambient Gold Light inside card */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Mode Pill Switcher */}
      {mode !== 'forgot' ? (
        <div className="flex flex-col gap-3.5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
                {mode === 'signin' ? (
                  <>
                    Welcome <span className="text-[#d4af37]">Back</span>
                  </>
                ) : (
                  <>
                    Create <span className="text-[#d4af37]">Account</span>
                  </>
                )}
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {mode === 'signin'
                  ? 'Sign in to continue your discipline journey.'
                  : 'Start building your personal operating system.'}
              </p>
            </div>
          </div>

          {/* Clean Interactive Tab Switcher */}
          <div className="grid grid-cols-2 p-0.5 rounded-xl bg-zinc-900/90 border border-white/[0.06] relative">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`relative py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer z-10 ${
                mode === 'signin' ? 'text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode === 'signin' && (
                <motion.div
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm z-[-1]"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              Sign In
            </button>

            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`relative py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer z-10 ${
                mode === 'signup' ? 'text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode === 'signup' && (
                <motion.div
                  layoutId="auth-tab-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 shadow-sm z-[-1]"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              Sign Up
            </button>
          </div>
        </div>
      ) : (
        /* Forgot Password Header */
        <div className="mb-4">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Reset <span className="text-[#d4af37]">Password</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
            Enter your email to receive a secure recovery link.
          </p>
        </div>
      )}

      {/* Alert Banners (Error & Success) */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start gap-2 text-xs text-red-300"
            role="alert"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed text-[11px] sm:text-xs">{error}</span>
          </motion.div>
        )}

        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2 text-xs text-emerald-300"
            role="status"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed text-[11px] sm:text-xs">{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Area with Fluid Crossfade */}
      <AnimatePresence mode="wait">
        {mode === 'signin' && (
          <motion.div
            key="signin-mode"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-3"
          >
            {/* Google OAuth Button */}
            <SocialAuthButtons onError={setError} isLoading={isPending} />

            {/* Centered Symmetrical Divider */}
            <div className="flex items-center gap-2.5 my-2.5">
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
              <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase shrink-0">
                OR
              </span>
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
            </div>

            {/* Sign In Form */}
            <form onSubmit={handleSignIn} className="space-y-3">
              {/* Email Input */}
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-zinc-300 mb-1" htmlFor="signin-email">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                  <input
                    id="signin-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@pact.com"
                    className="w-full h-10 bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#d4af37]/60 focus:bg-zinc-900 text-zinc-100 text-xs sm:text-sm rounded-xl pl-9.5 pr-3.5 transition-all outline-none placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] sm:text-xs font-medium text-zinc-300" htmlFor="signin-password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] sm:text-xs font-medium text-[#d4af37] hover:text-[#e5c158] transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                  <input
                    id="signin-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full h-10 bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#d4af37]/60 focus:bg-zinc-900 text-zinc-100 text-xs sm:text-sm rounded-xl pl-9.5 pr-9.5 transition-all outline-none placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-10 mt-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/15 hover:shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Toggle Prompt */}
            <p className="text-center text-xs text-zinc-400 pt-1.5">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="font-semibold text-[#d4af37] hover:text-[#e5c158] transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          </motion.div>
        )}

        {mode === 'signup' && (
          <motion.div
            key="signup-mode"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-3"
          >
            {/* Google OAuth Button */}
            <SocialAuthButtons onError={setError} isLoading={isPending} />

            {/* Centered Symmetrical Divider */}
            <div className="flex items-center gap-2.5 my-2.5">
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
              <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase shrink-0">
                OR
              </span>
              <div className="flex-1 h-[1px] bg-white/[0.08]" />
            </div>

            {/* Sign Up Form */}
            <form onSubmit={handleSignUp} className="space-y-2.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-zinc-300 mb-1" htmlFor="signup-name">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                  <input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Doe"
                    className="w-full h-10 bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#d4af37]/60 focus:bg-zinc-900 text-zinc-100 text-xs sm:text-sm rounded-xl pl-9.5 pr-3.5 transition-all outline-none placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-zinc-300 mb-1" htmlFor="signup-email">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@pact.com"
                    className="w-full h-10 bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#d4af37]/60 focus:bg-zinc-900 text-zinc-100 text-xs sm:text-sm rounded-xl pl-9.5 pr-3.5 transition-all outline-none placeholder:text-zinc-500"
                  />
                </div>
              </div>

              {/* Timezone Selection */}
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-zinc-300 mb-1" htmlFor="signup-timezone">
                  Primary Timezone
                </label>
                <div className="relative flex items-center">
                  <Globe className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                  <select
                    id="signup-timezone"
                    name="timezone"
                    defaultValue={detectedTz}
                    className="w-full h-10 bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#d4af37]/60 focus:bg-zinc-900 text-zinc-100 text-xs sm:text-sm rounded-xl pl-9.5 pr-9.5 transition-all outline-none cursor-pointer appearance-none"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value} className="bg-zinc-900 text-zinc-100">
                        {tz.label}
                      </option>
                    ))}
                    {!TIMEZONE_OPTIONS.some((tz) => tz.value === detectedTz) && (
                      <option value={detectedTz} className="bg-zinc-900 text-zinc-100">
                        {detectedTz} (Detected)
                      </option>
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-zinc-300 mb-1" htmlFor="signup-password">
                  Password (min. 8 characters)
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    className="w-full h-10 bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#d4af37]/60 focus:bg-zinc-900 text-zinc-100 text-xs sm:text-sm rounded-xl pl-9.5 pr-9.5 transition-all outline-none placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full h-10 mt-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/15 hover:shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Toggle Prompt */}
            <p className="text-center text-xs text-zinc-400 pt-1.5">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="font-semibold text-[#d4af37] hover:text-[#e5c158] transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </motion.div>
        )}

        {mode === 'forgot' && (
          <motion.div
            key="forgot-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="space-y-3"
          >
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <label className="block text-[11px] sm:text-xs font-medium text-zinc-300 mb-1" htmlFor="forgot-email">
                  Account Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@pact.com"
                    className="w-full h-10 bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.16] focus:border-[#d4af37]/60 focus:bg-zinc-900 text-zinc-100 text-xs sm:text-sm rounded-xl pl-9.5 pr-3.5 transition-all outline-none placeholder:text-zinc-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full h-10 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/15 hover:shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                    <span>Sending reset link...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
