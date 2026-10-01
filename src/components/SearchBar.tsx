'use client';

import React from 'react';
import { Search, X, Flame, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useMenuStore } from '@/store/useMenuStore';
import { DietaryType } from '@/types/menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  totalCount: number;
  filteredCount: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({ totalCount, filteredCount }) => {
  const searchQuery = useMenuStore((state) => state.searchQuery);
  const setSearchQuery = useMenuStore((state) => state.setSearchQuery);
  const selectedDietary = useMenuStore((state) => state.selectedDietary);
  const setSelectedDietary = useMenuStore((state) => state.setSelectedDietary);

  const dietaryFilters: { id: DietaryType; label: string; icon?: React.ReactNode }[] = [
    { id: 'all', label: 'All Dishes' },
    {
      id: 'veg',
      label: 'Veg Only',
      icon: (
        <span className="w-2.5 h-2.5 rounded-full border border-emerald-600 bg-emerald-500 shrink-0"></span>
      ),
    },
    {
      id: 'non-veg',
      label: 'Non-Veg',
      icon: (
        <span className="w-2.5 h-2.5 rounded-full border border-rose-600 bg-rose-500 shrink-0"></span>
      ),
    },
    {
      id: 'bestseller',
      label: 'Bestsellers',
      icon: <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />,
    },
    {
      id: 'spicy',
      label: 'Spicy',
      icon: <Flame className="w-3 h-3 text-red-500 shrink-0" />,
    },
  ];

  const isFiltering = searchQuery.trim().length > 0 || selectedDietary !== 'all';

  return (
    <div className="bg-white/90 backdrop-blur-md px-4 pt-3 pb-2 border-b border-stone-200/60 transition-all">
      <div className="max-w-2xl mx-auto space-y-2.5">
        {/* Instant Search Bar */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-stone-400">
            <Search className="w-4 h-4" />
          </div>
          <Input
            id="menu-search-input"
            name="search"
            type="search"
            aria-label="Search dishes, ingredients, and categories"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search burgers, shawarma, chai, fries, samosa..."
            className="pl-9 pr-9 bg-stone-100/90 rounded-xl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full text-stone-400 hover:text-stone-700 bg-stone-200/60 hover:bg-stone-200 transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dietary Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          {dietaryFilters.map((filter) => {
            const isActive = selectedDietary === filter.id;
            return (
              <Badge
                key={filter.id}
                variant={isActive ? 'default' : 'outline'}
                onClick={() => setSelectedDietary(filter.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-xs'
                    : 'bg-stone-100/80 hover:bg-stone-200/70 text-stone-700 border-stone-200/50'
                }`}
              >
                {filter.icon}
                <span>{filter.label}</span>
              </Badge>
            );
          })}
        </div>

        {/* Result status when searching/filtering */}
        {isFiltering && (
          <div className="flex items-center justify-between text-[11px] text-stone-500 px-1 pt-0.5">
            <span className="flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-amber-600" />
              Found <strong className="text-stone-800">{filteredCount}</strong> of{' '}
              {totalCount} dishes
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedDietary('all');
              }}
              className="text-xs text-amber-700 hover:underline font-medium p-0 h-auto"
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
