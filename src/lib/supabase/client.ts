import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured')
    // 返回一个 mock 客户端或抛出更友好的错误
    throw new Error('Supabase 配置错误：缺少必要的环境变量')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
