/**
 * Sanitization helper for free-form text fields (pact preference titles, display
 * names) that get stored and later rendered back to the user. Strips `<script>`
 * contents outright and escapes the remaining markup-significant characters, so
 * stored text can never be interpreted as HTML/JS when rendered.
 */

const SCRIPT_TAG_PATTERN = /<script[^>]*>[\s\S]*?<\/script>/gi;

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function sanitizeTextInput(input: string): string {
  if (!input) return input;

  const withoutScripts = input.replace(SCRIPT_TAG_PATTERN, '');

  return withoutScripts.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}
