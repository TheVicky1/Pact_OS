/**
 * Unit tests for the usePageMetadata hook's DOM-mutation logic.
 * Exercises formatPageTitle and applyPageMetadata directly, against a
 * plain-object stub satisfying PageMetadataTarget, rather than mounting the
 * hook (which would need a DOM-emulation dependency this project doesn't have).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPageTitle,
  applyPageMetadata,
  PageMetadataTarget,
} from '../src/hooks/use-page-metadata';

function createStubDocument(): PageMetadataTarget & { metaTags: Map<string, string>[] } {
  const metaTags: Map<string, string>[] = [];

  return {
    title: '',
    metaTags,
    querySelector(selector: string) {
      if (selector !== 'meta[name="description"]') return null;
      const existing = metaTags.find((m) => m.get('name') === 'description');
      if (!existing) return null;
      return { setAttribute: (name: string, value: string) => existing.set(name, value) };
    },
    createElement(_tagName: string) {
      const attrs = new Map<string, string>();
      return { setAttribute: (name: string, value: string) => attrs.set(name, value), __attrs: attrs };
    },
    head: {
      appendChild(node: { setAttribute(name: string, value: string): void }) {
        const withAttrs = node as unknown as { __attrs: Map<string, string> };
        metaTags.push(withAttrs.__attrs);
      },
    },
  };
}

describe('formatPageTitle', () => {
  it('appends the app name to a non-empty title', () => {
    assert.equal(formatPageTitle('Settings'), 'Settings | Pact OS');
    assert.equal(formatPageTitle('Onboarding'), 'Onboarding | Pact OS');
  });

  it('falls back to the app name alone for an empty title', () => {
    assert.equal(formatPageTitle(''), 'Pact OS');
  });
});

describe('applyPageMetadata', () => {
  it('sets document.title in the consistent "<View> | Pact OS" format', () => {
    const doc = createStubDocument();
    applyPageMetadata(doc, 'Settings');
    assert.equal(doc.title, 'Settings | Pact OS');
  });

  it('creates and appends a meta description tag when none exists', () => {
    const doc = createStubDocument();
    applyPageMetadata(doc, 'Settings', 'Manage your Pact OS preferences');

    assert.equal(doc.metaTags.length, 1);
    assert.equal(doc.metaTags[0].get('name'), 'description');
    assert.equal(doc.metaTags[0].get('content'), 'Manage your Pact OS preferences');
  });

  it('updates an existing meta description tag in place instead of duplicating it', () => {
    const doc = createStubDocument();
    applyPageMetadata(doc, 'Settings', 'First description');
    applyPageMetadata(doc, 'Settings', 'Second description');

    assert.equal(doc.metaTags.length, 1);
    assert.equal(doc.metaTags[0].get('content'), 'Second description');
  });

  it('does not touch the meta description tag when none is provided', () => {
    const doc = createStubDocument();
    applyPageMetadata(doc, 'Settings');
    assert.equal(doc.metaTags.length, 0);
  });

  it('updates the title across consecutive calls, simulating a view switch', () => {
    const doc = createStubDocument();
    applyPageMetadata(doc, 'Settings');
    assert.equal(doc.title, 'Settings | Pact OS');

    applyPageMetadata(doc, 'Onboarding');
    assert.equal(doc.title, 'Onboarding | Pact OS');
  });
});
