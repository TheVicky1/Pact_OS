'use client';

import React, { useState } from 'react';
import {
  FinanceBudget,
  FinanceCategory,
  FinanceColorTag,
  parseAmountToCents,
} from '@/lib/money';
import { X, Target, Loader2, AlertCircle, Trash2, Check } from 'lucide-react';

interface BudgetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  budgets: FinanceBudget[];
  currentPeriod: string; // "YYYY-MM"
  currencySymbol?: string;
  onSaveBudget: (input: {
    category_id: string;
    period: string;
    limit: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onDeleteBudget: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const COLOR_MAP: Record<FinanceColorTag, { dot: string; text: string }> = {
  gold: { dot: 'bg-amber-400', text: 'text-amber-400' },
  blue: { dot: 'bg-blue-400', text: 'text-blue-400' },
  purple: { dot: 'bg-purple-400', text: 'text-purple-400' },
  emerald: { dot: 'bg-emerald-400', text: 'text-emerald-400' },
  amber: { dot: 'bg-amber-500', text: 'text-amber-500' },
  rose: { dot: 'bg-rose-400', text: 'text-rose-400' },
  cyan: { dot: 'bg-cyan-400', text: 'text-cyan-400' },
  slate: { dot: 'bg-zinc-400', text: 'text-zinc-400' },
};

export function BudgetManagerModal({
  isOpen,
  onClose,
  categories,
  budgets,
  currentPeriod,
  currencySymbol = '₹',
  onSaveBudget,
  onDeleteBudget,
}: BudgetManagerModalProps) {
  if (!isOpen) return null;

  return (
    <BudgetManagerModalForm
      key={`budget-mgr-${currentPeriod}`}
      onClose={onClose}
      categories={categories}
      budgets={budgets}
      currentPeriod={currentPeriod}
      currencySymbol={currencySymbol}
      onSaveBudget={onSaveBudget}
      onDeleteBudget={onDeleteBudget}
    />
  );
}

function BudgetManagerModalForm({
  onClose,
  categories,
  budgets,
  currentPeriod,
  currencySymbol,
  onSaveBudget,
  onDeleteBudget,
}: {
  onClose: () => void;
  categories: FinanceCategory[];
  budgets: FinanceBudget[];
  currentPeriod: string;
  currencySymbol: string;
  onSaveBudget: (input: {
    category_id: string;
    period: string;
    limit: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onDeleteBudget: (id: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const activeCategories = categories.filter((c) => !c.is_archived);
  const budgetMap = new Map<string, FinanceBudget>();
  for (const b of budgets) {
    if (b.period === currentPeriod) {
      budgetMap.set(b.category_id, b);
    }
  }

  // Local state for limits per category
  const [limits, setLimits] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const cat of activeCategories) {
      const existing = budgetMap.get(cat.id);
      if (existing) {
        map[cat.id] = (existing.limit_cents / 100).toFixed(0);
      } else {
        map[cat.id] = '';
      }
    }
    return map;
  });

  const [savingCatId, setSavingCatId] = useState<string | null>(null);
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveCategoryBudget = async (categoryId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const val = limits[categoryId];

    if (!val || !val.trim()) {
      setErrorMsg('Please enter a budget limit amount.');
      return;
    }

    const parsed = parseAmountToCents(val);
    if (parsed.error || parsed.cents === null || parsed.cents <= 0) {
      setErrorMsg(parsed.error || 'Budget limit must be greater than zero.');
      return;
    }

    setSavingCatId(categoryId);
    try {
      const res = await onSaveBudget({
        category_id: categoryId,
        period: currentPeriod,
        limit: val,
      });

      if (res.success) {
        setSuccessMsg('Budget limit updated successfully.');
      } else {
        setErrorMsg(res.error || 'Failed to update budget limit.');
      }
    } catch {
      setErrorMsg('Unexpected error updating budget limit.');
    } finally {
      setSavingCatId(null);
    }
  };

  const handleDeleteCategoryBudget = async (budgetId: string, categoryId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setDeletingBudgetId(budgetId);
    try {
      const res = await onDeleteBudget(budgetId);
      if (res.success) {
        setLimits((prev) => ({ ...prev, [categoryId]: '' }));
        setSuccessMsg('Budget cap removed.');
      } else {
        setErrorMsg(res.error || 'Failed to remove budget cap.');
      }
    } finally {
      setDeletingBudgetId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/[0.1] shadow-2xl p-6 relative flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Category Budgets</h2>
            <p className="text-xs text-zinc-400">
              Set monthly spending caps for <span className="font-mono text-amber-400">{currentPeriod}</span>
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Category Limits List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
          {activeCategories.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">No active categories available to budget.</p>
          ) : (
            activeCategories.map((cat) => {
              const theme = COLOR_MAP[cat.color_tag] || COLOR_MAP.gold;
              const existingBudget = budgetMap.get(cat.id);
              const isSaving = savingCatId === cat.id;
              const isDeleting = deletingBudgetId === existingBudget?.id;

              return (
                <div
                  key={cat.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-[120px]">
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                    <span className="text-xs font-semibold text-white">{cat.name}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="relative max-w-[140px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-mono text-xs">
                        {currencySymbol}
                      </span>
                      <input
                        type="text"
                        value={limits[cat.id] || ''}
                        onChange={(e) =>
                          setLimits((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        placeholder="No limit"
                        className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-amber-400/60"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveCategoryBudget(cat.id)}
                      disabled={isSaving}
                      title="Save limit for this category"
                      className="px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/30 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Save</span>
                    </button>

                    {existingBudget && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCategoryBudget(existingBudget.id, cat.id)}
                        disabled={isDeleting}
                        title="Remove budget cap"
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 flex items-center justify-end border-t border-white/[0.06] mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
