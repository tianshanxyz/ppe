'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
import { localSignIn } from '@/lib/auth/local-auth'

export default function LoginPage() {
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
      const { user, error: loginError } = await localSignIn(email, password)

      if (loginError) {
        setError(loginError)
        setIsLoading(false)
        return
      }

      if (user) {
        window.location.href = '/dashboard'
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

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#339999] hover:underline"
              >
                {locale === 'zh' ? '忘记密码？' : 'Forgot password?'}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2a8080] transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? (locale === 'zh' ? '登录中...' : 'Signing in...') : (locale === 'zh' ? '登录' : 'Sign In')}
            </button>
          </form>

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
