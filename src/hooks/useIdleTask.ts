"use client";

import { useEffect, useRef } from "react";
import { scheduleIdleTask, type IdleTaskCallback } from "@/lib/idle-task";

/**
 * Defers a non-critical task (e.g. heavy analytics aggregation) until the
 * browser main thread is idle. Falls back to setTimeout where
 * requestIdleCallback is unsupported, and cancels on unmount.
 *
 * The latest `taskCallback` is always the one that runs, without
 * rescheduling when its identity changes between renders.
 */
export function useIdleTask(taskCallback: IdleTaskCallback, timeoutMs = 2000): void {
  const callbackRef = useRef(taskCallback);

  useEffect(() => {
    callbackRef.current = taskCallback;
  });

  useEffect(() => {
    const cancel = scheduleIdleTask((deadline) => callbackRef.current(deadline), timeoutMs);
    return cancel;
  }, [timeoutMs]);
}