'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Split,
  Send,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { requestBillSchema, RequestBillFormValues } from '@/schemas/formSchemas';
import { useMenuStore } from '@/store/useMenuStore';
import { restaurantInfo } from '@/data/menuData';
import { PaymentMethod } from '@/types/menu';

export const RequestBillDialog: React.FC = () => {
  const isBillOpen = useMenuStore((state) => state.isBillOpen);
  const setIsBillOpen = useMenuStore((state) => state.setIsBillOpen);
  const getFormattedTable = useMenuStore((state) => state.getFormattedTable);
  const totalCartPrice = useMenuStore((state) => state.totalCartPrice());
  const cart = useMenuStore((state) => state.cart);
  const requestBill = useMenuStore((state) => state.requestBill);

  const form = useForm<RequestBillFormValues>({
    resolver: zodResolver(requestBillSchema),
    defaultValues: {
      paymentMethod: 'card',
      splitCount: 2,
      customNote: '',
    },
  });

  const paymentMethod = form.watch('paymentMethod');
  const splitCount = form.watch('splitCount') || 2;

  const activeOrders = useMenuStore((state) => state.activeOrders);
  const activeOrdersTotal = activeOrders.reduce((sum, ord) => sum + ord.totalAmount, 0);

  // Calculate bill figures from active orders or current cart
  const subtotal = activeOrdersTotal > 0 ? activeOrdersTotal : (totalCartPrice > 0 ? totalCartPrice : 500);
  const serviceCharge = (subtotal * (restaurantInfo.serviceChargePercent || 5)) / 100;
  const tax = (subtotal * (restaurantInfo.taxPercent || 5)) / 100;
  const grandTotal = subtotal + serviceCharge + tax;
  const splitPerPerson = grandTotal / splitCount;

  const paymentOptions: {
    id: PaymentMethod;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'card',
      label: 'Card / POS',
      desc: 'Card machine at table',
      icon: <CreditCard className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'apple_pay',
      label: 'Contactless',
      desc: 'Apple / Google Pay / Raast',
      icon: <Smartphone className="w-4 h-4 text-sky-600" />,
    },
    {
      id: 'cash',
      label: 'Cash',
      desc: 'Pay in cash (bring change)',
      icon: <Banknote className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'split',
      label: 'Split Bill',
      desc: 'Divide evenly between guests',
      icon: <Split className="w-4 h-4 text-purple-600" />,
    },
  ];

  const onSubmit = (values: RequestBillFormValues) => {
    const finalNote =
      values.paymentMethod === 'split'
        ? `Split ${values.splitCount} ways (${restaurantInfo.currencySymbol}${splitPerPerson.toFixed(0)}/person). ${values.customNote || ''}`
        : values.customNote;
    requestBill(values.paymentMethod as PaymentMethod, finalNote);
    form.reset();
  };

  return (
    <Dialog open={isBillOpen} onOpenChange={setIsBillOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Request Table Bill</DialogTitle>
              <DialogDescription>
                Settling check for <strong className="text-stone-900">{getFormattedTable()}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Bill Breakdown Card */}
        <Card className="bg-stone-50/80 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between text-stone-600">
            <span>{cart.length > 0 ? `Subtotal (${cart.length} items)` : 'Table Subtotal'}</span>
            <span className="font-semibold text-stone-900">
              {restaurantInfo.currencySymbol}
              {subtotal.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Service Charge ({restaurantInfo.serviceChargePercent}%)</span>
            <span>
              {restaurantInfo.currencySymbol}
              {serviceCharge.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Tax ({restaurantInfo.taxPercent}%)</span>
            <span>
              {restaurantInfo.currencySymbol}
              {tax.toFixed(0)}
            </span>
          </div>
          <div className="pt-2 border-t border-stone-200 flex justify-between items-baseline">
            <span className="font-bold text-sm text-stone-900">Grand Total</span>
            <span className="font-extrabold text-base text-emerald-700">
              {restaurantInfo.currencySymbol}
              {grandTotal.toFixed(0)}
            </span>
          </div>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Payment Method Selector */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Payment Method</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {paymentOptions.map((opt) => {
                        const isSelected = field.value === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => field.onChange(opt.id)}
                            className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-600 shadow-2xs'
                                : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              {opt.icon}
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </div>
                            <span className="text-xs font-bold">{opt.label}</span>
                            <span className="text-[10px] text-stone-500 line-clamp-1">
                              {opt.desc}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Split Bill counter if split selected */}
            {paymentMethod === 'split' && (
              <FormField
                control={form.control}
                name="splitCount"
                render={({ field }) => (
                  <FormItem className="bg-purple-50/80 border border-purple-200/80 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-purple-950">Number of Guests</FormLabel>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => field.onChange(Math.max(2, (field.value || 2) - 1))}
                        >
                          -
                        </Button>
                        <span className="text-xs font-bold text-purple-950 w-6 text-center tabular-nums">
                          {field.value}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => field.onChange(Math.min(12, (field.value || 2) + 1))}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-purple-200/60">
                      <span className="text-purple-800">Amount per guest:</span>
                      <span className="font-bold text-purple-950 text-sm">
                        {restaurantInfo.currencySymbol}
                        {splitPerPerson.toFixed(0)}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Note */}
            <FormField
              control={form.control}
              name="customNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Note (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Printed receipt or GST invoice..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBillOpen(false)}
                className="w-full sm:w-auto"
              >
                Back to Menu
              </Button>
              <Button
                type="submit"
                variant="default"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Request Bill</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
