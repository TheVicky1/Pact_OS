# PACT — Design System & Visual Identity Specification

## 1. Official Brand Identity (Reference Image 2) [CONFIRMED]

### Authoritative Brand Asset
The **Official PACT Brand Mark** is defined exclusively by the **Gold P Monogram** (Reference Image 2).

```
       ╭─────────────╮
       │   PACT      │  <-- Gold P Monogram
       ╰─────────────╯
```

> [!IMPORTANT]
> The Gold P Monogram is the sole authoritative visual brand mark for PACT across all product surfaces:
> - **Mandatory Locations**: Favicon, browser tab icon, application sidebar header, authentication screens, mobile app icon, loading states, social preview cards.
> - **Strict Rule**: Never replace the Gold P Monogram with generic icons, temporary shapes, or unapproved logos.

---

## 2. Visual Direction & Aesthetic North Star (Reference Image 1) [CONFIRMED]

### Visual North Star (Inspiration, NOT a Direct Copy)
The visual experience takes inspiration from Reference Image 1 as a **visual north star** for dark, premium productivity software:
- **Cinematic Dark Foundation**: Near-black backgrounds (`#09090B`, `#0D0D11`) with visual depth.
- **Glassmorphism & Depth**: Soft backdrop blurs (`backdrop-blur-md`), subtle translucent surfaces, ambient lighting highlights.
- **Typography & Structure**: Clean sans-serif typography, deliberate whitespace, structured metric cards.
- **Restrained Accents**: Warm PACT Gold used intentionally as a primary accent.

> [!NOTE]
> Reference Image 1 serves as visual inspiration for aesthetic quality. PACT is **NOT** a direct copy of any reference application; PACT maintains its own distinct product identity, layout, and feature experience.

---

## 3. Design Tokens & Color Palette [PROPOSED]

### Base Surfaces & Backgrounds
```css
:root {
  /* Background Foundations */
  --bg-base: #09090b;           /* Main screen background */
  --bg-surface: #121217;        /* Standard card background */
  --bg-surface-hover: #1a1a22;  /* Interactive card hover state */
  --bg-glass: rgba(18, 18, 23, 0.65); /* Glassmorphic card surface */
  
  /* Borders & Dividers */
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-glass: rgba(255, 255, 255, 0.12);
  --border-gold-subtle: rgba(212, 175, 55, 0.25);

  /* PACT Brand Accent (Gold Monogram Accent) */
  --brand-gold-primary: #D4AF37;  /* Primary brand gold accent */
  --brand-gold-hover: #E5C158;    /* Interactive hover gold */
  --brand-gold-glow: rgba(212, 175, 55, 0.15); /* Ambient backlight glow */

  /* Text & Content Hierarchy */
  --text-primary: #f4f4f5;      /* Main headings & high-emphasis text */
  --text-secondary: #a1a1aa;    /* Labels, descriptions, secondary copy */
  --text-muted: #71717a;        /* Micro-copy, timestamps, placeholders */
  --text-gold: #e2c056;         /* Accent text & badge labels */

  /* Functional Status Colors */
  --status-success: #10b981;    /* Completed tasks & positive metrics */
  --status-warning: #f59e0b;    /* Approaching deadlines & warnings */
  --status-danger: #ef4444;     /* Missed commitments & financial alerts */
  --status-info: #3b82f6;       /* Neutral informational tags */
}
```

---

## 4. Accessibility Standards [CONFIRMED]

- **Contrast Ratios**: Body text meets minimum WCAG AA contrast (4.5:1 against dark surfaces).
- **Visible Focus States**: Keyboard navigation triggers a high-visibility gold focus outline (`ring-2 ring-gold-primary`).
- **Reduced Motion**: Respects `prefers-reduced-motion: reduce` by disabling non-essential background animations.
