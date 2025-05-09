import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// These will need to be replaced with actual values from Supabase
// When the user connects to Supabase, these will be available in .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);