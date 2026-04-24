import { createBrowserClient } from '@supabase/ssr'

// 硬编码 Supabase 配置（从环境变量获取，如果不存在则使用默认值）
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xtqhjyiyjhxfdzyypfqq.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cWhqeWl5amh4ZmR6eXlwZnFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDU1NTksImV4cCI6MjA5MjA4MTU1OX0.2uWuP-DZQ3nGqan8Bw9Sa8v7eZI49dvgUgRU8Jgdy4w'

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables not configured')
    throw new Error('Supabase configuration error: Missing required environment variables')
  }

  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
