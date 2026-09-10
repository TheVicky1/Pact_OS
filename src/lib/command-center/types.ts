/**
 * PACT Phase 6A: Global Command Center Types
 * Strongly typed definitions for commands, quick actions, search results, and groups.
 */

export type CommandCategory =
  | 'quick_action'
  | 'navigation'
  | 'task'
  | 'goal'
  | 'project'
  | 'finance'
  | 'settings';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: CommandCategory;
  keywords?: string[];
  iconName: string;
  shortcut?: string;
  href?: string;
  actionKey?:
    | 'create_task'
    | 'create_goal'
    | 'create_project'
    | 'log_expense'
    | 'log_income'
    | 'navigate';
  metadata?: Record<string, unknown>;
}

export interface SearchResultItem extends CommandItem {
  entityId?: string;
  badgeText?: string;
  badgeVariant?: 'gold' | 'blue' | 'emerald' | 'rose' | 'zinc';
}

export interface CommandGroup {
  id: CommandCategory;
  label: string;
  items: SearchResultItem[];
}

export interface EntitySearchPayload {
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline_at: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    status: string;
    target_date: string | null;
  }>;
  projects: Array<{
    id: string;
    title: string;
    status: string;
    color_accent: string | null;
  }>;
  transactions: Array<{
    id: string;
    description: string;
    type: 'income' | 'expense';
    amount_cents: number;
    transaction_date: string;
  }>;
}
