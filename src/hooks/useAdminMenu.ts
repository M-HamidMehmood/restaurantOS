'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  AdminCategory,
  AdminMenuItem,
  MenuCatalogStats,
  AdminModifierGroup,
} from '@/types/admin';
import { getSupabaseClient } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function useAdminMenu() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [stats, setStats] = useState<MenuCatalogStats>({
    totalItems: 0,
    inStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Keep a ref to items to allow fast updates inside callbacks
  const itemsRef = useRef<AdminMenuItem[]>([]);
  itemsRef.current = items;

  // 1. Fetch full menu catalog
  const fetchMenuCatalog = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/menu/all`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        throw new Error(`Failed to load menu: HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data.categories || []);
        setItems(json.data.items || []);
        setStats(
          json.data.stats || {
            totalItems: (json.data.items || []).length,
            inStockCount: (json.data.items || []).filter((i: any) => i.isAvailable).length,
            outOfStockCount: (json.data.items || []).filter((i: any) => !i.isAvailable).length,
            categoriesCount: (json.data.categories || []).length,
          }
        );
      }
    } catch (err: any) {
      console.error('Failed to fetch admin menu catalog:', err);
      if (!quiet) {
        toast.error('Could not load menu catalog from server');
      }
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuCatalog();
  }, [fetchMenuCatalog]);

  // 2. Realtime listener: Supabase Realtime & SSE for instant multi-terminal sync
  useEffect(() => {
    let sse: EventSource | null = null;
    try {
      sse = new EventSource(`${API_BASE}/admin/stream`);
      sse.addEventListener('menu:item_toggled', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const { itemId, isAvailable, name } = payload;
          setItems((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, isAvailable } : it))
          );
          setStats((prev) => {
            const currentItem = itemsRef.current.find((it) => it.id === itemId);
            if (!currentItem || currentItem.isAvailable === isAvailable) return prev;
            return {
              ...prev,
              inStockCount: isAvailable ? prev.inStockCount + 1 : prev.inStockCount - 1,
              outOfStockCount: isAvailable ? prev.outOfStockCount - 1 : prev.outOfStockCount + 1,
            };
          });
        } catch (err) {
          console.error('SSE menu parse error:', err);
        }
      });
    } catch (err) {
      console.warn('SSE subscription failed for menu:', err);
    }

    // Supabase Realtime fallback
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('pos_menu_sync')
      .on('broadcast', { event: 'menu:item_toggled' }, (payload: any) => {
        const { itemId, isAvailable } = payload?.payload || {};
        if (itemId !== undefined) {
          setItems((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, isAvailable } : it))
          );
        }
      })
      .subscribe();

    return () => {
      if (sse) sse.close();
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Fast "86" Switch Toggle (Optimistic Update)
  const toggleItemAvailability = useCallback(
    async (itemId: string, currentState: boolean) => {
      const nextState = !currentState;
      const targetItem = items.find((i) => i.id === itemId);
      const itemName = targetItem ? targetItem.name : 'Item';

      // Optimistic update
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, isAvailable: nextState } : it))
      );
      setStats((prev) => ({
        ...prev,
        inStockCount: nextState ? prev.inStockCount + 1 : prev.inStockCount - 1,
        outOfStockCount: nextState ? prev.outOfStockCount - 1 : prev.outOfStockCount + 1,
      }));

      try {
        const res = await fetch(`${API_BASE}/admin/menu/${itemId}/toggle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isAvailable: nextState }),
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (nextState) {
          toast.success(`"${itemName}" is now In Stock`, {
            description: 'Available for diners on QR menu',
          });
        } else {
          toast.warning(`"${itemName}" is now 86'd (Out of Stock)`, {
            description: 'Instantly greyed out on customer mobile menus',
          });
        }
      } catch (err: any) {
        // Rollback
        setItems((prev) =>
          prev.map((it) => (it.id === itemId ? { ...it, isAvailable: currentState } : it))
        );
        setStats((prev) => ({
          ...prev,
          inStockCount: currentState ? prev.inStockCount + 1 : prev.inStockCount - 1,
          outOfStockCount: currentState ? prev.outOfStockCount - 1 : prev.outOfStockCount + 1,
        }));
        toast.error(`Failed to toggle "${itemName}"`, {
          description: err.message || 'Please check network connection',
        });
      }
    },
    [items]
  );

  // 4. Save Item (Create or Update)
  const saveItem = useCallback(
    async (
      itemData: {
        name: string;
        categoryId: string;
        basePrice: number;
        description?: string;
        imageUrl?: string;
        isVegetarian?: boolean;
        isBestseller?: boolean;
        isChefSpecial?: boolean;
        spicyLevel?: number;
        preparationTime?: string;
        isAvailable?: boolean;
        modifierGroups?: AdminModifierGroup[];
      },
      itemId?: string
    ) => {
      setIsSaving(true);
      try {
        const isEdit = Boolean(itemId);
        const url = isEdit
          ? `${API_BASE}/admin/menu/items/${itemId}`
          : `${API_BASE}/admin/menu/items`;
        const method = isEdit ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP ${res.status}`);
        }

        const json = await res.json();
        const savedItem = json.data;

        if (isEdit) {
          setItems((prev) =>
            prev.map((it) => (it.id === itemId ? { ...it, ...savedItem } : it))
          );
          toast.success(`Dish "${savedItem.name}" updated successfully`);
        } else {
          setItems((prev) => [savedItem, ...prev]);
          setStats((prev) => ({
            ...prev,
            totalItems: prev.totalItems + 1,
            inStockCount: savedItem.isAvailable ? prev.inStockCount + 1 : prev.inStockCount,
            outOfStockCount: savedItem.isAvailable ? prev.outOfStockCount : prev.outOfStockCount + 1,
          }));
          toast.success(`New dish "${savedItem.name}" created`);
        }

        return savedItem;
      } catch (err: any) {
        console.error('Error saving menu item:', err);
        toast.error('Failed to save menu item', {
          description: err.message || 'Validation or server error',
        });
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // 5. Delete Item
  const deleteItem = useCallback(async (itemId: string) => {
    const itemToDelete = items.find((i) => i.id === itemId);
    const itemName = itemToDelete ? itemToDelete.name : 'Dish';

    try {
      const res = await fetch(`${API_BASE}/admin/menu/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setStats((prev) => {
        const wasInStock = itemToDelete ? itemToDelete.isAvailable : true;
        return {
          ...prev,
          totalItems: prev.totalItems - 1,
          inStockCount: wasInStock ? prev.inStockCount - 1 : prev.inStockCount,
          outOfStockCount: wasInStock ? prev.outOfStockCount : prev.outOfStockCount - 1,
        };
      });

      toast.success(`Dish "${itemName}" deleted`);
      return true;
    } catch (err: any) {
      console.error('Error deleting menu item:', err);
      toast.error(`Failed to delete "${itemName}"`, {
        description: err.message || 'Server error',
      });
      throw err;
    }
  }, [items]);

  // 6. Save Category (Create or Edit)
  const saveCategory = useCallback(
    async (
      catData: {
        name: string;
        icon?: string;
        badge?: string;
        sortOrder?: number;
        isActive?: boolean;
      },
      catId?: string
    ) => {
      setIsSaving(true);
      try {
        const isEdit = Boolean(catId);
        const url = isEdit
          ? `${API_BASE}/admin/menu/categories/${catId}`
          : `${API_BASE}/admin/menu/categories`;
        const method = isEdit ? 'PATCH' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(catData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP ${res.status}`);
        }

        const json = await res.json();
        const savedCat = json.data;

        if (isEdit) {
          setCategories((prev) =>
            prev.map((c) => (c.id === catId ? { ...c, ...savedCat } : c))
          );
          toast.success(`Category "${savedCat.name}" updated`);
        } else {
          setCategories((prev) => [...prev, savedCat]);
          setStats((prev) => ({
            ...prev,
            categoriesCount: prev.categoriesCount + 1,
          }));
          toast.success(`Category "${savedCat.name}" created`);
        }

        return savedCat;
      } catch (err: any) {
        console.error('Error saving category:', err);
        toast.error('Failed to save category', {
          description: err.message,
        });
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  // 7. Delete Category
  const deleteCategory = useCallback(async (catId: string) => {
    const catToDelete = categories.find((c) => c.id === catId);
    const catName = catToDelete ? catToDelete.name : 'Category';

    try {
      const res = await fetch(`${API_BASE}/admin/menu/categories/${catId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || `HTTP ${res.status}`);
      }

      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setStats((prev) => ({
        ...prev,
        categoriesCount: prev.categoriesCount - 1,
      }));
      toast.success(`Category "${catName}" deleted`);
      return true;
    } catch (err: any) {
      console.error('Error deleting category:', err);
      toast.error(`Cannot delete category "${catName}"`, {
        description: err.message,
      });
      throw err;
    }
  }, [categories]);

  // 8. Reorder Categories
  const reorderCategories = useCallback(
    async (reorderedList: Array<{ id: string; sortOrder: number }>) => {
      // Optimistic update
      const map = new Map(reorderedList.map((r) => [r.id, r.sortOrder]));
      setCategories((prev) =>
        [...prev]
          .map((c) => ({
            ...c,
            sortOrder: map.has(c.id) ? map.get(c.id)! : c.sortOrder,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );

      try {
        const res = await fetch(`${API_BASE}/admin/menu/categories/reorder`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: reorderedList }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (json.data) {
          setCategories(json.data);
        }
        toast.success('Category order updated');
      } catch (err: any) {
        console.error('Failed to reorder categories:', err);
        toast.error('Failed to update category order');
        fetchMenuCatalog(true);
      }
    },
    [fetchMenuCatalog]
  );

  return {
    categories,
    items,
    stats,
    isLoading,
    isSaving,
    fetchMenuCatalog,
    toggleItemAvailability,
    saveItem,
    deleteItem,
    saveCategory,
    deleteCategory,
    reorderCategories,
  };
}
