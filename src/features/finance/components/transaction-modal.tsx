'use client';

import React, { useState } from 'react';
import {
  FinanceTransaction,
  FinanceCategory,
  TransactionType,
  parseAmountToCents,
} from '@/lib/money';
import { X, ArrowDownRight, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  initialType?: TransactionType;
  editingTransaction?: FinanceTransaction | null;
  currentDateStr: string; // YYYY-MM-DD
  currencySymbol?: string;
  onSave: (input: {
    type: TransactionType;
    amount: string;
    description: string;
    category_id?: string | null;
    transaction_date?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function TransactionModal({
  isOpen,
  onClose,
  categories,
  initialType = 'expense',
  editingTransaction = null,
  currentDateStr,
  currencySymbol = '₹',
  onSave,
}: TransactionModalProps) {
  if (!isOpen) return null;

  return (
    <TransactionModalForm
      key={editingTransaction ? editingTransaction.id : `new-${initialType}`}
      onClose={onClose}
      categories={categories}
      initialType={initialType}
      editingTransaction={editingTransaction}
      currentDateStr={currentDateStr}
      currencySymbol={currencySymbol}
      onSave={onSave}
    />
  );
}

function TransactionModalForm({
  onClose,
  categories,
  initialType,
  editingTransaction,
  currentDateStr,
  currencySymbol,
  onSave,
}: {
  onClose: () => void;
  categories: FinanceCategory[];
  initialType: TransactionType;
  editingTransaction: FinanceTransaction | null;
  currentDateStr: string;
  currencySymbol: string;
  onSave: (input: {
    type: TransactionType;
    amount: string;
    description: string;
    category_id?: string | null;
    transaction_date?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}) {
  const activeCats = categories.filter((c) => !c.is_archived);

  const [type, setType] = useState<TransactionType>(
    editingTransaction ? editingTransaction.type : initialType
  );
  const [amount, setAmount] = useState<string>(
    editingTransaction ? (editingTransaction.amount_cents / 100).toString() : ''
  );
  const [description, setDescription] = useState<string>(
    editingTransaction ? editingTransaction.description : ''
  );
  const [categoryId, setCategoryId] = useState<string>(
    editingTransaction
      ? editingTransaction.category_id || ''
      : activeCats.length > 0
      ? activeCats[0].id
      : ''
  );
  const [transactionDate, setTransactionDate] = useState<string>(
    editingTransaction ? editingTransaction.transaction_date : currentDateStr
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate amount
    const parsed = parseAmountToCents(amount);
    if (parsed.error || parsed.cents === null) {
      setError(parsed.error || 'Please enter a valid amount.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave({
        type,
        amount,
        description: description.trim(),
        category_id: categoryId || null,
        transaction_date: transactionDate,
      });

      if (!res.success) {
        setError(res.error || 'Failed to save transaction.');
      } else {
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isExpense = type === 'expense';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span id="modal-title" className="text-xs uppercase font-mono tracking-widest text-amber-400">
              {editingTransaction ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle Segment */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isExpense
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  !isExpense
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                Income
              </button>
            </div>
          </div>

          {/* Amount Field (Highlighted Hero Input) */}
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base font-semibold text-zinc-400">
                {currencySymbol}
              </span>
              <input
                id="tx-amount"
                type="text"
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-lg font-bold font-mono text-white placeholder-zinc-400 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label htmlFor="tx-category" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Category
            </label>
            <select
              id="tx-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-sm text-zinc-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="">Uncategorized</option>
              {activeCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="tx-description" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description
            </label>
            <input
              id="tx-description"
              type="text"
              placeholder={isExpense ? 'e.g. Grocery store, Server hosting' : 'e.g. Salary, Client project payment'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/[0.08] text-sm text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-amber-400 transition-colors"
              required
            />
          </div>

          {/* Date Selector */}
          <div>
            <label htmlFor="tx-date" className="block text-xs font-medium text-zinc-400 mb-1.5">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/[0.08] text-xs font-mono text-zinc-300 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingTransaction ? 'Update' : 'Save'} Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
