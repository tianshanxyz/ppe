'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Card } from '@/components/ui';
import { Mail, Lock, User, Loader2, Building, AlertTriangle, Download, Upload } from 'lucide-react';
import { localSignUp } from '@/lib/auth/local-auth';
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
  const [showDataModal, setShowDataModal] = useState(false);
  const [importSuccess, setImportSuccess] = useState('');

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
      const { user, error: authError } = await localSignUp(email, password, name, company);

      if (authError) {
        setError(authError);
        setLoading(false);
        return;
      }

      if (user) {
        window.location.href = '/dashboard';
      }
    } catch {
      setError(locale === 'zh' ? '注册失败，请重试' : 'Registration failed, please try again');
      setLoading(false);
    }
  };

  const handleExportData = () => {
    if (typeof window === 'undefined') return;

    const data = {
      users: localStorage.getItem('ppe_local_users'),
      session: localStorage.getItem('ppe_local_session'),
      user: localStorage.getItem('user'),
      activityStats: localStorage.getItem('ppe_activity_stats'),
      activityFeed: localStorage.getItem('ppe_activity_feed'),
      savedItems: localStorage.getItem('ppe_saved_items_v2'),
      trackingItems: localStorage.getItem('ppe_tracking_items'),
      settings: localStorage.getItem('ppe_user_settings'),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mdlooker-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        if (data.users) localStorage.setItem('ppe_local_users', data.users);
        if (data.session) localStorage.setItem('ppe_local_session', data.session);
        if (data.user) localStorage.setItem('user', data.user);
        if (data.activityStats) localStorage.setItem('ppe_activity_stats', data.activityStats);
        if (data.activityFeed) localStorage.setItem('ppe_activity_feed', data.activityFeed);
        if (data.savedItems) localStorage.setItem('ppe_saved_items_v2', data.savedItems);
        if (data.trackingItems) localStorage.setItem('ppe_tracking_items', data.trackingItems);
        if (data.settings) localStorage.setItem('ppe_user_settings', data.settings);

        setImportSuccess(locale === 'zh' ? '数据导入成功！请刷新页面。' : 'Data imported successfully! Please refresh the page.');
        setTimeout(() => setImportSuccess(''), 3000);
      } catch {
        setError(locale === 'zh' ? '数据导入失败，请检查文件格式。' : 'Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 bg-gray-50">
      <div className="w-full max-w-md px-4">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{locale === 'zh' ? '创建账户' : 'Create Account'}</h1>
            <p className="text-gray-500">{locale === 'zh' ? '开始您的MDLooker之旅' : 'Start your MDLooker journey'}</p>
          </div>

          {/* Local Storage Disclaimer */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">{locale === 'zh' ? '当前使用本地存储模式' : 'Current using Local Storage Mode'}</p>
                <p className="text-amber-700 text-xs">
                  {locale === 'zh'
                    ? '您的数据仅存储在浏览器中，不会跨设备同步。如需云端同步，请联系管理员。'
                    : 'Your data is stored only in your browser. It will not sync across devices. For cloud sync, please contact the administrator.'}
                </p>
                <button
                  onClick={() => setShowDataModal(true)}
                  className="text-amber-600 underline text-xs mt-2 hover:text-amber-800"
                >
                  {locale === 'zh' ? '备份/恢复数据 →' : 'Backup/Restore Data →'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {importSuccess && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              {importSuccess}
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

        {/* Data Backup/Restore Modal */}
        {showDataModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDataModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{locale === 'zh' ? '备份与恢复数据' : 'Backup & Restore Data'}</h3>

              <div className="space-y-4">
                {/* Export Section */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    {locale === 'zh' ? '导出您的数据' : 'Export Your Data'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    {locale === 'zh'
                      ? '下载所有数据的备份（收藏、跟踪项目、设置等）'
                      : 'Download a backup of all your data (favorites, tracking items, settings, etc.)'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportData}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {locale === 'zh' ? '下载备份' : 'Download Backup'}
                  </Button>
                </div>

                {/* Import Section */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {locale === 'zh' ? '导入数据' : 'Import Data'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-3">
                    {locale === 'zh'
                      ? '从之前的备份文件恢复数据'
                      : 'Restore your data from a previous backup file'}
                  </p>
                  <label className="block">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement | null;
                        fileInput?.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {locale === 'zh' ? '选择备份文件' : 'Select Backup File'}
                    </Button>
                  </label>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  {locale === 'zh' ? '注意：导入数据将覆盖当前本地数据。' : 'Note: Importing data will overwrite your current local data.'}
                </div>
              </div>

              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowDataModal(false)}
              >
                {locale === 'zh' ? '关闭' : 'Close'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
