import React, { Suspense } from 'react';
import { MenuInterface } from '@/components/MenuInterface';
import { TableInitializer } from '@/components/TableInitializer';

interface TablePageProps {
  params: Promise<{
    tableId: string;
  }>;
}

export default async function TablePage({ params }: TablePageProps) {
  const resolvedParams = await params;
  const rawTableId = decodeURIComponent(resolvedParams.tableId || 'T-04');

  return (
    <Suspense fallback={<TableLoading />}>
      <TableInitializer tableId={rawTableId} />
      <MenuInterface />
    </Suspense>
  );
}

function TableLoading() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-3 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-stone-600">Connecting to table...</p>
      </div>
    </div>
  );
}
