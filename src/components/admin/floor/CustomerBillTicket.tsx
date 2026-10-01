'use client';

import React from 'react';
import { BillSettlementDetails } from '@/types/admin';

interface CustomerBillTicketProps {
  bill: BillSettlementDetails | null;
  onClose?: () => void;
}

export function CustomerBillTicket({ bill, onClose }: CustomerBillTicketProps) {
  if (!bill) return null;

  const invoiceNo = `INV-${new Date(bill.settledAt).getTime().toString().slice(-6)}`;
  const formattedDate = new Date(bill.settledAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <>
      {/* 80mm Print Container (Visible only when @media print triggers) */}
      <div className="customer-bill-print-container hidden print:block text-black font-mono">
        {/* Header */}
        <div className="text-center pb-2 border-b border-black">
          <h1 className="text-base font-black tracking-tight leading-tight uppercase">
            CHASKA & CHAI BISTRO
          </h1>
          <p className="text-[11px] leading-tight mt-0.5">DHA Phase 5, Commercial Zone, Lahore</p>
          <p className="text-[10px] leading-tight">UAN: (042) 111-242-752 • GST: 3277891-2</p>
          <p className="text-xs font-bold mt-1 tracking-wider">*** FINAL CUSTOMER BILL ***</p>
        </div>

        {/* Invoice Meta */}
        <div className="text-[11px] py-1.5 border-b border-black space-y-0.5">
          <div className="flex justify-between font-bold">
            <span>RECEIPT: {invoiceNo}</span>
            <span className="text-sm font-black">TABLE: {bill.tableNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE: {formattedDate}</span>
            <span>POS: #01 (Manager)</span>
          </div>
        </div>

        {/* Items Breakdown by Rounds */}
        <div className="py-2 border-b border-black text-[11px]">
          <div className="flex justify-between font-black pb-1 border-b border-dashed border-black uppercase text-[10px]">
            <span className="w-8">QTY</span>
            <span className="flex-1 text-left px-1">DESCRIPTION</span>
            <span className="w-12 text-right">RATE</span>
            <span className="w-14 text-right">AMOUNT</span>
          </div>

          {/* Ordered Rounds */}
          {bill.rounds.map((round) => (
            <div key={round.orderId} className="pt-1.5">
              <div className="text-[10px] font-bold text-gray-700 bg-gray-100 px-1 py-0.5 mb-1 inline-block uppercase">
                Round #{round.roundIndex}
              </div>

              {round.items.map((item, idx) => (
                <div key={idx} className="mb-1">
                  <div className="flex justify-between font-semibold">
                    <span className="w-8">{item.quantity}x</span>
                    <span className="flex-1 text-left px-1 break-words">{item.name}</span>
                    <span className="w-12 text-right">{item.unitPrice}</span>
                    <span className="w-14 text-right font-bold">
                      {item.unitPrice * item.quantity}
                    </span>
                  </div>

                  {/* Modifiers */}
                  {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                    <div className="pl-8 text-[10px] italic">
                      {item.selectedModifiers.map((m, mIdx) => (
                        <div key={mIdx}>
                          + {m.name} {m.priceExtra ? `(+Rs. ${m.priceExtra})` : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Special Notes */}
                  {item.notes && (
                    <div className="pl-8 text-[10px] italic">
                      *Note: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Off-Menu / Custom Items */}
          {bill.customItems && bill.customItems.length > 0 && (
            <div className="pt-1.5 border-t border-dashed border-black mt-1">
              <div className="text-[10px] font-bold text-gray-700 bg-gray-100 px-1 py-0.5 mb-1 inline-block uppercase">
                Special / Off-Menu Additions
              </div>
              {bill.customItems.map((item) => (
                <div key={item.id} className="mb-1 flex justify-between font-semibold">
                  <span className="w-8">{item.quantity}x</span>
                  <span className="flex-1 text-left px-1 break-words">
                    {item.name} {item.notes ? `(${item.notes})` : ''}
                  </span>
                  <span className="w-12 text-right">{item.unitPrice}</span>
                  <span className="w-14 text-right font-bold">
                    {item.unitPrice * item.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Calculations */}
        <div className="py-2 border-b border-black text-[12px] space-y-1">
          <div className="flex justify-between">
            <span>Items Subtotal:</span>
            <span>Rs. {bill.itemsSubtotal.toLocaleString()}</span>
          </div>

          {bill.discountAmount > 0 && (
            <div className="flex justify-between font-bold">
              <span>
                Discount ({bill.discountType === 'percentage' ? `${bill.discountValue}%` : 'Flat'}):
              </span>
              <span>- Rs. {bill.discountAmount.toLocaleString()}</span>
            </div>
          )}

          {bill.taxAmount > 0 && (
            <div className="flex justify-between">
              <span>Govt Tax / GST ({bill.taxRatePercent}%):</span>
              <span>+ Rs. {bill.taxAmount.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between text-base font-black pt-1 border-t border-black">
            <span>GRAND TOTAL:</span>
            <span>RS. {bill.finalTotal.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment & Change Tendered */}
        <div className="py-2 border-b border-black text-[11px] space-y-0.5">
          <div className="flex justify-between font-bold uppercase">
            <span>PAYMENT METHOD:</span>
            <span>{bill.paymentMethod}</span>
          </div>

          {bill.paymentMethod === 'cash' && (
            <>
              <div className="flex justify-between">
                <span>Cash Tendered:</span>
                <span>Rs. {bill.amountTendered.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-black text-xs pt-0.5">
                <span>CHANGE DUE:</span>
                <span>Rs. {Math.max(0, bill.changeDue).toLocaleString()}</span>
              </div>
            </>
          )}

          {bill.notes && (
            <div className="pt-1 text-[10px] italic">
              Note: {bill.notes}
            </div>
          )}
        </div>

        {/* Thermal Footer */}
        <div className="text-center pt-2 text-[10px] space-y-0.5">
          <p className="font-bold">THANK YOU FOR DINING WITH US!</p>
          <p>Please visit again soon.</p>
          <p className="pt-1 font-mono text-[9px]">Wi-Fi: ChaskaGuest • Pass: chai1234</p>
          <p className="text-[9px]">Rate your experience on Google: @chaskachai</p>
        </div>
      </div>
    </>
  );
}
