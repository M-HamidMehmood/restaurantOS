import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[70px] w-full rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500/40 focus-visible:border-amber-500 focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
