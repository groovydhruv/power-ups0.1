/**
 * STUB IMPLEMENTATION - Supabase Client for React Native
 * 
 * TODO FOR DEVELOPERS:
 * 1. Install Supabase: npm install @supabase/supabase-js
 * 2. Create a .env file with:
 *    - SUPABASE_URL=your_supabase_url
 *    - SUPABASE_ANON_KEY=your_anon_key
 * 3. Install react-native-dotenv for environment variables
 * 4. Import and initialize the real Supabase client below
 * 
 * Example real implementation:
 * 
 * import { createClient } from '@supabase/supabase-js';
 * import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';
 * 
 * export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
 * 
 * For now, this exports null to allow the app to run with mock data.
 */

// Mock client for prototype
export const supabase = null;

// Helper to check if Supabase is ready
export const isSupabaseReady = () => {
  return supabase !== null;
};
