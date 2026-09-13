'use client';

/**
 * PACT Phase 13: Multi-Device Management Card
 * Lists all registered devices for the current user with client types, last active timestamps,
 * and device unregistration options.
 */

import React, { useEffect, useState } from 'react';
import { Laptop, Smartphone, Tablet, Monitor, RefreshCw, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { fetchRegisteredDevicesAction, unregisterDeviceAction, DeviceRegistryEntry } from '@/features/sync/sync-actions';
import { getOrSetDeviceId } from '@/lib/offline/background-sync';

export function DeviceManagementCard() {
  const [devices, setDevices] = useState<DeviceRegistryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDeviceId] = useState<string>(() => (typeof window !== 'undefined' ? getOrSetDeviceId() : ''));
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadDevices = async () => {
    setIsLoading(true);
    const res = await fetchRegisteredDevicesAction();
    if (res.success && res.data) {
      setDevices(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    fetchRegisteredDevicesAction().then((res) => {
      if (isMounted) {
        if (res.success && res.data) {
          setDevices(res.data);
        }
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRevoke = async (deviceId: string) => {
    if (!confirm('Are you sure you want to unregister this device? It will need to re-authenticate on next sync.')) {
      return;
    }

    setRevokingId(deviceId);
    const res = await unregisterDeviceAction(deviceId);
    if (res.success) {
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    }
    setRevokingId(null);
  };

  const getDeviceIcon = (clientType: string) => {
    switch (clientType) {
      case 'web_mobile':
        return <Smartphone className="w-4 h-4 text-amber-400" />;
      case 'pwa':
        return <Tablet className="w-4 h-4 text-sky-400" />;
      case 'native_companion':
        return <Smartphone className="w-4 h-4 text-indigo-400" />;
      default:
        return <Laptop className="w-4 h-4 text-emerald-400" />;
    }
  };

  return (
    <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 space-y-6 select-none font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <Monitor className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neutral-200">Registered Devices & Active Sessions</h3>
            <p className="text-xs text-neutral-400">
              Manage devices synchronized with your PACT OS account and delta replication state.
            </p>
          </div>
        </div>

        <button
          onClick={loadDevices}
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
          Loading registered devices...
        </div>
      ) : devices.length === 0 ? (
        <div className="p-4 bg-neutral-950/60 border border-neutral-800/80 rounded-xl text-center text-xs text-neutral-400">
          No other devices registered yet. Log in on your phone or laptop to enable multi-device sync.
        </div>
      ) : (
        <div className="space-y-2">
          {devices.map((device) => {
            const isThisDevice = device.id === currentDeviceId;
            return (
              <div
                key={device.id}
                className={`p-3.5 bg-neutral-950/60 border rounded-xl flex items-center justify-between gap-3 text-xs transition-colors ${
                  isThisDevice ? 'border-sky-500/40 bg-sky-950/10' : 'border-neutral-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    {getDeviceIcon(device.clientType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-neutral-200">{device.deviceName}</p>
                      {isThisDevice && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-400 border border-sky-500/30">
                          This Device
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-500 font-mono">
                      Last active: {new Date(device.lastSeenAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sync Active</span>
                  </div>

                  {!isThisDevice && (
                    <button
                      onClick={() => handleRevoke(device.id)}
                      disabled={revokingId === device.id}
                      title="Unregister device"
                      className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
