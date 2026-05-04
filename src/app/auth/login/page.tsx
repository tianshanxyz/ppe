'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, AlertCircle, AlertTriangle } from 'lucide-react'
import { signIn, signInWithGoogle } from '@/lib/auth/supabase-auth'
import { localSignIn, isSupabaseConfigured } from '@/lib/auth/local-auth'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'

// Demo account config - credentials are Base64-encoded to avoid plaintext exposure in source
const DEMO_CONFIG = {
  eid: 'ZXhhbXBsZUBtZGxvb2tlci5jb20=',
  pid: 'ZXhhbXBsZQ==',
  userData: {
    id: 'test-user-001',
    email: 'example@mdlooker.com',
    name: 'Demo User',
    role: 'user',
    membership: 'professional',
    created_at: '2026-01-01',
  },
}

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
      // Check for demo account bypass (decode Base64 at runtime)
      const demoEmail = atob(DEMO_CONFIG.eid)
      const demoPass = atob(DEMO_CONFIG.pid)
      if (email === demoEmail && password === demoPass) {
        // Store mock user session in localStorage synchronously
        const userDataStr = JSON.stringify(DEMO_CONFIG.userData)
        localStorage.setItem('user', userDataStr)
        sessionStorage.setItem('user', userDataStr)
        // Set a cookie so server-side middleware knows this is a demo session
        // Cookie is readable by server-side middleware
        document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
        // Verify the write was successful
        const verify = localStorage.getItem('user')
        if (verify === userDataStr) {
          window.location.href = '/dashboard'
        } else {
          setError('Unable to save session. Please try again or use a different browser.')
          setIsLoading(false)
        }
        return
      }

      // Normal auth flow - try Supabase first, fall back to local auth
      if (isSupabaseConfigured()) {
        const { user, error: authError } = await signIn(email, password)

        if (authError) {
          setError(authError.message)
          setIsLoading(false)
          return
        }

        if (user) {
          // Store user data in localStorage for dashboard access
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
          document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
          // Verify the write was successful
          const verify = localStorage.getItem('user')
          if (verify === userDataStr) {
            window.location.href = '/dashboard'
          } else {
            setError('Unable to save session. Please try again or use a different browser.')
            setIsLoading(false)
          }
        }
      } else {
        // Supabase not configured - use API-based auth
        try {
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
            // Store user data in localStorage for dashboard access
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
            document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
            // Verify the write was successful
            const verify = localStorage.getItem('user')
            if (verify === userDataStr) {
              window.location.href = '/dashboard'
            } else {
              setError('Unable to save session. Please try again or use a different browser.')
              setIsLoading(false)
            }
          }
        } catch (err) {
          setError('Login failed. Please try again.')
          setIsLoading(false)
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
        // Redirect to Google login page
        window.location.href = url
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  const handleDemoFill = () => {
    setEmail(atob(DEMO_CONFIG.eid))
    setPassword(atob(DEMO_CONFIG.pid))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#339999]/10 via-white to-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 bg-[#339999] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">MD</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t.welcomeBackLogin}
          </h1>
          <p className="text-gray-600 text-center mb-8">
            {t.loginSubtitle}
          </p>
        </div>

        {/* Local Storage Disclaimer - Only show when Supabase is not configured */}
        {!isSupabaseConfigured() && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Local Storage Mode</p>
                <p className="text-amber-700 text-xs">
                  Your data is stored only in your browser and will not sync across devices.
                  For cloud sync, please contact the administrator.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                {t.emailAddress}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                {t.password}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#339999] focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-[#339999] hover:underline"
                >
                  {t.forgotPassword}
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-6 bg-[#339999] text-white font-semibold rounded-lg hover:bg-[#2d8b8b] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t.signingIn}
                </span>
              ) : (
                t.signInButton
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">{t.orContinueWith}</span>
            </div>
          </div>

          {/* Social Login */}
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
            <span className="text-gray-700 font-medium">{t.continueWithGoogle}</span>
          </button>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-gray-600">
            {t.noAccount}{' '}
            <Link href="/auth/signup" className="text-[#339999] font-semibold hover:underline">
              {t.signUpFree}
            </Link>
          </p>
        </div>

        {/* Demo Account Quick Access */}
        <div className="mt-6 bg-[#339999]/5 border border-[#339999]/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#339999]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-[#339999]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{t.demoAccountAvailable}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t.demoAccountDesc}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemoFill}
              className="ml-4 px-4 py-2 text-sm font-semibold text-[#339999] bg-white border border-[#339999]/30 rounded-lg hover:bg-[#339999]/10 transition-colors flex-shrink-0"
            >
              {t.useDemoAccount}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
