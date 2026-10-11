'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import {
  Flame,
  ShieldCheck,
  Shield,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const { signIn, isLoading } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);

    if (!res.success) {
      toast.error('Sign In Failed', {
        description: res.error || 'Please check your credentials and try again.',
      });
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setSubmitting(true);
    const res = await signIn(demoEmail, demoPass);
    setSubmitting(false);

    if (!res.success) {
      toast.error('Sign In Failed', {
        description: res.error || 'Please check your credentials.',
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-900 flex items-center justify-center p-4 sm:p-6 antialiased">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center text-stone-950 shadow-xl shadow-amber-500/10 mb-2">
            <Flame className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Chaska & Chai Cafe</h1>
          <p className="text-xs font-semibold text-stone-400">
            RestaurantOS • Admin & Operations Terminal
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-950 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">Staff Sign In</h2>
            <p className="text-xs text-stone-400">
              Enter your credentials to access your designated operations console.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurantos.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-900 border border-stone-800 rounded-2xl text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {submitting || isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials / 1-Click Access */}
          <div className="pt-2 border-t border-stone-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fast 1-Click Role Login</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Super Admin Quick Access */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('superadmin@restaurantos.com', 'Password123!')
                }
                disabled={submitting || isLoading}
                className="p-3 bg-stone-900/90 hover:bg-stone-900 border border-amber-500/30 hover:border-amber-500 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Super Admin
                  </span>
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded-full">
                    Full Access
                  </span>
                </div>
                <p className="text-[11px] font-bold text-white group-hover:text-amber-300 transition-colors">
                  Manager Portal
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                  Floor, Billing, Menu & QR Setup
                </p>
              </button>

              {/* Admin Quick Access */}
              <button
                type="button"
                onClick={() =>
                  handleQuickLogin('admin@restaurantos.com', 'Password123!')
                }
                disabled={submitting || isLoading}
                className="p-3 bg-stone-900/90 hover:bg-stone-900 border border-emerald-500/30 hover:border-emerald-500 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full">
                    Operations
                  </span>
                </div>
                <p className="text-[11px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Kitchen & Billing
                </p>
                <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                  Live Feed, Status & Customer Bills
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secured via Supabase RBAC & Fastify Backend</span>
        </div>
      </div>
    </div>
  );
}
