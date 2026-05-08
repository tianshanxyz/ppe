'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { signIn, signInWithGoogle } from '@/lib/auth/supabase-auth'
import { isSupabaseConfigured } from '@/lib/auth/local-auth'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

export default function LoginPage() {
  const router = useRouter()
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSupabaseConfigured()) {
        const { user, error: authError } = await signIn(email, password)

        if (authError) {
          setError(authError.message)
          setIsLoading(false)
          return
        }

        if (user) {
          const userDataStr = JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            role: user.role || 'user',
            membership: user.user_metadata?.membership || 'free',
            created_at: user.created_at,
          })
          localStorage.setItem('user', userDataStr)
          sessionStorage.setItem('user', userDataStr)
          document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
          window.location.href = '/dashboard'
        }
      } else {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Invalid email or password')
          setIsLoading(false)
          return
        }

        if (data.user) {
          const userDataStr = JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.email?.split('@')[0] || 'User',
            role: data.user.role || 'user',
            membership: data.user.membership || 'free',
            created_at: data.user.createdAt,
          })
          localStorage.setItem('user', userDataStr)
          sessionStorage.setItem('user', userDataStr)
          document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
          window.location.href = '/dashboard'
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setIsLoading(true)

    try {
      const { url, error: authError } = await signInWithGoogle()
      
      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#339999]/5 to-[#339999]/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-[#339999]">MDLooker</h1>
          </Link>
          <p className="mt-2 text-gray-600">
            {locale === 'zh' ? '全球PPE合规信息平台' : 'Global PPE Compliance Platform'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {locale === 'zh' ? '登录' : 'Sign In'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '邮箱' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                  placeholder={locale === 'zh' ? '输入邮箱地址' : 'Enter email address'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '密码' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                  placeholder={locale === 'zh' ? '输入密码' : 'Enter password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2a8080] transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? (locale === 'zh' ? '登录中...' : 'Signing in...') : (locale === 'zh' ? '登录' : 'Sign In')}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {locale === 'zh' ? '或' : 'Or'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              {isSupabaseConfigured() ? (
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-gray-700 font-medium">{locale === 'zh' ? '使用Google登录' : 'Continue with Google'}</span>
                </button>
              ) : (
                <div className="w-full text-center py-3 border border-gray-200 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-400">{locale === 'zh' ? '第三方登录需要配置数据库服务' : 'Third-party login requires database configuration'}</p>
                </div>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            {locale === 'zh' ? '还没有账号？' : "Don't have an account?"}{' '}
            <Link href="/auth/register" className="text-[#339999] hover:underline font-medium">
              {locale === 'zh' ? '注册' : 'Sign up'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
