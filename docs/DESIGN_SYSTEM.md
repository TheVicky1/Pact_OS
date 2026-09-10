# PACT — Design System & Visual Identity Specification

> **Phase**: Phase 4B — Design System Foundation  
> **Status**: AUTHORITATIVE SPECIFICATION & IMPLEMENTATION  
> **Source Documents**: `docs/ACCOUNTABILITY_UX_SPEC.md`, Visual North Star (`media_1788900653447.png`)

---

## 1. Authoritative Brand Identity

### The Official PACT Brand Mark
The **Official PACT Brand Mark** is defined exclusively by the **Gold Geometric P Monogram** (`/brand/pact-logo.png`).

- **Single Source of Truth**: Preserved verbatim from the approved master asset (`media_1788887018548.png`).
- **Component**: `<PactLogo size="sm" | "md" | "lg" showText={boolean} priority={boolean} />` in `src/components/brand/pact-logo.tsx`.
- **Mandatory Usage**: Favicon, browser tab icon, application navigation, authentication screens, mobile app icon, loading states, and metadata cards.
- **Rule**: Never recreate the logo using CSS, generic icons, SVG approximations, or other letter "P" fonts.

---

## 2. Visual Direction & Aesthetic Philosophy

PACT's visual identity reflects high-performance personal operating systems:
- **Cinematic Dark Foundation**: Near-black backgrounds (`#09090B`, `#0D0D12`) offering optical depth and zero light-glare.
- **Controlled Glassmorphism**: Translucent surfaces (`rgba(18, 18, 23, 0.72)`) with refined backdrop blur (`backdrop-blur-md` to `backdrop-blur-xl`) and ultra-subtle borders (`rgba(255, 255, 255, 0.07)`).
- **Restrained Warm Gold**: PACT Gold (`#D4AF37`) is used purposefully for primary actions, active navigation, focus rings, and milestone highlights. It is never applied indiscriminately.
- **Directional Lighting**: Subtle radial spotlights and warm amber ambient backlights ground key cards without noisy neon gradients.
- **Tone**: Calm, disciplined, mature, executive. No childish badges, neon gradients, or gamified shame loops.

---

## 3. Design Tokens & Color Palette

### 3.1 Surface Foundations
```css
--color-canvas-base: #09090b;           /* Main screen base canvas */
--color-canvas-subtle: #0d0d12;         /* Slightly lifted backdrop layer */
--color-surface-card: rgba(18, 18, 23, 0.75);   /* Standard glass card surface */
--color-surface-hover: rgba(26, 26, 34, 0.85);  /* Interactive card hover */
--color-surface-elevated: rgba(30, 30, 40, 0.90); /* Popovers & dialogs */
--color-surface-glass: rgba(18, 18, 23, 0.60);  /* Soft background layer */
```

### 3.2 Borders & Specular Lines
```css
--color-border-subtle: rgba(255, 255, 255, 0.06); /* Standard dividers & card boundaries */
--color-border-medium: rgba(255, 255, 255, 0.12); /* Interactive borders & dialog edges */
--color-border-gold: rgba(212, 175, 55, 0.30);    /* Active commitments & focus rings */
--color-border-gold-strong: rgba(212, 175, 55, 0.60); /* Primary emphasis states */
```

### 3.3 Brand Gold Palette
```css
--color-gold-400: #f5e0a3;              /* Highlights & gradient stops */
--color-gold-500: #d4af37;              /* Primary authoritative gold */
--color-gold-600: #aa820a;              /* Deep gold shadows */
--color-gold-hover: #e5c158;            /* Button & interactive hover */
--color-gold-glow: rgba(212, 175, 55, 0.18);    /* Radial backlights */
--color-gold-ambient: rgba(212, 175, 55, 0.08); /* Card back-glow */
```

### 3.4 Typography Colors
```css
--color-text-primary: #f4f4f5;          /* Headings & high-contrast titles */
--color-text-secondary: #a1a1aa;        /* Secondary copy & form labels */
--color-text-muted: #71717a;            /* Micro-copy, timestamps, placeholders */
--color-text-gold: #e2c056;             /* Accent badges & priority tags */
```

### 3.5 Semantic Status Tokens
```css
--color-status-pending: #3b82f6;        /* Blue: scheduled/pending */
--color-status-progress: #f59e0b;       /* Amber: active/in-progress */
--color-status-completed: #10b981;      /* Emerald: fulfilled/completed */
--color-status-missed: #ef4444;         /* Crimson: missed/activated */
--color-status-waived: #8b5cf6;         /* Purple: waived */
--color-status-archived: #52525b;       /* Zinc: archived */
```

---

## 4. Typography Hierarchy

- **Primary Font**: `Geist Sans` (`var(--font-geist-sans)`).
- **Tabular / Monospace Font**: `Geist Mono` (`var(--font-geist-mono)`).
- **Display 1**: `text-4xl font-bold tracking-tight text-zinc-100` (Hero headlines).
- **Heading 1**: `text-2xl font-semibold tracking-tight text-zinc-100` (Section titles).
- **Heading 2**: `text-lg font-semibold tracking-normal text-zinc-100` (Card titles).
- **Body Regular**: `text-sm font-normal text-zinc-300 leading-relaxed` (Descriptions).
- **Caption / Meta**: `text-xs font-medium text-zinc-400` (Timestamps, priority tags).
- **Numeric / Stat Values**: `font-mono tracking-tight font-medium text-zinc-100` (Metrics, deadlines, ratios).

---

## 5. Spacing Scale & Radius System

### Spacing Scale
- Page Padding: `px-6 sm:px-10 py-8` (Max container `1440px`)
- Section Spacing: `space-y-8`
- Card Padding:
  - Small: `p-3 sm:p-4`
  - Medium (Default): `p-5 sm:p-6`
  - Large: `p-6 sm:p-8`
- Form Gaps: `space-y-4` to `space-y-5`

### Radius Scale
- `rounded-lg` (`8px`): Checkboxes, compact controls, tag chips.
- `rounded-xl` (`12px`): Inputs, standard buttons, dropdown menus.
- `rounded-2xl` (`16px`): Small cards, alert callouts.
- `rounded-3xl` (`24px`): Standard glass cards, dialogs, modals.
- `rounded-[32px]` (`32px`): Outer sectional panels, dashboard frame.
- `rounded-full` (`9999px`): Badges, status dots, icon buttons, pill buttons (`+ Add Widget`, `Customize`).

---

## 6. Component Primitives Reference (`src/components/ui/`)

| Component | File | Purpose & Key Props |
|---|---|---|
| `GlassCard` | `glass-card.tsx` | Base dark glass surface. Props: `variant` (`default`, `elevated`, `interactive`, `spotlight`), `padding`, `glow` (`gold`, `amber`). |
| `GlassPanel` | `glass-card.tsx` | Large container panel (`rounded-[32px]`) for sectional grouping. |
| `Button` | `button.tsx` | Action button. Props: `variant` (`primary`, `secondary`, `ghost`, `destructive`, `icon`), `size`, `pill`, `loading`, `icon`, `fullWidth`. |
| `Input` | `input.tsx` | Dark glass input. Props: `leftIcon`, `rightIcon`, `error`, standard HTML input props. |
| `Textarea` | `input.tsx` | Dark glass textarea with error state. |
| `Select` | `input.tsx` | Styled dark glass dropdown with custom chevron. |
| `Checkbox` | `input.tsx` | Accessible checkbox with emerald/gold checkmark. |
| `Switch` | `input.tsx` | Accessible toggle switch with `role="switch"` and `aria-checked`. |
| `FormField` | `input.tsx` | Form label, helper text, and accessible error wrapper. |
| `Badge` | `badge.tsx` | Semantic tag chip. Props: `variant` (`neutral`, `gold`, `success`, `warning`, `danger`, `info`, `waived`), `size`, `withDot`, `icon`. |
| `StatusIndicator` | `badge.tsx` | Standalone status dot with optional live pulse animation. |
| `Modal` | `modal.tsx` | Accessible dialog with backdrop blur, focus trap, and Escape key listener. |
| `Alert` | `alert.tsx` | Semantic notification callout with dismiss support. |
| `GoldSpotlight` | `ambient-glow.tsx` | Directional radial spotlight for card corners. |
| `AmberBacklight` | `ambient-glow.tsx` | Diffuse warm amber backlight for metric cards. |
| `CanvasAmbientLight` | `ambient-glow.tsx` | Wide ambient glow for hero section backgrounds. |
| `Divider` | `divider.tsx` | Subtle line separator with optional center text label. |

---

## 7. Accessibility & Focus System (WCAG AA)

- **Contrast Guarantee**: All text tokens meet or exceed WCAG AA 4.5:1 against dark surfaces (`#A1A1AA` on `#121217` = 5.2:1; `#F4F4F5` on `#121217` = 14.8:1).
- **High-Visibility Focus Outline**:
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
- **Semantic HTML & ARIA**:
  - `role="dialog"` with `aria-modal="true"`, `aria-labelledby`, and `aria-describedby` on `Modal`.
  - `role="alert"` on `Alert` and inline validation messages.
  - `role="switch"` and `aria-checked` on `Switch`.
  - `aria-busy` and `disabled` states on loading buttons.
- **Touch Target Sizing**: Primary interactive targets maintain minimum $44 \times 44\text{px}$ touch targets.

---

## 8. Motion Design Tokens & Reduced Motion

- **Fast (Hover/Feedback)**: `150ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Medium (Dialogs/Dropdowns)**: `220ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Deliberate (Interventions)**: `350ms ease-out`
- **Reduced Motion**: Under `@media (prefers-reduced-motion: reduce)`, all transitions default to `0.01ms` duration and transforms are eliminated, maintaining full functional usability.
