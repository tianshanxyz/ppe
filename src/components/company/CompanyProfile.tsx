'use client';

import React, { useState } from 'react';
import { 
  Building, 
  MapPin, 
  Calendar, 
  Users, 
  Globe, 
  FileText, 
  CheckCircle, 
  TrendingUp,
  Award,
  Activity,
  Package,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import MarketHeatmap from './MarketHeatmap';

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  website?: string;
  address?: string;
  country?: string;
  foundedDate?: string;
  employeeCount?: string;
  description?: string;
  logoUrl?: string;
  registrations?: Registration[];
  products?: Product[];
  markets?: MarketDistribution[];
}

export interface Registration {
  id: string;
  companyId: string;
  market: string;
  registrationNumber: string;
  registrationType: string;
  status: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  notes?: string;
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  category: string;
  status: string;
  approvedDate?: string;
  expiryDate?: string;
  markets?: string[];
  notes?: string;
}

export interface MarketDistribution {
  id: string;
  companyId: string;
  market: string;
  entryMode: string;
  revenue?: number;
  employeeCount?: number;
  establishedDate?: string;
  officeAddress?: string;
  isActive: boolean;
}

interface CompanyProfileProps {
  company: Company;
}

export function CompanyProfile({ company }: CompanyProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'registrations' | 'products' | 'markets'>('overview');

  // 统计数据
  const stats = {
    totalRegistrations: company.registrations?.length || 0,
    activeRegistrations: company.registrations?.filter(r => r.status === 'active').length || 0,
    totalProducts: company.products?.length || 0,
    marketCount: company.markets?.length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 头部信息区 */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {/* 公司 Logo */}
            <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Building className="w-12 h-12" />
            </div>

            {/* 公司信息 */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">
                {company.name}
              </h1>
              {company.legalName && (
                <p className="text-primary-100 mb-4">
                  {company.legalName}
                </p>
              )}

              {/* 基本信息 */}
              <div className="flex flex-wrap gap-4 text-sm text-primary-100">
                {company.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{company.country}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a href={company.website} target="_blank" className="hover:text-white underline">
                      {company.website}
                    </a>
                  </div>
                )}
                {company.foundedDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>成立于 {company.foundedDate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                关注
              </button>
              <button className="px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                导出报告
              </button>
            </div>
          </div>

          {/* 统计数据 */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary-100 text-sm mb-1">
                <FileText className="w-4 h-4" />
                <span>总注册数</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalRegistrations}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary-100 text-sm mb-1">
                <CheckCircle className="w-4 h-4" />
                <span>有效注册</span>
              </div>
              <div className="text-2xl font-bold">{stats.activeRegistrations}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary-100 text-sm mb-1">
                <Package className="w-4 h-4" />
                <span>产品数量</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary-100 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>市场覆盖</span>
              </div>
              <div className="text-2xl font-bold">{stats.marketCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 标签导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-8">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<Activity className="w-4 h-4" />}
              label="概览"
            />
            <TabButton
              active={activeTab === 'registrations'}
              onClick={() => setActiveTab('registrations')}
              icon={<Award className="w-4 h-4" />}
              label="合规资质"
              count={stats.totalRegistrations}
            />
            <TabButton
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              icon={<Package className="w-4 h-4" />}
              label="产品信息"
              count={stats.totalProducts}
            />
            <TabButton
              active={activeTab === 'markets'}
              onClick={() => setActiveTab('markets')}
              icon={<TrendingUp className="w-4 h-4" />}
              label="市场分布"
              count={stats.marketCount}
            />
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab company={company} />}
        {activeTab === 'registrations' && <RegistrationsTab registrations={company.registrations || []} />}
        {activeTab === 'products' && <ProductsTab products={company.products || []} />}
        {activeTab === 'markets' && <MarketsTab markets={company.markets || []} />}
      </div>
    </div>
  );
}

// 标签按钮组件
function TabButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
        active
          ? 'border-primary-600 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

// 概览标签页
function OverviewTab({ company }: { company: Company }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {/* 基本信息 */}
      <div className="col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            企业基本信息
          </h2>
          <div className="space-y-3">
            {company.description && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">企业简介</h3>
                <p className="text-gray-600 dark:text-gray-400">{company.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {company.address && (
                <InfoItem icon={<MapPin className="w-4 h-4" />} label="注册地址" value={company.address} />
              )}
              {company.employeeCount && (
                <InfoItem icon={<Users className="w-4 h-4" />} label="员工规模" value={company.employeeCount} />
              )}
            </div>
          </div>
        </div>

        {/* 合规资质概览 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            合规资质概览
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {company.registrations?.slice(0, 6).map(reg => (
              <div key={reg.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{reg.market}</div>
                <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{reg.registrationType}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reg.registrationNumber}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 侧边栏 */}
      <div className="space-y-6">
        {/* 快速联系 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">快速联系</h3>
          <div className="space-y-3">
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                <Globe className="w-4 h-4" />
                访问官网
              </a>
            )}
          </div>
        </div>

        {/* 数据更新时间 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">数据更新时间</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            2026-04-08
          </div>
        </div>
      </div>
    </div>
  );
}

// 合规资质标签页
function RegistrationsTab({ registrations }: { registrations: Registration[] }) {
  const getStatusBadge = (status: string) => {
    const badges = {
      active: <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">活跃</span>,
      expired: <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">过期</span>,
      withdrawn: <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">撤销</span>,
      pending: <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">待审批</span>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Award className="w-5 h-5" />
        合规资质列表
      </h2>

      <div className="grid gap-4">
        {registrations.map(reg => (
          <div
            key={reg.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
                    {reg.market}
                  </span>
                  {getStatusBadge(reg.status)}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{reg.registrationType}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{reg.registrationNumber}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">注册日期</div>
                <div className="font-medium text-gray-900 dark:text-white">{reg.issueDate || 'N/A'}</div>
              </div>
            </div>

            {/* 备注 */}
            {reg.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">备注</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{reg.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 产品标签页
function ProductsTab({ products }: { products: Product[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Package className="w-5 h-5" />
        产品信息
      </h2>

      <div className="grid gap-4">
        {products.map(product => (
          <div
            key={product.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.category}</p>
              </div>
              <div className="flex gap-2">
                {product.markets?.slice(0, 3).map((market, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded"
                  >
                    {market}
                  </span>
                ))}
              </div>
            </div>

            {/* 备注 */}
            {product.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">备注</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{product.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 市场分布标签页
function MarketsTab({ markets }: { markets: MarketDistribution[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        市场分布与可视化
      </h2>

      {/* 市场热力图和统计 */}
      {markets.length > 0 ? (
        <MarketHeatmap markets={markets} />
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          暂无市场分布数据
        </div>
      )}
    </div>
  );
}

// 信息项组件
function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-400">{icon}</span>
      <div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-sm text-gray-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
}
