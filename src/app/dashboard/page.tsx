'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { 
  User, 
  Search, 
  FileText, 
  Key, 
  Bell, 
  Settings,
  LogOut,
  ChevronRight,
  Shield,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Globe
} from 'lucide-react';

interface UserData {
  email: string;
  name?: string;
  id: string;
  role: string;
}

interface DashboardStats {
  searchCount: number;
  reportCount: number;
  apiKeyCount: number;
  productCount: number;
  certifiedCount: number;
  expiringCount: number;
  complianceRate: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    searchCount: 12,
    reportCount: 3,
    apiKeyCount: 2,
    productCount: 5,
    certifiedCount: 3,
    expiringCount: 1,
    complianceRate: 85
  });

  useEffect(() => {
    // 检查登录状态
    const userData = localStorage.getItem('user');
    if (!userData) {
      // 如果没有登录，显示演示数据而不是重定向
      setUser({
        id: 'demo-user',
        email: 'demo@mdlooker.com',
        name: 'Demo User',
        role: 'user'
      });
      setLoading(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      icon: Search,
      title: 'Search History',
      description: 'View your search records',
      href: '/dashboard/history',
      count: stats.searchCount
    },
    {
      icon: FileText,
      title: 'My Reports',
      description: 'Manage your generated reports',
      href: '/dashboard/reports',
      count: stats.reportCount
    },
    {
      icon: Key,
      title: 'API Keys',
      description: 'Manage API access keys',
      href: '/dashboard/api-keys',
      count: stats.apiKeyCount
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure message alerts',
      href: '/dashboard/notifications'
    },
    {
      icon: Settings,
      title: 'Account Settings',
      description: 'Update personal information',
      href: '/dashboard/settings'
    }
  ];

  const complianceTools = [
    {
      icon: Clock,
      title: 'Compliance Guides',
      description: 'Step-by-step certification guides with timelines',
      href: '/compliance-guides'
    },
    {
      icon: CheckCircle,
      title: 'Compliance Tracker',
      description: 'Track compliance tasks and milestones',
      href: '/compliance-tracker'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          {/* User Profile Card */}
          <Card className="mb-8 p-6 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.name || 'User'}
                </h1>
                <p className="text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-1 bg-[#339999]/10 text-[#339999] text-xs rounded-full font-medium">
                    {user.role === 'admin' ? 'Administrator' : 'Standard User'}
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                    Active
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={handleLogout} className="mt-4 md:mt-0">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </Card>

          {/* Compliance Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#339999]" />
              Compliance Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{stats.productCount}</div>
                    <div className="text-gray-500 text-sm">Total Products</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{stats.certifiedCount}</div>
                    <div className="text-gray-500 text-sm">Certified</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{stats.expiringCount}</div>
                    <div className="text-gray-500 text-sm">Expiring Soon</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#339999]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{stats.complianceRate}%</div>
                    <div className="text-gray-500 text-sm">Compliance Rate</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#339999]" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/market-access">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="font-medium text-gray-800 text-sm">Compliance Check</div>
                  </div>
                </Card>
              </Link>
              <Link href="/products">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="font-medium text-gray-800 text-sm">Product Database</div>
                  </div>
                </Card>
              </Link>
              <Link href="/certification-comparison">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Globe className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="font-medium text-gray-800 text-sm">Market Compare</div>
                  </div>
                </Card>
              </Link>
              <Link href="/documents">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="font-medium text-gray-800 text-sm">Documents</div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Compliance Tools */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#339999]" />
              My Compliance Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complianceTools.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block"
                >
                  <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-[#339999]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-500 text-sm">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Account Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block"
                >
                  <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-[#339999]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{item.title}</h3>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs rounded-full font-medium">
                              {item.count}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
