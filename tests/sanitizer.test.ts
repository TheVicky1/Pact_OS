/**
 * Unit tests for sanitizeTextInput, covering escaping of markup-significant
 * characters and removal of embedded <script> payloads.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeTextInput } from '../src/lib/security/sanitizer';

describe('sanitizeTextInput', () => {
  it('returns plain text unchanged', () => {
    assert.equal(sanitizeTextInput('Build Raft Consensus Node'), 'Build Raft Consensus Node');
  });

  it('returns empty string unchanged', () => {
    assert.equal(sanitizeTextInput(''), '');
  });

  it('escapes angle brackets, ampersands, and quotes', () => {
    assert.equal(
      sanitizeTextInput(`<b>"Alex" & 'Mercer'</b>`),
      '&lt;b&gt;&quot;Alex&quot; &amp; &#39;Mercer&#39;&lt;/b&gt;'
    );
  });

  it('strips an inline script tag entirely', () => {
    const input = 'Hello<script>alert("xss")</script>World';
    assert.equal(sanitizeTextInput(input), 'HelloWorld');
  });

  it('strips a script tag with attributes', () => {
    const input = `before<script type="text/javascript">doEvil()</script>after`;
    assert.equal(sanitizeTextInput(input), 'beforeafter');
  });

  it('strips multiple script tags', () => {
    const input = '<script>a()</script>mid<script>b()</script>';
    assert.equal(sanitizeTextInput(input), 'mid');
  });

  it('neutralizes an img onerror XSS payload via escaping', () => {
    const input = `<img src=x onerror="alert(1)">`;
    const result = sanitizeTextInput(input);
    assert.ok(!result.includes('<img'));
    assert.equal(result, '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  it('is idempotent-safe for text with no special characters after sanitizing twice', () => {
    const once = sanitizeTextInput('Master Distributed Systems');
    const twice = sanitizeTextInput(once);
    assert.equal(once, twice);
  });
});
