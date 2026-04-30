import { createClient } from '@/lib/supabase/client'

export interface AuthUser {
  id: string
  email: string
  full_name?: string
  company?: string
  avatar_url?: string
  role: 'user' | 'admin' | 'premium'
  created_at: string
}

export interface AuthError {
  message: string
  code?: string
}

// 客户端认证函数
export async function signUp(email: string, password: string, userData: {
  full_name?: string
  company?: string
}) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: userData.full_name,
        company: userData.company,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { user: null, error: { message: error.message, code: error.code } }
  }

  return { user: data.user, error: null }
}

export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { user: null, session: null, error: { message: error.message, code: error.code } }
  }

  return { user: data.user, session: data.session, error: null }
}

export async function signInWithGoogle() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    return { url: null, error: { message: error.message, code: error.code } }
  }

  return { url: data.url, error: null }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: { message: error.message, code: error.code } }
  }

  return { error: null }
}

export async function resetPassword(email: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/ppe/auth/reset-password`,
  })

  if (error) {
    return { error: { message: error.message, code: error.code } }
  }

  return { error: null }
}

export async function updatePassword(password: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: { message: error.message, code: error.code } }
  }

  return { error: null }
}

export async function getCurrentUser() {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error: error ? { message: error.message, code: error.code } : null }
  }

  // 获取用户详细信息
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return { user: null, error: { message: profileError.message } }
  }

  return { 
    user: {
      id: user.id,
      email: user.email!,
      ...profile,
    } as AuthUser, 
    error: null 
  }
}

export async function updateProfile(userId: string, updates: Partial<AuthUser>) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { profile: null, error: { message: error.message } }
  }

  return { profile: data as AuthUser, error: null }
}
