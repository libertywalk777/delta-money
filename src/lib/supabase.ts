import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function isSupabaseConfigured(): boolean {
  return Boolean(url?.trim() && anonKey?.trim());
}

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env');
  }
  return createClient(url!, anonKey!, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
