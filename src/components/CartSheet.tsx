'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Send,
  ChevronRight,
  CheckCircle,
  FileText,
  Utensils,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMenuStore } from '@/store/useMenuStore';
import { useSubmitOrderMutation } from '@/hooks/useMenuQuery';
import { restaurantInfo } from '@/data/menuData';
import { toast } from 'sonner';

export const CartSheet: React.FC = () => {
  const cart = useMenuStore((state) => state.cart);
  const updateCartItemQuantity = useMenuStore((state) => state.updateCartItemQuantity);
  const removeCartItem = useMenuStore((state) => state.removeCartItem);
  const clearCart = useMenuStore((state) => state.clearCart);
  const totalCartCount = useMenuStore((state) => state.totalCartCount());
  const totalCartPrice = useMenuStore((state) => state.totalCartPrice());
  const isCartOpen = useMenuStore((state) => state.isCartOpen);
  const setIsCartOpen = useMenuStore((state) => state.setIsCartOpen);
  const tableId = useMenuStore((state) => state.tableId);
  const getFormattedTable = useMenuStore((state) => state.getFormattedTable);

  const recordSubmittedOrder = useMenuStore((state) => state.recordSubmittedOrder);

  const [orderNotes, setOrderNotes] = useState('');
  const submitOrderMutation = useSubmitOrderMutation();

  const subtotal = totalCartPrice;
  const serviceCharge = (subtotal * (restaurantInfo.serviceChargePercent || 5)) / 100;
  const tax = (subtotal * (restaurantInfo.taxPercent || 5)) / 100;
  const grandTotal = subtotal + serviceCharge + tax;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    submitOrderMutation.mutate(
      {
        tableId,
        items: cart,
        totalAmount: grandTotal,
        notes: orderNotes,
      },
      {
        onSuccess: (data) => {
          recordSubmittedOrder(data);
          setIsCartOpen(false);
          setOrderNotes('');
          toast.success(
            `Order #${data.orderId} sent to kitchen for ${getFormattedTable()}!`,
            {
              description: `${data.items.length} item(s) freshly preparing.`,
            }
          );
        },
      }
    );
  };

  return (
    <>
      {/* Sticky Bottom Floating Bar showing item count & running subtotal */}
      {!isCartOpen && totalCartCount > 0 && (
        <aside
          aria-label="Order summary floating bar"
          className="fixed bottom-4 inset-x-4 z-30 max-w-md mx-auto pointer-events-auto animate-in slide-in-from-bottom duration-300"
        >
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full flex items-center justify-between bg-stone-900/95 hover:bg-stone-900 active:scale-[0.98] text-white py-3.5 px-4 rounded-2xl shadow-xl border border-stone-800 backdrop-blur-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-xl bg-amber-500 text-stone-900 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                <ShoppingBag className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {totalCartCount}
                </span>
              </div>
              <div className="text-left">
                <span className="block text-xs font-semibold text-stone-200">
                  {totalCartCount} {totalCartCount === 1 ? 'item' : 'items'} in order
                </span>
                <span className="text-sm font-bold text-amber-400">
                  {restaurantInfo.currencySymbol}
                  {totalCartPrice.toFixed(0)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 py-1.5 px-3 rounded-xl transition-colors">
              <span>View Order</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </aside>
      )}

      {/* shadcn Sheet for Table Order Sliding Drawer */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent side="bottom" className="p-0 max-h-[88vh] overflow-hidden flex flex-col rounded-t-3xl">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-stone-100">
            <SheetHeader>
              <div className="flex items-center justify-between pr-8">
                <div>
                  <SheetTitle className="flex items-center gap-2 text-base font-bold text-stone-900">
                    <ShoppingBag className="w-4 h-4 text-amber-600" />
                    Your Table Order
                  </SheetTitle>
                  <SheetDescription className="text-xs text-stone-500">
                    Bound to <strong className="text-stone-900">{getFormattedTable()}</strong>
                  </SheetDescription>
                </div>
                {cart.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCart}
                    className="text-xs text-stone-400 hover:text-red-600 h-7 px-2"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </SheetHeader>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3 space-y-3">
            {cart.length === 0 ? (
              <div className="py-14 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-300 mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-stone-700">Your order is empty</p>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Select dishes from the menu to start your order for {getFormattedTable()}.
                  </p>
                </div>
              </div>
            ) : (
              cart.map((cartItem) => (
                <Card
                  key={cartItem.cartItemId}
                  className="p-3 rounded-2xl border border-stone-200/80 bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    {/* Item Thumbnail */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-stone-100 border border-stone-100">
                      <Image
                        src={cartItem.item.image}
                        alt={cartItem.item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>

                    {/* Item Title & Pricing */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                          {cartItem.item.name}
                        </h4>
                        {/* Delete Action Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCartItem(cartItem.cartItemId)}
                          aria-label={`Remove ${cartItem.item.name}`}
                          className="w-6 h-6 p-0 text-stone-400 hover:text-red-600 hover:bg-red-50 -mr-1 -mt-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xs font-bold text-stone-800">
                          {restaurantInfo.currencySymbol}
                          {cartItem.unitPrice.toFixed(0)}
                        </span>
                        {cartItem.selectedModifiers.length > 0 && (
                          <span className="text-[10px] text-stone-400">
                            (incl. modifiers)
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-amber-700 ml-auto tabular-nums">
                          = {restaurantInfo.currencySymbol}
                          {cartItem.totalPrice.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Modifiers Chips */}
                  {cartItem.selectedModifiers.length > 0 && (
                    <div className="pt-1 flex flex-wrap gap-1">
                      {cartItem.selectedModifiers.map((mod) => (
                        <Badge
                          key={`${mod.groupId}-${mod.optionId}`}
                          variant="secondary"
                          className="text-[10px] font-medium py-0 px-2 bg-stone-100 text-stone-700 border border-stone-200"
                        >
                          {mod.optionName}
                          {mod.price > 0 && ` (+${restaurantInfo.currencySymbol}${mod.price})`}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Item Specific Preparation Notes */}
                  {cartItem.notes && (
                    <div className="flex items-center gap-1.5 text-[11px] bg-amber-50/80 border border-amber-200/60 text-amber-900 px-2 py-1 rounded-lg">
                      <FileText className="w-3 h-3 shrink-0 text-amber-600" />
                      <span className="italic line-clamp-1">{cartItem.notes}</span>
                    </div>
                  )}

                  {/* Quantity Stepper & Sub-total footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <span className="text-[11px] text-stone-400">Quantity</span>

                    <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200/80 rounded-lg p-0.5 shadow-2xs">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCartItemQuantity(cartItem.cartItemId, -1)}
                        aria-label="Decrease quantity"
                        className="w-6 h-6 p-0 text-stone-600 hover:bg-white"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-xs font-bold w-5 text-center tabular-nums">
                        {cartItem.quantity}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCartItemQuantity(cartItem.cartItemId, 1)}
                        aria-label="Increase quantity"
                        className="w-6 h-6 p-0 text-stone-600 hover:bg-white"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}

            {/* General Order Instructions */}
            {cart.length > 0 && (
              <div className="pt-2">
                <label
                  htmlFor="order-general-note"
                  className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1"
                >
                  Order-Wide Cooking / Table Instructions
                </label>
                <Input
                  id="order-general-note"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Serve chai after food, extra napkins..."
                  className="rounded-xl text-xs"
                />
              </div>
            )}
          </div>

          {/* Drawer Footer: Running Subtotal, Taxes & Primary Action Button */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-50/95 border-t border-stone-200/80 space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal ({totalCartCount} items)</span>
                  <span className="font-semibold text-stone-800">
                    {restaurantInfo.currencySymbol}
                    {subtotal.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charge ({restaurantInfo.serviceChargePercent}%)</span>
                  <span>
                    {restaurantInfo.currencySymbol}
                    {serviceCharge.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>GST / Tax ({restaurantInfo.taxPercent}%)</span>
                  <span>
                    {restaurantInfo.currencySymbol}
                    {tax.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-stone-900 text-sm pt-1.5 border-t border-stone-200">
                  <span>Estimated Total</span>
                  <span className="text-emerald-700 text-base font-extrabold">
                    {restaurantInfo.currencySymbol}
                    {grandTotal.toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Review & Place Order Button */}
              <Button
                type="button"
                variant="primary"
                onClick={handlePlaceOrder}
                disabled={submitOrderMutation.isPending}
                className="w-full py-3 h-11 rounded-xl text-xs sm:text-sm font-bold shadow-md gap-2"
              >
                {submitOrderMutation.isPending ? (
                  <>
                    <CheckCircle className="w-4 h-4 animate-spin" />
                    <span>Sending to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Review & Place Order for {getFormattedTable()}</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
