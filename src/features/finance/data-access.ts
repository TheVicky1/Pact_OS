import { createClient } from '@/lib/supabase/server';
import {
  FinanceCategory,
  FinanceTransaction,
  FinanceSummary,
  CategoryBreakdownItem,
  MonthlyTrendItem,
  calculateFinanceSummary,
  calculateCategoryBreakdown,
  calculateMonthlyTrends,
  DEFAULT_FINANCE_CATEGORIES,
} from '@/lib/money';

export type { FinanceCategory, FinanceTransaction, FinanceSummary, CategoryBreakdownItem, MonthlyTrendItem };

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

export interface FinanceOverviewData {
  summary: FinanceSummary;
  breakdown: CategoryBreakdownItem[];
  trends: MonthlyTrendItem[];
  recentTransactions: FinanceTransaction[];
  categories: FinanceCategory[];
  monthStr: string; // "YYYY-MM"
}

/**
 * Server-authoritative query computing full monthly financial metrics.
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

    // Query month transactions, all recent transactions for trend analysis, and categories in parallel
    const [monthTxRes, allTxRes, catRes] = await Promise.all([
      getFinanceTransactions({ startDate: firstDateStr, endDate: lastDateStr }),
      getFinanceTransactions({ limit: 200 }),
      getFinanceCategories(),
    ]);

    const monthTransactions = monthTxRes.data || [];
    const allTransactions = allTxRes.data || [];
    const categories = catRes.data || [];

    const summary = calculateFinanceSummary(monthTransactions);
    const breakdown = calculateCategoryBreakdown(monthTransactions, categories);
    const trends = calculateMonthlyTrends(allTransactions, timeZone, 6);

    return {
      data: {
        summary,
        breakdown,
        trends,
        recentTransactions: monthTransactions,
        categories,
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
