import test from "node:test";
import assert from "node:assert/strict";
import {
  scheduleIdleTask,
  IDLE_FALLBACK_DELAY_MS,
  type IdleEnvironment,
  type IdleDeadlineLike,
} from "../src/lib/idle-task";

function makeNativeEnv() {
  let idleCb: ((d: IdleDeadlineLike) => void) | null = null;
  const calls = { requested: 0, cancelled: [] as number[], timeoutOpt: undefined as number | undefined };
  const env: IdleEnvironment = {
    requestIdleCallback: (cb, opts) => {
      calls.requested++;
      calls.timeoutOpt = opts?.timeout;
      idleCb = cb;
      return 42;
    },
    cancelIdleCallback: (h) => { calls.cancelled.push(h); },
    setTimeout: () => { throw new Error("setTimeout should not be used"); },
    clearTimeout: () => { throw new Error("clearTimeout should not be used"); },
    now: () => 0,
  };
  return { env, calls, fire: () => idleCb?.({ didTimeout: false, timeRemaining: () => 10 }) };
}

function makeFallbackEnv() {
  let timerCb: (() => void) | null = null;
  let time = 0;
  const calls = { delay: undefined as number | undefined, cleared: [] as unknown[] };
  const env: IdleEnvironment = {
    setTimeout: (cb, ms) => { timerCb = cb; calls.delay = ms; return "timer-1"; },
    clearTimeout: (h) => { calls.cleared.push(h); },
    now: () => time,
  };
  return { env, calls, advance: (ms: number) => { time += ms; }, fire: () => timerCb?.() };
}

test("native: schedules with the given timeout and runs the task once", () => {
  const { env, calls, fire } = makeNativeEnv();
  let runs = 0;
  scheduleIdleTask(() => { runs++; }, 1500, env);
  assert.equal(calls.requested, 1);
  assert.equal(calls.timeoutOpt, 1500);
  fire();
  fire();
  assert.equal(runs, 1);
});

test("native: defaults timeout to 2000ms", () => {
  const { env, calls } = makeNativeEnv();
  scheduleIdleTask(() => {}, undefined, env);
  assert.equal(calls.timeoutOpt, 2000);
});

test("native: cancel calls cancelIdleCallback and prevents the task", () => {
  const { env, calls, fire } = makeNativeEnv();
  let runs = 0;
  const cancel = scheduleIdleTask(() => { runs++; }, 2000, env);
  cancel();
  cancel(); // idempotent
  fire();
  assert.deepEqual(calls.cancelled, [42]);
  assert.equal(runs, 0);
});

test("native: cancel after the task ran is a no-op", () => {
  const { env, calls, fire } = makeNativeEnv();
  const cancel = scheduleIdleTask(() => {}, 2000, env);
  fire();
  cancel();
  assert.deepEqual(calls.cancelled, []);
});

test("fallback: uses setTimeout with the short fixed delay and provides a deadline", () => {
  const { env, calls, advance, fire } = makeFallbackEnv();
  let deadline: IdleDeadlineLike | undefined;
  scheduleIdleTask((d) => { deadline = d; }, 2000, env);
  assert.equal(calls.delay, IDLE_FALLBACK_DELAY_MS);
  advance(10);
  fire();
  assert.ok(deadline);
  assert.equal(deadline.didTimeout, false);
  assert.equal(deadline.timeRemaining(), 40);
});

test("fallback: cancel clears the timer and prevents the task", () => {
  const { env, calls, fire } = makeFallbackEnv();
  let runs = 0;
  const cancel = scheduleIdleTask(() => { runs++; }, 2000, env);
  cancel();
  fire();
  assert.deepEqual(calls.cleared, ["timer-1"]);
  assert.equal(runs, 0);
});