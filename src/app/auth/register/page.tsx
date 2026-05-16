'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, User, Loader2, Building } from 'lucide-react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function RegisterPage() {
  const locale = useLocale();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(locale === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(locale === 'zh' ? '密码至少需要6个字符' : 'Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, company }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      if (data.user && data.token) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role || 'user',
          membership: data.user.membership || 'free',
          company: data.user.company,
          token: data.token,
          created_at: data.user.createdAt,
        };
        localStorage.setItem('mdlooker_user', JSON.stringify(userData));
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.setItem('user', JSON.stringify(userData));
        document.cookie = `demo_session=true; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;
        window.location.href = '/dashboard';
      }
    } catch {
      setError(locale === 'zh' ? '注册失败，请重试' : 'Registration failed, please try again');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 bg-gray-50">
      <div className="w-full max-w-md px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{locale === 'zh' ? '创建账户' : 'Create Account'}</h1>
            <p className="text-gray-500">{locale === 'zh' ? '开始您的MDLooker之旅' : 'Start your MDLooker journey'}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
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
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={locale === 'zh' ? '您的姓名' : 'Your name'}
                  className="pl-10"
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
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '公司' : 'Company Name'}
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder={locale === 'zh' ? '您的公司名称' : 'Your company name'}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '密码' : 'Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={locale === 'zh' ? '至少6个字符' : 'At least 6 characters'}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '确认密码' : 'Confirm Password'} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={locale === 'zh' ? '再次输入密码' : 'Re-enter password'}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center text-sm">
              <input type="checkbox" className="mr-2" required />
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

            <Button
              type="submit"
              className="w-full bg-[#339999] hover:bg-[#2a8080]"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {locale === 'zh' ? '创建账户中...' : 'Creating account...'}
                </>
              ) : (
                locale === 'zh' ? '注册' : 'Sign Up'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {locale === 'zh' ? '已有账户？' : 'Already have an account?'}{' '}
            <Link href="/auth/login" className="text-[#339999] hover:underline font-medium">
              {locale === 'zh' ? '登录' : 'Sign in'}
            </Link>
          </div>

          <div className="mt-4 p-3 bg-[#339999]/5 text-[#339999] rounded-lg text-sm text-center">
            {locale === 'zh'
              ? '新账户默认为免费计划，可随时在定价页面升级。'
              : 'New accounts start on the Free plan. Upgrade anytime from the Pricing page.'}
          </div>
        </Card>
      </div>
    </div>
  );
}
