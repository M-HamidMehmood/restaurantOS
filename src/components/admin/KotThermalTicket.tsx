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
            <span className="font-semibold text-sm tracking-wide">80mm Thermal Bill Preview</span>
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
              <p className="text-[10px] uppercase tracking-wider text-stone-700">DHA Phase 5, Commercial Zone, Lahore</p>
              <p className="text-[10px] uppercase tracking-wider text-stone-700">UAN: (042) 111-242-752</p>
              <p className="text-[11px] font-black uppercase tracking-widest mt-1 border-t border-dotted border-black pt-1">
                *** CUSTOMER BILL ***
              </p>
            </div>

            {/* Table & Order Metadata */}
            <div className="border-b border-black pb-2 mb-2">
              <div className="flex justify-between items-center my-1">
                <span className="text-[15px] font-black tracking-tight uppercase bg-black text-white px-2 py-0.5 rounded-xs">
                  {order.tableNumber.toUpperCase()}
                </span>
                <span className="text-[13px] font-black">{order.id}</span>
              </div>
              <div className="flex justify-between text-[11px] text-black mt-1">
                <span>DATE: {formattedDate}</span>
                <span>TIME: {formattedTime}</span>
              </div>
            </div>

            {/* Ordered Items with Rates & Amounts */}
            <div className="border-b border-black pb-2 mb-2">
              <div className="flex justify-between font-black text-[11px] border-b border-dashed border-black pb-1 mb-1.5 uppercase">
                <span className="w-8">QTY</span>
                <span className="flex-1 text-left px-1">DESCRIPTION</span>
                <span className="w-12 text-right">RATE</span>
                <span className="w-14 text-right">AMOUNT</span>
              </div>

              <div className="space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-baseline text-[12px] font-bold">
                    <span className="w-8 font-black">{item.quantity}x</span>
                    <span className="flex-1 text-left px-1 break-words">{item.name.toUpperCase()}</span>
                    <span className="w-12 text-right font-mono text-stone-700">{item.unitPrice}</span>
                    <span className="w-14 text-right font-mono font-black">
                      {item.totalPrice ?? (item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Calculations */}
            <div className="py-2 border-b-2 border-black text-[12px] space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold">Rs. {order.subtotal || order.totalAmount}</span>
              </div>
              {order.serviceCharge > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>Service Charge:</span>
                  <span>Rs. {order.serviceCharge}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px] font-black border-t-2 border-black pt-1.5 mt-1">
                <span>GRAND TOTAL:</span>
                <span>RS. {order.totalAmount}</span>
              </div>
            </div>

            {/* Ticket Footer */}
            <div className="text-center pt-2 text-[10px] space-y-0.5">
              <p className="font-black uppercase tracking-wider">THANK YOU FOR DINING WITH US!</p>
              <p className="text-stone-700">Please visit again soon.</p>
              <p className="text-stone-600 mt-1">Wi-Fi: ChaskaCafe_Guest • Pass: karakchai2026</p>
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
              Print 80mm Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
