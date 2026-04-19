'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { AuthUtils } from '@/lib/auth-utils';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 输入验证
      const validation = AuthUtils.validateLoginInput(email, password);
      if (!validation.success) {
        const firstError = Object.values(validation.errors || {})[0];
        throw new Error(firstError || '输入验证失败');
      }

      // 清理输入
      const sanitizedEmail = AuthUtils.sanitizeInput(email);
      const sanitizedPassword = AuthUtils.sanitizeInput(password);

      // 检查密码强度
      const strengthCheck = AuthUtils.checkPasswordStrength(sanitizedPassword);
      if (strengthCheck.strength === 'weak') {
        throw new Error('密码强度较弱，请使用更复杂的密码');
      }

      // 使用 Supabase 进行真实认证
      const supabase = createClient();
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: sanitizedEmail,
        password: sanitizedPassword
      });

      if (signInError) {
        // 处理常见的认证错误
        let errorMessage = signInError.message;
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = '邮箱或密码错误';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = '邮箱未验证，请检查您的邮箱';
        } else if (signInError.message.includes('Too many requests')) {
          errorMessage = '请求过于频繁，请稍后再试';
        }
        throw new Error(errorMessage);
      }

      if (!data.user) {
        throw new Error('认证失败，请重试');
      }

      // 认证成功，跳转到仪表板
      router.push('/dashboard');
      router.refresh(); // 刷新页面以更新认证状态
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : '登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 bg-gray-50">
      <div className="w-full max-w-md px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Sign in to your MDLooker account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
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
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-[#339999] hover:underline">
                Forgot password?
              </Link>
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
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-[#339999] hover:underline font-medium">
              Sign up
            </Link>
          </div>

          <div className="mt-4 p-3 bg-[#339999]/5 text-[#339999] rounded-lg text-sm text-center">
            <strong>Demo Mode</strong>: All permissions are open, any email/password works
          </div>
        </Card>
      </div>
    </div>
  );
}
