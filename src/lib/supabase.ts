import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only initialize if we have a valid URL to prevent "supabaseUrl is required" crash
export const supabase = supabaseUrl 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (!supabase) {
  console.warn('Supabase credentials missing. Persistent storage is disabled.');
}

export interface SavedLetter {
  id: string;
  created_at: string;
  applicant_name: string;
  visa_type: string;
  letter_content: string;
  form_data: any;
}
