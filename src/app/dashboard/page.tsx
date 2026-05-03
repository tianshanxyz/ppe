'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Package,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Globe,
  Download,
  BookOpen,
  Star,
  Heart,
  Zap,
  Crown,
  Lock,
  Mail,
  Activity,
  ArrowUpRight,
  Calendar,
  Edit,
  Eye,
  BarChart3,
  FolderOpen,
  ExternalLink,
} from 'lucide-react';

// --- Types ---

interface UserData {
  id: string;
  email: string;
  name?: string;
  role: string;
  membership?: string;
  created_at?: string;
}

interface ActivityStats {
  complianceChecks: number;
  documentsDownloaded: number;
  productsSearched: number;
  regulationsReviewed: number;
}

interface ActivityItem {
  id: string;
  type: 'compliance_check' | 'document_download' | 'product_search' | 'regulation_review' | 'login' | 'profile_update';
  title: string;
  description: string;
  timestamp: string;
}

interface SavedItem {
  id: string;
  type: 'product' | 'regulation' | 'guide';
  title: string;
  subtitle: string;
  href: string;
}

// --- localStorage helpers ---

const STORAGE_KEYS = {
  USER: 'user',
  ACTIVITY_STATS: 'ppe_activity_stats',
  ACTIVITY_FEED: 'ppe_activity_feed',
  SAVED_ITEMS: 'ppe_saved_items',
};

function getFromStorage<T>(key: string, fallback: T | null): T | null {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if storage is full
  }
}

// --- Default data generators ---

function getDefaultActivityStats(): ActivityStats {
  return {
    complianceChecks: 24,
    documentsDownloaded: 18,
    productsSearched: 56,
    regulationsReviewed: 31,
  };
}

function getDefaultActivityFeed(userCreatedAt: string): ActivityItem[] {
  const now = Date.now();
  return [
    {
      id: 'act-1',
      type: 'compliance_check',
      title: 'Compliance check completed',
      description: 'EN 149 FFP2 respirator compliance verified',
      timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'act-2',
      type: 'document_download',
      title: 'Document downloaded',
      description: 'CE Declaration of Conformity template',
      timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'act-3',
      type: 'product_search',
      title: 'Product search',
      description: 'Searched for "N95 respirator EU MDR"',
      timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'act-4',
      type: 'regulation_review',
      title: 'Regulation reviewed',
      description: 'EU PPE Regulation 2016/425 updated summary',
      timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'act-5',
      type: 'compliance_check',
      title: 'Compliance check completed',
      description: 'ANSI Z87.1 eye protection standard verified',
      timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    },
    {
      id: 'act-6',
      type: 'document_download',
      title: 'Document downloaded',
      description: 'ISO 13485 Quality Management checklist',
      timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: 'act-7',
      type: 'product_search',
      title: 'Product search',
      description: 'Searched for "chemical resistant gloves EN 374"',
      timestamp: new Date(now - 1000 * 60 * 60 * 72).toISOString(),
    },
    {
      id: 'act-8',
      type: 'login',
      title: 'Signed in',
      description: 'Logged in from Chrome on macOS',
      timestamp: new Date(now - 1000 * 60 * 60 * 73).toISOString(),
    },
  ];
}

function getDefaultSavedItems(): SavedItem[] {
  return [
    {
      id: 'saved-1',
      type: 'product',
      title: '3M 8210 N95 Particulate Respirator',
      subtitle: 'NIOSH Approved | FFP2 Equivalent',
      href: '/products/3m-8210',
    },
    {
      id: 'saved-2',
      type: 'regulation',
      title: 'EU PPE Regulation 2016/425',
      subtitle: 'Effective: April 21, 2018',
      href: '/regulations/eu-ppe-2016-425',
    },
    {
      id: 'saved-3',
      type: 'guide',
      title: 'CE Marking Guide for PPE',
      subtitle: 'Step-by-step certification process',
      href: '/compliance-guides/ce-marking-ppe',
    },
    {
      id: 'saved-4',
      type: 'product',
      title: 'Honeywell S200A Safety Goggles',
      subtitle: 'ANSI Z87.1+ | EN 166 Certified',
      href: '/products/honeywell-s200a',
    },
    {
      id: 'saved-5',
      type: 'regulation',
      title: 'OSHA 29 CFR 1910.132',
      subtitle: 'General Requirements for PPE',
      href: '/regulations/osha-29-cfr-1910-132',
    },
    {
      id: 'saved-6',
      type: 'guide',
      title: 'FDA 510(k) Submission Guide',
      subtitle: 'Medical device premarket notification',
      href: '/compliance-guides/fda-510k',
    },
  ];
}

// --- Helper functions ---

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'compliance_check':
      return { icon: CheckCircle, bg: 'bg-[#339999]/10', color: 'text-[#339999]' };
    case 'document_download':
      return { icon: Download, bg: 'bg-green-100', color: 'text-green-600' };
    case 'product_search':
      return { icon: Search, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'regulation_review':
      return { icon: BookOpen, bg: 'bg-purple-100', color: 'text-purple-600' };
    case 'login':
      return { icon: Activity, bg: 'bg-gray-100', color: 'text-gray-600' };
    case 'profile_update':
      return { icon: Edit, bg: 'bg-amber-100', color: 'text-amber-600' };
    default:
      return { icon: Activity, bg: 'bg-gray-100', color: 'text-gray-600' };
  }
}

function getSavedItemIcon(type: SavedItem['type']) {
  switch (type) {
    case 'product':
      return { icon: Package, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'regulation':
      return { icon: Bookmark, bg: 'bg-purple-100', color: 'text-purple-600' };
    case 'guide':
      return { icon: BookOpen, bg: 'bg-[#339999]/10', color: 'text-[#339999]' };
    default:
      return { icon: Star, bg: 'bg-amber-100', color: 'text-amber-600' };
  }
}

function getMembershipLabel(tier?: string): string {
  switch (tier) {
    case 'professional':
      return 'Professional';
    case 'enterprise':
      return 'Enterprise';
    case 'starter':
      return 'Starter';
    default:
      return 'Free';
  }
}

function getMembershipColor(tier?: string): string {
  switch (tier) {
    case 'professional':
      return 'bg-[#339999]/10 text-[#339999]';
    case 'enterprise':
      return 'bg-purple-100 text-purple-700';
    case 'starter':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

// --- Main Component ---

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityStats, setActivityStats] = useState<ActivityStats>(getDefaultActivityStats());
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [activeSavedTab, setActiveSavedTab] = useState<'all' | 'product' | 'regulation' | 'guide'>('all');

  // Initialize user and data from localStorage
  useEffect(() => {
    // Try localStorage first, fallback to sessionStorage
    let userData = localStorage.getItem(STORAGE_KEYS.USER)
    if (!userData) {
      userData = sessionStorage.getItem(STORAGE_KEYS.USER)
    }
    
    if (!userData) {
      // No user logged in - redirect to login page
      router.push('/auth/login')
      return
    }

    try {
      const parsed = JSON.parse(userData)
      if (!parsed || !parsed.id) {
        // Invalid user data - redirect to login
        localStorage.removeItem(STORAGE_KEYS.USER)
        sessionStorage.removeItem(STORAGE_KEYS.USER)
        router.push('/auth/login')
        return
      }
      setUser(parsed)
    } catch {
      // Corrupted data - redirect to login
      localStorage.removeItem(STORAGE_KEYS.USER)
      sessionStorage.removeItem(STORAGE_KEYS.USER)
      router.push('/auth/login')
      return
    }

    // Load or initialize activity stats
    const stats = getFromStorage<ActivityStats>(STORAGE_KEYS.ACTIVITY_STATS, null);
    if (!stats) {
      const defaultStats = getDefaultActivityStats();
      setToStorage(STORAGE_KEYS.ACTIVITY_STATS, defaultStats);
      setActivityStats(defaultStats);
    } else {
      setActivityStats(stats);
    }

    // Load or initialize activity feed
    const feed = getFromStorage<ActivityItem[]>(STORAGE_KEYS.ACTIVITY_FEED, null);
    if (!feed || feed.length === 0) {
      const defaultFeed = getDefaultActivityFeed(new Date().toISOString());
      setToStorage(STORAGE_KEYS.ACTIVITY_FEED, defaultFeed);
      setActivityFeed(defaultFeed);
    } else {
      setActivityFeed(feed);
    }

    // Load or initialize saved items
    const saved = getFromStorage<SavedItem[]>(STORAGE_KEYS.SAVED_ITEMS, null);
    if (!saved || saved.length === 0) {
      const defaultSaved = getDefaultSavedItems();
      setToStorage(STORAGE_KEYS.SAVED_ITEMS, defaultSaved);
      setSavedItems(defaultSaved);
    } else {
      setSavedItems(saved);
    }

    setLoading(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    router.push('/');
  }, [router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
      </div>
    );
  }

  if (!user) {
    // 用户未登录，正在重定向到登录页
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999] mx-auto mb-4"></div>
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Filter saved items by tab
  const filteredSavedItems = activeSavedTab === 'all'
    ? savedItems
    : savedItems.filter(item => item.type === activeSavedTab);

  // Membership tier details
  const membershipTier = user.membership || 'free';
  const membershipLabel = getMembershipLabel(membershipTier);
  const isPaidPlan = membershipTier === 'professional' || membershipTier === 'enterprise';

  // Settings links
  const settingsLinks = [
    {
      icon: Edit,
      title: 'Profile Settings',
      description: 'Edit name, email, and company info',
      href: '/dashboard/settings',
    },
    {
      icon: Bell,
      title: 'Notification Preferences',
      description: 'Manage email and alert settings',
      href: '/dashboard/notifications',
    },
    {
      icon: Key,
      title: 'API Key Management',
      description: 'Create and manage API access keys',
      href: '/dashboard/api-keys',
    },
    {
      icon: Lock,
      title: 'Security Settings',
      description: 'Change password and 2FA settings',
      href: '/dashboard/settings#security',
    },
  ];

  // Quick action items
  const quickActions = [
    {
      icon: Search,
      title: 'Search Products',
      description: 'Find PPE products and certifications',
      href: '/products',
      bg: 'bg-blue-100',
      color: 'text-blue-600',
    },
    {
      icon: CheckCircle,
      title: 'Check Compliance',
      description: 'Verify product compliance status',
      href: '/market-access',
      bg: 'bg-[#339999]/10',
      color: 'text-[#339999]',
    },
    {
      icon: Download,
      title: 'Download Templates',
      description: 'Get compliance document templates',
      href: '/documents',
      bg: 'bg-green-100',
      color: 'text-green-600',
    },
    {
      icon: BookOpen,
      title: 'View Regulations',
      description: 'Browse regulatory requirements',
      href: '/regulations',
      bg: 'bg-purple-100',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">

          {/* ============================== */}
          {/* 1. User Profile Section        */}
          {/* ============================== */}
          <Card className="mb-8 p-6 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-800">
                  {user.name || 'User'}
                </h1>
                <p className="text-gray-500 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-2.5 py-1 ${getMembershipColor(membershipTier)} text-xs rounded-full font-medium flex items-center gap-1`}>
                    <Crown className="w-3 h-3" />
                    {membershipLabel}
                  </span>
                  <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                  {user.role === 'admin' && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                      Administrator
                    </span>
                  )}
                  {user.created_at && (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1.5" />
                    Edit Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>

          {/* ============================== */}
          {/* 2. Activity Overview           */}
          {/* ============================== */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#339999]" />
              Activity Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#339999]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{activityStats.complianceChecks}</div>
                    <div className="text-gray-500 text-sm">Compliance Checks</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{activityStats.documentsDownloaded}</div>
                    <div className="text-gray-500 text-sm">Docs Downloaded</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Search className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{activityStats.productsSearched}</div>
                    <div className="text-gray-500 text-sm">Products Searched</div>
                  </div>
                </div>
              </Card>
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{activityStats.regulationsReviewed}</div>
                    <div className="text-gray-500 text-sm">Regulations Reviewed</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ============================== */}
          {/* 3. Quick Actions               */}
          {/* ============================== */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#339999]" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 h-full">
                    <div className="text-center">
                      <div className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <action.icon className={`w-6 h-6 ${action.color}`} />
                      </div>
                      <div className="font-medium text-gray-800 text-sm mb-1">{action.title}</div>
                      <div className="text-gray-400 text-xs">{action.description}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Main content grid: Activity Feed + Saved Items */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

            {/* ============================== */}
            {/* 4. Recent Activity Feed        */}
            {/* ============================== */}
            <div className="lg:col-span-2">
              <Card className="bg-white shadow-sm p-0 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#339999]" />
                    Recent Activity
                  </h2>
                  <Link href="/dashboard/history" className="text-sm text-[#339999] hover:underline flex items-center gap-1">
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {activityFeed.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    activityFeed.slice(0, 8).map((item) => {
                      const { icon: ItemIcon, bg, color } = getActivityIcon(item.type);
                      return (
                        <div key={item.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <ItemIcon className={`w-4.5 h-4.5 ${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                  {formatRelativeTime(item.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* ============================== */}
            {/* 5. Saved / Favorite Items      */}
            {/* ============================== */}
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-sm p-0 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#339999]" />
                    Saved Items
                  </h2>
                  <Link href="/favorites" className="text-sm text-[#339999] hover:underline flex items-center gap-1">
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                {/* Tab filters */}
                <div className="px-5 pt-3 flex gap-1.5">
                  {(['all', 'product', 'regulation', 'guide'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveSavedTab(tab)}
                      className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                        activeSavedTab === tab
                          ? 'bg-[#339999] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab === 'all' ? 'All' : tab === 'product' ? 'Products' : tab === 'regulation' ? 'Regulations' : 'Guides'}
                    </button>
                  ))}
                </div>
                <div className="divide-y divide-gray-50 mt-2">
                  {filteredSavedItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No saved items</p>
                    </div>
                  ) : (
                    filteredSavedItems.slice(0, 6).map((item) => {
                      const { icon: ItemIcon, bg, color } = getSavedItemIcon(item.type);
                      return (
                        <Link key={item.id} href={item.href} className="block">
                          <div className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <ItemIcon className={`w-4.5 h-4.5 ${color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* ============================== */}
          {/* 6. Membership Status           */}
          {/* ============================== */}
          <div className="mb-8">
            <Card className="bg-white shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-gray-800">{membershipLabel} Plan</h3>
                      {isPaidPlan && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    {membershipTier === 'free' ? (
                      <p className="text-gray-500 text-sm">
                        You are on the Free plan with limited access. Upgrade to unlock compliance checks, API access, and premium document templates.
                      </p>
                    ) : membershipTier === 'professional' ? (
                      <p className="text-gray-500 text-sm">
                        Full access to compliance checks, document downloads, API keys, and regulatory updates. Renewal: Jan 1, 2027.
                      </p>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        Unlimited access to all platform features, priority support, and dedicated account manager. Renewal: Jan 1, 2027.
                      </p>
                    )}
                    {/* Feature list */}
                    <div className="flex flex-wrap gap-3 mt-3">
                      <span className={`text-xs flex items-center gap-1 ${membershipTier !== 'free' ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Compliance Checks
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${membershipTier !== 'free' ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Document Downloads
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${membershipTier === 'enterprise' ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Priority Support
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${membershipTier !== 'free' ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        API Access
                      </span>
                      <span className={`text-xs flex items-center gap-1 ${membershipTier === 'enterprise' ? 'text-green-600' : 'text-gray-400'}`}>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Custom Reports
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {membershipTier === 'free' ? (
                      <Link href="/pricing">
                        <Button variant="primary" size="md">
                          <Crown className="w-4 h-4 mr-1.5" />
                          Upgrade Plan
                        </Button>
                      </Link>
                    ) : membershipTier === 'professional' ? (
                      <Link href="/pricing">
                        <Button variant="secondary" size="md">
                          <ArrowUpRight className="w-4 h-4 mr-1.5" />
                          Upgrade to Enterprise
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/pricing">
                        <Button variant="outline" size="md">
                          Manage Subscription
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* ============================== */}
          {/* 7. Settings Section            */}
          {/* ============================== */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#339999]" />
              Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settingsLinks.map((item, index) => (
                <Link key={index} href={item.href} className="block">
                  <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-[#339999]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800">{item.title}</h3>
                        <p className="text-gray-500 text-sm">{item.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Compliance Tools (kept from original) */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#339999]" />
              Compliance Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/compliance-guides" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Compliance Guides</h3>
                      <p className="text-gray-500 text-sm">Step-by-step certification guides with timelines</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
              <Link href="/compliance-tracker" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Compliance Tracker</h3>
                      <p className="text-gray-500 text-sm">Track compliance tasks and milestones</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>

          {/* Account Management (kept from original, enhanced) */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#339999]" />
              Account Management
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/history" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <Search className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">Search History</h3>
                        <span className="px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs rounded-full font-medium">
                          {activityStats.productsSearched}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">View your search records</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/reports" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">My Reports</h3>
                        <span className="px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs rounded-full font-medium">
                          {activityStats.documentsDownloaded}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">Manage your generated reports</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/api-keys" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <Key className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">API Keys</h3>
                      <p className="text-gray-500 text-sm">Manage API access keys</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
              <Link href="/dashboard/notifications" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <Bell className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                      <p className="text-gray-500 text-sm">Configure message alerts</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
