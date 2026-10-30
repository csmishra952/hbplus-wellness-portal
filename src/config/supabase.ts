import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cross-Platform Storage Adapter compatible with both Web (Browser / Netlify)
 * and Mobile (Expo / AsyncStorage interface).
 * Prioritizes localStorage so Google OAuth PKCE code verifiers survive full-page redirects,
 * with safe fallbacks to sessionStorage and in-memory storage in restricted webviews/iframes.
 */
const memoryStore = new Map<string, string>();

export const crossPlatformStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Fallback if localStorage is blocked
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // Fallback to in-memory storage inside restricted webviews/iframes
    }
    return memoryStore.get(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback if localStorage is blocked
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch {
      // Ignore storage error and persist in memory
    }
    memoryStore.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore localStorage error
    }
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Ignore sessionStorage error
    }
    memoryStore.delete(key);
  },
};

const envMeta = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export const CONFIGURED_ALLOWED_DOMAIN = (
  envMeta.EXPO_PUBLIC_ALLOWED_DOMAIN ||
  envMeta.VITE_ALLOWED_DOMAIN ||
  'hbplus.fit'
)
  .trim()
  .toLowerCase()
  .replace(/^@/, '');

const supabaseUrl = (envMeta.EXPO_PUBLIC_SUPABASE_URL || envMeta.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  envMeta.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  envMeta.VITE_SUPABASE_ANON_KEY ||
  ''
).trim();

export const isExternalSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Initializes the Supabase client when VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
 * (or EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY) are provided in .env.
 */
export const supabase: SupabaseClient | null = isExternalSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: crossPlatformStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/**
 * Validates whether an email belongs to @hbplus.fit or one of the admin-whitelisted domains.
 */
export function isEmailDomainAllowed(
  email: string | null | undefined,
  allowedDomains: string[]
): boolean {
  if (!email || !email.includes('@')) return false;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedDomains = allowedDomains
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter((d) => d.length >= 3);

  return normalizedDomains.some((domain) => normalizedEmail.endsWith(`@${domain}`));
}
