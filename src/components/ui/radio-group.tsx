'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Circle } from 'lucide-react';

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (val: string) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, defaultValue, onValueChange, name, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || '');
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleValueChange = React.useCallback(
      (val: string) => {
        if (!isControlled) {
          setInternalValue(val);
        }
        onValueChange?.(val);
      },
      [isControlled, onValueChange]
    );

    return (
      <RadioGroupContext.Provider
        value={{ value: currentValue, onValueChange: handleValueChange, name }}
      >
        <div
          role="radiogroup"
          ref={ref}
          className={cn('grid gap-2', className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = 'RadioGroup';

interface RadioGroupItemProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const checked = context.value === value;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        data-state={checked ? 'checked' : 'unchecked'}
        onClick={() => context.onValueChange?.(value)}
        className={cn(
          'aspect-square h-4 w-4 rounded-full border border-stone-300 text-amber-600 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors flex items-center justify-center',
          checked && 'border-amber-600 bg-amber-600 text-white',
          className
        )}
        {...props}
      >
        {checked && <Circle className="h-2 w-2 fill-current text-current" />}
      </button>
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';
