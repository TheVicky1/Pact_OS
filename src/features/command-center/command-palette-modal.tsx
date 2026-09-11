'use client';

import React, { useState, useEffect, useRef, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useCommandCenter, QuickActionType } from './command-center-context';
import { filterAndGroupCommands, flattenCommandGroups, getNextSelectedIndex } from '@/lib/command-center/search';
import { searchPactEntitiesAction } from './actions';
import { EntitySearchPayload, SearchResultItem } from '@/lib/command-center/types';
import {
  Search,
  X,
  CheckSquare,
  Target,
  FolderKanban,
  LayoutDashboard,
  Calendar as CalendarIcon,
  Timer as TimerIcon,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Settings as SettingsIcon,
  ArrowDownRight,
  ArrowUpRight,
  CornerDownLeft,
  Command as CommandIcon,
  Loader2,
  BookOpen,
  Repeat,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  CheckSquare,
  Target,
  FolderKanban,
  LayoutDashboard,
  Calendar: CalendarIcon,
  Timer: TimerIcon,
  Wallet,
  TrendingUp,
  ShieldAlert,
  Settings: SettingsIcon,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Repeat,
};

const EMPTY_ENTITIES: EntitySearchPayload = {
  tasks: [],
  goals: [],
  projects: [],
  transactions: [],
};

function CommandPaletteContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { triggerQuickAction } = useCommandCenter();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [entities, setEntities] = useState<EntitySearchPayload>(EMPTY_ENTITIES);
  const [isSearching, startSearchTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced server search when query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const res = await searchPactEntitiesAction(trimmed);
        if (res.success && res.data) {
          setEntities(res.data);
        }
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Compute grouped and flattened commands using pure search engine
  const activeEntities = query.trim() ? entities : EMPTY_ENTITIES;
  const groups = filterAndGroupCommands({ query, entities: activeEntities });
  const flattenedItems = flattenCommandGroups(groups);

  // Safe selected index clamped to range during render
  const safeSelectedIndex = flattenedItems.length > 0
    ? Math.min(selectedIndex, flattenedItems.length - 1)
    : 0;

  // Auto-scroll selected item into view
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [safeSelectedIndex]);

  // Execute selected command
  const executeCommand = useCallback(
    (item: SearchResultItem) => {
      onClose();

      if (item.actionKey === 'navigate' && item.href) {
        router.push(item.href);
      } else if (item.actionKey && item.actionKey !== 'navigate') {
        triggerQuickAction(item.actionKey as QuickActionType);
      }
    },
    [onClose, router, triggerQuickAction]
  );

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => getNextSelectedIndex(prev, 'down', flattenedItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => getNextSelectedIndex(prev, 'up', flattenedItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flattenedItems[safeSelectedIndex];
      if (selected) {
        executeCommand(selected);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSelectedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSelectedIndex(Math.max(0, flattenedItems.length - 1));
    }
  };

  let globalIndexCounter = 0;

  return (
    <div className="w-full max-w-2xl bg-[#0c0c10]/95 border border-white/[0.12] rounded-2xl shadow-2xl shadow-black/80 flex flex-col overflow-hidden text-zinc-100 ring-1 ring-white/[0.05] animate-in zoom-in-95 duration-150">
      {/* Header: Search Input */}
      <div className="relative flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-zinc-900/40">
        <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a command, task, goal, project, or finance item..."
          className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0"
          aria-label="Search PACT OS"
          role="combobox"
          aria-expanded={flattenedItems.length > 0}
          aria-controls="command-palette-results"
          aria-autocomplete="list"
        />

        <div className="flex items-center gap-2 ml-2 shrink-0">
          {isSearching && <Loader2 className="w-4 h-4 text-[#d4af37] animate-spin" />}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded">
            ESC
          </kbd>
        </div>
      </div>

      {/* Results List */}
      <div
        ref={listRef}
        id="command-palette-results"
        role="listbox"
        className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto px-2 py-2 space-y-3 custom-scrollbar"
      >
        {flattenedItems.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <Search className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-300">No matching commands or entities found</p>
            <p className="text-xs text-zinc-500 mt-1">Try searching for tasks, projects, goals, or quick actions</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="space-y-1">
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
                {group.label}
              </div>
              {group.items.map((item) => {
                const currentIndex = globalIndexCounter++;
                const isSelected = currentIndex === safeSelectedIndex;
                const IconComponent = ICON_MAP[item.iconName] || Search;

                return (
                  <button
                    key={item.id}
                    ref={isSelected ? activeItemRef : null}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => executeCommand(item)}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-75 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/10 to-transparent text-zinc-100 border border-[#d4af37]/40 shadow-sm'
                        : 'text-zinc-300 hover:bg-white/[0.04] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? 'bg-[#d4af37]/30 text-[#e2c056]'
                            : 'bg-white/[0.06] text-zinc-400'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-zinc-100 truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-xs text-zinc-400 truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badgeText && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${
                            item.badgeVariant === 'gold'
                              ? 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30'
                              : item.badgeVariant === 'emerald'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.badgeVariant === 'rose'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : item.badgeVariant === 'blue'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}
                        >
                          {item.badgeText}
                        </span>
                      )}

                      {item.shortcut && (
                        <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 bg-white/[0.06] border border-white/[0.08] rounded">
                          {item.shortcut}
                        </kbd>
                      )}

                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-[#d4af37] hidden sm:inline" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer: Keyboard Hints */}
      <div className="px-4 py-2.5 border-t border-white/[0.08] bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white/[0.06] border border-white/[0.08] rounded">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white/[0.06] border border-white/[0.08] rounded">
              ↓
            </kbd>
            <span>Navigate</span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white/[0.06] border border-white/[0.08] rounded">
              ↵
            </kbd>
            <span>Select</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 text-[10px] font-medium bg-white/[0.06] border border-white/[0.08] rounded">
              ESC
            </kbd>
            <span>Close</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
          <CommandIcon className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>PACT Control Surface</span>
        </div>
      </div>
    </div>
  );
}

export function CommandPaletteModal() {
  const { isOpen, closeCommandCenter } = useCommandCenter();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PACT Global Command Center"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeCommandCenter();
        }
      }}
    >
      <CommandPaletteContent key="command-palette-content" onClose={closeCommandCenter} />
    </div>
  );
}
