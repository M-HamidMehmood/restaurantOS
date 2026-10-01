'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  UtensilsCrossed,
  Bell,
  Receipt,
  Plus,
  ArrowLeft,
  Sparkles,
  Timer,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useMenuStore } from '@/store/useMenuStore';
import { restaurantInfo } from '@/data/menuData';
import { OrderStatus, ActiveOrder } from '@/types/menu';
import { toast } from 'sonner';

export const ActiveOrderScreen: React.FC = () => {
  const isActiveOrderOpen = useMenuStore((state) => state.isActiveOrderOpen);
  const setIsActiveOrderOpen = useMenuStore((state) => state.setIsActiveOrderOpen);
  const activeOrders = useMenuStore((state) => state.activeOrders);
  const selectedActiveOrderId = useMenuStore((state) => state.selectedActiveOrderId);
  const setSelectedActiveOrderId = useMenuStore((state) => state.setSelectedActiveOrderId);
  const updateOrderStatus = useMenuStore((state) => state.updateOrderStatus);
  const getFormattedTable = useMenuStore((state) => state.getFormattedTable);

  const callWaiter = useMenuStore((state) => state.callWaiter);
  const requestBill = useMenuStore((state) => state.requestBill);
  const isWaiterOnCooldown = useMenuStore((state) => state.isWaiterOnCooldown);
  const getWaiterRemainingSeconds = useMenuStore((state) => state.getWaiterRemainingSeconds);
  const isBillRequested = useMenuStore((state) => state.isBillRequested);

  // Local tick state for the 2-minute countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const updateTimer = () => {
      setSecondsRemaining(getWaiterRemainingSeconds());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [getWaiterRemainingSeconds]);

  // Current active order to display
  const currentOrder: ActiveOrder | undefined = React.useMemo(() => {
    if (selectedActiveOrderId) {
      const match = activeOrders.find((o) => o.orderId === selectedActiveOrderId);
      if (match) return match;
    }
    return activeOrders[0];
  }, [activeOrders, selectedActiveOrderId]);

  // Auto-progress simulation for realistic demo experience (Received -> Preparing -> Served)
  useEffect(() => {
    if (!currentOrder) return;

    if (currentOrder.status === 'received') {
      const timer = setTimeout(() => {
        updateOrderStatus(
          currentOrder.orderId,
          'preparing',
          'Chef began cooking dishes in the cafe kitchen'
        );
        toast.info(`Order #${currentOrder.orderId} is now Preparing!`, {
          description: 'The kitchen has started cooking your order.',
        });
      }, 12000); // 12 seconds demo transition
      return () => clearTimeout(timer);
    }

    if (currentOrder.status === 'preparing') {
      const timer = setTimeout(() => {
        updateOrderStatus(
          currentOrder.orderId,
          'served',
          'Dishes brought to Table 04 by server'
        );
        toast.success(`Order #${currentOrder.orderId} has been Served!`, {
          description: 'Enjoy your meal at Chaska & Chai Cafe.',
        });
      }, 25000); // 25 seconds demo transition
      return () => clearTimeout(timer);
    }
  }, [currentOrder, updateOrderStatus]);

  if (!currentOrder && activeOrders.length === 0) return null;

  // Timeline configuration
  const steps: {
    status: OrderStatus;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      status: 'received',
      label: 'Received',
      sublabel: 'Kitchen confirmed order',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      status: 'preparing',
      label: 'Preparing',
      sublabel: 'Cooking on grill & stove',
      icon: <ChefHat className="w-4 h-4" />,
    },
    {
      status: 'served',
      label: 'Served',
      sublabel: 'Delivered to your table',
      icon: <UtensilsCrossed className="w-4 h-4" />,
    },
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return 0;
      case 'preparing':
        return 1;
      case 'served':
        return 2;
      default:
        return 0;
    }
  };

  const currentStepIdx = currentOrder ? getStepIndex(currentOrder.status) : 0;
  const isCooldownActive = secondsRemaining > 0;

  const handleCallWaiter = () => {
    callWaiter('general', 'Need assistance at table');
  };

  const handleRequestBill = () => {
    requestBill('card', 'Requesting bill at table');
  };

  return (
    <Dialog open={isActiveOrderOpen} onOpenChange={setIsActiveOrderOpen}>
      <DialogContent className="max-w-md w-full p-0 max-h-[92vh] flex flex-col rounded-3xl overflow-hidden border border-stone-200 shadow-2xl">
        {/* Header Bar */}
        <div className="p-4 bg-stone-900 text-white shrink-0">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsActiveOrderOpen(false)}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-300 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Menu</span>
            </button>
            <Badge variant="amber" className="text-xs font-bold py-0.5 px-2.5">
              {getFormattedTable()}
            </Badge>
          </div>

          <DialogHeader className="pt-2 text-left">
            <DialogTitle className="text-base font-bold text-white flex items-center justify-between">
              <span>Order #{currentOrder?.orderId}</span>
              <span className="text-xs font-normal text-stone-300">
                {currentOrder
                  ? new Date(currentOrder.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Multiple orders pill selector if user placed multiple rounds */}
          {activeOrders.length > 1 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider shrink-0">
                Orders:
              </span>
              {activeOrders.map((ord, idx) => (
                <button
                  key={ord.orderId}
                  type="button"
                  onClick={() => setSelectedActiveOrderId(ord.orderId)}
                  className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    ord.orderId === currentOrder?.orderId
                      ? 'bg-amber-500 text-stone-950 font-bold'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  Round {activeOrders.length - idx} (#{ord.orderId})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Real-Time Live Status Tracker Card */}
          {currentOrder && (
            <Card className="p-4 rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/60 via-white to-stone-50 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {currentOrder.status !== 'served' && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                        currentOrder.status === 'served'
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                    ></span>
                  </span>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
                    Live Kitchen Status
                  </h3>
                </div>

                <Badge
                  variant={
                    currentOrder.status === 'served'
                      ? 'emerald'
                      : currentOrder.status === 'preparing'
                      ? 'amber'
                      : 'secondary'
                  }
                  className="capitalize font-bold text-xs px-2.5 py-0.5"
                >
                  {currentOrder.status}
                </Badge>
              </div>

              {/* 3-Step Visual Timeline: Received -> Preparing -> Served */}
              <div className="relative pt-2 pb-1">
                {/* Connecting background track */}
                <div className="absolute top-6 left-6 right-6 h-1 bg-stone-200 -z-0" />
                {/* Animated active track fill */}
                <div
                  className="absolute top-6 left-6 h-1 bg-amber-500 transition-all duration-700 -z-0"
                  style={{
                    width:
                      currentStepIdx === 0
                        ? '0%'
                        : currentStepIdx === 1
                        ? '50%'
                        : 'calc(100% - 48px)',
                  }}
                />

                <div className="flex justify-between relative z-10">
                  {steps.map((step, idx) => {
                    const isCompleted = idx < currentStepIdx;
                    const isCurrent = idx === currentStepIdx;

                    return (
                      <div
                        key={step.status}
                        className="flex flex-col items-center text-center max-w-[85px]"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-amber-600 text-white ring-4 ring-amber-100 shadow-md animate-pulse'
                              : 'bg-stone-100 text-stone-400 border border-stone-200'
                          }`}
                        >
                          {step.icon}
                        </div>
                        <span
                          className={`text-xs mt-2 font-bold leading-tight ${
                            isCurrent
                              ? 'text-amber-900'
                              : isCompleted
                              ? 'text-emerald-800'
                              : 'text-stone-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                          {step.sublabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Estimated completion banner */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-100/70 text-stone-600">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Timer className="w-3.5 h-3.5 text-amber-600" />
                  Estimated Time:
                </span>
                <span className="font-bold text-stone-900">
                  {currentOrder.status === 'served'
                    ? 'Dishes on your table'
                    : currentOrder.status === 'preparing'
                    ? '~6-9 minutes remaining'
                    : '~10-12 minutes remaining'}
                </span>
              </div>

              {/* Demo Status Switcher (Allows testing each status instantly) */}
              <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                <span className="text-[10px] text-stone-400 font-semibold uppercase">
                  Simulate Status:
                </span>
                <div className="flex gap-1">
                  {(['received', 'preparing', 'served'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateOrderStatus(currentOrder.orderId, st)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize transition-colors cursor-pointer ${
                        currentOrder.status === st
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Ordered Dishes List */}
          {currentOrder && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center justify-between">
                <span>Items in this Order ({currentOrder.items.length})</span>
                <span className="text-stone-500 font-normal">
                  Total: {restaurantInfo.currencySymbol}
                  {currentOrder.totalAmount.toFixed(0)}
                </span>
              </h4>

              <div className="space-y-2">
                {currentOrder.items.map((cartItem) => (
                  <Card
                    key={cartItem.cartItemId}
                    className="p-3 rounded-xl border border-stone-200/80 bg-white shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                        <Image
                          src={cartItem.item.image}
                          alt={cartItem.item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <h5 className="font-bold text-xs text-stone-900 truncate">
                            <span className="text-amber-700 font-extrabold mr-1">
                              {cartItem.quantity}×
                            </span>
                            {cartItem.item.name}
                          </h5>
                          <span className="text-xs font-bold text-stone-800 shrink-0 tabular-nums">
                            {restaurantInfo.currencySymbol}
                            {cartItem.totalPrice.toFixed(0)}
                          </span>
                        </div>

                        {/* Modifiers List */}
                        {cartItem.selectedModifiers.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cartItem.selectedModifiers.map((mod) => (
                              <Badge
                                key={`${mod.groupId}-${mod.optionId}`}
                                variant="secondary"
                                className="text-[9px] py-0 px-1.5 bg-stone-100 text-stone-600 border border-stone-200"
                              >
                                {mod.optionName}
                                {mod.price > 0 &&
                                  ` (+${restaurantInfo.currencySymbol}${mod.price})`}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Item Notes */}
                        {cartItem.notes && (
                          <p className="text-[10px] text-stone-500 italic mt-1 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Note: {cartItem.notes}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Order-wide note if provided */}
              {currentOrder.notes && (
                <div className="text-xs bg-stone-100 p-2.5 rounded-xl text-stone-700 flex items-start gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-[11px] text-stone-800">
                      Table Instructions:
                    </span>
                    <p className="italic text-[11px] text-stone-600">
                      {currentOrder.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Card on the Active Order Screen */}
          <div className="space-y-2 pt-2 border-t border-stone-200/80">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Need Assistance at {getFormattedTable()}?
            </h4>

            <div className="grid grid-cols-2 gap-2">
              {/* Call Waiter with 2-minute anti-spam cooldown */}
              <Button
                type="button"
                variant={isCooldownActive ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleCallWaiter}
                disabled={isCooldownActive}
                className="font-bold text-xs h-10 gap-1.5 relative"
              >
                <Bell
                  className={`w-3.5 h-3.5 ${
                    isCooldownActive ? 'text-stone-400' : 'text-amber-600'
                  }`}
                />
                {isCooldownActive ? (
                  <span className="tabular-nums">
                    Alerted ({Math.floor(secondsRemaining / 60)}:
                    {(secondsRemaining % 60).toString().padStart(2, '0')})
                  </span>
                ) : (
                  <span>Call Waiter</span>
                )}
              </Button>

              {/* Request Bill */}
              <Button
                type="button"
                variant={isBillRequested ? 'default' : 'outline'}
                size="sm"
                onClick={handleRequestBill}
                className={`font-bold text-xs h-10 gap-1.5 ${
                  isBillRequested
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : ''
                }`}
              >
                <Receipt
                  className={`w-3.5 h-3.5 ${
                    isBillRequested ? 'text-white' : 'text-emerald-600'
                  }`}
                />
                <span>{isBillRequested ? 'Bill Requested' : 'Request Bill'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer: Order More Dishes Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200/80 space-y-2 shrink-0">
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsActiveOrderOpen(false)}
            className="w-full py-3 h-11 rounded-xl text-xs sm:text-sm font-bold shadow-md gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Order More Dishes for {getFormattedTable()}</span>
          </Button>
          <p className="text-[10px] text-stone-400 text-center">
            Active table session persists in storage • Order ID #{currentOrder?.orderId}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
