import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ivfvxnwciuqicqqnlbtx.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZnZ4bndjaXVxaWNxcW5sYnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1ODU3MDAsImV4cCI6MjA3ODE2MTcwMH0.c-PfjifYWi5_lxK0VGXKRmUo8zhoXHz7NYR4zV6Usmg';

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }
  return browserClient;
}
