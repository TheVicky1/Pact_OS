'use client';

import React, { useState, useTransition } from 'react';
import {
  FinanceOverviewData,
  FinanceTransaction,
  FinanceRecurringTransaction,
} from '../data-access';
import {
  TransactionType,
  FinanceColorTag,
  RecurrenceFrequency,
} from '@/lib/money';
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  createCategoryAction,
  updateCategoryAction,
  createRecurringTransactionAction,
  updateRecurringTransactionAction,
  deleteRecurringTransactionAction,
  pauseResumeRecurringTransactionAction,
  triggerRecurrenceGenerationAction,
  createBudgetAction,
  deleteBudgetAction,
  getFinanceMonthlyOverviewAction,
} from '../actions';
import { FinanceHeader } from './finance-header';
import { FinanceSummaryCards } from './finance-summary-cards';
import { SpendingBreakdownCard } from './spending-breakdown-card';
import { MonthlyTrendCard } from './monthly-trend-card';
import { BudgetDisciplineCard } from './budget-discipline-card';
import { RecurringTransactionsCard } from './recurring-transactions-card';
import { TransactionList } from './transaction-list';
import { TransactionModal } from './transaction-modal';
import { CategoryManagerModal } from './category-manager-modal';
import { RecurringTransactionModal } from './recurring-transaction-modal';
import { BudgetManagerModal } from './budget-manager-modal';

interface FinanceWorkspaceProps {
  initialData: FinanceOverviewData;
  userTimeZone: string;
  currency?: string;
}

export function FinanceWorkspace({
  initialData,
  userTimeZone,
  currency = 'INR',
}: FinanceWorkspaceProps) {
  const [data, setData] = useState<FinanceOverviewData>(initialData);
  const [isPending, startTransition] = useTransition();

  // Modals & form state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<FinanceRecurringTransaction | null>(null);
  const [isRunningDue, setIsRunningDue] = useState(false);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  // Derive current date in user's timezone YYYY-MM-DD
  const now = new Date();
  const currentDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimeZone || 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // en-CA gives YYYY-MM-DD

  // Refetches monthly data for a given month
  const refreshMonthData = (yearMonth: string) => {
    startTransition(async () => {
      const res = await getFinanceMonthlyOverviewAction(yearMonth, userTimeZone);
      if (res) {
        setData(res);
      }
    });
  };

  const handleMonthChange = (newYearMonth: string) => {
    refreshMonthData(newYearMonth);
  };

  // Transaction Handlers
  const handleOpenAddTransaction = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setTxModalType(type);
    setIsTxModalOpen(true);
  };

  const handleOpenEditTransaction = (tx: FinanceTransaction) => {
    setEditingTransaction(tx);
    setTxModalType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleSaveTransaction = async (input: {
    type: TransactionType;
    amount: string;
    description: string;
    category_id?: string | null;
    transaction_date?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    let result;
    if (editingTransaction) {
      result = await updateTransactionAction(editingTransaction.id, {
        type: input.type,
        amount: input.amount,
        description: input.description,
        category_id: input.category_id,
        transaction_date: input.transaction_date,
      });
    } else {
      result = await createTransactionAction({
        type: input.type,
        amount: input.amount,
        description: input.description,
        category_id: input.category_id,
        transaction_date: input.transaction_date,
      });
    }

    if (result.success) {
      refreshMonthData(data.monthStr);
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Failed to save transaction.' };
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteTransactionAction(id);
      if (res.success) {
        refreshMonthData(data.monthStr);
      } else {
        alert(res.error || 'Failed to delete transaction.');
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Category Handlers
  const handleCreateCategory = async (
    name: string,
    colorTag: FinanceColorTag
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await createCategoryAction({
      name,
      color_tag: colorTag,
    });

    if (res.success) {
      refreshMonthData(data.monthStr);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to create category.' };
  };

  const handleUpdateCategory = async (
    id: string,
    updates: { name?: string; color_tag?: FinanceColorTag; is_archived?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await updateCategoryAction(id, updates);
    if (res.success) {
      refreshMonthData(data.monthStr);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to update category.' };
  };

  // Recurring Transactions Handlers
  const handleOpenAddRecurring = () => {
    setEditingRecurring(null);
    setIsRecurringModalOpen(true);
  };

  const handleOpenEditRecurring = (rec: FinanceRecurringTransaction) => {
    setEditingRecurring(rec);
    setIsRecurringModalOpen(true);
  };

  const handleSaveRecurring = async (input: {
    type: TransactionType;
    amount: string;
    description: string;
    category_id?: string | null;
    frequency: RecurrenceFrequency;
    start_date: string;
    end_date?: string | null;
    status: 'active' | 'paused';
  }): Promise<{ success: boolean; error?: string }> => {
    let result;
    if (editingRecurring) {
      result = await updateRecurringTransactionAction(editingRecurring.id, input);
    } else {
      result = await createRecurringTransactionAction(input);
    }

    if (result.success) {
      refreshMonthData(data.monthStr);
      return { success: true };
    }
    return { success: false, error: result.error || 'Failed to save recurring transaction.' };
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) {
      return;
    }
    const res = await deleteRecurringTransactionAction(id);
    if (res.success) {
      refreshMonthData(data.monthStr);
    } else {
      alert(res.error || 'Failed to delete subscription.');
    }
  };

  const handleToggleRecurringStatus = async (item: FinanceRecurringTransaction) => {
    const newStatus = item.status === 'active' ? 'paused' : 'active';
    const res = await pauseResumeRecurringTransactionAction(item.id, newStatus);
    if (res.success) {
      refreshMonthData(data.monthStr);
    } else {
      alert(res.error || 'Failed to change subscription status.');
    }
  };

  const handleRunDueRecurring = async () => {
    setIsRunningDue(true);
    try {
      const res = await triggerRecurrenceGenerationAction();
      if (res.success) {
        refreshMonthData(data.monthStr);
      } else {
        alert(res.error || 'Failed to process recurring transactions.');
      }
    } finally {
      setIsRunningDue(false);
    }
  };

  // Budget Handlers
  const handleSaveBudget = async (input: {
    category_id: string;
    period: string;
    limit: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const res = await createBudgetAction(input);
    if (res.success) {
      refreshMonthData(data.monthStr);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to set budget.' };
  };

  const handleDeleteBudget = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const res = await deleteBudgetAction(id);
    if (res.success) {
      refreshMonthData(data.monthStr);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to delete budget.' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header with Month Navigator and Quick Actions */}
      <FinanceHeader
        currentYearMonth={data.monthStr}
        onMonthChange={handleMonthChange}
        onAddExpense={() => handleOpenAddTransaction('expense')}
        onAddIncome={() => handleOpenAddTransaction('income')}
        onManageCategories={() => setIsCategoryModalOpen(true)}
        isLoading={isPending}
      />

      {/* 2. Top Summary Metric Cards: Balance, Income, Expenses, Savings */}
      <FinanceSummaryCards summary={data.summary} currency={currency} />

      {/* 3. Mid Grid: Spending Breakdown & Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendingBreakdownCard
          breakdown={data.breakdown}
          currency={currency}
          onAddExpense={() => handleOpenAddTransaction('expense')}
        />
        <MonthlyTrendCard trends={data.trends} currency={currency} />
      </div>

      {/* 4. Phase 5E Discipline Grid: Budget Discipline & Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BudgetDisciplineCard
          budgetOverview={data.budgetOverview}
          currency={currency}
          onManageBudgets={() => setIsBudgetModalOpen(true)}
        />
        <RecurringTransactionsCard
          recurringTransactions={data.recurringTransactions}
          currency={currency}
          onAddRecurring={handleOpenAddRecurring}
          onEditRecurring={handleOpenEditRecurring}
          onToggleStatus={handleToggleRecurringStatus}
          onDeleteRecurring={handleDeleteRecurring}
          onRunDue={handleRunDueRecurring}
          isRunningDue={isRunningDue}
        />
      </div>

      {/* 5. Transactions Ledger & Filters */}
      <TransactionList
        transactions={data.recentTransactions}
        categories={data.categories}
        currency={currency}
        onAddTransaction={handleOpenAddTransaction}
        onEditTransaction={handleOpenEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        onRefresh={() => refreshMonthData(data.monthStr)}
        isDeletingId={deletingId}
      />

      {/* 6. Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        categories={data.categories}
        initialType={txModalType}
        editingTransaction={editingTransaction}
        currentDateStr={currentDateStr}
        currencySymbol={currency.toUpperCase() === 'INR' ? '₹' : '$'}
        onSave={handleSaveTransaction}
      />

      {/* 7. Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={data.categories}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
      />

      {/* 8. Phase 5E: Recurring Transaction Modal */}
      <RecurringTransactionModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        categories={data.categories}
        editingRecurring={editingRecurring}
        currentDateStr={currentDateStr}
        currencySymbol={currency.toUpperCase() === 'INR' ? '₹' : '$'}
        onSave={handleSaveRecurring}
      />

      {/* 9. Phase 5E: Budget Manager Modal */}
      <BudgetManagerModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={data.categories}
        budgets={data.budgets}
        currentPeriod={data.monthStr}
        currencySymbol={currency.toUpperCase() === 'INR' ? '₹' : '$'}
        onSaveBudget={handleSaveBudget}
        onDeleteBudget={handleDeleteBudget}
      />
    </div>
  );
}
