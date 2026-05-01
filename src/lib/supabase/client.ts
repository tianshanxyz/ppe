import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let missingEnvWarned = false

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    if (!missingEnvWarned) {
      console.warn('Supabase environment variables not configured. Using fallback data where available.')
      missingEnvWarned = true
    }
    // Return a mock client that will fail gracefully on queries
    // This prevents the entire page from crashing when Supabase is not configured
    return createMockClient()
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

/**
 * Creates a mock Supabase client that returns empty results with errors,
 * allowing data fetching functions to fall back to default/mock data
 * instead of crashing the entire page.
 */
function createMockClient() {
  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    delete: () => mockQuery,
    eq: () => mockQuery,
    neq: () => mockQuery,
    or: () => mockQuery,
    ilike: () => mockQuery,
    like: () => mockQuery,
    range: () => mockQuery,
    order: () => mockQuery,
    limit: () => mockQuery,
    single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    maybeSingle: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
    then: (resolve: any) => resolve({ data: null, error: { message: 'Supabase not configured' }, count: null }),
  }

  return {
    from: () => mockQuery,
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: { user: null }, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        download: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as any
}
