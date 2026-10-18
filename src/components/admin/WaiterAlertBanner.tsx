'use client';

import React from 'react';
import { Bell, Check, Clock, Droplets, Utensils, Sparkles, HelpCircle, CreditCard } from 'lucide-react';
import { WaiterCallAlert } from '@/types/admin';

interface WaiterAlertBannerProps {
  calls: WaiterCallAlert[];
  onDismiss: (callId: string) => void;
}

export function WaiterAlertBanner({ calls, onDismiss }: WaiterAlertBannerProps) {
  if (!calls || calls.length === 0) return null;

  return (
    <aside aria-label="Assistance Alerts" className="w-full space-y-2 mb-6">
      {calls.map((call) => {
        const isBill = call.type === 'bill_request';
        const reasonLower = (call.reason || '').toLowerCase();

        let ReasonIcon = HelpCircle;
        if (isBill) ReasonIcon = CreditCard;
        else if (reasonLower.includes('water')) ReasonIcon = Droplets;
        else if (reasonLower.includes('cutlery')) ReasonIcon = Utensils;
        else if (reasonLower.includes('clean')) ReasonIcon = Sparkles;

        return (
          <div
            key={call.id}
            role="alert"
            className="flex items-center justify-between px-4 py-3 bg-amber-500 text-white rounded-2xl shadow-lg border-2 border-amber-600/30 animate-in slide-in-from-top duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-stone-950 text-amber-300 rounded-xl shadow-xs animate-bounce">
                <Bell className="w-4 h-4" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm uppercase tracking-wide bg-stone-950 text-white px-2 py-0.5 rounded-md">
                    {call.tableNumber}
                  </span>
                  <span className="font-extrabold text-sm tracking-tight text-white">
                    {isBill ? 'has requested the Bill Settlement' : 'has requested Waiter Assistance'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-xs font-semibold text-amber-100">
                  <span className="flex items-center gap-1 bg-amber-600/80 px-2 py-0.5 rounded-md text-white">
                    <ReasonIcon className="w-3 h-3 text-white" />
                    {isBill ? `Payment: ${(call.paymentMethod || 'cash').toUpperCase()}` : call.reason || 'General'}
                  </span>
                  {call.customNote && (
                    <span className="italic text-amber-100">
                      &quot;{call.customNote}&quot;
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onDismiss(call.id)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-950 hover:bg-black text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              Dismiss / Handled
            </button>
          </div>
        );
      })}
    </aside>
  );
}
