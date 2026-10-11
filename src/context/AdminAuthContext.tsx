'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { AdminRole, AdminUserProfile } from '@/types/admin';
import { toast } from 'sonner';

interface AdminAuthContextType {
  user: AdminUserProfile | null;
  role: AdminRole | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function mapSupabaseUserToProfile(sbUser: any): AdminUserProfile {
  const metadataRole = sbUser.user_metadata?.role || sbUser.app_metadata?.role;
  const role: AdminRole = metadataRole === 'super_admin' ? 'super_admin' : 'admin';
  const fullName =
    sbUser.user_metadata?.full_name ||
    (role === 'super_admin' ? 'Super Admin Manager' : 'Operations Admin');

  return {
    id: sbUser.id,
    email: sbUser.email || '',
    role,
    fullName,
  };
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize and listen to Supabase auth state
  useEffect(() => {
    const supabase = getSupabaseClient();

    // 1. Check existing session
    const checkInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(mapSupabaseUserToProfile(session.user));
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error checking initial auth session:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialSession();

    // 2. Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUserToProfile(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    const isLoginPage = pathname === '/admin/login';

    if (!user && !isLoginPage) {
      router.replace('/admin/login');
    } else if (user && isLoginPage) {
      router.replace('/admin');
    }
  }, [user, isLoading, pathname, router]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      setIsLoading(true);
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const profile = mapSupabaseUserToProfile(data.user);
          setUser(profile);
          toast.success(`Welcome back, ${profile.fullName}!`, {
            description: `Signed in as ${profile.role === 'super_admin' ? 'Super Admin' : 'Admin'}`,
          });
          setIsLoading(false);
          router.replace('/admin');
          return { success: true };
        }

        setIsLoading(false);
        return { success: false, error: 'User profile not found.' };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err?.message || 'Authentication failed' };
      }
    },
    [router]
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      setUser(null);
      toast.info('Signed out of admin portal');
      router.replace('/admin/login');
    } catch (err) {
      console.error('Error signing out:', err);
      toast.error('Failed to sign out cleanly');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const role = user?.role || null;
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || role === 'super_admin';

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        role,
        isSuperAdmin,
        isAdmin,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
