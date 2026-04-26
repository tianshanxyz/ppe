import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  if (error) {
    return NextResponse.redirect(
      new URL(`/ppe/auth/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      return NextResponse.redirect(
        new URL(`/ppe/auth/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }
  }

  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
}
