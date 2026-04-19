'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { Button, Card } from '@/components/ui';
import { 
  User, 
  Search, 
  FileText, 
  Key, 
  Bell, 
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';

interface UserData {
  email: string;
  name?: string;
  id: string;
  role: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/auth/login');
      return;
    }
    setUser(JSON.parse(userData));
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medical"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      icon: Search,
      title: '搜索历史',
      description: '查看您的搜索记录',
      href: '/dashboard/history',
      count: 12
    },
    {
      icon: FileText,
      title: '我的报告',
      description: '管理您生成的报告',
      href: '/dashboard/reports',
      count: 3
    },
    {
      icon: Key,
      title: 'API密钥',
      description: '管理API访问密钥',
      href: '/dashboard/api-keys',
      count: 2
    },
    {
      icon: Bell,
      title: '通知设置',
      description: '配置消息通知',
      href: '/dashboard/notifications'
    },
    {
      icon: Settings,
      title: '账户设置',
      description: '修改个人信息',
      href: '/dashboard/settings'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* User Profile Card */}
          <Card className="mb-8 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-medical rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.name || '用户'}
                </h1>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-medical-100 text-medical-700 text-xs rounded-full">
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    调试模式
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                退出登录
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-medical-100 rounded-xl flex items-center justify-center">
                  <Search className="w-6 h-6 text-medical" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">12</div>
                  <div className="text-gray-500 text-sm">搜索次数</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-medical-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-medical" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">3</div>
                  <div className="text-gray-500 text-sm">生成报告</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-medical-100 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6 text-medical" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">2</div>
                  <div className="text-gray-500 text-sm">API密钥</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="block"
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-medical-100 rounded-xl flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-medical" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        {item.count && (
                          <span className="px-2 py-0.5 bg-medical-100 text-medical-700 text-xs rounded-full">
                            {item.count}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
