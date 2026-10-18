'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  LayoutGrid,
  UtensilsCrossed,
  QrCode,
  Flame,
  ChevronRight,
  ShieldCheck,
  Shield,
  Store,
  Lock,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface AdminSidebarProps {
  activeOrdersCount?: number;
}

export function AdminSidebar({ activeOrdersCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, isSuperAdmin, signOut } = useAdminAuth();

  // Collapsible sidebar state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    } catch {
      // Ignore localStorage access failures
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('admin_sidebar_collapsed', String(next));
      } catch {
        // Ignore localStorage access failures
      }
      return next;
    });
  };

  const navLinks = [
    {
      label: 'Live Orders',
      href: '/admin',
      icon: Activity,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
      description: 'Active kitchen orders',
      superAdminOnly: false,
    },
    {
      label: 'Floor & Billing',
      href: '/admin/floor',
      icon: LayoutGrid,
      description: 'Tables, POS & checkout',
      superAdminOnly: false,
    },
    {
      label: 'Menu Manager',
      href: '/admin/menu',
      icon: UtensilsCrossed,
      description: 'Stock availability & dishes',
      superAdminOnly: true,
    },
    {
      label: 'Table QR Setup',
      href: '/admin/tables',
      icon: QrCode,
      description: 'QR codes & table links',
      superAdminOnly: true,
    },
  ];

  return (
    <aside
      className={`no-print shrink-0 sticky top-0 h-screen bg-stone-900 text-stone-100 flex flex-col justify-between border-r border-stone-800 transition-[width] duration-200 ease-in-out z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Header & Branding */}
      <div className="shrink-0">
        <div className="p-3.5 border-b border-stone-800/80 flex items-center justify-between">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md font-black text-lg shrink-0">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div className="min-w-0 truncate">
                  <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight truncate">
                    Chaska & Chai
                  </h1>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <p className="text-[10px] font-semibold text-stone-400 truncate">Admin & Ops</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Minimize sidebar to expand workspace"
                aria-label="Minimize sidebar"
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors shrink-0 ml-1"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md font-black text-lg shrink-0 cursor-pointer"
                title="Chaska & Chai Cafe"
                onClick={toggleCollapsed}
              >
                <Flame className="w-5 h-5 fill-current" />
              </div>
              <button
                type="button"
                onClick={toggleCollapsed}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* User Role Card */}
        {user && (
          <div className="px-3 pt-2.5">
            {!isCollapsed ? (
              <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
                      isSuperAdmin
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isSuperAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {user.fullName}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                          isSuperAdmin ? 'bg-amber-500 text-white' : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {isSuperAdmin ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div
                  title={`${user.fullName} (${isSuperAdmin ? 'Super Admin' : 'Admin'})`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs cursor-default ${
                    isSuperAdmin
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isSuperAdmin ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Middle Navigation Section (Independently scrollable if screen is short) */}
      <nav className="flex-1 overflow-y-auto min-h-0 px-2 py-2 space-y-1 scrollbar-thin scrollbar-thumb-stone-800">
        {!isCollapsed && (
          <p className="px-2.5 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-stone-400">
            Operations Console
          </p>
        )}

        {navLinks.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === '/admin' && (pathname === '/admin' || pathname === '/admin/live'));

          const isLocked = item.superAdminOnly && !isSuperAdmin;
          const Icon = item.icon;

          if (isCollapsed) {
            return (
              <div key={item.label} className="flex justify-center py-0.5">
                <Link
                  href={item.href}
                  title={`${item.label}${isLocked ? ' (Locked: Super Admin only)' : ''}`}
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 font-bold'
                      : isLocked
                      ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/40 opacity-70'
                      : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />

                  {item.badge !== undefined && !isLocked && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center bg-amber-500 text-white shadow-xs border-2 border-stone-900">
                      {item.badge}
                    </span>
                  )}

                  {isLocked && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center text-amber-500/90 shadow-2xs">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  )}
                </Link>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold shadow-md shadow-amber-500/25 border border-amber-400/30'
                  : isLocked
                  ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/40 opacity-70'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? 'text-white stroke-[2.5]'
                      : isLocked
                      ? 'text-stone-600'
                      : 'text-stone-400'
                  }`}
                />
                <div className="min-w-0 truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="block leading-none truncate">{item.label}</span>
                    {isLocked && <Lock className="w-3 h-3 text-amber-500/80 shrink-0" />}
                  </div>
                  <span
                    className={`text-[10px] mt-0.5 block leading-none truncate ${
                      isActive
                        ? 'text-purple-100 font-medium'
                        : isLocked
                        ? 'text-stone-500'
                        : 'text-stone-400'
                    }`}
                  >
                    {isLocked ? 'Super Admin only' : item.description}
                  </span>
                </div>
              </div>

              {item.badge !== undefined && !isLocked && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight shrink-0 ${
                    isActive
                      ? 'bg-white text-stone-950'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {isLocked && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-stone-800 text-stone-400 border border-stone-700/50 shrink-0">
                  Locked
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer: Open QR Menu, Sign Out & Version Info (Pinned to bottom of viewport) */}
      <div className="shrink-0 p-3 border-t border-stone-800/80 space-y-2 bg-stone-900">
        {!isCollapsed ? (
          <>
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-between p-2 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-colors border border-stone-700/50"
            >
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">Customer QR Menu</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            </Link>

            {user && (
              <button
                type="button"
                onClick={signOut}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-bold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Sign Out ({user.email})</span>
              </button>
            )}

            <div className="flex items-center justify-between text-[10px] text-stone-400 px-1 font-medium pt-0.5">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                Fastify + Supabase
              </span>
              <span>RBAC v1.2</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/"
              target="_blank"
              title="Open Customer QR Menu"
              className="w-11 h-11 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-amber-400 flex items-center justify-center transition-colors border border-stone-700/50"
            >
              <Store className="w-5 h-5" />
            </Link>

            {user && (
              <button
                type="button"
                onClick={signOut}
                title={`Sign Out (${user.email})`}
                aria-label="Sign Out"
                className="w-11 h-11 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

            <div
              title="Fastify + Supabase (RBAC v1.2 Online)"
              className="w-2 h-2 rounded-full bg-emerald-400 mt-0.5 shadow-xs animate-pulse"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
