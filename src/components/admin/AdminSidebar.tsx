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
  Store,
} from 'lucide-react';

interface AdminSidebarProps {
  activeOrdersCount?: number;
}

export function AdminSidebar({ activeOrdersCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname();

  const navLinks = [
    {
      label: 'Live Feed',
      href: '/admin',
      icon: Activity,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-amber-500 text-stone-950',
      description: 'Kitchen stream & tickets',
    },
    {
      label: 'Floor & Billing',
      href: '/admin/floor',
      icon: LayoutGrid,
      description: 'Tables, POS & checkout',
    },
    {
      label: 'Menu Manager',
      href: '/admin/menu',
      icon: UtensilsCrossed,
      description: 'Daily 86-stock & catalog',
    },
    {
      label: 'Table QR Setup',
      href: '/admin/tables',
      icon: QrCode,
      description: 'QR provisioning & slugs',
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

        {/* Navigation Section */}
        <nav className="p-3 space-y-1">
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-stone-300">
            Operations Console
          </p>

          {navLinks.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/admin' && (pathname === '/admin' || pathname === '/admin/live'));

            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-stone-950 stroke-[2.5]' : 'text-stone-400'
                    }`}
                  />
                  <div>
                    <span className="block leading-none">{item.label}</span>
                    <span
                      className={`text-[10px] mt-0.5 block leading-none ${
                        isActive ? 'text-stone-900 font-medium' : 'text-stone-300'
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                      isActive ? 'bg-stone-950 text-amber-300' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Quick Link to QR Customer App */}
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

        <div className="flex items-center justify-between text-[11px] text-stone-300 px-1 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Fastify + Supabase
          </span>
          <span>v1.2</span>
        </div>
      </div>
    </aside>
  );
}
