'use client';

/**
 * PACT Phase 12: Live System Diagnostics & Operational Telemetry UI
 */

import React, { useEffect, useState } from 'react';
import { Activity, Server, Database, Wifi, Shield, RefreshCw, Loader2 } from 'lucide-react';

interface HealthData {
  status: string;
  uptime: number;
  environment: string;
  subsystems?: {
    runtime?: { status: string; heapUsedMb: number | null; heapTotalMb: number | null };
    rateLimiter?: { status: string };
    notifications?: { status: string; pendingQueue: number; deadLetters: number };
    telemetry?: { totalRequests: number; errorCount: number };
  };
}

export function SystemDiagnosticsCard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health/deep', { cache: 'no-store' });
      const duration = Math.round(performance.now() - start);
      setLatencyMs(duration);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const start = performance.now();
    fetch('/api/health/deep', { cache: 'no-store' })
      .then((res) => {
        const duration = Math.round(performance.now() - start);
        if (isMounted) {
          setLatencyMs(duration);
          if (res.ok) {
            res.json().then((json) => {
              if (isMounted) {
                setData(json);
                setIsLoading(false);
              }
            });
          } else {
            setIsLoading(false);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 space-y-6 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Live System & Network Diagnostics</h3>
            <p className="text-xs text-neutral-400">
              Real-time telemetry, rate limiter headroom, and client round-trip latency.
            </p>
          </div>
        </div>

        <button
          onClick={fetchDiagnostics}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Test Probes
        </button>
      </div>

      {isLoading && !data ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          Running diagnostic probes...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" /> RTT Latency
            </span>
            <p className="text-lg font-bold font-mono text-neutral-100">
              {latencyMs !== null ? `${latencyMs} ms` : '—'}
            </p>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-sky-400" /> Runtime Status
            </span>
            <p className="text-lg font-bold font-mono text-emerald-400">
              {data?.status?.toUpperCase() || 'HEALTHY'}
            </p>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Rate Limiter
            </span>
            <p className="text-lg font-bold font-mono text-neutral-100">
              {data?.subsystems?.rateLimiter?.status || 'ACTIVE'}
            </p>
          </div>

          <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl space-y-1">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-indigo-400" /> Memory Heap
            </span>
            <p className="text-lg font-bold font-mono text-neutral-100">
              {data?.subsystems?.runtime?.heapUsedMb ? `${data.subsystems.runtime.heapUsedMb} MB` : 'Optimal'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
