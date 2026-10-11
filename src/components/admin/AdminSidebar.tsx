'use client';

import React from 'react';
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
  User,
} from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';

interface AdminSidebarProps {
  activeOrdersCount?: number;
}

export function AdminSidebar({ activeOrdersCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, role, isSuperAdmin, signOut } = useAdminAuth();

  const navLinks = [
    {
      label: 'Live Feed',
      href: '/admin',
      icon: Activity,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-950',
      description: 'Kitchen stream & tickets',
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
      description: 'Daily 86-stock & catalog',
      superAdminOnly: true,
    },
    {
      label: 'Table QR Setup',
      href: '/admin/tables',
      icon: QrCode,
      description: 'QR provisioning & slugs',
      superAdminOnly: true,
    },
  ];

  return (
    <aside className="no-print w-64 bg-stone-900 text-stone-100 flex flex-col justify-between shrink-0 border-r border-stone-800 min-h-screen">
      {/* Brand & Portal Header */}
      <div>
        <div className="p-5 border-b border-stone-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-md font-black text-lg">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white leading-tight">
                Chaska & Chai
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[11px] font-semibold text-stone-400">Admin & Operations</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Role Card */}
        {user && (
          <div className="mx-3 mt-3 p-3 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isSuperAdmin
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {isSuperAdmin ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {user.fullName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md ${
                      isSuperAdmin
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-stone-400">
            Operations Console
          </p>

          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/admin' && (pathname === '/admin' || pathname === '/admin/live'));

            const isLocked = item.superAdminOnly && !isSuperAdmin;
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : isLocked
                    ? 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/40 opacity-70'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-stone-950 stroke-[2.5]'
                        : isLocked
                        ? 'text-stone-600'
                        : 'text-stone-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="block leading-none">{item.label}</span>
                      {isLocked && <Lock className="w-3 h-3 text-amber-500/80" />}
                    </div>
                    <span
                      className={`text-[10px] mt-0.5 block leading-none ${
                        isActive
                          ? 'text-stone-900 font-medium'
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
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                      isActive
                        ? 'bg-stone-950 text-amber-300'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {isLocked && (
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-stone-800 text-stone-400 border border-stone-700/50">
                    Locked
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info, Sign Out & Quick Link to QR Customer App */}
      <div className="p-4 border-t border-stone-800/80 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between p-2.5 rounded-xl bg-stone-800/60 hover:bg-stone-800 text-stone-300 hover:text-white text-xs font-semibold transition-colors border border-stone-700/50"
        >
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-400" />
            <span>Open Customer QR Menu</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
        </Link>

        {user && (
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out ({user.email})</span>
          </button>
        )}

        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Fastify + Supabase
          </span>
          <span>RBAC v1.2</span>
        </div>
      </div>
    </aside>
  );
}
