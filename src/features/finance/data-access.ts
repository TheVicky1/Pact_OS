import { createClient } from '@/lib/supabase/server';
import {
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  RecurrenceStatus,
  FinanceRecurringTransaction,
  FinanceBudget,
  CategoryBudgetStatus,
  MonthlyBudgetOverview,
  calculateFinanceSummary,
  calculateCategoryBreakdown,
  calculateMonthlyTrends,
  calculateBudgetStatus,
  DEFAULT_FINANCE_CATEGORIES,
} from '@/lib/money';

export type {
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  FinanceRecurringTransaction,
  FinanceBudget,
  CategoryBudgetStatus,
  MonthlyBudgetOverview,
};

export interface DataAccessResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Retrieves all categories for the authenticated user.
 * If user has no categories, seeds default starter categories for smooth onboarding.
 */
export async function getFinanceCategories(): Promise<DataAccessResult<FinanceCategory[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    const { data, error } = await supabase
      .from('finance_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('is_archived', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.warn('Finance categories query warning:', error.message);
      return { data: [], error: null };
    }

    // If newly onboarded user has 0 categories, seed default categories
    if (!data || data.length === 0) {
      const seedItems = DEFAULT_FINANCE_CATEGORIES.map((c) => ({
        user_id: user.id,
        name: c.name,
        color_tag: c.color_tag,
      }));

      const { data: seeded, error: seedError } = await supabase
        .from('finance_categories')
        .insert(seedItems)
        .select();

      if (!seedError && seeded) {
        return { data: seeded as FinanceCategory[], error: null };
      }
    }

    return { data: (data as FinanceCategory[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('getFinanceCategories failed:', msg);
    return { data: [], error: null };
  }
}

/**
 * Retrieves transactions for the authenticated user with optional filtering by date range, category, or type.
 */
export async function getFinanceTransactions(options?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  type?: 'expense' | 'income';
  limit?: number;
}): Promise<DataAccessResult<FinanceTransaction[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    let query = supabase
      .from('finance_transactions')
      .select('*, categories:finance_categories(id, name, color_tag)')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (options?.startDate) {
      query = query.gte('transaction_date', options.startDate);
    }
    if (options?.endDate) {
      query = query.lte('transaction_date', options.endDate);
    }
    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options?.type) {
      query = query.eq('type', options.type);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Finance transactions query warning:', error.message);
      return { data: [], error: null };
    }

    return { data: (data as FinanceTransaction[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('getFinanceTransactions failed:', msg);
    return { data: [], error: null };
  }
}

/**
 * Retrieves recurring transactions for the authenticated user.
 */
export async function getFinanceRecurringTransactions(options?: {
  status?: RecurrenceStatus;
}): Promise<DataAccessResult<FinanceRecurringTransaction[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    let query = supabase
      .from('finance_recurring_transactions')
      .select('*, categories:finance_categories(id, name, color_tag)')
      .eq('user_id', user.id)
      .order('status', { ascending: true })
      .order('next_occurrence', { ascending: true });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Finance recurring transactions query warning:', error.message);
      return { data: [], error: null };
    }

    return { data: (data as FinanceRecurringTransaction[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('getFinanceRecurringTransactions failed:', msg);
    return { data: [], error: null };
  }
}

/**
 * Retrieves category budgets for the authenticated user.
 */
export async function getFinanceBudgets(period?: string): Promise<DataAccessResult<FinanceBudget[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'Authentication required.' };
    }

    let query = supabase
      .from('finance_budgets')
      .select('*, categories:finance_categories(id, name, color_tag)')
      .eq('user_id', user.id)
      .order('period', { ascending: false });

    if (period) {
      query = query.eq('period', period);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Finance budgets query warning:', error.message);
      return { data: [], error: null };
    }

    return { data: (data as FinanceBudget[]) || [], error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('getFinanceBudgets failed:', msg);
    return { data: [], error: null };
  }
}

export interface FinanceOverviewData {
  summary: FinanceSummary;
  breakdown: CategoryBreakdownItem[];
  trends: MonthlyTrendItem[];
  recentTransactions: FinanceTransaction[];
  categories: FinanceCategory[];
  recurringTransactions: FinanceRecurringTransaction[];
  budgets: FinanceBudget[];
  budgetOverview: MonthlyBudgetOverview;
  monthStr: string; // "YYYY-MM"
}

/**
 * Server-authoritative query computing full monthly financial metrics, recurring schedules, and category budgets.
 */
export async function getFinanceMonthlyOverview(
  yearMonthStr: string, // "YYYY-MM"
  timeZone: string
): Promise<DataAccessResult<FinanceOverviewData>> {
  try {
    const [year, month] = yearMonthStr.split('-').map(Number);
    const firstDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const totalDays = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const lastDateStr = `${year}-${String(month).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`;

    // Query month transactions, all recent transactions for trend analysis, categories, recurring txs, and budgets in parallel
    const [monthTxRes, allTxRes, catRes, recurringRes, budgetsRes] = await Promise.all([
      getFinanceTransactions({ startDate: firstDateStr, endDate: lastDateStr }),
      getFinanceTransactions({ limit: 200 }),
      getFinanceCategories(),
      getFinanceRecurringTransactions(),
      getFinanceBudgets(yearMonthStr),
    ]);

    const monthTransactions = monthTxRes.data || [];
    const allTransactions = allTxRes.data || [];
    const categories = catRes.data || [];
    const recurringTransactions = recurringRes.data || [];
    const budgets = budgetsRes.data || [];

    const summary = calculateFinanceSummary(monthTransactions);
    const breakdown = calculateCategoryBreakdown(monthTransactions, categories);
    const trends = calculateMonthlyTrends(allTransactions, timeZone, 6);
    const budgetOverview = calculateBudgetStatus(budgets, monthTransactions, categories, yearMonthStr);

    return {
      data: {
        summary,
        breakdown,
        trends,
        recentTransactions: monthTransactions,
        categories,
        recurringTransactions,
        budgets,
        budgetOverview,
        monthStr: yearMonthStr,
      },
      error: null,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return {
      data: null,
      error: msg,
    };
  }
}
