import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export const metadata = {
  title: 'Chaska & Chai | Admin & Operations Portal',
  description: 'Live order intake, kitchen ticketing, floor status, and unified operations.',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-stone-100 flex text-stone-900 antialiased font-sans">
        <Toaster richColors position="top-right" />
        {children}
      </div>
    </AdminAuthProvider>
  );
}
