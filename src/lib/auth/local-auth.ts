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

const SESSION_KEY = 'mdlooker_user'

function generateId(): string {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2)
}

function getSecureFlag(): string {
  if (typeof window === 'undefined') return ''
  return window.location.protocol === 'https:' ? '; Secure' : ''
}

function createSessionCookie(): void {
  const token = generateId() + generateId()
  const secure = getSecureFlag()
  document.cookie = `ppe_session=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`
  document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax${secure}`
}

export function saveUserSession(userData: Record<string, unknown>): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(userData))
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData))
  createSessionCookie()
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

    saveUserSession({ ...sessionUser, token: data.token })
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

    saveUserSession({ ...sessionUser, token: data.token })
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
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function localSignOut(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('user')
  localStorage.removeItem('ppe_local_session')
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('ppe_local_session')
  const secure = getSecureFlag()
  document.cookie = `ppe_session=; path=/; max-age=0; SameSite=Lax${secure}`
  document.cookie = `demo_session=; path=/; max-age=0; SameSite=Lax${secure}`
}

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
