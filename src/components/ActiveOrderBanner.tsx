'use client';

import React from 'react';
import { ChefHat, CheckCircle2, ChevronRight, UtensilsCrossed, XCircle, AlertTriangle, X } from 'lucide-react';
import { useMenuStore } from '@/store/useMenuStore';
import { restaurantInfo } from '@/data/menuData';

export const ActiveOrderBanner: React.FC = () => {
  const activeOrders = useMenuStore((state) => state.activeOrders);
  const setIsActiveOrderOpen = useMenuStore((state) => state.setIsActiveOrderOpen);
  const setSelectedActiveOrderId = useMenuStore((state) => state.setSelectedActiveOrderId);
  const dismissActiveOrder = useMenuStore((state) => state.dismissActiveOrder);

  if (activeOrders.length === 0) return null;

  const latestOrder = activeOrders[0];
  const isPreparing = latestOrder.status === 'preparing';
  const isServed = latestOrder.status === 'served';
  const isCancelled = latestOrder.status === 'cancelled';

  const latestMessage =
    latestOrder.statusHistory && latestOrder.statusHistory.length > 0
      ? latestOrder.statusHistory[latestOrder.statusHistory.length - 1].message
      : '';

  const handleClick = () => {
    setSelectedActiveOrderId(latestOrder.orderId);
    setIsActiveOrderOpen(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissActiveOrder(latestOrder.orderId);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-2.5">
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left shadow-xs cursor-pointer ${
          isCancelled
            ? 'bg-rose-50 border-rose-300 hover:bg-rose-100/80 text-rose-950 animate-in fade-in'
            : isServed
            ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100/60'
            : isPreparing
            ? 'bg-amber-50 border-amber-300 hover:bg-amber-100/60'
            : 'bg-stone-900 border-stone-800 text-white hover:bg-stone-800'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2 flex-1">
          {/* Animated Status Icon */}
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isCancelled
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : isServed
                ? 'bg-emerald-600 text-white'
                : isPreparing
                ? 'bg-amber-600 text-white animate-pulse'
                : 'bg-stone-800 text-amber-400'
            }`}
          >
            {isCancelled ? (
              <XCircle className="w-4 h-4" />
            ) : isServed ? (
              <UtensilsCrossed className="w-4 h-4" />
            ) : isPreparing ? (
              <ChefHat className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>

          {/* Status Text & Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                  isCancelled
                    ? 'bg-rose-600 text-white'
                    : isServed
                    ? 'bg-emerald-200 text-emerald-900'
                    : isPreparing
                    ? 'bg-amber-200 text-amber-900'
                    : 'bg-amber-500 text-stone-900'
                }`}
              >
                {isCancelled ? 'REJECTED' : latestOrder.status}
              </span>
              <span
                className={`text-xs font-bold truncate ${
                  isCancelled
                    ? 'text-rose-950'
                    : isServed || isPreparing
                    ? 'text-stone-900'
                    : 'text-white'
                }`}
              >
                Order #{latestOrder.orderId}
              </span>
            </div>
            <p
              className={`text-[11px] truncate mt-0.5 ${
                isCancelled
                  ? 'text-rose-800 font-medium'
                  : isServed || isPreparing
                  ? 'text-stone-600'
                  : 'text-stone-300'
              }`}
            >
              {isCancelled ? (
                <span>{latestMessage || 'Kitchen rejected this order. Tap to view & reorder.'}</span>
              ) : (
                <span>
                  {latestOrder.items.length} item(s) • {restaurantInfo.currencySymbol}
                  {latestOrder.totalAmount.toFixed(0)}
                  {isPreparing && ' • Est. ~8 mins'}
                  {isServed && ' • Served at Table'}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Link & Dismiss */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl ${
              isCancelled
                ? 'bg-rose-600 text-white shadow-xs'
                : isServed
                ? 'bg-emerald-600 text-white'
                : isPreparing
                ? 'bg-amber-600 text-white'
                : 'bg-white/10 text-white'
            }`}
          >
            <span>{isCancelled ? 'View Reason' : 'Track Order'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>

          {isCancelled && (
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1.5 text-rose-700 hover:text-rose-950 hover:bg-rose-200/60 rounded-lg transition-colors cursor-pointer"
              title="Dismiss rejected order"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
