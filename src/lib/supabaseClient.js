/**
 * Supabase Client Configuration
 * 
 * Connects to the Supabase backend for the powerups schema
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables - works with both Expo and web
const getEnvVar = (key, defaultValue) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return defaultValue;
};

const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', 'https://gzyfqozaremfkgrkrufb.supabase.co');
const SUPABASE_KEY = getEnvVar('VITE_SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6eWZxb3phcmVtZmtncmtydWZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxMTM0MTgsImV4cCI6MjA2MjY4OTQxOH0.RPrgyxHwtFeSSjTgdS5QgnISr5-FfD9Md4PYoXQn3g4');

console.log('[Supabase] Initializing client with custom schema: powerups');
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: {
    schema: 'powerups'
  }
});

// Helper to check if Supabase is ready
export const isSupabaseReady = () => {
  return supabase !== null;
};
