'use client';

import { useEffect } from 'react';

const APP_NAME = 'Pact OS';

/**
 * Minimal structural shape `applyPageMetadata` needs from `document`, so the
 * DOM-mutation logic can be unit tested with a plain object stub instead of a
 * full DOM implementation.
 */
export interface PageMetadataTarget {
  title: string;
  querySelector(selector: string): { setAttribute(name: string, value: string): void } | null;
  createElement(tagName: string): { setAttribute(name: string, value: string): void };
  head: {
    appendChild(node: { setAttribute(name: string, value: string): void }): void;
  };
}

/**
 * Builds the consistent `<View> | Pact OS` tab title. An empty/falsy title
 * falls back to the app name alone, so a view that hasn't resolved its title
 * yet never shows a bare `| Pact OS`.
 */
export function formatPageTitle(title: string): string {
  return title ? `${title} | ${APP_NAME}` : APP_NAME;
}

/**
 * Sets `doc.title` and upserts `<meta name="description">`. Pure with
 * respect to `doc` (a parameter, not the global), so it is unit-testable
 * without a browser or a DOM-emulation dependency.
 */
export function applyPageMetadata(doc: PageMetadataTarget, title: string, description?: string): void {
  doc.title = formatPageTitle(title);

  if (description) {
    let meta = doc.querySelector('meta[name="description"]');
    if (!meta) {
      meta = doc.createElement('meta');
      meta.setAttribute('name', 'description');
      doc.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }
}

/**
 * Updates the browser tab title and meta description for the current view.
 * For client-rendered view switches that don't change route (e.g. a tabbed
 * settings panel), where Next.js's route-level `metadata`/`generateMetadata`
 * does not apply.
 *
 * @param title       View title, rendered as `"<title> | Pact OS"`.
 * @param description Optional meta description; left untouched when omitted.
 */
export function usePageMetadata(title: string, description?: string): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    // `Document`'s real `head.appendChild<T extends Node>` is stricter than the
    // minimal `PageMetadataTarget` shape `applyPageMetadata` needs for testing,
    // so TypeScript can't verify the assignment structurally; the real DOM
    // document always satisfies it at runtime.
    applyPageMetadata(document as unknown as PageMetadataTarget, title, description);
  }, [title, description]);
}
