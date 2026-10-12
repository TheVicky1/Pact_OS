export interface TagColorToken {
  bg: string;
  text: string;
  border: string;
}

const PALETTES: readonly TagColorToken[] = [
  { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' },
  { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
  { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
].map((palette) => Object.freeze(palette));

/** Neutral palette used for empty or invalid tag names. */
const FALLBACK_PALETTE = PALETTES[PALETTES.length - 1];

/**
 * Deterministically maps a focus tag name to one of 8 theme palettes.
 *
 * - Case-insensitive and whitespace-insensitive.
 * - A leading "#" is ignored, so "#coding" and "coding" share a color.
 * - Empty or non-string input returns the neutral fallback palette.
 */
export function getTagColorPalette(tagName: string): TagColorToken {
  if (typeof tagName !== 'string') return FALLBACK_PALETTE;

  const clean = tagName.trim().replace(/^#+/, '').trim().toLowerCase();
  if (!clean) return FALLBACK_PALETTE;

  let hash = 0;
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length];
}