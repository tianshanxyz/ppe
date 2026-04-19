'use client';

import { MarketDistribution as CompanyMarketDistribution } from '@/components/company/CompanyProfile';

interface MarketDistribution {
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

interface MarketHeatmapProps {
  markets: MarketDistribution[];
}

interface MarketData {
  market: string;
  region: string;
  revenue: number;
  employees: number;
  active: boolean;
}

// 市场到区域的映射
const marketToRegion: Record<string, string> = {
  'US': 'North America',
  'CA': 'North America',
  'MX': 'North America',
  'UK': 'Europe',
  'DE': 'Europe',
  'FR': 'Europe',
  'IT': 'Europe',
  'ES': 'Europe',
  'NL': 'Europe',
  'CN': 'Asia',
  'JP': 'Asia',
  'KR': 'Asia',
  'IN': 'Asia',
  'SG': 'Asia',
  'AU': 'Oceania',
  'NZ': 'Oceania',
  'BR': 'South America',
  'AR': 'South America',
  'CL': 'South America',
  'ZA': 'Africa',
  'EG': 'Africa',
  'NG': 'Africa',
};

// 区域颜色
const regionColors: Record<string, string> = {
  'North America': 'bg-primary-500',
  'Europe': 'bg-indigo-500',
  'Asia': 'bg-green-500',
  'Oceania': 'bg-yellow-500',
  'South America': 'bg-orange-500',
  'Africa': 'bg-red-500',
};

export default function MarketHeatmap({ markets }: MarketHeatmapProps) {
  // 转换市场数据
  const marketData: MarketData[] = markets.map(m => ({
    market: m.market,
    region: marketToRegion[m.market] || 'Other',
    revenue: m.revenue || 0,
    employees: m.employeeCount || 0,
    active: m.isActive,
  }));

  // 按区域分组
  const byRegion = marketData.reduce((acc, m) => {
    if (!acc[m.region]) {
      acc[m.region] = [];
    }
    acc[m.region].push(m);
    return acc;
  }, {} as Record<string, MarketData[]>);

  // 计算总计
  const totalRevenue = marketData.reduce((sum, m) => sum + m.revenue, 0);
  const totalEmployees = marketData.reduce((sum, m) => sum + m.employees, 0);
  const activeMarkets = marketData.filter(m => m.active).length;

  return (
    <div className="space-y-6">
      {/* 统计摘要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Across all markets</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Employees</div>
          <div className="text-2xl font-bold text-slate-900">
            {totalEmployees.toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">Worldwide</div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Active Markets</div>
          <div className="text-2xl font-bold text-slate-900">
            {activeMarkets} / {markets.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">Markets currently operating</div>
        </div>
      </div>

      {/* 区域热力图 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Market Distribution by Region</h3>
        
        <div className="space-y-4">
          {Object.entries(byRegion).map(([region, markets]) => {
            const regionRevenue = markets.reduce((sum, m) => sum + m.revenue, 0);
            const regionPercentage = totalRevenue > 0 ? (regionRevenue / totalRevenue * 100) : 0;
            
            return (
              <div key={region} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${regionColors[region] || 'bg-gray-500'}`} />
                    <span className="text-sm font-medium text-slate-700">{region}</span>
                  </div>
                  <div className="text-sm text-slate-600">
                    ${regionRevenue.toLocaleString()} ({regionPercentage.toFixed(1)}%)
                  </div>
                </div>
                
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${regionColors[region] || 'bg-gray-500'} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${regionPercentage}%` }}
                  />
                </div>
                
                {/* 市场详情 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
                  {markets.map(m => (
                    <div
                      key={m.market}
                      className={`p-2 rounded border ${
                        m.active
                          ? 'bg-green-50 border-green-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">{m.market}</span>
                        {m.active && (
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                        )}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        ${m.revenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500">
                        {m.employees} employees
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 收入分布图 */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue Distribution</h3>
        
        <div className="space-y-3">
          {marketData
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10)
            .map((m, index) => {
              const percentage = totalRevenue > 0 ? (m.revenue / totalRevenue * 100) : 0;
              
              return (
                <div key={m.market} className="flex items-center gap-3">
                  <div className="w-8 text-sm text-slate-600 font-medium">#{index + 1}</div>
                  <div className="w-12 text-sm text-slate-700 font-medium">{m.market}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-3">
                    <div
                      className={`${regionColors[m.region] || 'bg-gray-500'} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm text-slate-700 font-medium">
                    ${m.revenue.toLocaleString()}
                  </div>
                  <div className="w-12 text-right text-xs text-slate-500">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
