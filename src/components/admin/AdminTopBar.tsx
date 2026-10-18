'use client';

import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  Power,
  Volume2,
  VolumeX,
  BellRing,
  Kanban,
  List,
  RefreshCw,
  Flame,
  CheckCircle2,
  ShieldCheck,
  Shield,
} from 'lucide-react';
import { stopContinuousAlert, subscribeToAlertState } from '@/lib/sound';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface AdminTopBarProps {
  isOnline: boolean;
  onToggleOnline: () => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  activeOrdersCount: number;
  viewMode: 'kanban' | 'list';
  onChangeViewMode: (mode: 'kanban' | 'list') => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function AdminTopBar({
  isOnline,
  onToggleOnline,
  connectionStatus,
  activeOrdersCount,
  viewMode,
  onChangeViewMode,
  soundMuted,
  onToggleSound,
  onRefresh,
  isLoading,
}: AdminTopBarProps) {
  const { user, isSuperAdmin } = useAdminAuth();
  const isWsConnected = connectionStatus === 'connected';

  const [isAlertRinging, setIsAlertRinging] = useState(false);
  const [alertRemainingSec, setAlertRemainingSec] = useState(0);

  useEffect(() => {
    return subscribeToAlertState((ringing, remainingSec) => {
      setIsAlertRinging(ringing);
      setAlertRemainingSec(remainingSec);
    });
  }, []);

  return (
    <header className="no-print bg-white border-b border-stone-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-2xs">
      {/* Left: View Mode Toggle & Active Order Count */}
      <div className="flex items-center gap-3">
        {/* Kanban vs List View Toggle */}
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80">
          <button
            onClick={() => onChangeViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5 text-amber-500" />
            <span>Kanban</span>
          </button>

          <button
            onClick={() => onChangeViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-amber-500" />
            <span>Compact List</span>
          </button>
        </div>

        {/* Total Active Orders Count Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200/80 text-amber-950 font-black text-xs">
          <Flame className="w-4 h-4 text-amber-600 fill-current animate-pulse" />
          <span>{activeOrdersCount} Active {activeOrdersCount === 1 ? 'Order' : 'Orders'}</span>
        </div>

        {/* Manual Refresh */}
        <button
          onClick={onRefresh}
          title="Refresh Orders"
          disabled={isLoading}
          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Right: Sound Alert, WebSocket Status, and Online/Offline Toggle */}
      <div className="flex items-center gap-3">
        {/* Continuous Ringing Alarm Indicator & Silence Button */}
        {isAlertRinging && (
          <button
            onClick={() => stopContinuousAlert()}
            title="Continuous alert is ringing for portal attention. Click to silence."
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black animate-pulse shadow-md transition-all active:scale-95"
          >
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
            <span>Silence Sound ({alertRemainingSec}s)</span>
          </button>
        )}

        {/* Sound Chime Toggle */}
        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-1.5 py-1">
          <button
            onClick={onToggleSound}
            title={soundMuted ? 'Unmute Chime Alerts' : 'Mute Chime Alerts'}
            className="p-1 text-stone-600 hover:text-stone-900 transition-colors"
          >
            {soundMuted ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-600" />
            )}
          </button>
        </div>

        {/* WebSocket Connection Status Indicator */}
        <div
          title={
            isWsConnected
              ? 'Real-Time WebSockets Active (Supabase Realtime + Fastify SSE)'
              : 'Connecting to Real-time Stream...'
          }
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
            isWsConnected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <span className="relative flex h-2.5 w-2.5">
            {isWsConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isWsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
          </span>
          <span className="hidden md:inline font-bold">
            {isWsConnected ? 'Stream Active' : 'Connecting...'}
          </span>
        </div>

        {/* Restaurant Online/Offline Toggle */}
        <button
          onClick={onToggleOnline}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 ${
            isOnline
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-stone-300 hover:bg-stone-400 text-stone-800'
          }`}
        >
          <Power className="w-3.5 h-3.5 stroke-[3]" />
          <span>{isOnline ? 'Online (Accepting Orders)' : 'Kitchen Paused (Offline)'}</span>
        </button>

        {/* User Role Badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-stone-200">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
                isSuperAdmin
                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                  : 'bg-emerald-50 text-emerald-900 border-emerald-200'
              }`}
            >
              {isSuperAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>{isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
