'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  AdminMenuItem,
  AdminCategory,
} from '@/types/admin';
import {
  Search,
  CheckCircle2,
  XCircle,
  Flame,
  Sparkles,
  Leaf,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface MenuItemTableProps {
  items: AdminMenuItem[];
  categories: AdminCategory[];
  onToggle: (itemId: string, currentState: boolean) => void;
  onEditItem: (item: AdminMenuItem) => void;
  onDeleteItem: (itemId: string) => Promise<any>;
  onAddNew: () => void;
}

export function MenuItemTable({
  items,
  categories,
  onToggle,
  onEditItem,
  onDeleteItem,
  onAddNew,
}: MenuItemTableProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<AdminMenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pageSize = 8;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false;
      if (statusFilter === 'in_stock' && !item.isAvailable) return false;
      if (statusFilter === 'out_of_stock' && item.isAvailable) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        const catMatch = (item.categoryName || '').toLowerCase().includes(query);
        if (!nameMatch && !descMatch && !catMatch) return false;
      }

      return true;
    });
  }, [items, selectedCategory, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));

  // Reset page when filters change
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage]);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDeleteItem(id);
      setDeleteConfirmItem(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden space-y-4">
      {/* Table Header Filter Toolbar */}
      <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search dishes by title or description..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-700"
          >
            <option value="all">All Categories ({items.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={statusFilter}
            onChange={(e: any) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl font-medium text-stone-700"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock Only</option>
            <option value="out_of_stock">86'd Out of Stock</option>
          </select>
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Dish
        </button>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-3 px-4">Dish</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Base Price</th>
              <th className="py-3 px-4">Customizations</th>
              <th className="py-3 px-4 text-center">86 Stock Switch</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-500">
                  No dishes found matching current filters.
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
                const totalOptions = item.modifierGroups?.reduce(
                  (sum, g) => sum + g.options.length,
                  0
                ) || 0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      !item.isAvailable ? 'bg-red-50/15' : ''
                    }`}
                  >
                    {/* Dish Name & Thumbnail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className={`object-cover ${
                                !item.isAvailable ? 'grayscale contrast-75 opacity-50' : ''
                              }`}
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-[10px] font-bold">
                              No Pic
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 max-w-xs">
                          <h4
                            className={`font-bold truncate text-xs ${
                              !item.isAvailable ? 'line-through text-stone-500' : 'text-stone-900'
                            }`}
                          >
                            {item.name}
                          </h4>

                          {item.description && (
                            <p className="text-[11px] text-stone-400 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-1.5 mt-1">
                            {item.isVegetarian && (
                              <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded-sm">
                                <Leaf className="w-2.5 h-2.5 mr-0.5" /> Veg
                              </span>
                            )}
                            {item.isBestseller && (
                              <span className="inline-flex items-center text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded-sm">
                                <Flame className="w-2.5 h-2.5 mr-0.5" /> Best
                              </span>
                            )}
                            {item.isChefSpecial && (
                              <span className="inline-flex items-center text-[9px] font-bold text-purple-700 bg-purple-50 px-1 py-0.2 rounded-sm">
                                <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Chef
                              </span>
                            )}
                            {item.spicyLevel && item.spicyLevel > 0 ? (
                              <span className="text-[10px]">
                                {'🌶️'.repeat(item.spicyLevel)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 font-semibold text-stone-700">
                      <span className="px-2 py-0.5 bg-stone-100 rounded-md text-[11px]">
                        {item.categoryName}
                      </span>
                    </td>

                    {/* Base Price */}
                    <td className="py-3 px-4 font-mono font-bold text-stone-900">
                      Rs. {item.basePrice.toLocaleString()}
                    </td>

                    {/* Modifiers count */}
                    <td className="py-3 px-4">
                      {item.modifierGroups && item.modifierGroups.length > 0 ? (
                        <div className="text-[11px] font-medium text-stone-600">
                          <span className="font-bold text-stone-900">
                            {item.modifierGroups.length}
                          </span>{' '}
                          groups ({totalOptions} opts)
                        </div>
                      ) : (
                        <span className="text-[11px] text-stone-400">None</span>
                      )}
                    </td>

                    {/* 86 Switch */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onToggle(item.id, item.isAvailable)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-red-600 text-white shadow-xs hover:bg-red-700 animate-pulse'
                        }`}
                      >
                        {item.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-white" />
                            <span>86'd Out</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Dish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
        <div>
          Showing {paginatedItems.length} of {filteredItems.length} dishes
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-stone-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-stone-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-stone-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-stone-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Delete Item Confirmation Dialog */}
      {deleteConfirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Delete Menu Item?</h3>
              <p className="text-xs text-stone-500 mt-1">
                Are you sure you want to permanently delete{' '}
                <strong className="text-stone-800">"{deleteConfirmItem.name}"</strong> and its
                associated modifier groups?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(deleteConfirmItem.id)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
