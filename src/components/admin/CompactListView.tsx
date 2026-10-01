'use client';

import React from 'react';
import { Printer, Clock, AlertTriangle, ChefHat, CheckCircle2, Check } from 'lucide-react';
import { AdminOrder } from '@/types/admin';

interface CompactListViewProps {
  orders: AdminOrder[];
  onAccept: (orderId: string) => void;
  onRejectPrompt: (order: AdminOrder) => void;
  onMarkReady: (orderId: string) => void;
  onMarkServed: (orderId: string) => void;
  onPrintKot: (order: AdminOrder) => void;
}

export function CompactListView({
  orders,
  onAccept,
  onRejectPrompt,
  onMarkReady,
  onMarkServed,
  onPrintKot,
}: CompactListViewProps) {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
        <p className="font-semibold text-sm">No orders matching current filter.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50 text-[11px] font-extrabold uppercase tracking-wider text-stone-600 border-b border-stone-200">
              <th className="py-3 px-4">Table</th>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Elapsed</th>
              <th className="py-3 px-4">Dishes & Modifiers</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs font-medium text-stone-800">
            {orders.map((order) => {
              const created = new Date(order.createdAt).getTime();
              const elapsedMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
              const isDelayed = elapsedMinutes >= 15;
              const isWarning = elapsedMinutes >= 10 && elapsedMinutes < 15;

              return (
                <tr key={order.id} className="hover:bg-stone-50/70 transition-colors">
                  {/* Table Badge */}
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-1 bg-stone-900 text-white font-black text-xs rounded-lg uppercase shadow-2xs whitespace-nowrap">
                      {order.tableNumber}
                    </span>
                  </td>

                  {/* Order ID */}
                  <td className="py-3 px-4 font-mono font-bold text-stone-600 whitespace-nowrap">
                    #{order.id}
                  </td>

                  {/* Elapsed Timer */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isDelayed
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isWarning
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {isDelayed ? (
                        <AlertTriangle className="w-3 h-3 text-white" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {elapsedMinutes}m
                    </span>
                  </td>

                  {/* Line Items Summary */}
                  <td className="py-3 px-4 max-w-md">
                    <div className="line-clamp-2">
                      {order.items.map((it, idx) => (
                        <span key={idx} className="mr-2">
                          <strong className="text-stone-900 font-extrabold">{it.quantity}x</strong>{' '}
                          {it.name}
                          {it.selectedModifiers && it.selectedModifiers.length > 0 && (
                            <span className="text-stone-500 text-[10px]">
                              {' '}
                              ({it.selectedModifiers.map((m) => m.name).join(', ')})
                            </span>
                          )}
                          {idx < order.items.length - 1 ? ' • ' : ''}
                        </span>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="text-[11px] text-amber-800 font-semibold italic mt-0.5 line-clamp-1">
                        Note: &quot;{order.notes}&quot;
                      </p>
                    )}
                  </td>

                  {/* Total */}
                  <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                    Rs. {order.totalAmount}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    {order.status === 'pending' && (
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold rounded-lg">
                        Pending
                      </span>
                    )}
                    {order.status === 'preparing' && (
                      <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-bold rounded-lg">
                        In Kitchen
                      </span>
                    )}
                    {order.status === 'ready' && (
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-bold rounded-lg animate-pulse">
                        Ready
                      </span>
                    )}
                    {order.status === 'served' && (
                      <span className="px-2.5 py-1 bg-stone-100 text-stone-600 text-[11px] font-bold rounded-lg">
                        Served
                      </span>
                    )}
                    {order.status === 'cancelled' && (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-[11px] font-bold rounded-lg">
                        Cancelled
                      </span>
                    )}
                  </td>

                  {/* Quick Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onPrintKot(order)}
                        title="Print 80mm KOT"
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onRejectPrompt(order)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => onAccept(order.id)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                          >
                            <ChefHat className="w-3 h-3" />
                            Accept
                          </button>
                        </>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => onMarkReady(order.id)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Ready
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => onMarkServed(order.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-all active:scale-95"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          Deliver
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
