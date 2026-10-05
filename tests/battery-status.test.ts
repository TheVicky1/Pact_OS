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
} from '../src/hooks/use-battery-status';

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
