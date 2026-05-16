'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, Loader2, Building, Phone } from 'lucide-react'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { localSignUp } from '@/lib/auth/local-auth'

export default function RegisterPage() {
  const locale = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email && !phone) {
      setError(locale === 'zh' ? '请至少填写邮箱或手机号' : 'Please provide at least email or phone number')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(locale === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError(locale === 'zh' ? '密码至少需要8个字符' : 'Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const { user, error: signUpError } = await localSignUp(email, password, name, company)

      if (signUpError) {
        setError(signUpError)
        setLoading(false)
        return
      }

      if (user) {
        window.location.href = '/dashboard'
      }
    } catch {
      setError(locale === 'zh' ? '注册失败，请重试' : 'Registration failed, please try again')
      setLoading(false)
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
            {locale === 'zh' ? '创建账户' : 'Create Account'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '姓名' : 'Full Name'} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={locale === 'zh' ? '您的姓名' : 'Your name'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '邮箱地址' : 'Email Address'} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {locale === 'zh' ? '用于账户恢复和重要通知' : 'Used for account recovery and notifications'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '手机号' : 'Phone Number'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={locale === 'zh' ? '+86 138 xxxx xxxx' : '+1 (555) 000-0000'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {locale === 'zh' ? '建议填写，用于密码找回和安全验证' : 'Recommended for password recovery and security verification'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '公司' : 'Company Name'}
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={locale === 'zh' ? '您的公司名称' : 'Your company name'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '密码' : 'Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={locale === 'zh' ? '至少8个字符' : 'At least 8 characters'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '确认密码' : 'Confirm Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={locale === 'zh' ? '再次输入密码' : 'Re-enter password'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center text-sm">
              <input type="checkbox" className="mr-2 rounded" required />
              <span className="text-gray-600">
                {locale === 'zh' ? '我同意' : 'I agree to the'}{' '}
                <Link href="/terms" className="text-[#339999] hover:underline">
                  {locale === 'zh' ? '服务条款' : 'Terms of Service'}
                </Link>{' '}
                {locale === 'zh' ? '和' : 'and'}{' '}
                <Link href="/privacy" className="text-[#339999] hover:underline">
                  {locale === 'zh' ? '隐私政策' : 'Privacy Policy'}
                </Link>
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#339999] text-white rounded-lg hover:bg-[#2a8080] transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {locale === 'zh' ? '创建账户中...' : 'Creating account...'}
                </span>
              ) : (
                locale === 'zh' ? '注册' : 'Sign Up'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {locale === 'zh' ? '已有账户？' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="text-[#339999] hover:underline font-medium">
              {locale === 'zh' ? '登录' : 'Sign in'}
            </Link>
          </div>

          <div className="mt-3 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-gray-500 hover:text-[#339999] hover:underline">
              {locale === 'zh' ? '忘记密码？' : 'Forgot password?'}
            </Link>
          </div>

          <div className="mt-4 p-3 bg-[#339999]/5 text-[#339999] rounded-lg text-sm text-center">
            {locale === 'zh'
              ? '新账户默认为免费计划，可随时在定价页面升级。'
              : 'New accounts start on the Free plan. Upgrade anytime from the Pricing page.'}
          </div>
        </div>
      </div>
    </div>
  )
}
