'use client';

const BADGE_SIZE = 32;
const BADGE_COLOR = '#ef4444';
const BADGE_TEXT_COLOR = '#ffffff';
const MAX_DISPLAY_COUNT = 99;

/** The static favicon to restore once there are no more unread items. */
export const DEFAULT_FAVICON_HREF = '/favicon.ico';

/**
 * Minimal structural shape of a 2D canvas context, so the drawing logic can
 * be unit tested with a plain object stub instead of a full canvas
 * implementation.
 */
export interface FaviconCanvasContext {
  clearRect(x: number, y: number, width: number, height: number): void;
  beginPath(): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
  fill(): void;
  fillText(text: string, x: number, y: number): void;
  fillStyle: string;
  font: string;
  textAlign: string;
  textBaseline: string;
}

export interface FaviconCanvas {
  width: number;
  height: number;
  getContext(contextId: '2d'): FaviconCanvasContext | null;
  toDataURL(): string;
}

export interface FaviconLinkElement {
  href: string;
}

/**
 * Minimal structural shape `applyFaviconBadge` needs from `document`, so the
 * DOM-mutation logic can be unit tested with a plain object stub instead of a
 * full DOM implementation.
 */
export interface FaviconTarget {
  createElement(tagName: string): FaviconCanvas;
  querySelector(selector: string): FaviconLinkElement | null;
}

/** Caps the badge text at "99+" so a large count doesn't overflow the circle. */
export function formatBadgeCount(unreadCount: number): string {
  return unreadCount > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(unreadCount);
}

/**
 * Draws a vibrant red notification circle with the unread count onto
 * `canvas`, and returns the data URL to use as the favicon href. Pure with
 * respect to `canvas` (a parameter, not the global), so it is unit-testable
 * without a browser or a canvas-emulation dependency.
 */
export function drawFaviconBadge(canvas: FaviconCanvas, unreadCount: number): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL();

  const size = canvas.width;
  const radius = size / 2;

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = BADGE_COLOR;
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BADGE_TEXT_COLOR;
  ctx.font = `bold ${Math.round(size * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(formatBadgeCount(unreadCount), radius, radius + 1);

  return canvas.toDataURL();
}

/**
 * Updates the `<link rel="icon">` favicon with an unread-count badge, or
 * restores `originalHref` once `unreadCount` drops to zero (or below). Pure
 * with respect to `doc` (a parameter, not the global), so it is unit-testable
 * without a browser or a DOM-emulation dependency.
 */
export function applyFaviconBadge(
  doc: FaviconTarget,
  unreadCount: number,
  originalHref: string = DEFAULT_FAVICON_HREF
): void {
  const link = doc.querySelector("link[rel~='icon']");
  if (!link) return;

  if (unreadCount <= 0) {
    link.href = originalHref;
    return;
  }

  const canvas = doc.createElement('canvas');
  canvas.width = BADGE_SIZE;
  canvas.height = BADGE_SIZE;
  link.href = drawFaviconBadge(canvas, unreadCount);
}

/**
 * Updates the browser tab favicon with an unread-count badge, restoring the
 * static favicon once `unreadCount` drops to zero (or below). A no-op during
 * SSR, where there is no `document`.
 */
export function updateFaviconBadge(unreadCount: number): void {
  if (typeof document === 'undefined') return;
  // `Document`'s real `createElement`/`querySelector` overloads are stricter
  // than the minimal `FaviconTarget` shape `applyFaviconBadge` needs for
  // testing, so TypeScript can't verify the assignment structurally; the real
  // DOM document always satisfies it at runtime.
  applyFaviconBadge(document as unknown as FaviconTarget, unreadCount);
}
