'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { PactLogo } from '@/components/brand/pact-logo';
import { signUpAction } from '@/features/auth/actions';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Globe, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'America / New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'America / Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'Europe / London (GMT/BST)' },
  { value: 'Asia/Kolkata', label: 'Asia / Kolkata (IST)' },
  { value: 'Asia/Tokyo', label: 'Asia / Tokyo (JST)' },
];

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signUpAction(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(true);
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#09090b] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute w-[500px] h-[300px] bg-[#d4af37]/10 blur-[100px] rounded-full pointer-events-none -top-10" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md glass-card p-8 rounded-3xl border border-zinc-800/80 shadow-2xl relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <PactLogo size="lg" showText={false} className="mb-4" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 mb-1">
            Create Your PACT Account
          </h1>
          <p className="text-xs text-zinc-400">
            Turn Intent Into Discipline
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="flex items-center gap-3 p-3.5 mb-6 rounded-xl bg-red-950/50 border border-red-800/60 text-red-200 text-xs"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Notice */}
        {success && (
          <div
            role="status"
            className="flex items-center gap-3 p-3.5 mb-6 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-200 text-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Account created successfully! Please check your email to confirm registration.</span>
          </div>
        )}

        {/* Google OAuth Action */}
        <div className="space-y-4">
          <GoogleSignInButton label="Sign up with Google" onError={(err) => setError(err || null)} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/80" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-[#121217] px-3 text-zinc-400 font-medium rounded-full border border-zinc-800/50">
                Or register with email
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Alex Morgan"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#d4af37] transition-colors outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#d4af37] transition-colors outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-[#d4af37] transition-colors outline-none"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Primary Timezone
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <select
                id="timezone"
                name="timezone"
                defaultValue="UTC"
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 focus:border-[#d4af37] transition-colors outline-none appearance-none cursor-pointer"
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-[#d4af37] hover:bg-[#e5c158] text-zinc-950 font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#d4af37]/10 disabled:opacity-50 text-sm mt-4 cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-zinc-400">
          Already have a PACT account?{' '}
          <Link
            href="/login"
            className="text-[#e2c056] font-medium hover:underline ml-1"
          >
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
