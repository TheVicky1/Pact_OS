'use client';

import { useCallback, useMemo, useRef, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface UseUrlStateOptions<T> {
  parse: (params: URLSearchParams) => T;
  serialize: (state: T) => string;
  defaultValue: T;
  debounceMs?: number;
}

/**
 * Reusable hook to sync domain filter/search/sort state with Next.js URL query params.
 * - Parses search params into validated domain state with safe fallbacks.
 * - Serializes domain state to query string, omitting defaults.
 * - Synchronizes with browser back/forward buttons.
 * - Avoids full page reload or hydration mismatch.
 */
export function useUrlState<T>({
  parse,
  serialize,
  defaultValue,
  debounceMs = 0,
}: UseUrlStateOptions<T>): [T, (updater: Partial<T> | ((prev: T) => Partial<T>)) => void, boolean] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State is derived directly from the canonical URL searchParams
  const state = useMemo(() => {
    if (!searchParams) return defaultValue;
    return parse(searchParams);
  }, [searchParams, parse, defaultValue]);

  const stateRef = useRef<T>(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const updateUrl = useCallback(
    (nextState: T) => {
      const queryString = serialize(nextState);
      const newUrl = `${pathname}${queryString}`;

      if (typeof window !== 'undefined') {
        const currentSearch = window.location.search;
        if (currentSearch === queryString || (currentSearch === '' && queryString === '')) {
          return;
        }

        window.history.replaceState(null, '', newUrl);

        startTransition(() => {
          router.replace(newUrl, { scroll: false });
        });
      }
    },
    [pathname, router, serialize]
  );

  const setState = useCallback(
    (updater: Partial<T> | ((prev: T) => Partial<T>)) => {
      const prev = stateRef.current;
      const partial = typeof updater === 'function' ? updater(prev) : updater;
      const nextState: T = { ...prev, ...partial };
      stateRef.current = nextState;

      if (debounceMs > 0) {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          updateUrl(nextState);
        }, debounceMs);
      } else {
        updateUrl(nextState);
      }
    },
    [debounceMs, updateUrl]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return [state, setState, isPending];
}
