'use client';

import { useEffect } from 'react';

/**
 * PACT PWA Service Worker Registration Component
 * Mounts globally in client app shell to activate offline caching and background service capabilities.
 */
export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content available
                }
              };
            }
          };
        })
        .catch((error) => {
          console.warn('[PACT PWA] Service worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
