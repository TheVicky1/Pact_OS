'use server';

import { createClient } from '@/lib/supabase/server';
import {
  createTransactionSchema,
  updateTransactionSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@/lib/validations/finance';
import {
  FinanceTransaction,
  FinanceCategory,
  parseAmountToCents,
} from '@/lib/money';
import { revalidatePath } from 'next/cache';
import { getFinanceMonthlyOverview, FinanceOverviewData } from './data-access';

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
