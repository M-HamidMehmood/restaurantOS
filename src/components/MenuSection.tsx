'use client';

import React from 'react';
import {
  Soup,
  Beef,
  UtensilsCrossed,
  Pizza,
  Wine,
  IceCream,
  Sandwich,
  Flame,
  Coffee,
  EggFried,
  CupSoda,
  Utensils,
  LucideIcon,
} from 'lucide-react';
import { Category, MenuItem } from '@/types/menu';
import { MenuItemCard } from './MenuItemCard';

interface MenuSectionProps {
  category: Category;
  items: MenuItem[];
}

const iconMap: Record<string, LucideIcon> = {
  Soup,
  Beef,
  UtensilsCrossed,
  Pizza,
  Wine,
  IceCream,
  Sandwich,
  Flame,
  Coffee,
  EggFried,
  CupSoda,
  Utensils,
};

export const MenuSection: React.FC<MenuSectionProps> = ({ category, items }) => {
  if (items.length === 0) return null;

  const Icon = iconMap[category.icon] || UtensilsCrossed;

  return (
    <section
      id={`section-${category.id}`}
      data-category-id={category.id}
      className="scroll-mt-36 py-4 space-y-3"
      aria-labelledby={`heading-${category.id}`}
    >
      {/* Category Section Header */}
      <div className="flex items-center justify-between pb-1 border-b border-stone-200/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
            <Icon className="w-4 h-4" />
          </div>
          <h2
            id={`heading-${category.id}`}
            className="text-base sm:text-lg font-bold text-stone-900 tracking-tight"
          >
            {category.name}
          </h2>
        </div>
        <span className="text-xs text-stone-400 font-medium">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Grid of Menu Items */}
      <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
        {items.map((item) => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};
