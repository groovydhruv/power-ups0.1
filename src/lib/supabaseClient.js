import { createClient } from '@supabase/supabase-js';

// Ensure these env vars are set in a local .env.local:
// VITE_SUPABASE_URL=https://suhleitwhhjajdiskvbd.supabase.co
// VITE_SUPABASE_ANON_KEY=...
const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Normalize URL to include protocol
const supabaseUrl =
  rawUrl && rawUrl.startsWith('http')
    ? rawUrl
    : rawUrl
    ? `https://${rawUrl}`
    : undefined;

let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.info('[supabaseClient] Initialized with URL:', supabaseUrl);
}

export { supabase };

