'use client';

import React, { useState } from 'react';
import { FinanceCategory, FinanceColorTag } from '@/lib/money';
import { X, Plus, Pencil, Archive, RotateCcw, Loader2, AlertCircle } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: FinanceCategory[];
  onCreateCategory: (name: string, colorTag: FinanceColorTag) => Promise<{ success: boolean; error?: string }>;
  onUpdateCategory: (
    id: string,
    updates: { name?: string; color_tag?: FinanceColorTag; is_archived?: boolean }
  ) => Promise<{ success: boolean; error?: string }>;
}

const AVAILABLE_COLORS: Array<{ tag: FinanceColorTag; label: string; class: string }> = [
  { tag: 'gold', label: 'Gold', class: 'bg-amber-400' },
  { tag: 'blue', label: 'Blue', class: 'bg-blue-400' },
  { tag: 'purple', label: 'Purple', class: 'bg-purple-400' },
  { tag: 'emerald', label: 'Emerald', class: 'bg-emerald-400' },
  { tag: 'amber', label: 'Amber', class: 'bg-amber-500' },
  { tag: 'rose', label: 'Rose', class: 'bg-rose-400' },
  { tag: 'cyan', label: 'Cyan', class: 'bg-cyan-400' },
  { tag: 'slate', label: 'Slate', class: 'bg-zinc-400' },
];

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onCreateCategory,
  onUpdateCategory,
}: CategoryManagerModalProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState<FinanceColorTag>('gold');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState<FinanceColorTag>('gold');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await onCreateCategory(newCatName.trim(), newCatColor);
      if (!res.success) {
        setError(res.error || 'Failed to create category.');
      } else {
        setNewCatName('');
        setNewCatColor('gold');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error creating category';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartEdit = (cat: FinanceCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingColor(cat.color_tag);
    setError(null);
  };

  const handleSaveEdit = async (catId: string) => {
    if (!editingName.trim()) {
      setError('Category name cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await onUpdateCategory(catId, {
        name: editingName.trim(),
        color_tag: editingColor,
      });
      if (!res.success) {
        setError(res.error || 'Failed to update category.');
      } else {
        setEditingId(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating category';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleArchive = async (cat: FinanceCategory) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await onUpdateCategory(cat.id, {
        is_archived: !cat.is_archived,
      });
      if (!res.success) {
        setError(res.error || 'Failed to update category status.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error changing status';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-manager-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-zinc-950 border border-white/[0.08] shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span id="category-manager-title" className="text-xs uppercase font-mono tracking-widest text-amber-400">
              CATEGORY MANAGEMENT
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

        <div className="p-5 overflow-y-auto space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Add New Category Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-xl bg-zinc-900/60 border border-white/[0.06] space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Add New Category</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Category name (e.g. Subscriptions)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-white/[0.08] text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <div className="flex items-center gap-1.5">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c.tag}
                    type="button"
                    onClick={() => setNewCatColor(c.tag)}
                    className={`w-6 h-6 rounded-full ${c.class} transition-all ${
                      newCatColor === c.tag
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                    aria-label={`Select color ${c.label}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !newCatName.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>Add Category</span>
              </button>
            </div>
          </form>

          {/* Category List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Existing Categories</h3>
            <div className="divide-y divide-white/[0.04] border border-white/[0.06] rounded-xl overflow-hidden bg-zinc-900/30">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;
                const colorObj = AVAILABLE_COLORS.find((c) => c.tag === cat.color_tag) || AVAILABLE_COLORS[0];

                if (isEditing) {
                  return (
                    <div key={cat.id} className="p-3 space-y-2 bg-zinc-900/80">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-zinc-950 border border-white/[0.1] text-xs text-white"
                        />
                        <div className="flex items-center gap-1.5">
                          {AVAILABLE_COLORS.map((c) => (
                            <button
                              key={c.tag}
                              type="button"
                              onClick={() => setEditingColor(c.tag)}
                              className={`w-5 h-5 rounded-full ${c.class} ${
                                editingColor === c.tag ? 'ring-2 ring-white scale-110' : 'opacity-60'
                              }`}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(cat.id)}
                          disabled={isSubmitting}
                          className="px-3 py-1 rounded-lg bg-amber-400 text-zinc-950 text-xs font-bold hover:bg-amber-300"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    className={`p-3 flex items-center justify-between transition-colors ${
                      cat.is_archived ? 'opacity-50 bg-zinc-950/40' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${colorObj.class}`} />
                      <span className="text-xs font-medium text-zinc-200">{cat.name}</span>
                      {cat.is_archived && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-white/[0.04]">
                          Archived
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200"
                        title="Edit category"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(cat)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200"
                        title={cat.is_archived ? 'Restore category' : 'Archive category'}
                      >
                        {cat.is_archived ? <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> : <Archive className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
