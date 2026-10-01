'use client';

import React, { useRef, useEffect } from 'react';
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
import { Category } from '@/types/menu';
import { useMenuStore } from '@/store/useMenuStore';

interface CategoryNavProps {
  categories: Category[];
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

export const CategoryNav: React.FC<CategoryNavProps> = ({ categories }) => {
  const activeCategoryId = useMenuStore((state) => state.activeCategoryId);
  const setActiveCategoryId = useMenuStore((state) => state.setActiveCategoryId);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the horizontal category pill container so the active category stays in view
  useEffect(() => {
    if (activeBtnRef.current && navContainerRef.current) {
      const container = navContainerRef.current;
      const button = activeBtnRef.current;
      const scrollLeft =
        button.offsetLeft - container.offsetWidth / 2 + button.offsetWidth / 2;
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }, [activeCategoryId]);

  const handleCategoryClick = (catId: string) => {
    setActiveCategoryId(catId);
    const element = document.getElementById(`section-${catId}`);
    if (element) {
      // Calculate offset to account for sticky header & category nav
      const yOffset = -140;
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <nav
      aria-label="Menu Categories"
      className="sticky top-[108px] sm:top-[112px] z-20 bg-stone-50/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs"
    >
      <div className="max-w-2xl mx-auto px-4 py-2.5">
        <div
          ref={navContainerRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {categories.map((cat) => {
            const isActive = activeCategoryId === cat.id;
            const Icon = iconMap[cat.icon] || UtensilsCrossed;

            return (
              <button
                key={cat.id}
                ref={isActive ? activeBtnRef : null}
                onClick={() => handleCategoryClick(cat.id)}
                type="button"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-sm ring-1 ring-stone-900'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200/80 shadow-2xs'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isActive ? 'text-amber-400 scale-110' : 'text-stone-400'
                  }`}
                />
                <span>{cat.name}</span>
                {cat.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-amber-400 text-stone-900'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {cat.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
