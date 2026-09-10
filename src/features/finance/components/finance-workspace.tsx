'use client';

import React, { useState, useTransition } from 'react';
import {
  FinanceOverviewData,
  FinanceTransaction,
} from '../data-access';
import {
  TransactionType,
  FinanceColorTag,
} from '@/lib/money';
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  createCategoryAction,
  updateCategoryAction,
  getFinanceMonthlyOverviewAction,
} from '../actions';
import { FinanceHeader } from './finance-header';
import { FinanceSummaryCards } from './finance-summary-cards';
import { SpendingBreakdownCard } from './spending-breakdown-card';
import { MonthlyTrendCard } from './monthly-trend-card';
import { TransactionList } from './transaction-list';
import { TransactionModal } from './transaction-modal';
import { CategoryManagerModal } from './category-manager-modal';

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

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('expense');
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

      {/* 4. Transactions Ledger & Filters */}
      <TransactionList
        transactions={data.recentTransactions}
        categories={data.categories}
        currency={currency}
        onAddTransaction={handleOpenAddTransaction}
        onEditTransaction={handleOpenEditTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        isDeletingId={deletingId}
      />

      {/* 5. Transaction Modal (Add / Edit) */}
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

      {/* 6. Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={data.categories}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={handleUpdateCategory}
      />
    </div>
  );
}
