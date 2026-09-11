# PACT — Design System & Visual Identity Specification

> **Phase**: Production Luxury Polish  
> **Status**: AUTHORITATIVE SPECIFICATION & IMPLEMENTATION  
> **Design North Star**: `PREMIUM + MINIMAL + RICH + CINEMATIC + DISCIPLINED`  
> **Core Aesthetic**: Obsidian Black Canvas + Crisp Warm White + Restrained PACT Gold

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

PACT's visual identity reflects a high-performance personal operating system engineered for disciplined execution:
- **Cinematic Obsidian Foundation**: Deepest OLED obsidian and canvas black (`#050505`, `#070707`, `#090909`) providing infinite optical depth with zero light glare.
- **Solid Luxury Surfaces**: Rich, disciplined card surfaces (`#0C0C0F`, `#101012`, `#121214`) built with ultra-subtle hairline borders (`rgba(255, 255, 255, 0.06)`).
- **Restrained Warm Gold Accent**: PACT Gold (`#D4AF37`) is applied with strict surgical intent: active day indicators, progress highlights, razor-thin crescent specular rims, and subtle corner spotlights. No loud neon gradients or decorative rainbow chips.
- **3D Celestial Planetary Architecture**: The daily hero features a volumetric celestial planet sphere rendered with multi-layered radial lighting, Rayleigh atmospheric back-scatter, and a razor-thin gold crescent rim highlight—evoking cosmic scale and disciplined focus.
- **Tone**: Executive, calm, disciplined, timeless. Free of gamified badges, neon glows, or visual clutter.

---

## 3. Design Tokens & Color Palette

### 3.1 Canvas & Surface Foundations
```css
--color-canvas-base: #050505;           /* Deepest obsidian foundation */
--color-canvas-subtle: #070707;         /* Secondary workspace background */
--color-canvas-elevated: #090909;       /* Sectional container backing */
--color-surface-card: #0c0c0f;          /* Standard luxury card surface */
--color-surface-subtle: #101012;        /* Secondary widget surface */
--color-surface-elevated: #151517;      /* Popovers, menus & active focus cards */
--color-surface-glass: rgba(12, 12, 15, 0.85); /* Blurred backdrop headers */
```

### 3.2 Borders & Specular Lines
```css
--color-border-subtle: rgba(255, 255, 255, 0.06); /* Standard card boundaries & dividers */
--color-border-medium: rgba(255, 255, 255, 0.10); /* Interactive borders & dialog edges */
--color-border-hover: rgba(255, 255, 255, 0.16);  /* Hover elevation borders */
--color-border-gold: rgba(212, 175, 55, 0.20);    /* Active commitments & focus rings */
--color-border-gold-strong: rgba(212, 175, 55, 0.50); /* Primary emphasis states */
```

### 3.3 Brand Gold Palette
```css
--color-gold-300: #fff7d6;              /* Specular rim highlight & crescent apex */
--color-gold-400: #e6c34a;              /* Bright gold accent & active markers */
--color-gold-500: #d4af37;              /* Primary authoritative PACT gold */
--color-gold-600: #aa820a;              /* Deep gold shade & track borders */
--color-gold-glow: rgba(212, 175, 55, 0.12);    /* Subtle radial card spotlight */
--color-gold-ambient: rgba(212, 175, 55, 0.04); /* Ambient celestial corona */
```

### 3.4 Typography Colors
```css
--color-text-primary: #f5f5f5;          /* Headings, high-contrast titles & numerals */
--color-text-body: #e8e8e8;             /* Primary descriptions & body copy */
--color-text-secondary: #8b8b92;        /* Subtitles, labels & secondary copy */
--color-text-muted: #71717a;            /* Micro-copy, timestamps, inactive dates */
--color-text-gold: #d4af37;             /* Accent badges & primary metrics */
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

## 4. 3D Celestial Planetary Hero Architecture

The Overview hero (`src/features/dashboard/components/daily-focus-hero.tsx`) implements a photorealistic 3D celestial sphere that serves as the visual centerpiece:

```
                  . - ~ ~ ~ - .
              . '       /       ' .
            /        . '             \
           /       /       (Apex)     \     <- Razor-thin Crescent Rim Highlight (#FFF7D6 / #D4AF37)
          |       |         ●          |
          |       |      3D Sphere     |    <- Multi-layer Radial Fill (#1E1E26 -> #050507)
          |        \      Volume      /
           \         . _         _ . /      <- Atmospheric Rayleigh Back-scatter
            \             ~ ~ ~     /
              . _                 _ .
                  ' - _ _ _ _ - '
```

### 4.1 Construction Rules
1. **Volumetric Radial Gradients**: Avoid hard circular 2D borders (`border-white/[0.04]`), which flatten the object into a ring. Instead, utilize multi-layered SVG radial gradients (`#1E1E26` $\rightarrow$ `#050507`) simulating spherical curvature.
2. **Rayleigh Atmospheric Scatter**: Back-scatter radial glow positioned offset to the top-right creates the illusion of light wrapping around a planetary limb.
3. **Razor-Thin Specular Crescent**: A precision path along the upper-right circumference illuminated with a gradient from `#FFF7D6` through `#D4AF37` to `transparent`, creating a razor-sharp illuminated edge.
4. **Faint Orbital Coordinate Grid**: Ultra-fine concentric orbital ellipses rendered in PACT Gold at 8–12% opacity (`stroke="#D4AF37" strokeOpacity="0.08"`).
5. **Atmospheric Corona**: A diffuse golden outer aura (`blur-2xl` to `blur-3xl`, opacity 0.12) grounding the celestial body into the deep obsidian canvas.

---

## 5. Card Architecture & Geometry Tokens

### 5.1 Primary Metric Cards
All 4 primary metric cards (`src/features/dashboard/components/overview-view.tsx`) adhere to an identical architectural template:
- **Background**: Solid `#0C0C0F` luxury surface.
- **Border**: `border border-white/[0.06]`.
- **Orbital Corner Accent**: Subtle SVG concentric quarter-circles in the top-right corner rendered in `#D4AF37` at 8% opacity.
- **Numerals**: `#F5F5F5` with `font-semibold` / `font-mono`.
- **Action Indicator**: Small `ArrowUpRight` icon in top-right with `text-zinc-600 group-hover:text-gold-400` transition.
- **Hover State**: `hover:border-white/12 hover:-translate-y-0.5 transition-all duration-200`.

### 5.2 Immediate Focus Card
- **Background**: `#0C0C0F` with a soft directional radial spotlight (`bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.06),transparent_70%)]`).
- **Accent Border**: `border-gold-500/20` with a subtle golden glow on hover (`hover:border-gold-500/35 hover:shadow-[0_4px_24px_rgba(212,175,55,0.06)]`).
- **Typography**: Clean hierarchy with high-contrast active task title (`#F5F5F5`) and secondary metadata.

### 5.3 Daily Cadence & Follow-Through Widgets
- **Follow-Through Rate**: Monochromatic dark track with primary `#D4AF37` fill and percentage readouts.
- **24H Daily Cadence**: 24-bar distribution histogram with `#D4AF37` peak highlight and subtle `#1C1C24` inactive bars.

---

## 6. Tooltip & Navigation Interaction Standards

### 6.1 Custom Delay-Gated Tooltip Pattern
To eliminate intrusive native browser tooltips that obstruct adjacent controls:
- **No Native `title` Attributes**: Never use raw HTML `title="..."` attributes on date navigation arrows or interactive pills.
- **Custom Tooltip Component**: Use a floating, pointer-events-disabled tooltip container (`pointer-events-none z-50`).
- **Positioning**: Fixed above the trigger target with `bottom-full mb-2` and centered horizontally (`left-1/2 -translate-x-1/2`).
- **Hover Delay**: 350ms activation delay (`transition-opacity duration-200 delay-[350ms]`) so tooltips only appear on intentional resting hover, not during rapid cursor transit.
- **Styling**: `#151518` elevated background, `border border-white/10`, `text-[11px] text-zinc-300 font-medium px-2 py-0.5 rounded-md shadow-lg`.

---

## 7. Typography Hierarchy

- **Primary Font**: `Geist Sans` (`var(--font-geist-sans)`).
- **Tabular / Monospace Font**: `Geist Mono` (`var(--font-geist-mono)`).
- **Display 1**: `text-4xl font-bold tracking-tight text-[#F5F5F5]` (Hero headlines).
- **Heading 1**: `text-2xl font-semibold tracking-tight text-[#F5F5F5]` (Section titles).
- **Heading 2**: `text-lg font-semibold tracking-normal text-[#F5F5F5]` (Card titles).
- **Body Regular**: `text-sm font-normal text-[#E8E8E8] leading-relaxed` (Descriptions).
- **Caption / Meta**: `text-xs font-medium text-[#8B8B92]` (Timestamps, priority tags).
- **Numeric / Stat Values**: `font-mono tracking-tight font-semibold text-[#F5F5F5]` (Metrics, deadlines, ratios).

---

## 8. Spacing Scale & Radius System

### Spacing Scale
- Page Padding: `px-6 sm:px-10 py-8` (Max container `1440px`)
- Section Spacing: `space-y-8`
- Card Padding:
  - Small: `p-3 sm:p-4`
  - Medium (Default): `p-5 sm:p-6`
  - Large: `p-6 sm:p-8`

### Radius Scale
- `rounded-lg` (`8px`): Checkboxes, compact controls, tag chips.
- `rounded-xl` (`12px`): Inputs, standard buttons, dropdown menus.
- `rounded-2xl` (`16px`): Small cards, alert callouts, metric blocks.
- `rounded-3xl` (`24px`): Standard luxury cards, dialogs, modals.
- `rounded-[32px]` (`32px`): Outer sectional panels, dashboard frame.
- `rounded-full` (`9999px`): Badges, status dots, icon buttons, pill buttons (`+ Add Widget`, `Customize`).

---

## 9. Component Primitives Reference (`src/components/ui/`)

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

## 10. Accessibility & Focus System (WCAG AA)

- **Contrast Guarantee**: All text tokens meet or exceed WCAG AA 4.5:1 against dark surfaces (`#8B8B92` on `#0C0C0F` = 4.8:1; `#F5F5F5` on `#0C0C0F` = 16.5:1).
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

## 11. Motion Design Tokens & Reduced Motion

- **Fast (Hover/Feedback)**: `150ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Medium (Dialogs/Dropdowns)**: `220ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Deliberate (Interventions)**: `350ms ease-out`
- **Reduced Motion**: Under `@media (prefers-reduced-motion: reduce)`, all transitions default to `0.01ms` duration and transforms are eliminated, maintaining full functional usability.

