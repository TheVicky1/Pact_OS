/**
 * PACT Phase 6A: Pure Command Center Search & Ranking Engine
 * Provides fast, deterministic in-memory scoring, entity mapping, and grouping.
 */

import { CommandCategory, CommandGroup, EntitySearchPayload, SearchResultItem } from './types';
import { ALL_STATIC_COMMANDS, STATIC_QUICK_ACTIONS } from './registry';
import { formatCentsToCurrency } from '../money';

export interface FilterOptions {
  query: string;
  entities?: EntitySearchPayload;
  maxPerGroup?: number;
}

/**
 * Sanitizes and normalizes user search query.
 */
export function sanitizeSearchQuery(rawQuery: string): string {
  if (!rawQuery) return '';
  return rawQuery.trim().toLowerCase().slice(0, 100);
}

/**
 * Calculates a match relevance score for a command or entity item.
 * Higher score = higher ranking.
 * Score breakdown:
 * - Exact title match: 100
 * - Title starts with query: 80
 * - Title contains query word: 60
 * - Subtitle contains query: 40
 * - Keyword matches query: 50
 * - Category matches query: 30
 */
export function computeMatchScore(
  item: { title: string; subtitle?: string; keywords?: string[]; category?: string },
  query: string
): number {
  if (!query) return 10;

  const titleLower = item.title.toLowerCase();
  const subLower = (item.subtitle || '').toLowerCase();
  const catLower = (item.category || '').toLowerCase();

  if (titleLower === query) return 100;
  if (titleLower.startsWith(query)) return 80;
  if (titleLower.includes(query)) return 60;

  if (item.keywords?.some((kw) => kw.toLowerCase().includes(query) || query.includes(kw.toLowerCase()))) {
    return 50;
  }

  if (subLower.includes(query)) return 40;
  if (catLower.includes(query)) return 30;

  return 0;
}

/**
 * Maps raw database entity records into uniform SearchResultItems.
 */
export function mapEntitiesToSearchResults(entities: EntitySearchPayload): SearchResultItem[] {
  const results: SearchResultItem[] = [];

  // 1. Tasks
  for (const t of entities.tasks || []) {
    let badgeVariant: SearchResultItem['badgeVariant'] = 'zinc';
    if (t.status === 'completed') badgeVariant = 'emerald';
    else if (t.status === 'missed') badgeVariant = 'rose';
    else if (t.priority === 'urgent' || t.priority === 'high') badgeVariant = 'gold';

    results.push({
      id: `task-${t.id}`,
      entityId: t.id,
      title: t.title,
      subtitle: `Task · ${t.status.charAt(0).toUpperCase() + t.status.slice(1)} · Priority ${t.priority}`,
      category: 'task',
      iconName: 'CheckSquare',
      href: '/app/tasks',
      actionKey: 'navigate',
      badgeText: t.status.toUpperCase(),
      badgeVariant,
      keywords: ['task', t.status, t.priority],
    });
  }

  // 2. Goals
  for (const g of entities.goals || []) {
    results.push({
      id: `goal-${g.id}`,
      entityId: g.id,
      title: g.title,
      subtitle: `Goal · ${g.status.charAt(0).toUpperCase() + g.status.slice(1)}${g.target_date ? ` · Target: ${g.target_date}` : ''}`,
      category: 'goal',
      iconName: 'Target',
      href: '/app/goals',
      actionKey: 'navigate',
      badgeText: g.status.toUpperCase(),
      badgeVariant: g.status === 'active' ? 'gold' : 'zinc',
      keywords: ['goal', g.status],
    });
  }

  // 3. Projects
  for (const p of entities.projects || []) {
    results.push({
      id: `project-${p.id}`,
      entityId: p.id,
      title: p.title,
      subtitle: `Project · ${p.status.charAt(0).toUpperCase() + p.status.slice(1)}`,
      category: 'project',
      iconName: 'FolderKanban',
      href: `/app/projects/${p.id}`,
      actionKey: 'navigate',
      badgeText: p.status.toUpperCase(),
      badgeVariant: 'blue',
      keywords: ['project', p.status],
    });
  }

  // 4. Finance Transactions
  for (const tx of entities.transactions || []) {
    const formattedAmount = formatCentsToCurrency(tx.amount_cents, 'INR');
    const isExpense = tx.type === 'expense';
    results.push({
      id: `tx-${tx.id}`,
      entityId: tx.id,
      title: tx.description || (isExpense ? 'Expense' : 'Income'),
      subtitle: `Finance · ${tx.transaction_date} · ${isExpense ? `-${formattedAmount}` : `+${formattedAmount}`}`,
      category: 'finance',
      iconName: isExpense ? 'ArrowDownRight' : 'ArrowUpRight',
      href: '/app/finance',
      actionKey: 'navigate',
      badgeText: isExpense ? `-${formattedAmount}` : `+${formattedAmount}`,
      badgeVariant: isExpense ? 'rose' : 'emerald',
      keywords: ['transaction', tx.type, 'finance'],
    });
  }

  return results;
}

const CATEGORY_ORDER: CommandCategory[] = [
  'quick_action',
  'navigation',
  'task',
  'goal',
  'project',
  'finance',
  'settings',
];

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  quick_action: 'Quick Actions',
  navigation: 'Navigation',
  task: 'Tasks',
  goal: 'Goals',
  project: 'Projects',
  finance: 'Finance Ledger',
  settings: 'Settings & Tools',
};

/**
 * Filters and groups commands and entities based on a search query.
 */
export function filterAndGroupCommands(options: FilterOptions): CommandGroup[] {
  const query = sanitizeSearchQuery(options.query);
  const maxPerGroup = options.maxPerGroup ?? 6;

  // If query is empty, return static quick actions and navigation directly
  if (!query) {
    const quickActionsGroup: CommandGroup = {
      id: 'quick_action',
      label: 'Quick Actions',
      items: STATIC_QUICK_ACTIONS as SearchResultItem[],
    };

    const navigationGroup: CommandGroup = {
      id: 'navigation',
      label: 'Navigation',
      items: ALL_STATIC_COMMANDS.filter((c) => c.category === 'navigation' || c.category === 'settings') as SearchResultItem[],
    };

    return [quickActionsGroup, navigationGroup];
  }

  // Combine static commands and mapped entity results
  const allCandidates: SearchResultItem[] = [
    ...(ALL_STATIC_COMMANDS as SearchResultItem[]),
    ...(options.entities ? mapEntitiesToSearchResults(options.entities) : []),
  ];

  // Score each candidate item
  const scoredItems: Array<{ item: SearchResultItem; score: number }> = [];
  for (const item of allCandidates) {
    const score = computeMatchScore(item, query);
    if (score > 0) {
      scoredItems.push({ item, score });
    }
  }

  // Sort scored items by score descending
  scoredItems.sort((a, b) => b.score - a.score);

  // Group items by category
  const groupsMap = new Map<CommandCategory, SearchResultItem[]>();
  for (const { item } of scoredItems) {
    const list = groupsMap.get(item.category) || [];
    if (list.length < maxPerGroup) {
      list.push(item);
      groupsMap.set(item.category, list);
    }
  }

  // Build ordered groups
  const groups: CommandGroup[] = [];
  for (const cat of CATEGORY_ORDER) {
    const items = groupsMap.get(cat);
    if (items && items.length > 0) {
      groups.push({
        id: cat,
        label: CATEGORY_LABELS[cat] || cat,
        items,
      });
    }
  }

  return groups;
}

/**
 * Flattens grouped commands into a linear array for index-based keyboard navigation.
 */
export function flattenCommandGroups(groups: CommandGroup[]): SearchResultItem[] {
  const flattened: SearchResultItem[] = [];
  for (const g of groups) {
    for (const item of g.items) {
      flattened.push(item);
    }
  }
  return flattened;
}

/**
 * Calculates next selected index under ArrowUp / ArrowDown navigation with wraparound.
 */
export function getNextSelectedIndex(
  currentIndex: number,
  direction: 'up' | 'down',
  totalCount: number
): number {
  if (totalCount <= 0) return 0;
  if (direction === 'down') {
    return (currentIndex + 1) % totalCount;
  }
  return (currentIndex - 1 + totalCount) % totalCount;
}
