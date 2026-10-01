'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Receipt, Sparkles, MapPin, Check } from 'lucide-react';
import { useMenuStore } from '@/store/useMenuStore';
import { restaurantInfo } from '@/data/menuData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const Header: React.FC = () => {
  const getFormattedTable = useMenuStore((state) => state.getFormattedTable);
  const setIsWaiterOpen = useMenuStore((state) => state.setIsWaiterOpen);
  const setIsBillOpen = useMenuStore((state) => state.setIsBillOpen);
  const setIsTableOpen = useMenuStore((state) => state.setIsTableOpen);
  const isWaiterOnCooldown = useMenuStore((state) => state.isWaiterOnCooldown);
  const getWaiterRemainingSeconds = useMenuStore((state) => state.getWaiterRemainingSeconds);
  const isBillRequested = useMenuStore((state) => state.isBillRequested);

  // Live countdown timer state for 2-minute cooldown
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      setSecondsRemaining(getWaiterRemainingSeconds());
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [getWaiterRemainingSeconds]);

  const isCooldownActive = secondsRemaining > 0;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/80 sticky top-0 z-30 transition-all duration-200">
      <div className="max-w-2xl mx-auto px-4 py-3 sm:py-3.5">
        {/* Top Bar: Cafe branding & Table badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-xs shrink-0 font-serif font-bold text-lg">
              {restaurantInfo.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-serif font-bold text-stone-900 tracking-tight text-base sm:text-lg truncate">
                  {restaurantInfo.name}
                </h1>
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              </div>
              <p className="text-[11px] text-stone-500 truncate hidden xs:block">
                {restaurantInfo.tagline}
              </p>
            </div>
          </div>

          {/* Current Table Badge (shadcn Badge trigger) */}
          <Badge
            variant="default"
            onClick={() => setIsTableOpen(true)}
            className="cursor-pointer hover:bg-stone-800 transition-all py-1 px-3 gap-1.5 text-xs font-semibold shadow-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="tracking-wide">{getFormattedTable()}</span>
          </Badge>
        </div>

        {/* Quick Action Buttons with 2-Minute Anti-Spam Cooldown & Bill Status */}
        <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-stone-100">
          {/* Call Waiter Button */}
          <Button
            type="button"
            variant={isCooldownActive ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsWaiterOpen(true)}
            disabled={isCooldownActive}
            className="relative font-bold text-xs h-9 justify-center gap-1.5"
          >
            <Bell
              className={`w-3.5 h-3.5 ${
                isCooldownActive ? 'text-stone-400' : 'text-amber-600'
              }`}
            />
            {isCooldownActive ? (
              <span className="tabular-nums text-stone-500">
                Alerted ({Math.floor(secondsRemaining / 60)}:
                {(secondsRemaining % 60).toString().padStart(2, '0')})
              </span>
            ) : (
              <span>Call Waiter</span>
            )}
          </Button>

          {/* Request Bill Button */}
          <Button
            type="button"
            variant={isBillRequested ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsBillOpen(true)}
            className={`relative font-bold text-xs h-9 justify-center gap-1.5 ${
              isBillRequested ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
            }`}
          >
            {isBillRequested ? (
              <Check className="w-3.5 h-3.5 text-white" />
            ) : (
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{isBillRequested ? 'Bill Requested' : 'Request Bill'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
