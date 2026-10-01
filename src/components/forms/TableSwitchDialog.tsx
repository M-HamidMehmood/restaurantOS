'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { QrCode, MapPin } from 'lucide-react';
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
import { tableSwitchSchema, TableSwitchFormValues } from '@/schemas/formSchemas';
import { useMenuStore } from '@/store/useMenuStore';
import { useRouter } from 'next/navigation';

export const TableSwitchDialog: React.FC = () => {
  const isTableOpen = useMenuStore((state) => state.isTableOpen);
  const setIsTableOpen = useMenuStore((state) => state.setIsTableOpen);
  const tableId = useMenuStore((state) => state.tableId);
  const setTableId = useMenuStore((state) => state.setTableId);
  const router = useRouter();

  const form = useForm<TableSwitchFormValues>({
    resolver: zodResolver(tableSwitchSchema),
    defaultValues: {
      tableId,
    },
  });

  const quickTables = ['T-01', 'T-04', 'T-07', 'T-12', 'PATIO-3', 'BAR-02'];

  const onSubmit = (values: TableSwitchFormValues) => {
    setTableId(values.tableId);
    setIsTableOpen(false);
    router.push(`/table/${encodeURIComponent(values.tableId)}`);
  };

  const handleQuickSelect = (newTable: string) => {
    form.setValue('tableId', newTable);
    setTableId(newTable);
    setIsTableOpen(false);
    router.push(`/table/${encodeURIComponent(newTable)}`);
  };

  return (
    <Dialog open={isTableOpen} onOpenChange={setIsTableOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle>Table QR Session</DialogTitle>
              <DialogDescription>
                Bound to session & LocalStorage
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Current Status Card */}
        <Card className="bg-amber-50/80 border-amber-200/80 p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-amber-900 uppercase tracking-wider block">
              Active Bound Table
            </span>
            <span className="text-base font-extrabold text-stone-900 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              {tableId}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Connected
          </span>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="tableId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Switch Table Identifier</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g. T-04 or PATIO-3"
                        className="font-mono uppercase"
                        {...field}
                      />
                    </FormControl>
                    <Button type="submit" size="default">
                      Update
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <span className="block text-[11px] font-medium text-stone-500 mb-1.5">
                Quick Test Tables (QR simulation):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTables.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleQuickSelect(t)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                      tableId === t
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
