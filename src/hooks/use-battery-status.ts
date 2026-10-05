'use client';

import { useEffect, useState } from 'react';

export const LOW_BATTERY_THRESHOLD = 0.15; // 15%

/**
 * Minimal structural shape of the browser's `BatteryManager` (the object
 * resolved by `navigator.getBattery()`). TypeScript's DOM lib does not
 * declare the Battery Status API, so only the members this hook needs are
 * described, which also lets the logic be unit tested with a plain
 * `EventTarget`-based fake instead of a real browser.
 */
export interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

/**
 * Decides whether the device is in low power mode: unplugged and strictly
 * below `LOW_BATTERY_THRESHOLD`. A charging device is never low power, and
 * exactly 15% is not low power (the threshold is exclusive).
 *
 * @param level    Battery level as a fraction from 0 to 1.
 * @param charging Whether the device is currently charging.
 */
export function computeIsLowPowerMode(level: number, charging: boolean): boolean {
  return level < LOW_BATTERY_THRESHOLD && !charging;
}

/**
 * Value returned by `useBatteryStatus`.
 */
export interface UseBatteryStatusReturn {
  /** True when the device is unplugged and below `LOW_BATTERY_THRESHOLD`. */
  isLowPowerMode: boolean;
}

/**
 * Reports the battery's low-power state to `onChange` immediately and again
 * on every `levelchange` / `chargingchange` event. Takes the battery as a
 * parameter (not the global), so it is unit-testable without a browser.
 *
 * @returns A function that removes both listeners.
 */
export function subscribeToBattery(
  battery: BatteryManager,
  onChange: (isLowPowerMode: boolean) => void,
): () => void {
  const report = () => onChange(computeIsLowPowerMode(battery.level, battery.charging));

  report();
  battery.addEventListener('levelchange', report);
  battery.addEventListener('chargingchange', report);

  return () => {
    battery.removeEventListener('levelchange', report);
    battery.removeEventListener('chargingchange', report);
  };
}

/**
 * Tracks whether the device is in low power mode (unplugged and below 15%),
 * so background work such as sync can be paused to save battery. Where the
 * Battery Status API is unavailable (SSR, Safari, Firefox) it stays `false`,
 * so nothing is ever paused on unsupported browsers.
 */
export function useBatteryStatus(): UseBatteryStatusReturn {
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    // `getBattery` is missing from TypeScript's DOM types and absent in some
    // browsers, so it is typed as optional on a local extension of Navigator.
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    if (typeof nav.getBattery !== 'function') return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    nav
      .getBattery()
      .then((battery) => {
        if (cancelled) return;
        unsubscribe = subscribeToBattery(battery, setIsLowPowerMode);
      })
      .catch(() => {
        // Battery API blocked (e.g. permissions policy): stay in normal mode.
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { isLowPowerMode };
}
