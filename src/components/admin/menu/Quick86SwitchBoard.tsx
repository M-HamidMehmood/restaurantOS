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
  Clock,
  Edit2,
  Filter,
  AlertTriangle,
} from 'lucide-react';

interface Quick86SwitchBoardProps {
  items: AdminMenuItem[];
  categories: AdminCategory[];
  onToggle: (itemId: string, currentState: boolean) => void;
  onEditItem: (item: AdminMenuItem) => void;
}

export function Quick86SwitchBoard({
  items,
  categories,
  onToggle,
  onEditItem,
}: Quick86SwitchBoardProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'in_stock' && !item.isAvailable) return false;
      if (statusFilter === 'out_of_stock' && item.isAvailable) return false;

      // Search filter
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

  const inStockCount = items.filter((i) => i.isAvailable).length;
  const outOfStockCount = items.filter((i) => !i.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Quick search dishes to 86 or stock..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Items ({items.length})
            </button>
            <button
              onClick={() => setStatusFilter('in_stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'in_stock'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              In Stock ({inStockCount})
            </button>
            <button
              onClick={() => setStatusFilter('out_of_stock')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'out_of_stock'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-red-700 hover:text-red-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              86'd Out ({outOfStockCount})
            </button>
          </div>
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-stone-100">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const count = items.filter((i) => i.categoryId === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-stone-800 text-stone-200' : 'bg-stone-200/80 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Dishes for Fast 86 Toggling */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 space-y-3">
          <Filter className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-800">No dishes match your filter</h3>
          <p className="text-xs text-stone-500">
            Try adjusting your search query or switching to another category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isOutOfStock = !item.isAvailable;

            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between p-4 rounded-2xl bg-white border transition-all duration-200 ${
                  isOutOfStock
                    ? 'border-red-300 bg-red-50/20 shadow-xs'
                    : 'border-stone-200/90 hover:border-stone-300 hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Card Header with Image and Tags */}
                  <div className="flex gap-3 mb-3">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className={`object-cover transition-transform duration-300 ${
                            isOutOfStock ? 'grayscale contrast-75 opacity-60' : 'group-hover:scale-105'
                          }`}
                          sizes="64px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300 text-xs font-bold">
                          No Pic
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-red-900/40 flex items-center justify-center">
                          <span className="text-[10px] font-black uppercase text-white tracking-widest bg-red-600 px-1 py-0.5 rounded-sm">
                            86'D
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider bg-stone-100 px-1.5 py-0.5 rounded-md">
                          {item.categoryName}
                        </span>
                        {item.isVegetarian && (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            <Leaf className="w-2.5 h-2.5 mr-0.5" /> Veg
                          </span>
                        )}
                        {item.isBestseller && (
                          <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                            <Flame className="w-2.5 h-2.5 mr-0.5" /> Best
                          </span>
                        )}
                        {item.isChefSpecial && (
                          <span className="inline-flex items-center text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md">
                            <Sparkles className="w-2.5 h-2.5 mr-0.5" /> Chef
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold truncate leading-tight ${
                          isOutOfStock ? 'text-stone-500 line-through' : 'text-stone-900'
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      <p className="text-xs font-extrabold text-stone-900 mt-0.5">
                        Rs. {item.basePrice.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-stone-500 line-clamp-2 mb-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Modifiers info */}
                  {item.modifierGroups && item.modifierGroups.length > 0 && (
                    <div className="mb-3 text-[10px] text-stone-500 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100 flex items-center justify-between">
                      <span>{item.modifierGroups.length} Customization Group(s)</span>
                      <span className="font-semibold text-stone-600">
                        {item.modifierGroups.reduce((acc, g) => acc + g.options.length, 0)} options
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Actions: Fast 86 Switch & Edit */}
                <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                  <button
                    onClick={() => onToggle(item.id, item.isAvailable)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      item.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-red-600 text-white shadow-xs hover:bg-red-700 animate-pulse'
                    }`}
                  >
                    {item.isAvailable ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>IN STOCK</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-white" />
                        <span>86'D (OUT OF STOCK)</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onEditItem(item)}
                    title="Edit dish and modifiers"
                    className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
