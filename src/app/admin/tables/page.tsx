'use client';

import React from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { QrCode, ArrowLeft } from 'lucide-react';

export default function TableQrSetupPage() {
  return (
    <div className="flex w-full min-h-screen">
      <AdminSidebar activeOrdersCount={0} />
      <main className="flex-1 bg-stone-100 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-white border border-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-stone-900">Table QR Code Provisioning</h1>
              <p className="text-xs text-stone-500 font-medium">
                Generate high-resolution QR printable stands and unique dining session slugs.
              </p>
            </div>
          </div>

          <div className="p-10 bg-white rounded-3xl border border-stone-200 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <QrCode className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-stone-900">Table QR Provisioning Ready</h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto">
              Tables (T-01 through T-08) generate direct URLs like <code className="bg-stone-100 px-1.5 py-0.5 rounded-sm text-stone-800">/table/T-04</code> and <code className="bg-stone-100 px-1.5 py-0.5 rounded-sm text-stone-800">/menu?table=T-04</code>.
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                Back to Live Kitchen Feed
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
