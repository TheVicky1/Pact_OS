# PACT Theming Reference

This guide documents the current PACT visual theme and the CSS tokens available for UI development.

PACT uses a dark Obsidian foundation with restrained warm Gold accents, glassmorphism surfaces, and Geist typography. The canonical implementation lives in `src/app/globals.css`, with font definitions in `src/app/layout.tsx`.

> **Source of truth:** When this document and the implementation differ, prefer `src/app/globals.css`.

## Contents

1. [Design Principles](#1-design-principles)
2. [Color Tokens](#2-color-tokens)
3. [Base CSS Variables](#3-base-css-variables)
4. [Typography](#4-typography)
5. [Using CSS Variables](#5-using-css-variables)
6. [Tailwind Usage](#6-tailwind-usage)
7. [Glassmorphism Utilities](#7-glassmorphism-utilities)
8. [Gold Lighting Utilities](#8-gold-lighting-utilities)
9. [Dark Mode](#9-dark-mode)
10. [Accessibility](#10-accessibility)
11. [Semantic Status Colors](#11-semantic-status-colors)
12. [Do and Don't](#12-do-and-dont)
13. [Quick Reference](#13-quick-reference)
14. [Source Files](#14-source-files)

---

## 1. Design Principles

PACT's visual language is built around:

- **Obsidian surfaces** — near-black backgrounds provide the primary canvas.
- **Restrained Gold** — PACT Gold is used for brand emphasis, primary actions, focus states, and visual accents.
- **Glass surfaces** — translucent dark surfaces with blur create hierarchy without introducing bright panels.
- **Clear text hierarchy** — primary, secondary, and muted text tokens establish readable contrast.
- **Semantic status colors** — status colors communicate application state consistently.
- **Dark theme** — PACT currently uses a dark root theme, and no light theme is defined.

Avoid introducing arbitrary colors when an existing theme token provides the required visual role.

---

## 2. Color Tokens

The `--color-*` tokens below are declared in the `@theme` block in `src/app/globals.css`.

### 2.1 Surface Foundations

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-canvas-base` | `#09090b` | Primary application canvas |
| `--color-canvas-subtle` | `#0d0d12` | Subtle canvas variation |
| `--color-surface-card` | `rgba(18, 18, 23, 0.75)` | Translucent card surface |
| `--color-surface-hover` | `rgba(26, 26, 34, 0.85)` | Hovered surface |
| `--color-surface-elevated` | `rgba(30, 30, 40, 0.90)` | Elevated surface |
| `--color-surface-glass` | `rgba(18, 18, 23, 0.60)` | Glass surface |

### 2.2 Border Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-border-subtle` | `rgba(255, 255, 255, 0.06)` | Low-contrast divider |
| `--color-border-medium` | `rgba(255, 255, 255, 0.12)` | Standard divider/border |
| `--color-border-gold` | `rgba(212, 175, 55, 0.30)` | Subtle Gold border |
| `--color-border-gold-strong` | `rgba(212, 175, 55, 0.60)` | Strong Gold border |

### 2.3 Gold Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-gold-400` | `#f5e0a3` | Light Gold |
| `--color-gold-500` | `#d4af37` | Primary PACT Gold |
| `--color-gold-600` | `#aa820a` | Dark Gold |
| `--color-gold-primary` | `#d4af37` | Primary Gold alias |
| `--color-gold-hover` | `#e5c158` | Gold hover state |
| `--color-gold-glow` | `rgba(212, 175, 55, 0.18)` | Gold glow |
| `--color-gold-ambient` | `rgba(212, 175, 55, 0.08)` | Ambient Gold lighting |

### 2.4 Text Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| `--color-text-primary` | `#f4f4f5` | Primary readable text |
| `--color-text-secondary` | `#a1a1aa` | Secondary text |
| `--color-text-muted` | `#71717a` | Low-emphasis text |
| `--color-text-gold` | `#e2c056` | Gold-accented text |

### 2.5 Status Tokens

| Token | Value | Meaning |
| --- | --- | --- |
| `--color-status-pending` | `#3b82f6` | Pending / informational state |
| `--color-status-progress` | `#f59e0b` | In-progress / warning state |
| `--color-status-completed` | `#10b981` | Completed / success state |
| `--color-status-missed` | `#ef4444` | Missed / danger state |
| `--color-status-waived` | `#8b5cf6` | Waived state |
| `--color-status-archived` | `#52525b` | Archived / inactive state |

---

## 3. Base CSS Variables

The `@theme` block defines the Tailwind theme tokens, while the `:root` block defines application-level CSS variables used throughout the interface. The variables below are declared in `:root` in `src/app/globals.css`.

### 3.1 Foundation Surfaces

| Variable | Value |
| --- | --- |
| `--bg-base` | `#09090b` |
| `--bg-canvas-subtle` | `#0d0d12` |
| `--bg-surface` | `#121217` |
| `--bg-surface-hover` | `#1a1a22` |
| `--bg-surface-elevated` | `#1e1e28` |
| `--bg-glass` | `rgba(18, 18, 23, 0.72)` |
| `--bg-glass-elevated` | `rgba(26, 26, 34, 0.82)` |

### 3.2 Borders

| Variable | Value |
| --- | --- |
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` |
| `--border-medium` | `rgba(255, 255, 255, 0.12)` |
| `--border-glass` | `rgba(255, 255, 255, 0.08)` |
| `--border-gold` | `rgba(212, 175, 55, 0.30)` |
| `--border-gold-strong` | `rgba(212, 175, 55, 0.60)` |

### 3.3 Brand Gold

| Variable | Value |
| --- | --- |
| `--brand-gold` | `#d4af37` |
| `--brand-gold-hover` | `#e5c158` |
| `--brand-gold-glow` | `rgba(212, 175, 55, 0.18)` |
| `--brand-gold-ambient` | `rgba(212, 175, 55, 0.08)` |

### 3.4 Text

| Variable | Value |
| --- | --- |
| `--text-primary` | `#f4f4f5` |
| `--text-secondary` | `#a1a1aa` |
| `--text-muted` | `#71717a` |
| `--text-gold` | `#e2c056` |

### 3.5 Semantic Status

| Variable | Value | Meaning |
| --- | --- | --- |
| `--status-success` | `#10b981` | Success |
| `--status-warning` | `#f59e0b` | Warning |
| `--status-danger` | `#ef4444` | Danger |
| `--status-info` | `#3b82f6` | Information |
| `--status-waived` | `#8b5cf6` | Waived |

### 3.6 Workspace Scaling

| Variable | Default |
| --- | --- |
| `--app-font-scale` | `100%` |

`--app-font-scale` is defined as `100%` in `:root`, and `globals.css` applies it to the root element:

```css
html {
  font-size: var(--app-font-scale);
}
```

The root HTML font size is therefore controlled by this variable.

---

## 4. Typography

PACT uses the **Geist** font family. The fonts are loaded using `next/font/google` in `src/app/layout.tsx`, specifically `Geist` and `Geist_Mono`.

### 4.1 Font Variables

| Variable | Font |
| --- | --- |
| `--font-geist-sans` | Geist Sans |
| `--font-geist-mono` | Geist Mono |

Geist Sans is the primary application font. Geist Mono is available for tabular, code, and monospace content.

The body fallback stack is:

```css
font-family: var(--font-geist-sans), system-ui, -apple-system,
  BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

---

## 5. Using CSS Variables

Reference tokens with `var()` instead of hard-coding values:

```css
.example-card {
  background: var(--bg-surface);
  color: var(--text-primary);
  border: 1px solid var(--border-subtle);
}

.example-card:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-gold);
}
```

---

## 6. Tailwind Usage

PACT uses Tailwind CSS v4. The `--color-*` tokens declared inside the `@theme` block generate Tailwind color utilities such as `bg-canvas-base`, `text-text-primary`, and `text-gold-500`. Plain `:root` variables such as `--bg-base` do not generate Tailwind utilities.

```tsx
<div className="bg-canvas-base text-text-primary">
  <span className="text-gold-500">PACT</span>
</div>
```

---

## 7. Glassmorphism Utilities

`src/app/globals.css` defines four glass utility classes:

| Class | Behavior |
| --- | --- |
| `.glass-card` | Translucent background, 16px blur, glass border, shadow |
| `.glass-surface` | Translucent background, 14px blur, subtle border |
| `.glass-elevated` | Stronger translucent background, 20px blur, elevated shadow |
| `.glass-interactive` | Translucent background, 16px blur, transition, Gold-accented hover state, and a slight upward transform on hover |

```tsx
<div className="glass-card">
  Card content
</div>

<div className="glass-surface">
  Surface content
</div>

<div className="glass-elevated">
  Elevated content
</div>

<button className="glass-interactive">
  Interactive action
</button>
```

---

## 8. Gold Lighting Utilities

`src/app/globals.css` defines two Gold lighting utility classes:

| Class | Behavior |
| --- | --- |
| `.spotlight-gold` | Creates a localized Gold radial glow toward the upper-right |
| `.amber-backlight` | Creates a broader amber radial background effect |

```tsx
<div className="spotlight-gold">
  Highlighted content
</div>

<div className="amber-backlight">
  Highlighted content
</div>
```

---

## 9. Dark Mode

The current root layout applies the `dark` class directly to the `<html>` element in `src/app/layout.tsx`:

```tsx
<html lang="en" className="dark" suppressHydrationWarning>
```

PACT currently uses a dark root theme. No light-theme token set or theme toggle was found in the inspected implementation.

---

## 10. Accessibility

### 10.1 Focus

Interactive elements use a Gold focus ring. `src/app/globals.css` targets form controls, buttons, and focusable elements:

```css
input:focus-visible,
textarea:focus-visible,
select:focus-visible,
button:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid var(--brand-gold) !important;
  outline-offset: 2px !important;
}
```

### 10.2 Reduced Motion

`src/app/globals.css` includes an `@media (prefers-reduced-motion: reduce)` block. When a user prefers reduced motion:

- Animation duration is reduced.
- Animation iteration count is limited.
- Transition duration is reduced.
- Smooth scrolling is disabled.
- The `.glass-interactive:hover` transform is removed.

### 10.3 Contrast

Check contrast before using `--text-muted` for small body text on dark surfaces.

---

## 11. Semantic Status Colors

The table below shows the semantic relationship between the `@theme` status tokens and the corresponding `:root` status variables.

| Meaning | Theme token | Base variable |
| --- | --- | --- |
| Pending / informational | `--color-status-pending` | `--status-info` |
| In progress / warning | `--color-status-progress` | `--status-warning` |
| Completed / success | `--color-status-completed` | `--status-success` |
| Missed / danger | `--color-status-missed` | `--status-danger` |
| Waived | `--color-status-waived` | `--status-waived` |
| Archived / inactive | `--color-status-archived` | — |

---

## 12. Do and Don't

**Do**

- Use existing tokens for every color, border, and text role.
- Keep Gold for brand emphasis, primary actions, focus states, and accents.
- Use status tokens for application state instead of picking colors by hand.
- Keep `:focus-visible` outlines visible against dark surfaces.

**Don't**

- Hard-code hex or `rgba()` values when a token exists.
- Introduce bright or opaque light panels that break the Obsidian canvas.
- Use Gold for large decorative areas; it is meant to be restrained.
- Redefine token values locally; change them in `src/app/globals.css`.

---

## 13. Quick Reference

| Need | Token or class |
| --- | --- |
| Page background | `--color-canvas-base` |
| Card background | `--color-surface-card` |
| Default text | `--color-text-primary` |
| Secondary text | `--color-text-secondary` |
| Brand / primary action | `--color-gold-500` |
| Subtle border | `--color-border-subtle` |
| Gold border | `--color-border-gold` |
| Success state | `--color-status-completed` |
| Danger state | `--color-status-missed` |
| Sans font | `--font-geist-sans` |
| Mono font | `--font-geist-mono` |
| Glass card | `.glass-card` |
| Gold glow | `.spotlight-gold` |

---

## 14. Source Files

- [`src/app/globals.css`](../src/app/globals.css) — theme tokens, base variables, utilities
- [`src/app/layout.tsx`](../src/app/layout.tsx) — Geist font setup and root `<html>` configuration