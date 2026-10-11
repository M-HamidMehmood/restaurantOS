'use client';

import React from 'react';
import Link from 'next/link';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { QrCode, ArrowLeft, Lock } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

export default function TableQrSetupPage() {
  const { isSuperAdmin, isLoading, signOut } = useAdminAuth();

  if (!isLoading && !isSuperAdmin) {
    return (
      <div className="flex w-full min-h-screen bg-stone-100">
        <AdminSidebar activeOrdersCount={0} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 p-8 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900">Super Admin Access Required</h2>
              <p className="text-xs text-stone-500 mt-1">
                Table QR Code Provisioning & Slug setup is restricted to Super Admin managers. Your current session has Operations Admin privileges.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/admin"
                className="w-full py-2.5 px-4 bg-stone-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all"
              >
                Go to Operations Live Feed
              </Link>
              <Link
                href="/admin/floor"
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all"
              >
                Go to Floor & Billing
              </Link>
              <button
                onClick={signOut}
                className="w-full py-2 px-4 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
              >
                Sign in with Super Admin Account
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
