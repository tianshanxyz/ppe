'use client';

import { useState, useEffect } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { Card, CardContent, CardHeader, Badge, Button, Skeleton } from '@/components/ui';
import { BookOpen, ExternalLink, Calendar, Globe, Clock, Eye, Bookmark, Filter } from 'lucide-react';
import { DataSourceBadge } from '@/components/medplum/DataSourceBadge';
import { searchMedplumRegulatoryAuthorizations, isMedplumEnabled } from '@/lib/medplum';

interface RegulationItem {
  id: string
  title: string
  title_zh?: string
  type: string
  jurisdiction?: string
  region?: string
  category?: string
  publish_date?: string
  publishDate?: string
  effective_date?: string
  effectiveDate?: string
  status?: string
  summary?: string
  description?: string
  pdf_url?: string
  pdfUrl?: string
  external_url?: string
  externalUrl?: string
  views?: number
  bookmarks?: number
  data_source?: string
  [key: string]: string | number | null | undefined
}

export function RegulationsLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [regulations, setRegulations] = useState<RegulationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    region: '',
    category: '',
    status: ''
  });

  useEffect(() => {
    fetchRegulations();
  }, [searchQuery, filters]);

  const fetchRegulations = async () => {
    setLoading(true);
    try {
      let regulationData: RegulationItem[] = [];

      // 从本地 API 获取数据
      const localResponse = await fetch(`/api/regulations/search?q=${encodeURIComponent(searchQuery)}`);
      if (localResponse.ok) {
        const localData = await localResponse.json();
        regulationData = localData.data || [];
      }

      // 从 Medplum 获取数据
      if (isMedplumEnabled()) {
        try {
          const medplumRegulations = await searchMedplumRegulatoryAuthorizations({
            query: searchQuery,
            limit: 10
          });

          const medplumData = medplumRegulations.map(reg => ({
            id: `medplum-${reg.id}`,
            title: reg.name || reg.id,
            type: 'Regulatory Authorization',
            jurisdiction: reg.region?.[0]?.coding?.[0]?.display || 'Global',
            status: reg.status?.coding?.[0]?.display || 'Active',
            publish_date: reg.dateIssued,
            effective_date: reg.validityPeriod?.start,
            summary: reg.description,
            external_url: reg.identifier?.[0]?.system,
            data_source: 'medplum'
          }));

          regulationData = [...regulationData, ...medplumData];
        } catch (error) {
          console.error('Medplum regulations error:', error);
        }
      }

      // 应用筛选
      const filteredRegulations = regulationData.filter(reg => {
        if (filters.region && reg.jurisdiction !== filters.region) return false;
        if (filters.category && reg.category !== filters.category) return false;
        if (filters.status && reg.status !== filters.status) return false;
        return true;
      });

      setRegulations(filteredRegulations);
    } catch (error) {
      console.error('Fetch regulations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Search Regulations</h3>
          <SearchBar 
            placeholder="Search regulations by title, keyword, or jurisdiction..."
            initialQuery={searchQuery}
          />
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
            <select 
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Regions</option>
              <option value="US">United States</option>
              <option value="EU">European Union</option>
              <option value="China">China</option>
              <option value="Global">Global</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              <option value="Medical Device">Medical Device</option>
              <option value="Pharmaceutical">Pharmaceutical</option>
              <option value="Biological">Biological</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Draft">Draft</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {regulations.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700">No regulations found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {regulations.map((regulation) => (
            <Card key={regulation.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {regulation.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                      {regulation.jurisdiction && (
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {regulation.jurisdiction}
                        </span>
                      )}
                      {regulation.publish_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(regulation.publish_date).toLocaleDateString()}
                        </span>
                      )}
                      {regulation.status && (
                        <Badge variant={regulation.status === 'Active' ? 'success' : 'warning'}>
                          {regulation.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {regulation.data_source && (
                    <DataSourceBadge source={regulation.data_source as any} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {regulation.summary && (
                  <p className="text-gray-600 mb-4">
                    {regulation.summary.length > 200 
                      ? `${regulation.summary.substring(0, 200)}...` 
                      : regulation.summary
                    }
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {regulation.views && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {regulation.views} views
                      </span>
                    )}
                    {regulation.bookmarks && (
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-4 h-4" />
                        {regulation.bookmarks} saved
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {regulation.external_url && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(regulation.external_url, '_blank', 'noopener noreferrer')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Source
                      </Button>
                    )}
                    <Button size="sm" className="bg-[#339999] hover:bg-[#2a8080]">
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
