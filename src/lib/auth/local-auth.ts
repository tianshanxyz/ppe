/**
 * 本地认证模块 - 基于 localStorage 的用户注册登录系统
 * 不依赖 Supabase，适用于无后端环境下的演示和本地开发
 */

export interface LocalUser {
  id: string
  email: string
  name: string
  passwordHash: string // 简单的 base64 编码（不是真正的加密，但比明文好）
  role: 'user' | 'admin'
  membership: 'free' | 'professional' | 'enterprise'
  company?: string
  created_at: string
}

export interface LocalSessionUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  membership: 'free' | 'professional' | 'enterprise'
  company?: string
  created_at: string
}

const USERS_KEY = 'ppe_local_users'
const SESSION_KEY = 'ppe_local_session'

// 简单的密码哈希（使用 btoa + salt）
function hashPassword(password: string): string {
  return btoa(`ppe_salt_${password}_2026`)
}

// 生成唯一 ID
function generateId(): string {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 获取所有用户
function getUsers(): LocalUser[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(USERS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 保存用户列表
function saveUsers(users: LocalUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

// 注册
export function localSignUp(
  email: string,
  password: string,
  name: string,
  company?: string
): { user: LocalSessionUser | null; error: string | null } {
  const users = getUsers()

  // 检查邮箱是否已注册
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { user: null, error: 'This email is already registered' }
  }

  // 密码验证
  if (password.length < 6) {
    return { user: null, error: 'Password must be at least 6 characters' }
  }

  const newUser: LocalUser = {
    id: generateId(),
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
    passwordHash: hashPassword(password),
    role: 'user',
    membership: 'free',
    company: company || '',
    created_at: new Date().toISOString(),
  }

  users.push(newUser)
  saveUsers(users)

  // 自动登录 - 创建会话（不包含密码哈希）
  const sessionUser: LocalSessionUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    membership: newUser.membership,
    company: newUser.company,
    created_at: newUser.created_at,
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  // 同时存入 'user' key 以兼容 dashboard 和 header 的读取逻辑
  localStorage.setItem('user', JSON.stringify(sessionUser))
  sessionStorage.setItem('user', JSON.stringify(sessionUser))
  document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`

  return { user: sessionUser, error: null }
}

// 登录
export function localSignIn(
  email: string,
  password: string
): { user: LocalSessionUser | null; error: string | null } {
  const users = getUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())

  if (!user) {
    return { user: null, error: 'Invalid email or password' }
  }

  if (user.passwordHash !== hashPassword(password)) {
    return { user: null, error: 'Invalid email or password' }
  }

  // 创建会话（不包含密码哈希）
  const sessionUser: LocalSessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    membership: user.membership,
    company: user.company,
    created_at: user.created_at,
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  // 同时存入 'user' key 以兼容 dashboard 和 header 的读取逻辑
  localStorage.setItem('user', JSON.stringify(sessionUser))
  sessionStorage.setItem('user', JSON.stringify(sessionUser))
  document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`

  return { user: sessionUser, error: null }
}

// 获取当前会话用户
export function localGetSession(): LocalSessionUser | null {
  if (typeof window === 'undefined') return null
  try {
    let data = localStorage.getItem(SESSION_KEY)
    if (!data) data = sessionStorage.getItem(SESSION_KEY)
    if (!data) {
      // 兼容旧的 'user' key
      data = localStorage.getItem('user')
      if (!data) data = sessionStorage.getItem('user')
    }
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// 退出登录
export function localSignOut(): void {
  localStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(SESSION_KEY)
  localStorage.removeItem('user')
  sessionStorage.removeItem('user')
  document.cookie = 'demo_session=; path=/; max-age=0; SameSite=Lax'
}

// 检查 Supabase 是否已配置
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
