import React from 'react';

interface DietaryBadgeProps {
  isVegetarian: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: 0 | 1 | 2 | 3;
  className?: string;
}

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({
  isVegetarian,
  isVegan,
  isGlutenFree,
  spicyLevel = 0,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* Standard Indian/International Culinary Veg / Non-Veg Icon */}
      {isVegetarian ? (
        <span
          title="Vegetarian"
          aria-label="Vegetarian item"
          className="inline-flex items-center justify-center w-4 h-4 border border-emerald-600 rounded-[3px] bg-emerald-50/80 p-[2px] shadow-2xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
        </span>
      ) : (
        <span
          title="Non-Vegetarian"
          aria-label="Non-Vegetarian item"
          className="inline-flex items-center justify-center w-4 h-4 border border-rose-600 rounded-[3px] bg-rose-50/80 p-[2px] shadow-2xs"
        >
          <span className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-rose-600"></span>
        </span>
      )}

      {/* Additional friendly chips */}
      {isVegan && (
        <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-green-100 text-green-800">
          Vegan
        </span>
      )}

      {isGlutenFree && (
        <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
          GF
        </span>
      )}

      {spicyLevel > 0 && (
        <span
          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-0.5"
          title={`Spicy Level: ${spicyLevel}/3`}
        >
          {'🌶️'.repeat(spicyLevel)}
        </span>
      )}
    </div>
  );
};
