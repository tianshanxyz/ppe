'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card } from '@/components/ui';
import { useLocale } from '@/lib/i18n/LocaleProvider'
import { commonTranslations, getTranslations } from '@/lib/i18n/translations'
import { localSignOut } from '@/lib/auth/local-auth'
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
  LayoutDashboard,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Copy,
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

// Compliance Tracker item type
interface ComplianceItem {
  id: string;
  productName: string;
  manufacturer: string;
  market: string;
  regulation: string;
  steps: { name: string; status: string; date: string }[];
  overallProgress: number;
  estimatedCompletion: string;
}

// Certificate Alert item type
interface CertificateAlert {
  id: string;
  productName: string;
  manufacturer: string;
  certificateType: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: string;
  market: string;
}

// API Key type
interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  status: 'active' | 'inactive' | 'revoked' | 'expired';
  createdAt: string;
  lastUsedAt: string | null;
  permissions: string[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  usage: {
    totalRequests: number;
    requestsThisMonth: number;
    requestsToday: number;
  };
}

interface NewKeyResponse {
  id: string;
  name: string;
  fullKey: string;
  keyPrefix: string;
  createdAt: string;
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

// Mock compliance tracker data
const COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: '1',
    productName: 'N95 Respirator XR-500',
    manufacturer: 'SafeGuard PPE Co., Ltd.',
    market: 'US',
    regulation: 'FDA 510(k)',
    steps: [
      { name: 'Predicate Device Identification', status: 'completed', date: '2025-11-15' },
      { name: 'Performance Testing', status: 'completed', date: '2025-12-20' },
      { name: 'Biocompatibility Testing', status: 'completed', date: '2026-01-10' },
      { name: '510(k) Summary Preparation', status: 'in_progress', date: '2026-02-01' },
      { name: 'FDA Submission', status: 'pending', date: '' },
      { name: 'FDA Review & Clearance', status: 'pending', date: '' }
    ],
    overallProgress: 50,
    estimatedCompletion: '2026-08-15'
  },
  {
    id: '2',
    productName: 'Safety Helmet ProShield X1',
    manufacturer: 'HeadGuard Industries',
    market: 'EU',
    regulation: 'CE Category II',
    steps: [
      { name: 'Risk Assessment', status: 'completed', date: '2025-09-01' },
      { name: 'Technical File Preparation', status: 'completed', date: '2025-10-15' },
      { name: 'Notified Body Application', status: 'completed', date: '2025-11-20' },
      { name: 'EU Type Examination (Module B)', status: 'in_progress', date: '2026-01-05' },
      { name: 'Conformity Assessment', status: 'pending', date: '' },
      { name: 'CE Marking & DoC', status: 'pending', date: '' }
    ],
    overallProgress: 55,
    estimatedCompletion: '2026-07-20'
  },
  {
    id: '3',
    productName: 'Chemical Protective Suit CPS-200',
    manufacturer: 'ChemSafe Manufacturing',
    market: 'EU',
    regulation: 'CE Category III',
    steps: [
      { name: 'Risk Assessment', status: 'completed', date: '2025-06-01' },
      { name: 'Technical File Preparation', status: 'completed', date: '2025-07-15' },
      { name: 'EU Type Examination (Module B)', status: 'completed', date: '2025-09-20' },
      { name: 'Quality System Assessment (Module D)', status: 'in_progress', date: '2025-11-10' },
      { name: 'Production Quality Assurance', status: 'pending', date: '' },
      { name: 'CE Marking & DoC', status: 'pending', date: '' }
    ],
    overallProgress: 60,
    estimatedCompletion: '2026-06-30'
  },
  {
    id: '4',
    productName: 'Medical Face Mask Type IIR',
    manufacturer: 'MediShield Corp.',
    market: 'China',
    regulation: 'NMPA Class II',
    steps: [
      { name: 'Product Classification', status: 'completed', date: '2025-08-01' },
      { name: 'Type Testing at NMPA Lab', status: 'in_progress', date: '2025-10-15' },
      { name: 'Clinical Evaluation', status: 'pending', date: '' },
      { name: 'Registration Application', status: 'pending', date: '' },
      { name: 'GMP Inspection', status: 'pending', date: '' },
      { name: 'Registration Certificate', status: 'pending', date: '' }
    ],
    overallProgress: 25,
    estimatedCompletion: '2027-02-28'
  }
];

// Mock certificate alerts data
const CERTIFICATE_ALERTS: CertificateAlert[] = [
  {
    id: '1',
    productName: 'N95 Respirator Model XR-500',
    manufacturer: 'SafeGuard PPE Co., Ltd.',
    certificateType: 'NIOSH Approval',
    certificateNumber: 'NIOSH-2024-1234',
    issueDate: '2024-03-15',
    expiryDate: '2026-03-15',
    daysRemaining: 325,
    status: 'valid',
    market: 'US'
  },
  {
    id: '2',
    productName: 'Safety Helmet ProShield X1',
    manufacturer: 'HeadGuard Industries',
    certificateType: 'CE Certificate',
    certificateNumber: 'CE-2023-5678',
    issueDate: '2023-06-20',
    expiryDate: '2026-06-20',
    daysRemaining: 422,
    status: 'valid',
    market: 'EU'
  },
  {
    id: '3',
    productName: 'Chemical Protective Suit CPS-200',
    manufacturer: 'ChemSafe Manufacturing',
    certificateType: 'CE Category III',
    certificateNumber: 'CE-2022-9012',
    issueDate: '2022-01-10',
    expiryDate: '2026-01-10',
    daysRemaining: 260,
    status: 'expiring_soon',
    market: 'EU'
  },
  {
    id: '4',
    productName: 'Medical Face Mask Type IIR',
    manufacturer: 'MediShield Corp.',
    certificateType: 'FDA 510(k)',
    certificateNumber: 'K240567',
    issueDate: '2024-02-28',
    expiryDate: '2026-02-28',
    daysRemaining: 309,
    status: 'valid',
    market: 'US'
  },
  {
    id: '5',
    productName: 'Anti-impact Gloves AG-100',
    manufacturer: 'HandSafe Solutions',
    certificateType: 'UKCA Certificate',
    certificateNumber: 'UKCA-2023-3456',
    issueDate: '2023-09-01',
    expiryDate: '2026-09-01',
    daysRemaining: 495,
    status: 'valid',
    market: 'UK'
  },
  {
    id: '6',
    productName: 'Safety Footwear SteelToe Pro',
    manufacturer: 'StepSafe Ltd.',
    certificateType: 'CE Certificate',
    certificateNumber: 'CE-2021-7890',
    issueDate: '2021-11-15',
    expiryDate: '2026-05-15',
    daysRemaining: 20,
    status: 'expiring_soon',
    market: 'EU'
  }
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
  return t.complianceChecks === '合规检查';
}

// --- Tab type ---
type DashboardTab = 'overview' | 'compliance-tracker' | 'certificate-alerts' | 'favorites' | 'api-keys' | 'settings';

// --- Main Component ---

export default function DashboardPage() {
  const router = useRouter();
  const locale = useLocale()
  const t = getTranslations(commonTranslations, locale)
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
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

  // Compliance Tracker state
  const [ctSearchQuery, setCtSearchQuery] = useState('');
  const [ctSelectedMarket, setCtSelectedMarket] = useState('all');
  const [ctExpandedItem, setCtExpandedItem] = useState<string | null>(null);

  // Certificate Alerts state
  const [caSearchQuery, setCaSearchQuery] = useState('');
  const [caSelectedStatus, setCaSelectedStatus] = useState('all');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [apiKeysError, setApiKeysError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<NewKeyResponse | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<{
    language: string;
    timezone: string;
    dateFormat: string;
    itemsPerPage: string;
    defaultMarket: string;
    darkMode: boolean;
    notifyRegulationUpdate: boolean;
    notifyCertExpiry: boolean;
    notifyMarketDynamic: boolean;
    notifyEmail: boolean;
    remindDaysBefore: string;
    twoFactorAuth: boolean;
  } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Read tab from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['overview', 'compliance-tracker', 'certificate-alerts', 'favorites', 'api-keys', 'settings'].includes(hash)) {
      setActiveTab(hash as DashboardTab);
    }
  }, []);

  // Update URL hash when tab changes
  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    window.location.hash = tab;
  }, []);

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

    // Load or initialize user settings
    const savedSettings = getFromStorage<Record<string, unknown>>('ppe_user_settings', null);
    const defaultSettings = {
      language: locale || 'en',
      timezone: 'UTC+8',
      dateFormat: 'YYYY-MM-DD',
      itemsPerPage: '20',
      defaultMarket: 'All',
      darkMode: false,
      notifyRegulationUpdate: true,
      notifyCertExpiry: true,
      notifyMarketDynamic: false,
      notifyEmail: true,
      remindDaysBefore: '30',
      twoFactorAuth: false,
    };
    if (savedSettings) {
      setSettings({ ...defaultSettings, ...savedSettings } as typeof defaultSettings);
    } else {
      setToStorage('ppe_user_settings', defaultSettings);
      setSettings(defaultSettings);
    }

    setLoading(false);
  }, [router]);

  // Fetch API keys when api-keys tab is active
  useEffect(() => {
    if (activeTab === 'api-keys') {
      fetchApiKeys();
    }
  }, [activeTab]);

  const fetchApiKeys = async () => {
    try {
      setApiKeysLoading(true);
      setApiKeysError(null);
      const response = await fetch('/api/api-keys');
      const data = await response.json();
      if (data.success) {
        setApiKeys(data.keys || []);
      } else {
        setApiKeysError(data.error || 'Failed to load API keys');
      }
    } catch {
      setApiKeysError('Network error. Please try again.');
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    try {
      setCreating(true);
      setApiKeysError(null);
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await response.json();
      if (data.success && data.apiKey) {
        setNewKey({
          id: data.apiKey.id,
          name: data.apiKey.name,
          fullKey: data.apiKey.fullKey,
          keyPrefix: data.apiKey.keyPrefix,
          createdAt: data.apiKey.metadata?.createdAt,
        });
        setNewKeyName('');
        setShowCreateForm(false);
        fetchApiKeys();
      } else {
        setApiKeysError(data.error || 'Failed to create API key');
      }
    } catch {
      setApiKeysError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm(locale === 'zh' ? '确定要撤销此API密钥吗？此操作不可撤销。' : 'Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }
    try {
      setDeletingId(id);
      setApiKeysError(null);
      const response = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setApiKeys(apiKeys.filter(key => key.id !== id));
      } else {
        setApiKeysError(data.error || 'Failed to revoke API key');
      }
    } catch {
      setApiKeysError('Network error. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '\u2022'.repeat(key.length);
    return key.substring(0, 8) + '\u2022'.repeat(Math.max(0, key.length - 8));
  };

  const getApiKeyStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      revoked: 'bg-red-100 text-red-700',
      expired: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleLogout = useCallback(() => {
    localSignOut();
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

  // Filter compliance tracker items
  const ctMarkets = ['all', 'EU', 'US', 'China', 'UK'];
  const filteredComplianceItems = COMPLIANCE_ITEMS.filter(item => {
    const matchesMarket = ctSelectedMarket === 'all' || item.market === ctSelectedMarket;
    const matchesSearch = !ctSearchQuery ||
      item.productName.toLowerCase().includes(ctSearchQuery.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(ctSearchQuery.toLowerCase()) ||
      item.regulation.toLowerCase().includes(ctSearchQuery.toLowerCase());
    return matchesMarket && matchesSearch;
  });

  // Filter certificate alerts
  const caStatuses = ['all', 'valid', 'expiring_soon', 'expired'];
  const filteredCertificateAlerts = CERTIFICATE_ALERTS.filter(alert => {
    const matchesStatus = caSelectedStatus === 'all' || alert.status === caSelectedStatus;
    const matchesSearch = !caSearchQuery ||
      alert.productName.toLowerCase().includes(caSearchQuery.toLowerCase()) ||
      alert.manufacturer.toLowerCase().includes(caSearchQuery.toLowerCase()) ||
      alert.certificateNumber.toLowerCase().includes(caSearchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Membership tier details
  const membershipTier = user.membership || 'free';
  const membershipLabel = getMembershipLabel(membershipTier, t);
  const isPaidPlan = membershipTier === 'professional' || membershipTier === 'enterprise';
  const isPro = membershipTier === 'professional';
  const isEnterprise = membershipTier === 'enterprise';

  // Feature access based on membership
  const featureAccess = {
    showMarketDynamics: true,
    showEnterpriseDynamics: isPro || isEnterprise,
    showFavorites: true,
    showTracking: isPro || isEnterprise,
    showApiKeys: isPro || isEnterprise,
    showComplianceTracker: true,
    showCertificateAlerts: isPro || isEnterprise,
    showDocumentGenerator: isPro || isEnterprise,
    showCustomReports: isEnterprise,
  };

  // Navigation menu items
  const navItems: { key: DashboardTab; icon: React.ElementType; labelEn: string; labelZh: string }[] = [
    { key: 'overview', icon: LayoutDashboard, labelEn: 'Overview', labelZh: '概览' },
    { key: 'compliance-tracker', icon: ClipboardCheck, labelEn: 'Compliance Tracker', labelZh: '合规追踪' },
    { key: 'certificate-alerts', icon: Award, labelEn: 'Certificate Alerts', labelZh: '证书提醒' },
    { key: 'favorites', icon: Heart, labelEn: 'Favorites', labelZh: '收藏夹' },
    { key: 'api-keys', icon: Key, labelEn: 'API Keys', labelZh: 'API密钥' },
    { key: 'settings', icon: Settings, labelEn: 'Settings', labelZh: '设置' },
  ];

  // Quick action items
  const quickActions = [
    { icon: Search, title: t.searchProducts, description: t.searchProductsDesc, href: '/products', bg: 'bg-blue-100', color: 'text-blue-600' },
    { icon: CheckCircle, title: t.checkCompliance, description: t.checkComplianceDesc, href: '/market-access', bg: 'bg-[#339999]/10', color: 'text-[#339999]' },
    { icon: Download, title: t.downloadTemplates, description: t.downloadTemplatesDesc, href: '/documents', bg: 'bg-green-100', color: 'text-green-600' },
    { icon: BookOpen, title: t.viewRegulations, description: t.viewRegulationsDesc, href: '/regulations', bg: 'bg-purple-100', color: 'text-purple-600' },
  ];

  // Settings links
  const settingsLinks = [
    { icon: Edit, title: t.profileSettings, description: t.profileSettingsDesc, action: undefined as string | undefined },
    { icon: Bell, title: t.notificationPreferences, description: t.notificationPreferencesDesc, action: undefined as string | undefined },
    ...(isPro || isEnterprise ? [{ icon: Key, title: t.apiKeyManagement, description: t.apiKeyManagementDesc, action: 'api-keys' as string | undefined }] : []),
    { icon: Lock, title: t.securitySettings, description: t.securitySettingsDesc, action: undefined as string | undefined },
  ];

  // --- Render tab content ---

  const renderOverview = () => (
    <>
      {/* User Profile Section */}
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
            <Button variant="outline" size="sm" onClick={() => handleTabChange('settings')}>
              <Edit className="w-4 h-4 mr-1.5" />
              {t.editProfile}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />
              {t.signOut}
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Overview */}
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

      {/* Market & Enterprise Dynamics */}
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

      {/* Quick Actions */}
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

      {/* Tracking Section */}
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

      {/* Recent Activity Feed + Membership Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-sm p-0 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#339999]" />
                {t.recentActivity}
              </h2>
              <span className="text-sm text-[#339999] flex items-center gap-1">
                {locale === 'zh' ? '查看全部' : 'View All'} <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
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
          <div className="block cursor-pointer" onClick={() => handleTabChange('compliance-tracker')}>
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
          </div>
          {featureAccess.showCertificateAlerts && (
            <div className="block cursor-pointer" onClick={() => handleTabChange('certificate-alerts')}>
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
            </div>
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
            </div>
          </Card>
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
            </div>
          </Card>
          {(isPro || isEnterprise) && (
            <div className="block cursor-pointer" onClick={() => handleTabChange('api-keys')}>
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
            </div>
          )}
          <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#339999]/10 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#339999]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{t.notifications}</h3>
                <p className="text-gray-500 text-sm">{t.notificationsDesc}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );

  const renderComplianceTracker = () => {
    const getStepIcon = (status: string) => {
      switch (status) {
        case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
        case 'in_progress': return <Clock className="w-5 h-5 text-[#339999] animate-pulse" />;
        case 'pending': return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
        default: return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      }
    };

    const getStepStatusLabel = (status: string) => {
      switch (status) {
        case 'completed': return locale === 'zh' ? '已完成' : 'Completed';
        case 'in_progress': return locale === 'zh' ? '进行中' : 'In Progress';
        case 'pending': return locale === 'zh' ? '待处理' : 'Pending';
        default: return status;
      }
    };

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-[#339999]" />
            {t.complianceTrackerTitle}
          </h2>
          <p className="text-gray-500 mt-1">{t.complianceTrackerSubtitle}</p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={ctSearchQuery}
              onChange={(e) => setCtSearchQuery(e.target.value)}
              placeholder={t.searchProductsPlaceholder}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ctMarkets.map(market => (
              <button
                key={market}
                onClick={() => setCtSelectedMarket(market)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  ctSelectedMarket === market
                    ? 'bg-[#339999] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {market === 'all' ? t.allMarkets : market}
              </button>
            ))}
          </div>
        </div>

        {/* Items */}
        {filteredComplianceItems.length > 0 ? (
          <div className="space-y-6">
            {filteredComplianceItems.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setCtExpandedItem(ctExpandedItem === item.id ? null : item.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{item.productName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Building className="w-4 h-4" />
                          {item.manufacturer}
                        </span>
                        <span className="text-xs bg-[#339999]/10 text-[#339999] px-2 py-1 rounded">{item.market}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.regulation}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#339999]">{item.overallProgress}%</div>
                      <div className="text-xs text-gray-400">{t.overallProgress}</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-[#339999] h-2 rounded-full transition-all duration-500"
                      style={{ width: `${item.overallProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{t.estCompletion}: {item.estimatedCompletion}</span>
                    <span>{item.steps.filter(s => s.status === 'completed').length}/{item.steps.length} {t.stepsCompleted}</span>
                  </div>
                </div>

                {ctExpandedItem === item.id && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">{t.complianceSteps}</h4>
                    <div className="space-y-3">
                      {item.steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-4">
                          {getStepIcon(step.status)}
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              step.status === 'completed' ? 'text-gray-500 line-through' :
                              step.status === 'in_progress' ? 'text-[#339999]' :
                              'text-gray-700'
                            }`}>
                              {step.name}
                            </p>
                            {step.date && (
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {step.date}
                              </p>
                            )}
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            step.status === 'completed' ? 'bg-green-100 text-green-700' :
                            step.status === 'in_progress' ? 'bg-[#339999]/10 text-[#339999]' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {getStepStatusLabel(step.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.noComplianceItems}</p>
          </div>
        )}
      </>
    );
  };

  const renderCertificateAlerts = () => {
    const getStatusBadge = (status: string, daysRemaining: number) => {
      if (status === 'expired' || daysRemaining <= 0) {
        return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> {t.expiredStatus}</span>;
      }
      if (status === 'expiring_soon' || daysRemaining <= 90) {
        return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3" /> {t.expiringSoonStatus}</span>;
      }
      return <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700"><CheckCircle2 className="w-3 h-3" /> {t.validStatus}</span>;
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'all': return t.allLabel;
        case 'valid': return t.validStatus;
        case 'expiring_soon': return t.expiringSoonStatus;
        case 'expired': return t.expiredStatus;
        default: return status.replace('_', ' ');
      }
    };

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-[#339999]" />
            {t.certificateAlertsTitle}
          </h2>
          <p className="text-gray-500 mt-1">{t.certificateAlertsSubtitle}</p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={caSearchQuery}
              onChange={(e) => setCaSearchQuery(e.target.value)}
              placeholder={t.searchCertificates}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:border-[#339999] focus:ring-2 focus:ring-[#339999]/20 focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {caStatuses.map(status => (
              <button
                key={status}
                onClick={() => setCaSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  caSelectedStatus === status
                    ? 'bg-[#339999] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {filteredCertificateAlerts.length > 0 ? (
          <div className="space-y-4">
            {filteredCertificateAlerts.map(alert => (
              <div key={alert.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{alert.productName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">{alert.manufacturer}</span>
                    </div>
                  </div>
                  {getStatusBadge(alert.status, alert.daysRemaining)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{t.certificateTypeLabel}</p>
                    <p className="text-sm font-medium text-gray-700">{alert.certificateType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{t.certificateNo}</p>
                    <p className="text-sm font-medium text-gray-700">{alert.certificateNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{t.marketCode}</p>
                    <p className="text-sm font-medium text-gray-700">{alert.market}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{t.daysRemainingLabel}</p>
                    <p className={`text-sm font-bold ${alert.daysRemaining <= 90 ? 'text-red-600' : 'text-green-600'}`}>
                      {alert.daysRemaining} {locale === 'zh' ? '天' : 'days'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {t.issued}: {alert.issueDate}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {t.expires}: {alert.expiryDate}</span>
                  </div>
                  <button className="text-sm text-[#339999] hover:text-[#2d8b8b] font-medium">
                    {t.setReminder}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.noCertificateAlerts}</p>
          </div>
        )}
      </>
    );
  };

  const renderFavorites = () => (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Heart className="w-6 h-6 text-[#339999]" />
          {t.favorites}
        </h2>
      </div>

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
            filteredSavedItems.map((item) => {
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
    </>
  );

  const renderApiKeys = () => {
    if (apiKeysLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#339999]" />
        </div>
      );
    }

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Key className="w-6 h-6 text-[#339999]" />
            {t.apiKeys}
          </h2>
          <p className="text-gray-500 mt-1">{t.apiKeyManagementDesc}</p>
        </div>

        {/* Error Alert */}
        {apiKeysError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{apiKeysError}</span>
            <button
              onClick={() => setApiKeysError(null)}
              className="ml-auto text-sm underline hover:no-underline"
            >
              {locale === 'zh' ? '关闭' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* New Key Success */}
        {newKey && (
          <Card className="p-6 mb-6 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">
                  {locale === 'zh' ? 'API密钥创建成功' : 'API Key Created Successfully'}
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  {locale === 'zh' ? '请立即复制您的API密钥。出于安全考虑，您将无法再次查看。' : 'Copy your API key now. For security reasons, you won\'t be able to see it again.'}
                </p>
                <div className="flex items-center gap-2 mb-4">
                  <code className="flex-1 bg-white px-4 py-3 rounded-lg text-sm font-mono text-gray-800 break-all border">
                    {newKey.fullKey}
                  </code>
                  <Button
                    onClick={() => handleCopyKey(newKey.fullKey, 'new')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {copiedId === 'new' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setNewKey(null)}
                  className="text-green-700 border-green-300 hover:bg-green-100"
                >
                  {locale === 'zh' ? '我已复制密钥' : 'I\'ve copied my key'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Create Button */}
        {!showCreateForm && (
          <Button
            className="mb-6 bg-[#339999] hover:bg-[#2a7a7a]"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'zh' ? '创建新密钥' : 'Create New Key'}
          </Button>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {locale === 'zh' ? '创建新API密钥' : 'Create New API Key'}
            </h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder={locale === 'zh' ? '输入密钥名称（例如：生产环境、开发环境）' : 'Enter key name (e.g., Production, Development)'}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={creating}
              />
              <Button
                onClick={handleCreateKey}
                className="bg-[#339999] hover:bg-[#2a7a7a]"
                disabled={creating || !newKeyName.trim()}
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : (locale === 'zh' ? '创建' : 'Create')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                {t.cancel}
              </Button>
            </div>
          </Card>
        )}

        {/* API Keys List */}
        {apiKeys.length === 0 ? (
          <Card className="p-12 text-center">
            <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {locale === 'zh' ? '暂无API密钥' : 'No API Keys'}
            </h3>
            <p className="text-gray-500 mb-4">
              {locale === 'zh' ? '创建您的第一个API密钥以开始使用MDLooker API' : 'Create your first API key to start using the MDLooker API'}
            </p>
            <Button
              className="bg-[#339999] hover:bg-[#2a7a7a]"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              {locale === 'zh' ? '创建API密钥' : 'Create API Key'}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <Key className="w-5 h-5 text-[#339999]" />
                      <h3 className="font-semibold text-gray-900">{apiKey.name}</h3>
                      {getApiKeyStatusBadge(apiKey.status)}
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm font-mono text-gray-700">
                        {visibleKeys.has(apiKey.id) ? `${apiKey.keyPrefix}...` : maskKey(apiKey.keyPrefix + '\u2022'.repeat(32))}
                      </code>
                      <button
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title={visibleKeys.has(apiKey.id) ? (locale === 'zh' ? '隐藏密钥' : 'Hide key') : (locale === 'zh' ? '显示密钥前缀' : 'Show key prefix')}
                      >
                        {visibleKeys.has(apiKey.id) ? (
                          <Eye className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">{locale === 'zh' ? '创建时间' : 'Created'}</p>
                        <p className="text-gray-700">{new Date(apiKey.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">{locale === 'zh' ? '最后使用' : 'Last Used'}</p>
                        <p className="text-gray-700">
                          {apiKey.lastUsedAt
                            ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                            : (locale === 'zh' ? '从未使用' : 'Never')
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">{locale === 'zh' ? '总请求数' : 'Total Requests'}</p>
                        <p className="text-gray-700">{apiKey.usage?.totalRequests?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">{locale === 'zh' ? '本月请求数' : 'This Month'}</p>
                        <p className="text-gray-700">{apiKey.usage?.requestsThisMonth?.toLocaleString() || 0}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>{locale === 'zh' ? '速率限制' : 'Rate Limit'}: {apiKey.rateLimit?.requestsPerMinute || 60}/min</span>
                      <span>&bull;</span>
                      <span>{apiKey.rateLimit?.requestsPerHour || 1000}/hour</span>
                      <span>&bull;</span>
                      <span>{apiKey.rateLimit?.requestsPerDay || 10000}/day</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(apiKey.id)}
                    disabled={deletingId === apiKey.id || apiKey.status === 'revoked'}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-4 flex-shrink-0"
                  >
                    {deletingId === apiKey.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info */}
        <Card className="p-6 mt-6 bg-[#339999]/5 border-[#339999]/20">
          <h3 className="font-semibold text-[#339999] mb-3">{locale === 'zh' ? 'API使用说明' : 'API Usage Instructions'}</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">&bull;</span>
              <span>{locale === 'zh' ? '在请求头中包含您的API密钥：' : 'Include your API key in the'} <code className="bg-gray-100 px-1 rounded">Authorization</code> {locale === 'zh' ? '' : 'header:'} <code className="bg-gray-100 px-1 rounded">Bearer YOUR_API_KEY</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">&bull;</span>
              <span>{locale === 'zh' ? '每个密钥都有速率限制。升级您的方案以获得更高的限制。' : 'Each key has rate limits. Upgrade your plan for higher limits.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">&bull;</span>
              <span>{locale === 'zh' ? '请保管好您的密钥。切勿在客户端代码中暴露。' : 'Keep your keys secure. Never expose them in client-side code.'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#339999]">&bull;</span>
              <span>{locale === 'zh' ? '如果密钥泄露，请立即撤销并创建新密钥。' : 'If a key is compromised, revoke it immediately and create a new one.'}</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-[#339999]/10">
            <a
              href="/docs/api"
              className="text-sm text-[#339999] hover:underline font-medium"
            >
              {locale === 'zh' ? '查看API文档' : 'View API Documentation'} &rarr;
            </a>
          </div>
        </Card>
      </>
    );
  };

  const updateSetting = useCallback(<K extends string>(key: K, value: unknown) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated as typeof settings);
    setToStorage('ppe_user_settings', updated);
  }, [settings]);

  // Mock login history
  const loginHistory = [
    { time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), device: 'Chrome / macOS', ip: '192.168.1.100' },
    { time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), device: 'Safari / iOS', ip: '10.0.0.55' },
    { time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), device: 'Chrome / Windows', ip: '172.16.0.12' },
    { time: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), device: 'Firefox / Linux', ip: '192.168.2.34' },
    { time: new Date(Date.now() - 1000 * 60 * 60 * 168).toISOString(), device: 'Chrome / macOS', ip: '192.168.1.100' },
  ];

  const renderSettings = () => {
    if (!settings) return null;

    const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
      <button
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#339999]' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        disabled={disabled}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    );

    return (
      <>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#339999]" />
            {t.settingsSection}
          </h2>
        </div>

        {/* User Preferences */}
        <Card className="p-6 bg-white shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#339999]" />
            {locale === 'zh' ? '用户偏好' : 'User Preferences'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '语言偏好' : 'Language'}
              </label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '时区' : 'Timezone'}
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => updateSetting('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
              >
                <option value="UTC">UTC</option>
                <option value="UTC+8">UTC+8 {locale === 'zh' ? '北京' : 'Beijing'}</option>
                <option value="UTC-5">UTC-5 {locale === 'zh' ? '纽约' : 'New York'}</option>
                <option value="UTC+1">UTC+1 {locale === 'zh' ? '柏林' : 'Berlin'}</option>
                <option value="UTC+9">UTC+9 {locale === 'zh' ? '东京' : 'Tokyo'}</option>
                <option value="UTC-8">UTC-8 {locale === 'zh' ? '洛杉矶' : 'Los Angeles'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '日期格式' : 'Date Format'}
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => updateSetting('dateFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Display Settings */}
        <Card className="p-6 bg-white shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-[#339999]" />
            {locale === 'zh' ? '显示设置' : 'Display Settings'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '每页显示数量' : 'Items Per Page'}
              </label>
              <select
                value={settings.itemsPerPage}
                onChange={(e) => updateSetting('itemsPerPage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '默认市场' : 'Default Market'}
              </label>
              <select
                value={settings.defaultMarket}
                onChange={(e) => updateSetting('defaultMarket', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
              >
                <option value="All">{locale === 'zh' ? '全部' : 'All'}</option>
                <option value="EU">EU</option>
                <option value="US">US</option>
                <option value="CN">CN</option>
                <option value="UK">UK</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'zh' ? '深色模式' : 'Dark Mode'}
              </label>
              <div className="flex items-center gap-3 py-2">
                <ToggleSwitch checked={settings.darkMode} onChange={(v) => updateSetting('darkMode', v)} disabled />
                <span className="text-xs text-gray-400">{locale === 'zh' ? '即将推出' : 'Coming soon'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6 bg-white shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#339999]" />
            {t.notificationPreferences}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{locale === 'zh' ? '法规更新通知' : 'Regulation Update Notifications'}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '当关注的法规发生变化时通知您' : 'Notify when tracked regulations change'}</p>
              </div>
              <ToggleSwitch checked={settings.notifyRegulationUpdate} onChange={(v) => updateSetting('notifyRegulationUpdate', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{locale === 'zh' ? '证书到期提醒' : 'Certificate Expiry Reminders'}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '证书即将到期时发送提醒' : 'Send reminders when certificates are expiring'}</p>
              </div>
              <ToggleSwitch checked={settings.notifyCertExpiry} onChange={(v) => updateSetting('notifyCertExpiry', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{locale === 'zh' ? '市场动态通知' : 'Market Dynamic Notifications'}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '市场准入政策变化时通知您' : 'Notify when market access policies change'}</p>
              </div>
              <ToggleSwitch checked={settings.notifyMarketDynamic} onChange={(v) => updateSetting('notifyMarketDynamic', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{locale === 'zh' ? '邮件通知' : 'Email Notifications'}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '通过邮件接收重要通知' : 'Receive important notifications via email'}</p>
              </div>
              <ToggleSwitch checked={settings.notifyEmail} onChange={(v) => updateSetting('notifyEmail', v)} />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">{locale === 'zh' ? '提前提醒天数' : 'Remind Days Before Expiry'}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '证书到期前多少天发送提醒' : 'How many days before expiry to send reminder'}</p>
              </div>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.remindDaysBefore}
                onChange={(e) => updateSetting('remindDaysBefore', e.target.value)}
                className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:border-[#339999] focus:ring-1 focus:ring-[#339999]/20 focus:outline-none"
              />
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card className="p-6 bg-white shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#339999]" />
            {t.securitySettings}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{locale === 'zh' ? '修改密码' : 'Change Password'}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '更新您的账户密码' : 'Update your account password'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordModal(true)}>
                <Edit className="w-4 h-4 mr-1.5" />
                {locale === 'zh' ? '修改密码' : 'Change'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">{locale === 'zh' ? '两步验证' : 'Two-Factor Authentication'}</p>
                <p className="text-xs text-gray-500">{locale === 'zh' ? '为您的账户添加额外安全层' : 'Add an extra layer of security to your account'}</p>
              </div>
              <ToggleSwitch checked={settings.twoFactorAuth} onChange={(v) => updateSetting('twoFactorAuth', v)} />
            </div>
          </div>

          {/* Login History */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">{locale === 'zh' ? '登录历史' : 'Login History'}</h4>
            <div className="space-y-2">
              {loginHistory.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{entry.device}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{entry.ip}</span>
                    <span>{formatRelativeTime(entry.time, t)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Account info */}
        <Card className="p-6 bg-white shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#339999]" />
            {locale === 'zh' ? '账户信息' : 'Account Information'}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#339999] to-[#2d8b8b] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{user.name || (locale === 'zh' ? '用户' : 'User')}</h4>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 ${getMembershipColor(membershipTier)} text-xs rounded-full font-medium`}>
                    {membershipLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-1.5" />
              {t.signOut}
            </Button>
          </div>
        </Card>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{locale === 'zh' ? '修改密码' : 'Change Password'}</h3>
                <p className="text-gray-600 text-sm mb-6">
                  {locale === 'zh' ? '请联系管理员修改密码。' : 'Please contact the administrator to change your password.'}
                </p>
                <Button variant="primary" onClick={() => setShowPasswordModal(false)}>
                  {t.close}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // --- Render main layout ---
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex gap-8">
            {/* Left Navigation */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <nav className="sticky top-24 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleTabChange(item.key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-[#339999] text-white shadow-md shadow-[#339999]/20'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{locale === 'zh' ? item.labelZh : item.labelEn}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Mobile Tab Navigation */}
            <div className="lg:hidden w-full">
              <div className="flex gap-1.5 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleTabChange(item.key)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                        isActive
                          ? 'bg-[#339999] text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                      <span>{locale === 'zh' ? item.labelZh : item.labelEn}</span>
                    </button>
                  );
                })}
              </div>

              {/* Content Area - Mobile */}
              <div>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'compliance-tracker' && renderComplianceTracker()}
                {activeTab === 'certificate-alerts' && renderCertificateAlerts()}
                {activeTab === 'favorites' && renderFavorites()}
                {activeTab === 'api-keys' && renderApiKeys()}
                {activeTab === 'settings' && renderSettings()}
              </div>
            </div>

            {/* Right Content Area - Desktop */}
            <div className="hidden lg:block flex-1 min-w-0">
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'compliance-tracker' && renderComplianceTracker()}
              {activeTab === 'certificate-alerts' && renderCertificateAlerts()}
              {activeTab === 'favorites' && renderFavorites()}
              {activeTab === 'api-keys' && renderApiKeys()}
              {activeTab === 'settings' && renderSettings()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
