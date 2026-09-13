/**
 * PACT Phase 13: Background Synchronization & Device Identity Bridge
 * Interfaces with the Service Worker Background Sync API (sync / periodicsync)
 * and provides client-side device identification and online recovery listeners.
 */

import { generateReplicationUuid } from './delta-engine';

const DEVICE_ID_KEY = 'pact_client_device_id_v1';
const DEVICE_NAME_KEY = 'pact_client_device_name_v1';

/**
 * Retrieves or registers a durable device ID for this client.
 */
export function getOrSetDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'device_server_runtime';
  }

  try {
    const existing = window.localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.length > 8) {
      return existing;
    }
    const newId = `device_${generateReplicationUuid()}`;
    window.localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    return 'device_ephemeral_memory';
  }
}

/**
 * Gets or sets the human-readable device name (e.g., "MacBook Pro", "iPhone Safari").
 */
export function getOrSetDeviceName(): string {
  if (typeof window === 'undefined') {
    return 'Server Environment';
  }

  try {
    const existing = window.localStorage.getItem(DEVICE_NAME_KEY);
    if (existing) return existing;

    const userAgent = navigator.userAgent || '';
    let name = 'Web Browser';
    if (/iPhone/i.test(userAgent)) name = 'iPhone';
    else if (/iPad/i.test(userAgent)) name = 'iPad';
    else if (/Android/i.test(userAgent)) name = 'Android Device';
    else if (/Macintosh/i.test(userAgent)) name = 'Mac Device';
    else if (/Windows/i.test(userAgent)) name = 'Windows PC';
    else if (/Linux/i.test(userAgent)) name = 'Linux Workstation';

    window.localStorage.setItem(DEVICE_NAME_KEY, name);
    return name;
  } catch {
    return 'PACT Web Client';
  }
}

/**
 * Sets a custom human-readable name for this device.
 */
export function setDeviceName(customName: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(DEVICE_NAME_KEY, customName.trim());
    } catch {
      // ignore
    }
  }
}

/**
 * Registers background sync with Service Worker if supported by browser.
 */
export async function registerBackgroundSync(tag: string = 'pact-sync-deltas'): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration) {
      // Type assertion for Background Sync API
      const syncReg = registration as unknown as { sync: { register: (tag: string) => Promise<void> } };
      await syncReg.sync.register(tag);
      return true;
    }
  } catch {
    // Graceful fallback for non-supporting browsers
  }
  return false;
}

/**
 * Subscribes to network connectivity and window visibility events to trigger automatic sync.
 */
export function setupNetworkSyncListeners(onSyncRequested: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => {
    onSyncRequested();
    registerBackgroundSync('pact-sync-deltas').catch(() => {});
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      onSyncRequested();
    }
  };

  window.addEventListener('online', handleOnline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    window.removeEventListener('online', handleOnline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}
