// @/utils/Supabase/client.ts
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug logs for development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase Configuration Check:')
  console.log('URL:', supabaseUrl || '❌ MISSING')
  console.log('Key exists:', !!supabaseAnonKey || '❌ MISSING')
  if (supabaseAnonKey) {
    console.log('Key preview:', supabaseAnonKey.substring(0, 20) + '...')
  }
}

// Validate environment variables
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not defined in environment variables')
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in environment variables')
}

// Create client with fallbacks to prevent crashes
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Test connection in development
if (process.env.NODE_ENV === 'development' && supabaseUrl && supabaseAnonKey) {
  const testConnection = async () => {
    try {
      const { count, error } = await supabase
        .from('gifts')
        .select('count', { count: 'exact', head: true })
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error.message)
        console.error('Full error:', error)
      } else {
        console.log('✅ Supabase connection successful!')
        console.log('📊 Total gifts in database:', count)
      }
    } catch (err) {
      console.error('❌ Supabase connection error:', err)
    }
  }
  
  testConnection()
}