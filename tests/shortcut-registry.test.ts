import test from 'node:test';
import assert from 'node:assert/strict';
import { ShortcutRegistry, shortcutRegistry, ShortcutEvent } from '../src/lib/ui/shortcuts';

function keyEvent(key: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) {
  const event = {
    key,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
    prevented: false,
    preventDefault() {
      event.prevented = true;
    },
  };
  return event satisfies ShortcutEvent;
}

test('Keyboard Shortcut Registry', async (t) => {
  await t.test('exports a shared singleton instance', () => {
    assert.ok(shortcutRegistry instanceof ShortcutRegistry);
  });

  await t.test('mod+k fires on Cmd+K (macOS) and Ctrl+K (Windows/Linux)', () => {
    const registry = new ShortcutRegistry();
    let calls = 0;
    registry.register('mod+k', () => calls++);

    const mac = keyEvent('k', { metaKey: true });
    assert.equal(registry.handle(mac), true);
    assert.equal(mac.prevented, true, 'Matched shortcut must prevent browser default');

    assert.equal(registry.handle(keyEvent('K', { ctrlKey: true })), true, 'Key match must be case-insensitive');
    assert.equal(calls, 2);
  });

  await t.test('ignores events with missing or extra modifiers', () => {
    const registry = new ShortcutRegistry();
    let calls = 0;
    registry.register('mod+k', () => calls++);

    const plain = keyEvent('k');
    assert.equal(registry.handle(plain), false);
    assert.equal(plain.prevented, false, 'Unmatched events must not be prevented');
    assert.equal(registry.handle(keyEvent('k', { ctrlKey: true, shiftKey: true })), false);
    assert.equal(registry.handle(keyEvent('k', { metaKey: true, altKey: true })), false);
    assert.equal(registry.handle(keyEvent('j', { metaKey: true })), false);
    assert.equal(calls, 0);
  });

  await t.test('supports explicit ctrl/meta/shift/alt combos and plain keys', () => {
    const registry = new ShortcutRegistry();
    const hits: string[] = [];
    registry.register('ctrl+shift+P', () => hits.push('palette'));
    registry.register('shift+?', () => hits.push('help'));
    registry.register('Escape', () => hits.push('escape'));

    assert.equal(registry.handle(keyEvent('P', { ctrlKey: true, shiftKey: true })), true);
    assert.equal(registry.handle(keyEvent('p', { metaKey: true, shiftKey: true })), false, 'ctrl must not match meta');
    assert.equal(registry.handle(keyEvent('?', { shiftKey: true })), true);
    assert.equal(registry.handle(keyEvent('Escape')), true);
    assert.deepEqual(hits, ['palette', 'help', 'escape']);
  });

  await t.test('unregister removes the shortcut and allows re-registering', () => {
    const registry = new ShortcutRegistry();
    let calls = 0;
    const unregister = registry.register('mod+k', () => calls++);
    unregister();
    assert.equal(registry.handle(keyEvent('k', { metaKey: true })), false);

    registry.register('mod+k', () => calls++);
    unregister(); // stale unregister must not remove the new handler
    assert.equal(registry.handle(keyEvent('k', { metaKey: true })), true);
    assert.equal(calls, 1);
  });

  await t.test('rejects duplicate and invalid combos', () => {
    const registry = new ShortcutRegistry();
    registry.register('mod+shift+k', () => {});
    assert.throws(() => registry.register('Shift+Mod+K', () => {}), /already registered/, 'Modifier order must not matter');
    assert.throws(() => registry.register('hyper+k', () => {}), /Invalid shortcut/);
    assert.throws(() => registry.register('', () => {}), /Invalid shortcut/);
  });

  await t.test('clear() removes all shortcuts', () => {
    const registry = new ShortcutRegistry();
    registry.register('mod+k', () => {});
    registry.clear();
    assert.equal(registry.handle(keyEvent('k', { metaKey: true })), false);
  });
});
