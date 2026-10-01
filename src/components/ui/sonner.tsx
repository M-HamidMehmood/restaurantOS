'use client';

import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-stone-900 group-[.toaster]:text-white group-[.toaster]:border-stone-800 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl group-[.toaster]:p-3.5',
          description: 'group-[.toast]:text-stone-300',
          actionButton:
            'group-[.toast]:bg-amber-600 group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-stone-800 group-[.toast]:text-stone-200',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
