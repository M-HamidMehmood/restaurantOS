'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  ArrowLeft,
  RefreshCw,
  Plus,
  FolderTree,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ListFilter,
  Sparkles,
} from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Quick86SwitchBoard } from '@/components/admin/menu/Quick86SwitchBoard';
import { MenuItemTable } from '@/components/admin/menu/MenuItemTable';
import { MenuItemModal } from '@/components/admin/menu/MenuItemModal';
import { CategoryManagerModal } from '@/components/admin/menu/CategoryManagerModal';
import { useAdminMenu } from '@/hooks/useAdminMenu';
import { AdminMenuItem } from '@/types/admin';

export default function MenuManagerPage() {
  const {
    categories,
    items,
    stats,
    isLoading,
    fetchMenuCatalog,
    toggleItemAvailability,
    saveItem,
    deleteItem,
    saveCategory,
    deleteCategory,
    reorderCategories,
  } = useAdminMenu();

  const [activeTab, setActiveTab] = useState<'86_switch' | 'catalog'>('86_switch');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [itemModalState, setItemModalState] = useState<{
    isOpen: boolean;
    item?: AdminMenuItem | null;
  }>({
    isOpen: false,
    item: null,
  });

  const handleOpenAddModal = () => {
    setItemModalState({
      isOpen: true,
      item: null,
    });
  };

  const handleOpenEditModal = (item: AdminMenuItem) => {
    setItemModalState({
      isOpen: true,
      item,
    });
  };

  const handleCloseItemModal = () => {
    setItemModalState({
      isOpen: false,
      item: null,
    });
  };

  return (
    <div className="flex w-full min-h-screen bg-stone-100/70">
      {/* Sidebar Navigation */}
      <AdminSidebar activeOrdersCount={0} />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header & Stat Banner */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-stone-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                  Menu Manager & 86-Stock Control
                </h1>
                <p className="text-xs text-stone-500 font-medium">
                  Instant out-of-stock switches, category hierarchy, pricing, and modifier groups.
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchMenuCatalog(false)}
                title="Refresh Menu Data"
                className="p-2 bg-white border border-stone-200 text-stone-600 hover:text-stone-900 rounded-xl transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-stone-200 text-stone-800 hover:bg-stone-50 text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                <FolderTree className="w-4 h-4 text-amber-600" />
                <span>Categories</span>
              </button>

              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Dish</span>
              </button>
            </div>
          </div>

          {/* KPI Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Total Items */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Total Catalog Dishes
              </span>
              <p className="text-2xl font-black text-stone-900">{stats.totalItems}</p>
            </div>

            {/* In Stock */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> In Stock & Active
              </span>
              <p className="text-2xl font-black text-emerald-700">{stats.inStockCount}</p>
            </div>

            {/* 86'd Out of Stock */}
            <div
              className={`p-4 rounded-2xl bg-white border shadow-2xs space-y-1 ${
                stats.outOfStockCount > 0 ? 'border-red-300 bg-red-50/20' : 'border-stone-200/80'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  stats.outOfStockCount > 0 ? 'text-red-600' : 'text-stone-400'
                }`}
              >
                <XCircle className="w-3 h-3" /> 86'd (Out of Stock)
              </span>
              <p
                className={`text-2xl font-black ${
                  stats.outOfStockCount > 0 ? 'text-red-600' : 'text-stone-900'
                }`}
              >
                {stats.outOfStockCount}
              </p>
            </div>

            {/* Categories */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Menu Categories
              </span>
              <p className="text-2xl font-black text-stone-900">{stats.categoriesCount}</p>
            </div>
          </div>

          {/* Module Mode Switcher */}
          <div className="flex items-center gap-2 border-b border-stone-200 pb-1">
            <button
              onClick={() => setActiveTab('86_switch')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === '86_switch'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/60'
              }`}
            >
              <ToggleLeft className="w-4 h-4" />
              <span>Daily Quick-Toggle ("86" Switch Mode)</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200/60'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Catalog Table & Modifiers</span>
            </button>
          </div>
        </div>

        {/* View Content */}
        {isLoading && items.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-3xl border border-stone-200 space-y-3">
            <RefreshCw className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-stone-700">Loading restaurant menu catalog...</p>
          </div>
        ) : activeTab === '86_switch' ? (
          <Quick86SwitchBoard
            items={items}
            categories={categories}
            onToggle={toggleItemAvailability}
            onEditItem={handleOpenEditModal}
          />
        ) : (
          <MenuItemTable
            items={items}
            categories={categories}
            onToggle={toggleItemAvailability}
            onEditItem={handleOpenEditModal}
            onDeleteItem={deleteItem}
            onAddNew={handleOpenAddModal}
          />
        )}
      </main>

      {/* Category Management Modal */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onSaveCategory={saveCategory}
        onDeleteCategory={deleteCategory}
        onReorderCategories={reorderCategories}
      />

      {/* Add / Edit Dish Modal with Variant Builder */}
      <MenuItemModal
        isOpen={itemModalState.isOpen}
        onClose={handleCloseItemModal}
        item={itemModalState.item}
        categories={categories}
        onSave={saveItem}
      />
    </div>
  );
}
