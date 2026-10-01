'use client';

import { useEffect } from 'react';
import { useMenuStore } from '@/store/useMenuStore';

export function TableInitializer({ tableId }: { tableId?: string }) {
  const setTableId = useMenuStore((state) => state.setTableId);

  useEffect(() => {
    if (tableId && tableId.trim().length > 0) {
      setTableId(tableId.trim());
    }
  }, [tableId, setTableId]);

  return null;
}
