import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] cursor-pointer select-none',
  {
    variants: {
      variant: {
        default:
          'bg-stone-900 text-white shadow-xs hover:bg-stone-800 active:bg-stone-950',
        primary:
          'bg-amber-600 text-white shadow-xs hover:bg-amber-700 active:bg-amber-800',
        destructive:
          'bg-red-600 text-white shadow-xs hover:bg-red-700 active:bg-red-800',
        outline:
          'border border-stone-200 bg-white hover:bg-stone-100 hover:text-stone-900 text-stone-700 shadow-2xs',
        secondary:
          'bg-stone-100 text-stone-900 hover:bg-stone-200/80 active:bg-stone-200',
        ghost:
          'hover:bg-stone-100 hover:text-stone-900 text-stone-600',
        link:
          'text-amber-700 underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-2xl px-6 text-base',
        icon: 'h-9 w-9 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
