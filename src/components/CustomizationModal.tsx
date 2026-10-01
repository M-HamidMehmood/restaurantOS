'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Sparkles,
  Plus,
  Minus,
  Check,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DietaryBadge } from './DietaryBadge';
import { useMenuStore } from '@/store/useMenuStore';
import { restaurantInfo } from '@/data/menuData';
import { SelectedModifier, ModifierOption } from '@/types/menu';

export const CustomizationModal: React.FC = () => {
  const isCustomizationOpen = useMenuStore((state) => state.isCustomizationOpen);
  const customizingItem = useMenuStore((state) => state.customizingItem);
  const closeCustomization = useMenuStore((state) => state.closeCustomization);
  const addCustomizedItemToCart = useMenuStore((state) => state.addCustomizedItemToCart);

  // Local state for selected modifiers: map of groupId -> optionId[]
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Initialize defaults whenever customizingItem changes
  useEffect(() => {
    if (!customizingItem) {
      setSelections({});
      setSpecialNotes('');
      setQuantity(1);
      setValidationError(null);
      setImageError(false);
      return;
    }

    const initialSelections: Record<string, string[]> = {};
    if (customizingItem.modifierGroups) {
      customizingItem.modifierGroups.forEach((group) => {
        if (group.maxSelect === 1) {
          // Find default option or pick first if required
          const defaultOpt = group.options.find((opt) => opt.isDefault) || (group.minSelect >= 1 ? group.options[0] : null);
          if (defaultOpt) {
            initialSelections[group.id] = [defaultOpt.id];
          } else {
            initialSelections[group.id] = [];
          }
        } else {
          // Multi-select checkboxes: include any option with isDefault
          const defaultOpts = group.options.filter((opt) => opt.isDefault).map((opt) => opt.id);
          initialSelections[group.id] = defaultOpts;
        }
      });
    }

    setSelections(initialSelections);
    setSpecialNotes('');
    setQuantity(1);
    setValidationError(null);
    setImageError(false);
  }, [customizingItem]);

  // Handle single-select (radio) change
  const handleSingleSelect = (groupId: string, optionId: string) => {
    setSelections((prev) => ({
      ...prev,
      [groupId]: [optionId],
    }));
    setValidationError(null);
  };

  // Handle multi-select (checkbox) toggle
  const handleMultiToggle = (groupId: string, optionId: string, maxSelect: number) => {
    setSelections((prev) => {
      const current = prev[groupId] || [];
      const isSelected = current.includes(optionId);
      if (isSelected) {
        return {
          ...prev,
          [groupId]: current.filter((id) => id !== optionId),
        };
      } else {
        if (current.length >= maxSelect) {
          return prev; // Reached maximum allowed
        }
        return {
          ...prev,
          [groupId]: [...current, optionId],
        };
      }
    });
    setValidationError(null);
  };

  // Flatten current selections into SelectedModifier objects
  const selectedModifiersList = useMemo<SelectedModifier[]>(() => {
    if (!customizingItem || !customizingItem.modifierGroups) return [];
    const list: SelectedModifier[] = [];

    customizingItem.modifierGroups.forEach((group) => {
      const selectedOptionIds = selections[group.id] || [];
      selectedOptionIds.forEach((optId) => {
        const option = group.options.find((o) => o.id === optId);
        if (option) {
          list.push({
            groupId: group.id,
            groupName: group.name,
            optionId: option.id,
            optionName: option.name,
            price: option.price,
          });
        }
      });
    });

    return list;
  }, [customizingItem, selections]);

  // Dynamic pricing calculations
  const basePrice = customizingItem ? customizingItem.price : 0;
  const modifiersPriceTotal = useMemo(() => {
    return selectedModifiersList.reduce((sum, mod) => sum + mod.price, 0);
  }, [selectedModifiersList]);

  const unitPrice = basePrice + modifiersPriceTotal;
  const grandTotal = unitPrice * quantity;

  // Validation: Check that all required modifier groups have at least minSelect items
  const isFormValid = useMemo(() => {
    if (!customizingItem || !customizingItem.modifierGroups) return true;
    for (const group of customizingItem.modifierGroups) {
      const selectedCount = (selections[group.id] || []).length;
      if (group.minSelect > 0 && selectedCount < group.minSelect) {
        return false;
      }
    }
    return true;
  }, [customizingItem, selections]);

  const handleAddToCart = () => {
    if (!customizingItem) return;

    // Check required groups
    if (customizingItem.modifierGroups) {
      for (const group of customizingItem.modifierGroups) {
        const count = (selections[group.id] || []).length;
        if (group.minSelect > 0 && count < group.minSelect) {
          setValidationError(`Please select an option for "${group.name}".`);
          return;
        }
      }
    }

    addCustomizedItemToCart(
      customizingItem,
      selectedModifiersList,
      specialNotes,
      quantity
    );
  };

  if (!customizingItem) return null;

  return (
    <Dialog open={isCustomizationOpen} onOpenChange={(open) => !open && closeCustomization()}>
      <DialogContent className="max-w-md w-full p-0 max-h-[92vh] flex flex-col rounded-3xl overflow-hidden border border-stone-200 shadow-2xl">
        {/* Header Hero Image & Dish Summary */}
        <div className="relative w-full h-44 sm:h-48 bg-stone-900 shrink-0">
          {imageError ? (
            <div className="w-full h-full bg-gradient-to-br from-amber-600 to-stone-900 flex flex-col items-center justify-center p-4 text-center text-white">
              <span className="font-serif text-3xl font-bold">{customizingItem.name.charAt(0)}</span>
              <span className="text-sm font-semibold mt-1">{customizingItem.name}</span>
            </div>
          ) : (
            <Image
              src={customizingItem.image}
              alt={customizingItem.name}
              fill
              className="object-cover opacity-90"
              onError={() => setImageError(true)}
              priority
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          {/* Dish details overlaid at bottom of hero */}
          <div className="absolute bottom-3 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <DietaryBadge
                isVegetarian={customizingItem.isVegetarian}
                isVegan={customizingItem.isVegan}
                isGlutenFree={customizingItem.isGlutenFree}
                spicyLevel={customizingItem.spicyLevel}
              />
              {customizingItem.isBestseller && (
                <Badge variant="amber" className="text-[10px] py-0 px-2">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  Bestseller
                </Badge>
              )}
            </div>

            <DialogHeader className="p-0 text-left">
              <DialogTitle className="text-lg font-bold text-white leading-tight">
                Customize {customizingItem.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-300 line-clamp-1 mt-0.5">
                {customizingItem.description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        {/* Scrollable Modifiers Selection Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Base Price Banner */}
          <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/70 px-3.5 py-2 rounded-xl text-xs">
            <span className="text-amber-900 font-medium">Base Dish Price:</span>
            <span className="text-amber-900 font-bold text-sm">
              {restaurantInfo.currencySymbol}
              {basePrice.toFixed(0)}
            </span>
          </div>

          {/* Validation Alert */}
          {validationError && (
            <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Modifier Groups */}
          {customizingItem.modifierGroups && customizingItem.modifierGroups.length > 0 ? (
            customizingItem.modifierGroups.map((group) => {
              const isRequired = group.minSelect >= 1;
              const isRadio = group.maxSelect === 1;
              const selectedIds = selections[group.id] || [];

              return (
                <div
                  key={group.id}
                  className="space-y-2.5 pt-1 border-b border-stone-100 pb-4 last:border-b-0"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{group.name}</span>
                        {isRequired ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-normal text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded-md">
                            Optional
                          </span>
                        )}
                      </h4>
                      {group.description && (
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {group.description}
                        </p>
                      )}
                    </div>

                    <span className="text-[11px] font-medium text-stone-400">
                      {isRadio ? 'Choose 1' : `Up to ${group.maxSelect}`}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="grid grid-cols-1 gap-2">
                    {group.options.map((opt: ModifierOption) => {
                      const isSelected = selectedIds.includes(opt.id);

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            if (isRadio) {
                              handleSingleSelect(group.id, opt.id);
                            } else {
                              handleMultiToggle(group.id, opt.id, group.maxSelect);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                              : 'border-stone-200/80 bg-white hover:border-amber-200 hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            {/* Radio vs Checkbox indicator */}
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                                isRadio
                                  ? isSelected
                                    ? 'border-amber-600 bg-amber-600 text-white'
                                    : 'border-stone-300 bg-white'
                                  : isSelected
                                  ? 'rounded-md border-amber-600 bg-amber-600 text-white'
                                  : 'rounded-md border-stone-300 bg-white'
                              }`}
                            >
                              {isSelected && (
                                isRadio ? (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                ) : (
                                  <Check className="w-3 h-3 stroke-[3]" />
                                )
                              )}
                            </div>

                            <span
                              className={`text-xs font-semibold leading-tight ${
                                isSelected ? 'text-amber-950 font-bold' : 'text-stone-800'
                              }`}
                            >
                              {opt.name}
                            </span>
                          </div>

                          {/* Price Tag */}
                          <span
                            className={`text-xs font-bold shrink-0 tabular-nums ${
                              opt.price > 0
                                ? isSelected
                                  ? 'text-amber-700'
                                  : 'text-stone-700'
                                : 'text-stone-400 font-normal'
                            }`}
                          >
                            {opt.price > 0
                              ? `+${restaurantInfo.currencySymbol}${opt.price}`
                              : 'Free'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-xs text-stone-500">
              No special modifiers available for this dish.
            </div>
          )}

          {/* Special Preparation Notes */}
          <div className="space-y-1.5 pt-2">
            <label
              htmlFor="special-preparation-notes"
              className="block text-xs font-bold text-stone-900 uppercase tracking-wider"
            >
              Special Preparation Notes
            </label>
            <Textarea
              id="special-preparation-notes"
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              placeholder="e.g. No onions, crispy paratha, raita on the side..."
              className="text-xs resize-none h-18 rounded-xl"
              maxLength={150}
            />
            <p className="text-[10px] text-stone-400 text-right">
              {specialNotes.length}/150 characters
            </p>
          </div>
        </div>

        {/* Dynamic Total & Add to Cart Sticky Footer */}
        <div className="p-4 bg-stone-50/95 border-t border-stone-200/80 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="w-7 h-7 p-0 text-stone-600 disabled:opacity-30"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-bold w-5 text-center tabular-nums">
                {quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
                className="w-7 h-7 p-0 text-stone-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Price Breakdown */}
            <div className="text-right">
              <span className="block text-[11px] text-stone-500">
                {quantity > 1 ? `${quantity} × ` : ''}
                {restaurantInfo.currencySymbol}
                {unitPrice.toFixed(0)}
              </span>
              <span className="text-base font-extrabold text-stone-900 tracking-tight">
                {restaurantInfo.currencySymbol}
                {grandTotal.toFixed(0)}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <Button
            type="button"
            variant="primary"
            onClick={handleAddToCart}
            disabled={!isFormValid}
            className="w-full py-3 h-11 rounded-xl text-xs sm:text-sm font-bold shadow-md gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              Add to Order • {restaurantInfo.currencySymbol}
              {grandTotal.toFixed(0)}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
