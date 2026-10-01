import React, { Suspense } from 'react';
import { MenuInterface } from '@/components/MenuInterface';
import { TableInitializer } from '@/components/TableInitializer';

interface MenuPageProps {
  searchParams: Promise<{
    table?: string;
  }>;
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const resolvedSearchParams = await searchParams;
  const tableParam = resolvedSearchParams.table
    ? decodeURIComponent(resolvedSearchParams.table)
    : undefined;

  return (
    <Suspense fallback={<MenuLoading />}>
      <TableInitializer tableId={tableParam} />
      <MenuInterface />
    </Suspense>
  );
}

function MenuLoading() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-stone-600">Loading Pakistani cafe menu...</p>
      </div>
    </div>
  );
}
