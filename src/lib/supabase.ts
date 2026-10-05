import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'evidence';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-supabase-url') &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon-key') &&
    supabaseUrl.startsWith('https://')
  );
};

// Fallback dummy URL and anon key to prevent crash if unconfigured during initial dev
const safeUrl = isSupabaseConfigured() ? supabaseUrl : 'https://placeholder-project.supabase.co';
const safeKey = isSupabaseConfigured() ? supabaseAnonKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  details?: any;
}> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      message: 'Supabase credentials are not configured in .env. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    };
  }

  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet
      if (error.code === '42P01') {
        return {
          connected: true,
          message: 'Connected to Supabase project, but migrations have not yet been executed. Please run migrations 001, 002, and 003 in Supabase SQL Editor.',
          details: error,
        };
      }
      if (error.message?.includes('fetch failed') || error.message?.includes('Failed to fetch')) {
        return {
          connected: false,
          message: `Network connection to ${supabaseUrl} failed (getaddrinfo ENOTFOUND or unreachable). Please verify that your Supabase project is active and that the project URL is typed accurately in .env.`,
          details: error,
        };
      }
      return {
        connected: false,
        message: `Supabase query returned error: ${error.message} (code: ${error.code || 'unknown'})`,
        details: error,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase PostgreSQL database.',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect to Supabase: ${err.message || 'Unknown network error'}. Please check internet connection and project URL.`,
      details: err,
    };
  }
}
