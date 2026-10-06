import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCurrentNetworkQuality,
  subscribeToNetwork,
} from '../src/hooks/use-network-quality';

class FakeConnection extends EventTarget {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown' = '4g';
  saveData = false;
}

class FakeWindow extends EventTarget {}

function setupBrowserMocks(connection: FakeConnection) {
  const fakeWindow = new FakeWindow();

  Object.defineProperty(globalThis, 'navigator', {
    value: {
      onLine: true,
      connection,
    },
    configurable: true,
  });

  Object.defineProperty(globalThis, 'window', {
    value: fakeWindow,
    configurable: true,
  });

  return fakeWindow;
}

describe('getCurrentNetworkQuality', () => {
  it('returns the current online status and connection quality', () => {
    const connection = new FakeConnection();

    setupBrowserMocks(connection);

    const result = getCurrentNetworkQuality();

    assert.equal(result.isOnline, true);
    assert.equal(result.effectiveType, '4g');
    assert.equal(result.saveData, false);
    assert.equal(result.isSlowConnection, false);
  });

  it('detects a slow 2g connection', () => {
    const connection = new FakeConnection();
    connection.effectiveType = '2g';

    setupBrowserMocks(connection);

    const result = getCurrentNetworkQuality();

    assert.equal(result.effectiveType, '2g');
    assert.equal(result.isSlowConnection, true);
  });

  it('detects slow-2g as a slow connection', () => {
    const connection = new FakeConnection();
    connection.effectiveType = 'slow-2g';

    setupBrowserMocks(connection);

    const result = getCurrentNetworkQuality();

    assert.equal(result.effectiveType, 'slow-2g');
    assert.equal(result.isSlowConnection, true);
  });

  it('detects slow connection when saveData is enabled', () => {
    const connection = new FakeConnection();
    connection.saveData = true;

    setupBrowserMocks(connection);

    const result = getCurrentNetworkQuality();

    assert.equal(result.saveData, true);
    assert.equal(result.isSlowConnection, true);
  });

  it('falls back to unknown when connection information is unavailable', () => {
    const fakeWindow = new FakeWindow();

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        onLine: true,
      },
      configurable: true,
    });

    Object.defineProperty(globalThis, 'window', {
      value: fakeWindow,
      configurable: true,
    });

    const result = getCurrentNetworkQuality();

    assert.equal(result.isOnline, true);
    assert.equal(result.effectiveType, 'unknown');
    assert.equal(result.saveData, false);
    assert.equal(result.isSlowConnection, false);
  });
});

describe('subscribeToNetwork', () => {
  it('reports the current network state immediately', () => {
    const connection = new FakeConnection();
    setupBrowserMocks(connection);

    const seen: string[] = [];

    const unsubscribe = subscribeToNetwork((quality) => {
      seen.push(quality.effectiveType);
    });

    assert.deepEqual(seen, ['4g']);

    unsubscribe();
  });

  it('updates when the connection changes', () => {
    const connection = new FakeConnection();
    setupBrowserMocks(connection);

    const seen: string[] = [];

    const unsubscribe = subscribeToNetwork((quality) => {
      seen.push(quality.effectiveType);
    });

    connection.effectiveType = '2g';
    connection.dispatchEvent(new Event('change'));

    assert.deepEqual(seen, ['4g', '2g']);

    unsubscribe();
  });

  it('updates when the browser goes offline', () => {
    const connection = new FakeConnection();
    const fakeWindow = setupBrowserMocks(connection);

    const seen: boolean[] = [];

    const unsubscribe = subscribeToNetwork((quality) => {
      seen.push(quality.isOnline);
    });

    Object.defineProperty(globalThis.navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    fakeWindow.dispatchEvent(new Event('offline'));

    assert.deepEqual(seen, [true, false]);

    unsubscribe();
  });
});
