import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500/30',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-stone-900 text-white shadow-2xs hover:bg-stone-800',
        secondary:
          'border-transparent bg-stone-100 text-stone-900 hover:bg-stone-200/80',
        destructive:
          'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
        outline:
          'border-stone-200 text-stone-700 bg-white shadow-2xs',
        amber:
          'border-amber-200/80 bg-amber-50 text-amber-900 font-bold',
        emerald:
          'border-emerald-200/80 bg-emerald-50 text-emerald-900 font-bold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
