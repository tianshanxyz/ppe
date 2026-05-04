'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
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
  Plus,
  Trash2,
  X,
  Newspaper,
  Building,
  ClipboardCheck,
  Award,
  Shield,
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
  type: 'product' | 'enterprise' | 'regulation' | 'news';
  title: string;
  subtitle: string;
  href: string;
  addedAt: string;
}

interface TrackingItem {
  id: string;
  productName: string;
  certificateNumber: string;
  status: 'compliant' | 'pending' | 'non_compliant' | 'unknown';
  market: string;
  addedAt: string;
}

interface MarketDynamic {
  id: string;
  market: string;
  marketCode: string;
  description: string;
  descriptionZh: string;
  timestamp: string;
  type: 'regulation_update' | 'new_standard' | 'policy_change';
}

interface EnterpriseDynamic {
  id: string;
  enterprise: string;
  description: string;
  descriptionZh: string;
  timestamp: string;
  type: 'new_application' | 'certification_obtained' | 'market_entry';
}

// --- localStorage helpers ---

const STORAGE_KEYS = {
  USER: 'user',
  ACTIVITY_STATS: 'ppe_activity_stats',
  ACTIVITY_FEED: 'ppe_activity_feed',
  SAVED_ITEMS: 'ppe_saved_items_v2',
  TRACKING_ITEMS: 'ppe_tracking_items',
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

function getDefaultActivityFeed(): ActivityItem[] {
  const now = Date.now();
  return [
    { id: 'act-1', type: 'compliance_check', title: 'Compliance check completed', description: 'EN 149 FFP2 respirator compliance verified', timestamp: new Date(now - 1000 * 60 * 15).toISOString() },
    { id: 'act-2', type: 'document_download', title: 'Document downloaded', description: 'CE Declaration of Conformity template', timestamp: new Date(now - 1000 * 60 * 60 * 2).toISOString() },
    { id: 'act-3', type: 'product_search', title: 'Product search', description: 'Searched for "N95 respirator EU MDR"', timestamp: new Date(now - 1000 * 60 * 60 * 5).toISOString() },
    { id: 'act-4', type: 'regulation_review', title: 'Regulation reviewed', description: 'EU PPE Regulation 2016/425 updated summary', timestamp: new Date(now - 1000 * 60 * 60 * 24).toISOString() },
    { id: 'act-5', type: 'compliance_check', title: 'Compliance check completed', description: 'ANSI Z87.1 eye protection standard verified', timestamp: new Date(now - 1000 * 60 * 60 * 26).toISOString() },
    { id: 'act-6', type: 'document_download', title: 'Document downloaded', description: 'ISO 13485 Quality Management checklist', timestamp: new Date(now - 1000 * 60 * 60 * 48).toISOString() },
    { id: 'act-7', type: 'product_search', title: 'Product search', description: 'Searched for "chemical resistant gloves EN 374"', timestamp: new Date(now - 1000 * 60 * 60 * 72).toISOString() },
    { id: 'act-8', type: 'login', title: 'Signed in', description: 'Logged in from Chrome on macOS', timestamp: new Date(now - 1000 * 60 * 60 * 73).toISOString() },
  ];
}

function getDefaultSavedItems(): SavedItem[] {
  return [
    { id: 'saved-1', type: 'product', title: '3M 8210 N95 Particulate Respirator', subtitle: 'NIOSH Approved | FFP2 Equivalent', href: '/products/3m-8210', addedAt: new Date().toISOString() },
    { id: 'saved-2', type: 'regulation', title: 'EU PPE Regulation 2016/425', subtitle: 'Effective: April 21, 2018', href: '/regulations/eu-ppe-2016-425', addedAt: new Date().toISOString() },
    { id: 'saved-3', type: 'enterprise', title: 'SafeGuard PPE Co., Ltd.', subtitle: 'N95 Respirator Manufacturer', href: '/manufacturers/safeguard', addedAt: new Date().toISOString() },
    { id: 'saved-4', type: 'news', title: 'EU Updates PPE Classification Guidelines', subtitle: 'Regulatory News - Jan 2026', href: '/regulatory-news/eu-ppe-update', addedAt: new Date().toISOString() },
  ];
}

function getDefaultTrackingItems(): TrackingItem[] {
  return [
    { id: 'track-1', productName: 'N95 Respirator XR-500', certificateNumber: 'NIOSH-2024-1234', status: 'compliant', market: 'US', addedAt: new Date().toISOString() },
    { id: 'track-2', productName: 'Safety Helmet ProShield X1', certificateNumber: 'CE-2023-5678', status: 'pending', market: 'EU', addedAt: new Date().toISOString() },
  ];
}

// Mock market dynamics data
const MARKET_DYNAMICS: MarketDynamic[] = [
  { id: 'md-1', market: 'China', marketCode: 'CN', description: 'Updated 3 regulations for respiratory protection', descriptionZh: '更新了3部呼吸防护法规', timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), type: 'regulation_update' },
  { id: 'md-2', market: 'European Union', marketCode: 'EU', description: 'New PPE classification guidelines published', descriptionZh: '发布了新的PPE分类指南', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), type: 'new_standard' },
  { id: 'md-3', market: 'United States', marketCode: 'US', description: 'FDA updated 510(k) submission requirements', descriptionZh: 'FDA更新了510(k)提交要求', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), type: 'policy_change' },
  { id: 'md-4', market: 'Singapore', marketCode: 'SG', description: 'New chemical protective equipment standard adopted', descriptionZh: '采纳了新的化学防护设备标准', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'new_standard' },
  { id: 'md-5', market: 'Australia', marketCode: 'AU', description: 'Updated hearing protection regulation AS/NZS 1270', descriptionZh: '更新了听力防护法规AS/NZS 1270', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), type: 'regulation_update' },
];

// Mock enterprise dynamics data
const ENTERPRISE_DYNAMICS: EnterpriseDynamic[] = [
  { id: 'ed-1', enterprise: 'SafeGuard PPE Co., Ltd.', description: 'New protective suit application for Singapore market access', descriptionZh: '新申请防护服在新加坡市场的准入', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), type: 'new_application' },
  { id: 'ed-2', enterprise: 'HeadGuard Industries', description: 'Obtained CE Category II certification for safety helmet', descriptionZh: '安全头盔获得CE Category II认证', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), type: 'certification_obtained' },
  { id: 'ed-3', enterprise: 'ChemSafe Manufacturing', description: 'Entered Australian market with chemical protective suit', descriptionZh: '化学防护服进入澳大利亚市场', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), type: 'market_entry' },
  { id: 'ed-4', enterprise: 'MediShield Corp.', description: 'Applied for NMPA Class II registration for medical mask', descriptionZh: '医用口罩申请NMPA II类注册', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), type: 'new_application' },
];

// --- Helper functions ---

function formatRelativeTime(timestamp: string, t: Record<string, string>): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return t.justNow || 'Just now';
  if (minutes < 60) return (t.minutesAgo || '{n}m ago').replace('{n}', String(minutes));
  if (hours < 24) return (t.hoursAgo || '{n}h ago').replace('{n}', String(hours));
  if (days < 7) return (t.daysAgo || '{n}d ago').replace('{n}', String(days));
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getActivityIcon(type: ActivityItem['type']) {
  switch (type) {
    case 'compliance_check': return { icon: CheckCircle, bg: 'bg-[#339999]/10', color: 'text-[#339999]' };
    case 'document_download': return { icon: Download, bg: 'bg-green-100', color: 'text-green-600' };
    case 'product_search': return { icon: Search, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'regulation_review': return { icon: BookOpen, bg: 'bg-purple-100', color: 'text-purple-600' };
    case 'login': return { icon: Activity, bg: 'bg-gray-100', color: 'text-gray-600' };
    case 'profile_update': return { icon: Edit, bg: 'bg-amber-100', color: 'text-amber-600' };
    default: return { icon: Activity, bg: 'bg-gray-100', color: 'text-gray-600' };
  }
}

function getSavedItemIcon(type: SavedItem['type']) {
  switch (type) {
    case 'product': return { icon: Package, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'enterprise': return { icon: Building, bg: 'bg-amber-100', color: 'text-amber-600' };
    case 'regulation': return { icon: Bookmark, bg: 'bg-purple-100', color: 'text-purple-600' };
    case 'news': return { icon: Newspaper, bg: 'bg-green-100', color: 'text-green-600' };
    default: return { icon: Star, bg: 'bg-amber-100', color: 'text-amber-600' };
  }
}

function getMembershipLabel(tier: string | undefined, t: Record<string, string>): string {
  switch (tier) {
    case 'professional': return t.professionalPlan || 'Professional';
    case 'enterprise': return t.enterprisePlanLabel || 'Enterprise';
    case 'starter': return t.starterPlan || 'Starter';
    default: return t.freePlan || 'Free';
  }
}

function getMembershipColor(tier: string | undefined): string {
  switch (tier) {
    case 'professional': return 'bg-[#339999]/10 text-[#339999]';
    case 'enterprise': return 'bg-purple-100 text-purple-700';
    case 'starter': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-600';
  }
}

function getDynamicTypeIcon(type: string) {
  switch (type) {
    case 'regulation_update': return { icon: BookOpen, bg: 'bg-purple-100', color: 'text-purple-600' };
    case 'new_standard': return { icon: Star, bg: 'bg-amber-100', color: 'text-amber-600' };
    case 'policy_change': return { icon: Shield, bg: 'bg-red-100', color: 'text-red-600' };
    case 'new_application': return { icon: ClipboardCheck, bg: 'bg-blue-100', color: 'text-blue-600' };
    case 'certification_obtained': return { icon: Award, bg: 'bg-green-100', color: 'text-green-600' };
    case 'market_entry': return { icon: Globe, bg: 'bg-[#339999]/10', color: 'text-[#339999]' };
    default: return { icon: Activity, bg: 'bg-gray-100', color: 'text-gray-600' };
  }
}

function getTrackingStatusLabel(status: string, t: Record<string, string>) {
  switch (status) {
    case 'compliant': return { text: t.validStatus || 'Compliant', bg: 'bg-green-100 text-green-700' };
    case 'pending': return { text: locale_isZh(t) ? '审核中' : 'Under Review', bg: 'bg-yellow-100 text-yellow-700' };
    case 'non_compliant': return { text: t.expiredStatus || 'Non-compliant', bg: 'bg-red-100 text-red-700' };
    default: return { text: locale_isZh(t) ? '未知' : 'Unknown', bg: 'bg-gray-100 text-gray-600' };
  }
}

function locale_isZh(t: Record<string, string>): boolean {
  // Simple check: if the key exists in Chinese, we're in zh locale
  return t.complianceChecks === '合规检查';
}

// --- Main Component ---

export default function DashboardPage() {
  const router = useRouter();
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityStats, setActivityStats] = useState<ActivityStats>(getDefaultActivityStats());
  const [activityFeed, setActivityFeed] = useState<ActivityItem[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);
  const [activeSavedTab, setActiveSavedTab] = useState<'all' | 'product' | 'enterprise' | 'regulation' | 'news'>('all');
  const [favoriteSearch, setFavoriteSearch] = useState('');
  const [showAddTracking, setShowAddTracking] = useState(false);
  const [newTrackingProduct, setNewTrackingProduct] = useState('');
  const [newTrackingCert, setNewTrackingCert] = useState('');
  const [newTrackingMarket, setNewTrackingMarket] = useState('EU');

  // Initialize user and data from localStorage
  useEffect(() => {
    let userData = localStorage.getItem(STORAGE_KEYS.USER)
    if (!userData) {
      userData = sessionStorage.getItem(STORAGE_KEYS.USER)
    }

    if (!userData) {
      router.push('/auth/login')
      return
    }

    try {
      const parsed = JSON.parse(userData)
      if (!parsed || !parsed.id) {
        localStorage.removeItem(STORAGE_KEYS.USER)
        sessionStorage.removeItem(STORAGE_KEYS.USER)
        router.push('/auth/login')
        return
      }
      setUser(parsed)
    } catch {
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
      const defaultFeed = getDefaultActivityFeed();
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

    // Load or initialize tracking items
    const tracking = getFromStorage<TrackingItem[]>(STORAGE_KEYS.TRACKING_ITEMS, null);
    if (!tracking || tracking.length === 0) {
      const defaultTracking = getDefaultTrackingItems();
      setToStorage(STORAGE_KEYS.TRACKING_ITEMS, defaultTracking);
      setTrackingItems(defaultTracking);
    } else {
      setTrackingItems(tracking);
    }

    setLoading(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    router.push('/');
  }, [router]);

  const handleRemoveSavedItem = useCallback((id: string) => {
    const updated = savedItems.filter(item => item.id !== id);
    setSavedItems(updated);
    setToStorage(STORAGE_KEYS.SAVED_ITEMS, updated);
  }, [savedItems]);

  const handleAddTracking = useCallback(() => {
    if (!newTrackingProduct.trim()) return;
    const newItem: TrackingItem = {
      id: `track-${Date.now()}`,
      productName: newTrackingProduct.trim(),
      certificateNumber: newTrackingCert.trim(),
      status: 'unknown',
      market: newTrackingMarket,
      addedAt: new Date().toISOString(),
    };
    const updated = [...trackingItems, newItem];
    setTrackingItems(updated);
    setToStorage(STORAGE_KEYS.TRACKING_ITEMS, updated);
    setNewTrackingProduct('');
    setNewTrackingCert('');
    setShowAddTracking(false);
  }, [newTrackingProduct, newTrackingCert, newTrackingMarket, trackingItems]);

  const handleRemoveTracking = useCallback((id: string) => {
    const updated = trackingItems.filter(item => item.id !== id);
    setTrackingItems(updated);
    setToStorage(STORAGE_KEYS.TRACKING_ITEMS, updated);
  }, [trackingItems]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#339999] mx-auto mb-4"></div>
          <p className="text-gray-500">{t.redirectingToLogin}</p>
        </div>
      </div>
    );
  }

  // Filter saved items by tab and search
  const filteredSavedItems = savedItems.filter(item => {
    const matchesTab = activeSavedTab === 'all' || item.type === activeSavedTab;
    const matchesSearch = !favoriteSearch ||
      item.title.toLowerCase().includes(favoriteSearch.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(favoriteSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Membership tier details
  const membershipTier = user.membership || 'free';
  const membershipLabel = getMembershipLabel(membershipTier, t);
  const isPaidPlan = membershipTier === 'professional' || membershipTier === 'enterprise';
  const isPro = membershipTier === 'professional';
  const isEnterprise = membershipTier === 'enterprise';

  // Settings links
  const settingsLinks = [
    { icon: Edit, title: t.profileSettings, description: t.profileSettingsDesc, href: '/dashboard/settings' },
    { icon: Bell, title: t.notificationPreferences, description: t.notificationPreferencesDesc, href: '/dashboard/notifications' },
    ...(isPro || isEnterprise ? [{ icon: Key, title: t.apiKeyManagement, description: t.apiKeyManagementDesc, href: '/dashboard/api-keys' }] : []),
    { icon: Lock, title: t.securitySettings, description: t.securitySettingsDesc, href: '/dashboard/settings#security' },
  ];

  // Quick action items
  const quickActions = [
    { icon: Search, title: t.searchProducts, description: t.searchProductsDesc, href: '/products', bg: 'bg-blue-100', color: 'text-blue-600' },
    { icon: CheckCircle, title: t.checkCompliance, description: t.checkComplianceDesc, href: '/market-access', bg: 'bg-[#339999]/10', color: 'text-[#339999]' },
    { icon: Download, title: t.downloadTemplates, description: t.downloadTemplatesDesc, href: '/documents', bg: 'bg-green-100', color: 'text-green-600' },
    { icon: BookOpen, title: t.viewRegulations, description: t.viewRegulationsDesc, href: '/regulations', bg: 'bg-purple-100', color: 'text-purple-600' },
  ];

  // Feature access based on membership
  const featureAccess = {
    showMarketDynamics: true, // All users
    showEnterpriseDynamics: isPro || isEnterprise,
    showFavorites: true, // All users
    showTracking: isPro || isEnterprise,
    showApiKeys: isPro || isEnterprise,
    showComplianceTracker: true, // All users
    showCertificateAlerts: isPro || isEnterprise,
    showDocumentGenerator: isPro || isEnterprise,
    showCustomReports: isEnterprise,
  };

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
                  {user.name || (locale === 'zh' ? '用户' : 'User')}
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
                    {t.activeStatus}
                  </span>
                  {user.role === 'admin' && (
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                      {t.administrator}
                    </span>
                  )}
                  {user.created_at && (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {t.joined} {new Date(user.created_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4 md:mt-0">
                <Link href="/dashboard/settings">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1.5" />
                    {t.editProfile}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  {t.signOut}
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
              {t.activityOverview}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#339999]/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-[#339999]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">{activityStats.complianceChecks}</div>
                    <div className="text-gray-500 text-sm">{t.complianceChecks}</div>
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
                    <div className="text-gray-500 text-sm">{t.docsDownloaded}</div>
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
                    <div className="text-gray-500 text-sm">{t.productsSearched}</div>
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
                    <div className="text-gray-500 text-sm">{t.regulationsReviewed}</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ============================== */}
          {/* 3. Market & Enterprise Dynamics */}
          {/* ============================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Market Compliance Dynamics */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#339999]" />
                {t.marketComplianceDynamics}
              </h2>
              <Card className="bg-white shadow-sm p-0 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {MARKET_DYNAMICS.map((item) => {
                    const { icon: ItemIcon, bg, color } = getDynamicTypeIcon(item.type);
                    return (
                      <div key={item.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <ItemIcon className={`w-4.5 h-4.5 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs bg-[#339999]/10 text-[#339999] px-2 py-0.5 rounded font-medium">
                                {item.market} ({item.marketCode})
                              </span>
                              <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                {formatRelativeTime(item.timestamp, t)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {locale === 'zh' ? item.descriptionZh : item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* Enterprise Global Dynamics */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-[#339999]" />
                {t.enterpriseGlobalDynamics}
              </h2>
              <Card className="bg-white shadow-sm p-0 overflow-hidden">
                {featureAccess.showEnterpriseDynamics ? (
                  <div className="divide-y divide-gray-50">
                    {ENTERPRISE_DYNAMICS.map((item) => {
                      const { icon: ItemIcon, bg, color } = getDynamicTypeIcon(item.type);
                      return (
                        <div key={item.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <ItemIcon className={`w-4.5 h-4.5 ${color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">
                                  {item.enterprise}
                                </span>
                                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                                  {formatRelativeTime(item.timestamp, t)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1">
                                {locale === 'zh' ? item.descriptionZh : item.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-2">
                      {locale === 'zh' ? '企业动态为专业版及以上功能' : 'Enterprise dynamics is a Pro+ feature'}
                    </p>
                    <Link href="/pricing">
                      <Button variant="primary" size="sm">
                        <Crown className="w-4 h-4 mr-1.5" />
                        {t.upgradePlan}
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* ============================== */}
          {/* 4. Quick Actions               */}
          {/* ============================== */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#339999]" />
              {t.quickActions}
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

          {/* ============================== */}
          {/* 5. Favorites Section           */}
          {/* ============================== */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-[#339999]" />
              {t.favorites}
            </h2>
            <Card className="bg-white shadow-sm p-0 overflow-hidden">
              {/* Search and Tab filters */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={favoriteSearch}
                      onChange={(e) => setFavoriteSearch(e.target.value)}
                      placeholder={t.searchFavorites}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(['all', 'product', 'enterprise', 'regulation', 'news'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSavedTab(tab)}
                        className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors ${
                          activeSavedTab === tab
                            ? 'bg-[#339999] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tab === 'all' ? (locale === 'zh' ? '全部' : 'All') :
                         tab === 'product' ? t.productFavoriteCategory :
                         tab === 'enterprise' ? t.enterpriseCategory :
                         tab === 'regulation' ? t.regulationCategory :
                         t.newsCategory}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {filteredSavedItems.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Star className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.noFavorites}</p>
                    <p className="text-xs mt-1">{t.noFavoritesDesc}</p>
                  </div>
                ) : (
                  filteredSavedItems.slice(0, 8).map((item) => {
                    const { icon: ItemIcon, bg, color } = getSavedItemIcon(item.type);
                    return (
                      <div key={item.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <ItemIcon className={`w-4.5 h-4.5 ${color}`} />
                          </div>
                          <Link href={item.href} className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.subtitle}</p>
                          </Link>
                          <button
                            onClick={() => handleRemoveSavedItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                            title={t.removeFavorite}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* ============================== */}
          {/* 6. Tracking Section            */}
          {/* ============================== */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#339999]" />
              {t.trackingItems}
            </h2>
            <Card className="bg-white shadow-sm p-0 overflow-hidden">
              {featureAccess.showTracking ? (
                <>
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {locale === 'zh' ? '追踪特定产品的合规状态和证书信息' : 'Track compliance status and certificate info for specific products'}
                    </p>
                    <Button variant="primary" size="sm" onClick={() => setShowAddTracking(!showAddTracking)}>
                      <Plus className="w-4 h-4 mr-1" />
                      {t.addTracking}
                    </Button>
                  </div>

                  {/* Add Tracking Form */}
                  {showAddTracking && (
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t.productNameLabel} *</label>
                          <input
                            type="text"
                            value={newTrackingProduct}
                            onChange={(e) => setNewTrackingProduct(e.target.value)}
                            placeholder={locale === 'zh' ? '输入产品名称' : 'Enter product name'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t.certificateNumberLabel}</label>
                          <input
                            type="text"
                            value={newTrackingCert}
                            onChange={(e) => setNewTrackingCert(e.target.value)}
                            placeholder={locale === 'zh' ? '输入证书编号' : 'Enter certificate number'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">{t.marketCode}</label>
                          <select
                            value={newTrackingMarket}
                            onChange={(e) => setNewTrackingMarket(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
                          >
                            <option value="EU">EU</option>
                            <option value="US">US</option>
                            <option value="CN">China</option>
                            <option value="UK">UK</option>
                            <option value="AU">Australia</option>
                            <option value="SG">Singapore</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-3">
                        <Button variant="ghost" size="sm" onClick={() => setShowAddTracking(false)}>
                          {t.cancel}
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleAddTracking}>
                          {t.addTrackingItem}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-gray-50">
                    {trackingItems.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">{locale === 'zh' ? '暂无追踪项目' : 'No tracking items'}</p>
                      </div>
                    ) : (
                      trackingItems.map((item) => {
                        const statusInfo = getTrackingStatusLabel(item.status, t);
                        return (
                          <div key={item.id} className="px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-[#339999]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <ClipboardCheck className="w-4.5 h-4.5 text-[#339999]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-800 truncate">{item.productName}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.bg}`}>
                                    {statusInfo.text}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                  {item.certificateNumber && (
                                    <span className="text-xs text-gray-500">{t.certificateNo}: {item.certificateNumber}</span>
                                  )}
                                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{item.market}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveTracking(item.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
                                title={t.removeFavorite}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <Lock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm mb-2">
                    {locale === 'zh' ? '追踪功能为专业版及以上功能' : 'Tracking is a Pro+ feature'}
                  </p>
                  <Link href="/pricing">
                    <Button variant="primary" size="sm">
                      <Crown className="w-4 h-4 mr-1.5" />
                      {t.upgradePlan}
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>

          {/* Main content grid: Activity Feed + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Recent Activity Feed */}
            <div className="lg:col-span-2">
              <Card className="bg-white shadow-sm p-0 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#339999]" />
                    {t.recentActivity}
                  </h2>
                  <Link href="/dashboard/history" className="text-sm text-[#339999] hover:underline flex items-center gap-1">
                    {locale === 'zh' ? '查看全部' : 'View All'} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <div className="divide-y divide-gray-50">
                  {activityFeed.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                      <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t.noRecentActivity}</p>
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
                                  {formatRelativeTime(item.timestamp, t)}
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

            {/* Membership Status */}
            <div className="lg:col-span-1">
              <Card className="bg-white shadow-sm p-0 overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[#339999]" />
                    {t.membershipStatus}
                  </h2>
                </div>
                <div className="p-5">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Crown className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{membershipLabel}</h3>
                    {isPaidPlan && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium mt-1 inline-block">
                        {t.activeStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm text-center mb-4">
                    {membershipTier === 'free' ? t.freePlanDesc :
                     membershipTier === 'professional' ? t.proPlanDesc :
                     t.enterprisePlanDesc}
                  </p>
                  {/* Feature list */}
                  <div className="space-y-2 mb-4">
                    <div className={`flex items-center gap-2 text-xs ${membershipTier !== 'free' ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t.complianceChecksFeature}
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${membershipTier !== 'free' ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t.pdfReportDownloads}
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isPro || isEnterprise ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {t.apiAccessFeature}
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isEnterprise ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {locale === 'zh' ? '自定义报告' : 'Custom Reports'}
                    </div>
                  </div>
                  <div className="text-center">
                    {membershipTier === 'free' ? (
                      <Link href="/pricing">
                        <Button variant="primary" size="sm" className="w-full">
                          <Crown className="w-4 h-4 mr-1.5" />
                          {t.upgradePlan}
                        </Button>
                      </Link>
                    ) : membershipTier === 'professional' ? (
                      <Link href="/pricing">
                        <Button variant="secondary" size="sm" className="w-full">
                          <ArrowUpRight className="w-4 h-4 mr-1.5" />
                          {t.upgradeToEnterprise}
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/pricing">
                        <Button variant="outline" size="sm" className="w-full">
                          {t.manageSubscription}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ============================== */}
          {/* 7. Settings Section            */}
          {/* ============================== */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#339999]" />
              {t.settingsSection}
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

          {/* Compliance Tools */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#339999]" />
              {t.complianceTools}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/compliance-guides" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{t.complianceGuidesLabel}</h3>
                      <p className="text-gray-500 text-sm">{t.complianceGuidesLabelDesc}</p>
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
                      <h3 className="font-semibold text-gray-800">{t.complianceTrackerLabel}</h3>
                      <p className="text-gray-500 text-sm">{t.complianceTrackerLabelDesc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
              {featureAccess.showCertificateAlerts && (
                <Link href="/certificate-alerts" className="block">
                  <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                        <Award className="w-6 h-6 text-[#339999]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{t.certificateAlertsTitle}</h3>
                        <p className="text-gray-500 text-sm">{t.certificateAlertsSubtitle}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </Link>
              )}
              {featureAccess.showDocumentGenerator && (
                <Link href="/document-generator" className="block">
                  <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-[#339999]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{locale === 'zh' ? '文档生成器' : 'Document Generator'}</h3>
                        <p className="text-gray-500 text-sm">{locale === 'zh' ? '生成合规文档和报告' : 'Generate compliance documents and reports'}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </Link>
              )}
            </div>
          </div>

          {/* Account Management */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#339999]" />
              {t.accountManagement}
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
                        <h3 className="font-semibold text-gray-800">{t.searchHistory}</h3>
                        <span className="px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs rounded-full font-medium">
                          {activityStats.productsSearched}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">{t.searchHistoryDesc}</p>
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
                        <h3 className="font-semibold text-gray-800">{t.myReports}</h3>
                        <span className="px-2 py-0.5 bg-[#339999]/10 text-[#339999] text-xs rounded-full font-medium">
                          {activityStats.documentsDownloaded}
                        </span>
                      </div>
                      <p className="text-gray-500 text-sm">{t.myReportsDesc}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Card>
              </Link>
              {(isPro || isEnterprise) && (
                <Link href="/dashboard/api-keys" className="block">
                  <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                        <Key className="w-6 h-6 text-[#339999]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{t.apiKeys}</h3>
                        <p className="text-gray-500 text-sm">{t.apiKeysDesc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Card>
                </Link>
              )}
              <Link href="/dashboard/notifications" className="block">
                <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                      <Bell className="w-6 h-6 text-[#339999]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{t.notifications}</h3>
                      <p className="text-gray-500 text-sm">{t.notificationsDesc}</p>
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
