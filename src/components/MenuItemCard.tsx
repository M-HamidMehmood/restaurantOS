'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, Clock, Sparkles, Ban, SlidersHorizontal } from 'lucide-react';
import { MenuItem } from '@/types/menu';
import { DietaryBadge } from './DietaryBadge';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMenuStore } from '@/store/useMenuStore';
import { restaurantInfo } from '@/data/menuData';

interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const addToCart = useMenuStore((state) => state.addToCart);
  const removeFromCart = useMenuStore((state) => state.removeFromCart);
  const openCustomization = useMenuStore((state) => state.openCustomization);
  const quantity = useMenuStore((state) => state.getItemQuantity(item.id));
  const [imageError, setImageError] = useState(false);

  const hasModifiers = Boolean(item.modifierGroups && item.modifierGroups.length > 0);

  const handleCardClick = (e: React.MouseEvent) => {
    // If user clicked directly on a button or stepper, don't trigger card click
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;

    if (!item.isOutOfStock && hasModifiers) {
      openCustomization(item);
    }
  };

  const handleActionClick = () => {
    if (item.isOutOfStock) return;
    if (hasModifiers) {
      openCustomization(item);
    } else {
      addToCart(item);
    }
  };

  return (
    <Card
      data-item-id={item.id}
      onClick={handleCardClick}
      aria-label={`${item.name}, ${restaurantInfo.currencySymbol}${item.price.toFixed(0)}`}
      className={`group relative flex flex-col justify-between p-3 sm:p-4 border transition-all duration-200 ${
        item.isOutOfStock
          ? 'opacity-65 bg-stone-100/90 border-stone-200 select-none grayscale-[60%]'
          : 'border-stone-200/80 hover:border-amber-300 shadow-2xs hover:shadow-md cursor-pointer'
      }`}
    >
      <div className="flex gap-3 sm:gap-4">
        {/* Left Column: Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="space-y-1.5">
            {/* Top row: Dietary, Ribbons, Customizable Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <DietaryBadge
                isVegetarian={item.isVegetarian}
                isVegan={item.isVegan}
                isGlutenFree={item.isGlutenFree}
                spicyLevel={item.spicyLevel}
              />
              {item.isBestseller && !item.isOutOfStock && (
                <Badge variant="amber" className="text-[10px] py-0 px-2">
                  <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                  Bestseller
                </Badge>
              )}
              {item.isChefSpecial && !item.isOutOfStock && (
                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-bold text-purple-900 bg-purple-100">
                  Chef Special
                </Badge>
              )}
              {hasModifiers && !item.isOutOfStock && (
                <Badge variant="outline" className="text-[9px] py-0 px-1.5 text-stone-500 bg-stone-50 border-stone-200">
                  Customizable
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3
              className={`font-semibold text-sm sm:text-base leading-snug line-clamp-1 ${
                item.isOutOfStock ? 'text-stone-500 line-through' : 'text-stone-900 group-hover:text-amber-800 transition-colors'
              }`}
            >
              {item.name}
            </h3>

            {/* Description */}
            <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Price & Meta */}
          <div className="pt-2 flex items-center justify-between gap-2 mt-auto">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-stone-900 text-sm sm:text-base tracking-tight">
                {restaurantInfo.currencySymbol}
                {item.price.toFixed(0)}
              </span>
              {hasModifiers && (
                <span className="text-[10px] text-stone-400 font-normal">
                  base
                </span>
              )}
              {item.calories && (
                <span className="text-[11px] text-stone-400 font-normal">
                  • {item.calories} kcal
                </span>
              )}
            </div>

            {item.preparationTime && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-stone-400">
                <Clock className="w-3 h-3" />
                {item.preparationTime}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Image & Action */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100 border border-stone-100 shadow-2xs">
            {imageError ? (
              <div className="w-full h-full bg-gradient-to-br from-amber-50 via-stone-50 to-stone-100 flex flex-col items-center justify-center p-2 text-center text-stone-500">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-serif font-bold text-base mb-1 shadow-2xs">
                  {item.name.charAt(0)}
                </div>
                <span className="text-[10px] font-semibold text-stone-600 line-clamp-1">
                  {item.name}
                </span>
              </div>
            ) : (
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 96px, 112px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            )}

            {/* Out of Stock Overlay Ribbon */}
            {item.isOutOfStock && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-[1px] flex items-center justify-center p-1 text-center">
                <Badge variant="destructive" className="uppercase font-bold tracking-wider text-[9px] gap-1">
                  <Ban className="w-2.5 h-2.5" />
                  Unavailable
                </Badge>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="mt-2 w-full flex justify-center">
            {item.isOutOfStock ? (
              <Button
                variant="secondary"
                size="sm"
                disabled
                className="w-full text-xs font-semibold text-stone-400 cursor-not-allowed h-7"
              >
                Unavailable
              </Button>
            ) : hasModifiers ? (
              // For customizable items: opens customization modal
              quantity > 0 ? (
                <div className="flex items-center gap-1 w-full">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleActionClick}
                    className="w-full h-7 text-[11px] font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white shadow-2xs px-1.5"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>+{quantity} in Order</span>
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleActionClick}
                  aria-label={`Customize ${item.name} starting from ${restaurantInfo.currencySymbol}${item.price.toFixed(0)}`}
                  className="w-full h-7 text-xs font-bold gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Customize</span>
                </Button>
              )
            ) : quantity > 0 ? (
              // For non-customizable items: direct inline stepper
              <div className="flex items-center justify-between w-full bg-amber-600 text-white rounded-xl shadow-xs overflow-hidden py-0.5 px-1 transition-all h-7">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromCart(item.id)}
                  aria-label={`Decrease ${item.name}`}
                  className="w-5 h-5 p-0 text-white hover:bg-amber-700 hover:text-white"
                >
                  <Minus className="w-3 h-3" />
                </Button>
                <span className="text-xs font-bold px-1 tabular-nums">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addToCart(item)}
                  aria-label={`Increase ${item.name}`}
                  className="w-5 h-5 p-0 text-white hover:bg-amber-700 hover:text-white"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              // Simple direct add button
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleActionClick}
                aria-label={`Add ${item.name} for ${restaurantInfo.currencySymbol}${item.price.toFixed(0)}`}
                className="w-full h-7 text-xs font-bold gap-1 shadow-2xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
