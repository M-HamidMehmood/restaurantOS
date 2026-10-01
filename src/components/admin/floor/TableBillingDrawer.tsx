'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  Clock,
  Plus,
  Minus,
  Trash2,
  Percent,
  Receipt,
  Banknote,
  CreditCard,
  QrCode,
  Printer,
  CheckCircle2,
  AlertCircle,
  BellRing,
  Sparkles,
  DollarSign,
  Utensils,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  FloorTable,
  OrderRound,
  AdminOrderItem,
  CustomOffMenuItem,
  DiscountType,
  BillSettlementDetails,
} from '@/types/admin';
import { toast } from 'sonner';

interface TableBillingDrawerProps {
  table: FloorTable | null;
  onClose: () => void;
  onSettle: (settlement: BillSettlementDetails) => Promise<boolean>;
  onResolveWaiterCall: (requestId: string, tableNumber?: string) => void;
  onTriggerPrint: (bill: BillSettlementDetails) => void;
}

export function TableBillingDrawer({
  table,
  onClose,
  onSettle,
  onResolveWaiterCall,
  onTriggerPrint,
}: TableBillingDrawerProps) {
  // Local state for editable rounds & item adjustments
  const [editableRounds, setEditableRounds] = useState<OrderRound[]>([]);

  // Off-menu / custom items added by manager
  const [customItems, setCustomItems] = useState<CustomOffMenuItem[]>([]);
  const [isAddingCustomItem, setIsAddingCustomItem] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQuantity, setCustomItemQuantity] = useState('1');
  const [customItemNotes, setCustomItemNotes] = useState('');

  // Discount configuration
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Configurable Tax rate (e.g. 5% GST standard for restaurant POS)
  const [taxRatePercent, setTaxRatePercent] = useState<number>(5);

  // Payment checkout state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi/online'>('cash');
  const [amountTenderedStr, setAmountTenderedStr] = useState<string>('');
  const [cashierNotes, setCashierNotes] = useState<string>('');
  const [isSettling, setIsSettling] = useState(false);

  // Initialize drawer data when table changes
  useEffect(() => {
    if (table) {
      // Clone rounds for local quantity adjustments
      const clonedRounds: OrderRound[] = JSON.parse(JSON.stringify(table.rounds || []));
      setEditableRounds(clonedRounds);
      setCustomItems([]);
      setDiscountValue(0);
      setDiscountType('percentage');
      setTaxRatePercent(5);
      setCashierNotes('');

      // If customer requested bill with preferred method, pre-select it
      if (table.billRequestedMethod === 'card') {
        setPaymentMethod('card');
      } else if (table.billRequestedMethod === 'upi/online') {
        setPaymentMethod('upi/online');
      } else {
        setPaymentMethod('cash');
      }
    }
  }, [table]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Adjust item quantity in an existing round
  const handleUpdateItemQuantity = (roundIndex: number, itemIdx: number, delta: number) => {
    setEditableRounds((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      const targetRound = copy[roundIndex];
      if (!targetRound || !targetRound.items[itemIdx]) return prev;

      const newQty = targetRound.items[itemIdx].quantity + delta;
      if (newQty <= 0) {
        // Remove item from round
        targetRound.items.splice(itemIdx, 1);
      } else {
        targetRound.items[itemIdx].quantity = newQty;
      }

      // Re-sum round subtotal
      targetRound.subtotal = targetRound.items.reduce(
        (sum: number, it: AdminOrderItem) => sum + it.unitPrice * it.quantity,
        0
      );

      return copy;
    });
  };

  // Add custom off-menu item
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseInt(customItemPrice, 10);
    const qtyNum = parseInt(customItemQuantity, 10) || 1;

    if (!customItemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const newItem: CustomOffMenuItem = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      unitPrice: priceNum,
      price: priceNum,
      quantity: qtyNum,
      notes: customItemNotes.trim() || undefined,
    };

    setCustomItems((prev) => [...prev, newItem]);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQuantity('1');
    setCustomItemNotes('');
    setIsAddingCustomItem(false);
    toast.success(`Added "${newItem.name}" to bill`);
  };

  // Remove custom off-menu item
  const handleRemoveCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ----------------------------------------------------
  // Financial Calculations
  // ----------------------------------------------------
  const calculations = useMemo(() => {
    // 1. Calculate items subtotal
    let roundsSubtotal = 0;
    for (const round of editableRounds) {
      for (const item of round.items) {
        roundsSubtotal += item.unitPrice * item.quantity;
      }
    }

    let customSubtotal = 0;
    for (const cItem of customItems) {
      customSubtotal += cItem.unitPrice * cItem.quantity;
    }

    const itemsSubtotal = roundsSubtotal + customSubtotal;

    // 2. Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = Math.round((itemsSubtotal * Math.min(100, Math.max(0, discountValue))) / 100);
    } else {
      discountAmount = Math.min(itemsSubtotal, Math.max(0, discountValue));
    }

    const afterDiscount = Math.max(0, itemsSubtotal - discountAmount);

    // 3. Calculate tax (GST)
    const taxAmount = Math.round((afterDiscount * Math.max(0, taxRatePercent)) / 100);

    // 4. Final bill total
    const finalTotal = afterDiscount + taxAmount;

    // 5. Cash tendered & change calculation
    const amountTenderedNum = parseInt(amountTenderedStr, 10) || 0;
    const changeDue = amountTenderedNum - finalTotal;

    return {
      itemsSubtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      finalTotal,
      amountTenderedNum,
      changeDue,
    };
  }, [editableRounds, customItems, discountType, discountValue, taxRatePercent, amountTenderedStr]);

  // Construct complete BillSettlementDetails object
  const constructSettlementPayload = (): BillSettlementDetails => {
    if (!table) throw new Error('No active table selected');

    return {
      tableId: table.id,
      tableNumber: table.tableNumber,
      paymentMethod,
      amountTendered: paymentMethod === 'cash' ? calculations.amountTenderedNum : calculations.finalTotal,
      changeDue: paymentMethod === 'cash' ? Math.max(0, calculations.changeDue) : 0,
      itemsSubtotal: calculations.itemsSubtotal,
      discountType,
      discountValue,
      discountAmount: calculations.discountAmount,
      taxRatePercent,
      taxAmount: calculations.taxAmount,
      finalTotal: calculations.finalTotal,
      notes: cashierNotes.trim() || undefined,
      rounds: editableRounds,
      customItems,
      settledAt: new Date().toISOString(),
    };
  };

  // Trigger Bill Preview Print
  const handlePrintPreview = () => {
    if (!table) return;
    const payload = constructSettlementPayload();
    onTriggerPrint(payload);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Perform Final Settle & Clear Table
  const handleSettleAndClear = async () => {
    if (!table) return;

    if (paymentMethod === 'cash') {
      if (calculations.amountTenderedNum < calculations.finalTotal) {
        toast.warning(
          `Amount tendered (Rs. ${calculations.amountTenderedNum}) is less than total bill (Rs. ${calculations.finalTotal}).`
        );
      }
    }

    setIsSettling(true);
    try {
      const payload = constructSettlementPayload();

      // Submit settlement API call to backend
      const success = await onSettle(payload);
      if (success) {
        // Prepare thermal print data and close drawer
        onTriggerPrint(payload);
        onClose();

        // Trigger native print dialog if supported
        setTimeout(() => {
          try {
            if (typeof window !== 'undefined' && typeof window.print === 'function') {
              window.print();
            }
          } catch (e) {
            console.warn('Print preview bypassed:', e);
          }
        }, 200);
      }
    } catch (err) {
      toast.error('Failed to complete settlement.');
    } finally {
      setIsSettling(false);
    }
  };

  if (!table) return null;

  const isVacant = table.status === 'available';
  const hasOrders = editableRounds.length > 0 || customItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-white shadow-2xl h-full flex flex-col justify-between border-l border-stone-200 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-stone-200 bg-stone-50/80 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center font-black text-lg shadow-sm">
                {table.tableNumber}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-stone-900 leading-tight">
                    {table.displayName || `Table ${table.tableNumber.replace('T-', '')}`}
                  </h2>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-stone-500 px-2 py-0.5 bg-stone-200/70 rounded-md">
                    <Users className="w-3 h-3 text-stone-600" />
                    {table.capacity} seats
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  {isVacant && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Vacant / Available
                    </span>
                  )}
                  {table.status === 'occupied' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Dining Session Active
                    </span>
                  )}
                  {table.status === 'bill_requested' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                      <Receipt className="w-3 h-3 text-amber-700" />
                      Bill Settlement Requested
                    </span>
                  )}

                  {table.seatedDurationMinutes !== undefined && table.seatedDurationMinutes > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-stone-500">
                      <Clock className="w-3 h-3" />
                      {table.seatedDurationMinutes} mins seated
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-stone-400 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Waiter Assistance Alert Banner */}
          {table.hasActiveWaiterCall && (
            <div className="mt-3 p-3 bg-rose-100 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 shadow-xs animate-soft-pulse">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div>
                  <span className="font-bold block">Guest Requested Waiter Assistance</span>
                  <span className="text-[11px] text-rose-700">
                    Reason: {table.waiterCallReason || 'Water or Table Help'}
                  </span>
                </div>
              </div>
              {table.waiterCallId && (
                <button
                  type="button"
                  onClick={() => onResolveWaiterCall(table.waiterCallId!, table.tableNumber)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Acknowledge Call
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Vacant State View */}
          {isVacant && !hasOrders && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-800">Table is Currently Vacant</h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                  No active diners or unbilled tabs on this table. Customers can scan the table QR code to start ordering.
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    // Quick add custom item to open a tab directly from POS
                    setIsAddingCustomItem(true);
                  }}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Open POS Tab / Add Walk-in Item
                </button>
                <a
                  href={`/table/${table.qrSlug || table.tableNumber.toLowerCase()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl transition-colors text-center"
                >
                  Open Guest Mobile Menu (/table/{table.qrSlug || table.tableNumber.toLowerCase()})
                </a>
              </div>
            </div>
          )}

          {/* Active Orders / Rounds Breakdown */}
          {hasOrders && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-stone-900">
                    Order Timeline & Rounds ({editableRounds.length} Rounds)
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomItem(!isAddingCustomItem)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Off-Menu Item
                </button>
              </div>

              {/* Add Custom / Off-Menu Item Form */}
              {isAddingCustomItem && (
                <form
                  onSubmit={handleAddCustomItem}
                  className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Add Off-Menu / Manual POS Item
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomItem(false)}
                      className="text-stone-400 hover:text-stone-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                        Item Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Special Mocktail, Corkage, Extra Rice"
                        value={customItemName}
                        onChange={(e) => setCustomItemName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                        Price (PKR)
                      </label>
                      <input
                        type="number"
                        placeholder="350"
                        value={customItemPrice}
                        onChange={(e) => setCustomItemPrice(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-24">
                      <label className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={customItemQuantity}
                        onChange={(e) => setCustomItemQuantity(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                        Optional Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Extra ice, VIP table"
                        value={customItemNotes}
                        onChange={(e) => setCustomItemNotes(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                  >
                    Add to Bill
                  </button>
                </form>
              )}

              {/* Rounds List */}
              <div className="space-y-3">
                {editableRounds.map((round, rIdx) => {
                  const formattedTime = new Date(round.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={round.orderId || rIdx}
                      className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs"
                    >
                      {/* Round Header */}
                      <div className="p-3 bg-stone-50/90 border-b border-stone-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-stone-900 text-white text-[10px] font-black rounded-md tracking-wider">
                            ROUND {round.roundIndex}
                          </span>
                          <span className="text-xs font-semibold text-stone-600">
                            Ordered at {formattedTime}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-stone-800">
                          Rs. {round.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0).toLocaleString()}
                        </span>
                      </div>

                      {/* Items in this Round */}
                      <div className="divide-y divide-stone-100">
                        {round.items.map((item, itIdx) => (
                          <div
                            key={itIdx}
                            className="p-3 flex items-start justify-between gap-3 text-xs hover:bg-stone-50/50 transition-colors"
                          >
                            <div className="space-y-0.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-stone-900">{item.name}</span>
                                <span className="text-stone-400 font-medium">
                                  @ Rs. {item.unitPrice}
                                </span>
                              </div>

                              {/* Modifiers */}
                              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {item.selectedModifiers.map((mod, mIdx) => (
                                    <span
                                      key={mIdx}
                                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600 font-medium"
                                    >
                                      + {mod.name} {mod.priceExtra ? `(+Rs. ${mod.priceExtra})` : ''}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Prep notes */}
                              {item.notes && (
                                <p className="text-[10px] text-amber-700 italic pt-0.5">
                                  * {item.notes}
                                </p>
                              )}
                            </div>

                            {/* Quantity Controls & Line Total */}
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-white shadow-xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(rIdx, itIdx, -1)}
                                  className="w-6 h-6 flex items-center justify-center hover:bg-stone-100 text-stone-500 transition-colors"
                                  title="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-6 text-center font-bold text-stone-900 text-xs">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateItemQuantity(rIdx, itIdx, 1)}
                                  className="w-6 h-6 flex items-center justify-center hover:bg-stone-100 text-stone-500 transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="font-black text-stone-900 w-16 text-right">
                                Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Off-Menu Items Added */}
              {customItems.length > 0 && (
                <div className="border border-amber-200 rounded-2xl bg-amber-50/20 overflow-hidden shadow-xs">
                  <div className="p-3 bg-amber-100/60 border-b border-amber-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Special / Off-Menu Additions
                    </span>
                    <span className="text-xs font-bold text-amber-900">
                      Rs.{' '}
                      {customItems
                        .reduce((s, it) => s + it.unitPrice * it.quantity, 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  <div className="divide-y divide-amber-100/70">
                    {customItems.map((cItem) => (
                      <div
                        key={cItem.id}
                        className="p-3 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-stone-900">
                            {cItem.quantity}x {cItem.name}
                          </div>
                          {cItem.notes && (
                            <p className="text-[10px] text-stone-500 italic">{cItem.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-stone-900">
                            Rs. {(cItem.unitPrice * cItem.quantity).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomItem(cItem.id)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discount & Tax Adjustment Section */}
          {hasOrders && (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                Discounts & Tax Configuration
              </h4>

              {/* Discount Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-stone-700">Manager Discount</span>
                  <div className="flex rounded-lg bg-stone-200/80 p-0.5 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDiscountType('percentage')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        discountType === 'percentage'
                          ? 'bg-white text-stone-950 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Percent (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType('flat')}
                      className={`px-2 py-0.5 rounded-md transition-all ${
                        discountType === 'flat'
                          ? 'bg-white text-stone-950 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Flat (PKR)
                    </button>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex gap-1.5 mb-2">
                  {[0, 5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => {
                        setDiscountType('percentage');
                        setDiscountValue(pct);
                      }}
                      className={`px-2 py-1 text-xs font-bold rounded-lg border transition-all ${
                        discountType === 'percentage' && discountValue === pct
                          ? 'bg-amber-500 border-amber-600 text-stone-950 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {pct === 0 ? 'None (0%)' : `${pct}%`}
                    </button>
                  ))}
                </div>

                {/* Custom discount input */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Custom discount"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-stone-500 whitespace-nowrap">
                    {discountType === 'percentage' ? '% Off' : 'PKR Off'}
                  </span>
                </div>
              </div>

              {/* Tax Rate Stepper (GST) */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-stone-700">Govt GST / Sales Tax Rate</span>
                <div className="flex items-center gap-1.5">
                  {[0, 5, 16].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setTaxRatePercent(rate)}
                      className={`px-2.5 py-1 font-bold rounded-lg border transition-all ${
                        taxRatePercent === rate
                          ? 'bg-stone-900 border-stone-900 text-white shadow-xs'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      {rate === 0 ? '0% (Exempt)' : `${rate}% GST`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          {hasOrders && (
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                Payment Method Selector
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'cash'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/30 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/30 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Credit/Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi/online')}
                  className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === 'upi/online'
                      ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/30 shadow-xs'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-purple-600" />
                  <span>Online QR / Transfer</span>
                </button>
              </div>

              {/* Cash Quick Tender & Change Calculation */}
              {paymentMethod === 'cash' && (
                <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">
                      Amount Tendered / Cash Received
                    </span>
                    <span className="text-xs font-black text-emerald-700">
                      Total: Rs. {calculations.finalTotal.toLocaleString()}
                    </span>
                  </div>

                  {/* Quick Tender Denomination Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAmountTenderedStr(calculations.finalTotal.toString())}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition-colors"
                    >
                      Exact (Rs. {calculations.finalTotal})
                    </button>
                    {[1000, 2000, 3000, 5000].map((denom) => {
                      if (denom < calculations.finalTotal && denom !== 1000) return null;
                      return (
                        <button
                          key={denom}
                          type="button"
                          onClick={() => setAmountTenderedStr(denom.toString())}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                          Rs. {denom.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>

                  {/* Amount Tendered Input */}
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-stone-400">
                      Rs.
                    </span>
                    <input
                      type="number"
                      min="0"
                      placeholder={calculations.finalTotal.toString()}
                      value={amountTenderedStr}
                      onChange={(e) => setAmountTenderedStr(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-white border border-emerald-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* Calculated Change Banner */}
                  {calculations.amountTenderedNum > 0 && (
                    <div
                      className={`p-3 rounded-xl flex items-center justify-between text-xs font-bold ${
                        calculations.changeDue >= 0
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      <span>
                        {calculations.changeDue >= 0
                          ? 'Change to Return to Diner:'
                          : 'Amount Remaining (Underpaid):'}
                      </span>
                      <span className="text-sm font-black tracking-tight">
                        Rs. {Math.abs(calculations.changeDue).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Settlement Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Optional cashier / settlement note..."
                  value={cashierNotes}
                  onChange={(e) => setCashierNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer (Financial Breakdown & Primary Actions) */}
        {hasOrders ? (
          <div className="p-5 border-t border-stone-200 bg-stone-50/90 shrink-0 space-y-4">
            {/* Financial Summary Breakdown */}
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-stone-900">
                  Rs. {calculations.itemsSubtotal.toLocaleString()}
                </span>
              </div>

              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>
                    Discount ({discountType === 'percentage' ? `${discountValue}%` : 'Flat'}):
                  </span>
                  <span>- Rs. {calculations.discountAmount.toLocaleString()}</span>
                </div>
              )}

              {calculations.taxAmount > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Govt GST ({taxRatePercent}%):</span>
                  <span>+ Rs. {calculations.taxAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-2 border-t border-stone-300 flex items-baseline justify-between">
                <div>
                  <span className="text-sm font-black text-stone-900 block leading-tight">
                    Final Bill Amount
                  </span>
                  <span className="text-[10px] text-stone-400">
                    Via {paymentMethod.toUpperCase()}
                  </span>
                </div>
                <span className="text-2xl font-black text-stone-950 tracking-tight">
                  Rs. {calculations.finalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Print Preview Button */}
              <button
                type="button"
                onClick={handlePrintPreview}
                className="py-3 px-4 bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-stone-600" />
                Print Bill (80mm)
              </button>

              {/* Settle & Clear Table Button */}
              <button
                type="button"
                onClick={handleSettleAndClear}
                disabled={isSettling}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Receipt className="w-4 h-4" />
                {isSettling ? 'Settling...' : 'Settle & Clear Table'}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-200 hover:bg-stone-300 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
