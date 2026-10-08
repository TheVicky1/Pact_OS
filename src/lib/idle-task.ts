export interface IdleDeadlineLike {
  readonly didTimeout: boolean;
  timeRemaining(): number;
}

export type IdleTaskCallback = (deadline: IdleDeadlineLike) => void;

/** Injectable environment so scheduling is unit-testable without a DOM. */
export interface IdleEnvironment {
  requestIdleCallback?: (
    cb: (deadline: IdleDeadlineLike) => void,
    options?: { timeout?: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
  setTimeout: (cb: () => void, ms: number) => unknown;
  clearTimeout: (handle: unknown) => void;
  now: () => number;
}

/** Delay used when requestIdleCallback is unavailable (e.g. Safari). */
export const IDLE_FALLBACK_DELAY_MS = 1;
const FALLBACK_BUDGET_MS = 50;

export function getDefaultIdleEnvironment(): IdleEnvironment {
  const g = globalThis as typeof globalThis & {
    requestIdleCallback?: IdleEnvironment["requestIdleCallback"];
    cancelIdleCallback?: IdleEnvironment["cancelIdleCallback"];
  };
  const hasNative =
    typeof g.requestIdleCallback === "function" &&
    typeof g.cancelIdleCallback === "function";

  return {
    requestIdleCallback: hasNative ? g.requestIdleCallback!.bind(g) : undefined,
    cancelIdleCallback: hasNative ? g.cancelIdleCallback!.bind(g) : undefined,
    setTimeout: (cb, ms) => globalThis.setTimeout(cb, ms),
    clearTimeout: (h) => globalThis.clearTimeout(h as ReturnType<typeof setTimeout>),
    now: () => Date.now(),
  };
}

/**
 * Schedules `task` for when the main thread is idle.
 * Returns a cancel function that is safe to call multiple times,
 * including after the task has already run.
 */
export function scheduleIdleTask(
  task: IdleTaskCallback,
  timeoutMs = 2000,
  env: IdleEnvironment = getDefaultIdleEnvironment(),
): () => void {
  let done = false;

  if (env.requestIdleCallback && env.cancelIdleCallback) {
    const cancelNative = env.cancelIdleCallback;
    const handle = env.requestIdleCallback(
      (deadline) => {
        if (done) return;
        done = true;
        task(deadline);
      },
      { timeout: timeoutMs },
    );
    return () => {
      if (done) return;
      done = true;
      cancelNative(handle);
    };
  }

  const start = env.now();
  const handle = env.setTimeout(() => {
    if (done) return;
    done = true;
    task({
      didTimeout: false,
      timeRemaining: () => Math.max(0, FALLBACK_BUDGET_MS - (env.now() - start)),
    });
  }, IDLE_FALLBACK_DELAY_MS);

  return () => {
    if (done) return;
    done = true;
    env.clearTimeout(handle);
  };
}