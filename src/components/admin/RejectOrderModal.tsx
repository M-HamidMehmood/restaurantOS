'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { AdminOrder } from '@/types/admin';

interface RejectOrderModalProps {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string, reason: string) => void;
}

const PRESET_REASONS = [
  'Out of Stock / 86-Item',
  'Kitchen at Peak Capacity',
  'Special Ingredients Unavailable',
  'Kitchen Shift Closing',
  'Invalid Table or Duplicate Order',
];

export function RejectOrderModal({ order, isOpen, onClose, onConfirm }: RejectOrderModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customReason, setCustomReason] = useState('');

  if (!order || !isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = customReason.trim() ? customReason.trim() : selectedPreset;
    onConfirm(order.id, finalReason);
    setCustomReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200">
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-600">
            <div className="p-2 bg-rose-50 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-900">Reject Incoming Order</h3>
              <p className="text-xs text-stone-500 font-medium">
                #{order.id} • {order.tableNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2 uppercase tracking-wider">
              Select Rejection Reason:
            </label>
            <div className="space-y-1.5">
              {PRESET_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    selectedPreset === reason
                      ? 'border-rose-300 bg-rose-50/60 text-rose-900 font-semibold shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={selectedPreset === reason}
                    onChange={() => setSelectedPreset(reason)}
                    className="text-rose-600 focus:ring-rose-500 w-3.5 h-3.5"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5 uppercase tracking-wider">
              Or Custom Explanation (Optional):
            </label>
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Bun delivery delayed 30 mins, sorry!"
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all placeholder:text-stone-400"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
            >
              Reject & Void Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
