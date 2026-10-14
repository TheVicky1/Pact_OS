# ⚡ PACT Web Vitals Playbook — LCP, INP & CLS

A practical, code-grounded guide to keeping **PACT OS** in the "Good" band of the
Core Web Vitals. Every tactic below names the file in this repository that
implements it (or the file it applies to), so the guidance can be checked against
real code instead of taken on faith.

> [!IMPORTANT]
> Measure on a production build. `next dev` ships unminified bundles, React
> Strict Mode double-renders, and the dev overlay — all of which distort every
> metric. Always profile with `npm run build && npm start`.

---

## 1. Targets & Budgets

Google's Core Web Vitals thresholds, at the **75th percentile** of real page
loads:

| Metric | Good | Needs improvement | Poor | What it measures |
| :--- | :--- | :--- | :--- | :--- |
| **LCP** (Largest Contentful Paint) | ≤ 2.5 s | 2.5 s – 4.0 s | > 4.0 s | When the largest above-the-fold element renders |
| **INP** (Interaction to Next Paint) | ≤ 200 ms | 200 ms – 500 ms | > 500 ms | Worst-case latency of a user interaction |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 – 0.25 | > 0.25 | Sum of unexpected layout shifts |

Two supporting budgets PACT treats as hard limits:

| Budget | Value | Where it is enforced |
| :--- | :--- | :--- |
| Single React commit | **16.6 ms** (one 60 fps frame) | `RENDER_BUDGET_MS` in [`src/lib/observability/render-budget.ts`](../src/lib/observability/render-budget.ts) |
| Deferred/idle work timeout | **2000 ms** | Default `timeoutMs` in [`src/lib/idle-task.ts`](../src/lib/idle-task.ts) |

---

## 2. Measuring Before You Optimize

```bash
npm run build && npm start          # production build on http://localhost:3000
npm run typecheck                   # tsc --noEmit
npm run lint                        # eslint
npm run test                        # node scratch/run-tests.mjs (all suites)
node scratch/run-tests.mjs render-budget-monitor   # one suite by name
```

1. **Lighthouse / PageSpeed Insights** — run against the production build for
   lab LCP/CLS/INP and the field-data overlay. Lighthouse's INP is a lab proxy;
   only real-user monitoring gives the true p75.
2. **Chrome DevTools → Performance** — record an interaction and look for long
   tasks (the red-triangle "Long Task" marker) on the main thread. A long task
   over 50 ms is the usual root cause of a bad INP.
3. **Chrome DevTools → Rendering → Layout Shift Regions** — highlights every
   element that moved, which localises CLS far faster than the score alone.
4. **React DevTools → Profiler** — record a commit and check `actualDuration`
   against the 16.6 ms frame budget. In development, PACT can do this
   automatically: [`createRenderBudgetCallback`](../src/lib/observability/render-budget.ts)
   is a drop-in `onRender` handler that warns whenever a commit exceeds the
   budget. It is gated by `isRenderBudgetMonitoringEnabled()`, so no profiling
   cost or console noise reaches production.
5. **`PerformanceObserver`** in the console for a quick field check:

   ```js
   new PerformanceObserver((l) => console.table(l.getEntries().map(e => ({
     name: e.name, value: Math.round(e.startTime),
   })))).observe({ type: 'largest-contentful-paint', buffered: true });
   ```

---

## 3. LCP Optimization

LCP is dominated by four sub-parts: time to first byte, resource load delay,
resource load duration, and element render delay. In an App Router application
the first two are mostly solved for you (server-rendered HTML, streamed
boundaries); the last two are where PACT's code has to be deliberate.

### 3.1 Image preloading

The LCP element on PACT's marketing page is an image, and on most app routes it
is the brand mark. Both are `next/image` components:

- [`src/app/page.tsx`](../src/app/page.tsx) renders the hero visuals with the
  `priority` prop, which is what promotes the image to a `<link rel="preload">`
  and sets `fetchpriority="high"`.
- [`src/components/brand/pact-logo.tsx`](../src/components/brand/pact-logo.tsx)
  defaults `priority={priority || size === 'sm'}` — the small mark is used in
  above-the-fold chrome, so it preloads; larger, in-content uses stay lazy.

Rules:

- **`priority` on the LCP image, and on nothing else.** Every `priority` image
  competes for the same early bandwidth; preloading five images preloads none of
  them usefully.
- **Never `loading="lazy"` on the LCP image.** It defers the request until after
  layout, which is the single most common way to turn a 1.5 s LCP into a 3 s one.
- **Always give `width`/`height` or `sizes`.** `next/image` needs intrinsic
  dimensions to reserve the box (also an LCP and CLS win) and `sizes` to pick the
  right candidate from the srcset instead of over-fetching a full-width asset.
- **Keep the hero asset small.** A 1200 px-wide PNG shipped to a 390 px phone
  costs load duration for no visible benefit; let `next/image` resize it.
- **Avoid a client-side gate in front of the LCP element.** If the hero only
  renders after a `useEffect` resolves auth or a `useTransition` settles, the LCP
  clock runs until that finishes. Render the above-the-fold shell on the server.

### 3.2 Font display swap

PACT loads its typefaces through `next/font` in
[`src/app/layout.tsx`](../src/app/layout.tsx):

```ts
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
```

`next/font` is the correct mechanism and it already gives us the behaviour we
want:

- Fonts are **self-hosted** at build time — no third-party connection, no
  render-blocking `fonts.googleapis.com` request.
- The emitted `@font-face` uses **`font-display: swap`**, so text paints
  immediately in the fallback face instead of blocking on the webfont.
- Next injects a **preload** for the subset actually used, plus a
  metric-matched `size-adjust` fallback so the swap does not shift layout.
- `subsets: ['latin']` keeps the payload to the glyphs the app uses.

Rules:

- **Do not add a raw `<link href="https://fonts.googleapis.com/...">`** to the
  layout. That reintroduces a render-blocking, third-party, cache-cold request
  and undoes all of the above.
- If a self-hosted face is ever needed, use `next/font/local` with
  `display: 'swap'` and leave `adjustFontFallback` enabled.
- Keep `font-family` consumers on the generated CSS variables
  (`var(--font-geist-sans)`, see [`src/app/globals.css`](../src/app/globals.css))
  rather than hard-coding a family name, so a swap to another face is one edit.

### 3.3 Layout containment

For long, off-screen, self-contained blocks (analytics tables, the habit
heatmap, archived review lists), CSS containment lets the browser skip layout and
paint work it does not need:

```css
.long-list-row {
  contain: layout paint;          /* this subtree cannot affect the rest of the page */
}

.offscreen-section {
  content-visibility: auto;       /* skip rendering until it scrolls into view */
  contain-intrinsic-size: auto 320px;  /* placeholder size, keeps the scrollbar honest */
}
```

- `contain: layout paint` is the safe default: it isolates the subtree's layout
  and clips its painting without changing the element's own sizing.
- `content-visibility: auto` is the bigger win on long pages but **must** be
  paired with `contain-intrinsic-size`, otherwise the skipped subtree collapses
  to zero height, the scrollbar jumps, and you trade an INP win for a CLS
  regression.
- Watch the semantics: containment makes the element a containing block for
  absolutely positioned descendants and clips overflow. Anything that escapes the
  box — dropdowns, tooltips, `position: fixed` overlays, focus rings — must live
  outside the contained element. Verify with the keyboard, not just the mouse.
- PACT does not currently apply containment globally; add it per-component and
  measure the route before and after rather than blanket-applying it.

---

## 4. INP Optimization

INP is the worst interaction latency the user experiences: input delay plus
processing time plus presentation delay. The fix is almost always "do less work
synchronously in the event handler."

### 4.1 Task splitting

- **Keep handlers under ~50 ms.** Anything longer is a long task and blocks the
  next paint. If a handler needs more, split it and yield.
- **Mark non-urgent updates as transitions.** PACT already does this in
  [`src/hooks/use-url-state.ts`](../src/hooks/use-url-state.ts): the URL write is
  wrapped in `startTransition`, so a filter or search change never blocks the
  keystroke that caused it, and `isPending` is exposed for a subtle loading hint.

  ```ts
  const [isPending, startTransition] = useTransition();
  startTransition(() => router.replace(newUrl, { scroll: false }));
  ```

  Use `startTransition` for anything that can lag a frame (list re-filters,
  route changes, large derived renders) and leave genuinely urgent state —
  controlled input values, focus, toggles — as a normal update.
- **Defer work that is not needed for the current paint.** PACT ships an idle
  scheduler in [`src/lib/idle-task.ts`](../src/lib/idle-task.ts) with a React
  wrapper in [`src/hooks/useIdleTask.ts`](../src/hooks/useIdleTask.ts):

  ```ts
  useIdleTask((deadline) => {
    // heavy, non-critical work: analytics aggregation, cache warm-up, prefetch
  }, 2000);
  ```

  It uses `requestIdleCallback` with a 2000 ms timeout so the task still runs on
  a busy page, falls back to `setTimeout(IDLE_FALLBACK_DELAY_MS)` where
  `requestIdleCallback` is unavailable (Safari), and returns a cancel function
  that is safe to call more than once — including after the task already ran — so
  unmount never leaks a pending callback.
- **Chunk large loops.** Process in batches and yield between them
  (`await new Promise(r => setTimeout(r, 0))`) rather than one 300 ms loop.
- **Move expensive pure work off the critical path** — compute derived values
  inside `useMemo` keyed on real inputs, not on every render.

### 4.2 Debouncing

- **Debounce the expensive side-effect, not the visible state.** The controlled
  input must update synchronously on every keystroke or typing feels broken; only
  the costly consequence (a URL write, a network call, a big re-filter) is
  deferred.
- [`useUrlState`](../src/hooks/use-url-state.ts) takes a `debounceMs` option
  exactly for this: rapid successive updates collapse into a single
  `router.replace`, and the pending timer is cleared on unmount.

  ```ts
  const [filters, setFilters] = useUrlState({ parse, serialize, defaultValue, debounceMs: 200 });
  ```

- Pick the smallest delay that removes the jank — 150–250 ms for search-as-you-type.
  A long debounce does not improve INP; it just makes the UI feel unresponsive.
- Debounce is not throttle: if an interaction must produce continuous feedback
  (drag, scroll-linked progress), throttle or drive it from
  `requestAnimationFrame` instead.

### 4.3 Main-thread responsiveness

- **Watch the render budget.** Wrap a suspicious subtree in `React.Profiler` and
  pass [`createRenderBudgetCallback()`](../src/lib/observability/render-budget.ts)
  as `onRender`; in development it warns with
  `[RenderBudgetMonitor] "<id>" <phase> took X.Xms (budget 16.6ms)` for any commit
  over a frame. `isOverRenderBudget` ignores non-finite durations, so a
  measurement that failed to collect never produces a false alarm.
- **Avoid layout thrash.** Reading `offsetHeight`/`getBoundingClientRect()` and
  then writing styles in a loop forces synchronous reflow per iteration. Batch
  all reads, then all writes.
- **Keep render pure.** Reading `localStorage` or calling `JSON.parse` inside a
  render body blocks the main thread on every commit. Hydrate once in an effect
  or a module-level cache instead.
- **Do not block on hydration.** Anything that must run before paint belongs in
  the server render; anything that can wait belongs in `useIdleTask`.

---

## 5. CLS Optimization

- **Reserve space for every image and embed.** `next/image` does this when given
  `width`/`height` (or a `fill` parent with a defined aspect ratio). A missing
  dimension is the classic source of a 0.2 CLS.
- **Reserve space for late content.** Skeletons and loading placeholders must
  occupy the same box as the content that replaces them. A spinner that is
  replaced by a taller list shifts everything below it.
- **Never inject a banner above existing content.** Cookies, "new version
  available", and offline notices must have a reserved slot or be overlays —
  not something that pushes the page down after load.
- **Prefer `transform`/`opacity` animations.** Animating `top`, `left`, `width`,
  or `height` triggers layout on every frame; `transform` and `opacity` are
  composited.
- **Keep the metric-matched font fallback.** Because `next/font` swaps in a face
  whose metrics are adjusted to the fallback, text does not reflow when the
  webfont arrives — this is what keeps the `font-display: swap` trade honest.
- **Re-measure after any layout change.** Run the DevTools Layout Shift Regions
  overlay on the affected route; a shift that only appears on one breakpoint or
  in one theme still counts.

---

## 6. Regression Guardrails

Performance contracts in PACT are covered by the automated suite, so a
regression fails CI instead of reaching users:

| Contract | Suite |
| :--- | :--- |
| Render budget is one 60 fps frame; over-budget commits warn; monitoring is dev-only | [`tests/render-budget-monitor.test.ts`](../tests/render-budget-monitor.test.ts) |
| Idle scheduler uses `requestIdleCallback` with the timeout, falls back to `setTimeout`, and cancels idempotently | [`tests/idle-task.test.ts`](../tests/idle-task.test.ts) |
| Documentation cross-references stay valid | `node scratch/check-links.mjs` |

Before opening a pull request that touches anything on a hot path:

```bash
npm run lint && npm run typecheck && npm run test && npm run build
```

CI runs the same gates (see [`docs/CI_PIPELINE.md`](./CI_PIPELINE.md)), plus the
link audit and secret scan.

---

## 7. Pre-Merge Checklist

- [ ] Measured on `npm run build && npm start`, not on the dev server.
- [ ] LCP element has `priority`; nothing else does.
- [ ] No `loading="lazy"` on the LCP image.
- [ ] Every `next/image` has `width`/`height` or `sizes`.
- [ ] No render-blocking third-party font `<link>`; typefaces come from `next/font`.
- [ ] Event handlers do not exceed ~50 ms; non-urgent updates use `startTransition`.
- [ ] Deferrable work goes through `useIdleTask` / `scheduleIdleTask`.
- [ ] Inputs update synchronously; only the expensive effect is debounced.
- [ ] `content-visibility: auto` is always paired with `contain-intrinsic-size`.
- [ ] No layout-affecting animation properties; `transform`/`opacity` only.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` is green.

---

## 8. References

- [Core Web Vitals — web.dev](https://web.dev/articles/vitals)
- [Optimize Largest Contentful Paint — web.dev](https://web.dev/articles/optimize-lcp)
- [Optimize Interaction to Next Paint — web.dev](https://web.dev/articles/optimize-inp)
- [Optimize Cumulative Layout Shift — web.dev](https://web.dev/articles/optimize-cls)
- [Next.js: Images](https://nextjs.org/docs/app/api-reference/components/image)
- [Next.js: Fonts](https://nextjs.org/docs/app/api-reference/components/font)
- Related PACT documents: [`ARCHITECTURE.md`](./ARCHITECTURE.md),
  [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md), [`TESTING.md`](./TESTING.md),
  [`CI_PIPELINE.md`](./CI_PIPELINE.md), [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md)
