/**
 * Global Keyboard Shortcut Registry
 * Central place to register key combinations (e.g. `mod+k` for the command palette)
 * and dispatch them from a single `keydown` listener.
 */

export type ShortcutHandler = (event: ShortcutEvent) => void;

/** Subset of `KeyboardEvent` the registry reads; real DOM events satisfy it. */
export type ShortcutEvent = Pick<
  KeyboardEvent,
  'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey' | 'preventDefault'
>;

interface ParsedCombo {
  key: string;
  mod: boolean;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  alt: boolean;
}

const MODIFIERS = ['mod', 'ctrl', 'meta', 'shift', 'alt'] as const;

function parseCombo(combo: string): ParsedCombo {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim());
  const key = parts.pop();
  if (!key || parts.some((p) => !(MODIFIERS as readonly string[]).includes(p))) {
    throw new Error(`Invalid shortcut combo: "${combo}"`);
  }
  const has = (m: string) => parts.includes(m);
  return { key, mod: has('mod'), ctrl: has('ctrl'), meta: has('meta'), shift: has('shift'), alt: has('alt') };
}

function normalize(c: ParsedCombo): string {
  return [...MODIFIERS.filter((m) => c[m]), c.key].join('+');
}

function matches(c: ParsedCombo, e: ShortcutEvent): boolean {
  if (e.key.toLowerCase() !== c.key || e.shiftKey !== c.shift || e.altKey !== c.alt) return false;
  // `mod` = Cmd on macOS or Ctrl on Windows/Linux
  if (c.mod) return e.metaKey || e.ctrlKey;
  return e.ctrlKey === c.ctrl && e.metaKey === c.meta;
}

/**
 * Registry of keyboard shortcuts.
 *
 * Combos are `+`-separated, case-insensitive, with modifiers `mod`, `ctrl`, `meta`,
 * `shift`, `alt` followed by a key (`KeyboardEvent.key`), e.g. `mod+k`, `shift+?`, `escape`.
 *
 * @example
 * const unregister = shortcutRegistry.register('mod+k', () => toggleCommandCenter());
 * window.addEventListener('keydown', (e) => shortcutRegistry.handle(e));
 */
export class ShortcutRegistry {
  private shortcuts = new Map<string, { combo: ParsedCombo; handler: ShortcutHandler }>();

  /**
   * Registers a handler for a key combination.
   * @returns Function that removes this shortcut.
   * @throws Error if the combo is invalid or already registered.
   */
  public register(combo: string, handler: ShortcutHandler): () => void {
    const parsed = parseCombo(combo);
    const id = normalize(parsed);
    if (this.shortcuts.has(id)) {
      throw new Error(`Shortcut "${id}" is already registered`);
    }
    const entry = { combo: parsed, handler };
    this.shortcuts.set(id, entry);
    return () => {
      if (this.shortcuts.get(id) === entry) this.shortcuts.delete(id);
    };
  }

  /**
   * Runs the handler matching a keyboard event and prevents the browser default.
   * @returns `true` if a shortcut handled the event.
   */
  public handle(event: ShortcutEvent): boolean {
    for (const { combo, handler } of this.shortcuts.values()) {
      if (matches(combo, event)) {
        event.preventDefault();
        handler(event);
        return true;
      }
    }
    return false;
  }

  /** Removes all shortcuts. */
  public clear(): void {
    this.shortcuts.clear();
  }
}

export const shortcutRegistry = new ShortcutRegistry();
