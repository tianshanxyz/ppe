'use client';

import React from 'react';
import { Building, FileText, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

export interface SearchResult {
  id: string;
  type: string;
  market: string;
  title: string;
  description?: string;
  status?: 'active' | 'expired' | 'withdrawn' | 'pending';
  date?: string;
  company?: string;
  url?: string;
  score?: number;
}

interface SearchResultCardProps {
  result: SearchResult;
  onClick: (result: SearchResult) => void;
  highlightQuery?: string;
}

// 获取类型图标
function getTypeIcon(type: string) {
  switch (type) {
    case 'Company':
      return <Building className="w-5 h-5" />;
    case '510(k)':
    case 'PMA':
    case 'De Novo':
      return <FileText className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
}

// 获取状态图标和颜色
function getStatusBadge(status?: string) {
  switch (status) {
    case 'active':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
          <CheckCircle className="w-3 h-3" />
          活跃
        </span>
      );
    case 'expired':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
          <Clock className="w-3 h-3" />
          过期
        </span>
      );
    case 'withdrawn':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
          <XCircle className="w-3 h-3" />
          撤销
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded">
          <AlertCircle className="w-3 h-3" />
          待审批
        </span>
      );
    default:
      return null;
  }
}

// 获取市场标签颜色
function getMarketBadge(market: string) {
  const colors: Record<string, string> = {
    FDA: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
    CE: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    NMPA: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    PMDA: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    Company: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    AI: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',
  };

  const colorClass = colors[market] || colors.Company;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${colorClass}`}>
      {market}
    </span>
  );
}

// 高亮匹配文本
function highlightText(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function SearchResultCard({
  result,
  onClick,
  highlightQuery,
}: SearchResultCardProps) {
  return (
    <div
      onClick={() => onClick(result)}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all cursor-pointer bg-white dark:bg-gray-800"
    >
      {/* 头部：类型和标题 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
          {getTypeIcon(result.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {highlightQuery ? highlightText(result.title, highlightQuery) : result.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {getMarketBadge(result.market)}
            {getStatusBadge(result.status)}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {result.type}
            </span>
          </div>
        </div>
      </div>

      {/* 描述 */}
      {result.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {highlightQuery ? highlightText(result.description, highlightQuery) : result.description}
        </p>
      )}

      {/* 底部信息 */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          {/* 公司信息 */}
          {result.company && (
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4" />
              {highlightQuery ? highlightText(result.company, highlightQuery) : result.company}
            </span>
          )}

          {/* 日期信息 */}
          {result.date && (
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {result.date}
            </span>
          )}
        </div>

        {/* 相关度分数 (如果有) */}
        {result.score !== undefined && result.score > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            相关度：{(result.score * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}
