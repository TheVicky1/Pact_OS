'use client';

import { useEffect } from 'react';
import { initThemeObserver } from './theme-observer';

export function ThemePreferenceSync() {
  useEffect(() => {
    return initThemeObserver((isDark) => {
      document.documentElement.classList.toggle('dark', isDark);
    });
  }, []);

  return null;
}