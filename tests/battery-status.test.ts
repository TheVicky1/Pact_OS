/**
 * Unit tests for the useBatteryStatus hook's low-power decision logic.
 * Exercises computeIsLowPowerMode directly rather than mounting the hook
 * (which would need a DOM-emulation dependency this project doesn't have).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LOW_BATTERY_THRESHOLD,
  computeIsLowPowerMode,
  subscribeToBattery,
  BatteryManager,
} from '../src/hooks/use-battery-status';

/** Fake Battery Status API object: an EventTarget whose level/charging tests mutate. */
class FakeBattery extends EventTarget implements BatteryManager {
  constructor(
    public level: number,
    public charging: boolean,
  ) {
    super();
  }
}

describe('LOW_BATTERY_THRESHOLD', () => {
  it('is 15% expressed as a 0-1 fraction, matching the Battery API level scale', () => {
    assert.equal(LOW_BATTERY_THRESHOLD, 0.15);
  });
});

describe('computeIsLowPowerMode', () => {
  it('is low power when unplugged and below the threshold', () => {
    assert.equal(computeIsLowPowerMode(0.14, false), true);
    assert.equal(computeIsLowPowerMode(0.05, false), true);
  });

  it('is not low power at exactly the threshold (exclusive boundary)', () => {
    assert.equal(computeIsLowPowerMode(LOW_BATTERY_THRESHOLD, false), false);
  });

  it('is not low power when unplugged and above the threshold', () => {
    assert.equal(computeIsLowPowerMode(0.16, false), false);
    assert.equal(computeIsLowPowerMode(1, false), false);
  });

  it('is never low power while charging, even at a critically low level', () => {
    assert.equal(computeIsLowPowerMode(0.14, true), false);
    assert.equal(computeIsLowPowerMode(0, true), false);
  });

  it('treats an empty, unplugged battery as low power', () => {
    assert.equal(computeIsLowPowerMode(0, false), true);
  });
});

describe('subscribeToBattery', () => {
  it('reports the current state immediately on subscribe', () => {
    const seen: boolean[] = [];
    subscribeToBattery(new FakeBattery(0.1, false), (v) => seen.push(v));
    assert.deepEqual(seen, [true]);
  });

  it('reports a normal state immediately for a healthy battery', () => {
    const seen: boolean[] = [];
    subscribeToBattery(new FakeBattery(0.8, false), (v) => seen.push(v));
    assert.deepEqual(seen, [false]);
  });

  it('re-evaluates on levelchange', () => {
    const battery = new FakeBattery(0.2, false);
    const seen: boolean[] = [];
    subscribeToBattery(battery, (v) => seen.push(v));

    battery.level = 0.14;
    battery.dispatchEvent(new Event('levelchange'));

    assert.deepEqual(seen, [false, true]);
  });

  it('re-evaluates on chargingchange (plugging in leaves low power mode)', () => {
    const battery = new FakeBattery(0.05, false);
    const seen: boolean[] = [];
    subscribeToBattery(battery, (v) => seen.push(v));

    battery.charging = true;
    battery.dispatchEvent(new Event('chargingchange'));

    assert.deepEqual(seen, [true, false]);
  });

  it('stops reporting after unsubscribe', () => {
    const battery = new FakeBattery(0.5, false);
    const seen: boolean[] = [];
    const unsubscribe = subscribeToBattery(battery, (v) => seen.push(v));

    unsubscribe();
    battery.level = 0.01;
    battery.dispatchEvent(new Event('levelchange'));
    battery.charging = true;
    battery.dispatchEvent(new Event('chargingchange'));

    assert.deepEqual(seen, [false]);
  });
});
