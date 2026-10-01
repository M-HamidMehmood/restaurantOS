'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { Header } from './Header';
import { SearchBar } from './SearchBar';
import { CategoryNav } from './CategoryNav';
import { MenuSection } from './MenuSection';
import { CartSheet } from './CartSheet';
import { CallWaiterDialog } from './forms/CallWaiterDialog';
import { RequestBillDialog } from './forms/RequestBillDialog';
import { TableSwitchDialog } from './forms/TableSwitchDialog';
import { CustomizationModal } from './CustomizationModal';
import { ActiveOrderScreen } from './ActiveOrderScreen';
import { ActiveOrderBanner } from './ActiveOrderBanner';
import { useMenuStore } from '@/store/useMenuStore';
import { useMenuQuery } from '@/hooks/useMenuQuery';
import { Utensils, SearchX, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const MenuInterface: React.FC = () => {
  // TanStack Query for menu data
  const { data: menuData, isLoading } = useMenuQuery();

  // Zustand atomic selectors
  const searchQuery = useMenuStore((state) => state.searchQuery);
  const selectedDietary = useMenuStore((state) => state.selectedDietary);
  const setActiveCategoryId = useMenuStore((state) => state.setActiveCategoryId);
  const setSearchQuery = useMenuStore((state) => state.setSearchQuery);
  const setSelectedDietary = useMenuStore((state) => state.setSelectedDietary);
  const getFormattedTable = useMenuStore((state) => state.getFormattedTable);

  const categories = menuData?.categories || [];
  const menuItems = menuData?.items || [];
  const restaurantInfo = menuData?.restaurant;

  // Filter menu items by search query & selected dietary chip
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // 1. Dietary filter
      if (selectedDietary === 'veg' && !item.isVegetarian) return false;
      if (selectedDietary === 'non-veg' && item.isVegetarian) return false;
      if (selectedDietary === 'bestseller' && !item.isBestseller) return false;
      if (selectedDietary === 'spicy' && !item.spicyLevel) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(query));
        const matchesAllergens = item.allergens?.some((a) =>
          a.toLowerCase().includes(query)
        );
        if (!matchesName && !matchesDesc && !matchesTags && !matchesAllergens) {
          return false;
        }
      }

      return true;
    });
  }, [menuItems, searchQuery, selectedDietary]);

  // Group items by category, filtering out empty categories
  const activeCategoriesWithItems = useMemo(() => {
    return categories
      .map((cat) => ({
        category: cat,
        items: filteredItems.filter((item) => item.categoryId === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [categories, filteredItems]);

  // IntersectionObserver to auto-update active category when scrolling
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleIntersect: IntersectionObserverCallback = (entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (visible && visible.target) {
        const catId = visible.target.getAttribute('data-category-id');
        if (catId) {
          setActiveCategoryId(catId);
        }
      }
    };

    observerRef.current = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-140px 0px -60% 0px',
      threshold: 0,
    });

    const sections = document.querySelectorAll('[data-category-id]');
    sections.forEach((s) => observerRef.current?.observe(s));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [activeCategoriesWithItems, setActiveCategoryId]);

  if (isLoading && !menuData) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-stone-600">Loading Pakistani cafe menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900 selection:bg-amber-100 flex flex-col justify-between">
      <div>
        {/* 1. Header with Restaurant Name, Table Badge, Quick Action Buttons */}
        <Header />

        {/* 1.1 Live Active Order Tracking Banner (if order exists) */}
        <ActiveOrderBanner />

        {/* 2. Top Search Bar & Dietary Chips */}
        <SearchBar
          totalCount={menuItems.length}
          filteredCount={filteredItems.length}
        />

        {/* 3. Sticky Horizontally Scrollable Category Bar */}
        {activeCategoriesWithItems.length > 0 && (
          <CategoryNav
            categories={activeCategoriesWithItems.map((g) => g.category)}
          />
        )}

        {/* 4. Menu Items Section */}
        <main className="max-w-2xl mx-auto px-4 pt-2">
          {activeCategoriesWithItems.length > 0 ? (
            <div className="divide-y divide-stone-200/50">
              {activeCategoriesWithItems.map(({ category, items }) => (
                <MenuSection
                  key={category.id}
                  category={category}
                  items={items}
                />
              ))}
            </div>
          ) : (
            /* Empty State when no items match search or filter */
            <div className="py-16 text-center space-y-4 max-w-sm mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                <SearchX className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-800">
                  No matching dishes found
                </h3>
                <p className="text-xs text-stone-500">
                  We couldn&apos;t find any dishes matching &ldquo;
                  {searchQuery}&rdquo;. Try another keyword or reset filters.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDietary('all');
                }}
                className="rounded-xl text-xs"
              >
                Reset All Filters
              </Button>
            </div>
          )}

          {/* Cafe Footer Info */}
          {restaurantInfo && (
            <footer className="mt-12 pt-8 pb-4 border-t border-stone-200/80 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 font-serif text-stone-800 font-bold text-sm">
                <Utensils className="w-4 h-4 text-amber-600" />
                <span>{restaurantInfo.name}</span>
              </div>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                All food freshly prepared to order in pure desi style. Inform staff of any allergies.
              </p>
              {restaurantInfo.wifiName && (
                <div className="inline-flex items-center gap-2 text-[11px] font-mono bg-stone-100 px-3 py-1 rounded-full text-stone-600">
                  <Wifi className="w-3 h-3 text-stone-400" />
                  <span>Guest Wi-Fi: {restaurantInfo.wifiName} (Pass: {restaurantInfo.wifiPassword})</span>
                </div>
              )}
              <p className="text-[10px] text-stone-400">
                Session bound to {getFormattedTable()} • Modern QR Menu
              </p>
            </footer>
          )}
        </main>
      </div>

      {/* Floating Bottom Cart Bar & shadcn Sheet */}
      <CartSheet />

      {/* Item Modifiers Customization Modal */}
      <CustomizationModal />

      {/* Real-Time Active Order Live Status Screen */}
      <ActiveOrderScreen />

      {/* shadcn Dialog Modals with React Hook Form + Zod */}
      <CallWaiterDialog />
      <RequestBillDialog />
      <TableSwitchDialog />
    </div>
  );
};
