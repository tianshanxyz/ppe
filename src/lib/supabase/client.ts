import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let missingEnvWarned = false

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (!missingEnvWarned) {
      console.warn('Supabase environment variables not configured')
      missingEnvWarned = true
    }
    throw new Error('Supabase configuration error: Missing required environment variables')
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
