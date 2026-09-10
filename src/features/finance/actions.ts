'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createTransactionSchema,
  updateTransactionSchema,
  createCategorySchema,
  updateCategorySchema,
  createRecurringTransactionSchema,
  updateRecurringTransactionSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from '@/lib/validations/finance';
import {
  FinanceTransaction,
  FinanceCategory,
  FinanceRecurringTransaction,
  FinanceBudget,
  parseAmountToCents,
  calculateBudgetStatus,
  evaluateBudgetAlert,
} from '@/lib/money';
import { revalidatePath } from 'next/cache';
import {
  getFinanceMonthlyOverview,
  getFinanceBudgets,
  getFinanceCategories,
  getFinanceTransactions,
  FinanceOverviewData,
} from './data-access';

export interface FinanceActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action to record a new expense or income transaction.
 */
export async function createTransactionAction(
  payload: unknown
): Promise<FinanceActionResult<FinanceTransaction>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    // Support amount as either raw cents number or decimal/currency string
    if (processedPayload && typeof processedPayload.amount === 'string') {
      const parsed = parseAmountToCents(processedPayload.amount);
      if (parsed.error || parsed.cents === null) {
        return { success: false, error: parsed.error || 'Invalid amount.' };
      }
      processedPayload = { ...processedPayload, amount_cents: parsed.cents };
    }

    const validation = createTransactionSchema.safeParse(processedPayload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid transaction details.' };
    }

    const { type, amount_cents, description, category_id, transaction_date } = validation.data;

    // Verify category ownership if provided
    if (category_id) {
      const { data: cat } = await supabase
        .from('finance_categories')
        .select('id')
        .eq('id', category_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cat) {
        return { success: false, error: 'Selected category does not exist or access denied.' };
      }
    }

    const insertData: Record<string, unknown> = {
      user_id: user.id,
      type,
      amount_cents,
      description,
      category_id: category_id || null,
    };

    if (transaction_date) {
      insertData.transaction_date = transaction_date;
    }

    const { data: newTx, error: insertError } = await supabase
      .from('finance_transactions')
      .insert(insertData)
      .select('*, categories:finance_categories(id, name, color_tag)')
      .single();

    if (insertError) {
      console.warn('Transaction insert failed:', insertError.message);
      return { success: false, error: 'Failed to record transaction.' };
    }

    // Check budget alerts asynchronously if it was an expense
    if (type === 'expense' && category_id) {
      const txDate = (transaction_date || new Date().toISOString().slice(0, 10));
      const period = txDate.slice(0, 7);
      await checkAndDispatchBudgetAlert(user.id, category_id, period);
    }

    revalidatePath('/app/finance');
    revalidatePath('/app');
    return { success: true, data: newTx as FinanceTransaction };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to update an existing transaction.
 */
export async function updateTransactionAction(
  id: string,
  payload: unknown
): Promise<FinanceActionResult<FinanceTransaction>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    if (processedPayload && typeof processedPayload.amount === 'string') {
      const parsed = parseAmountToCents(processedPayload.amount);
      if (parsed.error || parsed.cents === null) {
        return { success: false, error: parsed.error || 'Invalid amount.' };
      }
      processedPayload = { ...processedPayload, amount_cents: parsed.cents };
    }

    const validation = updateTransactionSchema.safeParse(processedPayload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid transaction update.' };
    }

    const { category_id } = validation.data;
    if (category_id) {
      const { data: cat } = await supabase
        .from('finance_categories')
        .select('id')
        .eq('id', category_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cat) {
        return { success: false, error: 'Selected category does not exist.' };
      }
    }

    const { data: updatedTx, error: updateError } = await supabase
      .from('finance_transactions')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, categories:finance_categories(id, name, color_tag)')
      .single();

    if (updateError) {
      return { success: false, error: 'Failed to update transaction.' };
    }

    revalidatePath('/app/finance');
    revalidatePath('/app');
    return { success: true, data: updatedTx as FinanceTransaction };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to delete a transaction.
 */
export async function deleteTransactionAction(
  id: string
): Promise<FinanceActionResult<null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error: deleteError } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return { success: false, error: 'Failed to delete transaction.' };
    }

    revalidatePath('/app/finance');
    revalidatePath('/app');
    return { success: true, data: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to create a custom finance category.
 */
export async function createCategoryAction(
  payload: unknown
): Promise<FinanceActionResult<FinanceCategory>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const validation = createCategorySchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid category details.' };
    }

    const { name, color_tag } = validation.data;

    const { data: newCat, error: insertError } = await supabase
      .from('finance_categories')
      .insert({
        user_id: user.id,
        name,
        color_tag,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: 'Failed to create category. A category with this name may already exist.' };
    }

    revalidatePath('/app/finance');
    return { success: true, data: newCat as FinanceCategory };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to update or archive a category.
 */
export async function updateCategoryAction(
  id: string,
  payload: unknown
): Promise<FinanceActionResult<FinanceCategory>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const validation = updateCategorySchema.safeParse(payload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid category update.' };
    }

    const { data: updatedCat, error: updateError } = await supabase
      .from('finance_categories')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: 'Failed to update category.' };
    }

    revalidatePath('/app/finance');
    return { success: true, data: updatedCat as FinanceCategory };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

// =========================================================================
// PHASE 5E: RECURRING TRANSACTIONS ACTIONS
// =========================================================================

/**
 * Server Action to create a recurring transaction (subscription / recurring income/expense).
 */
export async function createRecurringTransactionAction(
  payload: unknown
): Promise<FinanceActionResult<FinanceRecurringTransaction>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    if (processedPayload && typeof processedPayload.amount === 'string') {
      const parsed = parseAmountToCents(processedPayload.amount);
      if (parsed.error || parsed.cents === null) {
        return { success: false, error: parsed.error || 'Invalid amount.' };
      }
      processedPayload = { ...processedPayload, amount_cents: parsed.cents };
    }

    const validation = createRecurringTransactionSchema.safeParse(processedPayload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid recurring transaction details.' };
    }

    const { type, amount_cents, description, category_id, frequency, start_date, end_date, status } = validation.data;

    if (category_id) {
      const { data: cat } = await supabase
        .from('finance_categories')
        .select('id')
        .eq('id', category_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cat) {
        return { success: false, error: 'Selected category does not exist or access denied.' };
      }
    }

    const { data: newRecurrence, error: insertError } = await supabase
      .from('finance_recurring_transactions')
      .insert({
        user_id: user.id,
        type,
        amount_cents,
        description,
        category_id: category_id || null,
        frequency,
        start_date,
        end_date: end_date || null,
        next_occurrence: start_date,
        status,
      })
      .select('*, categories:finance_categories(id, name, color_tag)')
      .single();

    if (insertError) {
      console.warn('Recurring transaction insert failed:', insertError.message);
      return { success: false, error: 'Failed to create recurring transaction.' };
    }

    // Trigger immediate generation if due today or earlier
    const today = new Date().toISOString().slice(0, 10);
    if (start_date <= today) {
      try {
        await supabase.rpc('generate_user_due_recurring_transactions', { p_user_id: user.id });
      } catch (rpcErr) {
        console.warn('Recurrence generation trigger warning:', rpcErr);
      }
    }

    revalidatePath('/app/finance');
    revalidatePath('/app');
    return { success: true, data: newRecurrence as FinanceRecurringTransaction };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to update an existing recurring transaction.
 */
export async function updateRecurringTransactionAction(
  id: string,
  payload: unknown
): Promise<FinanceActionResult<FinanceRecurringTransaction>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    if (processedPayload && typeof processedPayload.amount === 'string') {
      const parsed = parseAmountToCents(processedPayload.amount);
      if (parsed.error || parsed.cents === null) {
        return { success: false, error: parsed.error || 'Invalid amount.' };
      }
      processedPayload = { ...processedPayload, amount_cents: parsed.cents };
    }

    const validation = updateRecurringTransactionSchema.safeParse(processedPayload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid update parameters.' };
    }

    const { category_id } = validation.data;
    if (category_id) {
      const { data: cat } = await supabase
        .from('finance_categories')
        .select('id')
        .eq('id', category_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cat) {
        return { success: false, error: 'Selected category does not exist.' };
      }
    }

    const { data: updatedRecurrence, error: updateError } = await supabase
      .from('finance_recurring_transactions')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, categories:finance_categories(id, name, color_tag)')
      .single();

    if (updateError) {
      return { success: false, error: 'Failed to update recurring transaction.' };
    }

    revalidatePath('/app/finance');
    revalidatePath('/app');
    return { success: true, data: updatedRecurrence as FinanceRecurringTransaction };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to delete a recurring transaction.
 */
export async function deleteRecurringTransactionAction(
  id: string
): Promise<FinanceActionResult<null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error: deleteError } = await supabase
      .from('finance_recurring_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return { success: false, error: 'Failed to delete recurring transaction.' };
    }

    revalidatePath('/app/finance');
    revalidatePath('/app');
    return { success: true, data: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to toggle pause / active status on a recurring transaction.
 */
export async function pauseResumeRecurringTransactionAction(
  id: string,
  newStatus: 'active' | 'paused'
): Promise<FinanceActionResult<FinanceRecurringTransaction>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: updated, error: updateError } = await supabase
      .from('finance_recurring_transactions')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, categories:finance_categories(id, name, color_tag)')
      .single();

    if (updateError) {
      return { success: false, error: 'Failed to change subscription status.' };
    }

    revalidatePath('/app/finance');
    return { success: true, data: updated as FinanceRecurringTransaction };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

// =========================================================================
// PHASE 5E: BUDGET DISCIPLINE ACTIONS
// =========================================================================

/**
 * Server Action to set or update a category budget for a monthly period.
 */
export async function createBudgetAction(
  payload: unknown
): Promise<FinanceActionResult<FinanceBudget>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    if (processedPayload && typeof processedPayload.limit === 'string') {
      const parsed = parseAmountToCents(processedPayload.limit);
      if (parsed.error || parsed.cents === null) {
        return { success: false, error: parsed.error || 'Invalid budget limit amount.' };
      }
      processedPayload = { ...processedPayload, limit_cents: parsed.cents };
    }

    const validation = createBudgetSchema.safeParse(processedPayload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid budget parameters.' };
    }

    const { category_id, period, limit_cents } = validation.data;

    // Verify category ownership
    const { data: cat } = await supabase
      .from('finance_categories')
      .select('id')
      .eq('id', category_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!cat) {
      return { success: false, error: 'Selected category does not exist or access denied.' };
    }

    // Upsert budget on (user_id, category_id, period)
    const { data: budget, error: upsertError } = await supabase
      .from('finance_budgets')
      .upsert(
        {
          user_id: user.id,
          category_id,
          period,
          limit_cents,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,category_id,period' }
      )
      .select('*, categories:finance_categories(id, name, color_tag)')
      .single();

    if (upsertError) {
      console.warn('Budget upsert failed:', upsertError.message);
      return { success: false, error: 'Failed to establish category budget.' };
    }

    // Evaluate budget status and dispatch alert if already approaching/exceeded
    await checkAndDispatchBudgetAlert(user.id, category_id, period);

    revalidatePath('/app/finance');
    return { success: true, data: budget as FinanceBudget };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to update an existing budget.
 */
export async function updateBudgetAction(
  id: string,
  payload: unknown
): Promise<FinanceActionResult<FinanceBudget>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    let processedPayload = payload as Record<string, unknown>;

    if (processedPayload && typeof processedPayload.limit === 'string') {
      const parsed = parseAmountToCents(processedPayload.limit);
      if (parsed.error || parsed.cents === null) {
        return { success: false, error: parsed.error || 'Invalid budget limit amount.' };
      }
      processedPayload = { ...processedPayload, limit_cents: parsed.cents };
    }

    const validation = updateBudgetSchema.safeParse(processedPayload);
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0]?.message || 'Invalid budget update details.' };
    }

    const { data: updatedBudget, error: updateError } = await supabase
      .from('finance_budgets')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, categories:finance_categories(id, name, color_tag)')
      .single();

    if (updateError) {
      return { success: false, error: 'Failed to update budget.' };
    }

    revalidatePath('/app/finance');
    return { success: true, data: updatedBudget as FinanceBudget };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Server Action to delete a category budget.
 */
export async function deleteBudgetAction(
  id: string
): Promise<FinanceActionResult<null>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { error: deleteError } = await supabase
      .from('finance_budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return { success: false, error: 'Failed to delete budget.' };
    }

    revalidatePath('/app/finance');
    return { success: true, data: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Helper to evaluate budget thresholds and insert idempotent notifications.
 */
async function checkAndDispatchBudgetAlert(
  userId: string,
  categoryId: string,
  period: string
): Promise<void> {
  try {
    const supabase = await createClient();
    const [budgetsRes, txRes, catRes] = await Promise.all([
      getFinanceBudgets(period),
      getFinanceTransactions({
        startDate: `${period}-01`,
        endDate: `${period}-31`,
        categoryId,
        type: 'expense',
      }),
      getFinanceCategories(),
    ]);

    const budgets = budgetsRes.data || [];
    const transactions = txRes.data || [];
    const categories = catRes.data || [];

    const overview = calculateBudgetStatus(budgets, transactions, categories, period);
    const catStatus = overview.categories.find((c) => c.categoryId === categoryId);

    if (!catStatus) return;

    const alert = evaluateBudgetAlert(userId, catStatus);
    if (alert.shouldNotify && alert.type && alert.title && alert.body && alert.idempotencyKey) {
      // Check if notification already dispatched for this key
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', alert.type)
        .contains('metadata', { idempotency_key: alert.idempotencyKey })
        .maybeSingle();

      if (!existing) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: alert.type,
          title: alert.title,
          body: alert.body,
          metadata: {
            idempotency_key: alert.idempotencyKey,
            category_id: categoryId,
            period,
            utilization_percent: catStatus.utilizationPercent,
            spent_cents: catStatus.spentCents,
            limit_cents: catStatus.limitCents,
          },
        });
      }
    }
  } catch (err) {
    console.warn('Budget alert dispatch error:', err);
  }
}

/**
 * Server Action to trigger generation of due recurring transactions.
 */
export async function triggerRecurrenceGenerationAction(): Promise<FinanceActionResult<{ count: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Authentication required.' };
    }

    const { data: count, error: rpcError } = await supabase.rpc(
      'generate_user_due_recurring_transactions',
      { p_user_id: user.id }
    );

    if (rpcError) {
      console.warn('Recurrence generation error:', rpcError.message);
      return { success: false, error: 'Failed to generate recurring transactions.' };
    }

    revalidatePath('/app/finance');
    revalidatePath('/app');
    return { success: true, data: { count: typeof count === 'number' ? count : 0 } };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected error.';
    return { success: false, error: msg };
  }
}

/**
 * Client-callable Server Action to fetch monthly overview data dynamically.
 */
export async function getFinanceMonthlyOverviewAction(
  yearMonthStr: string,
  timeZone: string
): Promise<FinanceOverviewData | null> {
  const result = await getFinanceMonthlyOverview(yearMonthStr, timeZone);
  return result.data;
}
