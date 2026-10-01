'use client';

import React, { useState } from 'react';
import {
  AdminCategory,
} from '@/types/admin';
import {
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Check,
  FolderTree,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: AdminCategory[];
  onSaveCategory: (
    catData: { name: string; icon?: string; badge?: string; sortOrder?: number; isActive?: boolean },
    catId?: string
  ) => Promise<any>;
  onDeleteCategory: (catId: string) => Promise<any>;
  onReorderCategories: (reordered: Array<{ id: string; sortOrder: number }>) => Promise<any>;
}

export function CategoryManagerModal({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
  onReorderCategories,
}: CategoryManagerModalProps) {
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [badge, setBadge] = useState('');
  const [icon, setIcon] = useState('Utensils');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCatId(null);
    setName('');
    setBadge('');
    setIcon('Utensils');
    setSortOrder(categories.length > 0 ? Math.max(...categories.map((c) => c.sortOrder)) + 1 : 1);
  };

  const handleStartEdit = (cat: AdminCategory) => {
    setEditingCatId(cat.id);
    setIsCreating(false);
    setName(cat.name);
    setBadge(cat.badge || '');
    setIcon(cat.icon || 'Utensils');
    setSortOrder(cat.sortOrder);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingCatId(null);
    setName('');
    setBadge('');
  };

  const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const catName = ((formData.get('name') as string) || name).trim();
    const catBadge = ((formData.get('badge') as string) || badge).trim();

    if (!catName) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveCategory(
        {
          name: catName,
          badge: catBadge || undefined,
          icon: icon.trim() || 'Utensils',
          sortOrder: Number(sortOrder) || 0,
        },
        editingCatId || undefined
      );
      handleCancelForm();
    } catch (err) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const list = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const [moved] = list.splice(index, 1);
    list.splice(targetIndex, 0, moved);

    const reordered = list.map((item, idx) => ({
      id: item.id,
      sortOrder: (idx + 1) * 10,
    }));

    await onReorderCategories(reordered);
  };

  const handleDelete = async (catId: string) => {
    setIsSubmitting(true);
    try {
      await onDeleteCategory(catId);
      setDeleteConfirmId(null);
    } catch (err) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Manage Menu Categories</h2>
              <p className="text-xs text-stone-500">Create, rename, re-order and configure menu sections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Add / Edit Form */}
          {(isCreating || editingCatId) && (
            <form
              onSubmit={handleSubmitForm}
              className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-4 animate-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  {editingCatId ? 'Edit Category' : 'Create New Category'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Gourmet Burgers, Cold Drinks"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Badge Tag (Optional)
                  </label>
                  <input
                    name="badge"
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Popular, Hot, New"
                    className="w-full px-3 py-2 text-xs bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-xl bg-stone-900 text-xs font-bold text-white hover:bg-black transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingCatId ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          )}

          {/* Action Row */}
          {!isCreating && !editingCatId && (
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-stone-600">
                {sortedCategories.length} Categories Configured
              </span>
              <button
                type="button"
                onClick={handleStartCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Category
              </button>
            </div>
          )}

          {/* Category Items List with Reorder Controls */}
          <div className="space-y-2">
            {sortedCategories.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-stone-500 text-xs font-medium">
                No categories found. Click "+ Add Category" to start.
              </div>
            ) : (
              sortedCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 transition-all gap-3"
                >
                  {/* Left: Rank & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {cat.name}
                        </span>
                        {cat.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                            {cat.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        Sort rank: {cat.sortOrder}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      title="Move Up"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === sortedCategories.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      title="Move Down"
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      title="Edit Category"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(cat.id)}
                      title="Delete Category"
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Delete Confirmation Alert */}
          {deleteConfirmId && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-900">Delete this Category?</h4>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    Categories containing active dishes cannot be deleted until those dishes are reassigned or removed.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3 py-1.5 rounded-xl border border-red-200 text-xs font-bold text-red-700 hover:bg-red-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-3 py-1.5 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
                >
                  {isSubmitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
