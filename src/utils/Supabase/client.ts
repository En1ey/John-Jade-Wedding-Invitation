// @/utils/Supabase/client.ts
import { createClient } from "@supabase/supabase-js";

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Development logging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('Supabase Configuration Check:');
  console.log('URL exists:', !!supabaseUrl);
  console.log('Key exists:', !!supabaseAnonKey);
  console.log('URL:', supabaseUrl);
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('Missing Supabase environment variables!');
    console.error('URL missing:', !supabaseUrl);
    console.error('Key missing:', !supabaseAnonKey);
  }
}

// Create and export the Supabase client
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: false, // Disable auth persistence for simpler setup
    },
  }
);

// Connection test (only in browser and development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('gifts')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Supabase connection failed:', error.message);
      } else {
        console.log('Supabase connected successfully! Gifts count:', data);
      }
    } catch (err) {
      console.error('Supabase connection error:', err);
    }
  };
  
  // Test connection after a short delay
  setTimeout(testConnection, 1000);
}