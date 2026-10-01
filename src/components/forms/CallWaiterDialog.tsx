'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Droplets, Utensils, HelpCircle, Sparkles, Send } from 'lucide-react';
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
import { callWaiterSchema, CallWaiterFormValues } from '@/schemas/formSchemas';
import { useMenuStore } from '@/store/useMenuStore';
import { WaiterReason } from '@/types/menu';

export const CallWaiterDialog: React.FC = () => {
  const isWaiterOpen = useMenuStore((state) => state.isWaiterOpen);
  const setIsWaiterOpen = useMenuStore((state) => state.setIsWaiterOpen);
  const getFormattedTable = useMenuStore((state) => state.getFormattedTable);
  const callWaiter = useMenuStore((state) => state.callWaiter);

  const form = useForm<CallWaiterFormValues>({
    resolver: zodResolver(callWaiterSchema),
    defaultValues: {
      reason: 'general',
      customNote: '',
    },
  });

  const onSubmit = (values: CallWaiterFormValues) => {
    callWaiter(values.reason as WaiterReason, values.customNote);
    form.reset();
  };

  const quickReasons: { id: WaiterReason; label: string; icon: React.ReactNode }[] = [
    {
      id: 'general',
      label: 'General Assistance',
      icon: <HelpCircle className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'water',
      label: 'Water Refill',
      icon: <Droplets className="w-4 h-4 text-sky-500" />,
    },
    {
      id: 'cutlery',
      label: 'Extra Cutlery',
      icon: <Utensils className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'clean_table',
      label: 'Clean Table',
      icon: <Sparkles className="w-4 h-4 text-purple-500" />,
    },
  ];

  return (
    <Dialog open={isWaiterOpen} onOpenChange={setIsWaiterOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>Call Waiter</DialogTitle>
              <DialogDescription>
                Dispatching staff to <strong className="text-stone-900">{getFormattedTable()}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Assistance Reason Selection */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Request Type</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {quickReasons.map((reason) => {
                        const isSelected = field.value === reason.id;
                        return (
                          <button
                            key={reason.id}
                            type="button"
                            onClick={() => field.onChange(reason.id)}
                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                              isSelected
                                ? 'border-amber-600 bg-amber-50/80 text-amber-950 font-bold ring-1 ring-amber-600 shadow-2xs'
                                : 'border-stone-200 hover:bg-stone-50 text-stone-700 font-medium'
                            }`}
                          >
                            {reason.icon}
                            <span className="truncate">{reason.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Note */}
            <FormField
              control={form.control}
              name="customNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Extra napkins, hot water..."
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
                onClick={() => setIsWaiterOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="w-full sm:w-auto gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Waiter</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
