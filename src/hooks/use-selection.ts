'use client';

import { useState, useCallback, useMemo } from 'react';

export interface UseSelectionOptions {
  initialSelected?: string[];
}

export interface UseSelectionReturn {
  selectedIds: Set<string>;
  selectedList: string[];
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  select: (id: string) => void;
  deselect: (id: string) => void;
  selectAll: (allIds: string[]) => void;
  toggleAll: (allIds: string[]) => void;
  clear: () => void;
  isAllSelected: (visibleIds: string[]) => boolean;
  isIndeterminate: (visibleIds: string[]) => boolean;
}

/**
 * Reusable multi-select state management hook.
 * Provides pure, performant Set-based ID tracking, toggle helpers, and bulk selection calculations.
 */
export function useSelection(options: UseSelectionOptions = {}): UseSelectionReturn {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(options.initialSelected || [])
  );

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const select = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const deselect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((allIds: string[]) => {
    setSelectedIds(new Set(allIds));
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      if (allSelected) {
        // Deselect all visible
        const next = new Set(prev);
        for (const id of allIds) {
          next.delete(id);
        }
        return next;
      } else {
        // Select all visible
        const next = new Set(prev);
        for (const id of allIds) {
          next.add(id);
        }
        return next;
      }
    });
  }, []);

  const isAllSelected = useCallback(
    (visibleIds: string[]) => {
      if (visibleIds.length === 0) return false;
      return visibleIds.every((id) => selectedIds.has(id));
    },
    [selectedIds]
  );

  const isIndeterminate = useCallback(
    (visibleIds: string[]) => {
      if (visibleIds.length === 0) return false;
      const selectedCount = visibleIds.filter((id) => selectedIds.has(id)).length;
      return selectedCount > 0 && selectedCount < visibleIds.length;
    },
    [selectedIds]
  );

  const selectedList = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const count = selectedIds.size;

  return {
    selectedIds,
    selectedList,
    count,
    isSelected,
    toggle,
    select,
    deselect,
    selectAll,
    toggleAll,
    clear,
    isAllSelected,
    isIndeterminate,
  };
}
