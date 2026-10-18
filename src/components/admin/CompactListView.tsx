'use client';

import React, { useState } from 'react';
import {
  Printer,
  Clock,
  AlertTriangle,
  ChefHat,
  CheckCircle2,
  Check,
  Eye,
  X,
  FileText,
  CreditCard,
  MessageSquare,
} from 'lucide-react';
import { AdminOrder } from '@/types/admin';
import { formatOrderAge, formatFullDateTime } from '@/lib/dateUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<AdminOrder | null>(null);

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
        <p className="font-semibold text-sm">No orders matching current filter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-[11px] font-extrabold uppercase tracking-wider text-stone-600 border-b border-stone-200">
                <th className="py-3 px-4">Table</th>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Placed</th>
                <th className="py-3 px-4">Dishes</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs font-medium text-stone-800">
              {orders.map((order) => {
                const created = new Date(order.createdAt).getTime();
                const elapsedMinutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
                const isDelayed = elapsedMinutes >= 15 && (order.status === 'pending' || order.status === 'preparing');
                const isWarning = elapsedMinutes >= 10 && elapsedMinutes < 15 && (order.status === 'pending' || order.status === 'preparing');

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

                    {/* Friendly Time Placed */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                          isDelayed
                            ? 'bg-rose-600 text-white animate-pulse'
                            : isWarning
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {isDelayed ? (
                          <AlertTriangle className="w-3 h-3 text-white" />
                        ) : (
                          <Clock className="w-3 h-3 text-stone-400" />
                        )}
                        {formatOrderAge(order.createdAt)}
                      </span>
                    </td>

                    {/* Line Items Summary (Dishes ONLY to save space) */}
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

                    {/* Quick Actions (Including Details Button) */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Full Order Details */}
                        <button
                          onClick={() => setSelectedOrderDetail(order)}
                          title="View Full Order Details"
                          className="px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-stone-500" />
                          <span>Details</span>
                        </button>

                        <button
                          onClick={() => onPrintKot(order)}
                          title="Print 80mm Kitchen Ticket"
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

      {/* Full Order Detail Modal */}
      {selectedOrderDetail && (
        <Dialog open={Boolean(selectedOrderDetail)} onOpenChange={(open) => !open && setSelectedOrderDetail(null)}>
          <DialogContent className="max-w-lg w-full p-6 rounded-3xl border border-stone-200 shadow-2xl">
            <DialogHeader className="p-0 border-b border-stone-100 pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-stone-900 text-white font-black text-xs rounded-xl uppercase shadow-xs">
                    {selectedOrderDetail.tableNumber}
                  </span>
                  <DialogTitle className="text-base font-bold text-stone-900 font-mono">
                    Order #{selectedOrderDetail.id}
                  </DialogTitle>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    selectedOrderDetail.status === 'pending'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : selectedOrderDetail.status === 'preparing'
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                      : selectedOrderDetail.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : selectedOrderDetail.status === 'served'
                      ? 'bg-stone-100 text-stone-600 border border-stone-200'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedOrderDetail.status === 'preparing'
                    ? 'In Kitchen'
                    : selectedOrderDetail.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Placed {formatOrderAge(selectedOrderDetail.createdAt)} • {formatFullDateTime(selectedOrderDetail.createdAt)}</span>
              </p>
            </DialogHeader>

            <div className="space-y-4 pt-1 max-h-[60vh] overflow-y-auto pr-1">
              {/* Customer Special Instructions / Notes */}
              {selectedOrderDetail.notes && (
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block">
                      Customer Instructions
                    </span>
                    <p className="text-xs font-semibold text-stone-800 mt-0.5 italic">
                      &quot;{selectedOrderDetail.notes}&quot;
                    </p>
                  </div>
                </div>
              )}

              {/* Dishes Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-500">
                  Ordered Dishes & Modifiers
                </h4>
                <div className="divide-y divide-stone-100 bg-stone-50/80 rounded-2xl p-3 border border-stone-200/80">
                  {selectedOrderDetail.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-stone-900">
                            <span className="text-amber-700 font-extrabold mr-1">{item.quantity}x</span>
                            {item.name}
                          </p>
                          {/* Modifiers */}
                          {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                            <ul className="mt-1 space-y-0.5 pl-4 text-[11px] text-stone-600 list-disc">
                              {item.selectedModifiers.map((mod, mIdx) => (
                                <li key={mIdx}>
                                  {mod.name}
                                  {(mod.priceExtra || mod.price) ? (
                                    <span className="text-stone-400"> (+Rs. {mod.priceExtra || mod.price})</span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                          {/* Item specific note */}
                          {item.notes && (
                            <p className="text-[10px] text-amber-800 font-medium italic mt-1">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-stone-800 shrink-0">
                          Rs. {item.totalPrice ?? (item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Total & Payment Summary */}
              <div className="bg-stone-100/70 p-3.5 rounded-2xl border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                    Total Bill
                  </span>
                  <span className="text-xs text-stone-600 font-medium">
                    Payment: {selectedOrderDetail.paymentStatus ? selectedOrderDetail.paymentStatus.toUpperCase() : 'UNPAID'} ({selectedOrderDetail.paymentMethod || 'Pay at Table'})
                  </span>
                </div>
                <span className="text-xl font-black text-stone-950 font-mono">
                  Rs. {selectedOrderDetail.totalAmount}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onPrintKot(selectedOrderDetail)}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Kitchen Ticket</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedOrderDetail.status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => {
                      onAccept(selectedOrderDetail.id);
                      setSelectedOrderDetail(null);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Accept Order</span>
                  </button>
                )}

                {selectedOrderDetail.status === 'preparing' && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkReady(selectedOrderDetail.id);
                      setSelectedOrderDetail(null);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Ready</span>
                  </button>
                )}

                {selectedOrderDetail.status === 'ready' && (
                  <button
                    type="button"
                    onClick={() => {
                      onMarkServed(selectedOrderDetail.id);
                      setSelectedOrderDetail(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Mark Delivered</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedOrderDetail(null)}
                  className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
