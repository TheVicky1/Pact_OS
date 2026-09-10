'use client';

import React, { useState } from 'react';
import {
  FinanceRecurringTransaction,
  FinanceCategory,
  TransactionType,
  RecurrenceFrequency,
  parseAmountToCents,
} from '@/lib/money';
import { X, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

interface RecurringTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  editingRecurring?: FinanceRecurringTransaction | null;
  currentDateStr: string; // YYYY-MM-DD
  currencySymbol?: string;
  onSave: (input: {
    type: TransactionType;
    amount: string;
    description: string;
    category_id?: string | null;
    frequency: RecurrenceFrequency;
    start_date: string;
    end_date?: string | null;
    status: 'active' | 'paused';
  }) => Promise<{ success: boolean; error?: string }>;
}

export function RecurringTransactionModal({
  isOpen,
  onClose,
  categories,
  editingRecurring = null,
  currentDateStr,
  currencySymbol = '₹',
  onSave,
}: RecurringTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <RecurringTransactionModalForm
      key={editingRecurring ? editingRecurring.id : 'new-recurring'}
      onClose={onClose}
      categories={categories}
      editingRecurring={editingRecurring}
      currentDateStr={currentDateStr}
      currencySymbol={currencySymbol}
      onSave={onSave}
    />
  );
}

function RecurringTransactionModalForm({
  onClose,
  categories,
  editingRecurring,
  currentDateStr,
  currencySymbol,
  onSave,
}: {
  onClose: () => void;
  categories: FinanceCategory[];
  editingRecurring: FinanceRecurringTransaction | null;
  currentDateStr: string;
  currencySymbol: string;
  onSave: (input: {
    type: TransactionType;
    amount: string;
    description: string;
    category_id?: string | null;
    frequency: RecurrenceFrequency;
    start_date: string;
    end_date?: string | null;
    status: 'active' | 'paused';
  }) => Promise<{ success: boolean; error?: string }>;
}) {
  const initialAmount = editingRecurring
    ? (editingRecurring.amount_cents / 100).toFixed(2)
    : '';

  const [type, setType] = useState<TransactionType>(editingRecurring?.type || 'expense');
  const [amount, setAmount] = useState<string>(initialAmount);
  const [description, setDescription] = useState<string>(editingRecurring?.description || '');
  const [categoryId, setCategoryId] = useState<string>(editingRecurring?.category_id || '');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(editingRecurring?.frequency || 'monthly');
  const [startDate, setStartDate] = useState<string>(editingRecurring?.start_date || currentDateStr);
  const [endDate, setEndDate] = useState<string>(editingRecurring?.end_date || '');
  const [status, setStatus] = useState<'active' | 'paused'>(editingRecurring?.status === 'paused' ? 'paused' : 'active');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeCategories = categories.filter((c) => !c.is_archived || c.id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = parseAmountToCents(amount);
    if (parsed.error || parsed.cents === null) {
      setErrorMsg(parsed.error || 'Please enter a valid amount.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Description is required.');
      return;
    }

    if (!startDate) {
      setErrorMsg('Start date is required.');
      return;
    }

    if (endDate && endDate < startDate) {
      setErrorMsg('End date cannot be earlier than start date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSave({
        type,
        amount,
        description: description.trim(),
        category_id: categoryId ? categoryId : null,
        frequency,
        start_date: startDate,
        end_date: endDate ? endDate : null,
        status,
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to save recurring transaction.');
      }
    } catch {
      setErrorMsg('Unexpected error saving subscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-zinc-950 border border-white/[0.1] shadow-2xl p-6 relative flex flex-col max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              {editingRecurring ? 'Edit Subscription / Recurring' : 'New Recurring Transaction'}
            </h2>
            <p className="text-xs text-zinc-400">Automate fixed repeating expenses or income</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Switcher: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-zinc-900 border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Recurring Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                type === 'income'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Recurring Income
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Amount ({currencySymbol}) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white placeholder-zinc-400 text-sm font-mono focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/60"
                autoFocus
              />
            </div>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Description / Provider <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Netflix, Rent, Spotify, Server Hosting"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white placeholder-zinc-400 text-sm focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/60"
            />
          </div>

          {/* Frequency & Category Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Frequency <span className="text-rose-400">*</span>
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-400/60"
              >
                <option value="weekly">Weekly (+7d)</option>
                <option value="biweekly">Biweekly (+14d)</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-400/60"
              >
                <option value="">No Category</option>
                {activeCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.is_archived ? '(Archived)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date & Optional End Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Start / Next Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-400/60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-400/60"
              />
            </div>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Recurrence Status
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="radio"
                  name="recurrence_status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-emerald-500 focus:ring-emerald-500"
                />
                Active
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="radio"
                  name="recurrence_status"
                  value="paused"
                  checked={status === 'paused'}
                  onChange={() => setStatus('paused')}
                  className="text-amber-500 focus:ring-amber-500"
                />
                Paused
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingRecurring ? 'Save Changes' : 'Create Recurrence'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
