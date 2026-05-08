export interface LocalUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  membership: 'free' | 'professional' | 'enterprise'
  company?: string
  avatar?: string
  created_at: string
}

const SESSION_KEY = 'ppe_local_session'

function generateId(): string {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function createSessionCookie(): void {
  const token = generateId() + generateId()
  document.cookie = `ppe_session=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
  document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
}

export async function localSignUp(
  email: string,
  password: string,
  name: string,
  company?: string
): Promise<{ user: LocalUser | null; error: string | null }> {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, company }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { user: null, error: data.error || 'Registration failed' }
    }

    const sessionUser: LocalUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role || 'user',
      membership: data.user.membership || 'free',
      company: data.user.company,
      created_at: data.user.createdAt,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    localStorage.setItem('user', JSON.stringify(sessionUser))
    sessionStorage.setItem('user', JSON.stringify(sessionUser))
    createSessionCookie()

    return { user: sessionUser, error: null }
  } catch (error) {
    return { user: null, error: 'Network error. Please try again.' }
  }
}

export async function localSignIn(
  email: string,
  password: string
): Promise<{ user: LocalUser | null; error: string | null }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { user: null, error: data.error || 'Login failed' }
    }

    const sessionUser: LocalUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      role: data.user.role || 'user',
      membership: data.user.membership || 'free',
      company: data.user.company,
      created_at: data.user.createdAt,
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    localStorage.setItem('user', JSON.stringify(sessionUser))
    sessionStorage.setItem('user', JSON.stringify(sessionUser))
    createSessionCookie()

    return { user: sessionUser, error: null }
  } catch (error) {
    return { user: null, error: 'Network error. Please try again.' }
  }
}

export function localGetSession(): LocalUser | null {
  if (typeof window === 'undefined') return null
  try {
    let data = localStorage.getItem(SESSION_KEY)
    if (!data) data = sessionStorage.getItem(SESSION_KEY)
    if (!data) {
      data = localStorage.getItem('user')
      if (!data) data = sessionStorage.getItem('user')
    }
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function localSignOut(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')
  document.cookie = 'ppe_session=; path=/; max-age=0; SameSite=Lax; Secure'
  document.cookie = 'demo_session=; path=/; max-age=0; SameSite=Lax; Secure'
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
