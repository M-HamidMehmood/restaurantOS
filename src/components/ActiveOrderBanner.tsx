'use client';

import React from 'react';
import { ChefHat, CheckCircle2, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { useMenuStore } from '@/store/useMenuStore';
import { restaurantInfo } from '@/data/menuData';

export const ActiveOrderBanner: React.FC = () => {
  const activeOrders = useMenuStore((state) => state.activeOrders);
  const setIsActiveOrderOpen = useMenuStore((state) => state.setIsActiveOrderOpen);
  const setSelectedActiveOrderId = useMenuStore((state) => state.setSelectedActiveOrderId);

  if (activeOrders.length === 0) return null;

  const latestOrder = activeOrders[0];
  const isPreparing = latestOrder.status === 'preparing';
  const isServed = latestOrder.status === 'served';

  const handleClick = () => {
    setSelectedActiveOrderId(latestOrder.orderId);
    setIsActiveOrderOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-2.5">
      <button
        type="button"
        onClick={handleClick}
        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left shadow-xs cursor-pointer ${
          isServed
            ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100/60'
            : isPreparing
            ? 'bg-amber-50 border-amber-300 hover:bg-amber-100/60'
            : 'bg-stone-900 border-stone-800 text-white hover:bg-stone-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          {/* Animated Status Icon */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isServed
                ? 'bg-emerald-600 text-white'
                : isPreparing
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-stone-800 text-amber-400'
            }`}
          >
            {isServed ? (
              <UtensilsCrossed className="w-4 h-4" />
            ) : isPreparing ? (
              <ChefHat className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>

          {/* Status Text & Info */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                  isServed
                    ? 'bg-emerald-200 text-emerald-900'
                    : isPreparing
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-amber-500 text-stone-900'
                }`}
              >
                {latestOrder.status}
              </span>
              <span
                className={`text-xs font-bold truncate ${
                  isServed || isPreparing ? 'text-stone-900' : 'text-white'
                }`}
              >
                Order #{latestOrder.orderId}
              </span>
            </div>
            <p
              className={`text-[11px] truncate mt-0.5 ${
                isServed || isPreparing ? 'text-stone-600' : 'text-stone-300'
              }`}
            >
              {latestOrder.items.length} item(s) • {restaurantInfo.currencySymbol}
              {latestOrder.totalAmount.toFixed(0)}
              {isPreparing && ' • Est. ~8 mins'}
              {isServed && ' • Served at Table'}
            </p>
          </div>
        </div>

        {/* Action Link */}
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl shrink-0 ${
            isServed
              ? 'bg-emerald-600 text-white'
              : isPreparing
              ? 'bg-amber-600 text-white'
              : 'bg-white/10 text-white'
          }`}
        >
          <span>Track Order</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};
