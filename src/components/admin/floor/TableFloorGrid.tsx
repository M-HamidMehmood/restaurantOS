'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  Receipt,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Layers,
  CreditCard,
  Banknote,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FloorTable, TableFloorStatus } from '@/types/admin';

interface TableFloorGridProps {
  tables: FloorTable[];
  selectedTable: FloorTable | null;
  onSelectTable: (table: FloorTable) => void;
  onResolveWaiterCall: (requestId: string, tableNumber?: string) => void;
}

export function TableFloorGrid({
  tables,
  selectedTable,
  onSelectTable,
  onResolveWaiterCall,
}: TableFloorGridProps) {
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied' | 'bill_requested' | 'waiter_call'>('all');

  // Calculate top-line metrics
  const totalTables = tables.length;
  const availableCount = tables.filter((t) => t.status === 'available').length;
  const occupiedCount = tables.filter((t) => t.status === 'occupied').length;
  const billRequestedCount = tables.filter((t) => t.status === 'bill_requested').length;
  const waiterCallsCount = tables.filter((t) => t.hasActiveWaiterCall).length;
  const totalRunningRevenue = tables.reduce((acc, t) => acc + (t.runningTotal || 0), 0);

  // Filtered tables list
  const filteredTables = tables.filter((tbl) => {
    if (filter === 'available') return tbl.status === 'available';
    if (filter === 'occupied') return tbl.status === 'occupied';
    if (filter === 'bill_requested') return tbl.status === 'bill_requested';
    if (filter === 'waiter_call') return tbl.hasActiveWaiterCall;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Overview Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Tables */}
        <div
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'all'
              ? 'bg-stone-900 text-white border-stone-800 shadow-sm'
              : 'bg-white border-stone-200/80 text-stone-800 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={filter === 'all' ? 'text-stone-300' : 'text-stone-500'}>All Tables</span>
            <Layers className="w-4 h-4 opacity-75" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black">{totalTables}</span>
            <span className={`text-[11px] font-medium ${filter === 'all' ? 'text-amber-400' : 'text-stone-400'}`}>
              Rs. {totalRunningRevenue.toLocaleString()} open
            </span>
          </div>
        </div>

        {/* Available (Green) */}
        <div
          onClick={() => setFilter('available')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'available'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-white border-stone-200/80 text-stone-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={filter === 'available' ? 'text-emerald-100' : 'text-emerald-700'}>
              Available / Vacant
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black">{availableCount}</span>
            <span className={`text-[11px] font-medium ${filter === 'available' ? 'text-emerald-100' : 'text-stone-400'}`}>
              Ready for diners
            </span>
          </div>
        </div>

        {/* Occupied (Blue) */}
        <div
          onClick={() => setFilter('occupied')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'occupied'
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
              : 'bg-white border-stone-200/80 text-stone-800 hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={filter === 'occupied' ? 'text-blue-100' : 'text-blue-700'}>
              Occupied / Active
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black">{occupiedCount}</span>
            <span className={`text-[11px] font-medium ${filter === 'occupied' ? 'text-blue-100' : 'text-stone-400'}`}>
              Unbilled tabs
            </span>
          </div>
        </div>

        {/* Bill Requested (Orange) */}
        <div
          onClick={() => setFilter('bill_requested')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'bill_requested'
              ? 'bg-amber-500 text-stone-950 border-amber-600 shadow-sm'
              : 'bg-white border-stone-200/80 text-stone-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={filter === 'bill_requested' ? 'text-stone-900 font-bold' : 'text-amber-700'}>
              Bill Requested
            </span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black">{billRequestedCount}</span>
            <span className={`text-[11px] font-medium ${filter === 'bill_requested' ? 'text-stone-900' : 'text-stone-400'}`}>
              Ready to checkout
            </span>
          </div>
        </div>

        {/* Waiter Calls (Red Alert) */}
        <div
          onClick={() => setFilter('waiter_call')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'waiter_call'
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
              : waiterCallsCount > 0
              ? 'bg-rose-50 border-rose-200 text-rose-900 animate-soft-pulse'
              : 'bg-white border-stone-200/80 text-stone-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={filter === 'waiter_call' ? 'text-rose-100' : 'text-rose-700'}>
              Waiter Assistance
            </span>
            <BellRing className={`w-4 h-4 ${waiterCallsCount > 0 ? 'text-rose-600 animate-bounce' : 'text-stone-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black">{waiterCallsCount}</span>
            <span className={`text-[11px] font-medium ${filter === 'waiter_call' ? 'text-rose-100' : 'text-stone-400'}`}>
              {waiterCallsCount > 0 ? 'Requires attention' : 'All clear'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Table Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.map((table) => {
          const isSelected = selectedTable?.id === table.id || selectedTable?.tableNumber === table.tableNumber;
          const isAvailable = table.status === 'available';
          const isOccupied = table.status === 'occupied';
          const isBillRequested = table.status === 'bill_requested';
          const isCallingWaiter = table.hasActiveWaiterCall;

          // Seated duration formatted string
          const formattedDuration =
            table.seatedDurationMinutes !== undefined && table.seatedDurationMinutes > 0
              ? table.seatedDurationMinutes >= 60
                ? `${Math.floor(table.seatedDurationMinutes / 60)}h ${table.seatedDurationMinutes % 60}m`
                : `${table.seatedDurationMinutes}m`
              : 'Just seated';

          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table)}
              className={`group relative rounded-2xl border p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between select-none ${
                isSelected
                  ? 'ring-2 ring-amber-500 shadow-md bg-stone-50/80'
                  : 'hover:shadow-md'
              } ${
                isCallingWaiter
                  ? 'ring-4 ring-rose-500 ring-offset-2 border-rose-500 bg-rose-50/50 animate-pulse'
                  : isBillRequested
                  ? 'border-amber-300 bg-amber-50/30 hover:border-amber-400'
                  : isOccupied
                  ? 'border-blue-200 bg-blue-50/20 hover:border-blue-400'
                  : 'border-stone-200 bg-white hover:border-emerald-300'
              }`}
            >
              {/* Card Header: Table Number & Status Pill */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-stone-900 group-hover:text-amber-600 transition-colors">
                      {table.tableNumber}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-stone-600 px-2 py-0.5 bg-stone-100 rounded-md">
                      <Users className="w-3 h-3 text-stone-600" />
                      {table.capacity} seats
                    </span>
                  </div>

                  {/* Status Flag Badge */}
                  {isAvailable && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Available
                    </span>
                  )}
                  {isOccupied && !isBillRequested && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                      Occupied
                    </span>
                  )}
                  {isBillRequested && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-300 shadow-xs">
                      <Receipt className="w-3 h-3 text-amber-800" />
                      Bill Requested
                    </span>
                  )}
                </div>

                {/* Sub-label display name e.g. "Window Booth" */}
                {table.displayName && table.displayName !== table.tableNumber && (
                  <p className="text-[11px] text-stone-500 font-medium mt-0.5 truncate">
                    {table.displayName}
                  </p>
                )}

                {/* Calling Waiter Warning Tag */}
                {isCallingWaiter && (
                  <div className="mt-3 p-2 bg-rose-100/90 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 shadow-xs">
                    <div className="flex items-center gap-2 truncate">
                      <BellRing className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                      <div className="truncate">
                        <span className="font-bold block leading-tight">Calling Waiter</span>
                        <span className="text-[10px] text-rose-700 truncate block leading-tight">
                          {table.waiterCallReason || 'Needs help'}
                        </span>
                      </div>
                    </div>
                    {table.waiterCallId && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onResolveWaiterCall(table.waiterCallId!, table.tableNumber);
                        }}
                        className="px-2 py-1 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shrink-0 shadow-xs"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Card Body: Live Metrics or Vacant State */}
              <div className="my-4">
                {isAvailable ? (
                  <div className="py-2 px-3 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center">
                    <p className="text-xs text-stone-500 font-medium">Table is ready for diners</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Click to view table QR or start tab</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Running Total & Rounds */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/80 border border-stone-200/70 shadow-xs">
                      <div className="text-left">
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                          Current Bill
                        </span>
                        <span className="text-base font-black text-stone-900">
                          Rs. {table.runningTotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider block">
                          Rounds
                        </span>
                        <span className="text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded-md">
                          {table.rounds.length} {table.rounds.length === 1 ? 'Round' : 'Rounds'}
                        </span>
                      </div>
                    </div>

                    {/* Seated Duration & Payment Preference */}
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="flex items-center gap-1 text-stone-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        {formattedDuration}
                      </span>
                      {table.billRequestedMethod && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700">
                          {table.billRequestedMethod === 'card' ? (
                            <>
                              <CreditCard className="w-3 h-3" />
                              Prefers Card
                            </>
                          ) : (
                            <>
                              <Banknote className="w-3 h-3" />
                              Prefers Cash
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer: Action Trigger */}
              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-stone-400 group-hover:text-stone-600 transition-colors">
                  {isAvailable ? 'View Table' : 'Checkout & Details'}
                </span>
                <div className="w-6 h-6 rounded-lg bg-stone-100 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center text-stone-500 transition-all">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTables.length === 0 && (
        <div className="p-12 text-center bg-white rounded-3xl border border-stone-200 space-y-2">
          <HelpCircle className="w-8 h-8 text-stone-300 mx-auto" />
          <h3 className="text-sm font-bold text-stone-700">No tables match the selected filter</h3>
          <p className="text-xs text-stone-400">Select "All Tables" to inspect the full floor plan.</p>
        </div>
      )}
    </div>
  );
}
