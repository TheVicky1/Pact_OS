# ⚡ PACT — Performance Profiling & Benchmarking Guide

This guide provides comprehensive, actionable instructions for contributors and core maintainers to profile UI rendering performance, measure client bundle sizes, execute automated benchmark suites, and diagnose latency bottlenecks across **PACT OS**.

> 🌐 **Live Production App**: **[https://pact-os.vercel.app](https://pact-os.vercel.app)**  
> 📖 **Related Guides**: [Troubleshooting Guide](TROUBLESHOOTING.md) · [Developer Guide](DEVELOPMENT.md) · [Testing Strategy](TESTING.md) · [Architecture Specification](ARCHITECTURE.md) · [CI Pipeline](CI_PIPELINE.md)

---

## Quick Navigation

1. [Performance Philosophy & Targets](#1-performance-philosophy--targets)
2. [Core Web Vitals & Metrics Matrix](#2-core-web-vitals--metrics-matrix)
3. [React DevTools Profiler Deep-Dive](#3-react-devtools-profiler-deep-dive)
4. [Chrome Lighthouse Audits & Budgets](#4-chrome-lighthouse-audits--budgets)
5. [Bundle Size Analysis & Visualizers](#5-bundle-size-analysis--visualizers)
6. [CLI Automation & Vitest Benchmarks](#6-cli-automation--vitest-benchmarks)
7. [Component & Animation Optimization Best Practices](#7-component--animation-optimization-best-practices)
8. [Contributor Performance Checklist](#8-contributor-performance-checklist)

---

## 1. Performance Philosophy & Targets

PACT is a Personal Operating System designed to turn intent into discipline. Sub-second feedback loops, buttery 60 FPS animations, and instant UI responsiveness are essential to maintaining user state of flow. Sluggish component re-renders or multi-megabyte client bundles directly undermine user trust.

### Architectural Rules of Performance
- **Server-First by Default**: Keep data fetching, heavy computational logic, and initial page rendering on the server using Next.js App Router Server Components.
- **Push `"use client"` Down to Leaf Nodes**: Keep interactive client component boundaries as small as possible. Never mark entire route layouts or page views as client components if only a single button or modal needs client state.
- **Zero Layout Thrashing**: Ensure DOM geometry reads and writes do not force synchronous reflow loops.
- **Predictable Render Budgets**: An interactive click, tap, or keystroke must paint to the screen within **16ms** (60 FPS) and process background side effects asynchronously.

---

## 2. Core Web Vitals & Metrics Matrix

Every page in PACT OS is monitored against Google's Core Web Vitals standard. Staging environments and pull requests must meet or exceed the **Good** threshold:

| Metric | Full Name | Good (Target) | Needs Work | Poor | PACT Optimization Strategy |
|---|---|---|---|---|---|
| **INP** | Interaction to Next Paint | **≤ 200 ms** | 200–500 ms | > 500 ms | React `startTransition`, non-blocking event handlers, microtask scheduling |
| **LCP** | Largest Contentful Paint | **≤ 2.5 s** | 2.5–4.0 s | > 4.0 s | Streaming SSR with Suspense, lazy loading below-the-fold widgets |
| **CLS** | Cumulative Layout Shift | **≤ 0.10** | 0.10–0.25 | > 0.25 | Fixed aspect ratios, container skeleton placeholders, CSS `content-visibility` |
| **FCP** | First Contentful Paint | **≤ 1.8 s** | 1.8–3.0 s | > 3.0 s | Critical CSS inlining, font subsetting via `next/font`, edge caching |
| **TTFB** | Time to First Byte | **≤ 800 ms** | 800–1800 ms | > 1800 ms | Supabase edge connections, cached RPC reads, minimal server cold starts |

### Understanding INP in React 18 & 19
Interaction to Next Paint measures overall interaction responsiveness throughout the user session:
- **Urgent Updates**: Keystrokes, button toggles, modal open/close states must update state synchronously so users receive immediate visual feedback.
- **Non-Urgent Updates**: Re-calculating timeline intervals, filtering task histories, or refreshing analytics charts should be wrapped in `startTransition(() => { ... })` so long computations do not freeze the main thread.

---

## 3. React DevTools Profiler Deep-Dive

The React DevTools Profiler is the primary tool for diagnosing unnecessary component re-renders and identifying slow render phases.

### 3.1 Initial Setup & Configuration

1. Install the **React Developer Tools** browser extension (Chrome / Firefox / Edge).
2. Open Chrome DevTools (`F12` or `Cmd + Option + I`) and select the **Profiler** tab.
3. Click the **Gear Icon (Settings)** at the top right of the DevTools panel:
   - Navigate to the **Profiler** tab in settings.
   - ✅ **Check "Record why each component rendered while profiling"** *(Critical for pinpointing prop/state causes)*.
   - ✅ **Check "Hide commits below 5ms"** *(Optional: filters background noise)*.

### 3.2 Profiling a Live Interaction

Follow these steps to capture an isolated interaction profile:

```bash
# 1. Start development server
npm run dev

# 2. Or build with React profiling flags enabled for production parity:
NODE_ENV=production npm run build
npm run start
```

1. Navigate to the view you wish to inspect (e.g., `http://localhost:3000/app/calendar` or `http://localhost:3000/app/dashboard`).
2. In React DevTools **Profiler**, click the **Start Profiling** button (blue circle).
3. Perform a single target interaction:
   - Example A: Click a task completion checkbox.
   - Example B: Toggle the date filter or switch views.
   - Example C: Drag a calendar event block.
4. Click **Stop Profiling** (red circle).

### 3.3 Analyzing Views

#### 1. The Flamegraph View
- **Horizontal Bar Width**: Represents the time spent rendering that component during the selected commit. Longer bars = more CPU time.
- **Bar Color**:
  - 🟩 **Green / Blue**: Fast render, well within frame budget.
  - 🟨 **Yellow / Orange**: Slow render, candidate for optimization.
  - ⬜ **Gray**: Component did not re-render in this commit (successfully memoized).
- **Inspecting Why It Rendered**: Click any component bar in the Flamegraph. The right-hand panel displays:
  - *Rendered at*: timestamp and self-duration.
  - *Why did this render?*: e.g., `props.items changed`, `state.filter changed`, or `Parent component rendered`.

#### 2. The Ranked Chart View
- Switch from Flamegraph to **Ranked** in the top-left dropdown.
- Sorts every component rendered in that commit from longest to shortest self-duration.
- Immediately exposes the top bottleneck components without needing to traverse the tree hierarchy.

#### 3. Commit Markers & Navigation
- The top bar displays a sequence of commit markers representing each time React flushed updates to the DOM.
- Marker height indicates total commit duration.
- Select the tallest markers to see the most expensive updates.

---

## 4. Chrome Lighthouse Audits & Budgets

Lighthouse audits measure user-perceived performance, Core Web Vitals, and resource efficiency under realistic network and CPU constraints.

### 4.1 Running a Local Audit

> [!IMPORTANT]
> Never run Lighthouse audits against the development server (`npm run dev`). The dev server injects development scripts, Fast Refresh listeners, and unminified bundles that distort metrics. Always run audits on a production build.

```bash
# 1. Build and start production bundle locally
npm run build
npm run start
```

1. Open Google Chrome in an **Incognito Window** (extensions can penalize scores by 20–30 points).
2. Open Chrome DevTools (`F12`) and navigate to the **Lighthouse** tab.
3. Configure the audit parameters:
   - **Mode**: Navigation (Default)
   - **Device**: Select **Mobile** first (mobile simulated throttling is our baseline), then test **Desktop**.
   - **Categories**: Check **Performance** (and Best Practices).
4. Click **Analyze page load**.

### 4.2 Interpreting Audit Diagnostics

- **Opportunities**:
  - *Eliminate render-blocking resources*: Defer non-critical CSS/JS.
  - *Reduce unused JavaScript*: Split code or dynamic-import heavy features.
  - *Properly size images*: Use `next/image` with `sizes` attribute.
- **Diagnostics**:
  - *Minimize main-thread work*: Avoid parsing massive JSON payloads or long synchronous loops.
  - *Avoid enormous network payloads*: Ensure the total initial page weight is < **500 KB**.
  - *Avoid non-composited animations*: Ensure Framer Motion is only animating `transform` or `opacity`.

---

## 5. Bundle Size Analysis & Visualizers

Keeping client-side JavaScript lean ensures fast parse, compile, and hydration times across lower-end devices.

### 5.1 Setting Up and Running `@next/bundle-analyzer`

Next.js provides official integration with `@next/bundle-analyzer` to inspect bundle composition.

```bash
# Run bundle analyzer build
ANALYZE=true npm run build
```

When enabled, Next.js generates interactive HTML dependency maps:
- `.next/analyze/client.html`: Visualizes all client chunks downloaded by the browser.
- `.next/analyze/nodejs.html`: Visualizes server-side bundle chunks.

### 5.2 Bundle Budgets

Contributors must adhere to the following bundle limits:

| Target Bundle | Maximum Allowed (Gzipped) | Notes |
|---|---|---|
| **First Load JS (Shared by all)** | **< 100 KB** | Framework, router, essential context |
| **Individual Route Chunk** | **< 60 KB** | Specific page logic |
| **Total Initial Client Payload** | **< 160 KB** | Critical initial bundle |

### 5.3 Common Bundle Traps & Fixes

#### ❌ Trap 1: Barrel Imports on Large Icon or Utility Libraries
```tsx
// ❌ WRONG: May pull entire library chunk into client bundle
import * as Icons from 'lucide-react';
```
```tsx
// ✅ CORRECT: Direct named imports support tree-shaking
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
```

#### ❌ Trap 2: Importing Server Libraries in Client Components
Never import Node-specific modules (like `pg`, filesystem utilities, or full Supabase admin clients) inside files with `"use client"`.

---

## 6. CLI Automation & Vitest Benchmarks

### 6.1 Lighthouse CI (`@lhci/cli`)

We support automated Lighthouse CI checks to guard against performance regressions in automated pipelines.

```bash
# 1. Install Lighthouse CI CLI globally or run via npx
npx @lhci/cli --version

# 2. Collect and assert performance metrics locally
npx @lhci/cli collect --url=http://localhost:3000/app --numberOfRuns=3
npx @lhci/cli assert --assertions.categories:performance=error:0.90
```

#### Example `.lighthouserc.json`
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "npm run start",
      "url": ["http://localhost:3000/app", "http://localhost:3000/app/calendar"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "interactive": ["error", { "maxNumericValue": 3500 }]
      }
    }
  }
}
```

### 6.2 Microbenchmarking Suites with Vitest

For CPU-intensive utility functions, analytics computations, and data transformations, use Vitest benchmark suites.

#### Running Benchmarks
```bash
# Run benchmarking suite
npm run bench

# Or with pnpm / vitest CLI
pnpm test:bench
```

#### Writing a Benchmark Test (`tests/benchmarks/analytics.bench.ts`)
```ts
import { bench, describe } from 'vitest';
import { calculateGoalProgressPercentage } from '@/lib/analytics';
import { parseCalendarEventIntervals } from '@/features/calendar/layout';

describe('Analytics & Layout Performance Benchmarks', () => {
  bench('calculateGoalProgressPercentage (10,000 iterations)', () => {
    for (let i = 0; i < 10000; i++) {
      calculateGoalProgressPercentage(i, 10000);
    }
  });

  const mockIntervals = Array.from({ length: 100 }, (_, i) => ({
    startMinutes: i * 10,
    endMinutes: i * 10 + 45,
  }));

  bench('parseCalendarEventIntervals (100 events)', () => {
    parseCalendarEventIntervals(mockIntervals);
  });
});
```

---

## 7. Component & Animation Optimization Best Practices

### 7.1 React Memoization Rules

Memoization is not free; `React.memo`, `useMemo`, and `useCallback` introduce memory overhead and shallow comparison checks on every render.

- **Apply `React.memo` when**:
  - The component renders often with identical props.
  - The component tree below it is expensive to re-render.
  - Props are primitive values or referentially stable objects.
- **Do NOT apply `React.memo` when**:
  - The component is cheap to render (e.g., standard text label or icon).
  - Props change on nearly every render (e.g., dynamic timestamps).

#### Stable Callbacks & References
```tsx
// ✅ Wrap handlers passed to memoized children in useCallback
const handleToggleTask = useCallback((taskId: string) => {
  setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
}, []);

// ✅ Wrap heavy multi-element computations in useMemo
const sortedTasks = useMemo(() => {
  return tasks.slice().sort((a, b) => a.priority - b.priority);
}, [tasks]);
```

### 7.2 DOM Virtualization for Large Lists

When rendering large collections (e.g., hundreds of calendar event blocks, audit histories, or activity logs), rendering all DOM nodes degrades scroll performance.

- Use **virtual windowing** (e.g. `@tanstack/react-virtual`):
  - Only DOM elements currently inside the visible viewport (+ small overscan buffer) are mounted.
  - Keeps the active DOM node count below 100 regardless of dataset size.

### 7.3 Code Splitting & Dynamic Imports

Split non-critical or below-the-fold modules using `next/dynamic`:

```tsx
import dynamic from 'next/dynamic';

// Heavy 3D canvas or chart widgets loaded lazily on the client
const CelestialHeroCanvas = dynamic(
  () => import('@/components/celestial/hero-canvas'),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse bg-zinc-900 rounded-xl" />,
  }
);

// Modals only loaded when triggered by user
const EventModal = dynamic(
  () => import('@/features/calendar/components/event-modal').then(m => m.EventModal),
  { ssr: false }
);
```

### 7.4 Framer Motion Hardware Acceleration

Framer Motion is used throughout PACT for luxury micro-interactions. Follow these rules to avoid animation jank:

1. **Only Animate Composited Properties**:
   - ✅ `transform` (`scale`, `x`, `y`, `rotate`)
   - ✅ `opacity`
   - ❌ Never animate `height`, `width`, `top`, `left`, `margin` (these trigger browser reflows/layout thrashing).
2. **Use `layout` Prop Judiciously**:
   - The `layout` prop triggers FLIP measurements (First, Last, Invert, Play). Using `layout` on dozens of list elements simultaneously causes significant main-thread lag during re-orders.
3. **Hardware Acceleration Hints**:
   - Add `style={{ willChange: 'transform' }}\` for continuous high-framerate gestures or dragging.

---

## 8. Contributor Performance Checklist

Before submitting a Pull Request that introduces new UI components or data pipelines:

- [ ] **No Unnecessary `"use client"`**: Verified that Server Component boundaries are maximized and client hooks are isolated to leaf components.
- [ ] **Bundle Weight Audited**: Ran `npm run build` and ensured First Load JS has not increased by more than **5 KB**.
- [ ] **Profiler Checked**: Verified in React DevTools Profiler that typing or toggling inputs does not re-render unrelated siblings.
- [ ] **Tree-Shaking Preserved**: Verified that Lucide icons and utilities use direct named imports.
- [ ] **Image Optimization**: All images use `next/image` with explicit `sizes` and aspect ratios.
- [ ] **Animations GPU-Composited**: Framer Motion components only animate `transform` and `opacity`.
- [ ] **Relative Links Tested**: All links inside documentation point to valid existing files.
- [ ] **Automated Tests Pass Cleanly**: Ran `npm test` and `npm run lint` without errors or warnings.

---

*For further assistance or reporting performance regressions, open an issue on [GitHub Issues](https://github.com/TheVicky1/Pact_OS/issues) or consult [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md).*
