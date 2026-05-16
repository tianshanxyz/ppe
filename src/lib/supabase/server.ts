import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createMockClient() {
  const chain = () => ({
    eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), single: async () => ({ data: null, error: null }), limit: () => chain(), order: () => chain(), ilike: () => chain(), in: () => chain(), range: async () => ({ data: [], error: null }) }),
    insert: async () => ({ error: null }),
    update: () => ({ eq: async () => ({ error: null }) }),
    delete: () => ({ eq: async () => ({ error: null }) }),
    select: () => ({
      eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), single: async () => ({ data: null, error: null }), limit: () => chain(), order: () => chain(), ilike: () => chain(), in: () => chain(), range: async () => ({ data: [], error: null }) }),
      limit: () => chain(),
      order: () => chain(),
      ilike: () => chain(),
      in: () => chain(),
      range: async () => ({ data: [], error: null }),
    }),
  })
  return {
    from: chain,
    auth: { getUser: async () => ({ data: { user: null }, error: null }), getSession: async () => ({ data: { session: null }, error: null }) },
    rpc: async () => ({ data: null, error: null }),
  } as any
}

export async function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase not configured, using mock client')
    return createMockClient()
  }

  const cookieStore = await cookies()
  return createSupabaseServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `set` method was called from a Server Component.
          }
        },
      },
    }
  )
}
