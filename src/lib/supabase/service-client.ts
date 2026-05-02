import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let warningShown = false

/**
 * Creates a mock query builder that supports the Supabase chained query pattern.
 * Returns empty but valid responses so API routes return graceful empty results
 * instead of 500 errors when Supabase is not configured.
 *
 * Supported patterns:
 * - supabase.from('t').select('*', { count: 'exact', head: true })  => { count: 0, error: null }
 * - supabase.from('t').select('*', { count: 'exact' })              => { data: [], error: null, count: 0 }
 * - supabase.from('t').select('*').eq(...).range(...).order(...)    => { data: [], error: null }
 * - supabase.from('t').select('*').single()                         => { data: null, error: { message: '...' } }
 */
function createMockQueryBuilder(options?: { count?: string; head?: boolean }) {
  const builder: any = {}

  // Chainable filter / modifier methods — each returns the same builder
  builder.eq = () => builder
  builder.neq = () => builder
  builder.or = () => builder
  builder.ilike = () => builder
  builder.range = () => builder
  builder.order = () => builder
  builder.limit = () => builder
  builder.match = () => builder
  builder.not = () => builder
  builder.is = () => builder
  builder.in = () => builder
  builder.contains = () => builder
  builder.containedBy = () => builder
  builder.rangeLt = () => builder
  builder.rangeGt = () => builder
  builder.rangeGte = () => builder
  builder.rangeLte = () => builder
  builder.rangeAdjacent = () => builder
  builder.overlaps = () => builder
  builder.textSearch = () => builder

  // Terminal methods that return a Promise directly
  builder.single = () =>
    Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
  builder.maybeSingle = () =>
    Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })

  // Make the builder thenable so it can be awaited
  builder.then = (onFulfilled?: any, onRejected?: any) => {
    const result: any = {}

    if (options?.head !== true) {
      result.data = []
    }
    result.error = null
    if (options?.count === 'exact') {
      result.count = 0
    }

    return Promise.resolve(result).then(onFulfilled, onRejected)
  }

  builder.catch = (onRejected?: any) => builder.then(undefined, onRejected)

  builder.finally = (onFinally?: any) =>
    builder.then(
      (val: any) => { onFinally?.(); return val },
      (err: any) => { onFinally?.(); throw err }
    )

  return builder
}

/**
 * Creates a mock Supabase service client that returns empty but valid responses.
 * Used when environment variables are not configured, so the app degrades
 * gracefully instead of crashing with 500 errors.
 */
function createMockServiceClient() {
  return {
    from: (_table: string) => ({
      select: (_columns?: string, options?: { count?: string; head?: boolean }) =>
        createMockQueryBuilder(options),
      insert: () => createMockQueryBuilder(),
      update: () => createMockQueryBuilder(),
      delete: () => createMockQueryBuilder(),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      admin: {
        listUsers: () => Promise.resolve({ data: { users: [] }, error: null }),
      },
    },
  }
}

/**
 * Create a Supabase client with service-role privileges.
 *
 * When NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are missing
 * (e.g. during local development without a .env file), a mock client is
 * returned that answers every query with empty / zero-count results so that
 * the API routes return valid `{ data: [], meta: { total: 0 } }` responses
 * instead of 500 errors.
 */
export function createServiceClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    if (!warningShown) {
      console.warn(
        '[service-client] Supabase env vars missing (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). ' +
        'Using mock client — all queries will return empty results.'
      )
      warningShown = true
    }
    return createMockServiceClient() as any
  }

  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
