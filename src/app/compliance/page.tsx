'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { ComplianceProfile } from '@/components/medplum/ComplianceProfile';
import { BadgeCheck, FileText, Database, Users, CheckCircle, Loader2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useLocale } from '@/lib/i18n/LocaleProvider';

export default function CompliancePage() {
  const locale = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 加载最近搜索
    const savedSearches = localStorage.getItem('compliance_searches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCompany(query);
    
    // 保存到最近搜索
    const updatedSearches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('compliance_searches', JSON.stringify(updatedSearches));
  };

  const handleRecentSearch = (company: string) => {
    setSelectedCompany(company);
    setSearchQuery(company);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#339999] to-[#2a7a7a] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
              <BadgeCheck className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              {locale === 'zh' ? '合规档案' : 'Compliance Profiles'}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              {locale === 'zh' ? '全面的合规状态和法规信息' : 'Comprehensive compliance status and regulatory information for medical device companies and products'}
            </p>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">{locale === 'zh' ? '法规状态' : 'Regulatory Status'}</h3>
              <p className="text-sm text-white/70">{locale === 'zh' ? '跟踪各市场合规情况' : 'Track compliance across markets'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Database className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">{locale === 'zh' ? '数据整合' : 'Data Integration'}</h3>
              <p className="text-sm text-white/70">{locale === 'zh' ? 'Medplum + MDLooker数据' : 'Medplum + MDLooker data'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">{locale === 'zh' ? '企业洞察' : 'Company Insights'}</h3>
              <p className="text-sm text-white/70">{locale === 'zh' ? '详细企业档案' : 'Detailed company profiles'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="font-semibold mb-1">{locale === 'zh' ? '合规提醒' : 'Compliance Alerts'}</h3>
              <p className="text-sm text-white/70">{locale === 'zh' ? '及时了解法规变化' : 'Stay informed on changes'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {locale === 'zh' ? '查找合规档案' : 'Find Compliance Profiles'}
            </h2>
            <p className="text-gray-600">
              {locale === 'zh' ? '搜索企业以查看其合规状态和法规信息' : 'Search for companies to view their compliance status and regulatory information'}
            </p>
          </div>
          
          <SearchBar 
            placeholder={locale === 'zh' ? '输入企业名称...' : 'Enter company name...'}
            initialQuery={searchQuery}
            className="max-w-2xl mx-auto"
          />
          
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">{locale === 'zh' ? '最近搜索' : 'Recent Searches'}</h3>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((company, index) => (
                  <Button 
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRecentSearch(company)}
                  >
                    {company}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Compliance Profile */}
      {selectedCompany && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#339999] mx-auto mb-4" />
              <p className="text-gray-600">{locale === 'zh' ? '正在加载合规档案...' : 'Loading compliance profile...'}</p>
            </div>
          ) : (
            <ComplianceProfile companyName={selectedCompany} />
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedCompany && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {locale === 'zh' ? '合规档案' : 'Compliance Profiles'}
          </h3>
          <p className="text-gray-500 mb-8">
            {locale === 'zh' ? '搜索企业以查看其合规状态和法规信息' : 'Search for a company to view its compliance status and regulatory information'}
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => handleSearch('Medtronic')}
              className="bg-[#339999] hover:bg-[#2a8080]"
            >
              {locale === 'zh' ? '搜索示例：Medtronic' : 'Search Example: Medtronic'}
            </Button>
            <Button 
              onClick={() => handleSearch('Johnson & Johnson')}
              variant="outline"
            >
              {locale === 'zh' ? '搜索示例：J&J' : 'Search Example: J&J'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
