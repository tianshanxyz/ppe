'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Globe, Calendar, Tag, ChevronRight } from 'lucide-react';

interface Regulation {
  id: string;
  title: string;
  title_zh?: string;
  jurisdiction: string;
  region?: string;
  type: string;
  category?: string;
  regulation_number?: string;
  status: string;
  summary?: string;
  summary_zh?: string;
  keywords?: string[];
  tags?: string[];
  effective_date?: string;
  created_at: string;
}

interface RegulationsLibraryProps {
  initialQuery?: string;
}

export default function RegulationsLibrary({ initialQuery = '' }: RegulationsLibraryProps) {
  const [query, setQuery] = useState(initialQuery);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    market: '',
    category: '',
    type: '',
    status: 'active',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // 搜索法规
  const searchRegulations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: '20',
        ...filters,
      });

      const response = await fetch(`/api/regulations/search?${params}`);
      const result = await response.json();

      if (result.success) {
        setRegulations(result.data);
        setTotalPages(result.pagination.totalPages);
        setTotalCount(result.pagination.total);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(searchRegulations, 500);
    return () => clearTimeout(debounceTimer);
  }, [query, page, filters]);

  // 获取市场选项
  const markets = ['FDA', 'CE', 'NMPA', 'PMDA', 'HC', 'TGA'];
  const categories = ['Medical Device', 'Drug', 'IVD', 'Cosmetic', 'Food Supplement'];
  const types = ['Regulation', 'Standard', 'Guideline', 'Directive'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-primary-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">法规索引库</h1>
          <p className="text-slate-600">
            全球医疗器械法规数据库，提供快速检索和合规指南
          </p>
        </div>

        {/* 搜索区 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索法规标题、摘要、关键词..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 筛选器 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">市场/辖区</label>
              <select
                value={filters.market}
                onChange={(e) => setFilters({ ...filters, market: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部市场</option>
                {markets.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">产品类别</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部类别</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">法规类型</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">全部类型</option>
                {types.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">现行有效</option>
                <option value="draft">草案</option>
                <option value="repealed">已废止</option>
              </select>
            </div>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            找到 <span className="font-semibold text-slate-900">{totalCount}</span> 条法规
          </div>
          <div className="text-sm text-slate-500">
            第 {page} / {totalPages} 页
          </div>
        </div>

        {/* 结果列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-slate-600">加载中...</p>
          </div>
        ) : regulations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">未找到相关法规</h3>
            <p className="text-slate-600">尝试调整搜索关键词或筛选条件</p>
          </div>
        ) : (
          <div className="space-y-4">
            {regulations.map((reg) => (
              <div
                key={reg.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded">
                        {reg.jurisdiction}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded">
                        {reg.type}
                      </span>
                      {reg.regulation_number && (
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                          {reg.regulation_number}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        reg.status === 'active' ? 'bg-green-100 text-green-700' :
                        reg.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {reg.status === 'active' ? '现行有效' :
                         reg.status === 'draft' ? '草案' : '已废止'}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {reg.title}
                    </h3>
                    
                    {reg.title_zh && (
                      <p className="text-sm text-slate-600 mb-2">{reg.title_zh}</p>
                    )}
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>

                {(reg.summary || reg.summary_zh) && (
                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                    {reg.summary_zh || reg.summary}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  {reg.category && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>{reg.category}</span>
                    </div>
                  )}
                  
                  {reg.effective_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>生效日期：{new Date(reg.effective_date).toLocaleDateString('zh-CN')}</span>
                    </div>
                  )}

                  {reg.keywords && reg.keywords.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Globe className="w-3 h-3" />
                      {reg.keywords.slice(0, 3).map((kw, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              上一页
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-4 py-2 rounded-lg ${
                  page === i + 1
                    ? 'bg-primary-600 text-white'
                    : 'border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border border-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
