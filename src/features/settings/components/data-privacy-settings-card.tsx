'use client';

import React, { useState } from 'react';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Database,
  Info,
} from 'lucide-react';

export function DataPrivacySettingsCard() {
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleDownload = async (format: 'json' | 'csv') => {
    setFeedback(null);
    if (format === 'json') setIsExportingJson(true);
    if (format === 'csv') setIsExportingCsv(true);

    try {
      const response = await fetch(`/api/user/export?format=${format}`, {
        method: 'GET',
        headers: {
          Accept: format === 'json' ? 'application/json' : 'application/zip',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed with status ${response.status}`);
      }

      // Extract filename from header or fallback
      const disposition = response.headers.get('Content-Disposition');
      let filename = `pact-os-export.${format === 'json' ? 'json' : 'zip'}`;
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setFeedback({
        type: 'success',
        message: `Account data successfully exported as ${format.toUpperCase()}.`,
      });
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Export failed. Please try again.',
      });
    } finally {
      setIsExportingJson(false);
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#d4af37]" />
            Your Data & Portability
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Download a complete, portable copy of the information stored in your PACT account.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#121217] border border-white/[0.06] text-xs text-zinc-300 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Tenant Isolated</span>
        </div>
      </div>

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

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* JSON Archive Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#e2c056] border border-[#d4af37]/30">
                <FileJson className="w-4 h-4" />
              </div>
              <span>JSON Structured Archive</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Complete hierarchical snapshot including goals, projects, tasks, commitments, verification logs, finance ledger, and preferences.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleDownload('json')}
            disabled={isExportingJson || isExportingCsv}
            className="w-full px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e2c056] text-zinc-950 font-semibold text-xs transition-all shadow-md shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isExportingJson ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting JSON...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download JSON (.json)</span>
              </>
            )}
          </button>
        </div>

        {/* CSV / ZIP Card */}
        <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <span>Tabular CSV Bundle (.zip)</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard RFC 4180 CSV tables packaged in a ZIP archive. Suitable for spreadsheet analysis, Python Pandas, and BI tools.
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleDownload('csv')}
            disabled={isExportingJson || isExportingCsv}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-white/[0.08] font-semibold text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isExportingCsv ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Building ZIP...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download CSV Bundle (.zip)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security & Inclusion Breakdown */}
      <div className="p-5 rounded-2xl bg-[#121217]/80 border border-white/[0.06] space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
          <Info className="w-4 h-4 text-[#d4af37]" />
          <span>Archive Scope & Security Model</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="text-zinc-300 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Included Data (19 Domains):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
              <li>Profile & Timezone configuration</li>
              <li>Goals, Projects & Task hierarchy</li>
              <li>Accountability commitments & logs</li>
              <li>Verification sessions & proof evidence</li>
              <li>Calendar events & synchronization history</li>
              <li>Finance categories, ledger & recurring rules</li>
              <li>Monthly budget limits & utilization</li>
              <li>In-app notifications & channel preferences</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Excluded for Your Security:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-1">
              <li>OAuth access tokens & refresh tokens</li>
              <li>Account passwords & hash digests</li>
              <li>API secrets, CRON_SECRET & webhook keys</li>
              <li>Database service credentials & private keys</li>
              <li>Internal infrastructure signatures</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
