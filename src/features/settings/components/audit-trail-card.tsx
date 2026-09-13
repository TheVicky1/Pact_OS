'use client';

/**
 * PACT Phase 12: User Security & Audit Trail Explorer
 */

import React, { useEffect, useState } from 'react';
import { Shield, Clock, RefreshCw, Loader2, CheckCircle, Key } from 'lucide-react';
import { fetchUserAuditLogsAction, UserAuditLogEntry } from '../actions';

export function AuditTrailCard() {
  const [logs, setLogs] = useState<UserAuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshLogs = async () => {
    setIsLoading(true);
    const res = await fetchUserAuditLogsAction();
    if (res.success && res.data) {
      setLogs(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    fetchUserAuditLogsAction().then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setLogs(res.data);
        }
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
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Security & Operational Audit Trail</h3>
            <p className="text-xs text-neutral-400">
              Immutable activity log of authentication, passkey assertions, and ritual executions.
            </p>
          </div>
        </div>

        <button
          onClick={refreshLogs}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          Fetching security audit trail...
        </div>
      ) : logs.length === 0 ? (
        <div className="py-8 text-center text-xs text-neutral-500">
          No audit log events recorded yet.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-neutral-950/60 border border-neutral-800/80 rounded-xl flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-400">
                  {log.eventType === 'AUTH' ? (
                    <Key className="w-3 h-3 text-amber-400" />
                  ) : log.eventType === 'RITUAL' ? (
                    <Clock className="w-3 h-3 text-sky-400" />
                  ) : (
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                  )}
                </div>
                <div>
                  <p className="font-mono text-[11px] text-neutral-200">{log.action}</p>
                  <span className="text-[10px] text-neutral-500 uppercase font-mono">
                    {log.eventType} • {log.resourceType}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
