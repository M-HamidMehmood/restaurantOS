'use client';

import React from 'react';
import { Printer, X, Check } from 'lucide-react';
import { AdminOrder } from '@/types/admin';

interface KotThermalTicketProps {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function KotThermalTicket({ order, isOpen, onClose }: KotThermalTicketProps) {
  if (!order || !isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200">
        {/* Modal Controls Header (Screen Only) */}
        <div className="no-print px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-sm tracking-wide">80mm Thermal KOT Preview</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm Slip Container (Renders on Screen & Print) */}
        <div className="p-6 bg-stone-100 flex justify-center max-h-[75vh] overflow-y-auto">
          <div
            id="kot-thermal-slip"
            className="kot-thermal-print-container bg-white text-black p-4 shadow-md border border-dashed border-stone-300 w-[78mm] min-w-[78mm] font-mono text-[12px] leading-tight select-text"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <p className="text-[14px] font-black uppercase tracking-wider">CHASKA & CHAI CAFE</p>
              <p className="text-[10px] uppercase tracking-widest mt-0.5">*** KITCHEN ORDER TICKET (KOT) ***</p>
            </div>

            {/* Table & Order Metadata */}
            <div className="border-b border-black pb-2 mb-2">
              <div className="flex justify-between items-center my-1">
                <span className="text-[16px] font-black tracking-tight uppercase bg-black text-white px-2 py-0.5 rounded-sm">
                  {order.tableNumber.toUpperCase()}
                </span>
                <span className="text-[14px] font-black">{order.id}</span>
              </div>
              <div className="flex justify-between text-[11px] text-black mt-1">
                <span>DATE: {formattedDate}</span>
                <span>TIME: {formattedTime}</span>
              </div>
              <div className="flex justify-between text-[11px] text-black">
                <span>SERVER: QR Live Feed</span>
                <span className="font-bold">STATUS: {order.status.toUpperCase()}</span>
              </div>
            </div>

            {/* Preparation Items */}
            <div className="border-b border-black pb-2 mb-2">
              <div className="flex justify-between font-black text-[11px] border-b border-dashed border-black pb-1 mb-1.5 uppercase">
                <span>QTY & DISH ITEM</span>
                <span>CHECK</span>
              </div>

              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="border-b border-dotted border-stone-300 pb-1.5">
                    <div className="flex justify-between items-start">
                      <div className="font-black text-[13px] tracking-tight">
                        {item.quantity}x {item.name.toUpperCase()}
                      </div>
                      <div className="w-3.5 h-3.5 border border-black rounded-xs inline-block mt-0.5" />
                    </div>

                    {/* Modifiers */}
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <div className="pl-3 mt-0.5 space-y-0.5 text-[11px] font-bold text-stone-800">
                        {item.selectedModifiers.map((mod, mIdx) => (
                          <div key={mIdx}>
                            &gt; {mod.name} {mod.priceExtra || mod.price ? `(+Rs. ${mod.priceExtra || mod.price})` : ''}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Line Item Notes */}
                    {item.notes && (
                      <div className="pl-3 mt-1 text-[11px] font-black uppercase text-black bg-stone-100 p-0.5 rounded-xs">
                        * NOTE: {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions Box */}
            {order.notes && (
              <div className="border-2 border-black p-1.5 mb-2 bg-stone-50">
                <p className="text-[10px] font-black uppercase tracking-wider mb-0.5">SPECIAL ORDER INSTRUCTIONS:</p>
                <p className="text-[12px] font-bold uppercase leading-snug">{order.notes}</p>
              </div>
            )}

            {/* Ticket Footer */}
            <div className="text-center pt-1 border-t border-black text-[10px]">
              <p className="font-bold">Total Items: {order.items.reduce((acc, it) => acc + it.quantity, 0)}</p>
              <p className="text-stone-600 mt-0.5">RestaurantOS Kitchen Display • Pass Copy</p>
              <p className="font-black text-[11px] mt-1">==============================</p>
            </div>
          </div>
        </div>

        {/* Modal Action Footer (Screen Only) */}
        <div className="no-print p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3">
          <p className="text-xs text-stone-500 font-medium">
            Standard 80mm thermal roll layout with zero printer margins.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              Print KOT Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
