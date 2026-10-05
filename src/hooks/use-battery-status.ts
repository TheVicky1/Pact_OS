'use client';

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
